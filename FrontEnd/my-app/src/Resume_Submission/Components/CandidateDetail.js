import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  ArrowLeft, Download, Edit, FileText,
  Briefcase, Award, GraduationCap, User,
  ChevronRight, ExternalLink, Mail, Phone,
  Linkedin, Github, Eye, Twitter, Video,
  DollarSign, CheckCircle, XCircle, Save, X,
  Plus, Trash2, Calendar, Copy
} from 'lucide-react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { useParams, useNavigate } from 'react-router-dom';
import { formatDate, formatFileSize, formatMonthYear } from '../utils/mockData';
import '../styles/Dashboard.css';
import BASE_URL from '../../url';
import Swal from 'sweetalert2';
import { countriesData, getStatesForCountry, getStateCode, stateMapping } from '../../erprecruitment/config/locationConfig';
import { formatName, formatJobTitle, formatFullName, formatNameFields } from '../utils/nameFormatter';

const CURRENCY_MAP = {
  IN: { symbol: '₹', label: 'INR' },
  US: { symbol: '$', label: 'USD' },
  GB: { symbol: '£', label: 'GBP' },
  CA: { symbol: 'C$', label: 'CAD' },
  AU: { symbol: 'A$', label: 'AUD' },
};

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

// Helper function to remove duplicates from an array based on a key function
const removeDuplicates = (array, keyFn) => {
  const seen = new Set();
  return array.filter(item => {
    const key = keyFn(item);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

// Format phone: ensure '+' prefix for international numbers
const formatPhone = (phone) => {
  if (!phone) return null;
  const cleaned = phone.toString().trim();
  if (!cleaned) return null;
  return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
};

const truncateText = (text, limit = 30) => {
  if (!text) return '';
  return text.length > limit ? text.substring(0, limit) + '...' : text;
};

// This transform function matches your backend response structure
const transformCandidate = (candidate) => {
  console.log('Raw candidate from API:', candidate);
  
  return {
    CandidateId:          candidate.candidate_id,
    CandidateCode:        candidate.candidate_code,
    EmployeeCode:         candidate.employee_id || '',
    FirstName:            formatName(candidate.first_name        || ''),
    LastName:             formatName(candidate.last_name         || ''),
    MiddleName:           formatName(candidate.middle_name       || ''),
    JobTitle:             formatJobTitle(candidate.job_title         || ''),
    YearsOfExperience:    candidate.years_exp,
    CandidateStatus:      candidate.status            || 'Available',
    RemoteStatus:         candidate.remote_status     || 'Remote',
    CreatedDt:            candidate.created_on,
    UpdatedDt:            candidate.modified_on       || '',
    ProfileSummary:       candidate.profile_summary   || '',
    LinkedInUrl:          candidate.linkedin_url      || '',
    GitHubUrl:            candidate.github_url        || '',
    TwitterUrl:           candidate.twitter_url       || '',
    VideoResumeUrl:       candidate.video_resume_url  || '',
    Gender:               candidate.gender            || '',
    CurrentLocation:      candidate.current_location  || '',
    // Raw location parts from DB (for edit mode - avoids fragile string parsing)
    LocationCity:         candidate.city_name         || candidate.CityName        || '',
    LocationStateCode:    candidate.state_code        || candidate.StateCode       || '',
    LocationCountryIso2:  candidate.country_iso2      || candidate.CountryIso2     || '',
    CreatedBy:            candidate.created_by        || '',
    
    // NEW FIELDS
    Mobile:               candidate.mobile || candidate.phone || '',
    WorkAuthorization:    candidate.work_authorization || '',
    EmploymentType:       candidate.employment_type   || '',
    SecurityClearance:    candidate.security_clearance || '',
    WillingToRelocate:    candidate.willing_to_relocate || false,
    IsBench:              candidate.is_bench || false,
    ExpectedRateFrom:     candidate.expected_rate_from || '',
    ExpectedRateTo:       candidate.expected_rate_to   || '',
    ExpectedRateType:     candidate.expected_rate_type || 'Hourly',
    CurrentRate:          candidate.current_rate       || '',
    CurrentRateType:      candidate.current_rate_type  || 'Hourly',
    MaritalStatus:        candidate.marital_status     || '',
    Industry:             candidate.industry           || '',
    
    Contact: {
      Email: candidate.email || '',
      // Only show Phone separately if the DB has BOTH a real mobile AND a different phone
      Phone: (candidate.mobile && candidate.phone && candidate.phone !== candidate.mobile) ? candidate.phone : '',
      Mobile: candidate.mobile || candidate.phone || '',
    },
    Skills: removeDuplicates(
      (candidate.skills || []).map(s => ({
        SkillName: s.skill_name || '',
        SkillType: 'HARD'
      })),
      (skill) => skill.SkillName.toLowerCase()
    ),
    Education: (candidate.education || []).map(e => ({
      EducationId: e.EducationId,
      Institution:  formatName(e.Institution  || e.institution  || ''),
      Degree:       formatName(e.Degree       || e.degree       || ''),
      FieldOfStudy: e.FieldOfStudy || e.fieldOfStudy || '',
      StartDate:    e.StartDate    || e.startDate    || '',
      EndDate:      e.EndDate      || e.endDate      || '',
      GPA:          e.GPA          || e.gpa          || '',
    })),
    WorkExperience: (candidate.work_experience || []).map(w => ({
      WorkExperienceId: w.WorkExperienceId,
      Company:     w.Company     || w.company     || '',
      JobTitle:    formatJobTitle(w.JobTitle    || w.jobTitle    || ''),
      StartDate:   w.StartDate   || w.startDate   || '',
      EndDate:     w.EndDate     || w.endDate     || '',
      IsCurrent:   w.IsCurrent   ?? w.isCurrent   ?? false,
      Description: w.Description || w.description || '',
    })),
    Certifications: (candidate.certifications || []).map(c => ({
      CertificationId: c.CertificationId,
      CertificationName:   formatName(c.CertificationName   || c.name          || ''),
      IssuingOrganization: c.IssuingOrganization || c.issuingOrg    || '',
      IssueDate:           c.IssueDate           || c.issueDate     || '',
      ExpiryDate:          c.ExpiryDate          || c.expiryDate    || '',
      CredentialId:        c.CredentialId        || c.credentialId  || '',
      CredentialUrl:       c.CredentialUrl       || c.credentialUrl || '',
    })),
    Document: candidate.document ? {
      DocumentId:       candidate.document.DocumentId,
      FileNameOriginal: candidate.document.FileNameOriginal,
      FileExtension:    candidate.document.FileExtension,
      MimeType:         candidate.document.MimeType,
      FileSizeBytes:    candidate.document.FileSizeBytes,
      StorageLocator:   candidate.document.StorageLocator,
      ParseStatus:      candidate.document.ParseStatus,
      DownloadUrl:      `${BASE_URL}/api/resumes/${candidate.document.DocumentId}/download`,
      PreviewUrl:       `${BASE_URL}/api/resumes/${candidate.document.DocumentId}/preview`,
      IsPrimaryResume:  candidate.document.IsPrimaryResume,
    } : null,
    Documents: (candidate.documents || []).map(doc => ({
      DocumentId:       doc.DocumentId,
      DocumentType:     doc.DocumentType,
      FileNameOriginal: doc.FileNameOriginal,
      FileExtension:    doc.FileExtension,
      MimeType:         doc.MimeType,
      FileSizeBytes:    doc.FileSizeBytes,
      IsPrimaryResume:  doc.IsPrimaryResume,
      UploadedOn:       doc.UploadedOn,
      DocumentName:     doc.DocumentName || doc.FileNameOriginal,
    })),
  };
};

const STATUS_COLORS = {
  'Available':     { bg: '#d1fae5', color: '#065f46' },
  'In Process':    { bg: '#fef3c7', color: '#92400e' },
  'Hired':         { bg: '#dbeafe', color: '#1d4ed8' },
  'Not Available': { bg: '#fee2e2', color: '#991b1b' },
  'On Hold':       { bg: '#f3f4f6', color: '#4b5563' },
};

const REMOTE_COLORS = {
  'Remote': { bg: '#ede9fe', color: '#5b21b6' },
  'OnSite': { bg: '#e0f2fe', color: '#0369a1' },
  'Hybrid': { bg: '#fef9c3', color: '#713f12' },
};

const SKILL_TYPE_COLORS = {
  'HARD': { bg: '#e0f2fe', color: '#0369a1' },
  'SOFT': { bg: '#fce7f3', color: '#9d174d' },
};

const AVATAR_COLORS = [
  '#229C8B','#3b82f6','#8b5cf6','#ec4899','#f59e0b',
  '#10b981','#6366f1','#ef4444','#14b8a6','#f97316',
];

const avatarColor = (name) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const getInitials = (first, last) =>
  ((first || '').charAt(0) + (last || '').charAt(0)).toUpperCase() || '?';

// Custom hook for copy functionality
const useCopyToClipboard = () => {
  const showToast = (message) => {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #229C8B;
      color: white;
      padding: 8px 16px;
      border-radius: 4px;
      z-index: 9999;
      animation: fadeOut 2s forwards;
      font-size: 14px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  };

  const copyToClipboard = (text, label = 'Text') => {
    navigator.clipboard.writeText(text).then(() => {
      showToast(`${label} copied to clipboard!`);
    }).catch(err => {
      console.error('Failed to copy: ', err);
    });
  };

  return copyToClipboard;
};

// Copyable Link Component
const CopyableLink = ({ href, text, icon: Icon, label }) => {
  const copyToClipboard = useCopyToClipboard();

  const handleContextMenu = (e) => {
    e.preventDefault();
    copyToClipboard(href, `${label} URL`);
  };

  return (
    <a 
      href={href} 
      target="_blank" 
      rel="noopener noreferrer"
      style={{ color: '#229C8B', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none', cursor: 'pointer' }}
      title={`Right-click to copy ${label} URL`}
      onContextMenu={handleContextMenu}
    >
      {Icon && <Icon size={12} />} {text} <ExternalLink size={10} />
    </a>
  );
};

// Copyable Text Component
const CopyableText = ({ text, icon: Icon, label }) => {
  const copyToClipboard = useCopyToClipboard();

  const handleContextMenu = (e) => {
    e.preventDefault();
    copyToClipboard(text, label);
  };

  return (
    <span 
      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
      title={`Right-click to copy ${label}`}
      onContextMenu={handleContextMenu}
    >
      {Icon && <Icon size={12} />} {text}
    </span>
  );
};

const InfoRow = ({ label, value, isEditing, fieldName, onEdit, options = null, type = 'text', displayValue = null, countryCode = 'us' }) => {
  if (isEditing) {
    if (options) {
      return (
        <div className="candidate-info-row">
          <span className="candidate-info-label">{label}</span>
          <span className="candidate-info-value">
            <select 
              value={value || ''} 
              onChange={(e) => onEdit(fieldName, e.target.value)}
              className="edit-select"
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                border: '1px solid #229C8B',
                fontSize: '13px',
                width: '100%'
              }}
            >
              <option value="">Select {label}</option>
              {options.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </span>
        </div>
      );
    }
    
    if (type === 'mobile') {
      return (
        <div className="candidate-info-row">
          <span className="candidate-info-label">{label}</span>
          <span className="candidate-info-value">
            <PhoneInput
              country={countryCode ? countryCode.toLowerCase() : 'us'}
              value={value || ''}
              onChange={(phone) => onEdit(fieldName, phone)}
              inputProps={{ name: fieldName, className: 'edit-input', style: { paddingLeft: '48px', width: '100%', height: '36px', border: '1px solid #229C8B', borderRadius: '4px', fontSize: '13px' } }}
              containerStyle={{ width: '100%' }}
              buttonStyle={{ background: 'transparent', border: 'none', paddingLeft: '8px' }}
              dropdownStyle={{ width: '300px', zIndex: 1000 }}
            />
          </span>
        </div>
      );
    }

    if (type === 'checkbox') {
      return (
        <div className="candidate-info-row">
          <span className="candidate-info-label">{label}</span>
          <span className="candidate-info-value">
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => onEdit(fieldName, e.target.checked)}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
          </span>
        </div>
      );
    }
    
    return (
      <div className="candidate-info-row">
        <span className="candidate-info-label">{label}</span>
        <span className="candidate-info-value">
          <input
            type={type}
            value={value || ''}
            onChange={(e) => {
              if (fieldName === 'FirstName' || fieldName === 'LastName' || fieldName === 'MiddleName') {
                onEdit(fieldName, formatName(e.target.value));
              } else if (fieldName === 'JobTitle') {
                onEdit(fieldName, formatJobTitle(e.target.value));
              } else {
                onEdit(fieldName, e.target.value);
              }
            }}
            className="edit-input"
            style={{
              padding: '4px 8px',
              borderRadius: '4px',
              border: '1px solid #229C8B',
              fontSize: '13px',
              width: '100%'
            }}
          />
        </span>
      </div>
    );
  }

  return (
    <div className="candidate-info-row">
      <span className="candidate-info-label">{label}</span>
      <span className="candidate-info-value">
        {displayValue || (value != null && value !== '' ? value : <span style={{ color: '#9ca3af' }}>—</span>)}
      </span>
    </div>
  );
};

const EditSection = ({ children, isEditing }) => {
  return isEditing ? (
    <div style={{ border: '1px dashed #229C8B', padding: '10px', borderRadius: '8px', marginBottom: '10px' }}>
      {children}
    </div>
  ) : children;
};

// Work Experience Editor Component
const WorkExperienceEditor = ({ experiences, onChange }) => {
  const addExperience = () => {
    onChange([
      ...experiences,
      {
        WorkExperienceId: `temp-${Date.now()}-${experiences.length}`,
        Company: '',
        JobTitle: '',
        StartDate: '',
        EndDate: '',
        IsCurrent: false,
        Description: ''
      }
    ]);
  };

  const updateExperience = (index, field, value) => {
    const updated = [...experiences];
    if (field === 'JobTitle') {
      updated[index] = { ...updated[index], [field]: formatJobTitle(value) };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    onChange(updated);
  };

  const removeExperience = (index) => {
    const updated = experiences.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <div>
      {experiences.map((exp, index) => (
        <div key={exp.WorkExperienceId || index} style={{
          background: '#f8f9fa',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '16px',
          border: '1px solid #e5e7eb',
          position: 'relative'
        }}>
          <button
            onClick={() => removeExperience(index)}
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#ef4444'
            }}
          >
            <Trash2 size={16} />
          </button>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <input
              type="text"
              value={exp.Company}
              onChange={(e) => updateExperience(index, 'Company', e.target.value)}
              placeholder="Company Name"
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
            />
            <input
              type="text"
              value={exp.JobTitle}
              onChange={(e) => updateExperience(index, 'JobTitle', e.target.value)}
              placeholder="Job Title"
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
            />
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '12px', marginBottom: '12px' }}>
            <input
              type="month"
              value={exp.StartDate}
              onChange={(e) => updateExperience(index, 'StartDate', e.target.value)}
              placeholder="Start Date"
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
            />
            <input
              type="month"
              value={exp.EndDate}
              onChange={(e) => updateExperience(index, 'EndDate', e.target.value)}
              placeholder="End Date"
              disabled={exp.IsCurrent}
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
            />
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <input
                type="checkbox"
                checked={exp.IsCurrent}
                onChange={(e) => updateExperience(index, 'IsCurrent', e.target.checked)}
              />
              Current
            </label>
          </div>
          
          <textarea
            value={exp.Description}
            onChange={(e) => updateExperience(index, 'Description', e.target.value)}
            placeholder="Job Description"
            rows={3}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
          />
        </div>
      ))}
      
      <button
        onClick={addExperience}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '8px 16px',
          background: '#f3f4f6',
          border: '1px dashed #229C8B',
          borderRadius: '4px',
          cursor: 'pointer',
          color: '#229C8B'
        }}
      >
        <Plus size={16} /> Add Work Experience
      </button>
    </div>
  );
};

// Education Editor Component
const EducationEditor = ({ educations, onChange }) => {
  const addEducation = () => {
    onChange([
      ...educations,
      {
        EducationId: `temp-${Date.now()}-${educations.length}`,
        Institution: '',
        Degree: '',
        FieldOfStudy: '',
        StartDate: '',
        EndDate: '',
        GPA: ''
      }
    ]);
  };

  const updateEducation = (index, field, value) => {
    const updated = [...educations];
    if (field === 'Institution' || field === 'Degree') {
      updated[index] = { ...updated[index], [field]: formatName(value) };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    onChange(updated);
  };

  const removeEducation = (index) => {
    const updated = educations.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <div>
      {educations.map((edu, index) => (
        <div key={edu.EducationId || index} style={{
          background: '#f8f9fa',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '16px',
          border: '1px solid #e5e7eb',
          position: 'relative'
        }}>
          <button
            onClick={() => removeEducation(index)}
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#ef4444'
            }}
          >
            <Trash2 size={16} />
          </button>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <input
              type="text"
              value={edu.Institution}
              onChange={(e) => updateEducation(index, 'Institution', e.target.value)}
              placeholder="Institution"
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
            />
            <input
              type="text"
              value={edu.Degree}
              onChange={(e) => updateEducation(index, 'Degree', e.target.value)}
              placeholder="Degree"
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
            />
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <input
              type="text"
              value={edu.FieldOfStudy}
              onChange={(e) => updateEducation(index, 'FieldOfStudy', e.target.value)}
              placeholder="Field of Study"
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
            />
            <input
              type="text"
              value={edu.GPA}
              onChange={(e) => updateEducation(index, 'GPA', e.target.value)}
              placeholder="GPA"
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
            />
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <input
              type="month"
              value={edu.StartDate}
              onChange={(e) => updateEducation(index, 'StartDate', e.target.value)}
              placeholder="Start Date"
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
            />
            <input
              type="month"
              value={edu.EndDate}
              onChange={(e) => updateEducation(index, 'EndDate', e.target.value)}
              placeholder="End Date"
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
            />
          </div>
        </div>
      ))}
      
      <button
        onClick={addEducation}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '8px 16px',
          background: '#f3f4f6',
          border: '1px dashed #229C8B',
          borderRadius: '4px',
          cursor: 'pointer',
          color: '#229C8B'
        }}
      >
        <Plus size={16} /> Add Education
      </button>
    </div>
  );
};

// Certifications Editor Component
const CertificationEditor = ({ certifications, onChange }) => {
  const addCertification = () => {
    onChange([
      ...certifications,
      {
        CertificationId: `temp-${Date.now()}-${certifications.length}`,
        CertificationName: '',
        IssuingOrganization: '',
        IssueDate: '',
        ExpiryDate: '',
        CredentialId: '',
        CredentialUrl: ''
      }
    ]);
  };

  const updateCertification = (index, field, value) => {
    const updated = [...certifications];
    if (field === 'CertificationName') {
      updated[index] = { ...updated[index], [field]: formatName(value) };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    onChange(updated);
  };

  const removeCertification = (index) => {
    const updated = certifications.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <div>
      {certifications.map((cert, index) => (
        <div key={cert.CertificationId || index} style={{
          background: '#f0fdf4',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '16px',
          border: '1px solid #bbf7d0',
          position: 'relative'
        }}>
          <button
            onClick={() => removeCertification(index)}
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#ef4444'
            }}
          >
            <Trash2 size={16} />
          </button>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <input
              type="text"
              value={cert.CertificationName}
              onChange={(e) => updateCertification(index, 'CertificationName', e.target.value)}
              placeholder="Certification Name"
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
            />
            <input
              type="text"
              value={cert.IssuingOrganization}
              onChange={(e) => updateCertification(index, 'IssuingOrganization', e.target.value)}
              placeholder="Issuing Organization"
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
            />
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <input
              type="month"
              value={cert.IssueDate}
              onChange={(e) => updateCertification(index, 'IssueDate', e.target.value)}
              placeholder="Issue Date"
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
            />
            <input
              type="month"
              value={cert.ExpiryDate}
              onChange={(e) => updateCertification(index, 'ExpiryDate', e.target.value)}
              placeholder="Expiry Date"
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
            />
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <input
              type="text"
              value={cert.CredentialId}
              onChange={(e) => updateCertification(index, 'CredentialId', e.target.value)}
              placeholder="Credential ID"
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
            />
            <input
              type="url"
              value={cert.CredentialUrl}
              onChange={(e) => updateCertification(index, 'CredentialUrl', e.target.value)}
              placeholder="Credential URL"
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
            />
          </div>
        </div>
      ))}
      
      <button
        onClick={addCertification}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '8px 16px',
          background: '#f3f4f6',
          border: '1px dashed #229C8B',
          borderRadius: '4px',
          cursor: 'pointer',
          color: '#229C8B'
        }}
      >
        <Plus size={16} /> Add Certification
      </button>
    </div>
  );
};

// Documents Editor Component
const DocumentEditor = ({ documents, onChange, candidateId }) => {
  const [uploading, setUploading] = useState(false);

  const addDocument = () => {
    onChange([
      ...documents,
      {
        DocumentId: `temp-${Date.now()}-${documents.length}`,
        DocumentName: '',
        DocumentType: 'Certificate',
        File: null,
        FileName: '',
        isNew: true
      }
    ]);
  };

  const updateDocument = (index, field, value) => {
    const updated = [...documents];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const removeDocument = (index) => {
    const updated = documents.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleFileUpload = (index, file) => {
    if (file) {
      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        Swal.fire('Error', 'Invalid file type. Only PDF, Word, and images are allowed.', 'error');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        Swal.fire('Error', 'File size must be under 10MB.', 'error');
        return;
      }
      
      updateDocument(index, 'File', file);
      updateDocument(index, 'FileName', file.name);
      if (!documents[index].DocumentName) {
        updateDocument(index, 'DocumentName', file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  return (
    <div>
      {documents.map((doc, index) => (
        <div key={doc.DocumentId || index} style={{
          background: '#ffffff',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '16px',
          border: '1px solid #e5e7eb',
          position: 'relative'
        }}>
          <button
            onClick={() => removeDocument(index)}
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#ef4444'
            }}
          >
            <Trash2 size={16} />
          </button>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <input
              type="text"
              value={doc.DocumentName}
              onChange={(e) => updateDocument(index, 'DocumentName', e.target.value)}
              placeholder="Document Name"
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
            />
            <select
              value={doc.DocumentType}
              onChange={(e) => updateDocument(index, 'DocumentType', e.target.value)}
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
            >
              <option value="Certificate">Certificate</option>
              <option value="ID Proof">ID Proof</option>
              <option value="Offer Letter">Offer Letter</option>
              <option value="Degree">Degree</option>
              <option value="Transcript">Transcript</option>
              <option value="Other">Other</option>
            </select>
          </div>
          
          <div>
            <input
              type="file"
              id={`file-${index}`}
              onChange={(e) => handleFileUpload(index, e.target.files[0])}
              style={{ display: 'none' }}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={() => document.getElementById(`file-${index}`).click()}
                style={{
                  padding: '6px 12px',
                  background: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Choose File
              </button>
              <span style={{ fontSize: '13px', color: '#6b7280' }}>
                {doc.FileName || (doc.DocumentId ? 'Existing file' : 'No file selected')}
              </span>
            </div>
          </div>
        </div>
      ))}
      
      <button
        onClick={addDocument}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '8px 16px',
          background: '#f3f4f6',
          border: '1px dashed #229C8B',
          borderRadius: '4px',
          cursor: 'pointer',
          color: '#229C8B'
        }}
      >
        <Plus size={16} /> Add Document
      </button>
    </div>
  );
};

const CandidateDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedCandidate, setEditedCandidate] = useState(null);
  const [saving, setSaving] = useState(false);
  const [selectedResumeId, setSelectedResumeId] = useState(null);
  // Location sub-fields for edit mode
  const [locCountry, setLocCountry] = useState('');
  const [locState, setLocState]     = useState('');
  const [locCity, setLocCity]       = useState('');
  const [stateSearch, setStateSearch] = useState('');

  // Dropdown Options
  const genderOptions = ['Male', 'Female', 'Other', 'Prefer not to say'];
  const maritalStatusOptions = ['Single', 'Married', 'Divorced', 'Widowed', 'Separated'];
  const statusOptions = ['Available', 'In Process', 'Hired', 'Not Available', 'On Hold'];
  const remoteOptions = ['Remote', 'OnSite', 'Hybrid'];
  const workAuthOptions = ['US Citizen', 'Green Card', 'H1-B Visa', 'TN Visa', 'EAD', 'F1-OPT', 'F1-CPT', 'Other'];
  const employmentTypeOptions = ['Full-Time', 'Part-Time', 'Contract', 'Contract-to-Hire', 'Temporary', 'Internship', 'Freelance'];
  const securityClearanceOptions = ['None', 'Confidential', 'Secret', 'Top Secret', 'Top Secret/SCI', 'TS/SCI with Polygraph', 'Public Trust'];
  const industryOptions = ['Technology', 'Healthcare', 'Finance', 'Education', 'Manufacturing', 'Retail', 'Construction', 'Transportation', 'Hospitality', 'Legal', 'Marketing', 'Other'];
  const rateTypeOptions = ['Hourly', 'Daily', 'Weekly', 'Monthly', 'Annual'];

  useEffect(() => {
    const fetchCandidate = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const token = localStorage.getItem('token');
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };
        
        const res = await fetch(`${BASE_URL}/api/resumes/${id}`, {
          headers: headers,
        });
        
        if (!res.ok) {
          if (res.status === 401) {
            throw new Error('Unauthorized - Please login again');
          } else if (res.status === 404) {
            throw new Error('Candidate not found');
          } else {
            throw new Error(`Server error: ${res.status}`);
          }
        }
        
        const raw = await res.json();
        const transformed = transformCandidate(raw);
        
        setCandidate(transformed);
        setEditedCandidate(transformed);
        
      } catch (err) {
        console.error('Error loading candidate detail:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchCandidate();
    } else {
      setError('Invalid candidate ID');
      setLoading(false);
    }
  }, [id]);

  // Derived documents list (excluding resumes)
  const nonResumeDocs = useMemo(() => {
    const src = isEditing ? editedCandidate : candidate;
    return (src?.Documents || []).filter(doc => 
      doc.DocumentType?.toUpperCase() !== 'RESUME' && 
      !doc.IsPrimaryResume
    );
  }, [candidate, editedCandidate, isEditing]);

  const handleDownload = async (documentId, fileName) => {
    if (!documentId) {
      alert('No document available for download');
      return;
    }

    try {
      setPreviewLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/api/resumes/${documentId}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || 'document';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download document. Please try again.');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handlePreview = (documentId) => {
    if (!documentId) {
      alert('No document available for preview');
      return;
    }

    const token = localStorage.getItem('token');
    const previewUrl = `${BASE_URL}/api/resumes/${documentId}/preview?token=${token}`;
    window.open(previewUrl, '_blank');
  };

  const handleEdit = () => {
    setIsEditing(true);
    const edited = { ...candidate };
    edited.Documents = (candidate.Documents || []).filter(doc => doc.DocumentType !== 'Resume');
    setEditedCandidate(edited);

    // Use structured location fields from DB (preferred over string parsing)
    const rawCity        = candidate.LocationCity       || '';
    const rawStateCode   = candidate.LocationStateCode  || '';
    const rawCountryIso2 = candidate.LocationCountryIso2 || '';

    console.log('Location from DB fields:', { rawCity, rawStateCode, rawCountryIso2 });

    if (rawCity || rawCountryIso2) {
      // We have structured data from DB
      setLocCity(rawCity);
      setLocCountry(rawCountryIso2);

      // Convert state Code → full Name for the state search input
      if (rawStateCode && rawCountryIso2) {
        const stateName = Object.entries(stateMapping[rawCountryIso2] || {})
          .find(([, code]) => code.toUpperCase() === rawStateCode.toUpperCase())?.[0];
        setLocState(stateName || rawStateCode);
      } else {
        setLocState(rawStateCode);
      }
    } else {
      // Fallback: parse the CurrentLocation string  (e.g. "Jersey City, NJ, US")
      const loc = (candidate.CurrentLocation || '').trim();
      console.log('Fallback: parsing CurrentLocation string:', loc);
      if (loc) {
        const parts = loc.split(',').map(s => s.trim()).filter(Boolean);
        setLocCity(parts[0] || '');
        if (parts.length >= 3) {
          const countryCode = parts[2];
          setLocCountry(countryCode);
          const stateValue = parts[1];
          if (stateValue.length <= 3) {
            const stateName = Object.entries(stateMapping[countryCode] || {})
              .find(([, code]) => code.toUpperCase() === stateValue.toUpperCase())?.[0];
            setLocState(stateName || stateValue);
          } else {
            setLocState(stateValue);
          }
        } else if (parts.length === 2) {
          setLocState(parts[1]);
        }
      } else {
        setLocCity(''); setLocState(''); setLocCountry('');
      }
    }
    setStateSearch('');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedCandidate({ ...candidate });
    setLocCity(''); setLocState(''); setLocCountry(''); setStateSearch('');
  };

  const handleFieldEdit = (fieldPath, value) => {
    const fields = fieldPath.split('.');
    setEditedCandidate(prev => {
      const newState = { ...prev };
      let current = newState;
      
      for (let i = 0; i < fields.length - 1; i++) {
        if (!current[fields[i]]) current[fields[i]] = {};
        current = current[fields[i]];
      }
      
      current[fields[fields.length - 1]] = value;
      return newState;
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const formData = new FormData();
      
      // Basic fields
      formData.append('FirstName', formatName(editedCandidate.FirstName || ''));
      formData.append('LastName', formatName(editedCandidate.LastName || ''));
      formData.append('MiddleName', formatName(editedCandidate.MiddleName || ''));
      formData.append('EmailID', editedCandidate.Contact?.Email || '');
      formData.append('Phone', editedCandidate.Contact?.Phone || '');
      formData.append('Mobile', editedCandidate.Mobile || '');
      formData.append('JobTitle', formatJobTitle(editedCandidate.JobTitle || ''));
      formData.append('YearsOfExperience', editedCandidate.YearsOfExperience || '');
      formData.append('Gender', editedCandidate.Gender || '');
      formData.append('ProfileSummary', editedCandidate.ProfileSummary || '');
      formData.append('LinkedInProfile', editedCandidate.LinkedInUrl || '');
      formData.append('GitHubUrl', editedCandidate.GitHubUrl || '');
      formData.append('TwitterUrl', editedCandidate.TwitterUrl || '');
      formData.append('VideoResumeUrl', editedCandidate.VideoResumeUrl || '');
      formData.append('CandidateStatus', editedCandidate.CandidateStatus || 'Available');
      formData.append('RemoteStatus', editedCandidate.RemoteStatus || 'Remote');
      
      // Build CurrentLocation from sub-fields
      const builtLocation = (() => {
        const parts = [];
        
        // Add city if exists
        if (locCity?.trim()) {
          parts.push(locCity.trim());
        }
        
        // Add state (convert to code if needed)
        if (locState?.trim() && locCountry?.trim()) {
          const stateCode = getStateCode(locCountry, locState);
          parts.push(stateCode);
        } else if (locState?.trim()) {
          parts.push(locState.trim());
        }
        
        // Add country code
        if (locCountry?.trim()) {
          parts.push(locCountry.trim());
        }
        
        console.log('Built location parts:', parts); // Debug log
        
        // Return if we have any location parts
        if (parts.length >= 1) {
          return parts.join(', ');
        }
        
        // Fallback to existing location
        return editedCandidate.CurrentLocation || '';
      })();
      
      console.log('Saving location:', builtLocation); // Debug log
      formData.append('CurrentLocation', builtLocation);
      
      // New fields
      formData.append('WorkAuthorization', editedCandidate.WorkAuthorization || '');
      formData.append('EmploymentType', editedCandidate.EmploymentType || '');
      formData.append('SecurityClearance', editedCandidate.SecurityClearance || '');
      formData.append('WillingToRelocate', editedCandidate.WillingToRelocate ? 'true' : 'false');
      formData.append('IsBench', editedCandidate.IsBench ? 'true' : 'false');
      formData.append('ExpectedRateFrom', editedCandidate.ExpectedRateFrom || '');
      formData.append('ExpectedRateTo', editedCandidate.ExpectedRateTo || '');
      formData.append('ExpectedRateType', editedCandidate.ExpectedRateType || 'Hourly');
      formData.append('CurrentRate', editedCandidate.CurrentRate || '');
      formData.append('CurrentRateType', editedCandidate.CurrentRateType || 'Hourly');
      formData.append('MaritalStatus', editedCandidate.MaritalStatus || '');
      formData.append('Industry', editedCandidate.Industry || '');
      
      // Skills
      const skillsList = (editedCandidate.Skills || []).map(s => s.SkillName).filter(Boolean);
      formData.append('Skills', JSON.stringify(skillsList));
      
      // Work Experience
      const workList = (editedCandidate.WorkExperience || [])
        .filter(exp => exp.Company || exp.JobTitle)
        .map(exp => ({
          Company: exp.Company,
          JobTitle: formatJobTitle(exp.JobTitle),
          StartDate: exp.StartDate,
          EndDate: exp.EndDate,
          IsCurrent: exp.IsCurrent,
          Description: exp.Description,
          WorkExperienceId: exp.WorkExperienceId && !exp.WorkExperienceId.toString().startsWith('temp-') ? exp.WorkExperienceId : null
        }));
      formData.append('WorkExperience', JSON.stringify(workList));
      
      // Education
      const eduList = (editedCandidate.Education || [])
        .filter(edu => edu.Institution || edu.Degree)
        .map(edu => ({
          Institution: formatName(edu.Institution),
          Degree: formatName(edu.Degree),
          FieldOfStudy: edu.FieldOfStudy,
          StartDate: edu.StartDate,
          EndDate: edu.EndDate,
          GPA: edu.GPA,
          EducationId: edu.EducationId && !edu.EducationId.toString().startsWith('temp-') ? edu.EducationId : null
        }));
      formData.append('Education', JSON.stringify(eduList));
      
      // Certifications
      const certList = (editedCandidate.Certifications || [])
        .filter(cert => cert.CertificationName)
        .map(cert => ({
          CertificationName: formatName(cert.CertificationName),
          IssuingOrganization: cert.IssuingOrganization,
          IssueDate: cert.IssueDate,
          ExpiryDate: cert.ExpiryDate,
          CredentialId: cert.CredentialId,
          CredentialUrl: cert.CredentialUrl,
          CertificationId: cert.CertificationId && !cert.CertificationId.toString().startsWith('temp-') ? cert.CertificationId : null
        }));
      formData.append('Certifications', JSON.stringify(certList));

      // Handle new document files
      const newDocs = (editedCandidate.Documents || []).filter(d => d.isNew && d.File);
      newDocs.forEach((doc, index) => {
        formData.append(`AdditionalDoc_${index}`, doc.File);
        formData.append(`AdditionalDoc_${index}_Name`, doc.DocumentName || doc.File.name);
        formData.append(`AdditionalDoc_${index}_Type`, doc.DocumentType || 'Certificate');
      });
      formData.append('AdditionalDocsCount', String(newDocs.length));

      const response = await fetch(`${BASE_URL}/api/resumes/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      const responseData = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(responseData.error || responseData.detail || `HTTP error ${response.status}`);
      }

      // Refresh candidate data
      const refreshRes = await fetch(`${BASE_URL}/api/resumes/${id}`, {
        headers: getAuthHeaders(),
      });
      const refreshedRaw = await refreshRes.json();
      const refreshedCandidate = transformCandidate(refreshedRaw);
      
      setCandidate(refreshedCandidate);
      setEditedCandidate(refreshedCandidate);
      setIsEditing(false);
      
      Swal.fire({
        title: 'Success!',
        text: 'Candidate updated successfully.',
        icon: 'success',
        timer: 1800,
        showConfirmButton: false
      });

    } catch (error) {
      console.error('Error updating candidate:', error);
      Swal.fire({
        title: 'Error',
        text: error.message || 'Failed to update candidate',
        icon: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="cm-loading-container">
        <div className="cm-loading-spinner"></div>
        <p className="cm-loading-text">Loading candidate details...</p>
      </div>
    );
  }

  if (error || !candidate) {
    return (
      <div className="candidate-detail-container">
        <div style={{ 
          padding: '40px 20px', 
          color: '#ef4444', 
          fontSize: 16, 
          textAlign: 'center',
          backgroundColor: '#fef2f2',
          borderRadius: '8px',
          margin: '20px'
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Error Loading Candidate</div>
          <div style={{ color: '#666', marginBottom: 20 }}>{error || 'Candidate not found.'}</div>
          <button
            onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/resume-dashboard')}
            className="candidate-detail-btn"
            style={{ margin: '0 auto' }}
          >
            <ArrowLeft size={16} /> Back to Candidates
          </button>
        </div>
      </div>
    );
  }

  const c = isEditing ? editedCandidate : candidate;
  const fullName = formatFullName(c.FirstName, c.MiddleName, c.LastName);
  const statusStyle = STATUS_COLORS[c.CandidateStatus] || STATUS_COLORS['On Hold'];
  const remoteStyle = REMOTE_COLORS[c.RemoteStatus]   || REMOTE_COLORS['OnSite'];
  const bgColor     = avatarColor(fullName || 'Unknown');
  const initials    = getInitials(c.FirstName, c.LastName);

  // Get currency symbol based on country
  const currencySymbol = CURRENCY_MAP[locCountry]?.symbol || '$';

  // Format expected rate range with currency symbol
  const expectedRateRange = c.ExpectedRateFrom && c.ExpectedRateTo 
    ? `${currencySymbol}${c.ExpectedRateFrom} - ${currencySymbol}${c.ExpectedRateTo} ${c.ExpectedRateType}`
    : c.ExpectedRateFrom 
      ? `${currencySymbol}${c.ExpectedRateFrom} ${c.ExpectedRateType}`
      : c.ExpectedRateTo
        ? `Up to ${currencySymbol}${c.ExpectedRateTo} ${c.ExpectedRateType}`
        : null;

  const currentRateValue = c.CurrentRate 
    ? `${currencySymbol}${c.CurrentRate} ${c.CurrentRateType}`
    : null;

  const tabs = ['overview', 'experience', 'education', 'resume', 'documents'];

  return (
    <div className="candidate-detail-container">

      {/* Breadcrumb */}
      <div className="cm-breadcrumb">
        <span className="cm-breadcrumb-home" onClick={() => navigate('/')}>Home</span>
        <ChevronRight size={13} className="cm-breadcrumb-sep" />
        <span className="cm-breadcrumb-home" onClick={() => navigate(-1)}>Candidates</span>
        <ChevronRight size={13} className="cm-breadcrumb-sep" />
        <span className="cm-breadcrumb-current">{fullName}</span>
      </div>

      {/* Header with Edit/Save buttons */}
      <div className="candidate-detail-header">
        <div className="candidate-detail-title" style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: bgColor, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, fontWeight: 800, flexShrink: 0,
            boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
          }}>
            {initials}
          </div>
          <div style={{ flex: 1 }}>
            {isEditing ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  value={c.FirstName || ''}
                  onChange={(e) => handleFieldEdit('FirstName', formatName(e.target.value))}
                  placeholder="First Name"
                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid #229C8B', fontSize: '20px', fontWeight: 'bold', flex: 1 }}
                />
                <input
                  type="text"
                  value={c.MiddleName || ''}
                  onChange={(e) => handleFieldEdit('MiddleName', formatName(e.target.value))}
                  placeholder="Middle Name"
                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid #229C8B', fontSize: '20px', fontWeight: 'bold', flex: 1 }}
                />
                <input
                  type="text"
                  value={c.LastName || ''}
                  onChange={(e) => handleFieldEdit('LastName', formatName(e.target.value))}
                  placeholder="Last Name"
                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid #229C8B', fontSize: '20px', fontWeight: 'bold', flex: 1 }}
                />
              </div>
            ) : (
              <h1 style={{ margin: 0 }}>{fullName}</h1>
            )}
            {isEditing ? (
              <input
                type="text"
                value={c.JobTitle || ''}
                onChange={(e) => handleFieldEdit('JobTitle', formatJobTitle(e.target.value))}
                placeholder="Job Title"
                style={{ marginTop: '8px', padding: '8px', borderRadius: '4px', border: '1px solid #229C8B', fontSize: '18px', width: '100%' }}
              />
            ) : (
              <h2 style={{ margin: '4px 0 0', color: '#666', fontSize: 18 }}>{c.JobTitle || 'No Title Specified'}</h2>
            )}
          </div>
        </div>

        <div className="candidate-detail-actions" style={{ display: 'flex', gap: '10px' }}>
          {isEditing ? (
            <>
              <button 
                className="candidate-detail-btn candidate-detail-btn-outline" 
                onClick={handleCancel}
                disabled={saving}
                style={{ borderColor: '#ef4444', color: '#ef4444' }}
              >
                <X size={16} /> Cancel
              </button>
              <button 
                className="candidate-detail-btn candidate-detail-btn-primary" 
                onClick={handleSave}
                disabled={saving}
                style={{ background: '#229C8B', color: '#fff' }}
              >
                <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          ) : (
            <>
              <button className="candidate-detail-btn candidate-detail-btn-outline" onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/resume-dashboard')}>
                <ArrowLeft size={16} /> Back
              </button>
              <button 
                className="candidate-detail-btn candidate-detail-btn-primary" 
                onClick={handleEdit}
                style={{ background: '#229C8B', color: '#fff' }}
              >
                <Edit size={16} /> Edit
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="candidate-detail-tabs">
        {tabs.map(tab => (
          <button
            key={tab}
            className={`candidate-detail-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => { setActiveTab(tab); setSelectedResumeId(null); }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="candidate-detail-content">

        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <div>
            <div className="candidate-info-grid">
              {/* Personal Information Card */}
              <EditSection isEditing={isEditing}>
                <div className="candidate-info-card">
                  <h3><User size={16} style={{ marginRight: 8 }} />Personal Information</h3>
                  <InfoRow 
                    label="Full Name" 
                    value={fullName} 
                    isEditing={false} 
                  />
                  <InfoRow 
                    label="Gender" 
                    value={c.Gender} 
                    isEditing={isEditing}
                    fieldName="Gender"
                    onEdit={handleFieldEdit}
                    options={genderOptions}
                  />
                  <InfoRow 
                    label="Marital Status" 
                    value={c.MaritalStatus} 
                    isEditing={isEditing}
                    fieldName="MaritalStatus"
                    onEdit={handleFieldEdit}
                    options={maritalStatusOptions}
                  />
                  <InfoRow label="Candidate Code" value={c.CandidateCode} isEditing={false} />
                  {c.EmployeeCode && (
                    <InfoRow label="Employee ID" value={c.EmployeeCode} isEditing={false} />
                  )}
                  <InfoRow 
                    label="Years of Experience" 
                    value={c.YearsOfExperience}
                    displayValue={c.YearsOfExperience != null ? `${c.YearsOfExperience} years` : null}
                    isEditing={isEditing}
                    fieldName="YearsOfExperience"
                    onEdit={handleFieldEdit}
                    type="number"
                  />
                  <InfoRow 
                    label="Current Location" 
                    value={c.CurrentLocation} 
                    isEditing={false}
                    fieldName="CurrentLocation"
                    onEdit={handleFieldEdit}
                  />
                {isEditing && (
  <div style={{ marginBottom: '8px' }}>
    {/* Country */}
    <div className="candidate-info-row">
      <span className="candidate-info-label">Country</span>
      <span className="candidate-info-value">
        <select
          value={locCountry}
          onChange={e => { 
            setLocCountry(e.target.value); 
            setLocState(''); 
            setStateSearch(''); 
          }}
          className="edit-select"
          style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #229C8B', fontSize: '13px', width: '100%' }}
        >
          <option value="">Select Country</option>
          {countriesData.map(c => (
            <option key={c.code} value={c.code}>{c.name}</option>
          ))}
        </select>
      </span>
    </div>
    
    {/* State */}
    <div className="candidate-info-row">
      <span className="candidate-info-label">State</span>
      <span className="candidate-info-value">
        {locCountry ? (
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Search and select state..."
              value={stateSearch !== '' ? stateSearch : locState}
              onChange={e => {
                setStateSearch(e.target.value);
              }}
              onFocus={() => {
                setStateSearch(locState);
              }}
              onBlur={() => {
                setTimeout(() => setStateSearch(''), 150);
              }}
              className="edit-input"
              autoComplete="off"
              style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #229C8B', fontSize: '13px', width: '100%' }}
            />
            {stateSearch !== '' && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0,
                background: '#fff', border: '1px solid #229C8B',
                borderRadius: '4px', maxHeight: '180px', overflowY: 'auto',
                zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,0.12)'
              }}>
                {getStatesForCountry(locCountry)
                  .filter(s => s.toLowerCase().includes(stateSearch.toLowerCase()))
                  .slice(0, 20)
                  .map(s => (
                    <div
                      key={s}
                      onMouseDown={e => {
                        e.preventDefault(); // Prevent onBlur from firing before click registers
                        setLocState(s);
                        setStateSearch('');
                      }}
                      style={{
                        padding: '7px 12px', cursor: 'pointer',
                        fontSize: '13px', borderBottom: '1px solid #f3f4f6',
                        background: locState === s ? '#e6f7f5' : '#fff', color: '#374151'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f0faf9'}
                      onMouseLeave={e => e.currentTarget.style.background = locState === s ? '#e6f7f5' : '#fff'}
                    >
                      {s}
                    </div>
                  ))}
                {getStatesForCountry(locCountry).filter(s => s.toLowerCase().includes(stateSearch.toLowerCase())).length === 0 && (
                  <div style={{ padding: '8px 12px', fontSize: '12px', color: '#9ca3af' }}>No states found</div>
                )}
              </div>
            )}
          </div>
        ) : (
          <input
            type="text"
            className="edit-input"
            placeholder="Select country first"
            disabled
            value=""
            style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '13px', width: '100%', background: '#f9fafb', color: '#9ca3af' }}
          />
        )}
      </span>
    </div>
    
    {/* City */}
    <div className="candidate-info-row">
      <span className="candidate-info-label">City</span>
      <span className="candidate-info-value">
        <input
          type="text"
          value={locCity}
          onChange={e => setLocCity(e.target.value)}
          placeholder="Enter city name"
          className="edit-input"
          style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #229C8B', fontSize: '13px', width: '100%' }}
        />
      </span>
    </div>
  </div>
)}
                  <InfoRow 
                    label="Willing to Relocate" 
                    value={c.WillingToRelocate}
                    displayValue={c.WillingToRelocate ? 
                      <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <CheckCircle size={14} /> Yes
                      </span> : 
                      <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <XCircle size={14} /> No
                      </span>
                    }
                    isEditing={isEditing}
                    fieldName="WillingToRelocate"
                    onEdit={handleFieldEdit}
                    type="checkbox"
                  />
                  <InfoRow 
                    label="Bench Candidate" 
                    value={c.IsBench}
                    displayValue={c.IsBench ? 
                      <span style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                        <CheckCircle size={14} /> Yes — On Bench
                      </span> : 
                      <span style={{ color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <XCircle size={14} /> No
                      </span>
                    }
                    isEditing={isEditing}
                    fieldName="IsBench"
                    onEdit={handleFieldEdit}
                    type="checkbox"
                  />
                </div>
              </EditSection>

              {/* Contact Card - WITH COPY FUNCTIONALITY */}
              <EditSection isEditing={isEditing}>
                <div className="candidate-info-card">
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Mail size={16} color="#229C8B" />
                    Contact & Social
                  </h3>
                  <InfoRow 
                    label="Email" 
                    value={c.Contact?.Email}
                    displayValue={c.Contact?.Email ? (
                      <CopyableText 
                        text={c.Contact.Email} 
                        icon={Mail}
                        label="Email"
                      />
                    ) : null}
                    isEditing={isEditing}
                    fieldName="Contact.Email"
                    onEdit={handleFieldEdit}
                    type="email"
                  />
                  
                  <InfoRow 
                    label="Mobile" 
                    value={c.Mobile} 
                    displayValue={c.Mobile ? (
                      <CopyableText 
                        text={formatPhone(c.Mobile)} 
                        icon={Phone}
                        label="Mobile number"
                      />
                    ) : null}
                    isEditing={isEditing}
                    fieldName="Mobile"
                    onEdit={handleFieldEdit}
                    type="mobile"
                    countryCode={locCountry}
                  />

                  <InfoRow 
                    label="Phone" 
                    value={c.Contact?.Phone} 
                    displayValue={c.Contact?.Phone ? (
                      <CopyableText 
                        text={formatPhone(c.Contact.Phone)} 
                        icon={Phone}
                        label="Phone number"
                      />
                    ) : null}
                    isEditing={isEditing}
                    fieldName="Contact.Phone"
                    onEdit={handleFieldEdit}
                    type="tel"
                  />
                  
                  <InfoRow 
                    label="LinkedIn" 
                    value={c.LinkedInUrl}
                    displayValue={c.LinkedInUrl ? (
                      <CopyableLink 
                        href={c.LinkedInUrl}
                        text="View Profile"
                        icon={Linkedin}
                        label="LinkedIn"
                      />
                    ) : null}
                    isEditing={isEditing}
                    fieldName="LinkedInUrl"
                    onEdit={handleFieldEdit}
                    type="url"
                  />
                  
                  <InfoRow 
                    label="GitHub" 
                    value={c.GitHubUrl}
                    displayValue={c.GitHubUrl ? (
                      <CopyableLink 
                        href={c.GitHubUrl}
                        text="View Profile"
                        icon={Github}
                        label="GitHub"
                      />
                    ) : null}
                    isEditing={isEditing}
                    fieldName="GitHubUrl"
                    onEdit={handleFieldEdit}
                    type="url"
                  />

                  <InfoRow 
                    label="Twitter" 
                    value={c.TwitterUrl}
                    displayValue={c.TwitterUrl ? (
                      <CopyableLink 
                        href={c.TwitterUrl}
                        text="View Profile"
                        icon={Twitter}
                        label="Twitter"
                      />
                    ) : null}
                    isEditing={isEditing}
                    fieldName="TwitterUrl"
                    onEdit={handleFieldEdit}
                    type="url"
                  />

                  <InfoRow 
                    label="Video Resume" 
                    value={c.VideoResumeUrl}
                    displayValue={c.VideoResumeUrl ? (
                      <CopyableLink 
                        href={c.VideoResumeUrl}
                        text="Watch Video"
                        icon={Video}
                        label="Video Resume"
                      />
                    ) : null}
                    isEditing={isEditing}
                    fieldName="VideoResumeUrl"
                    onEdit={handleFieldEdit}
                    type="url"
                  />
                </div>
              </EditSection>

              {/* Employment Details Card */}
              <EditSection isEditing={isEditing}>
                <div className="candidate-info-card">
                  <h3><Briefcase size={16} style={{ marginRight: 8 }} />Employment Details</h3>
                  <InfoRow 
                    label="Work Authorization" 
                    value={c.WorkAuthorization} 
                    isEditing={isEditing}
                    fieldName="WorkAuthorization"
                    onEdit={handleFieldEdit}
                    options={workAuthOptions}
                  />
                  <InfoRow 
                    label="Employment Type" 
                    value={c.EmploymentType} 
                    isEditing={isEditing}
                    fieldName="EmploymentType"
                    onEdit={handleFieldEdit}
                    options={employmentTypeOptions}
                  />
                  <InfoRow 
                    label="Security Clearance" 
                    value={c.SecurityClearance} 
                    isEditing={isEditing}
                    fieldName="SecurityClearance"
                    onEdit={handleFieldEdit}
                    options={securityClearanceOptions}
                  />
                  <InfoRow 
                    label="Industry" 
                    value={c.Industry} 
                    isEditing={isEditing}
                    fieldName="Industry"
                    onEdit={handleFieldEdit}
                    options={industryOptions}
                  />
                  <InfoRow 
                    label="Remote Status" 
                    value={c.RemoteStatus}
                    displayValue={
                      <span className="cm-status-badge" style={{ background: remoteStyle.bg, color: remoteStyle.color }}>
                        {c.RemoteStatus === 'OnSite' ? 'On-Site' : c.RemoteStatus}
                      </span>
                    }
                    isEditing={isEditing}
                    fieldName="RemoteStatus"
                    onEdit={handleFieldEdit}
                    options={remoteOptions}
                  />
                </div>
              </EditSection>

              {/* Compensation Card */}
              <EditSection isEditing={isEditing}>
                <div className="candidate-info-card">
                  <h3><DollarSign size={16} style={{ marginRight: 8 }} />Compensation</h3>
                  {isEditing ? (
                    <>
                      <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
                        <div style={{ position: 'relative', width: '30%' }}>
                          <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: '#6b7280' }}>
                            {currencySymbol}
                          </span>
                          <input
                            type="number"
                            value={c.ExpectedRateFrom || ''}
                            onChange={(e) => handleFieldEdit('ExpectedRateFrom', e.target.value)}
                            placeholder="From"
                            style={{ padding: '4px 4px 4px 24px', borderRadius: '4px', border: '1px solid #229C8B', width: '100%' }}
                          />
                        </div>
                        <div style={{ position: 'relative', width: '30%' }}>
                          <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: '#6b7280' }}>
                            {currencySymbol}
                          </span>
                          <input
                            type="number"
                            value={c.ExpectedRateTo || ''}
                            onChange={(e) => handleFieldEdit('ExpectedRateTo', e.target.value)}
                            placeholder="To"
                            style={{ padding: '4px 4px 4px 24px', borderRadius: '4px', border: '1px solid #229C8B', width: '100%' }}
                          />
                        </div>
                        <select
                          value={c.ExpectedRateType || 'Hourly'}
                          onChange={(e) => handleFieldEdit('ExpectedRateType', e.target.value)}
                          style={{ padding: '4px', borderRadius: '4px', border: '1px solid #229C8B', width: '40%' }}
                        >
                          {rateTypeOptions.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <div style={{ position: 'relative', width: '60%' }}>
                          <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: '#6b7280' }}>
                            {currencySymbol}
                          </span>
                          <input
                            type="number"
                            value={c.CurrentRate || ''}
                            onChange={(e) => handleFieldEdit('CurrentRate', e.target.value)}
                            placeholder="Current Rate"
                            style={{ padding: '4px 4px 4px 24px', borderRadius: '4px', border: '1px solid #229C8B', width: '100%' }}
                          />
                        </div>
                        <select
                          value={c.CurrentRateType || 'Hourly'}
                          onChange={(e) => handleFieldEdit('CurrentRateType', e.target.value)}
                          style={{ padding: '4px', borderRadius: '4px', border: '1px solid #229C8B', width: '40%' }}
                        >
                          {rateTypeOptions.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                    </>
                  ) : (
                    <>
                      {expectedRateRange && (
                        <InfoRow label="Expected Rate" value={expectedRateRange} />
                      )}
                      {currentRateValue && (
                        <InfoRow label="Current Rate" value={currentRateValue} />
                      )}
                      {!expectedRateRange && !currentRateValue && (
                        <p style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: 13 }}>No compensation information available</p>
                      )}
                    </>
                  )}
                </div>
              </EditSection>

              {/* Application Card */}
              <EditSection isEditing={isEditing}>
                <div className="candidate-info-card">
                  <h3><Briefcase size={16} style={{ marginRight: 8 }} />Application</h3>
                  <div className="candidate-info-row">
                    <span className="candidate-info-label">Status</span>
                    <span className="candidate-info-value">
                      {isEditing ? (
                        <select
                          value={c.CandidateStatus}
                          onChange={(e) => handleFieldEdit('CandidateStatus', e.target.value)}
                          style={{ padding: '4px', borderRadius: '4px', border: '1px solid #229C8B' }}
                        >
                          {statusOptions.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="cm-status-badge" style={{ background: statusStyle.bg, color: statusStyle.color }}>
                          {c.CandidateStatus}
                        </span>
                      )}
                    </span>
                  </div>
                  <InfoRow label="Job Title" value={c.JobTitle} isEditing={false} />
                  <InfoRow label="Created By" value={c.CreatedBy} isEditing={false} />
                  <InfoRow label="Created Date" value={formatDate(c.CreatedDt)} isEditing={false} />
                  {c.UpdatedDt && <InfoRow label="Last Updated" value={formatDate(c.UpdatedDt)} isEditing={false} />}
                </div>
              </EditSection>
            </div>

            {c.ProfileSummary && (
              <div className="candidate-skills-section">
                <h3><FileText size={16} style={{ marginRight: 8 }} />Profile Summary</h3>
                {isEditing ? (
                  <textarea
                    value={c.ProfileSummary || ''}
                    onChange={(e) => handleFieldEdit('ProfileSummary', e.target.value)}
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '4px',
                      border: '1px solid #229C8B',
                      fontSize: '14px',
                      lineHeight: '1.8',
                      color: '#374151'
                    }}
                  />
                ) : (
                  <p style={{ fontSize: 14, lineHeight: 1.8, color: '#374151', margin: 0 }}>{c.ProfileSummary}</p>
                )}
              </div>
            )}

            {c.Skills && c.Skills.length > 0 && (
              <div className="candidate-skills-section">
                <h3><Award size={16} style={{ marginRight: 8 }} />Skills ({c.Skills.length})</h3>
                <div className="candidate-skills-tags" style={{ gap: 8 }}>
                  {c.Skills.map((skill, i) => {
                    const sc = SKILL_TYPE_COLORS[skill.SkillType] || SKILL_TYPE_COLORS['HARD'];
                    return (
                      <span key={i} style={{
                        background: sc.bg, color: sc.color,
                        padding: '5px 14px', borderRadius: 20,
                        fontSize: 13, fontWeight: 600,
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        border: `1px solid ${sc.color}33`,
                      }}>
                        {skill.SkillName}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* EXPERIENCE */}
        {activeTab === 'experience' && (
          <div>
            <h3 style={{ fontSize: 18, marginBottom: 10, color: '#111' }}>
              Work Experience
              {c.WorkExperience && c.WorkExperience.length > 0 && (
                <span style={{ fontSize: 13, fontWeight: 500, color: '#6b7280', marginLeft: 8 }}>
                  ({c.WorkExperience.length} {c.WorkExperience.length === 1 ? 'role' : 'roles'})
                </span>
              )}
            </h3>
            {isEditing ? (
              <WorkExperienceEditor 
                experiences={c.WorkExperience || []}
                onChange={(newExperiences) => handleFieldEdit('WorkExperience', newExperiences)}
              />
            ) : (
              c.WorkExperience && c.WorkExperience.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {c.WorkExperience.map((exp, i) => (
                    <div key={i} style={{
                      background: '#f8f9fa', borderRadius: 10, padding: '20px 24px',
                      border: '1px solid #e5e7eb', borderLeft: '4px solid #229C8B',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 16, color: '#111' }}>{exp.JobTitle || '—'}</div>
                        </div>
                        <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 500, textAlign: 'right', display: 'flex', alignItems: 'center', gap: 6 }}>
                          {exp.Company && (
                            <span style={{ color: '#229C8B', fontWeight: 600, fontSize: 14 }}>{exp.Company}</span>
                          )}
                          {exp.Company && <span style={{ color: '#9ca3af' }}>|</span>}
                          <span>
                            {formatMonthYear(exp.StartDate)} — {exp.IsCurrent
                              ? <span style={{ color: '#229C8B', fontWeight: 700 }}>Present</span>
                              : formatMonthYear(exp.EndDate)}
                          </span>
                          {exp.IsCurrent && (
                            <div style={{ fontSize: 11, color: '#229C8B', marginTop: 2 }}>Current Role</div>
                          )}
                        </div>
                      </div>
                      {exp.Description && (
                        <p style={{ fontSize: 14, color: '#555', lineHeight: 1.7, margin: 0 }}>{exp.Description}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#9ca3af', fontStyle: 'italic' }}>No work experience recorded.</p>
              )
            )}
          </div>
        )}

        {/* EDUCATION */}
        {activeTab === 'education' && (
          <div>
            <h3 style={{ fontSize: 18, marginBottom: 10, color: '#111' }}>
              <GraduationCap size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />
              Education
            </h3>
            {isEditing ? (
              <EducationEditor 
                educations={c.Education || []}
                onChange={(newEducation) => handleFieldEdit('Education', newEducation)}
              />
            ) : (
              c.Education && c.Education.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 16 }}>
                  {c.Education.map((edu, i) => (
                    <div key={i} style={{ background: '#f8f9fa', borderRadius: 10, padding: '18px 24px', border: '1px solid #e5e7eb' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                        <div style={{ fontWeight: 700, fontSize: 15, color: '#111' }}>
                          {edu.Degree}{edu.FieldOfStudy ? ` in ${edu.FieldOfStudy}` : ''}
                        </div>
                        <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 500, whiteSpace: 'nowrap' }}>
                          {formatMonthYear(edu.StartDate)} — {formatMonthYear(edu.EndDate)}
                        </div>
                      </div>
                      <div style={{ fontSize: 13, color: '#229C8B', fontWeight: 600, marginTop: 4 }}>{edu.Institution}</div>
                      {edu.GPA && <div style={{ fontSize: 12, color: '#374151', fontWeight: 600, marginTop: 4 }}>GPA: {edu.GPA}</div>}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#9ca3af', fontStyle: 'italic', marginBottom: 28 }}>No education recorded.</p>
              )
            )}

            <h3 style={{ fontSize: 18, marginBottom: 16, color: '#111' }}>
              <Award size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />
              Certifications
            </h3>
            {isEditing ? (
              <CertificationEditor 
                certifications={c.Certifications || []}
                onChange={(newCerts) => handleFieldEdit('Certifications', newCerts)}
              />
            ) : (
              c.Certifications && c.Certifications.length > 0 ? (
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(2, 1fr)', 
                  gap: '14px'
                }}>
                  {c.Certifications.map((cert, i) => (
                    <div key={i} style={{ 
                      background: '#f0fdf4', 
                      borderRadius: 10, 
                      padding: '18px 20px', 
                      border: '1px solid #bbf7d0',
                      height: 'fit-content'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                        <div style={{ fontWeight: 700, fontSize: 15, color: '#111' }}>{cert.CertificationName}</div>
                        <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                          {cert.IssuingOrganization && (
                            <span style={{ color: '#065f46', fontWeight: 600, fontSize: 13 }}>{cert.IssuingOrganization}</span>
                          )}
                          {cert.IssuingOrganization && <span style={{ color: '#9ca3af' }}>|</span>}
                          <span>Issued: {formatMonthYear(cert.IssueDate) || '—'}</span>
                        </div>
                      </div>
                      {cert.ExpiryDate && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Expires: {formatMonthYear(cert.ExpiryDate)}</div>}
                      {cert.CredentialId && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>ID: {cert.CredentialId}</div>}
                      {cert.CredentialUrl && (
                        <a href={cert.CredentialUrl} target="_blank" rel="noopener noreferrer"
                          style={{ fontSize: 12, color: '#229C8B', marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
                          Verify <ExternalLink size={11} />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#9ca3af', fontStyle: 'italic' }}>No certifications recorded.</p>
              )
            )}
          </div>
        )}

        {/* RESUME */}
        {activeTab === 'resume' && (() => {
          const resumeDocs = c.Documents 
            ? c.Documents.filter(doc => doc.DocumentType?.toUpperCase() === 'RESUME' || doc.IsPrimaryResume)
            : [];
          if (resumeDocs.length === 0 && c.Document && c.Document.FileNameOriginal) {
            resumeDocs.push(c.Document);
          }

          return (
            <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
              <div style={{ flex: selectedResumeId ? '0 0 350px' : '1', transition: 'all 0.3s' }}>
                <h3 style={{ fontSize: 18, marginBottom: 10, color: '#111' }}>
                  <FileText size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                  Resume Document{resumeDocs.length > 1 ? 's' : ''}
                </h3>
                {resumeDocs.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {resumeDocs.map((doc, index) => (
                      <div key={doc.DocumentId || index} className="candidate-document-item" style={{ 
                        background: '#ffffff',
                        border: selectedResumeId === doc.DocumentId ? '2px solid #229C8B' : '1px solid #e5e7eb'
                      }}>
                        <FileText size={28} className="candidate-document-icon" />
                        <div className="candidate-document-info">
                          <div className="candidate-document-name" title={doc.FileNameOriginal || doc.DocumentName}>
                            {truncateText(doc.FileNameOriginal || doc.DocumentName)}
                          </div>
                          <div className="candidate-document-meta">
                            {doc.FileSizeBytes && <span>Size: {formatFileSize(doc.FileSizeBytes)}</span>}
                            {doc.FileExtension && <span>Type: {doc.FileExtension.toUpperCase().replace('.', '')}</span>}
                            {doc.ParseStatus && <span>Status: {doc.ParseStatus}</span>}
                            {doc.IsPrimaryResume && <span style={{ color: '#229C8B', fontWeight: 600 }}>Primary</span>}
                          </div>
                        </div>
                        <div className="candidate-document-actions" style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            className="candidate-document-btn" 
                            onClick={() => setSelectedResumeId(selectedResumeId === doc.DocumentId ? null : doc.DocumentId)}
                            title={selectedResumeId === doc.DocumentId ? "Close Preview" : "Preview Resume"}
                            style={{ 
                              background: selectedResumeId === doc.DocumentId ? '#229C8B' : 'transparent',
                              color: selectedResumeId === doc.DocumentId ? '#fff' : 'inherit'
                            }}
                          >
                            <Eye size={14} /> Preview
                          </button>
                          <button 
                            className="candidate-document-btn" 
                            onClick={() => handleDownload(doc.DocumentId, doc.FileNameOriginal)}
                            disabled={previewLoading}
                          >
                            <Download size={14} /> Download
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', color: '#9ca3af' }}>
                    <FileText size={56} style={{ marginBottom: 14, opacity: 0.35 }} />
                    <p style={{ margin: 0, fontSize: 15 }}>No resume document available</p>
                  </div>
                )}
              </div>

              {selectedResumeId && (
                <div style={{ flex: '1', minWidth: '400px', height: '800px', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', background: '#fff' }}>
                  <div style={{ background: '#f9fafb', padding: '10px 16px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Eye size={16} color="#229C8B" />
                      Preview: {truncateText(resumeDocs.find(d => d.DocumentId === selectedResumeId)?.FileNameOriginal || '')}
                    </span>
                    <button 
                      onClick={() => setSelectedResumeId(null)} 
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}
                    >
                      <X size={18} />
                    </button>
                  </div>
                  <iframe 
                    src={`${BASE_URL}/api/resumes/${selectedResumeId}/preview?token=${localStorage.getItem('token')}`} 
                    style={{ width: '100%', height: 'calc(100% - 44px)', border: 'none' }} 
                    title="Resume Preview" 
                  />
                </div>
              )}
            </div>
          );
        })()}

        {/* DOCUMENTS */}
        {activeTab === 'documents' && (
          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
            <div style={{ flex: selectedResumeId ? '0 0 350px' : '1', transition: 'all 0.3s' }}>
              <h3 style={{ fontSize: 18, marginBottom: 16, color: '#111' }}>
                <FileText size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                Additional Documents ({nonResumeDocs.length})
              </h3>
              
              {isEditing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ padding: '12px', background: '#fef3c7', borderRadius: '8px', border: '1px solid #fde68a', marginBottom: '16px', fontSize: '13px', color: '#92400e' }}>
                    <strong>Note:</strong> Resumes are managed in the dedicated "Resume" tab.
                  </div>
                  <DocumentEditor 
                    documents={nonResumeDocs}
                    onChange={(updatedNonResumes) => {
                      // When editing additional docs, we must preserve the resumes in the original candidate state
                      const otherDocs = (c.Documents || []).filter(doc => 
                        doc.DocumentType?.toUpperCase() === 'RESUME' || doc.IsPrimaryResume
                      );
                      handleFieldEdit('Documents', [...otherDocs, ...updatedNonResumes]);
                    }}
                    candidateId={id}
                  />
                </div>
              ) : (
                nonResumeDocs.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {nonResumeDocs.map((doc, index) => (
                      <div key={doc.DocumentId || index} className="candidate-document-item" style={{ 
                        background: '#ffffff',
                        border: selectedResumeId === doc.DocumentId ? '2px solid #229C8B' : '1px solid #e5e7eb'
                      }}>
                        <FileText size={28} className="candidate-document-icon" />
                        <div className="candidate-document-info">
                          <div className="candidate-document-name" title={doc.DocumentName || doc.FileNameOriginal}>
                            {truncateText(doc.DocumentName || doc.FileNameOriginal)}
                          </div>
                          <div className="candidate-document-meta">
                            {doc.DocumentType && <span>Type: {doc.DocumentType}</span>}
                            {doc.FileSizeBytes && <span>Size: {formatFileSize(doc.FileSizeBytes)}</span>}
                            {doc.FileExtension && <span>Format: {doc.FileExtension.toUpperCase().replace('.', '')}</span>}
                          </div>
                        </div>
                        <div className="candidate-document-actions" style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            className="candidate-document-btn"
                            onClick={() => setSelectedResumeId(selectedResumeId === doc.DocumentId ? null : doc.DocumentId)}
                            title={selectedResumeId === doc.DocumentId ? "Close Preview" : "Preview Document"}
                            style={{ 
                              background: selectedResumeId === doc.DocumentId ? '#229C8B' : 'transparent',
                              color: selectedResumeId === doc.DocumentId ? '#fff' : 'inherit'
                            }}
                          >
                            <Eye size={14} /> Preview
                          </button>
                          <button 
                            className="candidate-document-btn"
                            onClick={() => handleDownload(doc.DocumentId, doc.FileNameOriginal)}
                          >
                            <Download size={14} /> Download
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', color: '#9ca3af' }}>
                    <FileText size={56} style={{ marginBottom: 14, opacity: 0.35 }} />
                    <p style={{ margin: 0, fontSize: 15 }}>No additional documents available</p>
                  </div>
                )
              )}
            </div>

            {selectedResumeId && (
              <div style={{ flex: '1', minWidth: '400px', height: '800px', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', background: '#fff' }}>
                <div style={{ background: '#f9fafb', padding: '10px 16px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Eye size={16} color="#229C8B" />
                    Preview: {truncateText(c.Documents?.find(d => d.DocumentId === selectedResumeId)?.DocumentName || c.Documents?.find(d => d.DocumentId === selectedResumeId)?.FileNameOriginal || 'Document')}
                  </span>
                  <button 
                    onClick={() => setSelectedResumeId(null)} 
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}
                  >
                    <X size={18} />
                  </button>
                </div>
                <iframe 
                  src={`${BASE_URL}/api/resumes/${selectedResumeId}/preview?token=${localStorage.getItem('token')}`} 
                  style={{ width: '100%', height: 'calc(100% - 44px)', border: 'none' }} 
                  title="Document Preview" 
                />
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default CandidateDetail;