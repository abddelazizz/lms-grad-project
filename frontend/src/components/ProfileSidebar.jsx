import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const ProfileSidebar = () => {
  const { user, api } = useAuth();
  const role = user?.role;
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await api.get('/notifications/unread-count');
        setUnreadCount(res.data?.data?.unread_count || 0);
      } catch (err) {
        console.error("Failed to fetch notifications count", err);
      }
    };
    fetchUnread();
    // Poll every 30 seconds for new alerts
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside className="sidebar-right-profile">
      <div className="profile-header">
        <h3 className="content-section-title" style={{ fontSize: '0.9rem', opacity: 0.8 }}>Your Profile</h3>
      </div>

      <div className="profile-main-info text-center mb-4 position-relative">
        <div className="position-absolute end-0 top-0">
          <i className="fas fa-ellipsis-v text-muted" style={{ cursor: 'pointer' }}></i>
        </div>
        <div className="profile-avatar-large mx-auto mb-3 shadow-sm" style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: '#000', overflow: 'hidden' }}>
          <img src={user?.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=e0e7ff&color=31506a`} alt="Profile" className="w-100 h-100 object-fit-cover" />
        </div>
        <h5 className="fw-bold mb-1">Good Morning</h5>
        <p className="text-muted mb-3" style={{ fontSize: '11px', lineHeight: '1.4' }}>Continue Your Journey And Achieve Your Target</p>
        <button className="btn btn-outline-secondary rounded-circle p-0 border-light-subtle shadow-sm position-relative" style={{ width: '40px', height: '40px' }}>
          <i className="far fa-bell"></i>
          {unreadCount > 0 && (
            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '10px' }}>
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Mini Chart Area */}
      <div className="mini-chart-wrapper mb-4 p-3 rounded-4 bg-light-gray h-auto">
        <div className="d-flex align-items-center justify-content-center text-muted" style={{ height: '80px' }}>
          <div className="text-center">
            <i className="fas fa-chart-line" style={{ fontSize: '24px', opacity: 0.4 }}></i>
            <div style={{ fontSize: '10px', marginTop: '6px' }}>Activity</div>
          </div>
        </div>
      </div>

      {/* Dynamic Students/Mentor list based on role */}
      {role !== 'admin' && (
        <div className="mb-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="fw-bold mb-0" style={{ fontSize: '13px' }}>
              {role === 'instructor' ? 'Your Students' : 'Your Mentor'}
            </h6>
          </div>
          <div className="d-flex flex-column gap-3">
            <div className="text-muted text-center p-3 bg-light rounded-3 border" style={{ fontSize: '12px' }}>
              {role === 'instructor' ? 'Student data will appear here.' : 'Mentor data will appear here.'}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default ProfileSidebar;
