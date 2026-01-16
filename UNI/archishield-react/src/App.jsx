/**
 * Vienna Spot-Audit - Main Application
 */
import { useState, useCallback, useMemo } from 'react';
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
        clearResults,
        buildingConfig,
        setMaterial,
        updateBuildingConfig
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
    
    // Calculate envelope data for 3D visualization
    // Uses buildingConfig values so it updates when sliders change
    const envelopeData = useMemo(() => {
        if (!results?.success || !selectedLocation) return null;
        
        const contextualLimit = results.audits?.zoning?.contextualLimit || 21;
        const currentHeight = buildingConfig?.height || results.building?.height || 20;
        const currentFootprint = buildingConfig?.footprint || 200;
        const currentRotation = buildingConfig?.rotation || 0;
        const isOverLimit = currentHeight > contextualLimit;
        
        // Calculate offset based on footprint (sqrt for reasonable proportions)
        const baseOffset = 0.0003; // ~30m
        const footprintScale = Math.sqrt(currentFootprint / 200);
        const offset = baseOffset * footprintScale;
        
        return {
            lat: selectedLocation.lat,
            lng: selectedLocation.lng,
            height: currentHeight,
            contextualLimit,
            isOverLimit,
            offset,
            rotation: currentRotation
        };
    }, [results, selectedLocation, buildingConfig]);

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
                        envelopeData={envelopeData}
                    />
                </div>

                {/* Telemetry Panel - 40% */}
                <div className="telemetry-wrapper">
                    <TelemetryPanel 
                        results={results} 
                        loading={isLoading}
                        phase={currentPhase?.name}
                        buildingConfig={buildingConfig}
                        onMaterialChange={setMaterial}
                        onConfigChange={updateBuildingConfig}
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
                    constraints: results.constraints?.map(c => c.description || c.message),
                    mandates: results.mandates?.map(m => m.requirement),
                    building: results.building
                } : null}
                onLocationSuggested={(loc) => {
                    handleLocationSelect(loc.lat, loc.lng);
                }}
            />
        </div>
    );
}

export default App;
