import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const MobileNavbar = ({ value, onChange, placeholder = "Search..." }) => {
  const { user } = useAuth();

  const toggleLeftSidebar = () => {
    const sidebar = document.querySelector('.sidebar-left');
    const overlay = document.querySelector('.sidebar-overlay');
    if (sidebar && overlay) {
      sidebar.classList.toggle('show-mobile');
      overlay.classList.toggle('show');
    }
  };

  const toggleRightSidebar = () => {
    const sidebar = document.querySelector('.sidebar-right-profile');
    const overlay = document.querySelector('.sidebar-overlay');
    if (sidebar && overlay) {
      sidebar.classList.toggle('show-mobile');
      overlay.classList.toggle('show');
    }
  };

  const closeAll = () => {
    const left = document.querySelector('.sidebar-left');
    const right = document.querySelector('.sidebar-right-profile');
    const overlay = document.querySelector('.sidebar-overlay');
    if (left) left.classList.remove('show-mobile');
    if (right) right.classList.remove('show-mobile');
    if (overlay) overlay.classList.remove('show');
  };

  return (
    <>
      <nav className="mobile-dashboard-navbar">
        {/* Left Side: Toggle Main Sidebar */}
        <button className="mobile-nav-btn" onClick={toggleLeftSidebar}>
          <i className="fas fa-bars"></i>
        </button>
        
        {/* Middle: Integrated Search Pill */}
        <div className="mobile-search-pill-container">
          <i className="fas fa-search text-muted small"></i>
          <input 
            type="text"
            className="mobile-search-pill-input"
            placeholder={placeholder}
            value={value || ''}
            onChange={(e) => onChange && onChange(e.target.value)}
          />
          {value && (
            <i className="fas fa-times text-muted small" onClick={() => onChange && onChange('')}></i>
          )}
        </div>

        {/* Right Side: Toggle Profile Sidebar */}
        <button className="mobile-nav-btn" onClick={toggleRightSidebar}>
          {user?.picture ? (
            <img 
              src={user.picture} 
              alt="User" 
              className="rounded-circle"
              style={{ width: '24px', height: '24px', objectFit: 'cover' }}
            />
          ) : (
            <i className="fas fa-user-circle"></i>
          )}
        </button>
      </nav>
      
      {/* Overlay shared by both sidebars */}
      <div className="sidebar-overlay" onClick={closeAll}></div>
    </>
  );
};

export default MobileNavbar;
