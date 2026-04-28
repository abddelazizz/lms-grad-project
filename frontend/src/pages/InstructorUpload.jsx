import React, { useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ProfileSidebar from '../components/ProfileSidebar';
import toast, { Toaster } from 'react-hot-toast';
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
  const [date, setDate] = useState('00 / 00 / 0000');
  const [time, setTime] = useState('00 : 00');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleBrowseClick = () => fileInputRef.current.click();

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!title || !file) {
      return toast.error("Please provide a title and select a file.");
    }
    setLoading(true);
    // Simulation of upload API call
    setTimeout(() => {
      toast.success(`${type} uploaded and published successfully!`);
      setLoading(false);
      setFile(null);
      setTitle('');
    }, 1500);
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
              <span>{type === 'Quiz' ? 'Generate Quiz' : `Upload ${type}`}</span>
              <span className="text-primary-custom fw-bold" style={{ fontSize: '20px' }}>»</span>
              {type === 'Quiz' && title && <span className="text-muted fw-normal" style={{ fontSize: '14px' }}>{title}</span>}
            </div>

            <div className="bg-white p-5 rounded-4 shadow-sm border mx-auto" style={{ maxWidth: '850px' }}>
              
              {/* Type Title */}
              <h2 className="fw-bold mb-5" style={{ color: '#1a1d20', fontSize: '32px' }}>{type}</h2>

              {/* Conditional Rendering: Quiz Detail View (State 2) vs Form View (State 1) */}
              {type === 'Quiz' && title ? (
                /* QUIZ SUMMARY VIEW (State 2) */
                <div className="quiz-summary-view">
                   <h3 className="fw-bold mb-4" style={{ fontSize: '24px' }}>UI UX Quiz One</h3>
                   
                   <div className="d-flex gap-4 mb-5 text-muted" style={{ fontSize: '14px' }}>
                      <div className="d-flex align-items-center gap-2">
                        <i className="far fa-calendar-alt"></i> <span>00 / 00 / 0000</span>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <i className="far fa-clock"></i> <span>00 : 00</span>
                      </div>
                   </div>

                   <div className="vstack gap-3 mb-5">
                      {[
                        { label: 'Duration', value: '10 minutes' },
                        { label: 'Number of questions', value: '15' },
                        { label: 'Score per question', value: '1' },
                        { label: 'Description', value: 'Quiz on UI UX Design' },
                      ].map((item, i) => (
                        <div key={i} className="row g-0 rounded-3 overflow-hidden border">
                           <div className="col-4 p-3 fw-bold" style={{ backgroundColor: '#7793a8', color: '#fff', fontSize: '14px' }}>{item.label}</div>
                           <div className="col-8 p-3 bg-white text-dark" style={{ fontSize: '14px' }}>{item.value}</div>
                        </div>
                      ))}
                   </div>

                   <div className="text-center">
                      <button className="btn btn-primary-custom px-5 py-3 fw-bold rounded-3" style={{ minWidth: '300px' }}>Upload Quiz</button>
                   </div>
                </div>
              ) : (
                /* FORM VIEW: Video / PDF / Assignment / Quiz Input (State 1) */
                <>
                  <div className="vstack gap-4 mb-5">
                    <input 
                      type="text" 
                      className="form-control border bg-light-gray p-3 rounded-3" 
                      placeholder="Enter Title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                    {type === 'Quiz' && (
                      <>
                        <input type="text" className="form-control border bg-light-gray p-3 rounded-3" placeholder="Enter Duration" />
                        <input type="text" className="form-control border bg-light-gray p-3 rounded-3" placeholder="Enter question Number" />
                        <input type="text" className="form-control border bg-light-gray p-3 rounded-3" placeholder="Enter score per question" />
                      </>
                    )}
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
                      Drag & drop files or <span className="text-primary-custom text-decoration-underline fw-bold">Browse</span>
                    </p>
                  </div>

                  <div className="text-center">
                    <button 
                      className="btn btn-primary-custom px-5 py-3 fw-bold rounded-3" 
                      onClick={handleUpload} 
                      disabled={loading}
                      style={{ minWidth: '300px' }}
                    >
                      {loading ? 'Uploading...' : (type === 'Quiz' ? 'Generate Quiz with AI' : `Upload ${type}`)}
                    </button>
                  </div>
                </>
              )}

            </div>
          </div>
        </main>

        <ProfileSidebar />
      </div>
    </div>
  );
};

export default InstructorUpload;
