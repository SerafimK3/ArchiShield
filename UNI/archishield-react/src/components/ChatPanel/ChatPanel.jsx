/**
 * ChatPanel - Premium AI Query Interface
 * Vienna Spot-Audit Brain with AI Remediation
 */
import { useState, useRef, useEffect } from 'react';
import { queryGemini } from '../../services/gemini';
import { getRemediationSuggestions } from '../../services/remediation';
import './ChatPanel.css';

function ChatPanel({ auditContext, auditResults, onApplyFix, onLocationSuggested }) {
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: 'Hello! I\'m the Vienna Spot-Audit AI. Ask me anything about building regulations, height limits, heritage zones, or where you can build in Vienna.'
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [remediations, setRemediations] = useState(null);
    const [isGeneratingFix, setIsGeneratingFix] = useState(false);
    const messagesEndRef = useRef(null);
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;
        
        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);
        
        try {
            const result = await queryGemini(userMessage, auditContext);
            
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: result.response
            }]);
            
            if (result.suggestedLocation && onLocationSuggested) {
                onLocationSuggested(result.suggestedLocation);
            }
        } catch (error) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `Sorry, I encountered an error: ${error.message}. Please try again.`,
                isError: true
            }]);
        } finally {
            setIsLoading(false);
        }
    };
    
    // Generate AI remediation suggestions
    const handleGenerateRemediation = async () => {
        if (!auditResults || isGeneratingFix) return;
        
        setIsGeneratingFix(true);
        setRemediations(null);
        
        try {
            const suggestions = await getRemediationSuggestions(auditResults);
            setRemediations(suggestions);
            
            // Add a message about remediation
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `🔧 I've analyzed your building and found ${suggestions.combined.length} remediation strategies. Click "Apply" on any suggestion to update your design.`
            }]);
        } catch (error) {
            console.error('Remediation generation failed:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Sorry, I couldn\'t generate remediation suggestions. Please try again.',
                isError: true
            }]);
        } finally {
            setIsGeneratingFix(false);
        }
    };
    
    // Apply a remediation action
    const handleApplyRemediation = (remediation) => {
        if (remediation.action && onApplyFix) {
            onApplyFix(remediation.action);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `✅ Applied: ${remediation.title}. Re-running audit to verify improvement...`
            }]);
        }
    };
    
    // Check if there are violations that need fixing
    const hasViolations = auditResults?.constraints?.some(
        c => c.severity === 'critical' || c.severity === 'blocking' || c.severity === 'important'
    );
    
    const quickQuestions = [
        "Max height near Stephansdom?",
        "Can I build in a flood zone?",
        "Climate mandates?"
    ];
    
    // SVG Icons
    const BotIcon = () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="10" rx="2"/>
            <circle cx="12" cy="5" r="2"/>
            <path d="M12 7v4"/>
            <line x1="8" y1="16" x2="8" y2="16"/>
            <line x1="16" y1="16" x2="16" y2="16"/>
        </svg>
    );
    
    const SendIcon = () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
        </svg>
    );
    
    const CloseIcon = () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
    );
    
    const MessageIcon = () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
    );
    
    return (
        <>
            {/* Toggle Button - Premium FAB */}
            <button 
                className={`chat-toggle ${isOpen ? 'open' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                title="Ask AI about Vienna regulations"
            >
                {isOpen ? <CloseIcon /> : <MessageIcon />}
            </button>
            
            {/* Chat Panel */}
            <div className={`chat-panel ${isOpen ? 'open' : ''}`}>
                <div className="chat-header">
                    <div className="chat-icon">
                        <BotIcon />
                    </div>
                    <span className="chat-header-title">Vienna AI Assistant</span>
                    <span className="chat-status">Online</span>
                </div>
                
                <div className="chat-messages">
                    {messages.map((msg, idx) => (
                        <div 
                            key={idx} 
                            className={`chat-message ${msg.role} ${msg.isError ? 'error' : ''}`}
                        >
                            {msg.role === 'assistant' && (
                                <span className="msg-icon">
                                    <BotIcon />
                                </span>
                            )}
                            <div className="msg-content">{msg.content}</div>
                        </div>
                    ))}
                    
                    {isLoading && (
                        <div className="chat-message assistant loading">
                            <span className="msg-icon">
                                <BotIcon />
                            </span>
                            <div className="msg-content">
                                <span className="typing-indicator">
                                    <span></span><span></span><span></span>
                                </span>
                            </div>
                        </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                </div>
                
                {/* Quick Questions */}
                {messages.length <= 2 && (
                    <div className="chat-quick">
                        {quickQuestions.map((q, idx) => (
                            <button 
                                key={idx}
                                onClick={() => setInput(q)}
                                className="quick-btn"
                            >
                                {q}
                            </button>
                        ))}
                    </div>
                )}
                
                {/* Fix Violations Button */}
                {hasViolations && !remediations && (
                    <div className="remediation-trigger">
                        <button 
                            className="fix-all-btn"
                            onClick={handleGenerateRemediation}
                            disabled={isGeneratingFix}
                        >
                            {isGeneratingFix ? (
                                <><span className="spinner"></span> Analyzing...</>
                            ) : (
                                <>🔧 Fix All Violations</>
                            )}
                        </button>
                    </div>
                )}
                
                {/* Remediation Cards */}
                {remediations && (
                    <div className="remediation-list">
                        <div className="remediation-header">
                            <span>🤖 AI Remediation Strategies</span>
                            <button className="close-remediation" onClick={() => setRemediations(null)}>×</button>
                        </div>
                        {remediations.combined.map((rem, idx) => (
                            <div key={idx} className="remediation-card">
                                <div className="rem-icon">{rem.icon}</div>
                                <div className="rem-content">
                                    <div className="rem-title">{rem.title}</div>
                                    <div className="rem-desc">{rem.description}</div>
                                    <div className="rem-impact">{rem.impact}</div>
                                </div>
                                {rem.action && (
                                    <button 
                                        className="rem-apply-btn"
                                        onClick={() => handleApplyRemediation(rem)}
                                    >
                                        Apply
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
                
                <form className="chat-input-form" onSubmit={handleSubmit}>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask about Vienna building rules..."
                        disabled={isLoading}
                    />
                    <button type="submit" disabled={isLoading || !input.trim()}>
                        <SendIcon />
                    </button>
                </form>
            </div>
        </>
    );
}

export default ChatPanel;
