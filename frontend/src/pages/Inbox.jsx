import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import ProfileSidebar from '../components/ProfileSidebar';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Dashboard.css';

const Inbox = () => {
  const [activeTab, setActiveTab] = useState('All');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, api } = useAuth();
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [grade, setGrade] = useState('');
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const role = user?.role?.toLowerCase();

  const fetchInbox = async () => {
    try {
      setLoading(true);
      let response;
      if (role === 'instructor') {
        response = await api.get('/instructor/inbox/assignments');
      } else {
        response = await api.get('/students/inbox/reviews');
      }
      // The backend returns { status: "success", data: { notifications: [] } }
      setNotifications(response.data?.data?.notifications || []);
    } catch (error) {
      console.error("Failed to fetch inbox messages:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInbox();
  }, [role]);

  const handleMarkRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.notification_id === id ? { ...n, is_read: true } : n));
    } catch (error) {
      console.error("Failed to mark as read", error);
    }
  };

  const handleReview = async () => {
    if (!selectedSubmission || !grade) return;
    try {
      setSubmitting(true);
      await api.patch(`/assignments/submissions/${selectedSubmission.submission_id}/review`, {
        grade: parseInt(grade),
        feedback
      });
      setSelectedSubmission(null);
      setGrade('');
      setFeedback('');
      fetchInbox();
    } catch (error) {
      console.error("Failed to submit review", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-layout">
        <Sidebar activePath="/dashboard/inbox" />

        <div className="main-dashboard-content w-100 p-4">
          <div className="container-fluid max-width-custom pt-5 mt-4 mx-auto">

            <div className="inbox-card-border" style={{ backgroundColor: '#fff', border: '1px solid #f1f1f3', borderRadius: '15px', padding: '0px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', position: 'relative', minHeight: '600px' }}>
              
              {/* Header */}
              <div className="d-flex justify-content-between align-items-center p-4 pb-0">
                <h4 className="fw-bold mb-0 d-flex align-items-center" style={{ fontSize: '18px', color: '#1a1d20' }}>
                  Inbox <i className="fas fa-caret-down ms-2 fs-6 text-muted"></i>
                </h4>
                <div className="d-flex gap-3 text-muted fs-5">
                  <i className="fas fa-sync-alt" style={{ cursor: 'pointer', fontSize: '14px' }} onClick={fetchInbox}></i>
                  <i className="fas fa-cog" style={{ cursor: 'pointer', fontSize: '14px' }}></i>
                </div>
              </div>

              {/* Tabs */}
              <div className="d-flex gap-4 px-4 pt-4 mb-2" style={{ borderBottom: '1px solid #eee' }}>
                {['All', 'Unread'].map((tab) => (
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

              {/* Message List */}
              <div className="inbox-messages-list" style={{ flexGrow: 1, overflowY: 'auto', maxHeight: '500px' }}>
                {loading ? (
                  [1, 2, 3].map((_, index) => (
                    <div key={index} className="d-flex align-items-start p-4" style={{ borderBottom: '1px solid #f8f9fa' }}>
                      <div className="rounded-circle me-3" style={{ width: '40px', height: '40px', backgroundColor: '#f2f4f7' }}></div>
                      <div className="w-100">
                        <div style={{ width: '25%', height: '12px', backgroundColor: '#f2f4f7', borderRadius: '10px', marginBottom: '8px' }}></div>
                        <div style={{ width: '80%', height: '12px', backgroundColor: '#f2f4f7', borderRadius: '10px' }}></div>
                      </div>
                    </div>
                  ))
                ) : notifications.length === 0 ? (
                  <div className="text-center p-5 text-muted d-flex flex-column justify-content-center align-items-center h-100">
                    <i className="fas fa-inbox mb-3 fs-2" style={{ color: '#ccc' }}></i>
                    <p>Your inbox is empty.</p>
                  </div>
                ) : (
                  notifications
                    .filter(n => activeTab === 'All' || !n.is_read)
                    .map((n) => {
                      const isInstructor = role === 'instructor';
                      const studentName = n.submission?.student?.name || 'Student';
                      const lessonTitle = n.submission?.lessonContent?.title || 'Assignment';
                      
                      return (
                        <div 
                          key={n.notification_id} 
                          className="d-flex align-items-start p-4" 
                          style={{ 
                            borderBottom: '1px solid #f8f9fa', 
                            cursor: 'pointer',
                            backgroundColor: n.is_read ? 'transparent' : '#f0f4ff'
                          }}
                          onClick={() => handleMarkRead(n.notification_id)}
                        >
                          <div className="rounded-circle d-flex justify-content-center align-items-center me-3 text-white fw-bold" 
                               style={{ width: '40px', height: '40px', backgroundColor: isInstructor ? '#6c5ce7' : '#22c55e' }}>
                            {isInstructor ? studentName[0].toUpperCase() : 'A'}
                          </div>
                          <div className="w-100">
                            <div className="d-flex justify-content-between mb-1">
                              <strong style={{ fontSize: '14px', color: '#333' }}>
                                {isInstructor ? `Submission from ${studentName}` : 'Assignment Reviewed'}
                              </strong>
                              <span style={{ fontSize: '12px', color: '#9fa2a6' }}>
                                {new Date(n.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <div style={{ fontSize: '13px', fontWeight: '600', color: '#555', marginBottom: '4px' }}>
                              {lessonTitle}
                            </div>
                            <div style={{ fontSize: '13px', color: '#777' }}>
                              {isInstructor 
                                ? `New file submitted for review. Click to view.` 
                                : `Grade: ${n.submission?.grade}% - ${n.submission?.feedback || 'View feedback'}`
                              }
                            </div>
                            {isInstructor && (
                              <div className="mt-3 hstack gap-2">
                                <a href={n.submission?.file_url} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-primary rounded-pill px-3">
                                  View File
                                </a>
                                <button 
                                  className="btn btn-sm btn-primary-custom rounded-pill px-3 text-white"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedSubmission(n.submission);
                                  }}
                                >
                                  Review
                                </button>
                              </div>
                            )}
                          </div>
                          {!n.is_read && <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#6c5ce7', marginTop: '15px' }}></div>}
                        </div>
                      );
                    })
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

      {selectedSubmission && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="bg-white p-5 rounded-4 shadow-lg border" style={{ maxWidth: '500px', width: '90%' }}>
            <h4 className="fw-bold mb-4">Review Submission</h4>
            <div className="mb-4 text-center p-3 bg-light rounded-3">
                <a href={selectedSubmission.file_url} target="_blank" rel="noreferrer" className="text-primary-custom fw-bold text-decoration-none">
                  <i className="fas fa-file-download me-2"></i> Download Student File
                </a>
            </div>
            <div className="mb-3">
              <label className="form-label small fw-bold">GRADE (0-100)</label>
              <input type="number" className="form-control" value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="Enter grade..." />
            </div>
            <div className="mb-4">
              <label className="form-label small fw-bold">FEEDBACK (OPTIONAL)</label>
              <textarea className="form-control" rows="3" value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Well done! Keep it up..."></textarea>
            </div>
            <div className="hstack gap-2 justify-content-end">
              <button className="btn btn-light rounded-pill px-4" onClick={() => setSelectedSubmission(null)}>Cancel</button>
              <button className="btn btn-primary-custom rounded-pill px-4 text-white shadow" onClick={handleReview} disabled={submitting}>
                {submitting ? 'Saving...' : 'Save Grade'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inbox;
