import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../services/apiService';
import toast, { Toaster } from 'react-hot-toast';
import '../styles/CoursePlayer.css';

const formatDuration = (duration) => {
  if (duration === null || duration === undefined || duration === '') return null;
  if (typeof duration === 'string' && duration.includes(':')) return duration;

  const totalSeconds = Number(duration);
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return null;

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  if (hours > 0) {
    return [hours, minutes, seconds].map((unit) => String(unit).padStart(2, '0')).join(':');
  }

  return [minutes, seconds].map((unit) => String(unit).padStart(2, '0')).join(':');
};

const groupSectionLessons = (sections = []) =>
  sections.map((section) => {
    const lessons = [...(section.lessons || [])].sort(
      (a, b) => (a.position_order || 0) - (b.position_order || 0)
    );
    const attachmentsByParent = lessons.reduce((acc, lesson) => {
      if (!lesson.parent_content_id) return acc;
      const key = String(lesson.parent_content_id);
      if (!acc[key]) acc[key] = [];
      acc[key].push(lesson);
      return acc;
    }, {});

    return {
      ...section,
      lessonGroups: lessons
        .filter((lesson) => !lesson.parent_content_id)
        .map((lesson) => ({
          lesson,
          attachments: attachmentsByParent[String(lesson.content_id)] || [],
        })),
    };
  });

const flattenGroupedLessons = (sections = []) =>
  sections.flatMap((section) =>
    (section.lessonGroups || []).flatMap(({ lesson, attachments }) => [lesson, ...attachments])
  );

const CoursePlayer = () => {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('assignments');
  const [course, setCourse] = useState(null);
  const [sections, setSections] = useState([]);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourseDetails();
  }, [courseId]);

  const fetchCourseDetails = async () => {
    try {
      setLoading(true);
      
      // Handle dummy courses for placeholders
      if (String(courseId).startsWith('d')) {
        const dummyData = {
          course_id: courseId,
          title: "Advanced Web Design Mastery",
          sections: [
            {
              section_id: 's1',
              title: 'Getting Started',
              lessons: [
                { 
                  content_id: 'l1', 
                  title: 'Introduction to the Course', 
                  duration: '05:20', 
                  position_order: 1,
                  video_url: 'https://archive.org/download/BigBuckBunny_124/Content/big_buck_bunny_720p_surround.mp4' // More stable sample video
                },
                { 
                  content_id: 'l2', 
                  title: 'Setting Up Your Environment', 
                  duration: '12:45', 
                  position_order: 2,
                  video_url: 'https://archive.org/download/BigBuckBunny_124/Content/big_buck_bunny_720p_surround.mp4'
                }
              ]
            },
            {
              section_id: 's2',
              title: 'Core Design Principles',
              lessons: [
                { content_id: 'l3', title: 'Typography & Visual Hierarchy', duration: '18:10', position_order: 3, video_url: 'https://archive.org/download/BigBuckBunny_124/Content/big_buck_bunny_720p_surround.mp4' },
                { content_id: 'l4', title: 'Color Theory in Practice', duration: '24:00', position_order: 4, video_url: 'https://archive.org/download/BigBuckBunny_124/Content/big_buck_bunny_720p_surround.mp4' }
              ]
            }
          ],
          assignments: [
            { id: 1, title: 'Design Your First Wireframe', dueDate: 'Tomorrow', status: 'Pending' },
            { id: 2, title: 'Color Theory Quiz', dueDate: 'Next Week', status: 'Not Started' }
          ],
          isEnrolled: (String(courseId) === '1' || String(courseId) === 'd1') // Only d1 or 1 is free/enrolled by default
        };
        setCourse(dummyData);
        const groupedSections = groupSectionLessons(dummyData.sections);
        setSections(groupedSections);
        const firstLesson = flattenGroupedLessons(groupedSections)[0];
        setCurrentLesson(firstLesson);
        setLoading(false);
        return;
      }

      const res = await api.get(`/courses/${courseId}/details`);
      const courseData = res.data.data.course;
      setCourse(courseData);
      
      const allSections = courseData.sections || [];
      const groupedSections = groupSectionLessons(allSections);
      setSections(groupedSections);
      
      // Auto-select first lesson or matching lessonId
      let lessonToSelect = null;
      if (groupedSections.length > 0) {
        const flattenedLessons = flattenGroupedLessons(groupedSections);
        if (lessonId) {
          lessonToSelect = flattenedLessons.find(l => String(l.content_id) === String(lessonId));
        }
        if (!lessonToSelect) lessonToSelect = flattenedLessons[0];
      }
      setCurrentLesson(lessonToSelect);
      
    } catch (err) {
      console.error('API Error:', err);
      toast.error('Could not load real data, showing demo content.');
    } finally {
      setLoading(false);
    }
  };

  const handleLessonClick = (lesson) => {
    setCurrentLesson(lesson);
    navigate(`/courses/${courseId}/learn/lesson/${lesson.content_id}`);
  };

  // Logic: Only the VERY first course is free for demo. Others show Lock.
  const isEnrolled = course?.isEnrolled;
  const isFreeCourse = String(courseId) === '1' || String(courseId) === 'd1'; 
  const showLock = !isFreeCourse && !isEnrolled;

  if (loading) {
    return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary"></div></div>;
  }

  if (!course) return <div className="text-center p-5">Course not found</div>;

  return (
    <div className="course-player-page bg-white min-vh-100">
      <Toaster position="top-center" />
      <div className="container py-5 mt-4">
        <div className="row g-4">
          
          {/* Main Content Area (Left) */}
          <div className="col-lg-8">
            
            {/* Video Canvas */}
            <div className="player-video-section shadow-lg border-0 rounded-4 overflow-hidden mb-4 position-relative">
              <div className="video-wrapper position-relative bg-dark" style={{ aspectRatio: '16/9' }}>
                {showLock ? (
                  <>
                    <img 
                      src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=1200" 
                      alt="Locked Content" 
                      className="w-100 h-100 object-fit-cover opacity-25"
                    />
                    <div className="position-absolute top-50 start-50 translate-middle text-center w-100 p-4 fade-in">
                       <i className="fas fa-lock text-white fa-3x mb-3"></i>
                       <h3 className="text-white fw-bold">This Content is Locked</h3>
                       <p className="text-white-50">Enroll in this course to access all lessons and resources.</p>
                       <button className="btn btn-primary-custom px-5 py-2 fw-bold rounded-pill shadow">
                          Enroll Now to Unlock
                       </button>
                    </div>
                  </>
                ) : (
                  currentLesson?.video_url ? (
                    <video 
                      key={currentLesson.content_id}
                      src={currentLesson.video_url} 
                      className="w-100 h-100" 
                      controls 
                      autoPlay={false}
                      poster="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=1200"
                    ></video>
                  ) : currentLesson?.file_url ? (
                    <div className="w-100 h-100 d-flex flex-column align-items-center justify-content-center text-white p-5 text-center">
                        <i className="fas fa-file-pdf fa-4x mb-4 opacity-50"></i>
                        <h3 className="mb-3">{currentLesson.title}</h3>
                        <p className="opacity-75 mb-4">Open this resource in a new tab to view or download it.</p>
                        <a
                          href={currentLesson.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-primary-custom px-4 py-2 fw-bold rounded-pill shadow"
                        >
                          Open Resource
                        </a>
                    </div>
                  ) : (
                    <div className="w-100 h-100 d-flex flex-column align-items-center justify-content-center text-white p-5 text-center">
                        <i className="fas fa-file-alt fa-4x mb-4 opacity-50"></i>
                        <h3>Reading Module</h3>
                        <p className="opacity-75">This lesson is a text-based module. Please check the resources tab.</p>
                    </div>
                  )
                )}
              </div>

              <div className="p-4 d-flex justify-content-between align-items-center bg-white">
                <h4 className="fw-bold mb-0 text-dark" style={{ fontSize: '20px' }}>
                  {currentLesson ? `${currentLesson.position_order || 1}. ${currentLesson.title}` : 'Select a lesson'}
                </h4>
                {currentLesson && (
                    <div className="text-muted small bg-light px-3 py-2 rounded-pill border">
                        <i className="far fa-clock me-2"></i>{formatDuration(currentLesson.duration) || 'N/A'}
                    </div>
                )}
              </div>
            </div>

            {/* Tabs Section */}
            <div className="mt-5">
              <div className="d-flex gap-4 border-bottom mb-4">
                <button 
                  className={`pb-3 bg-transparent border-0 fw-bold text-uppercase position-relative ${activeTab === 'assignments' ? 'text-dark' : 'text-muted'}`}
                  style={{ fontSize: '13px', letterSpacing: '1px' }}
                  onClick={() => setActiveTab('assignments')}
                >
                  Assignments
                  {activeTab === 'assignments' && <div className="position-absolute bottom-0 start-0 w-100" style={{ height: '3px', backgroundColor: '#31506a' }}></div>}
                </button>
              </div>

              {activeTab === 'assignments' && (
                <div className="assignments-tab">
                  {course.assignments && course.assignments.length > 0 ? (
                    <div className="vstack gap-3">
                      {course.assignments.map(assign => (
                        <div key={assign.id} className="bg-light p-4 rounded-4 border d-flex justify-content-between align-items-center">
                          <div>
                            <h6 className="fw-bold mb-1">{assign.title}</h6>
                            <p className="small text-muted mb-0">Due Date: {assign.dueDate}</p>
                          </div>
                          <span className={`badge ${assign.status === 'Pending' ? 'bg-warning text-dark' : 'bg-secondary'}`}>{assign.status}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-light p-5 rounded-4 text-center border-dashed border-2">
                       <i className="fas fa-clipboard-list text-muted fa-3x mb-3"></i>
                       <p className="text-muted mb-0">No assignments available for this lesson yet.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Area (Right) */}
          <div className="col-lg-4">
            <div className="bg-white border rounded-4 p-4 shadow-sm">
              <h6 className="fw-bold mb-4 opacity-75" style={{ letterSpacing: '1px' }}>CURRICULUM</h6>
              <div className="vstack gap-3">
                {sections.map(section => (
                  <div key={section.section_id} className="section-group">
                    <div className="fw-bold small text-secondary mb-2 text-uppercase" style={{ fontSize: '11px' }}>{section.title}</div>
                    <div className="vstack gap-1">
                      {section.lessonGroups?.map(({ lesson, attachments }) => (
                        <div key={lesson.content_id} className="vstack gap-1">
                          <div 
                            onClick={() => !showLock ? handleLessonClick(lesson) : toast.error('Please enroll to unlock this lesson')}
                            className={`p-3 rounded-3 d-flex align-items-center gap-3 transition-all ${showLock ? 'opacity-75 grayscale cursor-not-allowed' : (currentLesson?.content_id === lesson.content_id ? 'bg-primary-subtle border-start border-primary border-4 cursor-pointer' : 'hover-bg-light cursor-pointer')}`}
                          >
                            <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" 
                                 style={{ 
                                   width: '24px', height: '24px', 
                                   border: '2px solid #dee2e6',
                                   backgroundColor: (!showLock && currentLesson?.content_id === lesson.content_id) ? '#31506a' : 'transparent'
                                 }}>
                              {showLock ? (
                                  <i className="fas fa-lock text-muted" style={{ fontSize: '10px' }}></i>
                              ) : (
                                  currentLesson?.content_id === lesson.content_id ? <div className="rounded-circle bg-white" style={{ width: '6px', height: '6px' }}></div> : null
                              )}
                            </div>
                            <div className="flex-grow-1">
                              <div className={`small fw-bold ${(!showLock && currentLesson?.content_id === lesson.content_id) ? 'text-primary' : 'text-dark'}`}>
                                  {lesson.position_order}. {lesson.title}
                                  {showLock && <i className="fas fa-lock ms-2 opacity-50" style={{ fontSize: '10px' }}></i>}
                              </div>
                              <div className="text-muted" style={{ fontSize: '11px' }}>{formatDuration(lesson.duration) || lesson.content_type}</div>
                            </div>
                          </div>

                          {attachments.map((attachment) => (
                            <div
                              key={attachment.content_id}
                              onClick={() => !showLock ? handleLessonClick(attachment) : toast.error('Please enroll to unlock this lesson')}
                              className={`ms-4 p-3 rounded-3 d-flex align-items-center gap-3 transition-all ${showLock ? 'opacity-75 grayscale cursor-not-allowed' : (currentLesson?.content_id === attachment.content_id ? 'bg-primary-subtle border-start border-primary border-4 cursor-pointer' : 'hover-bg-light cursor-pointer')}`}
                            >
                              <div
                                className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 bg-light"
                                style={{ width: '24px', height: '24px' }}
                              >
                                <i
                                  className={`fas ${attachment.content_type === 'pdf_assignment' ? 'fa-file-signature' : 'fa-file-pdf'} text-muted`}
                                  style={{ fontSize: '10px' }}
                                ></i>
                              </div>
                              <div className="flex-grow-1">
                                <div className={`small fw-bold ${(!showLock && currentLesson?.content_id === attachment.content_id) ? 'text-primary' : 'text-dark'}`}>
                                  {attachment.position_order}. {attachment.title}
                                  {showLock && <i className="fas fa-lock ms-2 opacity-50" style={{ fontSize: '10px' }}></i>}
                                </div>
                                <div className="text-muted text-uppercase" style={{ fontSize: '11px' }}>
                                  {attachment.content_type === 'pdf_assignment' ? 'Assignment Resource' : 'Lecture Resource'}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CoursePlayer;
