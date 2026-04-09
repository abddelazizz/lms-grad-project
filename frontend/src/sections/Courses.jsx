import React from 'react';
import { Link } from 'react-router-dom';

const Courses = () => {
  const coursesData = [
    { img: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=800", weeks: "4 Weeks", level: "Beginner", title: "Advanced Web Design Mastery", desc: "Master the art of creating modern, high-performance websites. Dive deep into CSS architecture, advanced layout techniques, and performance optimization." },
    { img: "https://images.unsplash.com/photo-1586717791821-3f44a563cc4c?auto=format&fit=crop&q=80&w=800", weeks: "6 Weeks", level: "Intermediate", title: "UI/UX Design: Prototyping", desc: "Master the art of creating intuitive user interfaces (UI) and enhancing user experiences (UX). Learn design principles, wireframing, and prototyping." },
    { img: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=800", weeks: "8 Weeks", level: "Intermediate", title: "Full-Stack JS Development", desc: "Build robust, scalable applications using React, Node.js, and Express. Includes database management with PostgreSQL and MongoDB." },
    { img: "https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&q=80&w=800", weeks: "10 Weeks", level: "Beginner", title: "Brand Identity & Graphic Design", desc: "Discover the fundamentals of graphic design, including typography, color theory, layout design, and brand identity techniques." },
    { img: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&q=80&w=800", weeks: "10 Weeks", level: "Intermediate", title: "Mobile App Architecture", desc: "Create native-like mobile experiences for iOS and Android using React Native. Learn to manage device-specific features and complex navigation." },
    { img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800", weeks: "6 Weeks", level: "Advance", title: "Data Science & Python ML", desc: "Unlock the power of data. Learn statistical analysis, data visualization, and build machine learning models from scratch using Python." }
  ];

  return (
    <section className="courses py-5 mb-5">
      <div className="container-custom px-5">
        <div className="d-flex justify-content-between align-items-start mb-5 pb-3">
          <div className="courses-header-text pe-4">
            <h2 className="display-6 fw-bold mb-3 text-dark">Our Courses</h2>
            <p className="text-secondary mb-0 fs-5 lh-lg courses-desc">Lorem ipsum dolor sit amet consectetur. Tempus tincidunt etiam eget elit id imperdiet et. Cras eu sit dignissim lorem nibh et. Ac cum eget habitasse in velit fringilla feugiat senectus in.</p>
          </div>
          <Link to="/courses" className="btn bg-white border border-light-subtle text-dark px-4 py-2 fw-medium rounded-2">View All</Link>
        </div>

        <div className="row g-4">
          {coursesData.map((course, index) => (
            <div className="col-lg-6" key={index}>
              <div className="card border-0 bg-white rounded-4 p-4 h-100 d-flex flex-column course-card-custom">
                <div className="img-container mb-4">
                    <img src={course.img} className="card-img-top rounded-3 object-fit-cover w-100" height="320" alt={course.title} />
                </div>
                
                <div className="d-flex justify-content-center gap-3 mb-4">
                  <span className="badge bg-white text-secondary border border-light-subtle rounded-2 px-3 py-2 fw-normal fs-6">{course.weeks}</span>
                  <span className="badge bg-white text-secondary border border-light-subtle rounded-2 px-3 py-2 fw-normal fs-6">{course.level}</span>
                </div>
                
                <div className="card-body p-0 d-flex flex-column flex-grow-1">
                  <h3 className="h4 fw-bold mb-3 text-dark text-center">{course.title}</h3>
                  <p className="text-secondary mb-4 text-center lh-lg fs-6 flex-grow-1 px-3">{course.desc}</p>
                  <Link to="/courses" className="btn btn-primary-custom w-100 py-3 fw-bold rounded-2">Get it Now</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Courses;