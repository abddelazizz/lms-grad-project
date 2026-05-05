import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ProfileSidebar from '../components/ProfileSidebar';
import toast, { Toaster } from 'react-hot-toast';
import { lessonService, instructorService, courseService } from '../services/apiService';
import CustomDropdown from '../components/CustomDropdown';
import '../styles/Dashboard.css';

const InstructorUpload = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Determine content type from URL
  const path = location.pathname;
  let type = "Assignment";
  if (path.includes('video')) type = "Video";
  if (path.includes('pdf')) type = "PDF";

  const isPdfType = type === "PDF" || type === "Assignment";

  const [title, setTitle] = useState('');
  const [courses, setCourses] = useState([]);
  const [sections, setSections] = useState([]);
  const [videoLessons, setVideoLessons] = useState([]); // video lessons in selected section
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [selectedLessonId, setSelectedLessonId] = useState(''); // parent video lesson
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setFetchingData(true);
        const res = await instructorService.getStats();
        const courseList = res.data?.data?.courses || [];
        setCourses(courseList);

        const params = new URLSearchParams(location.search);
        const courseParam = params.get('course');
        const sectionParam = params.get('section');

        if (courseParam) {
          setSelectedCourseId(courseParam);
          const sectionRes = await courseService.getCourseDetails(courseParam);
          const sectionList = sectionRes.data?.data?.course?.sections || [];
          setSections(sectionList);

          if (sectionParam) {
            setSelectedSectionId(sectionParam);
            // Load video lessons for this section
            if (isPdfType) {
              const section = sectionList.find(s => String(s.section_id) === String(sectionParam));
              const videos = (section?.lessons || []).filter(l => l.content_type === 'video');
              setVideoLessons(videos);
            }
          }
        }
      } catch (err) {
        toast.error("Failed to load courses");
      } finally {
        setFetchingData(false);
      }
    };
    fetchCourses();
  }, [location.search]);

  const handleCourseChange = async (e) => {
    const courseId = e.target.value;
    setSelectedCourseId(courseId);
    setSelectedSectionId('');
    setSelectedLessonId('');
    setSections([]);
    setVideoLessons([]);

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

  const handleSectionChange = (e) => {
    const sectionId = e.target.value;
    setSelectedSectionId(sectionId);
    setSelectedLessonId('');
    setVideoLessons([]);

    if (sectionId && isPdfType) {
      const section = sections.find(s => String(s.section_id) === String(sectionId));
      const videos = (section?.lessons || []).filter(l => l.content_type === 'video');
      setVideoLessons(videos);
    }
  };

  const handleBrowseClick = () => fileInputRef.current.click();
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!title || !file || !selectedSectionId) {
      return toast.error("Please fill all required fields and select a file.");
    }
    // For PDF/Assignment, lesson selection is required
    if (isPdfType && !selectedLessonId) {
      return toast.error("Please select the video lesson this resource belongs to.");
    }

    let contentType = "video";
    if (type === "PDF") contentType = "pdf_lecture";
    if (type === "Assignment") contentType = "pdf_assignment";

    const formData = new FormData();
    formData.append("title", title);
    formData.append("content_type", contentType);
    formData.append("is_free_preview", "false");
    formData.append("lesson_file", file);
    if (isPdfType && selectedLessonId) {
      formData.append("parent_content_id", selectedLessonId);
    }

    setLoading(true);
    try {
      await lessonService.createLesson(selectedSectionId, formData);
      toast.success(`${type} uploaded and linked to lesson successfully!`);
      setFile(null);
      setTitle('');
      setSelectedLessonId('');
      // Go back to course management
      if (selectedCourseId) {
        setTimeout(() => navigate(`/instructor/manage-course/${selectedCourseId}`), 1200);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to upload file.");
    } finally {
      setLoading(false);
    }
  };

  const typeConfig = {
    Video: { icon: 'fa-video', color: '#3b82f6', accept: 'video/*', hint: 'MP4, MOV, AVI up to 200MB' },
    PDF: { icon: 'fa-file-pdf', color: '#ef4444', accept: '.pdf', hint: 'PDF files only' },
    Assignment: { icon: 'fa-tasks', color: '#10b981', accept: '.pdf,.doc,.docx,.zip', hint: 'PDF, DOC, DOCX, or ZIP' },
  };
  const cfg = typeConfig[type];

  return (
    <div className="dashboard-page">
      <Toaster
        position="top-center"
        containerStyle={{ zIndex: 100000 }}
        toastOptions={{ style: { zIndex: 100001 } }}
      />
      <div className="dashboard-layout">
        <Sidebar />

        <main className="main-dashboard-content w-100 p-4">
          <div className="container-fluid max-width-custom pt-5 mt-4 mx-auto" style={{ maxWidth: '900px' }}>

            {/* Breadcrumb */}
            <div className="d-flex align-items-center gap-2 mb-5 text-muted" style={{ fontSize: '14px' }}>
              <span
                className="fw-bold text-dark"
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(selectedCourseId ? `/instructor/manage-course/${selectedCourseId}` : '/instructor/my-courses')}
              >
                {selectedCourseId ? 'Manage Course' : 'My Courses'}
              </span>
              <i className="fas fa-chevron-right small opacity-50"></i>
              <span>Upload {type}</span>
            </div>

            <div className="bg-white p-5 rounded-4 shadow-sm border">

              {/* Header */}
              <div className="d-flex align-items-center gap-3 mb-5">
                <div
                  className="rounded-3 d-flex align-items-center justify-content-center"
                  style={{ width: '52px', height: '52px', backgroundColor: cfg.color + '18' }}
                >
                  <i className={`fas ${cfg.icon} fa-lg`} style={{ color: cfg.color }}></i>
                </div>
                <div>
                  <h4 className="fw-bold mb-0">Upload {type}</h4>
                  <p className="text-muted small mb-0">
                    {type === 'Video' && 'Add a new video lesson to a section.'}
                    {type === 'PDF' && 'Attach a PDF resource to a specific video lesson.'}
                    {type === 'Assignment' && 'Attach an assignment to a specific video lesson.'}
                  </p>
                </div>
              </div>

              <div className="vstack gap-4">

                {/* Title */}
                <div>
                  <label className="form-label fw-bold small text-uppercase" style={{ letterSpacing: '0.5px' }}>Title *</label>
                  <input
                    type="text"
                    className="form-control rounded-3 py-2"
                    placeholder={`Enter ${type} title...`}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                {/* Course + Section Row */}
                <div className="row g-3">
                  <div className="col-md-6">
                    <CustomDropdown
                      label="SELECT COURSE"
                      placeholder="-- Choose Course --"
                      options={courses.map(c => ({ value: c.course_id, label: c.title }))}
                      value={selectedCourseId}
                      onChange={handleCourseChange}
                      disabled={fetchingData}
                      icon="fas fa-graduation-cap"
                    />
                  </div>
                  <div className="col-md-6">
                    <CustomDropdown
                      label="SELECT SECTION"
                      placeholder="-- Choose Section --"
                      options={sections.map(s => ({ value: s.section_id, label: s.title }))}
                      value={selectedSectionId}
                      onChange={handleSectionChange}
                      disabled={!selectedCourseId || fetchingData}
                      icon="fas fa-folder-open"
                    />
                  </div>
                </div>

                {/* Lesson Selector — only for PDF/Assignment */}
                {isPdfType && selectedSectionId && (
                  <div>
                    <label className="form-label fw-bold small text-uppercase" style={{ letterSpacing: '0.5px' }}>
                      <i className="fas fa-link me-2" style={{ color: cfg.color }}></i>
                      Link to Video Lesson *
                    </label>
                    <p className="text-muted small mb-2">
                      Select the video lesson this {type === 'PDF' ? 'resource' : 'assignment'} belongs to.
                      It will appear in the player when students watch that lesson.
                    </p>

                    {videoLessons.length === 0 ? (
                      <div className="alert d-flex align-items-center gap-2 rounded-3" style={{ backgroundColor: '#fef9c3', border: '1px solid #fde68a', color: '#92400e' }}>
                        <i className="fas fa-triangle-exclamation"></i>
                        <span className="small fw-semibold">
                          No video lessons in this section yet. Upload a video lesson first.
                        </span>
                      </div>
                    ) : (
                      <div className="vstack gap-2">
                        {videoLessons.map((lesson) => (
                          <label
                            key={lesson.content_id}
                            className={`d-flex align-items-center gap-3 p-3 rounded-3 border cursor-pointer ${String(selectedLessonId) === String(lesson.content_id) ? 'border-primary bg-primary bg-opacity-5' : 'bg-light border-transparent'}`}
                            style={{ cursor: 'pointer', transition: 'all 0.15s' }}
                          >
                            <input
                              type="radio"
                              name="lessonSelect"
                              value={lesson.content_id}
                              checked={String(selectedLessonId) === String(lesson.content_id)}
                              onChange={() => setSelectedLessonId(lesson.content_id)}
                              className="form-check-input m-0 flex-shrink-0"
                              style={{ width: '18px', height: '18px' }}
                            />
                            <div
                              className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                              style={{ width: '36px', height: '36px', backgroundColor: '#3b82f620' }}
                            >
                              <i className="fas fa-play-circle" style={{ color: '#3b82f6', fontSize: '14px' }}></i>
                            </div>
                            <div className="flex-grow-1">
                              <span className="fw-semibold text-dark" style={{ fontSize: '14px' }}>{lesson.title}</span>
                              {lesson.duration > 0 && (
                                <span className="text-muted small ms-2">
                                  ({Math.floor(lesson.duration / 60)}m {lesson.duration % 60 > 0 ? `${lesson.duration % 60}s` : ''})
                                </span>
                              )}
                            </div>
                            {String(selectedLessonId) === String(lesson.content_id) && (
                              <i className="fas fa-check-circle text-primary flex-shrink-0"></i>
                            )}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Dropzone */}
                <div>
                  <label className="form-label fw-bold small text-uppercase" style={{ letterSpacing: '0.5px' }}>File *</label>
                  <div
                    className="text-center rounded-4 p-5"
                    onClick={handleBrowseClick}
                    style={{
                      border: `2px dashed ${file ? cfg.color : '#cbd5e1'}`,
                      backgroundColor: file ? cfg.color + '08' : '#f8fafc',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      minHeight: '200px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.75rem',
                    }}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept={cfg.accept}
                      style={{ display: 'none' }}
                    />
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center"
                      style={{ width: '64px', height: '64px', backgroundColor: cfg.color + '15' }}
                    >
                      <i className={`fas ${cfg.icon} fa-xl`} style={{ color: cfg.color }}></i>
                    </div>

                    {file ? (
                      <>
                        <p className="fw-bold mb-0 text-dark">{file.name}</p>
                        <span className="badge rounded-pill" style={{ backgroundColor: cfg.color + '20', color: cfg.color, fontWeight: 700 }}>
                          {(file.size / (1024 * 1024)).toFixed(2)} MB — Ready
                        </span>
                      </>
                    ) : (
                      <>
                        <p className="mb-0 fw-medium text-muted">
                          Drag & drop or <span className="fw-bold" style={{ color: cfg.color }}>Browse</span>
                        </p>
                        <span className="text-muted small">{cfg.hint}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Upload Button */}
                <div className="d-flex justify-content-end gap-3 pt-2">
                  <button
                    className="btn btn-outline-secondary rounded-3 px-4 fw-bold"
                    onClick={() => navigate(-1)}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn rounded-3 px-5 py-2 fw-bold"
                    onClick={handleUpload}
                    disabled={loading || fetchingData || (isPdfType && !selectedLessonId)}
                    style={{ backgroundColor: cfg.color, color: 'white', minWidth: '180px' }}
                  >
                    {loading ? (
                      <><span className="spinner-border spinner-border-sm me-2"></span>Uploading...</>
                    ) : (
                      <><i className={`fas ${cfg.icon} me-2`}></i>Upload {type}</>
                    )}
                  </button>
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

export default InstructorUpload;
