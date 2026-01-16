/**
 * ArchiShield Alpha V2 - Building Data Validator
 * ===============================================
 * Enhanced schema with location, lot info, and setback distances
 */

const BuildingValidator = {
    // Required fields schema
    schema: {
        // Identity
        name: { type: 'string', required: true, minLength: 1 },
        
        // Location (for data layer lookup)
        latitude: { type: 'number', required: false, min: -90, max: 90, unit: '°', default: 42.6977 },
        longitude: { type: 'number', required: false, min: -180, max: 180, unit: '°', default: 23.3219 },
        
        // Physical Parameters
        height: { type: 'number', required: true, min: 1, max: 500, unit: 'meters' },
        floors: { type: 'number', required: false, min: 1, max: 200, unit: 'count' },
        footprint_area: { type: 'number', required: true, min: 10, max: 100000, unit: 'm²' },
        total_floor_area: { type: 'number', required: false, min: 10, max: 500000, unit: 'm²' },
        
        // Lot Information (for zoning)
        lot_area: { type: 'number', required: false, min: 50, max: 1000000, unit: 'm²' },
        property_line_north: { type: 'number', required: false, min: 0, max: 500, unit: 'meters' },
        property_line_south: { type: 'number', required: false, min: 0, max: 500, unit: 'meters' },
        property_line_east: { type: 'number', required: false, min: 0, max: 500, unit: 'meters' },
        property_line_west: { type: 'number', required: false, min: 0, max: 500, unit: 'meters' },
        
        // Ground Floor Elevation
        ground_floor_elevation: { type: 'number', required: false, min: -10, max: 50, unit: 'meters', default: 0 },
        
        // Structural
        material_density: { type: 'number', required: true, min: 100, max: 10000, unit: 'kg/m³' },
        foundation_depth: { type: 'number', required: true, min: 0.5, max: 50, unit: 'meters' },
        structural_system: { type: 'string', required: false, enum: ['moment_frame', 'shear_wall', 'braced_frame', 'dual_system', 'bearing_wall'] },
        ground_floor_material: { type: 'string', required: true, enum: ['reinforced_concrete', 'steel_frame', 'brick', 'timber', 'aerated_concrete'] },
        
        // Envelope (with orientation)
        window_to_wall_ratio: { type: 'number', required: true, min: 0, max: 1, unit: 'ratio' },
        wwr_north: { type: 'number', required: false, min: 0, max: 1, unit: 'ratio' },
        wwr_south: { type: 'number', required: false, min: 0, max: 1, unit: 'ratio' },
        wwr_east: { type: 'number', required: false, min: 0, max: 1, unit: 'ratio' },
        wwr_west: { type: 'number', required: false, min: 0, max: 1, unit: 'ratio' },
        
        // Thermal
        thermal_mass: { type: 'number', required: true, min: 100, max: 5000, unit: 'J/kg·K' },
        insulation_r_value: { type: 'number', required: true, min: 0.1, max: 20, unit: 'm²·K/W' },
        
        // Energy
        energy_autonomy_level: { type: 'number', required: true, min: 0, max: 100, unit: '%' },
        has_backup_power: { type: 'boolean', required: false },
        has_water_storage: { type: 'boolean', required: false },
        
        // Site Context
        adjacent_to_red_zone: { type: 'boolean', required: false },
        red_zone_direction: { type: 'string', required: false, enum: ['north', 'south', 'east', 'west', 'none'] },
        site_elevation: { type: 'number', required: false, min: 0, max: 3000, unit: 'meters' },
        flood_zone: { type: 'string', required: false, enum: ['Zone A', 'Zone AE', 'Zone X', 'Zone VE'] },
        
        // Roof
        roof_type: { type: 'string', required: false, enum: ['flat', 'pitched', 'green', 'cool'] },
        has_basement: { type: 'boolean', required: false },
        
        // Occupancy
        occupancy: { type: 'number', required: false, min: 1, max: 50000, unit: 'persons' },
        occupancy_type: { type: 'string', required: false, enum: ['residential', 'commercial', 'mixed', 'institutional'] }
    },

    /**
     * Validate building data against schema
     */
    validate(building) {
        const errors = [];
        const warnings = [];
        const sanitized = {};

        if (!building || typeof building !== 'object') {
            return {
                valid: false,
                errors: ['Building data must be a valid JSON object'],
                warnings: [],
                sanitized: null
            };
        }

        // Validate each field
        for (const [field, rules] of Object.entries(this.schema)) {
            const value = building[field];

            // Apply defaults for missing optional fields
            if ((value === undefined || value === null) && rules.default !== undefined) {
                sanitized[field] = rules.default;
                continue;
            }

            // Check required fields
            if (rules.required && (value === undefined || value === null || value === '')) {
                errors.push(`Missing required field: ${field}`);
                continue;
            }

            // Skip validation for optional empty fields
            if (!rules.required && (value === undefined || value === null)) {
                continue;
            }

            // Type validation
            if (rules.type === 'number') {
                const numValue = parseFloat(value);
                if (isNaN(numValue)) {
                    errors.push(`${field} must be a valid number`);
                    continue;
                }
                if (rules.min !== undefined && numValue < rules.min) {
                    errors.push(`${field} must be at least ${rules.min} ${rules.unit || ''}`);
                    continue;
                }
                if (rules.max !== undefined && numValue > rules.max) {
                    errors.push(`${field} must not exceed ${rules.max} ${rules.unit || ''}`);
                    continue;
                }
                sanitized[field] = numValue;
            } else if (rules.type === 'string') {
                if (typeof value !== 'string') {
                    errors.push(`${field} must be a string`);
                    continue;
                }
                const normalizedValue = value.toLowerCase().trim();
                if (rules.minLength && normalizedValue.length < rules.minLength) {
                    errors.push(`${field} must have at least ${rules.minLength} characters`);
                    continue;
                }
                if (rules.enum && !rules.enum.includes(normalizedValue)) {
                    errors.push(`${field} must be one of: ${rules.enum.join(', ')}`);
                    continue;
                }
                sanitized[field] = rules.enum ? normalizedValue : value.trim();
            } else if (rules.type === 'boolean') {
                sanitized[field] = Boolean(value);
            }
        }

        // Calculate derived properties
        if (sanitized.footprint_area && sanitized.height) {
            sanitized.floors = sanitized.floors || Math.ceil(sanitized.height / 3.5);
            sanitized.volume = sanitized.footprint_area * sanitized.height;
            sanitized.footprintWidth = Math.sqrt(sanitized.footprint_area);
            sanitized.surfaceArea = 2 * sanitized.footprint_area + 4 * sanitized.footprintWidth * sanitized.height;
            sanitized.wallArea = 4 * sanitized.footprintWidth * sanitized.height;
            sanitized.windowArea = sanitized.wallArea * (sanitized.window_to_wall_ratio || 0);
            
            // Calculate total floor area if not provided
            sanitized.total_floor_area = sanitized.total_floor_area || 
                (sanitized.footprint_area * sanitized.floors);
        }

        // Default lot area to 2x footprint if not provided
        if (!sanitized.lot_area && sanitized.footprint_area) {
            sanitized.lot_area = sanitized.footprint_area * 2;
            warnings.push('Lot area not provided, defaulting to 2× footprint area');
        }

        // Calculate FAR
        if (sanitized.total_floor_area && sanitized.lot_area) {
            sanitized.actualFAR = sanitized.total_floor_area / sanitized.lot_area;
        }

        // Default property line distances if not provided
        const defaultSetback = sanitized.height ? sanitized.height * 0.3 : 10;
        sanitized.property_line_north = sanitized.property_line_north ?? defaultSetback;
        sanitized.property_line_south = sanitized.property_line_south ?? defaultSetback;
        sanitized.property_line_east = sanitized.property_line_east ?? defaultSetback;
        sanitized.property_line_west = sanitized.property_line_west ?? defaultSetback;

        // WWR by orientation defaults
        if (sanitized.window_to_wall_ratio) {
            sanitized.wwr_north = sanitized.wwr_north ?? sanitized.window_to_wall_ratio;
            sanitized.wwr_south = sanitized.wwr_south ?? sanitized.window_to_wall_ratio;
            sanitized.wwr_east = sanitized.wwr_east ?? sanitized.window_to_wall_ratio;
            sanitized.wwr_west = sanitized.wwr_west ?? sanitized.window_to_wall_ratio;
        }

        // Other defaults
        sanitized.latitude = sanitized.latitude ?? 42.6977;
        sanitized.longitude = sanitized.longitude ?? 23.3219;
        sanitized.ground_floor_elevation = sanitized.ground_floor_elevation ?? 0;
        sanitized.has_basement = sanitized.has_basement ?? false;
        sanitized.has_backup_power = sanitized.has_backup_power ?? (sanitized.energy_autonomy_level >= 50);
        sanitized.has_water_storage = sanitized.has_water_storage ?? false;
        sanitized.adjacent_to_red_zone = sanitized.adjacent_to_red_zone ?? true;
        sanitized.red_zone_direction = sanitized.red_zone_direction ?? 'south';
        sanitized.site_elevation = sanitized.site_elevation ?? 550;
        sanitized.structural_system = sanitized.structural_system ?? 'moment_frame';
        sanitized.roof_type = sanitized.roof_type ?? 'flat';
        sanitized.flood_zone = sanitized.flood_zone ?? 'Zone AE';
        sanitized.occupancy_type = sanitized.occupancy_type ?? 'mixed';
        sanitized.initialInternalTemp = 24;

        // Generate warnings for suboptimal configurations
        if (sanitized.foundation_depth < 4) {
            warnings.push(`Foundation depth ${sanitized.foundation_depth}m below 4m may fail hydraulic audit`);
        }
        if (sanitized.window_to_wall_ratio > 0.4) {
            warnings.push(`High WWR ${(sanitized.window_to_wall_ratio * 100).toFixed(0)}% may exceed orientation limits`);
        }
        if (sanitized.actualFAR > 3.5) {
            warnings.push(`FAR ${sanitized.actualFAR.toFixed(2)} exceeds Sofia limit of 3.5`);
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings,
            sanitized: errors.length === 0 ? sanitized : null
        };
    },

    /**
     * Parse JSON string to building object
     */
    parseJSON(jsonString) {
        try {
            const parsed = JSON.parse(jsonString);
            return { success: true, data: parsed };
        } catch (e) {
            return { success: false, error: `Invalid JSON: ${e.message}` };
        }
    }
};

// Export for module systems
export { BuildingValidator };
export default BuildingValidator;
