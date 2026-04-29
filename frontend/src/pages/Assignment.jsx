import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { assignmentService } from '../services';
import toast, { Toaster } from 'react-hot-toast';
import Sidebar from '../components/Sidebar';
import ProfileSidebar from '../components/ProfileSidebar';
import '../styles/Dashboard.css';

const Assignment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [assignmentData, setAssignmentData] = useState(null);
  const [fetching, setFetching] = useState(true);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        if (id) {
          const response = await assignmentService.getAssignment(id);
          setAssignmentData(response.data?.data || null);
        }
      } catch (error) {
        console.error("Failed to fetch assignment details", error);
      } finally {
        setFetching(false);
      }
    };
    fetchAssignment();
  }, [id]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current.click();
  };

  const handleSubmit = async () => {
    if (!file) {
      return toast.error("Please select a file to upload first.");
    }
    
    const uploadId = id || '1'; 
    setLoading(true);
    try {
      await assignmentService.uploadAssignment(uploadId, file);
      toast.success("Assignment submitted successfully!");
      setFile(null);
    } catch (error) {
      toast.error(error.response?.data?.message || "Error submitting assignment. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-page">
      <Toaster position="top-center" reverseOrder={false} />
      <div className="dashboard-layout">
        <Sidebar activePath="/dashboard/assignments" />

        <main className="main-dashboard-content w-100 p-4">
          <div className="container-fluid max-width-custom pt-5 mt-4 mx-auto">
            
            {/* Breadcrumb Area */}
            <div className="d-flex align-items-center gap-2 mb-4" style={{ color: '#555', fontSize: '14px' }}>
              <span style={{ cursor: 'pointer' }} onClick={() => navigate('/dashboard/assignments')}>Assignment</span>
              <i className="fas fa-angles-right" style={{ fontSize: '10px', color: '#31506a' }}></i>
              <span className="fw-bold" style={{ color: '#1a1d20' }}>{assignmentData?.title || 'Assignment Details'}</span>
            </div>

            <div className="bg-white p-5 rounded-4 shadow-sm border" style={{ maxWidth: '850px' }}>
              
              {/* Assignment Title */}
              <h2 className="fw-bold mb-4" style={{ color: '#1a1d20', fontSize: '26px' }}>{assignmentData?.title || 'Assignment'}</h2>

              {/* Meta Info */}
              <div className="d-flex gap-4 mb-5">
                <div className="d-flex align-items-center gap-2 text-muted" style={{ fontSize: '14px' }}>
                  <i className="far fa-calendar-alt"></i>
                  <span>{assignmentData?.dueDate ? new Date(assignmentData.dueDate).toLocaleDateString('en-GB') : 'No due date'}</span>
                </div>
                <div className="d-flex align-items-center gap-2 text-muted" style={{ fontSize: '14px' }}>
                  <i className="far fa-clock"></i>
                  <span>{assignmentData?.duration || 'Self-paced'}</span>
                </div>
              </div>

              {/* Upload Dropzone */}
              <div 
                className="upload-dropzone p-5 text-center rounded-4 mb-4" 
                onClick={handleBrowseClick}
                style={{ 
                  border: '2px dashed #e0e4ec', 
                  backgroundColor: '#f8fbff', 
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.borderColor = '#31506a'}
                onMouseOut={(e) => e.currentTarget.style.borderColor = '#e0e4ec'}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  style={{ display: 'none' }} 
                  accept=".pdf,.zip,.doc,.docx,.jpg,.png" 
                />
                
                <div 
                  className="mx-auto d-flex align-items-center justify-content-center mb-3" 
                  style={{ width: '64px', height: '64px', backgroundColor: '#fff', borderRadius: '50%', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                >
                  <i className="fas fa-cloud-upload-alt fa-2x" style={{ color: '#31506a' }}></i>
                </div>
                
                {file ? (
                  <div>
                    <p className="text-success fw-bold mb-1">Selected: {file.name}</p>
                    <p className="text-muted small">Click to change file</p>
                  </div>
                ) : (
                  <p className="mb-0" style={{ color: '#888', fontSize: '15px' }}>
                    Drag & drop files or <span className="text-primary text-decoration-underline fw-bold">Browse</span>
                  </p>
                )}
              </div>

              {/* Action Button */}
              <div className="text-center mt-5">
                <button 
                  className="btn px-5 py-2 text-white fw-bold" 
                  onClick={handleSubmit} 
                  disabled={loading}
                  style={{ 
                    backgroundColor: '#31506a', 
                    borderRadius: '10px', 
                    fontSize: '15px',
                    minWidth: '220px'
                  }}
                >
                  {loading ? (
                    <><span className="spinner-border spinner-border-sm me-2"></span>Submitting...</>
                  ) : "Submit Assignment"}
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

export default Assignment;
