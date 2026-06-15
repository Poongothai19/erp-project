import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Save, UserCheck, Lock, Eye, EyeOff } from 'lucide-react';
import BASE_URL from "../../url";
import ModalOverlay from './ModalOverlay';
import ModalHeader from './ModalHeader';
import FormFieldGroup from './FormFieldGroup';
import InputField from './InputField';
import SelectField from './SelectField';
import DepartmentField from './DepartmentField';
import PositionField from './PositionField';
import GeoLocationSelector from './GeoLocationSelector';
import { 
  EMPLOYEE_FORM_INITIAL_STATE, 
  DEPARTMENTS, 
  POSITIONS, 
  EMPLOYMENT_TYPES, 
  EMPLOYEE_STATUSES,
  PROJECTS,
  CLIENTS,
  COUNTRY_CODES
} from './MTS_Constants';

const EmployeeModal = React.memo(({ 
  isOpen, 
  mode,
  employeeData,
  onClose,
  selectedCompany
}) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ ...EMPLOYEE_FORM_INITIAL_STATE });
  const [dbEmployeeId, setDbEmployeeId] = useState(null); // numeric DB primary key for the PUT URL
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [allEmployees, setAllEmployees] = useState([]);
  const [useMailingAddress, setUseMailingAddress] = useState(false);

  const isAddMode = mode === 'add';
  const title = isAddMode ? 'Add New Employee' : 'Edit Employee';
  const saveText = isAddMode ? 'Add Employee' : 'Save Changes';

  useEffect(() => {
    const fetchAllEmployees = async () => {
      if (isOpen && selectedCompany?.id) {
        try {
          const token = localStorage.getItem('token');
          const response = await axios.get(`${BASE_URL}/api/employees/company/${selectedCompany.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.data.success) {
            setAllEmployees(response.data.data);
          }
        } catch (error) {
          console.error('Error fetching employees:', error);
        }
      }
    };
    fetchAllEmployees();
  }, [isOpen, selectedCompany]);

  useEffect(() => {
    if (isOpen) {
      if (employeeData && mode === 'edit') {
        const parsePhone = (phoneStr) => {
          if (!phoneStr) return { code: '+1', number: '' };
          // Match +XXX Number format
          const match = String(phoneStr).match(/^(\+\d+)\s(.*)$/);
          if (match) return { code: match[1], number: match[2] };
          return { code: '+1', number: phoneStr };
        };

        const phoneInfo = parsePhone(employeeData.Phone || employeeData.phone);
        const emergencyPhoneInfo = parsePhone(employeeData.EmergencyContactPhone || employeeData.emergencyContactPhone);

        const formattedData = {
          name: employeeData.Name || employeeData.name || '',
          email: employeeData.Email || employeeData.email || '',
          phone: phoneInfo.number,
          phoneCountryCode: phoneInfo.code,
          department: employeeData.Department || employeeData.department || '',
          position: employeeData.Position || employeeData.position || '',
          employmentType: employeeData.EmploymentType || employeeData.employmentType || 'Full-time',
          status: employeeData.Status || employeeData.status || 'Active',
          employeeId: employeeData.EmployeeCode || employeeData.employeeCode || employeeData.EmployeeId || employeeData.employeeId || '',
          hireDate: employeeData.HireDate ? new Date(employeeData.HireDate).toISOString().split('T')[0] : '',
          streetAddress: employeeData.StreetAddress || employeeData.streetAddress || '',
          apartmentSuite: employeeData.ApartmentSuite || employeeData.apartmentSuite || '',
          city: employeeData.City || employeeData.city || '',
          state: employeeData.State || employeeData.state || '',
          zipCode: employeeData.ZipCode || employeeData.zipCode || '',
          visaStatus: employeeData.VisaStatus || employeeData.visaStatus || 'US Citizen',
          visaNumber: employeeData.VisaNumber || employeeData.visaNumber || employeeData.AuthorizationNumber || '',
          visaIssueDate: employeeData.VisaIssueDate ? new Date(employeeData.VisaIssueDate).toISOString().split('T')[0] : (employeeData.IssueDate ? new Date(employeeData.IssueDate).toISOString().split('T')[0] : ''),
          visaExpiryDate: employeeData.VisaExpiryDate ? new Date(employeeData.VisaExpiryDate).toISOString().split('T')[0] : (employeeData.ExpiryDate ? new Date(employeeData.ExpiryDate).toISOString().split('T')[0] : ''),
          cityId: employeeData.cityId || '',
          stateId: employeeData.stateId || '',
          countryId: employeeData.countryId || '',
          projectName: employeeData.ProjectName || employeeData.projectName || '',
          clientName: employeeData.ClientName || employeeData.clientName || '',
          projectStatus: employeeData.ProjectStatus || employeeData.projectStatus || 'Active',
          projectStartDate: employeeData.ProjectStartDate ? new Date(employeeData.ProjectStartDate).toISOString().split('T')[0] : '',
          projectEndDate: employeeData.ProjectEndDate ? new Date(employeeData.ProjectEndDate).toISOString().split('T')[0] : '',
          billRate: employeeData.BillRate || employeeData.billRate || '',
          retirement401kEnrolled: employeeData.Retirement401kEnrolled || employeeData.retirement401kEnrolled || false,
          retirement401kPercentage: employeeData.Retirement401kPercentage || employeeData.retirement401kPercentage || '',
          medicalInsuranceEnrolled: employeeData.MedicalInsuranceEnrolled || employeeData.medicalInsuranceEnrolled || false,
          medicalInsurancePlan: employeeData.MedicalInsurancePlan || employeeData.medicalInsurancePlan || '',
          medicalInsuranceEffectiveDate: employeeData.MedicalInsuranceEffectiveDate ? new Date(employeeData.MedicalInsuranceEffectiveDate).toISOString().split('T')[0] : '',
          supervisorEmployeeId: employeeData.SupervisorEmployeeId || '',
          backupSupervisorEmployeeId: employeeData.BackupSupervisorEmployeeId || '',
          timesheetRequired: employeeData.TimesheetRequired !== undefined ? !!employeeData.TimesheetRequired : true,
          emergencyContactName: employeeData.EmergencyContactName || '',
          emergencyContactPhone: emergencyPhoneInfo.number,
          emergencyPhoneCountryCode: emergencyPhoneInfo.code,
          mailingStreetAddress: employeeData.MailingStreetAddress || '',
          mailingApartmentSuite: employeeData.MailingApartmentSuite || '',
          mailingCityId: employeeData.mailingCityId || '',
          mailingStateId: employeeData.mailingStateId || '',
          mailingCountryId: employeeData.mailingCountryId || '',
          mailingZipCode: employeeData.MailingZipCode || '',
          timePunchEnabled: !!employeeData.TimePunchEnabled,
          username: '',
          password: '',
          createAccount: false
        };
        setFormData(formattedData);
        setUseMailingAddress(!!employeeData.MailingAddressId);
        // Store the numeric DB primary key separately — needed for the PUT URL
        setDbEmployeeId(employeeData.EmployeeId || null);
      } else if (mode === 'add') {
        setFormData({ 
          ...EMPLOYEE_FORM_INITIAL_STATE,
          employeeId: formData.employeeId || ''
        });
        setUseMailingAddress(false);
      }
      setErrors({});
      setCurrentStep(1);
    }
  }, [employeeData, mode, isOpen, formData.employeeId, selectedCompany]);

  const handleUpdateField = useCallback((field, value) => {
    let finalValue = value;
    if (field === 'phone' || field === 'emergencyContactPhone') {
      finalValue = String(value).replace(/\D/g, '').slice(0, 10);
    }
    setFormData(prev => ({ ...prev, [field]: finalValue }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  }, [errors]);

  const validateStep = useCallback((step) => {
    const newErrors = {};
    switch (step) {
      case 1:
        if (!formData.name.trim()) newErrors.name = 'Full name is required';
        if (!formData.email.trim()) {
          newErrors.email = 'Email address is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          newErrors.email = 'Please enter a valid email address';
        }
        if (!formData.phone.trim()) {
          newErrors.phone = 'Phone number is required';
        } else if (formData.phone.length !== 10) {
          newErrors.phone = 'Phone number must be exactly 10 digits';
        }
        if (!formData.employeeId.trim()) newErrors.employeeId = 'Employee ID is required';
        break;
      case 2:
        if (formData.createAccount) {
          if (!formData.username.trim()) newErrors.username = 'Username is required';
          else if (formData.username.trim().length < 3) newErrors.username = 'Username must be at least 3 characters';
          if (!formData.password.trim()) newErrors.password = 'Password is required';
          else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
        }
        break;
      default:
        break;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const nextStep = useCallback(() => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  }, [currentStep, validateStep]);

  const prevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  }, []);

  const handleSave = useCallback(async () => {
    if (isLoading) return;
    if (!validateStep(3)) return;

    setIsLoading(true);
    try {
      const dataToSend = {
        name: formData.name,
        email: formData.email,
        phone: `${formData.phoneCountryCode} ${formData.phone}`.trim(),
        department: formData.department,
        position: formData.position,
        employmentType: formData.employmentType,
        status: formData.status,
        hireDate: formData.hireDate,
        employeeId: formData.employeeId,
        streetAddress: formData.streetAddress,
        apartmentSuite: formData.apartmentSuite,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        cityId: formData.cityId,
        stateId: formData.stateId,
        countryId: formData.countryId,
        visaStatus: formData.visaStatus || 'US Citizen',
        visaNumber: formData.visaNumber || null,
        visaIssueDate: formData.visaIssueDate || null,
        visaExpiryDate: formData.visaExpiryDate || null,
        projectName: formData.projectName || null,
        clientName: formData.clientName || null,
        projectStatus: formData.projectStatus || 'Active',
        projectStartDate: formData.projectStartDate || null,
        projectEndDate: formData.projectEndDate || null,
        billRate: formData.billRate ? parseFloat(formData.billRate) : null,
        retirement401kEnrolled: formData.retirement401kEnrolled || false,
        retirement401kPercentage: formData.retirement401kPercentage ? parseFloat(formData.retirement401kPercentage) : null,
        medicalInsuranceEnrolled: formData.medicalInsuranceEnrolled || false,
        medicalInsurancePlan: formData.medicalInsurancePlan || null,
        medicalInsuranceEffectiveDate: formData.medicalInsuranceEffectiveDate || null,
        createAccount: formData.createAccount,
        username: formData.createAccount ? formData.username : undefined,
        password: formData.createAccount ? formData.password : undefined,
        supervisorEmployeeId: formData.supervisorEmployeeId || null,
        backupSupervisorEmployeeId: formData.backupSupervisorEmployeeId || null,
        timesheetRequired: formData.timesheetRequired,
        emergencyContactName: formData.emergencyContactName || null,
        emergencyContactPhone: formData.emergencyContactPhone ? `${formData.emergencyPhoneCountryCode} ${formData.emergencyContactPhone}`.trim() : null,
        mailingStreetAddress: useMailingAddress ? (formData.mailingStreetAddress || null) : null,
        mailingApartmentSuite: useMailingAddress ? (formData.mailingApartmentSuite || null) : null,
        mailingCityId: useMailingAddress ? (formData.mailingCityId || null) : null,
        mailingZipCode: useMailingAddress ? (formData.mailingZipCode || null) : null,
        timePunchEnabled: formData.timePunchEnabled
      };

      const token = localStorage.getItem('token');
      const companyId = selectedCompany?.id;

      if (!companyId) throw new Error('No company selected');

      let response;
      if (mode === 'add') {
        response = await axios.post(`${BASE_URL}/api/employees/company/${companyId}`, dataToSend, {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
      } else {
        const editId = dbEmployeeId || employeeData?.EmployeeId;
        response = await axios.put(`${BASE_URL}/api/employees/company/${companyId}/${editId}`, dataToSend, {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
      }

      if (!response.data || !response.data.success) {
        throw new Error(response.data?.message || 'Failed to save employee');
      }

      await Swal.fire({
        title: 'Success!',
        text: mode === 'add' ? 'Employee added successfully' : 'Employee updated successfully',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });

      onClose();
      if (mode === 'add') setFormData({ ...EMPLOYEE_FORM_INITIAL_STATE });

    } catch (error) {
      console.error('❌ Error saving employee:', error.message);
      let errorTitle = 'Error';
      let errorMessage = error.response?.data?.message || error.message;
      
      if (error.response?.status === 401) {
        errorTitle = 'Session Expired';
        setTimeout(() => navigate('/login'), 1500);
      }

      await Swal.fire({ title: errorTitle, text: errorMessage, icon: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [validateStep, formData, mode, onClose, selectedCompany, isLoading, navigate]);

  const isStepValid = useMemo(() => {
    switch (currentStep) {
      case 1:
        return !!(formData.name.trim() && formData.email.trim() && 
               formData.phone.trim() && formData.employeeId.trim());
      case 2:
        let isValid = true;
        if (formData.createAccount) isValid = !!(formData.username.trim() && formData.password.trim());
        return isValid;
      case 3:
        return true;
      default:
        return false;
    }
  }, [currentStep, formData]);

  const generateRandomId = useCallback(() => {
    let prefix = 'EMP';
    const companyName = selectedCompany?.name || '';
    
    if (companyName.includes('Prophecy Consulting INC')) {
      prefix = 'PC';
    } else if (companyName.includes('Prophecy Offshore')) {
      prefix = 'PT';
    } else if (companyName.includes('Cognifyar Technologies')) {
      prefix = 'CT';
    }
    
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}${randomNum}`;
  }, [selectedCompany]);

  useEffect(() => {
    if (isAddMode && isOpen && !formData.employeeId && currentStep === 1) {
      handleUpdateField('employeeId', generateRandomId());
    }
  }, [isAddMode, formData.employeeId, generateRandomId, currentStep, handleUpdateField, isOpen]);

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="mts-emp-form-grid">
            <div className="mts-emp-form-row">
              <FormFieldGroup label="Employee Code" required error={errors.employeeId}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <InputField
                    value={formData.employeeId}
                    onChange={(e) => handleUpdateField('employeeId', e.target.value)}
                    placeholder="Enter employee code"
                    disabled={!isAddMode}
                    style={{ flex: 1 }}
                  />
                  {isAddMode && (
                    <button type="button" onClick={() => handleUpdateField('employeeId', generateRandomId())} className="mts-generate-id-btn">
                      Generate Code
                    </button>
                  )}
                </div>
              </FormFieldGroup>
              <FormFieldGroup label="Full Name" required error={errors.name}>
                <InputField value={formData.name} onChange={(e) => handleUpdateField('name', e.target.value)} placeholder="Enter full name" />
              </FormFieldGroup>
            </div>
            <div className="mts-emp-form-row">
              <FormFieldGroup label="Email Address" required error={errors.email}>
                <InputField type="email" value={formData.email} onChange={(e) => handleUpdateField('email', e.target.value)} placeholder="Enter email address" />
              </FormFieldGroup>
              <FormFieldGroup label="Phone Number" required error={errors.phone}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <select 
                    style={{ 
                      width: '85px', 
                      flexShrink: 0, 
                      padding: '0.75rem 0.5rem', 
                      borderRadius: '0.5rem', 
                      border: '1px solid #d1d5db',
                      backgroundColor: '#ffffff',
                      fontSize: '0.875rem',
                      fontFamily: 'inherit',
                      color: '#374151',
                      height: '42px',
                      cursor: 'pointer'
                    }}
                    value={formData.phoneCountryCode} 
                    onChange={(e) => handleUpdateField('phoneCountryCode', e.target.value)}
                  >
                    {COUNTRY_CODES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                  </select>
                  <InputField 
                    type="tel" 
                    value={formData.phone} 
                    onChange={(e) => handleUpdateField('phone', e.target.value)} 
                    placeholder="Enter phone number" 
                    style={{ flex: 1 }}
                  />
                </div>
              </FormFieldGroup>
            </div>

            <div className="mts-emp-form-row">
              <PositionField value={formData.position} onChange={(val) => handleUpdateField('position', val)} error={errors.position} positions={POSITIONS} />
              <FormFieldGroup label="Status" error={errors.status}>
                <SelectField value={formData.status} onChange={(e) => handleUpdateField('status', e.target.value)} options={EMPLOYEE_STATUSES} />
              </FormFieldGroup>
            </div>

            <div className="mts-emp-form-row">
              <FormFieldGroup label="Employment Type" error={errors.employmentType}>
                <SelectField value={formData.employmentType} onChange={(e) => handleUpdateField('employmentType', e.target.value)} options={EMPLOYMENT_TYPES} />
              </FormFieldGroup>
              <FormFieldGroup label="Hire Date" error={errors.hireDate}>
                <InputField type="date" value={formData.hireDate} onChange={(e) => handleUpdateField('hireDate', e.target.value)} />
              </FormFieldGroup>
            </div>

            <div className="mts-emp-form-row">
              <FormFieldGroup label="Supervisor" error={errors.supervisorEmployeeId}>
                <select 
                  className="mts-emp-select"
                  value={formData.supervisorEmployeeId} 
                  onChange={(e) => handleUpdateField('supervisorEmployeeId', e.target.value)}
                >
                  <option value="">Select Supervisor</option>
                  {allEmployees.map(emp => (
                    <option key={emp.Id} value={emp.Id}>{emp.Name} ({emp.EmployeeCode})</option>
                  ))}
                </select>
              </FormFieldGroup>
              <FormFieldGroup label="Backup Supervisor" error={errors.backupSupervisorEmployeeId}>
                <select 
                  className="mts-emp-select"
                  value={formData.backupSupervisorEmployeeId} 
                  onChange={(e) => handleUpdateField('backupSupervisorEmployeeId', e.target.value)}
                >
                  <option value="">Select Backup Supervisor</option>
                  {allEmployees.map(emp => (
                    <option key={emp.Id} value={emp.Id}>{emp.Name} ({emp.EmployeeCode})</option>
                  ))}
                </select>
              </FormFieldGroup>
            </div>

            <div className="mts-emp-field-full">
              <FormFieldGroup label="Timesheet Settings">
                <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
                  <div className="mts-emp-checkbox-group" style={{ flex: 1 }}>
                    <input 
                      type="checkbox" 
                      id="timesheetRequired" 
                      checked={formData.timesheetRequired} 
                      onChange={(e) => handleUpdateField('timesheetRequired', e.target.checked)} 
                    />
                    <label htmlFor="timesheetRequired">Timesheet Required</label>
                  </div>
                  <div className="mts-emp-checkbox-group" style={{ flex: 1 }}>
                    <input 
                      type="checkbox" 
                      id="timePunchEnabled" 
                      checked={formData.timePunchEnabled} 
                      onChange={(e) => handleUpdateField('timePunchEnabled', e.target.checked)} 
                    />
                    <label htmlFor="timePunchEnabled">Time Punch (Internal)</label>
                  </div>
                </div>
              </FormFieldGroup>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="mts-emp-form-grid">
            <h4 className="mts-emp-section-title">Home Address</h4>
            <div className="mts-emp-form-row">
              <FormFieldGroup label="Street Address" error={errors.streetAddress}>
                <InputField value={formData.streetAddress} onChange={(e) => handleUpdateField('streetAddress', e.target.value)} placeholder="Enter street address" />
              </FormFieldGroup>
              <FormFieldGroup label="Apartment, Suite, Unit" error={errors.apartmentSuite}>
                <InputField value={formData.apartmentSuite} onChange={(e) => handleUpdateField('apartmentSuite', e.target.value)} placeholder="Enter apartment/suite details" />
              </FormFieldGroup>
            </div>
            <div className="mts-emp-form-row">
              <GeoLocationSelector
                countryValue={formData.countryId}
                stateValue={formData.stateId}
                cityValue={formData.cityId}
                onCountryChange={(val) => handleUpdateField('countryId', val)}
                onStateChange={(val) => handleUpdateField('stateId', val)}
                onCityChange={(val) => handleUpdateField('cityId', val)}
                errors={errors}
              />
              <FormFieldGroup label="Zip Code" error={errors.zipCode}>
                <InputField value={formData.zipCode} onChange={(e) => handleUpdateField('zipCode', e.target.value)} placeholder="Enter zip code" />
              </FormFieldGroup>
            </div>

            <div className="mts-emp-form-row">
              <div className="mts-emp-checkbox-group">
                 <input 
                   type="checkbox" 
                   id="useMailingAddress" 
                   checked={useMailingAddress} 
                   onChange={(e) => setUseMailingAddress(e.target.checked)} 
                 />
                 <label htmlFor="useMailingAddress">Use a different Mailing Address</label>
              </div>
            </div>

            {useMailingAddress && (
              <>
                <h4 className="mts-emp-section-title">Mailing Address</h4>
                <div className="mts-emp-form-row">
                  <FormFieldGroup label="Street Address">
                    <InputField value={formData.mailingStreetAddress} onChange={(e) => handleUpdateField('mailingStreetAddress', e.target.value)} placeholder="Enter mailing street address" />
                  </FormFieldGroup>
                  <FormFieldGroup label="Apartment, Suite, Unit">
                    <InputField value={formData.mailingApartmentSuite} onChange={(e) => handleUpdateField('mailingApartmentSuite', e.target.value)} placeholder="Enter mailing apartment/suite" />
                  </FormFieldGroup>
                </div>
                <div className="mts-emp-form-row">
                  <GeoLocationSelector
                    countryValue={formData.mailingCountryId}
                    stateValue={formData.mailingStateId}
                    cityValue={formData.mailingCityId}
                    onCountryChange={(val) => handleUpdateField('mailingCountryId', val)}
                    onStateChange={(val) => handleUpdateField('mailingStateId', val)}
                    onCityChange={(val) => handleUpdateField('mailingCityId', val)}
                  />
                  <FormFieldGroup label="Zip Code">
                    <InputField value={formData.mailingZipCode} onChange={(e) => handleUpdateField('mailingZipCode', e.target.value)} placeholder="Enter mailing zip code" />
                  </FormFieldGroup>
                </div>
              </>
            )}
            <h4 className="mts-emp-section-title">Authentication</h4>
            <div className="mts-emp-form-row">
              <div className="mts-emp-checkbox-group">
                 <input type="checkbox" id="createAccount" checked={formData.createAccount} onChange={(e) => handleUpdateField('createAccount', e.target.checked)} />
                 <label htmlFor="createAccount"><UserCheck size={20} /> Create Login Account for Employee</label>
              </div>
            </div>
            {formData.createAccount && (
              <div className="mts-emp-auth-fields">
                <div className="mts-emp-auth-header"><Lock size={16} /> Login Credentials</div>
                <div className="mts-emp-form-row">
                  <FormFieldGroup label="Username" required error={errors.username}>
                    <InputField value={formData.username} onChange={(e) => handleUpdateField('username', e.target.value)} placeholder="Enter username" />
                  </FormFieldGroup>
                  <FormFieldGroup label="Password" required error={errors.password}>
                    <div className="mts-password-input">
                      <InputField type={showPassword ? "text" : "password"} value={formData.password} onChange={(e) => handleUpdateField('password', e.target.value)} placeholder="Enter password" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <Eye size={16} /> : <EyeOff size={16} />}</button>
                    </div>
                  </FormFieldGroup>
                </div>
              </div>
            )}
          </div>
        );
      case 3:
        return (
          <div className="mts-emp-form-grid">
            <h4 className="mts-emp-section-title">Visa & Work Authorization</h4>
            <div className="mts-emp-form-row">
              <FormFieldGroup label="Visa Status">
                <SelectField value={formData.visaStatus} onChange={(e) => handleUpdateField('visaStatus', e.target.value)} options={['US Citizen', 'Green Card', 'H1B', 'L1', 'O1', 'E2', 'TN', 'Other']} />
              </FormFieldGroup>
              <FormFieldGroup label="Visa Number">
                <InputField type="text" value={formData.visaNumber} onChange={(e) => handleUpdateField('visaNumber', e.target.value)} placeholder="e.g. WAC21000..." />
              </FormFieldGroup>
            </div>
            <div className="mts-emp-form-row">
              <FormFieldGroup label="Visa Issue Date">
                <InputField type="date" value={formData.visaIssueDate} onChange={(e) => handleUpdateField('visaIssueDate', e.target.value)} />
              </FormFieldGroup>
              <FormFieldGroup label="Visa Expiry Date">
                <InputField type="date" value={formData.visaExpiryDate} onChange={(e) => handleUpdateField('visaExpiryDate', e.target.value)} />
              </FormFieldGroup>
            </div>
            <h4 className="mts-emp-section-title">Project Details</h4>
            <div className="mts-emp-form-row">
              <FormFieldGroup label="Client Name">
                <InputField 
                  value={formData.clientName} 
                  onChange={(e) => handleUpdateField('clientName', e.target.value)} 
                  placeholder="Enter or select client" 
                  list="client-list"
                />
                <datalist id="client-list">
                  {CLIENTS.map(client => <option key={client} value={client} />)}
                </datalist>
              </FormFieldGroup>
              <FormFieldGroup label="Project Name">
                <InputField 
                  value={formData.projectName} 
                  onChange={(e) => handleUpdateField('projectName', e.target.value)} 
                  placeholder="Enter or select project" 
                  list="project-list"
                />
                <datalist id="project-list">
                  {PROJECTS.map(proj => <option key={proj} value={proj} />)}
                </datalist>
              </FormFieldGroup>
            </div>
            <div className="mts-emp-form-row">
              <FormFieldGroup label="Project Status">
                <SelectField value={formData.projectStatus} onChange={(e) => handleUpdateField('projectStatus', e.target.value)} options={['Active', 'On Hold', 'Completed', 'Archived']} />
              </FormFieldGroup>
              <FormFieldGroup label="Bill Rate ($/hr)">
                <InputField type="number" step="0.01" value={formData.billRate} onChange={(e) => handleUpdateField('billRate', e.target.value)} />
              </FormFieldGroup>
            </div>
            <div className="mts-emp-form-row">
              <FormFieldGroup label="Project Start Date">
                <InputField type="date" value={formData.projectStartDate} onChange={(e) => handleUpdateField('projectStartDate', e.target.value)} />
              </FormFieldGroup>
              <FormFieldGroup label="Project End Date">
                <InputField type="date" value={formData.projectEndDate} onChange={(e) => handleUpdateField('projectEndDate', e.target.value)} />
              </FormFieldGroup>
            </div>
            <h4 className="mts-emp-section-title">Benefits Enrollment</h4>
            <div className="mts-emp-form-row">
              <div className="mts-emp-checkbox-group">
                 <input type="checkbox" id="retirement401k" checked={formData.retirement401kEnrolled} onChange={(e) => handleUpdateField('retirement401kEnrolled', e.target.checked)} />
                 <label htmlFor="retirement401k">401(k) Retirement Plan Enrolled</label>
              </div>
              <div className="mts-emp-checkbox-group">
                 <input type="checkbox" id="medicalInsurance" checked={formData.medicalInsuranceEnrolled} onChange={(e) => handleUpdateField('medicalInsuranceEnrolled', e.target.checked)} />
                 <label htmlFor="medicalInsurance">Medical Insurance Enrolled</label>
              </div>
            </div>
            
            {(formData.retirement401kEnrolled || formData.medicalInsuranceEnrolled) && (
              <div className="mts-emp-form-row">
                {formData.retirement401kEnrolled ? (
                  <FormFieldGroup label="401(k) Percentage">
                    <InputField type="number" step="0.1" value={formData.retirement401kPercentage} onChange={(e) => handleUpdateField('retirement401kPercentage', e.target.value)} />
                  </FormFieldGroup>
                ) : <div />}
                {formData.medicalInsuranceEnrolled ? (
                  <FormFieldGroup label="Medical Plan">
                    <SelectField value={formData.medicalInsurancePlan} onChange={(e) => handleUpdateField('medicalInsurancePlan', e.target.value)} options={['Basic', 'Standard', 'Premium', 'HMO', 'PPO']} />
                  </FormFieldGroup>
                ) : <div />}
              </div>
            )}
            
            {formData.medicalInsuranceEnrolled && (
              <div className="mts-emp-form-row">
                <FormFieldGroup label="Insurance Effective Date">
                  <InputField type="date" value={formData.medicalInsuranceEffectiveDate} onChange={(e) => handleUpdateField('medicalInsuranceEffectiveDate', e.target.value)} />
                </FormFieldGroup>
                <div />
              </div>
            )}

            <h4 className="mts-emp-section-title">Emergency Contact</h4>
            <div className="mts-emp-form-row">
              <FormFieldGroup label="Contact Name">
                <InputField 
                  value={formData.emergencyContactName} 
                  onChange={(e) => handleUpdateField('emergencyContactName', e.target.value)} 
                  placeholder="Enter emergency contact name" 
                />
              </FormFieldGroup>
              <FormFieldGroup label="Contact Phone">
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <select 
                    style={{ 
                      width: '85px', 
                      flexShrink: 0, 
                      padding: '0.75rem 0.5rem', 
                      borderRadius: '0.5rem', 
                      border: '1px solid #d1d5db',
                      backgroundColor: '#ffffff',
                      fontSize: '0.875rem',
                      fontFamily: 'inherit',
                      color: '#374151',
                      height: '42px',
                      cursor: 'pointer'
                    }}
                    value={formData.emergencyPhoneCountryCode} 
                    onChange={(e) => handleUpdateField('emergencyPhoneCountryCode', e.target.value)}
                  >
                    {COUNTRY_CODES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                  </select>
                  <InputField 
                    value={formData.emergencyContactPhone} 
                    onChange={(e) => handleUpdateField('emergencyContactPhone', e.target.value)} 
                    placeholder="Enter emergency contact phone" 
                    style={{ flex: 1 }}
                  />
                </div>
              </FormFieldGroup>
            </div>
          </div>
        );
      default: return null;
    }
  };

  const StepIndicator = () => (
    <div className="mts-step-indicator">
      <div className="mts-step-line" />
      {[1, 2, 3].map((step) => (
        <div key={step} className={`mts-step-item ${currentStep >= step ? 'active' : ''}`}>
          <div className="mts-step-number">{currentStep > step ? '✓' : step}</div>
          <span className="mts-step-label">
            {step === 1 && 'Basic Info'}
            {step === 2 && 'Address & Auth'}
            {step === 3 && 'Visa & Benefits'}
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <ModalOverlay isOpen={isOpen} onClose={onClose} closeOnOutsideClick={false} closeOnEscape={false}>
      <div className="mts-emp-modal-content" style={{ maxWidth: '900px' }}>
        <ModalHeader title={title} onClose={onClose} />
        <StepIndicator />
        <div className="mts-emp-modal-body">{renderStepContent()}</div>
        <div className="mts-emp-modal-actions">
          {currentStep > 1 && <button onClick={prevStep} className="mts-emp-modal-btn mts-emp-modal-btn-cancel" disabled={isLoading}>Previous</button>}
          {currentStep < 3 ? (
            <button onClick={nextStep} className="mts-emp-modal-btn mts-emp-modal-btn-save" disabled={!isStepValid || isLoading}>Next</button>
          ) : (
            <button onClick={handleSave} className="mts-emp-modal-btn mts-emp-modal-btn-save" disabled={!isStepValid || isLoading}>
              {isLoading ? <><div className="mts-loading" /> Saving...</> : <><Save size={16} /> {saveText}</>}
            </button>
          )}
        </div>
      </div>
    </ModalOverlay>
  );
});

EmployeeModal.displayName = 'EmployeeModal';

export default EmployeeModal;
