import React from 'react';
import { Link } from 'react-router-dom';

const Hero = () => {
  return (
    <section className="hero-section text-center pt-4 pb-5 my-4">
      <div className="container-custom pt-1">

        <div className="d-flex justify-content-center align-items-center ">
          <div className="position-relative d-inline-block mt-5">

            <div className="sparks-container position-absolute">
              <div className="spark spark-1"></div>
              <div className="spark spark-2"></div>
              <div className="spark spark-3"></div>
            </div>

            <h1 className="main-title-box bg-white px-4 py-3 rounded-4 border border-light-subtle d-inline-flex align-items-center gap-3 m-0 shadow-soft">
              <div className="icon-box d-flex justify-content-center align-items-center rounded-3">
                 <i className="fa-solid fa-bolt text-dark fs-5"></i>
              </div>
              <span className="text-orange fw-bold">Unlock</span>
              <span className="text-dark fw-bold">Your Creative Potential</span>
            </h1>
          </div>
        </div>

        <h2 className="fs-2 fw-bold text-dark mb-4 pb-2 mt-4">with Online Design and Development Courses.</h2>
        <p className="text-secondary mb-5 pb-4 fs-5">Learn from Industry Experts and Enhance Your Skills.</p>

        <div className="mt-4 mb-5 pb-4">
          <Link to="/courses" className="btn btn-primary-custom px-4 py-3 fw-medium rounded-3">Explore Courses</Link>
        </div>

        <div className="hero-video-wrapper position-relative mx-auto mt-2 shadow-soft p-4">
          <video 
            src="/videos/home-video.mp4" 
            className="img-fluid w-100 object-fit-cover video-img rounded-4" 
            autoPlay 
            loop 
            muted 
            playsInline
          />
        </div>

      </div>
    </section>
  );
};

export default Hero;