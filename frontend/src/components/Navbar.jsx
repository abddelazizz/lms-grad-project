import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { notificationService } from '../services/apiService';
import '../styles/Navbar.css';

const Navbar = () => {
  const { isAuthenticated, user, logout, api } = useAuth();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [isMenuOpen]);


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
    <header className="main-navbar-header">
      <nav className="navbar navbar-expand-lg py-4">
        <div className="container-custom d-flex align-items-center justify-content-between">
          <Link className="navbar-brand" to="/" onClick={() => setIsMenuOpen(false)}>
            <img src="/images/logo.png" alt="Recode" height="60" className="d-block" />
          </Link>

          {/* Custom Hamburger for Mobile */}
          <button 
            className={`mobile-hamburger-btn d-lg-none ${isMenuOpen ? 'active' : ''}`}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle navigation"
          >
            <div className="h-line h-line-1"></div>
            <div className="h-line h-line-2"></div>
            <div className="h-line h-line-3"></div>
          </button>

          {/* Desktop Menu */}
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
                    >
                      <i className="fas fa-bell fs-5"></i>
                      {notifications.length > 0 && (
                        <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-white border-2" style={{ fontSize: '10px', marginTop: '8px', marginLeft: '-8px' }}>
                          {notifications.length}
                        </span>
                      )}
                    </button>
                  </div>

                  <button 
                    onClick={handleLogout} 
                    className="btn d-flex align-items-center justify-content-center border-0 text-muted"
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

      {/* Modern Mobile Menu Overlay */}
      <div className={`main-mobile-menu-overlay d-lg-none ${isMenuOpen ? 'active' : ''}`}>
        <ul className="mobile-menu-links">
          <li className="mobile-menu-item">
            <Link to="/" className="mobile-nav-link">Home</Link>
          </li>
          <li className="mobile-menu-item">
            <Link to="/courses" className="mobile-nav-link">Courses</Link>
          </li>
          <li className="mobile-menu-item">
            <Link to="/about" className="mobile-nav-link">About Us</Link>
          </li>
          <li className="mobile-menu-item">
            <Link to="/contact" className="mobile-nav-link">Contact</Link>
          </li>
          {isAuthenticated && (
            <li className="mobile-menu-item">
              <Link to="/dashboard" className="mobile-nav-link">Dashboard</Link>
            </li>
          )}
        </ul>

        <div className="mobile-menu-footer">
          {isAuthenticated ? (
            <div className="text-center" style={{ color: '#31506a' }}>
              <div className="mb-3 d-flex align-items-center justify-content-center gap-3">
                <div className="rounded-circle overflow-hidden border border-primary-custom border-2" style={{ width: '60px', height: '60px' }}>
                  <img src={user?.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name)}&background=random`} className="w-100 h-100 object-fit-cover" />
                </div>
                <div className="text-start">
                  <h5 className="mb-0 fw-bold">{user?.name}</h5>
                  <small className="text-muted">{user?.email}</small>
                </div>
              </div>
              <button onClick={handleLogout} className="btn btn-primary-custom rounded-pill px-5 py-2 mt-2">Logout</button>
            </div>
          ) : (
            <div className="mobile-auth-actions">
              <Link to="/login" className="mobile-btn-primary">Login Now</Link>
              <Link to="/signup" className="mobile-btn-outline">Create Account</Link>
            </div>
          )}
          
          <div className="d-flex gap-4 mt-4" style={{ color: '#31506a', opacity: 0.6 }}>
            <i className="fab fa-facebook-f"></i>
            <i className="fab fa-instagram"></i>
            <i className="fab fa-linkedin-in"></i>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
