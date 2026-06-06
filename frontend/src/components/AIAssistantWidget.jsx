import React, { useState, useEffect, useRef } from 'react';
import { Bot, X, Send, Trash2, Loader2, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { sendMessage, clearHistory } from '../services/assistantService';
import { useAuth } from '../contexts/AuthContext';
import '../styles/AIAssistantWidget.css';

const AIAssistantWidget = () => {
  const { isAuthenticated, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // If user is not authenticated or not student/instructor, don't show the widget
  if (!isAuthenticated || (user?.role !== 'student' && user?.role !== 'instructor')) {
    return null;
  }

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage = { role: 'user', content: inputValue };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await sendMessage(inputValue);
      if (response.status === 'success') {
        const botMessage = { role: 'bot', content: response.data.reply };
        setMessages((prev) => [...prev, botMessage]);
      }
    } catch (error) {
      console.error('Failed to send message to AI:', error);
      const errorMessage = { role: 'bot', content: '**Error:** Something went wrong while connecting to the assistant. Please try again later.' };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (window.confirm('Are you sure you want to clear the conversation history?')) {
      try {
        await clearHistory();
        setMessages([]);
      } catch (error) {
        console.error('Failed to clear history:', error);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="ai-assistant-wrapper">
      {/* Floating Button */}
      <button 
        className={`ai-assistant-toggle ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle AI Assistant"
      >
        {isOpen ? <X size={24} /> : (
          <>
            <Bot size={28} />
            <Sparkles className="sparkle-icon" size={16} />
          </>
        )}
      </button>

      {/* Chat Window */}
      <div className={`ai-assistant-window ${isOpen ? 'open' : ''}`}>
        {/* Header */}
        <div className="ai-assistant-header">
          <div className="ai-assistant-header-title">
            <Bot size={20} />
            <span>AI Tutor</span>
          </div>
          <button 
            className="ai-assistant-clear-btn" 
            onClick={handleClearHistory} 
            title="Clear Chat History"
          >
            <Trash2 size={16} />
          </button>
        </div>

        {/* Messages Area */}
        <div className="ai-assistant-messages">
          {messages.length === 0 ? (
            <div className="ai-assistant-empty">
              <Bot size={48} className="empty-icon" />
              <h3>Hello, {user?.name?.split(' ')[0] || 'there'}! 👋</h3>
              <p>I'm your AI teaching assistant. How can I help you with your studies today?</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className={`ai-message-wrapper ${msg.role === 'user' ? 'user-wrapper' : 'bot-wrapper'}`}>
                {msg.role === 'bot' && (
                  <div className="ai-avatar">
                    <Bot size={16} />
                  </div>
                )}
                <div className={`ai-message ${msg.role}`}>
                  {msg.role === 'user' ? (
                    msg.content
                  ) : (
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  )}
                </div>
              </div>
            ))
          )}
          
          {isLoading && (
            <div className="ai-message-wrapper bot-wrapper">
              <div className="ai-avatar">
                <Bot size={16} />
              </div>
              <div className="ai-message bot loading">
                <Loader2 size={16} className="spin-animation" />
                <span>Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="ai-assistant-input-area">
          <textarea
            className="ai-assistant-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything..."
            rows={1}
          />
          <button 
            className="ai-assistant-send-btn"
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIAssistantWidget;
