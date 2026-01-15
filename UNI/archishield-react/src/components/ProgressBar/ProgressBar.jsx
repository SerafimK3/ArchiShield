// ProgressBar Component - Shows audit progress animation
import './ProgressBar.css';

export function ProgressBar({ phase, percent, isVisible }) {
    if (!isVisible) return null;

    return (
        <div className="progress-container">
            <div className="progress-header">
                <span className="progress-phase">{phase}</span>
                <span className="progress-percent">{percent}%</span>
            </div>
            <div className="progress-track">
                <div 
                    className="progress-fill" 
                    style={{ width: `${percent}%` }}
                />
            </div>
        </div>
    );
}

export default ProgressBar;
