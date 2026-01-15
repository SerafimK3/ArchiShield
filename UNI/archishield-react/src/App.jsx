/**
 * Vienna Spot-Audit - Main Application
 */
import { useState, useCallback } from 'react';
import { Header } from './components/Layout/Header';
import { Map } from './components/Map';
import { TelemetryPanel } from './components/TelemetryPanel';
import { AuditTimeline } from './components/AuditTimeline';
import { Onboarding } from './components/Onboarding';
import ChatPanel from './components/ChatPanel';
import { useSpotAudit } from './hooks/useSpotAudit';
import './App.css';

function App() {
    const { 
        results, 
        isLoading, 
        currentPhase, 
        phaseIndex, 
        phases,
        runSpotAudit, 
        clearResults 
    } = useSpotAudit();
    
    const [selectedLocation, setSelectedLocation] = useState(null);

    const handleLocationSelect = useCallback((lat, lng) => {
        setSelectedLocation({ lat, lng });
        // Automatically run audit when location is clicked
        runSpotAudit(lat, lng);
    }, [runSpotAudit]);

    const handleBuildingSelect = useCallback((building) => {
        setSelectedLocation({ lat: building.lat, lng: building.lng });
        // Run audit with building parameters
        runSpotAudit(building.lat, building.lng, {
            height: building.height,
            floors: building.levels
        });
    }, [runSpotAudit]);

    return (
        <div className="app">
            <Onboarding />
            <Header 
                district={results?.district}
                coords={selectedLocation}
            />
            
            <main className="main-content">
                {/* Map Panel - 60% */}
                <div className="map-panel">
                    <Map 
                        onLocationSelect={handleLocationSelect}
                        onBuildingSelect={handleBuildingSelect}
                    />
                </div>

                {/* Telemetry Panel - 40% */}
                <div className="telemetry-wrapper">
                    <TelemetryPanel 
                        results={results} 
                        loading={isLoading}
                        phase={currentPhase?.name}
                    />
                </div>
            </main>

            {/* Audit Timeline */}
            <footer className="timeline-footer">
                <AuditTimeline 
                    phases={phases}
                    currentPhaseIndex={phaseIndex}
                    isLoading={isLoading}
                />
            </footer>

            {/* AI Chat Assistant */}
            <ChatPanel 
                auditContext={results?.success ? {
                    lat: selectedLocation?.lat,
                    lng: selectedLocation?.lng,
                    district: results.district,
                    feasibility: results.feasibility,
                    constraints: results.constraints?.map(c => c.description),
                    mandates: results.mandates?.map(m => m.requirement)
                } : null}
            />
        </div>
    );
}

export default App;
