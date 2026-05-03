import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { courseService, enrollmentService } from '../services';
import toast, { Toaster } from 'react-hot-toast';
import '../styles/Courses.css';
import '../styles/CourseDetails.css';

const CourseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      // Backend expects POST /api/courses/:id/enroll
      await enrollmentService.enroll(id);
      toast.success("Successfully enrolled in the course!");
      // Optionally navigate to dashboard
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to enroll in the course.");
    } finally {
      setEnrolling(false);
    }
  };


  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const response = await courseService.getCourseDetails(id);
        if (response.data && response.data.data && response.data.data.course) {
          setCourse(response.data.data.course);
        }
      } catch (error) {
        console.error('Failed to fetch course details', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [id]);

  if (loading) {
    return (
      <div className="course-details-page d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="course-details-page container py-5">
        <h2>Course not found.</h2>
        <Link to="/courses" className="btn btn-primary mt-3">Back to Courses</Link>
      </div>
    );
  }

  return (
    <div className="course-details-page">
      <Toaster position="top-center" />
      <div className="container-custom">
        <div className="section-title-wrapper d-flex justify-content-between align-items-end">
          <div>
            <h1 className="display-4 fw-bold text-dark">{course.title}</h1>
            <p>{course.description}</p>
          </div>
          <button 
            className="btn btn-primary-custom px-5 py-3 fw-bold rounded-3" 
            onClick={handleEnroll}
            disabled={enrolling}
          >
            {enrolling ? 'Enrolling...' : 'Enroll Now'}
          </button>
        </div>

        <div className="details-hero-section position-relative">
          <img src={course.heroImage} className="hero-main-img" alt={course.title} />
          <div className="video-play-overlay" onClick={() => navigate(`/courses/${id}/learn/lesson/01`)}>
            <i className="fas fa-play"></i>
          </div>
        </div>

        <div className="details-curriculum-grid">
            {course.images && course.images.length > 0 ? (
              course.images.map((img, idx) => (
                <div key={idx} className="course-img-wrapper">
                  <img src={img} alt={`${course.title} detail ${idx + 1}`} />
                </div>
              ))
            ) : (
              <div className="bg-light w-100 rounded-4 d-flex align-items-center justify-content-center border" style={{ height: '300px', gridColumn: '1 / -1' }}>
                <i className="fas fa-image text-secondary" style={{ fontSize: '4rem' }}></i>
              </div>
            )}
          {course.curriculum.map((section, idx) => (
            <div key={section.id} className="section-card">
              <span className="section-number">0{idx + 1}</span>
              <h3 className="section-header-title">{section.title}</h3>
              
              <div className="lessons-container">
                {section.lessons.map((lesson, lIdx) => (
                  <div 
                    key={lIdx} 
                    className="lesson-row" 
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/courses/${id}/learn/lesson/${lIdx + 1}`)}
                  >
                    <div className="lesson-info-left">
                      <span className="lesson-info-title">{lesson.title}</span>
                      <span className="lesson-info-subtitle">Lesson {lIdx + 1}</span>
                    </div>
                    <div className="lesson-info-right">
                      <span className="duration-tag">
                        <i className="far fa-clock"></i> {lesson.duration}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CourseDetails;
