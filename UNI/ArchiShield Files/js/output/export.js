/**
 * ArchiShield Alpha V2 - Export Module
 * =====================================
 * GeoJSON and DXF export for Revit/Rhino integration
 */

const ExportModule = {
    /**
     * Export building and audit data as GeoJSON
     */
    toGeoJSON(building, auditResult) {
        const lat = building.latitude;
        const lon = building.longitude;
        const halfWidth = (building.footprintWidth || Math.sqrt(building.footprint_area)) / 2;
        
        // Convert meters to approximate degrees
        const latDelta = (halfWidth / 111320);
        const lonDelta = (halfWidth / (111320 * Math.cos(lat * Math.PI / 180)));
        
        // Create rectangular footprint coordinates
        const coordinates = [[
            [lon - lonDelta, lat - latDelta],
            [lon + lonDelta, lat - latDelta],
            [lon + lonDelta, lat + latDelta],
            [lon - lonDelta, lat + latDelta],
            [lon - lonDelta, lat - latDelta]  // Close the polygon
        ]];

        // Build requirements summary
        const requirementsSummary = [];
        if (auditResult.allRequirements) {
            for (const req of auditResult.allRequirements) {
                requirementsSummary.push({
                    parameter: req.parameter,
                    current: req.current,
                    required: req.required
                });
            }
        }

        return {
            type: "FeatureCollection",
            name: "ArchiShield_Audit_Result",
            crs: {
                type: "name",
                properties: {
                    name: "urn:ogc:def:crs:OGC:1.3:CRS84"
                }
            },
            features: [
                {
                    type: "Feature",
                    properties: {
                        // Identity
                        id: `ARCH-${Date.now()}`,
                        name: building.name,
                        
                        // Geometry
                        height_m: building.height,
                        floors: building.floors,
                        footprint_area_m2: building.footprint_area,
                        ground_floor_elevation_m: building.ground_floor_elevation || 0,
                        
                        // Audit Results
                        permit_status: auditResult.status,
                        global_score: auditResult.globalScore,
                        audit_hash: auditResult.certificate?.json?.auditHash || null,
                        
                        // Individual Audit Scores
                        score_seismic: auditResult.auditResults?.seismic?.score || null,
                        score_wind: auditResult.auditResults?.wind?.score || null,
                        score_hydraulic: auditResult.auditResults?.hydraulic?.score || null,
                        score_thermal: auditResult.auditResults?.thermal?.score || null,
                        score_zoning: auditResult.auditResults?.zoning?.score || null,
                        score_ethics: auditResult.auditResults?.ethics?.score || null,
                        
                        // Zoning
                        lot_area_m2: building.lot_area,
                        actual_FAR: building.actualFAR,
                        max_FAR: 3.5,
                        
                        // Requirements
                        requirements: requirementsSummary,
                        
                        // Metadata
                        audit_date: new Date().toISOString(),
                        engine_version: "ArchiShield-Alpha-V2.0",
                        regulatory_framework: "Sofia Urban Code 2036"
                    },
                    geometry: {
                        type: "Polygon",
                        coordinates: coordinates
                    }
                },
                // Add setback zone as separate feature
                {
                    type: "Feature",
                    properties: {
                        type: "setback_zone",
                        required_setback_m: Math.max(0.3 * building.height, 3.0)
                    },
                    geometry: {
                        type: "Polygon",
                        coordinates: [[
                            [lon - lonDelta * 1.5, lat - latDelta * 1.5],
                            [lon + lonDelta * 1.5, lat - latDelta * 1.5],
                            [lon + lonDelta * 1.5, lat + latDelta * 1.5],
                            [lon - lonDelta * 1.5, lat + latDelta * 1.5],
                            [lon - lonDelta * 1.5, lat - latDelta * 1.5]
                        ]]
                    }
                }
            ]
        };
    },

    /**
     * Export building as DXF string (simplified format)
     * Compatible with Revit/Rhino import
     */
    toDXF(building, auditResult) {
        const halfWidth = (building.footprintWidth || Math.sqrt(building.footprint_area)) / 2;
        const height = building.height;
        const requiredSetback = Math.max(0.3 * height, 3.0);
        
        // DXF header
        let dxf = `0
SECTION
2
HEADER
9
$ACADVER
1
AC1015
9
$INSBASE
10
0.0
20
0.0
30
0.0
9
$EXTMIN
10
${-halfWidth - requiredSetback}
20
${-halfWidth - requiredSetback}
30
0.0
9
$EXTMAX
10
${halfWidth + requiredSetback}
20
${halfWidth + requiredSetback}
30
${height}
0
ENDSEC
0
SECTION
2
TABLES
0
ENDSEC
0
SECTION
2
BLOCKS
0
ENDSEC
0
SECTION
2
ENTITIES
`;

        // Building footprint (POLYLINE)
        dxf += this._createPolyline([
            [-halfWidth, -halfWidth, 0],
            [halfWidth, -halfWidth, 0],
            [halfWidth, halfWidth, 0],
            [-halfWidth, halfWidth, 0],
            [-halfWidth, -halfWidth, 0]
        ], 'BUILDING_FOOTPRINT', 7);

        // Building extrusion (3DFACE for top)
        dxf += this._create3DFace([
            [-halfWidth, -halfWidth, height],
            [halfWidth, -halfWidth, height],
            [halfWidth, halfWidth, height],
            [-halfWidth, halfWidth, height]
        ], 'BUILDING_TOP', 5);

        // Setback zone (POLYLINE, dashed)
        const setback = requiredSetback;
        dxf += this._createPolyline([
            [-halfWidth - setback, -halfWidth - setback, 0],
            [halfWidth + setback, -halfWidth - setback, 0],
            [halfWidth + setback, halfWidth + setback, 0],
            [-halfWidth - setback, halfWidth + setback, 0],
            [-halfWidth - setback, -halfWidth - setback, 0]
        ], 'SETBACK_ZONE', 3);

        // Property boundary (outer)
        const lotHalf = Math.sqrt(building.lot_area) / 2;
        dxf += this._createPolyline([
            [-lotHalf, -lotHalf, 0],
            [lotHalf, -lotHalf, 0],
            [lotHalf, lotHalf, 0],
            [-lotHalf, lotHalf, 0],
            [-lotHalf, -lotHalf, 0]
        ], 'PROPERTY_BOUNDARY', 1);

        // Add text annotation
        const status = auditResult.status || 'PENDING';
        dxf += this._createText(
            0, -lotHalf - 5, 0,
            `ArchiShield Audit: ${status}`,
            2.5,
            'ANNOTATION'
        );

        dxf += this._createText(
            0, -lotHalf - 10, 0,
            `Score: ${(auditResult.globalScore || 0).toFixed(1)}/100`,
            2.0,
            'ANNOTATION'
        );

        // Close DXF
        dxf += `0
ENDSEC
0
EOF
`;

        return dxf;
    },

    /**
     * Create DXF POLYLINE entity
     */
    _createPolyline(points, layer, color) {
        let entity = `0
POLYLINE
8
${layer}
62
${color}
66
1
10
0.0
20
0.0
30
0.0
70
1
`;
        for (const [x, y, z] of points) {
            entity += `0
VERTEX
8
${layer}
10
${x.toFixed(4)}
20
${y.toFixed(4)}
30
${z.toFixed(4)}
`;
        }
        entity += `0
SEQEND
8
${layer}
`;
        return entity;
    },

    /**
     * Create DXF 3DFACE entity
     */
    _create3DFace(corners, layer, color) {
        const [p1, p2, p3, p4] = corners;
        return `0
3DFACE
8
${layer}
62
${color}
10
${p1[0].toFixed(4)}
20
${p1[1].toFixed(4)}
30
${p1[2].toFixed(4)}
11
${p2[0].toFixed(4)}
21
${p2[1].toFixed(4)}
31
${p2[2].toFixed(4)}
12
${p3[0].toFixed(4)}
22
${p3[1].toFixed(4)}
32
${p3[2].toFixed(4)}
13
${p4[0].toFixed(4)}
23
${p4[1].toFixed(4)}
33
${p4[2].toFixed(4)}
`;
    },

    /**
     * Create DXF TEXT entity
     */
    _createText(x, y, z, text, height, layer) {
        return `0
TEXT
8
${layer}
10
${x.toFixed(4)}
20
${y.toFixed(4)}
30
${z.toFixed(4)}
40
${height.toFixed(4)}
1
${text}
`;
    },

    /**
     * Export full audit report as JSON
     */
    toAuditJSON(building, auditResult) {
        return {
            exportVersion: "2.0",
            exportDate: new Date().toISOString(),
            engineVersion: "ArchiShield-Alpha-V2.0",
            
            building: {
                name: building.name,
                location: {
                    latitude: building.latitude,
                    longitude: building.longitude,
                    elevation: building.site_elevation
                },
                geometry: {
                    height: building.height,
                    floors: building.floors,
                    footprintArea: building.footprint_area,
                    totalFloorArea: building.total_floor_area,
                    volume: building.volume
                },
                structure: {
                    materialDensity: building.material_density,
                    foundationDepth: building.foundation_depth,
                    groundFloorMaterial: building.ground_floor_material,
                    structuralSystem: building.structural_system
                },
                envelope: {
                    wwrNorth: building.wwr_north,
                    wwrSouth: building.wwr_south,
                    wwrEast: building.wwr_east,
                    wwrWest: building.wwr_west,
                    insulationRValue: building.insulation_r_value,
                    thermalMass: building.thermal_mass
                },
                site: {
                    lotArea: building.lot_area,
                    actualFAR: building.actualFAR,
                    setbacks: {
                        north: building.property_line_north,
                        south: building.property_line_south,
                        east: building.property_line_east,
                        west: building.property_line_west
                    }
                }
            },
            
            audit: {
                status: auditResult.status,
                globalScore: auditResult.globalScore,
                hash: auditResult.certificate?.json?.auditHash,
                
                results: Object.fromEntries(
                    Object.entries(auditResult.auditResults || {}).map(([key, value]) => [
                        key,
                        {
                            name: value.auditName,
                            code: value.auditCode,
                            passed: value.passed,
                            status: value.status,
                            score: value.score,
                            failureReasons: value.failureReasons
                        }
                    ])
                ),
                
                requirements: auditResult.allRequirements || [],
                
                remediations: auditResult.remediations || null
            },
            
            regulatory: {
                authority: "Sofia City Council - Urban Resilience Division",
                framework: "Sofia Urban Code 2036",
                standardVersion: "ArchiShield-BG-2036-v2.0",
                validityPeriod: 5
            }
        };
    }
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExportModule;
}
