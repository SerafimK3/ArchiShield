/**
 * Gemini AI Service for Vienna Spot-Audit
 * Handles natural language queries about Vienna building regulations
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent';
const PIPEDREAM_WEBHOOK_URL = import.meta.env.VITE_PIPEDREAM_WEBHOOK_URL;

/**
 * Log chat interaction to Pipedream -> Google Sheets
 */
async function logToPipedream(question, answer, context) {
    try {
        await fetch(PIPEDREAM_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                timestamp: new Date().toISOString(),
                question,
                answer,
                district: context?.district || null,
                lat: context?.lat || null,
                lng: context?.lng || null,
                feasibility: context?.feasibility || null
            })
        });
    } catch (error) {
        console.warn('Failed to log to Pipedream:', error);
    }
}

// System prompt with Vienna-specific context
const SYSTEM_PROMPT = `You are the Vienna Spot-Audit AI Assistant (Powered by Gemini 2.5 Flash), an expert on Vienna's building regulations and urban planning for 'Vienna 2036'. 

You help users understand:
1. **Zoning (Bauklassen)**: Vienna's building class system (I-VI) determining heights and densities.
2. **Heritage (Schutzzonen)**: UNESCO buffer zones, especially the 43m limit around Stephansdom.
3. **Subsurface**: U-Bahn proximity (U1, U2, U3, U4, U5 lines).
4. **Climate 2036 Mandates**: Green roofs, solar, and rainwater retention.

When audit context is provided:
- Analyze the 'feasibility' score.
- Review 'constraints' and 'mandates' found during the audit.
- Check 'building' parameters (height, material, footprint).
- Provide specific, technical advice on how to improve the design or where to relocate.

Do NOT use markdown formatting (like asterisks for bold or bullet points). 
Return plain text only without any asterisks.

LANGUAGE RULE:
If the user query is not in English, you must respond with: "I am currently working on a better version of my specialized knowledge base and for now I only support English queries. Please rephrase your question in English."
(Note: You may still accept German technical terms like 'Schutzzone' or 'Bauordnung' if the overall sentence structure is English).

Be concise, professional, and cite Vienna building codes (Bauordnung für Wien) when possible.`;

/**
 * Parse user query to extract location and building parameters
 */
function parseQueryIntent(query) {
    const lowerQuery = query.toLowerCase();
    
    // Try to extract coordinates
    const coordMatch = query.match(/(\d+\.?\d*)\s*[,°]\s*(\d+\.?\d*)/);
    
    // Try to extract district
    const districtMatch = lowerQuery.match(/district\s*(\d+)|bezirk\s*(\d+)|(\d+)\.\s*bezirk/);
    
    // Try to extract height
    const heightMatch = query.match(/(\d+)\s*(?:m|meter|metres)/i);
    
    // Landmark detection
    const landmarks = {
        'stephansplatz': { lat: 48.2082, lng: 16.3738, district: 1 },
        'stephansdom': { lat: 48.2082, lng: 16.3738, district: 1 },
        'prater': { lat: 48.2166, lng: 16.3977, district: 2 },
        'rathaus': { lat: 48.2108, lng: 16.3569, district: 1 },
        'museumsquartier': { lat: 48.2034, lng: 16.3587, district: 7 },
        'naschmarkt': { lat: 48.1986, lng: 16.3631, district: 6 },
        'hauptbahnhof': { lat: 48.1853, lng: 16.3762, district: 10 },
    };
    
    let location = null;
    for (const [name, coords] of Object.entries(landmarks)) {
        if (lowerQuery.includes(name)) {
            location = { ...coords, landmark: name };
            break;
        }
    }
    
    return {
        coordinates: coordMatch ? { lat: parseFloat(coordMatch[1]), lng: parseFloat(coordMatch[2]) } : null,
        district: districtMatch ? parseInt(districtMatch[1] || districtMatch[2] || districtMatch[3]) : null,
        height: heightMatch ? parseInt(heightMatch[1]) : null,
        location,
        rawQuery: query
    };
}

/**
 * Send query to Gemini API
 */
export async function queryGemini(userMessage, auditContext = null) {
    if (!GEMINI_API_KEY) {
        throw new Error('Gemini API key not configured');
    }
    
    // Build context-aware prompt
    let contextMessage = '';
    if (auditContext) {
        contextMessage = `\n\nCurrent audit context:
- Location: ${auditContext.lat?.toFixed(4)}°N, ${auditContext.lng?.toFixed(4)}°E
- District: ${auditContext.district || 'Unknown'}
- Feasibility: ${auditContext.feasibility}%
- Constraints: ${auditContext.constraints?.join(', ') || 'None identified'}
- Mandates: ${auditContext.mandates?.join(', ') || 'None'}`;
    }
    
    const intent = parseQueryIntent(userMessage);
    
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: `${SYSTEM_PROMPT}${contextMessage}\n\nUser query: ${userMessage}\n\nParsed intent: ${JSON.stringify(intent)}`
                }]
            }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 2048,
            }
        })
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to get AI response');
    }
    
    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!aiResponse) {
        throw new Error('No response from AI');
    }
    
    // Log to Pipedream (non-blocking)
    logToPipedream(userMessage, aiResponse, auditContext);
    
    return {
        response: aiResponse,
        intent,
        suggestedLocation: intent.location || intent.coordinates
    };
}

/**
 * Get a quick summary of audit results
 */
export async function summarizeAudit(auditResults) {
    if (!GEMINI_API_KEY) {
        return null;
    }
    
    const prompt = `Summarize this Vienna building audit in 2-3 sentences, focusing on the most important constraints and recommendations:

Feasibility: ${auditResults.feasibility}%
District: ${auditResults.district}
Constraints: ${auditResults.constraints?.map(c => c.description).join('; ')}
Mandates: ${auditResults.mandates?.map(m => m.requirement).join('; ')}
Risks: ${auditResults.risks?.map(r => r.description).join('; ')}`;

    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.5, maxOutputTokens: 256 }
            })
        });
        
        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
    } catch (error) {
        console.error('AI summary failed:', error);
        return null;
    }
}

export { parseQueryIntent };
