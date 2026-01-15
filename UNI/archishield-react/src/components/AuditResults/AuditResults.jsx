// AuditResults Component - Displays audit results with traffic light icons
import './AuditResults.css';

export function AuditResults({ results }) {
    if (!results || !results.success) return null;

    const { auditResults, globalScore, status } = results;
    
    // Count passed/failed
    const audits = Object.entries(auditResults);
    const passed = audits.filter(([_, r]) => r.passed).length;
    const failed = audits.length - passed;

    // Determine summary
    const getSummaryIcon = () => {
        if (failed === 0) return '🟢';
        if (failed <= 2) return '🟡';
        return '🔴';
    };

    const getSummaryText = () => {
        if (failed === 0) return `All ${passed} checks passed! Ready for permit submission.`;
        const failedNames = audits.filter(([_, r]) => !r.passed).map(([k]) => k).join(', ');
        return `${passed} of ${audits.length} passed. Issues: ${failedNames}`;
    };

    return (
        <div className="audit-results">
            {/* Summary Banner */}
            <div className={`summary-banner ${failed === 0 ? 'success' : failed <= 2 ? 'warning' : 'danger'}`}>
                <span className="summary-icon">{getSummaryIcon()}</span>
                <div className="summary-content">
                    <div className="summary-title">{status}</div>
                    <div className="summary-text">{getSummaryText()}</div>
                </div>
                <div className="global-score">
                    <div className="score-value">{Math.round(globalScore)}</div>
                    <div className="score-label">Score</div>
                </div>
            </div>

            {/* Audit Cards */}
            <div className="audit-cards">
                {audits.map(([key, result]) => (
                    <AuditCard key={key} name={key} result={result} />
                ))}
            </div>

            {/* Requirements */}
            <Requirements auditResults={auditResults} />
        </div>
    );
}

function AuditCard({ name, result }) {
    const getIcon = () => {
        if (result.passed) return '✓';
        return '✗';
    };

    const getName = () => {
        const names = {
            hydraulic: '🌊 Flood Risk',
            wind: '💨 Wind Load',
            thermal: '🔥 Heat Island',
            seismic: '🌋 Seismic'
        };
        return names[name] || name;
    };

    return (
        <div className={`audit-card ${result.passed ? 'passed' : 'failed'}`}>
            <div className="card-header">
                <span className="card-icon">{getIcon()}</span>
                <span className="card-name">{getName()}</span>
            </div>
            <div className="card-score">{result.score}</div>
            <div className="card-status">{result.status}</div>
            {result.data && (
                <div className="card-data">
                    {Object.entries(result.data).slice(0, 2).map(([k, v]) => (
                        <div key={k} className="data-item">
                            <span className="data-label">{k}:</span>
                            <span className="data-value">{String(v)}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function Requirements({ auditResults }) {
    const allRequirements = Object.entries(auditResults)
        .flatMap(([key, result]) => 
            (result.requirements || []).map(req => ({ audit: key, requirement: req }))
        );

    if (allRequirements.length === 0) return null;

    return (
        <div className="requirements-section">
            <h3>⚠️ Required Actions</h3>
            <div className="requirements-list">
                {allRequirements.map((item, i) => (
                    <div key={i} className="requirement-item">
                        <span className="req-audit">{item.audit}:</span>
                        <span className="req-text">{item.requirement}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default AuditResults;
