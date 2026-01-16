/**
 * useSpotAudit Hook - Vienna Spot-Audit Brain
 * 
 * Manages the execution and state of Vienna regulatory audits
 */
import { useState, useCallback } from 'react';
import { ZoningAudit, HeritageAudit, SubsurfaceAudit, Climate2036Audit, SeismicAudit, WindLoadAudit } from '../services/audits';
import SpatialUtils from '../services/spatial';
import buildingsData from '../data/vienna_buildings.json';

const AUDIT_PHASES = [
    { id: 'zoning', name: 'Zoning', icon: '🏛️' },
    { id: 'heritage', name: 'Heritage', icon: '🏛️' },
    { id: 'subsurface', name: 'Subsurface', icon: '🚇' },
    { id: 'climate', name: 'Climate 2036', icon: '🌡️' },
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

export function useSpotAudit() {
    const [results, setResults] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [currentPhase, setCurrentPhase] = useState(null);
    const [phaseIndex, setPhaseIndex] = useState(-1);

    const runSpotAudit = useCallback(async (latitude, longitude, buildingParams = {}) => {
        setIsLoading(true);
        setResults(null);
        
        const district = detectDistrict(latitude, longitude);
        
        // Find existing building height if select a building explicitly
        const existingBuilding = buildingParams.id ? buildingsData.features.find(f => f.properties.id === buildingParams.id) : null;
        
        const building = {
            latitude,
            longitude,
            lat: latitude,
            lng: longitude,
            height: buildingParams.height || existingBuilding?.properties?.height || 20,
            floors: buildingParams.floors || existingBuilding?.properties?.levels || 5,
            footprint: buildingParams.footprint || 200,
            roofArea: buildingParams.roofArea || 200,
            surfaceSeal: buildingParams.surfaceSeal || 70,
            basementDepth: buildingParams.basementDepth || 5,
            groundElevation: buildingParams.groundElevation || 0,
            hasGreenRoof: buildingParams.hasGreenRoof || false,
            hasSolarPanels: buildingParams.hasSolarPanels || false,
            ...buildingParams
        };
        
        const neighborhood = SpatialUtils.getNeighborhoodStats(
            { lat: latitude, lng: longitude },
            buildingsData.features,
            150
        );
        
        const context = { district, neighborhood };
        const auditResults = {};
        let allConstraints = [];
        let allMandates = [];
        let totalScore = 0;
        let passedCount = 0;

        try {
            // Phase 1: Zoning
            setPhaseIndex(0);
            setCurrentPhase(AUDIT_PHASES[0]);
            await delay(400);
            auditResults.zoning = ZoningAudit.execute(building, context);
            allConstraints = [...allConstraints, ...auditResults.zoning.constraints];
            totalScore += auditResults.zoning.score;
            if (auditResults.zoning.passed) passedCount++;

            // Phase 2: Heritage
            setPhaseIndex(1);
            setCurrentPhase(AUDIT_PHASES[1]);
            await delay(400);
            auditResults.heritage = HeritageAudit.execute(building, context);
            allConstraints = [...allConstraints, ...auditResults.heritage.constraints];
            totalScore += auditResults.heritage.score;
            if (auditResults.heritage.passed) passedCount++;

            // Phase 3: Subsurface
            setPhaseIndex(2);
            setCurrentPhase(AUDIT_PHASES[2]);
            await delay(400);
            auditResults.subsurface = SubsurfaceAudit.execute(building, context);
            allConstraints = [...allConstraints, ...auditResults.subsurface.constraints];
            totalScore += auditResults.subsurface.score;
            if (auditResults.subsurface.passed) passedCount++;

            // Phase 4: Climate 2036
            setPhaseIndex(3);
            setCurrentPhase(AUDIT_PHASES[3]);
            await delay(400);
            auditResults.climate = Climate2036Audit.execute(building, context);
            allConstraints = [...allConstraints, ...auditResults.climate.constraints];
            allMandates = [...allMandates, ...(auditResults.climate.mandates || [])];
            totalScore += auditResults.climate.score;
            if (auditResults.climate.passed) passedCount++;

            // Phase 5: Structural (Combined Seismic & Wind)
            setPhaseIndex(4);
            setCurrentPhase(AUDIT_PHASES[4]);
            await delay(500);
            
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

            const result = {
                success: true,
                district,
                building,
                audits: auditResults,
                feasibility,
                status,
                statusColor,
                keyRisk,
                constraints: allConstraints,
                mandates: allMandates,
                passedCount,
                totalAudits: 5,
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
    }, []);

    const clearResults = useCallback(() => {
        setResults(null);
        setPhaseIndex(-1);
        setCurrentPhase(null);
    }, []);

    return {
        results,
        isLoading,
        currentPhase,
        phaseIndex,
        phases: AUDIT_PHASES,
        runSpotAudit,
        clearResults
    };
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export default useSpotAudit;
