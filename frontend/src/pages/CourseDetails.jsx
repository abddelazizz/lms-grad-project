import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { courseService, enrollmentService } from '../services';
import toast, { Toaster } from 'react-hot-toast';
import Sidebar from '../components/Sidebar';
import ProfileSidebar from '../components/ProfileSidebar';
import '../styles/Dashboard.css';

const CourseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  const fetchCourse = async () => {
    try {
      const response = await courseService.getDetailedCourse(id);
      if (response.data?.data?.course) {
        setCourse(response.data.data.course);
      }
    } catch (error) {
      console.error('Failed to fetch course details', error);
      toast.error("Failed to load course details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourse();
  }, [id]);

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      await enrollmentService.enroll(id);
      toast.success("Successfully enrolled!");
      fetchCourse(); // Refresh to show "Go to Course"
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to enroll.");
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-page d-flex justify-content-center align-items-center">
        <div className="spinner-border text-primary-custom" role="status"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="dashboard-page container py-5 text-center">
        <h2 className="fw-bold">Course not found.</h2>
        <Link to="/courses" className="btn btn-primary-custom mt-3">Back to Courses</Link>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <Toaster position="top-center" />
      <div className="dashboard-layout">
        <Sidebar activePath="/courses" />

        <main className="main-dashboard-content w-100 p-4">
          <div className="container-fluid pt-5 mt-4 mx-auto" style={{ maxWidth: '1100px' }}>
            
            {/* Header / Hero */}
            <div className="row g-5 mb-5">
              <div className="col-lg-7">
                <div className="badge bg-primary-custom mb-3 px-3 py-2 rounded-pill">{course.level?.toUpperCase()}</div>
                <h1 className="display-5 fw-bold text-dark mb-4">{course.title}</h1>
                <p className="lead text-muted mb-5" style={{ fontSize: '18px', lineHeight: '1.8' }}>
                  {course.description || "No description available for this course yet."}
                </p>

                <div className="d-flex align-items-center gap-4 mb-5 p-4 bg-white rounded-4 border shadow-sm">
                   <div className="instructor-info d-flex align-items-center gap-3">
                      <img 
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(course.Instructor?.name || course.instructor_id || 'Instructor')}&background=random`} 
                        className="rounded-circle" style={{ width: '50px', height: '50px' }} alt={course.Instructor?.name || 'Instructor'} 
                      />
                      <div>
                        <div className="text-muted small">Created by</div>
                        <div className="fw-bold">{course.Instructor?.name || `Instructor #${course.instructor_id}`}</div>
                      </div>
                   </div>
                   <div className="vr mx-2" style={{ height: '40px' }}></div>
                   <div>
                      <div className="text-muted small">Price</div>
                      <div className="fw-bold text-primary-custom">${course.price}</div>
                   </div>
                </div>

                {course.isEnrolled ? (
                  <button 
                    className="btn btn-primary-custom px-5 py-3 fw-bold rounded-pill shadow-lg hstack gap-2" 
                    onClick={() => navigate(`/dashboard/course/${course.course_id}`)}
                  >
                    <i className="fas fa-play-circle me-2"></i> Go to Course
                  </button>
                ) : user?.role === 'student' ? (
                  <button 
                    className="btn btn-primary-custom px-5 py-3 fw-bold rounded-pill shadow-lg" 
                    onClick={handleEnroll}
                    disabled={enrolling}
                  >
                    {enrolling ? 'Processing...' : 'Enroll Now'}
                  </button>
                ) : (
                  <div className="alert alert-info d-inline-block rounded-pill px-4">
                    <i className="fas fa-info-circle me-2"></i> Only students can enroll in courses.
                  </div>
                )}
              </div>

              <div className="col-lg-5">
                <div className="position-relative rounded-5 overflow-hidden shadow-lg border-4 border-white" style={{ height: '350px' }}>
                  <img 
                    src={course.thumbnail_url || '/images/course-placeholder.jpg'} 
                    className="w-100 h-100" style={{ objectFit: 'cover' }} 
                    alt={course.title} 
                    onError={(e) => e.target.src = 'https://via.placeholder.com/600x400?text=Course+Thumbnail'}
                  />
                  <div className="position-absolute bottom-0 start-0 w-100 p-4 bg-dark bg-opacity-50 text-white backdrop-blur">
                    <div className="d-flex justify-content-between align-items-center">
                        <span className="fw-bold"><i className="fas fa-layer-group me-2"></i> {course.sections?.length || 0} Sections</span>
                        <span className="fw-bold"><i className="fas fa-clock me-2"></i> Self-paced</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Curriculum */}
            <div className="bg-white p-5 rounded-5 shadow-sm border mb-5">
              <h3 className="fw-bold mb-5 d-flex align-items-center gap-3">
                <span className="bg-primary-custom text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px', fontSize: '18px' }}>
                  <i className="fas fa-list-ul"></i>
                </span>
                Course Curriculum
              </h3>

              <div className="accordion custom-accordion" id="curriculumAccordion">
                {course.sections && course.sections.length > 0 ? course.sections.map((section, idx) => (
                  <div key={section.section_id} className="accordion-item border-0 mb-3 bg-light rounded-4 overflow-hidden shadow-sm">
                    <h2 className="accordion-header">
                      <button className="accordion-button collapsed bg-white fw-bold px-4 py-3" type="button" data-bs-toggle="collapse" data-bs-target={`#collapse${idx}`}>
                        <div className="d-flex align-items-center gap-3">
                          <span className="text-primary-custom opacity-50">0{idx + 1}</span>
                          {section.title}
                        </div>
                        <span className="ms-auto me-3 badge bg-light text-muted border fw-normal">{section.lessons?.length || 0} Lessons</span>
                      </button>
                    </h2>
                    <div id={`collapse${idx}`} className="accordion-collapse collapse" data-bs-parent="#curriculumAccordion">
                      <div className="accordion-body p-0 bg-white">
                        <div className="list-group list-group-flush">
                          {section.lessons && section.lessons.length > 0 ? section.lessons.map((lesson, lIdx) => (
                            <div 
                              key={lesson.content_id} 
                              className={`list-group-item d-flex align-items-center justify-content-between px-4 py-3 border-0 border-bottom ${course.isEnrolled ? 'cursor-pointer hover-bg-gray' : ''}`}
                              onClick={() => {
                                if (course.isEnrolled) {
                                  navigate(`/courses/${course.course_id}/learn/lesson/${lesson.content_id}`);
                                } else if (lesson.is_free_preview) {
                                  toast.info("Free preview coming soon!");
                                } else {
                                  toast.error("Please enroll to access this lesson.");
                                }
                              }}
                            >
                              <div className="d-flex align-items-center gap-3">
                                <i className={`fas ${lesson.content_type === 'video' ? 'fa-video' : 'fa-file-pdf'} text-muted`}></i>
                                <span className="fw-medium">{lesson.title}</span>
                              </div>
                              <div className="d-flex align-items-center gap-3 text-muted small">
                                <span>{lesson.duration}</span>
                                {(!course.isEnrolled && !lesson.is_free_preview) ? <i className="fas fa-lock"></i> : <i className="fas fa-play-circle"></i>}
                              </div>
                            </div>
                          )) : (
                            <div className="p-4 text-center text-muted small">No lessons in this section yet.</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center p-5 bg-light rounded-4 border dashed">
                     <p className="mb-0 text-muted">Curriculum is being prepared. Stay tuned!</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </main>

        <ProfileSidebar />
      </div>
    </div>
  );
};

export default CourseDetails;
