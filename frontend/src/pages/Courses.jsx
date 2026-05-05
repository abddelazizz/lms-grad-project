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

  const displayCourses = courses;

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
        <div className="section-title-wrapper animate-fade-in">
          <h1 className="display-4 fw-bold text-dark">Discover Your Potential</h1>
          <p>
            Explore our curated selection of high-impact courses designed and taught by industry experts. 
            Level up your skills with practical, project-based learning.
          </p>
        </div>

        {displayCourses.length > 0 ? (
          <div className="courses-grid">
            {displayCourses.map((course) => (
              <div key={course.course_id} className="course-card-premium">
                <div className="card-image-wrapper">
                  <img 
                    src={course.thumbnail_url || `https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop`} 
                    alt={course.title} 
                  />
                  <div className={`level-badge level-${course.level || 'beginner'}`}>
                    {course.level || 'Beginner'}
                  </div>
                  <div className="price-tag">
                    {parseFloat(course.price) > 0 ? `$${parseFloat(course.price).toFixed(2)}` : 'FREE'}
                  </div>
                </div>

                <div className="card-content-refined">
                  <div className="instructor-info">
                    <img 
                      src={course.instructor?.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(course.instructor?.name || 'Instructor')}&background=random`} 
                      alt={course.instructor?.name} 
                      className="instructor-avatar"
                    />
                    <span className="instructor-name">by {course.instructor?.name || 'Expert Instructor'}</span>
                  </div>

                  <h3>{course.title}</h3>
                  <p>{course.description}</p>

                  <div className="meta-stats">
                    <div className="stat-item">
                      <i className="fas fa-layer-group"></i>
                      <span>{course.sections?.length || 0} Sections</span>
                    </div>
                    <div className="stat-item">
                      <i className="fas fa-play-circle"></i>
                      <span>{course.sections?.reduce((acc, s) => acc + (s.lessons?.length || 0), 0)} Lessons</span>
                    </div>
                  </div>

                  <div className="card-actions">
                    <Link to={`/courses/${course.course_id}`} className="btn-premium-action">
                      <span>Explore Course</span>
                      <i className="fas fa-arrow-right"></i>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state-lux animate-fade-in">
             <i className="fas fa-rocket mb-4"></i>
             <h2 className="fw-bold text-dark mb-3">Courses are coming soon!</h2>
             <p className="text-muted">Our instructors are currently crafting new learning experiences. Stay tuned for amazing content.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Courses;
