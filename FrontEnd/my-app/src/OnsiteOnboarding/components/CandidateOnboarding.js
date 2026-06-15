import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  DollarSign,
  Briefcase,
  GraduationCap,
  BookOpen,
  Building,
  Hash,
  Award,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  LogOut,
  LayoutDashboard,
  FileSignature,
  Upload,
  Menu,
  X,
  Eye,
  Trash2,
  Download,
  ExternalLink
} from 'lucide-react';
import BASE_URL from '../../url';
import '../styles/CandidateOnboarding.css';

const CandidateOnboarding = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [candidateData, setCandidateData] = useState(null);
  const [activeTab, setActiveTab] = useState(
    location.state?.activeTab || 'onboarding'
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [documentPaths, setDocumentPaths] = useState({});
  const [formData, setFormData] = useState({
    // Personal Details
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    currentLocation: '',
    linkedInUrl: '',
    workAuthorization: '',
    dateOfBirth: '',
    
    // Professional Details
    rate: '',
    rateType: 'C2C',
    availabilityDate: '',
    totalITExperience: '',
    relevantExperience: '',
    
    // Education
    highestDegree: '',
    specialization: '',
    educationStartDate: '',
    educationEndDate: '',
    
    // Employment History
    mostRecentCompany: '',
    mostRecentCompanyAddress: '',
    mostRecentEmploymentStart: '',
    mostRecentEmploymentEnd: '',
    
    // TCS Related
    formerTCS: 'No',
    tcsEmployeeId: '',
    formerTCSBA: 'No',
    tcsBAId: '',
    
    // Current Employment
    currentEmployerName: '',
    currentEmployerAddress: '',
    
    // Identification
    passportNumber: '',
    lastFourSSN: '',
    
    // Languages
    languagesSpeak: '',
    languagesRead: '',
    languagesWrite: '',
    
    // Documents Status
    driversLicenseCopy: false,
    visaCopy: false,
    updatedResume: false
  });

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('role');
    const username = localStorage.getItem('username');

    if (!token) {
      navigate('/login');
      return;
    }

    if (userRole !== 'candidate') {
      navigate('/');
      return;
    }

    try {
      setLoading(true);
      
      const response = await axios.get(
        `${BASE_URL}/api/onboarding-workflow-employees/username/${username}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setCandidateData(response.data.data);
        
        if (response.data.data.documentPaths) {
          setDocumentPaths(response.data.data.documentPaths);
          
          setFormData(prev => ({
            ...prev,
            driversLicenseCopy: !!response.data.data.documentPaths.driversLicense,
            visaCopy: !!response.data.data.documentPaths.visa,
            updatedResume: !!response.data.data.documentPaths.resume
          }));
        }
        
        if (response.data.data.onboardingFormData) {
          const storedFormData = typeof response.data.data.onboardingFormData === 'string' 
            ? JSON.parse(response.data.data.onboardingFormData) 
            : response.data.data.onboardingFormData;
          setFormData(prev => ({
            ...prev,
            ...storedFormData
          }));
        }
      }

    } catch (error) {
      console.error('Error loading candidate data:', error);
      if (error.response?.status === 404) {
        alert('No onboarding workflow found for your account');
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.firstName) errors.firstName = 'First name is required';
    if (!formData.lastName) errors.lastName = 'Last name is required';
    if (!formData.email) errors.email = 'Email is required';
    if (!formData.phone) errors.phone = 'Phone is required';
    if (!formData.currentLocation) errors.currentLocation = 'Current location is required';
    if (!formData.workAuthorization) errors.workAuthorization = 'Work authorization is required';
    if (!formData.dateOfBirth) errors.dateOfBirth = 'Date of birth is required';
    if (!formData.totalITExperience) errors.totalITExperience = 'Total IT experience is required';
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleDocumentUpload = async (documentType, file) => {
    if (!file) return;

    const formData = new FormData();
    formData.append('document', file);
    formData.append('documentType', documentType);

    setUploadingDoc(true);
    setUploadProgress(prev => ({ ...prev, [documentType]: 0 }));

    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        `${BASE_URL}/api/onboarding-workflow-employees/company/${candidateData?.companyId}/${candidateData?.id}/upload-document`,
        formData,
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(prev => ({ ...prev, [documentType]: percentCompleted }));
          }
        }
      );

      if (response.data.success) {
        setDocumentPaths(prev => ({
          ...prev,
          [documentType]: response.data.data
        }));
        
        const checkboxName = documentType === 'driversLicense' ? 'driversLicenseCopy' :
                             documentType === 'visa' ? 'visaCopy' : 'updatedResume';
        
        setFormData(prev => ({
          ...prev,
          [checkboxName]: true
        }));

        alert(`✅ ${getDocumentLabel(documentType)} uploaded successfully!`);
      }

    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Error uploading document: ' + (error.response?.data?.message || error.message));
    } finally {
      setUploadingDoc(false);
      setUploadProgress(prev => ({ ...prev, [documentType]: 0 }));
    }
  };

  const handleDeleteDocument = async (documentType) => {
    if (!window.confirm(`Are you sure you want to delete this document?`)) return;

    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.delete(
        `${BASE_URL}/api/onboarding-workflow-employees/company/${candidateData?.companyId}/${candidateData?.id}/document/${documentType}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setDocumentPaths(prev => {
          const newPaths = { ...prev };
          delete newPaths[documentType];
          return newPaths;
        });
        
        const checkboxName = documentType === 'driversLicense' ? 'driversLicenseCopy' :
                             documentType === 'visa' ? 'visaCopy' : 'updatedResume';
        
        setFormData(prev => ({
          ...prev,
          [checkboxName]: false
        }));

        alert(`✅ Document deleted successfully!`);
      }

    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Error deleting document: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const requiredDocs = [
      { type: 'driversLicense', name: "Driver's License", uploaded: documentPaths.driversLicense },
      { type: 'resume', name: "Updated Resume", uploaded: documentPaths.resume }
    ];

    const missingDocs = requiredDocs.filter(doc => !doc.uploaded);
    if (missingDocs.length > 0) {
      alert(`Please upload the following required documents first:\n${missingDocs.map(d => d.name).join('\n')}`);
      return;
    }

    if (!candidateData) {
      alert('Candidate data not loaded');
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        `${BASE_URL}/api/onboarding-workflow-employees/company/${candidateData.companyId}/${candidateData.id}/onboarding-form`,
        formData,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        alert('✅ Onboarding form submitted successfully!');
        setActiveTab('dashboard');
        checkAuthAndLoadData();
      }

    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Error submitting form: ' + (error.response?.data?.message || error.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkAsComplete = async (stepId, index) => {
    if (!window.confirm('Are you sure you want to mark this step as complete? This will notify your administrator.')) {
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        `${BASE_URL}/api/onboarding-workflow-employees/company/${candidateData.companyId}/${candidateData.id}/complete-step`,
        { stepIndex: index },
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        alert('✅ Step marked as complete successfully!');
        checkAuthAndLoadData();
      }
    } catch (error) {
      console.error('Error completing step:', error);
      alert('Error completing step: ' + (error.response?.data?.message || error.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const getDocumentLabel = (documentType) => {
    switch(documentType) {
      case 'driversLicense': return "Driver's License";
      case 'visa': return "Visa Copy";
      case 'resume': return "Updated Resume";
      default: return documentType;
    }
  };

  const getDocumentIcon = (fileType) => {
    if (fileType?.includes('pdf')) return '📄';
    if (fileType?.includes('image')) return '🖼️';
    if (fileType?.includes('word')) return '📝';
    return '📁';
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const renderSidebar = () => {
    return (
      <>
        <button className="candidate-portal-mobile-menu-btn" onClick={toggleMobileMenu}>
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <div className={`candidate-portal-sidebar ${mobileMenuOpen ? 'candidate-portal-sidebar-open' : ''}`}>
          <div className="candidate-portal-sidebar-header">
            <h2>Candidate Portal</h2>
            <p>{candidateData?.CandidateName || candidateData?.name || 'Candidate'}</p>
          </div>
          
          <nav className="candidate-portal-sidebar-nav">
            <button 
              className={`candidate-portal-nav-item ${activeTab === 'dashboard' ? 'candidate-portal-nav-active' : ''}`}
              onClick={() => {
                setActiveTab('dashboard');
                setMobileMenuOpen(false);
              }}
            >
              <LayoutDashboard size={18} />
              Dashboard
            </button>
            
            <button 
              className={`candidate-portal-nav-item ${activeTab === 'onboarding' ? 'candidate-portal-nav-active' : ''}`}
              onClick={() => {
                setActiveTab('onboarding');
                setMobileMenuOpen(false);
              }}
            >
              <FileSignature size={18} />
              Onboarding Form
            </button>
          </nav>
          
          <div className="candidate-portal-sidebar-footer">
            <button className="candidate-portal-logout-btn" onClick={handleLogout}>
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </>
    );
  };

  const renderDashboard = () => {
    if (!candidateData) return null;

    const steps = candidateData.workflowSteps || candidateData.WorkflowSteps || [];
    const completedSteps = steps.filter(s => s.completed).length;
    const progress = steps.length > 0 ? Math.round((completedSteps / steps.length) * 100) : 0;

    const docsUploaded = {
      driversLicense: !!documentPaths.driversLicense,
      visa: !!documentPaths.visa,
      resume: !!documentPaths.resume
    };

    const formSubmitted = !!candidateData.onboardingFormData;

    return (
      <div className="candidate-portal-dashboard">
        <h1 className="candidate-portal-welcome-title">Welcome, {candidateData.CandidateName || candidateData.name}!</h1>
        
        <div className="candidate-portal-progress-section">
          <h2 className="candidate-portal-section-title">Onboarding Progress</h2>
          <div className="candidate-portal-progress-card">
            <div className="candidate-portal-progress-header">
              <span className="candidate-portal-progress-percentage">{progress}% Complete</span>
              <span className="candidate-portal-progress-stats">{completedSteps} of {steps.length} steps</span>
            </div>
            <div className="candidate-portal-progress-bar">
              <div className="candidate-portal-progress-fill" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        </div>

        {formSubmitted && (
          <div className="candidate-portal-submission-success">
            <CheckCircle size={24} />
            <div>
              <h3 className="candidate-portal-submission-title">Onboarding Form Submitted!</h3>
              <p className="candidate-portal-submission-text">Your information has been received and is being processed.</p>
            </div>
          </div>
        )}

        <div className="candidate-portal-steps-timeline">
          <h2 className="candidate-portal-section-title">Your Onboarding Steps</h2>
          {steps.sort((a, b) => (a.order || 0) - (b.order || 0)).map((step, index) => (
            <div key={index} className={`candidate-portal-step-item ${step.completed ? 'candidate-portal-step-completed' : ''}`}>
              <div className="candidate-portal-step-indicator">
                <div className="candidate-portal-step-number">{index + 1}</div>
                {step.completed && <CheckCircle size={16} className="candidate-portal-step-completed-icon" />}
              </div>
              <div className="candidate-portal-step-content">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 className="candidate-portal-step-title">{step.title}</h3>
                    <p className="candidate-portal-step-description">{step.description}</p>
                    {step.completed && step.completedAt && (
                      <span className="candidate-portal-step-date">
                        Completed: {new Date(step.completedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  
                  {/* Mark as Complete Button for Candidate */}
                  {!step.completed && (
                    <button 
                      className="candidate-portal-complete-btn"
                      onClick={() => handleMarkAsComplete(step.id, index)}
                      disabled={submitting}
                      style={{
                        padding: '6px 14px',
                        background: '#019d88',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        opacity: submitting ? 0.7 : 1
                      }}
                    >
                      <CheckCircle size={14} />
                      Mark as Complete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDocumentUploadSection = () => {
    const documentTypes = [
      { 
        key: 'driversLicense', 
        label: "Driver's License Copy",
        required: true,
        acceptedTypes: ".pdf,.jpg,.jpeg,.png",
        description: "Upload a clear copy of your driver's license"
      },
      { 
        key: 'visa', 
        label: "Visa Copy (if applicable)",
        required: false,
        acceptedTypes: ".pdf,.jpg,.jpeg,.png",
        description: "Upload a copy of your current visa"
      },
      { 
        key: 'resume', 
        label: "Updated Resume",
        required: true,
        acceptedTypes: ".pdf,.doc,.docx",
        description: "Upload your most recent resume"
      }
    ];

    return (
      <div className="candidate-portal-documents-section">
        <h2 className="candidate-portal-section-heading" style={{ marginBottom: '5px' }}>
          <Upload size={18} /> Required Documents
        </h2>
        
        <div className="candidate-portal-documents-info" style={{ marginBottom: '10px' }}>
          <AlertCircle size={20} />
          <p>Maximum file size: 10MB per file. Allowed formats: PDF, JPEG, PNG, DOC, DOCX</p>
        </div>
        
        <div className="candidate-portal-documents-grid">
          {documentTypes.map((doc) => {
            const uploadedDoc = documentPaths[doc.key];
            const isUploading = uploadProgress[doc.key] > 0 && uploadProgress[doc.key] < 100;
            
            return (
              <div key={doc.key} className="candidate-portal-document-card">
                <div className="candidate-portal-document-card-header">
                  <h3 className="candidate-portal-document-card-title">
                    {doc.label}
                    {doc.required && <span className="candidate-portal-required-badge">Required</span>}
                  </h3>
                </div>
                
                <p className="candidate-portal-document-card-description">{doc.description}</p>
                
                {uploadedDoc ? (
                  <div className="candidate-portal-document-uploaded">
                    <div className="candidate-portal-document-info">
                      <span className="candidate-portal-document-icon">
                        {getDocumentIcon(uploadedDoc.fileType)}
                      </span>
                      <div className="candidate-portal-document-details">
                        <span className="candidate-portal-document-name">{uploadedDoc.fileName}</span>
                        <span className="candidate-portal-document-meta">
                          {formatFileSize(uploadedDoc.fileSize)} • Uploaded {new Date(uploadedDoc.uploadedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="candidate-portal-document-actions">
                      <a 
                        href={uploadedDoc.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="candidate-portal-document-view-btn"
                        title="View Document"
                      >
                        <Eye size={16} />
                      </a>
                      <button 
                        className="candidate-portal-document-delete-btn"
                        onClick={() => handleDeleteDocument(doc.key)}
                        title="Delete Document"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="candidate-portal-document-upload-area">
                    <input
                      type="file"
                      id={`file-${doc.key}`}
                      accept={doc.acceptedTypes}
                      onChange={(e) => {
                        if (e.target.files[0]) {
                          handleDocumentUpload(doc.key, e.target.files[0]);
                        }
                      }}
                      disabled={isUploading}
                      className="candidate-portal-file-input"
                    />
                    <label htmlFor={`file-${doc.key}`} className="candidate-portal-file-label">
                      {isUploading ? (
                        <>
                          <div className="candidate-portal-upload-spinner"></div>
                          Uploading... {uploadProgress[doc.key]}%
                        </>
                      ) : (
                        <>
                          <Upload size={24} />
                          Click to Upload
                        </>
                      )}
                    </label>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderOnboardingForm = () => {
    if (candidateData?.onboardingFormData) {
      return (
        <div className="candidate-portal-onboarding-form">
          <div className="candidate-portal-form-header">
            <h1 className="candidate-portal-form-title">Onboarding Form Already Submitted</h1>
            <p className="candidate-portal-form-subtitle">You have already submitted your onboarding information.</p>
          </div>
          <div className="candidate-portal-submission-success candidate-portal-submission-large">
            <CheckCircle size={64} color="#28a745" />
            <h2 className="candidate-portal-submission-heading">Thank You!</h2>
            <p className="candidate-portal-submission-message">Your onboarding form has been received and is being processed.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="candidate-portal-onboarding-form">
        <div className="candidate-portal-form-header">
          <h1 className="candidate-portal-form-title">Complete Your Onboarding</h1>
          <p className="candidate-portal-form-subtitle">Please fill out all required information and upload documents below</p>
        </div>

        {/* Document Upload Section - Now integrated into the form */}
        {renderDocumentUploadSection()}

        <form onSubmit={handleSubmit} className="candidate-portal-form" style={{ marginTop: '10px' }}>
          {/* Personal Information Section */}
          <div className="candidate-portal-form-section">
            <h2 className="candidate-portal-section-heading">
              <User size={18} /> Personal Information
            </h2>
            
            <div className="candidate-portal-form-row">
              <div className="candidate-portal-form-group">
                <label className="candidate-portal-form-label">First Name *</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className={`candidate-portal-form-input ${formErrors.firstName ? 'candidate-portal-form-error' : ''}`}
                  placeholder="Enter your first name"
                />
                {formErrors.firstName && <span className="candidate-portal-error-text">{formErrors.firstName}</span>}
              </div>
              
              <div className="candidate-portal-form-group">
                <label className="candidate-portal-form-label">Last Name *</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className={`candidate-portal-form-input ${formErrors.lastName ? 'candidate-portal-form-error' : ''}`}
                  placeholder="Enter your last name"
                />
                {formErrors.lastName && <span className="candidate-portal-error-text">{formErrors.lastName}</span>}
              </div>
            </div>

            <div className="candidate-portal-form-row">
              <div className="candidate-portal-form-group">
                <label className="candidate-portal-form-label">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`candidate-portal-form-input ${formErrors.email ? 'candidate-portal-form-error' : ''}`}
                  placeholder="your.email@example.com"
                />
                {formErrors.email && <span className="candidate-portal-error-text">{formErrors.email}</span>}
              </div>
              
              <div className="candidate-portal-form-group">
                <label className="candidate-portal-form-label">Phone *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`candidate-portal-form-input ${formErrors.phone ? 'candidate-portal-form-error' : ''}`}
                  placeholder="(123) 456-7890"
                />
                {formErrors.phone && <span className="candidate-portal-error-text">{formErrors.phone}</span>}
              </div>
            </div>

            <div className="candidate-portal-form-row">
              <div className="candidate-portal-form-group">
                <label className="candidate-portal-form-label">Current Location (City, State) *</label>
                <input
                  type="text"
                  name="currentLocation"
                  value={formData.currentLocation}
                  onChange={handleInputChange}
                  className={`candidate-portal-form-input ${formErrors.currentLocation ? 'candidate-portal-form-error' : ''}`}
                  placeholder="e.g., Dallas, TX"
                />
                {formErrors.currentLocation && <span className="candidate-portal-error-text">{formErrors.currentLocation}</span>}
              </div>
              
              <div className="candidate-portal-form-group">
                <label className="candidate-portal-form-label">LinkedIn URL</label>
                <input
                  type="url"
                  name="linkedInUrl"
                  value={formData.linkedInUrl}
                  onChange={handleInputChange}
                  placeholder="https://linkedin.com/in/..."
                  className="candidate-portal-form-input"
                />
              </div>
            </div>

            <div className="candidate-portal-form-row">
              <div className="candidate-portal-form-group">
                <label className="candidate-portal-form-label">Work Authorization *</label>
                <select
                  name="workAuthorization"
                  value={formData.workAuthorization}
                  onChange={handleInputChange}
                  className={`candidate-portal-form-select ${formErrors.workAuthorization ? 'candidate-portal-form-error' : ''}`}
                >
                  <option value="">Select</option>
                  <option value="US Citizen">US Citizen</option>
                  <option value="Green Card">Green Card</option>
                  <option value="H1B">H1B</option>
                  <option value="OPT">OPT</option>
                  <option value="CPT">CPT</option>
                  <option value="L2">L2</option>
                  <option value="TN">TN</option>
                  <option value="Other">Other</option>
                </select>
                {formErrors.workAuthorization && <span className="candidate-portal-error-text">{formErrors.workAuthorization}</span>}
              </div>
              
              <div className="candidate-portal-form-group">
                <label className="candidate-portal-form-label">Date of Birth *</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  className={`candidate-portal-form-input ${formErrors.dateOfBirth ? 'candidate-portal-form-error' : ''}`}
                />
                {formErrors.dateOfBirth && <span className="candidate-portal-error-text">{formErrors.dateOfBirth}</span>}
              </div>
            </div>
          </div>

          {/* Professional Details Section */}
          <div className="candidate-portal-form-section">
            <h2 className="candidate-portal-section-heading">
              <Briefcase size={18} /> Professional Details
            </h2>
            
            <div className="candidate-portal-form-row">
              <div className="candidate-portal-form-group">
                <label className="candidate-portal-form-label">Rate</label>
                <input
                  type="text"
                  name="rate"
                  value={formData.rate}
                  onChange={handleInputChange}
                  placeholder="e.g., $50/hr"
                  className="candidate-portal-form-input"
                />
              </div>
              
              <div className="candidate-portal-form-group">
                <label className="candidate-portal-form-label">Rate Type</label>
                <select
                  name="rateType"
                  value={formData.rateType}
                  onChange={handleInputChange}
                  className="candidate-portal-form-select"
                >
                  <option value="C2C">C2C</option>
                  <option value="W2">W2</option>
                  <option value="1099">1099</option>
                </select>
              </div>
            </div>

            <div className="candidate-portal-form-row">
              <div className="candidate-portal-form-group">
                <label className="candidate-portal-form-label">Date Availability to Start</label>
                <input
                  type="date"
                  name="availabilityDate"
                  value={formData.availabilityDate}
                  onChange={handleInputChange}
                  className="candidate-portal-form-input"
                />
              </div>
              
              <div className="candidate-portal-form-group">
                <label className="candidate-portal-form-label">Total IT Experience (Years) *</label>
                <input
                  type="number"
                  name="totalITExperience"
                  value={formData.totalITExperience}
                  onChange={handleInputChange}
                  step="0.1"
                  min="0"
                  className={`candidate-portal-form-input ${formErrors.totalITExperience ? 'candidate-portal-form-error' : ''}`}
                  placeholder="e.g., 5.5"
                />
                {formErrors.totalITExperience && <span className="candidate-portal-error-text">{formErrors.totalITExperience}</span>}
              </div>
            </div>

            <div className="candidate-portal-form-group">
              <label className="candidate-portal-form-label">Relevant Experience (Years)</label>
              <input
                type="number"
                name="relevantExperience"
                value={formData.relevantExperience}
                onChange={handleInputChange}
                step="0.1"
                min="0"
                className="candidate-portal-form-input"
                placeholder="e.g., 3.5"
              />
            </div>
          </div>

          {/* Education Section */}
          <div className="candidate-portal-form-section">
            <h2 className="candidate-portal-section-heading">
              <GraduationCap size={18} /> Education
            </h2>
            
            <div className="candidate-portal-form-row">
              <div className="candidate-portal-form-group">
                <label className="candidate-portal-form-label">Highest Degree Completed</label>
                <select
                  name="highestDegree"
                  value={formData.highestDegree}
                  onChange={handleInputChange}
                  className="candidate-portal-form-select"
                >
                  <option value="">Select</option>
                  <option value="High School">High School</option>
                  <option value="Associate">Associate Degree</option>
                  <option value="Bachelor">Bachelor's Degree</option>
                  <option value="Master">Master's Degree</option>
                  <option value="PhD">PhD</option>
                </select>
              </div>
              
              <div className="candidate-portal-form-group">
                <label className="candidate-portal-form-label">Specialization</label>
                <input
                  type="text"
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleInputChange}
                  placeholder="e.g., Computer Science"
                  className="candidate-portal-form-input"
                />
              </div>
            </div>

            <div className="candidate-portal-form-row">
              <div className="candidate-portal-form-group">
                <label className="candidate-portal-form-label">Education Start Date</label>
                <input
                  type="date"
                  name="educationStartDate"
                  value={formData.educationStartDate}
                  onChange={handleInputChange}
                  className="candidate-portal-form-input"
                />
              </div>
              
              <div className="candidate-portal-form-group">
                <label className="candidate-portal-form-label">Education End Date</label>
                <input
                  type="date"
                  name="educationEndDate"
                  value={formData.educationEndDate}
                  onChange={handleInputChange}
                  className="candidate-portal-form-input"
                />
              </div>
            </div>
          </div>

          {/* Employment History Section */}
          <div className="candidate-portal-form-section">
            <h2 className="candidate-portal-section-heading">
              <Building size={18} /> Employment History
            </h2>
            
            <div className="candidate-portal-form-group">
              <label className="candidate-portal-form-label">Most Recent Company</label>
              <input
                type="text"
                name="mostRecentCompany"
                value={formData.mostRecentCompany}
                onChange={handleInputChange}
                placeholder="Company name"
                className="candidate-portal-form-input"
              />
            </div>
            
            <div className="candidate-portal-form-group">
              <label className="candidate-portal-form-label">Most Recent Company Address</label>
              <input
                type="text"
                name="mostRecentCompanyAddress"
                value={formData.mostRecentCompanyAddress}
                onChange={handleInputChange}
                placeholder="City, State"
                className="candidate-portal-form-input"
              />
            </div>

            <div className="candidate-portal-form-row">
              <div className="candidate-portal-form-group">
                <label className="candidate-portal-form-label">Employment Start Date</label>
                <input
                  type="date"
                  name="mostRecentEmploymentStart"
                  value={formData.mostRecentEmploymentStart}
                  onChange={handleInputChange}
                  className="candidate-portal-form-input"
                />
              </div>
              
              <div className="candidate-portal-form-group">
                <label className="candidate-portal-form-label">Employment End Date</label>
                <input
                  type="date"
                  name="mostRecentEmploymentEnd"
                  value={formData.mostRecentEmploymentEnd}
                  onChange={handleInputChange}
                  className="candidate-portal-form-input"
                />
              </div>
            </div>
          </div>

          {/* TCS Related Section */}
          <div className="candidate-portal-form-section">
            <h2 className="candidate-portal-section-heading">
              <Award size={18} /> TCS Related
            </h2>
            
            <div className="candidate-portal-form-row">
              <div className="candidate-portal-form-group">
                <label className="candidate-portal-form-label">Former Employee of TCS?</label>
                <select
                  name="formerTCS"
                  value={formData.formerTCS}
                  onChange={handleInputChange}
                  className="candidate-portal-form-select"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>
              
              <div className="candidate-portal-form-group">
                <label className="candidate-portal-form-label">Former Business Associate in TCS?</label>
                <select
                  name="formerTCSBA"
                  value={formData.formerTCSBA}
                  onChange={handleInputChange}
                  className="candidate-portal-form-select"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>
            </div>

            {formData.formerTCS === 'Yes' && (
              <div className="candidate-portal-form-group" style={{ marginTop: '15px' }}>
                <label className="candidate-portal-form-label">TCS Employee ID</label>
                <input
                  type="text"
                  name="tcsEmployeeId"
                  value={formData.tcsEmployeeId}
                  onChange={handleInputChange}
                  placeholder="Enter TCS Employee ID"
                  className="candidate-portal-form-input"
                />
              </div>
            )}
            
            {formData.formerTCSBA === 'Yes' && (
              <div className="candidate-portal-form-group" style={{ marginTop: '15px' }}>
                <label className="candidate-portal-form-label">TCS BA ID</label>
                <input
                  type="text"
                  name="tcsBAId"
                  value={formData.tcsBAId}
                  onChange={handleInputChange}
                  placeholder="Enter TCS BA ID"
                  className="candidate-portal-form-input"
                />
              </div>
            )}
          </div>

          {/* Current Employment Section */}
          <div className="candidate-portal-form-section">
            <h2 className="candidate-portal-section-heading">
              <Briefcase size={18} /> Current Employment
            </h2>
            
            <div className="candidate-portal-form-row">
              <div className="candidate-portal-form-group">
                <label className="candidate-portal-form-label">Current Employer Name</label>
                <input
                  type="text"
                  name="currentEmployerName"
                  value={formData.currentEmployerName}
                  onChange={handleInputChange}
                  placeholder="Current employer name"
                  className="candidate-portal-form-input"
                />
              </div>
              
              <div className="candidate-portal-form-group">
                <label className="candidate-portal-form-label">Current Employer Address (City, State)</label>
                <input
                  type="text"
                  name="currentEmployerAddress"
                  value={formData.currentEmployerAddress}
                  onChange={handleInputChange}
                  placeholder="City, State"
                  className="candidate-portal-form-input"
                />
              </div>
            </div>
          </div>

          {/* Identification Section */}
          <div className="candidate-portal-form-section">
            <h2 className="candidate-portal-section-heading">
              <Hash size={18} /> Identification
            </h2>
            
            <div className="candidate-portal-form-row">
              <div className="candidate-portal-form-group">
                <label className="candidate-portal-form-label">Passport Number</label>
                <input
                  type="text"
                  name="passportNumber"
                  value={formData.passportNumber}
                  onChange={handleInputChange}
                  placeholder="Enter passport number"
                  className="candidate-portal-form-input"
                />
              </div>
              
              <div className="candidate-portal-form-group">
                <label className="candidate-portal-form-label">Last Four Digit SSN</label>
                <input
                  type="text"
                  name="lastFourSSN"
                  value={formData.lastFourSSN}
                  onChange={handleInputChange}
                  maxLength="4"
                  placeholder="1234"
                  className="candidate-portal-form-input"
                />
              </div>
            </div>
          </div>

          {/* Languages Section */}
          <div className="candidate-portal-form-section">
            <h2 className="candidate-portal-section-heading">
              <BookOpen size={18} /> Languages
            </h2>
            
            <div className="candidate-portal-form-row">
              <div className="candidate-portal-form-group">
                <label className="candidate-portal-form-label">Languages can Speak</label>
                <input
                  type="text"
                  name="languagesSpeak"
                  value={formData.languagesSpeak}
                  onChange={handleInputChange}
                  placeholder="e.g., English, Spanish"
                  className="candidate-portal-form-input"
                />
              </div>
              
              <div className="candidate-portal-form-group">
                <label className="candidate-portal-form-label">Languages can Read</label>
                <input
                  type="text"
                  name="languagesRead"
                  value={formData.languagesRead}
                  onChange={handleInputChange}
                  placeholder="e.g., English, Spanish"
                  className="candidate-portal-form-input"
                />
              </div>
            </div>

            <div className="candidate-portal-form-group">
              <label className="candidate-portal-form-label">Languages can Write</label>
              <input
                type="text"
                name="languagesWrite"
                value={formData.languagesWrite}
                onChange={handleInputChange}
                placeholder="e.g., English, Spanish"
                className="candidate-portal-form-input"
              />
            </div>
          </div>

          <div className="candidate-portal-form-actions">
            <button 
              type="submit" 
              className="candidate-portal-submit-btn"
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Onboarding Form'}
            </button>
          </div>
        </form>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="candidate-portal-loading">
        <div className="candidate-portal-loading-spinner"></div>
        <p className="candidate-portal-loading-text">Loading your onboarding portal...</p>
      </div>
    );
  }

  if (!candidateData) {
    return (
      <div className="candidate-portal-error">
        <AlertCircle size={48} />
        <h2 className="candidate-portal-error-title">No Onboarding Data Found</h2>
        <p className="candidate-portal-error-message">Your account doesn't have an active onboarding workflow.</p>
        <button onClick={handleLogout} className="candidate-portal-error-logout">Logout</button>
      </div>
    );
  }

  return (
    <div className="candidate-portal-container">
      {renderSidebar()}
      
      <div className="candidate-portal-main">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'onboarding' && renderOnboardingForm()}
      </div>
    </div>
  );
};

export default CandidateOnboarding;