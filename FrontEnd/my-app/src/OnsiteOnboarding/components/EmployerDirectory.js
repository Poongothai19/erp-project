import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase,
  Plus,
  Eye,
  Edit3,
  Trash2,
  X,
  Save,
  ChevronLeft,
  Users,
  AlertCircle,
  CheckCircle,
  Clock,
  Key
} from 'lucide-react';
import axios from 'axios';
import BASE_URL from "../../url";
import Swal from 'sweetalert2';
import '../styles/EmployerPage.css';

// ✅ Employer Modal Component
const EmployerModal = React.memo(({ 
  isOpen, 
  mode,
  employerData,
  onClose,
  onSave
}) => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    companyName: '',
    feinId: '',
    companyAddress: '',
    signingAuthorityName: '',
    signingAuthorityDesignation: '',
    emailId: '',
    contactNo: '',
    username: '',
    password: '',
    confirmPassword: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isAddMode = mode === 'add';
  const title = isAddMode ? 'Add New Employer' : 'Edit Employer';
  const saveText = isAddMode ? 'Create Employer' : 'Save Changes';

  useEffect(() => {
    if (isOpen) {
      if (employerData && mode === 'edit') {
        setFormData({
          companyName: employerData.companyName || '',
          feinId: employerData.feinId || '',
          companyAddress: employerData.companyAddress || '',
          signingAuthorityName: employerData.signingAuthorityName || '',
          signingAuthorityDesignation: employerData.signingAuthorityDesignation || '',
          emailId: employerData.emailId || '',
          contactNo: employerData.contactNo || '',
          username: '',
          password: '',
          confirmPassword: ''
        });
      } else if (mode === 'add') {
        setFormData({
          companyName: '',
          feinId: '',
          companyAddress: '',
          signingAuthorityName: '',
          signingAuthorityDesignation: '',
          emailId: '',
          contactNo: '',
          username: '',
          password: '',
          confirmPassword: ''
        });
      }
      setErrors({});
    }
  }, [employerData, mode, isOpen]);

  const handleUpdateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Company Name
    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }

    // FEIN ID
    if (!formData.feinId.trim()) {
      newErrors.feinId = 'FEIN ID is required';
    } else if (!/^\d{2}-\d{7}$/.test(formData.feinId.trim())) {
      newErrors.feinId = 'FEIN ID must be in format: 12-3456789';
    }

    // Company Address
    if (!formData.companyAddress.trim()) {
      newErrors.companyAddress = 'Company address is required';
    }

    // Signing Authority Name
    if (!formData.signingAuthorityName.trim()) {
      newErrors.signingAuthorityName = 'Signing authority name is required';
    }

    // Signing Authority Designation
    if (!formData.signingAuthorityDesignation.trim()) {
      newErrors.signingAuthorityDesignation = 'Designation is required';
    }

    // Email ID
    if (!formData.emailId.trim()) {
      newErrors.emailId = 'Email ID is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emailId)) {
      newErrors.emailId = 'Please enter a valid email address';
    }

    // Contact No
    if (!formData.contactNo.trim()) {
      newErrors.contactNo = 'Contact number is required';
    } else if (!/^[\d\s\+\-\(\)]{10,}$/.test(formData.contactNo)) {
      newErrors.contactNo = 'Please enter a valid contact number';
    }

    // For add mode, validate username and password
    if (isAddMode) {
      if (!formData.username.trim()) {
        newErrors.username = 'Username is required for login';
      } else if (formData.username.trim().length < 3) {
        newErrors.username = 'Username must be at least 3 characters';
      }

      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');

      const dataToSend = {
        companyName: formData.companyName.trim(),
        feinId: formData.feinId.trim(),
        companyAddress: formData.companyAddress.trim(),
        signingAuthorityName: formData.signingAuthorityName.trim(),
        signingAuthorityDesignation: formData.signingAuthorityDesignation.trim(),
        emailId: formData.emailId.trim().toLowerCase(),
        contactNo: formData.contactNo.trim()
      };

      if (isAddMode) {
        dataToSend.username = formData.username.trim();
        dataToSend.password = formData.password;
      }

      console.log('📤 Sending employer data:', {
        ...dataToSend,
        password: dataToSend.password ? '***' : undefined
      });

      let response;
      let result;

      if (mode === 'add') {
        response = await axios.post(
          `${BASE_URL}/api/onboarding-employers`,
          dataToSend,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        result = response.data;
      } else if (mode === 'edit') {
        response = await axios.put(
          `${BASE_URL}/api/onboarding-employers/${employerData.id}`,
          dataToSend,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        result = response.data;
      }

      console.log('✅ Save response:', result);

      if (!result || !result.success) {
        throw new Error(result?.message || 'Failed to save employer');
      }

      // Show credentials in success message for add mode
      if (mode === 'add' && result.credentials) {
        Swal.fire({
          title: '✅ Employer Created Successfully!',
          html: `
            <div style="text-align: left; background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 10px 0;">
              <p style="color: #166534; font-weight: bold; margin-bottom: 10px;">Login Credentials:</p>
              <p><strong>Username:</strong> <span style="background: white; padding: 5px 10px; border-radius: 4px; font-family: monospace;">${result.credentials.username}</span></p>
              <p><strong>Password:</strong> <span style="background: white; padding: 5px 10px; border-radius: 4px; font-family: monospace;">${result.credentials.password}</span></p>
            </div>
            <p style="color: #666;">Login credentials have been sent to ${formData.emailId}</p>
          `,
          icon: 'success',
          confirmButtonColor: '#10b981',
          confirmButtonText: 'OK'
        });
      } else {
        Swal.fire({
          title: 'Success!',
          text: mode === 'add' 
            ? 'Employer added successfully.' 
            : 'Employer updated successfully',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      }

      onClose();
      onSave();

    } catch (error) {
      console.error('❌ Save error:', error);
      
      let errorMessage = error.message;
      
      if (error.response?.status === 409) {
        errorMessage = error.response.data.message || 'Username, email, or FEIN ID already exists';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 401) {
        errorMessage = 'Your session has expired. Please login again.';
        localStorage.removeItem('token');
        setTimeout(() => navigate('/login'), 1500);
      }

      Swal.fire({
        title: 'Error',
        text: errorMessage,
        icon: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000
        }}
        onClick={onClose}
      />
      
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          zIndex: 1001,
          maxWidth: '700px',
          width: '90%',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        <div style={{ padding: '24px', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>{title}</h2>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#6b7280',
                padding: '8px',
                borderRadius: '6px'
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div style={{ padding: '24px' }}>
          {/* Company Information Section */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building size={18} color="#019d88" />
              Company Information
            </h3>
            
            <div className="employer-form-grid">
              <div className="employer-form-group">
                <label>Company Name <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => handleUpdateField('companyName', e.target.value)}
                  placeholder="e.g., TCS, Accenture (client company name)"
                />
                {errors.companyName && <div className="employer-error-text">{errors.companyName}</div>}
              </div>

              <div className="employer-form-group">
                <label>FEIN ID <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="text"
                  value={formData.feinId}
                  onChange={(e) => handleUpdateField('feinId', e.target.value)}
                  placeholder="12-3456789"
                />
                {errors.feinId && <div className="employer-error-text">{errors.feinId}</div>}
              </div>

              <div className="employer-form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Company Address <span style={{ color: '#ef4444' }}>*</span></label>
                <textarea
                  value={formData.companyAddress}
                  onChange={(e) => handleUpdateField('companyAddress', e.target.value)}
                  placeholder="Enter complete company address"
                  rows="3"
                />
                {errors.companyAddress && <div className="employer-error-text">{errors.companyAddress}</div>}
              </div>
            </div>
          </div>

          {/* Signing Authority Section */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={18} color="#019d88" />
              Employer Contact Person
            </h3>
            
            <div className="employer-form-grid">
              <div className="employer-form-group">
                <label>Employer's Full Name <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="text"
                  value={formData.signingAuthorityName}
                  onChange={(e) => handleUpdateField('signingAuthorityName', e.target.value)}
                  placeholder="e.g., Kishore (the person who will log in)"
                />
                {errors.signingAuthorityName && <div className="employer-error-text">{errors.signingAuthorityName}</div>}
              </div>

              <div className="employer-form-group">
                <label>Designation <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="text"
                  value={formData.signingAuthorityDesignation}
                  onChange={(e) => handleUpdateField('signingAuthorityDesignation', e.target.value)}
                  placeholder="e.g., CEO, HR Manager"
                />
                {errors.signingAuthorityDesignation && <div className="employer-error-text">{errors.signingAuthorityDesignation}</div>}
              </div>
            </div>
          </div>

          {/* Contact Information Section */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Mail size={18} color="#019d88" />
              Contact Information
            </h3>
            
            <div className="employer-form-grid">
              <div className="employer-form-group">
                <label>Email ID <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="email"
                  value={formData.emailId}
                  onChange={(e) => handleUpdateField('emailId', e.target.value)}
                  placeholder="email@company.com"
                />
                {errors.emailId && <div className="employer-error-text">{errors.emailId}</div>}
              </div>

              <div className="employer-form-group">
                <label>Contact No <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="tel"
                  value={formData.contactNo}
                  onChange={(e) => handleUpdateField('contactNo', e.target.value)}
                  placeholder="+1 234 567 8900"
                />
                {errors.contactNo && <div className="employer-error-text">{errors.contactNo}</div>}
              </div>
            </div>
          </div>

          {/* Login Credentials Section (only for add mode) */}
          {isAddMode && (
            <div style={{ marginBottom: '24px', backgroundColor: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', padding: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#166534', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Key size={18} color="#166534" />
                Login Credentials (will be sent via email)
              </h3>
              
              <div className="employer-form-grid">
                <div className="employer-form-group">
                  <label>Username <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => handleUpdateField('username', e.target.value)}
                    placeholder="Enter username"
                  />
                  {errors.username && <div className="employer-error-text">{errors.username}</div>}
                </div>

                <div className="employer-form-group">
                  <label>Password <span style={{ color: '#ef4444' }}>*</span></label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => handleUpdateField('password', e.target.value)}
                      placeholder="Enter password (min 6 chars)"
                      style={{ paddingRight: '60px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#6b7280',
                        fontSize: '12px'
                      }}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  {errors.password && <div className="employer-error-text">{errors.password}</div>}
                </div>

                <div className="employer-form-group">
                  <label>Confirm Password <span style={{ color: '#ef4444' }}>*</span></label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => handleUpdateField('confirmPassword', e.target.value)}
                      placeholder="Confirm password"
                      style={{ paddingRight: '60px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#6b7280',
                        fontSize: '12px'
                      }}
                    >
                      {showConfirmPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  {errors.confirmPassword && <div className="employer-error-text">{errors.confirmPassword}</div>}
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: '24px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={handleSave}
            disabled={isLoading}
            style={{
              padding: '10px 20px',
              backgroundColor: isLoading ? '#d1d5db' : '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {isLoading ? 'Saving...' : (
              <>
                <Save size={16} />
                {saveText}
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
});

EmployerModal.displayName = 'EmployerModal';

// ✅ Employer Details Modal
const EmployerDetailsModal = React.memo(({ 
  isOpen, 
  employer,
  onClose
}) => {
  if (!isOpen || !employer) return null;

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000
        }}
        onClick={onClose}
      />
      
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          zIndex: 1001,
          width: '95%',
          maxWidth: '600px',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        {/* Header */}
        <div style={{ padding: '24px', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>
                {employer.companyName}
              </h2>
              <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '14px' }}>
                Employer Details
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#6b7280',
                padding: '8px',
                borderRadius: '6px'
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building size={18} color="#019d88" />
              Company Information
            </h3>
            
            <div className="employer-detail-grid">
              <div className="employer-detail-item">
                <span className="employer-detail-label">Company Name:</span>
                <span className="employer-detail-value">{employer.companyName}</span>
              </div>
              
              <div className="employer-detail-item">
                <span className="employer-detail-label">FEIN ID:</span>
                <span className="employer-detail-value">{employer.feinId}</span>
              </div>
              
              <div className="employer-detail-item" style={{ gridColumn: '1 / -1' }}>
                <span className="employer-detail-label">Address:</span>
                <span className="employer-detail-value">{employer.companyAddress}</span>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={18} color="#019d88" />
              Signing Authority
            </h3>
            
            <div className="employer-detail-grid">
              <div className="employer-detail-item">
                <span className="employer-detail-label">Name:</span>
                <span className="employer-detail-value">{employer.signingAuthorityName}</span>
              </div>
              
              <div className="employer-detail-item">
                <span className="employer-detail-label">Designation:</span>
                <span className="employer-detail-value">{employer.signingAuthorityDesignation}</span>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Mail size={18} color="#019d88" />
              Contact Information
            </h3>
            
            <div className="employer-detail-grid">
              <div className="employer-detail-item">
                <span className="employer-detail-label">Email:</span>
                <span className="employer-detail-value">{employer.emailId}</span>
              </div>
              
              <div className="employer-detail-item">
                <span className="employer-detail-label">Contact No:</span>
                <span className="employer-detail-value">{employer.contactNo}</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
            <div className="employer-detail-item">
              <span className="employer-detail-label">Created:</span>
              <span className="employer-detail-value">{new Date(employer.createdAt).toLocaleString()}</span>
            </div>
            <div className="employer-detail-item">
              <span className="employer-detail-label">Last Updated:</span>
              <span className="employer-detail-value">{new Date(employer.updatedAt).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
});

EmployerDetailsModal.displayName = 'EmployerDetailsModal';

// ✅ Main EmployerDirectory Component
const EmployerDirectory = () => {
  const navigate = useNavigate();

  const [employers, setEmployers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalState, setModalState] = useState({
    isOpen: false,
    mode: null,
    employerData: null
  });
  const [detailsModal, setDetailsModal] = useState({
    isOpen: false,
    employer: null
  });
  const [stats, setStats] = useState({
    total: 0,
    newLastMonth: 0,
    newLastQuarter: 0
  });

  // Fetch employers
  const fetchEmployers = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(
        `${BASE_URL}/api/onboarding-employers`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      );

      let employersData = [];
      if (response.data.success && response.data.data) {
        employersData = response.data.data;
      } else if (Array.isArray(response.data)) {
        employersData = response.data;
      }

      const processedEmployers = employersData.map(emp => ({
        id: emp.id,
        companyName: emp.companyName,
        feinId: emp.feinId,
        companyAddress: emp.companyAddress,
        signingAuthorityName: emp.signingAuthorityName,
        signingAuthorityDesignation: emp.signingAuthorityDesignation,
        emailId: emp.emailId,
        contactNo: emp.contactNo,
        userId: emp.userId,
        createdAt: emp.createdAt,
        updatedAt: emp.updatedAt
      }));

      setEmployers(processedEmployers);
      updateStats(processedEmployers);

    } catch (error) {
      console.error("Fetch employers error:", error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        setError('Session Expired - Please login again');
        navigate('/login');
      } else {
        setError('Failed to load employers. Please try again.');
      }
      setEmployers([]);
    } finally {
      setLoading(false);
    }
  };

  // Update stats
  const updateStats = (employersData) => {
    if (!Array.isArray(employersData)) return;

    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const newLastMonth = employersData.filter(e => new Date(e.createdAt) >= oneMonthAgo).length;
    const newLastQuarter = employersData.filter(e => new Date(e.createdAt) >= threeMonthsAgo).length;

    setStats({
      total: employersData.length,
      newLastMonth,
      newLastQuarter
    });
  };

  useEffect(() => {
    fetchEmployers();
  }, []);

  // Filter employers
  const filteredEmployers = employers.filter(emp => {
    const searchLower = searchTerm.toLowerCase();
    return (
      emp.companyName.toLowerCase().includes(searchLower) ||
      emp.feinId.toLowerCase().includes(searchLower) ||
      emp.signingAuthorityName.toLowerCase().includes(searchLower) ||
      emp.emailId.toLowerCase().includes(searchLower)
    );
  });

  // Modal handlers
  const openAddEmployerModal = () => {
    setModalState({
      isOpen: true,
      mode: 'add',
      employerData: null
    });
  };

  const openEditEmployerModal = (employer) => {
    setModalState({
      isOpen: true,
      mode: 'edit',
      employerData: employer
    });
  };

  const closeModal = () => {
    setModalState({
      isOpen: false,
      mode: null,
      employerData: null
    });
  };

  const openDetailsModal = (employer) => {
    setDetailsModal({
      isOpen: true,
      employer: employer
    });
  };

  const closeDetailsModal = () => {
    setDetailsModal({
      isOpen: false,
      employer: null
    });
  };

  const handleRefresh = () => {
    fetchEmployers();
  };

  const handleDeleteEmployer = async (employerId) => {
    const confirm = await Swal.fire({
      title: 'Delete Employer?',
      text: 'Are you sure you want to delete this employer? This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    });

    if (confirm.isConfirmed) {
      try {
        const token = localStorage.getItem('token');
        const employer = employers.find(emp => emp.id === employerId);
        
        const response = await axios.delete(
          `${BASE_URL}/api/onboarding-employers/${employerId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.data.success) {
          setEmployers(prev => prev.filter(emp => emp.id !== employerId));
          setStats(prev => ({
            ...prev,
            total: prev.total - 1
          }));
          
          Swal.fire({
            title: 'Deleted!',
            text: 'Employer has been deleted successfully.',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          });
        }
      } catch (error) {
        console.error('Error deleting employer:', error);
        Swal.fire({
          title: 'Delete Failed',
          text: error.response?.data?.message || 'Failed to delete employer',
          icon: 'error'
        });
      }
    }
  };

  const handleRetry = () => {
    fetchEmployers();
  };

  return (
    <div className="employer-page-container">
      {/* Header */}
      <div className="employer-header">
        <button 
          className="employer-back-button"
          onClick={() => navigate('/onboarding-company')}
        >
          <ChevronLeft size={20} />
          Back to Companies
        </button>
        <div className="employer-header-content">
          <h1 className="employer-title">
            <Building size={24} />
            Employer Directory
          </h1>
          <p className="employer-subtitle">
            Manage employer companies and signing authorities
          </p>
        </div>
      </div>

      {/* Stats Section */}
      <div className="employer-stats-grid">
        <div className="employer-stat-card">
          <Building size={24} />
          <div className="employer-stat-content">
            <span className="employer-stat-value">{stats.total}</span>
            <span className="employer-stat-label">Total Employers</span>
          </div>
        </div>
        
        <div className="employer-stat-card">
          <Clock size={24} />
          <div className="employer-stat-content">
            <span className="employer-stat-value">{stats.newLastMonth}</span>
            <span className="employer-stat-label">New (Last 30 Days)</span>
          </div>
        </div>
        
        <div className="employer-stat-card">
          <Users size={24} />
          <div className="employer-stat-content">
            <span className="employer-stat-value">{stats.newLastQuarter}</span>
            <span className="employer-stat-label">New (Last 90 Days)</span>
          </div>
        </div>
      </div>

      {/* Search and Add Bar */}
      <div className="employer-controls">
        <div className="employer-search-container">
          <input
            type="text"
            placeholder="Search by company name, FEIN, signing authority, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="employer-search-input"
          />
        </div>
        
        <div className="employer-controls-right">
          <button 
            className="employer-add-btn"
            onClick={openAddEmployerModal}
          >
            <Plus size={18} />
            Add Employer
          </button>
        </div>
      </div>

      {/* Table View */}
      <div className="employer-table-container">
        {loading ? (
          <div className="employer-loading">
            <div className="loading-spinner"></div>
            <p>Loading employers...</p>
          </div>
        ) : error ? (
          <div className="employer-error">
            <AlertCircle size={48} />
            <h3>Error Loading Employers</h3>
            <p>{error}</p>
            <button onClick={handleRetry} className="employer-retry-btn">
              Retry
            </button>
          </div>
        ) : filteredEmployers.length > 0 ? (
          <>
            {/* Table Header */}
            <div className="employer-table-header">
              <div>COMPANY</div>
              <div>FEIN ID</div>
              <div>SIGNING AUTHORITY</div>
              <div>DESIGNATION</div>
              <div>CONTACT</div>
              <div>ACTIONS</div>
            </div>

            {/* Table Rows */}
            <div>
              {filteredEmployers.map(employer => (
                <div key={employer.id} className="employer-table-row">
                  {/* Company Column */}
                  <div>
                    <div className="employer-company-name">
                      {employer.companyName}
                    </div>
                    <div className="employer-company-address">
                      <MapPin size={12} />
                      {employer.companyAddress.length > 50 
                        ? employer.companyAddress.substring(0, 50) + '...' 
                        : employer.companyAddress}
                    </div>
                  </div>

                  {/* FEIN ID Column */}
                  <div>
                    <div className="employer-fein-id">
                      {employer.feinId}
                    </div>
                  </div>

                  {/* Signing Authority Column */}
                  <div>
                    <div className="employer-signing-name">
                      {employer.signingAuthorityName}
                    </div>
                  </div>

                  {/* Designation Column */}
                  <div>
                    <div className="employer-designation">
                      {employer.signingAuthorityDesignation}
                    </div>
                  </div>

                  {/* Contact Column */}
                  <div>
                    <div className="employer-contact">
                      <Mail size={12} />
                      {employer.emailId}
                    </div>
                    <div className="employer-contact">
                      <Phone size={12} />
                      {employer.contactNo}
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="employer-actions">
                    <button 
                      onClick={() => openDetailsModal(employer)}
                      className="employer-action-btn employer-view-btn"
                      title="View Details"
                    >
                      <Eye size={16} />
                    </button>
                    
                    <button 
                      onClick={() => openEditEmployerModal(employer)}
                      className="employer-action-btn employer-edit-btn"
                      title="Edit"
                    >
                      <Edit3 size={16} />
                    </button>
                    
                    <button 
                      onClick={() => handleDeleteEmployer(employer.id)}
                      className="employer-action-btn employer-delete-btn"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="employer-empty">
            <Building size={48} />
            <h3>No Employers Found</h3>
            <p>
              {searchTerm 
                ? 'No employers match your search criteria.' 
                : 'Click "Add Employer" to create your first employer.'}
            </p>
            {!searchTerm && (
              <button onClick={openAddEmployerModal} className="employer-add-btn">
                <Plus size={18} />
                Add Employer
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <EmployerModal
        isOpen={modalState.isOpen}
        mode={modalState.mode}
        employerData={modalState.employerData}
        onClose={closeModal}
        onSave={handleRefresh}
      />

      <EmployerDetailsModal
        isOpen={detailsModal.isOpen}
        employer={detailsModal.employer}
        onClose={closeDetailsModal}
      />
    </div>
  );
};

export default EmployerDirectory;