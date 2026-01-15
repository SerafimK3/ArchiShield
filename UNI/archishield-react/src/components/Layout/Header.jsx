/**
 * Header Component - Premium Vienna Observatory
 */
import React from 'react';
import './Header.css';

export function Header({ district, coords }) {
    return (
        <header className="header glass">
            <div className="header-brand">
                <div className="header-logo">
                    <div className="logo-outer">
                        <svg viewBox="0 0 32 32" width="32" height="32" fill="none">
                            <rect width="32" height="32" rx="8" fill="url(#header-logo-grad)" />
                            <circle cx="16" cy="16" r="6" fill="white" className="logo-pulse" />
                            <defs>
                                <linearGradient id="header-logo-grad" x1="0" y1="0" x2="32" y2="32">
                                    <stop stopColor="#00d4ff"/>
                                    <stop offset="1" stopColor="#00ff88"/>
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                </div>
                <div className="header-title-wrapper">
                    <div className="system-ref">SYSTEM: V-AUDIT / CORE-9</div>
                    <h1 className="header-title">VIENNA <span>OBSERVATORY</span></h1>
                </div>
            </div>

            <div className="header-center">
                <div className="operation-tag">
                    <span className="blink">●</span> SCAN_MODE: {district || 'SECTOR_INIT'}
                </div>
            </div>

            <div className="header-actions">
                {coords && (
                    <div className="hud-metric gps-lock">
                        <div className="metric-label">GPS_LOCK</div>
                        <div className="metric-value">
                            {coords.lat.toFixed(5)} <span className="u">°N</span> / {coords.lng.toFixed(5)} <span className="u">°E</span>
                        </div>
                    </div>
                )}
                
                <div className="hud-divider" />

                <div className="system-health">
                    <div className="health-visual">
                        <div className="pulse-bar" style={{height: '40%'}}></div>
                        <div className="pulse-bar" style={{height: '70%'}}></div>
                        <div className="pulse-bar" style={{height: '100%'}}></div>
                        <div className="pulse-bar" style={{height: '60%'}}></div>
                    </div>
                    <div className="health-text">
                        <div className="label">SYS_STATUS</div>
                        <div className="value">NOMINAL</div>
                    </div>
                </div>
            </div>
            
            <div className="header-scanline" />
        </header>
    );
}

export default Header;
