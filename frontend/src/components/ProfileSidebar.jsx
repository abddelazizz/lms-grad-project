import React from 'react';
import { getUserRole, getUserInfo } from '../utils/auth';

const ProfileSidebar = () => {
  const role = getUserRole();
  const user = getUserInfo();

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
          <img src={user?.picture || 'https://i.pravatar.cc/150'} alt="Profile" className="w-100 h-100 object-fit-cover" />
        </div>
        <h5 className="fw-bold mb-1">Good Morning</h5>
        <p className="text-muted mb-3" style={{ fontSize: '11px', lineHeight: '1.4' }}>Continue Your Journey And Achieve Your Target</p>
        <button className="btn btn-outline-secondary rounded-circle p-2 border-light-subtle shadow-sm" style={{ width: '40px', height: '40px' }}>
          <i className="far fa-bell"></i>
        </button>
      </div>

      {/* Mini Chart Area */}
      <div className="mini-chart-wrapper mb-4 p-3 rounded-4 bg-light-gray h-auto">
        <div className="d-flex align-items-end justify-content-between gap-1" style={{ height: '80px' }}>
          {[30, 50, 40, 60, 80, 70, 65].map((h, i) => (
            <div key={i} className="bg-primary-custom rounded-1" style={{ width: '12%', height: `${h}%`, opacity: i === 4 ? 1 : 0.5, backgroundColor: '#31506a' }}></div>
          ))}
        </div>
      </div>

      {/* Dynamic Students/Mentor list based on role */}
      <div className="mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6 className="fw-bold mb-0" style={{ fontSize: '13px' }}>
            {role === 'instructor' ? 'Your Students' : 'Your Mentor'}
          </h6>
          <i className="fas fa-plus-circle text-muted" style={{ cursor: 'pointer', fontSize: '14px' }}></i>
        </div>
        <div className="d-flex flex-column gap-3">
          {role === 'instructor' ? (
            [1, 2].map((_, i) => (
              <div key={i} className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-2">
                  <img src={`https://i.pravatar.cc/150?u=${i + 10}`} alt="User" className="rounded-circle" style={{ width: '32px', height: '32px' }} />
                  <div className="fw-bold" style={{ fontSize: '11px' }}>Student {i + 1}</div>
                </div>
                <button className="btn btn-sm text-white px-3 fw-bold" style={{ backgroundColor: '#52758e', fontSize: '9px', borderRadius: '6px' }}>Contact</button>
              </div>
            ))
          ) : (
            <div className="d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2">
                <img src="https://i.pravatar.cc/150?u=mentor1" alt="Mentor" className="rounded-circle" style={{ width: '32px', height: '32px' }} />
                <div>
                  <div className="fw-bold" style={{ fontSize: '11px' }}>Software Developer</div>
                  <div className="text-muted" style={{ fontSize: '9px' }}>Senior Mentor</div>
                </div>
              </div>
              <button className="btn btn-sm text-white px-3 fw-bold" style={{ backgroundColor: '#52758e', fontSize: '9px', borderRadius: '6px' }}>Contact</button>
            </div>
          )}
        </div>
        <a href="#" className="btn-see-all-full d-block text-center mt-3 text-white py-2 rounded-3 text-decoration-none shadow-sm" style={{ backgroundColor: '#31506a', fontSize: '12px' }}>See All</a>
      </div>
    </aside>
  );
};

export default ProfileSidebar;
