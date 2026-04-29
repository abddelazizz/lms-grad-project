import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { courseService } from '../services/apiService';

const Courses = () => {
  const [coursesData, setCoursesData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLatestCourses = async () => {
      try {
        const response = await courseService.getAllCourses(1, 6);
        setCoursesData(response.data?.data?.courses || []);
      } catch (error) {
        console.error("Failed to fetch landing page courses:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLatestCourses();
  }, []);

  return (
    <section className="courses py-5 mb-5">
      <div className="container-custom px-5">
        <div className="d-flex justify-content-between align-items-start mb-5 pb-3">
          <div className="courses-header-text pe-4">
            <h2 className="display-6 fw-bold mb-3 text-dark">Our Courses</h2>
            <p className="text-secondary mb-0 fs-5 lh-lg courses-desc">Explore our wide range of expert-led courses designed to equip you with the skills and knowledge needed to excel in today's digital world.</p>
          </div>
          <Link to="/courses" className="btn bg-white border border-light-subtle text-dark px-4 py-2 fw-medium rounded-2">View All</Link>
        </div>

        {loading ? (
          <div className="text-center w-100 py-5">
            <div className="spinner-border text-primary" role="status"></div>
          </div>
        ) : coursesData.length > 0 ? (
          <div className="row g-4">
            {coursesData.map((course, index) => (
              <div className="col-lg-6" key={course.course_id || index}>
                <div className="card border-0 bg-white rounded-4 p-4 h-100 d-flex flex-column course-card-custom">
                  <div className="img-container mb-4 bg-light d-flex align-items-center justify-content-center rounded-3" style={{ height: '320px' }}>
                    {course.thumbnail_url ? (
                      <img src={course.thumbnail_url} className="card-img-top rounded-3 object-fit-cover w-100 h-100" alt={course.title} />
                    ) : (
                      <i className="fas fa-image text-secondary" style={{ fontSize: '4rem' }}></i>
                    )}
                  </div>
                  
                  <div className="d-flex justify-content-center gap-3 mb-4">
                    <span className="badge bg-white text-secondary border border-light-subtle rounded-2 px-3 py-2 fw-normal fs-6">
                      {course.duration ? `${course.duration} Weeks` : 'Self-Paced'}
                    </span>
                    <span className="badge bg-white text-secondary border border-light-subtle rounded-2 px-3 py-2 fw-normal fs-6">
                      {course.level || 'All Levels'}
                    </span>
                  </div>
                  
                  <div className="card-body p-0 d-flex flex-column flex-grow-1">
                    <h3 className="h4 fw-bold mb-3 text-dark text-center">{course.title}</h3>
                    <p className="text-secondary mb-4 text-center lh-lg fs-6 flex-grow-1 px-3 text-truncate-2" style={{ maxHeight: '60px', overflow: 'hidden' }}>
                      {course.description || "No description provided."}
                    </p>
                    <Link to={`/courses/${course.course_id}`} className="btn btn-primary-custom w-100 py-3 fw-bold rounded-2">Get it Now</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center w-100 py-5 bg-white rounded-4 shadow-sm">
            <h4 className="text-muted">No courses published yet</h4>
          </div>
        )}
      </div>
    </section>
  );
};

export default Courses;