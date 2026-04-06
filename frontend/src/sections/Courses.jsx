import React from 'react';

const Courses = () => {
  const coursesData = [
    { img: "/images/course1.jpg", weeks: "4 Weeks", level: "Beginner", title: "Web Design Fundamentals", desc: "Learn the fundamentals of web design, including HTML, CSS, and responsive design principles. Develop the skills to create visually appealing and user-friendly websites." },
    { img: "/images/course2.jpg", weeks: "6 Weeks", level: "Intermediate", title: "UI/UX Design", desc: "Master the art of creating intuitive user interfaces (UI) and enhancing user experiences (UX). Learn design principles, wireframing, prototyping, and usability testing techniques." },
    { img: "/images/course3.jpg", weeks: "8 Weeks", level: "Intermediate", title: "Mobile App Development", desc: "Dive into the world of mobile app development. Learn to build native iOS and Android applications using industry-leading frameworks like Swift and Kotlin." },
    { img: "/images/course4.jpg", weeks: "10 Weeks", level: "Beginner", title: "Graphic Design for Beginners", desc: "Discover the fundamentals of graphic design, including typography, color theory, layout design, and image manipulation techniques. Create visually stunning designs for print and digital media." },
    { img: "/images/course5.jpg", weeks: "10 Weeks", level: "Intermediate", title: "Front-End Web Development", desc: "Become proficient in front-end web development. Learn HTML, CSS, JavaScript, and popular frameworks like Bootstrap and React. Build interactive and responsive websites." },
    { img: "/images/course6.jpg", weeks: "6 Weeks", level: "Advance", title: "Advanced JavaScript", desc: "Take your JavaScript skills to the next level. Explore advanced concepts like closures, prototypes, asynchronous programming, and ES6 features. Build complex applications with confidence." }
  ];

  return (
    <section className="courses py-5 mb-5">
      <div className="container-custom px-5">
        <div className="d-flex justify-content-between align-items-start mb-5 pb-3">
          <div className="courses-header-text pe-4">
            <h2 className="display-6 fw-bold mb-3 text-dark">Our Courses</h2>
            <p className="text-secondary mb-0 fs-5 lh-lg courses-desc">Lorem ipsum dolor sit amet consectetur. Tempus tincidunt etiam eget elit id imperdiet et. Cras eu sit dignissim lorem nibh et. Ac cum eget habitasse in velit fringilla feugiat senectus in.</p>
          </div>
          <a href="#" className="btn bg-white border border-light-subtle text-dark px-4 py-2 fw-medium rounded-2">View All</a>
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
                  <a href="#" className="btn btn-primary-custom w-100 py-3 fw-bold rounded-2">Get it Now</a>
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