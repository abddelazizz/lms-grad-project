import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { courseService } from '../services';
import '../styles/Courses.css';

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await courseService.getAllCourses();
        if (response.data && response.data.data) {
          setCourses(response.data.data.courses);
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const dummyCourses = [
    {
      course_id: 'd1',
      title: 'Advanced Web Design Mastery',
      author: 'Kristin Watson',
      description: 'Master the art of creating modern, high-performance websites. Dive deep into CSS architecture, advanced layout techniques, and performance optimization.',
      images: [
        'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1547658719-da2b51169166?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&q=80&w=800'
      ],
      curriculum: [
        { title: 'Semantic HTML & SEO Foundations' },
        { title: 'CSS Grid & Flexbox Mastery' },
        { title: 'Advanced Responsive Patterns' },
        { title: 'Performance & Web Vitals' },
        { title: 'Final Project: Portfolio' }
      ]
    },
    {
      course_id: 'd2',
      title: 'UI/UX Design: From Sketch to Prototyping',
      author: 'Michelle Rivera',
      description: 'Comprehensive design journey covering user research, information architecture, wireframing, and interactive prototyping with Figma.',
      images: [
        'https://images.unsplash.com/photo-1586717791821-3f44a563cc4c?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1545235617-9465d2a55698?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&q=80&w=800'
      ],
      curriculum: [
        { title: 'The UI/UX Design Process' },
        { title: 'User Research & Personas' },
        { title: 'Wireframing in Figma' },
        { title: 'Visual Design Systems' },
        { title: 'Interaction & Prototyping' }
      ]
    },
    {
      course_id: 'd3',
      title: 'Full-Stack JavaScript Development',
      author: 'Software Developer',
      description: 'Build robust, scalable applications using React, Node.js, and Express. Includes database management with PostgreSQL and MongoDB.',
      images: [
        'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1550439062-609e1531270e?auto=format&fit=crop&q=80&w=800'
      ],
      curriculum: [
        { title: 'ES6+ JavaScript Essentials' },
        { title: 'React Hooks & State Management' },
        { title: 'Node.js & Express API' },
        { title: 'Database Integration' },
        { title: 'Deployment & Monitoring' }
      ]
    },
    {
      course_id: 'd4',
      title: 'Mobile App Architecture with React Native',
      author: 'Kristin Watson',
      description: 'Create native-like mobile experiences for iOS and Android. Learn how to manage device-specific features and complex navigation.',
      images: [
        'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1551650975-87deedd944c3?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1521931961826-fe48677230a5?auto=format&fit=crop&q=80&w=800'
      ],
      curriculum: [
        { title: 'React Native vs Hybrid' },
        { title: 'Core UI Components' },
        { title: 'Navigation & Routing' },
        { title: 'Accessing Device APIs' },
        { title: 'Publishing to App Stores' }
      ]
    },
    {
      course_id: 'd5',
      title: 'Brand Identity & Graphic Design',
      author: 'Michelle Rivera',
      description: 'Go beyond the basics. Learn how to create compelling brand identities, logos, and marketing materials that stand out.',
      images: [
        'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1572044162444-ad60f128bde2?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&q=80&w=800'
      ],
      curriculum: [
        { title: 'Foundations of Color & Type' },
        { title: 'Logo Design Mastery' },
        { title: 'Marketing Collateral' },
        { title: 'Brand Guidelines' },
        { title: 'Client Presentation' }
      ]
    },
    {
      course_id: 'd6',
      title: 'Data Science & Machine Learning with Python',
      author: 'Kristin Watson',
      description: 'Unlock the power of data. Learn statistical analysis, data visualization, and build machine learning models from scratch.',
      images: [
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1534972195531-d756b9bfa9f2?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1527689368864-3a821dbccc34?auto=format&fit=crop&q=80&w=800'
      ],
      curriculum: [
        { title: 'Python for Data Science' },
        { title: 'NumPy & Pandas Deep Dive' },
        { title: 'Visualizing with Matplotlib' },
        { title: 'Machine Learning Basics' },
        { title: 'Neural Networks 101' }
      ]
    }
  ];

  const displayCourses = courses.length > 0 ? courses.map((c, index) => ({
    ...c,
    images: c.images || dummyCourses[index % dummyCourses.length].images,
    curriculum: c.sections ? c.sections.flatMap(s => s.lessons || []).slice(0, 5) : dummyCourses[index % dummyCourses.length].curriculum
  })) : dummyCourses;

  if (loading) {
    return (
      <div className="courses-page d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="courses-page">
      <div className="container-custom">
        <div className="section-title-wrapper">
          <h1 className="display-4 fw-bold text-dark">Online Courses on Design and Development</h1>
          <p>
            Welcome to our learning platform, where passion meets expertise. Our courses are designed to provide a comprehensive and deeply engaging learning experience, perfectly tailored for your success in the competitive landscape of design and technology.
          </p>
        </div>

        {displayCourses.map((course) => (
          <div key={course.course_id} className="course-item-container">
            <div className="course-header">
              <div className="course-info">
                <h2 className="course-title">{course.title}</h2>
                <p className="course-description">{course.description}</p>
              </div>
              <Link to={`/courses/${course.course_id}`} className="btn-view-course">View Course</Link>
            </div>

            <div className="course-images-grid">
              {course.images.map((img, idx) => (
                <div key={idx} className="course-img-wrapper">
                  <img src={img} alt={`${course.title} detail ${idx + 1}`} />
                </div>
              ))}
            </div>

            <div className="curriculum-section">
              <h3 className="curriculum-section-title">Curriculum</h3>
              <div className="curriculum-grid">
                {course.curriculum.map((item, idx) => (
                  <div key={idx} className="curriculum-item">
                    <span className="curriculum-number">0{idx + 1}</span>
                    <p className="curriculum-title">{item.title}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Courses;
