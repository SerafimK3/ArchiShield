/**
 * ArchiShield Alpha V2 - Main Orchestrator
 * =========================================
 * Parametric Resilience & Zoning Engine
 * Coordinates all audits, exports, and certificate generation
 */

const ArchiShieldEngine = {
    version: '2.0',
    name: 'ArchiShield Alpha V2',

    /**
     * Execute complete resilience audit
     * @param {string} buildingJSON - JSON string of building data
     * @returns {Object} - Complete audit results
     */
    async runAudit(buildingJSON) {
        const startTime = Date.now();
        const log = [];

        log.push("╔═══════════════════════════════════════════════════════════════╗");
        log.push("║          ArchiShield Alpha V2 - Resilience Audit Engine       ║");
        log.push("║              Parametric Resilience & Zoning Engine            ║");
        log.push("╚═══════════════════════════════════════════════════════════════╝");
        log.push("");
        log.push(`[${new Date().toISOString()}] Audit initiated`);
        log.push("");

        // Step 1: Parse and Validate
        log.push("▓▓▓ PHASE 1: DATA INGESTION PROTOCOL ▓▓▓");
        log.push("");

        const parseResult = BuildingValidator.parseJSON(buildingJSON);
        if (!parseResult.success) {
            log.push(`❌ Parse Error: ${parseResult.error}`);
            return {
                success: false,
                error: { type: 'PARSE_ERROR', message: parseResult.error },
                executionLog: log.join('\n')
            };
        }

        const validation = BuildingValidator.validate(parseResult.data);
        if (!validation.valid) {
            log.push(`❌ Validation Errors:`);
            validation.errors.forEach(e => log.push(`   • ${e}`));
            return {
                success: false,
                error: { type: 'VALIDATION_ERROR', messages: validation.errors },
                executionLog: log.join('\n')
            };
        }

        const building = validation.sanitized;
        log.push(`✓ Building parsed: "${building.name}"`);
        log.push(`  Height: ${building.height}m | Floors: ${building.floors}`);
        log.push(`  Footprint: ${building.footprint_area.toLocaleString()} m²`);
        log.push(`  Total Floor Area: ${building.total_floor_area.toLocaleString()} m²`);
        log.push(`  Lot Area: ${building.lot_area.toLocaleString()} m²`);
        log.push(`  Actual FAR: ${building.actualFAR.toFixed(2)}`);
        log.push("");

        // Show warnings
        if (validation.warnings.length > 0) {
            log.push("⚠ Validation Warnings:");
            validation.warnings.forEach(w => log.push(`   • ${w}`));
            log.push("");
        }

        // Step 2: Load Environmental Data
        log.push("▓▓▓ PHASE 2: ENVIRONMENTAL & REGULATORY LAYERS ▓▓▓");
        log.push("");
        log.push("Environmental Layer (50-year predictive data):");
        log.push(`  • Seismic: ${SOFIA_2036.environmentalData.seismicMagnitude}M (PGA ${SOFIA_2036.environmentalData.peakGroundAcceleration}g)`);
        log.push(`  • Wind: ${SOFIA_2036.environmentalData.peakWindSpeedMph} mph (${SOFIA_2036.environmentalData.peakWindSpeedMs.toFixed(1)} m/s)`);
        log.push(`  • Flood: BFE ${SOFIA_2036.environmentalData.baseFloodElevation}m + 1.2m = ${SOFIA_2036.environmentalData.designBFE}m`);
        log.push(`  • Thermal: ${SOFIA_2036.environmentalData.heatwavePeakTemp}°C for ${SOFIA_2036.environmentalData.heatwaveDuration}h`);
        log.push("");
        log.push("Regulatory Layer (Sofia Urban Code 2036):");
        log.push(`  • Max FAR: ${SOFIA_2036.zoningCode.maxFAR}`);
        log.push(`  • Setback: ${SOFIA_2036.zoningCode.setbackFormula} × Height (min ${SOFIA_2036.zoningCode.minSetbackMeters}m)`);
        log.push(`  • Max Height: ${SOFIA_2036.zoningCode.maxBuildingHeight}m`);
        log.push(`  • Max Lot Coverage: ${SOFIA_2036.zoningCode.maxLotCoverage * 100}%`);
        log.push("");

        // Step 3: Execute All Audits
        log.push("▓▓▓ PHASE 3: COMPUTATIONAL AUDITS ▓▓▓");
        log.push("");

        const auditResults = {};
        const allRequirements = [];
        const detailedReasoning = {};

        // Wind Load Audit
        log.push("━━━ Wind Load Audit (WLA-2036) ━━━");
        auditResults.wind = WindLoadAudit.execute(building, SOFIA_2036);
        log.push(`  Status: ${auditResults.wind.status} | Score: ${auditResults.wind.score.toFixed(1)}`);
        allRequirements.push(...(auditResults.wind.requirements || []));
        detailedReasoning.wind = auditResults.wind.reasoning;
        log.push("");

        // Zoning Audit
        log.push("━━━ Zoning Compliance Audit (ZON-2036) ━━━");
        auditResults.zoning = ZoningAudit.execute(building, SOFIA_2036);
        log.push(`  Status: ${auditResults.zoning.status} | Score: ${auditResults.zoning.score.toFixed(1)}`);
        allRequirements.push(...(auditResults.zoning.requirements || []));
        detailedReasoning.zoning = auditResults.zoning.reasoning;
        log.push("");

        // Seismic Audit
        log.push("━━━ Seismic Integrity Audit (SIA-2036) ━━━");
        auditResults.seismic = SeismicAudit.execute(building, SOFIA_2036);
        log.push(`  Status: ${auditResults.seismic.passed ? 'PASSED' : 'FAILED'} | Score: ${auditResults.seismic.score.toFixed(1)}`);
        allRequirements.push(...(auditResults.seismic.remediations || []).map(r => ({
            parameter: r.type || 'structural',
            current: 'Current design',
            required: r.recommendation || r,
            citation: 'SIA-2036'
        })));
        detailedReasoning.seismic = auditResults.seismic.reasoning;
        log.push("");

        // Hydraulic Audit
        log.push("━━━ Hydraulic Integrity Audit (HIA-2036) ━━━");
        auditResults.hydraulic = HydraulicAudit.execute(building, SOFIA_2036);
        log.push(`  Status: ${auditResults.hydraulic.status} | Score: ${auditResults.hydraulic.score.toFixed(1)}`);
        allRequirements.push(...(auditResults.hydraulic.requirements || []));
        detailedReasoning.hydraulic = auditResults.hydraulic.reasoning;
        log.push("");

        // Thermal Audit
        log.push("━━━ Passive Thermal Envelope Audit (PTA-2036) ━━━");
        auditResults.thermal = ThermalAudit.execute(building, SOFIA_2036);
        log.push(`  Status: ${auditResults.thermal.status} | Score: ${auditResults.thermal.score.toFixed(1)}`);
        allRequirements.push(...(auditResults.thermal.requirements || []));
        detailedReasoning.thermal = auditResults.thermal.reasoning;
        log.push("");

        // Ethics Audit
        log.push("━━━ Krems Ethics Protocol (KEP-2036) ━━━");
        auditResults.ethics = EthicsAudit.execute(building, SOFIA_2036);
        log.push(`  Status: ${auditResults.ethics.status} | Score: ${auditResults.ethics.score.toFixed(1)}`);
        if (auditResults.ethics.ethicalWarning) {
            log.push(`  ⚠ ETHICAL WARNING: Social impact exceeds threshold`);
        }
        allRequirements.push(...(auditResults.ethics.requirements || []));
        detailedReasoning.ethics = auditResults.ethics.reasoning;
        log.push("");

        // Step 4: Determine Overall Status
        log.push("▓▓▓ PHASE 4: STATUS DETERMINATION ▓▓▓");
        log.push("");

        const globalScore = CertificateGenerator.calculateGlobalScore(auditResults);
        const status = CertificateGenerator.determineStatus(auditResults);

        log.push(`Global Resilience Score: ${globalScore.toFixed(1)}/100`);
        log.push(`Overall Status: ${status}`);
        log.push("");

        // Step 5: Generate Remediations if needed
        let remediations = null;
        if (status !== 'LEGAL & RESILIENT') {
            log.push("▓▓▓ PHASE 5: REMEDIATION GENERATION ▓▓▓");
            log.push("");
            remediations = RemediationEngine.generate(auditResults, building);
            log.push("Recommended modifications generated");
            detailedReasoning.remediation = remediations.reasoning || '';
            log.push("");
        }

        // Step 6: Generate Certificate
        log.push("▓▓▓ PHASE 6: CERTIFICATE GENERATION ▓▓▓");
        log.push("");

        const certificate = CertificateGenerator.generate(
            building,
            auditResults,
            globalScore,
            status,
            allRequirements
        );

        log.push(`Certificate Hash: ${certificate.hash}`);
        log.push(`Requirements Count: ${allRequirements.length}`);
        log.push("");

        // Execution time
        const executionTime = Date.now() - startTime;
        log.push("═══════════════════════════════════════════════════════════════");
        log.push(`Audit completed in ${executionTime}ms`);
        log.push("═══════════════════════════════════════════════════════════════");

        return {
            success: true,
            building,
            auditResults,
            globalScore,
            status,
            allRequirements,
            remediations,
            certificate,
            detailedReasoning,
            executionLog: log.join('\n'),
            executionTime
        };
    },

    /**
     * Export audit results as GeoJSON
     */
    exportGeoJSON(auditResult) {
        if (!auditResult.success) return null;
        return ExportModule.toGeoJSON(auditResult.building, auditResult);
    },

    /**
     * Export audit results as DXF
     */
    exportDXF(auditResult) {
        if (!auditResult.success) return null;
        return ExportModule.toDXF(auditResult.building, auditResult);
    },

    /**
     * Export complete audit data as JSON
     */
    exportJSON(auditResult) {
        if (!auditResult.success) return null;
        return ExportModule.toAuditJSON(auditResult.building, auditResult);
    },

    /**
     * Get environment info
     */
    getEnvironment() {
        return {
            location: SOFIA_2036.location,
            environmental: SOFIA_2036.environmentalData,
            zoning: SOFIA_2036.zoningCode,
            version: this.version
        };
    },

    /**
     * Quick validation (without full audit)
     */
    quickValidate(buildingJSON) {
        const parseResult = BuildingValidator.parseJSON(buildingJSON);
        if (!parseResult.success) {
            return { valid: false, error: parseResult.error };
        }
        return BuildingValidator.validate(parseResult.data);
    }
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ArchiShieldEngine;
}
