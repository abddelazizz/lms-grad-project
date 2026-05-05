import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ProfileSidebar from '../components/ProfileSidebar';
import { instructorService, sectionService, lessonService, courseService } from '../services/apiService';
import toast, { Toaster } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import CustomDropdown from '../components/CustomDropdown';
import '../styles/Dashboard.css';

const UnifiedUpload = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryParams = new URLSearchParams(location.search);
  const initialCourseId = queryParams.get('courseId');

  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(initialCourseId || '');
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState('');
  const [uploadQueue, setUploadQueue] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(!initialCourseId);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await courseService.getMyCourses();
        setCourses(res.data?.data?.courses || res.data?.courses || []);
      } catch (err) {
        console.error("Failed to fetch courses", err);
        toast.error("Failed to load courses");
      } finally {
        setLoadingCourses(false);
      }
    };
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      const fetchSections = async () => {
        try {
          const res = await instructorService.getCourseDetails(selectedCourse);
          setSections(res.data?.data?.course?.sections || []);
        } catch (err) {
          toast.error("Failed to load sections");
        }
      };
      fetchSections();
    } else {
      setSections([]);
    }
  }, [selectedCourse]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const newItems = files.map(file => {
      let type = 'video';
      if (file.type.includes('pdf')) type = 'pdf';
      else if (file.type.includes('image') || file.type.includes('zip')) type = 'assignment';
      
      return {
        id: Math.random().toString(36).substr(2, 9),
        file,
        title: file.name.split('.')[0],
        type,
        status: 'pending',
        progress: 0
      };
    });
    setUploadQueue([...uploadQueue, ...newItems]);
  };

  const removeQueuedItem = (id) => {
    setUploadQueue(uploadQueue.filter(item => item.id !== id));
  };

  const updateItem = (id, field, value) => {
    setUploadQueue(uploadQueue.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleBulkUpload = async () => {
    if (!selectedSection) return toast.error("Please select a section first");
    if (uploadQueue.length === 0) return toast.error("No files to upload");

    setIsUploading(true);
    let successCount = 0;

    for (let i = 0; i < uploadQueue.length; i++) {
      const item = uploadQueue[i];
      if (item.status === 'completed') continue; // Skip already uploaded items

      updateItem(item.id, 'status', 'uploading');
      
      try {
        const formData = new FormData();
        formData.append('title', item.title);
        formData.append('content_type', item.type === 'video' ? 'video' : (item.type === 'pdf' ? 'pdf_lecture' : 'pdf_assignment'));
        formData.append('is_free_preview', item.isFreePreview ? 'true' : 'false');
        if (item.parentId) formData.append('parent_content_id', item.parentId);
        
        formData.append('lesson_file', item.file);

        await lessonService.createLesson(selectedSection, formData);
        updateItem(item.id, 'status', 'completed');
        updateItem(item.id, 'progress', 100);
        successCount++;
      } catch (err) {
        updateItem(item.id, 'status', 'error');
        toast.error(`Failed to upload ${item.title}`);
      }
    }

    setIsUploading(false);
    if (successCount > 0) {
      toast.success(`${successCount} files uploaded successfully!`);
    }
  };

  // Helper to get available parent videos for a section
  const parentVideos = sections.find(s => s.section_id === Number(selectedSection))?.lessons?.filter(l => l.content_type === 'video') || [];

  return (
    <div className="dashboard-page bg-light-gray" style={{ minHeight: '100vh' }}>
      <Toaster 
        position="top-center" 
        containerStyle={{ zIndex: 100000 }} 
        toastOptions={{
          style: {
            zIndex: 100001,
          },
        }}
      />
      <div className="dashboard-layout">
        <Sidebar />
        
        <main className="main-dashboard-content w-100 p-4">
          <div className="container-fluid py-4" style={{ maxWidth: '1100px' }}>
            <div className="d-flex align-items-center justify-content-between mb-5 bg-white p-4 rounded-4 shadow-sm border-bottom border-3 border-primary-custom">
              <div>
                <h2 className="fw-bold text-dark mb-1" style={{ letterSpacing: '-0.5px' }}>Unified Content Studio</h2>
                <p className="text-muted small mb-0">The all-in-one hub for your course content management.</p>
              </div>
              <div className="d-flex gap-3">
                <button 
                  className="btn btn-outline-secondary rounded-pill px-4"
                  onClick={() => navigate(-1)}
                  disabled={isUploading}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-primary-custom px-4 py-2 rounded-pill fw-bold shadow"
                  onClick={handleBulkUpload}
                  disabled={isUploading || uploadQueue.length === 0}
                >
                  {isUploading ? (
                    <><span className="spinner-border spinner-border-sm me-2"></span>Processing...</>
                  ) : (
                    <><i className="fas fa-rocket me-2"></i>Launch Uploads</>
                  )}
                </button>
              </div>
            </div>

            <div className="row g-4">
              {/* Configuration Panel */}
              <div className="col-lg-4">
                <div className="card border-0 shadow-sm rounded-4 p-4 sticky-top" style={{ top: '100px', zIndex: 10 }}>
                  <div className="d-flex align-items-center gap-2 mb-4">
                    <div className="bg-primary-custom bg-opacity-10 p-2 rounded-3 text-primary-custom">
                      <i className="fas fa-cog"></i>
                    </div>
                    <h6 className="fw-bold mb-0">Global Context</h6>
                  </div>
                  
                  <div className="mb-4">
                    <CustomDropdown
                      label="Target Course"
                      placeholder="Select a course..."
                      options={courses.map(c => ({ value: c.course_id, label: c.title }))}
                      value={selectedCourse}
                      onChange={(e) => setSelectedCourse(e.target.value)}
                      disabled={isUploading}
                      icon="fas fa-graduation-cap"
                    />
                  </div>

                  <div className="mb-4">
                    <CustomDropdown
                      label="Target Section"
                      placeholder="Select a section..."
                      options={sections.map(s => ({ value: s.section_id, label: s.title }))}
                      value={selectedSection}
                      onChange={(e) => setSelectedSection(e.target.value)}
                      disabled={!selectedCourse || isUploading}
                      icon="fas fa-list-ul"
                    />
                    {!selectedCourse && <div className="mt-3 text-primary-custom x-small d-flex align-items-center gap-2 fw-bold bg-primary-custom bg-opacity-10 p-2 rounded-2">
                      <i className="fas fa-info-circle"></i>
                      <span>Pick a course to see its sections</span>
                    </div>}
                  </div>

                  <div className="upload-drop-zone border-2 border-dashed rounded-4 p-5 text-center transition-all bg-white hover-bg-light" 
                       style={{ cursor: 'pointer', borderColor: '#cbd5e1' }}
                       onClick={() => document.getElementById('fileInput').click()}>
                    <div className="bg-primary-custom bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style={{ width: '60px', height: '60px' }}>
                      <i className="fas fa-cloud-upload-alt text-primary-custom fa-lg"></i>
                    </div>
                    <h6 className="fw-bold text-dark">Drop Files Here</h6>
                    <p className="small text-muted mb-0">or click to browse your computer</p>
                    <input 
                      type="file" 
                      id="fileInput" 
                      multiple 
                      className="d-none" 
                      onChange={handleFileChange}
                      disabled={isUploading}
                    />
                  </div>
                </div>
              </div>

              {/* Queue Panel */}
              <div className="col-lg-8">
                <div className="card border-0 shadow-sm rounded-4 p-0 overflow-hidden">
                  <div className="p-4 border-bottom bg-white d-flex align-items-center justify-content-between">
                    <div>
                      <h6 className="fw-bold mb-0">Asset Queue</h6>
                      <span className="text-muted small">{uploadQueue.length} items ready to process</span>
                    </div>
                    {uploadQueue.length > 0 && !isUploading && (
                      <button className="btn btn-sm btn-link text-danger text-decoration-none fw-bold p-0" onClick={() => setUploadQueue([])}>
                        Discard All
                      </button>
                    )}
                  </div>
                  
                  <div className="p-0">
                    {uploadQueue.length === 0 ? (
                      <div className="p-5 text-center py-5 vstack align-items-center justify-content-center" style={{ minHeight: '400px' }}>
                        <div className="bg-light rounded-circle p-4 mb-4">
                          <i className="fas fa-folder-open text-muted fa-3x"></i>
                        </div>
                        <h5 className="fw-bold text-dark">Queue is empty</h5>
                        <p className="text-muted small mx-auto" style={{ maxWidth: '300px' }}>Add videos, documents or assignments to start building your course curriculum.</p>
                      </div>
                    ) : (
                      <div className="vstack">
                        {uploadQueue.map((item) => (
                          <div key={item.id} className={`p-4 border-bottom transition-all ${item.status === 'uploading' ? 'bg-primary-custom bg-opacity-5' : 'bg-white'}`}>
                            <div className="row g-3">
                              {/* File Icon/Type */}
                              <div className="col-auto">
                                <div className={`rounded-4 d-flex align-items-center justify-content-center shadow-sm ${
                                  item.type === 'video' ? 'bg-primary-custom text-white' : 
                                  item.type === 'pdf' ? 'bg-danger text-white' : 
                                  'bg-success text-white'
                                }`} style={{ width: '54px', height: '54px', fontSize: '1.2rem' }}>
                                  <i className={`fas ${
                                    item.type === 'video' ? 'fa-video' : 
                                    item.type === 'pdf' ? 'fa-file-pdf' : 
                                    'fa-tasks'
                                  }`}></i>
                                </div>
                              </div>
                              
                              {/* Content Info */}
                              <div className="col">
                                <div className="d-flex align-items-start justify-content-between mb-2">
                                  <div className="flex-grow-1 me-3">
                                    <div className="input-group input-group-lg mb-2 shadow-sm rounded-3 overflow-hidden border">
                                      <span className="input-group-text bg-white border-0 text-muted">
                                        <i className="fas fa-pencil-alt small"></i>
                                      </span>
                                      <input 
                                        type="text" 
                                        className="form-control border-0 bg-white fw-bold text-dark" 
                                        placeholder="Enter lesson title..."
                                        style={{ fontSize: '1.1rem' }}
                                        value={item.title} 
                                        onChange={(e) => updateItem(item.id, 'title', e.target.value)}
                                        disabled={isUploading}
                                      />
                                    </div>
                                    <div className="d-flex align-items-center gap-3 px-1">
                                      <span className="text-muted x-small">{(item.file.size / (1024 * 1024)).toFixed(2)} MB</span>
                                      <span className="text-muted x-small">•</span>
                                      <CustomDropdown
                                        placeholder="Select Type"
                                        options={[
                                          { value: 'video', label: 'Video Lesson', icon: 'fa-video' },
                                          { value: 'pdf', label: 'PDF Document', icon: 'fa-file-pdf' },
                                          { value: 'assignment', label: 'Assignment', icon: 'fa-tasks' },
                                        ]}
                                        value={item.type}
                                        onChange={(e) => updateItem(item.id, 'type', e.target.value)}
                                        disabled={isUploading}
                                      />
                                    </div>
                                  </div>
                                  
                                  {/* Item Status/Actions */}
                                  <div className="col-auto">
                                    {item.status === 'completed' ? (
                                      <div className="d-flex flex-column align-items-center">
                                        <div className="bg-success text-white rounded-circle d-flex align-items-center justify-content-center shadow-sm mb-1" style={{ width: '32px', height: '32px' }}>
                                          <i className="fas fa-check"></i>
                                        </div>
                                        <span className="text-success fw-bold x-small">Done</span>
                                      </div>
                                    ) : item.status === 'error' ? (
                                      <div className="d-flex flex-column align-items-center">
                                        <div className="bg-danger text-white rounded-circle d-flex align-items-center justify-content-center shadow-sm mb-1" style={{ width: '32px', height: '32px' }}>
                                          <i className="fas fa-exclamation"></i>
                                        </div>
                                        <span className="text-danger fw-bold x-small">Failed</span>
                                      </div>
                                    ) : item.status === 'uploading' ? (
                                      <div className="vstack align-items-center">
                                        <div className="spinner-border spinner-border-sm text-primary-custom mb-1"></div>
                                        <span className="text-primary-custom fw-bold x-small">Uploading</span>
                                      </div>
                                    ) : (
                                      <button className="btn btn-light btn-sm rounded-pill text-danger px-3 fw-bold shadow-sm" onClick={() => removeQueuedItem(item.id)} disabled={isUploading}>
                                        <i className="fas fa-trash-alt me-1"></i>
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* Advanced Options */}
                                {!isUploading && item.status === 'pending' && (
                                  <div className="row g-3 mt-1 bg-light rounded-3 p-3">
                                    <div className="col-md-6">
                                      <div className="form-check form-switch">
                                        <input 
                                          className="form-check-input" 
                                          type="checkbox" 
                                          id={`preview-${item.id}`} 
                                          checked={item.isFreePreview || false}
                                          onChange={(e) => updateItem(item.id, 'isFreePreview', e.target.checked)}
                                        />
                                        <label className="form-check-label small fw-bold text-muted" htmlFor={`preview-${item.id}`}>Free Preview</label>
                                      </div>
                                    </div>
                                    {item.type !== 'video' && parentVideos.length > 0 && (
                                      <div className="col-md-12">
                                        <label className="x-small fw-bold text-muted text-uppercase mb-1" style={{ fontSize: '9px' }}>Attach to Video Lesson (Optional)</label>
                                        <CustomDropdown
                                          placeholder="Standalone Content"
                                          options={[
                                            { value: '', label: 'Standalone Content' },
                                            ...parentVideos.map(v => ({ value: v.content_id, label: v.title }))
                                          ]}
                                          value={item.parentId || ''}
                                          onChange={(e) => updateItem(item.id, 'parentId', e.target.value)}
                                        />
                                      </div>
                                    )}
                                  </div>
                                )}

                                {item.status === 'uploading' && (
                                  <div className="mt-3">
                                    <div className="progress" style={{ height: '6px', borderRadius: '10px' }}>
                                      <div className="progress-bar progress-bar-striped progress-bar-animated bg-primary-custom" style={{ width: '100%' }}></div>
                                    </div>
                                    <span className="x-small text-muted mt-2 d-block">Sending to secure cloud storage...</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        <ProfileSidebar />
      </div>
    </div>
  );
};

export default UnifiedUpload;
