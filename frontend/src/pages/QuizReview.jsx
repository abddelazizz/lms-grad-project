import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ProfileSidebar from '../components/ProfileSidebar';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Dashboard.css';

const QuizReview = () => {
  const { id } = useParams();
  const { api } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [review, setReview] = useState(null);

  const fetchReview = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/quizzes/${id}/review`);
      setReview(res.data?.data);
    } catch (err) {
      console.error("Failed to fetch quiz review", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReview();
  }, [id]);

  if (loading) return <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>;
  if (!review) return <div className="text-center p-5">Review data not found.</div>;

  return (
    <div className="dashboard-page">
      <div className="dashboard-layout">
        <Sidebar activePath="/dashboard/quiz" />

        <div className="main-dashboard-content w-100 p-4">
          <div className="container-fluid max-width-custom pt-5 mt-4 mx-auto">
            {/* Breadcrumb Area */}
            <div className="d-flex align-items-center gap-2 mb-5" style={{ color: '#555', fontSize: '14px' }}>
              <span style={{ cursor: 'pointer' }} onClick={() => navigate(-1)}>Quiz Details</span>
              <i className="fas fa-angles-right" style={{ fontSize: '10px', color: '#31506a' }}></i>
              <span className="fw-bold" style={{ color: '#1a1d20' }}>Review answer</span>
            </div>

            <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-5">
              <div className="bg-primary-subtle p-5 d-flex align-items-center justify-content-between">
                <div>
                  <h2 className="fw-bold mb-1" style={{ color: '#1a1d20' }}>Quiz Review</h2>
                  <p className="text-muted mb-0">Review your performance and correct answers below.</p>
                </div>
                <div className="text-end">
                  <div className="text-muted small fw-bold mb-1">SCORE</div>
                  <h2 className="fw-bold text-primary m-0" style={{ fontSize: '32px' }}>{review.score}%</h2>
                  <span className={`badge rounded-pill ${review.score >= 50 ? 'bg-success' : 'bg-danger'} px-3 py-2 mt-2 shadow-sm`}>
                    {review.score >= 50 ? 'PASSED' : 'FAILED'}
                  </span>
                </div>
              </div>
            </div>

            <div className="vstack gap-4">
              {review.review?.map((ans, idx) => (
                <div key={idx} className="review-question-card">
                  <div className="d-flex gap-3 mb-4">
                    <div className="question-number-badge">
                      {idx + 1}
                    </div>
                    <div className="flex-grow-1">
                      <h5 className="fw-bold mb-0 mt-1" style={{ fontSize: '18px', color: '#1a1d20' }}>{ans.question}</h5>
                    </div>
                  </div>

                  <div className="vstack gap-2">
                    {ans.options?.map((opt, oIdx) => {
                      const isCorrect = opt === ans.correctAnswer;
                      const isSelected = opt === ans.studentAnswer;

                      let cardClass = "option-review-item ";
                      if (isCorrect) cardClass += "correct";
                      else if (isSelected && !isCorrect) cardClass += "wrong-selected";

                      return (
                        <div key={oIdx} className={cardClass}>
                          <span>{opt}</span>
                          {isCorrect && <i className="fas fa-check-circle fs-5"></i>}
                          {isSelected && !isCorrect && <i className="fas fa-times-circle fs-5"></i>}
                        </div>
                      );
                    })}
                  </div>

                  {ans.explanation && (
                    <div className="explanation-box">
                      <strong>EXPLANATION</strong>
                      <p>{ans.explanation}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <ProfileSidebar />
      </div>
    </div>
  );
};

export default QuizReview;
