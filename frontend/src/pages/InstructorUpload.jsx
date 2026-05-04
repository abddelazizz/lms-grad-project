import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ProfileSidebar from '../components/ProfileSidebar';
import toast, { Toaster } from 'react-hot-toast';
import { lessonService, instructorService, courseService } from '../services/apiService';
import '../styles/Dashboard.css';

const InstructorUpload = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  // Determine content type based on URL
  const path = location.pathname;
  let type = "Assignment";
  if (path.includes('video')) type = "Video";
  if (path.includes('pdf')) type = "PDF";

  const [title, setTitle] = useState('');
  const [courses, setCourses] = useState([]);
  const [sections, setSections] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [date] = useState(new Date().toLocaleDateString('en-GB'));
  const [time] = useState(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setFetchingData(true);
        const res = await instructorService.getStats();
        setCourses(res.data?.data?.courses || []);
      } catch (err) {
        toast.error("Failed to load courses");
      } finally {
        setFetchingData(false);
      }
    };
    fetchCourses();
  }, []);

  const handleCourseChange = async (e) => {
    const courseId = e.target.value;
    setSelectedCourseId(courseId);
    setSelectedSectionId('');
    setSections([]);

    if (courseId) {
      try {
        setFetchingData(true);
        const res = await courseService.getCourseDetails(courseId);
        setSections(res.data?.data?.course?.sections || []);
      } catch (err) {
        toast.error("Failed to load sections");
      } finally {
        setFetchingData(false);
      }
    }
  };

  const handleBrowseClick = () => fileInputRef.current.click();

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!title || !file || !selectedSectionId) {
      return toast.error("Please provide a title, select a course/section, and select a file.");
    }
    
    let contentType = "video";
    if (type === "PDF") contentType = "pdf_lecture";
    if (type === "Assignment") contentType = "pdf_assignment";

    const formData = new FormData();
    formData.append("title", title);
    formData.append("content_type", contentType);
    formData.append("is_free_preview", "false");
    formData.append("lesson_file", file);

    setLoading(true);
    
    try {
      await lessonService.createLesson(selectedSectionId, formData);
      toast.success(`${type} uploaded successfully!`);
      setFile(null);
      setTitle('');
      setSelectedCourseId('');
      setSelectedSectionId('');
      setSections([]);
    } catch (error) {
      console.error("Upload failed", error);
      toast.error(error.response?.data?.message || "Failed to upload file.");
    } finally {
      setLoading(false);
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
              <span>Instructor Upload</span>
              <span className="text-primary-custom fw-bold" style={{ fontSize: '20px' }}>»</span>
              <span className="text-muted">{type}</span>
            </div>

            <div className="bg-white p-5 rounded-4 shadow-sm border mx-auto" style={{ maxWidth: '850px' }}>
              <h2 className="fw-bold mb-4" style={{ color: '#1a1d20', fontSize: '28px' }}>{type}</h2>

              <div className="vstack gap-4 mb-4">
                <div className="form-group" style={{ maxWidth: '300px' }}>
                   <input 
                    type="text" 
                    className="form-control border bg-light-gray p-2 rounded-2" 
                    placeholder="Enter Title"
                    style={{ fontSize: '13px' }}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="small fw-bold text-muted mb-2">SELECT COURSE</label>
                    <select 
                      className="form-select border bg-light-gray p-3 rounded-3" 
                      value={selectedCourseId}
                      onChange={handleCourseChange}
                      disabled={fetchingData}
                    >
                      <option value="">-- Choose Course --</option>
                      {courses.map(c => <option key={c.course_id} value={c.course_id}>{c.title}</option>)}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="small fw-bold text-muted mb-2">SELECT SECTION</label>
                    <select 
                      className="form-select border bg-light-gray p-3 rounded-3" 
                      value={selectedSectionId}
                      onChange={(e) => setSelectedSectionId(e.target.value)}
                      disabled={!selectedCourseId || fetchingData}
                    >
                      <option value="">-- Choose Section --</option>
                      {sections.map(s => <option key={s.section_id} value={s.section_id}>{s.title}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="d-flex gap-5 mb-5 text-dark fw-bold" style={{ fontSize: '16px' }}>
                <div className="d-flex align-items-center gap-3">
                  <i className="far fa-calendar-alt text-dark"></i> <span>00 / 00 / 0000</span>
                </div>
                <div className="d-flex align-items-center gap-3">
                  <i className="far fa-clock text-dark"></i> <span>00 : 00</span>
                </div>
              </div>

              <div 
                className="upload-dropzone p-5 text-center rounded-4 mb-5" 
                onClick={handleBrowseClick}
                style={{ border: '2px dashed #9fb0c0', backgroundColor: '#f4f7fa', cursor: 'pointer', minHeight: '260px' }}
              >
                <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
                <div className="bg-white rounded-circle shadow-sm mx-auto d-flex align-items-center justify-content-center mb-4" style={{ width: '80px', height: '80px' }}>
                  <i className="fas fa-cloud-upload-alt fa-2x text-primary-custom"></i>
                </div>
                <p className="mb-0 fw-medium" style={{ color: '#555' }}>
                  {file ? file.name : (
                    <>Drag & drop files or <span className="text-primary-custom text-decoration-underline fw-bold">Browse</span></>
                  )}
                </p>
                {file && <div className="mt-2 text-success small fw-bold">Ready to upload: {(file.size / (1024 * 1024)).toFixed(2)} MB</div>}
              </div>

              <div className="text-center">
                <button 
                  className="btn px-5 py-2 fw-bold rounded-2" 
                  onClick={handleUpload} 
                  disabled={loading || fetchingData}
                  style={{ minWidth: '220px', backgroundColor: '#31506a', color: 'white' }}
                >
                  {loading ? (
                    <><span className="spinner-border spinner-border-sm me-2"></span> Uploading...</>
                  ) : `Upload ${type}`}
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

export default InstructorUpload;
