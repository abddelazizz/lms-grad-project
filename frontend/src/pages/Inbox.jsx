import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import ProfileSidebar from '../components/ProfileSidebar';
import '../styles/Dashboard.css';

import { inboxService } from '../services';

const Inbox = () => {
  const [activeTab, setActiveTab] = useState('All');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInbox = async () => {
      try {
        const response = await inboxService.getMessages();
        setMessages(response.data?.data || []);
      } catch (error) {
        console.error("Failed to fetch inbox messages:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchInbox();
  }, []);

  return (
    <div className="dashboard-page">
      <div className="dashboard-layout">
        <Sidebar activePath="/inbox" />

        <div className="main-dashboard-content w-100 p-4">
          <div className="container-fluid max-width-custom pt-5 mt-4 mx-auto">

            <div className="inbox-card-border" style={{ backgroundColor: '#fff', border: '1px solid #f1f1f3', borderRadius: '15px', padding: '0px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', position: 'relative', minHeight: '600px' }}>
              
              {/* Header */}
              <div className="d-flex justify-content-between align-items-center p-4 pb-0">
                <h4 className="fw-bold mb-0 d-flex align-items-center" style={{ fontSize: '18px', color: '#1a1d20' }}>
                  Inbox <i className="fas fa-caret-down ms-2 fs-6 text-muted"></i>
                </h4>
                <div className="d-flex gap-3 text-muted fs-5">
                  <i className="fas fa-ellipsis-h" style={{ cursor: 'pointer' }}></i>
                  <i className="fas fa-cog" style={{ cursor: 'pointer' }}></i>
                </div>
              </div>

              {/* Tabs */}
              <div className="d-flex gap-4 px-4 pt-4 mb-2" style={{ borderBottom: '1px solid #eee' }}>
                {['All', 'Alerts', 'Newsletter'].map((tab) => (
                  <div 
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{ 
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: activeTab === tab ? '600' : '500',
                      color: activeTab === tab ? '#333' : '#9fa2a6',
                      paddingBottom: '12px',
                      borderBottom: activeTab === tab ? '3px solid #6c5ce7' : '3px solid transparent',
                      transition: 'all 0.2s'
                    }}
                  >
                    {tab}
                  </div>
                ))}
              </div>

              {/* Message Shadows / List */}
              <div className="inbox-messages-list" style={{ flexGrow: 1, overflowY: 'auto', maxHeight: '450px' }}>
                {loading ? (
                  // Loading skeletons
                  [1, 2, 3].map((_, index) => (
                    <div key={index} className="d-flex align-items-start p-4" style={{ borderBottom: '1px solid #f8f9fa' }}>
                      <div className="rounded-circle me-3 placeholder-glow" style={{ width: '40px', height: '40px', backgroundColor: '#f2f4f7' }}></div>
                      <div className="w-100 placeholder-glow">
                        <div className="d-flex justify-content-between mb-2">
                          <div style={{ width: '25%', height: '12px', backgroundColor: '#f2f4f7', borderRadius: '10px' }}></div>
                          <div style={{ width: '15%', height: '12px', backgroundColor: '#f2f4f7', borderRadius: '10px' }}></div>
                        </div>
                        <div style={{ width: '80%', height: '12px', backgroundColor: '#f2f4f7', borderRadius: '10px', marginBottom: '8px' }}></div>
                        <div style={{ width: '60%', height: '12px', backgroundColor: '#f2f4f7', borderRadius: '10px' }}></div>
                      </div>
                    </div>
                  ))
                ) : messages.length === 0 ? (
                  <div className="text-center p-5 text-muted d-flex flex-column justify-content-center align-items-center h-100">
                    <i className="fas fa-inbox mb-3 fs-2" style={{ color: '#ccc' }}></i>
                    <p>Your inbox is empty.</p>
                  </div>
                ) : (
                  messages.map((msg, index) => (
                    <div key={msg.id || index} className="d-flex align-items-start p-4" style={{ borderBottom: '1px solid #f8f9fa', cursor: 'pointer' }}>
                      <div className="rounded-circle d-flex justify-content-center align-items-center me-3 text-white fw-bold" style={{ width: '40px', height: '40px', backgroundColor: '#6c5ce7' }}>
                        {(msg.senderName || 'U')[0].toUpperCase()}
                      </div>
                      <div className="w-100">
                        <div className="d-flex justify-content-between mb-1">
                          <strong style={{ fontSize: '14px', color: '#333' }}>{msg.senderName || 'Unknown User'}</strong>
                          <span style={{ fontSize: '12px', color: '#9fa2a6' }}>{msg.date || 'Just now'}</span>
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#555', marginBottom: '4px' }}>{msg.subject || 'No Subject'}</div>
                        <div style={{ fontSize: '13px', color: '#777', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {msg.content || msg.text || 'No content preview available.'}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer text */}
              <div className="text-center w-100" style={{ position: 'absolute', bottom: '20px' }}>
                <span style={{ fontSize: '10px', color: '#ccc', letterSpacing: '2px', fontWeight: 'bold' }}>
                  INBOX BY <i className="fab fa-neos"></i> novu
                </span>
              </div>

            </div>
          </div>
        </div>

        <ProfileSidebar />
      </div>
    </div>
  );
};

export default Inbox;
