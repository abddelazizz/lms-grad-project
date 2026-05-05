import React, { useState, useRef, useEffect } from 'react';

const CustomDropdown = ({ label, options, value, onChange, placeholder, disabled, icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedOption = options.find(opt => String(opt.value) === String(value));

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="custom-dropdown-container w-100" ref={dropdownRef}>
      {label && <label className="small fw-bold text-muted mb-2 text-uppercase" style={{ letterSpacing: '0.5px' }}>{label}</label>}
      <div 
        className={`custom-dropdown-header ${disabled ? 'disabled' : ''} ${isOpen ? 'active' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div className="d-flex align-items-center gap-2">
          {icon && <i className={`${icon} text-primary-custom`}></i>}
          <span className={!selectedOption ? 'text-muted' : 'text-dark fw-bold'}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <i className={`fas fa-chevron-${isOpen ? 'up' : 'down'} ms-auto transition-all`}></i>
      </div>

      {isOpen && (
        <div className="custom-dropdown-list shadow-lg border-0 rounded-4 p-2 animate-slide-in">
          {options.length > 0 ? options.map((opt) => (
            <div 
              key={opt.value} 
              className={`custom-dropdown-item ${String(opt.value) === String(value) ? 'selected' : ''}`}
              onClick={() => {
                onChange({ target: { value: opt.value } });
                setIsOpen(false);
              }}
            >
              <div className="d-flex align-items-center gap-3">
                {opt.icon ? (
                  <div className={`item-icon-wrapper ${String(opt.value) === String(value) ? 'text-white' : 'text-primary-custom'}`}>
                    <i className={`fas ${opt.icon} small`}></i>
                  </div>
                ) : (
                  <div className="item-indicator"></div>
                )}
                <span className="fw-bold">{opt.label}</span>
              </div>
            </div>
          )) : (
            <div className="p-3 text-center text-muted small">No options available</div>
          )}
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-dropdown-container {
          position: relative;
          user-select: none;
        }
        .custom-dropdown-header {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 14px 20px;
          border-radius: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          font-size: 14px;
        }
        .custom-dropdown-header:hover:not(.disabled) {
          border-color: #31506a;
          background: #fff;
          box-shadow: 0 4px 12px rgba(49, 80, 106, 0.05);
        }
        .custom-dropdown-header.active {
          border-color: #31506a;
          background: #fff;
          box-shadow: 0 4px 20px rgba(49, 80, 106, 0.1);
        }
        .custom-dropdown-header.disabled {
          opacity: 0.6;
          cursor: not-allowed;
          background: #f1f5f9;
        }
        .custom-dropdown-list {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          right: 0;
          background: #fff;
          z-index: 1000;
          max-height: 300px;
          overflow-y: auto;
        }
        .custom-dropdown-item {
          padding: 12px 16px;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-bottom: 2px;
        }
        .custom-dropdown-item:hover {
          background: #f8fafc;
          color: #31506a;
        }
        .custom-dropdown-item.selected {
          background: #31506a;
          color: #fff;
        }
        .item-indicator {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
          opacity: 0.5;
        }
        .item-icon-wrapper {
          width: 28px;
          height: 28px;
          background: rgba(49, 80, 106, 0.05);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }
        .selected .item-icon-wrapper {
          background: rgba(255, 255, 255, 0.15);
        }
        .animate-slide-in {
          animation: slideIn 0.2s ease-out;
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .transition-all {
          transition: all 0.3s ease;
        }
      `}} />
    </div>
  );
};

export default CustomDropdown;
