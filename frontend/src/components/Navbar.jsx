import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { getUserInfo } from '../utils/auth';

const Navbar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
      const info = getUserInfo();
      setUser(info);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
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
            {isLoggedIn ? (
              <>
                {/* Profile Image Link */}
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
                    src={user?.picture || 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png'} 
                    alt="Current User" 
                    className="w-100 h-100 object-fit-cover"
                  />
                </Link>

                {/* Logout Icon Button (Gray to Red) */}
                <button 
                  onClick={handleLogout} 
                  className="btn d-flex align-items-center justify-content-center border-0"
                  style={{ 
                    width: '42px', height: '42px', 
                    borderRadius: '12px',
                    color: '#9fa2a6', // Neutral Gray
                    backgroundColor: 'transparent',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.color = '#e11d48'; // Red on hover
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