/**
 * Zoning Audit - Vienna Bauklasse and Schutzzone Analysis
 * 
 * Evaluates building location against Vienna's zoning regulations:
 * - Bauklasse (Building Class I-VI) determines max height and density
 * - Schutzzone (Protection Zones) for historical areas
 * - Floor Area Ratio (FAR) limits
 * - Building setback requirements
 */

import { isPointInPolygon } from '../spatial';

// Vienna Bauklasse definitions (simplified)
const BAUKLASSE = {
    I: { class: 'I', maxHeight: 9, maxFloors: 2, far: 1.0, description: 'Low-rise residential' },
    II: { class: 'II', maxHeight: 12, maxFloors: 3, far: 1.3, description: 'Medium residential' },
    III: { class: 'III', maxHeight: 16, maxFloors: 4, far: 1.5, description: 'Urban residential' },
    IV: { class: 'IV', maxHeight: 21, maxFloors: 6, far: 2.0, description: 'Dense urban' },
    V: { class: 'V', maxHeight: 26, maxFloors: 7, far: 2.5, description: 'High-density urban' },
    VI: { class: 'VI', maxHeight: 35, maxFloors: 10, far: 3.0, description: 'City center high-rise' }
};

// Schutzzone areas (simplified polygons for Districts 1, 2, 7)
const SCHUTZZONEN = {
    district1_core: {
        name: 'Innere Stadt Core Protection',
        polygon: [
            [16.3550, 48.2050], [16.3850, 48.2050],
            [16.3850, 48.2150], [16.3550, 48.2150]
        ],
        restrictions: ['facade_preservation', 'height_limit', 'material_approval']
    },
    district7_spittelberg: {
        name: 'Spittelberg Historic Quarter',
        polygon: [
            [16.3480, 48.2020], [16.3580, 48.2020],
            [16.3580, 48.2080], [16.3480, 48.2080]
        ],
        restrictions: ['facade_preservation', 'roof_style']
    }
};

// District Bauklasse mapping (simplified)
const DISTRICT_ZONES = {
    1: { default: 'IV', special: ['UNESCO_BUFFER'] },
    2: { default: 'III', special: ['CANAL_ZONE'] },
    7: { default: 'IV', special: ['HISTORIC_QUARTER'] }
};

export const ZoningAudit = {
    name: 'Zoning',
    icon: '🏛️',
    
    execute(building, context = {}) {
        const { latitude, longitude, height, floors } = building;
        const district = context.district || detectDistrict(latitude, longitude);
        
        const results = {
            passed: true,
            score: 100,
            bauklasse: null,
            schutzzone: null,
            constraints: [],
            recommendations: []
        };
        
        // Determine Default Bauklasse (Regulatory)
        const districtInfo = DISTRICT_ZONES[district] || { default: 'III' };
        const regulatoryClass = districtInfo.default;
        const regulatorySpec = BAUKLASSE[regulatoryClass];
        results.bauklasse = { ...regulatorySpec };
        
        // Neighborhood Context Analysis
        const neighborhood = context.neighborhood || { avgHeight: 0, maxHeight: 0, count: 0 };
        results.neighborhood = neighborhood;

        // Determine Suggested Bauklasse (Contextual)
        // If neighborhood is significantly taller, suggest a higher class
        const suggestedClass = getSuggestedBauklasse(neighborhood.avgHeight || regulatorySpec.maxHeight);
        const suggestedSpec = BAUKLASSE[suggestedClass];
        results.suggestedBauklasse = suggestedSpec;
        
        // Calculate dynamic "Urban Fabric" limit
        // We take the max of the suggested zoning and a buffer of context
        const contextBaselines = [regulatorySpec.maxHeight, suggestedSpec.maxHeight];
        if (neighborhood.maxHeight > 0) {
            contextBaselines.push(neighborhood.maxHeight * 0.95);
        }
        results.contextualLimit = Math.round(Math.max(...contextBaselines));
        
        // Variance Potential Check
        results.canUpgradeBauklasse = suggestedSpec.maxHeight > regulatorySpec.maxHeight;

        // Check height compliance with "Urban Fabric" variance logic
        const isExceedingRegulatory = height > regulatorySpec.maxHeight;
        const isWithinContext = height <= results.contextualLimit;

        if (isExceedingRegulatory) {
            results.passed = false;
            
            if (isWithinContext) {
                // REDUCED PENALTY: Building fits the existing vertical neighbors
                results.score -= 15;
                results.constraints.push({
                    type: 'HEIGHT_VARIANCE_OPPORTUNITY',
                    severity: 'important',
                    message: `Building height (${height}m) exceeds District ${district} default (${regulatorySpec.maxHeight}m), but aligns with neighborhood fabric (${results.contextualLimit}m). High variance potential.`,
                    limit: regulatorySpec.maxHeight,
                    contextualLimit: results.contextualLimit,
                    actual: height,
                    suggestedBauklasse: suggestedClass
                });
            } else {
                // CRITICAL PENALTY: Exceeds both zoning and neighbors
                results.score -= 40;
                results.constraints.push({
                    type: 'HEIGHT_VIOLATION',
                    severity: 'critical',
                    message: `Height (${height}m) exceeds both regulatory Bauklasse ${regulatoryClass} (${regulatorySpec.maxHeight}m) and contextual scale (${results.contextualLimit}m).`,
                    limit: regulatorySpec.maxHeight,
                    contextualLimit: results.contextualLimit,
                    actual: height
                });
            }
        }
        
        // Check floor count
        if (floors > regulatorySpec.maxFloors) {
            results.score -= 20;
            results.constraints.push({
                type: 'FLOOR_WARNING',
                severity: 'warning',
                message: `${floors} floors exceeds typical for Bauklasse ${regulatoryClass} (${regulatorySpec.maxFloors} floors)`,
                limit: regulatorySpec.maxFloors,
                actual: floors
            });
        }
        
        // Check Schutzzone
        for (const [zoneId, zone] of Object.entries(SCHUTZZONEN)) {
            if (isPointInPolygon([longitude, latitude], zone.polygon)) {
                results.schutzzone = {
                    id: zoneId,
                    name: zone.name,
                    restrictions: zone.restrictions
                };
                results.constraints.push({
                    type: 'SCHUTZZONE',
                    severity: 'important',
                    message: `Located in ${zone.name} - special approvals required`,
                    restrictions: zone.restrictions
                });
                results.score -= 10;
                break;
            }
        }
        
        // Generate recommendations
        if (results.constraints.length === 0) {
            results.recommendations.push('Zoning clear - proceed to pre-submission meeting');
        } else {
            results.recommendations.push('Consult MA 21 for zoning variance application');
            if (results.schutzzone) {
                results.recommendations.push('Contact MA 19 for heritage assessment');
            }
        }
        
        results.score = Math.max(0, results.score);
        return results;
    }
};

function detectDistrict(lat, lng) {
    // Simplified district detection based on coordinates
    if (lat >= 48.200 && lat <= 48.220 && lng >= 16.355 && lng <= 16.385) return 1;
    if (lat >= 48.205 && lat <= 48.235 && lng >= 16.385 && lng <= 16.420) return 2;
    if (lat >= 48.195 && lat <= 48.215 && lng >= 16.335 && lng <= 16.360) return 7;
    return null;
}

function getSuggestedBauklasse(avgHeight) {
    if (avgHeight <= 9) return 'I';
    if (avgHeight <= 12) return 'II';
    if (avgHeight <= 16) return 'III';
    if (avgHeight <= 21) return 'IV';
    if (avgHeight <= 26) return 'V';
    return 'VI';
}

export default ZoningAudit;
