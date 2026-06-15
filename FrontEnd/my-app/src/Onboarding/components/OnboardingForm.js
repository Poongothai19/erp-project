



// OnboardingForm.js - Complete updated version
import React, { useState, useEffect } from 'react';
import '../styles/Onboarding.css'
import axios from 'axios';
import BASE_URL from '../../url';

const OnboardingForm = ({ onSubmit, initialData, isEditing, loading, onFormDataChange }) => {
  const [activeStep, setActiveStep] = useState(1);
  const [formData, setFormData] = useState({
    // Personal Information
    firstName: '',
    lastName: '',
    mobileNumber: '',
    dateOfBirth: '',
    gender: '',
    uanNumber: '',
    panNumber: '',
    adhaarNumber: '',
    personalEmail: '',
    linkedin: '',
    bloodGroup: '',
    diet: '',
    nameAsPerAadhaar: '',
    aadhaarNumber: '',
    aadhaarValidity: '',
    placeOfIssue: '',
    visaDetails: '',
    emergencyContactName: '',
    emergencyContactNo: '',
    languagesKnown: '',
    maritalStatus: '',
    bankName: '',
    bankAccountNumber: '',
    ifscCode: '',
    currentSalary: '',        // Add this
    expectedSalary: '', 

    // Permanent Address
    permanentDoorNo: '',
    permanentStreet: '',
    permanentLocality: '',
    permanentDistrict: '',
    permanentState: '',
    permanentPincode: '',

    // Current Address
    sameAsPermanent: false,
    currentDoorNo: '',
    currentStreet: '',
    currentLocality: '',
    currentDistrict: '',
    currentState: '',
    currentPincode: '',

    // Family Details
    familyMembers: [],

    // Education Details
    education: [],

    // Technical Qualifications
    technicalSkills: [],

    // Previous Employment
    previousEmployment: [],

    // Documents - store file objects
    aadhaar: null,
    drivingLicense: null,
    panCard: null,
    tenthCertificate: null,
    twelfthCertificate: null,
    degreeCertificate: null,
    passport: null,
    bankPassbook: null,
    epfoServiceHistory: null,
    payslipForm16: null,
    profilePicture: null,
    experienceLetter: null
  });

  const [documentFiles, setDocumentFiles] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [uploadProgress, setUploadProgress] = useState({});

  // Fetch existing documents separately
  const fetchExistingDocuments = async (employeeId) => {
    try {
      console.log('Fetching existing documents for employee:', employeeId);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${BASE_URL}/api/onboarding/${employeeId}/documents`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      console.log('Existing documents response:', response.data);
      
      if (response.data && response.data.length > 0) {
        const existingDocs = {};
        response.data.forEach(doc => {
          if (doc.documentType) {
            existingDocs[doc.documentType] = {
              name: doc.fileName,
              size: doc.fileSize,
              type: doc.mimeType,
              preview: doc.path ? `${BASE_URL}${doc.path}` : null,
              uploadedAt: doc.uploadedAt,
              isExisting: true
            };
          }
        });
        console.log('Setting existing documents:', existingDocs);
        setDocumentFiles(existingDocs);
      } else {
        console.log('No existing documents found');
      }
    } catch (error) {
      console.error('Error fetching existing documents:', error);
    }
  };

  // Load initial data when editing
  useEffect(() => {
    if (isEditing && initialData) {
      console.log('Loading initial data for editing:', initialData);
      
      // Helper function to parse JSON fields
      const parseJsonField = (field) => {
        if (!field) return [];
        if (Array.isArray(field)) return field;
        if (typeof field === 'string') {
          try {
            const parsed = JSON.parse(field);
            return Array.isArray(parsed) ? parsed : [];
          } catch (e) {
            console.error('Error parsing JSON field:', e);
            return [];
          }
        }
        return [];
      };
      
      const formattedData = {
        // Personal Information
        firstName: initialData.firstName || '',
        lastName: initialData.lastName || '',
        mobileNumber: initialData.mobileNumber || '',
        dateOfBirth: initialData.dateOfBirth ? initialData.dateOfBirth.split('T')[0] : '',
        gender: initialData.gender || '',
        uanNumber: initialData.uanNumber || '',
        panNumber: initialData.panNumber || '',
        adhaarNumber: initialData.adhaarNumber || '',
        personalEmail: initialData.personalEmail || '',
        linkedin: initialData.linkedin || '',
        bloodGroup: initialData.bloodGroup || '',
        diet: initialData.diet || '',
        currentSalary: initialData.currentSalary || '',      // ADD THIS
        expectedSalary: initialData.expectedSalary || '',  
        nameAsPerAadhaar: initialData.nameAsPerAadhaar || '',
        aadhaarNumber: initialData.aadhaarNumber || '',
        aadhaarValidity: initialData.aadhaarValidity ? initialData.aadhaarValidity.split('T')[0] : '',
        placeOfIssue: initialData.placeOfIssue || '',
        visaDetails: initialData.visaDetails || '',
        emergencyContactName: initialData.emergencyContactName || '',
        emergencyContactNo: initialData.emergencyContactNo || '',
        languagesKnown: initialData.languagesKnown || '',
        maritalStatus: initialData.maritalStatus || '',
        bankName: initialData.bankName || '',
        bankAccountNumber: initialData.bankAccountNumber || '',
        ifscCode: initialData.ifscCode || '',

        // Permanent Address
        permanentDoorNo: initialData.permanentDoorNo || '',
        permanentStreet: initialData.permanentStreet || '',
        permanentLocality: initialData.permanentLocality || '',
        permanentDistrict: initialData.permanentDistrict || '',
        permanentState: initialData.permanentState || '',
        permanentPincode: initialData.permanentPincode || '',

        // Current Address
        sameAsPermanent: initialData.sameAsPermanent || false,
        currentDoorNo: initialData.currentDoorNo || '',
        currentStreet: initialData.currentStreet || '',
        currentLocality: initialData.currentLocality || '',
        currentDistrict: initialData.currentDistrict || '',
        currentState: initialData.currentState || '',
        currentPincode: initialData.currentPincode || '',

        // Family Details
        familyMembers: parseJsonField(initialData.familyMembers),

        // Education Details
        education: parseJsonField(initialData.education),

        // Technical Qualifications
        technicalSkills: parseJsonField(initialData.technicalSkills),

        // Previous Employment
        previousEmployment: parseJsonField(initialData.previousEmployment),

        // Documents - initialize as null (files will be re-uploaded if needed)
        aadhaar: null,
        drivingLicense: null,
        panCard: null,
        tenthCertificate: null,
        twelfthCertificate: null,
        degreeCertificate: null,
        passport: null,
        bankPassbook: null,
        epfoServiceHistory: null,
        payslipForm16: null,
        profilePicture: null,
        experienceLetter: null
      };

      console.log('Formatted data for editing:', formattedData);
      console.log('Education data:', formattedData.education);
      console.log('Previous employment data:', formattedData.previousEmployment);
      
      setFormData(formattedData);
      setActiveStep(1); // Reset to first step when editing
      
      // Fetch existing documents
      if (initialData.id) {
        fetchExistingDocuments(initialData.id);
      }
    } else if (!isEditing) {
      // Reset form for new submission
      setFormData({
        firstName: '',
        lastName: '',
        mobileNumber: '',
        dateOfBirth: '',
        gender: '',
        uanNumber: '',
        panNumber: '',
        adhaarNumber: '',
        personalEmail: '',
        linkedin: '',
        bloodGroup: '',
        diet: '',
        nameAsPerAadhaar: '',
        aadhaarNumber: '',
        aadhaarValidity: '',
        placeOfIssue: '',
        visaDetails: '',
        emergencyContactName: '',
        emergencyContactNo: '',
        languagesKnown: '',
        maritalStatus: '',
        bankName: '',
        bankAccountNumber: '',
        ifscCode: '',
        currentSalary: '',        // Add this
        expectedSalary: '',   
        permanentDoorNo: '',
        permanentStreet: '',
        permanentLocality: '',
        permanentDistrict: '',
        permanentState: '',
        permanentPincode: '',
        sameAsPermanent: false,
        currentDoorNo: '',
        currentStreet: '',
        currentLocality: '',
        currentDistrict: '',
        currentState: '',
        currentPincode: '',
        familyMembers: [],
        education: [],
        technicalSkills: [],
        previousEmployment: [],
        aadhaar: null,
        drivingLicense: null,
        panCard: null,
        tenthCertificate: null,
        twelfthCertificate: null,
        degreeCertificate: null,
        passport: null,
        bankPassbook: null,
        epfoServiceHistory: null,
        payslipForm16: null,
        profilePicture: null,
        experienceLetter: null
      });
      setDocumentFiles({});
      setActiveStep(1);
    }
  }, [isEditing, initialData]);

  const steps = [
    { id: 1, title: 'Personal Information' },
    { id: 2, title: 'Address Details' },
    { id: 3, title: 'Family Details' },
    { id: 4, title: 'Education Details' },
    { id: 5, title: 'Employment History' },
    { id: 6, title: 'Documents Upload' }
  ];

  const validateStep = (step) => {
    const errors = {};
    
    switch(step) {
      case 1:
        if (!formData.firstName?.trim()) errors.firstName = 'First name is required';
        if (!formData.personalEmail?.trim()) errors.personalEmail = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(formData.personalEmail)) errors.personalEmail = 'Email is invalid';
        if (formData.mobileNumber && !/^\d{10}$/.test(formData.mobileNumber)) 
          errors.mobileNumber = 'Mobile number must be 10 digits';
        break;
      case 6:
        // Document validation - all optional
        break;
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

const handleInputChange = (e, section, index = null, field = null) => {
    const { name, value, type, checked } = e.target;
    
    let updatedFormData;
    
    if (type === 'checkbox') {
      updatedFormData = {
        ...formData,
        [name]: checked
      };
      setFormData(updatedFormData);
    } else if (section && index !== null && field) {
      const updatedArray = [...formData[section]];
      updatedArray[index] = { ...updatedArray[index], [field]: value };
      updatedFormData = {
        ...formData,
        [section]: updatedArray
      };
      setFormData(updatedFormData);
    } else {
      updatedFormData = {
        ...formData,
        [name]: value
      };
      setFormData(updatedFormData);
      
      // Clear error when user starts typing
      if (formErrors[name]) {
        setFormErrors(prev => ({ ...prev, [name]: '' }));
      }
    }
    
    // ✅ Notify parent of changes
    if (onFormDataChange && updatedFormData) {
      onFormDataChange(updatedFormData);
    }
  };

const handleFileChange = (e, documentType) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size - 1MB = 1024 * 1024 bytes
    const MAX_SIZE = 1024 * 1024;
    if (file.size > MAX_SIZE) {
      alert(`File "${file.name}" is too large. Maximum size is 1MB.`);
      e.target.value = ''; // Clear the file input
      return;
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      alert(`File "${file.name}" has invalid type. Only JPEG, PNG, and PDF are allowed.`);
      e.target.value = '';
      return;
    }

    // Update form data with file
    const updatedFormData = {
      ...formData,
      [documentType]: file
    };
    setFormData(updatedFormData);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setDocumentFiles(prev => ({
          ...prev,
          [documentType]: {
            name: file.name,
            size: file.size,
            type: file.type,
            preview: reader.result,
            isExisting: false
          }
        }));
      };
      reader.readAsDataURL(file);
    } else {
      setDocumentFiles(prev => ({
        ...prev,
        [documentType]: {
          name: file.name,
          size: file.size,
          type: file.type,
          isExisting: false
        }
      }));
    }

    // Update upload progress
    setUploadProgress(prev => ({
      ...prev,
      [documentType]: 100
    }));
    
    // ✅ Notify parent of changes
    if (onFormDataChange) {
      onFormDataChange(updatedFormData);
    }
  };
  const removeFile = (documentType) => {
    setFormData(prev => ({
      ...prev,
      [documentType]: null
    }));
    setDocumentFiles(prev => {
      const newFiles = { ...prev };
      delete newFiles[documentType];
      return newFiles;
    });
    
    // Reset file input
    const fileInput = document.getElementById(`${documentType}-file`);
    if (fileInput) fileInput.value = '';
  };

  const handleAddFamilyMember = () => {
    setFormData(prev => ({
      ...prev,
      familyMembers: [
        ...prev.familyMembers,
        { name: '', relationship: '', dateOfBirth: '', aadhaarNumber: '' }
      ]
    }));
  };

  const handleRemoveFamilyMember = (index) => {
    const updatedMembers = [...formData.familyMembers];
    updatedMembers.splice(index, 1);
    setFormData(prev => ({
      ...prev,
      familyMembers: updatedMembers
    }));
  };

  const handleAddEducation = () => {
    setFormData(prev => ({
      ...prev,
      education: [
        ...prev.education,
        { institution: '', board: '', location: '', course: '', specialization: '', year: '', percentage: '' }
      ]
    }));
  };

  const handleRemoveEducation = (index) => {
    const updatedEducation = [...formData.education];
    updatedEducation.splice(index, 1);
    setFormData(prev => ({
      ...prev,
      education: updatedEducation
    }));
  };

  const handleAddTechnicalSkill = () => {
    setFormData(prev => ({
      ...prev,
      technicalSkills: [
        ...prev.technicalSkills,
        { certification: '', institute: '', duration: '', date: '' }
      ]
    }));
  };

  const handleRemoveTechnicalSkill = (index) => {
    const updatedSkills = [...formData.technicalSkills];
    updatedSkills.splice(index, 1);
    setFormData(prev => ({
      ...prev,
      technicalSkills: updatedSkills
    }));
  };

  const handleAddEmployment = () => {
    setFormData(prev => ({
      ...prev,
      previousEmployment: [
        ...prev.previousEmployment,
        {
          companyName: '',
          companyLocation: '',
          durationFrom: '',
          durationTo: '',
          employmentStatus: '',
          designation: '',
          contactName: '',
          contactPhone: '',
          contactEmail: '',
          reasonForLeaving: '',
          employmentDescription: '',
          outsourcingAgencyName: '',
          outsourcingAgencyAddress: ''
        }
      ]
    }));
  };

  const handleRemoveEmployment = (index) => {
    const updatedEmployment = [...formData.previousEmployment];
    updatedEmployment.splice(index, 1);
    setFormData(prev => ({
      ...prev,
      previousEmployment: updatedEmployment
    }));
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => Math.min(prev + 1, steps.length));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    setActiveStep(prev => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('=== FORM DATA BEFORE SUBMISSION ===');
    console.log('Is editing?', isEditing);
    console.log('Form data state:', formData);
    console.log('Document files:', documentFiles);
    
    if (!validateStep(activeStep)) {
      alert('Please fix the errors in the form before submitting.');
      return;
    }

    // Prepare final form data with documents
    const finalFormData = { ...formData };
    
    // Ensure arrays are properly formatted
    if (finalFormData.familyMembers && !Array.isArray(finalFormData.familyMembers)) {
      finalFormData.familyMembers = [];
    }
    if (finalFormData.education && !Array.isArray(finalFormData.education)) {
      finalFormData.education = [];
    }
    if (finalFormData.previousEmployment && !Array.isArray(finalFormData.previousEmployment)) {
      finalFormData.previousEmployment = [];
    }
    
    console.log('Final form data to submit:', finalFormData);
    
    if (onSubmit) {
      onSubmit(finalFormData);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 1:
        return (
          <div className="ob-form-section">
            <h3>Personal Information</h3>
            <div className="ob-form-grid">
              <div className="ob-form-group">
                <label>First Name *</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="Enter first name"
                  className={`ob-form-input ${formErrors.firstName ? 'error' : ''}`}
                />
                {formErrors.firstName && <span className="error-message">{formErrors.firstName}</span>}
              </div>
              <div className="ob-form-group">
                <label>Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Enter last name"
                  className="ob-form-input"
                />
              </div>
              <div className="ob-form-group">
                <label>Mobile Number</label>
                <input
                  type="tel"
                  name="mobileNumber"
                  value={formData.mobileNumber}
                  onChange={handleInputChange}
                  placeholder="Enter mobile number"
                  className={`ob-form-input ${formErrors.mobileNumber ? 'error' : ''}`}
                />
                {formErrors.mobileNumber && <span className="error-message">{formErrors.mobileNumber}</span>}
              </div>
              <div className="ob-form-group">
                <label>Date of Birth</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  className="ob-form-input"
                />
              </div>
              <div className="ob-form-group">
                <label>Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="ob-form-select"
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="ob-form-group">
                <label>UAN Number</label>
                <input
                  type="tel"
                  name="uanNumber"
                  value={formData.uanNumber}
                  onChange={handleInputChange}
                  placeholder="Enter UAN number"
                  className="ob-form-input"
                />
              </div>
              <div className="ob-form-group">
                <label>PAN Number</label>
                <input
                  type="text"
                  name="panNumber"
                  value={formData.panNumber}
                  onChange={handleInputChange}
                  placeholder="Enter PAN number"
                  className="ob-form-input"
                />
              </div>
              <div className="ob-form-group">
                <label>Aadhaar Number</label>
                <input
                  type="text"
                  name="adhaarNumber"
                  value={formData.adhaarNumber}
                  onChange={handleInputChange}
                  placeholder="Enter Aadhaar number"
                  className="ob-form-input"
                />
              </div>
              <div className="ob-form-group">
                <label>Personal Email ID *</label>
                <input
                  type="email"
                  name="personalEmail"
                  value={formData.personalEmail}
                  onChange={handleInputChange}
                  placeholder="Enter personal email"
                  className={`ob-form-input ${formErrors.personalEmail ? 'error' : ''}`}
                />
                {formErrors.personalEmail && <span className="error-message">{formErrors.personalEmail}</span>}
              </div>
              <div className="ob-form-group">
                <label>LinkedIn Profile</label>
                <input
                  type="url"
                  name="linkedin"
                  value={formData.linkedin}
                  onChange={handleInputChange}
                  placeholder="Enter LinkedIn profile URL"
                  className="ob-form-input"
                />
              </div>
              <div className="ob-form-group">
  <label>Blood Group</label>
  <select
    name="bloodGroup"
    value={formData.bloodGroup}
    onChange={handleInputChange}
    className="ob-form-select"
  >
    <option value="">Select Blood Group</option>
    <option value="A+">A+</option>
    <option value="A-">A-</option>
    <option value="B+">B+</option>
    <option value="B-">B-</option>
    <option value="O+">O+</option>
    <option value="O-">O-</option>
    <option value="AB+">AB+</option>
    <option value="AB-">AB-</option>
  </select>
</div>

{/* ADD THESE TWO FIELDS */}
<div className="ob-form-group">
  <label>Current Salary (₹)</label>
  <input
    type="number"
    name="currentSalary"
    value={formData.currentSalary}
    onChange={handleInputChange}
    placeholder="Enter current salary"
    className="ob-form-input"
    min="0"
    step="0.01"
  />
</div>

<div className="ob-form-group">
  <label>Expected Salary (₹)</label>
  <input
    type="number"
    name="expectedSalary"
    value={formData.expectedSalary}
    onChange={handleInputChange}
    placeholder="Enter expected salary"
    className="ob-form-input"
    min="0"
    step="0.01"
  />
</div>
            </div>

            <h4>Emergency Contact</h4>
            <div className="ob-form-grid">
              <div className="ob-form-group">
                <label>Emergency Contact Name</label>
                <input
                  type="text"
                  name="emergencyContactName"
                  value={formData.emergencyContactName}
                  onChange={handleInputChange}
                  placeholder="Enter emergency contact name"
                  className="ob-form-input"
                />
              </div>
              <div className="ob-form-group">
                <label>Emergency Contact Number</label>
                <input
                  type="tel"
                  name="emergencyContactNo"
                  value={formData.emergencyContactNo}
                  onChange={handleInputChange}
                  placeholder="Enter emergency contact number"
                  className="ob-form-input"
                />
              </div>
            </div>

            <div className="ob-form-grid">
              <div className="ob-form-group">
                <label>Languages Known</label>
                <input
                  type="text"
                  name="languagesKnown"
                  value={formData.languagesKnown}
                  onChange={handleInputChange}
                  placeholder="e.g., English, Hindi"
                  className="ob-form-input"
                />
              </div>
              <div className="ob-form-group">
                <label>Marital Status</label>
                <select
                  name="maritalStatus"
                  value={formData.maritalStatus}
                  onChange={handleInputChange}
                  className="ob-form-select"
                >
                  <option value="">Select Marital Status</option>
                  <option value="single">Single</option>
                  <option value="married">Married</option>
                  <option value="divorced">Divorced</option>
                  <option value="widowed">Widowed</option>
                </select>
              </div>
            </div>

            <h4>Bank Details</h4>
            <div className="ob-form-grid">
              <div className="ob-form-group">
                <label>Bank Name</label>
                <input
                  type="text"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleInputChange}
                  placeholder="Enter bank name"
                  className="ob-form-input"
                />
              </div>
              <div className="ob-form-group">
                <label>Bank Account Number</label>
                <input
                  type="text"
                  name="bankAccountNumber"
                  value={formData.bankAccountNumber}
                  onChange={handleInputChange}
                  placeholder="Enter account number"
                  className="ob-form-input"
                />
              </div>
              <div className="ob-form-group">
                <label>IFSC Code</label>
                <input
                  type="text"
                  name="ifscCode"
                  value={formData.ifscCode}
                  onChange={handleInputChange}
                  placeholder="Enter IFSC code"
                  className="ob-form-input"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="ob-form-section">
            <h3>Address Details</h3>
            
            <h4>Permanent Address</h4>
            <div className="ob-form-grid">
              <div className="ob-form-group">
                <label>Door No</label>
                <input
                  type="text"
                  name="permanentDoorNo"
                  value={formData.permanentDoorNo}
                  onChange={handleInputChange}
                  placeholder="Enter door number"
                  className="ob-form-input"
                />
              </div>
              <div className="ob-form-group">
                <label>Street</label>
                <input
                  type="text"
                  name="permanentStreet"
                  value={formData.permanentStreet}
                  onChange={handleInputChange}
                  placeholder="Enter street"
                  className="ob-form-input"
                />
              </div>
              <div className="ob-form-group">
                <label>Locality</label>
                <input
                  type="text"
                  name="permanentLocality"
                  value={formData.permanentLocality}
                  onChange={handleInputChange}
                  placeholder="Enter locality"
                  className="ob-form-input"
                />
              </div>
              <div className="ob-form-group">
                <label>District</label>
                <input
                  type="text"
                  name="permanentDistrict"
                  value={formData.permanentDistrict}
                  onChange={handleInputChange}
                  placeholder="Enter district"
                  className="ob-form-input"
                />
              </div>
              <div className="ob-form-group">
                <label>State</label>
                <input
                  type="text"
                  name="permanentState"
                  value={formData.permanentState}
                  onChange={handleInputChange}
                  placeholder="Enter state"
                  className="ob-form-input"
                />
              </div>
              <div className="ob-form-group">
                <label>Pincode</label>
                <input
                  type="text"
                  name="permanentPincode"
                  value={formData.permanentPincode}
                  onChange={handleInputChange}
                  placeholder="Enter pincode"
                  className="ob-form-input"
                />
              </div>
            </div>

            <h4>Current Address</h4>
            <div className="ob-form-group ob-checkbox-group">
              <label className="ob-checkbox-label">
                <input
                  type="checkbox"
                  name="sameAsPermanent"
                  checked={formData.sameAsPermanent}
                  onChange={handleInputChange}
                  className="ob-form-checkbox"
                />
                Same as Permanent Address
              </label>
            </div>

            {!formData.sameAsPermanent && (
              <div className="ob-form-grid">
                <div className="ob-form-group">
                  <label>Door No</label>
                  <input
                    type="text"
                    name="currentDoorNo"
                    value={formData.currentDoorNo}
                    onChange={handleInputChange}
                    placeholder="Enter door number"
                    className="ob-form-input"
                  />
                </div>
                <div className="ob-form-group">
                  <label>Street</label>
                  <input
                    type="text"
                    name="currentStreet"
                    value={formData.currentStreet}
                    onChange={handleInputChange}
                    placeholder="Enter street"
                    className="ob-form-input"
                  />
                </div>
                <div className="ob-form-group">
                  <label>Locality</label>
                  <input
                    type="text"
                    name="currentLocality"
                    value={formData.currentLocality}
                    onChange={handleInputChange}
                    placeholder="Enter locality"
                    className="ob-form-input"
                  />
                </div>
                <div className="ob-form-group">
                  <label>District</label>
                  <input
                    type="text"
                    name="currentDistrict"
                    value={formData.currentDistrict}
                    onChange={handleInputChange}
                    placeholder="Enter district"
                    className="ob-form-input"
                  />
                </div>
                <div className="ob-form-group">
                  <label>State</label>
                  <input
                    type="text"
                    name="currentState"
                    value={formData.currentState}
                    onChange={handleInputChange}
                    placeholder="Enter state"
                    className="ob-form-input"
                  />
                </div>
                <div className="ob-form-group">
                  <label>Pincode</label>
                  <input
                    type="text"
                    name="currentPincode"
                    value={formData.currentPincode}
                    onChange={handleInputChange}
                    placeholder="Enter pincode"
                    className="ob-form-input"
                  />
                </div>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="ob-form-section">
            <h3>Family Details (As Per Aadhaar)</h3>
            {formData.familyMembers.map((member, index) => (
              <div key={index} className="ob-form-section-item">
                <div className="ob-form-section-header">
                  <h5>Family Member {index + 1}</h5>
                  <button
                    type="button"
                    className="ob-btn-remove"
                    onClick={() => handleRemoveFamilyMember(index)}
                  >
                    Remove
                  </button>
                </div>
                <div className="ob-form-grid">
                  <div className="ob-form-group">
                    <label>Family Member Name</label>
                    <input
                      type="text"
                      value={member.name}
                      onChange={(e) => handleInputChange(e, 'familyMembers', index, 'name')}
                      placeholder="Enter name"
                      className="ob-form-input"
                    />
                  </div>
                  <div className="ob-form-group">
                    <label>Relationship</label>
                    <select
                      value={member.relationship}
                      onChange={(e) => handleInputChange(e, 'familyMembers', index, 'relationship')}
                      className="ob-form-select"
                    >
                      <option value="">Select Relationship</option>
                      <option value="father">Father</option>
                      <option value="mother">Mother</option>
                      <option value="spouse">Spouse</option>
                      <option value="son">Son</option>
                      <option value="daughter">Daughter</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="ob-form-group">
                    <label>Date of Birth</label>
                    <input
                      type="date"
                      value={member.dateOfBirth}
                      onChange={(e) => handleInputChange(e, 'familyMembers', index, 'dateOfBirth')}
                      className="ob-form-input"
                    />
                  </div>
                  <div className="ob-form-group">
                    <label>Aadhaar Number</label>
                    <input
                      type="text"
                      value={member.aadhaarNumber}
                      onChange={(e) => handleInputChange(e, 'familyMembers', index, 'aadhaarNumber')}
                      placeholder="Enter Aadhaar number"
                      className="ob-form-input"
                    />
                  </div>
                </div>
              </div>
            ))}
            <button type="button" className="ob-btn-add" onClick={handleAddFamilyMember}>
              Add Family Member
            </button>
          </div>
        );

      case 4:
        return (
          <div className="ob-form-section">
            <h3>Education Details</h3>
            {formData.education.map((edu, index) => (
              <div key={index} className="ob-form-section-item">
                <div className="ob-form-section-header">
                  <h5>Education {index + 1}</h5>
                  <button
                    type="button"
                    className="ob-btn-remove"
                    onClick={() => handleRemoveEducation(index)}
                  >
                    Remove
                  </button>
                </div>
                <div className="ob-form-grid">
                  <div className="ob-form-group">
                    <label>Name of School/College</label>
                    <input
                      type="text"
                      value={edu.institution}
                      onChange={(e) => handleInputChange(e, 'education', index, 'institution')}
                      placeholder="Enter institution name"
                      className="ob-form-input"
                    />
                  </div>
                  <div className="ob-form-group">
                    <label>Board/University</label>
                    <input
                      type="text"
                      value={edu.board}
                      onChange={(e) => handleInputChange(e, 'education', index, 'board')}
                      placeholder="Enter board/university"
                      className="ob-form-input"
                    />
                  </div>
                  <div className="ob-form-group">
                    <label>Location</label>
                    <input
                      type="text"
                      value={edu.location}
                      onChange={(e) => handleInputChange(e, 'education', index, 'location')}
                      placeholder="Enter location"
                      className="ob-form-input"
                    />
                  </div>
                  <div className="ob-form-group">
                    <label>Course</label>
                    <input
                      type="text"
                      value={edu.course}
                      onChange={(e) => handleInputChange(e, 'education', index, 'course')}
                      placeholder="Enter course name"
                      className="ob-form-input"
                    />
                  </div>
                  <div className="ob-form-group">
                    <label>Specialization</label>
                    <input
                      type="text"
                      value={edu.specialization}
                      onChange={(e) => handleInputChange(e, 'education', index, 'specialization')}
                      placeholder="Enter specialization"
                      className="ob-form-input"
                    />
                  </div>
                  <div className="ob-form-group">
                    <label>Year of Passing</label>
                    <input
                      type="text"
                      value={edu.year}
                      onChange={(e) => handleInputChange(e, 'education', index, 'year')}
                      placeholder="Enter year"
                      className="ob-form-input"
                    />
                  </div>
                  <div className="ob-form-group">
                    <label>Percentage/GPA</label>
                    <input
                      type="text"
                      value={edu.percentage}
                      onChange={(e) => handleInputChange(e, 'education', index, 'percentage')}
                      placeholder="Enter percentage/GPA"
                      className="ob-form-input"
                    />
                  </div>
                </div>
              </div>
            ))}
            <button type="button" className="ob-btn-add" onClick={handleAddEducation}>
              Add Education
            </button>

            <h3>Technical Qualification / Special Skills / Certifications</h3>
            {formData.technicalSkills.map((skill, index) => (
              <div key={index} className="ob-form-section-item">
                <div className="ob-form-section-header">
                  <h5>Skill/Certification {index + 1}</h5>
                  <button
                    type="button"
                    className="ob-btn-remove"
                    onClick={() => handleRemoveTechnicalSkill(index)}
                  >
                    Remove
                  </button>
                </div>
                <div className="ob-form-grid">
                  <div className="ob-form-group">
                    <label>Certification</label>
                    <input
                      type="text"
                      value={skill.certification}
                      onChange={(e) => handleInputChange(e, 'technicalSkills', index, 'certification')}
                      placeholder="Enter certification name"
                      className="ob-form-input"
                    />
                  </div>
                  <div className="ob-form-group">
                    <label>Institute</label>
                    <input
                      type="text"
                      value={skill.institute}
                      onChange={(e) => handleInputChange(e, 'technicalSkills', index, 'institute')}
                      placeholder="Enter institute name"
                      className="ob-form-input"
                    />
                  </div>
                  <div className="ob-form-group">
                    <label>Duration</label>
                    <input
                      type="text"
                      value={skill.duration}
                      onChange={(e) => handleInputChange(e, 'technicalSkills', index, 'duration')}
                      placeholder="e.g., 3 months"
                      className="ob-form-input"
                    />
                  </div>
                  <div className="ob-form-group">
                    <label>Date</label>
                    <input
                      type="date"
                      value={skill.date}
                      onChange={(e) => handleInputChange(e, 'technicalSkills', index, 'date')}
                      className="ob-form-input"
                    />
                  </div>
                </div>
              </div>
            ))}
            <button type="button" className="ob-btn-add" onClick={handleAddTechnicalSkill}>
              Add Technical Qualification
            </button>
          </div>
        );

      case 5:
        return (
          <div className="ob-form-section">
            <h3>Previous Employment</h3>
            {formData.previousEmployment.map((employment, index) => (
              <div key={index} className="ob-form-section-item">
                <div className="ob-form-section-header">
                  <h5>Employment {index + 1}</h5>
                  <button
                    type="button"
                    className="ob-btn-remove"
                    onClick={() => handleRemoveEmployment(index)}
                  >
                    Remove
                  </button>
                </div>
                <div className="ob-form-grid">
                  <div className="ob-form-group">
                    <label>Company Name</label>
                    <input
                      type="text"
                      value={employment.companyName}
                      onChange={(e) => handleInputChange(e, 'previousEmployment', index, 'companyName')}
                      placeholder="Enter company name"
                      className="ob-form-input"
                    />
                  </div>
                  <div className="ob-form-group">
                    <label>Company Location</label>
                    <input
                      type="text"
                      value={employment.companyLocation}
                      onChange={(e) => handleInputChange(e, 'previousEmployment', index, 'companyLocation')}
                      placeholder="Enter company location"
                      className="ob-form-input"
                    />
                  </div>
                  <div className="ob-form-group">
                    <label>Duration From</label>
                    <input
                      type="date"
                      value={employment.durationFrom}
                      onChange={(e) => handleInputChange(e, 'previousEmployment', index, 'durationFrom')}
                      className="ob-form-input"
                    />
                  </div>
                  <div className="ob-form-group">
                    <label>Duration To</label>
                    <input
                      type="date"
                      value={employment.durationTo}
                      onChange={(e) => handleInputChange(e, 'previousEmployment', index, 'durationTo')}
                      className="ob-form-input"
                    />
                  </div>
                  <div className="ob-form-group">
                    <label>Employment Status</label>
                    <div className="ob-radio-group">
                      <label className="ob-radio-label">
                        <input
                          type="radio"
                          name={`employmentStatus-${index}`}
                          value="fulltime"
                          checked={employment.employmentStatus === 'fulltime'}
                          onChange={(e) => handleInputChange(e, 'previousEmployment', index, 'employmentStatus')}
                          className="ob-form-radio"
                        />
                        Full Time
                      </label>
                      <label className="ob-radio-label">
                        <input
                          type="radio"
                          name={`employmentStatus-${index}`}
                          value="contract"
                          checked={employment.employmentStatus === 'contract'}
                          onChange={(e) => handleInputChange(e, 'previousEmployment', index, 'employmentStatus')}
                          className="ob-form-radio"
                        />
                        Contract / Through Outsourcing
                      </label>
                    </div>
                  </div>
                </div>

                <div className="ob-form-grid">
                  <div className="ob-form-group">
                    <label>Designation</label>
                    <input
                      type="text"
                      value={employment.designation}
                      onChange={(e) => handleInputChange(e, 'previousEmployment', index, 'designation')}
                      placeholder="Enter designation"
                      className="ob-form-input"
                    />
                  </div>
                  <div className="ob-form-group">
                    <label>Reason for Leaving</label>
                    <textarea
                      value={employment.reasonForLeaving}
                      onChange={(e) => handleInputChange(e, 'previousEmployment', index, 'reasonForLeaving')}
                      placeholder="Enter reason for leaving"
                      className="ob-form-textarea"
                    />
                  </div>
                </div>

                <h4>Contact Details</h4>
                <div className="ob-form-grid">
                  <div className="ob-form-group">
                    <label>Contact Name</label>
                    <input
                      type="text"
                      value={employment.contactName}
                      onChange={(e) => handleInputChange(e, 'previousEmployment', index, 'contactName')}
                      placeholder="Enter contact name"
                      className="ob-form-input"
                    />
                  </div>
                  <div className="ob-form-group">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      value={employment.contactPhone}
                      onChange={(e) => handleInputChange(e, 'previousEmployment', index, 'contactPhone')}
                      placeholder="Enter contact phone"
                      className="ob-form-input"
                    />
                  </div>
                  <div className="ob-form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={employment.contactEmail}
                      onChange={(e) => handleInputChange(e, 'previousEmployment', index, 'contactEmail')}
                      placeholder="Enter contact email"
                      className="ob-form-input"
                    />
                  </div>
                </div>

                <h4>Outsourcing Agency Details (If applicable)</h4>
                <div className="ob-form-grid">
                  <div className="ob-form-group">
                    <label>Name</label>
                    <input
                      type="text"
                      value={employment.outsourcingAgencyName}
                      onChange={(e) => handleInputChange(e, 'previousEmployment', index, 'outsourcingAgencyName')}
                      placeholder="Enter agency name"
                      className="ob-form-input"
                    />
                  </div>
                  <div className="ob-form-group">
                    <label>Address & Tel No</label>
                    <textarea
                      value={employment.outsourcingAgencyAddress}
                      onChange={(e) => handleInputChange(e, 'previousEmployment', index, 'outsourcingAgencyAddress')}
                      placeholder="Enter agency address and phone"
                      className="ob-form-textarea"
                    />
                  </div>
                </div>
              </div>
            ))}
            <button type="button" className="ob-btn-add" onClick={handleAddEmployment}>
              Add Previous Employment
            </button>
          </div>
        );

      case 6:
        return (
          <div className="ob-form-section">
            <h3>Documents Upload</h3>
            <p className="ob-file-note">
              Maximum file size: 1MB per file. Supported formats: PDF, JPG, JPEG, PNG
              {isEditing && (
                <span className="ob-edit-note">
                  <br />
                  <strong>Note:</strong> To update a document, upload a new file. Existing documents will be replaced.
                </span>
              )}
            </p>
            
            <div className="ob-documents-upload">
              {/* Aadhaar Card */}
              <div className="ob-document-item">
                <div className="ob-document-header">
                  <label>Aadhaar Card</label>
                  <div className="ob-file-input-wrapper">
                    <input
                      type="file"
                      onChange={(e) => handleFileChange(e, 'aadhaar')}
                      accept=".pdf,.jpg,.jpeg,.png"
                      id="aadhaar-file"
                      className="ob-file-input"
                    />
                    <label htmlFor="aadhaar-file" className="ob-file-upload-btn">
                      {documentFiles.aadhaar ? 'Change File' : 'Choose File'}
                    </label>
                  </div>
                </div>
                {(documentFiles.aadhaar || formData.aadhaar) && (
                  <div className="ob-file-preview">
                    {documentFiles.aadhaar?.preview && documentFiles.aadhaar.type?.startsWith('image/') ? (
                      <img src={documentFiles.aadhaar.preview} alt="Aadhaar preview" className="ob-file-preview-image" />
                    ) : null}
                    <span className="ob-file-name">
                      {documentFiles.aadhaar?.name || (formData.aadhaar instanceof File ? formData.aadhaar.name : 'Aadhaar Document')}
                    </span>
                    {documentFiles.aadhaar?.size && (
                      <span className="ob-file-size">
                        ({(documentFiles.aadhaar.size / 1024).toFixed(2)} KB)
                      </span>
                    )}
                    {documentFiles.aadhaar?.uploadedAt && (
                      <span className="ob-file-uploaded">
                        Uploaded: {new Date(documentFiles.aadhaar.uploadedAt).toLocaleDateString()}
                      </span>
                    )}
                    {documentFiles.aadhaar?.isExisting && (
                      <span className="ob-file-status">(Existing)</span>
                    )}
                    <button 
                      type="button" 
                      className="ob-btn-remove-file"
                      onClick={() => removeFile('aadhaar')}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Driving License */}
              <div className="ob-document-item">
                <div className="ob-document-header">
                  <label>Driving License</label>
                  <div className="ob-file-input-wrapper">
                    <input
                      type="file"
                      onChange={(e) => handleFileChange(e, 'drivingLicense')}
                      accept=".pdf,.jpg,.jpeg,.png"
                      id="driving-license-file"
                      className="ob-file-input"
                    />
                    <label htmlFor="driving-license-file" className="ob-file-upload-btn">
                      {documentFiles.drivingLicense ? 'Change File' : 'Choose File'}
                    </label>
                  </div>
                </div>
                {(documentFiles.drivingLicense || formData.drivingLicense) && (
                  <div className="ob-file-preview">
                    {documentFiles.drivingLicense?.preview && documentFiles.drivingLicense.type?.startsWith('image/') ? (
                      <img src={documentFiles.drivingLicense.preview} alt="Driving License preview" className="ob-file-preview-image" />
                    ) : null}
                    <span className="ob-file-name">
                      {documentFiles.drivingLicense?.name || (formData.drivingLicense instanceof File ? formData.drivingLicense.name : 'Driving License Document')}
                    </span>
                    {documentFiles.drivingLicense?.size && (
                      <span className="ob-file-size">
                        ({(documentFiles.drivingLicense.size / 1024).toFixed(2)} KB)
                      </span>
                    )}
                    {documentFiles.drivingLicense?.uploadedAt && (
                      <span className="ob-file-uploaded">
                        Uploaded: {new Date(documentFiles.drivingLicense.uploadedAt).toLocaleDateString()}
                      </span>
                    )}
                    {documentFiles.drivingLicense?.isExisting && (
                      <span className="ob-file-status">(Existing)</span>
                    )}
                    <button 
                      type="button" 
                      className="ob-btn-remove-file"
                      onClick={() => removeFile('drivingLicense')}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* PAN Card */}
              <div className="ob-document-item">
                <div className="ob-document-header">
                  <label>PAN Card</label>
                  <div className="ob-file-input-wrapper">
                    <input
                      type="file"
                      onChange={(e) => handleFileChange(e, 'panCard')}
                      accept=".pdf,.jpg,.jpeg,.png"
                      id="pan-file"
                      className="ob-file-input"
                    />
                    <label htmlFor="pan-file" className="ob-file-upload-btn">
                      {documentFiles.panCard ? 'Change File' : 'Choose File'}
                    </label>
                  </div>
                </div>
                {(documentFiles.panCard || formData.panCard) && (
                  <div className="ob-file-preview">
                    {documentFiles.panCard?.preview && documentFiles.panCard.type?.startsWith('image/') ? (
                      <img src={documentFiles.panCard.preview} alt="PAN Card preview" className="ob-file-preview-image" />
                    ) : null}
                    <span className="ob-file-name">
                      {documentFiles.panCard?.name || (formData.panCard instanceof File ? formData.panCard.name : 'PAN Card Document')}
                    </span>
                    {documentFiles.panCard?.size && (
                      <span className="ob-file-size">
                        ({(documentFiles.panCard.size / 1024).toFixed(2)} KB)
                      </span>
                    )}
                    {documentFiles.panCard?.uploadedAt && (
                      <span className="ob-file-uploaded">
                        Uploaded: {new Date(documentFiles.panCard.uploadedAt).toLocaleDateString()}
                      </span>
                    )}
                    {documentFiles.panCard?.isExisting && (
                      <span className="ob-file-status">(Existing)</span>
                    )}
                    <button 
                      type="button" 
                      className="ob-btn-remove-file"
                      onClick={() => removeFile('panCard')}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* 10th Certificate */}
              <div className="ob-document-item">
                <div className="ob-document-header">
                  <label>10th Educational Certificate</label>
                  <div className="ob-file-input-wrapper">
                    <input
                      type="file"
                      onChange={(e) => handleFileChange(e, 'tenthCertificate')}
                      accept=".pdf,.jpg,.jpeg,.png"
                      id="tenth-certificate-file"
                      className="ob-file-input"
                    />
                    <label htmlFor="tenth-certificate-file" className="ob-file-upload-btn">
                      {documentFiles.tenthCertificate ? 'Change File' : 'Choose File'}
                    </label>
                  </div>
                </div>
                {(documentFiles.tenthCertificate || formData.tenthCertificate) && (
                  <div className="ob-file-preview">
                    {documentFiles.tenthCertificate?.preview && documentFiles.tenthCertificate.type?.startsWith('image/') ? (
                      <img src={documentFiles.tenthCertificate.preview} alt="10th Certificate preview" className="ob-file-preview-image" />
                    ) : null}
                    <span className="ob-file-name">
                      {documentFiles.tenthCertificate?.name || (formData.tenthCertificate instanceof File ? formData.tenthCertificate.name : '10th Certificate Document')}
                    </span>
                    {documentFiles.tenthCertificate?.size && (
                      <span className="ob-file-size">
                        ({(documentFiles.tenthCertificate.size / 1024).toFixed(2)} KB)
                      </span>
                    )}
                    {documentFiles.tenthCertificate?.uploadedAt && (
                      <span className="ob-file-uploaded">
                        Uploaded: {new Date(documentFiles.tenthCertificate.uploadedAt).toLocaleDateString()}
                      </span>
                    )}
                    {documentFiles.tenthCertificate?.isExisting && (
                      <span className="ob-file-status">(Existing)</span>
                    )}
                    <button 
                      type="button" 
                      className="ob-btn-remove-file"
                      onClick={() => removeFile('tenthCertificate')}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* 12th Certificate */}
              <div className="ob-document-item">
                <div className="ob-document-header">
                  <label>12th Educational Certificate</label>
                  <div className="ob-file-input-wrapper">
                    <input
                      type="file"
                      onChange={(e) => handleFileChange(e, 'twelfthCertificate')}
                      accept=".pdf,.jpg,.jpeg,.png"
                      id="twelfth-certificate-file"
                      className="ob-file-input"
                    />
                    <label htmlFor="twelfth-certificate-file" className="ob-file-upload-btn">
                      {documentFiles.twelfthCertificate ? 'Change File' : 'Choose File'}
                    </label>
                  </div>
                </div>
                {(documentFiles.twelfthCertificate || formData.twelfthCertificate) && (
                  <div className="ob-file-preview">
                    {documentFiles.twelfthCertificate?.preview && documentFiles.twelfthCertificate.type?.startsWith('image/') ? (
                      <img src={documentFiles.twelfthCertificate.preview} alt="12th Certificate preview" className="ob-file-preview-image" />
                    ) : null}
                    <span className="ob-file-name">
                      {documentFiles.twelfthCertificate?.name || (formData.twelfthCertificate instanceof File ? formData.twelfthCertificate.name : '12th Certificate Document')}
                    </span>
                    {documentFiles.twelfthCertificate?.size && (
                      <span className="ob-file-size">
                        ({(documentFiles.twelfthCertificate.size / 1024).toFixed(2)} KB)
                      </span>
                    )}
                    {documentFiles.twelfthCertificate?.uploadedAt && (
                      <span className="ob-file-uploaded">
                        Uploaded: {new Date(documentFiles.twelfthCertificate.uploadedAt).toLocaleDateString()}
                      </span>
                    )}
                    {documentFiles.twelfthCertificate?.isExisting && (
                      <span className="ob-file-status">(Existing)</span>
                    )}
                    <button 
                      type="button" 
                      className="ob-btn-remove-file"
                      onClick={() => removeFile('twelfthCertificate')}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Degree/Diploma Certificate */}
              <div className="ob-document-item">
                <div className="ob-document-header">
                  <label>Degree/Diploma Certificate</label>
                  <div className="ob-file-input-wrapper">
                    <input
                      type="file"
                      onChange={(e) => handleFileChange(e, 'degreeCertificate')}
                      accept=".pdf,.jpg,.jpeg,.png"
                      id="degree-certificate-file"
                      className="ob-file-input"
                    />
                    <label htmlFor="degree-certificate-file" className="ob-file-upload-btn">
                      {documentFiles.degreeCertificate ? 'Change File' : 'Choose File'}
                    </label>
                  </div>
                </div>
                {(documentFiles.degreeCertificate || formData.degreeCertificate) && (
                  <div className="ob-file-preview">
                    {documentFiles.degreeCertificate?.preview && documentFiles.degreeCertificate.type?.startsWith('image/') ? (
                      <img src={documentFiles.degreeCertificate.preview} alt="Degree Certificate preview" className="ob-file-preview-image" />
                    ) : null}
                    <span className="ob-file-name">
                      {documentFiles.degreeCertificate?.name || (formData.degreeCertificate instanceof File ? formData.degreeCertificate.name : 'Degree Certificate Document')}
                    </span>
                    {documentFiles.degreeCertificate?.size && (
                      <span className="ob-file-size">
                        ({(documentFiles.degreeCertificate.size / 1024).toFixed(2)} KB)
                      </span>
                    )}
                    {documentFiles.degreeCertificate?.uploadedAt && (
                      <span className="ob-file-uploaded">
                        Uploaded: {new Date(documentFiles.degreeCertificate.uploadedAt).toLocaleDateString()}
                      </span>
                    )}
                    {documentFiles.degreeCertificate?.isExisting && (
                      <span className="ob-file-status">(Existing)</span>
                    )}
                    <button 
                      type="button" 
                      className="ob-btn-remove-file"
                      onClick={() => removeFile('degreeCertificate')}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Passport */}
              <div className="ob-document-item">
                <div className="ob-document-header">
                  <label>Passport</label>
                  <div className="ob-file-input-wrapper">
                    <input
                      type="file"
                      onChange={(e) => handleFileChange(e, 'passport')}
                      accept=".pdf,.jpg,.jpeg,.png"
                      id="passport-file"
                      className="ob-file-input"
                    />
                    <label htmlFor="passport-file" className="ob-file-upload-btn">
                      {documentFiles.passport ? 'Change File' : 'Choose File'}
                    </label>
                  </div>
                </div>
                {(documentFiles.passport || formData.passport) && (
                  <div className="ob-file-preview">
                    {documentFiles.passport?.preview && documentFiles.passport.type?.startsWith('image/') ? (
                      <img src={documentFiles.passport.preview} alt="Passport preview" className="ob-file-preview-image" />
                    ) : null}
                    <span className="ob-file-name">
                      {documentFiles.passport?.name || (formData.passport instanceof File ? formData.passport.name : 'Passport Document')}
                    </span>
                    {documentFiles.passport?.size && (
                      <span className="ob-file-size">
                        ({(documentFiles.passport.size / 1024).toFixed(2)} KB)
                      </span>
                    )}
                    {documentFiles.passport?.uploadedAt && (
                      <span className="ob-file-uploaded">
                        Uploaded: {new Date(documentFiles.passport.uploadedAt).toLocaleDateString()}
                      </span>
                    )}
                    {documentFiles.passport?.isExisting && (
                      <span className="ob-file-status">(Existing)</span>
                    )}
                    <button 
                      type="button" 
                      className="ob-btn-remove-file"
                      onClick={() => removeFile('passport')}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Bank Passbook */}
              <div className="ob-document-item">
                <div className="ob-document-header">
                  <label>Bank Passbook</label>
                  <div className="ob-file-input-wrapper">
                    <input
                      type="file"
                      onChange={(e) => handleFileChange(e, 'bankPassbook')}
                      accept=".pdf,.jpg,.jpeg,.png"
                      id="bank-passbook-file"
                      className="ob-file-input"
                    />
                    <label htmlFor="bank-passbook-file" className="ob-file-upload-btn">
                      {documentFiles.bankPassbook ? 'Change File' : 'Choose File'}
                    </label>
                  </div>
                </div>
                {(documentFiles.bankPassbook || formData.bankPassbook) && (
                  <div className="ob-file-preview">
                    {documentFiles.bankPassbook?.preview && documentFiles.bankPassbook.type?.startsWith('image/') ? (
                      <img src={documentFiles.bankPassbook.preview} alt="Bank Passbook preview" className="ob-file-preview-image" />
                    ) : null}
                    <span className="ob-file-name">
                      {documentFiles.bankPassbook?.name || (formData.bankPassbook instanceof File ? formData.bankPassbook.name : 'Bank Passbook Document')}
                    </span>
                    {documentFiles.bankPassbook?.size && (
                      <span className="ob-file-size">
                        ({(documentFiles.bankPassbook.size / 1024).toFixed(2)} KB)
                      </span>
                    )}
                    {documentFiles.bankPassbook?.uploadedAt && (
                      <span className="ob-file-uploaded">
                        Uploaded: {new Date(documentFiles.bankPassbook.uploadedAt).toLocaleDateString()}
                      </span>
                    )}
                    {documentFiles.bankPassbook?.isExisting && (
                      <span className="ob-file-status">(Existing)</span>
                    )}
                    <button 
                      type="button" 
                      className="ob-btn-remove-file"
                      onClick={() => removeFile('bankPassbook')}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* EPFO Service History */}
              <div className="ob-document-item">
                <div className="ob-document-header">
                  <label>EPFO Service History</label>
                  <div className="ob-file-input-wrapper">
                    <input
                      type="file"
                      onChange={(e) => handleFileChange(e, 'epfoServiceHistory')}
                      accept=".pdf,.jpg,.jpeg,.png"
                      id="epfo-service-history-file"
                      className="ob-file-input"
                    />
                    <label htmlFor="epfo-service-history-file" className="ob-file-upload-btn">
                      {documentFiles.epfoServiceHistory ? 'Change File' : 'Choose File'}
                    </label>
                  </div>
                </div>
                {(documentFiles.epfoServiceHistory || formData.epfoServiceHistory) && (
                  <div className="ob-file-preview">
                    {documentFiles.epfoServiceHistory?.preview && documentFiles.epfoServiceHistory.type?.startsWith('image/') ? (
                      <img src={documentFiles.epfoServiceHistory.preview} alt="EPFO Service History preview" className="ob-file-preview-image" />
                    ) : null}
                    <span className="ob-file-name">
                      {documentFiles.epfoServiceHistory?.name || (formData.epfoServiceHistory instanceof File ? formData.epfoServiceHistory.name : 'EPFO Service History Document')}
                    </span>
                    {documentFiles.epfoServiceHistory?.size && (
                      <span className="ob-file-size">
                        ({(documentFiles.epfoServiceHistory.size / 1024).toFixed(2)} KB)
                      </span>
                    )}
                    {documentFiles.epfoServiceHistory?.uploadedAt && (
                      <span className="ob-file-uploaded">
                        Uploaded: {new Date(documentFiles.epfoServiceHistory.uploadedAt).toLocaleDateString()}
                      </span>
                    )}
                    {documentFiles.epfoServiceHistory?.isExisting && (
                      <span className="ob-file-status">(Existing)</span>
                    )}
                    <button 
                      type="button" 
                      className="ob-btn-remove-file"
                      onClick={() => removeFile('epfoServiceHistory')}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Payslip/Form 16 */}
              <div className="ob-document-item">
                <div className="ob-document-header">
                  <label>Latest Payslip/Form 16/Bank Statement</label>
                  <div className="ob-file-input-wrapper">
                    <input
                      type="file"
                      onChange={(e) => handleFileChange(e, 'payslipForm16')}
                      accept=".pdf,.jpg,.jpeg,.png"
                      id="payslip-form16-file"
                      className="ob-file-input"
                    />
                    <label htmlFor="payslip-form16-file" className="ob-file-upload-btn">
                      {documentFiles.payslipForm16 ? 'Change File' : 'Choose File'}
                    </label>
                  </div>
                </div>
                {(documentFiles.payslipForm16 || formData.payslipForm16) && (
                  <div className="ob-file-preview">
                    {documentFiles.payslipForm16?.preview && documentFiles.payslipForm16.type?.startsWith('image/') ? (
                      <img src={documentFiles.payslipForm16.preview} alt="Payslip/Form 16 preview" className="ob-file-preview-image" />
                    ) : null}
                    <span className="ob-file-name">
                      {documentFiles.payslipForm16?.name || (formData.payslipForm16 instanceof File ? formData.payslipForm16.name : 'Payslip/Form 16 Document')}
                    </span>
                    {documentFiles.payslipForm16?.size && (
                      <span className="ob-file-size">
                        ({(documentFiles.payslipForm16.size / 1024).toFixed(2)} KB)
                      </span>
                    )}
                    {documentFiles.payslipForm16?.uploadedAt && (
                      <span className="ob-file-uploaded">
                        Uploaded: {new Date(documentFiles.payslipForm16.uploadedAt).toLocaleDateString()}
                      </span>
                    )}
                    {documentFiles.payslipForm16?.isExisting && (
                      <span className="ob-file-status">(Existing)</span>
                    )}
                    <button 
                      type="button" 
                      className="ob-btn-remove-file"
                      onClick={() => removeFile('payslipForm16')}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Profile Picture */}
              <div className="ob-document-item">
                <div className="ob-document-header">
                  <label>Profile Picture</label>
                  <div className="ob-file-input-wrapper">
                    <input
                      type="file"
                      onChange={(e) => handleFileChange(e, 'profilePicture')}
                      accept=".jpg,.jpeg,.png"
                      id="profile-picture-file"
                      className="ob-file-input"
                    />
                    <label htmlFor="profile-picture-file" className="ob-file-upload-btn">
                      {documentFiles.profilePicture ? 'Change File' : 'Choose File'}
                    </label>
                  </div>
                </div>
                {(documentFiles.profilePicture || formData.profilePicture) && (
                  <div className="ob-file-preview">
                    {documentFiles.profilePicture?.preview && documentFiles.profilePicture.type?.startsWith('image/') ? (
                      <img src={documentFiles.profilePicture.preview} alt="Profile Picture preview" className="ob-file-preview-image" />
                    ) : null}
                    <span className="ob-file-name">
                      {documentFiles.profilePicture?.name || (formData.profilePicture instanceof File ? formData.profilePicture.name : 'Profile Picture')}
                    </span>
                    {documentFiles.profilePicture?.size && (
                      <span className="ob-file-size">
                        ({(documentFiles.profilePicture.size / 1024).toFixed(2)} KB)
                      </span>
                    )}
                    {documentFiles.profilePicture?.uploadedAt && (
                      <span className="ob-file-uploaded">
                        Uploaded: {new Date(documentFiles.profilePicture.uploadedAt).toLocaleDateString()}
                      </span>
                    )}
                    {documentFiles.profilePicture?.isExisting && (
                      <span className="ob-file-status">(Existing)</span>
                    )}
                    <button 
                      type="button" 
                      className="ob-btn-remove-file"
                      onClick={() => removeFile('profilePicture')}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Experience Letter */}
              <div className="ob-document-item">
                <div className="ob-document-header">
                  <label>Experience/Reference Letters</label>
                  <div className="ob-file-input-wrapper">
                    <input
                      type="file"
                      onChange={(e) => handleFileChange(e, 'experienceLetter')}
                      accept=".pdf,.jpg,.jpeg,.png"
                      id="experience-letter-file"
                      className="ob-file-input"
                    />
                    <label htmlFor="experience-letter-file" className="ob-file-upload-btn">
                      {documentFiles.experienceLetter ? 'Change File' : 'Choose File'}
                    </label>
                  </div>
                </div>
                {(documentFiles.experienceLetter || formData.experienceLetter) && (
                  <div className="ob-file-preview">
                    <span className="ob-file-name">
                      {documentFiles.experienceLetter?.name || (formData.experienceLetter instanceof File ? formData.experienceLetter.name : 'Experience Letter Document')}
                    </span>
                    {documentFiles.experienceLetter?.size && (
                      <span className="ob-file-size">
                        ({(documentFiles.experienceLetter.size / 1024).toFixed(2)} KB)
                      </span>
                    )}
                    {documentFiles.experienceLetter?.uploadedAt && (
                      <span className="ob-file-uploaded">
                        Uploaded: {new Date(documentFiles.experienceLetter.uploadedAt).toLocaleDateString()}
                      </span>
                    )}
                    {documentFiles.experienceLetter?.isExisting && (
                      <span className="ob-file-status">(Existing)</span>
                    )}
                    <button 
                      type="button" 
                      className="ob-btn-remove-file"
                      onClick={() => removeFile('experienceLetter')}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="ob-form-group ob-checkbox-group">
              <label className="ob-checkbox-label">
                <input
                  type="checkbox"
                  required
                  className="ob-form-checkbox"
                />
                I confirm that all information provided is accurate and complete
              </label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="ob-onboarding-form">
      {isEditing && (
        <div className="ob-edit-mode-banner">
          <strong> ✏️ Edit Mode:</strong> You are editing an existing submission. 
          Update the information below and click "Update Submission" to save changes.
        </div>
      )}
      
      <div className="ob-step-indicator">
        {steps.map((step) => (
          <div
            key={step.id}
            className={`ob-step ${activeStep === step.id ? 'ob-step-active' : ''} ${!isEditing ? 'ob-step-clickable' : ''}`}
            onClick={!isEditing ? () => setActiveStep(step.id) : undefined}
            title={!isEditing ? `Go to ${step.title}` : ''}
          >
            <div className="ob-step-number">{step.id}</div>
            <div className="ob-step-title">{step.title}</div>
          </div>
        ))}
      </div>

      {renderStepContent()}

      <div className="ob-form-actions">
        {activeStep > 1 && (
          <button type="button" className="ob-btn-secondary" onClick={handlePrev}>
            Back
          </button>
        )}
        
        {activeStep < steps.length ? (
          <button type="button" className="ob-btn-primary" onClick={handleNext}>
            Next
          </button>
        ) : (
          <button 
            type="submit" 
            className={`ob-btn-submit ${isEditing ? 'ob-btn-update' : ''}`}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="ob-loader-spinner"></span>
                {isEditing ? 'Updating...' : 'Submitting...'}
              </>
            ) : (
              isEditing ? 'Update Submission' : 'Submit Onboarding'
            )}
          </button>
        )}
        
        {isEditing && (
          <button 
            type="button" 
            className="ob-btn-cancel"
            onClick={() => {
              if (window.confirm('Cancel editing? All unsaved changes will be lost.')) {
                window.location.reload();
              }
            }}
            disabled={loading}
          >
            Cancel Edit
          </button>
        )}
      </div>
    </form>
  );
};

export default OnboardingForm;