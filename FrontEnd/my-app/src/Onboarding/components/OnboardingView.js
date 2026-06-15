import React, { useState, useEffect, useCallback } from 'react';
import '../styles/Onboarding.css';
import axios from 'axios';
import BASE_URL from '../../url';
import { 
  LuUser, LuMail, LuPhone, LuCalendar, 
  LuMapPin, LuUsers, LuGraduationCap, LuBriefcase,
  LuFileText, LuDownload, LuCircleCheck, LuCircleX,
  LuFileDigit, LuCreditCard, LuCar, LuGlobe,
  LuBookOpen, LuSchool, LuFileCheck, LuFileSearch,
  LuReceipt, LuIdCard, LuWallet, LuFilePen
} from 'react-icons/lu';

const OnboardingView = ({ employee }) => {
  const [documents, setDocuments] = useState([]);
  const [loadingDocuments, setLoadingDocuments] = useState(true);

  // Helper function to safely parse JSON fields
  const parseJsonField = (field) => {
    if (!field) return [];
    if (Array.isArray(field)) return field;
    if (typeof field === 'string') {
      try {
        return JSON.parse(field);
      } catch (e) {
        console.error('Error parsing JSON field:', e);
        return [];
      }
    }
    return [];
  };

  // Parse JSON fields from employee data
  const familyMembers = parseJsonField(employee?.familyMembers);
  const education = parseJsonField(employee?.education);
  const technicalSkills = parseJsonField(employee?.technicalSkills);
  const previousEmployment = parseJsonField(employee?.previousEmployment);

  // Fetch documents from OnboardingDocuments table
  const fetchDocuments = useCallback(async () => {
    try {
      setLoadingDocuments(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${BASE_URL}/api/onboarding/${employee.id}/documents`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setDocuments(response.data);
    } catch (error) {
      console.error('Error fetching documents:', error);
      setDocuments([]);
    } finally {
      setLoadingDocuments(false);
    }
  }, [employee.id]);

  useEffect(() => {
    if (employee && employee.id) {
      fetchDocuments();
    }
  }, [employee, fetchDocuments]);

  const handleDownloadDocument = async (documentType, fileName) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.get(
        `${BASE_URL}/api/onboarding/${employee.id}/documents/${documentType}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Failed to download document');
    }
  };

  // Document type mapping with React Icons
  const documentTypeInfo = {
    aadhaar: { label: 'Aadhaar Card', icon: <LuIdCard size={24} /> },
    panCard: { label: 'PAN Card', icon: <LuCreditCard size={24} /> },
    drivingLicense: { label: 'Driving License', icon: <LuCar size={24} /> },
    passport: { label: 'Passport', icon: <LuGlobe size={24} /> },
    bankPassbook: { label: 'Bank Passbook', icon: <LuWallet size={24} /> },
    profilePicture: { label: 'Profile Picture', icon: <LuUser size={24} /> },
    tenthCertificate: { label: '10th Certificate', icon: <LuSchool size={24} /> },
    twelfthCertificate: { label: '12th Certificate', icon: <LuBookOpen size={24} /> },
    degreeCertificate: { label: 'Degree Certificate', icon: <LuGraduationCap size={24} /> },
    epfoServiceHistory: { label: 'EPFO Service History', icon: <LuFileSearch size={24} /> },
    payslipForm16: { label: 'Payslip/Form 16', icon: <LuReceipt size={24} /> },
    experienceLetter: { label: 'Experience Letter', icon: <LuFilePen size={24} /> }
  };

  const getDocumentStatus = (docType) => {
    const doc = documents.find(d => d.documentType === docType);
    if (doc) {
      return {
        status: 'uploaded',
        fileName: doc.fileName,
        fileSize: doc.fileSize,
        uploadedAt: doc.uploadedAt
      };
    }
    return { status: 'pending' };
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 KB';
    return (bytes / 1024).toFixed(2) + ' KB';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  const getEmployeeName = () => {
    if (employee?.firstName || employee?.lastName) {
      return `${employee.firstName || ''} ${employee.lastName || ''}`.trim();
    }
    return 'My Onboarding';
  };

  return (
    <div className="ob-view-container">
      <div className="ob-view-header">
        <div className="ob-view-title">
          <h2>{getEmployeeName()}</h2>
          {/* <span className={`ob-status-badge ob-status-badge-${employee.status?.toLowerCase() || 'pending'}`}>
            {employee.status || 'Pending Review'}
          </span> */}
        </div>
      </div>

      <div className="ob-view-content">
        {/* Personal Information Section */}
        <div className="ob-view-section">
          <div className="ob-view-section-header">
            <LuUser size={20} />
            <h3>Personal Information</h3>
          </div>
          <div className="ob-view-grid">
            <div className="ob-view-item">
              <label>First Name</label>
              <p>{employee.firstName || 'N/A'}</p>
            </div>
            <div className="ob-view-item">
              <label>Last Name</label>
              <p>{employee.lastName || 'N/A'}</p>
            </div>
            <div className="ob-view-item">
              <label><LuPhone size={16} /> Mobile Number</label>
              <p>{employee.mobileNumber || 'N/A'}</p>
            </div>
            <div className="ob-view-item">
              <label><LuMail size={16} /> Email</label>
              <p>{employee.personalEmail || 'N/A'}</p>
            </div>
            <div className="ob-view-item">
              <label><LuCalendar size={16} /> Date of Birth</label>
              <p>{formatDate(employee.dateOfBirth)}</p>
            </div>
            <div className="ob-view-item">
              <label>Gender</label>
              <p>{employee.gender || 'N/A'}</p>
            </div>
            <div className="ob-view-item">
              <label>Blood Group</label>
              <p>{employee.bloodGroup || 'N/A'}</p>
            </div>
            {/* ADD THESE TWO FIELDS */}
<div className="ob-view-item">
  <label>Current Salary</label>
  <p>{employee.currentSalary ? `₹${Number(employee.currentSalary).toLocaleString('en-IN')}` : 'N/A'}</p>
</div>

<div className="ob-view-item">
  <label>Expected Salary</label>
  <p>{employee.expectedSalary ? `₹${Number(employee.expectedSalary).toLocaleString('en-IN')}` : 'N/A'}</p>
</div>
            <div className="ob-view-item">
              <label>Marital Status</label>
              <p>{employee.maritalStatus || 'N/A'}</p>
            </div>
            <div className="ob-view-item">
              <label>PAN Number</label>
              <p>{employee.panNumber || 'N/A'}</p>
            </div>
            <div className="ob-view-item">
              <label>Aadhaar Number</label>
              <p>{employee.adhaarNumber || 'N/A'}</p>
            </div>
            <div className="ob-view-item">
              <label>UAN Number</label>
              <p>{employee.uanNumber || 'N/A'}</p>
            </div>
            <div className="ob-view-item">
              <label>LinkedIn</label>
              <p>{employee.linkedin || 'N/A'}</p>
            </div>
            <div className="ob-view-item">
              <label>Languages Known</label>
              <p>{employee.languagesKnown || 'N/A'}</p>
            </div>
            <div className="ob-view-item">
              <label>Emergency Contact Name</label>
              <p>{employee.emergencyContactName || 'N/A'}</p>
            </div>
            <div className="ob-view-item">
              <label>Emergency Contact Number</label>
              <p>{employee.emergencyContactNo || 'N/A'}</p>
            </div>
            <div className="ob-view-item">
              <label>Bank Name</label>
              <p>{employee.bankName || 'N/A'}</p>
            </div>
            <div className="ob-view-item">
              <label>Bank Account Number</label>
              <p>{employee.bankAccountNumber || 'N/A'}</p>
            </div>
            <div className="ob-view-item">
              <label>IFSC Code</label>
              <p>{employee.ifscCode || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Address Section */}
        <div className="ob-view-section">
          <div className="ob-view-section-header">
            <LuMapPin size={20} />
            <h3>Address Details</h3>
          </div>
          <div className="ob-view-subsection">
            <h4>Permanent Address</h4>
            <div className="ob-view-grid">
              <div className="ob-view-item">
                <label>Door No</label>
                <p>{employee.permanentDoorNo || 'N/A'}</p>
              </div>
              <div className="ob-view-item">
                <label>Street</label>
                <p>{employee.permanentStreet || 'N/A'}</p>
              </div>
              <div className="ob-view-item">
                <label>Locality</label>
                <p>{employee.permanentLocality || 'N/A'}</p>
              </div>
              <div className="ob-view-item">
                <label>District</label>
                <p>{employee.permanentDistrict || 'N/A'}</p>
              </div>
              <div className="ob-view-item">
                <label>State</label>
                <p>{employee.permanentState || 'N/A'}</p>
              </div>
              <div className="ob-view-item">
                <label>Pincode</label>
                <p>{employee.permanentPincode || 'N/A'}</p>
              </div>
            </div>
          </div>

          {!employee.sameAsPermanent && (
            <div className="ob-view-subsection">
              <h4>Current Address</h4>
              <div className="ob-view-grid">
                <div className="ob-view-item">
                  <label>Door No</label>
                  <p>{employee.currentDoorNo || 'N/A'}</p>
                </div>
                <div className="ob-view-item">
                  <label>Street</label>
                  <p>{employee.currentStreet || 'N/A'}</p>
                </div>
                <div className="ob-view-item">
                  <label>Locality</label>
                  <p>{employee.currentLocality || 'N/A'}</p>
                </div>
                <div className="ob-view-item">
                  <label>District</label>
                  <p>{employee.currentDistrict || 'N/A'}</p>
                </div>
                <div className="ob-view-item">
                  <label>State</label>
                  <p>{employee.currentState || 'N/A'}</p>
                </div>
                <div className="ob-view-item">
                  <label>Pincode</label>
                  <p>{employee.currentPincode || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Family Details Section */}
        {familyMembers && familyMembers.length > 0 && (
          <div className="ob-view-section">
            <div className="ob-view-section-header">
              <LuUsers size={20} />
              <h3>Family Details</h3>
            </div>
            <div className="ob-view-subsection">
              <h4>Family Members</h4>
              <div className="ob-family-grid">
                {familyMembers.map((member, index) => (
                  <div key={index} className="ob-family-card">
                    <div className="ob-family-header">
                      <h5>Family Member {index + 1}</h5>
                      <span className="ob-family-relationship">
                        {member.relationship || 'Family Member'}
                      </span>
                    </div>
                    <div className="ob-family-details">
                      <div className="ob-family-item">
                        <strong>Name:</strong>
                        <span>{member.name || 'N/A'}</span>
                      </div>
                      <div className="ob-family-item">
                        <strong>Date of Birth:</strong>
                        <span>{formatDate(member.dateOfBirth)}</span>
                      </div>
                      <div className="ob-family-item">
                        <strong>Aadhaar Number:</strong>
                        <span>{member.aadhaarNumber || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Education Section */}
        {(education && education.length > 0) && (
          <div className="ob-view-section">
            <div className="ob-view-section-header">
              <LuGraduationCap size={20} />
              <h3>Education Details</h3>
            </div>
            
            {/* Education Details */}
            {education && education.length > 0 && (
              <div className="ob-view-subsection">
                <h4>Education Details</h4>
                {education.map((edu, index) => (
                  <div key={index} className="ob-education-card">
                    <div className="ob-education-header">
                      <h5>Education {index + 1}</h5>
                      {edu.course && (
                        <span className="ob-education-course">{edu.course}</span>
                      )}
                    </div>
                    <div className="ob-view-grid">
                      <div className="ob-view-item">
                        <label>Institution</label>
                        <p>{edu.institution || 'N/A'}</p>
                      </div>
                      <div className="ob-view-item">
                        <label>Board/University</label>
                        <p>{edu.board || 'N/A'}</p>
                      </div>
                      <div className="ob-view-item">
                        <label>Location</label>
                        <p>{edu.location || 'N/A'}</p>
                      </div>
                      <div className="ob-view-item">
                        <label>Specialization</label>
                        <p>{edu.specialization || 'N/A'}</p>
                      </div>
                      <div className="ob-view-item">
                        <label>Year of Passing</label>
                        <p>{edu.year || 'N/A'}</p>
                      </div>
                      <div className="ob-view-item">
                        <label>Percentage/GPA</label>
                        <p>{edu.percentage || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Previous Employment Section */}
        {previousEmployment && previousEmployment.length > 0 && (
          <div className="ob-view-section">
            <div className="ob-view-section-header">
              <LuBriefcase size={20} />
              <h3>Previous Employment</h3>
            </div>
            <div className="ob-view-subsection">
              <h4>Employment History</h4>
              {previousEmployment.map((job, index) => (
                <div key={index} className="ob-employment-card">
                  <div className="ob-employment-header">
                    <h5>{job.companyName || 'Unnamed Company'}</h5>
                    {job.employmentStatus && (
                      <span className={`ob-employment-status ${job.employmentStatus}`}>
                        {job.employmentStatus}
                      </span>
                    )}
                  </div>
                  
                  <div className="ob-employment-details">
                    <div>
                      <strong>Designation:</strong>
                      <p>{job.designation || 'N/A'}</p>
                    </div>
                    <div>
                      <strong>Company Location:</strong>
                      <p>{job.companyLocation || 'N/A'}</p>
                    </div>
                    <div>
                      <strong>Duration:</strong>
                      <p>{job.durationFrom || 'N/A'} to {job.durationTo || 'N/A'}</p>
                    </div>
                    {job.reasonForLeaving && (
                      <div>
                        <strong>Reason for Leaving:</strong>
                        <p>{job.reasonForLeaving}</p>
                      </div>
                    )}
                    
                    {job.contactName && (
                      <div className="ob-contact-details">
                        <h6>Contact Reference</h6>
                        <div className="ob-view-grid">
                          <div className="ob-view-item">
                            <label>Name</label>
                            <p>{job.contactName}</p>
                          </div>
                          <div className="ob-view-item">
                            <label>Phone</label>
                            <p>{job.contactPhone || 'N/A'}</p>
                          </div>
                          <div className="ob-view-item">
                            <label>Email</label>
                            <p>{job.contactEmail || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {job.outsourcingAgencyName && (
                      <div className="ob-agency-details">
                        <h6>Outsourcing Agency</h6>
                        <div className="ob-view-grid">
                          <div className="ob-view-item">
                            <label>Name</label>
                            <p>{job.outsourcingAgencyName}</p>
                          </div>
                          <div className="ob-view-item">
                            <label>Address & Phone</label>
                            <p>{job.outsourcingAgencyAddress || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Documents Section */}
        <div className="ob-view-section">
          <div className="ob-view-section-header">
            <LuFileText size={20} />
            <h3>Documents Status</h3>
          </div>
          
          {loadingDocuments ? (
            <div className="ob-loading">Loading documents...</div>
          ) : (
            <div className="ob-documents-grid">
              {Object.keys(documentTypeInfo).map((docType) => {
                const docInfo = documentTypeInfo[docType];
                const status = getDocumentStatus(docType);
                
                return (
                  <div key={docType} className={`ob-document-card ${status.status}`}>
                    <div className="ob-document-icon">
                      {docInfo.icon}
                    </div>
                    <div className="ob-document-info">
                      <h4>{docInfo.label}</h4>
                      {status.status === 'uploaded' ? (
                        <>
                          <div className="ob-doc-status ob-doc-uploaded">
                            <LuCircleCheck size={16} /> Uploaded
                          </div>
                          <div className="ob-doc-details">
                            <small>{status.fileName}</small>
                            <small>{formatFileSize(status.fileSize)}</small>
                            <small>Uploaded: {formatDate(status.uploadedAt)}</small>
                          </div>
                          <button
                            className="ob-btn-download-doc"
                            onClick={() => handleDownloadDocument(docType, status.fileName)}
                          >
                            <LuDownload size={16} /> Download
                          </button>
                        </>
                      ) : (
                        <div className="ob-doc-status ob-doc-pending">
                          <LuCircleX size={16} /> Not Uploaded
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingView;