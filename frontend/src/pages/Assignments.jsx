import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ProfileSidebar from '../components/ProfileSidebar';
import '../styles/Dashboard.css';

// Dummy assignments data — replace with real API later
const dummyAssignments = [
  {
    id: 1,
    title: 'UI UX Assignment One',
    course: 'UI/UX Design',
    dueDate: '2026-05-01',
    status: 'pending',
  },
  {
    id: 2,
    title: 'React Components Assignment',
    course: 'Frontend Development',
    dueDate: '2026-05-10',
    status: 'pending',
  },
  {
    id: 3,
    title: 'Database Design Task',
    course: 'Backend Development',
    dueDate: '2026-04-28',
    status: 'submitted',
  },
];

const statusColors = {
  pending: { bg: '#fff8e1', color: '#f59e0b', label: 'Pending' },
  submitted: { bg: '#e8f5e9', color: '#22c55e', label: 'Submitted' },
  graded: { bg: '#e3f2fd', color: '#3b82f6', label: 'Graded' },
};

const Assignments = () => {
  const navigate = useNavigate();
  const [assignments] = useState(dummyAssignments);

  return (
    <div className="dashboard-page">
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
                {assignments.length} assignment{assignments.length !== 1 ? 's' : ''} total
              </span>
            </div>

            {/* Assignments List */}
            <div className="d-flex flex-column gap-3">
              {assignments.map((assignment) => {
                const statusStyle = statusColors[assignment.status] || statusColors.pending;
                return (
                  <div
                    key={assignment.id}
                    onClick={() => navigate(`/dashboard/assignment/${assignment.id}`)}
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
                        {/* Icon */}
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

                        {/* Info */}
                        <div>
                          <div style={{ fontWeight: '600', fontSize: '15px', color: '#1a1d20' }}>
                            {assignment.title}
                          </div>
                          <div style={{ fontSize: '13px', color: '#888', marginTop: '3px' }}>
                            <i className="fas fa-book me-1"></i>
                            {assignment.course}
                          </div>
                        </div>
                      </div>

                      {/* Right side */}
                      <div className="d-flex align-items-center gap-4">
                        <div className="text-end">
                          <div style={{ fontSize: '12px', color: '#aaa' }}>Due Date</div>
                          <div style={{ fontSize: '13px', fontWeight: '600', color: '#555' }}>
                            <i className="fas fa-calendar me-1"></i>
                            {new Date(assignment.dueDate).toLocaleDateString('en-GB')}
                          </div>
                        </div>

                        {/* Status Badge */}
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

                        {/* Arrow */}
                        <i className="fas fa-chevron-right" style={{ color: '#ccc', fontSize: '13px' }}></i>
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
