import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

const ProfileSidebar = () => {
  const { user, api } = useAuth();
  const role = user?.role;
  const [activityData, setActivityData] = useState([10, 20, 15, 30, 25, 40, 35]);
  const [courses, setCourses] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
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
        if (res.data?.data?.summary?.daily_activity) {
          setActivityData(res.data.data.summary.daily_activity);
        }
        if (res.data?.data?.courses) {
          setCourses(res.data.data.courses.slice(0, 3));
        }
      } else if (role === 'student') {
        const res = await api.get('/courses/my-courses');
        if (res.data?.data?.courses) {
          setCourses(res.data.data.courses.slice(0, 3));
        }
      }
    } catch (err) {
      console.error("Activity fetch failed", err);
    }
  };

  const [relatedUsers, setRelatedUsers] = useState([]);

  const fetchRelatedUsers = async () => {
    try {
      if (role === 'student') {
        const res = await api.get('/courses/my-courses');
        const courses = res.data?.data?.courses || [];
        const instructors = courses.map(c => c.instructor).filter(Boolean);
        // Unique instructors by user_id
        const unique = Array.from(new Map(instructors.map(i => [i.user_id, i])).values()).slice(0, 3);
        setRelatedUsers(unique);
      } else if (role === 'instructor') {
        const res = await api.get('/instructor/dashboard-stats');
        setRelatedUsers(res.data?.data?.recent_students || []);
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
    <aside className="sidebar-right-profile">
      <div className="profile-header d-flex justify-content-between align-items-center mb-4">
        <h3 className="m-0 fw-bold" style={{ fontSize: '1.1rem', color: '#334155' }}>Your Profile</h3>
        <button className="btn btn-link text-muted p-0"><i className="fas fa-ellipsis-v"></i></button>
      </div>

      <div className="profile-main-info text-center mb-4 position-relative">
        <div className="profile-avatar-large mx-auto mb-4 shadow-sm p-1 bg-white" style={{ width: '110px', height: '110px', borderRadius: '50%', border: '1px solid #f1f5f9' }}>
          <div className="w-100 h-100 rounded-circle overflow-hidden bg-dark">
            <img src={user?.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=000&color=fff`} alt="Profile" className="w-100 h-100 object-fit-cover" />
          </div>
        </div>
        <h4 className="fw-bold mb-1" style={{ color: '#1e293b' }}>
          {new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 18 ? 'Good Afternoon' : 'Good Evening'}, {user?.name?.split(' ')[0]}
        </h4>
        <p className="text-muted px-4" style={{ fontSize: '12px', lineHeight: '1.5' }}>
          {role === 'instructor' ? 'Manage your students and track their progress today.' : 'Continue your learning journey and achieve your goals.'}
        </p>

        <div className="position-absolute" style={{ top: '65px', right: '10px' }} ref={dropdownRef}>
          <button
            className="btn btn-white rounded-circle p-0 border shadow-sm position-relative d-flex align-items-center justify-content-center"
            style={{ width: '38px', height: '38px', backgroundColor: '#fff' }}
            onClick={handleToggleDropdown}
          >
            <i className="far fa-bell text-muted"></i>
            {unreadCount > 0 && (
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '9px', padding: '3px 6px' }}>
                {unreadCount}
              </span>
            )}
          </button>

          {showDropdown && (
            <div className="notification-dropdown shadow-lg border-0 rounded-4 bg-white position-absolute end-0 mt-2 p-0 text-start" style={{ width: '300px', zIndex: 1000, boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}>
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

      {/* Mini Bar Chart - Matches Image */}
      <div className="mb-5 px-1">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <span className="small fw-bold text-muted text-uppercase" style={{ fontSize: '10px', letterSpacing: '1px' }}>Activity (Last 7 Days)</span>
        </div>
        <div className="d-flex align-items-end justify-content-between gap-2" style={{ height: '80px' }}>
          {activityData.map((val, i) => {
            const maxVal = Math.max(...activityData, 1);
            const height = (val / maxVal) * 100;
            return (
              <div key={i} className="flex-grow-1 rounded-1 position-relative" style={{
                height: `${Math.max(height, 5)}%`,
                background: i === 6 ? 'linear-gradient(to top, #31506a, #4a6b82)' : 'linear-gradient(to top, #cbd5e1, #e2e8f0)',
                opacity: i === 6 ? 1 : 0.8,
                transition: 'height 1s ease-out'
              }}>
                <div className="activity-tooltip position-absolute top-0 start-50 translate-middle-x bg-dark text-white rounded px-1" style={{ fontSize: '8px', display: 'none', marginTop: '-15px', zIndex: 10 }}>{val}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* My Courses Section */}
      <div className="mb-5 px-1">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h6 className="fw-bold mb-0" style={{ fontSize: '1.1rem', color: '#334155' }}>My Courses</h6>
          <Link to={role === 'instructor' ? "/instructor/my-courses" : "/dashboard/my-courses"} className="small text-muted text-decoration-none" style={{ fontSize: '12px' }}>View All</Link>
        </div>
        <div className="vstack gap-3">
          {courses.length > 0 ? courses.map((course) => (
            <Link
              key={course.course_id}
              to={role === 'instructor' ? `/instructor/manage-course/${course.course_id}` : `/courses/${course.course_id}`}
              className="d-flex align-items-center gap-3 text-decoration-none transition-all hover-opacity"
            >
              <div className="rounded-3 overflow-hidden bg-light shadow-sm" style={{ width: '45px', height: '45px', flexShrink: 0 }}>
                <img
                  src={course.thumbnail_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(course.title)}&background=random`}
                  alt={course.title}
                  className="w-100 h-100 object-fit-cover"
                />
              </div>
              <div className="overflow-hidden">
                <div className="fw-bold text-dark text-truncate" style={{ fontSize: '13px' }}>{course.title}</div>
                <div className="text-muted" style={{ fontSize: '11px' }}>
                  {role === 'instructor'
                    ? `${course.enrollments?.total || 0} Students`
                    : `By ${course.instructor?.name || 'Expert Instructor'}`}
                </div>
              </div>
            </Link>
          )) : (
            <div className="text-muted text-center p-3 bg-light rounded-4" style={{ fontSize: '11px' }}>
              No courses found.
            </div>
          )}
        </div>
      </div>

      {/* Related Users Section */}
      {role !== 'admin' && (
        <div className="mt-auto pt-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h6 className="fw-bold mb-0" style={{ fontSize: '1.1rem', color: '#334155' }}>
              {role === 'instructor' ? 'Your Students' : 'Your Mentors'}
            </h6>
            <button className="btn btn-light rounded-circle p-0 d-flex align-items-center justify-content-center" style={{ width: '28px', height: '28px' }}>
              <i className="fas fa-plus text-muted" style={{ fontSize: '10px' }}></i>
            </button>
          </div>
          <div className="vstack gap-3 mb-4">
            {relatedUsers.length > 0 ? relatedUsers.map((u, i) => (
              <div key={u.user_id || i} className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-3">
                  <div className="rounded-circle overflow-hidden shadow-sm" style={{ width: '42px', height: '42px', border: '1px solid #f1f5f9' }}>
                    <img
                      src={u.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'User')}&background=random`}
                      className="w-100 h-100 object-fit-cover"
                      alt="avatar"
                    />
                  </div>
                  <div>
                    <div className="fw-bold text-dark" style={{ fontSize: '14px' }}>{u.name || 'User'}</div>
                  </div>
                </div>
                <Link
                  to={`/dashboard/chat?userId=${u.user_id}`}
                  className="btn btn-sm btn-dark rounded-pill px-3 text-decoration-none d-flex align-items-center justify-content-center"
                  style={{ fontSize: '10px', backgroundColor: '#334155', height: '28px' }}
                >
                  Contact
                </Link>
              </div>
            )) : (
              <div className="text-muted text-center p-3 py-4 bg-light rounded-4 border-dashed" style={{ fontSize: '12px' }}>
                {role === 'instructor' ? 'No active students yet.' : 'No mentors found.'}
              </div>
            )}
          </div>
          {relatedUsers.length > 0 && (
            <button className="btn w-100 py-2 rounded-3 fw-bold shadow-sm transition-all" style={{
              backgroundColor: '#94a3b8',
              color: '#fff',
              border: 'none',
              fontSize: '13px'
            }}>See All</button>
          )}
        </div>
      )}
    </aside>
  );
};

export default ProfileSidebar;
