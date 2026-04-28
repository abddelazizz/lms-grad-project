import React, { useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { contactService } from '../services/apiService';
import '../styles/Contact.css';

const Contact = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await contactService.submitForm(formData);
      toast.success(response.data.message || 'Thank you for contacting us! We will get back to you soon.');
      // Clear form after success
      setFormData({ firstName: '', lastName: '', email: '', phone: '', subject: '', message: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send message. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contact-page">
      <Toaster position="top-center" reverseOrder={false} />
      <div className="container-custom">
        <div className="section-title-wrapper text-center">
          <h1 className="display-4 fw-bold text-dark mx-auto">Contact Us</h1>
          <p className="mx-auto" style={{ maxWidth: '800px' }}>
            Have questions or need assistance? Our team is here to help you every step of the way. Reach out to us through the form below or using our contact information.
          </p>
        </div>

        <div className="contact-wrapper">
          {/* Form Side */}
          <div className="contact-form-side">
            <form onSubmit={handleSubmit} className="contact-form-grid">
              <div className="form-group">
                <label className="form-label">First Name</label>
                <input 
                  type="text" 
                  name="firstName" 
                  className="form-input" 
                  placeholder="Enter First Name" 
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input 
                  type="text" 
                  name="lastName" 
                  className="form-input" 
                  placeholder="Enter Last Name" 
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input 
                  type="email" 
                  name="email" 
                  className="form-input" 
                  placeholder="Enter your Email" 
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input 
                  type="tel" 
                  name="phone" 
                  className="form-input" 
                  placeholder="Enter Phone Number" 
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group-full">
                <label className="form-label">Subject</label>
                <input 
                  type="text" 
                  name="subject" 
                  className="form-input" 
                  placeholder="Enter your Subject" 
                  value={formData.subject}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group-full">
                <label className="form-label">Message</label>
                <textarea 
                  name="message" 
                  className="form-input" 
                  placeholder="Enter your Message here..." 
                  value={formData.message}
                  onChange={handleChange}
                  required
                ></textarea>
              </div>
              <div className="form-group-full text-center">
                <button type="submit" className="btn-send-message" disabled={loading}>
                  {loading ? 'Sending...' : 'Send Your Message'}
                </button>
              </div>
            </form>
          </div>

          {/* Info Side */}
          <div className="contact-info-side">
            <div className="info-card">
              <div className="info-icon-wrapper">
                <i className="fas fa-envelope"></i>
              </div>
              <span className="info-text">hello@skillbridge.com</span>
            </div>
            
            <div className="info-card">
              <div className="info-icon-wrapper">
                <i className="fas fa-phone-alt"></i>
              </div>
              <span className="info-text">+91 91813 23 2309</span>
            </div>

            <div className="info-card">
              <div className="info-icon-wrapper">
                <i className="fas fa-map-marker-alt"></i>
              </div>
              <span className="info-text">Somewhere in the World</span>
            </div>

            <div className="info-card social-profiles-card text-center">
              <div className="social-icons-row">
                <a href="#" className="social-icon-btn"><i className="fab fa-facebook-f"></i></a>
                <a href="#" className="social-icon-btn"><i className="fab fa-twitter"></i></a>
                <a href="#" className="social-icon-btn"><i className="fab fa-linkedin-in"></i></a>
              </div>
              <span className="form-label mt-3" style={{ fontSize: '0.85rem' }}>Social Profiles</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
