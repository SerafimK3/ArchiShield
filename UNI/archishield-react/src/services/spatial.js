// SpatialUtils - Geometric and spatial analysis helpers
export const SpatialUtils = {
    // Calculate Haversine distance between two points in meters
    getDistance(lat1, lon1, lat2, lon2) {
        const R = 6371e3;
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    },

    // Calculate minimum distance from a point to GeoJSON LineStrings
    getMinDistanceToLines(point, featureCollection) {
        let minDistance = Infinity;
        if (!featureCollection || !featureCollection.features) return minDistance;

        for (const feature of featureCollection.features) {
            if (feature.geometry.type === 'LineString') {
                for (const coord of feature.geometry.coordinates) {
                    const dist = this.getDistance(point.lat, point.lng, coord[1], coord[0]);
                    if (dist < minDistance) minDistance = dist;
                }
            }
        }
        return minDistance;
    },

    // Count features within a radius
    countFeaturesInRadius(point, features, radius) {
        let count = 0;
        const degRadius = radius / 111000;

        for (const feature of features) {
            let coords = null;
            if (feature.geometry.type === 'Point') coords = feature.geometry.coordinates;
            else if (feature.geometry.type === 'Polygon') coords = feature.geometry.coordinates[0][0];
            
            if (coords) {
                if (Math.abs(coords[1] - point.lat) > degRadius) continue;
                if (Math.abs(coords[0] - point.lng) > degRadius) continue;
                if (this.getDistance(point.lat, point.lng, coords[1], coords[0]) <= radius) {
                    count++;
                }
            }
        }
        return count;
    },

    // Check if point is inside a polygon
    isPointInPolygon(point, polygonCoords) {
        const x = point.lng, y = point.lat;
        let inside = false;
        const ring = polygonCoords[0];
        
        for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
            const xi = ring[i][0], yi = ring[i][1];
            const xj = ring[j][0], yj = ring[j][1];
            
            const intersect = ((yi > y) !== (yj > y)) &&
                (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    },

    // Get statistics for buildings within a radius
    getNeighborhoodStats(point, features, radius = 150) {
        const neighbors = [];
        const degRadius = radius / 111000;

        for (const feature of features) {
            let coords = null;
            if (feature.geometry.type === 'Point') coords = feature.geometry.coordinates;
            else if (feature.geometry.type === 'Polygon') coords = feature.geometry.coordinates[0][0];
            
            if (coords) {
                if (Math.abs(coords[1] - point.lat) > degRadius) continue;
                if (Math.abs(coords[0] - point.lng) > degRadius) continue;
                
                const dist = this.getDistance(point.lat, point.lng, coords[1], coords[0]);
                if (dist <= radius) {
                    neighbors.push({
                        height: feature.properties.height || 0,
                        distance: dist
                    });
                }
            }
        }

        if (neighbors.length === 0) return { avgHeight: 0, maxHeight: 0, count: 0 };

        const totalHeight = neighbors.reduce((sum, n) => sum + n.height, 0);
        const maxHeight = Math.max(...neighbors.map(n => n.height));
        
        return {
            avgHeight: Math.round(totalHeight / neighbors.length),
            maxHeight: Math.round(maxHeight),
            count: neighbors.length,
            neighbors: neighbors.sort((a, b) => a.distance - b.distance).slice(0, 10)
        };
    }
};

// Standalone function exports for direct import
export function getDistance(lat1, lon1, lat2, lon2) {
    return SpatialUtils.getDistance(lat1, lon1, lat2, lon2);
}

export function isPointInPolygon(point, polygonCoords) {
    // Handle both [lng, lat] array and {lat, lng} object formats
    if (Array.isArray(point)) {
        return SpatialUtils.isPointInPolygon({ lng: point[0], lat: point[1] }, [polygonCoords]);
    }
    return SpatialUtils.isPointInPolygon(point, [polygonCoords]);
}

export default SpatialUtils;
