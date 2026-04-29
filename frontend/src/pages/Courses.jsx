import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { courseService } from '../services';
import '../styles/Courses.css';

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await courseService.getAllCourses();
        if (response.data && response.data.data) {
          setCourses(response.data.data.courses);
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const displayCourses = courses.map((c) => ({
    ...c,
    images: c.thumbnail_url ? [c.thumbnail_url] : [],
    curriculum: c.sections ? c.sections.flatMap(s => s.lessons || []).slice(0, 5) : []
  }));

  if (loading) {
    return (
      <div className="courses-page d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="courses-page">
      <div className="container-custom">
        <div className="section-title-wrapper">
          <h1 className="display-4 fw-bold text-dark">Online Courses on Design and Development</h1>
          <p>
            Welcome to our learning platform, where passion meets expertise. Our courses are designed to provide a comprehensive and deeply engaging learning experience, perfectly tailored for your success in the competitive landscape of design and technology.
          </p>
        </div>

        {displayCourses.length > 0 ? displayCourses.map((course) => (
          <div key={course.course_id} className="course-item-container">
            <div className="course-header">
              <div className="course-info">
                <h2 className="course-title">{course.title}</h2>
                <p className="course-description">{course.description}</p>
              </div>
              <Link to={`/courses/${course.course_id}`} className="btn-view-course">View Course</Link>
            </div>

            {course.images && course.images.length > 0 ? (
              <div className="course-images-grid">
                {course.images.map((img, idx) => (
                  <div key={idx} className="course-img-wrapper">
                    <img src={img} alt={`${course.title} detail ${idx + 1}`} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-light rounded-4 d-flex align-items-center justify-content-center border" style={{ height: '200px', marginBottom: '2rem' }}>
                <i className="fas fa-image text-secondary fs-1"></i>
              </div>
            )}

            <div className="curriculum-section">
              <h3 className="curriculum-section-title">Curriculum</h3>
              {course.curriculum && course.curriculum.length > 0 ? (
                <div className="curriculum-grid">
                  {course.curriculum.map((item, idx) => (
                    <div key={idx} className="curriculum-item">
                      <span className="curriculum-number">0{idx + 1}</span>
                      <p className="curriculum-title">{item.title}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-muted p-3 bg-light rounded-3 border">No curriculum uploaded yet.</div>
              )}
            </div>
          </div>
        )) : (
          <div className="text-center p-5 bg-white rounded-4 border shadow-sm my-5">
             <i className="fas fa-folder-open fs-1 text-muted mb-3"></i>
             <h4 className="fw-bold text-dark">No Courses Available</h4>
             <p className="text-muted">There are currently no courses published on the platform.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Courses;
