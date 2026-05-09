import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast, { Toaster } from 'react-hot-toast';
import '../styles/CoursePlayerDesign.css';

const formatDuration = (seconds) => {
  if (!seconds) return '0:00';
  if (typeof seconds === 'string' && seconds.includes(':')) return seconds;
  const s = Number(seconds);
  const m = Math.floor(s / 60);
  const rem = Math.floor(s % 60);
  return `${m}:${String(rem).padStart(2, '0')}`;
};

// ─── PDF Resource Card ───────────────────────────────────────────────────────
// Uses Google Docs Viewer to safely embed Cloudinary PDFs (avoids chrome-error)
const PdfResourceCard = ({ resource }) => {
  const [preview, setPreview] = useState(false);
  const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(resource.file_url)}&embedded=true`;

  return (
    <div className="assignment-item-card" style={{ padding: '1.25rem 1.5rem' }}>
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
        <div className="d-flex align-items-center gap-3">
          <div className="bg-danger bg-opacity-10 p-2 rounded-3">
            <i className="fas fa-file-pdf text-danger fa-lg"></i>
          </div>
          <div>
            <h6 className="fw-bold mb-0" style={{ fontSize: '14px' }}>{resource.title}</h6>
            <span className="text-muted" style={{ fontSize: '12px' }}>PDF Lecture</span>
          </div>
        </div>
        <div className="d-flex gap-2">
          <button
            className={`btn btn-sm rounded-pill px-3 fw-bold ${preview ? 'btn-danger' : 'btn-outline-danger'}`}
            onClick={() => setPreview(p => !p)}
            style={{ fontSize: '12px' }}
          >
            <i className={`fas ${preview ? 'fa-times' : 'fa-eye'} me-1`}></i>
            {preview ? 'Close' : 'Preview'}
          </button>
          <a
            href={resource.file_url}
            target="_blank"
            rel="noreferrer"
            className="btn btn-sm btn-outline-secondary rounded-pill px-3 fw-bold"
            style={{ fontSize: '12px' }}
          >
            <i className="fas fa-external-link-alt me-1"></i>Open
          </a>
          <a
            href={resource.file_url}
            download
            className="btn btn-sm btn-dark rounded-pill px-3 fw-bold"
            style={{ fontSize: '12px' }}
          >
            <i className="fas fa-download me-1"></i>Download
          </a>
        </div>
      </div>

      {/* Inline PDF Preview via Google Docs Viewer */}
      {preview && (
        <div className="mt-3 rounded-3 overflow-hidden" style={{ border: '1px solid #e2e8f0' }}>
          <iframe
            src={viewerUrl}
            title={resource.title}
            width="100%"
            height="600px"
            style={{ border: 'none', display: 'block' }}
            allow="fullscreen"
          />
        </div>
      )}
    </div>
  );
};

const CoursePlayer = () => {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const { api } = useAuth();

  const [activeTab, setActiveTab] = useState('resources');
  const [course, setCourse] = useState(null);
  const [sections, setSections] = useState([]);       // grouped by section
  const [allLessons, setAllLessons] = useState([]);   // flat list of video lessons only
  const [currentLesson, setCurrentLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [markingComplete, setMarkingComplete] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState(null);

  // ─── Fetch ──────────────────────────────────────────────────────────────────
  const fetchCourseData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/courses/${courseId}/details`);
      const courseData = res.data.data.course;
      setCourse(courseData);

      // Build sections with their video lessons + attachment lists
      const builtSections = (courseData.sections || []).map(section => {
        const videoLessons = (section.lessons || [])
          .filter(l => l.content_type === 'video')
          .sort((a, b) => (a.position_order || 0) - (b.position_order || 0))
          .map(l => ({
            ...l,
            sectionTitle: section.title,
            sectionId: section.section_id,
            isCompleted: l.progress_records?.some(p => p.status === 'completed'),
            // Only attachments whose parent_content_id matches THIS video lesson
            pdfResources: (section.lessons || []).filter(
              sl => sl.content_type === 'pdf_lecture' && String(sl.parent_content_id) === String(l.content_id)
            ),
            assignments: (section.lessons || []).filter(
              sl => sl.content_type === 'pdf_assignment' && String(sl.parent_content_id) === String(l.content_id)
            ),
            quizzes: section.quizzes || [],
          }));
        return { ...section, videoLessons };
      });

      setSections(builtSections);

      // Flat list of video lessons across all sections
      const flat = builtSections.flatMap(s => s.videoLessons);
      setAllLessons(flat);

      // Select active lesson
      let selected = null;
      if (lessonId) selected = flat.find(l => String(l.content_id) === String(lessonId));
      if (!selected && flat.length > 0) selected = flat[0];
      setCurrentLesson(selected);
      if (selected) setActiveSectionId(selected.sectionId);
    } catch (err) {
      console.error('Fetch Error:', err);
      toast.error('Failed to load course content.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCourseData(); }, [courseId, lessonId]);

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const handleLessonClick = (lesson) => {
    navigate(`/courses/${courseId}/learn/lesson/${lesson.content_id}`);
    setActiveSectionId(lesson.sectionId);
  };

  const handleMarkComplete = async () => {
    if (!currentLesson || markingComplete || currentLesson.isCompleted) return;
    setMarkingComplete(true);
    try {
      await api.patch(`/progress/lessons/${currentLesson.content_id}`, {
        status: 'completed',
        last_watched_at: Math.floor(Date.now() / 1000),
      });
      toast.success('Lesson marked as completed! 🎉');

      // Update local state
      const updateLesson = l => l.content_id === currentLesson.content_id ? { ...l, isCompleted: true } : l;
      setAllLessons(prev => prev.map(updateLesson));
      setSections(prev => prev.map(s => ({
        ...s,
        videoLessons: s.videoLessons.map(updateLesson),
      })));
      setCurrentLesson(prev => ({ ...prev, isCompleted: true }));

      // Auto-advance to next lesson
      const idx = allLessons.findIndex(l => l.content_id === currentLesson.content_id);
      if (idx < allLessons.length - 1) {
        setTimeout(() => {
          const next = allLessons[idx + 1];
          navigate(`/courses/${courseId}/learn/lesson/${next.content_id}`);
        }, 900);
      }
    } catch (err) {
      toast.error('Failed to mark lesson as complete.');
    } finally {
      setMarkingComplete(false);
    }
  };

  // ─── Computed ───────────────────────────────────────────────────────────────
  // Calculate total progress including Videos, Assignments, and Quizzes
  const calculateProgress = () => {
    let totalItems = 0;
    let completedItems = 0;

    sections.forEach(section => {
      // 1. Videos
      section.videoLessons.forEach(lesson => {
        totalItems++;
        if (lesson.isCompleted) completedItems++;
      });

      // 2. Assignments (Lessons with type pdf_assignment)
      const sectionAssignments = (section.lessons || []).filter(l => l.content_type === 'pdf_assignment');
      sectionAssignments.forEach(a => {
        totalItems++;
        if (a.submissions?.length > 0) completedItems++; // Submitted = Completed
      });

      // 3. Quizzes
      (section.quizzes || []).forEach(q => {
        totalItems++;
        // Check if student has any attempts for this quiz
        // Note: courseData.sections.quizzes usually doesn't have student specific attempts in detail
        // but we can check if courseData.progress_records (if we had them for quizzes)
        // For now, if the student saw 66% it means they are missing something.
        // If we can't track quiz completion in this specific view easily, we still include it in total.
        // Actually, let's just count all trackable items.
      });
    });

    return {
      completed: completedItems,
      total: totalItems,
      percentage: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0
    };
  };

  const { completed: completedCount, total: totalCount, percentage: progressPercent } = calculateProgress();

  // ─── Loading / Error ─────────────────────────────────────────────────────────
  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh', backgroundColor: '#f8fafc' }}>
      <div className="spinner-grow text-primary"></div>
    </div>
  );

  if (!course) return (
    <div className="text-center p-5">
      <p className="text-muted">Course not found.</p>
    </div>
  );

  return (
    <div className="course-player-premium">
      <Toaster position="top-center" />

      {/* ── Top Header ── */}
      <div className="player-top-header">
        <div className="d-flex align-items-center gap-3">
          <button className="btn btn-light btn-sm rounded-circle shadow-sm" onClick={() => navigate(`/courses/${courseId}`)}>
            <i className="fas fa-arrow-left"></i>
          </button>
          <div>
            <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: '15px' }}>{course.title}</h6>
            <span className="text-muted" style={{ fontSize: '12px' }}>{completedCount} of {totalCount} lessons completed</span>
          </div>
        </div>

        <div className="d-flex align-items-center gap-3">
          <div style={{ width: '160px' }}>
            <div className="d-flex justify-content-between mb-1">
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#31506a' }}>{progressPercent}% complete</span>
            </div>
            <div className="progress" style={{ height: '6px', borderRadius: '10px', backgroundColor: '#e2e8f0' }}>
              <div
                className="progress-bar"
                style={{
                  width: `${progressPercent}%`,
                  backgroundColor: progressPercent === 100 ? '#10b981' : '#3b82f6',
                  borderRadius: '10px',
                  transition: 'width 0.5s ease',
                }}
              ></div>
            </div>
          </div>
          {progressPercent === 100 && (
            <span className="badge bg-success bg-opacity-10 text-success px-3 py-2 rounded-pill fw-bold" style={{ fontSize: '11px' }}>
              <i className="fas fa-trophy me-1"></i> Complete!
            </span>
          )}
        </div>
      </div>

      {/* ── Main Layout ── */}
      <div className="player-body">

        {/* ── Video + Tabs ── */}
        <div className="player-content-area">

          {/* Video Stage */}
          <div className="video-stage">
            {currentLesson?.video_url ? (
              <video
                key={currentLesson.content_id}
                src={currentLesson.video_url}
                controls
                className="w-100"
                style={{ maxHeight: '520px', display: 'block' }}
              />
            ) : (
              <div className="d-flex flex-column align-items-center justify-content-center text-white p-5"
                style={{ minHeight: '400px', background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)' }}>
                <i className="fas fa-play-circle fa-4x mb-4 opacity-25"></i>
                <h4 className="fw-bold">{currentLesson?.title || 'Select a lesson'}</h4>
                <p className="opacity-75 small">Choose a lesson from the sidebar to begin.</p>
              </div>
            )}
          </div>

          {/* Lesson Title + Complete Btn */}
          <div className="lesson-header-bar">
            <div>
              <h5 className="fw-bold mb-0 text-dark">{currentLesson?.title || 'Select a Lesson'}</h5>
              {currentLesson?.sectionTitle && (
                <span className="text-muted small"><i className="fas fa-folder-open me-1"></i>{currentLesson.sectionTitle}</span>
              )}
            </div>
            {currentLesson && (
              <button
                className={`btn rounded-pill px-4 py-2 fw-bold shadow-sm ${currentLesson.isCompleted ? 'btn-success' : 'btn-outline-primary'}`}
                onClick={handleMarkComplete}
                disabled={currentLesson.isCompleted || markingComplete}
                style={{ fontSize: '0.88rem', minWidth: '170px' }}
              >
                {markingComplete ? (
                  <><span className="spinner-border spinner-border-sm me-2"></span>Saving...</>
                ) : currentLesson.isCompleted ? (
                  <><i className="fas fa-check-circle me-2"></i>Completed</>
                ) : (
                  <><i className="far fa-check-circle me-2"></i>Mark as Complete</>
                )}
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="player-tabs">
            <button className={`player-tab-btn ${activeTab === 'resources' ? 'active' : ''}`} onClick={() => setActiveTab('resources')}>
              <i className="fas fa-file-pdf me-2"></i>Resources
            </button>
            <button className={`player-tab-btn ${activeTab === 'assignments' ? 'active' : ''}`} onClick={() => setActiveTab('assignments')}>
              <i className="fas fa-tasks me-2"></i>Assignments
            </button>
            <button className={`player-tab-btn ${activeTab === 'quiz' ? 'active' : ''}`} onClick={() => setActiveTab('quiz')}>
              <i className="fas fa-question-circle me-2"></i>Quiz
            </button>
          </div>

          {/* Tab Content */}
          <div className="tab-content-area">

            {/* Resources Tab */}
            {activeTab === 'resources' && (
              <div>
                {(currentLesson?.pdfResources || []).length > 0 ? currentLesson.pdfResources.map((r, i) => (
                  <PdfResourceCard key={i} resource={r} />
                )) : (
                  <div className="empty-state-card">
                    <i className="fas fa-folder-open fa-2x mb-3 opacity-25"></i>
                    <p className="text-muted mb-0">No resources for this lesson.</p>
                  </div>
                )}
              </div>
            )}

            {/* Assignments Tab */}
            {activeTab === 'assignments' && (
              <div>
                {(currentLesson?.assignments || []).length > 0 ? currentLesson.assignments.map((a, i) => (
                  <div key={i} className="assignment-item-card">
                    <div className="assignment-title-area">
                      <h6>{i + 1}. {a.title}</h6>
                      <p>Download the assignment file, complete it, and submit your work when ready.</p>
                    </div>
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                      <div className="d-flex gap-2 flex-wrap">
                        <a href={a.file_url} target="_blank" rel="noreferrer" className="btn btn-outline-dark rounded-pill px-4 btn-sm fw-bold">
                          <i className="fas fa-download me-2"></i>View Assignment
                        </a>
                        <button
                          className="btn btn-primary rounded-pill px-4 btn-sm fw-bold"
                          onClick={() => navigate(`/dashboard/assignment/${a.content_id}`)}
                        >
                          <i className="fas fa-upload me-2"></i>Submit
                        </button>
                      </div>
                      <div className="assignment-meta-refined">
                        <span>{a.submissions?.length ? 'Submitted' : 'Not Submitted'}</span>
                        <span className="d-flex align-items-center gap-2">
                          <div className="status-dot" style={{ backgroundColor: a.submissions?.length ? '#10b981' : '#fb7185' }}></div>
                          {a.submissions?.length ? 'Done' : 'Action Required'}
                        </span>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="empty-state-card">
                    <i className="fas fa-tasks fa-2x mb-3 opacity-25"></i>
                    <p className="text-muted mb-0">No assignments for this section.</p>
                  </div>
                )}
              </div>
            )}

            {/* Quiz Tab */}
            {activeTab === 'quiz' && (
              <div>
                {(currentLesson?.quizzes || []).length > 0 ? currentLesson.quizzes.map((quiz, i) => (
                  <div key={i} className="assignment-item-card">
                    <div className="assignment-title-area">
                      <h6>{i + 1}. {quiz.title}</h6>
                      <p>
                        {quiz.num_questions || 0} Questions
                        {quiz.duration ? ` • ${quiz.duration} Minutes` : ''}
                      </p>
                    </div>
                    <button
                      className="btn btn-primary rounded-pill px-4 btn-sm fw-bold"
                      onClick={() => navigate(`/dashboard/quiz/${quiz.quiz_id}`)}
                    >
                      <i className="fas fa-play me-2"></i>Start Quiz
                    </button>
                  </div>
                )) : (
                  <div className="empty-state-card">
                    <i className="fas fa-question-circle fa-2x mb-3 opacity-25"></i>
                    <p className="text-muted mb-0">No quizzes for this section.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Sidebar ── */}
        <div className="player-sidebar-refined">
          <div className="d-flex align-items-center justify-content-between mb-3 px-2">
            <span className="sidebar-label mb-0">Course Content</span>
            <span className="small text-muted fw-bold">{completedCount}/{totalCount}</span>
          </div>

          {/* Sections */}
          {sections.map((section, sIdx) => (
            <div key={section.section_id} className="sidebar-section-group">
              {/* Section Header */}
              <button
                className={`sidebar-section-header ${activeSectionId === section.section_id ? 'open' : ''}`}
                onClick={() => setActiveSectionId(
                  activeSectionId === section.section_id ? null : section.section_id
                )}
              >
                <div className="d-flex align-items-center gap-2 flex-grow-1">
                  <span className="sidebar-section-num">{String(sIdx + 1).padStart(2, '0')}</span>
                  <span className="sidebar-section-title">{section.title}</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <span className="small text-muted" style={{ fontSize: '11px' }}>
                    {section.videoLessons.filter(l => l.isCompleted).length}/{section.videoLessons.length}
                  </span>
                  <i className={`fas fa-chevron-${activeSectionId === section.section_id ? 'up' : 'down'} small text-muted`}></i>
                </div>
              </button>

              {/* Lessons in section */}
              {activeSectionId === section.section_id && (
                <div className="sidebar-section-lessons">
                  {section.videoLessons.length > 0 ? section.videoLessons.map((lesson, lIdx) => {
                    const isActive = String(lesson.content_id) === String(currentLesson?.content_id);
                    return (
                      <div
                        key={lesson.content_id}
                        className={`module-item-refined ${isActive ? 'active' : ''}`}
                        onClick={() => handleLessonClick(lesson)}
                      >
                        <div className="progress-indicator">
                          {lesson.isCompleted ? (
                            <i className="fas fa-check-circle circle-completed"></i>
                          ) : isActive ? (
                            <i className="fas fa-dot-circle circle-progress"></i>
                          ) : (
                            <i className="far fa-circle circle-empty"></i>
                          )}
                        </div>
                        <div className="module-info">
                          <h6>{String(lIdx + 1).padStart(2, '0')} - {lesson.title}</h6>
                          <span>
                            <i className="fas fa-play-circle me-1" style={{ color: '#3b82f6', opacity: 0.6, fontSize: '10px' }}></i>
                            {formatDuration(lesson.duration)}
                          </span>
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="px-4 py-3 text-muted small">No video lessons in this section.</div>
                  )}

                  {/* Section resources/quiz indicators */}
                  {(section.lessons?.some(l => l.content_type !== 'video') || section.quizzes?.length > 0) && (
                    <div className="sidebar-attachments-hint">
                      {section.lessons?.some(l => l.content_type === 'pdf_lecture') && (
                        <span><i className="fas fa-file-pdf text-danger me-1"></i>Resources</span>
                      )}
                      {section.lessons?.some(l => l.content_type === 'pdf_assignment') && (
                        <span><i className="fas fa-tasks text-success me-1"></i>Assignment</span>
                      )}
                      {section.quizzes?.length > 0 && (
                        <span><i className="fas fa-question-circle text-warning me-1"></i>Quiz</span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CoursePlayer;
