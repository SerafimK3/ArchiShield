/**
 * useSpotAudit Hook - Vienna Spot-Audit Brain
 * 
 * Manages the execution and state of Vienna regulatory audits
 */
import { useState, useCallback, useRef } from 'react';
import { ZoningAudit, HeritageAudit, SubsurfaceAudit, ClimateAudit, SeismicAudit, WindLoadAudit } from '../services/audits';
import SpatialUtils from '../services/spatial';
import buildingsData from '../data/vienna_buildings.json';

const AUDIT_PHASES = [
    { id: 'zoning', name: 'Zoning', icon: '🏛️' },
    { id: 'heritage', name: 'Heritage', icon: '🏛️' },
    { id: 'subsurface', name: 'Subsurface', icon: '🚇' },
    { id: 'climate', name: 'Climate', icon: '🌡️' },
    { id: 'structural', name: 'Structural Safety', icon: '🏗️' }
];

function detectDistrict(lat, lng) {
    // District 1 - Innere Stadt
    if (lat >= 48.200 && lat <= 48.220 && lng >= 16.355 && lng <= 16.385) return 1;
    // District 2 - Leopoldstadt  
    if (lat >= 48.205 && lat <= 48.235 && lng >= 16.385 && lng <= 16.420) return 2;
    // District 7 - Neubau
    if (lat >= 48.195 && lat <= 48.215 && lng >= 16.335 && lng <= 16.360) return 7;
    return null;
}

/**
 * Core audit execution logic - separated for reuse
 * This runs all audits synchronously without delays
 */
function executeAllAudits(building, context) {
    const auditResults = {};
    let allConstraints = [];
    let allMandates = [];
    let totalScore = 0;
    let passedCount = 0;

    // Phase 1: Zoning
    auditResults.zoning = ZoningAudit.execute(building, context);
    allConstraints = [...allConstraints, ...auditResults.zoning.constraints];
    totalScore += auditResults.zoning.score;
    if (auditResults.zoning.passed) passedCount++;

    // Phase 2: Heritage
    auditResults.heritage = HeritageAudit.execute(building, context);
    allConstraints = [...allConstraints, ...auditResults.heritage.constraints];
    totalScore += auditResults.heritage.score;
    if (auditResults.heritage.passed) passedCount++;

    // Phase 3: Subsurface
    auditResults.subsurface = SubsurfaceAudit.execute(building, context);
    allConstraints = [...allConstraints, ...auditResults.subsurface.constraints];
    totalScore += auditResults.subsurface.score;
    if (auditResults.subsurface.passed) passedCount++;

    // Phase 4: Climate
    auditResults.climate = ClimateAudit.execute(building, context);
    allConstraints = [...allConstraints, ...auditResults.climate.constraints];
    allMandates = [...allMandates, ...(auditResults.climate.mandates || [])];
    totalScore += auditResults.climate.score;
    if (auditResults.climate.passed) passedCount++;

    // Phase 5: Structural (Combined Seismic & Wind)
    const seismicResult = SeismicAudit.execute(building);
    const windResult = WindLoadAudit.execute(building, buildingsData.features);
    
    auditResults.seismic = seismicResult;
    auditResults.wind = windResult;
    
    // Collect structural constraints
    if (!seismicResult.passed) {
        allConstraints.push({ id: 'seismic-fail', severity: 'critical', message: seismicResult.requirements[0] });
    }
    if (!windResult.passed) {
        allConstraints.push({ id: 'wind-fail', severity: 'critical', message: windResult.requirements[0] });
    }
    
    totalScore += (seismicResult.score + windResult.score) / 2;
    if (seismicResult.passed && windResult.passed) passedCount++;

    // Calculate overall feasibility (average of 5 phases)
    const feasibility = Math.round(totalScore / 5);
    const allPassed = passedCount === 5;
    const hasBlocking = allConstraints.some(c => c.severity === 'blocking');
    
    let status, statusColor;
    if (hasBlocking) {
        status = 'REJECTED';
        statusColor = 'danger';
    } else if (allPassed && feasibility >= 80) {
        status = 'HIGH - Ready for Submission';
        statusColor = 'success';
    } else if (feasibility >= 60) {
        status = 'MEDIUM - Proceed with Caution';
        statusColor = 'warning';
    } else {
        status = 'LOW - Significant Issues';
        statusColor = 'danger';
    }

    // Find key risk
    const criticalConstraints = allConstraints.filter(c => 
        c.severity === 'blocking' || c.severity === 'critical'
    );
    const keyRisk = criticalConstraints[0]?.message || 'No critical constraints';

    return {
        audits: auditResults,
        feasibility,
        status,
        statusColor,
        keyRisk,
        constraints: allConstraints,
        mandates: allMandates,
        passedCount,
        totalAudits: 5
    };
}

export function useSpotAudit() {
    const [results, setResults] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [currentPhase, setCurrentPhase] = useState(null);
    const [phaseIndex, setPhaseIndex] = useState(-1);
    
    // Configurable building parameters for live updates
    const [buildingConfig, setBuildingConfig] = useState({
        material: 'CONCRETE',  // 'CONCRETE' | 'TIMBER'
        height: 20,
        floors: 5,
        footprint: 200,
        rotation: 0  // 0-360 degrees
    });
    
    // Use ref to store last audit context for instant re-audits
    const lastAuditContext = useRef(null);

    // Full audit with loading animation (for initial location clicks)
    const runSpotAudit = useCallback(async (latitude, longitude, buildingParams = {}) => {
        setIsLoading(true);
        setResults(null);
        
        const district = detectDistrict(latitude, longitude);
        
        // Find existing building height if select a building explicitly
        const existingBuilding = buildingParams.id ? buildingsData.features.find(f => f.properties.id === buildingParams.id) : null;
        
        // Merge with current building config (for material, etc.)
        const mergedParams = {
            ...buildingConfig,
            ...buildingParams
        };
        
        const building = {
            latitude,
            longitude,
            lat: latitude,
            lng: longitude,
            height: mergedParams.height || existingBuilding?.properties?.height || 20,
            floors: mergedParams.floors || existingBuilding?.properties?.levels || 5,
            footprint: mergedParams.footprint || 200,
            roofArea: mergedParams.roofArea || 200,
            surfaceSeal: mergedParams.surfaceSeal || 70,
            basementDepth: mergedParams.basementDepth || 5,
            groundElevation: mergedParams.groundElevation || 0,
            hasGreenRoof: mergedParams.hasGreenRoof || false,
            hasSolarPanels: mergedParams.hasSolarPanels || false,
            material: mergedParams.material || 'CONCRETE',
            ...mergedParams
        };
        
        const neighborhood = SpatialUtils.getNeighborhoodStats(
            { lat: latitude, lng: longitude },
            buildingsData.features,
            150
        );
        
        const context = { district, neighborhood };
        
        // Store context for future instant re-audits
        lastAuditContext.current = { latitude, longitude, district, neighborhood, baseParams: mergedParams };

        try {
            // Animated phase progression
            for (let i = 0; i < AUDIT_PHASES.length; i++) {
                setPhaseIndex(i);
                setCurrentPhase(AUDIT_PHASES[i]);
                await delay(i === 4 ? 500 : 400); // Slightly longer for structural
            }

            // Execute all audits
            const auditData = executeAllAudits(building, context);

            const result = {
                success: true,
                district,
                building,
                ...auditData,
                timestamp: new Date().toISOString()
            };

            await delay(200);
            setResults(result);
            setIsLoading(false);
            setPhaseIndex(-1);
            setCurrentPhase(null);
            return result;

        } catch (error) {
            setIsLoading(false);
            setPhaseIndex(-1);
            setCurrentPhase(null);
            const errorResult = { 
                success: false, 
                error: error.message,
                district 
            };
            setResults(errorResult);
            return errorResult;
        }
    }, [buildingConfig]);
    
    // Silent re-audit (instant, no loading state) for parameter changes like material
    const silentReAudit = useCallback((newConfig) => {
        if (!lastAuditContext.current || !results) return;
        
        const { latitude, longitude, district, neighborhood, baseParams } = lastAuditContext.current;
        
        // Merge new config with base params
        const mergedParams = { ...baseParams, ...newConfig };
        
        const building = {
            latitude,
            longitude,
            lat: latitude,
            lng: longitude,
            height: mergedParams.height || 20,
            floors: mergedParams.floors || 5,
            footprint: mergedParams.footprint || 200,
            roofArea: mergedParams.roofArea || 200,
            surfaceSeal: mergedParams.surfaceSeal || 70,
            basementDepth: mergedParams.basementDepth || 5,
            groundElevation: mergedParams.groundElevation || 0,
            hasGreenRoof: mergedParams.hasGreenRoof || false,
            hasSolarPanels: mergedParams.hasSolarPanels || false,
            material: mergedParams.material || 'CONCRETE',
            ...mergedParams
        };
        
        const context = { district, neighborhood };
        
        // Execute audits instantly (no delays, no loading state)
        const auditData = executeAllAudits(building, context);
        
        // Update results in place
        setResults(prev => ({
            ...prev,
            building,
            ...auditData,
            timestamp: new Date().toISOString()
        }));
        
        // Update stored params for future re-audits
        lastAuditContext.current.baseParams = mergedParams;
        
    }, [results]);
    
    // Update building config with instant re-audit (smooth material switching)
    const updateBuildingConfig = useCallback((newConfig) => {
        const updatedConfig = { ...buildingConfig, ...newConfig };
        setBuildingConfig(updatedConfig);
        
        // Use silent re-audit for instant feedback
        if (lastAuditContext.current) {
            silentReAudit(updatedConfig);
        }
    }, [buildingConfig, silentReAudit]);
    
    // Convenience function to change just the material
    const setMaterial = useCallback((material) => {
        updateBuildingConfig({ material });
    }, [updateBuildingConfig]);

    const clearResults = useCallback(() => {
        setResults(null);
        setPhaseIndex(-1);
        setCurrentPhase(null);
        lastAuditContext.current = null;
    }, []);

    return {
        results,
        isLoading,
        currentPhase,
        phaseIndex,
        phases: AUDIT_PHASES,
        runSpotAudit,
        clearResults,
        // New exports for material control
        buildingConfig,
        setMaterial,
        updateBuildingConfig
    };
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export default useSpotAudit;
