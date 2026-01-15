/**
 * ArchiShield Pro - Wind Load Audit
 * Real-Data Enabled: Counts neighboring buildings for shielding calculation.
 */

const WindLoadAudit = {
    name: 'Wind Load Audit',
    code: 'WLA-2036',
    id: 'wind_load',

    /**
     * Execute wind audit
     * @param {Object} building - Building data
     * @param {Object} config - Environmental config (SOFIA_2036)
     * @returns {Object} Audit result
     */
    execute(building, config) {
        const reasoning = [];
        reasoning.push("═══ WIND LOAD AUDIT (WLA-2036) - Real Data ═══");

        // 1. Calculate Shielding via Neighbor Count
        let neighborCount = 0;
        const radius = 150;
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
            reasoning.push(`Real Data: Found ${neighborCount} buildings within ${radius}m`);
        }

        if (!dataFound) {
            neighborCount = 5;
            reasoning.push("⚠️ No sector data loaded. Using fallback (5 neighbors).");
        }

        // 2. Evaluate
        let status = 'PASSED';
        let score = 100;
        let shielding = 'Moderate';
        const requirements = [];

        if (neighborCount < 3) {
            status = 'FAILED';
            score = 65;
            shielding = 'None (Exposed)';
            requirements.push("High-Wind Bracing: Facade Class A+");
            reasoning.push("❌ FAIL: Site is exposed (< 3 neighbors). High wind loads expected.");
        } else if (neighborCount < 10) {
            score = 90;
            shielding = 'Low';
            reasoning.push("✓ Low Shielding: Some wind exposure but manageable.");
        } else {
            score = 98;
            shielding = 'High (Protected)';
            reasoning.push("✓ High Shielding: Well protected by surrounding buildings.");
        }

        // Height Penalty
        if (building.height > 60 && shielding === 'None (Exposed)') {
            status = 'FAILED';
            score = 40;
            requirements.push("Aerodynamic Shaping: Wind Tunnel Test Required");
            reasoning.push("❌ CRITICAL: Tall + Exposed = Dangerous.");
        }

        reasoning.push(`Shielding Factor: ${shielding}`);
        reasoning.push(`Neighbors in Radius: ${neighborCount}`);

        return {
            status: status,
            score: score,
            passed: status === 'PASSED',
            requirements: requirements,
            reasoning: reasoning.join('\n'),
            data: {
                shielding: shielding,
                neighborCount: neighborCount
            }
        };
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = WindLoadAudit;
}
