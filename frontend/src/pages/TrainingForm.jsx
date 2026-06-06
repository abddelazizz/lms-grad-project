import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

const companiesData = {
  1: {
    name: 'DevSoft Solutions',
    logo: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjAwIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImcxIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj48c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjMDA1MkQ0Ii8+PHN0b3Agb2Zmc2V0PSI1MCUiIHN0b3AtY29sb3I9IiM0MzY0RjciLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiM2RkIxRkMiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0idXJsKCNnMSkiIHJ4PSI1MCIvPjxwYXRoIGQ9Ik03MCA2MCBMNDAgMTAwIEw3MCAxNDAgTTEzMCA2MCBMMTYwIDEwMCBMMTMwIDE0MCBNMTEwIDUwIEw5MCAxNTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIxNiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+',
    cover: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
    description: 'DevSoft Solutions is a fast-growing software company specializing in modern web and mobile applications.',
    role: 'Frontend Developer Trainee',
    duration: '3 Months (Intensive)',
    location: 'Remote / Hybrid',
    requirements: [
      'Strong understanding of HTML, CSS, and JavaScript',
      'Familiarity with React.js or similar modern frameworks',
      'Passion for building beautiful and responsive user interfaces',
      'Good communication and teamwork skills'
    ],
    benefits: [
      'Mentorship from senior engineers',
      'Real-world project experience',
      'Potential for full-time employment upon completion',
      'Monthly stipend'
    ]
  },
  2: {
    name: 'CodeNova Systems',
    logo: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjAwIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImcyIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj48c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjMTE5OThlIi8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjMzhlZjdkIi8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9InVybCgjZzIpIiByeD0iNTAiLz48Y2lyY2xlIGN4PSIxMDAiIGN5PSI1MCIgcj0iMTYiIGZpbGw9IiNmZmYiLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjEzMCIgcj0iMTYiIGZpbGw9IiNmZmYiLz48Y2lyY2xlIGN4PSIxNTAiIGN5PSIxMzAiIHI9IjE2IiBmaWxsPSIjZmZmIi8+PHBhdGggZD0iTTEwMCA2NiBMNTUgMTE4IE0xMDAgNjYgTTE0NSAxMTggTTY2IDEzMCBMMTM0IDEzMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjEyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48L3N2Zz4=',
    cover: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
    description: 'Enterprise software provider seeking fresh talent to build scalable cloud architectures.',
    role: 'Backend Engineering Intern',
    duration: '6 Months',
    location: 'On-site (Cairo HQ)',
    requirements: [
      'Proficiency in Node.js, Python, or Java',
      'Basic knowledge of SQL and NoSQL databases',
      'Understanding of RESTful APIs and system design concepts',
      'Problem-solving mindset and eagerness to learn'
    ],
    benefits: [
      'Work on highly scalable systems used by millions',
      'Access to premium learning resources and certifications',
      'Competitive intern salary and health insurance',
      'Flexible working hours'
    ]
  }
};

const TrainingForm = () => {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    portfolio: '',
    resume: null,
    coverLetter: ''
  });
  
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    // If company not found, you could redirect or show a 404
    if (companiesData[companyId]) {
      setCompany(companiesData[companyId]);
    } else {
      // Fallback
      setCompany(companiesData[1]);
    }
  }, [companyId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({ ...prev, resume: e.target.files[0] }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Show success popup
    setShowSuccess(true);
  };

  const handleCloseSuccess = () => {
    setShowSuccess(false);
    navigate('/');
  };

  if (!company) return <div className="text-center py-5">Loading...</div>;

  return (
    <div className="training-page bg-light-gray min-vh-100">
      {/* Cover Image Header */}
      <div 
        className="position-relative d-flex align-items-center justify-content-center" 
        style={{ 
          height: '350px', 
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.7)), url(${company.cover})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          marginTop: '70px' // offset for navbar
        }}
      >
        <div className="container text-center text-white position-relative z-1">
          <img 
            src={company.logo} 
            alt={company.name} 
            className="rounded-circle border border-3 border-white mb-3 shadow-lg" 
            style={{ width: '120px', height: '120px', objectFit: 'cover' }} 
          />
          <h1 className="display-4 fw-bold mb-2">{company.name}</h1>
          <p className="lead opacity-75 mb-0">{company.role}</p>
        </div>
      </div>

      <div className="container py-5">
        <Link to="/" className="text-decoration-none text-secondary mb-4 d-inline-block">
          <i className="fas fa-arrow-left me-2"></i> Back to Home
        </Link>
        
        <div className="row g-5">
          {/* Left Column: Company & Job Details */}
          <div className="col-lg-5">
            <div className="sticky-top" style={{ top: '100px' }}>
              <div className="bg-white rounded-4 p-4 shadow-sm mb-4 border-0">
                <h3 className="fw-bold mb-3 h4">About the Company</h3>
                <p className="text-secondary lh-lg">{company.description}</p>
                
                <hr className="my-4 text-light-subtle" />
                
                <h3 className="fw-bold mb-3 h4">Training Details</h3>
                <ul className="list-unstyled mb-0">
                  <li className="d-flex align-items-center mb-3">
                    <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: '40px', height: '40px'}}>
                      <i className="fas fa-briefcase"></i>
                    </div>
                    <div>
                      <small className="text-muted d-block">Role</small>
                      <span className="fw-medium">{company.role}</span>
                    </div>
                  </li>
                  <li className="d-flex align-items-center mb-3">
                    <div className="bg-success bg-opacity-10 text-success rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: '40px', height: '40px'}}>
                      <i className="fas fa-clock"></i>
                    </div>
                    <div>
                      <small className="text-muted d-block">Duration</small>
                      <span className="fw-medium">{company.duration}</span>
                    </div>
                  </li>
                  <li className="d-flex align-items-center">
                    <div className="bg-info bg-opacity-10 text-info rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: '40px', height: '40px'}}>
                      <i className="fas fa-map-marker-alt"></i>
                    </div>
                    <div>
                      <small className="text-muted d-block">Location</small>
                      <span className="fw-medium">{company.location}</span>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="bg-white rounded-4 p-4 shadow-sm border-0">
                <h3 className="fw-bold mb-3 h5">Requirements</h3>
                <ul className="text-secondary ps-3 mb-4 lh-lg">
                  {company.requirements.map((req, i) => <li key={i}>{req}</li>)}
                </ul>

                <h3 className="fw-bold mb-3 h5">What You'll Get</h3>
                <ul className="text-secondary ps-3 mb-0 lh-lg">
                  {company.benefits.map((ben, i) => <li key={i}>{ben}</li>)}
                </ul>
              </div>
            </div>
          </div>

          {/* Right Column: Application Form */}
          <div className="col-lg-7">
            <div className="bg-white rounded-4 p-5 shadow-sm border-0">
              <h2 className="fw-bold mb-1 h3">Submit Your Application</h2>
              <p className="text-secondary mb-4">Take the next step in your career by filling out the form below.</p>
              
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label htmlFor="name" className="form-label fw-medium text-dark">Full Name *</label>
                  <input type="text" className="form-control form-control-lg bg-light border-0" id="name" name="name" value={formData.name} onChange={handleChange} required placeholder="e.g. John Doe" />
                </div>
                
                <div className="row mb-4">
                  <div className="col-md-6">
                    <label htmlFor="email" className="form-label fw-medium text-dark">Email Address *</label>
                    <input type="email" className="form-control form-control-lg bg-light border-0" id="email" name="email" value={formData.email} onChange={handleChange} required placeholder="john@example.com" />
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="phone" className="form-label fw-medium text-dark">Phone Number *</label>
                    <input type="tel" className="form-control form-control-lg bg-light border-0" id="phone" name="phone" value={formData.phone} onChange={handleChange} required placeholder="+1 234 567 8900" />
                  </div>
                </div>

                <div className="mb-4">
                  <label htmlFor="portfolio" className="form-label fw-medium text-dark">Portfolio / LinkedIn URL</label>
                  <input type="url" className="form-control form-control-lg bg-light border-0" id="portfolio" name="portfolio" value={formData.portfolio} onChange={handleChange} placeholder="https://linkedin.com/in/johndoe" />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="resume" className="form-label fw-medium text-dark">Upload Resume *</label>
                  <div className="border border-2 border-dashed border-primary rounded-3 p-4 text-center bg-light transition hover-bg-white">
                    <i className="fas fa-cloud-upload-alt fa-3x text-primary mb-3"></i>
                    <p className="mb-1 fw-medium">Click to upload or drag and drop</p>
                    <p className="text-muted small mb-3">PDF, DOC, DOCX (Max. 5MB)</p>
                    <input type="file" className="form-control" id="resume" name="resume" accept=".pdf,.doc,.docx" onChange={handleFileChange} required />
                  </div>
                </div>
                
                <div className="mb-4">
                  <label htmlFor="coverLetter" className="form-label fw-medium text-dark">Cover Letter *</label>
                  <textarea className="form-control bg-light border-0" id="coverLetter" name="coverLetter" rows="5" value={formData.coverLetter} onChange={handleChange} required placeholder="Why are you the perfect fit for this training program?"></textarea>
                </div>
                
                <button type="submit" className="btn btn-primary-custom w-100 py-3 fw-bold rounded-3 fs-5 shadow-sm mt-2">
                  <i className="fas fa-paper-plane me-2"></i> Submit Application
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Success Modal Overlay */}
      {showSuccess && (
        <div className="modal-overlay d-flex justify-content-center align-items-center" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1050 }}>
          <div className="bg-white rounded-4 p-5 shadow-lg text-center position-relative animation-scale-up" style={{ width: '100%', maxWidth: '450px' }}>
            <div className="mb-4 position-relative d-inline-block">
              <div className="bg-success text-white rounded-circle d-flex align-items-center justify-content-center mx-auto" style={{ width: '90px', height: '90px', boxShadow: '0 10px 20px rgba(25,135,84,0.3)' }}>
                <i className="fas fa-check fa-3x"></i>
              </div>
            </div>
            <h3 className="fw-bold text-dark mb-2">Awesome!</h3>
            <p className="text-secondary mb-4 lh-lg">
              Your application has been successfully sent to <span className="fw-bold text-dark">{company.name}</span>. Our team will review your profile and contact you soon.
            </p>
            <button onClick={handleCloseSuccess} className="btn btn-primary-custom w-100 py-3 fw-bold rounded-3 fs-6">
              Return to Home
            </button>
          </div>
        </div>
      )}

      <style jsx="true">{`
        .border-dashed {
          border-style: dashed !important;
        }
        .animation-scale-up {
          animation: scaleUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        @keyframes scaleUp {
          from {
            transform: scale(0.8);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default TrainingForm;
