import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Upload, AlertCircle, CheckCircle, Search, X, ChevronDown, Calendar } from 'lucide-react';
import BASE_URL from '../../url';
import '../styles/JobPortal.css';
import prophecyLogo2 from "../../Recruitment/Assets/images/prophecy-logo2.png";
import prophecyLogo from "../../Recruitment/Assets/images/prophecy-logo.png";

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
  'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
  'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
  'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico',
  'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania',
  'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
  'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
];

const VISA_TYPES = ['H1B', 'H4', 'L1', 'L2', 'O1', 'EB1', 'EB2', 'EB3', 'GC', 'EAD', 'USC', 'GC Holder', 'TN', 'E2'];

// Helper function to format date display
const formatDateDisplay = (dateString) => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).replace(/,/g, '');
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'N/A';
  }
};

// Helper function to parse date string to Date object
const parseDate = (dateString) => {
  if (!dateString) return null;
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    return date;
  } catch (error) {
    console.error('Error parsing date:', error);
    return null;
  }
};

// Helper function to calculate date range values
const getDateRangeValues = (range) => {
  const currentDate = new Date();
  let fromDate = null;
  let toDate = new Date();
  
  switch(range) {
    case 'today':
      fromDate = new Date(currentDate);
      break;
    case 'yesterday':
      fromDate = new Date(currentDate);
      fromDate.setDate(currentDate.getDate() - 1);
      toDate = new Date(fromDate);
      break;
    case 'thisWeek':
      fromDate = new Date(currentDate);
      const day = currentDate.getDay();
      const diff = currentDate.getDate() - day + (day === 0 ? -6 : 1);
      fromDate.setDate(diff);
      break;
    case 'lastWeek':
      fromDate = new Date(currentDate);
      fromDate.setDate(currentDate.getDate() - currentDate.getDay() - 6);
      toDate = new Date(fromDate);
      toDate.setDate(fromDate.getDate() + 6);
      break;
    case 'thisMonth':
      fromDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      break;
    case 'lastMonth':
      fromDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      toDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
      break;
    case 'endingSoon':
      fromDate = new Date();
      toDate = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      break;
    default:
      return { from: null, to: null };
  }
  
  return { from: fromDate, to: toDate };
};

// Helper function to format locations - UPDATED to use city/state/country with pipe separator
const formatLocations = (role) => {
  try {
    // Build location from city, state, country fields
    const locations = [];
    
    // For remote roles, return Remote with country (matches Recruitment Dashboard)
    if (role.roleLocation === 'Remote') {
      return 'Remote' + (role.country ? `, ${role.country}` : '');
    }
    
    // Handle city (could be comma-separated multiple cities)
    if (role.city) {
      const cities = role.city.split(',').map(c => c.trim()).filter(c => c);
      
      // Handle state (could be comma-separated multiple states)
      const states = role.state ? role.state.split(',').map(s => s.trim()).filter(s => s) : [];
      const country = role.country || '';
      
      if (cities.length > 0 && states.length > 0 && cities.length === states.length) {
        // Perfect match: equal number of cities and states
        for (let i = 0; i < cities.length; i++) {
          const location = [cities[i], states[i], country].filter(Boolean).join(', ');
          if (location) locations.push(location);
        }
      } else if (cities.length > 0 && states.length === 1) {
        // Multiple cities, one state
        for (let i = 0; i < cities.length; i++) {
          const location = [cities[i], states[0], country].filter(Boolean).join(', ');
          if (location) locations.push(location);
        }
      } else if (states.length > 0 && cities.length === 1) {
        // Multiple states, one city
        for (let i = 0; i < states.length; i++) {
          const location = [cities[0], states[i], country].filter(Boolean).join(', ');
          if (location) locations.push(location);
        }
      } else {
        // Fallback: combine all available parts
        cities.forEach(city => {
          const parts = [city];
          if (role.state) {
            // If state has multiple values, use the first one as fallback
            const firstState = role.state.split(',')[0].trim();
            parts.push(firstState);
          }
          if (role.country) parts.push(role.country);
          locations.push(parts.join(', '));
        });
      }
    } else if (role.state || role.country) {
      // No city but state/country available
      const parts = [];
      if (role.state) {
        // If state has multiple values, join them with commas
        const states = role.state.split(',').map(s => s.trim()).filter(s => s);
        parts.push(states.join(', '));
      }
      if (role.country) parts.push(role.country);
      locations.push(parts.join(', '));
    }
    
    // If we have locations, join them with pipe separator
    if (locations.length > 0) {
      // Remove duplicates
      const uniqueLocations = [...new Set(locations)];
      return uniqueLocations.join(' | ');
    }
    
    // Fallback to N/A
    return 'N/A';

  } catch (error) {
    console.error('Error formatting locations for role:', role?.role, error);
    return 'N/A';
  }
};

// Auth Required Modal
const AuthRequiredModal = ({ isOpen, onClose, onLoginClick, onSignupClick }) => {
  if (!isOpen) return null;

  return (
    <div className="jp-modal-backdrop jp-modal-backdrop-auth">
      <div className="jp-modal-box jp-modal-box-auth">
        <h2 className="jp-auth-title">Sign In Required</h2>
        <p className="jp-auth-message">
          Please sign in or create an account to apply for this position.
        </p>
        
        <div className="jp-auth-button-group">
          <button className="jp-primary-button" onClick={onLoginClick}>
            Login
          </button>
          <button className="jp-secondary-button" onClick={onSignupClick}>
            Sign Up
          </button>
        </div>

        <button className="jp-auth-browse-link" onClick={onClose}>
          Continue Browsing
        </button>
      </div>
    </div>
  );
};

// Job Details Modal
const JobDetailsModal = ({ isOpen, onClose, job, onApplyClick }) => {
  if (!isOpen || !job) return null;

  return (
    <div className="jp-modal-backdrop jp-modal-backdrop-details">
      <div className="jp-modal-box jp-modal-box-details">
        <div className="jp-modal-header">
          <h2 className="jp-modal-header-text">{job.role}</h2>
          <button className="jp-modal-close-icon" onClick={onClose}>×</button>
        </div>
        <div className="jp-modal-body">
          <div className="jp-job-detail">
            <h3 className="jp-job-detail-label">Role Type</h3>
            <p className="jp-job-detail-content">{job.roleType || 'N/A'}</p>
          </div>

          <div className="jp-job-detail">
            <h3 className="jp-job-detail-label">Location</h3>
            <p className="jp-job-detail-content">
              {formatLocations(job) || 'N/A'}
            </p>
          </div>

          <div className="jp-job-detail">
            <h3 className="jp-job-detail-label">Work Mode</h3>
            <p className="jp-job-detail-content">{job.roleLocation || 'Onsite'}</p>
          </div>

          <div className="jp-job-detail">
            <h3 className="jp-job-detail-label">Experience</h3>
            <p className="jp-job-detail-content">{job.experience || 'N/A'}</p>
          </div>

          <div className="jp-job-detail">
            <h3 className="jp-job-detail-label">Posted Date</h3>
            <p className="jp-job-detail-content">
              {formatDateDisplay(job.postedDate) || 'N/A'}
            </p>
          </div>

          <div className="jp-job-detail">
            <h3 className="jp-job-detail-label">Description</h3>
            <div className="jp-job-desc">
              {(() => {
                const desc = job.description || job.jobDescription || 'No description available';
                
                const cleanDesc = desc
                  .replace(/<[^>]*>/g, '')
                  .replace(/&nbsp;/g, ' ')
                  .replace(/&lt;/g, '<')
                  .replace(/&gt;/g, '>')
                  .replace(/&amp;/g, '&')
                  .trim();

                const sections = cleanDesc.split(/(?=(?:position|experience|location|employment type|about the role|key responsibilities|required skills|preferred|additional skills|educational qualification|soft skills)[\s:]*)/i);

                return sections.map((section, idx) => {
                  if (!section.trim()) return null;

                  const lines = section.split('\n').map(l => l.trim()).filter(l => l);
                  if (lines.length === 0) return null;

                  const firstLine = lines[0];
                  const isHeader = /^(position|experience|location|employment type|about the role|key responsibilities|required skills|preferred|additional skills|educational qualification|soft skills)[\s:]*$/i.test(firstLine);

                  if (isHeader) {
                    const headerText = firstLine.replace(/[\s:]*$/i, '');
                    const contentLines = lines.slice(1);

                    return (
                      <div key={idx} className="jp-job-desc-section">
                        <h4 className="jp-job-desc-heading">{headerText}</h4>
                        <div className="jp-job-desc-list">
                          {contentLines.map((line, lineIdx) => {
                            const trimmed = line.trim();
                            if (!trimmed) return null;

                            if (trimmed.match(/^[\*•\-]/)) {
                              return (
                                <div key={lineIdx} className="jp-job-desc-item">
                                  <span className="jp-job-desc-bullet">•</span>
                                  <span>{trimmed.replace(/^[\*•\-]\s*/, '')}</span>
                                </div>
                              );
                            }

                            return (
                              <p key={lineIdx} className="jp-job-desc-paragraph">
                                {trimmed}
                              </p>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }

                  if (firstLine.match(/^[\*•\-]/)) {
                    return (
                      <div key={idx} className="jp-job-desc-item">
                        <span className="jp-job-desc-bullet">•</span>
                        <span>{firstLine.replace(/^[\*•\-]\s*/, '')}</span>
                      </div>
                    );
                  }

                  return (
                    <p key={idx} className="jp-job-desc-paragraph">
                      {lines.join(' ')}
                    </p>
                  );
                }).filter(Boolean);
              })()}
            </div>
          </div>

          <button
            onClick={() => {
              onApplyClick(job);
              onClose();
            }}
            className="jp-apply-button jp-details-apply-button"
          >
            Apply Now
          </button>
        </div>
      </div>
    </div>
  );
};

// Candidate Form Popup
const CandidateFormPopup = ({ isOpen, onClose, selectedRole }) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    position: '',
    visa_type: '',
    current_state: '',
    current_city: '',
    employment_type: []
  });

  const [resumeFile, setResumeFile] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const pendingApplication = localStorage.getItem('pendingJobApplication');
      if (pendingApplication) {
        const role = JSON.parse(pendingApplication);
        setFormData(prev => ({
          ...prev,
          position: role.role
        }));
        localStorage.removeItem('pendingJobApplication');
      } else if (selectedRole && selectedRole.role) {
        setFormData(prev => ({
          ...prev,
          position: selectedRole.role
        }));
      }
    }
  }, [isOpen, selectedRole]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    setError('');
  };

  const handleEmploymentTypeChange = (type) => {
    setFormData(prev => ({
      ...prev,
      employment_type: prev.employment_type.includes(type)
        ? prev.employment_type.filter(t => t !== type)
        : [...prev.employment_type, type]
    }));
  };

  const handleFileUpload = (file) => {
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const validExtensions = ['.pdf', '.doc', '.docx'];
    
    const fileName = file.name.toLowerCase();
    const fileType = file.type;
    const ext = fileName.substring(fileName.lastIndexOf('.'));

    if (!validTypes.includes(fileType) && !validExtensions.includes(ext)) {
      setError('Invalid file type. Please upload PDF, DOC, or DOCX files only.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size exceeds 5MB limit.');
      return;
    }

    setResumeFile(file);
    setError('');
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files?.[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files?.[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.first_name.trim()) { setError('First name is required'); return; }
    if (!formData.last_name.trim()) { setError('Last name is required'); return; }
    if (!formData.email.trim()) { setError('Email is required'); return; }
    if (!formData.phone.trim()) { setError('Phone number is required'); return; }
    if (!resumeFile) { setError('Resume file is required'); return; }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('first_name', formData.first_name);
      formDataToSend.append('last_name', formData.last_name);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('position', formData.position);
      formDataToSend.append('visa_type', formData.visa_type || '');
      formDataToSend.append('current_state', formData.current_state || '');
      formDataToSend.append('current_city', formData.current_city || '');
      formDataToSend.append('employment_type', formData.employment_type.join(',') || '');
      formDataToSend.append('resume', resumeFile);

      const response = await fetch(`${BASE_URL}/api/ats/apply`, {
        method: 'POST',
        body: formDataToSend
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Failed to submit application');
        return;
      }

      setSubmitted(true);
      setTimeout(() => {
        onClose();
        setSubmitted(false);
      }, 2000);
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="jp-modal-backdrop">
      <div className="jp-modal-box">
        <div className="jp-modal-header">
          <h2 className="jp-modal-header-text">Apply for Position</h2>
          <button className="jp-modal-close-icon" onClick={onClose}>×</button>
        </div>
        <div className="jp-modal-body">
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="jp-alert jp-alert-error">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            {submitted && (
              <div className="jp-alert jp-alert-success">
                <CheckCircle size={18} />
                <span>✓ Application submitted successfully!</span>
              </div>
            )}

            {!submitted && (
              <>
                <div className="jp-form-grid">
                  <div className="jp-form-field">
                    <label className="jp-form-label">First Name *</label>
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      placeholder="Enter first name"
                      className="jp-form-input"
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="jp-form-field">
                    <label className="jp-form-label">Last Name *</label>
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      placeholder="Enter last name"
                      className="jp-form-input"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="jp-form-grid">
                  <div className="jp-form-field">
                    <label className="jp-form-label">Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter email"
                      className="jp-form-input"
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="jp-form-field">
                    <label className="jp-form-label">Phone *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Enter phone number"
                      className="jp-form-input"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="jp-form-field jp-form-field-full">
                  <label className="jp-form-label">Position *</label>
                  <input
                    type="text"
                    name="position"
                    value={formData.position}
                    disabled={true}
                    className="jp-form-input jp-form-input-disabled"
                  />
                </div>

                <div className="jp-form-grid">
                  <div className="jp-form-field">
                    <label className="jp-form-label">Visa Type</label>
                    <select
                      name="visa_type"
                      value={formData.visa_type}
                      onChange={handleInputChange}
                      disabled={loading}
                      className="jp-form-select"
                    >
                      <option value="">Select Visa Type</option>
                      {VISA_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="jp-form-field">
                    <label className="jp-form-label">State</label>
                    <select
                      name="current_state"
                      value={formData.current_state}
                      onChange={handleInputChange}
                      disabled={loading}
                      className="jp-form-select"
                    >
                      <option value="">Select State</option>
                      {US_STATES.map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="jp-form-field jp-form-field-full">
                  <label className="jp-form-label">City</label>
                  <input
                    type="text"
                    name="current_city"
                    value={formData.current_city}
                    onChange={handleInputChange}
                    placeholder="Enter city"
                    className="jp-form-input"
                    disabled={loading}
                  />
                </div>

                <div className="jp-form-field jp-form-field-full">
                  <label className="jp-form-label">Employment Type</label>
                  <div className="jp-form-checkbox-group">
                    {['W2', 'C2C'].map(type => (
                      <label key={type} className="jp-form-checkbox-label">
                        <input
                          type="checkbox"
                          checked={formData.employment_type.includes(type)}
                          onChange={() => handleEmploymentTypeChange(type)}
                          disabled={loading}
                          className="jp-form-checkbox"
                        />
                        <span>{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="jp-form-field jp-form-field-full">
                  <label className="jp-form-label">Upload Resume *</label>
                  <div
                    className={`jp-file-drop-zone ${dragActive ? 'jp-file-drop-active' : ''}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      onChange={handleFileInputChange}
                      accept=".pdf,.doc,.docx"
                      required
                      disabled={loading}
                      className="jp-file-input-hidden"
                    />
                    <label className="jp-file-label">
                      {resumeFile ? (
                        <>
                          <CheckCircle size={28} className="jp-file-icon" />
                          <div className="jp-file-success-text">
                            Selected: {resumeFile.name}
                          </div>
                        </>
                      ) : (
                        <>
                          <Upload size={28} className="jp-file-icon" />
                          <div className="jp-file-text">
                            {dragActive ? 'Drop your resume here' : 'Click to upload or drag and drop'}
                          </div>
                          <div className="jp-file-hint">
                            PDF, DOC, or DOCX (max 5MB)
                          </div>
                        </>
                      )}
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  className="jp-submit-button"
                  disabled={loading}
                >
                  {loading ? 'Submitting...' : 'Submit Application'}
                </button>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

// Location Tooltip Modal
const LocationTooltipModal = ({ isOpen, onClose, locations }) => {
  if (!isOpen || !locations || locations.length === 0) return null;

  return (
    <div 
      className="jp-location-tooltip-backdrop"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 999
      }}
    >
      <style>{`
        .jp-location-tooltip-box {
          visibility: visible;
          position: absolute;
          bottom: 120%;
          left: 0;
          background-color: #2d3748;
          color: white;
          padding: 10px 12px;
          border-radius: 6px;
          font-size: 0.85rem;
          white-space: normal;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          z-index: 9999;
          line-height: 1.5;
          font-weight: 500;
          width: auto;
          max-width: 350px;
          pointer-events: auto;
        }

        .jp-location-tooltip-box::after {
          content: '';
          position: absolute;
          bottom: -6px;
          left: 10px;
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 6px solid #2d3748;
        }

        .jp-location-tooltip-title {
          margin: 0 0 8px 0;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .jp-location-tooltip-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .jp-location-tooltip-item {
          font-size: 0.85rem;
          line-height: 1.4;
          padding: 2px 0;
        }
      `}</style>
      
      <div 
        className="jp-location-tooltip-box"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="jp-location-tooltip-title">All Locations:</div>
        <div className="jp-location-tooltip-list">
          {locations.map((loc, idx) => (
            <div key={idx} className="jp-location-tooltip-item">
              {loc}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Multiselect Filter Component - UPDATED with isOpen and onToggleOpen props
const MultiSelectFilter = ({ 
  label, 
  items, 
  selected, 
  onToggle, 
  onClear, 
  placeholder = "Select items",
  isOpen,
  onToggleOpen
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Ensure items are unique before filtering
  const uniqueItems = [...new Set(items)];
  
  const filteredItems = uniqueItems.filter(item =>
    item.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggle = () => {
    onToggleOpen(isOpen ? null : label);
  };

  return (
    <div className="jp-multiselect-container">
      <label className="jp-filter-label">{label}</label>
      <div className="jp-multiselect-wrapper">
        <div
          className="jp-multiselect-toggle"
          onClick={handleToggle}
        >
          <span>
            {selected.length === 0
              ? placeholder
              : `${selected.length} Selected`}
          </span>
          <ChevronDown
            size={20}
            className={`jp-chevron-icon ${isOpen ? 'jp-chevron-open' : ''}`}
          />
        </div>

        {isOpen && (
          <div className="jp-multiselect-menu">
            <div className="jp-multiselect-search">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="jp-multiselect-search-input"
              />
            </div>
            <div className="jp-multiselect-options">
              <div
                className="jp-multiselect-option"
                onClick={() => {
                  onClear();
                  setSearchQuery('');
                  onToggleOpen(null);
                }}
              >
                ✓ Clear All
              </div>
              {filteredItems.map(item => (
                <label key={item} className="jp-multiselect-option jp-checkbox-option">
                  <input
                    type="checkbox"
                    checked={selected.includes(item)}
                    onChange={() => onToggle(item)}
                    className="jp-multiselect-checkbox"
                  />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Simplified Date Range Filter Component - UPDATED with isOpen and onToggleOpen props
const DateRangeFilterSimple = ({ 
  label, 
  selectedRange, 
  fromDate, 
  toDate, 
  onRangeSelect, 
  onFromDateChange, 
  onToDateChange, 
  onApply, 
  onClear,
  isOpen,
  onToggleOpen
}) => {
  
  const getRangeLabel = () => {
    switch(selectedRange) {
      case 'allTime': return 'All Time';
      case 'today': return 'Today';
      case 'yesterday': return 'Yesterday';
      case 'thisWeek': return 'This Week';
      case 'lastWeek': return 'Last Week';
      case 'thisMonth': return 'This Month';
      case 'lastMonth': return 'Last Month';
      case 'endingSoon': return 'Ending Soon';
      case 'customRange': 
        if (fromDate && toDate) {
          return `${formatDateDisplay(fromDate)} to ${formatDateDisplay(toDate)}`;
        }
        return 'Custom Range';
      default: return 'Select Range';
    }
  };

  const handleToggle = () => {
    onToggleOpen(isOpen ? null : label);
  };

  const handleRangeSelect = (range) => {
    onRangeSelect(range);
    if (range !== 'customRange') {
      onToggleOpen(null);
    }
  };

  return (
    <div className="jp-multiselect-container">
      <label className="jp-filter-label">{label}</label>
      <div className="jp-multiselect-wrapper">
        <div
          className="jp-multiselect-toggle"
          onClick={handleToggle}
        >
          <span>{getRangeLabel()}</span>
          <ChevronDown
            size={20}
            className={`jp-chevron-icon ${isOpen ? 'jp-chevron-open' : ''}`}
          />
        </div>

        {isOpen && (
          <div className="jp-multiselect-menu jp-date-range-menu">
            <div className="jp-date-range-content">
              <div 
                className={`jp-multiselect-option ${selectedRange === 'allTime' ? 'jp-multiselect-option-selected' : ''}`} 
                onClick={() => handleRangeSelect('allTime')}
              >
                All Time
              </div>
              <div 
                className={`jp-multiselect-option ${selectedRange === 'today' ? 'jp-multiselect-option-selected' : ''}`} 
                onClick={() => handleRangeSelect('today')}
              >
                Today
              </div>
              <div 
                className={`jp-multiselect-option ${selectedRange === 'yesterday' ? 'jp-multiselect-option-selected' : ''}`} 
                onClick={() => handleRangeSelect('yesterday')}
              >
                Yesterday
              </div>
              <div 
                className={`jp-multiselect-option ${selectedRange === 'thisWeek' ? 'jp-multiselect-option-selected' : ''}`} 
                onClick={() => handleRangeSelect('thisWeek')}
              >
                This Week
              </div>
              <div 
                className={`jp-multiselect-option ${selectedRange === 'lastWeek' ? 'jp-multiselect-option-selected' : ''}`} 
                onClick={() => handleRangeSelect('lastWeek')}
              >
                Last Week
              </div>
              <div 
                className={`jp-multiselect-option ${selectedRange === 'thisMonth' ? 'jp-multiselect-option-selected' : ''}`} 
                onClick={() => handleRangeSelect('thisMonth')}
              >
                This Month
              </div>
              <div 
                className={`jp-multiselect-option ${selectedRange === 'lastMonth' ? 'jp-multiselect-option-selected' : ''}`} 
                onClick={() => handleRangeSelect('lastMonth')}
              >
                Last Month
              </div>
              <div 
                className={`jp-multiselect-option ${selectedRange === 'endingSoon' ? 'jp-multiselect-option-selected' : ''}`} 
                onClick={() => handleRangeSelect('endingSoon')}
              >
                Ending Soon
              </div>
              
              <div className="jp-date-range-divider"></div>
              
              <div className="jp-date-range-custom">
                <div 
                  className={`jp-multiselect-option ${selectedRange === 'customRange' ? 'jp-multiselect-option-selected' : ''}`} 
                  onClick={() => handleRangeSelect('customRange')}
                >
                  Custom Range
                </div>
                
                {selectedRange === 'customRange' && (
                  <div className="jp-custom-range-inputs">
                    <div className="jp-custom-date-inputs">
                      <div className="jp-custom-date-group">
                        <label className="jp-custom-date-label">From:</label>
                        <input
                          type="date"
                          value={fromDate}
                          onChange={(e) => onFromDateChange(e.target.value)}
                          className="jp-custom-date-input"
                          max={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      <div className="jp-custom-date-group">
                        <label className="jp-custom-date-label">To:</label>
                        <input
                          type="date"
                          value={toDate}
                          onChange={(e) => onToDateChange(e.target.value)}
                          className="jp-custom-date-input"
                          max={new Date().toISOString().split('T')[0]}
                          min={fromDate}
                        />
                      </div>
                    </div>
                    <div className="jp-custom-range-buttons">
                      <button
                        onClick={() => {
                          onClear();
                          onToggleOpen(null);
                        }}
                        className="jp-custom-clear-btn"
                      >
                        Clear
                      </button>
                      <button
                        onClick={() => {
                          onApply();
                          onToggleOpen(null);
                        }}
                        className="jp-custom-apply-btn"
                        disabled={!fromDate || !toDate}
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Main Component
export default function JobOpenPortal() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRole, setSelectedRole] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedJobForDetails, setSelectedJobForDetails] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [hoveredLocationRole, setHoveredLocationRole] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [showLocationTooltip, setShowLocationTooltip] = useState(false);
  const [tooltipLocations, setTooltipLocations] = useState([]);
  const [keywordSearch, setKeywordSearch] = useState('');
  const [keywordTags, setKeywordTags] = useState([]);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [selectedExperience, setSelectedExperience] = useState([]);
  const [selectedWorkModes, setSelectedWorkModes] = useState([]);
  const [selectedDateRange, setSelectedDateRange] = useState('allTime');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(15);
  // NEW: State to track which dropdown is open
  const [openDropdown, setOpenDropdown] = useState(null);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BASE_URL}/api/recruitment/public/roles`);
      let rolesArray = response.data || [];
      
      if (Array.isArray(rolesArray)) {
        rolesArray = rolesArray.filter(role => role.status === 'Active');
      }
      
      setRoles(rolesArray);
      setCurrentPage(1);
      setError('');
    } catch (err) {
      console.error('Error fetching roles:', err.response?.data || err.message);
      setError('Failed to load job openings. Please try again later.');
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  const isUserAuthenticated = () => {
    const token = localStorage.getItem('token');
    return !!token;
  };

  const handleApplyClick = (role) => {
    const isAuth = isUserAuthenticated();
    
    if (!isAuth) {
      localStorage.removeItem('pendingJobApplication');
      const actualJobId = role?.jobId || role?.job_id || role?.id;
      const jobData = { id: actualJobId, role: role?.role };
      localStorage.setItem('pendingJobApplication', JSON.stringify(jobData));
      setShowAuthModal(true);
      return;
    } else {
      setSelectedRole(role);
      setShowForm(true);
    }
  };

  const handleJobTitleClick = (role) => {
    window.location.href = `/job/${role.id}`;
  };

  const handleLoginRedirect = () => {
    window.location.href = '/login';
  };

  const handleSignupRedirect = () => {
    window.location.href = '/signup';
  };

  const getAllLocations = () => {
    const locations = new Set();
    roles.forEach(role => {
      try {
        const locs = formatLocations(role);
        if (locs && locs !== 'N/A') {
          // If it contains pipe, split and add each location
          if (locs.includes('|')) {
            locs.split(' | ').forEach(loc => {
              if (loc && loc.trim() !== 'N/A') {
                locations.add(loc.trim());
              }
            });
          } else {
            locations.add(locs);
          }
        }
      } catch (error) {
        console.error('Error getting locations for role:', error);
      }
    });
    
    // Convert Set to Array and sort alphabetically
    return Array.from(locations).sort((a, b) => a.localeCompare(b));
  };

  const getAllRoleNames = () => {
    const roleNames = new Set();
    roles.forEach(role => {
      if (role.role) roleNames.add(role.role);
    });
    return Array.from(roleNames).sort();
  };

  const getAllExperience = () => {
    const experiences = new Set();
    roles.forEach(role => {
      if (role.experience) experiences.add(role.experience);
    });
    return Array.from(experiences).sort();
  };

  const getAllWorkModes = () => {
    const modes = new Set();
    roles.forEach(role => {
      if (role.roleLocation) modes.add(role.roleLocation);
    });
    return Array.from(modes).sort();
  };

  const handleLocationToggle = (location) => {
    setSelectedLocations(prev => 
      prev.includes(location) 
        ? prev.filter(loc => loc !== location)
        : [...prev, location]
    );
    setCurrentPage(1);
  };

  const handleRoleToggle = (role) => {
    setSelectedRoles(prev =>
      prev.includes(role)
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
    setCurrentPage(1);
  };

  const handleExperienceToggle = (exp) => {
    setSelectedExperience(prev =>
      prev.includes(exp)
        ? prev.filter(e => e !== exp)
        : [...prev, exp]
    );
    setCurrentPage(1);
  };

  const handleWorkModeToggle = (mode) => {
    setSelectedWorkModes(prev =>
      prev.includes(mode)
        ? prev.filter(m => m !== mode)
        : [...prev, mode]
    );
    setCurrentPage(1);
  };

  const handleKeywordSearch = (e) => {
    if (e.key === 'Enter' && keywordSearch.trim()) {
      const keyword = keywordSearch.trim();
      if (!keywordTags.includes(keyword)) {
        setKeywordTags(prev => [...prev, keyword]);
      }
      setKeywordSearch('');
      setCurrentPage(1);
    }
  };

  const handleRemoveKeywordTag = (tag) => {
    setKeywordTags(prev => prev.filter(t => t !== tag));
    setCurrentPage(1);
  };

  const handleClearAllFilters = () => {
    setKeywordSearch('');
    setKeywordTags([]);
    setSelectedLocations([]);
    setSelectedRoles([]);
    setSelectedExperience([]);
    setSelectedWorkModes([]);
    setSelectedDateRange('allTime');
    setDateFromFilter('');
    setDateToFilter('');
    setCurrentPage(1);
  };

  // UPDATED: Changed from some() to every() to require ALL keywords to match (AND logic)
  const filteredRoles = roles.filter(role => {
    const matchesKeyword = keywordTags.length === 0 || keywordTags.every(keyword => {
      const searchTerm = keyword.toLowerCase();
      const roleTitle = (role.role || '').toLowerCase();
      const roleType = (role.roleType || '').toLowerCase();
      const experience = (role.experience || '').toLowerCase();
      const workMode = (role.roleLocation || '').toLowerCase();
      const locations = formatLocations(role).toLowerCase();
      const description = (role.description || role.jobDescription || '').toLowerCase();
      
      return roleTitle.includes(searchTerm) ||
             roleType.includes(searchTerm) ||
             experience.includes(searchTerm) ||
             workMode.includes(searchTerm) ||
             locations.includes(searchTerm) ||
             description.includes(searchTerm);
    });
    
    const matchesLocation = selectedLocations.length === 0 || 
      (() => {
        const roleLocations = formatLocations(role);
        if (roleLocations.includes('|')) {
          return roleLocations.split(' | ').some(loc => selectedLocations.includes(loc));
        }
        return selectedLocations.includes(roleLocations);
      })();
    
    const matchesRole = selectedRoles.length === 0 || selectedRoles.includes(role.role);
    
    const matchesExperience = selectedExperience.length === 0 || 
      (role.experience && selectedExperience.includes(role.experience));
    
    const matchesWorkMode = selectedWorkModes.length === 0 || selectedWorkModes.includes(role.roleLocation);

    let matchesDateRange = true;
    if (selectedDateRange !== 'allTime') {
      const roleDate = parseDate(role.postedDate);
      if (roleDate) {
        let fromDate = null;
        let toDate = null;
        
        if (selectedDateRange === 'customRange') {
          fromDate = dateFromFilter ? parseDate(dateFromFilter) : null;
          toDate = dateToFilter ? parseDate(dateToFilter) : null;
        } else {
          const rangeValues = getDateRangeValues(selectedDateRange);
          fromDate = rangeValues.from;
          toDate = rangeValues.to;
        }
        
        if (fromDate) {
          const startOfDay = new Date(fromDate);
          startOfDay.setHours(0, 0, 0, 0);
          if (roleDate < startOfDay) {
            matchesDateRange = false;
          }
        }
        
        if (toDate) {
          const endOfDay = new Date(toDate);
          endOfDay.setHours(23, 59, 59, 999);
          if (roleDate > endOfDay) {
            matchesDateRange = false;
          }
        }
      }
    }
    
    return matchesKeyword && matchesLocation && matchesRole && matchesExperience && matchesWorkMode && matchesDateRange;
  });

  const totalRoles = filteredRoles.length;
  const totalPages = Math.ceil(filteredRoles.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRoles = filteredRoles.slice(startIndex, startIndex + itemsPerPage);

  const PaginationButton = ({ page, isActive, onClick }) => (
    <button
      onClick={onClick}
      className={`jp-page-button ${isActive ? 'jp-page-button-active' : ''}`}
    >
      {page}
    </button>
  );

  const hasActiveFilters = keywordTags.length > 0 || selectedLocations.length > 0 || 
                          selectedRoles.length > 0 || selectedExperience.length > 0 || 
                          selectedWorkModes.length > 0 || selectedDateRange !== 'allTime';

  return (
    <div className="jp-main-container">
      <div className="jp-logo-section">
        <div className="jp-logo-container">
          <img src={prophecyLogo2} alt="Company Logo Icon" className="jp-logo-icon" />
          <img src={prophecyLogo} alt="Company Logo" className="jp-logo-text" />
        </div>
      </div>

      <div className="jp-header-section">
        <h1 className="jp-header-title">Join Our Team</h1>
        <p className="jp-header-subtitle">Explore our open positions and apply today</p>
      </div>

      <div className="jp-stats-wrapper">
        <div className="jp-stat-card jp-stat-card-primary">
          <div className="jp-stat-number jp-stat-number-primary">{roles.length}</div>
          <div className="jp-stat-label">Total Roles</div>
        </div>

        <div className="jp-stat-card jp-stat-card-success">
          <div className="jp-stat-number jp-stat-number-success">{filteredRoles.length}</div>
          <div className="jp-stat-label">Active Roles</div>
        </div>
      </div>

      <div className="jp-filters-wrapper">
        <div className="jp-filters-content">
          <div className="jp-search-group">
            <label className="jp-search-label" style={{fontWeight: 'bold', fontSize: '18px'}}>
              Search by Keyword
            </label>
            <div className="jp-search-container">
              <Search size={18} className="jp-search-icon" />
              <input
                type="text"
                placeholder="Search by skills, location, role, experience... (Press Enter to add)"
                value={keywordSearch}
                onChange={(e) => setKeywordSearch(e.target.value)}
                onKeyDown={handleKeywordSearch}
                className="jp-search-field"
              />
              {keywordSearch && (
                <button
                  onClick={() => setKeywordSearch('')}
                  className="jp-search-clear-btn"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>

          <div className="jp-filters-grid">
            <MultiSelectFilter
              label="Role"
              items={getAllRoleNames()}
              selected={selectedRoles}
              onToggle={handleRoleToggle}
              onClear={() => {
                setSelectedRoles([]);
                setCurrentPage(1);
              }}
              placeholder="Select Roles"
              isOpen={openDropdown === "Role"}
              onToggleOpen={setOpenDropdown}
            />

            <MultiSelectFilter
              label="Experience"
              items={getAllExperience()}
              selected={selectedExperience}
              onToggle={handleExperienceToggle}
              onClear={() => {
                setSelectedExperience([]);
                setCurrentPage(1);
              }}
              placeholder="Select Experience"
              isOpen={openDropdown === "Experience"}
              onToggleOpen={setOpenDropdown}
            />

            <MultiSelectFilter
              label="Location"
              items={getAllLocations()}
              selected={selectedLocations}
              onToggle={handleLocationToggle}
              onClear={() => {
                setSelectedLocations([]);
                setCurrentPage(1);
              }}
              placeholder="Select Location"
              isOpen={openDropdown === "Location"}
              onToggleOpen={setOpenDropdown}
            />

            <MultiSelectFilter
              label="Work Mode"
              items={getAllWorkModes()}
              selected={selectedWorkModes}
              onToggle={handleWorkModeToggle}
              onClear={() => {
                setSelectedWorkModes([]);
                setCurrentPage(1);
              }}
              placeholder="Select Work Mode"
              isOpen={openDropdown === "Work Mode"}
              onToggleOpen={setOpenDropdown}
            />

            <DateRangeFilterSimple
              label="Posted Date"
              selectedRange={selectedDateRange}
              fromDate={dateFromFilter}
              toDate={dateToFilter}
              onRangeSelect={(range) => {
                setSelectedDateRange(range);
                setCurrentPage(1);
              }}
              onFromDateChange={(date) => {
                setDateFromFilter(date);
              }}
              onToDateChange={(date) => {
                setDateToFilter(date);
              }}
              onApply={() => {
                setCurrentPage(1);
              }}
              onClear={() => {
                setSelectedDateRange('allTime');
                setDateFromFilter('');
                setDateToFilter('');
                setCurrentPage(1);
              }}
              isOpen={openDropdown === "Posted Date"}
              onToggleOpen={setOpenDropdown}
            />
          </div>

          {hasActiveFilters && (
            <button
              onClick={handleClearAllFilters}
              className="jp-clear-all-filters-btn"
            >
              Clear All Filters
            </button>
          )}
        </div>
      </div>

      {hasActiveFilters && (
        <div className="jp-showing-results-wrapper">
          <div className="jp-showing-results-content">
            <span className="jp-showing-results-label">Showing results for:</span>
            <div className="jp-showing-results-tags">
              {keywordTags.map((tag, index) => (
                <div key={`keyword-${index}`} className="jp-result-tag">
                  <span>{tag}</span>
                  <button
                    onClick={() => handleRemoveKeywordTag(tag)}
                    className="jp-result-tag-close"
                  >
                    ×
                  </button>
                </div>
              ))}
              {selectedRoles.map((role, index) => (
                <div key={`role-${index}`} className="jp-result-tag">
                  <span>{role}</span>
                  <button
                    onClick={() => handleRoleToggle(role)}
                    className="jp-result-tag-close"
                  >
                    ×
                  </button>
                </div>
              ))}
              {selectedExperience.map((exp, index) => (
                <div key={`exp-${index}`} className="jp-result-tag">
                  <span>{exp}</span>
                  <button
                    onClick={() => handleExperienceToggle(exp)}
                    className="jp-result-tag-close"
                  >
                    ×
                  </button>
                </div>
              ))}
              {selectedLocations.map((loc, index) => (
                <div key={`loc-${index}`} className="jp-result-tag">
                  <span>{loc}</span>
                  <button
                    onClick={() => handleLocationToggle(loc)}
                    className="jp-result-tag-close"
                  >
                    ×
                  </button>
                </div>
              ))}
              {selectedWorkModes.map((mode, index) => (
                <div key={`mode-${index}`} className="jp-result-tag">
                  <span>{mode}</span>
                  <button
                    onClick={() => handleWorkModeToggle(mode)}
                    className="jp-result-tag-close"
                  >
                    ×
                  </button>
                </div>
              ))}
              {selectedDateRange !== 'allTime' && (
                <div className="jp-result-tag">
                  <span>
                    {selectedDateRange === 'customRange'
                      ? `Posted: ${dateFromFilter ? formatDateDisplay(dateFromFilter) : 'Any'} to ${dateToFilter ? formatDateDisplay(dateToFilter) : 'Today'}`
                      : `Posted: ${selectedDateRange.charAt(0).toUpperCase() + selectedDateRange.slice(1)}`
                    }
                  </span>
                  <button
                    onClick={() => {
                      setSelectedDateRange('allTime');
                      setDateFromFilter('');
                      setDateToFilter('');
                      setCurrentPage(1);
                    }}
                    className="jp-result-tag-close"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="jp-table-section">
        {loading ? (
          <div className="jp-loading-message">Loading job openings...</div>
        ) : error ? (
          <div className="jp-error-message">{error}</div>
        ) : filteredRoles.length === 0 ? (
          <div className="jp-empty-message">
            No job openings match your search criteria. Try adjusting your filters.
          </div>
        ) : (
          <>
            <div className="jp-table-wrapper">
              <table className="jp-table-main">
                <thead className="jp-table-header">
                  <tr>
                    <th>Role Title</th>
                    <th>Role Type</th>
                    <th>Location</th>
                    <th>Work Mode</th>
                    <th>Experience</th>
                    <th>Posted Date</th>
                    <th className="jp-table-action-header">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRoles.map((role, index) => {
                    const locations = formatLocations(role);
                    return (
                      <tr key={role.id} className={`${index % 2 === 0 ? 'jp-table-row-even' : ''} jp-table-row`}>
                        <td className="jp-table-cell">
                          <span className="jp-table-role-link" onClick={() => handleJobTitleClick(role)}>
                            {role.role}
                          </span>
                        </td>
                        <td className="jp-table-cell">
                          <span className="jp-badge jp-badge-type">{role.roleType || 'N/A'}</span>
                        </td>
                        <td className="jp-table-cell jp-table-location-cell" style={{ position: 'relative', overflow: 'visible' }}>
                          <div className="jp-location-cell-wrapper" style={{ position: 'relative', overflow: 'visible' }}>
                            <span 
                              className={`jp-location-display ${locations.includes('|') ? 'jp-location-clickable' : ''}`}
                              onMouseEnter={(e) => {
                                if (locations.includes('|')) {
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  setTooltipPosition({
                                    top: rect.top - 120,
                                    left: rect.left
                                  });
                                  setHoveredLocationRole(role.id);
                                }
                              }}
                              onMouseLeave={() => setHoveredLocationRole(null)}
                              style={{
                                cursor: locations.includes('|') ? 'pointer' : 'default',
                                color: locations.includes('|') ? '#0066cc' : 'inherit',
                                textDecoration: locations.includes('|') ? 'underline' : 'none',
                                position: 'relative',
                                display: 'inline-block'
                              }}
                            >
                              {locations ? (
                                <>
                                  <span>{locations.split(' | ')[0]}</span>
                                  {locations.split(' | ').length > 1 && (
                                    <span className="jp-location-more" style={{ marginLeft: '8px', color: '#666' }}>
                                      +{locations.split(' | ').length - 1} location{locations.split(' | ').length > 2 ? 's' : ''}
                                    </span>
                                  )}
                                </>
                              ) : (
                                'N/A'
                              )}
                              
                              {locations.includes('|') && hoveredLocationRole === role.id && (
                                <div 
                                  onMouseEnter={() => setHoveredLocationRole(role.id)}
                                  onMouseLeave={() => setHoveredLocationRole(null)}
                                  style={{
                                    position: 'fixed',
                                    top: tooltipPosition.top + 'px',
                                    left: tooltipPosition.left + 'px',
                                    backgroundColor: '#2d3748',
                                    color: 'white',
                                    padding: '10px 12px',
                                    borderRadius: '6px',
                                    fontSize: '0.85rem',
                                    whiteSpace: 'normal',
                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                                    zIndex: 10000,
                                    lineHeight: 1.5,
                                    fontWeight: 500,
                                    maxWidth: '350px',
                                    pointerEvents: 'auto'
                                  }}
                                >
                                  <strong style={{ fontSize: '0.9rem', display: 'block', marginBottom: '6px' }}>All Locations:</strong>
                                  {locations.split(' | ').map((loc, locIdx) => (
                                    <div key={locIdx} style={{ fontSize: '0.85rem', lineHeight: 1.4, paddingTop: '2px' }}>
                                      {loc}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </span>
                          </div>
                        </td>
                        <td className="jp-table-cell">
                          <span className={`jp-badge jp-badge-${role.roleLocation?.toLowerCase() || 'onsite'}`}>
                            {role.roleLocation || 'Onsite'}
                          </span>
                        </td>
                        <td className="jp-table-cell">{role.experience || 'N/A'}</td>
                        <td className="jp-table-cell">
                          {formatDateDisplay(role.postedDate) || 'N/A'}
                        </td>
                        <td className="jp-table-cell">
                          <button
                            onClick={() => handleApplyClick(role)}
                            className="jp-apply-button"
                          >
                            Apply
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="jp-pagination-wrapper">
                <div className="jp-pagination-info-wrapper">
                  <div className="jp-show-per-page-selector">
                    <label className="jp-show-per-page-label">Show:</label>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="jp-show-per-page-dropdown"
                    >
                      <option value={10}>10</option>
                      <option value={15}>15</option>
                      <option value={20}>20</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                    <span className="jp-show-per-page-suffix">per page</span>
                  </div>

                  <div className="jp-pagination-controls">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="jp-page-button jp-page-button-disabled"
                    >
                      Previous
                    </button>

                    {totalPages <= 7 ? (
                      Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <PaginationButton
                          key={page}
                          page={page}
                          isActive={currentPage === page}
                          onClick={() => setCurrentPage(page)}
                        />
                      ))
                    ) : (
                      <>
                        <PaginationButton
                          page={1}
                          isActive={currentPage === 1}
                          onClick={() => setCurrentPage(1)}
                        />

                        {currentPage > 4 && (
                          <span className="jp-page-ellipsis">...</span>
                        )}

                        {Array.from({ length: 5 }, (_, i) => {
                          const page = currentPage - 2 + i;
                          return page > 1 && page < totalPages ? (
                            <PaginationButton
                              key={page}
                              page={page}
                              isActive={currentPage === page}
                              onClick={() => setCurrentPage(page)}
                            />
                          ) : null;
                        })}

                        {currentPage < totalPages - 3 && (
                          <span className="jp-page-ellipsis">...</span>
                        )}

                        <PaginationButton
                          page={totalPages}
                          isActive={currentPage === totalPages}
                          onClick={() => setCurrentPage(totalPages)}
                        />
                      </>
                    )}

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="jp-page-button jp-page-button-disabled"
                    >
                      Next
                    </button>
                  </div>

                  <div className="jp-results-summary">
                    Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, totalRoles)} of {totalRoles} roles
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <LocationTooltipModal
        isOpen={showLocationTooltip}
        onClose={() => setShowLocationTooltip(false)}
        locations={tooltipLocations}
      />
      <AuthRequiredModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLoginClick={handleLoginRedirect}
        onSignupClick={handleSignupRedirect}
      />

      {isUserAuthenticated() && (
        <CandidateFormPopup
          isOpen={showForm}
          onClose={() => setShowForm(false)}
          selectedRole={selectedRole}
        />
      )}
    </div>
  );
}