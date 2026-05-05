import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from '../components/Sidebar';
import ProfileSidebar from '../components/ProfileSidebar';
import '../styles/Dashboard.css';

import Swal from 'sweetalert2';
import { assignmentService } from '../services';

const statusColors = {
  pending: { bg: '#fff8e1', color: '#f59e0b', label: 'Pending' },
  submitted: { bg: '#e8f5e9', color: '#22c55e', label: 'Submitted' },
  graded: { bg: '#e3f2fd', color: '#3b82f6', label: 'Graded' },
};

const Assignments = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAssignments = async () => {
    try {
      const response = await assignmentService.getReviewsInbox();
      setNotifications(response.data?.data?.notifications || []);
    } catch (error) {
      console.error("Failed to fetch assignments", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleDeleteSubmission = async (submissionId) => {
    const result = await Swal.fire({
      title: 'Delete Submission?',
      text: "This action cannot be undone!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#31506a',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await assignmentService.deleteSubmission(submissionId);
        Swal.fire('Deleted!', 'Your submission has been deleted.', 'success');
        fetchAssignments();
      } catch (error) {
        console.error("Failed to delete submission", error);
        Swal.fire('Error!', 'Failed to delete submission.', 'error');
      }
    }
  };

  return (
    <div className="dashboard-page">
      <Toaster 
        position="top-center" 
        containerStyle={{ zIndex: 100000 }} 
        toastOptions={{
          style: {
            zIndex: 100001,
          },
        }}
      />
      <div className="dashboard-layout">
        <Sidebar activePath="/dashboard/assignments" />

        <div className="main-dashboard-content w-100 p-4">
          <div className="container-fluid max-width-custom pt-5 mt-4 mx-auto">

            {/* Header */}
            <div className="d-flex align-items-center justify-content-between mb-4">
              <h4 className="fw-bold mb-0" style={{ fontSize: '20px', color: '#1a1d20' }}>
                My Assignments
              </h4>
              <span className="text-muted" style={{ fontSize: '13px' }}>
                {notifications.length} assignment{notifications.length !== 1 ? 's' : ''} total
              </span>
            </div>

            {/* Assignments List */}
            <div className="d-flex flex-column gap-3">
              {loading ? (
                <div className="text-center p-5 text-muted">
                  <div className="spinner-border spinner-border-sm me-2"></div> Loading assignments...
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center p-5 text-muted border rounded-4 bg-white shadow-sm">
                  <i className="fas fa-folder-open mb-3 fs-2" style={{ color: '#ccc' }}></i>
                  <p>No assignments found.</p>
                </div>
              ) : notifications.map((n) => {

                const assignment = n.submission;
                const lesson = assignment?.lessonContent;
                const statusStyle = statusColors[assignment?.status] || statusColors.pending;
                
                return (
                  <div
                    key={n.notification_id}
                    style={{
                      backgroundColor: '#fff',
                      border: '1px solid #f1f1f3',
                      borderRadius: '14px',
                      padding: '20px 24px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center gap-3">
                        <div style={{
                          width: '46px',
                          height: '46px',
                          borderRadius: '12px',
                          backgroundColor: '#f0f4ff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <i className="fas fa-file-alt" style={{ color: '#31506a', fontSize: '18px' }}></i>
                        </div>

                        <div>
                          <div style={{ fontWeight: '600', fontSize: '15px', color: '#1a1d20' }}>
                            {lesson?.title || 'Assignment'}
                          </div>
                          <div style={{ fontSize: '13px', color: '#888', marginTop: '3px' }}>
                            <i className="fas fa-check-circle me-1"></i>
                            Grade: {assignment?.grade ? `${assignment.grade}%` : 'Not Graded'}
                          </div>
                        </div>
                      </div>

                      <div className="d-flex align-items-center gap-4">
                        <div className="text-end">
                          <div style={{ fontSize: '12px', color: '#aaa' }}>Submitted At</div>
                          <div style={{ fontSize: '13px', fontWeight: '600', color: '#555' }}>
                            <i className="fas fa-calendar me-1"></i>
                            {new Date(assignment?.submitted_at).toLocaleDateString()}
                          </div>
                        </div>

                        <span style={{
                          backgroundColor: statusStyle.bg,
                          color: statusStyle.color,
                          padding: '5px 14px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '600',
                        }}>
                          {statusStyle.label}
                        </span>

                        {assignment?.status !== 'graded' && (
                          <button 
                            className="btn btn-sm btn-link text-danger p-0 ms-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSubmission(assignment.submission_id);
                            }}
                            title="Delete Submission"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>

        <ProfileSidebar />
      </div>
    </div>
  );
};

export default Assignments;
