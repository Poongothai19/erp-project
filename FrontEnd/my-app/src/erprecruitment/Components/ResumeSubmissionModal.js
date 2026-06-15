import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BASE_URL from '../../url';
import { formatName, formatJobTitle } from '../../Resume_Submission/utils/nameFormatter';
import { Loader2 } from 'lucide-react';

const ResumeSubmissionModal = ({ 
  selectedRole, 
  showResumeSubmissionModal, 
  closeResumeSubmissionModal,
  fetchApplications,
  showNotification,
  refreshRolesData
}) => {
  const [resumeSubmission, setResumeSubmission] = useState({
    email: '',
    phone: '',
    experience: '',
    currentCompany: '',
    expectedSalary: '',
    noticePeriod: '',
    location: '',
    skills: '',
    candidateFirstName: '',
    candidateLastName: '',
    dateOfBirth: '',
    workAuthorization: '',
    rate: '',
    currentLocation: '',
    linkedInUrl: '',
    passport: '',
    totalITExperience: '',
    relevantExperience: '',
    highestDegree: '',
    currentEmployer: '',
    currentEmployerAddress: '',
    isFormerTCSEmployee: false,
    tcsEmployeeId: '',
    isFormerTCSBusinessAssociate: false,
    tcsBusinessAssociateId: '',
    dateAvailability: ''
  });
  
  const [resumeFiles, setResumeFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isParsing, setIsParsing] = useState(false);

  useEffect(() => {
    if (showResumeSubmissionModal) {
      resetForm();
    }
  }, [showResumeSubmissionModal]);

  const resetForm = () => {
    setResumeSubmission({
      email: '',
      phone: '',
      experience: '',
      currentCompany: '',
      expectedSalary: '',
      noticePeriod: '',
      location: '',
      skills: '',
      candidateFirstName: '',
      candidateLastName: '',
      dateOfBirth: '',
      workAuthorization: '',
      rate: '',
      currentLocation: '',
      linkedInUrl: '',
      passport: '',
      totalITExperience: '',
      relevantExperience: '',
      highestDegree: '',
      currentEmployer: '',
      currentEmployerAddress: '',
      isFormerTCSEmployee: false,
      tcsEmployeeId: '',
      isFormerTCSBusinessAssociate: false,
      tcsBusinessAssociateId: '',
      dateAvailability: ''
    });
    setResumeFiles([]);
    setIsSubmitting(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.target.type !== 'textarea' && e.target.type !== 'submit') {
      e.preventDefault();
    }
  };

  const handleResumeParse = async (file) => {
    if (!file) return;
    
    setIsParsing(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file1', file);

      const response = await axios.post(`${BASE_URL}/api/resumes/parse`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data) {
        const data = response.data;
        
        // Map parsed data to form fields
        setResumeSubmission(prev => ({
          ...prev,
          candidateFirstName: formatName(data.firstName || prev.candidateFirstName),
          candidateLastName: formatName(data.lastName || prev.candidateLastName),
          email: data.email || prev.email,
          phone: data.phone || data.mobile || prev.phone,
          totalITExperience: data.yearsOfExperience ? `${data.yearsOfExperience} years` : prev.totalITExperience,
          experience: data.yearsOfExperience ? String(data.yearsOfExperience) : prev.experience,
          currentLocation: data.currentLocation || prev.currentLocation,
          location: data.currentLocation || prev.location,
          linkedInUrl: data.linkedInUrl || prev.linkedInUrl,
          workAuthorization: data.workAuthorization || prev.workAuthorization,
          skills: data.skills ? (Array.isArray(data.skills) ? data.skills.map(s => typeof s === 'string' ? s : (s.skill_name || s.SkillName)).join(', ') : data.skills) : prev.skills,
          currentCompany: data.workExperience?.[0]?.company || data.workExperience?.[0]?.Company || prev.currentCompany,
          currentEmployer: data.workExperience?.[0]?.company || data.workExperience?.[0]?.Company || prev.currentEmployer,
          highestDegree: data.education?.[0]?.degree || data.education?.[0]?.Degree || prev.highestDegree,
        }));
        
        showNotification('Resume parsed and details autofilled!');
      }
    } catch (error) {
      console.error('Error parsing resume:', error);
      showNotification('Failed to parse resume details. You can still fill them manually.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleResumeSubmissionChange = (e) => {
    const { name, value, files } = e.target;

    if (name === 'resumeFiles' && files && files.length > 0) {
      const newFiles = Array.from(files);

      const validFiles = newFiles.filter(file => {
        if (file.size > 5 * 1024 * 1024) {
          showNotification(`File ${file.name} exceeds 5MB limit`);
          return false;
        }

        const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!allowedTypes.includes(file.type)) {
          showNotification(`File ${file.name} is not a PDF, DOC, or DOCX`);
          return false;
        }

        return true;
      });

      if (validFiles.length > 0) {
        setResumeFiles(prev => [...prev, ...validFiles]);
        // Trigger parsing for the first selected file if nothing is filled yet
        if (resumeFiles.length === 0) {
          handleResumeParse(validFiles[0]);
        }
      }
      e.target.value = '';
    } else {
      setResumeSubmission(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const removeResumeFile = (index) => {
    setResumeFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleResumeSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');

      // REMOVED MANDATORY VALIDATION - all fields are optional now
      const formData = new FormData();
      formData.append('roleId', selectedRole.id);
      
      formData.append('email', resumeSubmission.email?.trim().toLowerCase() || '');
      formData.append('phone', resumeSubmission.phone?.trim() || '');
      formData.append('experience', resumeSubmission.experience?.trim() || '');
      formData.append('currentCompany', resumeSubmission.currentCompany?.trim() || '');
      formData.append('expectedSalary', resumeSubmission.expectedSalary?.trim() || '');
      formData.append('noticePeriod', resumeSubmission.noticePeriod?.trim() || '');
      formData.append('location', resumeSubmission.location?.trim() || '');
      formData.append('skills', resumeSubmission.skills?.trim() || '');
      
      formData.append('candidateFirstName', resumeSubmission.candidateFirstName?.trim() || '');
      formData.append('candidateLastName', resumeSubmission.candidateLastName?.trim() || '');
      formData.append('dateOfBirth', resumeSubmission.dateOfBirth || '');
      formData.append('workAuthorization', resumeSubmission.workAuthorization || '');
      formData.append('rate', resumeSubmission.rate?.trim() || '');
      formData.append('currentLocation', resumeSubmission.currentLocation?.trim() || '');
      formData.append('linkedInUrl', resumeSubmission.linkedInUrl?.trim() || '');
      formData.append('passport', resumeSubmission.passport?.trim() || '');
      formData.append('totalITExperience', resumeSubmission.totalITExperience?.trim() || '');
      formData.append('relevantExperience', resumeSubmission.relevantExperience?.trim() || '');
      formData.append('highestDegree', resumeSubmission.highestDegree?.trim() || '');
      formData.append('currentEmployer', resumeSubmission.currentEmployer?.trim() || '');
      formData.append('currentEmployerAddress', resumeSubmission.currentEmployerAddress?.trim() || '');
      formData.append('isFormerTCSEmployee', resumeSubmission.isFormerTCSEmployee ? 'true' : 'false');
      formData.append('tcsEmployeeId', resumeSubmission.tcsEmployeeId?.trim() || '');
      formData.append('isFormerTCSBusinessAssociate', resumeSubmission.isFormerTCSBusinessAssociate ? 'true' : 'false');
      formData.append('tcsBusinessAssociateId', resumeSubmission.tcsBusinessAssociateId?.trim() || '');
      formData.append('dateAvailability', resumeSubmission.dateAvailability || '');

      resumeFiles.forEach((file, index) => {
        formData.append('resume', file);
      });

      console.log('Submitting application with data:', {
        roleId: selectedRole.id,
        candidateFirstName: resumeSubmission.candidateFirstName || '',
        candidateLastName: resumeSubmission.candidateLastName || '',
        email: resumeSubmission.email || '',
      });

      const response = await axios.post(
        `${BASE_URL}/api/recruitment/applications`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        }
      );

      console.log('Application submitted successfully:', response.data);

      await fetchApplications(selectedRole.id);

      if (refreshRolesData) {
        await refreshRolesData();
      }

      closeResumeSubmissionModal();
      showNotification('Resume submitted successfully!');

    } catch (error) {
      console.error('Error submitting resume:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);

      if (error.response) {
        const status = error.response.status;
        const errorData = error.response.data;

        if (status === 409) {
          showNotification('This candidate has already applied for this role.');
        } else if (status === 404) {
          showNotification('Role not found. Please refresh and try again.');
        } else if (status === 400) {
          showNotification(errorData.message || 'Invalid data provided. Please check all fields.');
        } else if (status === 401) {
          showNotification('Authentication failed. Please log in again.');
        } else if (status === 413) {
          showNotification('File size too large. Please upload a smaller file.');
        } else if (status === 415) {
          showNotification('Unsupported file type. Please upload PDF, DOC, or DOCX files only.');
        } else if (status === 500) {
          showNotification('Server error occurred. Please try again later.');
        } else {
          showNotification(errorData.message || `Error ${status}: ${error.response.statusText}`);
        }
      } else if (error.request) {
        showNotification('Network error. Please check your connection.');
      } else {
        showNotification('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    closeResumeSubmissionModal();
  };

  if (!selectedRole || !showResumeSubmissionModal) return null;

  return (
    <div
      id="resume-submission-modal"
      className="recruitment-modal"
      onClick={(e) => {
        if (e.target.id === 'resume-submission-modal') {
          // Remove outside click functionality
        }
      }}
    >
      <div className="recruitment-modal-content" style={{ maxWidth: '800px', maxHeight: '90vh', overflow: 'auto' }}>
        <div className="recruitment-modal-header">
          <h2>Submit Resume - {selectedRole.role}</h2>
          <span className="recruitment-close" onClick={handleClose}>&times;</span>
        </div>
        <div className="recruitment-modal-body">
          <form onSubmit={handleResumeSubmit} className="recruitment-resume-form" onKeyDown={handleKeyDown}>
            {/* Resume Upload Section */}
            <div className="form-section" style={{ marginBottom: '25px' }}>
              <h3 style={{ color: '#1a6f66ff', marginBottom: '15px', borderBottom: '1px solid #e0e0e0', paddingBottom: '8px' }}>
                Resume Upload
              </h3>

              <div className="recruitment-form-group full-width">
                <label style={{ fontWeight: 'bold', color: '#1a6f66', marginBottom: '10px', display: 'block' }}>
                  Resume Files (Multiple files allowed)
                </label>


                <input
                  type="file"
                  name="resumeFiles"
                  id="resume-file-input"
                  onChange={handleResumeSubmissionChange}
                  accept=".pdf,.doc,.docx"
                  style={{ display: 'none' }}
                  multiple
                />

                <div
                  onClick={() => document.getElementById('resume-file-input').click()}
                  style={{
                    padding: '20px',
                    border: '2px dashed #1a6f66',
                    borderRadius: '8px',
                    backgroundColor: isParsing ? '#f0f0f0' : '#e6f7ef',
                    cursor: isParsing ? 'not-allowed' : 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.3s ease',
                    position: 'relative'
                  }}
                >
                  {isParsing ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                      <Loader2 className="animate-spin" size={24} style={{ color: '#1a6f66' }} />
                      <div style={{ color: '#1a6f66', fontWeight: 'bold' }}>Parsing resume...</div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ color: '#1a6f66', fontWeight: 'bold', marginBottom: '5px' }}>
                        Click to browse or drag and drop
                      </div>
                      <div style={{ color: '#666', fontSize: '12px' }}>
                        Accepted formats: PDF, DOC, DOCX (Max 5MB per file)
                      </div>
                    </div>
                  )}
                </div>

                {resumeFiles.length > 0 && (
                  <div style={{ marginTop: '15px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Selected files:</div>
                    {resumeFiles.map((file, index) => (
                      <div key={index} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px',
                        backgroundColor: '#e6f7ef',
                        borderRadius: '4px',
                        marginBottom: '5px'
                      }}>
                        <span style={{ fontSize: '14px' }}>{file.name}</span>
                        <button
                          type="button"
                          onClick={() => removeResumeFile(index)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ff4757',
                            cursor: 'pointer',
                            fontSize: '16px'
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Personal Information Section */}
            <div className="form-section" style={{ marginBottom: '25px' }}>
              <h3 style={{ color: '#1a6f66ff', marginBottom: '15px', borderBottom: '1px solid #e0e0e0', paddingBottom: '8px' }}>
                Personal Information
              </h3>

              <div className="recruitment-form-row">
                <div className="recruitment-form-group">
                  <label>First Name</label> {/* REMOVED * */}
                  <input
                    type="text"
                    name="candidateFirstName"
                    value={resumeSubmission.candidateFirstName}
                    onChange={handleResumeSubmissionChange}
                    placeholder="Enter first name"
                    className="recruitment-form-input"
                    // REMOVED required attribute
                  />
                </div>
                <div className="recruitment-form-group">
                  <label>Last Name</label> {/* REMOVED * */}
                  <input
                    type="text"
                    name="candidateLastName"
                    value={resumeSubmission.candidateLastName}
                    onChange={handleResumeSubmissionChange}
                    placeholder="Enter last name"
                    className="recruitment-form-input"
                    // REMOVED required attribute
                  />
                </div>
              </div>

              <div className="recruitment-form-row">
                <div className="recruitment-form-group">
                  <label>Date of Birth</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={resumeSubmission.dateOfBirth}
                    onChange={handleResumeSubmissionChange}
                    className="recruitment-form-input"
                  />
                </div>
                <div className="recruitment-form-group">
                  <label>Email</label> {/* REMOVED * */}
                  <input
                    type="email"
                    name="email"
                    value={resumeSubmission.email}
                    onChange={handleResumeSubmissionChange}
                    placeholder="Enter email address"
                    className="recruitment-form-input"
                    // REMOVED required attribute
                  />
                </div>
              </div>

              <div className="recruitment-form-row">
                <div className="recruitment-form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={resumeSubmission.phone}
                    onChange={handleResumeSubmissionChange}
                    placeholder="Enter phone number"
                    className="recruitment-form-input"
                  />
                </div>
                <div className="recruitment-form-group">
                  <label>Current Location</label>
                  <input
                    type="text"
                    name="currentLocation"
                    value={resumeSubmission.currentLocation}
                    onChange={handleResumeSubmissionChange}
                    placeholder="Enter current location"
                    className="recruitment-form-input"
                  />
                </div>
              </div>

              <div className="recruitment-form-row">
                <div className="recruitment-form-group">
                  <label>LinkedIn URL</label>
                  <input
                    type="url"
                    name="linkedInUrl"
                    value={resumeSubmission.linkedInUrl}
                    onChange={handleResumeSubmissionChange}
                    placeholder="Enter LinkedIn profile URL"
                    className="recruitment-form-input"
                  />
                </div>
                <div className="recruitment-form-group">
                  <label>Passport Number</label>
                  <input
                    type="text"
                    name="passport"
                    value={resumeSubmission.passport}
                    onChange={handleResumeSubmissionChange}
                    placeholder="Enter passport number"
                    className="recruitment-form-input"
                  />
                </div>
              </div>

              <div className="recruitment-form-row">
                <div className="recruitment-form-group">
                  <label>Work Authorization</label>
                  <select
                    name="workAuthorization"
                    value={resumeSubmission.workAuthorization}
                    onChange={handleResumeSubmissionChange}
                    className="recruitment-form-input"
                  >
                    <option value="">Select Work Authorization</option>
                    <option value="US Citizen">US Citizen</option>
                    <option value="Green Card">Green Card</option>
                    <option value="H-1B">H-1B</option>
                    <option value="L-1">L-1</option>
                    <option value="F-1">F-1</option>
                    <option value="OPT">OPT</option>
                    <option value="CPT">CPT</option>
                    <option value="TN Visa">TN Visa</option>
                    <option value="E-3">E-3</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="recruitment-form-group">
                  <label>Date Availability</label>
                  <input
                    type="date"
                    name="dateAvailability"
                    value={resumeSubmission.dateAvailability}
                    onChange={handleResumeSubmissionChange}
                    className="recruitment-form-input"
                  />
                </div>
              </div>
            </div>

            {/* Professional Information Section */}
            <div className="form-section" style={{ marginBottom: '25px' }}>
              <h3 style={{ color: '#1a6f66ff', marginBottom: '15px', borderBottom: '1px solid #e0e0e0', paddingBottom: '8px' }}>
                Professional Information
              </h3>

              <div className="recruitment-form-row">
                <div className="recruitment-form-group">
                  <label>Total IT Experience</label>
                  <input
                    type="text"
                    name="totalITExperience"
                    value={resumeSubmission.totalITExperience}
                    onChange={handleResumeSubmissionChange}
                    placeholder="e.g., 5 years"
                    className="recruitment-form-input"
                  />
                </div>
                <div className="recruitment-form-group">
                  <label>Relevant Experience</label>
                  <input
                    type="text"
                    name="relevantExperience"
                    value={resumeSubmission.relevantExperience}
                    onChange={handleResumeSubmissionChange}
                    placeholder="e.g., 3 years"
                    className="recruitment-form-input"
                  />
                </div>
              </div>

              <div className="recruitment-form-row">
                <div className="recruitment-form-group">
                  <label>Current Company</label>
                  <input
                    type="text"
                    name="currentCompany"
                    value={resumeSubmission.currentCompany}
                    onChange={handleResumeSubmissionChange}
                    placeholder="Enter current company"
                    className="recruitment-form-input"
                  />
                </div>
                <div className="recruitment-form-group">
                  <label>Current Employer</label>
                  <input
                    type="text"
                    name="currentEmployer"
                    value={resumeSubmission.currentEmployer}
                    onChange={handleResumeSubmissionChange}
                    placeholder="Enter current employer"
                    className="recruitment-form-input"
                  />
                </div>
              </div>

              <div className="recruitment-form-row">
                <div className="recruitment-form-group">
                  <label>Expected Salary/Rate</label>
                  <input
                    type="text"
                    name="rate"
                    value={resumeSubmission.rate}
                    onChange={handleResumeSubmissionChange}
                    placeholder="e.g., $50/hr or 12 LPA"
                    className="recruitment-form-input"
                  />
                </div>
                <div className="recruitment-form-group">
                  <label>Highest Degree</label>
                  <input
                    type="text"
                    name="highestDegree"
                    value={resumeSubmission.highestDegree}
                    onChange={handleResumeSubmissionChange}
                    placeholder="e.g., Bachelor of Engineering"
                    className="recruitment-form-input"
                  />
                </div>
              </div>

              <div className="recruitment-form-row">
                <div className="recruitment-form-group">
                  <label>Notice Period</label>
                  <input
                    type="text"
                    name="noticePeriod"
                    value={resumeSubmission.noticePeriod}
                    onChange={handleResumeSubmissionChange}
                    placeholder="e.g., 30 days"
                    className="recruitment-form-input"
                  />
                </div>
                <div className="recruitment-form-group">
                  {/* Empty div for alignment */}
                </div>
              </div>

              <div className="recruitment-form-group full-width">
                <label>Skills</label>
                <textarea
                  name="skills"
                  value={resumeSubmission.skills}
                  onChange={handleResumeSubmissionChange}
                  placeholder="Enter key skills separated by commas"
                  className="recruitment-form-textarea"
                  rows="3"
                />
              </div>

              <div className="recruitment-form-group full-width">
                <label>Current Employer Address</label>
                <textarea
                  name="currentEmployerAddress"
                  value={resumeSubmission.currentEmployerAddress}
                  onChange={handleResumeSubmissionChange}
                  placeholder="Enter current employer address"
                  className="recruitment-form-textarea"
                  rows="2"
                />
              </div>
            </div>

            {/* TCS Information Section */}
            <div className="form-section" style={{ marginBottom: '25px' }}>
              <h3 style={{ color: '#1a6f66ff', marginBottom: '15px', borderBottom: '1px solid #e0e0e0', paddingBottom: '8px' }}>
                TCS Information
              </h3>

              <div className="recruitment-form-row">
                <div className="recruitment-form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      name="isFormerTCSEmployee"
                      checked={resumeSubmission.isFormerTCSEmployee}
                      onChange={(e) => setResumeSubmission(prev => ({
                        ...prev,
                        isFormerTCSEmployee: e.target.checked
                      }))}
                    />
                    Former TCS Employee
                  </label>
                </div>
                <div className="recruitment-form-group">
                  <label>TCS Employee ID</label>
                  <input
                    type="text"
                    name="tcsEmployeeId"
                    value={resumeSubmission.tcsEmployeeId}
                    onChange={handleResumeSubmissionChange}
                    placeholder="Enter TCS employee ID"
                    className="recruitment-form-input"
                    disabled={!resumeSubmission.isFormerTCSEmployee}
                  />
                </div>
              </div>

              <div className="recruitment-form-row">
                <div className="recruitment-form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      name="isFormerTCSBusinessAssociate"
                      checked={resumeSubmission.isFormerTCSBusinessAssociate}
                      onChange={(e) => setResumeSubmission(prev => ({
                        ...prev,
                        isFormerTCSBusinessAssociate: e.target.checked
                      }))}
                    />
                    Former TCS Business Associate
                  </label>
                </div>
                <div className="recruitment-form-group">
                  <label>TCS Business Associate ID</label>
                  <input
                    type="text"
                    name="tcsBusinessAssociateId"
                    value={resumeSubmission.tcsBusinessAssociateId}
                    onChange={handleResumeSubmissionChange}
                    placeholder="Enter TCS business associate ID"
                    className="recruitment-form-input"
                    disabled={!resumeSubmission.isFormerTCSBusinessAssociate}
                  />
                </div>
              </div>
            </div>



            <div className="recruitment-form-actions">
              <button
                type="button"
                className="recruitment-cancel-btn"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="recruitment-submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Resume'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResumeSubmissionModal;