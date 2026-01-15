/**
 * MapLayerToggles - Floating Layer Controls
 * ==========================================
 * Glassmorphism toggle cards for map layers
 */
import React, { useState } from 'react';
import './MapLayerToggles.css';

const layers = [
    {
        id: 'land-use',
        icon: '🏙️',
        title: 'Land Use Zones',
        description: 'Data layers serve important standardized data on zoning layers in 5km border radius.',
        color: '#00d4ff'
    },
    {
        id: 'transit',
        icon: '🚇',
        title: 'Public Transit Network',
        description: 'Public transport routes and accessibility within the area.',
        color: '#00ff88'
    },
    {
        id: 'environmental',
        icon: '🌡️',
        title: 'Environmental Sensors',
        description: 'Environmental sensors can be integrated/merged data open API data layers in 5km border radius.',
        color: '#ffaa00'
    }
];

export function MapLayerToggles({ onLayerToggle }) {
    const [activeLayers, setActiveLayers] = useState(['land-use']);

    const toggleLayer = (layerId) => {
        setActiveLayers(prev => {
            const newLayers = prev.includes(layerId)
                ? prev.filter(id => id !== layerId)
                : [...prev, layerId];
            
            if (onLayerToggle) {
                onLayerToggle(layerId, !prev.includes(layerId));
            }
            return newLayers;
        });
    };

    return (
        <div className="map-layer-toggles">
            {layers.map((layer) => (
                <button
                    key={layer.id}
                    className={`layer-toggle ${activeLayers.includes(layer.id) ? 'active' : ''}`}
                    onClick={() => toggleLayer(layer.id)}
                    style={{ '--layer-color': layer.color }}
                >
                    <div className="toggle-indicator">
                        <span className="toggle-dot"></span>
                    </div>
                    <div className="toggle-content">
                        <div className="toggle-header">
                            <span className="toggle-icon">{layer.icon}</span>
                            <span className="toggle-title">{layer.title}</span>
                        </div>
                        <p className="toggle-description">{layer.description}</p>
                    </div>
                    <button className="toggle-menu">•••</button>
                </button>
            ))}
        </div>
    );
}

export default MapLayerToggles;
