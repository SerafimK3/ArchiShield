// Map Component - MapLibre GL integration for Vienna with 3D Buildings
import { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import './Map.css';

// Import the filtered building data
import buildingsData from '../../data/vienna_buildings.json';
import waterData from '../../data/vienna_water.json';
import { osmWaterToGeoJSON } from '../../services/osm_utils';

export function Map({ onLocationSelect, onBuildingSelect, envelopeData }) {
    const mapContainer = useRef(null);
    const mapRef = useRef(null);
    const markerRef = useRef(null);
    const [coords, setCoords] = useState({ lat: 48.2082, lng: 16.3738 });
    const [show3D, setShow3D] = useState(true);
    const [showWaterways, setShowWaterways] = useState(true);
    const [showGeo, setShowGeo] = useState(false);
    const [showEnvelope, setShowEnvelope] = useState(true);
    const [hoveredBuilding, setHoveredBuilding] = useState(null);
    
    // Use refs for callbacks to prevent map re-initialization on parent re-renders
    const onLocationSelectRef = useRef(onLocationSelect);
    const onBuildingSelectRef = useRef(onBuildingSelect);
    
    // Keep refs updated with latest callbacks
    useEffect(() => {
        onLocationSelectRef.current = onLocationSelect;
        onBuildingSelectRef.current = onBuildingSelect;
    }, [onLocationSelect, onBuildingSelect]);

    // Create a custom marker element
    const createMarkerElement = () => {
        const el = document.createElement('div');
        el.className = 'custom-map-marker';
        el.innerHTML = `
            <div class="marker-pin">
                <div class="marker-pulse"></div>
            </div>
        `;
        return el;
    };

    // Toggle 3D buildings visibility
    const toggle3D = useCallback(() => {
        setShow3D(prev => {
            const newState = !prev;
            if (mapRef.current && mapRef.current.getLayer('3d-buildings')) {
                mapRef.current.setLayoutProperty(
                    '3d-buildings',
                    'visibility',
                    newState ? 'visible' : 'none'
                );
            }
            return newState;
        });
    }, []);

    // Toggle Danube waterways visibility
    const toggleWaterways = useCallback(() => {
        setShowWaterways(prev => {
            const newState = !prev;
            if (mapRef.current) {
                ['danube-glow', 'danube-lines', 'danube-flood-buffer'].forEach(layerId => {
                    if (mapRef.current.getLayer(layerId)) {
                        mapRef.current.setLayoutProperty(
                            layerId,
                            'visibility',
                            newState ? 'visible' : 'none'
                        );
                    }
                });
            }
            return newState;
        });
    }, []);

    // Toggle Geological layers
    const toggleGeo = useCallback(() => {
        setShowGeo(prev => {
            const newState = !prev;
            if (mapRef.current) {
                ['geology-fill', 'fault-line', 'fault-glow'].forEach(layerId => {
                    if (mapRef.current.getLayer(layerId)) {
                        mapRef.current.setLayoutProperty(
                            layerId,
                            'visibility',
                            newState ? 'visible' : 'none'
                        );
                    }
                });
            }
            return newState;
        });
    }, []);

    // Toggle Envelope visibility
    const toggleEnvelope = useCallback(() => {
        setShowEnvelope(prev => {
            const newState = !prev;
            if (mapRef.current && mapRef.current.getLayer('ghost-envelope')) {
                mapRef.current.setLayoutProperty(
                    'ghost-envelope',
                    'visibility',
                    newState ? 'visible' : 'none'
                );
            }
            return newState;
        });
    }, []);

    // Update envelope layer when envelopeData changes
    useEffect(() => {
        if (!mapRef.current || !envelopeData) return;
        
        const map = mapRef.current;
        
        // Create envelope polygon (rectangle around the click point)
        const { lat, lng, height, offset = 0.0003, isOverLimit, rotation = 0 } = envelopeData;
        
        // Color changes based on whether height exceeds limit
        const envelopeColor = isOverLimit ? '#ff4757' : '#00ff88';
        const envelopeOpacity = isOverLimit ? 0.35 : 0.25;
        
        // Rotate a point around the center
        const rotatePoint = (x, y, centerX, centerY, angleDeg) => {
            const angleRad = (angleDeg * Math.PI) / 180;
            const cos = Math.cos(angleRad);
            const sin = Math.sin(angleRad);
            const dx = x - centerX;
            const dy = y - centerY;
            return [
                centerX + dx * cos - dy * sin,
                centerY + dx * sin + dy * cos
            ];
        };
        
        // Define corners before rotation
        const corners = [
            [lng - offset, lat - offset],
            [lng + offset, lat - offset],
            [lng + offset, lat + offset],
            [lng - offset, lat + offset]
        ];
        
        // Apply rotation to each corner
        const rotatedCorners = corners.map(([x, y]) => 
            rotatePoint(x, y, lng, lat, rotation)
        );
        
        // Close the polygon
        rotatedCorners.push(rotatedCorners[0]);
        
        const envelopeGeoJSON = {
            type: 'FeatureCollection',
            features: [{
                type: 'Feature',
                properties: { height },
                geometry: {
                    type: 'Polygon',
                    coordinates: [rotatedCorners]
                }
            }]
        };
        
        // Update or add the envelope source/layer
        if (map.getSource('envelope-source')) {
            map.getSource('envelope-source').setData(envelopeGeoJSON);
            // Update colors dynamically
            map.setPaintProperty('ghost-envelope', 'fill-extrusion-color', envelopeColor);
            map.setPaintProperty('ghost-envelope', 'fill-extrusion-opacity', envelopeOpacity);
            map.setPaintProperty('ghost-envelope-outline', 'line-color', envelopeColor);
        } else {
            map.addSource('envelope-source', {
                type: 'geojson',
                data: envelopeGeoJSON
            });
            
            map.addLayer({
                id: 'ghost-envelope',
                type: 'fill-extrusion',
                source: 'envelope-source',
                paint: {
                    'fill-extrusion-color': envelopeColor,
                    'fill-extrusion-height': ['get', 'height'],
                    'fill-extrusion-base': 0,
                    'fill-extrusion-opacity': envelopeOpacity
                }
            });
            
            // Add envelope outline for better visibility
            map.addLayer({
                id: 'ghost-envelope-outline',
                type: 'line',
                source: 'envelope-source',
                paint: {
                    'line-color': envelopeColor,
                    'line-width': 2,
                    'line-opacity': 0.8
                }
            });
        }
    }, [envelopeData]);

    useEffect(() => {
        if (mapRef.current) return;

        const map = new maplibregl.Map({
            container: mapContainer.current,
            style: {
                version: 8,
                sources: {
                    'carto-dark': {
                        type: 'raster',
                        tiles: ['https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png'],
                        tileSize: 256
                    }
                },
                layers: [{
                    id: 'carto-dark-layer',
                    type: 'raster',
                    source: 'carto-dark'
                }]
            },
            center: [16.3738, 48.2082],
            zoom: 14,
            pitch: 45,
            bearing: -17.6,
            minZoom: 10,
            maxBounds: [[15.8, 47.9], [16.9, 48.5]]
        });

        map.addControl(new maplibregl.NavigationControl(), 'top-right');

        map.on('load', () => {
            // Add buildings source
            map.addSource('buildings', {
                type: 'geojson',
                data: buildingsData
            });

            // Add 3D building layer
            map.addLayer({
                id: '3d-buildings',
                type: 'fill-extrusion',
                source: 'buildings',
                paint: {
                    'fill-extrusion-color': [
                        'interpolate',
                        ['linear'],
                        ['get', 'height'],
                        0, '#1a1a2e',
                        10, '#16213e',
                        30, '#0f3460',
                        50, '#533483',
                        100, '#e94560'
                    ],
                    'fill-extrusion-height': ['get', 'height'],
                    'fill-extrusion-base': 0,
                    'fill-extrusion-opacity': 0.85
                }
            });

            // Add building outlines for better definition
            map.addLayer({
                id: 'building-outlines',
                type: 'line',
                source: 'buildings',
                paint: {
                    'line-color': '#00ff41',
                    'line-width': 0.5,
                    'line-opacity': 0.3
                }
            });

            // Real Danube Waterways from OSM data
            const waterGeoJSON = osmWaterToGeoJSON(waterData);

            map.addSource('danube-waterways', {
                type: 'geojson',
                data: waterGeoJSON
            });

            // 1. Flood Risk Buffer (Wide, blurred area simulating HQ100)
            map.addLayer({
                id: 'danube-flood-buffer',
                type: 'line',
                source: 'danube-waterways',
                layout: {
                    'visibility': showWaterways ? 'visible' : 'none',
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                paint: {
                    'line-color': '#00d4ff',
                    'line-width': [
                        'interpolate', ['exponential', 2], ['zoom'],
                        10, 30,    // Wider at low zoom
                        14, 180,   // Much wider at mid zoom
                        18, 1000   // Very wide at high zoom
                    ],
                    'line-opacity': 0.25, // Increased opacity from 0.12
                    'line-blur': [
                        'interpolate', ['linear'], ['zoom'],
                        10, 10,
                        14, 40,
                        18, 150
                    ]
                }
            });

            // 2. Danube water glow (mid-width, for better line definition)
            map.addLayer({
                id: 'danube-glow',
                type: 'line',
                source: 'danube-waterways',
                layout: {
                    'visibility': showWaterways ? 'visible' : 'none'
                },
                paint: {
                    'line-color': '#00d4ff',
                    'line-width': 12,
                    'line-opacity': 0.45,
                    'line-blur': 6
                }
            });

            // 3. Danube main center-line
            map.addLayer({
                id: 'danube-lines',
                type: 'line',
                source: 'danube-waterways',
                layout: {
                    'visibility': showWaterways ? 'visible' : 'none'
                },
                paint: {
                    'line-color': '#00d4ff',
                    'line-width': 1.5,
                    'line-opacity': 0.9
                }
            });

            // GEOLOGICAL DATA (Bedrock vs Sediment)
            const geoZones = {
                type: 'FeatureCollection',
                features: [
                    {
                        type: 'Feature',
                        properties: { zone: 'Flysch (Bedrock)', color: '#8b5cf6' },
                        geometry: {
                            type: 'Polygon',
                            coordinates: [[[15.8, 48.5], [16.35, 48.5], [16.35, 47.9], [15.8, 47.9], [15.8, 48.5]]]
                        }
                    },
                    {
                        type: 'Feature',
                        properties: { zone: 'Vienna Basin (Sediment)', color: '#ffaa00' },
                        geometry: {
                            type: 'Polygon',
                            coordinates: [[[16.35, 48.5], [16.9, 48.5], [16.9, 47.9], [16.35, 47.9], [16.35, 48.5]]]
                        }
                    }
                ]
            };

            const faultLine = {
                type: 'Feature',
                geometry: {
                    type: 'LineString',
                    coordinates: [[16.35, 48.5], [16.35, 47.9]]
                }
            };

            map.addSource('geology', { type: 'geojson', data: geoZones });
            map.addSource('fault', { type: 'geojson', data: faultLine });

            // Geology Fill Layer
            map.addLayer({
                id: 'geology-fill',
                type: 'fill',
                source: 'geology',
                layout: { 'visibility': showGeo ? 'visible' : 'none' },
                paint: {
                    'fill-color': ['get', 'color'],
                    'fill-opacity': 0.08
                }
            }, 'danube-flood-buffer');

            // Fault Glow
            map.addLayer({
                id: 'fault-glow',
                type: 'line',
                source: 'fault',
                layout: { 'visibility': showGeo ? 'visible' : 'none' },
                paint: {
                    'line-color': '#ffaa00',
                    'line-width': 10,
                    'line-opacity': 0.3,
                    'line-blur': 5
                }
            });

            // Fault Line
            map.addLayer({
                id: 'fault-line',
                type: 'line',
                source: 'fault',
                layout: { 'visibility': showGeo ? 'visible' : 'none' },
                paint: {
                    'line-color': '#ffaa00',
                    'line-width': 2,
                    'line-dasharray': [2, 2]
                }
            });



            // Hover effect
            map.on('mousemove', '3d-buildings', (e) => {
                if (e.features.length > 0) {
                    map.getCanvas().style.cursor = 'pointer';
                    const feature = e.features[0];
                    setHoveredBuilding({
                        name: feature.properties.name || 'Building',
                        height: feature.properties.height,
                        levels: feature.properties.levels,
                        type: feature.properties.type
                    });
                }
            });

            map.on('mouseleave', '3d-buildings', () => {
                map.getCanvas().style.cursor = '';
                setHoveredBuilding(null);
            });

            // Click on building to select it
            map.on('click', '3d-buildings', (e) => {
                if (e.features.length > 0) {
                    const feature = e.features[0];
                    const coords = e.lngLat;
                    
                    // Notify parent about selected building
                    if (onBuildingSelectRef.current) {
                        onBuildingSelectRef.current({
                            lat: coords.lat,
                            lng: coords.lng,
                            height: feature.properties.height,
                            levels: feature.properties.levels,
                            type: feature.properties.type,
                            name: feature.properties.name
                        });
                    }

                    // Also update location
                    if (onLocationSelectRef.current) {
                        onLocationSelectRef.current(coords.lat, coords.lng);
                    }
                    setCoords({ lat: coords.lat, lng: coords.lng });

                    // Update marker
                    if (markerRef.current) {
                        markerRef.current.setLngLat([coords.lng, coords.lat]);
                    } else {
                        markerRef.current = new maplibregl.Marker({
                            element: createMarkerElement(),
                            anchor: 'bottom'
                        })
                        .setLngLat([coords.lng, coords.lat])
                        .addTo(map);
                    }

                    e.preventDefault();
                }
            });
        });

        // Click handler for placing building (on empty areas)
        map.on('click', (e) => {
            // Skip if click was on a building (handled above)
            const features = map.queryRenderedFeatures(e.point, { layers: ['3d-buildings'] });
            if (features.length > 0) return;

            const { lng, lat } = e.lngLat;
            setCoords({ lat, lng });
            
            // Update marker
            if (markerRef.current) {
                markerRef.current.setLngLat([lng, lat]);
            } else {
                markerRef.current = new maplibregl.Marker({
                    element: createMarkerElement(),
                    anchor: 'bottom'
                })
                .setLngLat([lng, lat])
                .addTo(map);
            }

            // Notify parent
            if (onLocationSelectRef.current) {
                onLocationSelectRef.current(lat, lng);
            }
        });

        mapRef.current = map;

        return () => {
            map.remove();
            mapRef.current = null;
        };
    }, []); // Empty deps - map should only initialize once

    return (
        <div className="map-wrapper">
            <div ref={mapContainer} className="map-container" />
            
            {/* 3D Toggle Button */}
            <button 
                className={`map-toggle-3d ${show3D ? 'active' : ''}`}
                onClick={toggle3D}
                title={show3D ? 'Hide 3D Buildings' : 'Show 3D Buildings'}
            >
                🏗️ 3D
            </button>

            {/* Waterways Toggle Button */}
            <button 
                className={`map-toggle-water ${showWaterways ? 'active' : ''}`}
                onClick={toggleWaterways}
                title={showWaterways ? 'Hide Danube' : 'Show Danube'}
            >
                🌊 Donau
            </button>
            
            {/* NEW Geology Toggle Button */}
            <button 
                className={`map-toggle-geo ${showGeo ? 'active' : ''}`}
                onClick={toggleGeo}
                title={showGeo ? 'Hide Geological Risk' : 'Show Geological Risk'}
            >
                🔭 GEO
            </button>
            
            {/* Envelope Toggle Button */}
            {envelopeData && (
                <button 
                    className={`map-toggle-envelope ${showEnvelope ? 'active' : ''}`}
                    onClick={toggleEnvelope}
                    title={showEnvelope ? 'Hide Max Envelope' : 'Show Max Envelope'}
                >
                    📐 MAX
                </button>
            )}

            {/* Hover Tooltip */}
            {hoveredBuilding && (
                <div className="map-building-tooltip">
                    <strong>{hoveredBuilding.name}</strong>
                    <span>Height: {hoveredBuilding.height?.toFixed(1)}m</span>
                    <span>Floors: {hoveredBuilding.levels}</span>
                    <span>Type: {hoveredBuilding.type}</span>
                </div>
            )}

            <div className="map-coords">
                📍 {coords.lat.toFixed(4)}° N, {coords.lng.toFixed(4)}° E
            </div>
            <div className="map-hint">Click building to select • Click empty to place new</div>
        </div>
    );
}

export default Map;
