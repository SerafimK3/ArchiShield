// useAudit Hook - Manages audit execution and state
import { useState, useCallback } from 'react';
import { HydraulicAudit, WindLoadAudit, ThermalAudit, SeismicAudit } from '../services/audits';

export function useAudit() {
    const [results, setResults] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState({ phase: '', percent: 0 });

    const runAudit = useCallback(async (building, { waterData = null, sectorData = [] } = {}) => {
        setIsLoading(true);
        setResults(null);

        try {
            // Phase 1: Hydraulic
            setProgress({ phase: 'Checking Flood Risk...', percent: 20 });
            await delay(300);
            const hydraulic = HydraulicAudit.execute(building, {}, waterData);

            // Phase 2: Wind
            setProgress({ phase: 'Analyzing Wind Shielding...', percent: 40 });
            await delay(300);
            const wind = WindLoadAudit.execute(building, {}, sectorData);

            // Phase 3: Thermal
            setProgress({ phase: 'Evaluating Heat Island...', percent: 60 });
            await delay(300);
            const thermal = ThermalAudit.execute(building, {}, sectorData);

            // Phase 4: Seismic
            setProgress({ phase: 'Computing Seismic Resilience...', percent: 80 });
            await delay(300);
            const seismic = SeismicAudit.execute(building, {});

            // Compile results
            setProgress({ phase: 'Generating Report...', percent: 95 });
            await delay(200);

            const auditResults = { hydraulic, wind, thermal, seismic };
            
            // Calculate global score
            const scores = [hydraulic.score, wind.score, thermal.score, seismic.score];
            const globalScore = scores.reduce((a, b) => a + b, 0) / scores.length;
            
            // Determine overall status
            const allPassed = Object.values(auditResults).every(r => r.passed);
            const anyFailed = Object.values(auditResults).some(r => !r.passed);

            const result = {
                success: true,
                building,
                auditResults,
                globalScore,
                status: allPassed ? 'APPROVED' : anyFailed ? 'REQUIRES ACTION' : 'REVIEW',
                timestamp: new Date().toISOString()
            };

            setProgress({ phase: 'Complete!', percent: 100 });
            await delay(300);
            setResults(result);
            setIsLoading(false);
            return result;

        } catch (error) {
            setIsLoading(false);
            setResults({ success: false, error: error.message });
            return { success: false, error: error.message };
        }
    }, []);

    const clearResults = useCallback(() => {
        setResults(null);
        setProgress({ phase: '', percent: 0 });
    }, []);

    return { results, isLoading, progress, runAudit, clearResults };
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export default useAudit;
