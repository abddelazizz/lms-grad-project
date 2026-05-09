import React from 'react';
import { Link } from 'react-router-dom';

const Banner = () => {
  return (
    <Link to="/courses" className="text-decoration-none d-block">
      <div className="container-custom mt-4 px-4 px-md-5">
        <div className="w-100 shadow-sm border banner-hover-effect" style={{ 
          background: 'linear-gradient(90deg, #31506a 0%, #4a6b82 100%)',
          borderRadius: '16px',
          overflow: 'hidden',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease'
        }}>
          <div className="py-2 px-3 text-white text-center d-flex justify-content-center align-items-center gap-2" 
            style={{ 
              fontSize: '12.5px', 
              fontWeight: '600',
              fontFamily: "'Outfit', sans-serif"
            }}
          >
            <span className="d-flex align-items-center gap-2">
               <i className="fas fa-bolt text-warning"></i>
               Exclusive: Courses Sale Ends Soon, Get It Now
            </span>
            <i className="fa-solid fa-arrow-right ms-2 fs-7" style={{ opacity: 0.9 }}></i>
          </div>
        </div>
      </div>
      
      <style>{`
        .banner-hover-effect:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(49, 80, 106, 0.2) !important;
        }
        .banner-hover-effect:active {
          transform: scale(0.98);
        }
      `}</style>
    </Link>
  );
};

export default Banner;