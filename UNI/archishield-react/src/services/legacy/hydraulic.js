// Hydraulic Audit Service
import { SpatialUtils } from '../spatial';

export const HydraulicAudit = {
    name: 'Hydraulic Integrity Audit',
    code: 'HIA-2036',
    id: 'hydraulic',

    execute(building, config, waterData = null) {
        const reasoning = [];
        reasoning.push("═══ HYDRAULIC INTEGRITY AUDIT (HIA-2036) ═══");

        let distanceToRiver = 1500;

        if (waterData && SpatialUtils) {
            const point = { lat: building.latitude, lng: building.longitude };
            distanceToRiver = SpatialUtils.getMinDistanceToLines(point, waterData);
            reasoning.push(`Real Data: Distance to Danube: ${distanceToRiver.toFixed(0)}m`);
        } else {
            reasoning.push("⚠️ Real water data unavailable. Using safe default.");
        }

        let status = 'PASSED';
        let score = 100;
        let riskLevel = 'LOW';
        const requirements = [];

        if (distanceToRiver < 200) {
            status = 'FAILED';
            score = 0;
            riskLevel = 'HIGH';
            requirements.push("Foundation Elevation: +2.5m above Design BFE");
            requirements.push("Waterproof Basement Construction");
            reasoning.push("❌ CRITICAL: Building within HQ100 Flood Zone.");
        } else if (distanceToRiver < 500) {
            score = 50;
            riskLevel = 'MEDIUM';
            requirements.push("Flood Proofing: Waterproof Basement Recommended");
            reasoning.push("⚠ WARNING: Near flood zone.");
        } else {
            reasoning.push("✓ PASS: Safe distance from water.");
        }

        return {
            status, score, passed: status === 'PASSED',
            requirements, reasoning: reasoning.join('\n'),
            data: { distanceToRiver, riskLevel, zone: distanceToRiver < 300 ? 'HQ100' : 'Safe' }
        };
    }
};

export default HydraulicAudit;
