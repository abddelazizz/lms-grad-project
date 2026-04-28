import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { courseService } from '../services';
import '../styles/Courses.css';
import '../styles/CourseDetails.css';

const CourseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  // Full detailed dummy data for the 5 courses
  const detailedCoursesData = {
    'd1': {
      title: 'Web Design Fundamentals',
      description: 'The ultimate guide to mastering web design from scratch. We cover everything from initial sketches to a fully responsive live website.',
      heroImage: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=1200',
      curriculum: [
        {
          id: 's1',
          title: 'Introduction to Web Design',
          lessons: [
            { title: 'What is Web Design?', duration: '10:00' },
            { title: 'The Designer Mindset', duration: '15:30' },
            { title: 'History of the web', duration: '12:00' }
          ]
        },
        {
          id: 's2',
          title: 'World of HTML',
          lessons: [
            { title: 'Structural HTML Tags', duration: '20:00' },
            { title: 'Forms and Inputs', duration: '25:00' },
            { title: 'Semantic HTML', duration: '18:00' }
          ]
        },
        {
          id: 's3',
          title: 'Styling with CSS',
          lessons: [
            { title: 'CSS Selectors', duration: '15:00' },
            { title: 'Box Model Deep Dive', duration: '22:00' },
            { title: 'Flexbox Mastery', duration: '35:00' },
            { title: 'CSS Grid Layouts', duration: '40:00' }
          ]
        },
        {
          id: 's4',
          title: 'Responsive Design',
          lessons: [
            { title: 'Media Queries', duration: '20:00' },
            { title: 'Mobile First Approach', duration: '25:00' }
          ]
        }
      ]
    },
    'd2': {
      title: 'UI/UX Design Course',
      description: 'Master the principles of User Interface and User Experience design. Create stunning digital experiences that users love.',
      heroImage: 'https://images.unsplash.com/photo-1586717791821-3f44a563cc4c?auto=format&fit=crop&q=80&w=1200',
      curriculum: [
        {
          id: 's1',
          title: 'Introduction to UI/UX Design',
          lessons: [
            { title: 'Understanding UI vs UX', duration: '45 mins' },
            { title: 'User Centered Design', duration: '1 hour' },
            { title: 'The UI/UX Process', duration: '30 mins' }
          ]
        },
        {
          id: 's2',
          title: 'User Research and Analysis',
          lessons: [
            { title: 'Conducting User Research', duration: '1.5 hours' },
            { title: 'Creating User Personas', duration: '45 mins' },
            { title: 'User Journey Mapping', duration: '1 hour' }
          ]
        },
        {
          id: 's3',
          title: 'Wireframing and Prototyping',
          lessons: [
            { title: 'Basic Wireframing techniques', duration: '1 hour' },
            { title: 'High-Fidelity Prototyping', duration: '2 hours' },
            { title: 'Interaction Design', duration: '1.5 hours' }
          ]
        },
        {
          id: 's4',
          title: 'Visual Design and Branding',
          lessons: [
            { title: 'Color Theory & Typography', duration: '1 hour' },
            { title: 'Iconography & Layout', duration: '45 mins' }
          ]
        }
      ]
    },
    'd3': {
      title: 'Mobile App Development',
      description: 'Learn to build professional mobile applications for iOS and Android using Flutter and React Native.',
      heroImage: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&q=80&w=1200',
      curriculum: [
        {
          id: 's1',
          title: 'Mobile Ecosystem Overview',
          lessons: [
            { title: 'iOS vs Android Architecture', duration: '25:00' },
            { title: 'Cross Platform Benefits', duration: '20:00' }
          ]
        },
        {
          id: 's2',
          title: 'React Native Basics',
          lessons: [
            { title: 'Setting up Environment', duration: '30:00' },
            { title: 'Core Components', duration: '45:00' },
            { title: 'Styling in React Native', duration: '35:00' }
          ]
        },
        {
          id: 's3',
          title: 'Advanced Interactions',
          lessons: [
            { title: 'Animations with Reanimated', duration: '50:00' },
            { title: 'Device API access', duration: '40:00' }
          ]
        }
      ]
    },
    'd4': {
      title: 'Graphic Design for Beginners',
      description: 'Unleash your creativity. Learn Photoshop, Illustrator, and the core principles of graphic communication.',
      heroImage: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?auto=format&fit=crop&q=80&w=1200',
      curriculum: [
        {
          id: 's1',
          title: 'Design Principles 101',
          lessons: [
            { title: 'Space and Balance', duration: '30:00' },
            { title: 'Hierarchy and Emphasis', duration: '40:00' }
          ]
        },
        {
          id: 's2',
          title: 'Mastering Adobe Suite',
          lessons: [
            { title: 'Photoshop for Designers', duration: '2 hours' },
            { title: 'Illustrator Vector Magic', duration: '1.5 hours' }
          ]
        }
      ]
    },
    'd5': {
      title: 'Front-End Web Development',
      description: 'The modern front-end stack. Master React, Next.js, and advanced CSS to build blazing fast web applications.',
      heroImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=1200',
      curriculum: [
        {
          id: 's1',
          title: 'Modern JavaScript (ES6+)',
          lessons: [
            { title: 'Promises and Async/Await', duration: '45:00' },
            { title: 'Array Methods Mastery', duration: '30:00' }
          ]
        },
        {
          id: 's2',
          title: 'React Deep Dive',
          lessons: [
            { title: 'Hooks and State Management', duration: '1 hour' },
            { title: 'Context API and Redux', duration: '1.5 hours' },
            { title: 'Performance Optimization', duration: '45:00' }
          ]
        }
      ]
    }
  };

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        // Try fetching live data from the backend first
        const response = await courseService.getCourseDetails(id);
        if (response.data && response.data.data && response.data.data.course) {
          setCourse(response.data.data.course);
          setLoading(false);
          return;
        }
      } catch (error) {
        console.warn('Live course fetch failed, attempting dummy data fallback.');
      }
      
      // Fallback to local dummy data if live API fails or course isn't found
      const foundCourse = detailedCoursesData[id];
      if (foundCourse) {
        setCourse(foundCourse);
      }
      setLoading(false);
    };

    fetchCourse();
  }, [id]);

  if (loading) {
    return (
      <div className="course-details-page d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="course-details-page container py-5">
        <h2>Course not found.</h2>
        <Link to="/courses" className="btn btn-primary mt-3">Back to Courses</Link>
      </div>
    );
  }

  return (
    <div className="course-details-page">
      <div className="container-custom">
        <div className="section-title-wrapper">
          <h1 className="display-4 fw-bold text-dark">{course.title}</h1>
          <p>{course.description}</p>
        </div>

        <div className="details-hero-section position-relative">
          <img src={course.heroImage} className="hero-main-img" alt={course.title} />
          <div className="video-play-overlay" onClick={() => navigate(`/courses/${id}/learn/lesson/01`)}>
            <i className="fas fa-play"></i>
          </div>
        </div>

        <div className="details-curriculum-grid">
          {course.curriculum.map((section, idx) => (
            <div key={section.id} className="section-card">
              <span className="section-number">0{idx + 1}</span>
              <h3 className="section-header-title">{section.title}</h3>
              
              <div className="lessons-container">
                {section.lessons.map((lesson, lIdx) => (
                  <div 
                    key={lIdx} 
                    className="lesson-row" 
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/courses/${id}/learn/lesson/${lIdx + 1}`)}
                  >
                    <div className="lesson-info-left">
                      <span className="lesson-info-title">{lesson.title}</span>
                      <span className="lesson-info-subtitle">Lesson {lIdx + 1}</span>
                    </div>
                    <div className="lesson-info-right">
                      <span className="duration-tag">
                        <i className="far fa-clock"></i> {lesson.duration}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CourseDetails;
