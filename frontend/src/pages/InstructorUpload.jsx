import React, { useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ProfileSidebar from '../components/ProfileSidebar';
import toast, { Toaster } from 'react-hot-toast';
import { lessonService } from '../services';
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
  const [sectionId, setSectionId] = useState('');
  const [date] = useState(new Date().toLocaleDateString('en-GB'));
  const [time] = useState(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleBrowseClick = () => fileInputRef.current.click();

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!title || !file || !sectionId) {
      return toast.error("Please provide a title, a Section ID, and select a file.");
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
      await lessonService.createLesson(sectionId, formData);
      toast.success(`${type} uploaded successfully!`);
      setFile(null);
      setTitle('');
      setSectionId('');
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
            
            {/* Breadcrumb Area - Refined matching screenshots */}
            <div className="d-flex align-items-center gap-3 mb-5" style={{ color: '#000', fontSize: '16px', fontWeight: '500' }}>
              <span>Upload {type}</span>
              <span className="text-primary-custom fw-bold" style={{ fontSize: '20px' }}>»</span>
            </div>

            <div className="bg-white p-5 rounded-4 shadow-sm border mx-auto" style={{ maxWidth: '850px' }}>
              
              {/* Type Title */}
              <h2 className="fw-bold mb-5" style={{ color: '#1a1d20', fontSize: '32px' }}>{type}</h2>

              {/* FORM VIEW: Video / PDF / Assignment */}
              <div className="vstack gap-4 mb-5">
                <input 
                  type="text" 
                  className="form-control border bg-light-gray p-3 rounded-3" 
                  placeholder="Enter Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <input 
                  type="text" 
                  className="form-control border bg-light-gray p-3 rounded-3" 
                  placeholder="Enter Section ID (Required)"
                  value={sectionId}
                  onChange={(e) => setSectionId(e.target.value)}
                />
              </div>

              <div className="d-flex gap-4 mb-5 text-muted" style={{ fontSize: '14px' }}>
                <div className="d-flex align-items-center gap-2">
                  <i className="far fa-calendar-alt"></i> <span>{date}</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <i className="far fa-clock"></i> <span>{time}</span>
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
              </div>

              <div className="text-center">
                <button 
                  className="btn btn-primary-custom px-5 py-3 fw-bold rounded-3" 
                  onClick={handleUpload} 
                  disabled={loading}
                  style={{ minWidth: '300px' }}
                >
                  {loading ? 'Uploading...' : `Upload ${type}`}
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
