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
    I: { maxHeight: 9, maxFloors: 2, far: 1.0, description: 'Low-rise residential' },
    II: { maxHeight: 12, maxFloors: 3, far: 1.3, description: 'Medium residential' },
    III: { maxHeight: 16, maxFloors: 4, far: 1.5, description: 'Urban residential' },
    IV: { maxHeight: 21, maxFloors: 6, far: 2.0, description: 'Dense urban' },
    V: { maxHeight: 26, maxFloors: 7, far: 2.5, description: 'High-density urban' },
    VI: { maxHeight: 35, maxFloors: 10, far: 3.0, description: 'City center high-rise' }
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
        
        // Determine Bauklasse
        const districtInfo = DISTRICT_ZONES[district] || { default: 'III' };
        const bauklasse = districtInfo.default;
        const bauklasseSpec = BAUKLASSE[bauklasse];
        results.bauklasse = { class: bauklasse, ...bauklasseSpec };
        
        // Check height compliance
        if (height > bauklasseSpec.maxHeight) {
            results.passed = false;
            results.score -= 40;
            results.constraints.push({
                type: 'HEIGHT_VIOLATION',
                severity: 'critical',
                message: `Building height ${height}m exceeds Bauklasse ${bauklasse} limit of ${bauklasseSpec.maxHeight}m`,
                limit: bauklasseSpec.maxHeight,
                actual: height
            });
        }
        
        // Check floor count
        if (floors > bauklasseSpec.maxFloors) {
            results.score -= 20;
            results.constraints.push({
                type: 'FLOOR_WARNING',
                severity: 'warning',
                message: `${floors} floors may exceed typical for Bauklasse ${bauklasse} (${bauklasseSpec.maxFloors} typical)`,
                limit: bauklasseSpec.maxFloors,
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

export default ZoningAudit;
