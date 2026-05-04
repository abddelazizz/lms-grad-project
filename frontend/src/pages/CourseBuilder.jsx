import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import ProfileSidebar from '../components/ProfileSidebar';
import toast, { Toaster } from 'react-hot-toast';
import { courseService, sectionService } from '../services';
import '../styles/Dashboard.css';

const CourseBuilder = () => {
  // Step 1: Basic Info
  const [courseTitle, setCourseTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [createdCourseId, setCreatedCourseId] = useState(null);
  const [loading, setLoading] = useState(false);

  // Step 2: Metadata & Thumbnail
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('0');
  const [level, setLevel] = useState('beginner');
  const [thumbnail, setThumbnail] = useState(null);
  const [metadataLoading, setMetadataLoading] = useState(false);

  // Step 3: Sections
  const [sectionTitle, setSectionTitle] = useState('');
  const [sections, setSections] = useState([]);
  const [sectionLoading, setSectionLoading] = useState(false);

  const [step, setStep] = useState(1); // 1: Basic, 2: Metadata, 3: Sections

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
      
      // Backend uses course_id
      const id = newCourse?.course_id || newCourse?.id;
      setCreatedCourseId(id);
      setStep(2);
      toast.success("Basic info saved! Now add more details.");
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to create course.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMetadata = async () => {
    setMetadataLoading(true);
    try {
      // Update text fields
      await courseService.updateCourse(createdCourseId, {
        description,
        price: parseFloat(price),
        level
      });

      // Upload thumbnail if exists
      if (thumbnail) {
        const formData = new FormData();
        formData.append('thumbnail', thumbnail);
        await courseService.uploadCourseThumbnail(createdCourseId, formData);
      }

      setStep(3);
      toast.success("Course details saved! Now add sections.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save course details.");
    } finally {
      setMetadataLoading(false);
    }
  };

  const handleAddSection = async () => {
    if (!sectionTitle) return toast.error("Section title is required.");
    setSectionLoading(true);
    try {
      const res = await sectionService.createSection(createdCourseId, { title: sectionTitle });
      const newSection = res.data?.data?.section || res.data?.section;
      setSections([...sections, newSection]);
      setSectionTitle('');
      toast.success("Section added!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to add section.");
    } finally {
      setSectionLoading(false);
    }
  };

  return (
    <div className="dashboard-page">
      <Toaster position="top-center" />
      <div className="dashboard-layout">
        <Sidebar activePath="/instructor/course-builder" />

        <main className="main-dashboard-content w-100 p-4">
          <div className="container-fluid max-width-custom pt-5 mt-4 mx-auto">
            
            {/* Stepper */}
            <div className="d-flex justify-content-between align-items-center mb-5 mx-auto" style={{ maxWidth: '600px' }}>
                <div className={`step-item ${step >= 1 ? 'text-primary-custom' : 'text-muted'}`}>
                    <div className={`rounded-circle d-flex align-items-center justify-content-center mb-2 mx-auto ${step >= 1 ? 'bg-primary-custom text-white' : 'bg-light border'}`} style={{ width: '40px', height: '40px' }}>1</div>
                    <small className="fw-bold">Basic</small>
                </div>
                <div className="flex-grow-1 border-bottom mx-3 mb-4"></div>
                <div className={`step-item ${step >= 2 ? 'text-primary-custom' : 'text-muted'}`}>
                    <div className={`rounded-circle d-flex align-items-center justify-content-center mb-2 mx-auto ${step >= 2 ? 'bg-primary-custom text-white' : 'bg-light border'}`} style={{ width: '40px', height: '40px' }}>2</div>
                    <small className="fw-bold">Details</small>
                </div>
                <div className="flex-grow-1 border-bottom mx-3 mb-4"></div>
                <div className={`step-item ${step >= 3 ? 'text-primary-custom' : 'text-muted'}`}>
                    <div className={`rounded-circle d-flex align-items-center justify-content-center mb-2 mx-auto ${step >= 3 ? 'bg-primary-custom text-white' : 'bg-light border'}`} style={{ width: '40px', height: '40px' }}>3</div>
                    <small className="fw-bold">Curriculum</small>
                </div>
            </div>

            <div className="bg-white p-5 rounded-4 shadow-sm border mx-auto" style={{ maxWidth: '850px' }}>
              
              {step === 1 && (
                <div className="vstack gap-4">
                  <h3 className="fw-bold mb-4">Course Basic Info</h3>
                  <div>
                    <label className="form-label small fw-bold text-secondary">COURSE TITLE</label>
                    <input type="text" className="form-control border bg-light-gray p-3 rounded-3" placeholder="e.g. Master Web Development" value={courseTitle} onChange={(e) => setCourseTitle(e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label small fw-bold text-secondary">CATEGORY ID</label>
                    <input type="number" className="form-control border bg-light-gray p-3 rounded-3" placeholder="e.g. 1" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} />
                  </div>
                  <div className="text-center mt-4">
                    <button className="btn btn-primary-custom px-5 py-3 fw-bold rounded-pill shadow" onClick={handleCreateCourse} disabled={loading} style={{ minWidth: '200px' }}>
                      {loading ? 'Processing...' : 'Next Step'}
                    </button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="vstack gap-4">
                  <h3 className="fw-bold mb-4">Course Details</h3>
                  <div>
                    <label className="form-label small fw-bold text-secondary">DESCRIPTION</label>
                    <textarea className="form-control border bg-light-gray p-3 rounded-3" rows="4" placeholder="Tell students what they will learn..." value={description} onChange={(e) => setDescription(e.target.value)} />
                  </div>
                  <div className="row g-4">
                    <div className="col-md-6">
                        <label className="form-label small fw-bold text-secondary">PRICE ($)</label>
                        <input type="number" className="form-control border bg-light-gray p-3 rounded-3" value={price} onChange={(e) => setPrice(e.target.value)} />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label small fw-bold text-secondary">LEVEL</label>
                        <select className="form-select border bg-light-gray p-3 rounded-3" value={level} onChange={(e) => setLevel(e.target.value)}>
                            <option value="beginner">Beginner</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="advanced">Advanced</option>
                        </select>
                    </div>
                  </div>
                  <div>
                    <label className="form-label small fw-bold text-secondary">THUMBNAIL IMAGE</label>
                    <input type="file" className="form-control border bg-light p-3 rounded-3" accept="image/*" onChange={(e) => setThumbnail(e.target.files[0])} />
                  </div>
                  <div className="text-center mt-4 hstack gap-3 justify-content-center">
                    <button className="btn btn-outline-secondary px-5 py-3 fw-bold rounded-pill" onClick={() => setStep(3)}>Skip to Sections</button>
                    <button className="btn btn-primary-custom px-5 py-3 fw-bold rounded-pill shadow" onClick={handleUpdateMetadata} disabled={metadataLoading} style={{ minWidth: '200px' }}>
                      {metadataLoading ? 'Saving...' : 'Save & Next'}
                    </button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="vstack gap-4">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h3 className="fw-bold mb-0">Course Curriculum</h3>
                    <button className="btn btn-dark rounded-pill px-4" onClick={() => navigate('/dashboard')}>Finish</button>
                  </div>
                  
                  <div className="sections-list mb-4">
                    {sections.map((sec, idx) => (
                      <div key={idx} className="p-4 mb-3 bg-light-gray rounded-4 border d-flex justify-content-between align-items-center shadow-sm">
                        <div>
                            <span className="text-muted small d-block">SECTION {idx + 1}</span>
                            <span className="fw-bold text-dark fs-5">{sec.title}</span>
                        </div>
                        <span className="badge bg-white text-dark border p-2">ID: {sec.section_id || sec.id}</span>
                      </div>
                    ))}
                  </div>

                  <div className="bg-light p-4 rounded-4 border border-dashed">
                    <label className="form-label small fw-bold text-secondary">ADD NEW SECTION</label>
                    <div className="d-flex gap-3">
                        <input type="text" className="form-control border bg-white p-3 rounded-3" placeholder="e.g. Introduction to HTML" value={sectionTitle} onChange={(e) => setSectionTitle(e.target.value)} />
                        <button className="btn btn-primary-custom px-4 fw-bold rounded-3" onClick={handleAddSection} disabled={sectionLoading}>
                           {sectionLoading ? '...' : <i className="fas fa-plus"></i>}
                        </button>
                    </div>
                  </div>
                  
                  <p className="text-muted small mt-4 text-center">
                    <i className="fas fa-info-circle me-2"></i>
                    After adding sections, go to the <b>Upload</b> page to add video lessons or PDFs to them.
                  </p>
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
