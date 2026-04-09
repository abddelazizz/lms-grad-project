import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import ProfileSidebar from '../components/ProfileSidebar';
import '../styles/Dashboard.css';

const Inbox = () => {
  const [activeTab, setActiveTab] = useState('All');

  // Dummy messages to render skeleton list
  const messages = [1, 2, 3];

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

              {/* Message Shadows / Skeletons */}
              <div className="inbox-messages-list">
                {messages.map((msg, index) => (
                  <div key={index} className="d-flex align-items-start p-4" style={{ borderBottom: '1px solid #f8f9fa' }}>
                    <div className="rounded-circle me-3" style={{ width: '40px', height: '40px', backgroundColor: '#f2f4f7' }}></div>
                    <div className="w-100">
                      <div className="d-flex justify-content-between mb-2">
                        <div style={{ width: '25%', height: '12px', backgroundColor: '#f2f4f7', borderRadius: '10px' }}></div>
                        <div style={{ width: '15%', height: '12px', backgroundColor: '#f2f4f7', borderRadius: '10px' }}></div>
                      </div>
                      <div style={{ width: '80%', height: '12px', backgroundColor: '#f2f4f7', borderRadius: '10px', marginBottom: '8px' }}></div>
                      <div style={{ width: '60%', height: '12px', backgroundColor: '#f2f4f7', borderRadius: '10px' }}></div>
                    </div>
                  </div>
                ))}
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
