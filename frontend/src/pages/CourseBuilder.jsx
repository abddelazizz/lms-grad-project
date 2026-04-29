import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import ProfileSidebar from '../components/ProfileSidebar';
import toast, { Toaster } from 'react-hot-toast';
import { courseService, sectionService } from '../services';
import '../styles/Dashboard.css';

const CourseBuilder = () => {
  const [courseTitle, setCourseTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [createdCourseId, setCreatedCourseId] = useState(null);
  const [loading, setLoading] = useState(false);

  const [sectionTitle, setSectionTitle] = useState('');
  const [sections, setSections] = useState([]);
  const [sectionLoading, setSectionLoading] = useState(false);

  const handleCreateCourse = async () => {
    if (!courseTitle) {
      return toast.error("Course title is required.");
    }
    setLoading(true);
    try {
      const payload = { title: courseTitle };
      if (categoryId) payload.category_id = parseInt(categoryId);

      const res = await courseService.createCourse(payload);
      const newCourse = res.data?.data?.course || res.data?.course;
      setCreatedCourseId(newCourse?.id);
      toast.success("Course created successfully! Now you can add sections.");
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to create course.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddSection = async () => {
    if (!sectionTitle) {
      return toast.error("Section title is required.");
    }
    if (!createdCourseId) {
      return toast.error("Please create a course first.");
    }
    setSectionLoading(true);
    try {
      const res = await sectionService.createSection(createdCourseId, { title: sectionTitle });
      const newSection = res.data?.data?.section || res.data?.section || { id: Date.now(), title: sectionTitle };
      setSections([...sections, newSection]);
      setSectionTitle('');
      toast.success("Section added successfully!");
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to add section.");
    } finally {
      setSectionLoading(false);
    }
  };

  return (
    <div className="dashboard-page">
      <Toaster position="top-center" />
      <div className="dashboard-layout">
        <Sidebar />

        <main className="main-dashboard-content w-100 p-4">
          <div className="container-fluid max-width-custom pt-5 mt-4 mx-auto">
            
            <div className="d-flex align-items-center gap-3 mb-5" style={{ color: '#000', fontSize: '16px', fontWeight: '500' }}>
              <span>Course Builder</span>
              <span className="text-primary-custom fw-bold" style={{ fontSize: '20px' }}>»</span>
              {courseTitle && <span className="text-muted fw-normal" style={{ fontSize: '14px' }}>{courseTitle}</span>}
            </div>

            <div className="bg-white p-5 rounded-4 shadow-sm border mx-auto" style={{ maxWidth: '850px' }}>
              <h2 className="fw-bold mb-4" style={{ color: '#1a1d20', fontSize: '28px' }}>Build a New Course</h2>

              {!createdCourseId ? (
                <div className="vstack gap-4 mb-4">
                  <div>
                    <label className="form-label fw-bold">Course Title</label>
                    <input 
                      type="text" 
                      className="form-control border bg-light-gray p-3 rounded-3" 
                      placeholder="e.g. Advanced Web Design"
                      value={courseTitle}
                      onChange={(e) => setCourseTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label fw-bold">Category ID (Optional)</label>
                    <input 
                      type="number" 
                      className="form-control border bg-light-gray p-3 rounded-3" 
                      placeholder="e.g. 1"
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                    />
                  </div>
                  <div className="text-end">
                    <button 
                      className="btn btn-primary-custom px-5 py-3 fw-bold rounded-3" 
                      onClick={handleCreateCourse} 
                      disabled={loading}
                    >
                      {loading ? 'Creating...' : 'Create Course'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="course-sections-area mt-4 pt-4 border-top">
                  <h4 className="fw-bold mb-3 text-success">
                    <i className="fas fa-check-circle me-2"></i> 
                    Course Created! (ID: {createdCourseId})
                  </h4>
                  <p className="text-muted mb-4">You can now add sections to this course. Lessons can be uploaded to these sections via the Upload page.</p>

                  <div className="sections-list mb-4">
                    {sections.length > 0 && sections.map((sec, idx) => (
                      <div key={idx} className="p-3 mb-2 bg-light-gray rounded-3 border d-flex justify-content-between align-items-center">
                        <span className="fw-bold text-dark">{sec.title}</span>
                        <span className="badge bg-secondary">Section ID: {sec.id}</span>
                      </div>
                    ))}
                  </div>

                  <div className="d-flex gap-3">
                    <input 
                      type="text" 
                      className="form-control border bg-light p-3 rounded-3" 
                      placeholder="New Section Title"
                      value={sectionTitle}
                      onChange={(e) => setSectionTitle(e.target.value)}
                    />
                    <button 
                      className="btn btn-dark px-4 fw-bold rounded-3" 
                      onClick={handleAddSection}
                      disabled={sectionLoading}
                    >
                      {sectionLoading ? 'Adding...' : 'Add Section'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
        <ProfileSidebar />
      </div>
    </div>
  );
};

export default CourseBuilder;
