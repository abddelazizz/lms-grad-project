import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ProfileSidebar from '../components/ProfileSidebar';
import { instructorService, courseService } from '../services/apiService';
import toast, { Toaster } from 'react-hot-toast';
import '../styles/Dashboard.css';

const InstructorMyCourses = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await instructorService.getStats();
        const coursesData = res.data?.data?.courses || [];
        setCourses(coursesData);
        setFilteredCourses(coursesData);
      } catch (err) {
        toast.error("Failed to load courses");
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  useEffect(() => {
    const filtered = courses.filter(course => 
      course.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredCourses(filtered);
  }, [searchQuery, courses]);

  const handleStatusToggle = async (courseId, currentStatus) => {
    try {
      if (currentStatus === 'published') {
        // Unpublish: change status to draft
        await courseService.updateCourse(courseId, { status: 'draft' });
        toast.success("Course set to draft");
      } else {
        // Publish: use the publish endpoint
        await courseService.publishCourse(courseId);
        toast.success("Course published successfully!");
      }
      
      // Refresh list
      const res = await instructorService.getStats();
      setCourses(res.data?.data?.courses || []);
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to update status";
      if (typeof errorMsg === 'string' && errorMsg.startsWith('{')) {
        const missing = JSON.parse(errorMsg).missing;
        toast.error(`Publishing failed: ${missing.join(', ')}`);
      } else {
        toast.error(errorMsg);
      }
    }
  };

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
            <input 
              type="text" 
              className="search-input" 
              placeholder="Search your courses by title..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="container-fluid max-width-custom pt-5 mt-4 mx-auto pb-5">
            <div className="d-flex justify-content-between align-items-end mb-5">
              <div>
                <h2 className="fw-bold mb-1" style={{ color: '#1a1d20', fontSize: '2.5rem' }}>My Courses</h2>
                <p className="text-muted mb-0">Manage and track your curriculum performance</p>
              </div>
              <button 
                className="btn btn-primary-custom rounded-pill px-4 py-2 d-flex align-items-center gap-2 shadow-sm"
                onClick={() => navigate('/instructor/create-course')}
                style={{ transition: 'all 0.3s ease' }}
              >
                <i className="fas fa-plus-circle"></i>
                <span>Create New Course</span>
              </button>
            </div>

            {loading ? (
              <div className="d-flex flex-column align-items-center justify-content-center py-5">
                <div className="spinner-grow text-primary mb-3" role="status"></div>
                <span className="text-muted fw-medium">Loading your courses...</span>
              </div>
            ) : (
              <div className="row g-4">
                {filteredCourses.length > 0 ? filteredCourses.map((course, i) => (
                  <div key={course.course_id || i} className="col-md-6">
                    <div 
                      className="card border-0 rounded-4 shadow-sm h-100 overflow-hidden course-card-refined"
                      style={{ transition: 'all 0.3s ease' }}
                    >
                      {/* Thumbnail Container */}
                      <div className="position-relative" style={{ height: '160px' }}>
                        <img 
                          src={course.thumbnail_url || `https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop`} 
                          alt={course.title} 
                          className="w-100 h-100 object-fit-cover"
                        />
                        <div className="position-absolute top-0 end-0 m-2">
                          <button 
                            className={`btn btn-sm rounded-pill px-3 py-2 shadow-sm border-0 ${
                              course.status === 'published' ? 'bg-success text-white' : 'bg-warning text-dark'
                            }`} 
                            style={{ fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase' }}
                            onClick={(e) => { e.stopPropagation(); handleStatusToggle(course.course_id, course.status); }}
                            title={course.status === 'published' ? "Click to set as Draft" : "Click to Publish"}
                          >
                            <i className={`fas ${course.status === 'published' ? 'fa-check-circle' : 'fa-pencil-alt'} me-1`}></i>
                            {course.status}
                          </button>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="card-body p-4 d-flex flex-column">
                        <div className="mb-2 d-flex justify-content-between align-items-center">
                          <span className="text-primary fw-bold" style={{ fontSize: '0.7rem', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                            {course.level || 'Beginner'}
                          </span>
                          <div className="text-warning small">
                            <i className="fas fa-star me-1"></i>
                            <span className="fw-bold">{course.avg_rating ? course.avg_rating : 'New'}</span>
                          </div>
                        </div>

                        <h6 className="card-title fw-bold text-dark mb-3 lh-base text-truncate-2" style={{ fontSize: '1rem', minHeight: '2.8rem' }}>
                          {course.title}
                        </h6>

                        {/* Meta Info */}
                        <div className="d-flex align-items-center gap-3 text-muted small mb-4 mt-auto">
                          <div className="d-flex align-items-center gap-1">
                            <i className="fas fa-book-open text-primary opacity-50"></i>
                            <span>{course.total_sections || 0} Sections</span>
                          </div>
                          <div className="d-flex align-items-center gap-1">
                            <i className="fas fa-clock text-primary opacity-50"></i>
                            <span>{course.total_lessons || 0} Lessons</span>
                          </div>
                        </div>

                        {/* Stats & Price */}
                        <div className="d-flex justify-content-between align-items-center mb-4">
                          <div className="d-flex align-items-center gap-2">
                            <div className="bg-light rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                              <i className="fas fa-users text-primary small"></i>
                            </div>
                            <span className="fw-bold text-dark small">{course.enrollments?.total || 0} Students</span>
                          </div>
                          <div className="h6 mb-0 fw-bold text-success">
                            {parseFloat(course.price) > 0 ? `$${parseFloat(course.price).toFixed(2)}` : 'Free'}
                          </div>
                        </div>

                        <button 
                          className="btn btn-primary w-100 rounded-pill fw-bold py-2 shadow-sm d-flex align-items-center justify-content-center gap-2"
                          onClick={() => handleCourseClick(course.course_id)}
                          style={{ fontSize: '0.85rem' }}
                        >
                          <i className="fas fa-edit"></i>
                          <span>Manage Course</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="col-12 text-center py-5 mt-4">
                    <div className="bg-white p-5 rounded-5 shadow-sm border max-width-600 mx-auto">
                      {searchQuery ? (
                        <>
                          <div className="empty-state-icon mb-4">
                            <i className="fas fa-search fa-4x text-primary opacity-25"></i>
                          </div>
                          <h3 className="fw-bold mb-3">No matches found</h3>
                          <p className="text-muted mb-4 px-lg-5">We couldn't find any courses matching "<strong>{searchQuery}</strong>". Try a different keyword.</p>
                          <button 
                            className="btn btn-outline-primary-custom rounded-pill px-5" 
                            onClick={() => setSearchQuery('')}
                          >
                            Clear Search
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="empty-state-icon mb-4">
                            <i className="fas fa-book-open fa-4x text-primary opacity-25"></i>
                          </div>
                          <h3 className="fw-bold mb-3">Your course list is empty</h3>
                          <p className="text-muted mb-4 px-lg-5">Ready to share your knowledge with the world? Start by creating your first educational journey today.</p>
                          <button 
                            className="btn btn-primary-custom btn-lg rounded-pill px-5 shadow-sm" 
                            onClick={() => navigate('/instructor/create-course')}
                          >
                            Launch Your First Course
                          </button>
                        </>
                      )}
                    </div>
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
