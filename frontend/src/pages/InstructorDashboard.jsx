import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import ProfileSidebar from '../components/ProfileSidebar';
import { instructorService } from '../services/apiService';
import '../styles/Dashboard.css';

const InstructorDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await instructorService.getStats();
        setStats(res.data.data);
      } catch (err) {
        console.error('Error fetching instructor stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const classProgress = [
    { name: 'Advanced Web Design Mastery', students: 1, progress: 45 },
    { name: 'UI/UX Design: Prototyping', students: 0, progress: 0 },
    { name: 'Full-Stack JS Development', students: 0, progress: 0 },
    { name: 'Mobile App Architecture', students: 0, progress: 0 },
  ];

  const activities = [
    { date: '31', title: 'Meeting with the VC', link: 'Meeting link//www.zoom.com', status: 'Due soon', color: '#1155cc' },
    { date: '04', title: 'Meeting with the J..', link: 'Meeting link//www.zoom.com', status: 'Upcoming', color: '#1155cc' },
    { date: '12', title: 'Class B middle sess..', link: 'Physical science lab', status: 'Upcoming', color: '#1155cc' },
    { date: '16', title: 'Send Mr Ayo class..', link: 'Send Document via email', status: 'Upcoming', color: '#1155cc' },
  ];

  if (loading) return (
    <div className="dashboard-page d-flex align-items-center justify-content-center" style={{ height: '100vh' }}>
       <div className="spinner-border text-primary" role="status"></div>
    </div>
  );

  return (
    <div className="dashboard-page">
      <div className="dashboard-layout">
        <Sidebar activePath="/dashboard" />

        <main className="main-dashboard-content w-100 p-4">
          <div className="container-fluid pt-5 mt-4 mx-auto" style={{ maxWidth: '1100px' }}>
            
            {/* Search Bar */}
            <div className="search-bar-wrapper mb-5 mx-auto" style={{ maxWidth: '700px' }}>
              <i className="fas fa-search search-icon"></i>
              <input type="text" className="search-input" placeholder="Search your course here...." />
            </div>

            <div className="row g-4 mb-4">
              {/* Student Statistics (Bar Chart) - Left Card */}
              <div className="col-lg-7">
                <div className="bg-white p-4 rounded-4 border shadow-sm" style={{ minHeight: '380px' }}>
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="fw-bold mb-0">Student Statistic</h5>
                    <div className="text-muted small d-flex align-items-center gap-2">
                       <span className="ms-2 fw-bold" style={{ color: '#31506a' }}>Total Students: {stats?.summary?.total_students || 1}</span>
                    </div>
                  </div>
                  
                  {/* Real stats mapped if available, otherwise fallback */}
                  <div className="d-flex align-items-end justify-content-between h-75 px-3 pt-4" style={{ minHeight: '260px', position: 'relative' }}>
                    <div className="position-absolute start-0 top-0 h-100 d-flex flex-column justify-content-between text-muted" style={{ fontSize: '10px' }}>
                      <span>100</span><span>80</span><span>60</span><span>40</span><span>20</span><span>0</span>
                    </div>
                    {(stats?.courses?.slice(0, 5) || classProgress).map((item, i) => {
                      const h = typeof item === 'number' ? item : (item.students || 0) * 100; // 1 student = 100px height for d1
                      return (
                        <div key={i} className="text-center" style={{ width: '15%' }}>
                          <div className="mx-auto rounded-1" 
                               style={{ 
                                 width: '32px', 
                                 height: `${Math.max(Math.min(h, 250), 4)}px`, // Min 4px for empty bars
                                 backgroundColor: i === 0 ? '#31506a' : '#e0e7ff',
                                 opacity: 1,
                                 transition: 'all 0.5s ease' 
                               }}></div>
                          <div className="small mt-2 text-muted text-truncate" style={{ fontSize: '10px' }}>{item.title || item.name}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Class Progress - Right Card */}
              <div className="col-lg-5">
                <div className="bg-white p-4 rounded-4 border shadow-sm" style={{ minHeight: '380px' }}>
                  <h5 className="fw-bold mb-4">Course Performance</h5>
                  <div className="d-flex flex-column gap-3">
                    {(stats?.courses?.slice(0, 4) || classProgress).map((cls, i) => (
                      <div key={i} className="d-flex align-items-center justify-content-between p-3 rounded-4 bg-light-gray border-light">
                        <div className="overflow-hidden pe-2">
                          <div className="fw-bold text-truncate" style={{ fontSize: '13px' }}>{cls.title || cls.name}</div>
                          <div className="text-muted" style={{ fontSize: '11px' }}>{cls.enrollments?.total || cls.students} Registed</div>
                        </div>
                        <div className="position-relative d-flex align-items-center justify-content-center" style={{ width: '55px', height: '55px', flexShrink: 0 }}>
                          <svg width="55" height="55" className="rotate-270">
                            <circle cx="27.5" cy="27.5" r="22" fill="none" stroke="#e0e4ec" strokeWidth="6" />
                            <circle cx="27.5" cy="27.5" r="22" fill="none" stroke="#31506a" strokeWidth="6" 
                                    strokeDasharray="138" strokeDashoffset={138 - (138 * (cls.enrollments?.completed / (cls.enrollments?.total || 1) * 100 || 0) / 100)} 
                                    strokeLinecap="round" />
                          </svg>
                          <span className="position-absolute fw-bold" style={{ fontSize: '11px' }}>{Math.round(cls.enrollments?.completed / (cls.enrollments?.total || 1) * 100) || 0}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Upcoming Activities - Bottom Section */}
            <div className="row g-4">
              <div className="col-12">
                <div className="bg-white p-5 rounded-4 border shadow-sm">
                  <div className="d-flex justify-content-between align-items-center mb-5">
                    <h5 className="fw-bold mb-0">Quick Insights</h5>
                    <div className="d-flex gap-4">
                       <span className="small fw-bold">Revenue: ${stats?.summary?.total_revenue || 0}</span>
                       <span className="small fw-bold">Rating: {stats?.summary?.overall_avg_rating || 'N/A'} ⭐</span>
                    </div>
                  </div>
                  <div className="row g-4">
                    {activities.map((act, i) => (
                      <div key={i} className="col-md-6 col-lg-3">
                        <div className="p-3 py-4 rounded-4 bg-light-gray border position-relative">
                          <div className="d-flex gap-3 align-items-center">
                            <div className="bg-primary-custom text-white rounded-3 p-2 fw-bold d-flex align-items-center justify-content-center" 
                                 style={{ width: '50px', minWidth: '50px', height: '50px', fontSize: '18px' }}>
                              {act.date}
                            </div>
                            <div className="overflow-hidden">
                              <div className="fw-bold text-dark text-truncate mb-1" style={{ fontSize: '13px' }}>{act.title}</div>
                              <div className="text-muted text-underline d-flex align-items-center gap-1" style={{ fontSize: '10px' }}>
                                 <span className="bg-primary rounded-circle" style={{ width: '6px', height: '6px' }}></span>
                                 {act.link}
                              </div>
                              <div className="text-danger-emphasis fw-bold mt-2 d-flex align-items-center gap-1" style={{ fontSize: '10px' }}>
                                 {act.status}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        <ProfileSidebar />
      </div>
    </div>
  );
};

export default InstructorDashboard;
