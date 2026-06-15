import React, { useState, useEffect } from 'react';
import { X, Save, Upload, Plus, Trash2, Loader } from 'lucide-react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import '../styles/Modal.css';
import Swal from 'sweetalert2';
import {
  GENDER_OPTIONS, REMOTE_OPTIONS, STATUS_OPTIONS_FORM, SKILL_TYPE_OPTIONS,
  WORK_AUTHORIZATION_OPTIONS, EMPLOYMENT_TYPE_OPTIONS, SECURITY_CLEARANCE_OPTIONS,
  RATE_TYPE_OPTIONS, MARITAL_STATUS_OPTIONS, INDUSTRY_OPTIONS
} from '../utils/mockData';
import { countriesData, getStatesForCountry, getCountryCode, getStateCode, stateMapping } from '../../erprecruitment/config/locationConfig';
import { formatName, formatJobTitle, formatNameFields } from '../utils/nameFormatter';

const emptyEducation = () => ({ Institution: '', Degree: '', FieldOfStudy: '', StartDate: '', EndDate: '', GPA: '' });
const emptyCert = () => ({ CertificationName: '', IssuingOrganization: '', IssueDate: '', ExpiryDate: '', CredentialId: '', CredentialUrl: '' });
const emptyWork = () => ({ Company: '', JobTitle: '', StartDate: '', EndDate: '', IsCurrent: false, Description: '' });
const emptySkill = () => ({ SkillName: '', SkillType: 'HARD' });
const emptyDocument = () => ({
  DocumentName: '',
  DocumentType: 'Certificate',
  File: null,
  FileName: '',
  DocumentCategory: 'Other'
});

const CURRENCY_MAP = {
  IN: { symbol: '₹', label: 'INR' },
  US: { symbol: '$', label: 'USD' },
  GB: { symbol: '£', label: 'GBP' },
  CA: { symbol: 'C$', label: 'CAD' },
  AU: { symbol: 'A$', label: 'AUD' },
};

const AddModal = ({ onClose, onSave, onResumeUpload, candidate, uploading = false, parsedData, fetchFullCandidateDetails }) => {
  const isEdit = !!candidate;

  // Format initial data if it exists
  const formatInitialData = (data) => {
    if (!data) return {};
    return formatNameFields(data, ['FirstName', 'LastName', 'MiddleName', 'JobTitle']);
  };

  const initData = { ...formatInitialData(candidate || {}), ...formatInitialData(parsedData || {}) };

  // Parse location properly — prefer structured fields over string parsing
  const parseLocation = () => {
    let locationCountry = '', locationState = '', locationCity = '';

    // 1) Prefer structured fields from parsed data or candidate
    const iso2 = initData.countryIso2 || initData.CountryIso2 || initData.LocationCountryIso2 || '';
    const city = initData.cityName || initData.CityName || initData.LocationCity || '';
    const state = initData.stateName || initData.StateName || initData.LocationState || '';
    const stateCode = initData.LocationStateCode || '';

    if (iso2 || city) {
      locationCountry = iso2.toUpperCase();
      locationCity = city;
      // Convert state code to full name if we have a code
      if (stateCode && locationCountry && stateMapping[locationCountry]) {
        const found = Object.entries(stateMapping[locationCountry]).find(([, code]) => code.toUpperCase() === stateCode.toUpperCase());
        locationState = found ? found[0] : stateCode;
      } else if (state) {
        // If state is a code (2-3 chars), try to resolve to full name
        if (state.length <= 3 && locationCountry && stateMapping[locationCountry]) {
          const found = Object.entries(stateMapping[locationCountry]).find(([, code]) => code.toUpperCase() === state.toUpperCase());
          locationState = found ? found[0] : state;
        } else {
          locationState = state;
        }
      }
      return { locationCountry, locationState, locationCity };
    }

    // 2) Fallback: parse CurrentLocation string (e.g. "Chennai, TN, IN")
    const currentLoc = initData.CurrentLocation || initData.currentLocation || '';
    if (currentLoc) {
      const parts = currentLoc.split(',').map(s => s.trim()).filter(Boolean);
      if (parts.length >= 1) locationCity = parts[0];
      if (parts.length >= 2) {
        const stateValue = parts[1];
        const countryCode = parts[2]?.trim() || '';
        if (countryCode && stateMapping[countryCode]) {
          const found = Object.entries(stateMapping[countryCode]).find(([, code]) => code.toUpperCase() === stateValue.toUpperCase());
          locationState = found ? found[0] : stateValue;
        } else {
          locationState = stateValue;
        }
      }
      if (parts.length >= 3) locationCountry = parts[2];
    }
    return { locationCountry, locationState, locationCity };
  };

  const { locationCountry, locationState, locationCity } = parseLocation();

  const [form, setForm] = useState({
    FirstName: initData.FirstName || initData.firstName || '',
    LastName: initData.LastName || initData.lastName || '',
    MiddleName: initData.MiddleName || initData.middleName || '',
    JobTitle: initData.JobTitle || initData.jobTitle || '',
    YearsOfExperience: initData.YearsOfExperience ?? initData.yearsOfExperience ?? '',
    ProfileSummary: initData.ProfileSummary || initData.profileSummary || '',
    LinkedInUrl: initData.LinkedInUrl || initData.linkedInUrl || '',
    GitHubUrl: initData.GitHubUrl || initData.gitHubUrl || '',
    CandidateStatus: initData.CandidateStatus || 'Available',
    RemoteStatus: initData.RemoteStatus || 'Remote',
    Email: initData.Email || initData.email || initData.Contact?.Email || '',
    Phone: candidate?.Phone || candidate?.phone || candidate?.Contact?.Phone || '',
    CurrentLocation: initData.CurrentLocation || initData.currentLocation || '',
    Gender: initData.Gender || initData.gender || '',
    WorkAuthorization: initData.WorkAuthorization || initData.workAuthorization || '',
    EmploymentType: initData.EmploymentType || initData.employmentType || '',
    SecurityClearance: initData.SecurityClearance || initData.securityClearance || '',
    WillingToRelocate: initData.WillingToRelocate ?? initData.willingToRelocate ?? false,
    IsBench: initData.IsBench ?? initData.isBench ?? false,
    ExpectedRateFrom: initData.ExpectedRateFrom || initData.expectedRateFrom || '',
    ExpectedRateTo: initData.ExpectedRateTo || initData.expectedRateTo || '',
    ExpectedRateType: initData.ExpectedRateType || initData.expectedRateType || 'Hourly',
    CurrentRate: initData.CurrentRate || initData.currentRate || '',
    CurrentRateType: initData.CurrentRateType || initData.currentRateType || 'Hourly',
    MaritalStatus: initData.MaritalStatus || initData.maritalStatus || '',
    Industry: initData.Industry || initData.industry || '',
    // Location sub-fields
    LocationCountry: locationCountry,
    LocationState: locationState,
    LocationCity: locationCity,
    Mobile: parsedData?.Mobile || parsedData?.phone || parsedData?.Phone || candidate?.Mobile || candidate?.mobile || candidate?.Contact?.Mobile || '',
    TwitterUrl: initData.TwitterUrl || initData.twitterUrl || '',
    VideoResumeUrl: initData.VideoResumeUrl || initData.videoResumeUrl || '',
    ResumeFile: initData.ResumeFile || null,
    // Audit Fields
    RawPayloadJson: initData.RawPayloadJson || '',
    ParseStatus:    initData.ParseStatus    || '',
    ParsedText:     initData.ParsedText     || '',
    ParserVendor:   initData.ParserVendor   || '',
    ExtractedEmail: initData.ExtractedEmail || '',
    ExtractedPhone: initData.ExtractedPhone || '',
    IsEmployee: !!(initData.EmployeeId || initData.employee_id || initData.IsEmployee),
    EmployeeId: initData.EmployeeId || initData.employee_id || '',
  });

  const getInitArray = (camelKey, pascalKey, fallback) => {
    return initData[pascalKey]?.length ? initData[pascalKey].map(x => ({ ...x })) :
           (initData[camelKey]?.length ? initData[camelKey].map(x => ({ ...x })) : [fallback()]);
  };

  const [skills, setSkills] = useState(getInitArray('skills', 'Skills', emptySkill));
  const [education, setEducation] = useState(getInitArray('education', 'Education', emptyEducation));
  const [certifications, setCertifications] = useState(getInitArray('certifications', 'Certifications', emptyCert));
  const [workExperience, setWorkExperience] = useState(
    getInitArray('workExperience', 'WorkExperience', emptyWork).map(exp => ({
      ...exp,
      JobTitle: formatJobTitle(exp.JobTitle)
    }))
  );
  const [documents, setDocuments] = useState(
    initData.Documents?.length ? initData.Documents.filter(d => d.DocumentType !== 'Resume').map(d => ({ ...d })) : []
  );

  const [errors, setErrors] = useState({});
  const [activeSection, setActiveSection] = useState('basic');
  const [parsingResume, setParsingResume] = useState(false);
  const [stateSearch, setStateSearch] = useState('');
  const [loadingDetails, setLoadingDetails] = useState(isEdit && !!fetchFullCandidateDetails);
  const [resumeParsed, setResumeParsed] = useState(!!parsedData);

  // Fetch full candidate details when editing
  useEffect(() => {
    let isMounted = true;
    if (isEdit && candidate?.CandidateId && fetchFullCandidateDetails) {
      fetchFullCandidateDetails(candidate.CandidateId).then(fullData => {
        if (!isMounted) return;
        
        const formattedData = formatNameFields(fullData, ['FirstName', 'LastName', 'MiddleName', 'JobTitle']);
        const merged = { ...initData, ...formattedData };
        
        // Re-parse location with merged data — prefer structured fields
        let mergedLocationCountry = '', mergedLocationState = '', mergedLocationCity = '';
        
        // 1) Prefer structured fields from DB
        const mIso2 = merged.LocationCountryIso2 || merged.countryIso2 || merged.CountryIso2 || merged.country_iso2 || '';
        const mCity = merged.LocationCity || merged.cityName || merged.CityName || merged.city_name || '';
        const mStateCode = merged.LocationStateCode || merged.state_code || '';
        const mStateName = merged.stateName || merged.StateName || '';
        
        if (mIso2 || mCity) {
          mergedLocationCountry = mIso2.toUpperCase();
          mergedLocationCity = mCity;
          if (mStateCode && mergedLocationCountry && stateMapping[mergedLocationCountry]) {
            const found = Object.entries(stateMapping[mergedLocationCountry]).find(([, code]) => code.toUpperCase() === mStateCode.toUpperCase());
            mergedLocationState = found ? found[0] : mStateCode;
          } else if (mStateName) {
            if (mStateName.length <= 3 && mergedLocationCountry && stateMapping[mergedLocationCountry]) {
              const found = Object.entries(stateMapping[mergedLocationCountry]).find(([, code]) => code.toUpperCase() === mStateName.toUpperCase());
              mergedLocationState = found ? found[0] : mStateName;
            } else {
              mergedLocationState = mStateName;
            }
          }
        } else {
          // 2) Fallback: parse CurrentLocation string
          const mergedCurrentLoc = merged.CurrentLocation || merged.currentLocation || '';
          if (mergedCurrentLoc) {
            const parts = mergedCurrentLoc.split(',').map(s => s.trim()).filter(Boolean);
            if (parts.length >= 1) mergedLocationCity = parts[0];
            if (parts.length >= 2) {
              const stateValue = parts[1];
              const countryCode = parts[2]?.trim() || '';
              if (countryCode && stateMapping[countryCode]) {
                const found = Object.entries(stateMapping[countryCode]).find(([, code]) => code.toUpperCase() === stateValue.toUpperCase());
                mergedLocationState = found ? found[0] : stateValue;
              } else {
                mergedLocationState = stateValue;
              }
            }
            if (parts.length >= 3) mergedLocationCountry = parts[2];
          }
        }
        
        setForm(prev => ({
          ...prev,
          FirstName: merged.FirstName || prev.FirstName,
          LastName: merged.LastName || prev.LastName,
          MiddleName: merged.MiddleName || prev.MiddleName,
          JobTitle: merged.JobTitle || prev.JobTitle,
          YearsOfExperience: merged.YearsOfExperience ?? prev.YearsOfExperience,
          ProfileSummary: merged.ProfileSummary || prev.ProfileSummary,
          LinkedInUrl: merged.LinkedInUrl || prev.LinkedInUrl,
          GitHubUrl: merged.GitHubUrl || prev.GitHubUrl,
          CandidateStatus: merged.CandidateStatus || prev.CandidateStatus,
          RemoteStatus: merged.RemoteStatus || prev.RemoteStatus,
          Email: merged.Email || merged.Contact?.Email || prev.Email,
          Phone: merged.Phone || merged.Contact?.Phone || prev.Phone,
          CurrentLocation: merged.CurrentLocation || prev.CurrentLocation,
          Gender: merged.Gender || prev.Gender,
          WorkAuthorization: merged.WorkAuthorization || prev.WorkAuthorization,
          EmploymentType: merged.EmploymentType || prev.EmploymentType,
          SecurityClearance: merged.SecurityClearance || prev.SecurityClearance,
          WillingToRelocate: merged.WillingToRelocate ?? prev.WillingToRelocate,
          IsBench: merged.IsBench ?? prev.IsBench,
          ExpectedRateFrom: merged.ExpectedRateFrom || prev.ExpectedRateFrom,
          ExpectedRateTo: merged.ExpectedRateTo || prev.ExpectedRateTo,
          ExpectedRateType: merged.ExpectedRateType || prev.ExpectedRateType,
          CurrentRate: merged.CurrentRate || prev.CurrentRate,
          CurrentRateType: merged.CurrentRateType || prev.CurrentRateType,
          MaritalStatus: merged.MaritalStatus || prev.MaritalStatus,
          Industry: merged.Industry || prev.Industry,
          Mobile: merged.Mobile || merged.Contact?.Mobile || prev.Mobile,
          TwitterUrl: merged.TwitterUrl || prev.TwitterUrl,
          VideoResumeUrl: merged.VideoResumeUrl || prev.VideoResumeUrl,
          LocationCountry: mergedLocationCountry,
          LocationState: mergedLocationState,
          LocationCity: mergedLocationCity,
          IsEmployee: !!(merged.EmployeeId || merged.employee_id),
          EmployeeId: merged.EmployeeId || merged.employee_id || '',
        }));

        const getList = (d, camelKey, pascalKey, fallback) => {
          return d[pascalKey]?.length ? d[pascalKey].map(x => ({ ...x })) :
                 (d[camelKey]?.length ? d[camelKey].map(x => ({ ...x })) : [fallback()]);
        };

        setSkills(getList(merged, 'skills', 'Skills', emptySkill));
        setEducation(getList(merged, 'education', 'Education', emptyEducation));
        setCertifications(getList(merged, 'certifications', 'Certifications', emptyCert));
        const formattedWork = getList(merged, 'workExperience', 'WorkExperience', emptyWork).map(exp => ({
          ...exp,
          JobTitle: formatJobTitle(exp.JobTitle)
        }));
        setWorkExperience(formattedWork);
        
        if (merged.Documents?.length) {
          setDocuments(merged.Documents.filter(d => d.DocumentType !== 'Resume').map(d => ({ ...d })));
        }
        setLoadingDetails(false);
      }).catch(err => {
        console.error("Failed to fetch full candidate details", err);
        if (isMounted) setLoadingDetails(false);
      });
    } else {
      setLoadingDetails(false);
    }
    return () => { isMounted = false; };
  }, [isEdit, candidate?.CandidateId, fetchFullCandidateDetails]);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    
    if (type === 'checkbox') {
      setForm(p => ({ ...p, [name]: checked }));
    } else if (name === 'LocationCountry') {
      // Reset state and city when country changes
      setForm(p => ({ ...p, LocationCountry: value, LocationState: '', LocationCity: '' }));
      setStateSearch('');
    } else if (name === 'ResumeFile') {
      const file = files?.[0];
      if (file) {
        const valid = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!valid.includes(file.type)) { 
          setErrors(p => ({ ...p, ResumeFile: 'Only PDF or Word documents allowed.' })); 
          return; 
        }
        if (file.size > 5 * 1024 * 1024) { 
          setErrors(p => ({ ...p, ResumeFile: 'File must be under 5MB.' })); 
          return; 
        }
        setErrors(p => ({ ...p, ResumeFile: null }));
        setForm(p => ({ ...p, ResumeFile: file }));
      }
    } else if (name === 'FirstName' || name === 'LastName' || name === 'MiddleName') {
      // Format name fields automatically
      setForm(p => ({ ...p, [name]: formatName(value) }));
    } else if (name === 'JobTitle') {
      // Format job title immediately on change/paste
      const formattedValue = formatJobTitle(value);
      setForm(p => ({ ...p, [name]: formattedValue }));
    } else {
      setForm(p => ({ ...p, [name]: value }));
    }
  };

  const handleStateSelect = (stateName) => {
    setForm(p => ({ ...p, LocationState: stateName }));
    setStateSearch('');
  };

  const handleParseResume = async () => {
    if (!form.ResumeFile) {
      setErrors(p => ({ ...p, ResumeFile: 'Please select a resume file first' }));
      return;
    }

    try {
      setParsingResume(true);
      const extractedData = await onResumeUpload(form.ResumeFile);
      
      if (extractedData) {
        // Format the extracted data
        const formattedData = formatNameFields(extractedData, ['FirstName', 'LastName', 'MiddleName', 'JobTitle']);

        // Resolve location sub-fields from parsed data
        const parsedCountryIso2 = (formattedData.countryIso2 || formattedData.CountryIso2 || '').toUpperCase();
        const parsedCity = formattedData.cityName || formattedData.CityName || '';
        let parsedState = formattedData.stateName || formattedData.StateName || '';
        // Convert state code to full name if needed
        if (parsedState && parsedState.length <= 3 && parsedCountryIso2 && stateMapping[parsedCountryIso2]) {
          const found = Object.entries(stateMapping[parsedCountryIso2]).find(([, code]) => code.toUpperCase() === parsedState.toUpperCase());
          if (found) parsedState = found[0];
        }

        // Build CurrentLocation string for display
        const builtLocation = (() => {
          const parts = [];
          if (parsedCity) parts.push(parsedCity);
          if (parsedState && parsedCountryIso2) {
            const sc = getStateCode(parsedCountryIso2, parsedState);
            parts.push(sc);
          } else if (parsedState) {
            parts.push(parsedState);
          }
          if (parsedCountryIso2) parts.push(parsedCountryIso2);
          return parts.length >= 2 ? parts.join(', ') : (formattedData.currentLocation || formattedData.CurrentLocation || '');
        })();

        // Update form with formatted data
        setForm(prev => ({
          ...prev,
          FirstName: formattedData.firstName || formattedData.FirstName || prev.FirstName,
          LastName: formattedData.lastName || formattedData.LastName || prev.LastName,
          MiddleName: formattedData.middleName || formattedData.MiddleName || prev.MiddleName,
          Email: formattedData.email || formattedData.Email || prev.Email,
          Mobile: formattedData.Mobile || formattedData.phone || formattedData.Phone || prev.Mobile,
          JobTitle: formattedData.jobTitle || formattedData.JobTitle || prev.JobTitle,
          YearsOfExperience: formattedData.yearsOfExperience || formattedData.YearsOfExperience || prev.YearsOfExperience,
          ProfileSummary: formattedData.profileSummary || formattedData.ProfileSummary || prev.ProfileSummary,
          LinkedInUrl: formattedData.linkedInUrl || formattedData.LinkedInUrl || prev.LinkedInUrl,
          GitHubUrl: formattedData.gitHubUrl || formattedData.GitHubUrl || prev.GitHubUrl,
          TwitterUrl: formattedData.twitterUrl || formattedData.TwitterUrl || prev.TwitterUrl,
          VideoResumeUrl: formattedData.videoResumeUrl || formattedData.VideoResumeUrl || prev.VideoResumeUrl,
          Gender: formattedData.gender || formattedData.Gender || prev.Gender,
          CurrentLocation: builtLocation || prev.CurrentLocation,
          WorkAuthorization: formattedData.workAuthorization || formattedData.WorkAuthorization || prev.WorkAuthorization,
          EmploymentType: formattedData.employmentType || formattedData.EmploymentType || prev.EmploymentType,
          // Location sub-fields from AI parser
          LocationCountry: parsedCountryIso2 || prev.LocationCountry,
          LocationState: parsedState || prev.LocationState,
          LocationCity: parsedCity || prev.LocationCity,
          // Audit Fields
          RawPayloadJson: formattedData.RawPayloadJson || prev.RawPayloadJson,
          ParseStatus:    formattedData.ParseStatus    || prev.ParseStatus,
          ParsedText:     formattedData.ParsedText     || prev.ParsedText,
          ParserVendor:   formattedData.ParserVendor   || prev.ParserVendor,
          ExtractedEmail: formattedData.ExtractedEmail || prev.ExtractedEmail,
          ExtractedPhone: formattedData.ExtractedPhone || prev.ExtractedPhone,
        }));

        // Update skills
        const extSkills = formattedData.skills || formattedData.Skills;
        if (extSkills?.length) {
          setSkills(extSkills.map(skill => ({ 
            SkillName: typeof skill === 'string' ? skill : skill.SkillName || skill.name,
            SkillType: 'HARD' 
          })));
        }

        // Update work experience
        const extWork = formattedData.workExperience || formattedData.WorkExperience;
        if (extWork?.length) {
          setWorkExperience(extWork.map(exp => ({
            Company: exp.company || exp.Company,
            JobTitle: formatJobTitle(exp.jobTitle || exp.JobTitle),
            StartDate: exp.startDate || exp.StartDate,
            EndDate: exp.endDate || exp.EndDate,
            IsCurrent: exp.isCurrent || exp.IsCurrent || false,
            Description: exp.description || exp.Description
          })));
        }

        // Update education
        const extEdu = formattedData.education || formattedData.Education;
        if (extEdu?.length) {
          setEducation(extEdu.map(edu => ({
            Institution: edu.institution || edu.Institution,
            Degree: edu.degree || edu.Degree,
            FieldOfStudy: edu.fieldOfStudy || edu.FieldOfStudy,
            StartDate: edu.startDate || edu.StartDate,
            EndDate: edu.endDate || edu.EndDate,
            GPA: edu.gpa || edu.GPA
          })));
        }

        // Update certifications
        const extCert = formattedData.certifications || formattedData.Certifications;
        if (extCert?.length) {
          setCertifications(extCert.map(cert => ({
            CertificationName: cert.name || cert.CertificationName,
            IssuingOrganization: cert.issuingOrg || cert.IssuingOrganization,
            IssueDate: cert.issueDate || cert.IssueDate,
            ExpiryDate: cert.expiryDate || cert.ExpiryDate,
            CredentialId: cert.credentialId || cert.CredentialId,
            CredentialUrl: cert.credentialUrl || cert.CredentialUrl
          })));
        }

        setResumeParsed(true);

        Swal.fire({
          title: 'Success!',
          text: 'Resume parsed successfully. Please review the extracted information.',
          icon: 'success',
          timer: 2000
        });
      }
    } catch (error) {
      console.error('Error parsing resume:', error);
    } finally {
      setParsingResume(false);
    }
  };

  const handleDocumentUpload = (index, file) => {
    if (file) {
      const valid = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!valid.includes(file.type)) {
        setErrors(p => ({ ...p, [`Document_${index}`]: 'Only PDF, Word, or image documents allowed.' }));
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setErrors(p => ({ ...p, [`Document_${index}`]: 'File must be under 10MB.' }));
        return;
      }
      setErrors(p => ({ ...p, [`Document_${index}`]: null }));
      updateList(setDocuments, index, 'File', file);
      updateList(setDocuments, index, 'FileName', file.name);
      updateList(setDocuments, index, 'DocumentName', file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const updateList = (setter, index, field, value) => {
    setter(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };
  
  const addToList = (setter, newItem) => setter(prev => [...prev, newItem]);
  const removeFromList = (setter, index) => setter(prev => prev.filter((_, i) => i !== index));

  const ensureProtocol = (url) => {
    const trimmed = url ? url.trim() : '';
    if (!trimmed) return '';
    if (!/^https?:\/\//i.test(trimmed)) {
      return `https://${trimmed}`;
    }
    return trimmed;
  };

  const validate = () => {
    const e = {};
    if (!form.FirstName.trim()) e.FirstName = 'First name is required';
    if (!form.LastName.trim()) e.LastName = 'Last name is required';
    if (!form.JobTitle.trim()) e.JobTitle = 'Job title is required';
    // Email is mandatory only when adding manually (no resume parsed)
    if (!resumeParsed && !form.Email.trim()) {
      e.Email = 'Email is required';
    } else if (form.Email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.Email)) {
      e.Email = 'Invalid email address';
    }
    
    if (form.VideoResumeUrl && !isValidUrl(ensureProtocol(form.VideoResumeUrl))) {
      e.VideoResumeUrl = 'Please enter a valid URL';
    }
    
    if (!isEdit && !form.ResumeFile) e.ResumeFile = 'Resume upload is recommended for new candidates';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    // Construct CurrentLocation from location fields
    const currentLocation = (() => {
      const parts = [];
      if (form.LocationCity?.trim()) parts.push(form.LocationCity.trim());
      if (form.LocationState?.trim()) {
        // Get state code from state name if country is selected
        const stateCode = form.LocationCountry 
          ? getStateCode(form.LocationCountry, form.LocationState)
          : form.LocationState;
        parts.push(stateCode);
      }
      if (form.LocationCountry?.trim()) parts.push(form.LocationCountry);
      
      // If we have any location parts, use the constructed location
      if (parts.length >= 1) {
        return parts.join(', ');
      }
      // Otherwise use the original CurrentLocation as fallback
      return form.CurrentLocation?.trim() || '';
    })();

    // Transform data to match backend expected format
    const payload = {
      // Basic Info
      firstName: form.FirstName.trim(),
      lastName: form.LastName.trim(),
      middleName: form.MiddleName.trim(),
      email: form.Email.trim(),
      phone: form.Phone.trim(),
      mobile: form.Mobile.trim(),
      twitterUrl: ensureProtocol(form.TwitterUrl),
      videoResumeUrl: ensureProtocol(form.VideoResumeUrl),
      jobTitle: form.JobTitle.trim(),
      yearsOfExperience: form.YearsOfExperience !== '' ? Number(form.YearsOfExperience) : 0,
      gender: form.Gender || '',
      profileSummary: form.ProfileSummary.trim(),
      linkedInUrl: ensureProtocol(form.LinkedInUrl),
      gitHubUrl: ensureProtocol(form.GitHubUrl),
      currentLocation: currentLocation,
      candidateStatus: form.CandidateStatus,
      remoteStatus: form.RemoteStatus,
      
      // Other fields
      workAuthorization: form.WorkAuthorization,
      employmentType: form.EmploymentType,
      securityClearance: form.SecurityClearance,
      willingToRelocate: form.WillingToRelocate,
      isBench: form.IsBench,
      expectedRateFrom: form.ExpectedRateFrom ? Number(form.ExpectedRateFrom) : null,
      expectedRateTo: form.ExpectedRateTo ? Number(form.ExpectedRateTo) : null,
      expectedRateType: form.ExpectedRateType,
      currentRate: form.CurrentRate ? Number(form.CurrentRate) : null,
      currentRateType: form.CurrentRateType,
      maritalStatus: form.MaritalStatus,
      industry: form.Industry,
      
      // Skills - array of strings
      skills: skills
        .filter(s => s.SkillName.trim())
        .map(s => s.SkillName.trim()),
      
      // Work Experience
      workExperience: workExperience
        .filter(w => w.Company.trim() || w.JobTitle.trim())
        .map(exp => ({
          company: exp.Company.trim(),
          jobTitle: exp.JobTitle.trim(),
          startDate: exp.StartDate,
          endDate: exp.EndDate,
          isCurrent: exp.IsCurrent,
          description: exp.Description.trim()
        })),
      
      // Education
      education: education
        .filter(e => e.Institution.trim() || e.Degree.trim())
        .map(edu => ({
          institution: edu.Institution.trim(),
          degree: edu.Degree.trim(),
          fieldOfStudy: edu.FieldOfStudy.trim(),
          startDate: edu.StartDate,
          endDate: edu.EndDate,
          gpa: edu.GPA
        })),
      
      // Certifications
      certifications: certifications
        .filter(c => c.CertificationName.trim())
        .map(cert => ({
          name: cert.CertificationName.trim(),
          issuingOrg: cert.IssuingOrganization.trim(),
          issueDate: cert.IssueDate,
          expiryDate: cert.ExpiryDate,
          credentialId: cert.CredentialId.trim(),
          credentialUrl: cert.CredentialUrl.trim()
        })),
      
      // Documents (excluding resumes)
      documents: documents
        .filter(d => d.DocumentName.trim() && (d.File || d.DocumentId))
        .map(doc => ({
          documentName: doc.DocumentName.trim(),
          documentType: doc.DocumentType,
          documentCategory: doc.DocumentType,
          file: doc.File || null,
          documentId: doc.DocumentId || null,
          isPrimaryResume: false
        })),
      
      // Document ID if editing
      documentId: candidate?.Document?.DocumentId || null,

      // Audit Fields
      RawPayloadJson: form.RawPayloadJson || null,
      ParseStatus:    form.ParseStatus    || null,
      ParsedText:     form.ParsedText     || null,
      ParserVendor:   form.ParserVendor   || null,
      ExtractedEmail: form.ExtractedEmail || null,
      ExtractedPhone: form.ExtractedPhone || null,
      IsEmployee: form.IsEmployee,
      EmployeeId: form.IsEmployee ? form.EmployeeId : null
    };

    // Add candidateId if editing
    if (isEdit && candidate?.CandidateId) {
      payload.candidateId = candidate.CandidateId;
    }

    // Add resume file if present
    if (form.ResumeFile) {
      payload.ResumeFile = form.ResumeFile;
    }

    onSave(payload);
  };

  const SectionBtn = ({ id, label }) => (
    <button
      type="button"
      onClick={() => setActiveSection(id)}
      className={`mp-tab-btn ${activeSection === id ? 'mp-tab-btn-active' : ''}`}
    >
      {label}
    </button>
  );

  const FieldError = ({ name }) => errors[name] ? (
    <span className="mp-error-message">{errors[name]}</span>
  ) : null;

  return (
    <div className="mp-overlay">
      <div className="mp-container">
        <div className="mp-header">
          <h2 className="mp-title">{isEdit ? 'Edit Candidate' : 'Add New Candidate'}</h2>
          <button className="mp-close-btn" onClick={onClose}><X size={18} /></button>
        </div>

        {loadingDetails ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
            <Loader size={24} className="mp-loading-icon" style={{ marginBottom: '10px' }} />
            <p>Fetching candidate details...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mp-form">
            <div className="mp-tabs-container">
              <SectionBtn id="basic" label="Basic Info" />
              <SectionBtn id="contact" label="Contact" />
              <SectionBtn id="resume" label="Resume" />
              <SectionBtn id="skills" label="Skills" />
              <SectionBtn id="experience" label="Work Experience" />
              <SectionBtn id="education" label="Education" />
              <SectionBtn id="certifications" label="Certifications" />
              <SectionBtn id="documents" label="Documents" />
            </div>

            {activeSection === 'basic' && (
              <div className="mp-section">
                {/* <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '20px', padding: '10px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <label className="mp-checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontWeight: '600', color: '#0f172a' }}>
                    <input
                      type="checkbox"
                      name="IsEmployee"
                      checked={form.IsEmployee}
                      onChange={handleChange}
                      style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#229C8B' }}
                    />
                    Is Internal Employee?
                  </label>
                  {form.IsEmployee && (
                    <div className="mp-field" style={{ margin: 0, flex: 1 }}>
                      <input 
                        type="text" 
                        name="EmployeeId" 
                        value={form.EmployeeId} 
                        onChange={handleChange} 
                        className="mp-input" 
                        placeholder="Enter 2-digit Employee ID"
                        style={{ height: '36px' }}
                      />
                    </div>
                  )}
                </div> */}

                <div className="mp-row-3col">
                  <div className="mp-field">
                    <label className="mp-label">First Name *</label>
                    <input 
                      type="text" 
                      name="FirstName" 
                      value={form.FirstName} 
                      onChange={handleChange} 
                      className="mp-input" 
                      placeholder="Enter first name"
                    />
                    <FieldError name="FirstName" />
                  </div>
                  <div className="mp-field">
                    <label className="mp-label">Last Name *</label>
                    <input 
                      type="text" 
                      name="LastName" 
                      value={form.LastName} 
                      onChange={handleChange} 
                      className="mp-input" 
                      placeholder="Enter last name"
                    />
                    <FieldError name="LastName" />
                  </div>
                  <div className="mp-field">
                    <label className="mp-label">Middle Name</label>
                    <input 
                      type="text" 
                      name="MiddleName" 
                      value={form.MiddleName} 
                      onChange={handleChange} 
                      className="mp-input" 
                      placeholder="Enter middle name"
                    />
                  </div>
                </div>

                <div className="mp-row-2col">
                  <div className="mp-field">
                    <label className="mp-label">Job Title *</label>
                    <input 
                      type="text" 
                      name="JobTitle" 
                      value={form.JobTitle} 
                      onChange={handleChange} 
                      placeholder="e.g. Senior Software Engineer" 
                      className="mp-input" 
                    />
                    <FieldError name="JobTitle" />
                  </div>
                  <div className="mp-field">
                    <label className="mp-label">Years of Experience</label>
                    <input 
                      type="number" 
                      name="YearsOfExperience" 
                      value={form.YearsOfExperience} 
                      onChange={handleChange} 
                      min="0" 
                      max="60" 
                      step="0.5"
                      placeholder="e.g. 5" 
                      className="mp-input" 
                    />
                  </div>
                </div>

                <div className="mp-row-2col">
                  <div className="mp-field">
                    <label className="mp-label">Candidate Status</label>
                    <select name="CandidateStatus" value={form.CandidateStatus} onChange={handleChange} className="mp-select">
                      {STATUS_OPTIONS_FORM.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="mp-field">
                    <label className="mp-label">Remote / Work Type</label>
                    <select name="RemoteStatus" value={form.RemoteStatus} onChange={handleChange} className="mp-select">
                      {REMOTE_OPTIONS.map(r => (
                        <option key={r} value={r}>
                          {r === 'OnSite' ? 'On-Site' : r}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Work Authorization & Employment Type */}
                <div className="mp-row-2col">
                  <div className="mp-field">
                    <label className="mp-label">Work Authorization</label>
                    <select 
                      name="WorkAuthorization" 
                      value={form.WorkAuthorization} 
                      onChange={handleChange} 
                      className="mp-select"
                    >
                      <option value="">Select Work Auth</option>
                      {WORK_AUTHORIZATION_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mp-field">
                    <label className="mp-label">Employment Type</label>
                    <select 
                      name="EmploymentType" 
                      value={form.EmploymentType} 
                      onChange={handleChange} 
                      className="mp-select"
                    >
                      <option value="">Select Employment Type</option>
                      {EMPLOYMENT_TYPE_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Security Clearance & Willing to Relocate */}
                <div className="mp-row-2col">
                  <div className="mp-field">
                    <label className="mp-label">Security Clearance</label>
                    <select 
                      name="SecurityClearance" 
                      value={form.SecurityClearance} 
                      onChange={handleChange} 
                      className="mp-select"
                    >
                      <option value="">Select Clearance</option>
                      {SECURITY_CLEARANCE_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mp-field" style={{ marginTop: '24px', justifyContent: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '24px' }}>
                      <label className="mp-checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          name="WillingToRelocate"
                          checked={form.WillingToRelocate}
                          onChange={handleChange}
                          style={{ width: '16px', height: '16px', margin: 0, cursor: 'pointer' }}
                        />
                        Willing to Relocate
                      </label>
                      <label className="mp-checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          name="IsBench"
                          checked={form.IsBench}
                          onChange={handleChange}
                          style={{ accentColor: '#f59e0b', width: '16px', height: '16px', margin: 0, cursor: 'pointer' }}
                        />
                        Bench Candidate
                      </label>
                    </div>
                  </div>
                </div>

                {/* Location — Country / State / City */}
                <div className="mp-row-2col">
                  <div className="mp-field">
                    <label className="mp-label">Gender</label>
                    <select name="Gender" value={form.Gender} onChange={handleChange} className="mp-select">
                      <option value="">Select Gender</option>
                      {GENDER_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div className="mp-field">
                    <label className="mp-label">Country</label>
                    <select
                      name="LocationCountry"
                      value={form.LocationCountry}
                      onChange={handleChange}
                      className="mp-select"
                    >
                      <option value="">Select Country</option>
                      {countriesData.map(c => (
                        <option key={c.code} value={c.code}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mp-row-2col">
                  <div className="mp-field">
                    <label className="mp-label">State</label>
                    {form.LocationCountry ? (
                      <div style={{ position: 'relative' }}>
                        <input
                          type="text"
                          placeholder="Search and select state..."
                          value={stateSearch !== '' ? stateSearch : form.LocationState}
                          onChange={e => {
                            setStateSearch(e.target.value);
                            setForm(p => ({ ...p, LocationState: '' }));
                          }}
                          onFocus={() => setStateSearch(form.LocationState || '')}
                          onBlur={() => setTimeout(() => setStateSearch(''), 200)}
                          className="mp-input"
                          autoComplete="off"
                        />
                        {stateSearch !== '' && (
                          <div style={{
                            position: 'absolute', top: '100%', left: 0, right: 0,
                            background: '#fff', border: '1px solid #229C8B',
                            borderRadius: '4px', maxHeight: '180px', overflowY: 'auto',
                            zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,0.12)'
                          }}>
                            {getStatesForCountry(form.LocationCountry)
                              .filter(s => s.toLowerCase().includes(stateSearch.toLowerCase()))
                              .slice(0, 20)
                              .map(s => (
                                <div
                                  key={s}
                                  onMouseDown={() => {
                                    setForm(p => ({ ...p, LocationState: s }));
                                    setStateSearch('');
                                  }}
                                  style={{ padding: '7px 12px', cursor: 'pointer', fontSize: '13px', borderBottom: '1px solid #f3f4f6', background: form.LocationState === s ? '#e6f7f5' : '#fff', color: '#374151' }}
                                  onMouseEnter={e => e.currentTarget.style.background = '#f0faf9'}
                                  onMouseLeave={e => e.currentTarget.style.background = form.LocationState === s ? '#e6f7f5' : '#fff'}
                                >{s}</div>
                              ))}
                            {getStatesForCountry(form.LocationCountry).filter(s => s.toLowerCase().includes(stateSearch.toLowerCase())).length === 0 && (
                              <div style={{ padding: '8px 12px', fontSize: '12px', color: '#9ca3af' }}>No states found</div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <input type="text" className="mp-input" placeholder="Select country first" disabled style={{ background: '#f9fafb', color: '#9ca3af' }} />
                    )}
                  </div>
                  <div className="mp-field">
                    <label className="mp-label">City</label>
                    <input type="text" name="LocationCity" value={form.LocationCity} onChange={handleChange} placeholder="Enter city name" className="mp-input" />
                  </div>
                </div>

                {/* Expected Rate Range — currency symbol from country */}
                {(() => {
                  const currency = CURRENCY_MAP[form.LocationCountry] || { symbol: '$', label: 'USD' };
                  return (
                    <>
                      <div className="mp-row-3col">
                        <div className="mp-field">
                          <label className="mp-label">Expected Rate From ({currency.symbol} {currency.label})</label>
                          <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: '#6b7280', pointerEvents: 'none' }}>{currency.symbol}</span>
                            <input type="number" name="ExpectedRateFrom" value={form.ExpectedRateFrom} onChange={handleChange} placeholder="0.00" min="0" step="0.01" className="mp-input" style={{ paddingLeft: currency.symbol.length > 1 ? '36px' : '24px' }} />
                          </div>
                        </div>
                        <div className="mp-field">
                          <label className="mp-label">Expected Rate To ({currency.symbol} {currency.label})</label>
                          <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: '#6b7280', pointerEvents: 'none' }}>{currency.symbol}</span>
                            <input type="number" name="ExpectedRateTo" value={form.ExpectedRateTo} onChange={handleChange} placeholder="0.00" min="0" step="0.01" className="mp-input" style={{ paddingLeft: currency.symbol.length > 1 ? '36px' : '24px' }} />
                          </div>
                        </div>
                        <div className="mp-field">
                          <label className="mp-label">Rate Type</label>
                          <select name="ExpectedRateType" value={form.ExpectedRateType} onChange={handleChange} className="mp-select">
                            {RATE_TYPE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        </div>
                      </div>

                      <div className="mp-row-2col">
                        <div className="mp-field">
                          <label className="mp-label">Current Rate ({currency.symbol} {currency.label})</label>
                          <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: '#6b7280', pointerEvents: 'none' }}>{currency.symbol}</span>
                            <input type="number" name="CurrentRate" value={form.CurrentRate} onChange={handleChange} placeholder="0.00" min="0" step="0.01" className="mp-input" style={{ paddingLeft: currency.symbol.length > 1 ? '36px' : '24px' }} />
                          </div>
                        </div>
                        <div className="mp-field">
                          <label className="mp-label">Current Rate Type</label>
                          <select name="CurrentRateType" value={form.CurrentRateType} onChange={handleChange} className="mp-select">
                            {RATE_TYPE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        </div>
                      </div>
                    </>
                  );
                })()}

                {/* Marital Status & Industry */}
                <div className="mp-row-2col">
                  <div className="mp-field">
                    <label className="mp-label">Marital Status</label>
                    <select 
                      name="MaritalStatus" 
                      value={form.MaritalStatus} 
                      onChange={handleChange} 
                      className="mp-select"
                    >
                      <option value="">Select Marital Status</option>
                      {MARITAL_STATUS_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mp-field">
                    <label className="mp-label">Industry</label>
                    <select 
                      name="Industry" 
                      value={form.Industry} 
                      onChange={handleChange} 
                      className="mp-select"
                    >
                      <option value="">Select Industry</option>
                      {INDUSTRY_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mp-row-2col">
                  <div className="mp-field">
                    <label className="mp-label">LinkedIn URL</label>
                    <input 
                      type="text" 
                      name="LinkedInUrl" 
                      value={form.LinkedInUrl} 
                      onChange={handleChange} 
                      placeholder="https://linkedin.com/in/..." 
                      className="mp-input" 
                    />
                  </div>
                  <div className="mp-field">
                    <label className="mp-label">GitHub URL</label>
                    <input 
                      type="text" 
                      name="GitHubUrl" 
                      value={form.GitHubUrl} 
                      onChange={handleChange} 
                      placeholder="https://github.com/..." 
                      className="mp-input" 
                    />
                  </div>
                </div>

                <div className="mp-field mp-field-full">
                  <label className="mp-label">Profile Summary</label>
                  <textarea 
                    name="ProfileSummary" 
                    value={form.ProfileSummary} 
                    onChange={handleChange} 
                    rows={3} 
                    placeholder="Brief professional summary extracted from resume..." 
                    className="mp-textarea" 
                  />
                </div>
              </div>
            )}

            {activeSection === 'contact' && (
              <div className="mp-section">
                <div className="mp-row-2col">
                  <div className="mp-field">
                    <label className="mp-label">Email Address{!resumeParsed ? ' *' : ''}</label>
                    <input 
                      type="email" 
                      name="Email" 
                      value={form.Email} 
                      onChange={handleChange} 
                      placeholder="candidate@email.com" 
                      className="mp-input" 
                    />
                    <FieldError name="Email" />
                  </div>
                   <div className="mp-field">
                    <label className="mp-label">Mobile Number</label>
                    <PhoneInput
                      country={form.LocationCountry ? form.LocationCountry.toLowerCase() : 'us'}
                      value={form.Mobile}
                      onChange={(phone) => setForm(p => ({ ...p, Mobile: phone }))}
                      placeholder="+1 (555) 000-0000"
                      inputProps={{
                        name: 'Mobile',
                        className: 'mp-input',
                        style: { paddingLeft: '48px', width: '100%', height: '36px', borderColor: '#229C8B' }
                      }}
                      containerStyle={{ width: '100%' }}
                      buttonStyle={{ background: 'transparent', border: 'none', paddingLeft: '8px' }}
                      dropdownStyle={{ width: '300px', zIndex: 1000 }}
                    />
                  </div>
                </div>

                {/* Mobile Number Field */}
                <div className="mp-row-2col">
                  <div className="mp-field">
                    <label className="mp-label">Phone Number</label>
                    <input 
                      type="tel" 
                      name="Phone" 
                      value={form.Phone} 
                      onChange={handleChange} 
                      placeholder="+1 (555) 000-0000" 
                      className="mp-input" 
                    />
                  </div>
                  <div className="mp-field">
                    <label className="mp-label">Twitter URL</label>
                    <input 
                      type="text" 
                      name="TwitterUrl" 
                      value={form.TwitterUrl} 
                      onChange={handleChange} 
                      placeholder="https://twitter.com/..." 
                      className="mp-input" 
                    />
                  </div>
                </div>

                {/* Video Resume URL Field */}
                <div className="mp-field mp-field-full">
                  <label className="mp-label">Video Resume URL</label>
                  <input 
                    type="text" 
                    name="VideoResumeUrl" 
                    value={form.VideoResumeUrl} 
                    onChange={handleChange} 
                    placeholder="https://youtube.com/... or any video link" 
                    className="mp-input" 
                  />
                  <FieldError name="VideoResumeUrl" />
                  <p className="mp-hint" style={{ marginTop: '4px', fontSize: '11px' }}>
                    Link to video resume on YouTube, Vimeo, or other platforms
                  </p>
                </div>
              </div>
            )}

            {activeSection === 'resume' && (
              <div className="mp-section mp-resume-section">
                <div className="mp-field">
                  <label className="mp-label">Resume Upload (PDF or Word, max 5MB)</label>
                  <div className="mp-file-container">
                    <label className="mp-file-label">
                      <Upload size={14} />
                      <span>Choose File</span>
                      <input 
                        type="file" 
                        name="ResumeFile" 
                        accept=".pdf,.doc,.docx" 
                        onChange={handleChange} 
                        className="mp-file-input" 
                      />
                    </label>
                    <div className="mp-file-info">
                      {form.ResumeFile ? (
                        <>
                          <span className="mp-file-name">{form.ResumeFile.name}</span>
                          <span className="mp-file-size">({(form.ResumeFile.size / 1024).toFixed(0)} KB)</span>
                        </>
                      ) : isEdit && candidate?.Document?.FileNameOriginal ? (
                        <span className="mp-file-name">Current: {candidate.Document.FileNameOriginal}</span>
                      ) : (
                        <span>No file selected</span>
                      )}
                    </div>
                  </div>
                  {form.ResumeFile && (
                    <button 
                      type="button" 
                      className="mp-btn-secondary" 
                      onClick={handleParseResume}
                      disabled={parsingResume || uploading}
                      style={{ marginTop: '10px' }}
                    >
                      {parsingResume ? (
                        <>
                          <Loader size={14} className="mp-loading-icon" /> Parsing Resume...
                        </>
                      ) : (
                        <>
                          <Upload size={14} /> Parse Resume
                        </>
                      )}
                    </button>
                  )}
                  <FieldError name="ResumeFile" />
                  <p className="mp-hint" style={{ marginTop: '8px' }}>
                    Upload a resume to auto-fill candidate information
                  </p>
                </div>
              </div>
            )}

            {activeSection === 'skills' && (
              <div className="mp-section">
                <p className="mp-hint">Add the candidate's skills. Mark each as Hard or Soft.</p>
                {skills.map((skill, i) => (
                  <div key={i} className="mp-skill-row">
                    <div className="mp-field mp-field-flex2">
                      <input
                        type="text"
                        value={skill.SkillName}
                        onChange={e => updateList(setSkills, i, 'SkillName', e.target.value)}
                        placeholder="e.g. React, Python, Leadership"
                        className="mp-input"
                      />
                    </div>
                    <div className="mp-field mp-field-flex1">
                      <select
                        value={skill.SkillType}
                        onChange={e => updateList(setSkills, i, 'SkillType', e.target.value)}
                        className="mp-select"
                      >
                        {SKILL_TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <button type="button" onClick={() => removeFromList(setSkills, i)} className="mp-delete-btn">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <button type="button" className="mp-add-btn" onClick={() => addToList(setSkills, emptySkill())}>
                  <Plus size={13} /> Add Skill
                </button>
              </div>
            )}

            {activeSection === 'experience' && (
              <div className="mp-section">
                {workExperience.map((exp, i) => (
                  <div key={i} className="mp-exp-card">
                    <div className="mp-card-header">
                      <strong>Experience #{i + 1}</strong>
                      {workExperience.length > 1 && (
                        <button type="button" onClick={() => removeFromList(setWorkExperience, i)} className="mp-delete-btn">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                    <div className="mp-row-2col">
                      <div className="mp-field">
                        <input 
                          type="text" 
                          value={exp.Company} 
                          onChange={e => updateList(setWorkExperience, i, 'Company', e.target.value)} 
                          placeholder="Company Name" 
                          className="mp-input" 
                        />
                      </div>
                      <div className="mp-field">
                        <input 
                          type="text" 
                          value={exp.JobTitle} 
                          onChange={e => updateList(setWorkExperience, i, 'JobTitle', formatJobTitle(e.target.value))} 
                          placeholder="Job Title" 
                          className="mp-input" 
                        />
                      </div>
                    </div>
                    <div className="mp-row-2col">
                      <div className="mp-field">
                        <input 
                          type="month" 
                          value={exp.StartDate} 
                          onChange={e => updateList(setWorkExperience, i, 'StartDate', e.target.value)} 
                          className="mp-input" 
                          placeholder="YYYY-MM"
                        />
                      </div>
                      <div className="mp-field">
                        <div className="mp-date-group">
                          <input 
                            type="month" 
                            value={exp.EndDate || ''} 
                            disabled={exp.IsCurrent} 
                            onChange={e => updateList(setWorkExperience, i, 'EndDate', e.target.value)} 
                            className="mp-input" 
                            placeholder="YYYY-MM"
                          />
                          <label className="mp-checkbox-label">
                            <input 
                              type="checkbox" 
                              checked={exp.IsCurrent} 
                              onChange={e => updateList(setWorkExperience, i, 'IsCurrent', e.target.checked)} 
                            />
                            Current
                          </label>
                        </div>
                      </div>
                    </div>
                    <div className="mp-field">
                      <textarea 
                        value={exp.Description} 
                        onChange={e => updateList(setWorkExperience, i, 'Description', e.target.value)} 
                        rows={2} 
                        placeholder="Job description, responsibilities, achievements..." 
                        className="mp-textarea" 
                      />
                    </div>
                  </div>
                ))}
                <button type="button" className="mp-add-btn" onClick={() => addToList(setWorkExperience, emptyWork())}>
                  <Plus size={13} /> Add Work Experience
                </button>
              </div>
            )}

            {activeSection === 'education' && (
              <div className="mp-section">
                {education.map((edu, i) => (
                  <div key={i} className="mp-edu-card">
                    <div className="mp-card-header">
                      <strong>Education #{i + 1}</strong>
                      {education.length > 1 && (
                        <button type="button" onClick={() => removeFromList(setEducation, i)} className="mp-delete-btn">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                    <div className="mp-row-2col">
                      <input 
                        type="text" 
                        value={edu.Institution} 
                        onChange={e => updateList(setEducation, i, 'Institution', e.target.value)} 
                        placeholder="Institution Name" 
                        className="mp-input" 
                      />
                      <input 
                        type="text" 
                        value={edu.Degree} 
                        onChange={e => updateList(setEducation, i, 'Degree', e.target.value)} 
                        placeholder="Degree (e.g. B.S., M.S.)" 
                        className="mp-input" 
                      />
                    </div>
                    <div className="mp-row-2col">
                      <input 
                        type="text" 
                        value={edu.FieldOfStudy} 
                        onChange={e => updateList(setEducation, i, 'FieldOfStudy', e.target.value)} 
                        placeholder="Field of Study" 
                        className="mp-input" 
                      />
                      <input 
                        type="text" 
                        value={edu.GPA} 
                        onChange={e => updateList(setEducation, i, 'GPA', e.target.value)} 
                        placeholder="GPA (e.g. 3.8)" 
                        className="mp-input" 
                      />
                    </div>
                    <div className="mp-row-2col">
                      <input 
                        type="month" 
                        value={edu.StartDate} 
                        onChange={e => updateList(setEducation, i, 'StartDate', e.target.value)} 
                        className="mp-input" 
                        placeholder="YYYY-MM"
                      />
                      <input 
                        type="month" 
                        value={edu.EndDate} 
                        onChange={e => updateList(setEducation, i, 'EndDate', e.target.value)} 
                        className="mp-input" 
                        placeholder="YYYY-MM"
                      />
                    </div>
                  </div>
                ))}
                <button type="button" className="mp-add-btn" onClick={() => addToList(setEducation, emptyEducation())}>
                  <Plus size={13} /> Add Education
                </button>
              </div>
            )}

            {activeSection === 'certifications' && (
              <div className="mp-section">
                {certifications.map((cert, i) => (
                  <div key={i} className="mp-cert-card">
                    <div className="mp-card-header">
                      <strong>Certification #{i + 1}</strong>
                      {certifications.length > 1 && (
                        <button type="button" onClick={() => removeFromList(setCertifications, i)} className="mp-delete-btn">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                    <div className="mp-row-2col">
                      <input 
                        type="text" 
                        value={cert.CertificationName} 
                        onChange={e => updateList(setCertifications, i, 'CertificationName', e.target.value)} 
                        placeholder="Certification Name" 
                        className="mp-input" 
                      />
                      <input 
                        type="text" 
                        value={cert.IssuingOrganization} 
                        onChange={e => updateList(setCertifications, i, 'IssuingOrganization', e.target.value)} 
                        placeholder="Issuing Organization" 
                        className="mp-input" 
                      />
                    </div>
                    <div className="mp-row-2col">
                      <input 
                        type="month" 
                        value={cert.IssueDate} 
                        onChange={e => updateList(setCertifications, i, 'IssueDate', e.target.value)} 
                        className="mp-input" 
                        placeholder="YYYY-MM"
                      />
                      <input 
                        type="month" 
                        value={cert.ExpiryDate} 
                        onChange={e => updateList(setCertifications, i, 'ExpiryDate', e.target.value)} 
                        className="mp-input" 
                        placeholder="YYYY-MM"
                      />
                    </div>
                  </div>
                ))}
                <button type="button" className="mp-add-btn" onClick={() => addToList(setCertifications, emptyCert())}>
                  <Plus size={13} /> Add Certification
                </button>
              </div>
            )}

            {activeSection === 'documents' && (
              <div className="mp-section">
                <p className="mp-hint">Upload additional documents (certificates, ID proofs, offer letters, etc.)</p>
                {documents.map((doc, i) => (
                  <div key={i} className="mp-doc-card">
                    <div className="mp-card-header">
                      <strong>Document #{i + 1}</strong>
                      {documents.length > 1 && (
                        <button type="button" onClick={() => removeFromList(setDocuments, i)} className="mp-delete-btn">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                    <div className="mp-row-2col">
                      <div className="mp-field">
                        <input
                          type="text"
                          value={doc.DocumentName}
                          onChange={e => updateList(setDocuments, i, 'DocumentName', e.target.value)}
                          placeholder="Document Name"
                          className="mp-input"
                        />
                      </div>
                      <div className="mp-field">
                        <select
                          value={doc.DocumentType || 'Certificate'}
                          onChange={e => updateList(setDocuments, i, 'DocumentType', e.target.value)}
                          className="mp-select"
                        >
                          <option value="Certificate">Certificate</option>
                          <option value="ID Proof">ID Proof</option>
                          <option value="Offer Letter">Offer Letter</option>
                          <option value="Degree">Degree</option>
                          <option value="Transcript">Transcript</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                    <div className="mp-field">
                      <div className="mp-file-container">
                        <label className="mp-file-label">
                          <Upload size={14} />
                          <span>Choose File</span>
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            onChange={e => handleDocumentUpload(i, e.target.files[0])}
                            className="mp-file-input"
                          />
                        </label>
                        <div className="mp-file-info">
                          {doc.File ? (
                            <>
                              <span className="mp-file-name">{doc.File.name}</span>
                              <span className="mp-file-size">({(doc.File.size / 1024).toFixed(0)} KB)</span>
                            </>
                          ) : doc.FileName ? (
                            <span className="mp-file-name">Current: {doc.FileName}</span>
                          ) : (
                            <span>No file selected</span>
                          )}
                        </div>
                      </div>
                      <FieldError name={`Document_${i}`} />
                    </div>
                  </div>
                ))}
                <button type="button" className="mp-add-btn" onClick={() => addToList(setDocuments, emptyDocument())}>
                  <Plus size={13} /> Add Document
                </button>
              </div>
            )}

            <div className="mp-footer">
              <button type="button" className="mp-btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="mp-btn-primary" disabled={uploading || parsingResume}>
                {uploading || parsingResume ? (
                  <>
                    <Loader size={14} className="mp-loading-icon" /> Processing...
                  </>
                ) : (
                  <>
                    <Save size={14} /> {isEdit ? 'Update Candidate' : 'Save Candidate'}
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AddModal;