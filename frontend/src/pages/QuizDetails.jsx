import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { quizService } from '../services';
import Sidebar from '../components/Sidebar';
import ProfileSidebar from '../components/ProfileSidebar';
import Swal from 'sweetalert2';
import '../styles/Dashboard.css';

const QuizDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quizInfo, setQuizInfo] = useState({
    title: "Loading...",
    duration: "N/A",
    count: 0,
    score: 1
  });
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [resultScore, setResultScore] = useState(null);
  const [started, setStarted] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [realTimeTaken, setRealTimeTaken] = useState(0);

  const formatSeconds = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        if (!id) return;
        
        const response = await quizService.getQuiz(id);
        // Backend returns: { status, data: { quiz: { quiz_id, title, duration, questions, ... } } }
        const fetchedQuiz = response.data?.data?.quiz;
        
        if (fetchedQuiz) {
          // Backend returns `questions` array directly (not questions_json)
          const qs = fetchedQuiz.questions || [];
          
          setQuizInfo({
            title: fetchedQuiz.title || "Untitled Quiz",
            duration: fetchedQuiz.duration ? `${fetchedQuiz.duration} Mins` : "Self-Paced",
            count: Array.isArray(qs) ? qs.length : (fetchedQuiz.num_questions || 0),
            score: fetchedQuiz.score_per_question || 1
          });
          
          if (Array.isArray(qs) && qs.length > 0) {
            setQuestions(qs);
          }
        }
      } catch (error) {
        console.error("Failed to fetch quiz from server", error);
        setError(error?.response?.data?.message || "Quiz not found or not available.");
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [id]);

  if (loading) {
    return (
      <div className="dashboard-page d-flex justify-content-center align-items-center" style={{ minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-page d-flex justify-content-center align-items-center" style={{ minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
        <div className="text-center p-5 bg-white rounded-4 shadow-sm" style={{ maxWidth: '450px' }}>
          <i className="fas fa-exclamation-circle fa-3x mb-3" style={{ color: '#ef4444' }}></i>
          <h5 className="fw-bold mb-2">Quiz Unavailable</h5>
          <p className="text-muted mb-4">{error}</p>
          <button className="btn btn-dark rounded-pill px-4" onClick={() => navigate(-1)}>
            <i className="fas fa-arrow-left me-2"></i>Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-layout">
        
        {/* Left Sidebar Component */}
        <Sidebar />

        {/* Main Content */}
        <main className="main-dashboard-content">
          <div className="search-bar-wrapper">
            <i className="fas fa-search search-icon"></i>
            <input type="text" className="search-input" placeholder="Search your course here...." />
          </div>

          <div className="quiz-content-wrapper">
            {/* Breadcrumb */}
            <div className="quiz-breadcrumb">
              <span>Quiz</span>
              <i className="fas fa-chevron-right"></i>
              <span>{quizInfo.title}</span>
            </div>

            <div className="quiz-card-border" style={{ border: '1px solid #f1f1f3', borderRadius: '15px', padding: '40px' }}>
              {/* Header */}
              <h1 className="quiz-header-title">{quizInfo.title}</h1>

              {/* Meta */}
              <div className="quiz-meta-info">
                <div className="meta-item">
                  <i className="far fa-calendar-alt"></i>
                  <span>{quizInfo.date || 'No date set'}</span>
                </div>
                <div className="meta-item">
                  <i className="far fa-clock"></i>
                  <span>{quizInfo.duration}</span>
                </div>
              </div>

              {!started ? (
                <>
                  {/* Info Grid */}
                  <div className="quiz-details-grid">
                    <div className="quiz-detail-row">
                      <div className="detail-label">Duration</div>
                      <div className="detail-value">{quizInfo.duration}</div>
                    </div>
                    <div className="quiz-detail-row">
                      <div className="detail-label">Number of questions</div>
                      <div className="detail-value">{quizInfo.count}</div>
                    </div>
                    <div className="quiz-detail-row">
                      <div className="detail-label">Score per question</div>
                      <div className="detail-value">{quizInfo.score}</div>
                    </div>
                  </div>


                  {/* Start Button */}
                  <button className="btn-start-quiz" onClick={() => {
                    setStarted(true);
                    setStartTime(Date.now());
                  }}>
                    <i className="fas fa-pen-nib"></i>
                    Start
                  </button>
                </>
              ) : resultScore !== null ? (
                <div className="quiz-result-container text-center py-4">
                   <div className="d-flex align-items-center gap-2 mb-5" style={{ color: '#555', fontSize: '14px' }}>
                      <span className="fw-bold" style={{ color: '#1a1d20' }}>Result</span>
                      <i className="fas fa-angles-right" style={{ fontSize: '10px', color: '#31506a' }}></i>
                   </div>

                    <div className="result-score-circle">
                       <div className="percentage">
                         {(() => {
                           const totalPossible = questions.length * (quizInfo.score || 1);
                           return totalPossible > 0 ? Math.round((resultScore / totalPossible) * 100) : 0;
                         })()}%
                       </div>
                       <div className="score-text">
                         {quizInfo.score > 0 ? Math.round(resultScore / quizInfo.score) : 0} / {questions.length} CORRECT
                       </div>
                    </div>

                   <h3 className="fw-bold mb-2">Well done!</h3>
                   <p className="text-muted mb-5">You've successfully completed the quiz.</p>

                   <div className="d-flex justify-content-center gap-3 mb-5">
                      <button 
                        className="btn text-white px-4 py-3 fw-bold d-flex align-items-center gap-2" 
                        style={{ backgroundColor: '#31506a', borderRadius: '12px', minWidth: '200px' }}
                        onClick={() => navigate(`/dashboard/quiz/review/${id}`)}
                      >
                         <i className="fas fa-file-signature"></i>
                         Review Answers
                      </button>
                      <button 
                        className="btn px-4 py-3 fw-bold d-flex align-items-center gap-2" 
                        style={{ backgroundColor: '#dbeafe', color: '#1e40af', borderRadius: '12px', minWidth: '200px' }}
                        onClick={() => navigate('/dashboard')}
                      >
                         <i className="fas fa-arrow-left"></i>
                         Return to Course
                      </button>
                   </div>

                   <div className="vstack gap-3 mx-auto" style={{ maxWidth: '500px' }}>
                      <div className="result-card">
                         <div className="result-icon-wrapper correct">
                            <i className="fas fa-check"></i>
                         </div>
                         <div className="result-card-info text-start">
                            <div className="label">CORRECT</div>
                            <div className="value">{quizInfo.score > 0 ? Math.round(resultScore / quizInfo.score) : 0} Questions</div>
                         </div>
                      </div>

                      <div className="result-card">
                         <div className="result-icon-wrapper incorrect">
                            <i className="fas fa-times"></i>
                         </div>
                         <div className="result-card-info text-start">
                            <div className="label">INCORRECT</div>
                            <div className="value">{questions.length - (quizInfo.score > 0 ? Math.round(resultScore / quizInfo.score) : 0)} Questions</div>
                         </div>
                      </div>

                      <div className="result-card">
                         <div className="result-icon-wrapper time">
                            <i className="fas fa-stopwatch"></i>
                         </div>
                         <div className="result-card-info text-start">
                            <div className="label">TIME TAKEN</div>
                            <div className="value">{formatSeconds(realTimeTaken)}</div>
                         </div>
                      </div>
                   </div>
                </div>
              ) : (
                <div className="quiz-questions-container mt-4">
                  {questions.map((q, idx) => (
                    <div key={idx} className="mb-4 p-4 rounded-3 border bg-light">
                      <h5 className="fw-bold mb-3">{idx + 1}. {q.question}</h5>
                      <div className="d-flex flex-column gap-2">
                        {q.options?.map((opt, oIdx) => (
                          <label key={oIdx} className="d-flex align-items-center gap-2" style={{ cursor: 'pointer' }}>
                            <input 
                              type="radio" 
                              name={`question-${idx}`} 
                              value={opt}
                              checked={answers[q.id || idx] === opt}
                              onChange={() => setAnswers({ ...answers, [q.id || idx]: opt })}
                            />
                            {opt}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                  <button 
                    className="btn btn-primary-custom px-5 py-3 fw-bold rounded-3 mt-3 w-100"
                    onClick={async () => {
                      setSubmitting(true);
                      try {
                        const timeTaken = Math.floor((Date.now() - startTime) / 1000);
                        setRealTimeTaken(timeTaken);
                        const res = await quizService.submitQuiz(id, { 
                          answers, 
                          time_taken_seconds: timeTaken 
                        });
                        setResultScore(res.data?.data?.score || 0);
                      } catch (err) {
                        console.error(err);
                        Swal.fire({
                          icon: 'error',
                          title: 'Submission Failed',
                          text: 'Failed to submit quiz. Please check your connection and try again.',
                          confirmButtonColor: '#31506a'
                        });
                      } finally {
                        setSubmitting(false);
                      }
                    }}
                    disabled={submitting}
                  >
                    {submitting ? 'Submitting...' : 'Submit Answers'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Right Sidebar Profile Component */}
        <ProfileSidebar />

      </div>
    </div>
  );
};

export default QuizDetails;
