import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Loader2, History, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BASE_URL from '../../url';
import '../styles/AskAiSidebar.css';

const SUGGESTED_PROMPTS = [
  'How many candidates are in the system?',
  'List all candidates with H1B visa',
  'Who are the top Java developers?',
];

const AI_CHAT_PROXY = `${BASE_URL}/api/resumes/chat`;

const AskAiSidebar = ({ isOpen, onClose, candidates = [] }) => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState(() => {
    try {
      const saved = sessionStorage.getItem('erp_ask_ai_msgs');
      if (saved) return JSON.parse(saved);
    } catch { }
    return [];
  });
  const [inputValue, setInputValue] = useState(() => sessionStorage.getItem('erp_ask_ai_input') || '');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(() => sessionStorage.getItem('erp_ask_ai_session') || null);
  const [chatId, setChatId] = useState(() => sessionStorage.getItem('erp_ask_ai_chat_id') || Date.now().toString());
  const [showHistory, setShowHistory] = useState(false);
  const [chatHistory, setChatHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('erp_ask_ai_history');
      if (saved) return JSON.parse(saved);
    } catch { }
    return [];
  });
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    sessionStorage.setItem('erp_ask_ai_msgs', JSON.stringify(messages));
    
    // Auto-save history
    if (messages.length > 0) {
      setChatHistory(prev => {
        const history = [...prev];
        const sessionIndex = history.findIndex(h => h.chatId === chatId);
        const title = messages.find(m => m.role === 'user')?.content?.substring(0, 35) || 'New Chat';
        const displayTitle = title + (title.length >= 35 ? '...' : '');
        
        if (sessionIndex >= 0) {
          history[sessionIndex] = { ...history[sessionIndex], messages, title: displayTitle, sessionId };
        } else {
          history.unshift({
            chatId,
            sessionId,
            date: new Date().toISOString(),
            title: displayTitle,
            messages: [...messages]
          });
        }
        localStorage.setItem('erp_ask_ai_history', JSON.stringify(history));
        return history;
      });
    }
  }, [messages, chatId, sessionId]);

  useEffect(() => {
    sessionStorage.setItem('erp_ask_ai_input', inputValue);
  }, [inputValue]);

  useEffect(() => {
    if (sessionId) sessionStorage.setItem('erp_ask_ai_session', sessionId);
  }, [sessionId]);

  useEffect(() => {
    sessionStorage.setItem('erp_ask_ai_chat_id', chatId);
  }, [chatId]);

  // Get current user name from localStorage
  const userName = (() => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user.firstName || user.name || 'User';
    } catch {
      return 'User';
    }
  })();

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchAiResponse = async (question) => {
    setIsLoading(true);
    try {
      const response = await fetch(AI_CHAT_PROXY, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          question,
          session_id: sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      
      // Update session ID if returned
      if (data.session_id) {
        setSessionId(data.session_id);
      }

      return data.answer || "I'm sorry, I couldn't process that request.";
    } catch (error) {
      console.error('AI Error:', error);
      return "Sorry, I encountered an error connecting to the AI service. Please try again later.";
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async (textOverride) => {
    const text = typeof textOverride === 'string' ? textOverride.trim() : inputValue.trim();
    if (!text || isLoading) return;

    if (!textOverride) {
      setInputValue('');
    }

    const userMsg = { role: 'user', content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);

    const answer = await fetchAiResponse(text);
    
    const aiMsg = {
      role: 'ai',
      content: answer,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, aiMsg]);
  };

  const handlePromptClick = (prompt) => {
    handleSend(prompt);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setInputValue('');
    setSessionId(null);
    setChatId(Date.now().toString());
    sessionStorage.removeItem('erp_ask_ai_msgs');
    sessionStorage.removeItem('erp_ask_ai_input');
    sessionStorage.removeItem('erp_ask_ai_session');
    setShowHistory(false);
  };

  if (!isOpen) return null;

  return (
    <div className={`cm-ai-sidebar ${isOpen ? 'cm-ai-sidebar--open' : ''}`}>
      {/* Header */}
      <div className="cm-ai-sidebar-header">
        <div className="cm-ai-sidebar-header-left">
          <span className="cm-ai-sidebar-title" style={{ fontWeight: 600, fontSize: '0.9rem', color: '#229C8B', letterSpacing: '0.5px' }}> 
            <Sparkles size={15} /> ASK AI
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {messages.length > 0 && !showHistory && (
            <button 
              onClick={handleNewChat}
              style={{
                background: 'transparent', border: '1px solid #e2e8f0', color: '#475569', fontSize: '11px',
                fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', padding: '4px 10px',
                display: 'flex', alignItems: 'center', borderRadius: '6px', whiteSpace: 'nowrap',
                textTransform: 'uppercase', letterSpacing: '0.04em'
              }}
              onMouseOver={(e) => { e.currentTarget.style.color = '#0f766e'; e.currentTarget.style.background = '#f0fdfa'; e.currentTarget.style.borderColor = '#a7f3d0'; }}
              onMouseOut={(e) => { e.currentTarget.style.color = '#475569'; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
              title="Start a new chat"
            >
              New Chat
            </button>
          )}
          <button 
            onClick={() => setShowHistory(!showHistory)}
            style={{
              background: showHistory ? '#f0fdfa' : 'transparent', border: '1px solid',
              borderColor: showHistory ? '#a7f3d0' : '#e2e8f0', color: showHistory ? '#0f766e' : '#475569',
              fontSize: '11px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', padding: '4px 10px',
              display: 'flex', alignItems: 'center', gap: '4px', borderRadius: '6px', whiteSpace: 'nowrap',
              textTransform: 'uppercase', letterSpacing: '0.04em'
            }}
            onMouseOver={(e) => { e.currentTarget.style.color = '#0f766e'; e.currentTarget.style.background = '#f0fdfa'; e.currentTarget.style.borderColor = '#a7f3d0'; }}
            onMouseOut={(e) => { 
               if (!showHistory) {
                 e.currentTarget.style.color = '#475569'; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#e2e8f0';
               }
            }}
            title="Chat History"
          >
            <History size={14} /> History
          </button>
          <button className="cm-ai-sidebar-close" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="cm-ai-sidebar-body">
        {showHistory ? (
          <div className="cm-ai-sidebar-history cm-ai-sidebar-welcome">
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <h3 style={{ fontSize: '1rem', color: '#374151', margin: 0, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <History size={16} color="#229C8B" /> Chat History
              </h3>
              {chatHistory.length > 0 && (
                <button 
                  onClick={() => {
                    if (window.confirm('Are you sure you want to clear all chat history?')) {
                      localStorage.removeItem('erp_ask_ai_history');
                      setChatHistory([]);
                      if (messages.length > 0) handleNewChat();
                    }
                  }}
                  style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}
                >
                  Clear All
                </button>
              )}
            </div>
            
            {chatHistory.length === 0 ? (
              <div style={{ width: '100%', padding: '32px 0', textAlign: 'center', color: '#6b7280' }}>
                <History size={32} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
                <p style={{ fontSize: '0.9rem', margin: 0 }}>No chat history yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                {chatHistory.map((historyItem) => (
                  <div 
                    key={historyItem.chatId}
                    style={{ 
                      padding: '12px', 
                      background: '#f9fafb', 
                      border: '1px solid',
                      borderColor: (chatId === historyItem.chatId && !showHistory) ? '#229C8B' : '#e5e7eb',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      width: '100%',
                      boxSizing: 'border-box'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.borderColor = '#229C8B'; e.currentTarget.style.background = '#f0fdfa'; }}
                    onMouseOut={(e) => { 
                      e.currentTarget.style.borderColor = (chatId === historyItem.chatId && !showHistory) ? '#229C8B' : '#e5e7eb'; 
                      e.currentTarget.style.background = '#f9fafb';
                    }}
                    onClick={() => {
                      setMessages(historyItem.messages);
                      setSessionId(historyItem.sessionId);
                      setChatId(historyItem.chatId);
                      setShowHistory(false);
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#111827', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MessageSquare size={14} color="#6b7280" />
                        {historyItem.title}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', paddingLeft: '20px' }}>
                      {new Date(historyItem.date).toLocaleDateString()} at {new Date(historyItem.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : messages.length === 0 ? (
          <div className="cm-ai-sidebar-welcome">
            <h2 className="cm-ai-sidebar-greeting">
              Hello, {userName}
            </h2>
            <p className="cm-ai-sidebar-subtext">How can I help you today?</p>

            <div className="cm-ai-sidebar-prompts">
              {SUGGESTED_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  className="cm-ai-sidebar-prompt-btn"
                  onClick={() => handlePromptClick(prompt)}
                  disabled={isLoading}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="cm-ai-sidebar-messages">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`cm-ai-sidebar-msg ${msg.role === 'user' ? 'cm-ai-sidebar-msg--user' : 'cm-ai-sidebar-msg--ai'}`}
              >
                {msg.role === 'ai' && (
                  <div className="cm-ai-sidebar-msg-avatar">
                    <Sparkles size={14} />
                  </div>
                )}
                <div className="cm-ai-sidebar-msg-content">
                  {msg.content.split('\n').map((line, i) => {
                    // Check if the line is a bullet point or numbered list
                    const isBullet = line.trim().startsWith('•') || line.trim().startsWith('-') || /^\d+\./.test(line.trim());
                    let formattedHtml = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

                    if (msg.role === 'ai') {
                      const nameMatch = line.match(/^(\s*(?:-|\d+\.)?\s*Name:\s*)(.+)/i);
                      if (nameMatch) {
                        const prefix = nameMatch[1];
                        const namePart = nameMatch[2].trim();
                        
                        const searchName = namePart.toLowerCase();
                        const cand = candidates.find(c => {
                           const cName = `${c.FirstName || ''} ${c.MiddleName || ''} ${c.LastName || ''}`.replace(/\s+/g, ' ').trim().toLowerCase();
                           return cName === searchName || cName.includes(searchName) || searchName.includes(cName);
                        });

                        if (cand) {
                           return (
                             <React.Fragment key={i}>
                               <span className={isBullet ? "cm-ai-sidebar-msg-bullet" : ""} style={{ display: isBullet ? 'block' : 'inline' }}>
                                 {prefix}
                                 <span 
                                   onClick={() => {
                                     navigate(`/candidates/${cand.CandidateId}`);
                                     if (typeof onClose === 'function') onClose();
                                   }}
                                   style={{ color: '#0d9488', cursor: 'pointer', textDecoration: 'underline', fontWeight: 600 }}
                                   title="Open Candidate Profile"
                                 >
                                   {namePart}
                                 </span>
                               </span>
                               {i < msg.content.split('\n').length - 1 && <br />}
                             </React.Fragment>
                           );
                        }
                      }
                    }
                    
                    return (
                      <React.Fragment key={i}>
                        {isBullet ? (
                          <div className="cm-ai-sidebar-msg-bullet" dangerouslySetInnerHTML={{ __html: formattedHtml }} />
                        ) : (
                          <span dangerouslySetInnerHTML={{ __html: formattedHtml }} />
                        )}
                        {i < msg.content.split('\n').length - 1 && <br />}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="cm-ai-sidebar-msg cm-ai-sidebar-msg--ai">
                <div className="cm-ai-sidebar-msg-avatar">
                  <Loader2 size={14} className="animate-spin" />
                </div>
                <div className="cm-ai-sidebar-msg-content loading-msg">
                  AI is thinking...
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      {!showHistory && (
        <div className="cm-ai-sidebar-input-area" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            ref={inputRef}
            type="text"
            className="cm-ai-sidebar-input"
            placeholder="Ask AI anything..."
            style={{ flex: 1, marginBottom: 0 }}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
          <button
            className="cm-ai-sidebar-send-btn"
            onClick={() => handleSend()}
            disabled={!inputValue.trim() || isLoading}
            title="Send"
            style={{ flexShrink: 0 }}
          >
            {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </button>
        </div>
      )}
    </div>
  );
};

export default AskAiSidebar;
