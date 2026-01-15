/**
 * Subsurface Audit - U-Bahn Tunnel Proximity Analysis
 * 
 * Evaluates building location against Vienna's subsurface infrastructure:
 * - U-Bahn tunnel proximity (U1, U2, U3, U4)
 * - Vibration zone assessment
 * - Foundation depth recommendations
 * - Excavation restrictions
 */

import { getDistance } from '../spatial';

// U-Bahn tunnel centerlines (simplified as point arrays)
const UBAHN_LINES = {
    U1: {
        color: '#E20E17',
        stations: [
            { name: 'Stephansplatz', lat: 48.2084, lng: 16.3725 },
            { name: 'Schwedenplatz', lat: 48.2120, lng: 16.3775 },
            { name: 'Praterstern', lat: 48.2189, lng: 16.3917 }
        ],
        tunnelDepth: 20 // meters below surface (average)
    },
    U2: {
        color: '#9A57A3',
        stations: [
            { name: 'Rathaus', lat: 48.2107, lng: 16.3565 },
            { name: 'Schottentor', lat: 48.2154, lng: 16.3611 },
            { name: 'Praterstern', lat: 48.2189, lng: 16.3917 }
        ],
        tunnelDepth: 15
    },
    U3: {
        color: '#F39200',
        stations: [
            { name: 'Stephansplatz', lat: 48.2084, lng: 16.3725 },
            { name: 'Herrengasse', lat: 48.2107, lng: 16.3658 },
            { name: 'Volkstheater', lat: 48.2052, lng: 16.3589 }
        ],
        tunnelDepth: 18
    },
    U4: {
        color: '#228B22',
        stations: [
            { name: 'Schwedenplatz', lat: 48.2120, lng: 16.3775 },
            { name: 'Landstraße', lat: 48.2063, lng: 16.3868 },
            { name: 'Karlsplatz', lat: 48.2007, lng: 16.3692 }
        ],
        tunnelDepth: 12
    }
};

// Proximity thresholds (meters)
const THRESHOLDS = {
    critical: 30,    // Construction ban without special permit
    restricted: 50,  // Enhanced structural assessment required
    monitoring: 100, // Vibration monitoring during construction
    clear: 150       // No special requirements
};

export const SubsurfaceAudit = {
    name: 'Subsurface',
    icon: '🚇',
    
    execute(building, context = {}) {
        const { latitude, longitude, basementDepth = 5 } = building;
        
        const results = {
            passed: true,
            score: 100,
            nearestLine: null,
            nearestDistance: Infinity,
            constraints: [],
            recommendations: []
        };
        
        // Check proximity to all U-Bahn lines
        for (const [lineName, line] of Object.entries(UBAHN_LINES)) {
            for (const station of line.stations) {
                const distance = getDistance(latitude, longitude, station.lat, station.lng);
                
                if (distance < results.nearestDistance) {
                    results.nearestDistance = Math.round(distance);
                    results.nearestLine = {
                        name: lineName,
                        station: station.name,
                        color: line.color,
                        tunnelDepth: line.tunnelDepth
                    };
                }
            }
        }
        
        // Evaluate proximity level
        const dist = results.nearestDistance;
        
        if (dist < THRESHOLDS.critical) {
            results.passed = false;
            results.score -= 50;
            results.constraints.push({
                type: 'TUNNEL_CRITICAL',
                severity: 'blocking',
                message: `${dist}m from ${results.nearestLine.name} tunnel - CONSTRUCTION BAN without Wiener Linien approval`,
                distance: dist,
                line: results.nearestLine.name
            });
        } else if (dist < THRESHOLDS.restricted) {
            results.score -= 30;
            results.constraints.push({
                type: 'TUNNEL_RESTRICTED',
                severity: 'critical',
                message: `${dist}m from ${results.nearestLine.name} - Enhanced structural assessment required`,
                distance: dist,
                requirements: ['Geotechnical study', 'Vibration analysis', 'Wiener Linien coordination']
            });
        } else if (dist < THRESHOLDS.monitoring) {
            results.score -= 10;
            results.constraints.push({
                type: 'TUNNEL_MONITORING',
                severity: 'warning',
                message: `${dist}m from ${results.nearestLine.name} - Vibration monitoring required during construction`,
                distance: dist
            });
        }
        
        // Check basement depth conflict
        if (results.nearestLine && basementDepth > 0) {
            const tunnelDepth = results.nearestLine.tunnelDepth;
            if (basementDepth > tunnelDepth - 5) {
                results.score -= 20;
                results.constraints.push({
                    type: 'DEPTH_CONFLICT',
                    severity: 'critical',
                    message: `Basement depth ${basementDepth}m may conflict with tunnel at ${tunnelDepth}m`,
                    recommendation: `Max recommended: ${tunnelDepth - 8}m`
                });
            }
        }
        
        // Generate recommendations
        if (dist < THRESHOLDS.monitoring) {
            results.recommendations.push('Engage Wiener Linien for pre-construction consultation');
            results.recommendations.push('Install vibration monitoring equipment');
        }
        if (dist < THRESHOLDS.restricted) {
            results.recommendations.push('Commission independent geotechnical assessment');
            results.recommendations.push('Consider pile foundation alternatives');
        }
        if (dist >= THRESHOLDS.clear) {
            results.recommendations.push('No subsurface constraints - standard foundation permissible');
        }
        
        results.score = Math.max(0, results.score);
        return results;
    }
};

export default SubsurfaceAudit;
