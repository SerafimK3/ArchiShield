/**
 * Remediation Service - AI-Powered Building Fix Suggestions
 * 
 * Provides both rule-based and AI-generated remediation strategies
 * for buildings that fail regulatory audits.
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent';

/**
 * Rule-based remediation strategies for common violations
 */
const REMEDIATION_RULES = {
    HEIGHT_VIOLATION: {
        priority: 1,
        getRemediation: (constraint, building) => ({
            type: 'HEIGHT_REDUCTION',
            title: 'Reduce Building Height',
            description: `Lower the building height from ${building.height}m to ${constraint.limit}m to comply with ${constraint.contextualLimit ? 'Urban Fabric' : 'Bauklasse'} limits.`,
            action: { height: constraint.contextualLimit || constraint.limit },
            impact: 'Resolves zoning violation',
            icon: '📏'
        })
    },
    HEIGHT_VARIANCE_OPPORTUNITY: {
        priority: 2,
        getRemediation: (constraint, _) => ({
            type: 'VARIANCE_APPLICATION',
            title: 'Apply for Zoning Variance',
            description: `Your building fits the neighborhood context (${constraint.contextualLimit}m). Apply for a variance with MA 37.`,
            action: null, // No automatic fix, needs manual application
            impact: 'High approval probability due to context alignment',
            icon: '📋'
        })
    },
    SEISMIC_RISK: {
        priority: 1,
        getRemediation: (constraint, _) => ({
            type: 'MATERIAL_CHANGE',
            title: 'Switch to CLT Construction',
            description: 'Cross-Laminated Timber reduces seismic stress due to lower mass and higher flexibility.',
            action: { material: 'TIMBER' },
            impact: '+15% Seismic score, carbon storage bonus',
            icon: '🪵'
        })
    },
    WIND_LOAD_WARNING: {
        priority: 2,
        getRemediation: (constraint, _) => ({
            type: 'FOOTPRINT_REDUCTION',
            title: 'Reduce Upper Floor Footprint',
            description: 'Step back the top 2-3 floors by 2m to reduce wind surface area.',
            action: { setback: 2 },
            impact: 'Reduces wind pressure coefficient',
            icon: '💨'
        })
    },
    SURFACE_SEAL_EXCEEDED: {
        priority: 1,
        getRemediation: (constraint, _) => ({
            type: 'PERMEABLE_SURFACES',
            title: 'Add Permeable Paving',
            description: `Reduce sealed surface from ${constraint.actual}% to below 80% using permeable materials.`,
            action: { surfaceSeal: 78 },
            impact: 'Unblocks Climate compliance',
            icon: '🌿'
        })
    },
    GREEN_ROOF: {
        priority: 3,
        getRemediation: (constraint, _) => ({
            type: 'ADD_GREEN_ROOF',
            title: 'Install Green Roof System',
            description: 'Extensive green roof installation meeting Vienna minimum requirements.',
            action: { hasGreenRoof: true },
            impact: 'Satisfies Climate mandate',
            icon: '🌱'
        })
    },
    SOLAR_INSTALLATION: {
        priority: 3,
        getRemediation: (constraint, _) => ({
            type: 'ADD_SOLAR',
            title: 'Install Solar Panels',
            description: 'PV installation covering 20% of roof area per 2023 Building Code.',
            action: { hasSolarPanels: true },
            impact: 'Satisfies solar mandate',
            icon: '☀️'
        })
    }
};

/**
 * Generate rule-based remediations from audit constraints
 */
export function generateRuleBasedRemediations(constraints, building) {
    const remediations = [];
    
    for (const constraint of constraints) {
        const rule = REMEDIATION_RULES[constraint.type];
        if (rule) {
            remediations.push({
                ...rule.getRemediation(constraint, building),
                constraintType: constraint.type,
                severity: constraint.severity,
                priority: rule.priority
            });
        }
    }
    
    // Sort by priority (1 = most important)
    return remediations.sort((a, b) => a.priority - b.priority);
}

/**
 * Generate AI-powered remediation suggestions for complex cases
 */
export async function generateAIRemediation(auditResults) {
    if (!GEMINI_API_KEY) {
        console.warn('Gemini API key not available for AI remediation');
        return null;
    }
    
    const { building, constraints, audits, feasibility } = auditResults;
    
    // Build the prompt with all violation details
    const violationSummary = constraints
        .filter(c => c.severity === 'critical' || c.severity === 'blocking')
        .map(c => `- ${c.type}: ${c.message}`)
        .join('\n');
    
    const prompt = `You are a Vienna building regulation expert. A proposed building has failed compliance checks.

Building Details:
- Height: ${building.height}m
- Material: ${building.material || 'CONCRETE'}
- Floors: ${building.floors}
- Location: District ${auditResults.district || 'Unknown'}
- Current Feasibility: ${feasibility}%

Violations:
${violationSummary}

Audit Scores:
- Zoning: ${audits?.zoning?.score || 'N/A'}%
- Seismic: ${audits?.seismic?.score || 'N/A'}%
- Climate: ${audits?.climate?.score || 'N/A'}%

Provide exactly 3 specific architectural remediation steps to improve compliance. For each step, provide:
1. A clear action title
2. A technical description
3. The expected improvement

Format as JSON array:
[
  {"title": "...", "description": "...", "impact": "..."},
  {"title": "...", "description": "...", "impact": "..."},
  {"title": "...", "description": "...", "impact": "..."}
]`;

    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { 
                    temperature: 0.4, 
                    maxOutputTokens: 512 
                }
            })
        });
        
        if (!response.ok) {
            throw new Error('Gemini API request failed');
        }
        
        const data = await response.json();
        const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!aiText) {
            return null;
        }
        
        // Parse the JSON from AI response
        const jsonMatch = aiText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            const suggestions = JSON.parse(jsonMatch[0]);
            return suggestions.map((s, idx) => ({
                ...s,
                type: 'AI_SUGGESTION',
                icon: '🤖',
                priority: idx + 1,
                source: 'gemini'
            }));
        }
        
        return null;
    } catch (error) {
        console.error('AI Remediation failed:', error);
        return null;
    }
}

/**
 * Get combined remediation suggestions (rule-based + AI)
 */
export async function getRemediationSuggestions(auditResults) {
    const { constraints, building } = auditResults;
    
    // Get rule-based remediations first (instant)
    const ruleBasedRemediations = generateRuleBasedRemediations(constraints, building);
    
    // Get AI remediations (async)
    const aiRemediations = await generateAIRemediation(auditResults);
    
    return {
        ruleBased: ruleBasedRemediations,
        aiSuggestions: aiRemediations || [],
        combined: [
            ...ruleBasedRemediations.slice(0, 3),
            ...(aiRemediations || []).slice(0, 2)
        ]
    };
}

