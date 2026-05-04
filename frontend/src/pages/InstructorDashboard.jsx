import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import ProfileSidebar from '../components/ProfileSidebar';
import { instructorService, courseService, lessonService } from '../services/apiService';
import toast, { Toaster } from 'react-hot-toast';
import Swal from 'sweetalert2';
import '../styles/Dashboard.css';

const InstructorDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [selectedCourseDetails, setSelectedCourseDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleCourseClick = async (courseId) => {
    if (!courseId) return;
    setDetailsLoading(true);
    setShowModal(true);
    try {
      const res = await instructorService.getCourseDetails(courseId);
      setSelectedCourseDetails(res.data?.data || res.data);
    } catch (err) {
      console.error(err);
      setSelectedCourseDetails({ error: "Failed to load detailed metrics." });
    } finally {
      setDetailsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await instructorService.getStats();
      setStats(res.data.data);
    } catch (err) {
      console.error('Error fetching instructor stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleDeleteCourse = async (courseId) => {
    const result = await Swal.fire({
      title: 'Delete Course?',
      text: "Are you sure you want to delete this course? This action cannot be undone.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#31506a',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await courseService.deleteCourse(courseId);
        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Course deleted successfully',
          confirmButtonColor: '#31506a'
        });
        setShowModal(false);
        fetchStats();
      } catch (err) {
        toast.error("Failed to delete course");
      }
    }
  };

  const handlePublishCourse = async (courseId) => {
    try {
      await courseService.publishCourse(courseId);
      toast.success("Course published successfully");
      setShowModal(false);
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to publish course");
    }
  };

  const handleEditCourseTitle = async (courseId, currentTitle) => {
    const { value: newTitle } = await Swal.fire({
      title: 'Edit Course Title',
      input: 'text',
      inputLabel: 'New Title',
      inputValue: currentTitle,
      showCancelButton: true,
      confirmButtonColor: '#31506a',
      inputValidator: (value) => {
        if (!value) return 'Title cannot be empty!';
      }
    });

    if (newTitle && newTitle !== currentTitle) {
      try {
        await courseService.updateCourse(courseId, { title: newTitle });
        toast.success("Course updated successfully");
        handleCourseClick(courseId); // refresh modal
        fetchStats(); // refresh list
      } catch (err) {
        toast.error("Failed to update course");
      }
    }
  };

  const handleDeleteLesson = async (lessonId, courseId) => {
    const result = await Swal.fire({
      title: 'Remove Lesson?',
      text: "Are you sure you want to delete this lesson?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#31506a',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await lessonService.deleteLesson(lessonId);
        toast.success("Lesson deleted successfully");
        handleCourseClick(courseId); // refresh modal
      } catch (err) {
        toast.error("Failed to delete lesson");
      }
    }
  };

  const handleEditLesson = async (lesson, courseId) => {
    const { value: formValues } = await Swal.fire({
      title: 'Edit Lesson',
      html:
        `<label class="swal2-label">Lesson Title</label>` +
        `<input id="swal-input1" class="swal2-input" value="${lesson.title}">` +
        `<label class="swal2-label">Description</label>` +
        `<textarea id="swal-input2" class="swal2-textarea">${lesson.description || ''}</textarea>`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonColor: '#31506a',
      preConfirm: () => {
        return [
          document.getElementById('swal-input1').value,
          document.getElementById('swal-input2').value
        ]
      }
    });

    if (formValues) {
      const [title, description] = formValues;
      if (!title) return toast.error("Title is required");

      try {
        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        
        await lessonService.updateLesson(lesson.content_id, formData);
        toast.success("Lesson updated successfully");
        handleCourseClick(courseId);
      } catch (err) {
        toast.error("Failed to update lesson");
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
      <Toaster position="top-center" />
      <div className="dashboard-layout">
        <Sidebar activePath="/dashboard" />

        <main className="main-dashboard-content w-100 p-4">
          <div className="container-fluid pt-5 mt-4 mx-auto" style={{ maxWidth: '1100px' }}>
            
            {/* Search Bar */}
            <div className="search-bar-wrapper mb-5 mx-auto" style={{ maxWidth: '700px' }}>
              <i className="fas fa-search search-icon"></i>
              <input 
                type="text" 
                className="search-input" 
                placeholder="Search your course here...." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="row g-4 mb-4">
              {/* Student Statistics (Bar Chart) - Left Card */}
              <div className="col-lg-7">
                <div className="bg-white p-4 rounded-4 border shadow-sm" style={{ minHeight: '380px' }}>
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                      <h5 className="fw-bold mb-1">Student Statistic</h5>
                    </div>
                    <div className="d-flex align-items-center gap-3">
                       <div className="d-flex align-items-center gap-2 border rounded-pill px-2 py-1" style={{ fontSize: '10px' }}>
                          <i className="fas fa-chevron-left text-muted"></i>
                          <span className="fw-bold">Sept 2022</span>
                          <i className="fas fa-chevron-right text-muted"></i>
                       </div>
                       <span className="small fw-bold border-start ps-3" style={{ color: '#31506a' }}>Avg.</span>
                    </div>
                  </div>
                  
                  <div className="d-flex align-items-end justify-content-between h-75 px-3 pt-4" style={{ minHeight: '260px', position: 'relative' }}>
                    <div className="position-absolute start-0 top-0 h-100 d-flex flex-column justify-content-between text-muted" style={{ fontSize: '10px', paddingBottom: '30px' }}>
                      <span>60%</span><span>50</span><span>40</span><span>30</span><span>20</span><span>10</span><span>0</span>
                    </div>
                    {/* Decorative avg line */}
                    <div className="position-absolute w-100 border-top border-primary border-opacity-25" style={{ top: '40%', left: 0, zIndex: 1 }}>
                       <span className="position-absolute bg-primary text-white rounded-1 px-1" style={{ top: '-10px', left: '50%', fontSize: '8px' }}>Av Poin</span>
                    </div>

                    {(stats?.courses?.filter(c => c.title.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 5) || []).map((item, i) => {
                      const h = (item.enrollments?.total || 0) * 100 || 15;
                      return (
                        <div key={i} className="text-center position-relative" style={{ width: '15%', zIndex: 2 }}>
                          <div className="mx-auto rounded-1" 
                               style={{ 
                                 width: '32px', 
                                 height: `${Math.max(Math.min(h, 220), 10)}px`,
                                 backgroundColor: i === 3 ? '#31506a' : '#e0e7ff',
                                 transition: 'all 0.5s ease' 
                               }}></div>
                          <div className="small mt-2 text-muted text-truncate" style={{ fontSize: '10px' }}>{item.title.split(' ')[0]}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Class Progress - Right Card */}
              <div className="col-lg-5">
                <div className="bg-white p-4 rounded-4 border shadow-sm" style={{ minHeight: '380px' }}>
                  <h5 className="fw-bold mb-4">Course Performance</h5>
                  <div className="d-flex flex-column gap-3">
                    {stats?.courses?.filter(c => c.title.toLowerCase().includes(searchTerm.toLowerCase())).length > 0 ? stats.courses.filter(c => c.title.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 4).map((cls, i) => (
                      <div 
                        key={i} 
                        className="d-flex align-items-center justify-content-between p-3 rounded-4 bg-light-gray border-light"
                        style={{ cursor: cls.course_id ? 'pointer' : 'default', transition: 'background-color 0.2s' }}
                        onClick={() => cls.course_id ? handleCourseClick(cls.course_id) : null}
                      >
                        <div className="overflow-hidden pe-2">
                          <div className="fw-bold text-truncate" style={{ fontSize: '13px' }}>{cls.title}</div>
                          <div className="text-muted" style={{ fontSize: '11px' }}>{cls.enrollments?.total || 0} Registered</div>
                        </div>
                        <div className="position-relative d-flex align-items-center justify-content-center" style={{ width: '55px', height: '55px', flexShrink: 0 }}>
                          <svg width="55" height="55" className="rotate-270">
                            <circle cx="27.5" cy="27.5" r="22" fill="none" stroke="#e0e4ec" strokeWidth="6" />
                            <circle cx="27.5" cy="27.5" r="22" fill="none" stroke="#31506a" strokeWidth="6" 
                                    strokeDasharray="138" strokeDashoffset={138 - (138 * (cls.enrollments?.completed / (cls.enrollments?.total || 1) * 100 || 0) / 100)} 
                                    strokeLinecap="round" />
                          </svg>
                          <span className="position-absolute fw-bold" style={{ fontSize: '11px' }}>{Math.round((cls.enrollments?.completed || 0) / (cls.enrollments?.total || 1) * 100) || 0}%</span>
                        </div>
                      </div>
                    )) : (
                      <div className="text-muted p-3 bg-light rounded-4 text-center border">No courses created yet.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="row g-4">
              <div className="col-12">
                <div className="bg-white p-4 rounded-4 border shadow-sm">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="fw-bold mb-0">Upcoming Activities</h5>
                    <button className="btn btn-link text-primary text-decoration-none small p-0">See all</button>
                  </div>
                  <div className="row g-3">
                    {[
                      { date: '31', title: 'Meeting with the VC', link: 'Meeting link//www.zoom.com', time: '10 A.M - 11 A.M', status: 'Due soon', statusColor: 'danger' },
                      { date: '04', title: 'Meeting with the J..', link: 'Meeting link//www.zoom.com', time: '10 A.M - 11 A.M', status: 'Upcoming', statusColor: 'primary' },
                      { date: '12', title: 'Class B middle sess..', link: 'Physical science lab', time: '10 A.M - 11 A.M', status: 'Upcoming', statusColor: 'primary' },
                      { date: '16', title: 'Send Mr Ayo class..', link: 'Send Document via email', time: '10 A.M - 11 A.M', status: 'Upcoming', statusColor: 'primary' },
                    ].map((activity, i) => (
                      <div key={i} className="col-md-12">
                        <div className="d-flex align-items-center gap-3 p-3 rounded-4 bg-light bg-opacity-50 border">
                          <div className="bg-primary text-white rounded-3 d-flex align-items-center justify-content-center fw-bold" style={{ width: '45px', height: '45px', flexShrink: 0 }}>
                            {activity.date}
                          </div>
                          <div className="flex-grow-1 overflow-hidden">
                            <h6 className="mb-1 fw-bold text-truncate" style={{ fontSize: '14px' }}>{activity.title}</h6>
                            <p className="mb-0 text-primary small text-truncate" style={{ fontSize: '11px' }}>{activity.link}</p>
                          </div>
                          <div className="text-end" style={{ flexShrink: 0 }}>
                            <div className="small text-muted mb-1" style={{ fontSize: '10px' }}>
                              <span className="text-primary me-1">•</span>{activity.time}
                            </div>
                            <span className={`badge bg-${activity.statusColor} bg-opacity-10 text-${activity.statusColor} rounded-pill`} style={{ fontSize: '10px' }}>{activity.status}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {showModal && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 rounded-4 shadow">
                <div className="modal-header border-0 pb-0">
                  <h5 className="modal-title fw-bold">Detailed Course Metrics</h5>
                  <button type="button" className="btn-close" onClick={() => { setShowModal(false); setSelectedCourseDetails(null); }}></button>
                </div>
                <div className="modal-body pt-4">
                  {detailsLoading ? (
                    <div className="text-center py-4">
                      <div className="spinner-border text-primary" role="status"></div>
                      <p className="mt-2 text-muted">Loading metrics...</p>
                    </div>
                  ) : selectedCourseDetails?.error ? (
                    <div className="alert alert-danger">{selectedCourseDetails.error}</div>
                  ) : selectedCourseDetails ? (
                    <div className="vstack gap-3">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h6 className="fw-bold text-dark mb-0">
                          {selectedCourseDetails.course?.title || "Course Details"}
                          {selectedCourseDetails.course?.status === 'draft' && (
                            <span className="badge bg-warning ms-2">Draft</span>
                          )}
                        </h6>
                        <div className="d-flex gap-2">
                          <button className="btn btn-sm btn-outline-primary" onClick={() => handleEditCourseTitle(selectedCourseDetails.course?.course_id, selectedCourseDetails.course?.title)}>
                            <i className="fas fa-edit"></i> Edit Title
                          </button>
                          {selectedCourseDetails.course?.status !== 'published' && (
                            <button className="btn btn-sm btn-outline-success" onClick={() => handlePublishCourse(selectedCourseDetails.course?.course_id)}>
                              <i className="fas fa-upload"></i> Publish
                            </button>
                          )}
                          <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteCourse(selectedCourseDetails.course?.course_id)}>
                            <i className="fas fa-trash"></i> Delete
                          </button>
                        </div>
                      </div>
                      
                      <div className="d-flex justify-content-between border-bottom pb-2">
                        <span className="text-muted">Total Enrollments</span>
                        <span className="fw-bold">{selectedCourseDetails.enrollments?.total || 0}</span>
                      </div>
                      <div className="d-flex justify-content-between border-bottom pb-2">
                        <span className="text-muted">Completed</span>
                        <span className="fw-bold text-success">{selectedCourseDetails.enrollments?.completed || 0}</span>
                      </div>
                      <div className="d-flex justify-content-between border-bottom pb-2">
                        <span className="text-muted">Average Rating</span>
                        <span className="fw-bold">{selectedCourseDetails.rating?.average || "N/A"} ⭐</span>
                      </div>
                      <div className="d-flex justify-content-between border-bottom pb-2">
                        <span className="text-muted">Total Revenue</span>
                        <span className="fw-bold text-primary">${selectedCourseDetails.revenue?.total || 0}</span>
                      </div>
                      
                      {/* Sections & Lessons List */}
                      {selectedCourseDetails.course?.sections?.length > 0 && (
                        <div className="mt-3">
                          <h6 className="fw-bold text-dark mb-3">Curriculum</h6>
                          <div className="accordion" id="curriculumAccordion">
                            {selectedCourseDetails.course.sections.map((sec, idx) => (
                              <div className="accordion-item border-0 mb-2 bg-light rounded-3 overflow-hidden" key={sec.section_id}>
                                <h2 className="accordion-header">
                                  <button className="accordion-button collapsed bg-light fw-bold" type="button" data-bs-toggle="collapse" data-bs-target={`#collapseSec${idx}`}>
                                    {sec.title}
                                  </button>
                                </h2>
                                <div id={`collapseSec${idx}`} className="accordion-collapse collapse" data-bs-parent="#curriculumAccordion">
                                  <div className="accordion-body p-2 bg-white">
                                    {sec.lessons?.length > 0 ? (
                                      <ul className="list-group list-group-flush">
                                        {sec.lessons.map(les => (
                                          <li key={les.content_id} className="list-group-item d-flex justify-content-between align-items-center px-2 py-2 border-0 border-bottom">
                                            <span style={{ fontSize: '14px' }}>
                                              <i className={`fas ${les.content_type === 'video' ? 'fa-video' : 'fa-file-pdf'} text-primary me-2`}></i>
                                              {les.title}
                                            </span>
                                            <div className="d-flex gap-2">
                                              <button className="btn btn-sm btn-link text-primary p-0" onClick={() => handleEditLesson(les, selectedCourseDetails.course.course_id)} title="Edit Lesson">
                                                <i className="fas fa-edit"></i>
                                              </button>
                                              <button className="btn btn-sm btn-link text-danger p-0" onClick={() => handleDeleteLesson(les.content_id, selectedCourseDetails.course.course_id)} title="Delete Lesson">
                                                <i className="fas fa-trash"></i>
                                              </button>
                                            </div>
                                          </li>
                                        ))}
                                      </ul>
                                    ) : (
                                      <div className="text-muted small p-2">No lessons in this section.</div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-center text-muted">No details available.</p>
                  )}
                </div>
                <div className="modal-footer border-0">
                  <button type="button" className="btn btn-light" onClick={() => { setShowModal(false); setSelectedCourseDetails(null); }}>Close</button>
                </div>
              </div>
            </div>
          </div>
        )}

        <ProfileSidebar />
      </div>
    </div>
  );
};

export default InstructorDashboard;
