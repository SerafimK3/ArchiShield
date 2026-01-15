/**
 * spatial_utils.js
 * Geometric and spatial analysis helpers for ArchiShield Pro Audits.
 */

const SpatialUtils = {
    
    /**
     * Calculate Haversine distance between two points in meters.
     * @param {number} lat1 
     * @param {number} lon1 
     * @param {number} lat2 
     * @param {number} lon2 
     * @return {number} Distance in meters
     */
    getDistance(lat1, lon1, lat2, lon2) {
        const R = 6371e3; // Earth radius in meters
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

    /**
     * Calculate minimum distance from a point to a GeoJSON Feature Collection of LineStrings (e.g., River).
     * @param {Object} point {lat, lng}
     * @param {Object} featureCollection GeoJSON FeatureCollection
     * @return {number} Minimum distance in meters
     */
    getMinDistanceToLines(point, featureCollection) {
        let minDistance = Infinity;

        if (!featureCollection || !featureCollection.features) return minDistance;

        for (const feature of featureCollection.features) {
            if (feature.geometry.type === 'LineString') {
                for (const coord of feature.geometry.coordinates) {
                    // coord is [lon, lat]
                    const dist = this.getDistance(point.lat, point.lng, coord[1], coord[0]);
                    if (dist < minDistance) minDistance = dist;
                }
            }
        }
        return minDistance;
    },

    /**
     * Count features within a radius.
     * @param {Object} point {lat, lng}
     * @param {Array} features Array of GeoJSON features (e.g. MapLibre query results)
     * @param {number} radius Meters
     * @return {number} Count
     */
    countFeaturesInRadius(point, features, radius) {
        // Optimized: Uses bounding box check before heavy Haversine, but strict check is fine for <1000 items
        let count = 0;
        // Simple approximation: 1 degree latitude ~ 111km
        const degRadius = radius / 111000; 

        for (const feature of features) {
            // Assume Point features or use first coord of Polygon
            let coords = null;
            if (feature.geometry.type === 'Point') coords = feature.geometry.coordinates;
            else if (feature.geometry.type === 'Polygon') coords = feature.geometry.coordinates[0][0];
            
            if (coords) {
                // Quick Box Check
                if (Math.abs(coords[1] - point.lat) > degRadius) continue;
                if (Math.abs(coords[0] - point.lng) > degRadius) continue;

                if (this.getDistance(point.lat, point.lng, coords[1], coords[0]) <= radius) {
                    count++;
                }
            }
        }
        return count;
    },

    /**
     * Check if point is inside a polygon (Ray casting algorithm).
     * @param {Object} point {lat, lng}
     * @param {Array} polygonCoords Array of [lon, lat] rings
     * @return {boolean}
     */
    isPointInPolygon(point, polygonCoords) {
        // Simple implementation for single ring polygons
        const x = point.lng, y = point.lat;
        let inside = false;
        
        // polygonCoords might be [[[lon, lat], ...]] for Polygon (first ring)
        const ring = polygonCoords[0]; 
        
        for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
            const xi = ring[i][0], yi = ring[i][1];
            const xj = ring[j][0], yj = ring[j][1];
            
            const intersect = ((yi > y) !== (yj > y)) &&
                (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    }
};

// Expose globally
window.SpatialUtils = SpatialUtils;
