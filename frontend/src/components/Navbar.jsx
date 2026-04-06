import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';

const Navbar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    window.location.href = '/'; 
  };

  const getNavLinkClass = (path) => {
    return location.pathname === path
      ? "nav-link active-nav-link text-dark fw-medium px-4 py-2 rounded-3"
      : "nav-link text-dark fw-medium px-2 py-2";
  };

  return (
    <nav className="navbar navbar-expand-lg py-4 bg-light-custom">
      <div className="container-custom d-flex flex-wrap align-items-center justify-content-between">
        <Link className="navbar-brand" to="/">
          <img src="/images/logo.png" alt="Recode" height="60" className="d-block" />
        </Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav mx-auto gap-4">
            <li className="nav-item">
              <Link className={getNavLinkClass('/')} to="/">Home</Link>
            </li>
            <li className="nav-item">
              <Link className={getNavLinkClass('/courses')} to="/courses">Courses</Link>
            </li>
            <li className="nav-item">
              <Link className={getNavLinkClass('/about')} to="/about">About Us</Link>
            </li>
            <li className="nav-item">
              <Link className={getNavLinkClass('/contact')} to="/contact">Contact</Link>
            </li>
          </ul>
          
          <div className="d-flex align-items-center gap-4">
            {isLoggedIn ? (
              <button 
                onClick={handleLogout} 
                className="btn btn-outline-danger px-4 py-2 rounded-3 fw-medium"
              >
                Logout
              </button>
            ) : (
              <>
                <Link to="/signup" className="text-dark text-decoration-none fw-medium">Sign Up</Link>
                <Link to="/login" className="btn btn-primary-custom px-4 py-2 rounded-3 fw-medium">Login</Link>
              </>
            )}
          </div>
          
        </div>
      </div>
    </nav>
  );
};

export default Navbar;