// Thermal Audit Service
import { SpatialUtils } from '../spatial';

export const ThermalAudit = {
    name: 'Thermal Comfort Audit',
    code: 'TCA-2036',
    id: 'thermal',

    execute(building, config, sectorData = []) {
        const reasoning = [];
        reasoning.push("═══ THERMAL COMFORT AUDIT (TCA-2036) ═══");

        let neighborCount = 0;
        const radius = 200;

        if (SpatialUtils && sectorData.length > 0) {
            for (const sector of sectorData) {
                if (sector.features) {
                    neighborCount += SpatialUtils.countFeaturesInRadius(
                        { lat: building.latitude, lng: building.longitude },
                        sector.features,
                        radius
                    );
                }
            }
            reasoning.push(`Real Data: ${neighborCount} buildings (density)`);
        } else {
            neighborCount = 10;
            reasoning.push("⚠️ No sector data. Using fallback.");
        }

        const material = (building.ground_floor_material || 'concrete').toLowerCase();
        let materialScore = 0;
        const heatMaterials = ['concrete', 'asphalt', 'glass', 'steel'];
        const coolMaterials = ['timber', 'green_facade', 'stone_clad', 'vegetation'];

        if (heatMaterials.includes(material)) {
            materialScore = -20;
            reasoning.push(`Material: ${material} (Heat Retaining, -20 pts)`);
        } else if (coolMaterials.includes(material)) {
            materialScore = +20;
            reasoning.push(`Material: ${material} (Heat Mitigating, +20 pts)`);
        }

        let status = 'PASSED';
        let score = 100;
        let uhiRisk = 'Low';
        const requirements = [];

        if (neighborCount > 30) {
            uhiRisk = 'High (Urban Canyon)';
            score = 70 + materialScore;
            if (materialScore < 0) {
                status = 'FAILED';
                requirements.push("Change Facade: Green Facade or High Albedo");
                reasoning.push("❌ FAIL: Dense UHI + heat-retaining material.");
            }
        } else if (neighborCount > 10) {
            uhiRisk = 'Moderate';
            score = 85 + materialScore;
        } else {
            uhiRisk = 'Low';
            score = 95 + materialScore;
        }

        score = Math.min(100, Math.max(0, score));
        if (score < 50) status = 'FAILED';

        return {
            status, score, passed: status === 'PASSED',
            requirements, reasoning: reasoning.join('\n'),
            data: { uhiRisk, neighborDensity: neighborCount }
        };
    }
};

export default ThermalAudit;
