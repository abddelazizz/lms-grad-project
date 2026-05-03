import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-white pt-5 mt-5">
      <div className="container-custom px-5 mt-4">
        <div className="row mb-5">
          
          <div className="col-lg-5 mb-5 mb-lg-0">
            <div className="footer-logo mb-5">
              <Link to="/"><img src="/images/logo.png" alt="Recode" height="70" className="d-block" /></Link>
            </div>
            <div className="d-flex flex-column gap-4 text-dark fw-medium">
              <p className="mb-0 d-flex align-items-center gap-3">
                <i className="fa-solid fa-envelope fs-5"></i> hello@recodeacademy.com
              </p>
              <p className="mb-0 d-flex align-items-center gap-3">
                <i className="fa-solid fa-phone fs-5"></i> +20 100 123 4567
              </p>
              <p className="mb-0 d-flex align-items-center gap-3">
                <i className="fa-solid fa-location-dot fs-5"></i> Cairo, Egypt
              </p>
            </div>
          </div>

          <div className="col-lg-2 col-6 mb-4 mb-lg-0">
            <h4 className="h5 fw-bold mb-4 text-dark pt-2">Home</h4>
            <ul className="list-unstyled d-flex flex-column gap-3">
              <li><Link to="/" className="text-secondary text-decoration-none fw-medium">Benefits</Link></li>
              <li><Link to="/courses" className="text-secondary text-decoration-none fw-medium">Our Courses</Link></li>
              <li><Link to="/" className="text-secondary text-decoration-none fw-medium">Our Testimonials</Link></li>
              <li><Link to="/" className="text-secondary text-decoration-none fw-medium">Our FAQ</Link></li>
            </ul>
          </div>

          <div className="col-lg-2 col-6 mb-4 mb-lg-0">
            <h4 className="h5 fw-bold mb-4 text-dark pt-2">About Us</h4>
            <ul className="list-unstyled d-flex flex-column gap-3">
              <li><Link to="/about" className="text-secondary text-decoration-none fw-medium">Company</Link></li>
              <li><Link to="/about" className="text-secondary text-decoration-none fw-medium">Achievements</Link></li>
              <li><Link to="/about" className="text-secondary text-decoration-none fw-medium">Our Goals</Link></li>
            </ul>
          </div>

          <div className="col-lg-3">
            <h4 className="h5 fw-bold mb-4 text-dark pt-2">Social Profiles</h4>
            <div className="d-flex gap-3">
              <a href="#" className="social-icon-btn d-flex justify-content-center align-items-center rounded-3 bg-light-gray text-dark text-decoration-none border border-light-subtle" aria-label="Facebook">
                <i className="fa-brands fa-facebook fs-5"></i>
              </a>
              <a href="#" className="social-icon-btn d-flex justify-content-center align-items-center rounded-3 bg-light-gray text-dark text-decoration-none border border-light-subtle" aria-label="LinkedIn">
                <i className="fa-brands fa-linkedin fs-5"></i>
              </a>
            </div>
          </div>

        </div>

        <div className="border-top pt-4 pb-4 text-center text-secondary fw-medium">
          &copy; 2026 Recode Academy. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;