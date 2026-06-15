import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { 
  Building, 
  User, 
  Mail, 
  Phone, 
  Briefcase,
  MapPin,
  Award,
  Save,
  AlertCircle,
  CheckCircle,
  LogOut,
  LayoutDashboard,
  FileText,
  Edit3,
  Menu,
  X,
  FilePen,
  Upload,
  Download,
  Clock,
  Eye
} from 'lucide-react';
import BASE_URL from '../../url';
import '../styles/EmployerDashboard.css';

const EmployerDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [employer, setEmployer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userName, setUserName] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    return location.state?.employerTab || 'dashboard';
  });
  const [formData, setFormData] = useState({
    companyName: '',
    feinId: '',
    companyAddress: '',
    signingAuthorityName: '',
    signingAuthorityDesignation: '',
    emailId: '',
    contactNo: ''
  });
  const [errors, setErrors] = useState({});
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [userId, setUserId] = useState(null);
  
  // State to track if we've notified the workflow
  const [notifiedWorkflow, setNotifiedWorkflow] = useState(false);

  // Document upload states
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [documentPaths, setDocumentPaths] = useState({});
  
  // Document submission states
  const [documentsSubmitted, setDocumentsSubmitted] = useState(false);
  const [submittingDocuments, setSubmittingDocuments] = useState(false);

  useEffect(() => {
    if (location.state?.employerTab) {
      setActiveTab(location.state.employerTab);
    }
  }, [location.state]);

  useEffect(() => {
    const storedUserId = localStorage.getItem('id');
    setUserId(storedUserId);
    fetchEmployerData();
  }, []);

  useEffect(() => {
    // Check if documents have been submitted
    const submitted = localStorage.getItem('companyDocumentsSubmitted');
    if (submitted === 'true') {
      setDocumentsSubmitted(true);
    }
  }, []);

  // Auto-lookup workflow employee by employer email and store IDs in localStorage
  const lookupWorkflowEmployee = async (employerEmail) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${BASE_URL}/api/onboarding-workflow-employees/client-email/${encodeURIComponent(employerEmail)}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (response.data.success && response.data.data) {
        const { id, companyId } = response.data.data;
        localStorage.setItem('associatedEmployeeId', id);
        localStorage.setItem('companyId', companyId);
        
        console.log('✅ Workflow IDs stored:', { id, companyId });
        console.log('✅ Client (company):', response.data.data.client);
        console.log('✅ ClientName (employer):', response.data.data.clientName);
      }
    } catch (error) {
      console.log('No workflow record found for employer email:', error.message);
    }
  };

  const fetchEmployerData = async () => {
    try {
      const token = localStorage.getItem('token');
      const storedUserId = localStorage.getItem('id');

      if (!token || !storedUserId) {
        navigate('/login');
        return;
      }

      setLoading(true);

      const response = await axios.get(
        `${BASE_URL}/api/onboarding-employers/user/${storedUserId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        const employerData = response.data.data;
        setEmployer(employerData);
        
        setUserName(employerData.signingAuthorityName || employerData.companyName || 'Employer');
        
        setFormData({
          companyName: employerData.companyName || '',
          feinId: employerData.feinId || '',
          companyAddress: employerData.companyAddress || '',
          signingAuthorityName: employerData.signingAuthorityName || '',
          signingAuthorityDesignation: employerData.signingAuthorityDesignation || '',
          emailId: employerData.emailId || '',
          contactNo: employerData.contactNo || ''
        });
        
        // Load document paths if they exist
        if (employerData.documentPaths) {
          setDocumentPaths(employerData.documentPaths);
        }
        
        const allFieldsFilled = 
          employerData.companyName && 
          employerData.feinId && 
          employerData.companyAddress && 
          employerData.signingAuthorityName && 
          employerData.signingAuthorityDesignation && 
          employerData.emailId && 
          employerData.contactNo;
        
        setHasSubmitted(!!allFieldsFilled);
        
        // Lookup workflow employee
        if (employerData.emailId) {
          lookupWorkflowEmployee(employerData.emailId);
        }
      }

    } catch (error) {
      console.error('Error fetching employer data:', error);
      if (error.response?.status === 404) {
        setEmployer(null);
      } else if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    if (saveSuccess) {
      setSaveSuccess(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }

    if (!formData.feinId.trim()) {
      newErrors.feinId = 'Federal ID is required';
    } else if (!/^\d{2}-\d{7}$/.test(formData.feinId.trim())) {
      newErrors.feinId = 'FEIN ID must be in format: 12-3456789';
    }

    if (!formData.companyAddress.trim()) {
      newErrors.companyAddress = 'Company address is required';
    }

    if (!formData.signingAuthorityName.trim()) {
      newErrors.signingAuthorityName = 'Authorized signatory name is required';
    }

    if (!formData.signingAuthorityDesignation.trim()) {
      newErrors.signingAuthorityDesignation = 'Designation is required';
    }

    if (!formData.emailId.trim()) {
      newErrors.emailId = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emailId)) {
      newErrors.emailId = 'Please enter a valid email address';
    }

    if (!formData.contactNo.trim()) {
      newErrors.contactNo = 'Contact number is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
      const employerId = employer?.id;
      
      if (!employerId) {
        alert('Employer data not loaded');
        return;
      }

      const response = await axios.post(
        `${BASE_URL}/api/onboarding-employers/${employerId}/upload-document`,
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

        await syncDocumentToWorkflow(documentType, response.data.data);
        
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

  const syncDocumentToWorkflow = async (documentType, documentData) => {
    try {
      const token = localStorage.getItem('token');
      const associatedEmployeeId = localStorage.getItem('associatedEmployeeId');
      const companyId = localStorage.getItem('companyId');
      
      if (associatedEmployeeId && companyId) {
        // ✅ BUILD COMPLETE DOCUMENT DATA OBJECT WITH ALL REQUIRED PROPERTIES
        const completeDocumentData = {
          // Essential properties needed for preview to work
          fileName: documentData.fileName || documentData.originalName || documentData.name || 'Document',
          fileType: documentData.fileType || documentData.mimetype || 'application/pdf',
          url: documentData.url || documentData.path || documentData.documentPath || '',
          path: documentData.path || documentData.documentPath || '',
          
          // Optional properties
          data: documentData.data || null,
          size: documentData.size || 0,
          
          // Preserve any additional metadata
          ...documentData
        };

        console.log('📤 Syncing COMPLETE document data to workflow:');
        console.log('   Document Type:', documentType);
        console.log('   Complete Data:', completeDocumentData);

        const response = await axios.post(
          `${BASE_URL}/api/onboarding-workflow-employees/company/${companyId}/${associatedEmployeeId}/sync-document`,
          {
            documentType,
            documentData: completeDocumentData  // ✅ Send COMPLETE object with all properties
          },
          {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        console.log(`✅ Synced ${documentType} to workflow record`);
        console.log('   Response:', response.data);
      }
    } catch (error) {
      console.error('❌ Error syncing document to workflow:', error);
      console.error('   Error details:', error.response?.data);
    }
  };

  const handleDeleteDocument = async (documentType) => {
    if (!window.confirm(`Are you sure you want to delete this document?`)) return;

    try {
      const token = localStorage.getItem('token');
      const employerId = employer?.id;
      
      if (!employerId) {
        alert('Employer data not loaded');
        return;
      }

      const response = await axios.delete(
        `${BASE_URL}/api/onboarding-employers/${employerId}/document/${documentType}`,
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

        alert(`✅ Document deleted successfully!`);
      }

    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Error deleting document: ' + (error.response?.data?.message || error.message));
    }
  };

  const getDocumentLabel = (documentType) => {
    switch(documentType) {
      case 'i9': return 'I-9 Form';
      case 'w4': return 'W-4 Form';
      case 'w9': return 'W-9 Form';
      case 'coi': return 'Certificate of Insurance';
      case 'businessLicense': return 'Business License';
      case 'additional': return 'Additional Document';
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    setSaveSuccess(false);

    try {
      const token = localStorage.getItem('token');
      const storedUserId = localStorage.getItem('id');

      let response;
      
      if (employer && employer.id) {
        response = await axios.put(
          `${BASE_URL}/api/onboarding-employers/${employer.id}`,
          formData,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
      } else {
        response = await axios.post(
          `${BASE_URL}/api/onboarding-employers`,
          {
            ...formData,
            username: localStorage.getItem('username'),
            password: '********'
          },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
      }

      if (response.data.success) {
        setSaveSuccess(true);
        setHasSubmitted(true);
        
        try {
          const associatedEmployeeId = localStorage.getItem('associatedEmployeeId');
          const companyId = localStorage.getItem('companyId');
          
          console.log('Attempting to notify workflow:', { associatedEmployeeId, companyId });
          
          if (associatedEmployeeId && companyId) {
            const notifyResponse = await axios.post(
              `${BASE_URL}/api/onboarding-workflow-employees/company/${companyId}/${associatedEmployeeId}/employer-submission`,
              { employerSubmitted: true },
              {
                headers: { 
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              }
            );
            
            if (notifyResponse.data.success) {
              console.log('✅ Notified workflow system about employer submission');
              setNotifiedWorkflow(true);
            }
          } else {
            console.log('No associated employee found in localStorage');
          }
        } catch (notifyError) {
          console.error('Error notifying workflow system:', notifyError);
        }
        
        setActiveTab('company-info');
        
        await fetchEmployerData();
        
        alert('✅ Company information submitted successfully!');
        
        setTimeout(() => setSaveSuccess(false), 3000);
      }

    } catch (error) {
      console.error('Error saving employer data:', error);
      alert('Error saving employer data: ' + (error.response?.data?.message || error.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('associatedEmployeeId');
    localStorage.removeItem('companyId');
    localStorage.clear();
    navigate('/login');
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const renderSidebar = () => {
    return (
      <>
        <button className="employer-portal-mobile-menu-btn" onClick={toggleMobileMenu}>
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <div className={`employer-portal-sidebar ${mobileMenuOpen ? 'employer-portal-sidebar-open' : ''}`}>
        
<div className="employer-portal-sidebar-header">
  <h2>Supplier Portal</h2>
  <p>{employer?.companyName || employer?.signingAuthorityName || 'Employer'}</p>
</div>
          
          <nav className="employer-portal-sidebar-nav">
            <button 
              className={`employer-portal-nav-item ${activeTab === 'dashboard' ? 'employer-portal-nav-active' : ''}`}
              onClick={() => {
                setActiveTab('dashboard');
                setMobileMenuOpen(false);
              }}
            >
              <LayoutDashboard size={18} />
              Dashboard
            </button>

            <button 
              className={`employer-portal-nav-item ${activeTab === 'company-info' ? 'employer-portal-nav-active' : ''}`}
              onClick={() => {
                setActiveTab('company-info');
                setMobileMenuOpen(false);
              }}
            >
              <Building size={18} />
              Company Information
            </button>

            <button 
              className={`employer-portal-nav-item ${activeTab === 'documents' ? 'employer-portal-nav-active' : ''}`}
              onClick={() => {
                setActiveTab('documents');
                setMobileMenuOpen(false);
              }}
            >
              <FileText size={18} />
              Documents
            </button>
          </nav>
          
          <div className="employer-portal-sidebar-footer">
            <button className="employer-portal-logout-btn" onClick={handleLogout}>
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </>
    );
  };

  const renderDashboard = () => {
    return (
      <div className="employer-portal-dashboard">
        <h1 className="employer-portal-welcome-title">Welcome, {employer?.signingAuthorityName || userName}!</h1>
        
        {hasSubmitted ? (
          <div className="employer-portal-submission-success">
            <CheckCircle size={24} />
            <div>
              <h3 className="employer-portal-submission-title">Company Information Submitted!</h3>
              <p className="employer-portal-submission-text">Your company information has been received and is being processed.</p>
              {notifiedWorkflow && (
                <p style={{ color: '#28a745', fontSize: '13px', marginTop: '5px' }}>
                  ✓ Notification sent to admin
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="employer-portal-submission-pending">
            <AlertCircle size={24} />
            <div>
              <h3 className="employer-portal-submission-title">Company Information Pending</h3>
              <p className="employer-portal-submission-text">Please complete your company information form.</p>
            </div>
          </div>
        )}

        {employer && (
          <div className="employer-portal-profile-card">
            <h2 className="employer-portal-section-title">Company Details</h2>
            
            <div className="employer-portal-detail-row">
              <div className="employer-portal-detail-label">Company Name:</div>
              <div className="employer-portal-detail-value">{employer.companyName || 'Not provided'}</div>
            </div>
            
            <div className="employer-portal-detail-row">
              <div className="employer-portal-detail-label">FEIN ID:</div>
              <div className="employer-portal-detail-value">{employer.feinId || 'Not provided'}</div>
            </div>
            
            <div className="employer-portal-detail-row">
              <div className="employer-portal-detail-label">Address:</div>
              <div className="employer-portal-detail-value">{employer.companyAddress || 'Not provided'}</div>
            </div>
            
            <div className="employer-portal-detail-row">
              <div className="employer-portal-detail-label">Signing Authority:</div>
              <div className="employer-portal-detail-value">{employer.signingAuthorityName || 'Not provided'}</div>
            </div>
            
            <div className="employer-portal-detail-row">
              <div className="employer-portal-detail-label">Designation:</div>
              <div className="employer-portal-detail-value">{employer.signingAuthorityDesignation || 'Not provided'}</div>
            </div>
            
            <div className="employer-portal-detail-row">
              <div className="employer-portal-detail-label">Email:</div>
              <div className="employer-portal-detail-value">{employer.emailId || 'Not provided'}</div>
            </div>
            
            <div className="employer-portal-detail-row">
              <div className="employer-portal-detail-label">Contact:</div>
              <div className="employer-portal-detail-value">{employer.contactNo || 'Not provided'}</div>
            </div>

            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e1f5eb' }}>
              <h3 style={{ fontSize: '16px', color: '#2d4a43', marginBottom: '15px' }}>Document Status</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: documentPaths.i9 ? '#28a745' : '#ffc107' }}></div>
                  <span style={{ fontSize: '13px', color: '#4a5e58' }}>I-9 Form: {documentPaths.i9 ? 'Uploaded' : 'Pending'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: documentPaths.w4 ? '#28a745' : '#ffc107' }}></div>
                  <span style={{ fontSize: '13px', color: '#4a5e58' }}>W-4 Form: {documentPaths.w4 ? 'Uploaded' : 'Pending'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: documentPaths.w9 ? '#28a745' : '#ffc107' }}></div>
                  <span style={{ fontSize: '13px', color: '#4a5e58' }}>W-9 Form: {documentPaths.w9 ? 'Uploaded' : 'Pending'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: documentPaths.coi ? '#28a745' : '#ffc107' }}></div>
                  <span style={{ fontSize: '13px', color: '#4a5e58' }}>COI: {documentPaths.coi ? 'Uploaded' : 'Pending'}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCompanyInfoForm = () => {
    if (hasSubmitted) {
      return (
        <div className="employer-portal-onboarding-form">
          <div className="employer-portal-form-header">
            <h1 className="employer-portal-form-title">Company Information Already Submitted</h1>
            <p className="employer-portal-form-subtitle">You have already submitted your company information.</p>
          </div>
          <div className="employer-portal-submission-success employer-portal-submission-large">
            <CheckCircle size={64} color="#28a745" />
            <h2 className="employer-portal-submission-heading">Thank You!</h2>
            <p className="employer-portal-submission-message">Your company information has been received and is being processed.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="employer-portal-onboarding-form">
        <div className="employer-portal-form-header">
          <h1 className="employer-portal-form-title">Complete Your Company Information</h1>
          <p className="employer-portal-form-subtitle">Please fill out all required information below</p>
        </div>

        <form onSubmit={handleSubmit} className="employer-portal-form">
          <div className="employer-portal-form-section">
            <h2 className="employer-portal-section-heading">
              <Building size={18} /> Company Details
            </h2>
            
            <div className="employer-portal-form-group">
              <label>Company Name <span className="required">*</span></label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                placeholder="Enter your company name"
                className={errors.companyName ? 'employer-portal-form-error' : ''}
              />
              {errors.companyName && <span className="employer-portal-error-text">{errors.companyName}</span>}
            </div>

            <div className="employer-portal-form-row">
              <div className="employer-portal-form-group">
                <label>Federal ID (FEIN) <span className="required">*</span></label>
                <input
                  type="text"
                  name="feinId"
                  value={formData.feinId}
                  onChange={handleInputChange}
                  placeholder="12-3456789"
                  className={errors.feinId ? 'employer-portal-form-error' : ''}
                />
                {errors.feinId && <span className="employer-portal-error-text">{errors.feinId}</span>}
              </div>

              <div className="employer-portal-form-group">
                <label>Contact Number <span className="required">*</span></label>
                <input
                  type="tel"
                  name="contactNo"
                  value={formData.contactNo}
                  onChange={handleInputChange}
                  placeholder="+1 234 567 8900"
                  className={errors.contactNo ? 'employer-portal-form-error' : ''}
                />
                {errors.contactNo && <span className="employer-portal-error-text">{errors.contactNo}</span>}
              </div>
            </div>

            <div className="employer-portal-form-group">
              <label>Company Address <span className="required">*</span></label>
              <textarea
                name="companyAddress"
                value={formData.companyAddress}
                onChange={handleInputChange}
                placeholder="Enter your company's complete address"
                rows="3"
                className={errors.companyAddress ? 'employer-portal-form-error' : ''}
              />
              {errors.companyAddress && <span className="employer-portal-error-text">{errors.companyAddress}</span>}
            </div>
          </div>

          <div className="employer-portal-form-section">
            <h2 className="employer-portal-section-heading">
              <User size={18} /> Authorized Signatory
            </h2>
            
            <div className="employer-portal-form-row">
              <div className="employer-portal-form-group">
                <label>Full Name <span className="required">*</span></label>
                <input
                  type="text"
                  name="signingAuthorityName"
                  value={formData.signingAuthorityName}
                  onChange={handleInputChange}
                  placeholder="Enter authorized signatory name"
                  className={errors.signingAuthorityName ? 'employer-portal-form-error' : ''}
                />
                {errors.signingAuthorityName && <span className="employer-portal-error-text">{errors.signingAuthorityName}</span>}
              </div>

              <div className="employer-portal-form-group">
                <label>Designation <span className="required">*</span></label>
                <input
                  type="text"
                  name="signingAuthorityDesignation"
                  value={formData.signingAuthorityDesignation}
                  onChange={handleInputChange}
                  placeholder="e.g., CEO, HR Manager"
                  className={errors.signingAuthorityDesignation ? 'employer-portal-form-error' : ''}
                />
                {errors.signingAuthorityDesignation && <span className="employer-portal-error-text">{errors.signingAuthorityDesignation}</span>}
              </div>
            </div>

            <div className="employer-portal-form-group">
              <label>Email Address <span className="required">*</span></label>
              <input
                type="email"
                name="emailId"
                value={formData.emailId}
                onChange={handleInputChange}
                placeholder="email@company.com"
                className={errors.emailId ? 'employer-portal-form-error' : ''}
              />
              {errors.emailId && <span className="employer-portal-error-text">{errors.emailId}</span>}
            </div>
          </div>

          {saveSuccess && (
            <div className="employer-portal-success-message">
              <CheckCircle size={20} />
              <span>Company information saved successfully!</span>
            </div>
          )}

          <div className="employer-portal-form-actions">
            <button 
              type="submit" 
              className="employer-portal-submit-btn"
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Company Information'}
            </button>
          </div>
        </form>
      </div>
    );
  };

  const renderDocuments = () => {
    const documentTypes = [
      { 
        key: 'i9', 
        label: "I-9 Form",
        description: "Employment Eligibility Verification",
        acceptedTypes: ".pdf,.jpg,.jpeg,.png"
      },
      { 
        key: 'w4', 
        label: "W-4 Form",
        description: "Employee's Withholding Certificate",
        acceptedTypes: ".pdf,.jpg,.jpeg,.png"
      },
      { 
        key: 'w9', 
        label: "W-9 Form",
        description: "Request for Taxpayer Identification Number",
        acceptedTypes: ".pdf,.jpg,.jpeg,.png"
      },
      { 
        key: 'coi', 
        label: "Certificate of Insurance",
        description: "Proof of insurance coverage",
        acceptedTypes: ".pdf,.jpg,.jpeg,.png"
      },
      { 
        key: 'businessLicense', 
        label: "Business License",
        description: "Business operating license",
        acceptedTypes: ".pdf,.jpg,.jpeg,.png"
      }
    ];

    const handleSubmitDocuments = async () => {
      const uploadedDocs = Object.keys(documentPaths).filter(key => 
        ['i9', 'w4', 'w9', 'coi', 'businessLicense'].includes(key)
      );
      
      if (uploadedDocs.length === 0) {
        alert('Please upload at least one document before submitting.');
        return;
      }

      setSubmittingDocuments(true);
      
      try {
        const token = localStorage.getItem('token');
        const employerId = employer?.id;
        
        if (!employerId) {
          alert('Employer data not loaded');
          return;
        }

        const associatedEmployeeId = localStorage.getItem('associatedEmployeeId');
        const companyId = localStorage.getItem('companyId');
        
        if (associatedEmployeeId && companyId) {
          for (const docType of uploadedDocs) {
            await axios.post(
              `${BASE_URL}/api/onboarding-workflow-employees/company/${companyId}/${associatedEmployeeId}/sync-document`,
              {
                documentType: docType,
                documentData: documentPaths[docType]
              },
              {
                headers: { 
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              }
            );
          }
          
          await axios.post(
            `${BASE_URL}/api/onboarding-workflow-employees/company/${companyId}/${associatedEmployeeId}/employer-submission`,
            { 
              employerSubmitted: true,
              documentsSubmitted: true,
              documentType: 'companyDocuments'
            },
            {
              headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          localStorage.setItem('companyDocumentsSubmitted', 'true');
          setDocumentsSubmitted(true);
          
          alert('✅ Documents submitted successfully! The admin can now review them.');
        } else {
          alert('No associated workflow found. Documents saved locally.');
        }
        
      } catch (error) {
        console.error('Error submitting documents:', error);
        alert('Error submitting documents: ' + (error.response?.data?.message || error.message));
      } finally {
        setSubmittingDocuments(false);
      }
    };

    if (documentsSubmitted) {
      return (
        <div className="employer-portal-onboarding-form">
          <div className="employer-portal-form-header">
            <h1 className="employer-portal-form-title">
              <FileText size={24} style={{ color: '#019d88', marginRight: '10px', verticalAlign: 'middle' }} />
              Documents Submitted
            </h1>
            <p className="employer-portal-form-subtitle">
              Your documents have been successfully submitted for review.
            </p>
          </div>
          
          <div className="employer-portal-submission-success employer-portal-submission-large">
            <CheckCircle size={64} color="#28a745" />
            <h2 className="employer-portal-submission-heading">Thank You!</h2>
            <p className="employer-portal-submission-message">Your company documents have been submitted and are being reviewed.</p>
            
            <div style={{ marginTop: '30px', textAlign: 'left', width: '100%' }}>
              <h3 style={{ marginBottom: '15px', color: '#1a3c34' }}>Uploaded Documents:</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
                {Object.entries(documentPaths).map(([key, doc]) => (
                  ['i9', 'w4', 'w9', 'coi', 'businessLicense'].includes(key) && (
                    <div key={key} className="onboarding-document-card" style={{ borderLeft: '3px solid #28a745' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontWeight: '600' }}>{getDocumentLabel(key)}</div>
                          <div style={{ fontSize: '12px', color: '#666' }}>{doc.fileName}</div>
                        </div>
                        <a 
                          href={doc.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="onboarding-icon-btn onboarding-view"
                          style={{ background: '#019d88', color: 'white' }}
                        >
                          <Eye size={14} />
                        </a>
                      </div>
                    </div>
                  )
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="employer-portal-onboarding-form">
        <div className="employer-portal-form-header">
          <h1 className="employer-portal-form-title">
            <FileText size={24} style={{ color: '#019d88', marginRight: '10px', verticalAlign: 'middle' }} />
            Documents
          </h1>
          <p className="employer-portal-form-subtitle">
            Upload and manage your company documents
          </p>
        </div>

        <div className="employer-portal-documents-info" style={{ 
          background: '#e7f3ff', 
          border: '1px solid #b8e2ff', 
          borderRadius: '8px', 
          padding: '12px 20px', 
          marginBottom: '30px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px' 
        }}>
          <AlertCircle size={20} color="#0369a1" />
          <p style={{ margin: 0, color: '#0369a1', fontSize: '14px' }}>
            Maximum file size: 10MB per file. Allowed formats: PDF, JPEG, PNG
          </p>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '20px',
          marginBottom: '30px'
        }}>
          {documentTypes.map((doc) => {
            const uploadedDoc = documentPaths[doc.key];
            const isUploading = uploadProgress[doc.key] > 0 && uploadProgress[doc.key] < 100;
            
            return (
              <div key={doc.key} style={{
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                transition: 'all 0.3s ease'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <FileText size={24} color="#019d88" />
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>{doc.label}</h3>
                </div>
                <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '20px', lineHeight: '1.5' }}>
                  {doc.description}
                </p>
                
                {uploadedDoc ? (
                  <div style={{
                    background: '#f8fefb',
                    border: '1px solid #c3e6cb',
                    borderRadius: '8px',
                    padding: '15px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                      <span style={{ fontSize: '24px' }}>{getDocumentIcon(uploadedDoc.fileType)}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: '500', color: '#1a3c34', wordBreak: 'break-word' }}>
                          {uploadedDoc.fileName}
                        </div>
                        <div style={{ fontSize: '11px', color: '#6b7280' }}>
                          {formatFileSize(uploadedDoc.fileSize)} • Uploaded {new Date(uploadedDoc.uploadedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <a 
                        href={uploadedDoc.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{
                          padding: '6px 12px',
                          background: '#e0f2fe',
                          color: '#0369a1',
                          borderRadius: '4px',
                          fontSize: '12px',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Eye size={14} /> View
                      </a>
                      <button 
                        onClick={() => handleDeleteDocument(doc.key)}
                        style={{
                          padding: '6px 12px',
                          background: '#fee2e2',
                          color: '#dc2626',
                          borderRadius: '4px',
                          fontSize: '12px',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{
                    border: '2px dashed #d1d5db',
                    borderRadius: '8px',
                    padding: '20px',
                    textAlign: 'center',
                    background: '#fafafa',
                    position: 'relative'
                  }}>
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
                      style={{
                        position: 'absolute',
                        width: '0.1px',
                        height: '0.1px',
                        opacity: 0,
                        overflow: 'hidden',
                        zIndex: -1
                      }}
                    />
                    <label
                      htmlFor={`file-${doc.key}`}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer'
                      }}
                    >
                      {isUploading ? (
                        <>
                          <div className="employer-portal-loading-spinner" style={{ width: '24px', height: '24px' }}></div>
                          <span style={{ color: '#019d88', fontSize: '13px' }}>Uploading... {uploadProgress[doc.key]}%</span>
                        </>
                      ) : (
                        <>
                          <Upload size={24} color="#9ca3af" />
                          <span style={{ color: '#019d88', fontSize: '13px', fontWeight: '500' }}>Click to Upload</span>
                        </>
                      )}
                    </label>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{
          background: '#f8fafc',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid #e5e7eb',
          marginTop: '20px',
          marginBottom: '30px'
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Upload size={18} color="#019d88" />
            Additional Documents
          </h3>
          <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '20px' }}>
            Upload any other required documents (contracts, agreements, etc.)
          </p>
          <div style={{
            border: '2px dashed #d1d5db',
            borderRadius: '8px',
            padding: '30px',
            textAlign: 'center',
            background: 'white'
          }}>
            <input
              type="file"
              id="additional-docs"
              multiple
              style={{ display: 'none' }}
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={(e) => {
                if (e.target.files.length > 0) {
                  for (let i = 0; i < e.target.files.length; i++) {
                    handleDocumentUpload('additional_' + Date.now() + '_' + i, e.target.files[i]);
                  }
                }
              }}
            />
            <label
              htmlFor="additional-docs"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                background: '#019d88',
                color: 'white',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: 'pointer',
                border: 'none'
              }}
            >
              <Upload size={16} />
              Choose Files
            </label>
            <p style={{ color: '#9ca3af', fontSize: '12px', marginTop: '12px' }}>
              You can select multiple files
            </p>
          </div>
        </div>

        <div style={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          marginTop: '20px',
          paddingTop: '20px',
          borderTop: '1px solid #e5e7eb'
        }}>
          <button
            onClick={handleSubmitDocuments}
            disabled={submittingDocuments}
            style={{
              background: submittingDocuments ? '#9ca3af' : 'linear-gradient(135deg, #1d8c70 0%, #2db69c 100%)',
              color: 'white',
              border: 'none',
              padding: '14px 40px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: submittingDocuments ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {submittingDocuments ? (
              <>
                <div className="employer-portal-loading-spinner" style={{ width: '20px', height: '20px' }}></div>
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle size={18} />
                Submit Documents for Review
              </>
            )}
          </button>
        </div>

        <p style={{ color: '#9ca3af', fontSize: '12px', textAlign: 'center', marginTop: '24px' }}>
          All documents are securely stored and encrypted
        </p>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="employer-portal-loading">
        <div className="employer-portal-loading-spinner"></div>
        <p className="employer-portal-loading-text">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="employer-portal-container">
      {renderSidebar()}
      
      <div className="employer-portal-main">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'company-info' && renderCompanyInfoForm()}
        {activeTab === 'documents' && renderDocuments()}
      </div>
    </div>
  );
};

export default EmployerDashboard;