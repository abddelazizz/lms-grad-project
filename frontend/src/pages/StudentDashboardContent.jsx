import React, { useState, useEffect } from 'react';
import { courseService } from '../services';

const StudentDashboardContent = () => {
  const [liveCourses, setLiveCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const watchingCourses = [
    {
      id: 1,
      title: "Advanced Web Design Mastery: CSS Architecture",
      author: "Kristin Watson",
      progress: 45,
      image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=800",
      avatar: "https://i.pravatar.cc/150?u=kw1"
    }
  ];

  useEffect(() => {
    const fetchMyCourses = async () => {
      try {
        const response = await courseService.getMyCourses();
        if (response.data && response.data.data && response.data.data.courses && response.data.data.courses.length > 0) {
          const formattedLiveCourses = response.data.data.courses.map(c => ({
            id: c.course_id,
            title: c.title,
            author: c.Instructor ? c.Instructor.name : "Instructor",
            progress: 0, 
            image: c.thumbnail_url || "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=800",
            avatar: "https://i.pravatar.cc/150?u=" + c.course_id
          }));
          setLiveCourses(formattedLiveCourses);
        } else {
          setLiveCourses(watchingCourses);
        }
      } catch (error) {
        setLiveCourses(watchingCourses);
      } finally {
        setLoading(false);
      }
    };
    fetchMyCourses();
  }, []);

  if (loading) return <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>;

  return (
    <div className="student-dashboard-content">
      {/* Search Bar - Consistent with Instructor Hub */}
      <div className="search-bar-wrapper mb-5 mx-auto" style={{ maxWidth: '700px' }}>
        <i className="fas fa-search search-icon"></i>
        <input type="text" className="search-input" placeholder="Search your course here...." />
      </div>

      {/* Welcome Hero Section */}
      <div className="welcome-hero-card mb-4 p-5 rounded-4 text-white position-relative overflow-hidden shadow-sm" style={{ background: 'linear-gradient(135deg, #31506a 0%, #52758e 100%)' }}>
         <div className="position-relative z-1">
            <h2 className="fw-bold mb-2">Welcome Back, Learner! 👋</h2>
            <p className="opacity-75 mb-4" style={{ maxWidth: '500px' }}>You've completed 75% of your weekly goal. Keep pushing to reach your target!</p>
            <button className="btn btn-light text-primary-custom fw-bold px-4 rounded-3 shadow-sm" style={{ color: '#31506a' }}>Continue Learning</button>
         </div>
         {/* Abstract background shapes */}
         <div className="position-absolute end-0 top-0 opacity-10" style={{ transform: 'translate(20%, -20%)' }}>
            <i className="fas fa-graduation-cap" style={{ fontSize: '200px' }}></i>
         </div>
      </div>

      <div className="row g-4 mb-5">
         {/* Learning Analytics for Student */}
         <div className="col-lg-12">
            <div className="bg-white p-4 rounded-4 border shadow-sm">
               <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5 className="fw-bold mb-0">Weekly Study Hours</h5>
                  <div className="text-muted small">Total: 24h This Week</div>
               </div>
               <div className="d-flex align-items-end justify-content-between h-75 px-3 pt-4" style={{ minHeight: '180px' }}>
                  {[4, 6, 3, 8, 5, 2, 7].map((h, i) => (
                    <div key={i} className="text-center" style={{ width: '10%' }}>
                      <div className="mx-auto rounded-1" 
                           style={{ 
                             width: '24px', 
                             height: `${h * 20}px`, 
                             backgroundColor: i === 6 ? '#31506a' : '#e0e7ff',
                             transition: 'all 0.5s ease' 
                           }}></div>
                      <div className="small mt-2 text-muted" style={{ fontSize: '10px' }}>{['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i]}</div>
                    </div>
                  ))}
               </div>
            </div>
         </div>
      </div>

      <div className="content-section-header mb-4">
        <h4 className="fw-bold text-dark mb-0">Continue Watching</h4>
        <div className="scroll-controls">
          <button className="btn btn-link text-dark p-0 me-2"><i className="fas fa-chevron-left"></i></button>
          <button className="btn btn-link text-dark p-0"><i className="fas fa-chevron-right"></i></button>
        </div>
      </div>

      <div className="row g-4">
        {liveCourses.map(course => (
          <div key={course.id} className="col-md-6 col-xl-4">
            <div className="bg-white rounded-4 overflow-hidden border shadow-sm hover-up transition-all h-100">
              <div className="position-relative" style={{ height: '160px' }}>
                <img src={course.image} alt={course.title} className="w-100 h-100 object-fit-cover" />
                <div className="position-absolute top-0 end-0 p-2">
                   <div className="bg-white rounded-circle p-2 shadow-sm d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                      <i className="far fa-heart text-danger"></i>
                   </div>
                </div>
              </div>
              <div className="p-3">
                <h6 className="fw-bold mb-3 text-dark text-truncate-2" style={{ height: '40px', fontSize: '14px', lineHeight: '1.4' }}>{course.title}</h6>
                <div className="mb-3">
                   <div className="d-flex justify-content-between small text-muted mb-1" style={{ fontSize: '10px' }}>
                      <span>Progress</span>
                      <span>{course.progress}%</span>
                   </div>
                   <div className="progress rounded-pill" style={{ height: '6px' }}>
                      <div className="progress-bar bg-primary-custom" style={{ width: `${course.progress}%` }}></div>
                   </div>
                </div>
                <div className="d-flex align-items-center justify-content-between">
                   <div className="d-flex align-items-center gap-2">
                     <img src={course.avatar} alt={course.author} className="rounded-circle" style={{ width: '24px', height: '24px' }} />
                     <span className="text-muted" style={{ fontSize: '11px' }}>{course.author}</span>
                   </div>
                   <button className="btn p-0 text-primary-custom fw-bold" style={{ fontSize: '12px' }}>Resume</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudentDashboardContent;
