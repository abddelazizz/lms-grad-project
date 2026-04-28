import React from 'react';

const Banner = () => {
  return (
    <div className="container-custom mt-4 px-5">
      <div className="w-100 rounded-3 shadow-sm border" style={{ backgroundColor: '#2d4a61' }}>
        <div className="py-3 text-white text-center d-flex justify-content-center align-items-center gap-2" style={{ fontSize: '14px' }}>
          <span>Courses <span role="img" aria-label="star">🌟</span> Sale Ends Soon, Get It Now</span>
          <i className="fa-solid fa-arrow-right ms-2 fs-7"></i>
        </div>
      </div>
    </div>
  );
};

export default Banner;