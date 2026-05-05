import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ProfileSidebar from '../components/ProfileSidebar';
import toast, { Toaster } from 'react-hot-toast';
import { quizService, courseService, instructorService } from '../services';
import CustomDropdown from '../components/CustomDropdown';
import '../styles/Dashboard.css';

const QuizGenerator = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Form State
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('30');
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
        const courseList = res.data.data.courses || [];
        setCourses(courseList);

        const params = new URLSearchParams(location.search);
        const courseParam = params.get('course');
        if (courseParam) {
          setSelectedCourse(courseParam);
        }
      } catch (err) {
        console.error("Failed to fetch courses", err);
        toast.error("Failed to load your courses.");
      }
    };
    fetchCourses();
  }, [location.search]);

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
    if (!title) return toast.error("Please enter a quiz title.");
    if (!selectedCourse) return toast.error("Please select a course.");
    if (!selectedSection) return toast.error("Please select a section.");
    if (!duration) return toast.error("Please enter duration.");
    if (!numQuestions) return toast.error("Please select number of questions.");
    if (!scorePerQuestion) return toast.error("Please enter score per question.");
    if (!pdfFile) return toast.error("Please upload a PDF file for context.");
    
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
    const oldOptionValue = updatedQuestions[qIndex].options[oIndex];
    updatedQuestions[qIndex].options[oIndex] = value;
    
    // If the edited option was the correct answer, update the correct answer string too
    if (updatedQuestions[qIndex].correctAnswer === oldOptionValue) {
      updatedQuestions[qIndex].correctAnswer = value;
    }
    
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
                <h2 className="fw-bold mb-4" style={{ color: '#1a1d20', fontSize: '28px' }}>Quiz</h2>
                
                <div className="vstack gap-4 mb-4">
                  <div className="row g-4">
                    <div className="col-12">
                      <label className="small fw-bold text-secondary mb-2">QUIZ TITLE</label>
                      <input type="text" className="form-control border bg-light-gray p-3 rounded-3" placeholder="e.g. Chapter 1 Assessment" value={title} onChange={(e) => setTitle(e.target.value)} />
                    </div>
                  </div>

                  <div className="row g-4">
                    <div className="col-md-6">
                      <CustomDropdown
                        label="COURSE"
                        placeholder="Select Course"
                        options={courses.map(c => ({ value: c.course_id, label: c.title }))}
                        value={selectedCourse}
                        onChange={(e) => setSelectedCourse(e.target.value)}
                        icon="fas fa-graduation-cap"
                      />
                    </div>
                    <div className="col-md-6">
                      <CustomDropdown
                        label="SECTION"
                        placeholder="Select Section"
                        options={sections.map(s => ({ value: s.section_id, label: s.title }))}
                        value={selectedSection}
                        onChange={(e) => setSelectedSection(e.target.value)}
                        disabled={!selectedCourse}
                        icon="fas fa-folder-open"
                      />
                    </div>
                  </div>

                  <div className="row g-4">
                    <div className="col-md-4">
                      <label className="small fw-bold text-secondary mb-2">DURATION (MINS)</label>
                      <input type="number" className="form-control border bg-light-gray p-3 rounded-3" placeholder="30" value={duration} onChange={(e) => setDuration(e.target.value)} />
                    </div>
                    <div className="col-md-4">
                      <CustomDropdown
                        label="NUM QUESTIONS"
                        placeholder="5 Questions"
                        options={[
                          { value: '5', label: '5 Questions' },
                          { value: '10', label: '10 Questions' },
                          { value: '15', label: '15 Questions' },
                          { value: '20', label: '20 Questions' },
                        ]}
                        value={numQuestions}
                        onChange={(e) => setNumQuestions(e.target.value)}
                        icon="fas fa-list-ol"
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="small fw-bold text-secondary mb-2">PTS PER Q</label>
                      <input type="number" className="form-control border bg-light-gray p-3 rounded-3" placeholder="1" value={scorePerQuestion} onChange={(e) => setScorePerQuestion(e.target.value)} />
                    </div>
                  </div>

                  <div className="d-flex gap-5 mb-5 text-dark fw-bold" style={{ fontSize: '16px' }}>
                    <div className="d-flex align-items-center gap-3">
                      <i className="far fa-calendar-alt text-dark"></i> <span>00 / 00 / 0000</span>
                    </div>
                    <div className="d-flex align-items-center gap-3">
                      <i className="far fa-clock text-dark"></i> <span>00 : 00</span>
                    </div>
                  </div>

                  <div className="upload-dropzone p-4 text-center rounded-4 mb-4" 
                    onClick={() => document.getElementById('pdf-upload').click()}
                    style={{ border: '2px dashed #9fb0c0', backgroundColor: '#f4f7fa', cursor: 'pointer', minHeight: '200px' }}
                  >
                    <input id="pdf-upload" type="file" className="d-none" accept="application/pdf" onChange={(e) => setPdfFile(e.target.files[0])} />
                    <div className="bg-white rounded-circle shadow-sm mx-auto d-flex align-items-center justify-content-center mb-3" style={{ width: '60px', height: '60px' }}>
                      <i className="fas fa-cloud-upload-alt fa-lg text-primary-custom"></i>
                    </div>
                    <p className="mb-0 fw-medium" style={{ color: '#555', fontSize: '13px' }}>
                      {pdfFile ? pdfFile.name : (
                        <>Drag & drop files or <span className="text-primary-custom text-decoration-underline fw-bold">Browse</span></>
                      )}
                    </p>
                  </div>
                </div>

                <div className="text-center mt-5">
                  <button className="btn px-5 py-2 fw-bold rounded-2 shadow-sm" onClick={handleGenerate} disabled={loading} style={{ minWidth: '220px', backgroundColor: '#31506a', color: 'white' }}>
                    {loading ? (
                      <span><i className="fas fa-circle-notch fa-spin me-2"></i> Generating...</span>
                    ) : (
                      <span>Generate Quiz with AI</span>
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
