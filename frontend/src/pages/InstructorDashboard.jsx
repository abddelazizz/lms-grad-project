import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ProfileSidebar from '../components/ProfileSidebar';
import MobileNavbar from '../components/MobileNavbar';
import { instructorService, courseService, lessonService, sectionService } from '../services/apiService';
import toast, { Toaster } from 'react-hot-toast';
import Swal from 'sweetalert2';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Dashboard.css';

const InstructorDashboard = () => {
  const { user } = useAuth();
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [courseData, setCourseData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('curriculum');

  const fetchData = async () => {
    try {
      setLoading(true);
      if (courseId) {
        // Fetch specific course management data
        const res = await instructorService.getCourseDetails(courseId);
        const data = res.data?.data || res.data;
        if (data.course) {
          setCourseData(data);
        } else {
          setCourseData({ course: data });
        }
      } else {
        // Fetch overall stats
        const res = await instructorService.getStats();
        setStats(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [courseId]);

  const handleThumbnailChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('thumbnail', file);

    try {
      setLoading(true);
      await courseService.uploadCourseThumbnail(courseId, formData);
      toast.success("Thumbnail updated successfully");
      fetchData();
    } catch (err) {
      toast.error("Failed to update thumbnail");
    } finally {
      setLoading(false);
    }
  };

  const handleAddSection = async () => {
    const { value: title } = await Swal.fire({
      title: 'Add New Section',
      input: 'text',
      inputPlaceholder: 'Enter section title...',
      showCancelButton: true,
      confirmButtonColor: '#31506a',
      inputValidator: (value) => {
        if (!value) return 'Title is required!';
      }
    });

    if (title) {
      try {
        await sectionService.createSection(courseId, { title });
        toast.success("Section added successfully");
        fetchData();
      } catch (err) {
        toast.error("Failed to add section");
      }
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      setLoading(true);
      if (newStatus === 'published') {
        await courseService.publishCourse(courseId);
        toast.success("Course published successfully");
      } else {
        await courseService.updateCourse(courseId, { status: 'draft' });
        toast.success("Course reverted to draft");
      }
      fetchData();
    } catch (err) {
      const errorData = err.response?.data?.message;
      try {
        const parsed = JSON.parse(errorData);
        if (parsed.missing) {
          Swal.fire({
            title: 'Missing Requirements',
            html: `<ul class="text-start">${parsed.missing.map(m => `<li>${m}</li>`).join('')}</ul>`,
            icon: 'warning',
            confirmButtonColor: '#31506a'
          });
          return;
        }
      } catch (e) { }
      toast.error(err.response?.data?.message || `Failed to set status to ${newStatus}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePublishCourse = () => handleStatusChange('published');

  const handleEditDetails = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Edit Course Details',
      html:
        `<div class="text-start mb-2"><label class="small fw-bold">Course Title</label></div>` +
        `<input id="swal-title" class="swal2-input mt-0" placeholder="Course Title" value="${courseData?.course?.title || ''}">` +
        `<div class="text-start mb-2 mt-3"><label class="small fw-bold">Description</label></div>` +
        `<textarea id="swal-desc" class="swal2-textarea mt-0" placeholder="Course Description">${courseData?.course?.description || ''}</textarea>` +
        `<div class="row mt-3 text-start">
          <div class="col-6">
            <label class="small fw-bold mb-2">Price ($)</label>
            <input id="swal-price" type="number" class="form-control py-2" placeholder="0.00" value="${courseData?.course?.price || 0}">
          </div>
          <div class="col-6">
            <label class="small fw-bold mb-2">Difficulty Level</label>
            <select id="swal-level" class="form-select py-2">
              <option value="beginner" ${courseData?.course?.level === 'beginner' ? 'selected' : ''}>Beginner</option>
              <option value="intermediate" ${courseData?.course?.level === 'intermediate' ? 'selected' : ''}>Intermediate</option>
              <option value="advanced" ${courseData?.course?.level === 'advanced' ? 'selected' : ''}>Advanced</option>
            </select>
          </div>
        </div>`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonColor: '#31506a',
      preConfirm: () => {
        return {
          title: document.getElementById('swal-title').value,
          description: document.getElementById('swal-desc').value,
          price: document.getElementById('swal-price').value,
          level: document.getElementById('swal-level').value
        }
      }
    });

    if (formValues) {
      try {
        setLoading(true);
        await courseService.updateCourse(courseId, formValues);
        toast.success("Course details updated");
        fetchData();
      } catch (err) {
        toast.error("Failed to update course details");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAddQuiz = async (sectionId) => {
    const { value: title } = await Swal.fire({
      title: 'Create New Quiz',
      input: 'text',
      inputPlaceholder: 'Enter quiz title...',
      showCancelButton: true,
      confirmButtonColor: '#31506a',
      inputValidator: (value) => {
        if (!value) return 'Title is required!';
      }
    });

    if (title) {
      try {
        await quizService.saveQuiz({
          section_id: sectionId,
          title: title,
          status: 'draft'
        });
        toast.success("Quiz created successfully");
        fetchData();
      } catch (err) {
        toast.error("Failed to create quiz");
      }
    }
  };

  const handleEditLesson = async (lesson) => {
    const { value: newTitle } = await Swal.fire({
      title: 'Edit Lesson Title',
      input: 'text',
      inputValue: lesson.title,
      showCancelButton: true,
      confirmButtonColor: '#31506a',
    });

    if (newTitle && newTitle !== lesson.title) {
      try {
        toast.info("Update lesson logic pending API implementation");
      } catch (err) {
        toast.error("Failed to update lesson");
      }
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    const result = await Swal.fire({
      title: 'Delete Lesson?',
      text: "Are you sure you want to remove this lesson?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await lessonService.deleteLesson(lessonId);
        toast.success("Lesson deleted");
        fetchData();
      } catch (err) {
        toast.error("Failed to delete lesson");
      }
    }
  };

  const handleEditSection = async (section) => {
    const { value: newTitle } = await Swal.fire({
      title: 'Edit Section Title',
      input: 'text',
      inputValue: section.title,
      showCancelButton: true,
      confirmButtonColor: '#31506a',
    });

    if (newTitle && newTitle !== section.title) {
      toast.info("Update section logic pending API implementation");
    }
  };

  const handleDeleteSection = async (sectionId) => {
    const result = await Swal.fire({
      title: 'Delete Section?',
      text: "This will remove the section and all its lessons. Continue?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await sectionService.deleteSection(courseId, sectionId);
        toast.success("Section deleted successfully");
        fetchData();
      } catch (err) {
        toast.error("Failed to delete section");
      }
    }
  };

  const handleDeleteCourse = async () => {
    const result = await Swal.fire({
      title: 'Delete Course?',
      text: "This action cannot be undone.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await courseService.deleteCourse(courseId);
        toast.success("Course deleted");
        navigate('/instructor/my-courses');
      } catch (err) {
        toast.error("Failed to delete course");
      }
    }
  };

  if (loading) return (
    <div className="dashboard-page d-flex align-items-center justify-content-center" style={{ height: '100vh' }}>
      <div className="spinner-border text-primary" role="status"></div>
    </div>
  );

  return (
    <div className="dashboard-page">
      <MobileNavbar value={searchTerm} onChange={setSearchTerm} placeholder="Search curriculum..." />
      <div className="dashboard-layout">
        <Sidebar activePath={courseId ? "/instructor/my-courses" : "/dashboard"} />

        <main className="main-dashboard-content w-100">
          {courseId ? (
            // Course Management UI
            <div className="container-fluid pt-5 mt-4 px-4 mx-auto" style={{ maxWidth: '1200px' }}>
              <div className="d-flex justify-content-between align-items-end mb-4 flex-wrap gap-3 instructor-header-mobile">
                <div>
                  <nav aria-label="breadcrumb">
                    <ol className="breadcrumb mb-2" style={{ fontSize: '12px' }}>
                      <li className="breadcrumb-item"><Link to="/instructor/my-courses" className="text-decoration-none text-muted">My Courses</Link></li>
                      <li className="breadcrumb-item active text-dark fw-bold" aria-current="page">Manage Course</li>
                    </ol>
                  </nav>
                  <h2 className="fw-bold text-dark m-0" style={{ letterSpacing: '-0.5px' }}>{courseData?.course?.title || 'Course Details'}</h2>
                </div>
                <div className="d-flex gap-2 flex-wrap">
                  <input
                    type="file"
                    id="thumbnailInput"
                    className="d-none"
                    accept="image/*"
                    onChange={handleThumbnailChange}
                  />
                  <button className="btn btn-outline-primary-custom rounded-pill px-4 btn-sm fw-bold" onClick={() => document.getElementById('thumbnailInput').click()}>
                    <i className="fas fa-image me-2"></i>Change Thumbnail
                  </button>
                  <button className="btn btn-outline-primary-custom rounded-pill px-4 btn-sm fw-bold" onClick={handleEditDetails}>
                    <i className="fas fa-pen-to-square me-2"></i>Edit Details
                  </button>
                  <button className="btn btn-outline-danger rounded-pill px-4 btn-sm fw-bold" onClick={handleDeleteCourse}>
                    <i className="fas fa-trash-can me-2"></i>Delete
                  </button>
                  {courseData?.course?.status === 'published' ? (
                    <button className="btn btn-warning rounded-pill px-4 btn-sm text-white fw-bold shadow-sm" onClick={() => handleStatusChange('draft')}>
                      <i className="fas fa-rotate-left me-2"></i>Set to Draft
                    </button>
                  ) : (
                    <button className="btn btn-primary-custom rounded-pill px-4 btn-sm fw-bold shadow" onClick={handlePublishCourse}>
                      <i className="fas fa-rocket me-2"></i>Publish Course
                    </button>
                  )}
                </div>
              </div>

              {/* Course Banner */}
              <div className="position-relative mb-5 rounded-4 overflow-hidden shadow-lg border-0" style={{ height: '240px' }}>
                <img
                  src={courseData?.course?.thumbnail_url || 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&q=80&w=1200'}
                  alt="Banner"
                  className="w-100 h-100 object-fit-cover"
                />
                <div className="position-absolute top-0 start-0 w-100 h-100" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)' }}></div>
                <div className="position-absolute bottom-0 start-0 w-100 p-4 text-white">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <span className="badge rounded-pill bg-primary-custom px-3 py-2 text-uppercase shadow-sm" style={{ fontSize: '10px', letterSpacing: '1px' }}>{courseData?.course?.status || 'Draft'}</span>
                    <span className="badge rounded-pill bg-white text-dark px-3 py-2 text-uppercase shadow-sm" style={{ fontSize: '10px', letterSpacing: '1px' }}>{courseData?.course?.level || 'Beginner'}</span>
                  </div>
                  <h1 className="fw-bold m-0" style={{ fontSize: '2.2rem', letterSpacing: '-1px' }}>{courseData?.course?.title}</h1>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="d-flex gap-5 mb-4 border-bottom px-2 bg-white rounded-top-4">
                <button
                  className={`btn px-0 py-3 fw-bold transition-all shadow-none border-0 ${activeTab === 'curriculum' ? 'text-primary-custom' : 'text-muted opacity-75'}`}
                  style={{
                    borderRadius: 0,
                    marginBottom: '-2px',
                    fontSize: '15px',
                    borderBottom: activeTab === 'curriculum' ? '3px solid #31506a !important' : '3px solid transparent !important',
                    outline: 'none',
                    backgroundColor: 'transparent',
                    boxShadow: 'none'
                  }}
                  onClick={() => setActiveTab('curriculum')}
                >
                  <i className="fas fa-layer-group me-2"></i>Curriculum Builder
                </button>
                <button
                  className={`btn px-0 py-3 fw-bold transition-all shadow-none border-0 ${activeTab === 'students' ? 'text-primary-custom' : 'text-muted opacity-75'}`}
                  style={{
                    borderRadius: 0,
                    marginBottom: '-2px',
                    fontSize: '15px',
                    borderBottom: activeTab === 'students' ? '3px solid #31506a !important' : '3px solid transparent !important',
                    outline: 'none',
                    backgroundColor: 'transparent',
                    boxShadow: 'none'
                  }}
                  onClick={() => setActiveTab('students')}
                >
                  <i className="fas fa-user-graduate me-2"></i>Enrolled Students <span className="ms-1 opacity-50">({courseData?.course?.enrollments?.length || 0})</span>
                </button>
              </div>

              <div className="row g-4">
                {/* Left Side: Stats & Quick Actions */}
                <div className="col-lg-4">
                  <div className="vstack gap-4">
                    {/* Mini Stats */}
                    <div className="bg-white p-4 rounded-4 border shadow-sm">
                      <h6 className="fw-bold mb-4">Course Info</h6>
                      <div className="vstack gap-3">
                        <div className="d-flex justify-content-between">
                          <span className="text-muted">Price</span>
                          <span className="fw-bold text-primary-custom">
                            {parseFloat(courseData?.course?.price) > 0 ? `$${parseFloat(courseData?.course?.price).toFixed(2)}` : 'Free'}
                          </span>
                        </div>
                        <div className="d-flex justify-content-between">
                          <span className="text-muted">Level</span>
                          <span className="fw-bold text-capitalize">{courseData?.course?.level || 'Beginner'}</span>
                        </div>
                        <hr className="my-1" />
                        <div className="d-flex justify-content-between">
                          <span className="text-muted">Enrollments</span>
                          <span className="fw-bold">{courseData?.course?.enrollments?.length || 0}</span>
                        </div>
                        <div className="d-flex justify-content-between">
                          <span className="text-muted">Avg. Rating</span>
                          <span className="fw-bold text-warning">
                            {courseData?.course?.reviews?.length > 0
                              ? (courseData.course.reviews.reduce((sum, r) => sum + r.rating, 0) / courseData.course.reviews.length).toFixed(1)
                              : '0.0'} ⭐
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* Quick Actions Dropdown */}
                    <div className="bg-white p-4 rounded-4 border shadow-sm">
                      <h6 className="fw-bold mb-4">Course Tools</h6>
                      <div className="dropdown w-100">
                        <button
                          className="btn btn-primary-custom w-100 py-3 rounded-3 fw-bold d-flex align-items-center justify-content-center gap-3"
                          type="button"
                          data-bs-toggle="dropdown"
                        >
                          <i className="fas fa-plus-circle fa-lg"></i>
                          <span>Create New Content</span>
                        </button>
                        <ul className="dropdown-menu dropdown-menu-end shadow-lg border-0 rounded-4 p-2 animate-slide-in" style={{ minWidth: '260px' }}>
                          <li>
                            <Link to={`/instructor/upload-video?course=${courseId}`} className="dropdown-item py-3 rounded-3 d-flex align-items-center gap-3">
                              <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                <i className="fas fa-video"></i>
                              </div>
                              <div className="vstack">
                                <span className="fw-bold text-dark" style={{ fontSize: '14px' }}>Upload Video</span>
                                <span className="text-muted small">MP4, MOV up to 200MB</span>
                              </div>
                            </Link>
                          </li>
                          <li>
                            <Link to={`/instructor/upload-pdf?course=${courseId}`} className="dropdown-item py-3 rounded-3 d-flex align-items-center gap-3">
                              <div className="bg-danger bg-opacity-10 text-danger rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                <i className="fas fa-file-pdf"></i>
                              </div>
                              <div className="vstack">
                                <span className="fw-bold text-dark" style={{ fontSize: '14px' }}>Upload PDF</span>
                                <span className="text-muted small">Lectures and Documents</span>
                              </div>
                            </Link>
                          </li>
                          <li>
                            <Link to={`/instructor/upload-assignment?course=${courseId}`} className="dropdown-item py-3 rounded-3 d-flex align-items-center gap-3">
                              <div className="bg-success bg-opacity-10 text-success rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                <i className="fas fa-tasks"></i>
                              </div>
                              <div className="vstack">
                                <span className="fw-bold text-dark" style={{ fontSize: '14px' }}>Upload Assignment</span>
                                <span className="text-muted small">Student tasks and files</span>
                              </div>
                            </Link>
                          </li>
                          <li><hr className="dropdown-divider mx-2" /></li>
                          <li>
                            <Link to={`/instructor/quiz-generator?course=${courseId}`} className="dropdown-item py-3 rounded-3 d-flex align-items-center gap-3">
                              <div className="bg-warning bg-opacity-10 text-warning rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                <i className="fas fa-magic"></i>
                              </div>
                              <div className="vstack">
                                <span className="fw-bold text-dark" style={{ fontSize: '14px' }}>AI Quiz Generator</span>
                                <span className="text-muted small">Generate from PDF/Text</span>
                              </div>
                            </Link>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side: Curriculum Builder or Students List */}
                <div className="col-lg-8">
                  <div className="bg-white p-4 rounded-4 border shadow-sm h-100">
                    {activeTab === 'curriculum' ? (
                      <>
                        <div className="d-flex justify-content-between align-items-center mb-4">
                          <h5 className="fw-bold m-0">Course Curriculum</h5>
                          <button className="btn btn-primary-custom btn-sm rounded-pill px-4 fw-bold" onClick={handleAddSection}>
                            <i className="fas fa-plus me-2"></i>Add New Section
                          </button>
                        </div>

                        <div className="accordion curriculum-accordion border-0" id="curriculumAccordion">
                          {courseData?.course?.sections?.length > 0 ? courseData.course.sections.map((section, idx) => (
                            <div className="accordion-item border rounded-4 mb-3 shadow-sm" key={section.section_id} style={{ border: '1px solid #edf2f7 !important', overflow: 'visible' }}>
                              <div className="accordion-header d-flex align-items-center bg-white pe-3">
                                <button className="accordion-button collapsed bg-white fw-bold py-4 px-4 flex-grow-1 shadow-none text-dark" type="button" data-bs-toggle="collapse" data-bs-target={`#section${idx}`} style={{ fontSize: '16px' }}>
                                  <div className="d-flex align-items-center gap-3">
                                    <div className="bg-light rounded-3 d-flex align-items-center justify-content-center fw-bold text-muted" style={{ width: '32px', height: '32px', fontSize: '12px' }}>
                                      {String(idx + 1).padStart(2, '0')}
                                    </div>
                                    <span>{section.title}</span>
                                  </div>
                                </button>
                                <div className="d-flex gap-2">
                                  <button className="btn btn-sm btn-light rounded-circle shadow-sm hover-scale" onClick={(e) => { e.stopPropagation(); handleEditSection(section); }} title="Edit Section"><i className="fas fa-edit text-muted small"></i></button>
                                  <button className="btn btn-sm btn-light rounded-circle shadow-sm hover-scale" onClick={(e) => { e.stopPropagation(); handleDeleteSection(section.section_id); }} title="Delete Section"><i className="fas fa-trash text-danger small"></i></button>
                                </div>
                              </div>
                              <div id={`section${idx}`} className="accordion-collapse collapse" data-bs-parent="#curriculumAccordion" style={{ overflow: 'visible' }}>
                                <div className="accordion-body bg-light bg-opacity-25 p-0 border-top" style={{ overflow: 'visible' }}>
                                  <div className="list-group list-group-flush">
                                    {/* Video Lessons */}
                                    {section.lessons?.filter(l => l.content_type === 'video').map((lesson, lIdx) => (
                                      <div key={lesson.content_id} className="list-group-item d-flex justify-content-between align-items-center border-0 border-bottom py-3 px-4 bg-transparent hover-bg-white transition-all">
                                        <div className="d-flex align-items-center gap-3">
                                          <div className="rounded-circle bg-primary-custom text-white d-flex align-items-center justify-content-center" style={{ width: '34px', height: '34px', fontSize: '12px' }}>
                                            <i className="fas fa-play"></i>
                                          </div>
                                          <div>
                                            <div className="fw-bold text-dark mb-0" style={{ fontSize: '14px' }}>{lesson.title}</div>
                                            <div className="d-flex align-items-center gap-2">
                                              <span className="text-muted text-uppercase fw-bold" style={{ fontSize: '9px', letterSpacing: '0.5px' }}>Video Lesson</span>
                                              {lesson.duration && <span className="text-muted small">· {Math.floor(lesson.duration / 60)}m {lesson.duration % 60 > 0 ? `${lesson.duration % 60}s` : ''}</span>}
                                            </div>
                                          </div>
                                        </div>
                                        <div className="d-flex gap-2 action-btns">
                                          <button className="btn btn-link text-muted p-2 hover-text-primary" onClick={() => handleEditLesson(lesson)} title="Edit Lesson">
                                            <i className="fas fa-pen-to-square small"></i>
                                          </button>
                                          <button className="btn btn-link text-muted p-2 hover-text-danger" onClick={() => handleDeleteLesson(lesson.content_id)} title="Delete Lesson">
                                            <i className="fas fa-trash-can small"></i>
                                          </button>
                                        </div>
                                      </div>
                                    ))}

                                    {/* Section Attachments: PDFs + Assignments */}
                                    {section.lessons?.some(l => l.content_type !== 'video') && (
                                      <div className="px-4 py-2 bg-light border-bottom">
                                        <span className="text-muted fw-bold text-uppercase" style={{ fontSize: '10px', letterSpacing: '0.5px' }}><i className="fas fa-paperclip me-1"></i>Section Attachments</span>
                                      </div>
                                    )}
                                    {section.lessons?.filter(l => l.content_type !== 'video').map((lesson, lIdx) => (
                                      <div key={lesson.content_id} className="list-group-item d-flex justify-content-between align-items-center border-0 border-bottom py-2 px-4 bg-light bg-opacity-50 hover-bg-white transition-all">
                                        <div className="d-flex align-items-center gap-3">
                                          <div className={`rounded-circle d-flex align-items-center justify-content-center text-white ${lesson.content_type === 'pdf_assignment' ? 'bg-success' : 'bg-danger'}`} style={{ width: '28px', height: '28px', fontSize: '11px' }}>
                                            <i className={`fas ${lesson.content_type === 'pdf_assignment' ? 'fa-tasks' : 'fa-file-pdf'}`}></i>
                                          </div>
                                          <div>
                                            <div className="fw-semibold text-dark mb-0" style={{ fontSize: '13px' }}>{lesson.title}</div>
                                            <span className="text-muted text-uppercase fw-bold" style={{ fontSize: '9px', letterSpacing: '0.5px' }}>
                                              {lesson.content_type === 'pdf_assignment' ? 'Assignment' : 'PDF Resource'}
                                            </span>
                                          </div>
                                        </div>
                                        <div className="d-flex gap-2 action-btns">
                                          <button className="btn btn-link text-muted p-2 hover-text-danger" onClick={() => handleDeleteLesson(lesson.content_id)} title="Delete">
                                            <i className="fas fa-trash-can small"></i>
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                    {section.quizzes?.map((quiz, qIdx) => (
                                      <div key={quiz.quiz_id} className="list-group-item d-flex justify-content-between align-items-center border-0 border-bottom py-3 px-4 bg-transparent hover-bg-white transition-all">
                                        <div className="d-flex align-items-center gap-3">
                                          <div className="rounded-circle bg-warning text-white d-flex align-items-center justify-content-center" style={{ width: '34px', height: '34px', fontSize: '12px' }}>
                                            <i className="fas fa-question"></i>
                                          </div>
                                          <div>
                                            <div className="fw-bold text-dark mb-0" style={{ fontSize: '14px' }}>{quiz.title}</div>
                                            <span className="text-warning text-uppercase fw-bold" style={{ fontSize: '9px', letterSpacing: '0.5px' }}>Quiz</span>
                                          </div>
                                        </div>
                                        <div className="d-flex gap-2 action-btns">
                                          <button className="btn btn-link text-muted p-2 hover-text-primary" onClick={() => navigate(`/instructor/quiz-generator?quizId=${quiz.quiz_id}`)} title="Edit Quiz Questions">
                                            <i className="fas fa-gear small"></i>
                                          </button>
                                          <button className="btn btn-link text-muted p-2 hover-text-danger" onClick={() => {/* handleDeleteQuiz */ }} title="Delete Quiz">
                                            <i className="fas fa-trash-can small"></i>
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                    <div className="p-3">
                                      <div className="dropdown w-100">
                                        <button
                                          className="btn btn-outline-primary-custom w-100 py-2 border-dashed fw-bold small dropdown-toggle d-flex align-items-center justify-content-center gap-2 rounded-3"
                                          type="button"
                                          data-bs-toggle="dropdown"
                                          style={{ borderStyle: 'dashed', borderWidth: '1.5px', fontSize: '13px' }}
                                        >
                                          <i className="fas fa-plus-circle"></i> Add Content to Section
                                        </button>
                                        <ul className="dropdown-menu dropdown-menu-end shadow-lg border-0 rounded-4 p-2 animate-slide-in" style={{ minWidth: '240px', zIndex: 9999 }}>
                                          <li className="px-3 py-2 text-uppercase text-muted fw-bold" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>Add Content</li>
                                          <li>
                                            <button className="dropdown-item py-2 px-3 rounded-3 d-flex align-items-center gap-3 transition-all" onClick={() => navigate(`/instructor/upload-video?course=${courseId}&section=${section.section_id}`)}>
                                              <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                                                <i className="fas fa-video small"></i>
                                              </div>
                                              <span className="fw-bold text-dark" style={{ fontSize: '13px' }}>Video Lesson</span>
                                            </button>
                                          </li>
                                          <li>
                                            <button className="dropdown-item py-2 px-3 rounded-3 d-flex align-items-center gap-3 transition-all" onClick={() => navigate(`/instructor/upload-pdf?course=${courseId}&section=${section.section_id}`)}>
                                              <div className="bg-danger bg-opacity-10 text-danger rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                                                <i className="fas fa-file-pdf small"></i>
                                              </div>
                                              <span className="fw-bold text-dark" style={{ fontSize: '13px' }}>PDF Document</span>
                                            </button>
                                          </li>
                                          <li>
                                            <button className="dropdown-item py-2 px-3 rounded-3 d-flex align-items-center gap-3 transition-all" onClick={() => navigate(`/instructor/upload-assignment?course=${courseId}&section=${section.section_id}`)}>
                                              <div className="bg-success bg-opacity-10 text-success rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                                                <i className="fas fa-tasks small"></i>
                                              </div>
                                              <span className="fw-bold text-dark" style={{ fontSize: '13px' }}>Assignment</span>
                                            </button>
                                          </li>
                                          <li>
                                            <button className="dropdown-item py-2 px-3 rounded-3 d-flex align-items-center gap-3 transition-all" onClick={() => navigate(`/instructor/bulk-upload?courseId=${courseId}&sectionId=${section.section_id}`)}>
                                              <div className="bg-info bg-opacity-10 text-info rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                                                <i className="fas fa-layer-group small"></i>
                                              </div>
                                              <div className="vstack">
                                                <span className="fw-bold text-dark" style={{ fontSize: '13px' }}>Bulk Upload</span>
                                                <span className="text-muted" style={{ fontSize: '10px' }}>Upload multiple files</span>
                                              </div>
                                            </button>
                                          </li>
                                          <li><hr className="dropdown-divider mx-2 opacity-50" /></li>
                                          <li>
                                            <button className="dropdown-item py-2 px-3 rounded-3 d-flex align-items-center gap-3 transition-all" onClick={() => navigate(`/instructor/quiz-generator?courseId=${courseId}&sectionId=${section.section_id}`)}>
                                              <div className="bg-warning bg-opacity-10 text-warning rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                                                <i className="fas fa-magic small"></i>
                                              </div>
                                              <div className="vstack">
                                                <span className="fw-bold text-dark" style={{ fontSize: '13px' }}>Quiz Generator</span>
                                                <span className="text-muted" style={{ fontSize: '10px' }}>AI-Powered Quiz</span>
                                              </div>
                                            </button>
                                          </li>
                                        </ul>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )) : (
                            <div className="text-center py-5">
                              <div className="bg-light rounded-circle mx-auto d-flex align-items-center justify-content-center mb-3" style={{ width: '60px', height: '60px' }}>
                                <i className="fas fa-book-open text-muted fa-2x"></i>
                              </div>
                              <p className="text-muted">No sections added yet. Click "Add New Section" to start building your course.</p>
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="d-flex justify-content-between align-items-center mb-4">
                          <h5 className="fw-bold m-0">Enrolled Students</h5>
                          <div className="badge bg-soft-primary text-primary px-3 py-2 rounded-pill">
                            {courseData?.course?.enrollments?.length || 0} Students Total
                          </div>
                        </div>

                        <div className="table-responsive">
                          <table className="table table-hover align-middle border-0">
                            <thead className="border-0">
                              <tr style={{ backgroundColor: '#f8fafc' }}>
                                <th className="border-0 py-4 ps-4 text-dark small text-uppercase fw-bold" style={{ letterSpacing: '0.5px' }}>Student</th>
                                <th className="border-0 py-4 text-dark small text-uppercase fw-bold" style={{ letterSpacing: '0.5px' }}>Enrolled At</th>
                                <th className="border-0 py-4 text-dark small text-uppercase fw-bold" style={{ letterSpacing: '0.5px' }}>Status</th>
                                <th className="border-0 py-4 text-end pe-4"></th>
                              </tr>
                            </thead>
                            <tbody>
                              {courseData?.course?.enrollments?.length > 0 ? courseData.course.enrollments.map((enrollment) => (
                                <tr key={enrollment.enrollment_id} className="border-bottom hover-bg-light transition-all">
                                  <td className="py-4 ps-4">
                                    <div className="d-flex align-items-center gap-3">
                                      <div className="avatar-wrapper rounded-circle overflow-hidden shadow-sm" style={{ width: '48px', height: '48px', border: '2px solid #fff' }}>
                                        <img
                                          src={enrollment.student?.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(enrollment.student?.name || 'User')}&background=random`}
                                          alt={enrollment.student?.name}
                                          className="w-100 h-100 object-fit-cover"
                                        />
                                      </div>
                                      <div className="vstack gap-0">
                                        <span className="fw-bold text-dark" style={{ fontSize: '15px' }}>{enrollment.student?.name}</span>
                                        <span className="text-muted small">{enrollment.student?.email}</span>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-4 text-muted small fw-medium">
                                    {new Date(enrollment.enrolled_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                  </td>
                                  <td className="py-4">
                                    <span className={`badge rounded-pill px-3 py-2 fw-bold text-uppercase ${enrollment.status === 'active' ? 'bg-soft-success text-success' : 'bg-soft-secondary text-secondary'}`} style={{ fontSize: '10px' }}>
                                      {enrollment.status}
                                    </span>
                                  </td>
                                  <td className="py-4 text-end pe-4">
                                    <button className="btn btn-sm btn-outline-primary-custom rounded-pill px-3 fw-bold">View Profile</button>
                                  </td>
                                </tr>
                              )) : (
                                <tr>
                                  <td colSpan="4" className="text-center py-5">
                                    <div className="py-5 vstack align-items-center">
                                      <div className="bg-light rounded-circle d-flex align-items-center justify-content-center mb-4" style={{ width: '80px', height: '80px' }}>
                                        <i className="fas fa-users-slash text-muted fa-2x"></i>
                                      </div>
                                      <h5 className="fw-bold text-dark">No Students Enrolled</h5>
                                      <p className="text-muted small mx-auto" style={{ maxWidth: '300px' }}>When students enroll in this course, they will appear here with their details and progress.</p>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Overall Stats UI (Fallback or generic dashboard)
            <div className="container-fluid pt-5 mt-4 mx-auto" style={{ maxWidth: '1200px' }}>
              <div className="d-flex justify-content-between align-items-center mb-5 instructor-header-mobile">
                <div>
                  <h2 className="fw-bold text-dark m-0">Dashboard</h2>
                  <p className="text-muted small m-0">Welcome back, {user?.name || 'Instructor'}!</p>
                </div>
              </div>

              <div className="row g-4 mb-4">
                {/* Left Column */}
                <div className="col-lg-8">
                  <div className="vstack gap-4">
                    {/* Student Statistic Chart */}
                    <div className="bg-white p-4 rounded-4 border shadow-sm">
                      <div className="d-flex justify-content-between align-items-center mb-4">
                        <h6 className="fw-bold m-0">Student Statistic</h6>
                        <div className="d-flex gap-3 small text-muted">
                          <div className="d-flex align-items-center gap-1"><span className="rounded-circle" style={{ width: '8px', height: '8px', background: '#31506a' }}></span> Enrollments</div>
                        </div>
                      </div>

                      <div className="position-relative" style={{ height: '300px' }}>
                        <div className="d-flex align-items-end justify-content-between h-100 px-3 pb-4">
                          {stats?.monthly_enrollments && Object.keys(stats.monthly_enrollments).length > 0 ? (
                            Object.entries(stats.monthly_enrollments).slice(-6).map(([month, count], i) => (
                              <div key={i} className="flex-grow-1 mx-3 position-relative" style={{ height: '100%' }}>
                                <div className="rounded-2 position-absolute bottom-0 w-100"
                                  style={{
                                    height: `${Math.min(count * 10, 100)}%`,
                                    background: i % 2 === 0 ? '#31506a' : '#4a6b82',
                                    transition: 'height 1s ease'
                                  }}
                                  title={`${count} students`}
                                ></div>
                                <div className="position-absolute w-100 text-center small text-muted" style={{ bottom: '-30px', fontSize: '10px' }}>{month}</div>
                              </div>
                            ))
                          ) : (
                            <div className="w-100 h-100 d-flex align-items-center justify-content-center text-muted small">No enrollment data for the last months</div>
                          )}
                        </div>
                        {/* Static Line for aesthetics */}
                        <svg className="position-absolute top-0 start-0 w-100 h-100" style={{ pointerEvents: 'none', opacity: 0.3 }}>
                          <path d="M 50 250 Q 150 180 250 220 T 450 150 T 650 180" fill="none" stroke="#10b981" strokeWidth="2" />
                        </svg>
                      </div>
                    </div>

                    {/* Upcoming Activities (Pending Submissions) */}
                    <div className="bg-white p-4 rounded-4 border shadow-sm">
                      <div className="d-flex justify-content-between align-items-center mb-4">
                        <h6 className="fw-bold m-0">Pending Submissions</h6>
                        <Link to="/dashboard/inbox" className="btn btn-link btn-sm text-primary-custom text-decoration-none fw-bold p-0">See all</Link>
                      </div>

                      <div className="vstack gap-3">
                        {stats?.pending_assignments?.length > 0 ? stats.pending_assignments.map((act, i) => (
                          <div key={i} className="d-flex align-items-center gap-4 p-3 rounded-4 bg-light bg-opacity-50 border-0 transition-all hover-shadow-sm">
                            <div className="rounded-3 overflow-hidden" style={{ width: '50px', height: '50px', flexShrink: 0 }}>
                              <img src={act.student_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(act.student_name)}&background=random`} className="w-100 h-100 object-fit-cover" alt="student" />
                            </div>
                            <div className="flex-grow-1">
                              <div className="fw-bold text-dark">{act.student_name} submitted assignment</div>
                              <div className="small text-muted d-flex align-items-center gap-2">
                                <span className="text-primary-custom">{act.lesson_title}</span>
                                <span>•</span>
                                <span>{new Date(act.submitted_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <Link to="/dashboard/inbox" className={`btn btn-sm btn-outline-primary-custom rounded-pill px-3`}>
                              Grade Now
                            </Link>
                          </div>
                        )) : (
                          <div className="text-center py-4 text-muted small bg-light rounded-4 border-dashed">No pending assignments to grade.</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="col-lg-4">
                  <div className="bg-white p-4 rounded-4 border shadow-sm h-100">
                    <h6 className="fw-bold mb-4">Class Progress</h6>
                    <div className="vstack gap-4">
                      {stats?.courses?.length > 0 ? stats.courses.slice(0, 5).map((course, i) => {
                        const progress = parseInt(course.avg_progress || 0);
                        return (
                          <div key={i} className="d-flex align-items-center justify-content-between p-3 rounded-4 bg-light bg-opacity-50">
                            <div className="overflow-hidden pe-2">
                              <div className="fw-bold text-dark mb-1 text-truncate" title={course.title}>{course.title}</div>
                              <div className="small text-muted">{course.enrollments?.total || 0} Students</div>
                            </div>
                            <div className="position-relative d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px', flexShrink: 0 }}>
                              <svg width="60" height="60" viewBox="0 0 60 60">
                                <circle cx="30" cy="30" r="25" fill="none" stroke="#e2e8f0" strokeWidth="5" />
                                <circle cx="30" cy="30" r="25" fill="none" stroke="#31506a" strokeWidth="5"
                                  strokeDasharray={`${(progress / 100) * 157} 157`}
                                  strokeLinecap="round" transform="rotate(-90 30 30)"
                                />
                              </svg>
                              <span className="position-absolute fw-bold" style={{ fontSize: '11px' }}>{progress}%</span>
                            </div>
                          </div>
                        );
                      }) : (
                        <div className="text-center py-5 text-muted small">No courses found.</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        <ProfileSidebar />
      </div>
    </div>
  );
};

export default InstructorDashboard;
