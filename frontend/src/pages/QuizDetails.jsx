import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { quizService } from '../services';
import Sidebar from '../components/Sidebar';
import ProfileSidebar from '../components/ProfileSidebar';
import Swal from 'sweetalert2';
import '../styles/Dashboard.css';

const QuizDetails = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [quizInfo, setQuizInfo] = useState({
    title: "Loading...",
    duration: "N/A",
    count: 0,
    score: 0,
    description: "Please wait while we load the quiz."
  });
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [resultScore, setResultScore] = useState(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        if (!id) return;
        
        const response = await quizService.getQuiz(id);
        const fetchedQuiz = response.data?.data?.quiz;
        
        if (fetchedQuiz) {
          let numQuestions = 0;
          try {
            const qs = typeof fetchedQuiz.questions_json === 'string' 
              ? JSON.parse(fetchedQuiz.questions_json) 
              : fetchedQuiz.questions_json;
            if (Array.isArray(qs)) numQuestions = qs.length;
          } catch(e) {}
          
          setQuizInfo({
            title: fetchedQuiz.title || "Untitled Quiz",
            duration: "Self-Paced", 
            count: numQuestions || 0,
            score: 1, // Score per question
            description: "A comprehensive assessment loaded from the server."
          });
          
          if (Array.isArray(fetchedQuiz.questions_json)) {
            setQuestions(fetchedQuiz.questions_json);
          } else if (typeof fetchedQuiz.questions_json === 'string') {
            try {
              setQuestions(JSON.parse(fetchedQuiz.questions_json));
            } catch(e) {}
          }
        }
      } catch (error) {
        console.error("Failed to fetch live quiz from server", error);
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [id]);

  if (loading && id) {
    return (
      <div className="dashboard-page d-flex justify-content-center align-items-center" style={{ minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
        <div className="spinner-border text-primary" role="status"></div>
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

                  {/* Description */}
                  <div className="quiz-description-container">
                    <div className="description-header">Description</div>
                    <div className="description-body">
                      {quizInfo.description}
                    </div>
                  </div>

                  {/* Start Button */}
                  <button className="btn-start-quiz" onClick={() => setStarted(true)}>
                    <i className="fas fa-pen-nib"></i>
                    Start
                  </button>
                </>
              ) : resultScore !== null ? (
                <div className="text-center py-5">
                  <h2 className="display-4 fw-bold text-success mb-3">Quiz Completed!</h2>
                  <p className="fs-4">Your Score: <strong>{resultScore}</strong> / {questions.length}</p>
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
                              checked={answers[idx] === opt}
                              onChange={() => setAnswers({ ...answers, [idx]: opt })}
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
                        const res = await quizService.submitQuiz(id, { answers });
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
