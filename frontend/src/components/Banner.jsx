import React from 'react';

const Banner = () => {
  return (
    <div className="container-custom mt-4">
      <div className="top-banner-custom text-white text-center py-3 rounded-3 d-flex justify-content-center align-items-center gap-2">
        <span>Courses <i className="fa-solid fa-star text-warning mx-1 fs-6"></i> Sale Ends Soon, Get It Now</span>
        <i className="fa-solid fa-arrow-right ms-2"></i>
      </div>
    </div>
  );
};

export default Banner;