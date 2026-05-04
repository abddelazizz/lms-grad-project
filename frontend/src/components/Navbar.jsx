import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { notificationService } from '../services/apiService';

const Navbar = () => {
  const { isAuthenticated, user, logout, api } = useAuth();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated]);

  const fetchNotifications = async () => {
    if (!user?.role) return;
    try {
      const res = await notificationService.getUserNotifications(user.role);
      setNotifications(res.data.data.notifications || []);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.filter(n => n.notification_id !== id));
    } catch (err) {}
  };


  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  };

  const getNavLinkClass = (path) => {
    return location.pathname === path
      ? "nav-link active-nav-link text-dark fw-medium px-4 py-2 rounded-3"
      : "nav-link text-dark fw-medium px-2 py-2";
  };

  return (
    <nav className="navbar navbar-expand-lg py-4 bg-light-custom">
      <div className="container-custom d-flex flex-wrap align-items-center justify-content-between">
        <Link className="navbar-brand" to="/">
          <img src="/images/logo.png" alt="Recode" height="60" className="d-block" />
        </Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav mx-auto gap-4">
            <li className="nav-item">
              <Link className={getNavLinkClass('/')} to="/">Home</Link>
            </li>
            <li className="nav-item">
              <Link className={getNavLinkClass('/courses')} to="/courses">Courses</Link>
            </li>
            <li className="nav-item">
              <Link className={getNavLinkClass('/about')} to="/about">About Us</Link>
            </li>
            <li className="nav-item">
              <Link className={getNavLinkClass('/contact')} to="/contact">Contact</Link>
            </li>
          </ul>
          
          <div className="d-flex align-items-center gap-3">
            {isAuthenticated ? (
              <>
                <Link 
                  to="/dashboard" 
                  className="d-block shadow-sm"
                  style={{ 
                    width: '42px', height: '42px', 
                    borderRadius: '12px',
                    overflow: 'hidden',
                    border: '1px solid #eee',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  title="Dashboard"
                >
                  <img 
                    src={user?.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.role || 'User')}&background=e0e7ff&color=31506a`} 
                    alt="Profile" 
                    className="w-100 h-100 object-fit-cover"
                  />
                </Link>

                <div className="position-relative">
                  <button 
                    className="btn border-0 p-0" 
                    onClick={() => setShowNotifications(!showNotifications)}
                    style={{ color: '#9fa2a6', width: '42px', height: '42px', borderRadius: '12px', transition: 'all 0.3s ease' }}
                    onMouseOver={(e) => e.currentTarget.style.color = '#31506a'}
                    onMouseOut={(e) => e.currentTarget.style.color = '#9fa2a6'}
                  >
                    <i className="fas fa-bell fs-5"></i>
                    {notifications.length > 0 && (
                      <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-white border-2" style={{ fontSize: '10px', marginTop: '8px', marginLeft: '-8px' }}>
                        {notifications.length}
                      </span>
                    )}
                  </button>

                  {showNotifications && (
                    <div className="position-absolute end-0 mt-2 bg-white shadow-lg rounded-4 border p-0 overflow-hidden animate__animated animate__fadeInDown" style={{ width: '320px', zIndex: 1000 }}>
                      <div className="p-3 border-bottom bg-light">
                        <h6 className="m-0 fw-bold">Notifications</h6>
                      </div>
                      <div className="notification-list" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                        {notifications.length > 0 ? notifications.map((n) => {
                          const isSubmission = n.type === 'new_submission';
                          const title = isSubmission ? 'New Submission' : 'Assignment Reviewed';
                          const studentName = n.submission?.student?.name || 'A student';
                          const lessonTitle = n.submission?.lessonContent?.title || 'an assignment';
                          const grade = n.submission?.grade;
                          
                          const message = isSubmission 
                            ? `${studentName} submitted ${lessonTitle}`
                            : `Your assignment "${lessonTitle}" was graded: ${grade}/100`;

                          return (
                            <div key={n.notification_id} className="p-3 border-bottom hover-bg-light cursor-pointer" onClick={() => markAsRead(n.notification_id)}>
                              <div className="small fw-bold text-dark">{title}</div>
                              <div className="text-muted" style={{ fontSize: '11px' }}>{message}</div>
                              <div className="text-primary-custom" style={{ fontSize: '10px', marginTop: '4px' }}>{new Date(n.created_at).toLocaleString()}</div>
                            </div>
                          );
                        }) : (
                          <div className="p-4 text-center text-muted small">No new notifications</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <button 
                  onClick={handleLogout} 
                  className="btn d-flex align-items-center justify-content-center border-0"
                  style={{ 
                    width: '42px', height: '42px', 
                    borderRadius: '12px',
                    color: '#9fa2a6',
                    backgroundColor: 'transparent',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.color = '#e11d48';
                    e.currentTarget.style.backgroundColor = '#fff1f2';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.color = '#9fa2a6';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                  title="Logout"
                >
                  <i className="fas fa-sign-out-alt"></i>
                </button>
              </>
            ) : (
              <>
                <Link to="/signup" className="text-dark text-decoration-none fw-medium">Sign Up</Link>
                <Link to="/login" className="btn btn-primary-custom px-4 py-2 rounded-3 fw-medium">Login</Link>
              </>
            )}
          </div>
          
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
