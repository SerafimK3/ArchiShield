// AuditForm Component - Simple mode form for building input
import { useState } from 'react';
import './AuditForm.css';

export function AuditForm({ onSubmit, isLoading }) {
    const [building, setBuilding] = useState({
        name: 'My Building',
        height: 30,
        floors: 10,
        footprint_area: 1500,
        lot_area: 3000,
        ground_floor_material: 'reinforced_concrete',
        structural_system: 'dual_system',
        foundation_depth: 5,
        window_to_wall_ratio: 0.35,
        latitude: 48.2082,
        longitude: 16.3738,
        material_density: 2400,
        thermal_mass: 850,
        insulation_r_value: 6.0,
        energy_autonomy_level: 60,
        occupancy: 200
    });

    const handleChange = (field, value) => {
        setBuilding(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(building);
    };

    const updateLocation = (lat, lng) => {
        setBuilding(prev => ({ ...prev, latitude: lat, longitude: lng }));
    };

    // Expose updateLocation for map clicks
    if (window) window.updateBuildingLocation = updateLocation;

    return (
        <form className="audit-form" onSubmit={handleSubmit}>
            <div className="form-section">
                <h3>📋 Building Details</h3>
                
                <div className="form-grid">
                    <div className="form-field full-width">
                        <label>Building Name</label>
                        <input 
                            type="text" 
                            value={building.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                        />
                    </div>

                    <div className="form-field">
                        <label>Height (m)</label>
                        <input 
                            type="number" 
                            value={building.height}
                            onChange={(e) => handleChange('height', parseInt(e.target.value))}
                        />
                    </div>

                    <div className="form-field">
                        <label>Floors</label>
                        <input 
                            type="number" 
                            value={building.floors}
                            onChange={(e) => handleChange('floors', parseInt(e.target.value))}
                        />
                    </div>

                    <div className="form-field">
                        <label>Footprint (m²)</label>
                        <input 
                            type="number" 
                            value={building.footprint_area}
                            onChange={(e) => handleChange('footprint_area', parseInt(e.target.value))}
                        />
                    </div>

                    <div className="form-field">
                        <label>Lot Area (m²)</label>
                        <input 
                            type="number" 
                            value={building.lot_area}
                            onChange={(e) => handleChange('lot_area', parseInt(e.target.value))}
                        />
                    </div>

                    <div className="form-field">
                        <label>Material</label>
                        <select 
                            value={building.ground_floor_material}
                            onChange={(e) => handleChange('ground_floor_material', e.target.value)}
                        >
                            <option value="reinforced_concrete">Reinforced Concrete</option>
                            <option value="steel">Steel Frame</option>
                            <option value="timber">Timber / CLT</option>
                            <option value="masonry">Masonry / Brick</option>
                            <option value="green_facade">Green Facade</option>
                        </select>
                    </div>

                    <div className="form-field">
                        <label>Structure</label>
                        <select 
                            value={building.structural_system}
                            onChange={(e) => handleChange('structural_system', e.target.value)}
                        >
                            <option value="dual_system">Dual System (Best)</option>
                            <option value="moment_frame">Moment Frame</option>
                            <option value="shear_wall">Shear Wall</option>
                            <option value="bearing_wall">Bearing Wall</option>
                        </select>
                    </div>

                    <div className="form-field">
                        <label>Foundation (m)</label>
                        <input 
                            type="number" 
                            value={building.foundation_depth}
                            step="0.5"
                            onChange={(e) => handleChange('foundation_depth', parseFloat(e.target.value))}
                        />
                    </div>

                    <div className="form-field">
                        <label>WWR (%)</label>
                        <input 
                            type="number" 
                            value={building.window_to_wall_ratio * 100}
                            min="0" max="100"
                            onChange={(e) => handleChange('window_to_wall_ratio', parseInt(e.target.value) / 100)}
                        />
                    </div>
                </div>
            </div>

            <div className="form-section location-section">
                <h3>📍 Location</h3>
                <p className="location-hint">Click on the map to set building location</p>
                <div className="location-display">
                    <span>Lat: {building.latitude.toFixed(4)}</span>
                    <span>Lng: {building.longitude.toFixed(4)}</span>
                </div>
            </div>

            <button 
                type="submit" 
                className="submit-btn"
                disabled={isLoading}
            >
                {isLoading ? '⏳ Running Audit...' : '🚀 Run Audit'}
            </button>
        </form>
    );
}

export default AuditForm;
