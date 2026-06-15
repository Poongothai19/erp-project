// src/Bench_Sales/Components/CandidateManagement.js - COMPLETE VERSION WITH NAME SEARCH AND PAGINATION
import React, { useState, useEffect } from "react";
import "../Styles/BenchSalesStyles.css";
import axios from "axios";
import BASE_URL from "../../url";
import Swal from "sweetalert2";

import { 
  Calendar, 
  Users as LuUsers,
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
  Square
} from 'lucide-react';

// Pagination Component
const Pagination = ({ 
  currentPage, 
  totalPages, 
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange 
}) => {
  const pageNumbers = [];
  const maxVisiblePages = 5;

  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const goToPage = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      onPageChange(pageNumber);
    }
  };

  return (
    <div className="recruitment-pagination" style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: '20px',
      gap: '10px',
      flexWrap: 'wrap'
    }}>
      {/* Items per page selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '20px' }}>
        <span style={{ fontSize: '14px', color: '#666' }}>Show:</span>
        <select
          value={itemsPerPage}
          onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
          style={{
            padding: '6px 10px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px',
            backgroundColor: 'white'
          }}
        >
          <option value={10}>10</option>
          <option value={15}>15</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </select>
        <span style={{ fontSize: '14px', color: '#666' }}>per page</span>
      </div>

      {/* Previous button */}
      <button
        onClick={goToPreviousPage}
        disabled={currentPage === 1}
        style={{
          padding: '8px 16px',
          border: '1px solid #ddd',
          backgroundColor: currentPage === 1 ? '#f5f5f5' : 'white',
          color: currentPage === 1 ? '#999' : '#333',
          cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
          borderRadius: '4px',
          fontSize: '14px'
        }}
      >
        Previous
      </button>

      {/* First page and ellipsis */}
      {startPage > 1 && (
        <>
          <button
            onClick={() => goToPage(1)}
            style={{
              padding: '8px 12px',
              border: '1px solid #ddd',
              backgroundColor: 'white',
              color: '#333',
              cursor: 'pointer',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          >
            1
          </button>
          {startPage > 2 && <span style={{ padding: '0 5px', color: '#666' }}>...</span>}
        </>
      )}

      {/* Page numbers */}
      {pageNumbers.map(pageNumber => (
        <button
          key={pageNumber}
          onClick={() => goToPage(pageNumber)}
          style={{
            padding: '8px 12px',
            border: `1px solid ${currentPage === pageNumber ? '#1a6f66ff' : '#ddd'}`,
            backgroundColor: currentPage === pageNumber ? '#1a6f66ff' : 'white',
            color: currentPage === pageNumber ? 'white' : '#1a6f66ff',
            cursor: 'pointer',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: currentPage === pageNumber ? 'bold' : 'normal'
          }}
        >
          {pageNumber}
        </button>
      ))}

      {/* Last page and ellipsis */}
      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && <span style={{ padding: '0 5px', color: '#666' }}>...</span>}
          <button
            onClick={() => goToPage(totalPages)}
            style={{
              padding: '8px 12px',
              border: '1px solid #ddd',
              backgroundColor: 'white',
              color: '#333',
              cursor: 'pointer',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          >
            {totalPages}
          </button>
        </>
      )}

      {/* Next button */}
      <button
        onClick={goToNextPage}
        disabled={currentPage === totalPages}
        style={{
          padding: '8px 16px',
          border: '1px solid #ddd',
          backgroundColor: currentPage === totalPages ? '#f5f5f5' : 'white',
          color: currentPage === totalPages ? '#999' : '#333',
          cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
          borderRadius: '4px',
          fontSize: '14px'
        }}
      >
        Next
      </button>

      {/* Page info */}
      <div style={{
        fontSize: '14px',
        color: '#666',
        marginLeft: '15px'
      }}>
        Page {currentPage} of {totalPages} | {totalItems} items total
      </div>
    </div>
  );
};

const CandidateManagement = () => {
  const [candidates, setCandidates] = useState([]);
  const [filteredCandidates, setFilteredCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    name: "", // ADDED: Name filter
    skills: "",
    experience: "",
    location: "",
    priority: "",
  });
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    skills: '',
    experience: '',
    location: '',
    priority: '',
    visaStatus: '',
    status: 'Available',
    resume: null
  });
  const [resumeFile, setResumeFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  useEffect(() => {
    fetchCandidates();
  }, []);

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCandidates.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCandidates.length / itemsPerPage);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      if (!token) {
        Swal.fire("Error", "Authentication token not found", "error");
        setLoading(false);
        return;
      }

      const response = await axios.get(`${BASE_URL}/api/candidates`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const candidatesData = response.data.data.map(candidate => ({
          ...candidate,
          skills: Array.isArray(candidate.Skills) 
            ? candidate.Skills 
            : candidate.Skills ? candidate.Skills.split(', ') : []
        }));
        setCandidates(candidatesData);
        setFilteredCandidates(candidatesData);
      }
    } catch (error) {
      console.error('Error fetching candidates:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        Swal.fire("Session Expired", "Please login again", "warning").then(() => {
          window.location.href = "/login";
        });
      } else if (error.response?.status === 404) {
        // Use mock data if API is not available
        const mockCandidates = [
          {
            Id: 1,
            Name: "John Doe",
            Skills: "React, Node.js, JavaScript",
            skills: ["React", "Node.js", "JavaScript"],
            Experience: 5,
            Location: "New York",
            Priority: 1, // High priority
            Status: "Available",
            Email: "john@example.com",
            Phone: "123-456-7890",
            VisaStatus: "H1B",
            Resume: "john_doe_resume.pdf",
          },
          {
            Id: 2,
            Name: "Jane Smith",
            Skills: "Angular, TypeScript, Java",
            skills: ["Angular", "TypeScript", "Java"],
            Experience: 7,
            Location: "Chicago",
            Priority: 3, // Low priority
            Status: "Available",
            Email: "jane@example.com",
            Phone: "123-456-7891",
            VisaStatus: "US Citizen",
            Resume: "jane_smith_resume.pdf",
          },
        ];
        setCandidates(mockCandidates);
        setFilteredCandidates(mockCandidates);
        console.log("Using mock data as API endpoints are not available");
      } else {
        Swal.fire("Error", "Failed to load candidates", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  // FIXED: Priority conversion functions
  const getPriorityText = (priority) => {
    // Handle both string and number inputs
    const priorityNum = typeof priority === 'string' ? parseInt(priority) : priority;
    switch (priorityNum) {
      case 1:
        return 'High';
      case 2:
        return 'Medium';
      case 3:
        return 'Low';
      default:
        return 'Medium';
    }
  };

  const getPriorityValue = (priorityText) => {
    switch (priorityText) {
      case 'High':
        return 1;
      case 'Medium':
        return 2;
      case 'Low':
        return 3;
      default:
        return 2;
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // UPDATED: Enhanced applyFilters function with name search
  const applyFilters = () => {
    let filtered = candidates.filter((candidate) => {
      return (
        (filters.name === "" ||
          candidate.Name.toLowerCase().includes(filters.name.toLowerCase())) && // ADDED: Name filter
        (filters.skills === "" ||
          candidate.skills.some((skill) =>
            skill.toLowerCase().includes(filters.skills.toLowerCase())
          )) &&
        (filters.experience === "" ||
          candidate.Experience >= parseInt(filters.experience)) &&
        (filters.location === "" ||
          candidate.Location
            .toLowerCase()
            .includes(filters.location.toLowerCase())) &&
        (filters.priority === "" ||
          getPriorityText(candidate.Priority) === filters.priority)
      );
    });
    setFilteredCandidates(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  // ADDED: Real-time search function for name
  const handleNameSearch = (e) => {
    const { value } = e.target;
    setFilters(prev => ({ ...prev, name: value }));
    
    // Apply real-time filtering for name search
    let filtered = candidates.filter((candidate) => {
      return (
        (value === "" ||
          candidate.Name.toLowerCase().includes(value.toLowerCase())) &&
        (filters.skills === "" ||
          candidate.skills.some((skill) =>
            skill.toLowerCase().includes(filters.skills.toLowerCase())
          )) &&
        (filters.experience === "" ||
          candidate.Experience >= parseInt(filters.experience)) &&
        (filters.location === "" ||
          candidate.Location
            .toLowerCase()
            .includes(filters.location.toLowerCase())) &&
        (filters.priority === "" ||
          getPriorityText(candidate.Priority) === filters.priority)
      );
    });
    setFilteredCandidates(filtered);
    setCurrentPage(1); // Reset to first page when search changes
  };

  // ADDED: Clear all filters function
  const clearFilters = () => {
    setFilters({
      name: "",
      skills: "",
      experience: "",
      location: "",
      priority: "",
    });
    setFilteredCandidates(candidates);
    setCurrentPage(1); // Reset to first page when clearing filters
  };

  const viewCandidate = (candidate) => {
    setSelectedCandidate(candidate);
    setShowModal(true);
  };

  const renderSkillsWithTooltip = (skills) => {
    if (!skills || skills.length === 0) return '';
    
    const maxVisibleSkills = 2;
    const visibleSkills = skills.slice(0, maxVisibleSkills);
    const hiddenSkills = skills.slice(maxVisibleSkills);
    
    return (
      <div className="skills-display-container">
        <span className="visible-skills">
          {visibleSkills.join(', ')}
          {hiddenSkills.length > 0 && (
            <span className="skills-tooltip-trigger">
              , +{hiddenSkills.length} more
              <div className="skills-tooltip">
                <div className="skills-tooltip-content">
                  <strong>All Skills:</strong>
                  <br />
                  {skills.join(', ')}
                </div>
              </div>
            </span>
          )}
        </span>
      </div>
    );
  };

  const openAddModal = () => {
    setModalMode('add');
    setFormData({
      name: '',
      email: '',
      phone: '',
      skills: '',
      experience: '',
      location: '',
      priority: 'Medium', // FIXED: Set default priority
      visaStatus: '',
      status: 'Available',
      resume: null
    });
    setResumeFile(null);
    setShowFormModal(true);
  };

  const openEditModal = (candidate) => {
    setModalMode('edit');
    setFormData({
      id: candidate.Id,
      name: candidate.Name,
      email: candidate.Email,
      phone: candidate.Phone,
      skills: candidate.skills.join(', '),
      experience: candidate.Experience.toString(),
      location: candidate.Location,
      priority: getPriorityText(candidate.Priority), // FIXED: Convert numeric to text properly
      visaStatus: candidate.VisaStatus,
      status: candidate.Status,
      resume: candidate.Resume
    });
    setResumeFile(null);
    setShowFormModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleResumeUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        Swal.fire('Error', 'Please upload only PDF or Word documents', 'error');
        e.target.value = '';
        return;
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire('Error', 'File size should be less than 5MB', 'error');
        e.target.value = '';
        return;
      }
      
      setResumeFile(file);
      setFormData(prev => ({ 
        ...prev, 
        resume: file.name 
      }));
    }
  };

  const validateFormData = () => {
    if (!formData.name.trim()) {
      Swal.fire('Validation Error', 'Name is required', 'error');
      return false;
    }
    
    if (!formData.email.trim()) {
      Swal.fire('Validation Error', 'Email is required', 'error');
      return false;
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Swal.fire('Validation Error', 'Please enter a valid email address', 'error');
      return false;
    }
    
    if (!formData.phone.trim()) {
      Swal.fire('Validation Error', 'Phone number is required', 'error');
      return false;
    }
    
    if (!formData.skills.trim()) {
      Swal.fire('Validation Error', 'Skills are required', 'error');
      return false;
    }
    
    if (!formData.experience || formData.experience < 0) {
      Swal.fire('Validation Error', 'Valid experience is required', 'error');
      return false;
    }
    
    if (!formData.location.trim()) {
      Swal.fire('Validation Error', 'Location is required', 'error');
      return false;
    }
    
    if (!formData.priority) {
      Swal.fire('Validation Error', 'Priority is required', 'error');
      return false;
    }
    
    if (!formData.visaStatus) {
      Swal.fire('Validation Error', 'Visa status is required', 'error');
      return false;
    }
    
    return true;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    if (submitting) return;
    
    // Validate form data
    if (!validateFormData()) {
      return;
    }
    
    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");
      
      if (!token) {
        Swal.fire("Error", "Authentication token not found", "error");
        return;
      }

      // FIXED: Prepare the data object that matches your database schema
      const dataToSend = {
        Name: formData.name.trim(),
        Email: formData.email.trim(),
        Phone: formData.phone.trim(),
        Skills: formData.skills.trim(),
        Experience: parseInt(formData.experience),
        Location: formData.location.trim(),
        Priority: getPriorityValue(formData.priority), // FIXED: Convert text to number correctly
        VisaStatus: formData.visaStatus,
        Status: formData.status || 'Available'
      };

      console.log('Sending data:', dataToSend); // Debug log
      console.log('Priority value being sent:', dataToSend.Priority); // FIXED: Added priority debug

      let response;
      if (modalMode === 'add') {
        // For create, use FormData if there's a file, otherwise use JSON
        if (resumeFile) {
          const formDataToSend = new FormData();
          Object.keys(dataToSend).forEach(key => {
            formDataToSend.append(key, dataToSend[key]);
          });
          formDataToSend.append('resume', resumeFile);
          
          // Debug FormData contents
          for (let [key, value] of formDataToSend.entries()) {
            console.log(key, value);
          }
          
          response = await axios.post(`${BASE_URL}/api/candidates`, formDataToSend, {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          });
        } else {
          response = await axios.post(`${BASE_URL}/api/candidates`, dataToSend, {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
        }
      } else {
        // For update
        if (resumeFile) {
          const formDataToSend = new FormData();
          Object.keys(dataToSend).forEach(key => {
            formDataToSend.append(key, dataToSend[key]);
          });
          formDataToSend.append('resume', resumeFile);
          
          response = await axios.put(`${BASE_URL}/api/candidates/${formData.id}`, formDataToSend, {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          });
        } else {
          response = await axios.put(`${BASE_URL}/api/candidates/${formData.id}`, dataToSend, {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
        }
      }

      if (response.data.success) {
        Swal.fire(
          'Success', 
          `Candidate ${modalMode === 'add' ? 'added' : 'updated'} successfully`, 
          'success'
        );
        setShowFormModal(false);
        setResumeFile(null);
        fetchCandidates(); // Refresh the list
      } else {
        throw new Error(response.data.message || 'Operation failed');
      }
    } catch (error) {
      console.error('Error saving candidate:', error);
      
      // Enhanced error handling
      let errorMessage = 'Failed to save candidate';
      
      if (error.response) {
        // Server responded with error status
        console.error('Response error:', error.response.data);
        errorMessage = error.response.data.message || 
                     error.response.data.error || 
                     `Server error: ${error.response.status}`;
        
        if (error.response.status === 401) {
          localStorage.removeItem("token");
          Swal.fire("Session Expired", "Please login again", "warning").then(() => {
            window.location.href = "/login";
          });
          return;
        }
        
        if (error.response.status === 400) {
          // Bad request - likely validation error
          errorMessage = 'Please check your input data. ' + errorMessage;
        }
        
        if (error.response.status === 409) {
          // Conflict - likely duplicate email
          errorMessage = 'A candidate with this email already exists';
        }
      } else if (error.request) {
        // Network error
        console.error('Network error:', error.request);
        errorMessage = 'Network error. Please check your connection and try again.';
      } else {
        // Other error
        console.error('Error:', error.message);
        errorMessage = error.message;
      }
      
      Swal.fire('Error', errorMessage, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteCandidate = async (candidateId) => {
    console.log('Delete candidate called with ID:', candidateId, typeof candidateId);
    
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem("token");
        
        if (!token) {
          Swal.fire("Error", "Authentication token not found", "error");
          return;
        }

        console.log('Making DELETE request to:', `${BASE_URL}/api/candidates/${candidateId}`);
        console.log('With token:', token);

        const response = await axios.delete(`${BASE_URL}/api/candidates/${candidateId}`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('Delete response:', response.data);

        if (response.data.success) {
          Swal.fire('Deleted!', 'Candidate has been deleted.', 'success');
          fetchCandidates(); // Refresh the list
        } else {
          throw new Error(response.data.message || 'Delete operation failed');
        }
      } catch (error) {
        console.error('Error deleting candidate:', error);
        console.error('Error response:', error.response?.data);
        console.error('Error status:', error.response?.status);
        
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          Swal.fire("Session Expired", "Please login again", "warning").then(() => {
            window.location.href = "/login";
          });
        } else if (error.response?.status === 404) {
          Swal.fire('Error', 'Candidate not found. It may have already been deleted.', 'error');
          fetchCandidates(); // Refresh the list to remove the candidate from UI
        } else if (error.response?.status === 403) {
          Swal.fire('Error', 'You do not have permission to delete this candidate', 'error');
        } else {
          const errorMessage = error.response?.data?.message || 
                             error.response?.data?.error || 
                             error.message || 
                             'Failed to delete candidate';
          Swal.fire('Error', errorMessage, 'error');
        }
      }
    }
  };

const downloadResume = async (candidateId, candidateName) => {
  try {
    const token = localStorage.getItem("token");
    
    if (!token) {
      Swal.fire("Error", "Authentication token not found", "error");
      return;
    }

    console.log('=== FRONTEND DOWNLOAD DEBUG ===');
    console.log('Downloading for candidate ID:', candidateId);

    const response = await axios.get(
      `${BASE_URL}/api/candidates/${candidateId}/resume`, 
      {
        headers: { 
          Authorization: `Bearer ${token}`
        },
        responseType: 'arraybuffer'
      }
    );

    console.log('Response received, size:', response.data.byteLength);

    // Get filename from Content-Disposition header
    const contentDisposition = response.headers['content-disposition'];
    let filename = `${candidateName}_resume.pdf`; // default fallback
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=["']?([^"'\n]*)["']?/);
      if (filenameMatch && filenameMatch[1]) {
        filename = decodeURIComponent(filenameMatch[1]);
        console.log('Filename from header:', filename);
      }
    }

    // Detect file type from first bytes
    const uint8Array = new Uint8Array(response.data);
    const firstFourBytes = Array.from(uint8Array.slice(0, 4))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();

    console.log('File signature (hex):', firstFourBytes);
    console.log('First 4 bytes (decimal):', Array.from(uint8Array.slice(0, 4)));

    let mimeType;
    let detectedExt;
    
    // Check for DOCX (PK.. header - ZIP format)
    if (firstFourBytes === '504B0304') {
      mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      detectedExt = '.docx';
      console.log('✓ Detected: DOCX file');
    } 
    // Check for PDF (%PDF header)
    else if (firstFourBytes.startsWith('25504446')) {
      mimeType = 'application/pdf';
      detectedExt = '.pdf';
      console.log('✓ Detected: PDF file');
    }
    // Check for older DOC format
    else if (firstFourBytes.startsWith('D0CF11E0')) {
      mimeType = 'application/msword';
      detectedExt = '.doc';
      console.log('✓ Detected: DOC file');
    } 
    // Fallback
    else {
      console.warn('⚠ Unknown file signature, using filename extension');
      detectedExt = filename.substring(filename.lastIndexOf('.'));
      
      // Set mime type based on extension
      if (detectedExt === '.pdf') {
        mimeType = 'application/pdf';
      } else if (detectedExt === '.docx') {
        mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      } else if (detectedExt === '.doc') {
        mimeType = 'application/msword';
      } else {
        mimeType = 'application/octet-stream';
      }
    }

    // Ensure filename has correct extension
    const currentExt = filename.substring(filename.lastIndexOf('.')).toLowerCase();
    if (currentExt !== detectedExt.toLowerCase()) {
      filename = filename.replace(/\.[^.]+$/, '') + detectedExt;
      console.log('Corrected filename:', filename);
    }

    console.log('Final settings:', { filename, mimeType });

    // Create blob with detected mime type
    const blob = new Blob([response.data], { type: mimeType });
    console.log('Blob created - Type:', blob.type, 'Size:', blob.size);
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    
    document.body.appendChild(link);
    link.click();
    
    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      console.log('✓ Cleanup completed');
    }, 100);
    
    console.log('✓ Download initiated:', filename);
    
  } catch (error) {
    console.error('❌ Download error:', error);
    if (error.response?.status === 404) {
      Swal.fire('Error', 'Resume not found', 'error');
    } else {
      Swal.fire('Error', 'Failed to download resume', 'error');
    }
  }
};

  if (loading) {
    return (
      <div className="candidate-mgmt-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading candidates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="candidate-mgmt-container">
      <div className="candidate-mgmt-page-header">
        <h1><LuUsers size={30} /> Candidate Management</h1>
        <button className="candidate-mgmt-btn-primary" onClick={openAddModal}>
          + Add Candidate
        </button>
      </div>

      {/* UPDATED: Enhanced filters panel with name search and better layout */}
      <div className="candidate-mgmt-filters-panel">
        <div className="candidate-mgmt-filters-row">
          <div className="candidate-mgmt-search-group">
            <Search size={20} className="candidate-mgmt-search-icon" />
            <input
              type="text"
              name="name"
              placeholder="Search by candidate name..."
              value={filters.name}
              onChange={handleNameSearch}
              className="candidate-mgmt-filter-input candidate-mgmt-search-input"
            />
          </div>
          
          <input
            type="text"
            name="skills"
            placeholder="Filter by Skills"
            value={filters.skills}
            onChange={handleFilterChange}
            className="candidate-mgmt-filter-input"
          />
          
          <input
            type="number"
            name="experience"
            placeholder="Min Experience"
            value={filters.experience}
            onChange={handleFilterChange}
            className="candidate-mgmt-filter-input"
          />
          
          <input
            type="text"
            name="location"
            placeholder="Location"
            value={filters.location}
            onChange={handleFilterChange}
            className="candidate-mgmt-filter-input"
          />
          
          <select
            name="priority"
            value={filters.priority}
            onChange={handleFilterChange}
            className="candidate-mgmt-filter-input"
          >
            <option value="">All Priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
        
        <div className="candidate-mgmt-filter-actions">
          <button className="candidate-mgmt-btn-primary" onClick={applyFilters}>
            <Filter size={16} />
            Apply Filters
          </button>
          <button className="candidate-mgmt-btn-secondary" onClick={clearFilters}>
            <X size={16} />
            Clear All
          </button>
        </div>
      </div>

      {/* ADDED: Results summary */}
      <div className="candidate-mgmt-results-summary">
        <p>
          Showing {Math.min(currentItems.length, itemsPerPage)} of {filteredCandidates.length} candidates
          {filters.name && (
            <span className="candidate-mgmt-active-filter">
              • Searching for: "{filters.name}"
            </span>
          )}
        </p>
      </div>

      <div className="candidate-mgmt-table-container">
        <table className="candidate-mgmt-table">
          <thead>
            <tr>
              <th>Candidate Name</th>
              <th>Skills</th>
              <th>Exp (Years)</th>
              <th>Location</th>
              <th>Priority</th>
              <th>Visa Status</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((candidate) => (
              <tr key={candidate.Id}>
                <td>
                  <div className="candidate-mgmt-name-cell">
                    <strong>{candidate.Name}</strong>
                    <small className="candidate-mgmt-email-preview">{candidate.Email}</small>
                  </div>
                </td>
                <td>{renderSkillsWithTooltip(candidate.skills)}</td>
                <td>{candidate.Experience}</td>
                <td>{candidate.Location}</td>
                <td>
                  <span className={`candidate-mgmt-priority-badge candidate-mgmt-priority-${getPriorityText(candidate.Priority).toLowerCase()}`}>
                    {getPriorityText(candidate.Priority)}
                  </span>
                </td>
                <td>{candidate.VisaStatus}</td>
                <td>
                  <span className={`candidate-mgmt-status-badge candidate-mgmt-status-${candidate.Status.toLowerCase()}`}>
                    {candidate.Status}
                  </span>
                </td>
                <td>
                  <button
                    className="candidate-mgmt-btn-secondary"
                    onClick={() => viewCandidate(candidate)}
                    title="View Details"
                  >
                   <Eye size={16} />
                  </button>
                  <button 
                    className="candidate-mgmt-btn-primary"
                    onClick={() => openEditModal(candidate)}
                    title="Edit"
                  >
                    <Edit3 size={16} />
                  </button>
                  {candidate.Resume && (
                    <button 
                      className="candidate-mgmt-btn-info"
                      onClick={() => downloadResume(candidate.Id, candidate.Name)}
                      title="Download Resume"
                    >
                      <Download size={16} />
                    </button>
                  )}
                  <button 
                    className="candidate-mgmt-btn-danger"
                    onClick={() => deleteCandidate(candidate.Id)}
                    title="Delete"
                  > 
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredCandidates.length === 0 && (
          <div className="candidate-mgmt-no-data">
            <Search size={48} className="candidate-mgmt-no-data-icon" />
            <h3>No candidates found</h3>
            <p>
              {filters.name ? 
                `No candidates match your search criteria "${filters.name}"` :
                'No candidates found matching your criteria.'
              }
            </p>
            {(filters.name || filters.skills || filters.experience || filters.location || filters.priority) && (
              <button 
                className="candidate-mgmt-btn-primary" 
                onClick={clearFilters}
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Pagination Component */}
      {filteredCandidates.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredCandidates.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(value) => {
            setItemsPerPage(value);
            setCurrentPage(1); // Reset to first page when changing items per page
          }}
        />
      )}

      {/* Candidate Detail View Modal */}
      {showModal && selectedCandidate && (
        <div className="candidate-mgmt-modal-overlay">
          <div className="candidate-mgmt-modal-content">
            <div className="candidate-mgmt-modal-header">
              <h2>Candidate Profile</h2>
              <button
                className="candidate-mgmt-close-btn"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>
            <div className="candidate-mgmt-modal-body">
              <div className="candidate-mgmt-details">
                <div className="candidate-mgmt-detail-row">
                  <label>Name:</label>
                  <span>{selectedCandidate.Name}</span>
                </div>
                <div className="candidate-mgmt-detail-row">
                  <label>Email:</label>
                  <span>{selectedCandidate.Email}</span>
                </div>
                <div className="candidate-mgmt-detail-row">
                  <label>Phone:</label>
                  <span>{selectedCandidate.Phone}</span>
                </div>
                <div className="candidate-mgmt-detail-row">
                  <label>Skills:</label>
                  <span>{selectedCandidate.skills.join(", ")}</span>
                </div>
                <div className="candidate-mgmt-detail-row">
                  <label>Experience:</label>
                  <span>{selectedCandidate.Experience} years</span>
                </div>
                <div className="candidate-mgmt-detail-row">
                  <label>Location:</label>
                  <span>{selectedCandidate.Location}</span>
                </div>
                <div className="candidate-mgmt-detail-row">
                  <label>Priority:</label>
                  <span>{getPriorityText(selectedCandidate.Priority)}</span>
                </div>
                <div className="candidate-mgmt-detail-row">
                  <label>Visa Status:</label>
                  <span>{selectedCandidate.VisaStatus}</span>
                </div>
                {selectedCandidate.Resume && (
                  <div className="candidate-mgmt-detail-row">
                    <label>Resume:</label>
                    <button 
                      className="candidate-mgmt-btn-link"
                      onClick={() => downloadResume(selectedCandidate.Id, selectedCandidate.Name)}
                    >
                      Download Resume
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showFormModal && (
        <div className="candidate-mgmt-modal-overlay">
          <div className="candidate-mgmt-modal-content candidate-mgmt-modal-large">
            <div className="candidate-mgmt-modal-header">
              <h2>{modalMode === 'add' ? 'Add New Candidate' : 'Edit Candidate'}</h2>
              <button
                className="candidate-mgmt-close-btn"
                onClick={() => setShowFormModal(false)}
              >
                ×
              </button>
            </div>
            <div className="candidate-mgmt-modal-body">
              <form onSubmit={handleFormSubmit} className="candidate-mgmt-form">
                <div className="candidate-mgmt-form-grid">
                  <div className="candidate-mgmt-form-group">
                    <label htmlFor="name">Full Name *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleFormChange}
                      className="candidate-mgmt-form-input"
                      required
                      maxLength="255"
                    />
                  </div>
                  
                  <div className="candidate-mgmt-form-group">
                    <label htmlFor="email">Email *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleFormChange}
                      className="candidate-mgmt-form-input"
                      required
                      maxLength="255"
                    />
                  </div>

                  <div className="candidate-mgmt-form-group">
                    <label htmlFor="phone">Phone Number *</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleFormChange}
                      className="candidate-mgmt-form-input"
                      required
                      maxLength="20"
                    />
                  </div>

                  <div className="candidate-mgmt-form-group">
                    <label htmlFor="skills">Skills (comma separated) *</label>
                    <input
                      type="text"
                      id="skills"
                      name="skills"
                      value={formData.skills}
                      onChange={handleFormChange}
                      className="candidate-mgmt-form-input"
                      placeholder="React, Node.js, JavaScript"
                      required
                    />
                  </div>

                  <div className="candidate-mgmt-form-group">
                    <label htmlFor="experience">Experience (Years) *</label>
                    <input
                      type="number"
                      id="experience"
                      name="experience"
                      value={formData.experience}
                      onChange={handleFormChange}
                      className="candidate-mgmt-form-input"
                      min="0"
                      max="50"
                      required
                    />
                  </div>

                  <div className="candidate-mgmt-form-group">
                    <label htmlFor="location">Location *</label>
                    <input
                      type="text"
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleFormChange}
                      className="candidate-mgmt-form-input"
                      required
                      maxLength="100"
                    />
                  </div>

                  <div className="candidate-mgmt-form-group">
                    <label htmlFor="priority">Priority *</label>
                    <select
                      id="priority"
                      name="priority"
                      value={formData.priority}
                      onChange={handleFormChange}
                      className="candidate-mgmt-form-select"
                      required
                    >
                      <option value="">Select Priority</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>

                  <div className="candidate-mgmt-form-group">
                    <label htmlFor="visaStatus">Visa Status *</label>
                    <select
                      id="visaStatus"
                      name="visaStatus"
                      value={formData.visaStatus}
                      onChange={handleFormChange}
                      className="candidate-mgmt-form-select"
                      required
                    >
                      <option value="">Select Visa Status</option>
                      <option value="US Citizen">US Citizen</option>
                      <option value="Green Card">Green Card</option>
                      <option value="H1B">H1B</option>
                      <option value="L1">L1</option>
                      <option value="F1 OPT">F1 OPT</option>
                      <option value="TN">TN</option>
                      <option value="Indian Citizen">Indian Citizen</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="candidate-mgmt-form-group">
                    <label htmlFor="status">Status</label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleFormChange}
                      className="candidate-mgmt-form-select"
                    >
                      <option value="Available">Available</option>
                      <option value="Busy">Busy</option>
                      <option value="Interview Scheduled">Interview Scheduled</option>
                      <option value="Selected">Selected</option>
                      <option value="Joined">Joined</option>
                    </select>
                  </div>

                  <div className="candidate-mgmt-form-group candidate-mgmt-resume-upload-group">
                    <label htmlFor="resume">Upload Resume</label>
                    <div className="candidate-mgmt-file-upload-wrapper">
                      <input
                        type="file"
                        id="resume"
                        name="resume"
                        accept=".pdf,.doc,.docx"
                        onChange={handleResumeUpload}
                        className="candidate-mgmt-file-input"
                        style={{ display: 'none' }}
                      />
                      <label 
                        htmlFor="resume" 
                        className={`candidate-mgmt-file-upload-area ${resumeFile ? 'has-file' : ''}`}
                      >
                        <div className="candidate-mgmt-upload-icon-text">
                          <Upload size={20} />
                          <span className="candidate-mgmt-upload-text">
                            {resumeFile ? resumeFile.name : 
                             formData.resume && modalMode === 'edit' ? 
                             `Current: ${formData.resume}` : 
                             'Choose file or drag & drop'}
                          </span>
                        </div>
                        <small className="candidate-mgmt-upload-hint">
                          PDF, DOC, DOCX up to 5MB
                        </small>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="candidate-mgmt-form-actions">
                  <button
                    type="button"
                    className="candidate-mgmt-btn-secondary"
                    onClick={() => setShowFormModal(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="candidate-mgmt-btn-primary"
                    disabled={submitting}
                  >
                    {submitting 
                      ? (modalMode === 'add' ? 'Adding...' : 'Updating...') 
                      : (modalMode === 'add' ? 'Add Candidate' : 'Update Candidate')
                    }
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateManagement;