/**
 * Wind Load Resilience Audit Service
 * Analyzes wind exposure based on building height and neighboring shielding.
 */
import { SpatialUtils } from '../spatial';

export const WindLoadAudit = {
    id: 'wind_load',
    name: 'Wind Load Audit',

    /**
     * @param {Object} building - Current building
     * @param {Array} allBuildings - Dataset for neighbor analysis
     */
    execute(building, allBuildings = []) {
        if (!building) return null;

        const { lat, lng, height } = building;
        const radius = 150; // 150m radius for shielding analysis
        const reasoning = [];
        let status = 'PASSED';
        let score = 100;
        const requirements = [];

        // 1. Calculate Shielding (Neighbor Count)
        let neighborCount = 0;
        if (allBuildings.length > 0) {
            neighborCount = SpatialUtils.countFeaturesInRadius({ lat, lng }, allBuildings, radius);
            // Subtract 1 to exclude the building itself
            neighborCount = Math.max(0, neighborCount - 1);
        }

        reasoning.push(`Shielding Analysis: Identified ${neighborCount} neighboring structures within ${radius}m.`);

        // 2. Evaluate exposure
        let shielding = 'Moderate';
        if (neighborCount < 3) {
            status = 'FAILED';
            score = 65;
            shielding = 'None (Highly Exposed)';
            requirements.push("High-Wind Bracing: Reinforced Facade Class A+ REQUIREMENT");
            reasoning.push("❌ CRITICAL: Construction site is highly exposed. Increased structural bracing mandated.");
        } else if (neighborCount < 10) {
            score = 90;
            shielding = 'Low';
            reasoning.push("✓ Standard Shielding: Moderate wind exposure detected.");
        } else {
            score = 98;
            shielding = 'High (Protected)';
            reasoning.push("✓ High Shielding: Site is well-protected by surrounding urban fabric.");
        }

        // 3. Height Penalty
        // Tall buildings (> 60m) that are exposed are critical
        if (height > 60 && neighborCount < 3) {
            status = 'FAILED';
            score = 40;
            requirements.push("Advanced Aerodynamics: Wind Tunnel Testing MANDATORY");
            reasoning.push("❌ DANGER: Extreme height combined with zero shielding creates severe structural risk.");
        }

        return {
            id: this.id,
            name: this.name,
            status,
            score,
            passed: status === 'PASSED',
            requirements,
            reasoning: reasoning.join('. '),
            data: {
                neighborCount,
                shielding,
                stressLevel: this.calculateStress(height, neighborCount)
            }
        };
    },

    calculateStress(height, neighborCount) {
        // Stress increases with height and decreases with neighbor count (shielding)
        // Range 0-100
        const heightFactor = (height / 80) * 80; // Max height around 80m
        const shieldingReduction = Math.min(neighborCount * 4, 60); // Neighbors reduce stress up to 60 units
        return Math.max(0, Math.min(Math.round(heightFactor - shieldingReduction + 20), 100));
    }
};
