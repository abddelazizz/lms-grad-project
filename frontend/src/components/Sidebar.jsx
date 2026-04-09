import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getUserRole } from '../utils/auth';

const Sidebar = () => {
  const location = useLocation();
  const role = getUserRole();
  const [isFolderOpen, setIsFolderOpen] = useState(false);

  const getActiveState = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <aside className="sidebar-left">
      <div className="sidebar-brand-logo">
        <Link to="/"><img src="/images/logo.png" alt="Recode" height="50" /></Link>
      </div>

      <Link to="/courses" className="sidebar-course-btn">
        <i className="fas fa-plus-circle"></i>
        <span>Coursue</span>
      </Link>

      <div className="nav-section">
        <h3 className="nav-section-title">Overview</h3>
        <ul className="nav-menu-list">
          <li>
            <Link to="/dashboard" className={`nav-menu-item ${getActiveState('/dashboard')}`}>
              <i className="fas fa-th-large"></i> <span>Dashboard</span>
            </Link>
          </li>
          <li>
            <Link to="/dashboard/inbox" className={`nav-menu-item ${getActiveState('/dashboard/inbox')}`}>
              <i className="fas fa-envelope"></i> <span>Inbox</span>
            </Link>
          </li>
          <li>
            <Link to="/dashboard/chat" className={`nav-menu-item ${getActiveState('/dashboard/chat')}`}>
              <i className="fas fa-comment-dots"></i> <span>Chat</span>
            </Link>
          </li>

          {role === 'admin' ? (
          <>
            <li className={`nav-item ${location.pathname === '/admin/add-teacher' ? 'active' : ''}`}>
              <Link to="/admin/add-teacher" className="nav-link d-flex align-items-center gap-3">
                <i className="fas fa-user-plus px-2"></i> Add Teacher
              </Link>
            </li>
            <li className={`nav-item ${location.pathname === '/admin/add-student' ? 'active' : ''}`}>
              <Link to="/admin/add-student" className="nav-link d-flex align-items-center gap-3">
                <i className="fas fa-plus-circle px-2"></i> Add Student
              </Link>
            </li>
            <li className={`nav-item ${location.pathname === '/admin/teachers' ? 'active' : ''}`}>
              <Link to="/admin/teachers" className="nav-link d-flex align-items-center gap-3">
                <i className="fas fa-chalkboard-teacher px-2"></i> Teachers
              </Link>
            </li>
            <li className={`nav-item ${location.pathname === '/admin/students' ? 'active' : ''}`}>
              <Link to="/admin/students" className="nav-link d-flex align-items-center gap-3">
                <i className="fas fa-user-graduate px-2"></i> Students
              </Link>
            </li>
          </>
        ) : role === 'instructor' ? (
            <li>
              <div 
                className={`nav-menu-item d-flex justify-content-between align-items-center ${isFolderOpen ? 'active' : ''}`}
                onClick={() => setIsFolderOpen(!isFolderOpen)}
                style={{ cursor: 'pointer' }}
              >
                <div className="d-flex align-items-center gap-2">
                  <i className="fas fa-folder-open"></i> <span>Folder structure</span>
                </div>
                <i className={`fas fa-chevron-${isFolderOpen ? 'down' : 'right'}`} style={{ fontSize: '10px' }}></i>
              </div>
              
              {isFolderOpen && (
                <ul className="nav-menu-sublist ms-4 mt-2 list-unstyled">
                  <li className="mb-2">
                    <Link to="/instructor/upload-video" className={`nav-menu-subitem ${getActiveState('/instructor/upload-video')}`} style={{ fontSize: '13px', color: getActiveState('/instructor/upload-video') ? '#1a1d20' : '#888', textDecoration: 'none' }}>
                      Upload video
                    </Link>
                  </li>
                  <li className="mb-2">
                    <Link to="/instructor/upload-pdf" className={`nav-menu-subitem ${getActiveState('/instructor/upload-pdf')}`} style={{ fontSize: '13px', color: getActiveState('/instructor/upload-pdf') ? '#1a1d20' : '#888', textDecoration: 'none' }}>
                      Upload PDF
                    </Link>
                  </li>
                  <li className="mb-2">
                    <Link to="/instructor/upload-assignment" className={`nav-menu-subitem ${getActiveState('/instructor/upload-assignment')}`} style={{ fontSize: '13px', color: getActiveState('/instructor/upload-assignment') ? '#1a1d20' : '#888', textDecoration: 'none' }}>
                      Upload Assignment
                    </Link>
                  </li>
                  <li>
                    <Link to="/instructor/quiz-generator" className={`nav-menu-subitem ${getActiveState('/instructor/quiz-generator')}`} style={{ fontSize: '13px', color: getActiveState('/instructor/quiz-generator') ? '#1a1d20' : '#888', textDecoration: 'none' }}>
                      Quiz Generator
                    </Link>
                  </li>
                </ul>
              )}
            </li>
          ) : (
            <>
              <li>
                <Link to="/dashboard/assignments" className={`nav-menu-item ${getActiveState('/dashboard/assignments')}`}>
                  <i className="fas fa-file-alt"></i> <span>Assignment</span>
                </Link>
              </li>
              <li>
                <Link to="/dashboard/quiz" className={`nav-menu-item ${getActiveState('/dashboard/quiz')}`}>
                  <i className="fas fa-question-circle"></i> <span>Quiz</span>
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>

      <div className="nav-section">
        <h3 className="nav-section-title">Settings</h3>
        <ul className="nav-menu-list">
          <li>
            <Link to="/dashboard/settings" className={`nav-menu-item ${getActiveState('/dashboard/settings')}`}>
              <i className="fas fa-cog"></i> <span>Settings</span>
            </Link>
          </li>
          <li><Link to="/login" className="nav-menu-item text-danger"><i className="fas fa-sign-out-alt"></i> <span>Logout</span></Link></li>
        </ul>
      </div>
    </aside>
  );
};

export default Sidebar;
