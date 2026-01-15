/**
 * AuditTimeline - Step-by-step progress visualization
 */
import React from 'react';
import './AuditTimeline.css';

export function AuditTimeline({ phases, currentPhaseIndex, isLoading }) {
    return (
        <div className="audit-timeline">
            <div className="timeline-track">
                {phases.map((phase, idx) => {
                    let status = 'pending';
                    if (idx < currentPhaseIndex) status = 'complete';
                    else if (idx === currentPhaseIndex && isLoading) status = 'active';
                    
                    return (
                        <div key={phase.id} className={`timeline-step ${status}`}>
                            <div className="step-node">
                                <span className="step-icon">{phase.icon}</span>
                                {status === 'active' && <div className="pulse-ring" />}
                            </div>
                            <span className="step-label">{phase.name}</span>
                            {idx < phases.length - 1 && (
                                <div className={`step-connector ${idx < currentPhaseIndex ? 'complete' : ''}`} />
                            )}
                        </div>
                    );
                })}
            </div>
            {isLoading && currentPhaseIndex >= 0 && (
                <div className="timeline-status">
                    Analyzing {phases[currentPhaseIndex]?.name}...
                </div>
            )}
        </div>
    );
}

export default AuditTimeline;
