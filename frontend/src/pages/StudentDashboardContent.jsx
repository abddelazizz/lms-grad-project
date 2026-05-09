import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import Swal from 'sweetalert2';
import { courseService, enrollmentService } from '../services';

const StudentDashboardContent = ({ searchTerm = '' }) => {
  const navigate = useNavigate();
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [liveCourses, setLiveCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyCourses = async () => {
      try {
        const response = await courseService.getMyCourses();
        const coursesData = response.data?.data?.courses || [];
        const formattedLiveCourses = coursesData.map(c => ({
          id: c.course_id,
          title: c.title,
          description: c.description,
          author: c.instructor?.name || "Expert Instructor",
          instructor: c.instructor,
          progress: parseFloat(c.progress_percentage) || 0,
          image: c.thumbnail_url || null,
          level: c.level || 'Beginner',
          enrollment_id: c.enrollment_id, // We might need this for withdrawal
          isFavorite: false // Placeholder for favorite logic
        }));
        setLiveCourses(formattedLiveCourses);
      } catch (error) {
        console.error("Failed to fetch my courses", error);
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

  const handleToggleFavorite = (e, courseId) => {
    e.stopPropagation();
    setLiveCourses(prev => prev.map(c =>
      c.id === courseId ? { ...c, isFavorite: !c.isFavorite } : c
    ));
    toast.success('Favorites updated');
  };

  const handleWithdraw = async (e, courseId, enrollmentId) => {
    e.stopPropagation();

    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to access this course anymore!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#31506a',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, withdraw me!',
      cancelButtonText: 'No, keep it',
      background: '#ffffff',
      customClass: {
        popup: 'rounded-5 border-0 shadow-lg',
        confirmButton: 'rounded-pill px-4 py-2 fw-bold',
        cancelButton: 'rounded-pill px-4 py-2 fw-bold'
      }
    });

    if (result.isConfirmed) {
      try {
        await enrollmentService.updateEnrollment(enrollmentId, { status: 'dropped' });
        toast.success('Withdrawn from course');
        setLiveCourses(prev => prev.filter(c => c.id !== courseId));
        setShowModal(false);
      } catch (err) {
        toast.error('Failed to withdraw from course');
      }
    }
  };

  const openCourseDetails = (course) => {
    setSelectedCourse(course);
    setShowModal(true);
  };

  if (loading) return (
    <div className="d-flex flex-column align-items-center justify-content-center p-5" style={{ minHeight: '400px' }}>
      <div className="spinner-grow text-primary-custom mb-3" role="status"></div>
      <span className="text-muted fw-bold">Loading your academy...</span>
    </div>
  );

  return (

    <div className="student-dashboard-content animate-fade-in">
      <Toaster
        position="top-center"
        containerStyle={{ zIndex: 100000 }}
        toastOptions={{
          style: {
            zIndex: 100001,
          },
        }}
      />


      {/* Welcome Hero Section */}
      <div className="welcome-hero-card mb-5 p-5 rounded-5 text-white position-relative overflow-hidden shadow-lg"
        style={{ background: 'linear-gradient(135deg, #1e293b 0%, #31506a 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="position-relative z-1">
          <div className="badge bg-primary-custom mb-3 px-3 py-2 rounded-pill shadow-sm" style={{ letterSpacing: '1px' }}>STUDENT HUB</div>
          <h1 className="display-6 fw-bold mb-2">Welcome Back, {liveCourses.length > 0 ? 'Champion' : 'Learner'}! 👋</h1>
          <p className="opacity-75 mb-4 fs-5" style={{ maxWidth: '550px' }}>Your progress is your power. Continue where you left off and master new skills.</p>
          <div className="d-flex gap-3">
            <button className="btn btn-primary-custom px-4 py-2 rounded-pill fw-bold shadow-sm" onClick={() => navigate('/')}>
              <i className="fas fa-compass me-2"></i>Explore More
            </button>
          </div>
        </div>
        {/* Abstract background decorative elements */}
        <div className="position-absolute end-0 top-0 opacity-10" style={{ transform: 'translate(10%, -10%) rotate(-15deg)' }}>
          <i className="fas fa-brain" style={{ fontSize: '280px' }}></i>
        </div>
      </div>

      {/* Analytics Row */}
      <div className="row g-4 mb-5">
        <div className="col-lg-12">
          <div className="bg-white p-4 rounded-5 border-0 shadow-lg d-flex align-items-center justify-content-around text-center">
            <div className="px-4">
              <div className="bg-primary-custom bg-opacity-10 text-primary-custom rounded-circle d-flex align-items-center justify-content-center mx-auto mb-2" style={{ width: '50px', height: '50px' }}>
                <i className="fas fa-book"></i>
              </div>
              <h3 className="fw-bold mb-0">{liveCourses.length}</h3>
              <div className="text-muted small fw-bold">Active Courses</div>
            </div>
            <div className="vr opacity-10" style={{ height: '60px' }}></div>
            <div className="px-4">
              <div className="bg-success bg-opacity-10 text-success rounded-circle d-flex align-items-center justify-content-center mx-auto mb-2" style={{ width: '50px', height: '50px' }}>
                <i className="fas fa-check-double"></i>
              </div>
              <h3 className="fw-bold mb-0">{liveCourses.filter(c => Math.round(parseFloat(c.progress) || 0) >= 100).length}</h3>
              <div className="text-muted small fw-bold">Completed</div>
            </div>
            <div className="vr opacity-10" style={{ height: '60px' }}></div>
            <div className="px-4">
              <div className="bg-warning bg-opacity-10 text-warning rounded-circle d-flex align-items-center justify-content-center mx-auto mb-2" style={{ width: '50px', height: '50px' }}>
                <i className="fas fa-chart-line"></i>
              </div>
              <h3 className="fw-bold mb-0">{liveCourses.length > 0 ? Math.round(liveCourses.reduce((acc, c) => acc + (parseFloat(c.progress) || 0), 0) / liveCourses.length) : 0}%</h3>
              <div className="text-muted small fw-bold">Avg Progress</div>
            </div>
          </div>
        </div>
      </div>

      <div className="d-flex align-items-center justify-content-between mb-4">
        <h4 className="fw-bold text-dark mb-0 d-flex align-items-center gap-3">
          <span className="bg-primary-custom text-white rounded-3 p-2 d-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px' }}>
            <i className="fas fa-play small"></i>
          </span>
          Your Learning Path
        </h4>
        <div className="text-muted small fw-bold">{filteredCourses.length} Courses Found</div>
      </div>

      <div className="row g-4 mb-5">
        {filteredCourses.length > 0 ? filteredCourses.map(course => (
          <div key={course.id} className="col-md-6 col-xl-4">
            <div className="bg-white rounded-5 overflow-hidden border-0 shadow-lg hover-up transition-all h-100 position-relative group"
              style={{ cursor: 'pointer' }}
              onClick={() => openCourseDetails(course)}>

              {/* Card Header/Thumbnail */}
              <div className="position-relative overflow-hidden" style={{ height: '180px' }}>
                {course.image ? (
                  <img src={course.image} alt={course.title} className="w-100 h-100 object-fit-cover transition-transform group-hover-scale" />
                ) : (
                  <div className="w-100 h-100 d-flex align-items-center justify-content-center bg-light text-muted">
                    <i className="fas fa-laptop-code display-4 opacity-20"></i>
                  </div>
                )}

                {/* Overlays */}
                <div className="position-absolute top-0 start-0 p-3">
                  <span className="badge bg-white text-dark shadow-sm rounded-pill px-3 py-2 fw-bold" style={{ fontSize: '10px' }}>
                    {course.level?.toUpperCase()}
                  </span>
                </div>
                <div className="position-absolute top-0 end-0 p-3">
                  <div
                    className="bg-white bg-opacity-90 backdrop-blur rounded-circle p-2 shadow-sm d-flex align-items-center justify-content-center hover-scale transition-all"
                    style={{ width: '36px', height: '36px' }}
                    onClick={(e) => handleToggleFavorite(e, course.id)}
                  >
                    <i className={`${course.isFavorite ? 'fas' : 'far'} fa-heart text-danger`}></i>
                  </div>
                </div>

                {/* Progress Mini Badge */}
                <div className="position-absolute bottom-0 start-0 m-3">
                  <div className="bg-dark bg-opacity-70 backdrop-blur text-white px-3 py-1 rounded-pill small fw-bold" style={{ fontSize: '10px' }}>
                    {course.progress}% Completed
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4">
                <h5 className="fw-bold mb-2 text-dark text-truncate-2" style={{ height: '50px', fontSize: '1.1rem', lineHeight: '1.4' }}>{course.title}</h5>

                <div className="d-flex align-items-center gap-2 mb-4">
                  <img
                    src={course.instructor?.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(course.author)}&background=random`}
                    alt={course.author}
                    className="rounded-circle shadow-sm"
                    style={{ width: '28px', height: '28px', border: '2px solid #fff' }}
                  />
                  <span className="text-muted fw-bold" style={{ fontSize: '12px' }}>{course.author}</span>
                </div>

                <div className="mb-4">
                  <div className="progress rounded-pill bg-light shadow-inner" style={{ height: '8px' }}>
                    <div className="progress-bar bg-primary-custom progress-bar-striped progress-bar-animated"
                      style={{ width: `${course.progress}%`, borderRadius: '10px' }}></div>
                  </div>
                </div>

                <div className="d-flex gap-2">
                  <button className="btn btn-primary-custom flex-grow-1 rounded-pill py-2 fw-bold shadow-sm transition-all"
                    onClick={(e) => { e.stopPropagation(); navigate(`/course-player/${course.id}`); }}>
                    <i className="fas fa-play-circle me-2"></i>Resume
                  </button>
                  <button className="btn btn-outline-light border text-dark rounded-circle p-0 d-flex align-items-center justify-content-center shadow-sm"
                    style={{ width: '42px', height: '42px' }}
                    onClick={() => openCourseDetails(course)}>
                    <i className="fas fa-info-circle"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )) : (
          <div className="col-12">
            <div className="text-center py-5 bg-white rounded-5 shadow-sm border border-dashed p-5">
              <div className="bg-light rounded-circle d-flex align-items-center justify-content-center mx-auto mb-4" style={{ width: '80px', height: '80px' }}>
                <i className="fas fa-ghost text-muted fa-2x"></i>
              </div>
              <h5 className="fw-bold text-dark">No courses match your search</h5>
              <p className="text-muted">Try a different keyword or explore new courses.</p>
              <button className="btn btn-primary-custom px-4 rounded-pill fw-bold mt-2" onClick={() => setSearchTerm('')}>Clear Search</button>
            </div>
          </div>
        )}
      </div>

      {/* Course Details Modal */}
      {showModal && selectedCourse && (
        <div className="custom-modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="custom-modal-container animate-zoom-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-dialog modal-lg m-0 w-100" style={{ maxWidth: '900px' }}>
              <div className="modal-content border-0 shadow-2xl rounded-5 overflow-hidden">
                <div className="position-relative" style={{ height: '240px' }}>
                  <img src={selectedCourse.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedCourse.title)}&background=random`}
                    className="w-100 h-100 object-fit-cover" alt="Banner" />
                  <div className="position-absolute top-0 start-0 w-100 h-100" style={{ background: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.8) 100%)' }}></div>
                  <button type="button" className="btn-close btn-close-white position-absolute top-0 end-0 m-4 shadow-none" onClick={() => setShowModal(false)}></button>

                  <div className="position-absolute bottom-0 start-0 p-4 w-100 text-white">
                    <div className="badge bg-primary-custom mb-2 px-3 py-2 rounded-pill shadow-sm">{selectedCourse.level?.toUpperCase()}</div>
                    <h3 className="fw-bold m-0">{selectedCourse.title}</h3>
                  </div>
                </div>

                <div className="modal-body p-4 p-lg-5">
                  <div className="row g-4">
                    <div className="col-lg-8">
                      <h6 className="fw-bold text-uppercase text-primary-custom mb-3" style={{ letterSpacing: '1px', fontSize: '12px' }}>Description</h6>
                      <p className="text-muted mb-4" style={{ lineHeight: '1.7' }}>
                        {selectedCourse.description || "In this course, you will dive deep into the core concepts and practical applications. Gain hands-on experience and master the skills needed to excel in this field."}
                      </p>

                      <div className="d-flex align-items-center gap-4 p-4 bg-light rounded-4 border-0 mb-4">
                        <div className="d-flex align-items-center gap-3">
                          <img src={selectedCourse.instructor?.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedCourse.author)}&background=random`}
                            className="rounded-circle shadow-sm" style={{ width: '50px', height: '50px', border: '3px solid #fff' }} alt="Avatar" />
                          <div>
                            <div className="text-muted small fw-bold">Instructor</div>
                            <div className="fw-bold text-dark">{selectedCourse.author}</div>
                          </div>
                        </div>
                        <div className="vr opacity-20" style={{ height: '40px' }}></div>
                        <div>
                          <div className="text-muted small fw-bold">Status</div>
                          <div className="badge bg-success bg-opacity-10 text-success rounded-pill px-3 fw-bold">Enrolled</div>
                        </div>
                      </div>
                    </div>

                    <div className="col-lg-4">
                      <div className="vstack gap-3 sticky-top" style={{ top: '20px' }}>
                        <div className="bg-primary-custom bg-opacity-5 p-4 rounded-4 border border-primary-custom border-opacity-10">
                          <div className="d-flex justify-content-between mb-2">
                            <span className="text-muted small fw-bold">Progress</span>
                            <span className="text-primary-custom fw-bold">{selectedCourse.progress}%</span>
                          </div>
                          <div className="progress rounded-pill bg-white mb-4" style={{ height: '8px' }}>
                            <div className="progress-bar bg-primary-custom" style={{ width: `${selectedCourse.progress}%` }}></div>
                          </div>

                          <button className="btn btn-primary-custom w-100 py-3 rounded-pill fw-bold shadow-lg mb-3"
                            onClick={() => navigate(`/course-player/${selectedCourse.id}`)}>
                            <i className="fas fa-play-circle me-2"></i>Continue Learning
                          </button>

                          <button className="btn btn-outline-danger w-100 py-2 rounded-pill fw-bold border-0 text-decoration-none small opacity-75 hover-opacity-100"
                            onClick={(e) => handleWithdraw(e, selectedCourse.id, selectedCourse.enrollment_id)}>
                            <i className="fas fa-sign-out-alt me-2"></i>Withdraw
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Added some custom styles directly */}
      <style>{`
        .hover-up { transition: all 0.3s ease; }
        .hover-up:hover { transform: translateY(-10px); }
        .group:hover .group-hover-scale { transform: scale(1.1); }
        .transition-transform { transition: transform 0.5s ease; }
        .animate-zoom-in { animation: zoomIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
        @keyframes zoomIn {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in { animation: fadeIn 0.5s ease-out; }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .backdrop-blur { backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
        .shadow-2xl { box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
        .text-truncate-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .shadow-inner { box-shadow: inset 0 2px 4px 0 rgba(0,0,0,0.06); }
        .custom-modal-container {
          z-index: 9999;
        }
        .custom-modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(2, 6, 23, 0.85);
          backdrop-filter: blur(10px);
          z-index: 9998;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .modal-content {
          background-color: #ffffff !important;
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
};

export default StudentDashboardContent;
