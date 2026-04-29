import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import ProfileSidebar from '../components/ProfileSidebar';
import '../styles/Dashboard.css';

import { chatService } from '../services';

const Chat = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  // Initial fetch and polling
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await chatService.getMessages();
        setMessages(response.data?.data || []);
      } catch (error) {
        console.error("Failed to fetch chat messages:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    try {
      // Optimistically add to UI
      const newMessage = { id: Date.now(), type: 'sent', text: message };
      setMessages((prev) => [...prev, newMessage]);
      setMessage('');
      
      await chatService.sendMessage({ text: newMessage.text });
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-layout">
        <Sidebar activePath="/chat" />

        <div className="main-dashboard-content w-100 p-4">
          <div className="container-fluid max-width-custom pt-5 mt-4 mx-auto">

            {/* Breadcrumb */}
            <div className="d-flex align-items-center gap-2 mb-4">
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>Chat</span>
              <i className="fas fa-chevron-right" style={{ fontSize: '10px', color: '#aaa' }}></i>
              <i className="fas fa-chevron-right" style={{ fontSize: '10px', color: '#aaa' }}></i>
            </div>

            <div style={{ backgroundColor: '#fff', border: '1px solid #f1f1f3', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', minHeight: '500px' }}>
              
              {/* Chat Header */}
              <div style={{ backgroundColor: '#31506a', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '42px', height: '42px', backgroundColor: 'rgba(255,255,255,0.15)', flexShrink: 0 }}>
                  <i className="fas fa-user" style={{ color: '#fff', fontSize: '16px' }}></i>
                </div>
                <div>
                  <div style={{ color: '#fff', fontWeight: '600', fontSize: '15px' }}>Chat</div>
                  <div style={{ fontSize: '12px', color: '#a8d5b5' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#44c464', display: 'inline-block', marginRight: '6px' }}></span>
                    online
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-grow-1 p-4" style={{ minHeight: '350px', backgroundColor: '#fafbfc', overflowY: 'auto' }}>
                {loading && messages.length === 0 ? (
                  <div className="d-flex justify-content-center align-items-center h-100">
                    <div className="spinner-border text-primary" role="status"></div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-muted h-100 d-flex flex-column justify-content-center">
                    <p>No messages yet. Start a conversation!</p>
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-3">
                    {messages.map((msg) => (
                      <div key={msg.id} className={`d-flex align-items-end gap-2 ${msg.type === 'sent' ? 'justify-content-end' : 'justify-content-start'}`}>
                        {msg.type === 'received' && (
                          <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px', backgroundColor: '#e8dcfa', flexShrink: 0 }}>
                            <i className="fas fa-user text-primary" style={{ fontSize: '14px' }}></i>
                          </div>
                        )}
                        {msg.type === 'received' ? (
                          <div style={{ maxWidth: '65%', backgroundColor: '#e5e7eb', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center' }}>
                            <span style={{ fontSize: '13px', color: '#555', wordBreak: 'break-word' }}>{msg.text || '...'}</span>
                          </div>
                        ) : (
                          <div style={{ maxWidth: '65%', backgroundColor: '#31506a', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center' }}>
                            <span style={{ fontSize: '13px', color: '#fff', wordBreak: 'break-word' }}>{msg.text || '...'}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="d-flex align-items-center px-4 py-3" style={{ borderTop: '1px solid #f1f1f3' }}>
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(); }}
                  placeholder="Ask your question..."
                  style={{ border: 'none', outline: 'none', flex: 1, fontSize: '14px', color: '#555', backgroundColor: 'transparent' }}
                />
                <button 
                  onClick={handleSendMessage}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#31506a', fontSize: '18px' }}
                >
                  <i className="fas fa-paper-plane"></i>
                </button>
              </div>

            </div>
          </div>
        </div>

        <ProfileSidebar />
      </div>
    </div>
  );
};

export default Chat;
