import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = () => {
  const location = useLocation();
  const { user, logout, api } = useAuth();
  const role = user?.role;
  const [activeCourse, setActiveCourse] = useState(null);

  // Extract courseId from URL (either as /manage-course/:id or ?courseId=id)
  const courseIdFromUrl = location.pathname.split('/').includes('manage-course')
    ? location.pathname.split('/').pop()
    : new URLSearchParams(location.search).get('courseId');

  React.useEffect(() => {
    if (role === 'instructor' && courseIdFromUrl) {
      const fetchCourseDetails = async () => {
        try {
          const res = await api.get(`/instructor/courses/${courseIdFromUrl}/details`);
          setActiveCourse(res.data?.data?.course || res.data?.course);
        } catch (err) {
          console.error("Failed to fetch sidebar course details", err);
        }
      };
      fetchCourseDetails();
    } else {
      setActiveCourse(null);
    }
  }, [role, api, courseIdFromUrl]);

  const getActiveState = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <aside className="sidebar-left">
      <div className="sidebar-brand-logo mb-5">
        <Link to="/"><img src="/images/logo.png" alt="Recode" height="50" /></Link>
      </div>

      <div className="sidebar-course-wrapper px-3 mb-5">
        <Link
          to="/courses"
          className="nav-menu-item active d-flex align-items-center gap-3 p-2 px-3 rounded-4 text-decoration-none transition-all"
          style={{
            background: 'linear-gradient(135deg, #31506a 0%, #4a6b82 100%)',
            color: 'white',
            boxShadow: '0 8px 15px rgba(49, 80, 106, 0.15)'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 12px 20px rgba(49, 80, 106, 0.25)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 8px 15px rgba(49, 80, 106, 0.15)';
          }}
        >
          <div className="bg-white rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{ width: '26px', height: '26px', color: 'white' }}>
            <i className="fas fa-plus" style={{ fontSize: '12px' }}></i>
          </div>
          <span className="fw-bold" style={{ fontSize: '13px', letterSpacing: '0.5px', color: 'white' }}>COURSES</span>
        </Link>
      </div>

      <div className="nav-section px-3">
        <h3 className="nav-section-title text-uppercase mb-4" style={{ fontSize: '11px', color: '#888', letterSpacing: '1.5px', fontWeight: '700' }}>Overview</h3>
        <ul className="nav-menu-list list-unstyled d-flex flex-column gap-1">
          <li>
            <Link to="/dashboard" className={`nav-menu-item d-flex align-items-center gap-3 p-3 rounded-3 text-decoration-none ${getActiveState('/dashboard')}`}>
              <i className="fas fa-th-large"></i> <span>Dashboard</span>
            </Link>
          </li>
          <li>
            <Link to="/dashboard/inbox" className={`nav-menu-item d-flex align-items-center gap-3 p-3 rounded-3 text-decoration-none ${getActiveState('/dashboard/inbox')}`}>
              <i className="fas fa-inbox"></i> <span>Inbox</span>
            </Link>
          </li>
          <li>
            <Link to="/dashboard/chat" className={`nav-menu-item d-flex align-items-center gap-3 p-3 rounded-3 text-decoration-none ${getActiveState('/dashboard/chat')}`}>
              <i className="fas fa-comments"></i> <span>Chat</span>
            </Link>
          </li>

          {role?.toLowerCase() === 'admin' && (
            <>
              <li>
                <Link to="/admin/add-teacher" className={`nav-menu-item d-flex align-items-center gap-3 p-3 rounded-3 text-decoration-none ${getActiveState('/admin/add-teacher')}`} style={{ color: '#1a1d20' }}>
                  <i className="fas fa-user-plus"></i> <span>Add Teacher</span>
                </Link>
              </li>
              <li>
                <Link to="/admin/add-student" className={`nav-menu-item d-flex align-items-center gap-3 p-3 rounded-3 text-decoration-none ${getActiveState('/admin/add-student')}`} style={{ color: '#1a1d20' }}>
                  <i className="fas fa-user-check"></i> <span>Add Student</span>
                </Link>
              </li>
              <li>
                <Link to="/admin/teachers" className={`nav-menu-item d-flex align-items-center gap-3 p-3 rounded-3 text-decoration-none ${getActiveState('/admin/teachers')}`} style={{ color: '#1a1d20' }}>
                  <i className="fas fa-users-cog"></i> <span>Teachers List</span>
                </Link>
              </li>
              <li>
                <Link to="/admin/students" className={`nav-menu-item d-flex align-items-center gap-3 p-3 rounded-3 text-decoration-none ${getActiveState('/admin/students')}`} style={{ color: '#1a1d20' }}>
                  <i className="fas fa-user-graduate"></i> <span>Students List</span>
                </Link>
              </li>
              <li>
                <Link to="/admin/courses" className={`nav-menu-item d-flex align-items-center gap-3 p-3 rounded-3 text-decoration-none ${getActiveState('/admin/courses')}`} style={{ color: '#1a1d20' }}>
                  <i className="fas fa-layer-group"></i> <span>Courses Admin</span>
                </Link>
              </li>
              <li>
                <Link to="/admin/security-audit" className={`nav-menu-item d-flex align-items-center gap-3 p-3 rounded-3 text-decoration-none ${getActiveState('/admin/security-audit')}`} style={{ color: '#1a1d20' }}>
                  <i className="fas fa-fingerprint"></i> <span>Security Center</span>
                </Link>
              </li>
            </>
          )}

          {role?.toLowerCase() === 'instructor' && (
            <>
              <li>
                <Link to="/instructor/my-courses" className={`nav-menu-item d-flex align-items-center gap-3 p-3 rounded-3 text-decoration-none ${getActiveState('/instructor/my-courses')}`}>
                  <i className="fas fa-folder"></i> <span>My Courses</span>
                </Link>
              </li>

              {activeCourse && (
                <li className="ms-3 mt-2">
                  <div className="small text-muted mb-2 px-2 fw-bold text-truncate" style={{ maxWidth: '180px' }}>
                    Managing: {activeCourse.title}
                  </div>
                  <div className="dropdown px-2 mb-3">
                    <button 
                      className="btn btn-light-gray w-100 text-start d-flex align-items-center justify-content-between p-2 rounded-3 border-0" 
                      type="button"
                      data-bs-toggle="dropdown"
                      style={{ fontSize: '12px' }}
                    >
                      <span className="text-truncate" style={{ maxWidth: '120px' }}>Quick Jump...</span>
                      <i className="fas fa-chevron-down x-small text-muted"></i>
                    </button>
                    <ul className="dropdown-menu shadow-lg border-0 rounded-4 p-2 animate-slide-in" style={{ maxHeight: '400px', overflowY: 'auto', minWidth: '200px' }}>
                      <li className="px-3 py-2 text-uppercase text-muted fw-bold" style={{ fontSize: '10px' }}>Course Curriculum</li>
                      {activeCourse.sections?.map(sec => (
                        <React.Fragment key={sec.section_id}>
                          <li><hr className="dropdown-divider opacity-50" /></li>
                          <li className="px-3 py-1 fw-bold text-primary-custom small bg-light bg-opacity-50 rounded-2 mx-2 mb-1">{sec.title}</li>
                          {sec.lessons?.map(les => (
                            <li key={les.content_id}>
                              <button className="dropdown-item py-2 px-3 rounded-3 d-flex align-items-center gap-2">
                                <i className={`fas ${les.content_type === 'video' ? 'fa-play-circle text-primary' : 'fa-file-alt text-danger'} small`}></i>
                                <span className="small text-truncate" style={{ maxWidth: '140px' }}>{les.title}</span>
                              </button>
                            </li>
                          ))}
                        </React.Fragment>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-light bg-opacity-50 rounded-4 p-2 mb-3">
                    <ul className="list-unstyled d-flex flex-column gap-1 mb-0">
                      <li>
                        <Link to={`/instructor/upload-video?courseId=${activeCourse.course_id}`} className={`d-flex align-items-center gap-3 p-2 rounded-3 text-decoration-none transition-all ${location.pathname === '/instructor/upload-video' ? 'bg-white shadow-sm text-primary-custom fw-bold' : 'text-muted'}`} style={{ fontSize: '13px' }}>
                          <i className="fas fa-video" style={{ width: '15px' }}></i>
                          <span>Upload Video</span>
                        </Link>
                      </li>
                      <li>
                        <Link to={`/instructor/upload-pdf?courseId=${activeCourse.course_id}`} className={`d-flex align-items-center gap-3 p-2 rounded-3 text-decoration-none transition-all ${location.pathname === '/instructor/upload-pdf' ? 'bg-white shadow-sm text-primary-custom fw-bold' : 'text-muted'}`} style={{ fontSize: '13px' }}>
                          <i className="fas fa-file-pdf" style={{ width: '15px' }}></i>
                          <span>Upload PDF</span>
                        </Link>
                      </li>
                      <li>
                        <Link to={`/instructor/upload-assignment?courseId=${activeCourse.course_id}`} className={`d-flex align-items-center gap-3 p-2 rounded-3 text-decoration-none transition-all ${location.pathname === '/instructor/upload-assignment' ? 'bg-white shadow-sm text-primary-custom fw-bold' : 'text-muted'}`} style={{ fontSize: '13px' }}>
                          <i className="fas fa-tasks" style={{ width: '15px' }}></i>
                          <span>Upload Assignment</span>
                        </Link>
                      </li>
                      <li>
                        <Link to={`/instructor/quiz-generator?courseId=${activeCourse.course_id}`} className={`d-flex align-items-center gap-3 p-2 rounded-3 text-decoration-none transition-all ${location.pathname === '/instructor/quiz-generator' ? 'bg-white shadow-sm text-primary-custom fw-bold' : 'text-muted'}`} style={{ fontSize: '13px' }}>
                          <i className="fas fa-magic" style={{ width: '15px' }}></i>
                          <span>Quiz Generator</span>
                        </Link>
                      </li>
                      <li>
                        <Link to={`/instructor/bulk-upload?courseId=${activeCourse.course_id}`} className={`d-flex align-items-center gap-3 p-2 rounded-3 text-decoration-none transition-all ${location.pathname === '/instructor/bulk-upload' ? 'bg-white shadow-sm text-primary-custom fw-bold' : 'text-muted'}`} style={{ fontSize: '13px' }}>
                          <i className="fas fa-layer-group" style={{ width: '15px' }}></i>
                          <span>Bulk Upload</span>
                        </Link>
                      </li>
                    </ul>
                  </div>
                </li>
              )}

              <li>
                <Link to="/instructor/create-course" className={`nav-menu-item d-flex align-items-center gap-3 p-3 rounded-3 text-decoration-none ${getActiveState('/instructor/create-course')}`}>
                  <i className="fas fa-plus"></i> <span>Create Course</span>
                </Link>
              </li>
            </>
          )}

          {(!role || (role?.toLowerCase() !== 'admin' && role?.toLowerCase() !== 'instructor')) && (
            <>
              <li>
                <Link to="/dashboard/assignments" className={`nav-menu-item d-flex align-items-center gap-3 p-3 rounded-3 text-decoration-none ${getActiveState('/dashboard/assignments')}`}>
                  <i className="fas fa-tasks"></i> <span>Assignment</span>
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className={`nav-menu-item d-flex align-items-center gap-3 p-3 rounded-3 text-decoration-none ${location.pathname.startsWith('/dashboard/quiz') ? 'active' : ''}`}>
                  <i className="fas fa-vial"></i> <span>Quiz</span>
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
            <Link to="/dashboard/settings" className={`nav-menu-item d-flex align-items-center gap-3 p-3 rounded-3 text-decoration-none ${getActiveState('/dashboard/settings')}`}>
              <i className="fas fa-user-cog"></i> <span>Settings</span>
            </Link>
          </li>
          <li>
            <button
              onClick={async () => { await logout(); window.location.href = '/login'; }}
              className="nav-menu-item d-flex align-items-center gap-3 p-3 rounded-3 text-danger border-0 bg-transparent w-100 text-start"
            >
              <i className="fas fa-power-off"></i> <span>Logout</span>
            </button>
          </li>
        </ul>
      </div>
    </aside>
  );
};

export default Sidebar;
