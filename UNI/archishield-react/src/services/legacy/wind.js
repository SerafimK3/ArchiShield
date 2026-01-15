// Wind Load Audit Service
import { SpatialUtils } from '../spatial';

export const WindLoadAudit = {
    name: 'Wind Load Audit',
    code: 'WLA-2036',
    id: 'wind_load',

    execute(building, config, sectorData = []) {
        const reasoning = [];
        reasoning.push("═══ WIND LOAD AUDIT (WLA-2036) ═══");

        let neighborCount = 0;
        const radius = 150;

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
            reasoning.push(`Real Data: ${neighborCount} buildings within ${radius}m`);
        } else {
            neighborCount = 5;
            reasoning.push("⚠️ No sector data. Using fallback.");
        }

        let status = 'PASSED';
        let score = 100;
        let shielding = 'Moderate';
        const requirements = [];

        if (neighborCount < 3) {
            status = 'FAILED';
            score = 65;
            shielding = 'None (Exposed)';
            requirements.push("High-Wind Bracing: Facade Class A+");
            reasoning.push("❌ FAIL: Site is exposed.");
        } else if (neighborCount < 10) {
            score = 90;
            shielding = 'Low';
            reasoning.push("✓ Low shielding.");
        } else {
            score = 98;
            shielding = 'High (Protected)';
            reasoning.push("✓ High shielding.");
        }

        if (building.height > 60 && shielding === 'None (Exposed)') {
            status = 'FAILED';
            score = 40;
            requirements.push("Aerodynamic Shaping Required");
        }

        return {
            status, score, passed: status === 'PASSED',
            requirements, reasoning: reasoning.join('\n'),
            data: { shielding, neighborCount, windSpeed: "12.5 m/s" }
        };
    }
};

export default WindLoadAudit;
