import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ProfileSidebar from '../components/ProfileSidebar';
import toast, { Toaster } from 'react-hot-toast';
import { courseService } from '../services';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Dashboard.css';

const CourseBuilder = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [courseTitle, setCourseTitle] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateCourse = async () => {
    if (!courseTitle || courseTitle.length < 5) {
      return toast.error("Course title must be at least 5 characters long.");
    }
    setLoading(true);
    try {
      console.log("Creating course with explicit IDs:", { title: courseTitle, id: user?.user_id });
      await courseService.createCourse({ 
        title: courseTitle,
        category_id: 1,
        instructor_id: user?.user_id,
        user_id: user?.user_id
      });
      toast.success("Course created successfully!");
      setCourseTitle('');
      // Navigate to My Courses or Dashboard
      navigate('/instructor/my-courses');
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to create course.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-page">
      <Toaster position="top-center" />
      <div className="dashboard-layout">
        <Sidebar activePath="/instructor/create-course" />

        <main className="main-dashboard-content w-100 p-4">
          <div className="container-fluid max-width-custom pt-5 mt-4 mx-auto">
            
            <div className="d-flex align-items-center gap-3 mb-5" style={{ color: '#000', fontSize: '16px', fontWeight: '500' }}>
              <span>Create Course</span>
              <span className="text-primary-custom fw-bold" style={{ fontSize: '20px' }}>»</span>
            </div>

            <div className="bg-white p-5 rounded-4 shadow-sm border mx-auto" style={{ maxWidth: '850px' }}>
              <h2 className="fw-bold mb-4" style={{ color: '#1a1d20', fontSize: '32px' }}>Course Name</h2>
              
              <div className="vstack gap-4 mb-5">
                <div className="form-group" style={{ maxWidth: '600px' }}>
                  <input 
                    type="text" 
                    className="form-control border bg-light-gray p-4 rounded-3 text-center" 
                    placeholder="Enter Course Name" 
                    style={{ fontSize: '18px' }}
                    value={courseTitle} 
                    onChange={(e) => setCourseTitle(e.target.value)} 
                  />
                </div>
              </div>

              <div className="text-center mt-4">
                <button 
                  className="btn px-5 py-3 fw-bold rounded-2 shadow" 
                  onClick={handleCreateCourse} 
                  disabled={loading} 
                  style={{ minWidth: '300px', backgroundColor: '#31506a', color: 'white' }}
                >
                  {loading ? 'Processing...' : 'Create Course'}
                </button>
              </div>
            </div>
          </div>
        </main>
        <ProfileSidebar />
      </div>
    </div>
  );
};

export default CourseBuilder;
