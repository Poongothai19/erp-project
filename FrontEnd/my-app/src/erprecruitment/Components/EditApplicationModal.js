import React, { useState } from 'react';
import axios from 'axios';
import BASE_URL from '../../url';

const EditApplicationModal = ({
  showEditApplicationModal,
  applicationToEdit,
  closeEditApplicationModal,
  fetchApplications,
  selectedRole,
  showNotification,
  applicationResumes,
  fetchApplicationResumes,
  viewResume
}) => {
  const [editApplicationData, setEditApplicationData] = useState({
    email: '',
    phone: '',
    experience: '',
    currentCompany: '',
    expectedSalary: '',
    noticePeriod: '',
    location: '',
    skills: '',
    resumeFiles: null,
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

  const [resumeLoading, setResumeLoading] = useState(false);

  // Initialize form data when applicationToEdit changes
  React.useEffect(() => {
    if (applicationToEdit) {
      let candidateFirstName = applicationToEdit.candidateFirstName || '';
      let candidateLastName = applicationToEdit.candidateLastName || '';
      
      if (!candidateFirstName && !candidateLastName && applicationToEdit.name) {
        const nameParts = applicationToEdit.name.split(' ');
        candidateFirstName = nameParts[0] || '';
        candidateLastName = nameParts.slice(1).join(' ') || '';
      }

      setEditApplicationData({
        email: applicationToEdit.email || '',
        phone: applicationToEdit.phone || '',
        experience: applicationToEdit.experience || '',
        currentCompany: applicationToEdit.currentCompany || '',
        expectedSalary: applicationToEdit.expectedSalary || '',
        noticePeriod: applicationToEdit.noticePeriod || '',
        location: applicationToEdit.location || '',
        skills: applicationToEdit.skills || '',
        resumeFiles: null,
        candidateFirstName: candidateFirstName,
        candidateLastName: candidateLastName,
        dateOfBirth: applicationToEdit.dateOfBirth || '',
        workAuthorization: applicationToEdit.workAuthorization || '',
        rate: applicationToEdit.rate || '',
        currentLocation: applicationToEdit.currentLocation || '',
        linkedInUrl: applicationToEdit.linkedInUrl || '',
        passport: applicationToEdit.passport || '',
        totalITExperience: applicationToEdit.totalITExperience || '',
        relevantExperience: applicationToEdit.relevantExperience || '',
        highestDegree: applicationToEdit.highestDegree || '',
        currentEmployer: applicationToEdit.currentEmployer || '',
        currentEmployerAddress: applicationToEdit.currentEmployerAddress || '',
        isFormerTCSEmployee: applicationToEdit.isFormerTCSEmployee || false,
        tcsEmployeeId: applicationToEdit.tcsEmployeeId || '',
        isFormerTCSBusinessAssociate: applicationToEdit.isFormerTCSBusinessAssociate || false,
        tcsBusinessAssociateId: applicationToEdit.tcsBusinessAssociateId || '',
        dateAvailability: applicationToEdit.dateAvailability || ''
      });
    }
  }, [applicationToEdit]);

  const handleEditApplicationChange = (e) => {
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

      setEditApplicationData(prev => ({
        ...prev,
        resumeFiles: validFiles
      }));

      e.target.value = '';
    } else {
      setEditApplicationData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleEditApplicationSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');

      const formData = new FormData();
      
      formData.append('email', editApplicationData.email?.trim().toLowerCase() || '');
      formData.append('phone', editApplicationData.phone?.trim() || '');
      formData.append('experience', editApplicationData.experience?.trim() || '');
      formData.append('currentCompany', editApplicationData.currentCompany?.trim() || '');
      formData.append('expectedSalary', editApplicationData.expectedSalary?.trim() || '');
      formData.append('noticePeriod', editApplicationData.noticePeriod?.trim() || '');
      formData.append('location', editApplicationData.location?.trim() || '');
      formData.append('skills', editApplicationData.skills?.trim() || '');
      
      formData.append('candidateFirstName', editApplicationData.candidateFirstName?.trim() || '');
      formData.append('candidateLastName', editApplicationData.candidateLastName?.trim() || '');
      formData.append('dateOfBirth', editApplicationData.dateOfBirth || '');
      formData.append('workAuthorization', editApplicationData.workAuthorization || '');
      formData.append('rate', editApplicationData.rate?.trim() || '');
      formData.append('currentLocation', editApplicationData.currentLocation?.trim() || '');
      formData.append('linkedInUrl', editApplicationData.linkedInUrl?.trim() || '');
      formData.append('passport', editApplicationData.passport?.trim() || '');
      formData.append('totalITExperience', editApplicationData.totalITExperience?.trim() || '');
      formData.append('relevantExperience', editApplicationData.relevantExperience?.trim() || '');
      formData.append('highestDegree', editApplicationData.highestDegree?.trim() || '');
      formData.append('currentEmployer', editApplicationData.currentEmployer?.trim() || '');
      formData.append('currentEmployerAddress', editApplicationData.currentEmployerAddress?.trim() || '');
      formData.append('isFormerTCSEmployee', editApplicationData.isFormerTCSEmployee ? 'true' : 'false');
      formData.append('tcsEmployeeId', editApplicationData.tcsEmployeeId?.trim() || '');
      formData.append('isFormerTCSBusinessAssociate', editApplicationData.isFormerTCSBusinessAssociate ? 'true' : 'false');
      formData.append('tcsBusinessAssociateId', editApplicationData.tcsBusinessAssociateId?.trim() || '');
      formData.append('dateAvailability', editApplicationData.dateAvailability || '');

      if (editApplicationData.resumeFiles) {
        Array.from(editApplicationData.resumeFiles).forEach(file => {
          formData.append('resume', file);
        });
      }

      const response = await axios.put(
        `${BASE_URL}/api/recruitment/applications/${applicationToEdit.id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      await fetchApplications(selectedRole.id);

      closeEditApplicationModal();
      showNotification('Application updated successfully!');

    } catch (error) {
      console.error('Error updating application:', error);
      
      if (error.response?.data?.message) {
        showNotification(`Update failed: ${error.response.data.message}`);
      } else if (error.response?.data?.error) {
        showNotification(`Update failed: ${error.response.data.error}`);
      } else {
        showNotification('Failed to update application. Please try again.');
      }
    }
  };

  const handleDeleteResume = async (resumeId, resumeFileName) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${resumeFileName}"?\n\nThis action cannot be undone.`
    );

    if (confirmed) {
      try {
        setResumeLoading(true);
        const token = localStorage.getItem('token');
        await axios.delete(
          `${BASE_URL}/api/recruitment/applications/resumes/${resumeId}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        await fetchApplicationResumes(applicationToEdit.id);
        showNotification('Resume deleted successfully!');
      } catch (error) {
        console.error('Error deleting resume:', error);
        showNotification('Failed to delete resume. Please try again.');
      } finally {
        setResumeLoading(false);
      }
    }
  };

  const resetForm = () => {
    setEditApplicationData({
      email: '',
      phone: '',
      experience: '',
      currentCompany: '',
      expectedSalary: '',
      noticePeriod: '',
      location: '',
      skills: '',
      resumeFiles: null,
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
  };

  const handleClose = () => {
    resetForm();
    closeEditApplicationModal();
  };

  if (!showEditApplicationModal || !applicationToEdit) return null;

  const existingResumes = applicationResumes[applicationToEdit.id] || [];

  return (
    <div
      id="edit-application-modal"
      className="recruitment-modal"
      onClick={(e) => {
        if (e.target.id === 'edit-application-modal') {
          // Remove outside click functionality
        }
      }}
    >
      <div className="recruitment-modal-content" style={{ maxWidth: '900px', maxHeight: '90vh', overflow: 'auto' }}>
        <div className="recruitment-modal-header">
          <h2>Edit Application - {applicationToEdit.name}</h2>
          <span className="recruitment-close" onClick={handleClose}>&times;</span>
        </div>
        <div className="recruitment-modal-body">
          <form onSubmit={handleEditApplicationSubmit} className="recruitment-resume-form">

            {/* Personal Information Section */}
            <div className="form-section" style={{ marginBottom: '25px' }}>
              <h3 style={{ color: '#1a6f66ff', marginBottom: '15px', borderBottom: '1px solid #e0e0e0', paddingBottom: '8px' }}>
                Personal Information
              </h3>

              <div className="recruitment-form-row">
                <div className="recruitment-form-group">
                  <label>First Name</label>
                  <input
                    type="text"
                    name="candidateFirstName"
                    value={editApplicationData.candidateFirstName}
                    onChange={handleEditApplicationChange}
                    className="recruitment-form-input"
                    placeholder="Enter first name"
                  />
                </div>
                <div className="recruitment-form-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    name="candidateLastName"
                    value={editApplicationData.candidateLastName}
                    onChange={handleEditApplicationChange}
                    className="recruitment-form-input"
                    placeholder="Enter last name"
                  />
                </div>
              </div>

              <div className="recruitment-form-row">
                <div className="recruitment-form-group">
                  <label>Date of Birth</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={editApplicationData.dateOfBirth}
                    onChange={handleEditApplicationChange}
                    className="recruitment-form-input"
                  />
                </div>
                <div className="recruitment-form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={editApplicationData.email}
                    onChange={handleEditApplicationChange}
                    className="recruitment-form-input"
                    placeholder="Enter email address"
                  />
                </div>
              </div>

              <div className="recruitment-form-row">
                <div className="recruitment-form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={editApplicationData.phone}
                    onChange={handleEditApplicationChange}
                    className="recruitment-form-input"
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="recruitment-form-group">
                  <label>Current Location</label>
                  <input
                    type="text"
                    name="currentLocation"
                    value={editApplicationData.currentLocation}
                    onChange={handleEditApplicationChange}
                    className="recruitment-form-input"
                    placeholder="Enter current location"
                  />
                </div>
              </div>

              <div className="recruitment-form-row">
                <div className="recruitment-form-group">
                  <label>LinkedIn URL</label>
                  <input
                    type="url"
                    name="linkedInUrl"
                    value={editApplicationData.linkedInUrl}
                    onChange={handleEditApplicationChange}
                    className="recruitment-form-input"
                    placeholder="Enter LinkedIn profile URL"
                  />
                </div>
                <div className="recruitment-form-group">
                  <label>Passport Number</label>
                  <input
                    type="text"
                    name="passport"
                    value={editApplicationData.passport}
                    onChange={handleEditApplicationChange}
                    className="recruitment-form-input"
                    placeholder="Enter passport number"
                  />
                </div>
              </div>

              <div className="recruitment-form-row">
                <div className="recruitment-form-group">
                  <label>Work Authorization</label>
                  <select
                    name="workAuthorization"
                    value={editApplicationData.workAuthorization}
                    onChange={handleEditApplicationChange}
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
                    value={editApplicationData.dateAvailability}
                    onChange={handleEditApplicationChange}
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
                    value={editApplicationData.totalITExperience}
                    onChange={handleEditApplicationChange}
                    className="recruitment-form-input"
                    placeholder="e.g., 5 years"
                  />
                </div>
                <div className="recruitment-form-group">
                  <label>Relevant Experience</label>
                  <input
                    type="text"
                    name="relevantExperience"
                    value={editApplicationData.relevantExperience}
                    onChange={handleEditApplicationChange}
                    className="recruitment-form-input"
                    placeholder="e.g., 3 years"
                  />
                </div>
              </div>

              <div className="recruitment-form-row">
                <div className="recruitment-form-group">
                  <label>Current Company</label>
                  <input
                    type="text"
                    name="currentCompany"
                    value={editApplicationData.currentCompany}
                    onChange={handleEditApplicationChange}
                    className="recruitment-form-input"
                    placeholder="Enter current company"
                  />
                </div>
                <div className="recruitment-form-group">
                  <label>Current Employer</label>
                  <input
                    type="text"
                    name="currentEmployer"
                    value={editApplicationData.currentEmployer}
                    onChange={handleEditApplicationChange}
                    className="recruitment-form-input"
                    placeholder="Enter current employer"
                  />
                </div>
              </div>

              <div className="recruitment-form-row">
                <div className="recruitment-form-group">
                  <label>Expected Salary/Rate</label>
                  <input
                    type="text"
                    name="rate"
                    value={editApplicationData.rate}
                    onChange={handleEditApplicationChange}
                    className="recruitment-form-input"
                    placeholder="e.g., $50/hr or 12 LPA"
                  />
                </div>
                <div className="recruitment-form-group">
                  <label>Highest Degree</label>
                  <input
                    type="text"
                    name="highestDegree"
                    value={editApplicationData.highestDegree}
                    onChange={handleEditApplicationChange}
                    className="recruitment-form-input"
                    placeholder="e.g., Bachelor of Engineering"
                  />
                </div>
              </div>

              <div className="recruitment-form-row">
                <div className="recruitment-form-group">
                  <label>Notice Period</label>
                  <input
                    type="text"
                    name="noticePeriod"
                    value={editApplicationData.noticePeriod}
                    onChange={handleEditApplicationChange}
                    className="recruitment-form-input"
                    placeholder="e.g., 30 days"
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
                  value={editApplicationData.skills}
                  onChange={handleEditApplicationChange}
                  className="recruitment-form-textarea"
                  rows="3"
                  placeholder="Enter key skills separated by commas"
                />
              </div>

              <div className="recruitment-form-group full-width">
                <label>Current Employer Address</label>
                <textarea
                  name="currentEmployerAddress"
                  value={editApplicationData.currentEmployerAddress}
                  onChange={handleEditApplicationChange}
                  className="recruitment-form-textarea"
                  rows="2"
                  placeholder="Enter current employer address"
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
                      checked={editApplicationData.isFormerTCSEmployee}
                      onChange={(e) => setEditApplicationData(prev => ({
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
                    value={editApplicationData.tcsEmployeeId}
                    onChange={handleEditApplicationChange}
                    className="recruitment-form-input"
                    placeholder="Enter TCS employee ID"
                    disabled={!editApplicationData.isFormerTCSEmployee}
                  />
                </div>
              </div>

              <div className="recruitment-form-row">
                <div className="recruitment-form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      name="isFormerTCSBusinessAssociate"
                      checked={editApplicationData.isFormerTCSBusinessAssociate}
                      onChange={(e) => setEditApplicationData(prev => ({
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
                    value={editApplicationData.tcsBusinessAssociateId}
                    onChange={handleEditApplicationChange}
                    className="recruitment-form-input"
                    placeholder="Enter TCS business associate ID"
                    disabled={!editApplicationData.isFormerTCSBusinessAssociate}
                  />
                </div>
              </div>
            </div>

            {/* Resume Management Section */}
            <div className="form-section" style={{ marginBottom: '25px' }}>
              <h3 style={{ color: '#1a6f66ff', marginBottom: '15px', borderBottom: '1px solid #e0e0e0', paddingBottom: '8px' }}>
                Resume Management
              </h3>

              {/* Existing Resumes */}
              {existingResumes.length > 0 && (
                <div className="recruitment-form-group full-width" style={{ marginBottom: '20px' }}>
                  <label style={{ fontWeight: 'bold', color: '#4c63d2', marginBottom: '10px', display: 'block' }}>
                    Existing Resumes
                  </label>
                  <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '4px', padding: '10px' }}>
                    {existingResumes.map((resume, index) => (
                      <div key={resume.id} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px',
                        backgroundColor: index % 2 === 0 ? '#f9f9f9' : '#fff',
                        borderRadius: '4px',
                        marginBottom: '5px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '14px' }}>{resume.fileName}</span>
                          <span style={{ fontSize: '12px', color: '#666' }}>
                            ({new Date(resume.uploadedAt).toLocaleDateString()})
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                     
<button
  type="button"
  onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();
    viewResume(resume.id, applicationToEdit.id, e); // ADD applicationToEdit.id and event
  }}
  style={{
    background: '#4c63d2',
    color: 'white',
    border: 'none',
    padding: '4px 8px',
    borderRadius: '3px',
    cursor: 'pointer',
    fontSize: '12px'
  }}
>
  View
</button>
                          <button
                            type="button"
                            onClick={() => handleDeleteResume(resume.id, resume.fileName)}
                            disabled={resumeLoading}
                            style={{
                              background: '#ff4757',
                              color: 'white',
                              border: 'none',
                              padding: '4px 8px',
                              borderRadius: '3px',
                              cursor: resumeLoading ? 'not-allowed' : 'pointer',
                              fontSize: '12px',
                              opacity: resumeLoading ? 0.6 : 1
                            }}
                          >
                            {resumeLoading ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add New Resume */}
              <div className="recruitment-form-group full-width">
                <label style={{ fontWeight: 'bold', color: '#4c63d2', marginBottom: '10px', display: 'block' }}>
                  Add New Resume Files
                </label>

                <input
                  type="file"
                  name="resumeFiles"
                  id="edit-resume-file-input"
                  onChange={handleEditApplicationChange}
                  accept=".pdf,.doc,.docx"
                  style={{ display: 'none' }}
                  multiple
                />

                <div
                  onClick={() => document.getElementById('edit-resume-file-input').click()}
                  style={{
                    padding: '15px',
                    border: '2px dashed #4c63d2',
                    borderRadius: '8px',
                    backgroundColor: '#f8f9ff',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <div>
                    <div style={{ color: '#4c63d2', fontWeight: 'bold', marginBottom: '5px' }}>
                      Click to browse or drag and drop
                    </div>
                    <div style={{ color: '#666', fontSize: '12px' }}>
                      Accepted formats: PDF, DOC, DOCX (Max 5MB per file)
                    </div>
                  </div>
                </div>

                {editApplicationData.resumeFiles && editApplicationData.resumeFiles.length > 0 && (
                  <div style={{ marginTop: '15px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>New files to upload:</div>
                    {Array.from(editApplicationData.resumeFiles).map((file, index) => (
                      <div key={index} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px',
                        backgroundColor: '#f0f4ff',
                        borderRadius: '4px',
                        marginBottom: '5px'
                      }}>
                        <span style={{ fontSize: '14px' }}>{file.name}</span>
                        <button
                          type="button"
                          onClick={() => setEditApplicationData(prev => ({
                            ...prev,
                            resumeFiles: null
                          }))}
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

            <div className="recruitment-form-actions">
              <button
                type="button"
                className="recruitment-cancel-btn"
                onClick={handleClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="recruitment-submit-btn"
              >
                Update Application
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditApplicationModal;