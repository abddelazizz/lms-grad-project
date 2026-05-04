import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

const ProfileSidebar = () => {
  const { user, api } = useAuth();
  const role = user?.role;
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activityCount, setActivityCount] = useState(0);
  const dropdownRef = useRef(null);

  const fetchUnreadCount = async () => {
    try {
      const res = await api.get('/notifications/unread-count');
      setUnreadCount(res.data?.data?.unread_count || 0);
    } catch (err) {
      console.error("Failed to fetch notifications count", err);
    }
  };

  const fetchNotificationsList = async () => {
    try {
      let response;
      if (role === 'instructor') {
        response = await api.get('/instructor/inbox/assignments');
      } else {
        response = await api.get('/students/inbox/reviews');
      }
      setNotifications(response.data?.data?.notifications?.slice(0, 5) || []);
    } catch (error) {
      console.error("Failed to fetch notifications list", error);
    }
  };

  const fetchActivity = async () => {
    try {
      if (role === 'instructor') {
        const res = await api.get('/instructor/dashboard-stats');
        setActivityCount(res.data?.data?.courses?.length || 0);
      } else if (role === 'student') {
        const res = await api.get('/courses/my-courses');
        setActivityCount(res.data?.data?.courses?.length || 0);
      } else {
        setActivityCount(0);
      }
    } catch (err) {
      console.error("Activity fetch failed", err);
    }
  };

  const [relatedUsers, setRelatedUsers] = useState([]);

  const fetchRelatedUsers = async () => {
    try {
      if (role === 'student') {
        const res = await api.get('/courses');
        const instructors = res.data?.data?.courses?.map(c => c.Instructor).filter(Boolean).slice(0, 3) || [];
        // Deduplicate
        const unique = Array.from(new Map(instructors.map(i => [i.instructor_id, i])).values());
        setRelatedUsers(unique);
      } else if (role === 'instructor') {
        // Instructors should not call /admin/students (403). 
        // For now, we set an empty list or fetch from a non-admin endpoint if available.
        setRelatedUsers([]);
      }
    } catch (err) {
      console.error("Related users fetch failed", err);
    }
  };

  useEffect(() => {
    if (role && role !== 'admin') {
      fetchUnreadCount();
      fetchActivity();
      fetchRelatedUsers();
    }

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [role]);

  const handleToggleDropdown = () => {
    if (!showDropdown) {
      fetchNotificationsList();
    }
    setShowDropdown(!showDropdown);
  };

  const handleMarkRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setUnreadCount(prev => Math.max(0, prev - 1));
      setNotifications(prev => prev.map(n => n.notification_id === id ? { ...n, is_read: true } : n));
    } catch (error) {
      console.error("Failed to mark as read", error);
    }
  };

  return (
    <aside className="sidebar-right-profile position-relative">
      <div className="profile-header">
        <h3 className="content-section-title" style={{ fontSize: '0.9rem', opacity: 0.8 }}>Your Profile</h3>
      </div>

      <div className="profile-main-info text-center mb-4 position-relative">
        <div className="profile-avatar-large mx-auto mb-3 shadow-sm" style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: '#000', overflow: 'hidden' }}>
          <img src={user?.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=e0e7ff&color=31506a`} alt="Profile" className="w-100 h-100 object-fit-cover" />
        </div>
        <h5 className="fw-bold mb-1">Good Morning</h5>
        <p className="text-muted mb-3" style={{ fontSize: '11px', lineHeight: '1.4' }}>Continue Your Journey And Achieve Your Target</p>
        
        <div className="position-relative d-inline-block" ref={dropdownRef}>
          <button 
            className="btn btn-outline-secondary rounded-circle p-0 border-light-subtle shadow-sm position-relative" 
            style={{ width: '40px', height: '40px' }}
            onClick={handleToggleDropdown}
          >
            <i className="far fa-bell"></i>
            {unreadCount > 0 && (
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '10px' }}>
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showDropdown && (
            <div className="notification-dropdown shadow-lg border rounded-4 bg-white position-absolute end-0 mt-2 p-0 text-start" style={{ width: '300px', zIndex: 1000 }}>
              <div className="p-3 border-bottom d-flex justify-content-between align-items-center">
                <h6 className="m-0 fw-bold">Notifications</h6>
                <Link to="/dashboard/inbox" className="small text-primary text-decoration-none" onClick={() => setShowDropdown(false)}>View All</Link>
              </div>
              <div className="notification-list" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-muted small">No new notifications</div>
                ) : (
                  notifications.map(n => (
                    <div 
                      key={n.notification_id} 
                      className={`p-3 border-bottom notification-item ${n.is_read ? '' : 'bg-light'}`}
                      style={{ cursor: 'pointer', transition: 'background 0.2s' }}
                      onClick={() => handleMarkRead(n.notification_id)}
                    >
                      <div className="d-flex gap-2">
                        <div className={`rounded-circle bg-${n.is_read ? 'secondary' : 'primary'} bg-opacity-10 text-${n.is_read ? 'secondary' : 'primary'} d-flex align-items-center justify-content-center`} style={{ width: '30px', height: '30px', flexShrink: 0 }}>
                          <i className="fas fa-info-circle small"></i>
                        </div>
                        <div>
                          <p className="mb-0 small fw-bold" style={{ fontSize: '12px' }}>
                            {role === 'instructor' ? 'New Submission' : 'Assignment Graded'}
                          </p>
                          <p className="mb-0 text-muted" style={{ fontSize: '11px' }}>
                            {n.submission?.lessonContent?.title || 'Check your inbox'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mini Chart Area */}
      <div className="mini-chart-wrapper mb-4 p-3 rounded-4 bg-light-gray h-auto">
        <div className="d-flex align-items-center justify-content-between mb-2">
           <span className="fw-bold" style={{ fontSize: '11px' }}>{role === 'instructor' ? 'Teaching' : 'Enrolled'}</span>
           <span className="text-primary-custom fw-bold" style={{ fontSize: '11px' }}>{activityCount} Courses</span>
        </div>
        <div className="d-flex align-items-end justify-content-center gap-1" style={{ height: '60px' }}>
          {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
            <div key={i} className="bg-primary-custom rounded-pill opacity-25" style={{ width: '8px', height: `${h}%` }}></div>
          ))}
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
            {relatedUsers.length > 0 ? relatedUsers.map((u, i) => (
              <div key={u.user_id || u.instructor_id || i} className="d-flex align-items-center justify-content-between p-2 bg-light rounded-3 border-0">
                <div className="d-flex align-items-center gap-2">
                  <img 
                    src={u.picture || u.User?.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'User')}&background=e0e7ff&color=31506a`} 
                    className="rounded-circle" 
                    width="30" 
                    height="30" 
                    alt="avatar" 
                  />
                  <div className="overflow-hidden">
                    <div className="fw-bold text-dark text-truncate" style={{ fontSize: '11px' }}>{u.name || 'User'}</div>
                    <div className="text-muted text-truncate" style={{ fontSize: '9px' }}>{u.specialization || u.studentProfile?.grade_level || 'Member'}</div>
                  </div>
                </div>
                <button className="btn btn-sm btn-primary py-0 px-2" style={{ fontSize: '9px' }}>Contact</button>
              </div>
            )) : (
              <div className="text-muted text-center p-3 bg-light rounded-3 border" style={{ fontSize: '12px' }}>
                {role === 'instructor' ? 'No students yet.' : 'No mentors found.'}
              </div>
            )}
          </div>
          {relatedUsers.length > 0 && (
            <button className="btn btn-outline-secondary w-100 mt-3 btn-sm rounded-pill fw-bold" style={{ fontSize: '11px', backgroundColor: '#94a3b8', color: 'white', border: 'none' }}>See All</button>
          )}
        </div>
      )}
    </aside>
  );
};

export default ProfileSidebar;
