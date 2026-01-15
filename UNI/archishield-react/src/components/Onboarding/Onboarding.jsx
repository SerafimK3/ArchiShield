// Onboarding Component - Vienna Spot-Audit
import { useState, useEffect } from 'react';
import './Onboarding.css';

const ONBOARDING_STEPS = [
    {
        title: '🏛️ Welcome to Vienna Spot-Audit',
        content: 'Your intelligent urban planning dashboard. Instantly analyze any location in Districts 1, 2, or 7 for regulatory constraints.',
        icon: '🇦🇹'
    },
    {
        title: '📍 Step 1: Click the Map',
        content: 'Simply click anywhere on the map to analyze that location. No forms needed - instant analysis.',
        icon: '🗺️'
    },
    {
        title: '🔍 Step 2: Review Constraints',
        content: 'See zoning (Bauklasse), heritage (UNESCO/Schutzzone), subway proximity, and climate regulations at a glance.',
        icon: '📋'
    },
    {
        title: '📊 Step 3: Check Feasibility',
        content: 'The Telemetry Panel shows your permit feasibility score and lists compulsory add-ons like green roofs and solar panels.',
        icon: '✅'
    }
];

export function Onboarding({ onComplete }) {
    const [isVisible, setIsVisible] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [dontShowAgain, setDontShowAgain] = useState(false);

    useEffect(() => {
        const hasSeenOnboarding = localStorage.getItem('vienna_spotaudit_onboarding');
        if (!hasSeenOnboarding) {
            setIsVisible(true);
        }
    }, []);

    const handleNext = () => {
        if (currentStep < ONBOARDING_STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleComplete();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleComplete = () => {
        if (dontShowAgain) {
            localStorage.setItem('vienna_spotaudit_onboarding', 'true');
        }
        setIsVisible(false);
        if (onComplete) onComplete();
    };

    const handleSkip = () => {
        localStorage.setItem('vienna_spotaudit_onboarding', 'true');
        setIsVisible(false);
        if (onComplete) onComplete();
    };

    if (!isVisible) return null;

    const step = ONBOARDING_STEPS[currentStep];
    const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;

    return (
        <div className="onboarding-overlay">
            <div className="onboarding-modal">
                <button className="onboarding-close" onClick={handleSkip}>×</button>
                
                <div className="onboarding-icon">{step.icon}</div>
                <h2 className="onboarding-title">{step.title}</h2>
                <p className="onboarding-content">{step.content}</p>

                <div className="onboarding-dots">
                    {ONBOARDING_STEPS.map((_, idx) => (
                        <span 
                            key={idx}
                            className={`onboarding-dot ${idx === currentStep ? 'active' : ''}`}
                            onClick={() => setCurrentStep(idx)}
                        />
                    ))}
                </div>

                <div className="onboarding-actions">
                    <button 
                        className="onboarding-btn secondary"
                        onClick={handlePrev}
                        disabled={currentStep === 0}
                    >
                        ← Back
                    </button>
                    <button 
                        className="onboarding-btn primary"
                        onClick={handleNext}
                    >
                        {isLastStep ? 'Get Started' : 'Next →'}
                    </button>
                </div>

                <label className="onboarding-checkbox">
                    <input 
                        type="checkbox" 
                        checked={dontShowAgain}
                        onChange={(e) => setDontShowAgain(e.target.checked)}
                    />
                    <span>Don't show again</span>
                </label>
            </div>
        </div>
    );
}

export default Onboarding;
