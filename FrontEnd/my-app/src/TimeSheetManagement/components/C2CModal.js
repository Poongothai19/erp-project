import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Save, Eye, EyeOff } from 'lucide-react';
import Swal from 'sweetalert2';
import ModalOverlay from './ModalOverlay';
import ModalHeader from './ModalHeader';
import FormFieldGroup from './FormFieldGroup';
import InputField from './InputField';
import SelectField from './SelectField';
import CountryStateField from './CountryStateField';
import { C2C_FORM_INITIAL_STATE, PAYMENT_MODES } from './MTS_Constants';

const C2CModal = React.memo(({ 
  isOpen, 
  mode,
  c2cData,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState({ ...C2C_FORM_INITIAL_STATE });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // HR Team Contacts
  const [hrContacts, setHrContacts] = useState([
    { id: 1, name: '', email: '', phone: '' }
  ]);

  // Onboarding & Complaints Contacts
  const [onboardingContacts, setOnboardingContacts] = useState([
    { id: 1, name: '', email: '', phone: '', onboardingProcess: '', complaintsProcess: '' }
  ]);

  // Accounts Contacts
  const [accountsContacts, setAccountsContacts] = useState([
    { id: 1, name: '', email: '', phone: '', paymentTerms: '', bankDetails: '' }
  ]);

  const isAddMode = mode === 'add';
  const title = isAddMode ? 'Add New C2C Contractor' : 'Edit C2C Contractor';
  const saveText = isAddMode ? 'Add Contractor' : 'Save Changes';

  useEffect(() => {
    if (c2cData) {
      console.log('📥 Loading C2C Data:', JSON.stringify(c2cData, null, 2));
      
      setFormData({ 
        ...C2C_FORM_INITIAL_STATE,
        ...c2cData,
        // Format dates for input[type="date"]
        poStartDate: c2cData.poStartDate ? new Date(c2cData.poStartDate).toISOString().split('T')[0] : '',
        poEndDate: c2cData.poEndDate ? new Date(c2cData.poEndDate).toISOString().split('T')[0] : '',
        hireDate: c2cData.hireDate ? new Date(c2cData.hireDate).toISOString().split('T')[0] : ''
      });
      
      // ✅ Load department contacts if they exist
      if (c2cData.hrContacts && Array.isArray(c2cData.hrContacts) && c2cData.hrContacts.length > 0) {
        setHrContacts(c2cData.hrContacts);
      } else {
        setHrContacts([{ id: 1, name: '', email: '', phone: '' }]);
      }

      if (c2cData.onboardingContacts && Array.isArray(c2cData.onboardingContacts) && c2cData.onboardingContacts.length > 0) {
        setOnboardingContacts(c2cData.onboardingContacts);
      } else {
        setOnboardingContacts([{ 
          id: 1, 
          name: '', 
          email: '', 
          phone: '', 
          onboardingProcess: '', 
          complaintsProcess: '' 
        }]);
      }

      if (c2cData.accountsContacts && Array.isArray(c2cData.accountsContacts) && c2cData.accountsContacts.length > 0) {
        setAccountsContacts(c2cData.accountsContacts);
      } else {
        setAccountsContacts([{ 
          id: 1, 
          name: '', 
          email: '', 
          phone: '', 
          paymentTerms: '', 
          bankDetails: '' 
        }]);
      }

    } else if (isAddMode) {
      setFormData({ ...C2C_FORM_INITIAL_STATE });
      setHrContacts([{ id: 1, name: '', email: '', phone: '' }]);
      setOnboardingContacts([{ 
        id: 1, 
        name: '', 
        email: '', 
        phone: '', 
        onboardingProcess: '', 
        complaintsProcess: '' 
      }]);
      setAccountsContacts([{ 
        id: 1, 
        name: '', 
        email: '', 
        phone: '', 
        paymentTerms: '', 
        bankDetails: '' 
      }]);
    }
    
    setErrors({});
    setCurrentStep(1);
  }, [c2cData, isAddMode, isOpen]);

  const handleUpdateField = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  }, [errors]);

  // HR Team Functions
  const handleAddHrContact = () => {
    setHrContacts(prev => [...prev, { id: Date.now(), name: '', email: '', phone: '' }]);
  };

  const handleRemoveHrContact = (id) => {
    setHrContacts(prev => prev.filter(contact => contact.id !== id));
  };

  const handleHrContactChange = (id, field, value) => {
    setHrContacts(prev => prev.map(contact =>
      contact.id === id ? { ...contact, [field]: value } : contact
    ));
  };

  // Onboarding & Complaints Functions
  const handleAddOnboardingContact = () => {
    setOnboardingContacts(prev => [...prev, { 
      id: Date.now(), 
      name: '', 
      email: '', 
      phone: '', 
      onboardingProcess: '', 
      complaintsProcess: '' 
    }]);
  };

  const handleRemoveOnboardingContact = (id) => {
    setOnboardingContacts(prev => prev.filter(contact => contact.id !== id));
  };

  const handleOnboardingContactChange = (id, field, value) => {
    setOnboardingContacts(prev => prev.map(contact =>
      contact.id === id ? { ...contact, [field]: value } : contact
    ));
  };

  // Accounts Functions
  const handleAddAccountsContact = () => {
    setAccountsContacts(prev => [...prev, { 
      id: Date.now(), 
      name: '', 
      email: '', 
      phone: '', 
      paymentTerms: '', 
      bankDetails: '' 
    }]);
  };

  const handleRemoveAccountsContact = (id) => {
    setAccountsContacts(prev => prev.filter(contact => contact.id !== id));
  };

  const handleAccountsContactChange = (id, field, value) => {
    setAccountsContacts(prev => prev.map(contact =>
      contact.id === id ? { ...contact, [field]: value } : contact
    ));
  };

  const validateStep = useCallback((step) => {
    const newErrors = {};
    
    switch (step) {
      case 1:
        if (!formData.contractorName.trim()) {
          newErrors.contractorName = 'Contractor name is required';
        }
        if (!formData.companyName.trim()) {
          newErrors.companyName = 'Company name is required';
        }
        if (!formData.email.trim()) {
          newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          newErrors.email = 'Please enter a valid email address';
        }
        if (!formData.phone.trim()) {
          newErrors.phone = 'Phone number is required';
        }
        if (!formData.jobTitle.trim()) {
          newErrors.jobTitle = 'Job title is required';
        }
        break;
        
      case 2:
        if (!formData.streetAddress.trim()) {
          newErrors.streetAddress = 'Street address is required';
        }
        if (!formData.city.trim()) {
          newErrors.city = 'City is required';
        }
        if (!formData.state.trim()) {
          newErrors.state = 'State is required';
        }
        if (!formData.zipCode.trim()) {
          newErrors.zipCode = 'Zip code is required';
        }
        break;
        
      case 3:
        if (!formData.ein.trim()) {
          newErrors.ein = 'EIN is required';
        }
        if (!formData.bankAccountHolder.trim()) {
          newErrors.bankAccountHolder = 'Account holder name is required';
        }
        if (!formData.bankAccountNumber.trim()) {
          newErrors.bankAccountNumber = 'Account number is required';
        }
        if (!formData.bankRoutingNumber.trim()) {
          newErrors.bankRoutingNumber = 'Routing number is required';
        }
        if (!formData.bankName.trim()) {
          newErrors.bankName = 'Bank name is required';
        }
        break;
        
      case 4:
        if (!formData.poStartDate.trim()) {
          newErrors.poStartDate = 'Start date is required';
        }
        if (!formData.poEndDate.trim()) {
          newErrors.poEndDate = 'End date is required';
        }
        if (!formData.billRate || formData.billRate <= 0) {
          newErrors.billRate = 'Valid bill rate is required';
        }
        break;

      case 5:
        // Department contacts are optional
        break;

      default:
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const nextStep = useCallback(() => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
    }
  }, [currentStep, validateStep]);

  const prevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  }, []);

  const handleSave = useCallback(async () => {
    if (!validateStep(5)) {
      return;
    }

    setIsLoading(true);
    try {
      // Filter out empty contacts before sending
      const filterContacts = (contacts) => {
        return contacts.filter(contact => {
          // Keep contact if it has ANY non-empty field
          return Object.values(contact).some(value => 
            value && String(value).trim() !== ''
          );
        });
      };

      const completeData = {
        ...formData,
        hrContacts: filterContacts(hrContacts),
        onboardingContacts: filterContacts(onboardingContacts),
        accountsContacts: filterContacts(accountsContacts)
      };

      console.log('📤 Complete Data Being Sent:', JSON.stringify(completeData, null, 2));

      await onSave(completeData);
      onClose();
    } catch (error) {
      console.error('❌ Error saving C2C contractor:', error);
      Swal.fire({
        title: 'Error',
        text: error.message || 'Failed to save C2C contractor',
        icon: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  }, [validateStep, formData, hrContacts, onboardingContacts, accountsContacts, onSave, onClose]);

  const isStepValid = useMemo(() => {
    switch (currentStep) {
      case 1:
        return formData.contractorName.trim() && formData.companyName.trim() && 
               formData.email.trim() && formData.phone.trim() && formData.jobTitle.trim();
      case 2:
        return formData.streetAddress.trim() && formData.city.trim() && 
               formData.state.trim() && formData.zipCode.trim();
      case 3:
        return formData.ein.trim() && formData.bankAccountHolder.trim() && 
               formData.bankAccountNumber.trim() && formData.bankRoutingNumber.trim() && 
               formData.bankName.trim();
      case 4:
        return formData.poStartDate.trim() && formData.poEndDate.trim() && 
               formData.billRate && formData.billRate > 0;
      case 5:
        return true; // Department step is optional
      default:
        return false;
    }
  }, [currentStep, formData]);

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="mts-emp-form-grid">
             {/* Section: Contractor Basic Info */}
            <div style={{ gridColumn: '1 / -1', marginBottom: '12px', borderBottom: '1px solid #f3f4f6', paddingBottom: '8px' }}>
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#374151' }}>Contractor Details</h4>
            </div>

            <div className="mts-emp-form-row">
              <FormFieldGroup label="Candidate name" required error={errors.contractorName}>
                <InputField
                  value={formData.contractorName}
                  onChange={(e) => handleUpdateField('contractorName', e.target.value)}
                  placeholder="Enter candidate full name"
                />
              </FormFieldGroup>
              <FormFieldGroup label="Job Title" required error={errors.jobTitle}>
                <InputField
                  value={formData.jobTitle}
                  onChange={(e) => handleUpdateField('jobTitle', e.target.value)}
                  placeholder="e.g. Senior Software Engineer"
                />
              </FormFieldGroup>
            </div>
            
            <div className="mts-emp-form-row">
              <FormFieldGroup label="Candidate Email id" required error={errors.email}>
                <InputField
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleUpdateField('email', e.target.value)}
                  placeholder="Enter candidate email id"
                />
              </FormFieldGroup>
              <FormFieldGroup label="Candidate Phone Number" required error={errors.phone}>
                <InputField
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleUpdateField('phone', e.target.value)}
                  placeholder="Enter candidate phone number"
                />
              </FormFieldGroup>
            </div>

            <div className="mts-emp-form-row">
              <FormFieldGroup label="Work Authorization" error={errors.workAuthorization}>
                <SelectField
                  value={formData.workAuthorization}
                  onChange={(e) => handleUpdateField('workAuthorization', e.target.value)}
                  options={['US Citizen', 'Green Card', 'H1B', 'L1', 'O1', 'E2', 'TN', 'Other']}
                  placeholder="Select Work Authorization"
                />
              </FormFieldGroup>
              <FormFieldGroup label="LinkedIn Profile URL" error={errors.linkedInUrl}>
                <InputField
                  value={formData.linkedInUrl}
                  onChange={(e) => handleUpdateField('linkedInUrl', e.target.value)}
                  placeholder="https://linkedin.com/in/..."
                />
              </FormFieldGroup>
            </div>

            {/* Section: Vendor/Company Info */}
            <div style={{ gridColumn: '1 / -1', marginTop: '24px', marginBottom: '12px', borderBottom: '1px solid #f3f4f6', paddingBottom: '8px' }}>
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#374151' }}>Vendor (Employer) Details</h4>
            </div>

            <div className="mts-emp-form-row">
              <FormFieldGroup label="Vendor Company Name" required error={errors.companyName}>
                <InputField
                  value={formData.companyName}
                  onChange={(e) => handleUpdateField('companyName', e.target.value)}
                  placeholder="Enter vendor company name"
                />
              </FormFieldGroup>
              <FormFieldGroup label="Vendor Industry" error={errors.vendorIndustry}>
                <InputField
                  value={formData.vendorIndustry}
                  onChange={(e) => handleUpdateField('vendorIndustry', e.target.value)}
                  placeholder="e.g. IT Services, Healthcare"
                />
              </FormFieldGroup>
            </div>

            <div className="mts-emp-form-row">
              <FormFieldGroup label="Vendor Website" error={errors.vendorWebsite}>
                <InputField
                  value={formData.vendorWebsite}
                  onChange={(e) => handleUpdateField('vendorWebsite', e.target.value)}
                  placeholder="https://www.vendor.com"
                />
              </FormFieldGroup>
              <div /> {/* Spacer */}
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="mts-emp-form-grid">
            <div className="mts-emp-form-row">
              <FormFieldGroup label="Street Address" required error={errors.streetAddress}>
                <InputField
                  value={formData.streetAddress}
                  onChange={(e) => handleUpdateField('streetAddress', e.target.value)}
                  placeholder="Enter street address"
                />
              </FormFieldGroup>
              <FormFieldGroup label="Apartment, Suite, Unit" error={errors.apartmentSuite}>
                <InputField
                  value={formData.apartmentSuite}
                  onChange={(e) => handleUpdateField('apartmentSuite', e.target.value)}
                  placeholder="Enter apartment/suite details (optional)"
                />
              </FormFieldGroup>
            </div>
            
            <div className="mts-emp-form-row">
              <FormFieldGroup label="City" required error={errors.city}>
                <InputField
                  value={formData.city}
                  onChange={(e) => handleUpdateField('city', e.target.value)}
                  placeholder="Enter city"
                />
              </FormFieldGroup>
              <CountryStateField
                value={formData.state}
                onChange={(value) => handleUpdateField('state', value)}
                error={errors.state}
              />
              <FormFieldGroup label="Zip Code" required error={errors.zipCode}>
                <InputField
                  value={formData.zipCode}
                  onChange={(e) => handleUpdateField('zipCode', e.target.value)}
                  placeholder="Enter zip code"
                />
              </FormFieldGroup>
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="mts-emp-form-grid">
            <div style={{
              borderBottom: '2px solid #e5e7eb',
              paddingBottom: '16px',
              marginBottom: '16px',
              gridColumn: '1 / -1'
            }}>
              <h4 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#1f2937',
                margin: 0
              }}>
                Tax Information
              </h4>
            </div>
            
            <div className="mts-emp-form-row">
              <FormFieldGroup label="EIN (Employer Identification Number)" required error={errors.ein}>
                <InputField
                  value={formData.ein}
                  onChange={(e) => handleUpdateField('ein', e.target.value)}
                  placeholder="Enter EIN"
                />
              </FormFieldGroup>
              <FormFieldGroup label="State of Incorporation">
                <SelectField
                  value={formData.stateOfIncorporation || ''}
                  onChange={(e) => handleUpdateField('stateOfIncorporation', e.target.value)}
                  options={[
                    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 
                    'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 
                    'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 
                    'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 
                    'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 
                    'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 
                    'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 
                    'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 
                    'West Virginia', 'Wisconsin', 'Wyoming'
                  ]}
                  placeholder="Select State"
                />
              </FormFieldGroup>
            </div>
            
            <div style={{
              borderBottom: '2px solid #e5e7eb',
              paddingBottom: '16px',
              marginBottom: '16px',
              marginTop: '16px',
              gridColumn: '1 / -1'
            }}>
              <h4 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#1f2937',
                margin: 0
              }}>
                Bank Details
              </h4>
            </div>
            
            <div className="mts-emp-form-row">
              <FormFieldGroup label="Bank Name" required error={errors.bankName}>
                <InputField
                  value={formData.bankName}
                  onChange={(e) => handleUpdateField('bankName', e.target.value)}
                  placeholder="Enter bank name"
                />
              </FormFieldGroup>
              <FormFieldGroup label="Account Holder Name" required error={errors.bankAccountHolder}>
                <InputField
                  value={formData.bankAccountHolder}
                  onChange={(e) => handleUpdateField('bankAccountHolder', e.target.value)}
                  placeholder="Enter account holder name"
                />
              </FormFieldGroup>
            </div>
            
            <div className="mts-emp-form-row">
              <FormFieldGroup label="Account Number" required error={errors.bankAccountNumber}>
                <div style={{ position: 'relative' }}>
                  <input
                    type={formData.showAccountNumber ? "text" : "password"}
                    value={formData.bankAccountNumber}
                    onChange={(e) => handleUpdateField('bankAccountNumber', e.target.value)}
                    placeholder="Enter account number"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      paddingRight: '40px',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      fontFamily: 'inherit'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleUpdateField('showAccountNumber', !formData.showAccountNumber)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#6b7280',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '4px',
                      transition: 'color 0.2s'
                    }}
                  >
                    {formData.showAccountNumber ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </div>
              </FormFieldGroup>
              <FormFieldGroup label="Routing Number" required error={errors.bankRoutingNumber}>
                <InputField
                  value={formData.bankRoutingNumber}
                  onChange={(e) => handleUpdateField('bankRoutingNumber', e.target.value)}
                  placeholder="Enter routing number"
                />
              </FormFieldGroup>
            </div>
            
            <div className="mts-emp-form-row">
              <FormFieldGroup label="Account Type">
                <SelectField
                  value={formData.paymentMode}
                  onChange={(e) => handleUpdateField('paymentMode', e.target.value)}
                  options={PAYMENT_MODES}
                />
              </FormFieldGroup>
              <FormFieldGroup label="Payment Terms">
                <SelectField
                  value={formData.paymentTerms || ''}
                  onChange={(e) => handleUpdateField('paymentTerms', e.target.value)}
                  options={['Net 15', 'Net 30', 'Net 45', 'Net 60', 'Due on Receipt']}
                  placeholder="Select Payment Terms"
                />
              </FormFieldGroup>
            </div>
          </div>
        );
        
      case 4:
        return (
          <div className="mts-emp-form-grid">
            <div style={{
              borderBottom: '2px solid #e5e7eb',
              paddingBottom: '16px',
              marginBottom: '16px',
              gridColumn: '1 / -1'
            }}>
              <h4 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#1f2937',
                margin: 0
              }}>
                Contract Details
              </h4>
            </div>

            <div className="mts-emp-form-row">
              <FormFieldGroup label="End Client Name">
                <InputField
                  value={formData.clientName || ''}
                  onChange={(e) => handleUpdateField('clientName', e.target.value)}
                  placeholder="Enter end client name"
                />
              </FormFieldGroup>
              <FormFieldGroup label="Implementation Partner">
                <InputField
                  value={formData.implementationPartner || ''}
                  onChange={(e) => handleUpdateField('implementationPartner', e.target.value)}
                  placeholder="Enter implementation partner"
                />
              </FormFieldGroup>
            </div>

            <div className="mts-emp-form-row">
              <FormFieldGroup label="Bill Rate ($/hr)" required error={errors.billRate}>
                <InputField
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.billRate}
                  onChange={(e) => handleUpdateField('billRate', e.target.value)}
                  placeholder="Enter bill rate per hour"
                />
              </FormFieldGroup>
              <FormFieldGroup label="C2C Bill Rate ($/hr)">
                <InputField
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.c2cBillRate || ''}
                  onChange={(e) => handleUpdateField('c2cBillRate', e.target.value)}
                  placeholder="Enter C2C bill rate per hour"
                />
              </FormFieldGroup>
            </div>

            <div style={{
              borderBottom: '2px solid #e5e7eb',
              paddingBottom: '16px',
              marginBottom: '16px',
              marginTop: '16px',
              gridColumn: '1 / -1'
            }}>
              <h4 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#1f2937',
                margin: 0
              }}>
                PO Information
              </h4>
            </div>

            <div className="mts-emp-form-row">
              <FormFieldGroup label="PO Start Date" required error={errors.poStartDate}>
                <InputField
                  type="date"
                  value={formData.poStartDate}
                  onChange={(e) => handleUpdateField('poStartDate', e.target.value)}
                />
              </FormFieldGroup>
              <FormFieldGroup label="PO End Date" required error={errors.poEndDate}>
                <InputField
                  type="date"
                  value={formData.poEndDate}
                  onChange={(e) => handleUpdateField('poEndDate', e.target.value)}
                />
              </FormFieldGroup>
            </div>
            
            <div className="mts-emp-form-row">
              <FormFieldGroup label="Hire Date (Optional)">
                <InputField
                  type="date"
                  value={formData.hireDate}
                  onChange={(e) => handleUpdateField('hireDate', e.target.value)}
                />
              </FormFieldGroup>
              <FormFieldGroup label="Status">
                <SelectField
                  value={formData.status}
                  onChange={(e) => handleUpdateField('status', e.target.value)}
                  options={['Active', 'Inactive']}
                />
              </FormFieldGroup>
            </div>
            
            <div style={{ gridColumn: '1 / -1' }}>
              <FormFieldGroup label="Notes (Optional)">
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleUpdateField('notes', e.target.value)}
                  placeholder="Enter any additional notes..."
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontFamily: 'inherit',
                    lineHeight: '1.5',
                    minHeight: '80px',
                    resize: 'vertical'
                  }}
                />
              </FormFieldGroup>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="mts-emp-form-grid">
            {/* HR TEAM SECTION */}
            <div style={{
              gridColumn: '1 / -1',
              paddingBottom: '24px',
              borderBottom: '2px solid #e5e7eb',
              marginBottom: '24px'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '16px', marginTop: 0 }}>HR Team</h3>
              {hrContacts.map((contact, index) => (
                <div key={contact.id} style={{ padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px', marginBottom: index < hrContacts.length - 1 ? '16px' : '0' }}>
                  {hrContacts.length > 1 && (
                    <button type="button" onClick={() => handleRemoveHrContact(contact.id)} style={{ marginBottom: '12px', padding: '6px 12px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
                      Remove Contact
                    </button>
                  )}
                  <FormFieldGroup label="HR Contact Person">
                    <InputField value={contact.name} onChange={(e) => handleHrContactChange(contact.id, 'name', e.target.value)} placeholder="HR contact name" />
                  </FormFieldGroup>
                  <FormFieldGroup label="HR Email">
                    <InputField type="email" value={contact.email} onChange={(e) => handleHrContactChange(contact.id, 'email', e.target.value)} placeholder="hr@company.com" />
                  </FormFieldGroup>
                  <FormFieldGroup label="HR Phone">
                    <InputField type="tel" value={contact.phone} onChange={(e) => handleHrContactChange(contact.id, 'phone', e.target.value)} placeholder="HR phone number" />
                  </FormFieldGroup>
                </div>
              ))}
              <button type="button" onClick={handleAddHrContact} style={{ marginTop: '12px', padding: '10px 16px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                + Add Another HR Contact
              </button>
            </div>

            {/* ONBOARDING & COMPLAINTS SECTION */}
            <div style={{
              gridColumn: '1 / -1',
              paddingBottom: '24px',
              borderBottom: '2px solid #e5e7eb',
              marginBottom: '24px'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '16px', marginTop: 0 }}>Onboarding & Complaints</h3>
              {onboardingContacts.map((contact, index) => (
                <div key={contact.id} style={{ padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px', marginBottom: index < onboardingContacts.length - 1 ? '16px' : '0' }}>
                  {onboardingContacts.length > 1 && (
                    <button type="button" onClick={() => handleRemoveOnboardingContact(contact.id)} style={{ marginBottom: '12px', padding: '6px 12px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
                      Remove Contact
                    </button>
                  )}
                  <FormFieldGroup label="Contact Person">
                    <InputField value={contact.name} onChange={(e) => handleOnboardingContactChange(contact.id, 'name', e.target.value)} placeholder="Contact name" />
                  </FormFieldGroup>
                  <FormFieldGroup label="Contact Email">
                    <InputField type="email" value={contact.email} onChange={(e) => handleOnboardingContactChange(contact.id, 'email', e.target.value)} placeholder="contact@company.com" />
                  </FormFieldGroup>
                  <FormFieldGroup label="Contact Phone">
                    <InputField type="tel" value={contact.phone} onChange={(e) => handleOnboardingContactChange(contact.id, 'phone', e.target.value)} placeholder="Contact phone number" />
                  </FormFieldGroup>
                </div>
              ))}
              <button type="button" onClick={handleAddOnboardingContact} style={{ marginTop: '12px', padding: '10px 16px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                + Add Another Contact
              </button>
            </div>

            {/* ACCOUNTS SECTION */}
            <div style={{ gridColumn: '1 / -1' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '16px', marginTop: 0 }}>Accounts Team</h3>
              {accountsContacts.map((contact, index) => (
                <div key={contact.id} style={{ padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px', marginBottom: index < accountsContacts.length - 1 ? '16px' : '0' }}>
                  {accountsContacts.length > 1 && (
                    <button type="button" onClick={() => handleRemoveAccountsContact(contact.id)} style={{ marginBottom: '12px', padding: '6px 12px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
                      Remove Contact
                    </button>
                  )}
                  <FormFieldGroup label="Accounts Contact Person">
                    <InputField value={contact.name} onChange={(e) => handleAccountsContactChange(contact.id, 'name', e.target.value)} placeholder="Accounts contact name" />
                  </FormFieldGroup>
                  <FormFieldGroup label="Accounts Email">
                    <InputField type="email" value={contact.email} onChange={(e) => handleAccountsContactChange(contact.id, 'email', e.target.value)} placeholder="accounts@company.com" />
                  </FormFieldGroup>
                  <FormFieldGroup label="Accounts Phone">
                    <InputField type="tel" value={contact.phone} onChange={(e) => handleAccountsContactChange(contact.id, 'phone', e.target.value)} placeholder="Accounts phone number" />
                  </FormFieldGroup>
                </div>
              ))}
              <button type="button" onClick={handleAddAccountsContact} style={{ marginTop: '12px', padding: '10px 16px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                + Add Another Accounts Contact
              </button>
            </div>
          </div>
        );

      default: return null;
    }
  };

  const StepIndicator = () => (
    <div className="mts-step-indicator">
      <div className="mts-step-line" />
      {[1, 2, 3, 4, 5].map((step) => (
        <div key={step} className={`mts-step-item ${currentStep >= step ? 'active' : ''}`}>
          <div className="mts-step-number">{currentStep > step ? '✓' : step}</div>
          <span className="mts-step-label">
            {step === 1 && 'Entity Info'}
            {step === 2 && 'Address'}
            {step === 3 && 'Banking'}
            {step === 4 && 'PO Details'}
            {step === 5 && 'Departments'}
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <ModalOverlay isOpen={isOpen} onClose={onClose}>
      <div className="mts-emp-modal-content" style={{ maxWidth: '900px' }}>
        <ModalHeader title={title} onClose={onClose} />
        <StepIndicator />
        <div className="mts-emp-modal-body">{renderStepContent()}</div>
        <div className="mts-emp-modal-actions">
          {currentStep > 1 && <button onClick={prevStep} className="mts-emp-modal-btn mts-emp-modal-btn-cancel" disabled={isLoading}>Previous</button>}
          {currentStep < 5 ? (
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

C2CModal.displayName = 'C2CModal';

export default C2CModal;
