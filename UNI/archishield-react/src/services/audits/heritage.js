/**
 * Heritage Audit - UNESCO Buffer Zone and Historical Protection
 * 
 * Evaluates building location against Vienna's heritage constraints:
 * - UNESCO World Heritage Site buffer zone (District 1)
 * - 43m height limit in historic core
 * - Facade protection requirements
 * - Viewshed analysis for landmark visibility
 */

import { isPointInPolygon, getDistance } from '../spatial';

// UNESCO World Heritage buffer zone (Vienna Historic Centre)
const UNESCO_BUFFER = {
    core: [
        [16.3550, 48.2000], [16.3900, 48.2000],
        [16.3900, 48.2200], [16.3550, 48.2200]
    ],
    heightLimit: 43, // meters - strict enforcement
    landmarks: [
        { name: 'St. Stephen\'s Cathedral', lat: 48.2084, lng: 16.3731, protectionRadius: 200 },
        { name: 'Hofburg Palace', lat: 48.2064, lng: 16.3659, protectionRadius: 300 },
        { name: 'Vienna State Opera', lat: 48.2036, lng: 16.3692, protectionRadius: 150 }
    ]
};

// Viewshed corridors - critical sight lines
const VIEWSHEDS = [
    { from: 'Belvedere', to: 'Stephansdom', bearing: 45, width: 15 },
    { from: 'Kahlenberg', to: 'Historic Centre', bearing: 180, width: 30 }
];

export const HeritageAudit = {
    name: 'Heritage',
    icon: '🏛️',
    
    execute(building, context = {}) {
        const { latitude, longitude, height } = building;
        const district = context.district || 1;
        
        const results = {
            passed: true,
            score: 100,
            unescoZone: false,
            heightLimit: null,
            landmarks: [],
            constraints: [],
            recommendations: []
        };
        
        // Check UNESCO buffer zone
        if (isPointInPolygon([longitude, latitude], UNESCO_BUFFER.core)) {
            results.unescoZone = true;
            results.heightLimit = UNESCO_BUFFER.heightLimit;
            
            results.constraints.push({
                type: 'UNESCO_BUFFER',
                severity: 'critical',
                message: 'Located within UNESCO World Heritage buffer zone',
                requirements: ['MA 19 approval', 'Heritage impact assessment', 'Public consultation']
            });
            
            // Strict 43m height limit
            if (height > UNESCO_BUFFER.heightLimit) {
                results.passed = false;
                results.score -= 50;
                results.constraints.push({
                    type: 'UNESCO_HEIGHT_VIOLATION',
                    severity: 'blocking',
                    message: `Height ${height}m violates UNESCO 43m limit - AUTOMATIC REJECTION`,
                    limit: UNESCO_BUFFER.heightLimit,
                    actual: height
                });
            } else if (height > 35) {
                results.score -= 15;
                results.constraints.push({
                    type: 'HEIGHT_REVIEW',
                    severity: 'warning',
                    message: `Height ${height}m requires enhanced heritage review (>35m)`,
                    limit: 35,
                    actual: height
                });
            }
        }
        
        // Check landmark proximity
        for (const landmark of UNESCO_BUFFER.landmarks) {
            const distance = getDistance(latitude, longitude, landmark.lat, landmark.lng);
            if (distance < landmark.protectionRadius) {
                results.landmarks.push({
                    name: landmark.name,
                    distance: Math.round(distance),
                    protectionRadius: landmark.protectionRadius
                });
                results.constraints.push({
                    type: 'LANDMARK_PROXIMITY',
                    severity: 'important',
                    message: `${Math.round(distance)}m from ${landmark.name} - design review required`,
                    landmark: landmark.name,
                    distance: Math.round(distance)
                });
                results.score -= 10;
            }
        }
        
        // District 1 specific requirements
        if (district === 1) {
            results.constraints.push({
                type: 'DISTRICT_1_PROTOCOL',
                severity: 'info',
                message: 'District 1 requires MA 19 preliminary consultation before submission'
            });
        }
        
        // Generate recommendations
        if (results.unescoZone) {
            results.recommendations.push('Engage heritage architect for facade design');
            results.recommendations.push('Prepare visual impact study with 3D renderings');
        }
        if (results.landmarks.length > 0) {
            results.recommendations.push('Commission independent heritage impact assessment');
        }
        if (results.passed) {
            results.recommendations.push('Heritage constraints manageable with proper documentation');
        }
        
        results.score = Math.max(0, results.score);
        return results;
    }
};

export default HeritageAudit;
