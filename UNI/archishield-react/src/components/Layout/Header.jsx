/**
 * Header Component - ArchiShield Dashboard
 */
import React from 'react';
import './Header.css';

export function Header({ district, coords }) {
    return (
        <header className="header glass">
            <div className="header-brand">
                <div className="header-logo">
                    <img src="/logo.jpg" alt="ArchiShield Logo" className="brand-logo" />
                </div>
                <div className="header-title-wrapper">
                    <div className="system-ref">PLATFORM: RESILIENCE ENGINE / V2.0</div>
                    <h1 className="header-title">Archi<span>Shield</span></h1>
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
