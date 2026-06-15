// src/Bench_Sales/Components/RequirementsTracking.js
import React, { useState, useEffect } from "react";
import "../Styles/BenchSalesStyles.css";
import BASE_URL from "../../url"; // Import your BASE_URL
import axios from "axios";
import Swal from "sweetalert2";

import { 
  Calendar, 
  ClipboardCheck as LuClipboardCheck,
  Edit3, 
  Save,
  Send,
  BarChart3,
  FileText,
  Settings,
  ChevronDown,
  ChevronRight,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle2,
  AlertCircle,
  X,
  Clock,
  Upload,
  File,
  Image,
  FileSpreadsheet,
  Trash2,
  Play,
  Square,
  UserPlus // New icon for Apply button
} from 'lucide-react';


if (typeof window !== 'undefined' && typeof window.pdfjsLib !== 'undefined') {
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  console.log('✓ PDF.js worker initialized successfully');
} else {
  console.warn('⚠️ PDF.js library not found. Make sure the CDN script is added to public/index.html');
}

const RequirementsTracking = () => {
  const [requirements, setRequirements] = useState([]);
  const [filteredRequirements, setFilteredRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedRequirement, setSelectedRequirement] = useState(null);
  const [matchedCandidates, setMatchedCandidates] = useState([]);
  const [passportInputType, setPassportInputType] = useState('dropdown');
  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [clientFilter, setClientFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [showFilters, setShowFilters] = useState(false);

  const [formData, setFormData] = useState({
    jobTitle: '',
    skills: '',
    client: '',
    location: '',
    rate: '',
    duration: '',
    status: 'Open',
    jobDescription: '',
    experience: '',
    jobType: '',
    priority: 'Medium'
  });

  const [currentPage, setCurrentPage] = useState(1);
const itemsPerPage = 10;

// Calculate pagination
const totalPages = Math.ceil(filteredRequirements.length / itemsPerPage);
const startIndex = (currentPage - 1) * itemsPerPage;
const endIndex = startIndex + itemsPerPage;
const currentPageRequirements = filteredRequirements.slice(startIndex, endIndex);

// Handle page changes
const handlePageChange = (pageNumber) => {
  setCurrentPage(pageNumber);
  // Optional: Scroll to top of table
  document.querySelector('.req-tracking-table-container')?.scrollIntoView({ behavior: 'smooth' });
};

// Reset to page 1 when filters change
useEffect(() => {
  setCurrentPage(1);
}, [filteredRequirements]);


const [applyFormData, setApplyFormData] = useState({
  FirstName: '',
  LastName: '',
  EmailID: '',
  CountryCode: '+1',
  PhoneNumber1: '',
  PhoneNumber2: '',
  Experience: '', // Total Years
  RelevantExperience: '', // NEW - Relevant Years
  CurrentLocation: '',
  Skills: '',
  ExpectedSalary: '',
  CurrentSalary: '',
  NoticePeriod: '',
  Status: 'New',
  JobRoleApplied: '',
  CoverLetter: '',
  LinkedInProfile: '',
  CurrentEmployer: '',
  Education: '',
  Certifications: '',
  Dob: '',
  CandidateInfo: '',
  PassportNo: '',
  ResumeFile: null
});

  // Skills display component with tooltip
  const SkillsDisplay = ({ skills, maxVisible = 2 }) => {
    const skillsArray = Array.isArray(skills) ? skills : skills.split(',').map(skill => skill.trim());
    const visibleSkills = skillsArray.slice(0, maxVisible);
    const hiddenSkills = skillsArray.slice(maxVisible);

    if (skillsArray.length <= maxVisible) {
      return <span>{skillsArray.join(', ')}</span>;
    }

    return (
      <div className="skills-display">
        <span>{visibleSkills.join(', ')}</span>
        <span 
          className="skills-more-indicator" 
          title={`All Skills: ${skillsArray.join(', ')}`}
        >
          , +{hiddenSkills.length} more
        </span>
      </div>
    );
  };

// Fetch all requirements from backend - USING SAME API AS RECRUITMENT DASHBOARD
    const fetchRequirements = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No authentication token found');
        window.location.href = '/login';
        return;
      }

      try {
        setLoading(true);
        console.log('Fetching requirements from Recruitment API:', `${BASE_URL}/api/recruitment/roles`);
        
        const response = await axios.get(`${BASE_URL}/api/recruitment/roles`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000
        });

        console.log('Recruitment API Response:', response.data);

        let requirementsData = [];

        // Handle the response structure from recruitment API
        if (Array.isArray(response.data)) {
          requirementsData = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          requirementsData = response.data.data;
        } else {
          console.warn('Unexpected response structure from recruitment API:', response.data);
          requirementsData = [];
        }

        // Transform recruitment roles to requirements format
        const formattedRequirements = requirementsData.map(role => ({
          id: role.id || role.Id,
          jobTitle: role.role || role.jobTitle || '',
          skills: role.skills ? (Array.isArray(role.skills) ? role.skills : role.skills.split(',').map(skill => skill.trim())) : [],
          client: role.client || '',
          location: formatLocation(role) || role.location || '',
          rate: `${role.minRate || ''} - ${role.maxRate || ''} ${role.currency || ''}`,
          duration: role.duration || '',
          status: mapRecruitmentStatusToRequirementStatus(role.status),
          jobDescription: role.jobDescription || '',
          experience: role.experience || '',
          jobType: role.roleType || '',
          priority: mapUrgencyToPriority(role.urgency),
          createdAt: role.createdAt || role.CreatedDt,
          updatedAt: role.updatedAt || role.UpdatedDt,

            assignedRecruiters: role.assignedRecruiters || [],
            assignTo: role.assignTo || ''
        }));

        setRequirements(formattedRequirements);
        setFilteredRequirements(formattedRequirements);
        
      } catch (error) {
        console.error("Fetch requirements from recruitment API error:", {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });

        // Fallback to original requirements API if recruitment API fails
        await fetchRequirementsFallback();
      } finally {
        setLoading(false);
      }
    };


    // Extract text from PDF using PDF.js
const extractTextFromPDF = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        if (typeof window.pdfjsLib === 'undefined') {
          throw new Error('PDF.js library not loaded. Check if script is added to index.html');
        }

        const pdf = await window.pdfjsLib.getDocument({ data: e.target.result }).promise;
        let text = '';

        // Extract text from first 3 pages only
        const pagesToRead = Math.min(pdf.numPages, 3);
        
        for (let i = 1; i <= pagesToRead; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map(item => item.str)
            .join(' ');
          text += pageText + '\n';
        }

        resolve(text);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => reject(new Error('File reading failed'));
    reader.readAsArrayBuffer(file);
  });
};

const extractResumeData = (text) => {
  const data = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    skills: '',
    education: '',
    experience: '',
    linkedIn: ''
  };

  // ===== EMAIL EXTRACTION =====
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
  const emails = text.match(emailRegex);
  if (emails && emails.length > 0) {
    data.email = emails[0];
    console.log('✓ Found email:', data.email);
  }

  // ===== PHONE EXTRACTION (Multiple formats) =====
  const phonePatterns = [
    /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g, // US format
    /(\+\d{1,3}[-.\s]?)?\(?([0-9]{3,4})\)?[-.\s]?([0-9]{3,4})[-.\s]?([0-9]{4})/g, // International
  ];
  
  for (const pattern of phonePatterns) {
    const phones = text.match(pattern);
    if (phones && phones.length > 0) {
      data.phone = phones[0].replace(/\D/g, '');
      console.log('✓ Found phone:', data.phone);
      break;
    }
  }

  // ===== NAME EXTRACTION =====
  extractName(text, data.email, data);

  // ===== LINKEDIN EXTRACTION =====
  const linkedInRegex = /https?:\/\/(?:www\.)?linkedin\.com\/in\/[\w-]+/gi;
  const linkedInMatches = text.match(linkedInRegex);
  if (linkedInMatches && linkedInMatches.length > 0) {
    data.linkedIn = linkedInMatches[0];
    console.log('✓ Found LinkedIn:', data.linkedIn);
  }

  // ===== SKILLS EXTRACTION =====
  data.skills = extractSkills(text);

  // ===== EDUCATION EXTRACTION =====
  data.education = extractEducation(text);

  // ===== EXPERIENCE EXTRACTION =====
  data.experience = extractExperience(text);

  return data;
};

const extractName = (text, email, data) => {
  const lines = text.split('\n').filter(line => line.trim().length > 0);

  // Strategy 1: Look near email
  if (email) {
    const emailLineIndex = text.indexOf(email);
    const beforeEmail = text.substring(0, emailLineIndex).split('\n');
    
    for (let i = beforeEmail.length - 1; i >= Math.max(0, beforeEmail.length - 10); i--) {
      const line = (beforeEmail[i] || '').trim();
      if (isValidNameLine(line)) {
        const [first, last] = extractNameFromLine(line);
        if (first) {
          data.firstName = first;
          data.lastName = last;
          console.log('✓ Found name near email:', first, last);
          return;
        }
      }
    }
  }

  // Strategy 2: Check first 10 lines
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const line = lines[i].trim();
    if (isValidNameLine(line)) {
      const [first, last] = extractNameFromLine(line);
      if (first) {
        data.firstName = first;
        data.lastName = last;
        console.log('✓ Found name in first lines:', first, last);
        return;
      }
    }
  }

  console.log('⚠ Name not found in resume');
};


const isValidNameLine = (line) => {
  if (!line || line.length > 100 || line.length < 2) return false;
  
  // Skip headers and labels
  const skipPatterns = [
    /^(resume|cv|curriculum|vitae|profile|summary|objective|about|phone|email|address|linkedin|website)/i,
    /^[\d\s\-().+@]/,
    /^(contact|professional|personal|technical|projects|experience|education)/i
  ];
  
  return !skipPatterns.some(pattern => pattern.test(line));
};

// Extract first and last name from line
const extractNameFromLine = (line) => {
  const words = line
    .split(/[\s,]+/)
    .filter(w => /^[a-zA-Z-'.]+$/.test(w) && w.length > 1);
  
  if (words.length === 0) return ['', ''];
  if (words.length === 1) return [words[0], ''];
  return [words[0], words[1]];
};


// FIXED extractSkills function - Escapes special regex characters

const extractSkills = (text) => {
  const commonSkills = [
    'React', 'Angular', 'Vue', 'Node.js', 'Python', 'Java', 'JavaScript', 'TypeScript',
    'SQL', 'MongoDB', 'PostgreSQL', 'MySQL', 'AWS', 'Azure', 'Google Cloud',
    'Docker', 'Kubernetes', 'Git', 'REST API', 'GraphQL', 'HTML', 'CSS', 'SASS',
    'Bootstrap', 'Tailwind', 'Express', 'Django', 'Flask', 'C#', '.NET',
    'PHP', 'Laravel', 'Ruby', 'Rails', 'Go', 'Rust', 'Scala', 'Kotlin',
    'Jenkins', 'Linux', 'Windows', 'Agile', 'Scrum', 'JIRA', 'C++', 'Objective-C'
  ];

  const foundSkills = [];
  const textLower = text.toLowerCase();

  for (const skill of commonSkills) {
    try {
      const escapedSkill = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').toLowerCase();
      const regex = new RegExp(`\\b${escapedSkill}\\b`, 'gi');
      if (regex.test(textLower)) {
        foundSkills.push(skill);
      }
    } catch (err) {
      continue;
    }
  }

  const result = [...new Set(foundSkills)].join(', ');
  console.log('✓ Found skills:', result);
  return result;
};

// Extract education from resume
const extractEducation = (text) => {
  const educationPatterns = [
    // Degree + Subject pattern
    /(?:bachelor|master|phd|diploma|degree|b\.?tech|m\.?tech|b\.?s\.?|m\.?s\.?|bca|mca).*?(?:in|of)?\s+([a-zA-Z\s&]+?)(?:\n|,|$)/gi,
    // School + Degree pattern
    /([a-zA-Z\s&]+?)\s+(?:bachelor|master|phd|diploma|degree|engineering|science|arts)/gi,
  ];

  for (const pattern of educationPatterns) {
    const match = text.match(pattern);
    if (match && match.length > 0) {
      const education = match[0].trim().substring(0, 150);
      console.log('✓ Found education:', education);
      return education;
    }
  }

  console.log('⚠ Education not found');
  return '';
};

// Extract years of experience
const extractExperience = (text) => {
  const experiencePatterns = [
    // "X years of experience"
    /(\d+)\s+years?\s+of\s+(?:work\s+)?experience/gi,
    // Year range like "2018 - 2023"
    /(\d{4})\s*[-–]\s*(?:2\d{3}|Present|Now|Current)/gi,
    // "Experience: X years"
    /experience\s*:?\s*(\d+)\s+years?/gi,
  ];

  for (const pattern of experiencePatterns) {
    const match = text.match(pattern);
    if (match && match.length > 0) {
      let experience = '';
      
      if (pattern.toString().includes('years')) {
        // Extract number from "X years" pattern
        const num = match[0].match(/\d+/);
        experience = num ? num[0] : '';
      } else {
        // Extract year range
        const years = match[0].match(/\d{4}/g);
        if (years && years.length >= 2) {
          experience = (parseInt(years[1]) - parseInt(years[0])).toString();
        }
      }

      if (experience && parseInt(experience) > 0 && parseInt(experience) < 80) {
        console.log('✓ Found experience:', experience, 'years');
        return experience;
      }
    }
  }

  console.log('⚠ Experience not found');
  return '';
};


    // Fallback to original requirements API
    const fetchRequirementsFallback = async () => {
      const token = localStorage.getItem('token');
      try {
        console.log('Trying fallback requirements API...');
        
        const response = await axios.get(`${BASE_URL}/api/requirements`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000
        });

        // ... keep the original fallback logic from your current code
        let requirementsData = [];

        if (response.data) {
          if (Array.isArray(response.data)) {
            requirementsData = response.data;
          } else if (response.data.data && Array.isArray(response.data.data)) {
            requirementsData = response.data.data;
          } else if (response.data.success && Array.isArray(response.data.requirements)) {
            requirementsData = response.data.requirements;
          }
        }

        const formattedRequirements = requirementsData.map(req => ({
          id: req.Id || req.id,
          jobTitle: req.JobTitle || '',
          skills: req.Skills ? req.Skills.split(',').map(skill => skill.trim()) : [],
          client: req.Client || '',
          location: req.Location || '',
          rate: req.Rate || '',
          duration: req.Duration || '',
          status: req.Status || 'Open',
          jobDescription: req.JobDescription || '',
          experience: req.Experience || '',
          jobType: req.JobType || '',
          priority: req.Priority || 'Medium',
          createdAt: req.CreatedAt || req.CreatedDt,
          updatedAt: req.UpdatedAt || req.UpdatedDt
        }));

        setRequirements(formattedRequirements);
        setFilteredRequirements(formattedRequirements);
        
      } catch (fallbackError) {
        console.error("Fallback requirements API also failed:", fallbackError);
        Swal.fire('Error', 'Failed to load requirements from both sources', 'error');
        setRequirements([]);
        setFilteredRequirements([]);
      }
    };

    // Helper function to map recruitment status to requirement status
    const mapRecruitmentStatusToRequirementStatus = (recruitmentStatus) => {
      const statusMap = {
        'Active': 'Open',
        'Inactive': 'On Hold',
        'Closed': 'Closed',
        'On Hold': 'On Hold',
        'Cancelled': 'Cancelled'
      };
      return statusMap[recruitmentStatus] || 'Open';
    };

    // Helper function to map urgency to priority
    const mapUrgencyToPriority = (urgency) => {
      const priorityMap = {
        'Normal': 'Medium',
        'Low': 'Low',
        'Medium': 'Medium',
        'High': 'High',
        'Critical': 'Urgent'
      };
      return priorityMap[urgency] || 'Medium';
    };

    // Add the formatLocation function (same as in RecruitmentDashboard)
    const formatLocation = (role) => {
      if (!role.city && !role.state && !role.country) {
        return 'N/A';
      }
      return `${role.city || ''}, ${role.state || ''}, ${role.country || ''}`.replace(/^,\s*|\s*,/g, '').trim();
    };

  // Apply search and filters
  useEffect(() => {
    let filtered = requirements;

    // Apply search term filter
    if (searchTerm) {
      filtered = filtered.filter(req => 
        req.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase())) ||
        req.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'All') {
      filtered = filtered.filter(req => req.status === statusFilter);
    }

    // Apply client filter
    if (clientFilter !== 'All') {
      filtered = filtered.filter(req => req.client === clientFilter);
    }

    // Apply priority filter
    if (priorityFilter !== 'All') {
      filtered = filtered.filter(req => req.priority === priorityFilter);
    }

    setFilteredRequirements(filtered);
  }, [searchTerm, statusFilter, clientFilter, priorityFilter, requirements]);

  // Get unique clients for filter dropdown
  const uniqueClients = ['All', ...new Set(requirements.map(req => req.client).filter(Boolean))];
  const statusOptions = ['All', 'Open', 'In Progress', 'On Hold', 'Closed', 'Cancelled'];
  const priorityOptions = ['All', 'Low', 'Medium', 'High', 'Urgent'];

  // Initial data fetch
  useEffect(() => {
    fetchRequirements();
  }, []);

  // Resume parsing function
const parseResume = async (file) => {
  try {
    Swal.fire({
      title: 'Processing Resume...',
      text: 'Extracting information from your document',
      icon: 'info',
      allowOutsideClick: false,
      showConfirmButton: false,
      willOpen: () => {
        Swal.showLoading();
      },
      didOpen: () => {
        const swalContainer = document.querySelector('.swal2-container');
        if (swalContainer) {
          swalContainer.style.zIndex = '10000';
        }
      }
    });

    let extractedText = '';
    let fileType = '';

    try {
      if (file.type === 'application/pdf') {
        fileType = 'PDF';
        extractedText = await extractTextFromPDF(file);
      } else if (file.type === 'application/msword') {
        fileType = 'DOC';
        extractedText = await extractTextFromDOC(file);
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        fileType = 'DOCX';
        extractedText = await extractTextFromDOCX(file);
      } else {
        throw new Error('Unsupported file format. Please upload a PDF, DOC, or DOCX file.');
      }

      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error(`No text found in ${fileType} file.`);
      }

      console.log(`${fileType} extracted text length:`, extractedText.length);

      // Parse the extracted text
      const parsedData = extractResumeData(extractedText);

      // Auto-fill form with extracted data (even if partial)
      setApplyFormData(prev => ({
        ...prev,
        FirstName: parsedData.firstName || prev.FirstName,
        LastName: parsedData.lastName || prev.LastName,
        EmailID: parsedData.email || prev.EmailID,
        PhoneNumber1: parsedData.phone || prev.PhoneNumber1,
        Skills: parsedData.skills || prev.Skills,
        Education: parsedData.education || prev.Education,
        LinkedInProfile: parsedData.linkedIn || prev.LinkedInProfile,
        Experience: parsedData.experience || prev.Experience
      }));

      Swal.fire({
        title: `${fileType} Processed!`,
        html: `
          <div style="text-align: left; margin: 10px 0;">
            <p><strong>✓ Extracted Information:</strong></p>
            <div style="background: #f8f9fa; padding: 10px; border-radius: 4px; font-size: 13px; margin: 10px 0;">
              <div style="padding: 5px;"><strong>Name:</strong> ${parsedData.firstName || '(empty)'} ${parsedData.lastName || '(empty)'}</div>
              <div style="padding: 5px;"><strong>Email:</strong> ${parsedData.email || 'Not found'}</div>
              <div style="padding: 5px;"><strong>Phone:</strong> ${parsedData.phone || 'Not found'}</div>
              <div style="padding: 5px;"><strong>Skills:</strong> ${parsedData.skills || 'Not found'}</div>
            </div>
            <p style="margin-top: 10px; padding: 8px; background: #e3f2fd; border-radius: 4px; font-size: 12px;">
              ℹ️ Fields with (empty) or "Not found" need to be filled manually. You can still submit the form by entering the required information.
            </p>
          </div>
        `,
        icon: 'info',
        confirmButtonText: 'Continue',
        confirmButtonColor: '#007bff',
        didOpen: () => {
          const swalContainer = document.querySelector('.swal2-container');
          if (swalContainer) {
            swalContainer.style.zIndex = '10000';
          }
        }
      });

    } catch (parseError) {
      console.error('Parse error:', parseError);
      
      // Still allow form submission even if parsing fails
      Swal.fire({
        title: 'Resume Uploaded',
        html: `
          <div style="text-align: left;">
            <p><strong>✓ File uploaded successfully</strong></p>
            <p style="margin-top: 10px; color: #666; font-size: 13px;">
              Unable to auto-extract all information from your ${file.name}
            </p>
            <p style="margin-top: 10px; padding: 8px; background: #fff3cd; border-radius: 4px; font-size: 12px;">
              ⚠️ Please fill in the required fields manually to complete your application.
            </p>
          </div>
        `,
        icon: 'warning',
        confirmButtonText: 'OK',
        confirmButtonColor: '#ffc107',
        didOpen: () => {
          const swalContainer = document.querySelector('.swal2-container');
          if (swalContainer) {
            swalContainer.style.zIndex = '10000';
          }
        }
      });
    }

  } catch (error) {
    console.error('Upload error:', error);
    Swal.fire({
      title: 'File Upload Error',
      html: `
        <div style="text-align: left;">
          <p><strong>Error:</strong> ${error.message}</p>
          <p style="margin-top: 10px; font-size: 12px;">
            <strong>Solution:</strong> Fill the form manually with your information.
          </p>
        </div>
      `,
      icon: 'error',
      confirmButtonText: 'OK',
      didOpen: () => {
        const swalContainer = document.querySelector('.swal2-container');
        if (swalContainer) {
          swalContainer.style.zIndex = '10000';
        }
      }
    });
  }
};


const extractTextFromDOC = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target.result;
        const view = new Uint8Array(arrayBuffer);
        
        // Convert binary data to string
        let text = '';
        for (let i = 0; i < view.length; i++) {
          const charCode = view[i];
          // Include printable ASCII and common text characters
          if ((charCode >= 32 && charCode <= 126) || charCode === 10 || charCode === 13 || charCode === 9) {
            text += String.fromCharCode(charCode);
          } else if (charCode > 127) {
            // Try to handle extended characters
            text += String.fromCharCode(charCode);
          }
        }
        
        // Clean up extracted text
        text = text
          .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        
        // DOC files often have minimum text, accept anything with content
        if (text.length > 20) {
          resolve(text);
        } else {
          // For very short content, still accept it - user may have manually filled form
          resolve(text || 'Document content extracted but minimal text found');
        }
      } catch (err) {
        reject(new Error('Failed to extract text from DOC file'));
      }
    };
    
    reader.onerror = () => reject(new Error('File reading failed'));
    reader.readAsArrayBuffer(file);
  });
};

const getJSZip = () => {
  if (typeof window !== 'undefined' && window.JSZip) {
    return window.JSZip;
  }
  return undefined;
};


const extractTextFromDOCX = async (file) => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // Check if JSZip is available globally
    const JSZipLib = getJSZip();
    
    if (!JSZipLib) {
      console.warn('JSZip not available, using fallback extraction');
      return extractBasicTextFromDOCX(arrayBuffer);
    }

    const zip = new JSZipLib();
    const zipContent = await zip.loadAsync(arrayBuffer);
    
    // Get the main document file
    const documentXml = await zipContent.file('word/document.xml').async('text');
    
    // Extract text from XML
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(documentXml, 'text/xml');
    
    // Get all text nodes from <w:t> tags
    const textElements = xmlDoc.getElementsByTagName('w:t');
    let text = '';
    
    for (let i = 0; i < textElements.length; i++) {
      text += textElements[i].textContent;
    }
    
    if (!text || text.trim().length === 0) {
      throw new Error('No text content found in DOCX file');
    }
    
    return text;
  } catch (err) {
    console.warn('JSZip extraction failed, trying fallback:', err);
    try {
      return extractBasicTextFromDOCX(await file.arrayBuffer());
    } catch (fallbackErr) {
      throw new Error('Failed to parse DOCX: ' + fallbackErr.message);
    }
  }
};

const extractBasicTextFromDOCX = (arrayBuffer) => {
  try {
    // Convert ArrayBuffer to string
    const view = new Uint8Array(arrayBuffer);
    let binaryString = '';
    
    // Read the binary data as string
    for (let i = 0; i < view.length; i++) {
      binaryString += String.fromCharCode(view[i]);
    }
    
    // Look for text content between XML tags
    // DOCX stores text in <w:t> tags within the ZIP archive
    // eslint-disable-next-line no-control-regex
    const textMatches = binaryString.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || [];
    
    let extractedText = '';
    textMatches.forEach(match => {
      // Extract content between tags
      const content = match.replace(/<w:t[^>]*>/, '').replace(/<\/w:t>/, '');
      extractedText += content + ' ';
    });
    
    // Clean up text
    // eslint-disable-next-line no-control-regex
    extractedText = extractedText
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (!extractedText || extractedText.length === 0) {
      throw new Error('Could not extract text from DOCX');
    }
    
    return extractedText;
  } catch (err) {
    throw new Error('Failed to extract DOCX: ' + err.message);
  }
};

  // Handle resume file upload with parsing
const handleResumeUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (file.size > maxSize) {
    Swal.fire('File Too Large', 'Resume must be smaller than 10MB', 'warning');
    return;
  }
  
  if (!allowedTypes.includes(file.type)) {
    Swal.fire(
      'Unsupported Format',
      'Please upload a PDF, DOC, or DOCX file.',
      'warning'
    );
    return;
  }

  // Store file BEFORE parsing - this is critical!
  setApplyFormData(prev => ({ ...prev, ResumeFile: file }));

  // Parse it (parsing errors won't prevent submission)
  await parseResume(file);
};

  // Handle apply button click
  const handleApply = (requirement) => {
    setSelectedRequirement(requirement);
    setApplyFormData({
      FirstName: '',
      LastName: '',
      EmailID: '',
      CountryCode: '+1',
      PhoneNumber1: '',
      PhoneNumber2: '',
      Experience: '',
      CurrentLocation: '',
      Skills: '',
      ExpectedSalary: '',
      CurrentSalary: '',
      NoticePeriod: '',
      Status: 'New',
      JobRoleApplied: requirement.jobTitle,
      CoverLetter: '',
      LinkedInProfile: '',
      CurrentEmployer: '',
      Education: '',
      Certifications: '',
      Dob: '',
      CandidateInfo: '',
      PassportNo: '',
      ResumeFile: null
    });
    setShowApplyModal(true);
  };

  // Handle apply form change
  const handleApplyFormChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file') {
      setApplyFormData(prev => ({ ...prev, [name]: files[0] }));
    } else {
      setApplyFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Fixed handleApplySubmit function with correct field mapping
  const handleApplySubmit = async (e) => {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    if (!token) {
      Swal.fire('Error', 'Authentication token not found', 'error');
      return;
    }

    // Basic validation
    const requiredFields = ['FirstName', 'LastName', 'EmailID', 'PhoneNumber1', 'Experience', 'RelevantExperience', 'CurrentLocation', 'Skills', 'ExpectedSalary', 'PassportNo', 'JobRoleApplied'];
    const missingFields = requiredFields.filter(field => !applyFormData[field]?.toString().trim());

    if (missingFields.length > 0) {
      Swal.fire({
        title: 'Missing Required Fields',
        html: `Please fill in the following required fields:<br><br><strong>${missingFields.join(', ')}</strong>`,
        icon: 'warning'
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(applyFormData.EmailID)) {
      Swal.fire('Invalid Email', 'Please enter a valid email address', 'warning');
      return;
    }

    // File validation
    if (!applyFormData.ResumeFile) {
      Swal.fire('Resume Required', 'Please upload your resume', 'warning');
      return;
    }

    try {
      // Create FormData - only include fields that your backend expects
      const formData = new FormData();
      
      // Core required fields (matching your AddModal exactly)
      formData.append('FirstName', applyFormData.FirstName.trim());
      formData.append('LastName', applyFormData.LastName.trim());
      formData.append('EmailID', applyFormData.EmailID.trim().toLowerCase());
      formData.append('CountryCode', applyFormData.CountryCode || '+1');
      formData.append('PhoneNumber1', applyFormData.PhoneNumber1.replace(/\D/g, ''));
      formData.append('JobRoleApplied', applyFormData.JobRoleApplied.trim());
      formData.append('CurrentLocation', applyFormData.CurrentLocation.trim());
      formData.append('Experience', applyFormData.Experience.toString());
      formData.append('RelevantExperience', applyFormData.RelevantExperience.toString());
      formData.append('Skills', applyFormData.Skills.trim());
      formData.append('ExpectedSalary', applyFormData.ExpectedSalary.trim());
      formData.append('PassportNo', applyFormData.PassportNo);
      
      // Optional fields - only add if they have values
      if (applyFormData.PhoneNumber2?.trim()) {
        formData.append('PhoneNumber2', applyFormData.PhoneNumber2.replace(/\D/g, ''));
      }
      
      if (applyFormData.CurrentSalary?.trim()) {
        formData.append('CurrentSalary', applyFormData.CurrentSalary.trim());
      }
      
      if (applyFormData.NoticePeriod) {
        formData.append('NoticePeriod', applyFormData.NoticePeriod);
      }
      
      if (applyFormData.CurrentEmployer?.trim()) {
        formData.append('CurrentEmployer', applyFormData.CurrentEmployer.trim());
      }
      
      if (applyFormData.Education?.trim()) {
        formData.append('Education', applyFormData.Education.trim());
      }
      
      if (applyFormData.Certifications?.trim()) {
        formData.append('Certifications', applyFormData.Certifications.trim());
      }
      
      if (applyFormData.CoverLetter?.trim()) {
        formData.append('CoverLetter', applyFormData.CoverLetter.trim());
      }
      
      if (applyFormData.LinkedInProfile?.trim()) {
        formData.append('LinkedInProfile', applyFormData.LinkedInProfile.trim());
      }
      
      if (applyFormData.Dob) {
        formData.append('Dob', applyFormData.Dob);
      }
      
      if (applyFormData.CandidateInfo?.trim()) {
        formData.append('CandidateInfo', applyFormData.CandidateInfo.trim());
      }
      
      // IMPORTANT: Use the exact same file field name as your AddModal
      formData.append('ResumeUpload', applyFormData.ResumeFile, applyFormData.ResumeFile.name);
      
      console.log('Submitting application data:');
      for (let [key, value] of formData.entries()) {
        if (key !== 'ResumeUpload') {
          console.log(`${key}: ${value}`);
        } else {
          console.log(`${key}: File - ${value.name} (${value.size} bytes)`);
        }
      }

      // Make the API call with progress tracking
      const response = await axios.post(`${BASE_URL}/api/resumes`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        timeout: 60000,
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`Upload Progress: ${percentCompleted}%`);
        }
      });

      console.log('API Response:', response.data);

      if (response.status >= 200 && response.status < 300) {
        setShowApplyModal(false);
        
        // Reset form
       setApplyFormData({
        FirstName: '',
        LastName: '',
        EmailID: '',
        CountryCode: '+1',
        PhoneNumber1: '',
        PhoneNumber2: '',
        Experience: '',
        RelevantExperience: '',
        CurrentLocation: '',
        Skills: '',
        ExpectedSalary: '',
        CurrentSalary: '',
        NoticePeriod: '',
        Status: 'New',
        JobRoleApplied: '',
        CoverLetter: '',
        LinkedInProfile: '',
        CurrentEmployer: '',
        Education: '',
        Certifications: '',
        Dob: '',
        CandidateInfo: '',
        PassportNo: '',
        ResumeFile: null
      });
        
        Swal.fire({
          title: 'Application Successful!',
          html: `
            <div style="text-align: left;">
              <p><strong>Your application has been submitted successfully!</strong></p>
              <br>
              <p><strong>Position:</strong> ${selectedRequirement?.jobTitle || 'N/A'}</p>
              <p><strong>Client:</strong> ${selectedRequirement?.client || 'N/A'}</p>
              <p><strong>Applicant:</strong> ${applyFormData.FirstName} ${applyFormData.LastName}</p>
              <br>
              <p style="color: #28a745;">
                ✓ Your profile has been added to Resume Submission database<br>
                ✓ You can view it in the Resume Submission section<br>
                ✓ Our team will review your application shortly
              </p>
            </div>
          `,
          icon: 'success',
          confirmButtonText: 'Great!',
          timer: 6000,
          timerProgressBar: true
        });

        // Trigger refresh event for Resume Dashboard
        window.dispatchEvent(new CustomEvent('resumeDataUpdated'));
        
      } else {
        throw new Error(`Server responded with status ${response.status}`);
      }
      
    } catch (error) {
      console.error('Application submission error:', error);
      
      let errorMessage = 'Failed to submit application';
      let errorDetails = '';
      
      if (error.response?.data?.message) {
        errorDetails = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorDetails = error.response.data.error;
      } else if (error.response?.data?.details) {
        errorDetails = typeof error.response.data.details === 'string' 
          ? error.response.data.details 
          : JSON.stringify(error.response.data.details);
      } else if (error.message) {
        errorDetails = error.message;
      }

      // Handle specific error cases
      if (error.response?.status === 400) {
        errorMessage = 'Invalid data submitted';
        if (errorDetails.includes('Unexpected field')) {
          errorDetails = 'One or more fields are not recognized by the server. Please contact support.';
        }
      } else if (error.response?.status === 401) {
        errorMessage = 'Authentication failed';
        errorDetails = 'Please login again';
        localStorage.removeItem('token');
        setTimeout(() => window.location.href = '/login', 2000);
      }
      
      Swal.fire({
        title: 'Application Failed',
        html: `
          <div style="text-align: left;">
            <p><strong>${errorMessage}</strong></p>
            ${errorDetails ? `<p style="margin-top: 10px; color: #666;">${errorDetails}</p>` : ''}
          </div>
        `,
        icon: 'error',
        confirmButtonText: 'OK',
        footer: error.response?.status ? `Error Code: ${error.response.status}` : ''
      });
    }
  };

  const styleUpdates = `
  .swal2-container {
    z-index: 10000 !important;
  }
  
  .swal2-popup {
    z-index: 10001 !important;
  }
  
  .swal2-backdrop {
    z-index: 9999 !important;
  }
  
  .req-tracking-modal-overlay {
    z-index: 1000;
  }
  
  .req-tracking-modal-content {
    z-index: 1001;
  }
`;


  // Handle matching candidates for a requirement
  const handleMatchCandidates = async (requirement) => {
    setSelectedRequirement(requirement);
    
    const token = localStorage.getItem('token');
    if (!token) {
      Swal.fire('Error', 'Authentication token not found', 'error');
      return;
    }

    try {
      console.log('Finding matching candidates for requirement:', requirement.id);
      
      // First, try to get candidates from the candidates API
      let candidates = [];
      try {
        const candidatesResponse = await axios.get(`${BASE_URL}/api/candidates`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        });

        if (candidatesResponse.data.success) {
          candidates = candidatesResponse.data.data || [];
        }
      } catch (candidateError) {
        console.log('Could not fetch candidates from API, will try matching API');
      }

      // If we have candidates from the API, do client-side matching
      if (candidates.length > 0) {
        const matchedCandidates = performClientSideMatching(candidates, requirement);
        setMatchedCandidates(matchedCandidates);
        setShowMatchModal(true);
        return;
      }

      // Fallback: Try the matching API endpoint
      const response = await axios.post(`${BASE_URL}/api/requirements/${requirement.id}/match-candidates`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      });

      if (response.data.success && response.data.matchedCandidates) {
        setMatchedCandidates(response.data.matchedCandidates);
      } else {
        // Final fallback: Use mock data based on your actual candidates
        const mockCandidates = [
          { 
            id: 1, 
            name: "Senthil Kumar", 
            matchScore: 95, 
            skills: ["python", "sql"],
            email: "senthil@example.com",
            experience: 10,
            location: "Austin, TX",
            status: "Busy"
          },
          { 
            id: 2, 
            name: "Praveen Kumar", 
            matchScore: 85, 
            skills: ["python", "sql"],
            email: "mvpraveenkumar24@gmail.com",
            experience: 4,
            location: "New York",
            status: "Available"
          },
        ];
        
        // Filter based on requirement skills
        const filteredCandidates = mockCandidates.filter(candidate => {
          const reqSkills = Array.isArray(requirement.skills) 
            ? requirement.skills 
            : requirement.skills.split(',').map(s => s.trim());
          
          return reqSkills.some(reqSkill => 
            candidate.skills.some(candidateSkill => 
              candidateSkill.toLowerCase().includes(reqSkill.toLowerCase()) ||
              reqSkill.toLowerCase().includes(candidateSkill.toLowerCase())
            )
          );
        });

        setMatchedCandidates(filteredCandidates);
      }
      
      setShowMatchModal(true);
      
    } catch (error) {
      console.error('Error finding matching candidates:', error);
      Swal.fire('Error', 'Failed to find matching candidates', 'error');
    }
  };

  // Add this helper function for client-side matching
  const performClientSideMatching = (candidates, requirement) => {
    const reqSkills = Array.isArray(requirement.skills) 
      ? requirement.skills.map(s => s.toLowerCase().trim())
      : requirement.skills.split(',').map(s => s.toLowerCase().trim());

    console.log('Requirement skills:', reqSkills);
    console.log('Available candidates:', candidates);

    return candidates
      .map(candidate => {
        // Handle both API response format and mock data format
        const candidateSkills = Array.isArray(candidate.Skills) 
          ? candidate.Skills.map(s => s.toLowerCase().trim())
          : candidate.Skills ? candidate.Skills.split(',').map(s => s.toLowerCase().trim()) : [];
        
        console.log(`${candidate.Name || candidate.name} skills:`, candidateSkills);
        
        // Check for skill matches (more flexible matching)
        const matchingSkills = reqSkills.filter(reqSkill => 
          candidateSkills.some(candidateSkill => 
            candidateSkill.includes(reqSkill) || 
            reqSkill.includes(candidateSkill) ||
            // Also check for partial matches
            (reqSkill.length > 2 && candidateSkill.includes(reqSkill.substring(0, 3))) ||
            (candidateSkill.length > 2 && reqSkill.includes(candidateSkill.substring(0, 3)))
          )
        );

        console.log(`${candidate.Name || candidate.name} matching skills:`, matchingSkills);

        // Calculate match score
        const matchScore = matchingSkills.length > 0 
          ? Math.round((matchingSkills.length / reqSkills.length) * 100)
          : 0;

        return {
          id: candidate.Id || candidate.id,
          name: candidate.Name || candidate.name,
          matchScore: matchScore,
          skills: candidateSkills,
          email: candidate.Email || candidate.email,
          experience: candidate.Experience || candidate.experience,
          location: candidate.Location || candidate.location,
          status: candidate.Status || candidate.status,
          hasMatch: matchingSkills.length > 0
        };
      })
      .filter(candidate => candidate.hasMatch) // Only include candidates with at least one skill match
      .sort((a, b) => b.matchScore - a.matchScore); // Sort by match score descending
  };

  const handleViewRequirement = (requirement) => {
    setSelectedRequirement(requirement);
    setShowViewModal(true);
  };

  const openAddModal = () => {
    setModalMode('add');
    setFormData({
      jobTitle: '',
      skills: '',
      client: '',
      location: '',
      rate: '',
      duration: '',
      status: 'Open',
      jobDescription: '',
      experience: '',
      jobType: '',
      priority: 'Medium'
    });
    setShowFormModal(true);
  };

  const openEditModal = (requirement) => {
    setModalMode('edit');
    setFormData({
      id: requirement.id,
      jobTitle: requirement.jobTitle,
      skills: Array.isArray(requirement.skills) ? requirement.skills.join(', ') : requirement.skills,
      client: requirement.client,
      location: requirement.location,
      rate: requirement.rate,
      duration: requirement.duration,
      status: requirement.status,
      jobDescription: requirement.jobDescription,
      experience: requirement.experience,
      jobType: requirement.jobType,
      priority: requirement.priority
    });
    setShowFormModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

 const handleFormSubmit = async (e) => {
  e.preventDefault();
  
  const token = localStorage.getItem('token');
  if (!token) {
    Swal.fire('Error', 'Authentication token not found', 'error');
    return;
  }

  try {
    // Check if this is a recruitment role (from the recruitment API)
    const isRecruitmentRole = selectedRequirement?.source === 'recruitment';
    
    if (modalMode === 'edit') {
      // For editing, show a warning that recruitment roles cannot be edited here
      Swal.fire({
        title: 'Cannot Edit This Requirement',
        html: `
          <p>This requirement is synced from the Recruitment Dashboard.</p>
          <p>Please go to the <strong>Recruitment Dashboard</strong> to edit this role.</p>
        `,
        icon: 'warning',
        confirmButtonText: 'OK'
      });
      setShowFormModal(false);
      return;
    }

    // Only allow adding new requirements to the requirements API
    const requirementData = {
      jobTitle: formData.jobTitle,
      skills: formData.skills,
      client: formData.client,
      location: formData.location,
      rate: formData.rate,
      duration: formData.duration,
      status: formData.status,
      jobDescription: formData.jobDescription,
      experience: formData.experience,
      jobType: formData.jobType,
      priority: formData.priority
    };

    console.log('Creating new requirement:', requirementData);
    const response = await axios.post(`${BASE_URL}/api/requirements`, requirementData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.success) {
      await fetchRequirements();
      setShowFormModal(false);
      
      Swal.fire({
        title: 'Success!',
        text: 'Requirement created successfully',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    } else {
      throw new Error(response.data.message || 'Operation failed');
    }
    
  } catch (error) {
    console.error('Error creating requirement:', error);
    
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.error || 
                        error.message || 
                        'Failed to create requirement';
    
    Swal.fire('Error', errorMessage, 'error');
  }
};

  const deleteRequirement = async (requirementId) => {
    const requirement = requirements.find(req => req.id === requirementId);
    const requirementName = requirement ? requirement.jobTitle : 'Unknown';

    const confirm = await Swal.fire({
      title: 'Are you sure?',
      text: `This will permanently delete the requirement "${requirementName}". You won't be able to revert this!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    });

    if (confirm.isConfirmed) {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('Authentication token not found');
        }

        console.log('Deleting requirement with ID:', requirementId);
        
        const response = await axios.delete(`${BASE_URL}/api/requirements/${requirementId}`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        });

        if (response.data.success) {
          await fetchRequirements(); // Refresh data
          
          Swal.fire({
            title: 'Deleted!',
            text: `Requirement "${requirementName}" has been deleted successfully.`,
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          });
        } else {
          throw new Error(response.data.message || 'Delete operation failed');
        }
        
      } catch (err) {
        console.error('Error deleting requirement:', err);
        
        let errorMessage = 'Failed to delete requirement';
        
        if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        } else if (err.message) {
          errorMessage = err.message;
        }
        
        Swal.fire({
          title: 'Delete Failed',
          text: errorMessage,
          icon: 'error'
        });
      }
    }
  };

  const handleSubmitCandidate = async (candidate, requirement) => {
    const token = localStorage.getItem('token');
    if (!token) {
      Swal.fire('Error', 'Authentication token not found', 'error');
      return;
    }

    try {
      console.log('Submitting candidate:', candidate.name, 'for requirement:', requirement.jobTitle);
      
      const submissionData = {
        candidateId: candidate.id,
        candidateName: candidate.name,
        candidateSkills: Array.isArray(candidate.skills) ? candidate.skills.join(', ') : candidate.skills,
        candidateEmail: candidate.email,
        requirementId: requirement.id,
        jobTitle: requirement.jobTitle,
        vendorName: requirement.client, // Assuming client is the vendor
        status: 'Submitted',
        submissionDate: new Date().toISOString(),
        matchScore: candidate.matchScore,
        response: 'Waiting',
        feedbackNotes: `Auto-submitted via matching system with ${candidate.matchScore}% match score`
      };

      const response = await axios.post(`${BASE_URL}/api/submissions`, submissionData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        Swal.fire({
          title: 'Success!',
          text: `${candidate.name} has been submitted for ${requirement.jobTitle}`,
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });

        // Remove the submitted candidate from the matched candidates list
        setMatchedCandidates(prev => prev.filter(c => c.id !== candidate.id));
        
        // If no more candidates, close the modal
        if (matchedCandidates.length <= 1) {
          setShowMatchModal(false);
        }
      } else {
        throw new Error(response.data.message || 'Submission failed');
      }

    } catch (error) {
      console.error('Error submitting candidate:', error);
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Failed to submit candidate';
      
      Swal.fire('Error', errorMessage, 'error');
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('All');
    setClientFilter('All');
    setPriorityFilter('All');
  };

  if (loading) {
    return (
      <div className="req-tracking-container">
        <div className="loading-container" style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '400px',
          flexDirection: 'column'
        }}>
          <div className="loading-spinner" style={{
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #3498db',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            animation: 'spin 2s linear infinite'
          }}></div>
          <p style={{ marginTop: '16px' }}>Loading requirements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="req-tracking-container">
      <div className="req-tracking-page-header">
        <h1><LuClipboardCheck size={30} /> Requirement Tracking</h1>
        <button className="req-tracking-btn-primary" onClick={openAddModal}>
          + Add Requirement
        </button>
      </div>

      {/* Search and Filter Section */}
      <div className="req-tracking-search-filter-section">
        <div className="req-tracking-search-bar">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder="Search by job title, skills, client, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="req-tracking-search-input"
          />
          <button 
            className="req-tracking-filter-toggle"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} />
            Filters
            {showFilters ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>

        {showFilters && (
          <div className="req-tracking-filters-panel">
            <div className="filter-row">
              <div className="filter-group">
                <label>Status</label>
                <select 
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="filter-select"
                >
                  {statusOptions.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>Client</label>
                <select 
                  value={clientFilter} 
                  onChange={(e) => setClientFilter(e.target.value)}
                  className="filter-select"
                >
                  {uniqueClients.map(client => (
                    <option key={client} value={client}>{client}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>Priority</label>
                <select 
                  value={priorityFilter} 
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="filter-select"
                >
                  {priorityOptions.map(priority => (
                    <option key={priority} value={priority}>{priority}</option>
                  ))}
                </select>
              </div>

              <div className="filter-actions">
                <button 
                  className="req-tracking-btn-secondary"
                  onClick={clearFilters}
                >
                  Clear Filters
                </button>
                <span className="results-count">
                  Showing {filteredRequirements.length} of {requirements.length} requirements
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="req-tracking-table-container">
        <table className="req-tracking-table">
          <thead>
            <tr>
              <th>Job Title</th>
              <th>Client/Vendor</th>
              <th>Location</th>
              <th>Rate</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentPageRequirements.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>
                  {requirements.length === 0 
                    ? 'No requirements found. Click "Add Requirement" to get started.'
                    : 'No requirements match your search criteria. Try adjusting your filters.'
                  }
                </td>
              </tr>
            ) : (
              currentPageRequirements.map((requirement) => (
                <tr key={requirement.id}>
                  <td>{requirement.jobTitle}</td>
                  <td>{requirement.client}</td>
                  <td>{requirement.location}</td>
                  <td>{requirement.rate}</td>
                  <td>
                    <span className={`req-tracking-status-badge req-tracking-status-${requirement.status.toLowerCase().replace(' ', '-')}`}>
                      {requirement.status}
                    </span>
                  </td>
                  <td>
                    <button
                      className="req-tracking-btn-apply"
                      onClick={() => handleApply(requirement)}
                      title="Apply for this position"
                    >
                      <UserPlus size={16} />
                    </button>
                    {/* <button
                      className="req-tracking-btn-primary"
                      onClick={() => handleMatchCandidates(requirement)}
                      title="Find Matching Candidates"
                    >
                      <BarChart3 size={16} />
                    </button> */}
                    <button 
                      className="req-tracking-btn-secondary"
                      onClick={() => handleViewRequirement(requirement)}
                      title="View Details"
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}

            {filteredRequirements.length > itemsPerPage && (
              <div className="req-tracking-pagination">
                <div className="pagination-info">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredRequirements.length)} of {filteredRequirements.length} requirements
                </div>
                
                <div className="pagination-controls">
                  <button
                    className="pagination-btn"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    title="Previous page"
                  >
                    ← Previous
                  </button>

                  <div className="pagination-numbers">
                    {Array.from({ length: totalPages }, (_, i) => {
                      const pageNum = i + 1;
                      // Show first page, last page, current page, and pages around current
                      if (pageNum === 1 || pageNum === totalPages || 
                          (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
                        return (
                          <button
                            key={pageNum}
                            className={`pagination-number ${currentPage === pageNum ? 'active' : ''}`}
                            onClick={() => handlePageChange(pageNum)}
                          >
                            {pageNum}
                          </button>
                        );
                      }
                      // Show ellipsis
                      if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                        return <span key={`ellipsis-${pageNum}`} className="pagination-ellipsis">...</span>;
                      }
                      return null;
                    })}
                  </div>

                  <button
                    className="pagination-btn"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    title="Next page"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}

          </tbody>
        </table>
      </div>

      {/* Apply Modal - Enhanced with Resume Parsing */}
      {showApplyModal && selectedRequirement && (
        <div className="req-tracking-modal-overlay">
          <div className="req-tracking-modal-content req-tracking-modal-large">
            <div className="req-tracking-modal-header">
              <h2>Apply for {selectedRequirement.jobTitle}</h2>
              <button
                className="req-tracking-close-btn"
                onClick={() => setShowApplyModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="req-tracking-modal-body">
              <form onSubmit={handleApplySubmit} className="req-tracking-form">
                <div className="req-tracking-form-grid">
                  <div className="req-tracking-form-group req-tracking-form-full-width">
                    <label htmlFor="ResumeFile">Resume * (PDF, DOC, DOCX - Max 10MB)</label>
                    
                    <div className="file-upload-container">
                      <div className="file-upload-wrapper" onClick={() => document.getElementById('ResumeFile').click()}>
                        <input
                          type="file"
                          id="ResumeFile"
                          name="ResumeFile"
                          onChange={handleResumeUpload} // Changed to handleResumeUpload for parsing
                          className="file-upload-input"
                          accept=".pdf,.doc,.docx"
                          required
                          style={{ display: 'none' }}
                        />
                        
                        {/* Upload Icon */}
                        <svg className="upload-icon" viewBox="0 0 24 24" fill="currentColor" style={{ width: '24px', height: '24px', marginRight: '12px', color: '#07c25eff' }}>
                          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                        </svg>
                        
                        {/* Upload Content */}
                        <div className="upload-content">
                          <div className="upload-text" style={{ color: '#666', fontSize: '14px', fontWeight: '500' }}>
                            {applyFormData.ResumeFile ? applyFormData.ResumeFile.name : 'Click to upload or drag and drop'}
                          </div>
                          <div className="upload-subtext" style={{ color: '#999', fontSize: '12px', marginTop: '2px' }}>
                            {applyFormData.ResumeFile ? 
                              `${Math.round(applyFormData.ResumeFile.size / 1024)} KB` : 
                              'PDF, DOC, DOCX up to 10MB - Will auto-fill form fields'
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <small>Accepted formats: PDF, DOC, DOCX (Maximum 10MB). Form fields will be auto-filled after upload.</small>
                  </div>
                  <div className="req-tracking-form-group">
                    <label htmlFor="FirstName">First Name *</label>
                    <input
                      type="text"
                      id="FirstName"
                      name="FirstName"
                      value={applyFormData.FirstName}
                      onChange={handleApplyFormChange}
                      className="req-tracking-form-input"
                      required
                      minLength="2"
                      maxLength="50"
                      pattern="^[a-zA-Z\s]+$"
                      title="First name should only contain letters and spaces"
                    />
                    <small style={{color: '#28a745'}}>✓ Auto-filled from resume</small>
                  </div>
                  
                  <div className="req-tracking-form-group">
                    <label htmlFor="LastName">Last Name *</label>
                    <input
                      type="text"
                      id="LastName"
                      name="LastName"
                      value={applyFormData.LastName}
                      onChange={handleApplyFormChange}
                      className="req-tracking-form-input"
                      required
                      minLength="2"
                      maxLength="50"
                      pattern="^[a-zA-Z\s]+$"
                      title="Last name should only contain letters and spaces"
                    />
                    <small style={{color: '#28a745'}}>✓ Auto-filled from resume</small>
                  </div>

                  <div className="req-tracking-form-group">
                    <label htmlFor="EmailID">Email *</label>
                    <input
                      type="email"
                      id="EmailID"
                      name="EmailID"
                      value={applyFormData.EmailID}
                      onChange={handleApplyFormChange}
                      className="req-tracking-form-input"
                      required
                      pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
                      title="Please enter a valid email address"
                    />
                    <small style={{color: '#28a745'}}>✓ Auto-filled from resume</small>
                  </div>

                  <div className="req-tracking-form-group">
                    <label htmlFor="PhoneNumber1">Phone *</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <select
                        name="CountryCode"
                        value={applyFormData.CountryCode}
                        onChange={handleApplyFormChange}
                        className="req-tracking-form-select"
                        style={{ width: '100px' }}
                        required
                      >
                        <option value="+1">+1 (US)</option>
                        <option value="+91">+91 (IN)</option>
                        <option value="+44">+44 (UK)</option>
                        <option value="+61">+61 (AU)</option>
                        <option value="+49">+49 (DE)</option>
                        <option value="+33">+33 (FR)</option>
                        <option value="+81">+81 (JP)</option>
                        <option value="+86">+86 (CN)</option>
                      </select>
                      <input
                        type="tel"
                        id="PhoneNumber1"
                        name="PhoneNumber1"
                        value={applyFormData.PhoneNumber1}
                        onChange={handleApplyFormChange}
                        className="req-tracking-form-input"
                        style={{ flex: 1 }}
                        required
                        pattern="[0-9]{10,15}"
                        minLength="10"
                        maxLength="15"
                        title="Phone number should be 10-15 digits"
                        placeholder="1234567890"
                      />
                    </div>
                    <small style={{color: '#28a745'}}>✓ Auto-filled from resume</small>
                  </div>

                  <div className="req-tracking-form-group">
                    <label htmlFor="PhoneNumber2">Alternate Phone</label>
                    <input
                      type="tel"
                      id="PhoneNumber2"
                      name="PhoneNumber2"
                      value={applyFormData.PhoneNumber2}
                      onChange={handleApplyFormChange}
                      className="req-tracking-form-input"
                      pattern="[0-9]{10,15}"
                      minLength="10"
                      maxLength="15"
                      title="Phone number should be 10-15 digits"
                      placeholder="Optional"
                    />
                  </div>

                  <div className="req-tracking-form-group">
                    <label htmlFor="Experience">Total Years of Experience *</label>
                    <select
                      id="Experience"
                      name="Experience"
                      value={applyFormData.Experience}
                      onChange={handleApplyFormChange}
                      className="req-tracking-form-select"
                      required
                    >
                      <option value="">Select Experience</option>
                      <option value="0">0 years (Fresher)</option>
                      <option value="1">1 year</option>
                      <option value="2">2 years</option>
                      <option value="3">3 years</option>
                      <option value="4">4 years</option>
                      <option value="5">5 years</option>
                      <option value="6">6 years</option>
                      <option value="7">7 years</option>
                      <option value="8">8 years</option>
                      <option value="9">9 years</option>
                      <option value="10">10 years</option>
                      <option value="11">11 years</option>
                      <option value="12">12 years</option>
                      <option value="13">13 years</option>
                      <option value="14">14 years</option>
                      <option value="15">15+ years</option>
                    </select>
                  </div>

                  <div className="req-tracking-form-group">
                    <label htmlFor="RelevantExperience">Relevant Years of Experience *</label>
                    <select
                      id="RelevantExperience"
                      name="RelevantExperience"
                      value={applyFormData.RelevantExperience}
                      onChange={handleApplyFormChange}
                      className="req-tracking-form-select"
                      required
                    >
                      <option value="">Select Relevant Experience</option>
                      <option value="0">0 years (Fresher)</option>
                      <option value="1">1 year</option>
                      <option value="2">2 years</option>
                      <option value="3">3 years</option>
                      <option value="4">4 years</option>
                      <option value="5">5 years</option>
                      <option value="6">6 years</option>
                      <option value="7">7 years</option>
                      <option value="8">8 years</option>
                      <option value="9">9 years</option>
                      <option value="10">10 years</option>
                      <option value="11">11+ years</option>
                    </select>
                  </div>

                  <div className="req-tracking-form-group">
                    <label htmlFor="CurrentLocation">Current Location *</label>
                    <input
                      type="text"
                      id="CurrentLocation"
                      name="CurrentLocation"
                      value={applyFormData.CurrentLocation}
                      onChange={handleApplyFormChange}
                      className="req-tracking-form-input"
                      placeholder="e.g. Austin, TX"
                      required
                      minLength="3"
                      maxLength="100"
                      title="Enter your current city and state/country"
                    />
                  </div>

                  <div className="req-tracking-form-group">
                    <label htmlFor="CurrentEmployer">Current Employer</label>
                    <input
                      type="text"
                      id="CurrentEmployer"
                      name="CurrentEmployer"
                      value={applyFormData.CurrentEmployer}
                      onChange={handleApplyFormChange}
                      className="req-tracking-form-input"
                      placeholder="Company Name"
                      maxLength="100"
                    />
                  </div>

                  <div className="req-tracking-form-group">
                    <label htmlFor="CurrentSalary">Current Salary</label>
                    <input
                      type="text"
                      id="CurrentSalary"
                      name="CurrentSalary"
                      value={applyFormData.CurrentSalary}
                      onChange={handleApplyFormChange}
                      className="req-tracking-form-input"
                      placeholder="e.g. $80,000, $60/hr"
                      maxLength="50"
                    />
                  </div>

                  <div className="req-tracking-form-group">
                    <label htmlFor="ExpectedSalary">Expected Rate/Salary *</label>
                    <input
                      type="text"
                      id="ExpectedSalary"
                      name="ExpectedSalary"
                      value={applyFormData.ExpectedSalary}
                      onChange={handleApplyFormChange}
                      className="req-tracking-form-input"
                      placeholder="e.g. $65/hr, $120K/year"
                      required
                      minLength="3"
                      maxLength="50"
                      title="Enter your expected salary or hourly rate"
                    />
                  </div>

                  <div className="req-tracking-form-group">
                    <label htmlFor="NoticePeriod">Notice Period</label>
                    <select
                      id="NoticePeriod"
                      name="NoticePeriod"
                      value={applyFormData.NoticePeriod}
                      onChange={handleApplyFormChange}
                      className="req-tracking-form-select"
                    >
                      <option value="">Select Notice Period</option>
                      <option value="Immediate">Immediate</option>
                      <option value="1 week">1 week</option>
                      <option value="2 weeks">2 weeks</option>
                      <option value="3 weeks">3 weeks</option>
                      <option value="1 month">1 month</option>
                      <option value="6 weeks">6 weeks</option>
                      <option value="2 months">2 months</option>
                      <option value="3 months">3 months</option>
                    </select>
                  </div>

                  <div className="req-tracking-form-group req-tracking-form-full-width">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <label htmlFor="PassportNo">Work Authorization / Passport Number *</label>
                        <div style={{ 
                          display: 'flex', 
                          gap: '8px', 
                          marginLeft: 'auto',
                          backgroundColor: '#f0f0f0',
                          borderRadius: '4px',
                          padding: '4px'
                        }}>
                          <button
                            type="button"
                            onClick={() => setPassportInputType('dropdown')}
                            style={{
                              padding: '6px 12px',
                              border: passportInputType === 'dropdown' ? '2px solid #218838' : '1px solid #ddd',
                              backgroundColor: passportInputType === 'dropdown' ? '#218838' : 'transparent',
                              color: passportInputType === 'dropdown' ? 'white' : '#666',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: '500',
                              transition: 'all 0.2s'
                            }}
                          >
                            Dropdown
                          </button>
                          <button
                            type="button"
                            onClick={() => setPassportInputType('text')}
                            style={{
                              padding: '6px 12px',
                              border: passportInputType === 'text' ? '2px solid #218838' : '1px solid #ddd',
                              backgroundColor: passportInputType === 'text' ? '#218838' : 'transparent',
                              color: passportInputType === 'text' ? 'white' : '#666',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: '500',
                              transition: 'all 0.2s'
                            }}
                          >
                            Text Input
                          </button>
                        </div>
                      </div>

                      {passportInputType === 'dropdown' ? (
                        // DROPDOWN VERSION
                        <select
                          id="PassportNo"
                          name="PassportNo"
                          value={applyFormData.PassportNo}
                          onChange={handleApplyFormChange}
                          className="req-tracking-form-select"
                          required
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: '1px solid #ddd',
                            borderRadius: '6px',
                            fontSize: '14px',
                            backgroundColor: 'white'
                          }}
                        >
                          <option value="">-- Select Work Authorization Status --</option>
                          <optgroup label="US Status">
                            <option value="US Citizen">US Citizen</option>
                            <option value="Green Card">Green Card (Permanent Resident)</option>
                          </optgroup>
                          <optgroup label="Work Visas">
                            <option value="H1B">H1B Visa</option>
                            <option value="H4 EAD">H4 EAD (Spouse of H1B)</option>
                            <option value="L1A">L1A (Intracompany Transfer)</option>
                            <option value="L1B">L1B (Intracompany Transfer - Specialist)</option>
                            <option value="L2 EAD">L2 EAD (Spouse of L1)</option>
                            <option value="E3">E3 (Australian Visa)</option>
                            <option value="TN">TN (NAFTA Professional)</option>
                            <option value="O1">O1 (Extraordinary Ability)</option>
                          </optgroup>
                          <optgroup label="Student Status">
                            <option value="F1 OPT">F1 OPT (Optional Practical Training)</option>
                            <option value="F1 CPT">F1 CPT (Curricular Practical Training)</option>
                          </optgroup>
                          <optgroup label="Other">
                            <option value="Others">Others / Specify Below</option>
                          </optgroup>
                        </select>
                      ) : (
                        // TEXT INPUT VERSION
                        <div>
                          <input
                            type="text"
                            id="PassportNo"
                            name="PassportNo"
                            value={applyFormData.PassportNo}
                            onChange={handleApplyFormChange}
                            className="req-tracking-form-input"
                            placeholder="Enter your work authorization status or visa number"
                            required
                            minLength="3"
                            maxLength="100"
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              border: '1px solid #ddd',
                              borderRadius: '6px',
                              fontSize: '14px'
                            }}
                          />
                          <small style={{ color: '#666', marginTop: '4px', display: 'block' }}>
                            e.g., "US Citizen", "H1B Visa", "Green Card", or passport number
                          </small>
                        </div>
                      )}

                      <small style={{ color: '#218838', marginTop: '8px', display: 'block' }}>
                        * Required field - Choose between dropdown selection or enter your own text
                      </small>
                    </div>

                  <div className="req-tracking-form-group">
                    <label htmlFor="JobRoleApplied">Job Role Applied For *</label>
                    <input
                      type="text"
                      id="JobRoleApplied"
                      name="JobRoleApplied"
                      value={applyFormData.JobRoleApplied}
                      onChange={handleApplyFormChange}
                      className="req-tracking-form-input"
                      placeholder="Position you're applying for"
                      required
                      readOnly
                      style={{ backgroundColor: '#f8f9fa' }}
                    />
                    <small>This field is automatically filled based on the selected requirement</small>
                  </div>

                  <div className="req-tracking-form-group">
                    <label htmlFor="Dob">Date of Birth</label>
                    <input
                      type="date"
                      id="Dob"
                      name="Dob"
                      value={applyFormData.Dob}
                      onChange={handleApplyFormChange}
                      className="req-tracking-form-input"
                      max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                      min={new Date(new Date().setFullYear(new Date().getFullYear() - 80)).toISOString().split('T')[0]}
                    />
                  </div>

                  <div className="req-tracking-form-group req-tracking-form-full-width">
                    <label htmlFor="LinkedInProfile">LinkedIn Profile</label>
                    <input
                      type="url"
                      id="LinkedInProfile"
                      name="LinkedInProfile"
                      value={applyFormData.LinkedInProfile}
                      onChange={handleApplyFormChange}
                      className="req-tracking-form-input"
                      placeholder="https://linkedin.com/in/yourprofile"
                      pattern="https?://.+"
                      title="Please enter a valid URL"
                    />
                    <small style={{color: '#28a745'}}>✓ Auto-filled from resume</small>
                  </div>

                  <div className="req-tracking-form-group">
                    <label htmlFor="Skills">Skills *</label>
                    <input
                      type="text"
                      id="Skills"
                      name="Skills"
                      value={applyFormData.Skills}
                      onChange={handleApplyFormChange}
                      className="req-tracking-form-input"
                      placeholder="React, JavaScript, HTML/CSS, Python, SQL (comma separated)"
                      required
                      minLength="5"
                      maxLength="500"
                      title="List your key technical skills separated by commas"
                    />
                    <small style={{color: '#28a745'}}>✓ Auto-filled from resume</small>
                  </div>

                  <div className="req-tracking-form-group req-tracking-form-full-width">
                    <label htmlFor="Education">Education</label>
                    <input
                      type="text"
                      id="Education"
                      name="Education"
                      value={applyFormData.Education}
                      onChange={handleApplyFormChange}
                      className="req-tracking-form-input"
                      placeholder="e.g. Bachelor's in Computer Science, Master's in IT"
                      maxLength="200"
                    />
                    <small style={{color: '#28a745'}}>✓ Auto-filled from resume</small>
                  </div>

                  <div className="req-tracking-form-group req-tracking-form-full-width">
                    <label htmlFor="Certifications">Certifications</label>
                    <input
                      type="text"
                      id="Certifications"
                      name="Certifications"
                      value={applyFormData.Certifications}
                      onChange={handleApplyFormChange}
                      className="req-tracking-form-input"
                      placeholder="AWS Certified, PMP, Scrum Master (comma separated)"
                      maxLength="300"
                    />
                  </div>


                </div>

                <div className="req-tracking-form-group req-tracking-form-full-width">
                  <label htmlFor="CoverLetter">Cover Letter / Why are you interested?</label>
                  <textarea
                    id="CoverLetter"
                    name="CoverLetter"
                    value={applyFormData.CoverLetter}
                    onChange={handleApplyFormChange}
                    className="req-tracking-form-textarea"
                    rows="4"
                    placeholder="Tell us why you're a good fit for this role and what interests you about this opportunity..."
                    maxLength="1000"
                  />
                </div>

                <div className="req-tracking-form-group req-tracking-form-full-width">
                  <label htmlFor="CandidateInfo">Additional Information</label>
                  <textarea
                    id="CandidateInfo"
                    name="CandidateInfo"
                    value={applyFormData.CandidateInfo}
                    onChange={handleApplyFormChange}
                    className="req-tracking-form-textarea"
                    rows="3"
                    placeholder="Any additional information (projects, achievements, etc.)"
                    maxLength="1000"
                  />
                </div>

                <div className="req-tracking-form-actions">
                  <button
                    type="button"
                    className="req-tracking-btn-secondary"
                    onClick={() => setShowApplyModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="req-tracking-btn-primary"
                    disabled={
                      !applyFormData.FirstName?.trim() || 
                      !applyFormData.LastName?.trim() || 
                      !applyFormData.EmailID?.trim() || 
                      !applyFormData.PhoneNumber1?.trim() || 
                      !applyFormData.Experience || 
                      !applyFormData.CurrentLocation?.trim() || 
                      !applyFormData.Skills?.trim() || 
                      !applyFormData.ExpectedSalary?.trim() || 
                      !applyFormData.PassportNo?.trim() || 
                      !applyFormData.JobRoleApplied?.trim() ||
                      !applyFormData.ResumeFile
                    }
                  >
                    Submit Application
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Match Modal */}
      {showMatchModal && selectedRequirement && (
        <div className="req-tracking-modal-overlay">
          <div className="req-tracking-modal-content req-tracking-modal-large">
            <div className="req-tracking-modal-header">
              <h2>Best-Fit Candidates for {selectedRequirement.jobTitle}</h2>
              <button
                className="req-tracking-close-btn"
                onClick={() => setShowMatchModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="req-tracking-modal-body">
              <div className="req-tracking-matched-candidates">
                {matchedCandidates.length === 0 ? (
                  <p>No matching candidates found.</p>
                ) : (
                  matchedCandidates.map((candidate) => (
                    <div key={candidate.id} className="req-tracking-candidate-match-card">
                      <h3>{candidate.name}</h3>
                      <div className="req-tracking-match-score">
                        Match: {candidate.matchScore}%
                      </div>
                      <div className="req-tracking-skills">
                        <strong>Skills:</strong> {Array.isArray(candidate.skills) ? candidate.skills.join(", ") : candidate.skills}
                      </div>
                      {candidate.email && (
                        <div className="req-tracking-email">
                          <strong>Email:</strong> {candidate.email}
                        </div>
                      )}
                      {candidate.experience && (
                        <div className="req-tracking-experience">
                          <strong>Experience:</strong> {candidate.experience} years
                        </div>
                      )}
                      {candidate.location && (
                        <div className="req-tracking-location">
                          <strong>Location:</strong> {candidate.location}
                        </div>
                      )}
                      <button 
                        className="req-tracking-btn-primary"
                        onClick={() => handleSubmitCandidate(candidate, selectedRequirement)}
                      >
                        Submit Candidate
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedRequirement && (
        <div className="req-tracking-modal-overlay">
          <div className="req-tracking-modal-content req-tracking-modal-large">
            <div className="req-tracking-modal-header">
              <h2>Requirement Details</h2>
              <button
                className="req-tracking-close-btn"
                onClick={() => setShowViewModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="req-tracking-modal-body">
              <div className="req-tracking-view-details">
                <div className="req-tracking-view-row">
                  <div className="req-tracking-view-label">Job Title:</div>
                  <div className="req-tracking-view-value">{selectedRequirement.jobTitle}</div>
                </div>
                {/* <div className="req-tracking-view-row">
                  <div className="req-tracking-view-label">Skills Required:</div>
                  <div className="req-tracking-view-value">
                    {Array.isArray(selectedRequirement.skills) 
                      ? selectedRequirement.skills.join(", ") 
                      : selectedRequirement.skills
                    }
                  </div>
                </div> */}
                <div className="req-tracking-view-row">
                  <div className="req-tracking-view-label">Client/Vendor:</div>
                  <div className="req-tracking-view-value">{selectedRequirement.client}</div>
                </div>
                <div className="req-tracking-view-row">
                  <div className="req-tracking-view-label">Location:</div>
                  <div className="req-tracking-view-value">{selectedRequirement.location}</div>
                </div>
                <div className="req-tracking-view-row">
                  <div className="req-tracking-view-label">Rate:</div>
                  <div className="req-tracking-view-value">{selectedRequirement.rate}</div>
                </div>
                {/* <div className="req-tracking-view-row">
                  <div className="req-tracking-view-label">Duration:</div>
                  <div className="req-tracking-view-value">{selectedRequirement.duration}</div>
                </div> */}
                <div className="req-tracking-view-row">
                  <div className="req-tracking-view-label">Experience:</div>
                  <div className="req-tracking-view-value">{selectedRequirement.experience}</div>
                </div>
                <div className="req-tracking-view-row">
                  <div className="req-tracking-view-label">Job Type:</div>
                  <div className="req-tracking-view-value">{selectedRequirement.jobType}</div>
                </div>
                <div className="req-tracking-view-row">
                  <div className="req-tracking-view-label">Priority:</div>
                  <div className="req-tracking-view-value">
                    <span className={`req-tracking-priority-badge req-tracking-priority-${selectedRequirement.priority.toLowerCase()}`}>
                      {selectedRequirement.priority}
                    </span>
                  </div>
                </div>
                <div className="req-tracking-view-row">
                  <div className="req-tracking-view-label">Status:</div>
                  <div className="req-tracking-view-value">
                    <span className={`req-tracking-status-badge req-tracking-status-${selectedRequirement.status.toLowerCase().replace(' ', '-')}`}>
                      {selectedRequirement.status}
                    </span>
                  </div>
                </div>
                <div className="req-tracking-view-row">
  <div className="req-tracking-view-label">Assigned Recruiter(s):</div>
  <div className="req-tracking-view-value">
    {selectedRequirement.assignedRecruiters ? (
      (() => {
        let recruiters = [];
        try {
          if (typeof selectedRequirement.assignedRecruiters === 'string') {
            recruiters = JSON.parse(selectedRequirement.assignedRecruiters);
          } else if (Array.isArray(selectedRequirement.assignedRecruiters)) {
            recruiters = selectedRequirement.assignedRecruiters;
          }
        } catch (error) {
          console.error('Error parsing assigned recruiters:', error);
        }

        if (recruiters.length === 0) {
          return <span style={{ color: '#999', fontStyle: 'italic' }}>No recruiters assigned</span>;
        }

        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {recruiters.map((recruiter, index) => (
              <span
                key={index}
                style={{
                  backgroundColor: '#1a6f66ff',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                {recruiter.name || recruiter}
              </span>
            ))}
          </div>
        );
      })()
    ) : (
      <span style={{ color: '#999', fontStyle: 'italic' }}>No recruiters assigned</span>
    )}
  </div>
</div>
                <div className="req-tracking-view-row req-tracking-view-row-full">
                <div className="req-tracking-view-label">Job Description:</div>
                      <div 
                        className="req-tracking-view-value"
                        dangerouslySetInnerHTML={{ 
                          __html: typeof selectedRequirement.jobDescription === 'string' 
                            ? selectedRequirement.jobDescription 
                            : ''
                        }}
                        style={{
                          maxHeight: '400px',
                          overflowY: 'auto',
                          lineHeight: '1.6',
                          color: '#333'
                        }}
                      />
                    </div>
                  </div>
                </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showFormModal && (
        <div className="req-tracking-modal-overlay">
          <div className="req-tracking-modal-content req-tracking-modal-large">
            <div className="req-tracking-modal-header">
              <h2>{modalMode === 'add' ? 'Add New Requirement' : 'Edit Requirement'}</h2>
              <button
                className="req-tracking-close-btn"
                onClick={() => setShowFormModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="req-tracking-modal-body">
              <form onSubmit={handleFormSubmit} className="req-tracking-form">
                <div className="req-tracking-form-grid">
                  <div className="req-tracking-form-group">
                    <label htmlFor="jobTitle">Job Title *</label>
                    <input
                      type="text"
                      id="jobTitle"
                      name="jobTitle"
                      value={formData.jobTitle}
                      onChange={handleFormChange}
                      className="req-tracking-form-input"
                      placeholder="e.g. React Developer"
                      required
                    />
                  </div>
                  
                  <div className="req-tracking-form-group">
                    <label htmlFor="client">Client/Vendor *</label>
                    <input
                      type="text"
                      id="client"
                      name="client"
                      value={formData.client}
                      onChange={handleFormChange}
                      className="req-tracking-form-input"
                      placeholder="e.g. Tech Corp Inc"
                      required
                    />
                  </div>

                  <div className="req-tracking-form-group">
                    <label htmlFor="skills">Skills Required (comma separated) *</label>
                    <input
                      type="text"
                      id="skills"
                      name="skills"
                      value={formData.skills}
                      onChange={handleFormChange}
                      className="req-tracking-form-input"
                      placeholder="React, JavaScript, HTML/CSS"
                      required
                    />
                  </div>

                  <div className="req-tracking-form-group">
                    <label htmlFor="experience">Experience Required *</label>
                    <select
                      id="experience"
                      name="experience"
                      value={formData.experience}
                      onChange={handleFormChange}
                      className="req-tracking-form-select"
                      required
                    >
                      <option value="">Select Experience</option>
                      <option value="0-2 years">0-2 years</option>
                      <option value="2-4 years">2-4 years</option>
                      <option value="3-5 years">3-5 years</option>
                      <option value="5-7 years">5-7 years</option>
                      <option value="7-10 years">7-10 years</option>
                      <option value="10+ years">10+ years</option>
                    </select>
                  </div>

                  <div className="req-tracking-form-group">
                    <label htmlFor="location">Location *</label>
                    <input
                      type="text"
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleFormChange}
                      className="req-tracking-form-input"
                      placeholder="e.g. Remote, New York, NY"
                      required
                    />
                  </div>

                  <div className="req-tracking-form-group">
                    <label htmlFor="jobType">Job Type *</label>
                    <select
                      id="jobType"
                      name="jobType"
                      value={formData.jobType}
                      onChange={handleFormChange}
                      className="req-tracking-form-select"
                      required
                    >
                      <option value="">Select Job Type</option>
                      <option value="Contract">Contract</option>
                      <option value="Contract to Hire">Contract to Hire</option>
                      <option value="Full Time">Full Time</option>
                      <option value="Part Time">Part Time</option>
                    </select>
                  </div>

                  <div className="req-tracking-form-group">
                    <label htmlFor="rate">Rate/Salary *</label>
                    <input
                      type="text"
                      id="rate"
                      name="rate"
                      value={formData.rate}
                      onChange={handleFormChange}
                      className="req-tracking-form-input"
                      placeholder="e.g. $65/hr, $120K/year"
                      required
                    />
                  </div>

                  <div className="req-tracking-form-group">
                    <label htmlFor="duration">Duration *</label>
                    <select
                      id="duration"
                      name="duration"
                      value={formData.duration}
                      onChange={handleFormChange}
                      className="req-tracking-form-select"
                      required
                    >
                      <option value="">Select Duration</option>
                      <option value="3 months">3 months</option>
                      <option value="6 months">6 months</option>
                      <option value="9 months">9 months</option>
                      <option value="12 months">12 months</option>
                      <option value="18 months">18 months</option>
                      <option value="24 months">24 months</option>
                      <option value="Permanent">Permanent</option>
                    </select>
                  </div>

                  <div className="req-tracking-form-group">
                    <label htmlFor="priority">Priority</label>
                    <select
                      id="priority"
                      name="priority"
                      value={formData.priority}
                      onChange={handleFormChange}
                      className="req-tracking-form-select"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>

                  <div className="req-tracking-form-group">
                    <label htmlFor="status">Status</label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleFormChange}
                      className="req-tracking-form-select"
                    >
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="On Hold">On Hold</option>
                      <option value="Closed">Closed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div className="req-tracking-form-group req-tracking-form-full-width">
                  <label htmlFor="jobDescription">Job Description</label>
                  <textarea
                    id="jobDescription"
                    name="jobDescription"
                    value={formData.jobDescription}
                    onChange={handleFormChange}
                    className="req-tracking-form-textarea"
                    rows="4"
                    placeholder="Detailed job description, responsibilities, and requirements..."
                  />
                </div>

                <div className="req-tracking-form-actions">
                  <button
                    type="button"
                    className="req-tracking-btn-secondary"
                    onClick={() => setShowFormModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="req-tracking-btn-primary">
                    {modalMode === 'add' ? 'Add Requirement' : 'Update Requirement'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .skills-display {
          position: relative;
        }
        
        .skills-more-indicator {
          color: #007bff;
          cursor: pointer;
          font-weight: 500;
        }
        
        .skills-more-indicator:hover {
          text-decoration: underline;
        }
        
        .req-tracking-btn-apply {
          background: #059669;
          color: white;
          border: none;
          padding: 8px 12px;
          border-radius: 4px;
          cursor: pointer;
          margin-right: 5px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s;
        }
        
        .req-tracking-btn-apply:hover {
          background: #218838;
        }
        
        .req-tracking-form-full-width {
          grid-column: 1 / -1;
        }

        /* Search and Filter Styles */
        .req-tracking-search-filter-section {
          background: white;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .req-tracking-search-bar {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 15px;
        }

        .req-tracking-search-input {
          flex: 1;
          padding: 10px 15px 10px 40px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
          background: #f8f9fa;
          position: relative;
        }

        .search-icon {
          position: absolute;
          left: 15px;
          z-index: 1;
          color: #666;
        }

        .req-tracking-filter-toggle {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: #f8f9fa;
          border: 1px solid #ddd;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          color: #555;
        }

        .req-tracking-filter-toggle:hover {
          background: #e9ecef;
        }

        .req-tracking-filters-panel {
          border-top: 1px solid #eee;
          padding-top: 15px;
        }

        .filter-row {
          display: flex;
          gap: 20px;
          align-items: end;
          flex-wrap: wrap;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .filter-group label {
          font-size: 12px;
          font-weight: 600;
          color: #555;
          text-transform: uppercase;
        }

        .filter-select {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          min-width: 150px;
        }

        .filter-actions {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-left: auto;
        }

        .results-count {
          font-size: 14px;
          color: #666;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
};

export default RequirementsTracking;