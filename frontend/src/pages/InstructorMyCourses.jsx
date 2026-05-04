import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ProfileSidebar from '../components/ProfileSidebar';
import { instructorService } from '../services/apiService';
import toast, { Toaster } from 'react-hot-toast';
import '../styles/Dashboard.css';

const InstructorMyCourses = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await instructorService.getStats();
        setCourses(res.data?.data?.courses || []);
      } catch (err) {
        toast.error("Failed to load courses");
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const handleCourseClick = (courseId) => {
    navigate(`/instructor/manage-course/${courseId}`);
  };

  return (
    <div className="dashboard-page">
      <Toaster position="top-center" />
      <div className="dashboard-layout">
        <Sidebar activePath="/instructor/my-courses" />

        <main className="main-dashboard-content">
          <div className="search-bar-wrapper">
            <i className="fas fa-search search-icon"></i>
            <input type="text" className="search-input" placeholder="Search your course here...." />
          </div>

          <div className="container-fluid max-width-custom pt-5 mt-4 mx-auto">
            <h2 className="fw-bold mb-5" style={{ color: '#1a1d20' }}>My Courses</h2>

            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status"></div>
              </div>
            ) : (
              <div className="row g-5">
                {courses.length > 0 ? courses.map((course) => (
                  <div key={course.course_id} className="col-lg-6">
                    <div 
                      className="bg-white rounded-4 shadow-sm border-0 overflow-hidden cursor-pointer h-100 hover-shadow transition-all p-3"
                      onClick={() => handleCourseClick(course.course_id)}
                    >
                      <div className="ratio ratio-16x9 rounded-4 overflow-hidden mb-4">
                        {course.thumbnail ? (
                          <img src={course.thumbnail} alt={course.title} className="object-fit-cover" />
                        ) : (
                          <div className="d-flex align-items-center justify-content-center text-muted bg-light">
                            <i className="fas fa-book fa-3x opacity-25"></i>
                          </div>
                        )}
                      </div>
                      
                      <div className="px-2">
                        <div className="d-flex gap-3 mb-3">
                          <span className="badge bg-white border text-dark fw-bold px-3 py-2 rounded-3" style={{ fontSize: '13px' }}>
                            4 Sections
                          </span>
                          <span className="badge bg-white border text-dark fw-bold px-3 py-2 rounded-3" style={{ fontSize: '13px' }}>
                            10 Lessons
                          </span>
                        </div>
                        
                        <h4 className="fw-bold text-dark mb-0" style={{ fontSize: '20px' }}>{course.title}</h4>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="col-12 text-center py-5">
                    <p className="text-muted">You haven't created any courses yet.</p>
                    <button className="btn btn-primary-custom rounded-pill px-4" onClick={() => navigate('/instructor/create-course')}>
                      Create Your First Course
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
        <ProfileSidebar />
      </div>
    </div>
  );
};

export default InstructorMyCourses;
