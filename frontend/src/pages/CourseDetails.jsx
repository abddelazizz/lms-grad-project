import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { courseService, enrollmentService } from '../services';
import toast, { Toaster } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import '../styles/CourseDetailsDesign.css';

const formatDuration = (seconds) => {
  if (!seconds || seconds === 0) return null;
  const s = Number(seconds);
  if (isNaN(s)) return null;
  const m = Math.floor(s / 60);
  const rem = Math.floor(s % 60);
  if (m === 0) return `${rem}s`;
  return rem > 0 ? `${m}m ${rem}s` : `${m}m`;
};

const CourseDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  const fetchCourse = async () => {
    try {
      const response = await courseService.getDetailedCourse(id);
      if (response.data?.data?.course) {
        setCourse(response.data.data.course);
      }
    } catch (error) {
      console.error('Failed to fetch course details', error);
      toast.error("Failed to load course details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCourse(); }, [id]);

  const handleEnroll = async () => {
    if (!user) {
      toast.error("Please login to enroll.");
      navigate('/login');
      return;
    }
    if (user.role !== 'student') {
      toast.error("Only students can enroll in courses.");
      return;
    }
    setEnrolling(true);
    try {
      await enrollmentService.enroll(id);
      toast.success("🎉 Successfully enrolled! Let's start learning.");
      fetchCourse();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to enroll.");
    } finally {
      setEnrolling(false);
    }
  };

  // Computed stats
  const totalLessons = course?.sections?.reduce((acc, s) =>
    acc + (s.lessons?.filter(l => l.content_type === 'video')?.length || 0), 0) || 0;
  const totalDuration = course?.sections?.reduce((acc, s) =>
    acc + (s.lessons?.reduce((a, l) => a + (l.duration || 0), 0) || 0), 0) || 0;
  const totalHours = Math.floor(totalDuration / 3600);
  const totalMinutes = Math.floor((totalDuration % 3600) / 60);

  if (loading) {
    return (
      <div className="cd-page d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="spinner-grow text-primary" role="status"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="cd-page container py-5 text-center">
        <h2 className="fw-bold">Course not found.</h2>
        <Link to="/courses" className="btn btn-dark rounded-pill mt-3 px-5">Back to Courses</Link>
      </div>
    );
  }

  return (
    <div className="cd-page">
      <Toaster position="top-center" />

      {/* ── Hero Banner ── */}
      <section className="cd-hero">
        <div className="cd-container">
          <div className="cd-hero-inner">
            {/* Left: Text */}
            <div className="cd-hero-text">
              {/* Breadcrumb */}
              <div className="cd-breadcrumb">
                <Link to="/courses">Courses</Link>
                <i className="fas fa-chevron-right"></i>
                <span>{course.title}</span>
              </div>

              {/* Badges */}
              <div className="d-flex gap-2 mb-3 flex-wrap">
                {course.level && (
                  <span className="cd-badge cd-badge-level">{course.level}</span>
                )}
                {course.status === 'published' && (
                  <span className="cd-badge cd-badge-published"><i className="fas fa-circle-check me-1"></i>Published</span>
                )}
                <span className="cd-badge cd-badge-free">
                  {parseFloat(course.price) > 0 ? `$${parseFloat(course.price).toFixed(2)}` : 'Free'}
                </span>
              </div>

              <h1 className="cd-hero-title">{course.title}</h1>
              <p className="cd-hero-desc">
                {course.description || "Welcome to this comprehensive course! Dive into practical learning and build real-world skills from day one."}
              </p>

              {/* Quick Stats */}
              <div className="cd-stats-row">
                <div className="cd-stat">
                  <i className="fas fa-play-circle"></i>
                  <span><strong>{totalLessons}</strong> Video Lessons</span>
                </div>
                {(totalHours > 0 || totalMinutes > 0) && (
                  <div className="cd-stat">
                    <i className="fas fa-clock"></i>
                    <span>
                      <strong>{totalHours > 0 ? `${totalHours}h ` : ''}{totalMinutes}m</strong> Total
                    </span>
                  </div>
                )}
                <div className="cd-stat">
                  <i className="fas fa-layer-group"></i>
                  <span><strong>{course.sections?.length || 0}</strong> Sections</span>
                </div>
                <div className="cd-stat">
                  <i className="fas fa-user"></i>
                  <span>By <strong>{course.instructor?.name || 'Instructor'}</strong></span>
                </div>
              </div>

              {/* Scroll to Curriculum Button */}
              <div className="mt-3">
                <button
                  className="cd-curriculum-btn"
                  onClick={() => document.getElementById('curriculum')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  <span className="cd-curriculum-btn-inner">
                    <i className="fas fa-layer-group"></i>
                    <span>Explore Course Curriculum</span>
                    <i className="fas fa-arrow-down cd-curriculum-btn-arrow"></i>
                  </span>
                </button>
              </div>

              {/* Enrolled CTA (mobile) */}
              <div className="cd-mobile-cta">
                {course.isEnrolled ? (
                  <button
                    className="btn cd-btn-continue w-100"
                    onClick={() => navigate(`/courses/${course.course_id}/learn`)}
                  >
                    <i className="fas fa-play me-2"></i>Continue Learning
                  </button>
                ) : (
                  <button
                    className="btn cd-btn-enroll w-100"
                    onClick={handleEnroll}
                    disabled={enrolling}
                  >
                    {enrolling
                      ? <><span className="spinner-border spinner-border-sm me-2"></span>Processing...</>
                      : <><i className="fas fa-graduation-cap me-2"></i>Enroll Now — It's Free</>
                    }
                  </button>
                )}
              </div>
            </div>

            {/* Right: Enrollment Card */}
            <div className="cd-enroll-card-wrap">
              <div className="cd-enroll-card">
                {/* Thumbnail */}
                <div className="cd-card-thumb">
                  <img
                    src={course.thumbnail_url || 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&q=80&w=800'}
                    alt={course.title}
                  />
                  <div className="cd-thumb-play" onClick={() => course.isEnrolled && navigate(`/courses/${course.course_id}/learn`)}>
                    <i className="fas fa-play"></i>
                  </div>
                </div>

                {/* Card Body */}
                <div className="cd-card-body">
                  <div className="cd-price-row">
                    <span className="cd-price">
                      {parseFloat(course.price) > 0 ? `$${parseFloat(course.price).toFixed(2)}` : 'Free'}
                    </span>
                  </div>

                  {/* CTA Button */}
                  {course.isEnrolled ? (
                    <button
                      className="btn cd-btn-continue w-100 mb-3"
                      onClick={() => navigate(`/courses/${course.course_id}/learn`)}
                    >
                      <i className="fas fa-play me-2"></i>Continue Learning
                    </button>
                  ) : (
                    <>
                      <button
                        className="btn cd-btn-enroll w-100 mb-3"
                        onClick={handleEnroll}
                        disabled={enrolling}
                      >
                        {enrolling
                          ? <><span className="spinner-border spinner-border-sm me-2"></span>Processing...</>
                          : <><i className="fas fa-graduation-cap me-2"></i>Enroll Now</>
                        }
                      </button>
                      {!user && (
                        <p className="text-center text-muted small mb-3">
                          <Link to="/login" className="fw-bold text-dark">Login</Link> to enroll in this course
                        </p>
                      )}
                    </>
                  )}

                  {/* Course Includes */}
                  <div className="cd-includes">
                    <p className="cd-includes-title">This course includes:</p>
                    <ul className="cd-includes-list">
                      <li><i className="fas fa-play-circle text-primary"></i>{totalLessons} video lessons</li>
                      {(totalHours > 0 || totalMinutes > 0) && (
                        <li><i className="fas fa-clock text-primary"></i>
                          {totalHours > 0 ? `${totalHours}h ` : ''}{totalMinutes}m of content
                        </li>
                      )}
                      <li><i className="fas fa-layer-group text-primary"></i>{course.sections?.length || 0} sections</li>
                      <li><i className="fas fa-infinity text-primary"></i>Full lifetime access</li>
                      <li><i className="fas fa-mobile-alt text-primary"></i>Access on mobile & desktop</li>
                    </ul>
                  </div>

                  {/* Instructor Info */}
                  {course.instructor && (
                    <div className="cd-instructor-block">
                      <p className="cd-includes-title mb-2">Instructor</p>
                      <div className="d-flex align-items-center gap-3">
                        {course.instructor.picture ? (
                          <img
                            src={course.instructor.picture}
                            alt={course.instructor.name}
                            style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #e2e8f0' }}
                          />
                        ) : (
                          <div style={{
                            width: '44px', height: '44px', borderRadius: '50%',
                            backgroundColor: '#31506a', color: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 700, fontSize: '18px', flexShrink: 0,
                          }}>
                            {course.instructor.name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="fw-bold text-dark" style={{ fontSize: '14px' }}>{course.instructor.name}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Curriculum ── */}
      <section className="cd-curriculum" id="curriculum">
        <div className="cd-container">
          <div className="cd-section-header">
            <h2 className="cd-section-title">Course Curriculum</h2>
            <p className="cd-section-sub">
              {course.sections?.length || 0} sections • {totalLessons} lessons
              {(totalHours > 0 || totalMinutes > 0) && ` • ${totalHours > 0 ? `${totalHours}h ` : ''}${totalMinutes}m total`}
            </p>
          </div>

          <div className="cd-accordion">
            {course.sections && course.sections.length > 0 ? course.sections.map((section, idx) => {
              const videoLessons = section.lessons?.filter(l => l.content_type === 'video') || [];
              const sectionDuration = section.lessons?.reduce((a, l) => a + (l.duration || 0), 0) || 0;
              const sectionMin = Math.floor(sectionDuration / 60);
              return (
                <details key={section.section_id} className="cd-section-item" open={idx === 0}>
                  <summary className="cd-section-summary">
                    <div className="d-flex align-items-center gap-3 flex-grow-1">
                      <span className="cd-section-num">{String(idx + 1).padStart(2, '0')}</span>
                      <span className="cd-section-name">{section.title}</span>
                    </div>
                    <div className="cd-section-meta">
                      <span>{videoLessons.length} lesson{videoLessons.length !== 1 ? 's' : ''}</span>
                      {sectionMin > 0 && <span>{sectionMin}m</span>}
                      <i className="fas fa-chevron-down cd-chevron"></i>
                    </div>
                  </summary>

                  <div className="cd-lesson-list">
                    {videoLessons.length > 0 ? videoLessons.map((lesson, lIdx) => (
                      <div
                        key={lesson.content_id}
                        className={`cd-lesson-item ${course.isEnrolled || lesson.is_free_preview ? 'clickable' : ''}`}
                        onClick={() => {
                          if (course.isEnrolled) {
                            navigate(`/courses/${course.course_id}/learn/lesson/${lesson.content_id}`);
                          } else if (lesson.is_free_preview) {
                            navigate(`/courses/${course.course_id}/learn/lesson/${lesson.content_id}`);
                          } else {
                            toast.error("Enroll to access this lesson.");
                          }
                        }}
                      >
                        <div className="cd-lesson-icon">
                          {lesson.is_free_preview ? (
                            <i className="fas fa-play-circle text-primary"></i>
                          ) : course.isEnrolled ? (
                            <i className="fas fa-play-circle text-primary"></i>
                          ) : (
                            <i className="fas fa-lock text-muted"></i>
                          )}
                        </div>
                        <div className="cd-lesson-info">
                          <span className="cd-lesson-title">{lesson.title}</span>
                          {lesson.is_free_preview && !course.isEnrolled && (
                            <span className="cd-free-badge">Preview</span>
                          )}
                        </div>
                        <div className="cd-lesson-dur">
                          {formatDuration(lesson.duration) && (
                            <span><i className="far fa-clock me-1"></i>{formatDuration(lesson.duration)}</span>
                          )}
                        </div>
                      </div>
                    )) : (
                      <div className="cd-lesson-empty">No lessons in this section yet.</div>
                    )}

                    {/* Attachments hint */}
                    {section.lessons?.some(l => l.content_type !== 'video') && (
                      <div className="cd-attachments-row">
                        {section.lessons?.some(l => l.content_type === 'pdf_lecture') && (
                          <span className="cd-attach-badge"><i className="fas fa-file-pdf me-1 text-danger"></i>PDF Resource</span>
                        )}
                        {section.lessons?.some(l => l.content_type === 'pdf_assignment') && (
                          <span className="cd-attach-badge"><i className="fas fa-tasks me-1 text-success"></i>Assignment</span>
                        )}
                        {section.quizzes?.length > 0 && (
                          <span className="cd-attach-badge"><i className="fas fa-question-circle me-1 text-warning"></i>Quiz</span>
                        )}
                      </div>
                    )}
                  </div>
                </details>
              );
            }) : (
              <div className="text-center py-5 text-muted">
                <i className="fas fa-book-open fa-2x mb-3 d-block opacity-25"></i>
                Curriculum is being prepared by the instructor.
              </div>
            )}
          </div>

          {/* Bottom CTA */}
          {!course.isEnrolled && (
            <div className="cd-bottom-cta">
              <div className="cd-bottom-cta-inner">
                <div>
                  <h4 className="fw-bold mb-1">Ready to start learning?</h4>
                  <p className="text-muted mb-0">Join this course and gain full access to all lessons and resources.</p>
                </div>
                <button
                  className="btn cd-btn-enroll px-5 py-3 flex-shrink-0"
                  onClick={handleEnroll}
                  disabled={enrolling}
                >
                  {enrolling
                    ? <><span className="spinner-border spinner-border-sm me-2"></span>Processing...</>
                    : <><i className="fas fa-graduation-cap me-2"></i>Enroll Now</>
                  }
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default CourseDetails;
