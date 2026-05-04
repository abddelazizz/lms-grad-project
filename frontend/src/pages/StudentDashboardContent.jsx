import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { courseService, enrollmentService } from '../services';

const StudentDashboardContent = () => {
  const navigate = useNavigate();
  const [liveCourses, setLiveCourses] = useState([]);
  const [loading, setLoading] = useState(true);


  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchMyCourses = async () => {
      try {
        const response = await courseService.getMyCourses();
        if (response.data && response.data.data && response.data.data.courses && response.data.data.courses.length > 0) {
          const formattedLiveCourses = response.data.data.courses.map(c => ({
            id: c.course_id,
            title: c.title,
            author: c.Instructor ? c.Instructor.name : "Instructor",
            progress: c.enrollment?.progress || 0, 
            image: c.thumbnail_url || null,
            avatar: null
          }));
          setLiveCourses(formattedLiveCourses);
        } else {
          setLiveCourses([]);
        }
      } catch (error) {
        setLiveCourses([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMyCourses();
  }, []);

  const filteredCourses = liveCourses.filter(c => 
    c.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleFavorite = (courseId) => {
    setLiveCourses(prev => prev.map(c => 
      c.id === courseId ? { ...c, isFavorite: !c.isFavorite } : c
    ));
    // In a real app, you would also call an API here: studentService.toggleFavorite(courseId)
    toast.success('Favorites updated');
  };

  const handleWithdraw = async (courseId, enrollmentId) => {
    if (!window.confirm("Are you sure you want to withdraw from this course?")) return;
    try {
      await enrollmentService.updateEnrollment(enrollmentId, { status: 'cancelled' });
      toast.success('Withdrawn from course');
      setLiveCourses(prev => prev.filter(c => c.id !== courseId));
    } catch (err) {
      toast.error('Failed to withdraw from course');
    }
  };

  if (loading) return <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>;

  return (
    <div className="student-dashboard-content">
      <Toaster position="top-center" />
      {/* Search Bar - Consistent with Instructor Hub */}
      <div className="search-bar-wrapper mb-5 mx-auto" style={{ maxWidth: '700px' }}>
        <i className="fas fa-search search-icon"></i>
        <input 
          type="text" 
          className="search-input" 
          placeholder="Search your course here...." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Welcome Hero Section */}
      <div className="welcome-hero-card mb-4 p-5 rounded-4 text-white position-relative overflow-hidden shadow-sm" style={{ background: 'linear-gradient(135deg, #31506a 0%, #52758e 100%)' }}>
         <div className="position-relative z-1">
            <h2 className="fw-bold mb-2">Welcome Back, Learner! 👋</h2>
            <p className="opacity-75 mb-4" style={{ maxWidth: '500px' }}>Keep pushing to reach your learning goals. Dive back into your courses below.</p>
            <button className="btn btn-light text-primary-custom fw-bold px-4 rounded-3 shadow-sm" style={{ color: '#31506a' }} onClick={() => navigate('/')}>Browse Courses</button>
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
                   <h5 className="fw-bold mb-0">Study Analytics</h5>
                </div>
                <div className="row text-center py-3">
                   <div className="col-4 border-end">
                      <h4 className="fw-bold text-primary-custom mb-0">{liveCourses.length}</h4>
                      <div className="small text-muted">Courses</div>
                   </div>
                   <div className="col-4 border-end">
                      <h4 className="fw-bold text-primary-custom mb-0">{liveCourses.filter(c => c.progress === 100).length}</h4>
                      <div className="small text-muted">Completed</div>
                   </div>
                   <div className="col-4">
                      <h4 className="fw-bold text-primary-custom mb-0">{Math.round(liveCourses.reduce((acc, c) => acc + (c.progress || 0), 0) / (liveCourses.length || 1))}%</h4>
                      <div className="small text-muted">Avg Progress</div>
                   </div>
                </div>
             </div>
         </div>
      </div>

      <div className="content-section-header mb-4">
        <h4 className="fw-bold text-dark mb-0">Continue Watching</h4>
      </div>

      <div className="row g-4">
        {filteredCourses.length > 0 ? filteredCourses.map(course => (
          <div key={course.id} className="col-md-6 col-xl-4">
            <div className="bg-white rounded-4 overflow-hidden border shadow-sm hover-up transition-all h-100">
              <div className="position-relative d-flex align-items-center justify-content-center bg-light" style={{ height: '160px' }}>
                {course.image ? (
                  <img src={course.image} alt={course.title} className="w-100 h-100 object-fit-cover" />
                ) : (
                  <div className="text-center text-muted">
                    <i className="fas fa-book-open fs-1"></i>
                  </div>
                )}
                <div className="position-absolute top-0 end-0 p-2">
                   <div 
                      className="bg-white rounded-circle p-2 shadow-sm d-flex align-items-center justify-content-center" 
                      style={{ width: '32px', height: '32px', cursor: 'pointer' }}
                      onClick={() => handleToggleFavorite(course.id)}
                   >
                      <i className={`${course.isFavorite ? 'fas' : 'far'} fa-heart text-danger`}></i>
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
                     {course.avatar ? (
                       <img src={course.avatar} alt={course.author} className="rounded-circle" style={{ width: '24px', height: '24px' }} />
                     ) : (
                       <i className="fas fa-user-circle text-secondary" style={{ fontSize: '24px' }}></i>
                     )}
                     <span className="text-muted" style={{ fontSize: '11px' }}>{course.author}</span>
                   </div>
                   <button className="btn p-0 text-primary-custom fw-bold" style={{ fontSize: '12px' }} onClick={() => navigate(`/course-player/${course.id}`)}>Resume</button>
                </div>
                <div className="pt-3">
                   <button 
                     className="btn btn-outline-secondary w-100 rounded-pill btn-sm fw-bold"
                     onClick={() => handleWithdraw(course.id, course.enrollment_id)}
                     style={{ fontSize: '11px', opacity: 0.7 }}
                   >
                     Withdraw from Course
                   </button>
                </div>
              </div>
            </div>
          </div>
        )) : (
          <div className="col-12">
            <div className="text-muted bg-light p-4 rounded-4 text-center border">
              <i className="fas fa-folder-open fs-4 mb-2 text-secondary"></i>
              <p className="mb-0">You are not enrolled in any courses yet.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboardContent;
