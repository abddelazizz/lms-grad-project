import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Banner from './components/Banner';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Hero from './sections/Hero';
import Benefits from './sections/Benefits';
import Courses from './sections/Courses';
import Login from './pages/Login';
import Signup from './pages/Signup';
import VerifyEmail from './pages/VerifyEmail';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './styles/global.css';
import './styles/home.css';

function App() {
  return (
    <Router>
      <div className="bg-light-gray">
        <Banner />
        <Navbar />
        
        <Routes>
          <Route path="/" element={
            <main>
              <Hero />
              <Benefits />
              <Courses />
            </main>
          } />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
        </Routes>

        <Footer />
      </div>
    </Router>
  );
}

export default App;