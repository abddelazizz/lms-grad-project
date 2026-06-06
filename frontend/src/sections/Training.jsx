import React from 'react';
import { Link } from 'react-router-dom';

const Training = () => {
  const companies = [
    {
      id: 1,
      name: 'DevSoft Solutions',
      logo: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjAwIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImcxIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj48c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjMDA1MkQ0Ii8+PHN0b3Agb2Zmc2V0PSI1MCUiIHN0b3AtY29sb3I9IiM0MzY0RjciLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiM2RkIxRkMiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0idXJsKCNnMSkiIHJ4PSI1MCIvPjxwYXRoIGQ9Ik03MCA2MCBMNDAgMTAwIEw3MCAxNDAgTTEzMCA2MCBMMTYwIDEwMCBMMTMwIDE0MCBNMTEwIDUwIEw5MCAxNTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIxNiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+',
      cover: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      description: 'A fast-growing software company specializing in modern web and mobile applications.',
      tags: ['Frontend', 'React', 'Remote'],
    },
    {
      id: 2,
      name: 'CodeNova Systems',
      logo: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjAwIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImcyIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj48c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjMTE5OThlIi8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjMzhlZjdkIi8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9InVybCgjZzIpIiByeD0iNTAiLz48Y2lyY2xlIGN4PSIxMDAiIGN5PSI1MCIgcj0iMTYiIGZpbGw9IiNmZmYiLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjEzMCIgcj0iMTYiIGZpbGw9IiNmZmYiLz48Y2lyY2xlIGN4PSIxNTAiIGN5PSIxMzAiIHI9IjE2IiBmaWxsPSIjZmZmIi8+PHBhdGggZD0iTTEwMCA2NiBMNTUgMTE4IE0xMDAgNjYgTTE0NSAxMTggTTY2IDEzMCBMMTM0IDEzMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjEyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48L3N2Zz4=',
      cover: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      description: 'Enterprise software provider seeking fresh talent to build scalable cloud architectures.',
      tags: ['Backend', 'Node.js', 'On-site'],
    }
  ];

  return (
    <section className="training py-5 mb-5 bg-light-gray position-relative">
      <div className="container-custom px-5">
        <div className="d-flex justify-content-between align-items-end mb-5 pb-3 border-bottom border-light-subtle">
          <div className="training-header-text pe-4">
            <span className="badge bg-dark text-white mb-2 px-3 py-2 rounded-pill fw-medium">Career Opportunities</span>
            <h2 className="display-6 fw-bold mb-3 text-dark">Training & Employment</h2>
            <p className="text-secondary mb-0 fs-5 lh-lg training-desc" style={{ maxWidth: '700px' }}>
              We partner with top companies to provide our students with exclusive training and employment opportunities.
            </p>
          </div>
          <Link to="/courses" className="btn btn-outline-dark px-4 py-2 fw-medium rounded-pill d-none d-md-inline-block">
            View All Partners
          </Link>
        </div>

        <div className="row g-5">
          {companies.map((company) => (
            <div className="col-lg-6" key={company.id}>
              <div className="card border-0 rounded-4 overflow-hidden shadow-sm hover-shadow-lg transition h-100 d-flex flex-column bg-white company-card">
                {/* Card Cover Image */}
                <div 
                  className="card-cover position-relative" 
                  style={{ 
                    height: '160px', 
                    backgroundImage: `url(${company.cover})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  <div className="position-absolute top-0 start-0 w-100 h-100" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.5))' }}></div>
                </div>
                
                <div className="card-body p-4 p-md-5 pt-0 d-flex flex-column position-relative">
                  {/* Logo overlapping the cover */}
                  <div className="mb-3" style={{ marginTop: '-45px', position: 'relative', zIndex: 2 }}>
                    <img 
                      src={company.logo} 
                      alt={company.name} 
                      className="rounded-4 border border-4 border-white shadow-sm" 
                      style={{ width: '90px', height: '90px', objectFit: 'cover', backgroundColor: '#fff' }} 
                    />
                  </div>
                  
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <h3 className="h4 fw-bold text-dark mb-0">{company.name}</h3>
                  </div>

                  {/* Tags */}
                  <div className="d-flex flex-wrap gap-2 mb-4">
                    {company.tags.map((tag, idx) => (
                      <span key={idx} className="badge bg-light text-secondary border border-light-subtle rounded-pill px-3 py-2 fw-normal">
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  <p className="text-secondary mb-4 lh-lg flex-grow-1">
                    {company.description}
                  </p>
                  
                  <Link 
                    to={`/training/apply/${company.id}`}
                    className="btn btn-primary-custom w-100 py-3 fw-bold rounded-3 d-flex justify-content-center align-items-center transition"
                  >
                    <span>View Details & Apply</span>
                    <i className="fas fa-arrow-right ms-2 fs-6"></i>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx="true">{`
        .company-card {
          transform: translateY(0);
          transition: all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
        }
        .company-card:hover {
          transform: translateY(-8px);
        }
        .hover-shadow-lg {
          box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.05) !important;
        }
        .company-card:hover .hover-shadow-lg {
          box-shadow: 0 1rem 3rem rgba(0, 0, 0, 0.1) !important;
        }
        .btn-primary-custom:hover i {
          transform: translateX(4px);
          transition: transform 0.2s ease-in-out;
        }
      `}</style>
    </section>
  );
};

export default Training;
