/**
 * Seismic Resilience Audit Service
 * Evaluates building safety against geological and structural parameters.
 * Supports material-aware calculations for Concrete vs Timber structures.
 */

// Material properties affecting seismic performance
const MATERIAL_PROPERTIES = {
    CONCRETE: { weightMultiplier: 1.0, flexibility: 0.8, carbonFactor: 1.0, label: 'Reinforced Concrete' },
    TIMBER: { weightMultiplier: 0.55, flexibility: 1.2, carbonFactor: 0.3, label: 'Cross-Laminated Timber (CLT)' }
};

export const SeismicAudit = {
    id: 'seismic',
    name: 'Seismic Resilience Audit',

    execute(building) {
        if (!building) return null;

        const { lat, lng, height, material = 'CONCRETE' } = building;
        const materialProps = MATERIAL_PROPERTIES[material] || MATERIAL_PROPERTIES.CONCRETE;
        const reasoning = [];
        let status = 'PASSED';
        let score = 100;
        const requirements = [];

        // 1. Determine Geological Zone
        // Boundary approx longitude 16.35
        let zone = 'Unknown';
        let pga = 0.0;
        let amplification = 1.0;

        if (lng < 16.35) {
            zone = 'Flysch Zone (Bedrock)';
            pga = 0.06;
            amplification = 1.0;
            reasoning.push("Geological Zone: Flysch (Bedrock) - Stable Foundation");
        } else {
            zone = 'Vienna Basin (Sediment)';
            pga = 0.08;
            amplification = 1.4;
            reasoning.push("Geological Zone: Vienna Basin (Sediment) - Amplification Risk");
        }

        // 2. Structural Integrity Check
        // Buildings over 40m in the sediment zone are higher risk
        // Timber structures get a bonus due to lower mass and higher flexibility
        const effectiveHeight = height * materialProps.weightMultiplier;
        
        if (zone === 'Vienna Basin (Sediment)' && height > 40) {
            if (material === 'TIMBER') {
                // CLT is actually good for seismic - lightweight and flexible
                score = 90;
                reasoning.push(`✓ CLT structure benefits from low mass and high ductility in sediment zone.`);
                requirements.push("Verify CLT connections per EN 1995-1-1 for seismic");
            } else {
                // Concrete is heavier, more risk in sediment
                score = 75;
                requirements.push("Damping System: Tuned Mass Damper Recommended for optimal resilience");
                reasoning.push(`⚠ WARNING: High-rise concrete in sediment zone. Seismic damping recommended.`);
            }
        } else if (zone === 'Flysch Zone (Bedrock)') {
            score = 98;
            reasoning.push("✓ PASS: Building sits on stable bedrock foundation.");
        } else {
            // Timber bonus for standard sediment zone
            const timberBonus = material === 'TIMBER' ? 5 : 0;
            score = 92 + timberBonus;
            reasoning.push(`✓ PASS: Standard seismic compliance within sediment zone.${timberBonus ? ' (CLT bonus applied)' : ''}`);
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
                zone,
                pga: `${pga}g`,
                amplification: `${amplification}x`,
                stressLevel: this.calculateStress(height, amplification, materialProps.weightMultiplier),
                material: materialProps.label,
                materialBonus: material === 'TIMBER' ? 'Lightweight CLT reduces seismic load' : null
            }
        };
    },

    calculateStress(height, amplification, materialWeight = 1.0) {
        // Stress increases with height and soil amplification
        // Lighter materials (timber) reduce stress significantly
        // Range 0-100
        const baseStress = (height / 80) * 50; // Max height in dataset usually around 80m
        const soilFactor = amplification > 1 ? 1.4 : 1.0;
        const materialFactor = materialWeight;
        return Math.min(Math.round(baseStress * soilFactor * materialFactor), 100);
    }
};
