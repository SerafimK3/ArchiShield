/**
 * TelemetryPanel - Premium Dashboard with Real Audit Data
 * Displays: Gauge, 4 constraint cards with real data, audit scores chart
 */
import React, { useEffect, useState } from 'react';
import './TelemetryPanel.css';

export function TelemetryPanel({ results, loading, phase, buildingConfig, onMaterialChange, onConfigChange }) {
    const [animatedFeasibility, setAnimatedFeasibility] = useState(0);
    
    useEffect(() => {
        if (results?.feasibility) {
            let start = animatedFeasibility;
            const end = results.feasibility;
            const duration = 1200;
            const startTime = performance.now();

            const animateValue = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const easeProgress = 1 - Math.pow(1 - progress, 3);
                const currentVal = Math.round(start + (end - start) * easeProgress);
                setAnimatedFeasibility(currentVal);
                if (progress < 1) requestAnimationFrame(animateValue);
            };

            requestAnimationFrame(animateValue);
        }
    }, [results?.feasibility]);

    // Loading state - premium animated version
    if (loading) {
        return (
            <div className="telemetry-panel">
                <div className="panel-header">
                    <span className="breadcrumb">Home › Vienna › <strong>Analyzing...</strong></span>
                </div>
                
                <div className="loading-hero">
                    <div className="loading-ring">
                        <svg viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="40" className="ring-bg" />
                            <circle cx="50" cy="50" r="40" className="ring-progress" />
                        </svg>
                        <div className="loading-icon">🔍</div>
                    </div>
                    <h3 className="loading-title">Running Audit</h3>
                    <p className="loading-phase">{phase || 'Initializing...'}</p>
                </div>

                <div className="loading-steps">
                    {['Zoning', 'Heritage', 'Subsurface', 'Climate', 'Structural Safety'].map((step, idx) => (
                        <div 
                            key={step} 
                            className={`loading-step ${phase === step ? 'active' : ''} ${
                                ['Zoning', 'Heritage', 'Subsurface', 'Climate', 'Structural Safety'].indexOf(phase) > idx ? 'complete' : ''
                            }`}
                        >
                            <div className="step-indicator">
                                {['Zoning', 'Heritage', 'Subsurface', 'Climate', 'Structural Safety'].indexOf(phase) > idx ? '✓' : (idx + 1)}
                            </div>
                            <span className="step-label">{step}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Empty state
    if (!results || !results.success) {
        return (
            <div className="telemetry-panel">
                <div className="panel-header">
                    <span className="breadcrumb">Home › Vienna › <strong>Permit Feasibility Analysis</strong></span>
                </div>
                <div className="empty-state">
                    <div className="empty-icon">📍</div>
                    <h3>Select a Location</h3>
                    <p>Click on the map to analyze permit feasibility</p>
                </div>
            </div>
        );
    }

    // Extract data from results
    const { feasibility, district, audits, building } = results;
    const zoning = audits?.zoning;
    const heritage = audits?.heritage;
    const subsurface = audits?.subsurface;
    const climate = audits?.climate;
    const seismic = audits?.seismic;
    const wind = audits?.wind;

    // Helper to get severity class
    const getSeverityClass = (score) => {
        if (score >= 80) return 'green';
        if (score >= 60) return 'orange';
        return 'red';
    };

    const regulatoryLimit = zoning?.bauklasse?.maxHeight || 16;
    const contextualLimit = zoning?.contextualLimit || regulatoryLimit;
    const suggestedBauklasse = zoning?.suggestedBauklasse;
    const neighborhoodAvg = zoning?.neighborhood?.avgHeight || 0;
    const proposedHeight = building?.height || 20;
    
    // Scale percentages relative to the contextual limit (which is >= regulatory)
    const displayMax = Math.max(proposedHeight, contextualLimit, regulatoryLimit);
    const heightPercent = Math.min((proposedHeight / displayMax) * 100, 100);
    const regulatoryPercent = Math.min((regulatoryLimit / displayMax) * 100, 100);
    const neighborPercent = Math.min((neighborhoodAvg / displayMax) * 100, 100);

    const isExceedingRegulatory = proposedHeight > regulatoryLimit;
    const isExceedingContextual = proposedHeight > contextualLimit;
    const hasVariancePotential = isExceedingRegulatory && !isExceedingContextual;
    
    // Material toggle handler
    const handleMaterialToggle = () => {
        if (onMaterialChange) {
            const newMaterial = buildingConfig?.material === 'CONCRETE' ? 'TIMBER' : 'CONCRETE';
            onMaterialChange(newMaterial);
        }
    };
    const currentMaterial = buildingConfig?.material || 'CONCRETE';
    
    // Building envelope controls
    const currentHeight = buildingConfig?.height || proposedHeight || 20;
    const currentFootprint = buildingConfig?.footprint || 200;
    const currentRotation = buildingConfig?.rotation || 0;
    const isOverLimit = currentHeight > contextualLimit;
    
    const handleHeightChange = (e) => {
        const newHeight = parseInt(e.target.value);
        if (onConfigChange) {
            onConfigChange({ height: newHeight });
        }
    };
    
    const handleFootprintChange = (e) => {
        const newFootprint = parseInt(e.target.value);
        if (onConfigChange) {
            onConfigChange({ footprint: newFootprint });
        }
    };
    
    const handleRotationChange = (e) => {
        const newRotation = parseInt(e.target.value);
        if (onConfigChange) {
            onConfigChange({ rotation: newRotation });
        }
    };

    return (
        <div className="telemetry-panel">
            {/* Header with breadcrumb */}
            <div className="panel-header">
                <span className="breadcrumb">
                    Home › Vienna › {district ? `District ${district}` : 'Overview'} <strong>Permit Feasibility Analysis</strong>
                </span>
            </div>

            {/* Permit Feasibility Gauge */}
            <div className="gauge-section">
                <h3 className="gauge-title">Permit Feasibility</h3>
                <div className="gauge-container">
                    <svg viewBox="0 0 200 110" className="gauge-svg">
                        <defs>
                            <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#00d4ff" />
                                <stop offset="50%" stopColor="#00ff88" />
                                <stop offset="100%" stopColor="#ffcc00" />
                            </linearGradient>
                        </defs>
                        {/* Background arc */}
                        <path
                            d="M 20 100 A 80 80 0 0 1 180 100"
                            fill="none"
                            stroke="#1a2035"
                            strokeWidth="12"
                            strokeLinecap="round"
                        />
                        {/* Progress arc */}
                        <path
                            d="M 20 100 A 80 80 0 0 1 180 100"
                            fill="none"
                            stroke="url(#gaugeGrad)"
                            strokeWidth="12"
                            strokeLinecap="round"
                            strokeDasharray="251.2"
                            strokeDashoffset={251.2 * (1 - animatedFeasibility / 100)}
                            className="gauge-progress"
                        />
                    </svg>
                    <div className="gauge-center">
                        <span className="gauge-value">
                            {animatedFeasibility}<span className="percent-sign">%</span>
                        </span>
                        <span className="gauge-label">
                            {feasibility >= 80 ? 'High Approval Probability' : 
                             feasibility >= 60 ? 'Moderate - Review Required' : 
                             'Low - Significant Issues'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Active Constraints - 2x2 Grid with REAL DATA */}
            <div className="constraints-section">
                <div className="section-head">
                    <h3>Active Constraints</h3>
                </div>
                <div className="constraints-grid">
                    
                    {/* Building Envelope Slider Card */}
                    <div className={`constraint-card envelope-card ${isOverLimit ? 'over-limit' : ''}`}>
                        <div className="card-top">
                            <span className="card-icon">📐</span>
                            <span className="card-title">Building Envelope</span>
                            {isOverLimit && <span className="limit-warning">⚠️ OVER LIMIT</span>}
                        </div>
                        
                        <div className="envelope-slider">
                            <div className="slider-row">
                                <label>Height</label>
                                <input 
                                    type="range" 
                                    min="5" 
                                    max="100" 
                                    value={currentHeight}
                                    onChange={handleHeightChange}
                                    className={isOverLimit ? 'over' : ''}
                                />
                                <span className={`slider-value ${isOverLimit ? 'over' : ''}`}>
                                    {currentHeight}m
                                </span>
                            </div>
                            <div className="slider-row">
                                <label>Footprint</label>
                                <input 
                                    type="range" 
                                    min="50" 
                                    max="500" 
                                    value={currentFootprint}
                                    onChange={handleFootprintChange}
                                />
                                <span className="slider-value">{currentFootprint}㎡</span>
                            </div>
                            <div className="slider-row">
                                <label>Rotation</label>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="360" 
                                    value={currentRotation}
                                    onChange={handleRotationChange}
                                    className="rotation-slider"
                                />
                                <span className="slider-value">{currentRotation}°</span>
                            </div>
                        </div>
                        
                        <div className="envelope-limits">
                            <span>Limit: {contextualLimit}m</span>
                            {isOverLimit && <span className="over-text">+{(currentHeight - contextualLimit).toFixed(0)}m over</span>}
                        </div>
                    </div>
                    
                    {/* Material Toggle Card */}
                    <div className="constraint-card material-card">
                        <div className="card-top">
                            <span className="card-icon">🏗️</span>
                            <span className="card-title">Construction Material</span>
                        </div>
                        <div className="material-toggle">
                            <button 
                                className={`material-btn ${currentMaterial === 'CONCRETE' ? 'active' : ''}`}
                                onClick={() => onMaterialChange && onMaterialChange('CONCRETE')}
                            >
                                🧱 Concrete
                            </button>
                            <button 
                                className={`material-btn ${currentMaterial === 'TIMBER' ? 'active' : ''}`}
                                onClick={() => onMaterialChange && onMaterialChange('TIMBER')}
                            >
                                🪵 Timber (CLT)
                            </button>
                        </div>
                        <div className="card-sublabel">
                            {currentMaterial === 'TIMBER' 
                                ? '✓ Carbon-negative • Seismic flex bonus' 
                                : 'Standard construction • Higher mass'}
                        </div>
                    </div>
                    
                    {/* Card 1: Height Restriction (Zoning) */}
                    <div className="constraint-card">
                        <div className="card-top">
                            <span className="card-icon">📏</span>
                            <span className="card-title">Height Restriction</span>
                        </div>
                        <div className={`card-value height-value-row ${!isExceedingRegulatory ? 'green' : hasVariancePotential ? 'orange' : 'red'}`}>
                            <div className="limit-sequence">
                                <span>{regulatoryLimit}m</span>
                                <span className="arrow">→</span>
                                <span className="context-limit">{contextualLimit}m</span>
                            </div>
                            {hasVariancePotential && <span className="variance-tag">CONTEXT BUMP</span>}
                        </div>
                        <div className="card-sublabel">
                            {hasVariancePotential 
                                ? `Bauklasse ${suggestedBauklasse?.class} Alignment` 
                                : isExceedingContextual 
                                    ? "Exceeds Neighborhood Scale" 
                                    : `Verified: ${zoning?.bauklasse?.class || 'III'} Zoning`}
                        </div>
                        <div className="height-bar-container">
                            <div 
                                className={`height-bar-fill ${!isExceedingRegulatory ? 'safe' : hasVariancePotential ? 'variance' : 'exceeded'}`}
                                style={{ width: `${heightPercent}%` }}
                            />
                            {neighborhoodAvg > 0 && (
                                <div 
                                    className="neighborhood-avg-marker" 
                                    style={{ left: `${neighborPercent}%` }}
                                    title={`Neighborhood Avg: ${neighborhoodAvg}m`}
                                />
                            )}
                            <div className="height-bar-limit regulatory" style={{ left: `${regulatoryPercent}%` }} title={`Regulatory: ${regulatoryLimit}m`} />
                            <div className="height-bar-limit contextual" style={{ left: '100%' }} />
                        </div>
                        <div className="bar-labels">
                            <span>0m</span>
                            <span className="proposed-label">{proposedHeight}m curr.</span>
                        </div>
                    </div>

                    {/* Card 2: Heritage Impact */}
                    <div className="constraint-card">
                        <div className="card-top">
                            <span className="card-icon">🏛️</span>
                            <span className="card-title">Heritage Zone</span>
                        </div>
                        <div className={`card-value ${heritage?.unescoZone ? 'orange' : 'green'}`}>
                            {heritage?.unescoZone ? 'UNESCO Buffer' : 'Standard Zone'}
                        </div>
                        {heritage?.landmarks && heritage.landmarks.length > 0 ? (
                            <>
                                <div className="card-sublabel">
                                    {heritage.landmarks[0].distance}m from {heritage.landmarks[0].name}
                                </div>
                                <div className="landmark-indicator">
                                    <span className="landmark-dot" />
                                    <span>Landmark proximity review required</span>
                                </div>
                            </>
                        ) : heritage?.unescoZone ? (
                            <>
                                <div className="card-sublabel">Height limit: {heritage.heightLimit || 43}m</div>
                                <div className="landmark-indicator warning">
                                    <span className="landmark-dot" />
                                    <span>MA 19 approval required</span>
                                </div>
                            </>
                        ) : (
                            <div className="card-sublabel">No heritage restrictions</div>
                        )}
                    </div>

                    {/* Card 3: U-Bahn Proximity (Subsurface) */}
                    <div className="constraint-card">
                        <div className="card-top">
                            <span className="card-icon">🚇</span>
                            <span className="card-title">U-Bahn Proximity</span>
                        </div>
                        {subsurface?.nearestLine ? (
                            <>
                                <div className={`card-value ${
                                    subsurface.nearestDistance < 50 ? 'red' : 
                                    subsurface.nearestDistance < 100 ? 'orange' : 'cyan'
                                }`}>
                                    {subsurface.nearestDistance}m to {subsurface.nearestLine.name}
                                </div>
                                <div className="card-sublabel">
                                    Near {subsurface.nearestLine.station} • Tunnel depth: {subsurface.nearestLine.tunnelDepth}m
                                </div>
                                <div className="proximity-bar">
                                    <div 
                                        className={`proximity-fill ${
                                            subsurface.nearestDistance < 50 ? 'critical' : 
                                            subsurface.nearestDistance < 100 ? 'warning' : 'safe'
                                        }`}
                                        style={{ width: `${Math.min(100, (150 - subsurface.nearestDistance) / 150 * 100)}%` }}
                                    />
                                </div>
                                <div className="bar-labels">
                                    <span>Critical</span>
                                    <span>Clear</span>
                                </div>
                            </>
                        ) : (
                            <div className="card-value green">No U-Bahn nearby</div>
                        )}
                    </div>

                    {/* Card 4: Climate Mandates */}
                    <div className="constraint-card">
                        <div className="card-top">
                            <span className="card-icon">🌿</span>
                            <span className="card-title">Climate</span>
                        </div>
                        <div className={`card-value ${
                            climate?.mandates?.length > 2 ? 'orange' : 'green'
                        }`}>
                            {climate?.mandates?.length || 0} Mandates
                        </div>
                        {climate?.uhiIntensity && (
                            <div className="card-sublabel">
                                UHI Zone: {climate.uhiIntensity.category} (+{climate.uhiIntensity.intensity}°C)
                            </div>
                        )}
                        <div className="mandates-list">
                            {climate?.mandates?.slice(0, 3).map((mandate, idx) => (
                                <div key={idx} className="mandate-item">
                                    <span className="mandate-icon">
                                        {mandate.type === 'GREEN_ROOF' ? '🌱' : 
                                         mandate.type === 'SOLAR_INSTALLATION' ? '☀️' : 
                                         mandate.type === 'WATER_RETENTION' ? '💧' : 
                                         mandate.type === 'FACADE_GREENING' ? '🌿' : '📋'}
                                    </span>
                                    <span className="mandate-text">
                                        {mandate.type.replace(/_/g, ' ').toLowerCase()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Card 5: Structural Safety */}
                    <div className="constraint-card structural-card">
                        <div className="card-top">
                            <span className="card-icon">🏗️</span>
                            <span className="card-title">Structural Safety</span>
                        </div>
                        <div className={`card-value ${getSeverityClass(Math.round(((seismic?.score || 0) + (wind?.score || 0)) / 2))}`}>
                            {Math.round(((seismic?.score || 0) + (wind?.score || 0)) / 2)}% Resilience
                        </div>
                        <div className="card-sublabel">
                            {wind?.data?.neighborCount} Neighbors • {seismic?.data?.zone} Zone
                        </div>
                        <div className="mini-bars-container">
                            <div className="mini-bar-row">
                                <span className="mini-label">Seismic</span>
                                <div className="mini-bar">
                                    <div 
                                        className={`mini-fill ${getSeverityClass(100 - (seismic?.data?.stressLevel || 0))}`}
                                        style={{ width: `${seismic?.data?.stressLevel || 0}%` }}
                                    />
                                </div>
                            </div>
                            <div className="mini-bar-row">
                                <span className="mini-label">Wind</span>
                                <div className="mini-bar">
                                    <div 
                                        className={`mini-fill ${getSeverityClass(100 - (wind?.data?.stressLevel || 0))}`}
                                        style={{ width: `${wind?.data?.stressLevel || 0}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>


            {/* Audit Scores Section */}
            <div className="metrics-section">
                <h3>Audit Breakdown</h3>
                
                <div className="audit-scores">
                    {[
                        { name: 'Zoning', score: zoning?.score || 0, icon: '🏛️', color: '#00d4ff' },
                        { name: 'Heritage', score: heritage?.score || 0, icon: '🏛️', color: '#00ff88' },
                        { name: 'Subsurface', score: subsurface?.score || 0, icon: '🚇', color: '#ffaa00' },
                        { name: 'Climate', score: climate?.score || 0, icon: '🌡️', color: '#ff6b7a' },
                        { name: 'Structural', score: Math.round(((seismic?.score || 0) + (wind?.score || 0)) / 2), icon: '🏗️', color: '#8b5cf6' }
                    ].map((audit, idx) => (
                        <div key={idx} className="audit-score-row">
                            <div className="audit-info">
                                <span className="audit-icon">{audit.icon}</span>
                                <span className="audit-name">{audit.name}</span>
                            </div>
                            <div className="audit-bar-container">
                                <div 
                                    className="audit-bar-fill"
                                    style={{ 
                                        width: `${audit.score}%`,
                                        background: audit.color
                                    }}
                                />
                            </div>
                            <span className={`audit-score ${getSeverityClass(audit.score)}`}>
                                {audit.score}%
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Key Risk Summary */}
            {results.keyRisk && results.keyRisk !== 'No critical constraints' && (
                <div className="risk-summary">
                    <span className="risk-icon">⚠️</span>
                    <span className="risk-text">{results.keyRisk}</span>
                </div>
            )}

            {/* Bottom Status Bar */}
            <div className="status-bar">
                <div className="status-left">
                    <span className="status-label">System Status</span>
                    <span className="status-online">
                        <span className="dot" />
                        ONLINE
                    </span>
                </div>
                <span className="refresh-text">
                    {results.timestamp ? new Date(results.timestamp).toLocaleTimeString() : 'Live'}
                </span>
            </div>
        </div>
    );
}

export default TelemetryPanel;
