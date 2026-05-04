import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ProfileSidebar from '../components/ProfileSidebar';
import toast, { Toaster } from 'react-hot-toast';
import { quizService, courseService, instructorService } from '../services';
import '../styles/Dashboard.css';

const QuizGenerator = () => {
  const navigate = useNavigate();

  // Form State
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('');
  const [numQuestions, setNumQuestions] = useState('5');
  const [scorePerQuestion, setScorePerQuestion] = useState('1');
  const [pdfFile, setPdfFile] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedSection, setSelectedSection] = useState('');

  // UI State
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const [sections, setSections] = useState([]);
  const [step, setStep] = useState('form'); // form, preview
  const [generatedQuiz, setGeneratedQuiz] = useState(null);

  // Fetch courses on mount
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await courseService.getMyCourses();
        setCourses(res.data.data.courses || []);
      } catch (err) {
        console.error("Failed to fetch courses", err);
        toast.error("Failed to load your courses.");
      }
    };
    fetchCourses();
  }, []);

  // Fetch sections when course changes
  useEffect(() => {
    if (!selectedCourse) {
      setSections([]);
      return;
    }
    const fetchSections = async () => {
      try {
        const res = await instructorService.getCourseDetails(selectedCourse);
        setSections(res.data.data.course.sections || []);
      } catch (err) {
        console.error("Failed to fetch sections", err);
        toast.error("Failed to load course sections.");
      }
    };
    fetchSections();
  }, [selectedCourse]);

  const handleGenerate = async () => {
    if (!title || !duration || !numQuestions || !scorePerQuestion || !pdfFile || !selectedSection) {
      return toast.error("Please fill in all details, select a section, and upload a PDF.");
    }
    
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('duration', duration);
      formData.append('num_questions', numQuestions);
      formData.append('score_per_question', scorePerQuestion);
      formData.append('section_id', selectedSection);
      formData.append('materials', pdfFile);

      const res = await quizService.generateQuiz(formData);
      setGeneratedQuiz(res.data.data.quiz);
      setStep('preview');
      toast.success('Quiz generated! Review it below.');
    } catch (error) {
      console.error("Quiz generation failed", error);
      toast.error(error.response?.data?.message || "Failed to generate quiz.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditQuestion = (index, field, value) => {
    const updatedQuestions = [...generatedQuiz.questions];
    updatedQuestions[index][field] = value;
    setGeneratedQuiz({ ...generatedQuiz, questions: updatedQuestions });
  };

  const handleEditOption = (qIndex, oIndex, value) => {
    const updatedQuestions = [...generatedQuiz.questions];
    updatedQuestions[qIndex].options[oIndex] = value;
    setGeneratedQuiz({ ...generatedQuiz, questions: updatedQuestions });
  };

  const handleSaveQuiz = async (publishAfter = false) => {
    setLoading(true);
    try {
      const saveRes = await quizService.saveQuiz(generatedQuiz);
      const quizId = saveRes.data.data.quiz.quiz_id;
      
      if (publishAfter) {
        await quizService.publishQuiz(quizId);
        toast.success('Quiz saved and published!');
      } else {
        toast.success('Quiz saved as draft!');
      }
      
      navigate('/dashboard');
    } catch (error) {
      console.error("Failed to save quiz", error);
      toast.error("Failed to save quiz.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-page">
      <Toaster position="top-center" />
      <div className="dashboard-layout">
        <Sidebar activePath="/instructor/quiz-generator" />

        <main className="main-dashboard-content w-100 p-4">
          <div className="container-fluid max-width-custom pt-5 mt-4 mx-auto">
            
            {/* Breadcrumb */}
            <div className="d-flex align-items-center gap-3 mb-5" style={{ color: '#000', fontSize: '16px', fontWeight: '500' }}>
              <span onClick={() => setStep('form')} style={{ cursor: 'pointer', opacity: step === 'preview' ? 0.6 : 1 }}>Generate Quiz</span>
              <span className="text-primary-custom fw-bold" style={{ fontSize: '20px' }}>»</span>
              {step === 'preview' && <span className="text-primary-custom fw-bold">Review & Edit</span>}
              {title && <span className="text-muted fw-normal ms-2" style={{ fontSize: '14px' }}>{title}</span>}
            </div>

            {step === 'form' ? (
              <div className="bg-white p-5 rounded-4 shadow-sm border mx-auto" style={{ maxWidth: '850px' }}>
                <h2 className="fw-bold mb-5" style={{ color: '#1a1d20', fontSize: '32px' }}>AI Quiz Generator</h2>
                
                <div className="vstack gap-4 mb-5">
                  <div className="form-group">
                    <label className="small fw-bold text-secondary mb-2">QUIZ TITLE</label>
                    <input type="text" className="form-control border bg-light-gray p-3 rounded-3" placeholder="e.g. Chapter 1: Introduction to React" value={title} onChange={(e) => setTitle(e.target.value)} />
                  </div>

                  <div className="row g-4">
                    <div className="col-md-6">
                      <label className="small fw-bold text-secondary mb-2">COURSE</label>
                      <select className="form-select border bg-light-gray p-3 rounded-3" value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}>
                        <option value="">Select Course</option>
                        {courses.map(c => <option key={c.course_id} value={c.course_id}>{c.title}</option>)}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="small fw-bold text-secondary mb-2">SECTION</label>
                      <select className="form-select border bg-light-gray p-3 rounded-3" value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)} disabled={!selectedCourse}>
                        <option value="">Select Section</option>
                        {sections.map(s => <option key={s.section_id} value={s.section_id}>{s.title}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="row g-4">
                    <div className="col-md-4">
                      <label className="small fw-bold text-secondary mb-2">DURATION (MINS)</label>
                      <input type="number" className="form-control border bg-light-gray p-3 rounded-3" placeholder="30" value={duration} onChange={(e) => setDuration(e.target.value)} />
                    </div>
                    <div className="col-md-4">
                      <label className="small fw-bold text-secondary mb-2">QUESTIONS</label>
                      <select className="form-select border bg-light-gray p-3 rounded-3" value={numQuestions} onChange={(e) => setNumQuestions(e.target.value)}>
                        <option value="5">5 Questions</option>
                        <option value="10">10 Questions</option>
                        <option value="15">15 Questions</option>
                        <option value="20">20 Questions</option>
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="small fw-bold text-secondary mb-2">PTS PER Q</label>
                      <input type="number" className="form-control border bg-light-gray p-3 rounded-3" placeholder="1" value={scorePerQuestion} onChange={(e) => setScorePerQuestion(e.target.value)} />
                    </div>
                  </div>

                  <div className="form-group mt-3">
                    <label className="small fw-bold text-secondary mb-2">UPLOAD PDF MATERIAL</label>
                    <div className="p-4 border border-dashed rounded-4 text-center bg-light" style={{ cursor: 'pointer' }} onClick={() => document.getElementById('pdf-upload').click()}>
                      <i className="fas fa-file-pdf fs-1 mb-3 text-danger opacity-75"></i>
                      <p className="mb-0 fw-medium">{pdfFile ? pdfFile.name : 'Click to upload PDF or drag and drop'}</p>
                      <small className="text-muted">Maximum file size: 50MB</small>
                      <input id="pdf-upload" type="file" className="d-none" accept="application/pdf" onChange={(e) => setPdfFile(e.target.files[0])} />
                    </div>
                  </div>
                </div>

                <div className="text-center mt-5">
                  <button className="btn btn-primary-custom px-5 py-3 fw-bold rounded-pill shadow-lg" onClick={handleGenerate} disabled={loading} style={{ minWidth: '320px' }}>
                    {loading ? (
                      <span><i className="fas fa-circle-notch fa-spin me-2"></i> Generating Quiz...</span>
                    ) : (
                      <span><i className="fas fa-magic me-2"></i> Generate with Gemini AI</span>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* Preview & Edit Mode */
              <div className="mx-auto" style={{ maxWidth: '1000px' }}>
                <div className="d-flex justify-content-between align-items-center mb-5 bg-white p-4 rounded-4 shadow-sm border">
                  <div>
                    <h3 className="fw-bold mb-1" style={{ color: '#1a1d20' }}>Review Generated Quiz</h3>
                    <p className="text-muted mb-0 small">You can edit any question or option before saving.</p>
                  </div>
                  <div className="hstack gap-3">
                    <button className="btn btn-outline-secondary px-4 py-2 fw-bold rounded-pill" onClick={() => setStep('form')} disabled={loading}>Back</button>
                    <button className="btn btn-primary-custom px-4 py-2 fw-bold rounded-pill" onClick={() => handleSaveQuiz(false)} disabled={loading}>Save as Draft</button>
                    <button className="btn btn-dark px-4 py-2 fw-bold rounded-pill" onClick={() => handleSaveQuiz(true)} disabled={loading}>Save & Publish</button>
                  </div>
                </div>

                <div className="vstack gap-4">
                  {generatedQuiz.questions.map((q, qIndex) => (
                    <div key={qIndex} className="bg-white p-4 rounded-4 shadow-sm border position-relative">
                      <div className="badge bg-light text-dark border mb-3">Question {qIndex + 1}</div>
                      <textarea 
                        className="form-control border-0 bg-light-gray p-3 rounded-3 fw-bold mb-4" 
                        rows="2" 
                        value={q.question} 
                        onChange={(e) => handleEditQuestion(qIndex, 'question', e.target.value)} 
                      />
                      
                      <div className="row g-3">
                        {q.options.map((opt, oIndex) => (
                          <div key={oIndex} className="col-md-6">
                            <div className={`d-flex align-items-center gap-3 p-3 rounded-3 border ${q.correctAnswer === opt ? 'bg-success-subtle border-success' : 'bg-light'}`}>
                              <input 
                                type="radio" 
                                name={`correct-${qIndex}`} 
                                checked={q.correctAnswer === opt} 
                                onChange={() => handleEditQuestion(qIndex, 'correctAnswer', opt)}
                              />
                              <input 
                                type="text" 
                                className="form-control form-control-sm border-0 bg-transparent p-0" 
                                value={opt} 
                                onChange={(e) => handleEditOption(qIndex, oIndex, e.target.value)} 
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 text-center pb-5">
                  <p className="text-muted small mb-4">Make sure to check all questions for accuracy before publishing to students.</p>
                  <button className="btn btn-primary-custom px-5 py-3 fw-bold rounded-pill shadow-lg" onClick={() => handleSaveQuiz(true)} disabled={loading} style={{ minWidth: '320px' }}>
                    {loading ? 'Processing...' : 'Confirm & Publish Quiz'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>

        <ProfileSidebar />
      </div>
    </div>
  );
};

export default QuizGenerator;
