/**
 * ArchiShield Pro - Thermal Comfort Audit
 * Real-Data Enabled: Uses neighbor density + material for UHI calculation.
 */

const ThermalAudit = {
    name: 'Thermal Comfort Audit',
    code: 'TCA-2036',
    id: 'thermal',

    /**
     * Execute thermal audit
     * @param {Object} building - Building data
     * @param {Object} config - Environmental config
     * @returns {Object} Audit result
     */
    execute(building, config) {
        const reasoning = [];
        reasoning.push("═══ THERMAL COMFORT AUDIT (TCA-2036) - Real Data ═══");

        // 1. Calculate Density (UHI Proxy)
        let neighborCount = 0;
        const radius = 200;
        const sectors = ['nw', 'ne', 'sw', 'se'];
        let dataFound = false;

        if (typeof map !== 'undefined' && typeof SpatialUtils !== 'undefined') {
            for (const sector of sectors) {
                const source = map.getSource(`buildings-${sector}`);
                if (source && source._data && source._data.features) {
                    const count = SpatialUtils.countFeaturesInRadius(
                        { lat: building.latitude, lng: building.longitude },
                        source._data.features,
                        radius
                    );
                    neighborCount += count;
                    if (source._data.features.length > 0) dataFound = true;
                }
            }
            reasoning.push(`Real Data: ${neighborCount} buildings within ${radius}m (Urban Density)`);
        }

        if (!dataFound) {
            neighborCount = 10;
            reasoning.push("⚠️ No sector data. Using fallback density (10).");
        }

        // 2. Material Impact
        const material = (building.ground_floor_material || 'concrete').toLowerCase();
        let materialScore = 0;
        const HEAT_MATERIALS = ['concrete', 'asphalt', 'glass', 'steel'];
        const COOL_MATERIALS = ['timber', 'green_facade', 'stone_clad', 'vegetation'];

        if (HEAT_MATERIALS.includes(material)) {
            materialScore = -20;
            reasoning.push(`Material: ${material} (Heat Retaining, -20 pts)`);
        } else if (COOL_MATERIALS.includes(material)) {
            materialScore = +20;
            reasoning.push(`Material: ${material} (Heat Mitigating, +20 pts)`);
        }

        // 3. Evaluation
        let status = 'PASSED';
        let score = 100;
        let uhiRisk = 'Low';
        const requirements = [];

        if (neighborCount > 30) {
            uhiRisk = 'High (Urban Canyon)';
            score = 70 + materialScore;
            if (materialScore < 0) {
                status = 'FAILED';
                requirements.push("Change Facade: Green Facade or High Albedo Required");
                reasoning.push("❌ FAIL: Dense UHI zone + heat-retaining material.");
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

        reasoning.push(`UHI Risk Level: ${uhiRisk}`);
        reasoning.push(`Final Score: ${score}`);

        return {
            status: status,
            score: score,
            passed: status === 'PASSED',
            requirements: requirements,
            reasoning: reasoning.join('\n'),
            data: {
                uhiRisk: uhiRisk,
                neighborDensity: neighborCount
            }
        };
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThermalAudit;
}
