import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import ProfileSidebar from '../components/ProfileSidebar';
import '../styles/Dashboard.css';

const Chat = () => {
  const [message, setMessage] = useState('');

  const dummyMessages = [
    { id: 1, type: 'received', text: 'How can I help you today?', avatar: true },
    { id: 2, type: 'sent' },
    { id: 3, type: 'received', text: 'Let me know!', avatar: true },
    { id: 4, type: 'sent' },
    { id: 5, type: 'received', text: 'Feel free to ask questions.', avatar: true },
  ];

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
              <div className="flex-grow-1 p-4" style={{ minHeight: '350px', backgroundColor: '#fafbfc' }}>
                <div className="d-flex flex-column gap-3">
                  {dummyMessages.map((msg) => (
                    <div key={msg.id} className={`d-flex align-items-end gap-2 ${msg.type === 'sent' ? 'justify-content-end' : 'justify-content-start'}`}>
                      {msg.type === 'received' && (
                        <div className="rounded-circle" style={{ width: '36px', height: '36px', backgroundColor: '#e8dcfa', flexShrink: 0 }}></div>
                      )}
                      {msg.type === 'received' ? (
                        <div style={{ maxWidth: '55%', height: '14px', backgroundColor: '#e5e7eb', borderRadius: '12px', padding: '22px 16px', display: 'flex', alignItems: 'center' }}>
                          <span style={{ fontSize: '13px', color: '#555' }}>{msg.text}</span>
                        </div>
                      ) : (
                        <div style={{ width: '120px', height: '36px', backgroundColor: '#31506a', borderRadius: '12px', opacity: 0.85 }}></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Input Area */}
              <div className="d-flex align-items-center px-4 py-3" style={{ borderTop: '1px solid #f1f1f3' }}>
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask your question..."
                  style={{ border: 'none', outline: 'none', flex: 1, fontSize: '14px', color: '#555', backgroundColor: 'transparent' }}
                />
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#31506a', fontSize: '18px' }}>
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
