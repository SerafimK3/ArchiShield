/**
 * ArchiShield Alpha V2 - Vienna Environmental & Regulatory Constants
 * =======================================================================
 * Parametric Resilience & Zoning Engine
 * Data Ingestion Protocol: Environmental + Regulatory + Physical Layers
 */

const APP_CONSTANTS = {
    // ═══════════════════════════════════════════════════════════════════════
    // GEOGRAPHIC LOCATION
    // ═══════════════════════════════════════════════════════════════════════
    location: {
        name: "Vienna, Austria",
        latitude: 48.2082,
        longitude: 16.3738,
        elevation: 171,           // meters above sea level (city center)
        timezone: "Europe/Vienna",
        climateZone: "Cfb"        // Köppen: Oceanic/Humid continental
    },

    // ═══════════════════════════════════════════════════════════════════════
    // ENVIRONMENTAL LAYER (50-Year Predictive Data)
    // Vienna-specific climate and hazard projections
    // ═══════════════════════════════════════════════════════════════════════
    environmentalData: {
        // Flood Hazard Data (Danube River system)
        baseFloodElevation: 3.5,          // meters above local grade (BFE)
        designBFE: 4.8,                   // BFE + 1.3m safety margin
        freeboard: 0.45,                  // Austrian standard (higher than US)
        minimumPlinthHeight: 5.25,        // designBFE + freeboard
        floodZone: "HQ100",               // Austrian 100-year flood designation
        floodReturnPeriod: 100,           // years
        floodVelocity: 3.2,               // m/s Danube flood velocity
        
        // Wind Hazard Data (Alpine influence)
        peakWindSpeedMph: 95,             // mph (design wind speed - Vienna is calmer)
        peakWindSpeedMs: 42.5,            // m/s equivalent
        windExposureCategory: "B",        // Urban terrain
        windReturnPeriod: 50,             // years
        
        // Thermal Hazard Data (Urban Heat Island effect)
        heatwavePeakTemp: 42,             // °C external (2019 record was 38°C)
        heatwaveDuration: 96,             // hours (4 days)
        targetInternalTemp: 24,           // °C for comfort (Austrian standard)
        maxHVACLoadIncrease: 0.20,        // 20% limit (EU energy efficiency)
        solarRadiationPeak: 950,          // W/m² (lower than Sofia due to latitude)
        
        // Seismic Data (Lower risk than Sofia - Zone 3)
        seismicMagnitude: 5.0,            // Design earthquake (Vienna Basin)
        peakGroundAcceleration: 0.10,     // g (much lower risk)
        seismicReturnPeriod: 475,         // years
        
        // Grid Reliability (Austrian grid very stable)
        gridFailureProbability: 0.10,     // 10% during crisis (excellent infrastructure)
        maxOutageDuration: 48             // hours (2 days max - EU grid standards)
    },

    // ═══════════════════════════════════════════════════════════════════════
    // REGULATORY LAYER (Vienna Building Code - Wiener Bauordnung)
    // ═══════════════════════════════════════════════════════════════════════
    zoningCode: {
        // Floor Area Ratio (Geschossflächenzahl)
        maxFAR: 2.5,                      // Lower than Sofia - historic preservation
        
        // Setback Rules (Abstandsflächen)
        setbackFormula: 0.4,              // Distance = 0.4 × Building Height
        minSetbackMeters: 4.0,            // Absolute minimum (meters)
        rearSetbackFormula: 0.3,          // Rear = 0.3 × Height
        minRearSetback: 6.0,
        
        // Height Limits (UNESCO World Heritage buffer)
        maxBuildingHeight: 43,            // meters (Vienna height limit)
        heightBonusForGreen: 1.05,        // 5% bonus for Klimaaktiv buildings
        
        // Parking Requirements
        minParkingRatio: 1.0,             // spaces per 100m² GFA (lower - transit city)
        minBicycleParking: 1.5,           // spaces per 100m² (higher - cycling culture)
        
        // Lot Coverage (Bebauungsdichte)
        maxLotCoverage: 0.50,             // 50% maximum
        minGreenSpace: 0.20,              // 20% minimum (EU biodiversity directive)
        
        // Use Classifications
        allowedUses: ["Wohnen", "Gewerbe", "Mischnutzung", "Gemeinbedarf"],
        
        // Social Housing Adjacency Rules (Gemeindebauten)
        redZoneBuffer: 75,                // meters minimum
        redZoneShadeLimit: 0.15           // 15% of daylight hours max (stricter)
    },

    // ═══════════════════════════════════════════════════════════════════════
    // WIND LOAD CONSTANTS (Eurocode EN 1991-1-4)
    // ═══════════════════════════════════════════════════════════════════════
    windLoadConstants: {
        // Pressure formula: qp = 0.5 × ρ × v²(z) × ce(z)
        pressureCoeffImperial: 0.00256,   // For V in mph, P in psf
        pressureCoeffSI: 0.613,           // For V in m/s, P in N/m²
        
        // Velocity Pressure Exposure Coefficients (Kz) - Eurocode terrain categories
        exposureCoefficients: {
            "0": { // Sea or coastal area
                0: 1.15, 15: 1.15, 20: 1.18, 25: 1.21, 30: 1.24,
                40: 1.28, 50: 1.32, 60: 1.35, 70: 1.38, 80: 1.40
            },
            "B": { // Urban/suburban (Vienna default)
                0: 0.70, 15: 0.70, 20: 0.78, 25: 0.84, 30: 0.89,
                40: 0.97, 50: 1.04, 60: 1.09, 70: 1.14, 80: 1.18,
                90: 1.21, 100: 1.24, 120: 1.29, 140: 1.33, 160: 1.36
            },
            "III": { // Suburban or industrial (Eurocode)
                0: 0.85, 15: 0.85, 20: 0.90, 25: 0.94, 30: 0.98,
                40: 1.04, 50: 1.09, 60: 1.13, 70: 1.17, 80: 1.21
            }
        },
        
        // Topographic Factor (Kzt) - Vienna is mostly flat
        topographicFactor: 1.0,
        
        // Wind Directionality Factor (Kd) - Eurocode
        directionalityFactor: 0.85,
        
        // Pressure Coefficients (Cp) - same as ASCE
        pressureCoefficients: {
            windward: 0.8,
            leeward: -0.5,
            sidewall: -0.7,
            roof_flat: -0.9,
            roof_windward: -0.7,
            roof_leeward: -0.5
        },
        
        // Importance Factors (Eurocode consequence classes)
        importanceFactors: {
            CC1: 0.9,   // Low consequence
            CC2: 1.0,   // Medium consequence (standard)
            CC3: 1.1    // High consequence
        },
        
        // Gust Effect Factor
        gustFactor: 0.85,
        
        // Structural Limits
        maxAspectRatio: 5.0,              // H/B for wind stability (stricter)
        maxDriftRatio: 1/500,             // H/500 allowable drift (Eurocode)
        minNaturalFrequency: 0.1          // Hz minimum
    },

    // ═══════════════════════════════════════════════════════════════════════
    // THERMAL ENVELOPE CONSTANTS (Austrian OIB / EU EPBD)
    // ═══════════════════════════════════════════════════════════════════════
    thermalEnvelopeConstants: {
        // Maximum WWR by orientation for passive house standard
        maxWWRByOrientation: {
            north: 0.40,      // 40% - Reduced heat loss focus
            northeast: 0.30,
            east: 0.30,       // 30% - Morning sun acceptable
            southeast: 0.35,
            south: 0.50,      // 50% - Solar gain beneficial in Vienna
            southwest: 0.25,
            west: 0.25,       // 25% - Afternoon heat control
            northwest: 0.30
        },
        
        // Minimum insulation R-values (m²·K/W) - Nearly Zero Energy Building
        minRValueWall: 6.5,               // Higher than Sofia - colder winters
        minRValueRoof: 8.0,
        minRValueFloor: 4.5,
        
        // Window performance requirements (Passivhaus-adjacent)
        maxWindowUValue: 0.8,             // W/m²·K (triple glazing required)
        maxSHGC: 0.35,                    // Higher allowed - solar gain useful
        
        // Thermal mass requirements
        minThermalMass: 900,              // J/kg·K
        
        // Ventilation requirements (mechanical ventilation)
        minACH: 0.4,                      // Air changes per hour
        maxACH: 5.0
    },

    // ═══════════════════════════════════════════════════════════════════════
    // ETHICS LAYER (Krems Protocol V2 - Austrian Social Housing Context)
    // ═══════════════════════════════════════════════════════════════════════
    ethicsConstants: {
        daylightHours: 9,                 // Average daylight hours (Vienna latitude)
        maxShadeImpact: 0.15,             // 15% of daylight hours (stricter)
        redZones: [
            // Vienna Gemeindebauten (social housing complexes)
            { name: "Karl-Marx-Hof", lat: 48.2544, lon: 16.3719, population: 5000 },
            { name: "Reumannhof", lat: 48.1744, lon: 16.3619, population: 2500 },
            { name: "Sandleitenhof", lat: 48.2153, lon: 16.3053, population: 5300 },
            { name: "Rabenhof", lat: 48.2033, lon: 16.3947, population: 2800 }
        ],
        vulnerabilityMultiplier: 1.3,     // Social housing protection
        waterDisplacementLimit: 0.10      // 10% max (stricter - Danube flooding)
    },

    // ═══════════════════════════════════════════════════════════════════════
    // STRUCTURAL CONSTANTS
    // ═══════════════════════════════════════════════════════════════════════
    structuralConstants: {
        // Damping ratios
        dampingRatios: {
            steel: 0.02,
            concrete: 0.05,
            composite: 0.03,
            timber: 0.05,
            clt: 0.06                     // Cross-laminated timber (popular in Vienna)
        },
        
        // Vortex shedding - Strouhal number
        strouhalNumber: 0.2,
        
        // Safety factors (Eurocode partial factors)
        loadFactorDead: 1.35,             // γG
        loadFactorLive: 1.5,              // γQ
        loadFactorWind: 1.5,              // γQ for wind
        loadFactorSeismic: 1.0,
        
        // Material strengths (MPa) - Eurocode designations
        materials: {
            reinforced_concrete: {
                compressiveStrength: 35,  // C35/45
                tensileStrength: 3.2,
                elasticModulus: 34000,
                density: 2500
            },
            steel_frame: {
                yieldStrength: 355,       // S355
                tensileStrength: 510,
                elasticModulus: 210000,
                density: 7850
            },
            clt_timber: {
                compressiveStrength: 25,
                tensileStrength: 16,
                elasticModulus: 12000,
                density: 500
            }
        }
    },

    // ═══════════════════════════════════════════════════════════════════════
    // PERMIT STATUS DEFINITIONS
    // ═══════════════════════════════════════════════════════════════════════
    permitStatuses: {
        LEGAL_RESILIENT: {
            code: "LEGAL & RESILIENT",
            description: "All audits pass + zoning compliant",
            color: "#00ff88",
            canProceed: true
        },
        NON_COMPLIANT: {
            code: "NON-COMPLIANT",
            description: "Zoning or code violations (fixable)",
            color: "#ffaa00",
            canProceed: false
        },
        STRUCTURALLY_UNSAFE: {
            code: "STRUCTURALLY UNSAFE",
            description: "Critical structural failures",
            color: "#ff4466",
            canProceed: false
        }
    },

    // ═══════════════════════════════════════════════════════════════════════
    // REGULATORY AUTHORITY
    // ═══════════════════════════════════════════════════════════════════════
    regulatory: {
        authority: "Magistrat der Stadt Wien - Baupolizei (MA 37)",
        standardVersion: "ArchiShield-AT-V2.0",
        certificationBody: "Austrian Institute of Construction Engineering (OIB)",
        appealPeriod: 14,                 // days (Austrian admin law)
        validityPeriod: 3,                // years (building permits)
        lastUpdated: "2026-01-16"
    },

    // ═══════════════════════════════════════════════════════════════════════
    // PHYSICS CONSTANTS
    // ═══════════════════════════════════════════════════════════════════════
    physics: {
        gravity: 9.81,                    // m/s²
        airDensity: 1.225,                // kg/m³ at sea level
        waterDensity: 1000,               // kg/m³
        stefanBoltzmann: 5.67e-8,         // W/m²·K⁴
        airSpecificHeat: 1005,            // J/kg·K
        waterSpecificHeat: 4186           // J/kg·K
    }
};

// Export for use in other services
export { APP_CONSTANTS };
export default APP_CONSTANTS;

// Deep freeze all constants
function deepFreeze(obj) {
    Object.keys(obj).forEach(key => {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
            deepFreeze(obj[key]);
        }
    });
    return Object.freeze(obj);
}

deepFreeze(APP_CONSTANTS);
