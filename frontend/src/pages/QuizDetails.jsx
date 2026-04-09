import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { quizService } from '../services';
import Sidebar from '../components/Sidebar';
import ProfileSidebar from '../components/ProfileSidebar';
import '../styles/Dashboard.css';

const QuizDetails = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [quizInfo, setQuizInfo] = useState({
    title: "UI UX Quiz One",
    duration: "10 minutes",
    count: 15,
    score: 1,
    description: "Quiz on UI UX Design"
  });

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        if (!id) return; // If accessed without ID, gracefully default to dummy
        
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
        }
      } catch (error) {
        console.warn("Failed to fetch live quiz from server, falling back to dummy", error);
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
              <span>quiz one</span>
            </div>

            <div className="quiz-card-border" style={{ border: '1px solid #f1f1f3', borderRadius: '15px', padding: '40px' }}>
              {/* Header */}
              <h1 className="quiz-header-title">{quizInfo.title}</h1>

              {/* Meta */}
              <div className="quiz-meta-info">
                <div className="meta-item">
                  <i className="far fa-calendar-alt"></i>
                  <span>00 / 00 / 0000</span>
                </div>
                <div className="meta-item">
                  <i className="far fa-clock"></i>
                  <span>00 : 00</span>
                </div>
              </div>

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
              <button className="btn-start-quiz">
                <i className="fas fa-pen-nib"></i>
                Start
              </button>
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
