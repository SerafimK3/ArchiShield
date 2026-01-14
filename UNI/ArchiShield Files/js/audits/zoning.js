/**
 * ArchiShield Alpha V2 - Sofia Urban Code Zoning Audit
 * =====================================================
 * Checks Floor Area Ratio, setbacks, and height limits
 * Hard constraint validation against Sofia 2036 zoning code
 */

const ZoningAudit = {
    name: 'Sofia Urban Code Zoning Audit',
    code: 'ZON-2036',

    /**
     * Execute zoning compliance audit
     * @param {Object} building - Validated building data
     * @param {Object} env - SOFIA_2036 constants
     * @returns {Object} - Audit results with anti-hallucination citations
     */
    execute(building, env) {
        const reasoning = [];
        const calculations = {};
        const requirements = [];
        let passed = true;
        let status = 'LEGAL & RESILIENT';
        const failureReasons = [];

        reasoning.push("═══ SOFIA URBAN CODE ZONING AUDIT (ZON-2036) ═══");
        reasoning.push(`Regulatory Framework: Sofia Urban Code 2036`);
        reasoning.push(`Last Updated: ${env.regulatory.lastUpdated}`);
        reasoning.push("");

        // Step 1: Floor Area Ratio (FAR) Check
        reasoning.push("STEP 1: Floor Area Ratio (FAR) Analysis");
        reasoning.push(`  Formula: FAR = Total Floor Area / Lot Area`);
        
        const maxFAR = env.zoningCode.maxFAR;
        const totalFloorArea = building.total_floor_area;
        const lotArea = building.lot_area;
        const actualFAR = totalFloorArea / lotArea;
        
        calculations.maxFAR = maxFAR;
        calculations.actualFAR = actualFAR;
        calculations.totalFloorArea = totalFloorArea;
        calculations.lotArea = lotArea;
        
        reasoning.push(`  Total Floor Area: ${totalFloorArea.toLocaleString()} m²`);
        reasoning.push(`  Lot Area: ${lotArea.toLocaleString()} m²`);
        reasoning.push(`  Actual FAR: ${actualFAR.toFixed(2)}`);
        reasoning.push(`  Maximum FAR: ${maxFAR}`);
        reasoning.push(`  [Citation: Sofia Urban Code §4.2.1 - Floor Area Ratio Limits]`);
        
        if (actualFAR > maxFAR) {
            passed = false;
            status = 'NON-COMPLIANT';
            failureReasons.push(`FAR ${actualFAR.toFixed(2)} exceeds maximum ${maxFAR}`);
            reasoning.push(`  ❌ NON-COMPLIANT: FAR exceeds zoning limit`);
            
            const requiredReduction = totalFloorArea - (lotArea * maxFAR);
            requirements.push({
                parameter: "total_floor_area",
                current: `${totalFloorArea.toLocaleString()} m²`,
                required: `≤${(lotArea * maxFAR).toLocaleString()} m²`,
                action: `Reduce floor area by ${requiredReduction.toLocaleString()} m²`,
                citation: "Sofia Urban Code §4.2.1"
            });
        } else {
            const farMargin = maxFAR - actualFAR;
            reasoning.push(`  ✓ COMPLIANT: FAR within limits (margin: ${farMargin.toFixed(2)})`);
        }
        reasoning.push("");

        // Step 2: Building Height Check
        reasoning.push("STEP 2: Building Height Limit Check");
        const maxHeight = env.zoningCode.maxBuildingHeight;
        const actualHeight = building.height;
        
        calculations.maxHeight = maxHeight;
        calculations.actualHeight = actualHeight;
        
        reasoning.push(`  Building Height: ${actualHeight} m`);
        reasoning.push(`  Maximum Height: ${maxHeight} m`);
        reasoning.push(`  [Citation: Sofia Urban Code §4.3.1 - Height Restrictions]`);
        
        if (actualHeight > maxHeight) {
            passed = false;
            status = 'NON-COMPLIANT';
            failureReasons.push(`Height ${actualHeight}m exceeds maximum ${maxHeight}m`);
            reasoning.push(`  ❌ NON-COMPLIANT: Height exceeds zoning limit`);
            
            requirements.push({
                parameter: "building_height",
                current: `${actualHeight}m`,
                required: `≤${maxHeight}m`,
                action: `Reduce height by ${actualHeight - maxHeight}m or ${Math.ceil((actualHeight - maxHeight) / 3.5)} floors`,
                citation: "Sofia Urban Code §4.3.1"
            });
        } else {
            reasoning.push(`  ✓ COMPLIANT: Height within limits`);
        }
        reasoning.push("");

        // Step 3: Front/Side Setback Check
        reasoning.push("STEP 3: Setback Requirements Analysis");
        reasoning.push(`  Formula: Required Setback = max(${env.zoningCode.setbackFormula} × Height, ${env.zoningCode.minSetbackMeters}m)`);
        
        const requiredSetback = Math.max(
            env.zoningCode.setbackFormula * actualHeight,
            env.zoningCode.minSetbackMeters
        );
        
        calculations.requiredSetback = requiredSetback;
        
        reasoning.push(`  Required Setback = max(${env.zoningCode.setbackFormula} × ${actualHeight}, ${env.zoningCode.minSetbackMeters})`);
        reasoning.push(`  Required Setback = max(${(env.zoningCode.setbackFormula * actualHeight).toFixed(1)}, ${env.zoningCode.minSetbackMeters}) = ${requiredSetback.toFixed(1)} m`);
        reasoning.push(`  [Citation: Sofia Urban Code §5.1.1 - Setback Formula]`);
        reasoning.push("");
        
        // Check each property line
        const setbacks = {
            north: building.property_line_north,
            south: building.property_line_south,
            east: building.property_line_east,
            west: building.property_line_west
        };
        
        calculations.setbacks = setbacks;
        
        let setbackViolations = [];
        for (const [direction, distance] of Object.entries(setbacks)) {
            reasoning.push(`  ${direction.charAt(0).toUpperCase() + direction.slice(1)} setback: ${distance.toFixed(1)}m`);
            if (distance < requiredSetback) {
                setbackViolations.push(direction);
                reasoning.push(`    ❌ Violation: ${distance.toFixed(1)}m < ${requiredSetback.toFixed(1)}m required`);
                
                requirements.push({
                    parameter: `setback_${direction}`,
                    current: `${distance.toFixed(1)}m`,
                    required: `≥${requiredSetback.toFixed(1)}m`,
                    action: `Increase ${direction} setback by ${(requiredSetback - distance).toFixed(1)}m`,
                    citation: "Sofia Urban Code §5.1.1"
                });
            } else {
                reasoning.push(`    ✓ Compliant`);
            }
        }
        
        if (setbackViolations.length > 0) {
            passed = false;
            status = 'NON-COMPLIANT';
            failureReasons.push(`Setback violations on ${setbackViolations.join(', ')} property lines`);
        }
        reasoning.push("");

        // Step 4: Lot Coverage Check
        reasoning.push("STEP 4: Lot Coverage Analysis");
        const maxCoverage = env.zoningCode.maxLotCoverage;
        const actualCoverage = building.footprint_area / lotArea;
        
        calculations.maxCoverage = maxCoverage;
        calculations.actualCoverage = actualCoverage;
        
        reasoning.push(`  Building Footprint: ${building.footprint_area.toLocaleString()} m²`);
        reasoning.push(`  Lot Area: ${lotArea.toLocaleString()} m²`);
        reasoning.push(`  Lot Coverage: ${(actualCoverage * 100).toFixed(1)}%`);
        reasoning.push(`  Maximum Coverage: ${(maxCoverage * 100).toFixed(0)}%`);
        reasoning.push(`  [Citation: Sofia Urban Code §5.2.1 - Lot Coverage Limits]`);
        
        if (actualCoverage > maxCoverage) {
            passed = false;
            status = 'NON-COMPLIANT';
            failureReasons.push(`Lot coverage ${(actualCoverage * 100).toFixed(1)}% exceeds ${(maxCoverage * 100)}% limit`);
            reasoning.push(`  ❌ NON-COMPLIANT: Lot coverage exceeds limit`);
            
            const maxFootprint = lotArea * maxCoverage;
            requirements.push({
                parameter: "footprint_area",
                current: `${building.footprint_area.toLocaleString()} m²`,
                required: `≤${maxFootprint.toLocaleString()} m²`,
                action: `Reduce footprint by ${(building.footprint_area - maxFootprint).toLocaleString()} m²`,
                citation: "Sofia Urban Code §5.2.1"
            });
        } else {
            reasoning.push(`  ✓ COMPLIANT: Lot coverage within limits`);
        }
        reasoning.push("");

        // Step 5: Green Space Requirement
        reasoning.push("STEP 5: Green Space Requirement");
        const minGreenSpace = env.zoningCode.minGreenSpace;
        const availableGreen = 1 - actualCoverage;
        
        calculations.minGreenSpace = minGreenSpace;
        calculations.availableGreen = availableGreen;
        
        reasoning.push(`  Minimum Green Space Required: ${(minGreenSpace * 100).toFixed(0)}% of lot`);
        reasoning.push(`  Available Open Space: ${(availableGreen * 100).toFixed(1)}%`);
        reasoning.push(`  [Citation: Sofia Urban Code §5.3.1 - Green Space Requirements]`);
        
        if (availableGreen < minGreenSpace) {
            passed = false;
            status = 'NON-COMPLIANT';
            failureReasons.push(`Green space ${(availableGreen * 100).toFixed(1)}% below ${(minGreenSpace * 100)}% minimum`);
            reasoning.push(`  ❌ NON-COMPLIANT: Insufficient green space`);
            
            requirements.push({
                parameter: "green_space",
                current: `${(availableGreen * 100).toFixed(1)}%`,
                required: `≥${(minGreenSpace * 100).toFixed(0)}%`,
                citation: "Sofia Urban Code §5.3.1"
            });
        } else {
            reasoning.push(`  ✓ COMPLIANT: Green space requirement met`);
        }
        reasoning.push("");

        // Step 6: Parking Requirements
        reasoning.push("STEP 6: Parking Requirements");
        const parkingRatio = env.zoningCode.minParkingRatio;
        const requiredSpaces = Math.ceil(totalFloorArea / 100 * parkingRatio);
        
        // Estimate available parking (simplified)
        const basementArea = building.has_basement ? building.footprint_area : 0;
        const estimatedSpaces = Math.floor(basementArea / 25); // 25m² per space
        
        calculations.requiredParking = requiredSpaces;
        calculations.estimatedParking = estimatedSpaces;
        
        reasoning.push(`  Parking Ratio: ${parkingRatio} spaces per 100m² GFA`);
        reasoning.push(`  Required Spaces: ${requiredSpaces}`);
        reasoning.push(`  Estimated Available (basement): ${estimatedSpaces}`);
        reasoning.push(`  [Citation: Sofia Urban Code §6.1.1 - Parking Standards]`);
        
        if (estimatedSpaces < requiredSpaces) {
            // Parking is warning, not failure
            reasoning.push(`  ⚠ WARNING: May need additional parking provisions`);
            requirements.push({
                parameter: "parking_spaces",
                current: `≈${estimatedSpaces} spaces`,
                required: `≥${requiredSpaces} spaces`,
                action: `Add ${requiredSpaces - estimatedSpaces} parking spaces (mechanical parking or adjacent lot)`,
                citation: "Sofia Urban Code §6.1.1"
            });
        } else {
            reasoning.push(`  ✓ COMPLIANT: Parking requirement met`);
        }
        reasoning.push("");

        // Determine final status
        if (passed) {
            status = 'LEGAL & RESILIENT';
        }

        // Calculate score
        let score = 100;
        if (actualFAR > maxFAR) {
            score -= 25 * (actualFAR / maxFAR);
        }
        if (actualHeight > maxHeight) {
            score -= 20 * (actualHeight / maxHeight);
        }
        if (setbackViolations.length > 0) {
            score -= 15 * setbackViolations.length;
        }
        if (actualCoverage > maxCoverage) {
            score -= 15;
        }
        if (availableGreen < minGreenSpace) {
            score -= 10;
        }
        score = Math.max(0, Math.min(100, score));
        calculations.score = score;

        reasoning.push("═══ ZONING AUDIT SUMMARY ═══");
        reasoning.push(`  Score: ${score.toFixed(1)}/100`);
        reasoning.push(`  Status: ${status}`);
        if (!passed) {
            reasoning.push(`  Violations: ${failureReasons.join('; ')}`);
        }

        return {
            auditName: this.name,
            auditCode: this.code,
            passed,
            status,
            score,
            failureReasons,
            calculations,
            requirements,
            reasoning: reasoning.join('\n')
        };
    }
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ZoningAudit;
}
