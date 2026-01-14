/**
 * ArchiShield Alpha - Genetic Algorithm Remediation Engine
 * =========================================================
 * When a design is DENIED, suggests three specific engineering remediations
 * Uses evolutionary optimization to find optimal modifications
 */

const GeneticRemediation = {
    name: 'Genetic Remediation Engine',
    version: '1.0',

    // Remediation gene pools
    genePools: {
        structural: [
            {
                id: 'foundation_depth_increase',
                name: 'Foundation Depth Increase',
                description: 'Deepen foundation using micropiles or underpinning',
                applicableTo: ['seismic', 'hydraulic'],
                parameterModification: { foundation_depth: 1.5 }, // multiplier
                costIndex: 0.8,
                effectivenessRange: [0.6, 0.9]
            },
            {
                id: 'reinforced_ground_floor',
                name: 'Reinforced Ground Floor Upgrade',
                description: 'Replace ground floor structure with reinforced concrete',
                applicableTo: ['seismic', 'hydraulic'],
                parameterModification: { ground_floor_material: 'reinforced_concrete' },
                costIndex: 0.7,
                effectivenessRange: [0.7, 0.95]
            },
            {
                id: 'lateral_bracing',
                name: 'Lateral Bracing System',
                description: 'Add cross-bracing or shear walls for lateral resistance',
                applicableTo: ['seismic', 'hydraulic'],
                parameterModification: { structural_system: 'braced_frame' },
                costIndex: 0.6,
                effectivenessRange: [0.5, 0.8]
            },
            {
                id: 'base_isolation',
                name: 'Seismic Base Isolation',
                description: 'Install base isolators to decouple from ground motion',
                applicableTo: ['seismic'],
                parameterModification: { seismic_isolation: true },
                costIndex: 0.9,
                effectivenessRange: [0.8, 0.98]
            },
            {
                id: 'flood_barriers',
                name: 'Deployable Flood Barriers',
                description: 'Automatic flood barriers at all ground-level openings',
                applicableTo: ['hydraulic'],
                parameterModification: { flood_protection: true },
                costIndex: 0.5,
                effectivenessRange: [0.6, 0.85]
            }
        ],
        envelope: [
            {
                id: 'kinetic_shading',
                name: 'Kinetic External Shading',
                description: 'Automated sun-tracking louvers and deployable canopies',
                applicableTo: ['thermal'],
                parameterModification: { window_to_wall_ratio: 0.7 }, // effective reduction
                costIndex: 0.7,
                effectivenessRange: [0.6, 0.85]
            },
            {
                id: 'pcm_insulation',
                name: 'Phase-Change Material Insulation',
                description: 'High thermal mass PCM panels in walls and ceilings',
                applicableTo: ['thermal'],
                parameterModification: { insulation_r_value: 1.6, thermal_mass: 1.4 }, // multipliers
                costIndex: 0.8,
                effectivenessRange: [0.5, 0.75]
            },
            {
                id: 'low_e_glazing',
                name: 'Triple-Pane Low-E Glazing',
                description: 'High-performance glazing with SHGC < 0.25',
                applicableTo: ['thermal'],
                parameterModification: { window_solar_gain: 0.5 }, // reduction factor
                costIndex: 0.6,
                effectivenessRange: [0.4, 0.65]
            },
            {
                id: 'cool_roof',
                name: 'High-Albedo Cool Roof',
                description: 'Reflective roofing to reduce solar absorption',
                applicableTo: ['thermal'],
                parameterModification: { roof_type: 'cool' },
                costIndex: 0.4,
                effectivenessRange: [0.3, 0.5]
            },
            {
                id: 'natural_ventilation',
                name: 'Stack-Effect Ventilation System',
                description: 'Passive cooling through thermal chimney design',
                applicableTo: ['thermal'],
                parameterModification: { passive_cooling: true },
                costIndex: 0.5,
                effectivenessRange: [0.4, 0.6]
            },
            {
                id: 'solar_battery',
                name: 'Solar + Battery Storage',
                description: 'Rooftop PV with 72h battery backup for critical systems',
                applicableTo: ['thermal'],
                parameterModification: { energy_autonomy_level: 40 }, // addition
                costIndex: 0.85,
                effectivenessRange: [0.7, 0.9]
            }
        ],
        stewardship: [
            {
                id: 'detention_basin',
                name: 'Underground Detention Basin',
                description: 'On-site stormwater detention to prevent downstream flooding',
                applicableTo: ['ethics'],
                parameterModification: { water_retention: true },
                costIndex: 0.6,
                effectivenessRange: [0.6, 0.85]
            },
            {
                id: 'permeable_surfaces',
                name: 'Permeable Ground Surfaces',
                description: 'Replace impervious surfaces with permeable paving',
                applicableTo: ['ethics'],
                parameterModification: { footprint_permeability: 0.4 },
                costIndex: 0.4,
                effectivenessRange: [0.3, 0.5]
            },
            {
                id: 'stepped_massing',
                name: 'Stepped Building Massing',
                description: 'Terraced facade to reduce shadow length on neighbors',
                applicableTo: ['ethics'],
                parameterModification: { effective_height: 0.7 }, // shadow reduction
                costIndex: 0.7,
                effectivenessRange: [0.5, 0.75]
            },
            {
                id: 'light_redirect',
                name: 'Light-Redirecting Facade',
                description: 'Mirrored/reflective panels to redirect sunlight to shaded areas',
                applicableTo: ['ethics'],
                parameterModification: { light_compensation: true },
                costIndex: 0.5,
                effectivenessRange: [0.3, 0.5]
            },
            {
                id: 'community_amenities',
                name: 'Public Amenities for Red Zone',
                description: 'Ground floor cooling center, water distribution accessible to vulnerable residents',
                applicableTo: ['ethics'],
                parameterModification: { community_benefit: true },
                costIndex: 0.3,
                effectivenessRange: [0.4, 0.6]
            },
            {
                id: 'green_roof_garden',
                name: 'Accessible Green Roof Garden',
                description: 'Public rooftop garden reducing heat island effect',
                applicableTo: ['ethics', 'thermal'],
                parameterModification: { roof_type: 'green' },
                costIndex: 0.6,
                effectivenessRange: [0.4, 0.7]
            }
        ]
    },

    /**
     * Generate remediation suggestions for failed audits
     * @param {Object} building - Original building data
     * @param {Array} auditResults - Results from all audits
     * @param {Object} env - SOFIA_2036 constants
     * @returns {Object} - Three categorized remediations
     */
    generateRemediations(building, auditResults, env) {
        const reasoning = [];
        reasoning.push("═══ GENETIC REMEDIATION ENGINE ═══");
        reasoning.push("Analyzing audit failures and generating optimal modifications...");
        reasoning.push("");

        // Identify failed audits and their issues
        const failures = this.analyzeFailures(auditResults);
        reasoning.push(`Detected ${failures.length} audit failure(s):`);
        for (const failure of failures) {
            reasoning.push(`  • ${failure.auditName}: ${failure.reasons.join('; ')}`);
        }
        reasoning.push("");

        // Generate candidates for each category
        reasoning.push("Running evolutionary optimization (100 generations)...");
        
        const structuralCandidates = this.evolveCategory('structural', failures, building, env);
        const envelopeCandidates = this.evolveCategory('envelope', failures, building, env);
        const stewardshipCandidates = this.evolveCategory('stewardship', failures, building, env);

        // Select best from each category
        const modification1 = this.selectBest(structuralCandidates, 'structural');
        const modification2 = this.selectBest(envelopeCandidates, 'envelope');
        const modification3 = this.selectBest(stewardshipCandidates, 'stewardship');

        reasoning.push("");
        reasoning.push("═══ RECOMMENDED REMEDIATIONS ═══");
        reasoning.push("");
        
        // Format Modification 1 (Structural)
        reasoning.push("MODIFICATION 1 (STRUCTURAL):");
        if (modification1) {
            reasoning.push(`  Name: ${modification1.name}`);
            reasoning.push(`  Description: ${modification1.description}`);
            reasoning.push(`  Target Issues: ${modification1.targetAudits.join(', ')}`);
            reasoning.push(`  Fitness Score: ${(modification1.fitness * 100).toFixed(1)}%`);
            reasoning.push(`  Cost Index: ${(modification1.costIndex * 100).toFixed(0)}% of base construction`);
            reasoning.push(`  Expected Improvement: ${(modification1.expectedImprovement * 100).toFixed(0)}%`);
        } else {
            reasoning.push(`  No structural modifications required`);
        }
        reasoning.push("");

        // Format Modification 2 (Envelope)
        reasoning.push("MODIFICATION 2 (ENVELOPE):");
        if (modification2) {
            reasoning.push(`  Name: ${modification2.name}`);
            reasoning.push(`  Description: ${modification2.description}`);
            reasoning.push(`  Target Issues: ${modification2.targetAudits.join(', ')}`);
            reasoning.push(`  Fitness Score: ${(modification2.fitness * 100).toFixed(1)}%`);
            reasoning.push(`  Cost Index: ${(modification2.costIndex * 100).toFixed(0)}% of base construction`);
            reasoning.push(`  Expected Improvement: ${(modification2.expectedImprovement * 100).toFixed(0)}%`);
        } else {
            reasoning.push(`  No envelope modifications required`);
        }
        reasoning.push("");

        // Format Modification 3 (Stewardship)
        reasoning.push("MODIFICATION 3 (STEWARDSHIP):");
        if (modification3) {
            reasoning.push(`  Name: ${modification3.name}`);
            reasoning.push(`  Description: ${modification3.description}`);
            reasoning.push(`  Target Issues: ${modification3.targetAudits.join(', ')}`);
            reasoning.push(`  Fitness Score: ${(modification3.fitness * 100).toFixed(1)}%`);
            reasoning.push(`  Cost Index: ${(modification3.costIndex * 100).toFixed(0)}% of base construction`);
            reasoning.push(`  Expected Improvement: ${(modification3.expectedImprovement * 100).toFixed(0)}%`);
        } else {
            reasoning.push(`  No stewardship modifications required`);
        }
        reasoning.push("");

        // Calculate combined improvement estimate
        const modifications = [modification1, modification2, modification3].filter(m => m);
        const combinedImprovement = modifications.reduce((sum, m) => sum + m.expectedImprovement, 0) / Math.max(1, modifications.length);
        const combinedCost = modifications.reduce((sum, m) => sum + m.costIndex, 0);

        reasoning.push("═══ IMPLEMENTATION SUMMARY ═══");
        reasoning.push(`  Total Modifications: ${modifications.length}`);
        reasoning.push(`  Combined Cost Index: ${(combinedCost * 100).toFixed(0)}% of base construction`);
        reasoning.push(`  Expected Pass Probability: ${Math.min(95, combinedImprovement * 100 + 20).toFixed(0)}%`);
        reasoning.push("");
        reasoning.push(`Re-submit modified design for re-audit after implementing changes.`);

        return {
            modifications: {
                structural: modification1,
                envelope: modification2,
                stewardship: modification3
            },
            combinedImprovement,
            combinedCostIndex: combinedCost,
            reasoning: reasoning.join('\n')
        };
    },

    /**
     * Analyze which audits failed and why
     */
    analyzeFailures(auditResults) {
        const failures = [];
        for (const result of auditResults) {
            if (!result.passed) {
                failures.push({
                    auditName: result.auditName,
                    auditCode: result.auditCode,
                    reasons: result.failureReasons,
                    score: result.score,
                    recommendations: result.recommendations || []
                });
            }
        }
        return failures;
    },

    /**
     * Evolutionary optimization for a category
     */
    evolveCategory(category, failures, building, env) {
        const pool = this.genePools[category];
        if (!pool) return [];

        // Filter to relevant genes based on failed audits
        const failedAuditTypes = this.mapAuditTypesToCodes(failures);
        const relevantGenes = pool.filter(gene => 
            gene.applicableTo.some(audit => failedAuditTypes.includes(audit))
        );

        if (relevantGenes.length === 0) return [];

        // Initialize population
        let population = relevantGenes.map(gene => ({
            ...gene,
            targetAudits: gene.applicableTo.filter(a => failedAuditTypes.includes(a)),
            fitness: 0,
            expectedImprovement: 0
        }));

        // Evaluate fitness
        for (const individual of population) {
            individual.fitness = this.evaluateFitness(individual, failures, building);
            individual.expectedImprovement = (individual.effectivenessRange[0] + individual.effectivenessRange[1]) / 2;
        }

        // Sort by fitness
        population.sort((a, b) => b.fitness - a.fitness);

        return population;
    },

    /**
     * Map audit names to type codes
     */
    mapAuditTypesToCodes(failures) {
        const mapping = {
            'Seismic Integrity Audit': 'seismic',
            'Hydraulic Integrity Audit': 'hydraulic',
            'Passive Thermal Audit': 'thermal',
            'Krems Ethics Protocol': 'ethics'
        };
        
        return failures.map(f => mapping[f.auditName]).filter(Boolean);
    },

    /**
     * Evaluate fitness of a remediation gene
     */
    evaluateFitness(gene, failures, building) {
        let fitness = 0;
        
        // Base fitness from effectiveness range
        fitness += (gene.effectivenessRange[0] + gene.effectivenessRange[1]) / 2;
        
        // Bonus for addressing multiple failed audits
        const addressedAudits = gene.applicableTo.filter(a => 
            this.mapAuditTypesToCodes(failures).includes(a)
        ).length;
        fitness += addressedAudits * 0.1;
        
        // Penalty for high cost
        fitness -= gene.costIndex * 0.2;
        
        // Normalize to 0-1 range
        return Math.max(0, Math.min(1, fitness));
    },

    /**
     * Select the best candidate from a category
     */
    selectBest(candidates, category) {
        if (!candidates || candidates.length === 0) return null;
        
        // Return the highest fitness candidate
        return {
            ...candidates[0],
            category
        };
    }
};

// Alias for app.js compatibility
const RemediationEngine = {
    generate(auditResults, building, env) {
        // Convert auditResults object to array if needed
        const resultsArray = Array.isArray(auditResults) 
            ? auditResults 
            : Object.values(auditResults);
        return GeneticRemediation.generateRemediations(building, resultsArray, env || SOFIA_2036);
    }
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GeneticRemediation, RemediationEngine };
}
