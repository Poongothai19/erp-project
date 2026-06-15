import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/H1B.css';
import BASE_URL from '../../url';
import '../../ATS/styles/ApplicantsTable.css';
import { FaCheckCircle, FaTimesCircle, FaFileAlt, FaPaperclip, FaFilePdf, FaFileWord } from 'react-icons/fa';
import { generateSubmissionPDF } from '../utils/pdfUtils';
import { generateSubmissionWord } from '../utils/wordUtils';

function Field({ label, value, name, isEditing, onChange, type = 'text', options = [] }) {
  if (!isEditing && (value == null || value === '-' || (typeof value === 'string' && value.trim() === ''))) {
    return null;
  }
  return (
    <div className="h1b-field-group">
      <div className="h1b-field-label">{label}</div>
      <div className="h1b-field-value">
        {isEditing && name ? (
          type === 'select' ? (
            <select
              value={value || ''}
              onChange={(e) => onChange(name, e.target.value)}
              style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ccc', marginTop: '4px' }}
            >
              <option value="">Select...</option>
              {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          ) : type === 'textarea' ? (
            <textarea
              value={value || ''}
              onChange={(e) => onChange(name, e.target.value)}
              style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ccc', marginTop: '4px', minHeight: '60px' }}
            />
          ) : (
            <input
              type={type}
              value={value || ''}
              onChange={(e) => onChange(name, e.target.value)}
              style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ccc', marginTop: '4px' }}
            />
          )
        ) : (
          value
        )}
      </div>
    </div>
  );
}

const formatDateView = (dateStr) => {
  if (!dateStr) return '-';
  const d = typeof dateStr === 'string' ? dateStr.split('T')[0] : new Date(dateStr).toISOString().split('T')[0];
  const parts = d.split('-');
  if (parts.length === 3) {
    return `${parts[1]}/${parts[2]}/${parts[0]}`;
  }
  return d;
};

export default function SubmissionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [editData, setEditData] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [wordLoading, setWordLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setMsg(null);
    
    try {
      const response = await fetch(`${BASE_URL}/api/h1b/submissions/${id}`);
      
      if (!response.ok) {
        throw new Error('Submission not found');
      }
      
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
        setEditData(result.data);
      } else {
        throw new Error(result.message || 'Failed to load submission');
      }
    } catch (error) {
      console.error('Load error:', error);
      setMsg(`Error: ${error.message}`);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = async (filePath, fileName) => {
    if (!filePath) {
      setMsg('❌ No file path available');
      return;
    }

    setAttachmentsLoading(true);
    try {
      const downloadUrl = `${BASE_URL}/api/h1b/download?s3Key=${encodeURIComponent(filePath)}&fileName=${encodeURIComponent(fileName || filePath.split('/').pop())}`;
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.target = '_blank';
      link.download = fileName || filePath.split('/').pop();
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setMsg(`Download started: ${fileName || filePath.split('/').pop()}`);
    } catch (error) {
      console.error('Download error:', error);
      setMsg(`❌ Failed to download: ${error.message}`);
    } finally {
      setAttachmentsLoading(false);
    }
  };

  const checkAttachments = () => {
    setAttachmentsLoading(true);
    setTimeout(() => {
      const count = [data?.ResumeS3Key].filter(Boolean).length;
      setMsg(`Found ${count} attachment(s)`);
      setAttachmentsLoading(false);
    }, 1000);
  };

  const handleUpdateStatus = async () => {
    const newStatus = window.prompt("Enter new status (pending/approved/rejected):", data.PetitionStatus);
    if (newStatus && ['pending', 'approved', 'rejected'].includes(newStatus.toLowerCase())) {
      try {
        const response = await fetch(`${BASE_URL}/api/h1b/submissions/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ petition_status: newStatus.toLowerCase() })
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setMsg(`✅ Status updated to: ${newStatus}`);
            setData(result.data);
          } else {
            throw new Error(result.message);
          }
        } else {
          throw new Error('Failed to update status');
        }
      } catch (error) {
        setMsg(`❌ Error: ${error.message}`);
      }
    }
  };

  const handleFieldChange = (name, val) => {
    setEditData(prev => ({ ...prev, [name]: val }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/api/h1b/submissions/${id}/full`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData)
      });
      if (!response.ok) throw new Error('Failed to update submission');
      const result = await response.json();
      if (result.success) {
        setData(result.data);
        setEditData(result.data);
        setIsEditing(false);
        setMsg('✅ Submission updated successfully');
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      setMsg(`❌ Error saving: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    setPdfLoading(true);
    try {
      await generateSubmissionPDF(id, data);
      setMsg('✅ PDF downloaded successfully');
    } catch (err) {
      setMsg(`❌ PDF error: ${err.message}`);
    } finally {
      setPdfLoading(false);
    }
  };

  const handleDownloadWord = async () => {
    setWordLoading(true);
    try {
      await generateSubmissionWord(id, data);
      setMsg('✅ Word downloaded successfully');
    } catch (err) {
      setMsg(`❌ Word error: ${err.message}`);
    } finally {
      setWordLoading(false);
    }
  };

  const exportToExcel = () => {
    if (!data) return;
    
    const headers = [
      'Submission ID', 'Prefix', 'First Name', 'Middle Name', 'Last Name',
      'Email', 'Phone', 'Gender', 'Date of Birth',
      'Passport Number', 'Passport Expiry Date', 'Nationality',
      'Country of Birth', 'Place of Birth',
      'Current Status', 'I-94 Expiration',
      'Filing Type', 'Employer', 'Anticipated Start Date',
      'Job Title', 'Expected Salary', 'Job Summary',
      'Worksite Address', 'Home Address', 'Offsite Details',
      'End Client', 'Tier 1 Vendor', 'Tier 2 Vendor', 'Tier 3 Vendor',
      'Bachelors Degree', 'Masters Degree', 'Masters Cap Quota Eligible',
      'H4 Required', 'Consent', 'Submission Date', 'Status'
    ];
    
    const csvRows = [
      headers.join(','),
      [
        data.SubmissionId || id,
        data.Prefix || '',
        data.FirstName || '',
        data.MiddleName || '',
        data.LastName || '',
        data.Email || '',
        data.Phone || '',
        data.Gender || '',
        data.DateOfBirth ? new Date(data.DateOfBirth).toLocaleDateString() : '',
        data.PassportNumber || '',
        data.PassportExpiryDate ? new Date(data.PassportExpiryDate).toLocaleDateString() : '',
        data.Nationality || '',
        data.CountryOfBirth || '',
        data.PlaceOfBirth || '',
        data.CurrentStatus || '',
        data.I94Expiration ? new Date(data.I94Expiration).toLocaleDateString() : '',
        data.FilingType || '',
        data.EmployerName || '',
        data.AnticipatedStartDate ? new Date(data.AnticipatedStartDate).toLocaleDateString() : '',
        data.PositionTitle || '',
        data.ExpectedSalary || '',
        data.JobSummary || '',
        data.WorksiteAddress || '',
        data.HomeAddress || '',
        data.OffsiteDetails || '',
        data.EndClient || '',
        data.Tier1Vendor || '',
        data.Tier2Vendor || '',
        data.Tier3Vendor || '',
        data.BachelorsDegree || '',
        data.MastersDegree || '',
        data.MastersCapQuotaEligible || '',
        data.H4Required || '',
        data.Consent ? 'Yes' : 'No',
        data.CreatedAt ? new Date(data.CreatedAt).toLocaleDateString() : '',
        data.PetitionStatus || ''
      ].map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')
    ];
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `h1b-submission-${id}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    
    setMsg("Excel file downloaded successfully");
  };

  useEffect(() => { 
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="applicants-loading" style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#f5f5f5'
      }}>
        <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#333', marginBottom: '20px' }}>
          PROPHECY H1B
        </div>
        <div className="applicants-loading-spinner" style={{
          width: '50px',
          height: '50px',
          border: '4px solid #e0e0e0',
          borderTop: '4px solid #038a77',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <div style={{ marginTop: '20px', color: '#666', fontSize: '14px' }}>
          Loading submission #{id}...
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="applicants-table-wrapper" style={{ padding: '12px', background: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              onClick={() => navigate('/h1b/dashboard')}
              className="applicants-submit-resume-btn"
              style={{
                textDecoration: 'none',
                padding: '8px 16px',
                fontSize: '13px',
                background: '#038a77',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              ← Dashboard
            </button>
            <div style={{ 
              padding: '8px 16px', 
              fontSize: '13px',
              background: 'white',
              borderRadius: '6px',
              border: '1px solid #e0e0e0',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <span style={{ fontWeight: 600 }}>Submission ID:</span> {data?.SubmissionId || id}
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  className="applicants-submit-resume-btn"
                  style={{ background: '#038a77', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="applicants-submit-resume-btn"
                  style={{ background: '#64748B', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="applicants-submit-resume-btn"
                  style={{ background: '#3b82f6', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
                >
                  Edit Details
                </button>
                <button
                  onClick={handleDownloadPDF}
                  disabled={pdfLoading}
                  className="applicants-submit-resume-btn"
                  style={{ background: pdfLoading ? '#64748b' : '#8b5cf6', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
                >
                  {pdfLoading ? "Generating..." : "Download PDF"}
                </button>
                <button
                  onClick={handleDownloadWord}
                  disabled={wordLoading}
                  className="applicants-submit-resume-btn"
                  style={{ background: wordLoading ? '#64748b' : '#2563eb', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
                >
                  {wordLoading ? "Generating..." : "Download Word"}
                </button>
                <button
                  onClick={checkAttachments}
                  disabled={attachmentsLoading}
                  className="applicants-submit-resume-btn"
                  style={{
                    background: attachmentsLoading ? '#64748B' : '#038a77',
                    color: 'white',
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}
                >
                  {attachmentsLoading ? "Checking..." : "Check Attachments"}
                </button>
              </>
            )}
            <button
              onClick={load}
              className="applicants-submit-resume-btn"
              style={{
                background: '#038a77',
                color: 'white',
                padding: '8px 16px',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              Refresh
            </button>
          </div>
        </div>

        {msg && (
          <div className="applicants-error-banner" style={{
            background: msg.includes("Error") ? '#fee2e2' : '#d1fae5',
            borderColor: msg.includes("Error") ? '#fecaca' : '#a7f3d0',
            color: msg.includes("Error") ? '#dc2626' : '#065f46'
          }}>
            <div className="applicants-error-icon">{msg.includes("Error") ? <FaTimesCircle/> : <FaCheckCircle/>}</div>
            {msg}
          </div>
        )}

        {!data ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '60px',
            background: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid #e0e0e0'
          }}>
            <div style={{ fontSize: '20px', color: '#ef4444', marginBottom: '16px', fontWeight: 700 }}>
              <FaTimesCircle style={{ marginRight: '8px' }} /> Submission Not Found
            </div>
            <div style={{ fontSize: '15px', color: '#64748B', marginBottom: '24px' }}>
              The submission with ID {id} could not be found.
            </div>
            <button onClick={load} className="applicants-submit-resume-btn">
              Try Loading Again
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px', alignItems: 'start' }}>
            {/* Left Column - Submission Details */}
            <div style={{ 
              background: 'white',
              borderRadius: '8px',
              padding: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: '1px solid #e0e0e0'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: '24px',
                paddingBottom: '16px',
                borderBottom: '2px solid #f0f0f0'
              }}>
                <div>
                  <h2 style={{ 
                    margin: 0, 
                    color: '#333', 
                    fontSize: '20px', 
                    fontWeight: 800,
                    marginBottom: '4px'
                  }}>
                    Submission Details
                  </h2>
                  <div style={{ fontSize: '13px', color: '#666' }}>
                    Created: {new Date(data.CreatedAt).toLocaleDateString()}
                  </div>
                </div>
                <span className={`applicants-position-badge ${data.PetitionStatus === "approved" ? "h1b-status-approved" : data.PetitionStatus === "rejected" ? "h1b-status-rejected" : "h1b-status-pending"}`}>
                  {data.PetitionStatus}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                
                <div>
                  <h3 style={{ fontSize: '14px', color: '#666', marginBottom: '4px', fontWeight: 600, borderBottom: '1px solid #eee', paddingBottom: '6px' }}>Employee Information</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', rowGap: '0px' }}>
                    <Field label="First Name" value={isEditing ? editData.FirstName : `${data.Prefix || ''} ${data.FirstName || ''}`.trim()} name="FirstName" isEditing={isEditing} onChange={handleFieldChange} />
                    <Field label="Middle Name" value={isEditing ? editData.MiddleName : data.MiddleName} name="MiddleName" isEditing={isEditing} onChange={handleFieldChange} />
                    <Field label="Last Name" value={isEditing ? editData.LastName : data.LastName} name="LastName" isEditing={isEditing} onChange={handleFieldChange} />
                    <Field label="Email" value={isEditing ? editData.Email : data.Email} name="Email" isEditing={isEditing} onChange={handleFieldChange} type="email" />
                    <Field label="Phone" value={isEditing ? editData.Phone : data.Phone} name="Phone" isEditing={isEditing} onChange={handleFieldChange} />
                    <Field label="Gender" value={isEditing ? editData.Gender : data.Gender} name="Gender" isEditing={isEditing} onChange={handleFieldChange} type="select" options={['Male', 'Female', 'Other']} />
                    <Field label="Date of Birth (MM/DD/YYYY)" value={isEditing ? editData.DateOfBirth : formatDateView(data.DateOfBirth)} name="DateOfBirth" isEditing={isEditing} onChange={handleFieldChange} type="date" />
                  </div>
                </div>

                <div>
                  <h3 style={{ fontSize: '14px', color: '#666', marginBottom: '4px', fontWeight: 600, borderBottom: '1px solid #eee', paddingBottom: '6px' }}>Filing Details</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', rowGap: '0px' }}>
                    <Field label="Employer" value={isEditing ? editData.EmployerName : data.EmployerName} name="EmployerName" isEditing={isEditing} onChange={handleFieldChange} />
                    <Field label="Filing Type" value={isEditing ? editData.FilingType : data.FilingType} name="FilingType" isEditing={isEditing} onChange={handleFieldChange} type="select" options={['H1 Transfer', 'Extension', 'Amendment', 'Extension & Amendment', 'H1B Lottery', 'Change of Status']} />
                    <Field label="Start Date (MM/DD/YYYY)" value={isEditing ? editData.AnticipatedStartDate : formatDateView(data.AnticipatedStartDate)} name="AnticipatedStartDate" isEditing={isEditing} onChange={handleFieldChange} type="date" />
                  </div>
                </div>

                <div>
                  <h3 style={{ fontSize: '14px', color: '#666', marginBottom: '4px', fontWeight: 600, borderBottom: '1px solid #eee', paddingBottom: '6px' }}>Immigration Status</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', rowGap: '0px' }}>
                    <Field label="Current Status" value={isEditing ? editData.CurrentStatus : data.CurrentStatus} name="CurrentStatus" isEditing={isEditing} onChange={handleFieldChange} />
                    <Field label="I-94 Expiration (MM/DD/YYYY)" value={isEditing ? editData.I94Expiration : formatDateView(data.I94Expiration)} name="I94Expiration" isEditing={isEditing} onChange={handleFieldChange} type="date" />
                    <Field label="Passport Number" value={isEditing ? editData.PassportNumber : data.PassportNumber} name="PassportNumber" isEditing={isEditing} onChange={handleFieldChange} />
                    <Field label="Nationality" value={isEditing ? editData.Nationality : data.Nationality} name="Nationality" isEditing={isEditing} onChange={handleFieldChange} />
                  </div>
                </div>

                {(isEditing || data.BachelorsDegree || data.MastersDegree || data.MastersCapQuotaEligible) && (
                  <div>
                    <h3 style={{ fontSize: '14px', color: '#666', marginBottom: '4px', fontWeight: 600, borderBottom: '1px solid #eee', paddingBottom: '6px' }}>Education</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', rowGap: '0px' }}>
                      <Field label="Bachelor's Degree" value={isEditing ? editData.BachelorsDegree : data.BachelorsDegree} name="BachelorsDegree" isEditing={isEditing} onChange={handleFieldChange} />
                      <Field label="Master's Degree" value={isEditing ? editData.MastersDegree : data.MastersDegree} name="MastersDegree" isEditing={isEditing} onChange={handleFieldChange} />
                      <Field label="Master's Cap Quota Eligible" value={isEditing ? editData.MastersCapQuotaEligible : (!data.MastersCapQuotaEligible ? null : (data.MastersCapQuotaEligible === "Yes" ? <span style={{ color: '#065f46' }}>✅ Yes</span> : <span style={{ color: '#dc2626' }}>❌ No</span>))} name="MastersCapQuotaEligible" isEditing={isEditing} onChange={handleFieldChange} type="select" options={['Yes', 'No']} />
                    </div>
                  </div>
                )}

                {(isEditing || data.PositionTitle || data.ExpectedSalary || data.JobSummary) && (
                  <div>
                    <h3 style={{ fontSize: '14px', color: '#666', marginBottom: '4px', fontWeight: 600, borderBottom: '1px solid #eee', paddingBottom: '6px' }}>Employment Details</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', rowGap: '0px' }}>
                      <Field label="Job Title" value={isEditing ? editData.PositionTitle : data.PositionTitle} name="PositionTitle" isEditing={isEditing} onChange={handleFieldChange} />
                      <Field label="Expected Salary" value={isEditing ? editData.ExpectedSalary : data.ExpectedSalary} name="ExpectedSalary" isEditing={isEditing} onChange={handleFieldChange} />
                      {(isEditing || data.JobSummary) && (
                        <div style={{ gridColumn: 'span 2' }}>
                          <Field label="Job Summary" value={isEditing ? editData.JobSummary : <div className="h1b-scrollable">{data.JobSummary}</div>} name="JobSummary" isEditing={isEditing} onChange={handleFieldChange} type="textarea" />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {(isEditing || data.CountryOfBirth || data.PlaceOfBirth) && (
                  <div>
                    <h3 style={{ fontSize: '14px', color: '#666', marginBottom: '4px', fontWeight: 600, borderBottom: '1px solid #eee', paddingBottom: '6px' }}>Birth Information</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', rowGap: '0px' }}>
                      <Field label="Country of Birth" value={isEditing ? editData.CountryOfBirth : data.CountryOfBirth} name="CountryOfBirth" isEditing={isEditing} onChange={handleFieldChange} />
                      <Field label="Place of Birth" value={isEditing ? editData.PlaceOfBirth : data.PlaceOfBirth} name="PlaceOfBirth" isEditing={isEditing} onChange={handleFieldChange} />
                    </div>
                  </div>
                )}

                {(isEditing || data.WorksiteAddress || data.HomeAddress || data.OffsiteDetails) && (
                  <div>
                    <h3 style={{ fontSize: '14px', color: '#666', marginBottom: '4px', fontWeight: 600, borderBottom: '1px solid #eee', paddingBottom: '6px' }}>Address Information</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', rowGap: '0px' }}>
                      {(isEditing || data.WorksiteAddress) && (
                        <Field label="Worksite Address" value={isEditing ? editData.WorksiteAddress : <div className="h1b-scrollable">{data.WorksiteAddress}</div>} name="WorksiteAddress" isEditing={isEditing} onChange={handleFieldChange} type="textarea" />
                      )}
                      {(isEditing || data.HomeAddress) && (
                        <Field label="Home Address" value={isEditing ? editData.HomeAddress : <div className="h1b-scrollable">{data.HomeAddress}</div>} name="HomeAddress" isEditing={isEditing} onChange={handleFieldChange} type="textarea" />
                      )}
                      <Field label="Offsite Details" value={isEditing ? editData.OffsiteDetails : data.OffsiteDetails} name="OffsiteDetails" isEditing={isEditing} onChange={handleFieldChange} />
                    </div>
                  </div>
                )}

                {(isEditing || data.EndClient || data.Tier1Vendor || data.Tier2Vendor || data.Tier3Vendor) && (
                  <div>
                    <h3 style={{ fontSize: '14px', color: '#666', marginBottom: '4px', fontWeight: 600, borderBottom: '1px solid #eee', paddingBottom: '6px' }}>Client & Vendors</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <Field label="End Client" value={isEditing ? editData.EndClient : data.EndClient} name="EndClient" isEditing={isEditing} onChange={handleFieldChange} />
                      <Field label="Tier 1 Vendor" value={isEditing ? editData.Tier1Vendor : data.Tier1Vendor} name="Tier1Vendor" isEditing={isEditing} onChange={handleFieldChange} />
                      <Field label="Tier 2 Vendor" value={isEditing ? editData.Tier2Vendor : data.Tier2Vendor} name="Tier2Vendor" isEditing={isEditing} onChange={handleFieldChange} />
                      <Field label="Tier 3 Vendor" value={isEditing ? editData.Tier3Vendor : data.Tier3Vendor} name="Tier3Vendor" isEditing={isEditing} onChange={handleFieldChange} />
                    </div>
                  </div>
                )}

                <div>
                  <h3 style={{ fontSize: '14px', color: '#666', marginBottom: '4px', fontWeight: 600, borderBottom: '1px solid #eee', paddingBottom: '6px' }}>Additional Info</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <Field label="H-4 Required" value={isEditing ? editData.H4Required : data.H4Required} name="H4Required" isEditing={isEditing} onChange={handleFieldChange} type="select" options={['Yes', 'No']} />
                    {(isEditing || data.H4Required === 'Yes' || data.H4Required === 'yes' || data.H4Required === 'YES') && (
                      <Field label="H-4 Count" value={isEditing ? (editData.H4Count || editData.H4_Count || editData.h4_count || editData.h4Count) : (data.H4Count || data.H4_Count || data.h4_count || data.h4Count || 'N/A')} name="H4Count" isEditing={isEditing} onChange={handleFieldChange} type="number" />
                    )}
                    <Field label="Consent Given" value={isEditing ? (editData.Consent ? 'Yes' : 'No') : (data.Consent ? <span style={{ color: '#065f46' }}>✅ Yes</span> : <span style={{ color: '#dc2626' }}>❌ No</span>)} name="Consent" isEditing={isEditing} onChange={(name, val) => handleFieldChange(name, val === 'Yes')} type="select" options={['Yes', 'No']} />
                  </div>
                </div>

              </div>
            </div>

            {/* Right Column - Attachments & Actions */}
            <div style={{ 
              background: 'white',
              borderRadius: '8px',
              padding: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: '1px solid #e0e0e0'
            }}>
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{ 
                  margin: 0, 
                  color: '#333', 
                  fontSize: '20px', 
                  fontWeight: 800,
                  marginBottom: '4px'
                }}>
                  Documents
                </h2>
                <div style={{ fontSize: '13px', color: '#666' }}>
                  Uploaded files
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Passport and Visa attachments hidden as per intake form requirements */}
                
                {data.ResumeS3Key && (
                  <div style={{ 
                    border: '1px solid #e0e0e0',
                    borderRadius: '6px',
                    padding: '16px',
                    background: '#f8fafc'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <FaFileAlt size={24} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, color: '#333' }}>Resume</div>
                        <div style={{ fontSize: '12px', color: '#666', wordBreak: 'break-all' }}>
                          Path: {data.ResumeS3Key}
                        </div>
                      </div>
                      <button 
                        onClick={() => downloadFile(data.ResumeS3Key, `resume-${id}.pdf`)}
                        disabled={attachmentsLoading}
                        className="applicants-submit-resume-btn"
                        style={{ minWidth: '100px' }}
                      >
                        {attachmentsLoading ? 'Downloading...' : 'Download'}
                      </button>
                    </div>
                  </div>
                )}

                {!data.ResumeS3Key && (
                  <div style={{ 
                    padding: '40px', 
                    textAlign: 'center', 
                    color: '#666',
                    background: '#f8fafc',
                    borderRadius: '8px',
                    border: '2px dashed #e0e0e0'
                  }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}><FaPaperclip size={48} /></div>
                    <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>No Files Attached</div>
                    <div style={{ fontSize: '13px', color: '#666' }}>
                      No documents were uploaded with this submission.
                    </div>
                  </div>
                )}
              </div>
              
              <div style={{ 
                marginTop: '32px', 
                padding: '20px', 
                background: '#f8fafc', 
                borderRadius: '8px',
                border: '1px solid #e0e0e0'
              }}>
                <h3 style={{ 
                  marginTop: 0, 
                  marginBottom: '16px', 
                  fontSize: '16px', 
                  color: '#333',
                  fontWeight: 700
                }}>
                  Submission Actions
                </h3>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <button
                    onClick={handleUpdateStatus}
                    className="applicants-submit-resume-btn"
                    style={{ flex: 1, minWidth: '180px', background: '#3b82f6', padding: '10px' }}
                  >
                    Update Status
                  </button>
                  <button
                    onClick={exportToExcel}
                    className="applicants-submit-resume-btn"
                    style={{ flex: 1, minWidth: '180px', background: '#10b981', padding: '10px' }}
                  >
                    Download Excel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}