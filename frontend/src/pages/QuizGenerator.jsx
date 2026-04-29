import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ProfileSidebar from '../components/ProfileSidebar';
import toast, { Toaster } from 'react-hot-toast';
import { quizService } from '../services';
import '../styles/Dashboard.css';

const QuizGenerator = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('');
  const [numQuestions, setNumQuestions] = useState('');
  const [scorePerQuestion, setScorePerQuestion] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!title || !duration || !numQuestions || !scorePerQuestion) {
      return toast.error("Please fill in all quiz details.");
    }
    
    setLoading(true);
    
    try {
      await quizService.generateQuiz({
        title,
        duration: parseInt(duration),
        numQuestions: parseInt(numQuestions),
        scorePerQuestion: parseInt(scorePerQuestion)
      });
      toast.success('Quiz generated successfully!');
      setTitle('');
      setDuration('');
      setNumQuestions('');
      setScorePerQuestion('');
      
      // Optionally redirect to instructor dashboard
      // navigate('/instructor');
    } catch (error) {
      console.error("Quiz generation failed", error);
      toast.error(error.response?.data?.message || "Failed to generate quiz.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-page">
      <Toaster position="top-center" />
      <div className="dashboard-layout">
        <Sidebar />

        <main className="main-dashboard-content w-100 p-4">
          <div className="container-fluid max-width-custom pt-5 mt-4 mx-auto">
            
            {/* Breadcrumb Area */}
            <div className="d-flex align-items-center gap-3 mb-5" style={{ color: '#000', fontSize: '16px', fontWeight: '500' }}>
              <span>Generate Quiz</span>
              <span className="text-primary-custom fw-bold" style={{ fontSize: '20px' }}>»</span>
              {title && <span className="text-muted fw-normal" style={{ fontSize: '14px' }}>{title}</span>}
            </div>

            <div className="bg-white p-5 rounded-4 shadow-sm border mx-auto" style={{ maxWidth: '850px' }}>
              
              {/* Title */}
              <h2 className="fw-bold mb-5" style={{ color: '#1a1d20', fontSize: '32px' }}>Quiz</h2>

              {/* Form View */}
              <div className="vstack gap-4 mb-5">
                <input 
                  type="text" 
                  className="form-control border bg-light-gray p-3 rounded-3" 
                  placeholder="Enter Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <input 
                  type="number" 
                  className="form-control border bg-light-gray p-3 rounded-3" 
                  placeholder="Enter Duration (minutes)"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
                <input 
                  type="number" 
                  className="form-control border bg-light-gray p-3 rounded-3" 
                  placeholder="Enter Number of Questions"
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(e.target.value)}
                />
                <input 
                  type="number" 
                  className="form-control border bg-light-gray p-3 rounded-3" 
                  placeholder="Enter Score Per Question"
                  value={scorePerQuestion}
                  onChange={(e) => setScorePerQuestion(e.target.value)}
                />
              </div>

              <div className="text-center mt-5">
                <button 
                  className="btn btn-primary-custom px-5 py-3 fw-bold rounded-3" 
                  onClick={handleGenerate} 
                  disabled={loading}
                  style={{ minWidth: '300px' }}
                >
                  {loading ? 'Generating...' : 'Generate Quiz with AI'}
                </button>
              </div>

            </div>
          </div>
        </main>

        <ProfileSidebar />
      </div>
    </div>
  );
};

export default QuizGenerator;
