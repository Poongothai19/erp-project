// CompaniesView.js - Fixed Payroll Due Display
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Building, 
  ChevronRight, 
  MapPin, 
  Calendar, 
  CheckCircle, 
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Download,
  Mail,
  Users,
  AlertCircle,
  Briefcase,
  X,
  Eye,
  Save,
  Upload as UploadIcon 
} from 'lucide-react';
import axios from 'axios';
import BASE_URL from "../../url";
import '../styles/Timesheet.css';

// Success Alert Notification Component
const SuccessNotification = ({ message, onClose }) => {
  return (
    <div className="cv2-notification" style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      backgroundColor: '#d4edda',
      color: '#155724',
      padding: '12px 20px',
      borderRadius: '4px',
      border: '1px solid #c3e6cb',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      zIndex: 10003,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      minWidth: '300px',
      maxWidth: '500px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          backgroundColor: '#28a745',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '12px',
          fontWeight: 'bold'
        }}>
          ✓
        </div>
        <span style={{ fontSize: '14px', fontWeight: '500' }}>{message}</span>
      </div>
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: '#155724',
          fontSize: '18px',
          cursor: 'pointer',
          padding: '0',
          marginLeft: '10px'
        }}
      >
        ×
      </button>
    </div>
  );
};

const LogoUploadField = ({ company, onLogoUpload, isUploading = false, error = null, onLogoRemove = null, showNotification  }) => {
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [fileName, setFileName] = useState('');

  useEffect(() => {
    // If company has a logo, generate the endpoint URL
    if (company?.id && company?.id !== 'new' && company?.hasLogo) {
      // Use the API endpoint to retrieve logo from database
      const logoUrl = `${BASE_URL}/api/companies/${company.id}/logo`;
      setPreview(logoUrl);
      setFileName(`company-logo-${company.id}`);
    } else {
      setPreview(null);
      setFileName('');
    }
  }, [company]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
  if (!file) return;

  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    showNotification('Only image files (JPEG, PNG, GIF, WebP) are allowed'); // Fixed
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    showNotification('File size must be less than 5MB'); // Fixed
    return;
  }
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
      setFileName(file.name);
    };
    reader.readAsDataURL(file);

    if (company?.id === 'new') {
      if (onLogoUpload) {
        onLogoUpload(file, 'new');
      }
    } else {
      onLogoUpload(file, company?.id);
    }
  };

  const handleRemoveLogo = () => {
    setPreview(null);
    setFileName('');
    if (onLogoRemove && company?.id !== 'new') {
      onLogoRemove(company?.id);
    }
  };

  return (
    <FormField label="Company Logo" fullWidth error={error}>
      <div className="logo-upload-container">
        {preview && (
          <div className="logo-preview">
            <img 
              src={preview} 
              alt="Logo preview" 
              className="logo-preview-img"
              onError={(e) => {
                console.error('Logo preview failed to load');
                setPreview(null);
              }}
            />
            <div className="logo-preview-actions">
              <p className="logo-file-name">{fileName}</p>
              <button 
                type="button" 
                className="logo-remove-btn"
                onClick={handleRemoveLogo}
                disabled={isUploading}
              >
                <X size={16} />
                Remove
              </button>
            </div>
          </div>
        )}

        <div
          className={`logo-upload-area ${preview ? 'has-logo' : ''}`}
          onClick={() => fileInputRef.current?.click()}
        >
          <UploadIcon size={32} className="upload-icon" />
          <p className="upload-text">
            {preview ? 'Click to change logo' : 'Click to upload logo'}
          </p>
          <p className="upload-hint">Supported: JPEG, PNG, GIF, WebP (Max 5MB)</p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleFileSelect}
          className="logo-input-hidden"
          disabled={isUploading}
        />

        {isUploading && (
          <div className="upload-progress">
            <div className="cv2-loading-spinner"></div>
            <p>Uploading logo...</p>
          </div>
        )}
      </div>
    </FormField>
  );
};

// Constants
const COMPANY_STATUS_OPTIONS = ['all', 'Active', 'Inactive', 'Pending'];
const COMPANY_TYPE_OPTIONS = ['all', 'Technologies', 'Consulting', 'Offshore', 'Services'];

const COMPANY_FORM_INITIAL_STATE = {
  name: '',
  clientId: '',
  address: '',
  type: 'Technologies',
  accountManager: '',
  employees: '',
  status: 'Active',
  payrollDueDate: '',
  nextCheckDate: ''
};

// Get company actions based on status
const getCompanyActions = (company) => {
  const baseActions = ['View Details', 'Edit Company', 'Export Data', 'Send Reminder'];
  const statusAction = company.status === 'Active' ? 'Deactivate' : 'Activate';
  return [...baseActions, statusAction, 'Delete Company'];
};

// =======================================
// MODAL COMPONENTS
// =======================================

// PARENT COMPONENT: Modal Container
const ModalContainer = ({ isOpen, onClose, title, icon, children, className = '' }) => {
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className={`cv2-modal-overlay ${isOpen ? 'active' : ''} ${className}`} 
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
    >
      <div className="cv2-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="cv2-modal-header">
          <h2>{icon} {title}</h2>
          <button 
            className="cv2-modal-close-btn"
            onClick={onClose}
            type="button"
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

// CHILD COMPONENT: Form Container
const FormContainer = ({ onSubmit, children }) => (
  <form onSubmit={onSubmit} className="cv2-form">
    {children}
  </form>
);

// CHILD COMPONENT: Form Fields Grid
const FormFieldsGrid = ({ children }) => (
  <div className="cv2-form-grid">
    {children}
  </div>
);

// CHILD COMPONENT: Form Field
const FormField = ({ label, children, fullWidth = false, required = false, error = null }) => (
  <div className={`cv2-form-group ${fullWidth ? 'cv2-form-group-full' : ''}`}>
    <label>
      {label}
      {required && <span style={{ color: '#ef4444' }}> *</span>}
    </label>
    {children}
    {error && <div className="cv2-form-error">{error}</div>}
  </div>
);

// CHILD COMPONENT: Form Actions
const FormActions = ({ onCancel, isEditMode, isLoading = false }) => (
  <div className="cv2-form-actions">
    <button
      type="button"
      className="cv2-modal-btn cv2-modal-btn-secondary"
      onClick={onCancel}
      disabled={isLoading}
    >
      Cancel
    </button>
    <button
      type="submit"
      className="cv2-modal-btn cv2-modal-btn-primary"
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <div className="cv2-loading-spinner" />
          Saving...
        </>
      ) : (
        <>
          <Save className="icon" />
          {isEditMode ? 'Update Company' : 'Add Company'}
        </>
      )}
    </button>
  </div>
);

// CHILD COMPONENT: Company Form Fields
const CompanyFormFields = ({ 
  formData, 
  onFormChange, 
  errors = {}, 
  company = null, 
  onLogoUpload = null, 
  onLogoRemove = null,
  isUploading = false,
  showNotification 
}) => {
  return (
    <FormFieldsGrid>
      {/* Logo Upload Field - Show for both Add and Edit modals */}
      {/* {onLogoUpload && (
        <LogoUploadField
          company={company}
          onLogoUpload={onLogoUpload}
          onLogoRemove={onLogoRemove}
          isUploading={isUploading}
          error={errors.logo}
          showNotification={showNotification} 
        />
      )} */}
      
      <FormField label="Company Name" required error={errors.name}>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={onFormChange}
          className="cv2-form-input"
          required
          placeholder="Enter company name"
          autoComplete="off"
        />
      </FormField>
      
      <FormField label="Client ID" required error={errors.clientId}>
        <input
          type="text"
          name="clientId"
          value={formData.clientId}
          onChange={onFormChange}
          className="cv2-form-input"
          required
          placeholder="Enter client ID"
          autoComplete="off"
        />
      </FormField>
      
      <FormField label="Address" required fullWidth error={errors.address}>
        <input
          type="text"
          name="address"
          value={formData.address}
          onChange={onFormChange}
          className="cv2-form-input"
          required
          placeholder="Enter company address"
          autoComplete="off"
        />
      </FormField>
      
      <FormField label="Company Type" error={errors.type}>
        <select
          name="type"
          value={formData.type}
          onChange={onFormChange}
          className="cv2-form-select"
        >
          {COMPANY_TYPE_OPTIONS.filter(type => type !== 'all').map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </FormField>
      
      <FormField label="Account Manager" error={errors.accountManager}>
        <input
          type="text"
          name="accountManager"
          value={formData.accountManager}
          onChange={onFormChange}
          className="cv2-form-input"
          placeholder="Enter account manager name"
          autoComplete="off"
        />
      </FormField>
      
      <FormField label="Number of Employees" error={errors.employees}>
        <input
          type="number"
          name="employees"
          value={formData.employees}
          onChange={onFormChange}
          className="cv2-form-input"
          min="0"
          placeholder="0"
        />
      </FormField>
      
      <FormField label="Status" error={errors.status}>
        <select
          name="status"
          value={formData.status}
          onChange={onFormChange}
          className="cv2-form-select"
        >
          {COMPANY_STATUS_OPTIONS.filter(status => status !== 'all').map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </FormField>
      
      <FormField label="Payroll Due Date" error={errors.payrollDueDate}>
        <input
          type="date"
          name="payrollDueDate"
          value={formData.payrollDueDate}
          onChange={onFormChange}
          className="cv2-form-input"
        />
      </FormField>
      
      <FormField label="Next Check Date" error={errors.nextCheckDate}>
        <input
          type="date"
          name="nextCheckDate"
          value={formData.nextCheckDate}
          onChange={onFormChange}
          className="cv2-form-input"
        />
      </FormField>
    </FormFieldsGrid>
  );
};


// PARENT COMPONENT: Company Modal
const CompanyModal = ({ 
  isOpen, 
  onClose, 
  title, 
  icon, 
  onSubmit, 
  formData, 
  onFormChange, 
  errors,
  isEditMode = false,
  isLoading = false
}) => {
  const handleFormSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <ModalContainer
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      icon={icon}
      className="company-modal"
    >
      <FormContainer onSubmit={handleFormSubmit}>
        <CompanyFormFields 
          formData={formData}
          onFormChange={onFormChange}
          errors={errors}
        />
        <FormActions 
          onCancel={onClose}
          isEditMode={isEditMode}
          isLoading={isLoading}
        />
      </FormContainer>
    </ModalContainer>
  );
};

const AddCompanyModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  formData, 
  onFormChange, 
  errors,
  isLoading,
  onLogoUpload,
  logoUploading,
  showNotification
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <ModalContainer
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Company"
      icon={<Plus className="icon" />}
      className="company-modal"
    >
      <FormContainer onSubmit={handleSubmit}>
        <CompanyFormFields 
          formData={formData}
          onFormChange={onFormChange}
          errors={errors}
          company={{ id: 'new' }}
          onLogoUpload={onLogoUpload}
          isUploading={logoUploading}
          showNotification={showNotification}
        />
        <FormActions 
          onCancel={onClose}
          isEditMode={false}
          isLoading={isLoading}
        />
      </FormContainer>
    </ModalContainer>
  );
};

const EditCompanyModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  formData, 
  onFormChange, 
  errors,
  isLoading,
  company,
  onLogoUpload,
  onLogoRemove,
  logoUploading,
  showNotification
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <ModalContainer
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Company"
      icon={<Edit className="icon" />}
      className="company-modal"
    >
      <FormContainer onSubmit={handleSubmit}>
        <CompanyFormFields 
          formData={formData}
          onFormChange={onFormChange}
          errors={errors}
          company={company}
          onLogoUpload={onLogoUpload}
          onLogoRemove={onLogoRemove}
          isUploading={logoUploading}
          showNotification={showNotification}
        />
        <FormActions 
          onCancel={onClose}
          isEditMode={true}
          isLoading={isLoading}
        />
      </FormContainer>
    </ModalContainer>
  );
};

// COMPANY DETAILS MODAL
const CompanyDetailsModal = ({ isOpen, onClose, company, onActionSelect }) => (
  <ModalContainer
    isOpen={isOpen}
    onClose={onClose}
    title="Company Details"
    icon={<Eye size={20} />}
    className="details-modal"
  >
    {company && (
      <div className="cv2-modal-details-content">
        {/* {company.logoPath && (
          <div className="cv2-modal-logo-section">
            <img 
              src={`${BASE_URL}${company.logoPath}`} 
              alt={company.name} 
              className="cv2-modal-logo" 
            />
          </div>
        )} */}
        <div className="cv2-modal-details-grid">
          <div className="cv2-modal-detail-section">
            <h3><Building size={16} /> Basic Information</h3>
            <div className="cv2-modal-detail-item">
              <Building className="cv2-modal-detail-icon" />
              <div>
                <span className="cv2-modal-detail-label">Company Name:</span>
                <span className="cv2-modal-detail-value">{company.name}</span>
              </div>
            </div>
            <div className="cv2-modal-detail-item">
              <span className="cv2-modal-detail-label">Client ID:</span>
              <span className="cv2-modal-detail-value">{company.clientId}</span>
            </div>
            <div className="cv2-modal-detail-item">
              <MapPin className="cv2-modal-detail-icon" />
              <div>
                <span className="cv2-modal-detail-label">Address:</span>
                <span className="cv2-modal-detail-value">{company.address}</span>
              </div>
            </div>
            <div className="cv2-modal-detail-item">
              <Briefcase className="cv2-modal-detail-icon" />
              <div>
                <span className="cv2-modal-detail-label">Type:</span>
                <span className="cv2-modal-detail-value">{company.type}</span>
              </div>
            </div>
            <div className="cv2-modal-detail-item">
              <span className="cv2-modal-detail-label">Status:</span>
              <span className={`cv2-modal-status-badge ${company.status.toLowerCase()}`}>
                {company.status}
              </span>
            </div>
          </div>
          
          <div className="cv2-modal-detail-section">
            <h3><Users size={16} /> Management & Employees</h3>
            <div className="cv2-modal-detail-item">
              <span className="cv2-modal-detail-label">Account Manager:</span>
              <span className="cv2-modal-detail-value">{company.accountManager || 'Not assigned'}</span>
            </div>
            <div className="cv2-modal-detail-item">
              <Users className="cv2-modal-detail-icon" />
              <div>
                <span className="cv2-modal-detail-label">Total Employees:</span>
                <span className="cv2-modal-detail-value">{company.employees}</span>
              </div>
            </div>
          </div>
          
          <div className="cv2-modal-detail-section">
            <h3><Calendar size={16} /> Important Dates</h3>
            <div className="cv2-modal-detail-item">
              <Calendar className="cv2-modal-detail-icon" />
              <div>
                <span className="cv2-modal-detail-label">Payroll Due Date:</span>
                <span className="cv2-modal-detail-value">
                  {company.payrollDueDate ? new Date(company.payrollDueDate).toLocaleDateString() : 'Not set'}
                </span>
              </div>
            </div>
            <div className="cv2-modal-detail-item">
              <Calendar className="cv2-modal-detail-icon" />
              <div>
                <span className="cv2-modal-detail-label">Next Check Date:</span>
                <span className="cv2-modal-detail-value">
                  {company.nextCheckDate ? new Date(company.nextCheckDate).toLocaleDateString() : 'Not set'}
                </span>
              </div>
            </div>
            <div className="cv2-modal-detail-item">
              <span className="cv2-modal-detail-label">Created:</span>
              <span className="cv2-modal-detail-value">
                {company.createdAt ? new Date(company.createdAt).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <div className="cv2-modal-detail-item">
              <span className="cv2-modal-detail-label">Last Updated:</span>
              <span className="cv2-modal-detail-value">
                {company.updatedAt ? new Date(company.updatedAt).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>
          
          <div className="cv2-modal-detail-section">
            <h3><AlertCircle size={16} /> Payroll Status</h3>
            <div className="cv2-modal-detail-item">
              <AlertCircle className="cv2-modal-detail-icon" />
              <div>
                <span className="cv2-modal-detail-label">Days Until Payroll Due:</span>
                <span className="cv2-modal-detail-value">
                  {company.daysUntilPayrollDue !== null && company.daysUntilPayrollDue !== undefined
                    ? `${company.daysUntilPayrollDue} days`
                    : 'Not set'
                  }
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="cv2-modal-details-actions">
          <button
            type="button"
            className="cv2-modal-btn cv2-modal-btn-secondary"
            onClick={() => onActionSelect(company.status === 'Active' ? 'Deactivate' : 'Activate', company)}
          >
            <CheckCircle size={16} />
            {company.status === 'Active' ? 'Deactivate' : 'Activate'}
          </button>
          <button
            type="button"
            className="cv2-modal-btn cv2-modal-btn-secondary"
            onClick={() => {
              onClose();
              onActionSelect('Edit Company', company);
            }}
          >
            <Edit size={16} />
            Edit Company
          </button>
          <button
            type="button"
            className="cv2-modal-btn cv2-modal-btn-secondary"
            onClick={() => onActionSelect('Export Data', company)}
          >
            <Download size={16} />
            Export Data
          </button>
          <button
            type="button"
            className="cv2-modal-btn cv2-modal-btn-secondary"
            onClick={() => onActionSelect('Send Reminder', company)}
          >
            <Mail size={16} />
            Send Reminder
          </button>
          <button
            type="button"
            className="cv2-modal-btn cv2-modal-btn-danger"
            onClick={() => onActionSelect('Delete Company', company)}
          >
            <Trash2 size={16} />
            Delete Company
          </button>
        </div>
      </div>
    )}
  </ModalContainer>
);

// =======================================
// MAIN COMPONENT
// =======================================
const CompaniesView = () => {
  const navigate = useNavigate();
  
  // State management
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [showActionsMenu, setShowActionsMenu] = useState(null);
  
  // Modal state
  const [showAddCompanyModal, setShowAddCompanyModal] = useState(false);
  const [showEditCompanyModal, setShowEditCompanyModal] = useState(false);
  const [showCompanyDetailsModal, setShowCompanyDetailsModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    assignedToMe: 0,
    payrollDueSoon: 0,
    totalEmployees: 0
  });

  // Form states
  const [addCompanyForm, setAddCompanyForm] = useState(COMPANY_FORM_INITIAL_STATE);
  const [editCompanyForm, setEditCompanyForm] = useState(COMPANY_FORM_INITIAL_STATE);
  const [errors, setErrors] = useState({});

  // Logo upload state
  const [logoUploading, setLogoUploading] = useState(false);

  // Notification state
  const [notification, setNotification] = useState(null);

  // Use refs to store error state without causing re-renders
  const errorsRef = useRef({});
  
  useEffect(() => {
    errorsRef.current = errors;
  }, [errors]);

  // Define showNotification BEFORE any functions that use it
  const showNotification = useCallback((message, duration = 3000) => {
    setNotification(message);
    setTimeout(() => {
      setNotification(null);
    }, duration);
  }, []);

  const fetchCompanies = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('No authentication token found');
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`${BASE_URL}/api/companies`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      });

      let companiesData = [];
      if (response.data) {
        if (Array.isArray(response.data)) {
          companiesData = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          companiesData = response.data.data;
        }
      }

      const finalCompaniesData = Array.isArray(companiesData) ? companiesData.map(company => {
        // Get logo from either Logo or logoPath field
        const logoPath = company.Logo || company.logoPath || company.logo || null;
        
        return {
          ...company,
          id: company.Id || company.id,
          name: company.Name || company.name || '',
          clientId: company.ClientId || company.clientId || '',
          address: company.Address || company.address || '',
          type: company.Type || company.type || '',
          accountManager: company.AccountManager || company.accountManager || '',
          employees: company.Employees || company.employees || 0,
          status: company.Status || company.status || 'Active',
          payrollDueDate: company.PayrollDueDate || company.payrollDueDate,
          nextCheckDate: company.NextCheckDate || company.nextCheckDate,
          createdAt: company.CreatedAt || company.createdAt,
          updatedAt: company.UpdatedAt || company.updatedAt,
          // FIXED: Properly map logo from database
          logoPath: logoPath, // This will contain the full path like /uploads/company-logos/company-5-xxx.jpg
          daysUntilPayrollDue: company.DaysUntilPayrollDue !== undefined ? company.DaysUntilPayrollDue : (company.daysUntilPayrollDue !== undefined ? company.daysUntilPayrollDue : null),
          daysUntilNextCheck: company.DaysUntilNextCheck || company.daysUntilNextCheck
        };
      }) : [];

      // Debug logging
      console.log('Fetched companies with logos:', finalCompaniesData.map(c => ({
        name: c.name,
        logoPath: c.logoPath,
        payrollDueDate: c.payrollDueDate,
        daysUntilPayrollDue: c.daysUntilPayrollDue
      })));

      setCompanies(finalCompaniesData);
      setFilteredCompanies(finalCompaniesData);
      updateStats(finalCompaniesData);

    } catch (error) {
      console.error("Fetch companies error:", error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        showNotification('Session Expired - Please login again');
        navigate('/login');
      } else {
        showNotification('Failed to load companies');
      }
      setCompanies([]);
      setFilteredCompanies([]);
      updateStats([]);
    } finally {
      setLoading(false);
    }
  }, [navigate, showNotification]);

  // FIXED: Stable form change handlers
  const handleAddCompanyFormChange = useCallback((e) => {
    const { name, value } = e.target;
    setAddCompanyForm(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error if exists
    if (errorsRef.current[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  }, []);

  const handleEditCompanyFormChange = useCallback((e) => {
    const { name, value } = e.target;
    setEditCompanyForm(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error if exists
    if (errorsRef.current[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  }, []);

  // Validation function
  const validateCompanyForm = useCallback((formData) => {
    const newErrors = {};
    
    if (!formData.name?.trim()) {
      newErrors.name = 'Company name is required';
    }
    
    if (!formData.clientId?.trim()) {
      newErrors.clientId = 'Client ID is required';
    }
    
    if (!formData.address?.trim()) {
      newErrors.address = 'Address is required';
    }

    if (formData.employees && (isNaN(formData.employees) || parseInt(formData.employees) < 0)) {
      newErrors.employees = 'Number of employees must be a valid positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, []);

  // Reset form functions
  const resetAddCompanyForm = useCallback(() => {
    setAddCompanyForm(COMPANY_FORM_INITIAL_STATE);
    setErrors({});
  }, []);

  const resetEditCompanyForm = useCallback(() => {
    setEditCompanyForm(COMPANY_FORM_INITIAL_STATE);
    setErrors({});
  }, []);

  // Modal handlers
  const handleAddCompany = useCallback(() => {
    resetAddCompanyForm();
    setShowAddCompanyModal(true);
  }, [resetAddCompanyForm]);

  const handleEditCompany = useCallback((company) => {
    setSelectedCompany(company);
    setEditCompanyForm({
      name: company.name || '',
      clientId: company.clientId || '',
      address: company.address || '',
      type: company.type || 'Technologies',
      accountManager: company.accountManager || '',
      employees: company.employees?.toString() || '',
      status: company.status || 'Active',
      payrollDueDate: company.payrollDueDate ? company.payrollDueDate.split('T')[0] : '',
      nextCheckDate: company.nextCheckDate ? company.nextCheckDate.split('T')[0] : ''
    });
    setErrors({});
    setShowEditCompanyModal(true);
    setShowActionsMenu(null);
  }, []);

  // Company CRUD operations
  const addCompany = useCallback(async (companyData) => {
    if (!validateCompanyForm(companyData)) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication token not found');
    }

    try {
      setIsLoading(true);
      const apiData = {
        name: companyData.name.trim(),
        clientId: companyData.clientId.trim(),
        address: companyData.address.trim(),
        type: companyData.type,
        accountManager: companyData.accountManager.trim(),
        employees: parseInt(companyData.employees) || 0,
        status: companyData.status,
        payrollDueDate: companyData.payrollDueDate || null,
        nextCheckDate: companyData.nextCheckDate || null
      };

      const response = await axios.post(`${BASE_URL}/api/companies`, apiData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success || response.status === 200 || response.status === 201) {
        await fetchCompanies();
        setShowAddCompanyModal(false);
        resetAddCompanyForm();
        
        showNotification('Company added successfully');
      }
    } catch (error) {
      console.error('Error adding company:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to add company';
      
      showNotification(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [validateCompanyForm, fetchCompanies, resetAddCompanyForm, showNotification]);

  const updateCompany = useCallback(async (companyData) => {
    if (!validateCompanyForm(companyData)) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication token not found');
    }

    try {
      setIsLoading(true);
      const apiData = {
        name: companyData.name.trim(),
        clientId: companyData.clientId.trim(),
        address: companyData.address.trim(),
        type: companyData.type,
        accountManager: companyData.accountManager.trim(),
        employees: parseInt(companyData.employees) || 0,
        status: companyData.status,
        payrollDueDate: companyData.payrollDueDate || null,
        nextCheckDate: companyData.nextCheckDate || null
      };

      const response = await axios.put(`${BASE_URL}/api/companies/${selectedCompany.id}`, apiData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success || response.status === 200) {
        await fetchCompanies();
        setShowEditCompanyModal(false);
        setSelectedCompany(null);
        
        showNotification('Company updated successfully');
      }
    } catch (error) {
      console.error('Error updating company:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update company';
      
      showNotification(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [validateCompanyForm, selectedCompany, fetchCompanies, showNotification]);

  const handleLogoUpload = useCallback(async (file, companyId) => {
    if (!companyId || companyId === 'new') {
      showNotification('Please save the company first before uploading a logo');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication token not found');
    }

    try {
      setLogoUploading(true);

      const formData = new FormData();
      formData.append('logo', file);

      showNotification('Uploading Logo...');

      const response = await axios.post(
        `${BASE_URL}/api/companies/${companyId}/upload-logo`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
          timeout: 30000
        }
      );

      if (response.data.success) {
        await fetchCompanies();
        showNotification('Logo uploaded successfully');
      }
    } catch (error) {
      console.error('Logo upload error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to upload logo';
      showNotification(errorMessage);
    } finally {
      setLogoUploading(false);
    }
  }, [fetchCompanies, showNotification]);

  // Logo remove handler
  const handleLogoRemove = useCallback(async (companyId) => {
    if (!companyId) return;

    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication token not found');
    }

    try {
      showNotification('Removing Logo...');

      const response = await axios.delete(
        `${BASE_URL}/api/companies/${companyId}/logo`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        await fetchCompanies();
        showNotification('Logo removed successfully');
      }
    } catch (error) {
      console.error('Logo remove error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to remove logo';
      showNotification(errorMessage);
    }
  }, [fetchCompanies, showNotification]);

  // Update company status
  const updateCompanyStatus = useCallback(async (company, newStatus) => {
    const action = newStatus === 'Active' ? 'activate' : 'deactivate';
    const confirmMessage = newStatus === 'Active' 
      ? `Are you sure you want to activate ${company.name}?`
      : `Are you sure you want to deactivate ${company.name}?`;

    // For now, we'll proceed without confirmation. You can add a custom confirmation modal later.
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      showNotification(`${newStatus === 'Active' ? 'Activating...' : 'Deactivating...'}`);

      const response = await axios.patch(`${BASE_URL}/api/companies/${company.id}/status`, {
        status: newStatus
      }, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      if (response.data.success || response.status === 200) {
        await fetchCompanies();
        showNotification(`${company.name} has been ${action}d successfully.`);
      } else {
        throw new Error(response.data.message || 'Unexpected response format');
      }
      
    } catch (error) {
      console.error('Error updating company status:', error);
      let errorMessage = 'An unexpected error occurred';
      
      if (error.response) {
        errorMessage = error.response.data?.message || 
                      error.response.data?.error || 
                      `Server error: ${error.response.status}`;
      } else if (error.request) {
        errorMessage = 'Network error - please check your connection';
      } else {
        errorMessage = error.message || 'Failed to update company status';
      }
      
      showNotification(errorMessage);
    }
    
    setShowActionsMenu(null);
  }, [fetchCompanies, showNotification]);

  // Action handlers
  const viewCompanyDetails = useCallback((company) => {
    setSelectedCompany(company);
    setShowCompanyDetailsModal(true);
    setShowActionsMenu(null);
  }, []);

  // Export Company Data
  const exportCompanyData = useCallback(async (company) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      showNotification('Exporting...');

      const response = await axios.get(`${BASE_URL}/api/companies/${company.id}/export`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        responseType: 'blob',
        params: { format: 'csv' }
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${company.name}_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      showNotification(`Data for ${company.name} has been exported successfully`);
      
    } catch (error) {
      console.error('Export failed:', error);
      showNotification('Failed to export company data');
    }
    
    setShowActionsMenu(null);
  }, [showNotification]);

  // Send Payroll Reminder
  const sendPayrollReminder = useCallback(async (company) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      showNotification('Sending Reminder...');

      const response = await axios.post(`${BASE_URL}/api/companies/${company.id}/send-reminder`, {
        message: `Payroll reminder for ${company.name}`,
        type: 'payroll',
        recipient: company.accountManager
      }, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success || response.status === 200) {
        showNotification(`Payroll reminder sent successfully for ${company.name}`);
      }
      
    } catch (error) {
      console.error('Error sending reminder:', error);
      showNotification('Failed to send payroll reminder');
    }
    
    setShowActionsMenu(null);
  }, [showNotification]);

  // Delete Company Function
  const deleteCompany = useCallback(async (company) => {
    // For now, we'll proceed without confirmation. You can add a custom confirmation modal later.
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      showNotification('Deleting...');

      const response = await axios.delete(`${BASE_URL}/api/companies/${company.id}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success || response.status === 200) {
        await fetchCompanies();
        showNotification(`${company.name} has been deleted successfully.`);
      }
      
    } catch (error) {
      console.error('Error deleting company:', error);
      showNotification('Failed to delete company');
    }
    
    setShowActionsMenu(null);
  }, [fetchCompanies, showNotification]);

  // Update stats from local data
  const updateStats = (companiesData) => {
    if (!Array.isArray(companiesData)) return;
    
    const totalEmployees = companiesData.reduce((sum, company) => sum + (company.employees || 0), 0);
    const payrollDueSoon = companiesData.filter(company => {
      const daysUntilDue = company.daysUntilPayrollDue;
      return daysUntilDue !== null && daysUntilDue <= 7 && daysUntilDue >= 0;
    }).length;

    setStats({
      total: companiesData.length,
      active: companiesData.filter(c => c.status === 'Active').length,
      pending: companiesData.filter(c => c.status === 'Pending').length,
      assignedToMe: companiesData.filter(c => c.accountManager === 'You').length,
      payrollDueSoon,
      totalEmployees
    });
  };

  // Initial data fetch
  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  // Apply filters effect
  useEffect(() => {
    if (!Array.isArray(companies)) {
      setFilteredCompanies([]);
      return;
    }

    let result = [...companies];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(company => {
        const searchableContent = [
          company.name || '',
          company.clientId || '',
          company.address || '',
          company.type || '',
          company.accountManager || '',
          company.status || ''
        ].join(' ').toLowerCase();
        
        return searchableContent.includes(term);
      });
    }
    
    if (filterStatus !== 'all') {
      result = result.filter(company => company.status === filterStatus);
    }
    
    if (filterType !== 'all') {
      result = result.filter(company => company.type === filterType);
    }
    
    setFilteredCompanies(result);
  }, [searchTerm, filterStatus, filterType, companies]);

  // Event handlers
  const handleCompanyClick = useCallback((company) => {
    navigate('/manager-timesheet', { state: { company } });
  }, [navigate]);

  const handleActionClick = useCallback((e, companyId) => {
    e.stopPropagation();
    setShowActionsMenu(prev => prev === companyId ? null : companyId);
  }, []);

  const handleActionSelect = useCallback(async (action, company) => {
    switch (action) {
      case 'View Details':
        viewCompanyDetails(company);
        break;
      case 'Edit Company':
        handleEditCompany(company);
        break;
      case 'Export Data':
        await exportCompanyData(company);
        break;
      case 'Send Reminder':
        await sendPayrollReminder(company);
        break;
      case 'Activate':
        await updateCompanyStatus(company, 'Active');
        break;
      case 'Deactivate':
        await updateCompanyStatus(company, 'Inactive');
        break;
      case 'Delete Company':
        await deleteCompany(company);
        break;
      default:
        console.warn('Unknown action:', action);
        setShowActionsMenu(null);
        break;
    }
  }, [viewCompanyDetails, handleEditCompany, exportCompanyData, sendPayrollReminder, updateCompanyStatus, deleteCompany]);

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return 'Not set';
    }
  };

  // FIXED: Get days until due with color coding - handles null/undefined properly
  const getDaysUntilDueDisplay = (days) => {
    if (days === null || days === undefined) return { text: 'Not set', className: 'not-set' };
    if (days < 0) return { text: `${Math.abs(days)} days overdue`, className: 'overdue' };
    if (days === 0) return { text: 'Due today', className: 'due-today' };
    if (days <= 3) return { text: `${days} days`, className: 'due-soon' };
    if (days <= 7) return { text: `${days} days`, className: 'due-week' };
    return { text: `${days} days`, className: '' };
  };

  // Component sections
  const HeaderSection = () => (
    <div className="cv2-header">
      <div className="cv2-header-content">
        <div className="cv2-header-title-area">
          <h1><Building className="icon" /> Companies</h1>
          <p>Manage your company accounts and payroll information</p>
        </div>
        <button className="cv2-btn cv2-btn-primary" onClick={handleAddCompany}>
          <Plus className="icon" />
          Add Company
        </button>
      </div>
    </div>
  );

  const StatsOverview = () => (
    <div className="cv2-stats-grid">
      <div className="cv2-stat-card total">
        <div className="cv2-stat-icon-wrapper total">
          <Building size={24} />
        </div>
        <div className="cv2-stat-info">
          <span className="cv2-stat-value">{stats.total}</span>
          <span className="cv2-stat-label">Total Companies</span>
        </div>
      </div>
      <div className="cv2-stat-card active">
        <div className="cv2-stat-icon-wrapper active">
          <CheckCircle size={24} />
        </div>
        <div className="cv2-stat-info">
          <span className="cv2-stat-value">{stats.active}</span>
          <span className="cv2-stat-label">Active</span>
        </div>
      </div>
      <div className="cv2-stat-card due">
        <div className="cv2-stat-icon-wrapper due">
          <AlertCircle size={24} />
        </div>
        <div className="cv2-stat-info">
          <span className="cv2-stat-value">{stats.payrollDueSoon}</span>
          <span className="cv2-stat-label">Payroll Due Soon</span>
        </div>
      </div>
      <div className="cv2-stat-card employees">
        <div className="cv2-stat-icon-wrapper employees">
          <Users size={24} />
        </div>
        <div className="cv2-stat-info">
          <span className="cv2-stat-value">{stats.totalEmployees}</span>
          <span className="cv2-stat-label">Total Employees</span>
        </div>
      </div>
    </div>
  );

  const SearchAndFilterSection = () => (
    <div className="cv2-controls-wrapper">
      <div className="cv2-search-box">
        <Search className="cv2-search-icon" size={20} />
        <input
          type="text"
          placeholder="Search companies by name, ID, or type..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="cv2-search-input"
        />
      </div>
      
      <div className="cv2-filters-group">
        <div className="cv2-filter-select-wrapper">
          <Filter className="cv2-filter-icon" size={18} />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="cv2-filter-select"
          >
            {COMPANY_STATUS_OPTIONS.map(status => (
              <option key={status} value={status}>
                {status === 'all' ? 'All Status' : status}
              </option>
            ))}
          </select>
        </div>

        <div className="cv2-filter-select-wrapper">
          <Briefcase className="cv2-filter-icon" size={18} />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="cv2-filter-select"
          >
            {COMPANY_TYPE_OPTIONS.map(type => (
              <option key={type} value={type}>
                {type === 'all' ? 'All Types' : type}
              </option>
            ))}
          </select>
        </div>
        
        <button className="cv2-btn cv2-btn-secondary" onClick={() => {
          setSearchTerm('');
          setFilterStatus('all');
          setFilterType('all');
        }}>
          Reset Filters
        </button>
      </div>
    </div>
  );

const CompanyCard = ({ company }) => {
  const payrollDueDisplay = getDaysUntilDueDisplay(company.daysUntilPayrollDue);
  const companyActions = getCompanyActions(company);
  
  const getLogoUrl = () => {
    const hasLogo = company?.Logo || 
                    (company?.logoPath && company.logoPath !== null) || 
                    (company?.hasLogo === true);
    
    if (hasLogo && company?.id) {
      const timestamp = new Date().getTime();
      return `${BASE_URL}/api/companies/${company.id}/logo?t=${timestamp}`;
    }
    return null;
  };

  const logoUrl = getLogoUrl();
  const [logoError, setLogoError] = React.useState(false);
  const [logoLoaded, setLogoLoaded] = React.useState(false);
  
  return (
    <div
      className="cv2-card cv2-fade-in"
      onClick={() => handleCompanyClick(company)}
    >
      <div className="cv2-card-header">
        <div className="cv2-card-main">
          {/* <div className="cv2-card-logo-box">
            {logoUrl && !logoError ? (
              <>
                <img 
                  src={logoUrl} 
                  alt={company.name}
                  className="cv2-card-logo-img"
                  crossOrigin="anonymous"
                  style={{ display: logoLoaded ? 'block' : 'none' }}
                  onError={() => setLogoError(true)}
                  onLoad={() => setLogoLoaded(true)}
                />
                {!logoLoaded && <Building size={24} style={{ opacity: 0.3 }} />}
              </>
            ) : (
              <Building size={24} style={{ opacity: 0.3 }} />
            )}
          </div> */}

          <div className="cv2-card-info">
            <h3 className="cv2-card-name">{company.name}</h3>
            <span className="cv2-card-id">Client ID: {company.clientId}</span>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className={`cv2-badge ${company.status.toLowerCase()}`}>
            <CheckCircle size={12} />
            {company.status}
          </span>
          
          <div className="cv2-actions-menu">
            <button 
              className="cv2-more-btn" 
              onClick={(e) => handleActionClick(e, company.id)}
              type="button"
            >
              <MoreVertical size={18} />
            </button>
            
            {showActionsMenu === company.id && (
              <div className="cv2-actions-dropdown" onClick={(e) => e.stopPropagation()}>
                {companyActions.map(action => (
                  <div 
                    key={action} 
                    className={`cv2-action-item ${action === 'Delete Company' ? 'delete' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleActionSelect(action, company);
                    }}
                  >
                    {action === 'View Details' && <Eye size={16} />}
                    {action === 'Edit Company' && <Edit size={16} />}
                    {action === 'Export Data' && <Download size={16} />}
                    {action === 'Send Reminder' && <Mail size={16} />}
                    {(action === 'Activate' || action === 'Deactivate') && <CheckCircle size={16} />}
                    {action === 'Delete Company' && <Trash2 size={16} />}
                    <span>{action}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="cv2-card-body">
        <div className="cv2-info-row">
          <MapPin size={16} />
          <span>{company.address}</span>
        </div>
        
        <div className="cv2-info-grid">
          <div className="cv2-grid-item">
            <span className="label">Payroll due</span>
            <span className={`value cv2-payroll-status ${payrollDueDisplay.className}`}>
              {payrollDueDisplay.text}
            </span>
          </div>
          
          <div className="cv2-grid-item">
            <span className="label">Next check</span>
            <span className="value">{formatDate(company.nextCheckDate)}</span>
          </div>
          
          <div className="cv2-grid-item">
            <span className="label">Employees</span>
            <span className="value">{company.employees}</span>
          </div>
          
          <div className="cv2-grid-item">
            <span className="label">Manager</span>
            <span className="value">{company.accountManager || 'None'}</span>
          </div>
        </div>
      </div>

      <div className="cv2-card-footer">
        <span className="cv2-card-type">{company.type}</span>
        <span className="cv2-card-date">
          Updated {formatDate(company.updatedAt)}
        </span>
      </div>
    </div>
  );
};

  const CompaniesGrid = () => (
    <div className="cv2-companies-grid">
      {filteredCompanies.map((company) => (
        <CompanyCard key={company.id} company={company} />
      ))}
    </div>
  );

  const EmptyState = () => (
    <div className="cv2-empty-container">
      <div className="cv2-empty-icon">
        <Building size={32} />
      </div>
      <h3>No companies found</h3>
      <p>Try adjusting your search or filters to find what you're looking for.</p>
      <button className="cv2-btn cv2-btn-primary" onClick={handleAddCompany}>
        <Plus size={18} />
        Add New Company
      </button>
    </div>
  );

  // Main render
  return (
    <div className="cv2-container" onClick={() => {
      if (!showAddCompanyModal && !showEditCompanyModal && !showCompanyDetailsModal) {
        setShowActionsMenu(null);
      }
    }}>
      <HeaderSection />
      <StatsOverview />
      <SearchAndFilterSection />
      
      {loading ? (
        <div className="cv2-loading-overlay">
          <div className="cv2-loading-spinner"></div>
          <p style={{ marginTop: '1rem', color: '#64748b' }}>Loading companies...</p>
        </div>
      ) : filteredCompanies.length > 0 ? (
        <CompaniesGrid />
      ) : (
        <EmptyState />
      )}
      
     {showAddCompanyModal && (
        <AddCompanyModal
          isOpen={showAddCompanyModal}
          onClose={() => {
            setShowAddCompanyModal(false);
            resetAddCompanyForm();
          }}
          onSubmit={addCompany}
          formData={addCompanyForm}
          onFormChange={handleAddCompanyFormChange}
          errors={errors}
          isLoading={isLoading}
          onLogoUpload={handleLogoUpload}
          logoUploading={logoUploading}
          showNotification={showNotification} // Pass showNotification
        />
      )}

      
      {showEditCompanyModal && (
  <EditCompanyModal
    isOpen={showEditCompanyModal}
    onClose={() => {
      setShowEditCompanyModal(false);
      setSelectedCompany(null);
      resetEditCompanyForm();
    }}
    onSubmit={updateCompany}
    formData={editCompanyForm}
    onFormChange={handleEditCompanyFormChange}
    errors={errors}
    isLoading={isLoading}
    company={selectedCompany}
    onLogoUpload={handleLogoUpload}
    onLogoRemove={handleLogoRemove}
    logoUploading={logoUploading}
    showNotification={showNotification} // Pass showNotification
  />
)}
      <CompanyDetailsModal
        isOpen={showCompanyDetailsModal}
        onClose={() => {
          setShowCompanyDetailsModal(false);
          setSelectedCompany(null);
        }}
        company={selectedCompany}
        onActionSelect={handleActionSelect}
      />

      {/* Notification Component */}
      {notification && (
        <SuccessNotification 
          message={notification} 
          onClose={() => setNotification(null)} 
        />
      )}
    </div>
  );
};

export default CompaniesView;