import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ProfileSidebar from '../components/ProfileSidebar';
import MobileNavbar from '../components/MobileNavbar';
import { courseService } from '../services';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Dashboard.css';

const StudentQuizzes = () => {
  const navigate = useNavigate();
  const { api } = useAuth();
  const [loading, setLoading] = useState(true);
  const [quizzes, setQuizzes] = useState([]);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        // Step 1: Get enrolled courses
        const coursesRes = await courseService.getMyCourses();
        const courses = coursesRes.data?.data?.courses || [];

        // Step 2: Fetch details for each course to get sections + quizzes
        const allQuizzes = [];
        await Promise.all(
          courses.map(async (course) => {
            try {
              const detailRes = await api.get(`/courses/${course.course_id}/details`);
              const sections = detailRes.data?.data?.course?.sections || [];
              sections.forEach((section) => {
                (section.quizzes || []).forEach((quiz) => {
                  if (quiz.status === 'published') {
                    allQuizzes.push({
                      ...quiz,
                      courseName: course.title,
                      courseId: course.course_id,
                      sectionName: section.title,
                    });
                  }
                });
              });
            } catch (e) {
              // silently skip courses that fail
            }
          })
        );

        setQuizzes(allQuizzes);
      } catch (err) {
        console.error('Failed to load quizzes', err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuizzes();
  }, [api]);

  return (
    <div className="dashboard-page">
      <MobileNavbar placeholder="Search quizzes..." />
      <div className="dashboard-layout">
        <Sidebar activePath="/dashboard/quizzes" />

        <main className="main-dashboard-content w-100 p-4">
          <div className="container-fluid max-width-custom pt-5 mt-4 mx-auto">

            {/* Header */}
            <div className="d-flex align-items-center justify-content-between mb-4">
              <div>
                <h4 className="fw-bold mb-1" style={{ fontSize: '22px', color: '#1a1d20' }}>
                  My Quizzes
                </h4>
                <p className="text-muted mb-0" style={{ fontSize: '13px' }}>
                  All available quizzes from your enrolled courses
                </p>
              </div>
              {!loading && (
                <span className="text-muted" style={{ fontSize: '13px' }}>
                  {quizzes.length} quiz{quizzes.length !== 1 ? 'zes' : ''} found
                </span>
              )}
            </div>

            {/* Content */}
            {loading ? (
              <div className="text-center p-5 text-muted">
                <div className="spinner-border spinner-border-sm me-2"></div>
                Loading quizzes...
              </div>
            ) : quizzes.length === 0 ? (
              <div className="d-flex flex-column align-items-center justify-content-center p-5 bg-white rounded-5 shadow-sm border-0" style={{ minHeight: '400px' }}>
                <div className="bg-light rounded-circle d-flex align-items-center justify-content-center mb-4" style={{ width: '100px', height: '100px' }}>
                  <i className="fas fa-tasks text-muted opacity-50" style={{ fontSize: '40px' }}></i>
                </div>
                <h4 className="fw-bold text-dark mb-2">No Quizzes Available Yet</h4>
                <p className="text-muted text-center mx-auto mb-4" style={{ maxWidth: '400px', fontSize: '15px' }}>
                  You don't have any pending quizzes at the moment. Enroll in more courses or check back later when your instructors publish new quizzes.
                </p>
                <button
                  className="btn btn-primary-custom rounded-pill px-5 py-3 fw-bold shadow-sm transition-all"
                  onClick={() => navigate('/courses')}
                  style={{ letterSpacing: '0.5px' }}
                >
                  <i className="fas fa-search me-2"></i>Explore New Courses
                </button>
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {quizzes.map((quiz, i) => (
                  <div
                    key={quiz.quiz_id || i}
                    style={{
                      backgroundColor: '#fff',
                      border: '1px solid #f1f1f3',
                      borderRadius: '14px',
                      padding: '20px 24px',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                      {/* Left: icon + info */}
                      <div className="d-flex align-items-center gap-3">
                        <div style={{
                          width: '48px', height: '48px', borderRadius: '12px',
                          backgroundColor: '#f0f4ff', display: 'flex',
                          alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                          <i className="fas fa-vial" style={{ color: '#31506a', fontSize: '18px' }}></i>
                        </div>
                        <div>
                          <div style={{ fontWeight: '600', fontSize: '15px', color: '#1a1d20' }}>
                            {quiz.title}
                          </div>
                          <div style={{ fontSize: '12px', color: '#888', marginTop: '3px' }}>
                            <i className="fas fa-book me-1"></i>{quiz.courseName}
                            <span className="mx-2">·</span>
                            <i className="fas fa-layer-group me-1"></i>{quiz.sectionName}
                          </div>
                        </div>
                      </div>

                      {/* Right: stats + button */}
                      <div className="d-flex align-items-center gap-4 flex-wrap">
                        <div className="text-center">
                          <div style={{ fontSize: '11px', color: '#aaa', fontWeight: '600' }}>QUESTIONS</div>
                          <div style={{ fontSize: '14px', fontWeight: '700', color: '#31506a' }}>
                            {quiz.num_questions || '?'}
                          </div>
                        </div>
                        <div className="text-center">
                          <div style={{ fontSize: '11px', color: '#aaa', fontWeight: '600' }}>DURATION</div>
                          <div style={{ fontSize: '14px', fontWeight: '700', color: '#31506a' }}>
                            {quiz.duration ? `${quiz.duration} Min` : 'Open'}
                          </div>
                        </div>
                        <button
                          className="btn fw-bold px-4 py-2 rounded-pill text-white"
                          style={{ backgroundColor: '#31506a', fontSize: '13px', minWidth: '120px' }}
                          onClick={() => navigate(`/dashboard/quiz/${quiz.quiz_id}`)}
                        >
                          <i className="fas fa-play me-2"></i>Start Quiz
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>

        <ProfileSidebar />
      </div>
    </div>
  );
};

export default StudentQuizzes;
