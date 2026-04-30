import React from 'react';
import '../styles/About.css';

const About = () => {
  return (
    <div className="about-page">
      {/* Hero Section */}
      <section className="about-hero text-center py-5">
        <div className="container-custom">
          <h1 className="display-4 fw-bold text-dark mb-3">About Recode Academy</h1>
          <p className="lead text-secondary mx-auto" style={{ maxWidth: '800px' }}>
            We are dedicated to providing the high-quality education and resources needed to master modern technology and design skills.
          </p>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="py-5 bg-white">
        <div className="container-custom">
          <div className="row g-4 text-center">
            <div className="col-md-6">
              <div className="about-card p-5 border rounded-4 hover-shadow">
                <div className="about-icon mb-4"><i className="fas fa-eye fs-2 text-primary-custom"></i></div>
                <h3 className="fw-bold mb-3">Our Vision</h3>
                <p className="text-secondary mb-0">
                  To be the global leader in professional technology training, empowering individuals to reach their full potential and shape the future.
                </p>
              </div>
            </div>
            <div className="col-md-6">
              <div className="about-card p-5 border rounded-4 hover-shadow">
                <div className="about-icon mb-4"><i className="fas fa-bullseye fs-2 text-primary-custom"></i></div>
                <h3 className="fw-bold mb-3">Our Mission</h3>
                <p className="text-secondary mb-0">
                  To deliver practical, industry-aligned learning experiences that bridge the gap between education and professional success.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-5">
        <div className="container-custom py-4">
          <div className="row align-items-center">
            <div className="col-lg-6 mb-4 mb-lg-0">
              <div className="d-flex align-items-center justify-content-center rounded-5 shadow" style={{ height: '350px', background: 'linear-gradient(135deg, #31506a 0%, #52758e 100%)' }}>
                <div className="text-center text-white">
                  <i className="fas fa-users fa-4x mb-3 opacity-75"></i>
                  <h4 className="fw-bold">Our Team</h4>
                </div>
              </div>
            </div>
            <div className="col-lg-6 ps-lg-5">
              <h2 className="fw-bold mb-4">Why Choose Recode Academy?</h2>
              <div className="d-flex flex-column gap-3">
                <div className="d-flex align-items-start gap-3">
                  <div className="text-primary-custom mt-1"><i className="fas fa-check-circle fs-5"></i></div>
                  <div>
                    <h5 className="fw-bold mb-1">Expert Mentors</h5>
                    <p className="text-secondary mb-0">Learn from industry professionals with years of real-world experience.</p>
                  </div>
                </div>
                <div className="d-flex align-items-start gap-3">
                  <div className="text-primary-custom mt-1"><i className="fas fa-check-circle fs-5"></i></div>
                  <div>
                    <h5 className="fw-bold mb-1">Practical Learning</h5>
                    <p className="text-secondary mb-0">Focused on hands-on projects and real-world application of skills.</p>
                  </div>
                </div>
                <div className="d-flex align-items-start gap-3">
                  <div className="text-primary-custom mt-1"><i className="fas fa-check-circle fs-5"></i></div>
                  <div>
                    <h5 className="fw-bold mb-1">Global Community</h5>
                    <p className="text-secondary mb-0">Join a network of students and professionals from all over the world.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
