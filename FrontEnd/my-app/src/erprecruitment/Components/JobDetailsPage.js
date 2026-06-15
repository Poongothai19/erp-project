import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Upload, AlertCircle, CheckCircle, Search, X, ChevronDown, Mail, Share2, MessageCircle } from 'lucide-react';
import BASE_URL from '../../url';
import '../styles/JobDetailsPage.css';
import prophecyLogo2 from "../../Recruitment/Assets/images/prophecy-logo2.png";
import prophecyLogo from "../../Recruitment/Assets/images/prophecy-logo.png";
import ProphecyDark from "../../Recruitment/Assets/images/PROPHECY-LOGO-DARK.png";

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

const WhatsAppIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.76.982.998-3.675-.236-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.9 6.994c-.004 5.45-4.438 9.88-9.888 9.88m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.333.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.333 11.893-11.893 0-3.18-1.24-6.162-3.495-8.411" />
  </svg>
);

const LinkedInIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.474-2.237-1.667-2.237-.909 0-1.451.613-1.688 1.206-.087.214-.11.512-.11.81v5.79h-3.553s.046-9.393 0-10.365h3.553v1.467c-.01.017-.023.033-.033.05h.033v-.05c.457-.704 1.274-1.707 3.102-1.707 2.268 0 3.968 1.482 3.968 4.66v5.945zM5.337 9.433c-1.144 0-1.915-.758-1.915-1.707 0-.968.77-1.708 1.958-1.708 1.187 0 1.914.74 1.944 1.708 0 .949-.757 1.707-1.987 1.707zm1.581 11.019H3.716V9.087h3.202v11.365zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z" />
  </svg>
);

// ============================================
// HELPER FUNCTIONS FOR META TAGS
// ============================================

const setTwitterMetaTag = (name, content) => {
  let tag = document.querySelector(`meta[name="${name}"]`);
  
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('name', name);
    document.head.appendChild(tag);
  }
  
  tag.setAttribute('content', content);
};

const setOGMetaTag = (property, content) => {
  let tag = document.querySelector(`meta[property="${property}"]`);
  
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('property', property);
    document.head.appendChild(tag);
  }
  
  tag.setAttribute('content', content);
};

const setMetaTag = (name, content) => {
  let tag = document.querySelector(`meta[name="${name}"]`);
  
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('name', name);
    document.head.appendChild(tag);
  }
  
  tag.setAttribute('content', content);
};

// ============================================
// HELPER FUNCTION TO FORMAT LOCATIONS (UPDATED)
// ============================================

const formatLocations = (role) => {
  try {
    // First check if the role has a locations array
    if (role.locations && Array.isArray(role.locations)) {
      return role.locations
        .filter(loc => loc && loc.trim() !== '')
        .map(loc => loc.trim());
    }
    
    // Check if the role has a location string (from backend)
    if (role.location && typeof role.location === 'string') {
      const locationStr = role.location.trim();
      
      if (!locationStr || locationStr === 'N/A' || locationStr === 'null') {
        return ['N/A'];
      }
      
      // If it's pipe-separated, split by pipe
      if (locationStr.includes('|')) {
        return locationStr
          .split('|')
          .filter(loc => loc && loc.trim() !== '')
          .map(loc => loc.trim());
      }
      
      // Try to parse complex formats like "Minneapolis,Irving,MN,TX,US"
      const parts = locationStr.split(',').map(p => p.trim());
      
      // If we have an odd number of parts > 3, it might be multiple cities with states
      if (parts.length > 3 && parts.length % 2 === 1) {
        // Format like "Minneapolis,Irving,MN,TX,US" - last part is country
        const country = parts[parts.length - 1];
        const locations = [];
        
        for (let i = 0; i < parts.length - 1; i += 2) {
          if (i + 1 < parts.length - 1) {
            const city = parts[i];
            const state = parts[i + 1];
            locations.push(`${city}, ${state}, ${country}`);
          }
        }
        
        if (locations.length > 0) {
          return locations;
        }
      }
      
      // For simple formats like "Phoenix,AZ,US" or "Phoenix, AZ, US"
      return [locationStr.replace(/,/g, ', ')];
    }
    
    // Try to build from city/state/country fields
    const parts = [];
    if (role.city) parts.push(role.city);
    if (role.state) parts.push(role.state);
    if (role.country) parts.push(role.country);
    
    if (parts.length > 0) {
      return [parts.join(', ')];
    }
    
    return ['N/A'];

  } catch (error) {
    console.error('Error formatting locations for role:', role?.role, error);
    return ['N/A'];
  }
};

// ============================================
// STICKY NAVIGATION BAR COMPONENT
// ============================================

const StickyNavBar = ({ job, onApplyClick, isVisible }) => {
  const formatLocationDisplay = (job) => {
    if (!job) return 'N/A';
    const locations = formatLocations(job);
    return locations.length > 0 ? locations[0] : 'N/A';
  };

  const location = formatLocationDisplay(job);
  const workMode = job?.roleLocation || 'Onsite';

  return (
    <div className={`jdp-sticky-nav ${isVisible ? 'jdp-sticky-nav-visible' : ''}`}>
      <div className="jdp-sticky-nav-content">
        <div className="jdp-sticky-nav-left">
          <h3 className="jdp-sticky-nav-title">{job?.role}</h3>
          <p className="jdp-sticky-nav-subtitle">{location} • {workMode}</p>
        </div>
        <button
          onClick={() => onApplyClick()}
          className="jdp-sticky-apply-button"
        >
          Apply Now
        </button>
      </div>
    </div>
  );
};

// ============================================
// RECOMMENDED JOBS COMPONENT
// ============================================

const RecommendedJobs = ({ currentJob, allJobs }) => {
  const formatLocationDisplay = (job) => {
    if (!job) return 'N/A';
    const locations = formatLocations(job);
    return locations.length > 0 ? locations[0] : 'N/A';
  };

  const calculateSimilarity = (str1, str2) => {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();
    
    if (s1 === s2) return 1;
    
    if (s1.includes(s2) || s2.includes(s1)) return 0.8;
    
    let matches = 0;
    const words1 = s1.split(/\s+/);
    const words2 = s2.split(/\s+/);
    
    for (let w1 of words1) {
      for (let w2 of words2) {
        if (w1 === w2 || (w1.length > 3 && w2.length > 3 && w1.includes(w2))) {
          matches++;
        }
      }
    }
    
    return matches / Math.max(words1.length, words2.length);
  };

  const recommendedJobs = allJobs
    .filter(j => j.id !== currentJob.id && j.company === currentJob.company)
    .map(j => ({
      job: j,
      similarity: calculateSimilarity(currentJob.role, j.role)
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .filter(item => item.similarity > 0.3)
    .slice(0, 3)
    .map(item => item.job);

  return (
    <div className="jdp-recommended-jobs">
      <h3 className="jdp-recommended-title">Other Related Jobs</h3>
      {recommendedJobs.length === 0 ? (
        <div className="jdp-no-related-jobs">
          <p>No related jobs found</p>
        </div>
      ) : (
        <>
          <div className="jdp-recommended-list">
            {recommendedJobs.map((recommendedJob) => (
              <a 
                key={recommendedJob.id}
                href={`/job/${recommendedJob.id}`}
                className="jdp-recommended-job-card"
              >
                <div className="jdp-recommended-job-header">
                  <h4 className="jdp-recommended-job-title">{recommendedJob.role}</h4>
                </div>
                <p className="jdp-recommended-job-location">
                  {formatLocationDisplay(recommendedJob)}
                </p>
                <p className="jdp-recommended-job-details">
                  {recommendedJob.roleLocation && `${recommendedJob.roleLocation}`}
                  {recommendedJob.roleType && recommendedJob.roleLocation && ' • '}
                  {recommendedJob.roleType && `${recommendedJob.roleType}`}
                </p>
              </a>
            ))}
          </div>
          <a href="/Careers" className="jdp-show-all-jobs">Show all jobs</a>
        </>
      )}
    </div>
  );
};

// ============================================
// AUTH REQUIRED MODAL
// ============================================

const AuthRequiredModal = ({ isOpen, onClose, onLoginClick, onSignupClick }) => {
  if (!isOpen) return null;

  return (
    <div className="jdp-modal-backdrop" onClick={onClose}>
      <div className="jdp-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="jdp-modal-header">
          <h2 className="jdp-modal-header-text">Sign In Required</h2>
          <button className="jdp-modal-close-icon" onClick={onClose}>×</button>
        </div>
        <div className="jdp-modal-body">
          <h3 className="jdp-auth-title">Sign In Required</h3>
          <p className="jdp-auth-message">
            Please sign in or create an account to apply for this position.
          </p>
          
          <div className="jdp-auth-button-group">
            <button className="jdp-primary-button" onClick={onLoginClick}>
              Login
            </button>
            <button className="jdp-secondary-button" onClick={onSignupClick}>
              Sign Up
            </button>
          </div>

          <button className="jdp-auth-browse-link" onClick={onClose}>
            Continue Browsing
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// FACEBOOK SHARE POPUP
// ============================================

const FacebookSharePopup = ({ isOpen, onClose, url, onCopy }) => {
  if (!isOpen) return null;

  return (
    <div className="jdp-facebook-modal-backdrop" onClick={onClose}>
      <div className="jdp-facebook-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="jdp-facebook-modal-header">
          <h3>Share Link</h3>
          <button className="jdp-facebook-modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="jdp-facebook-modal-body">
          <div className="jdp-facebook-input-container">
            <input
              type="text"
              className="jdp-facebook-input"
              value={url}
              readOnly
            />
            <button 
              className="jdp-facebook-copy-btn"
              onClick={onCopy}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// SHARE DIALOG COMPONENT
// ============================================

const ShareDialog = ({ isOpen, onClose, job }) => {
  const [copied, setCopied] = useState(false);
  const [shareMessage, setShareMessage] = useState("");

  const formatDescriptionForShare = (job) => {
    if (!job) return '';
    
    const jobTitle = job?.role || 'Job Opportunity';
    const locations = formatLocations(job);
    const location = locations.join(' | ') || 'Location not specified';
    const workMode = job?.roleLocation || 'Onsite';
    const experience = job?.experience || 'Not specified';
    const roleType = job?.roleType || 'Not specified';
    
    let desc = job.description || job.jobDescription || '';
    desc = desc.replace(/<[^>]+>/g, '').substring(0, 2000);
    
    const message = `🎯Exciting Job Opportunity!

    Position: ${jobTitle}
    Location: ${location}
    Work Mode: ${workMode}
    Experience: ${experience}
    Role Type: ${roleType}

    Job Description:
    ${desc}${desc.length === 2000 ? '...' : ''}

    Apply now and join our team!`;
    
    return message;
  };

  useEffect(() => {
    if (isOpen && job) {
      const message = formatDescriptionForShare(job);
      setShareMessage(message);
    }
  }, [isOpen, job]);

  if (!isOpen || !job) return null;

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(shareMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLinkedInShare = () => {
    const linkedinUrl = `https://www.linkedin.com/feed/?shareActive=true`;
    window.open(linkedinUrl, 'linkedin-share', 'width=550,height=680');
    navigator.clipboard.writeText(shareMessage);
    alert('Share message with full job description copied to clipboard! Paste it on LinkedIn.');
  };

  return (
    <div className="jdp-share-modal-backdrop" onClick={onClose}>
      <div className="jdp-share-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="jdp-share-modal-header">
          <h3>Share This Job</h3>
          <button className="jdp-share-modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="jdp-share-modal-body">
          <textarea 
            className="jdp-share-modal-textarea"
            value={shareMessage}
            onChange={(e) => setShareMessage(e.target.value)}
            rows="12"
          />
          
          <div className="jdp-share-modal-buttons">
            <button 
              className="jdp-share-modal-btn jdp-share-modal-linkedin"
              onClick={handleLinkedInShare}
            >
              Share on LinkedIn
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// CANDIDATE FORM POPUP
// ============================================

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
    if (isOpen && selectedRole && selectedRole.role) {
      console.log('📝 Setting position to:', selectedRole.role);
      setFormData(prev => ({
        ...prev,
        position: selectedRole.role
      }));
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
    <div className="jdp-modal-backdrop">
      <div className="jdp-modal-box">
        <div className="jdp-modal-header">
          <h2 className="jdp-modal-header-text">Apply for Position</h2>
          <button className="jdp-modal-close-icon" onClick={onClose}>×</button>
        </div>
        <div className="jdp-modal-body">
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="jdp-alert jdp-alert-error">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            {submitted && (
              <div className="jdp-alert jdp-alert-success">
                <CheckCircle size={18} />
                <span>✓ Application submitted successfully!</span>
              </div>
            )}

            {!submitted && (
              <>
                <div className="jdp-form-grid">
                  <div className="jdp-form-field">
                    <label className="jdp-form-label">First Name *</label>
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      placeholder="Enter first name"
                      className="jdp-form-input"
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="jdp-form-field">
                    <label className="jdp-form-label">Last Name *</label>
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      placeholder="Enter last name"
                      className="jdp-form-input"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="jdp-form-grid">
                  <div className="jdp-form-field">
                    <label className="jdp-form-label">Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter email"
                      className="jdp-form-input"
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="jdp-form-field">
                    <label className="jdp-form-label">Phone *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Enter phone number"
                      className="jdp-form-input"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="jdp-form-field jdp-form-field-full">
                  <label className="jdp-form-label">Position *</label>
                  <input
                    type="text"
                    name="position"
                    value={formData.position}
                    disabled={true}
                    className="jdp-form-input jdp-form-input-disabled"
                  />
                </div>

                <div className="jdp-form-grid">
                  <div className="jdp-form-field">
                    <label className="jdp-form-label">Visa Type</label>
                    <select
                      name="visa_type"
                      value={formData.visa_type}
                      onChange={handleInputChange}
                      disabled={loading}
                      className="jdp-form-select"
                    >
                      <option value="">Select Visa Type</option>
                      {VISA_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="jdp-form-field">
                    <label className="jdp-form-label">State</label>
                    <select
                      name="current_state"
                      value={formData.current_state}
                      onChange={handleInputChange}
                      disabled={loading}
                      className="jdp-form-select"
                    >
                      <option value="">Select State</option>
                      {US_STATES.map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="jdp-form-field jdp-form-field-full">
                  <label className="jdp-form-label">City</label>
                  <input
                    type="text"
                    name="current_city"
                    value={formData.current_city}
                    onChange={handleInputChange}
                    placeholder="Enter city"
                    className="jdp-form-input"
                    disabled={loading}
                  />
                </div>

                <div className="jdp-form-field jdp-form-field-full">
                  <label className="jdp-form-label">Employment Type</label>
                  <div className="jdp-form-checkbox-group">
                    {['W2', 'C2C'].map(type => (
                      <label key={type} className="jdp-form-checkbox-label">
                        <input
                          type="checkbox"
                          checked={formData.employment_type.includes(type)}
                          onChange={() => handleEmploymentTypeChange(type)}
                          disabled={loading}
                          className="jdp-form-checkbox"
                        />
                        <span>{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="jdp-form-field jdp-form-field-full">
                  <label className="jdp-form-label">Upload Resume *</label>
                  <div
                    className={`jdp-file-drop-zone ${dragActive ? 'jdp-file-drop-active' : ''}`}
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
                      className="jdp-file-input-hidden"
                      id="resume-upload"
                    />
                    <label htmlFor="resume-upload" className="jdp-file-label">
                      {resumeFile ? (
                        <>
                          <CheckCircle size={28} className="jdp-file-icon" />
                          <div className="jdp-file-success-text">
                            Selected: {resumeFile.name}
                          </div>
                        </>
                      ) : (
                        <>
                          <Upload size={28} className="jdp-file-icon" />
                          <div className="jdp-file-text">
                            {dragActive ? 'Drop your resume here' : 'Click to upload or drag and drop'}
                          </div>
                          <div className="jdp-file-hint">
                            PDF, DOC, or DOCX (max 5MB)
                          </div>
                        </>
                      )}
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  className="jdp-submit-button"
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

// ============================================
// MAIN COMPONENT
// ============================================

export default function JobDetailsPage() {
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showFacebookPopup, setShowFacebookPopup] = useState(false);
  const [stickyNavVisible, setStickyNavVisible] = useState(false);
  const [allRoles, setAllRoles] = useState([]);

  // ✅ FETCH SINGLE JOB FIRST, THEN ALL ROLES
  useEffect(() => {
    if (jobId) {
      fetchJobDetails(jobId);
    }
  }, [jobId]);

  // ✅ SET DYNAMIC OG TAGS
  useEffect(() => {
    if (job) {
      const baseUrl = getBaseUrl();
      const jobUrl = `${baseUrl}/job/${job.id}`;
      
      const jobTitle = job?.role || 'Job Opportunity';
      const locations = formatLocations(job);
      const location = locations.join(' | ') || 'Location not specified';
      const company = job?.company || 'Prophecy Technologies';
      const workMode = job?.roleLocation || 'Onsite';
      
      const title = `Position: ${jobTitle}`;
      const description = `Location: ${location} | Work Mode: ${workMode}`;

      setOGMetaTag('og:title', title);
      setOGMetaTag('og:description', description);
      setOGMetaTag('og:url', jobUrl);
      setOGMetaTag('og:type', 'website');
      setOGMetaTag('og:site_name', company);
      
      // Update standard meta tags too
      setMetaTag('description', `${title} - ${description}`);
      
      // Use Logo for sharing
      if (prophecyLogo2) {
        let imageUrl = prophecyLogo2;
        if (!imageUrl.startsWith('http')) {
          imageUrl = `${baseUrl}${imageUrl}`;
        }
        
        setOGMetaTag('og:image', imageUrl);
        setOGMetaTag('og:image:type', 'image/png');
        setOGMetaTag('og:image:width', '1200');
        setOGMetaTag('og:image:height', '630');
        setOGMetaTag('og:image:alt', jobTitle);
      } else if (ProphecyDark) {
        let imageUrl = ProphecyDark;
        if (!imageUrl.startsWith('http')) {
          imageUrl = `${baseUrl}${imageUrl}`;
        }
        setOGMetaTag('og:image', imageUrl);
      }

      setTwitterMetaTag('twitter:card', 'summary_large_image');
      setTwitterMetaTag('twitter:title', title);
      setTwitterMetaTag('twitter:description', description);
      setTwitterMetaTag('twitter:site', '@ProphecyTechs');
      
      if (prophecyLogo2) {
        let imageUrl = prophecyLogo2;
        if (!imageUrl.startsWith('http')) {
          imageUrl = `${baseUrl}${imageUrl}`;
        }
        setTwitterMetaTag('twitter:image', imageUrl);
      }

      document.title = `${jobTitle} - ${company}`;
    }
  }, [job]);

  // ✅ STICKY NAV OBSERVER
  useEffect(() => {
    let observer = null;
    let sentinel = null;
    let resizeTimer = null;
    let scrollFallbackActive = false;
    
    const initStickyNavObserver = () => {
      if (observer) {
        observer.disconnect();
        observer = null;
      }
      
      if (sentinel && sentinel.parentNode) {
        sentinel.parentNode.removeChild(sentinel);
        sentinel = null;
      }
      
      const container = document.querySelector('.jdp-container');
      if (!container) {
        console.warn('Container not found, using scroll fallback');
        setupScrollFallback();
        return;
      }
      
      sentinel = document.createElement('div');
      sentinel.id = 'navbar-sentinel';
      Object.assign(sentinel.style, {
        height: '1px',
        width: '100%',
        position: 'absolute',
        top: '0',
        left: '0',
        pointerEvents: 'none',
        opacity: '0',
        zIndex: '-1'
      });
      
      if (window.getComputedStyle(container).position === 'static') {
        container.style.position = 'relative';
      }
      
      container.prepend(sentinel);
      
      try {
        observer = new IntersectionObserver(
          (entries) => {
            entries.forEach(entry => {
              const shouldShow = !entry.isIntersecting || entry.intersectionRatio < 0.1;
              setStickyNavVisible(shouldShow);
            });
          },
          {
            root: null,
            rootMargin: '0px',
            threshold: [0, 0.1, 0.5, 1]
          }
        );
        
        observer.observe(sentinel);
        scrollFallbackActive = false;
        
      } catch (error) {
        console.warn('IntersectionObserver failed, using scroll fallback:', error);
        setupScrollFallback();
      }
    };
    
    const setupScrollFallback = () => {
      if (scrollFallbackActive) return;
      
      scrollFallbackActive = true;
      let ticking = false;
      let lastScrollY = window.scrollY;
      
      const handleScroll = () => {
        if (!ticking) {
          window.requestAnimationFrame(() => {
            const currentScrollY = window.scrollY;
            const shouldShow = currentScrollY > 100 && currentScrollY > lastScrollY;
            setStickyNavVisible(shouldShow);
            lastScrollY = currentScrollY;
            ticking = false;
          });
          ticking = true;
        }
      };
      
      handleScroll();
      window.addEventListener('scroll', handleScroll, { passive: true });
      window._stickyNavScrollHandler = handleScroll;
    };
    
    const handleResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(initStickyNavObserver, 200);
    };
    
    const initTimer = setTimeout(() => {
      initStickyNavObserver();
    }, 100);
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      clearTimeout(initTimer);
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', handleResize);
      
      if (window._stickyNavScrollHandler) {
        window.removeEventListener('scroll', window._stickyNavScrollHandler);
        delete window._stickyNavScrollHandler;
      }
      
      if (observer) {
        observer.disconnect();
      }
      
      if (sentinel && sentinel.parentNode) {
        sentinel.parentNode.removeChild(sentinel);
      }
    };
  }, []);

  const fetchJobDetails = async (id) => {
    try {
      setLoading(true);
      console.log('🔍 Fetching specific job details for ID:', id);
      const response = await axios.get(`${BASE_URL}/api/recruitment/public/roles/${id}`);
      
      if (response.data) {
        setJob(response.data);
        setError('');
        // After setting the job, fetch all roles for the "Other Related Jobs" section in the background
        fetchAllRoles();
      }
    } catch (err) {
      console.error('Error fetching job details:', err);
      if (err.response && err.response.status === 404) {
        setError('Job not found or no longer active.');
      } else {
        setError('Failed to load job details. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAllRoles = async () => {
    try {
      console.log('📋 Fetching all roles for related jobs section...');
      const response = await axios.get(`${BASE_URL}/api/recruitment/public/roles`);
      const roles = response.data || [];
      console.log('✅ Related roles fetched:', roles.length);
      setAllRoles(roles);
    } catch (err) {
      console.error('Error fetching related roles:', err);
      // Don't set error state here to avoid overriding the main job display
    }
  };

  const isUserAuthenticated = () => {
    const token = localStorage.getItem('token');
    return !!token;
  };

  const handleApplyClick = () => {
    const isAuth = isUserAuthenticated();
    
    if (!isAuth) {
      localStorage.setItem('pendingJobApplication', JSON.stringify({
        id: job.id,
        role: job.role
      }));
      setShowAuthModal(true);
      return;
    }
    
    setShowForm(true);
  };

  const handleLoginRedirect = () => {
    window.location.href = '/login';
  };

  const handleSignupRedirect = () => {
    window.location.href = '/signup';
  };

  const getBaseUrl = () => {
    return window.location.origin;
  };

  const handleDirectShare = (platform) => {
    const baseUrl = getBaseUrl();
    const jobUrl = `${baseUrl}/job/${job.id}`;
    const jobTitle = job?.role || 'web developer';
    const locations = formatLocations(job);
    const location = locations.join(' | ') || 'Chennai, TN';
    const company = job?.company || 'Company';
    
    const shareMessage = `🎯 Exciting Job Opportunity!

  Position: ${jobTitle}
  Location: ${location}
  Work Mode: ${job?.roleLocation || 'Onsite'}
  Experience: ${job?.experience || 'Not specified'} years

  Check out the full details and apply now!
  ${jobUrl}`;

    switch (platform) {
      case 'facebook':
        setShowFacebookPopup(true);
        break;
      
      case 'whatsapp':
        const whatsappText = encodeURIComponent(shareMessage);
        window.open(`https://wa.me/?text=${whatsappText}`, '_blank');
        break;
      
      case 'email':
        const emailBody = encodeURIComponent(shareMessage);
        window.location.href = `mailto:?subject=${encodeURIComponent(`Job Opportunity: ${jobTitle}`)}&body=${emailBody}`;
        break;
      
      case 'linkedin':
        // Using share-offsite to trigger LinkedIn's crawler for the dynamic meta tags
        const linkedinShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(jobUrl)}`;
        
        const width = 600;
        const height = 600;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;
        
        window.open(
          linkedinShareUrl,
          'linkedin-share',
          `width=${width},height=${height},left=${left},top=${top},toolbar=0,status=0`
        );
        break;
      
      default:
        break;
    }
  };

  if (loading) {
    return <div className="jdp-loading-message">Loading job details...</div>;
  }

  if (error || !job) {
    return (
      <div className="jdp-container">
        <div className="jdp-error-message">{error || 'Job not found'}</div>
        <button onClick={() => window.history.back()} className="jdp-back-button">
          ← Go Back
        </button>
      </div>
    );
  }

  // Format locations for display
  const locationDisplay = formatLocations(job).join(' | ');

  return (
    <div className="jdp-page-wrapper">
      <StickyNavBar 
        job={job} 
        onApplyClick={handleApplyClick}
        isVisible={stickyNavVisible}
      />

      <div className="jdp-container">
        <div className="jdp-logo-section">
          <img src={prophecyLogo2} alt="Logo" className="jdp-logo-icon" />
          <img src={prophecyLogo} alt="Prophecy" className="jdp-logo-text" />
        </div>

        <div className="jdp-quote-section">
          <h2 className="jdp-quote-text">Join Our Team</h2>
          <p className="jdp-quote-subtitle">Explore our open positions and apply today</p>
        </div>

        <div className="jdp-header">
          <h1 className="jdp-title">{job.role}</h1>
          <p className="jdp-company">{job.company || 'Company'}</p>
        </div>

        <div className="jdp-content-wrapper">
          {/* Left Side - Job Details */}
          <div className="jdp-content-left">
            <div className="jdp-info-block">
              <h3 className="jdp-info-label">Role Type</h3>
              <p className="jdp-info-value">{job.roleType || 'N/A'}</p>
            </div>

            <div className="jdp-info-block">
              <h3 className="jdp-info-label">Location</h3>
              <p className="jdp-info-value">{locationDisplay || 'N/A'}</p>
            </div>

            <div className="jdp-info-block">
              <h3 className="jdp-info-label">Work Mode</h3>
              <p className="jdp-info-value">{job.roleLocation || 'Onsite'}</p>
            </div>

            <div className="jdp-info-block">
              <h3 className="jdp-info-label">Experience</h3>
              <p className="jdp-info-value">{job.experience || 'N/A'}</p>
            </div>

            {/* ✅ UPDATED: Description Section - Raw HTML Format (Like Recruitment Dashboard) */}
            <div className="jdp-info-block jdp-description-block">
              <h3 className="jdp-info-label">Description</h3>
              <div className="jdp-description-content">
                {!job.description && !job.jobDescription ? (
                  <p className="jdp-no-description">No description available</p>
                ) : (
                  <div
                    dangerouslySetInnerHTML={{
                      __html: job.description || job.jobDescription || ''
                    }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Right Side - Apply and Share */}
          <div className="jdp-content-right">
            <div className="jdp-sidebar-sticky">
              <button
                onClick={handleApplyClick}
                className="jdp-apply-button-large"
              >
                Apply Now
              </button>

              <div className="jdp-share-section">
                <h4 className="jdp-share-title">Share This Job</h4>
                <div className="jdp-share-buttons">
                  <button
                    onClick={() => handleDirectShare('linkedin')}
                    className="jdp-share-btn jdp-share-linkedin"
                    title="Share on LinkedIn"
                  >
                   <LinkedInIcon />
                  </button>
                  <button
                    onClick={() => handleDirectShare('facebook')}
                    className="jdp-share-btn jdp-share-facebook"
                    title="Share Link"
                  >
                    <Share2 size={20} />
                  </button>
                  <button
                    onClick={() => handleDirectShare('whatsapp')}
                    className="jdp-share-btn jdp-share-whatsapp"
                    title="Share on WhatsApp"
                  >
                    <WhatsAppIcon />
                  </button>
                  <button
                    onClick={() => handleDirectShare('email')}
                    className="jdp-share-btn jdp-share-email"
                    title="Share via Email"
                  >
                    <Mail size={20} />
                  </button>
                </div>
              </div>
              <RecommendedJobs currentJob={job} allJobs={allRoles} />
            </div>
          </div>
        </div>

        <AuthRequiredModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onLoginClick={handleLoginRedirect}
          onSignupClick={handleSignupRedirect}
        />

        <ShareDialog
          isOpen={showShareDialog}
          onClose={() => setShowShareDialog(false)}
          job={job}
        />

        <FacebookSharePopup
          isOpen={showFacebookPopup}
          onClose={() => setShowFacebookPopup(false)}
          url={`${getBaseUrl()}/job/${job.id}`}
          onCopy={() => {
            navigator.clipboard.writeText(`${getBaseUrl()}/job/${job.id}`);
            alert('Link copied to clipboard!');
          }}
        />

        {isUserAuthenticated() && (
          <CandidateFormPopup
            isOpen={showForm}
            onClose={() => setShowForm(false)}
            selectedRole={job}
          />
        )}
      </div>
    </div>
  );
}