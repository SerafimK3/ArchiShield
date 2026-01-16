/**
 * ArchiShield Alpha V2 - Krems Ethics Protocol
 * =============================================
 * Calculate shade coverage > 20% of daylight hours → Ethical Non-Compliance
 */

const EthicsAudit = {
    name: 'Krems Ethics Protocol',
    code: 'KEP',

    /**
     * Execute ethics audit with 20% shade threshold
     */
    execute(building, env) {
        const reasoning = [];
        const calculations = {};
        const requirements = [];
        let passed = true;
        let status = 'LEGAL & RESILIENT';
        const failureReasons = [];
        let ethicalWarning = false;

        reasoning.push("═══ KREMS ETHICS PROTOCOL (KEP) ═══");
        reasoning.push(`Social Impact Assessment on Adjacent Vulnerable Communities`);
        reasoning.push(`Named after IMC Krems Innovation Lab - Pioneers of Ethical Architecture`);
        reasoning.push(`Shade Impact Threshold: ${env.ethicsConstants.maxShadeImpact * 100}% of daylight hours`);
        reasoning.push("");

        // Step 1: Identify Adjacent Red Zones
        reasoning.push("STEP 1: Red Zone Proximity Analysis");
        const redZoneBuffer = env.zoningCode.redZoneBuffer;
        const adjacentToRedZone = building.adjacent_to_red_zone !== false;
        
        calculations.adjacentToRedZone = adjacentToRedZone;
        calculations.redZoneDirection = building.red_zone_direction || 'south';
        
        reasoning.push(`  Red Zone Buffer Distance: ${redZoneBuffer}m`);
        reasoning.push(`  Adjacent to Red Zone: ${adjacentToRedZone ? 'Yes' : 'No'}`);
        if (adjacentToRedZone) {
            reasoning.push(`  Red Zone Direction: ${calculations.redZoneDirection}`);
            reasoning.push(`  Vienna Designated Red Zones:`);
            for (const zone of env.ethicsConstants.redZones) {
                reasoning.push(`    • ${zone.name}: ${zone.population.toLocaleString()} residents`);
            }
        }
        reasoning.push(`  [Citation: KEP §2.1, Vienna Social Equity Code]`);
        reasoning.push("");

        // Step 2: Calculate Shadow Geometry
        reasoning.push("STEP 2: Shadow Geometry Analysis");
        
        const h = building.height;
        const lat = building.latitude || env.location.latitude;
        
        // Calculate sun angles for winter solstice (worst case shadow)
        const winterSolsticeAltitude = 90 - lat - 23.5;
        const summerSolsticeAltitude = 90 - lat + 23.5;
        const equinoxAltitude = 90 - lat;
        
        // Shadow length = height / tan(altitude)
        const winterShadow = h / Math.tan(winterSolsticeAltitude * Math.PI / 180);
        const summerShadow = h / Math.tan(summerSolsticeAltitude * Math.PI / 180);
        const equinoxShadow = h / Math.tan(equinoxAltitude * Math.PI / 180);
        
        // Annual average
        const avgShadowLength = (winterShadow + summerShadow + equinoxShadow * 2) / 4;
        
        calculations.winterShadow = winterShadow;
        calculations.summerShadow = summerShadow;
        calculations.avgShadowLength = avgShadowLength;
        
        reasoning.push(`  Building Height: ${h}m`);
        reasoning.push(`  Latitude: ${lat.toFixed(4)}°N`);
        reasoning.push(`  Sun Altitude at Winter Solstice: ${winterSolsticeAltitude.toFixed(1)}°`);
        reasoning.push(`  Sun Altitude at Summer Solstice: ${summerSolsticeAltitude.toFixed(1)}°`);
        reasoning.push("");
        reasoning.push(`  Shadow Lengths:`);
        reasoning.push(`    Winter Solstice: ${winterShadow.toFixed(1)}m`);
        reasoning.push(`    Summer Solstice: ${summerShadow.toFixed(1)}m`);
        reasoning.push(`    Annual Average: ${avgShadowLength.toFixed(1)}m`);
        reasoning.push(`  [Citation: KEP §3.1, Solar Geometry]`);
        reasoning.push("");

        // Step 3: Calculate Shade Coverage Duration
        reasoning.push("STEP 3: Shade Coverage Duration Analysis");
        
        const daylightHours = env.ethicsConstants.daylightHours;
        
        // Estimate shadow hours (simplified)
        // Shadow moves ~15°/hour, building casts significant shadow for ~3-4 hours typically
        const shadowWidth = building.footprintWidth;
        const shadowSweptAngle = 2 * Math.atan(shadowWidth / (2 * avgShadowLength)) * 180 / Math.PI;
        const shadowDuration = Math.min(shadowSweptAngle / 15, 6); // Max 6 hours
        
        // Adjust for building orientation and red zone direction
        let adjustedShadowDuration = shadowDuration;
        if (calculations.redZoneDirection === 'south') {
            adjustedShadowDuration *= 1.2; // South-facing shadows are longer in northern hemisphere
        }
        
        const shadePercentage = adjustedShadowDuration / daylightHours;
        
        calculations.daylightHours = daylightHours;
        calculations.shadowDuration = adjustedShadowDuration;
        calculations.shadePercentage = shadePercentage;
        
        reasoning.push(`  Daily Daylight Hours (average): ${daylightHours}`);
        reasoning.push(`  Shadow Width: ${shadowWidth.toFixed(1)}m`);
        reasoning.push(`  Estimated Shadow Duration: ${adjustedShadowDuration.toFixed(1)} hours`);
        reasoning.push(`  Shade Coverage: ${(shadePercentage * 100).toFixed(1)}% of daylight`);
        reasoning.push(`  Maximum Allowed: ${(env.ethicsConstants.maxShadeImpact * 100)}%`);
        reasoning.push(`  [Citation: KEP §3.2, Shade Duration Calculation]`);
        reasoning.push("");

        // Step 4: Check Shade Impact Threshold
        reasoning.push("STEP 4: Ethical Shade Impact Assessment");
        
        if (adjacentToRedZone && shadePercentage > env.ethicsConstants.maxShadeImpact) {
            passed = false;
            status = 'NON-COMPLIANT';
            ethicalWarning = true;
            failureReasons.push(`Shade coverage ${(shadePercentage * 100).toFixed(1)}% exceeds ${(env.ethicsConstants.maxShadeImpact * 100)}% ethical limit`);
            reasoning.push(`  ❌ ETHICAL NON-COMPLIANCE`);
            reasoning.push(`  → Solar access vital for passive heating in low-income housing`);
            reasoning.push(`  → Health impacts: Reduced Vitamin D, increased heating costs`);
            
            requirements.push({
                parameter: "shade_coverage",
                current: `${(shadePercentage * 100).toFixed(1)}% of daylight hours`,
                required: `≤${(env.ethicsConstants.maxShadeImpact * 100)}%`,
                action: "Reduce building height or implement stepped massing on Red Zone side",
                citation: "KEP §4.1, Solar Access Rights"
            });
            
            // Calculate required height reduction
            const maxAllowedShadow = avgShadowLength * (env.ethicsConstants.maxShadeImpact / shadePercentage);
            const maxAllowedHeight = maxAllowedShadow * Math.tan(equinoxAltitude * Math.PI / 180);
            
            requirements.push({
                parameter: "building_height_for_ethics",
                current: `${h}m`,
                required: `≤${maxAllowedHeight.toFixed(1)}m on Red Zone side`,
                action: "Step back upper floors by 30% or reduce overall height",
                citation: "KEP §4.2"
            });
        } else if (adjacentToRedZone) {
            reasoning.push(`  ✓ ETHICAL COMPLIANCE: Shade impact within limits`);
        } else {
            reasoning.push(`  ✓ NOT APPLICABLE: Not adjacent to Red Zones`);
        }
        reasoning.push("");

        // Step 5: Water Displacement Analysis
        reasoning.push("STEP 5: Water Displacement Impact");
        
        const footprintArea = building.footprint_area;
        const localDrainageCapacity = 10000; // m² baseline
        const waterDisplacement = footprintArea / localDrainageCapacity;
        
        calculations.waterDisplacement = waterDisplacement;
        
        reasoning.push(`  Building Footprint: ${footprintArea.toLocaleString()} m²`);
        reasoning.push(`  Local Drainage Capacity: ${localDrainageCapacity.toLocaleString()} m²`);
        reasoning.push(`  Water Displacement Ratio: ${(waterDisplacement * 100).toFixed(1)}%`);
        reasoning.push(`  Maximum Allowed: ${(env.ethicsConstants.waterDisplacementLimit * 100)}%`);
        reasoning.push(`  [Citation: KEP §5.1, Stormwater Impact]`);
        
        if (adjacentToRedZone && waterDisplacement > env.ethicsConstants.waterDisplacementLimit) {
            passed = false;
            status = 'NON-COMPLIANT';
            ethicalWarning = true;
            failureReasons.push(`Water displacement ${(waterDisplacement * 100).toFixed(1)}% exceeds ${env.ethicsConstants.waterDisplacementLimit * 100}% limit`);
            reasoning.push(`  ❌ ETHICAL NON-COMPLIANCE: Flood risk to adjacent Red Zone`);
            
            requirements.push({
                parameter: "water_displacement",
                current: `${(waterDisplacement * 100).toFixed(1)}%`,
                required: `≤${(env.ethicsConstants.waterDisplacementLimit * 100)}%`,
                action: "Install on-site detention basin or permeable surfaces",
                citation: "KEP §5.2"
            });
        } else {
            reasoning.push(`  ✓ COMPLIANT: Water displacement within limits`);
        }
        reasoning.push("");

        // Step 6: Calculate Affected Population
        reasoning.push("STEP 6: Affected Population Estimation");
        
        const shadowArea = avgShadowLength * shadowWidth;
        const typicalLotSize = 300;
        const affectedLots = Math.ceil(shadowArea / typicalLotSize);
        const affectedResidents = affectedLots * 4;
        
        calculations.shadowArea = shadowArea;
        calculations.affectedResidents = affectedResidents;
        
        reasoning.push(`  Shadow Projection Area: ${shadowArea.toFixed(0)} m²`);
        reasoning.push(`  Estimated Affected Lots: ${affectedLots}`);
        reasoning.push(`  Estimated Affected Residents: ${affectedResidents}`);
        reasoning.push(`  [Citation: KEP §6.1]`);
        reasoning.push("");

        // Calculate score
        let score = 100;
        if (adjacentToRedZone) {
            if (shadePercentage > env.ethicsConstants.maxShadeImpact) {
                score -= 40 * (shadePercentage / env.ethicsConstants.maxShadeImpact);
            }
            if (waterDisplacement > env.ethicsConstants.waterDisplacementLimit) {
                score -= 30 * (waterDisplacement / env.ethicsConstants.waterDisplacementLimit);
            }
        }
        score = Math.max(0, Math.min(100, score));
        calculations.score = score;

        reasoning.push("═══ ETHICS AUDIT SUMMARY ═══");
        reasoning.push(`  Score: ${score.toFixed(1)}/100`);
        reasoning.push(`  Status: ${status}`);
        if (ethicalWarning) {
            reasoning.push(`  ⚠ ETHICAL NON-COMPLIANCE WARNING`);
        }
        if (!passed) {
            reasoning.push(`  Violations: ${failureReasons.join('; ')}`);
        }
        reasoning.push("");
        reasoning.push(`  "Architecture must serve all of humanity, not just those who can afford it."`);
        reasoning.push(`  — Krems Ethics Declaration, 2029`);

        return {
            auditName: this.name,
            auditCode: this.code,
            passed,
            status,
            score,
            failureReasons,
            calculations,
            requirements,
            reasoning: reasoning.join('\n'),
            ethicalWarning
        };
    }
};

export { EthicsAudit };
export default EthicsAudit;
