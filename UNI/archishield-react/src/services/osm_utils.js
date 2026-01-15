/**
 * Utility to convert OSM JSON data from Overpass API to GeoJSON
 */

export function osmWaterToGeoJSON(osmData) {
    if (!osmData || !osmData.elements) {
        return { type: 'FeatureCollection', features: [] };
    }

    const nodes = {};
    const features = [];
    
    // Index all nodes by ID for fast lookup
    for (const element of osmData.elements) {
        if (element.type === 'node') {
            nodes[element.id] = [element.lon, element.lat];
        }
    }
    
    // Convert ways to GeoJSON features
    for (const element of osmData.elements) {
        if (element.type === 'way' && element.nodes) {
            // Map node IDs to coordinates
            const coordinates = element.nodes
                .map(nodeId => nodes[nodeId])
                .filter(coord => coord); // Filter out any nodes that weren't in the data
                
            if (coordinates.length > 1) {
                features.push({
                    type: 'Feature',
                    properties: { 
                        name: element.tags?.name || 'Waterway',
                        type: element.tags?.waterway || 'river',
                        osmId: element.id
                    },
                    geometry: { 
                        type: 'LineString', 
                        coordinates 
                    }
                });
            }
        }
    }
    
    return { type: 'FeatureCollection', features };
}
