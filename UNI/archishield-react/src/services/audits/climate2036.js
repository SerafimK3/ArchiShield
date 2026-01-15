/**
 * Climate 2036 Audit - Future Climate Compliance
 * 
 * Evaluates building against Vienna's 2036 climate regulations:
 * - Urban Heat Island (UHI) intensity assessment
 * - Surface seal percentage check (>80% = REJECTED)
 * - HQ100 flood zone for District 2 (Donaukanal)
 * - Green roof/facade mandate calculation
 * - Solar installation requirements (2023 amendment)
 */

import { isPointInPolygon } from '../spatial';

// UHI intensity zones (simulated data based on urban density)
const UHI_ZONES = {
    extreme: { threshold: 4.5, areas: ['Ring', 'Stephansplatz'] },  // +4.5°C above rural
    high: { threshold: 3.0, areas: ['Neubau', 'Josefstadt'] },      // +3.0°C
    moderate: { threshold: 1.5, areas: ['Leopoldstadt outer'] },    // +1.5°C
    low: { threshold: 0.5 }                                          // <0.5°C
};

// HQ100 flood zone (100-year flood extent for Donaukanal)
const HQ100_ZONE = {
    name: 'Donaukanal HQ100',
    polygon: [
        [16.3750, 48.2100], [16.4000, 48.2100],
        [16.4000, 48.2250], [16.3750, 48.2250]
    ],
    minimumElevation: 2.5, // meters above ground required
    districts: [2]
};

// 2023 Building Code Amendment thresholds
const CLIMATE_CODE = {
    maxSurfaceSeal: 80,        // percent - above this = automatic rejection
    greenRoofThreshold: 500,   // sqm footprint requiring green roof
    solarThreshold: 250,       // sqm roof requiring solar installation
    facadeGreeningTrigger: 60, // percent seal triggers facade greening
    waterRetentionRate: 0.05   // m³ per sqm roof for retention
};

export const Climate2036Audit = {
    name: 'Climate 2036',
    icon: '🌡️',
    
    execute(building, context = {}) {
        const { 
            latitude, longitude, 
            footprint = 200,      // sqm
            roofArea = 200,       // sqm
            surfaceSeal = 70,     // percent of lot sealed
            hasGreenRoof = false,
            hasSolarPanels = false,
            groundElevation = 0
        } = building;
        
        const district = context.district || detectDistrict(latitude, longitude);
        
        const results = {
            passed: true,
            score: 100,
            uhiIntensity: null,
            floodZone: false,
            mandates: [],
            constraints: [],
            recommendations: []
        };
        
        // 1. Surface Seal Check (automatic rejection >80%)
        if (surfaceSeal > CLIMATE_CODE.maxSurfaceSeal) {
            results.passed = false;
            results.score -= 50;
            results.constraints.push({
                type: 'SURFACE_SEAL_EXCEEDED',
                severity: 'blocking',
                message: `Surface seal ${surfaceSeal}% exceeds 80% limit - AUTOMATIC REJECTION`,
                actual: surfaceSeal,
                limit: CLIMATE_CODE.maxSurfaceSeal,
                remedy: 'Reduce sealed surface or apply for variance with extensive greening'
            });
        } else if (surfaceSeal > 70) {
            results.score -= 15;
            results.constraints.push({
                type: 'HIGH_SEAL',
                severity: 'warning',
                message: `Surface seal ${surfaceSeal}% requires enhanced greening measures`,
                actual: surfaceSeal
            });
        }
        
        // 2. UHI Intensity Assessment
        const uhiLevel = calculateUHIIntensity(latitude, longitude);
        results.uhiIntensity = uhiLevel;
        
        if (uhiLevel.category === 'extreme' || uhiLevel.category === 'high') {
            results.constraints.push({
                type: 'UHI_HOTSPOT',
                severity: 'important',
                message: `Located in ${uhiLevel.category} UHI zone (+${uhiLevel.intensity}°C)`,
                requirements: ['Façade greening mandatory', 'Cool roof materials required']
            });
            results.mandates.push({
                type: 'FACADE_GREENING',
                description: 'Façade greening required',
                reason: 'UHI intensity mitigation'
            });
            results.score -= 10;
        }
        
        // 3. HQ100 Flood Zone Check (District 2)
        if (district === 2 && isPointInPolygon([longitude, latitude], HQ100_ZONE.polygon)) {
            results.floodZone = true;
            results.constraints.push({
                type: 'HQ100_FLOOD_ZONE',
                severity: 'critical',
                message: 'Located in HQ100 flood zone - elevated ground floor required',
                minimumElevation: HQ100_ZONE.minimumElevation
            });
            
            if (groundElevation < HQ100_ZONE.minimumElevation) {
                results.score -= 25;
                results.mandates.push({
                    type: 'FLOOD_ELEVATION',
                    description: `Ground floor must be ${HQ100_ZONE.minimumElevation}m above grade`,
                    current: groundElevation,
                    required: HQ100_ZONE.minimumElevation
                });
            }
        }
        
        // 4. Green Roof Mandate
        if (footprint >= CLIMATE_CODE.greenRoofThreshold && !hasGreenRoof) {
            results.mandates.push({
                type: 'GREEN_ROOF',
                description: `Green roof required (${Math.round(roofArea * 0.7)}sqm minimum)`,
                reason: `Footprint ${footprint}sqm exceeds ${CLIMATE_CODE.greenRoofThreshold}sqm threshold`
            });
            results.score -= 10;
        }
        
        // 5. Solar Installation Mandate
        if (roofArea >= CLIMATE_CODE.solarThreshold && !hasSolarPanels) {
            const solarArea = Math.round(roofArea * 0.2);
            results.mandates.push({
                type: 'SOLAR_INSTALLATION',
                description: `Solar panels required (${solarArea}sqm / 20% of roof)`,
                reason: '2023 Vienna Building Code Amendment §7.3'
            });
            results.score -= 5;
        }
        
        // 6. Water Retention Calculation
        const retentionVolume = Math.round(roofArea * CLIMATE_CODE.waterRetentionRate * 10) / 10;
        results.mandates.push({
            type: 'WATER_RETENTION',
            description: `Rainwater retention system: ${retentionVolume}m³ capacity`,
            reason: 'Stormwater management requirement'
        });
        
        // Generate recommendations
        if (surfaceSeal > 60) {
            results.recommendations.push('Consider permeable paving for walkways');
        }
        if (results.uhiIntensity?.category === 'extreme') {
            results.recommendations.push('Use high-albedo roofing materials (SRI > 78)');
        }
        if (results.floodZone) {
            results.recommendations.push('Install backflow prevention on all drainage');
        }
        
        results.score = Math.max(0, results.score);
        return results;
    }
};

function calculateUHIIntensity(lat, lng) {
    // Simplified UHI model based on distance from city center
    const centerLat = 48.2082;
    const centerLng = 16.3738;
    const distFromCenter = Math.sqrt(
        Math.pow(lat - centerLat, 2) + Math.pow(lng - centerLng, 2)
    ) * 111; // Convert to km
    
    if (distFromCenter < 1) {
        return { category: 'extreme', intensity: 4.5 };
    } else if (distFromCenter < 2) {
        return { category: 'high', intensity: 3.0 };
    } else if (distFromCenter < 4) {
        return { category: 'moderate', intensity: 1.5 };
    }
    return { category: 'low', intensity: 0.5 };
}

function detectDistrict(lat, lng) {
    if (lat >= 48.200 && lat <= 48.220 && lng >= 16.355 && lng <= 16.385) return 1;
    if (lat >= 48.205 && lat <= 48.235 && lng >= 16.385 && lng <= 16.420) return 2;
    if (lat >= 48.195 && lat <= 48.215 && lng >= 16.335 && lng <= 16.360) return 7;
    return null;
}

export default Climate2036Audit;
