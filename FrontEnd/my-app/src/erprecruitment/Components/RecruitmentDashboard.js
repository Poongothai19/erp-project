
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import BASE_URL from '../../url';
import '../styles/erprecruitment.css';
import { LayoutGrid, List, UserPlus, Megaphone, ChevronLeft, ChevronRight } from 'lucide-react';

import {
  countriesData,
  stateMapping,
  getCountryCode,
  getCountryName,
  getStateCode,
  getStateName,
  getStatesForCountry,
  getStatesByCountryName,
  formatLocation
} from '../config/locationConfig';

import { 
  useReportFunctions, 
  ReportColumnModal,
  initialReportColumns 
} from './ReportConfig';

import ResumeSubmissionModal from './ResumeSubmissionModal';
import EditApplicationModal from './EditApplicationModal';
import RecruiterPerformanceReport from './RecruiterPerformanceReport';

const RecruitmentDashboard = () => {
  // State for API data
  const [rolesData, setRolesData] = useState([]);
  const [applicationsData, setApplicationsData] = useState({});
  const [recruiters, setRecruiters] = useState([]);
  const [hiringSteps, setHiringSteps] = useState([]);
  const [clients, setClients] = useState([
    "Tech Corp",
    "StartupXYZ",
    "Enterprise Ltd",
    "Design Studio",
    "Analytics Pro",
    "Tech Solutions",
    "Product Inc"
  ]);

  const [clientPOCs, setClientPOCs] = useState([]);

  const experienceLevels = [
    // "Junior (0-2 years)",
    // "Medium(2-5 years)",
    // "Senior (5-8 years)",
    // "Expert (8+ years)"
  ];

  // Add these with your other state declarations
const [showCustomDateRange, setShowCustomDateRange] = useState(false);
const [customStartDate, setCustomStartDate] = useState('');
const [customEndDate, setCustomEndDate] = useState('');

  const [roleTitles, setRoleTitles] = useState([
    "Senior Frontend Developer",
    "Full Stack Developer",
    "Backend Engineer",
    "DevOps Engineer",
    "Data Scientist",
    "UX/UI Designer",
    "Product Manager",
    "Project Manager",
    "Quality Assurance Engineer",
    "Business Analyst",
    "Technical Lead",
    "Software Architect",
    "Mobile Developer",
    "Cloud Engineer",
    "Machine Learning Engineer"
  ]);
  // UI state
  const [filteredRoles, setFilteredRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState(() => sessionStorage.getItem('recruitmentSearchTerm') || '');
  const [statusFilter, setStatusFilter] = useState(() => sessionStorage.getItem('recruitmentStatusFilter') || '');
  const [locationFilter, setLocationFilter] = useState(() => sessionStorage.getItem('recruitmentLocationFilter') || '');
  const [urgencyFilter, setUrgencyFilter] = useState(() => sessionStorage.getItem('recruitmentUrgencyFilter') || '');
  const [dateFilter, setDateFilter] = useState(() => localStorage.getItem('recruitmentDateFilter') || 'today');
  const [roleCategory, setRoleCategory] = useState('Onsite');
  const [cardLocationFilter, setCardLocationFilter] = useState(() => sessionStorage.getItem('recruitmentCardLocationFilter') || 'All');

  useEffect(() => {
    localStorage.setItem('recruitmentDateFilter', dateFilter);
    sessionStorage.setItem('recruitmentSearchTerm', searchTerm);
    sessionStorage.setItem('recruitmentStatusFilter', statusFilter);
    sessionStorage.setItem('recruitmentLocationFilter', locationFilter);
    sessionStorage.setItem('recruitmentUrgencyFilter', urgencyFilter);
    sessionStorage.setItem('recruitmentCardLocationFilter', cardLocationFilter);
  }, [dateFilter, searchTerm, statusFilter, locationFilter, urgencyFilter, cardLocationFilter]);

  useEffect(() => {
    localStorage.setItem('recruitmentDateFilter', dateFilter);
  }, [dateFilter]);

  const [showHiringProcess, setShowHiringProcess] = useState({});
  const [notification, setNotification] = useState(null);
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [showJobDescriptionModal, setShowJobDescriptionModal] = useState(false);
  const [showSpecialNotesModal, setShowSpecialNotesModal] = useState(false);
  // const [showResumeSubmissionModal, setShowResumeSubmissionModal] = useState(false);
  const [currentFileType, setCurrentFileType] = useState('');
const [expandedCards, setExpandedCards] = useState({});
  const [validationErrors, setValidationErrors] = useState({});
  const [showStepNotesModal, setShowStepNotesModal] = useState(false);
const [selectedAppStepNotes, setSelectedAppStepNotes] = useState(null);
const [isLoading, setIsLoading] = useState(true);
  const {
    showReportColumnModal,
    selectedReportPeriod,
    reportColumns,
    setReportColumns,
    openReportColumnModal,
    closeReportColumnModal,
    toggleReportColumn,
    selectAllColumns,
    deselectAllColumns,
    downloadRolesReportWithColumns,
     selectGroupColumns,      // ADD THIS
  deselectGroupColumns, 
  } = useReportFunctions();

  const [stateSearchQuery, setStateSearchQuery] = useState('');
  const [isStateDropdownOpen, setIsStateDropdownOpen] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState({});
const navigate = useNavigate();
const [viewMode, setViewMode] = useState('grid');
// Add this state near your other state declarations
  const [recruiterStats, setRecruiterStats] = useState({});
  const [showRecruiterStats, setShowRecruiterStats] = useState(false);
  const [showPerformanceReport, setShowPerformanceReport] = useState(false);

  const [showDeleteApplicationModal, setShowDeleteApplicationModal] = useState(false);
  const [applicationToDelete, setApplicationToDelete] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [totalRolesCount, setTotalRolesCount] = useState(0);
  const [totalPagesServer, setTotalPagesServer] = useState(0);
  const [isDataFetching, setIsDataFetching] = useState(false);
  const [dashboardStats, setDashboardStats] = useState({
    totalRoles: 0,
    activeRoles: 0,
    urgentRoles: 0,
    totalApplications: 0
  });

  // NEW: Edit and Delete Modal States
  const [showEditRoleModal, setShowEditRoleModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [roleToEdit, setRoleToEdit] = useState(null);
  const [roleToDelete, setRoleToDelete] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [showLinkedinPreview, setShowLinkedinPreview] = useState(false);
  const [linkedinPreviewText, setLinkedinPreviewText] = useState('');
  const [roleToPromote, setRoleToPromote] = useState(null);
  const [showFacebookOptions, setShowFacebookOptions] = useState(false);
  const [showLinkedinOptions, setShowLinkedinOptions] = useState(false);
  const [linkedinSelectedPlatform, setLinkedinSelectedPlatform] = useState('LinkedIn');

  // Add these state variables
const [showAssignScreeningModal, setShowAssignScreeningModal] = useState(false);
const [screeningAssignmentData, setScreeningAssignmentData] = useState({
  applicationId: null,
  assignedTo: ''
});
const [availableUsers, setAvailableUsers] = useState([]);
const [screeningAssignments, setScreeningAssignments] = useState([]);

// Notification states
const [notifications, setNotifications] = useState([]);
const [notificationCount, setNotificationCount] = useState(0);
const [hasNotifications, setHasNotifications] = useState(false);
const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);

// Location filter states
const [showLocationDropdown, setShowLocationDropdown] = useState(false);
const [selectedLocations, setSelectedLocations] = useState([]);
const [locationSearchTerm, setLocationSearchTerm] = useState('');

  // Resume popup state
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [currentResumeUrl, setCurrentResumeUrl] = useState('');
  const [currentCandidateName, setCurrentCandidateName] = useState('');
  const [resumeLoading, setResumeLoading] = useState(false);
  const [newRole, setNewRole] = useState({
    jobId: '',
    gbamsId: '',
    systemId: 'Auto Generated',
    role: '',
    roleType: 'Full-time',
    country: '',
    state: '',
    city: '',
    currency: 'INR',
    minRate: '',
    maxRate: '',
    client: '',
    clientPOC: '',
    roleLocation: 'Onsite',
    experience: '',
    relevantExperience: '',
    urgency: 'Normal',
    status: 'Active',
    assignTo: '',
    assignedRecruiters: [],
    recruiterLead: null,
    recruiter: null,
    effectiveFrom: new Date().toISOString().split('T')[0],
    startDate: '',
    endDate: '',
    profilesNeeded: 1,
    expensePaid: false,
    specialNotes: '',
    createdBy: 'Manager1',
    jobDescription: '',
    visaTypes: [],
     vendor: '' // ADD THIS LINE
  });


  const visaTypesOptions = [
    "H-1B",
    "L-1",
    "F-1",
    "OPT",
    "CPT",
    "Green Card",
    "Citizen",
    "TN Visa",
    "E-3",
    "O-1",
    "B-1/B-2",
    "J-1",
    "H-4",
    "L-2",
    "Other"
  ];


  const [countries] = useState(countriesData);

  const [states, setStates] = useState([]);
  const [selectedStates, setSelectedStates] = useState([]);
  const [selectedCities, setSelectedCities] = useState([]);
  const [cityInput, setCityInput] = useState('');
  // Add these state variables for location pairs
const [locationPairs, setLocationPairs] = useState([]);
const [newLocation, setNewLocation] = useState({
  city: '',
  state: '',
  country: ''
});

  // ADD: States for the new modal components
  const [showResumeSubmissionModal, setShowResumeSubmissionModal] = useState(false);
  const [showEditApplicationModal, setShowEditApplicationModal] = useState(false);
  const [applicationToEdit, setApplicationToEdit] = useState(null);

  // ✅ KEEP this one - Define at component level
const formatCurrency = (amount, currencyCode) => {
  const symbols = {
    'INR': '₹',
    'USD': '$',
    'CAD': '$',
    'EUR': '€',
    'GBP': '£'
  };
  const symbol = symbols[currencyCode] || currencyCode;
  return `${symbol}${amount?.toLocaleString() || 0}`;
};




// Calculate pagination using server-side metadata
const sortedFilteredRoles = [...filteredRoles].sort((a, b) => {
  if (a.status === 'Cancelled' && b.status !== 'Cancelled') return 1;
  if (a.status !== 'Cancelled' && b.status === 'Cancelled') return -1;
  return 0;
});

const currentRoles = sortedFilteredRoles; // Already sliced by server
const totalPages = totalPagesServer || 1;

  // Pagination functions
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToPage = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };



// Function to send status change notifications
const sendStatusChangeNotification = async (roleId, oldStatus, newStatus, roleData) => {
  try {
    const token = localStorage.getItem('token');
    const currentUsername = localStorage.getItem('username');

    console.log(`📢 Sending status change notification:`, {
      roleId,
      oldStatus,
      newStatus,
      roleName: roleData.role,
      jobId: roleData.jobId
    });

    // Send notification to backend
    const response = await axios.post(
      `${BASE_URL}/api/recruitment/roles/${roleId}/notify-status-change`,
      {
        oldStatus,
        newStatus,
        roleId,
        roleName: roleData.role,
        jobId: roleData.jobId,
        client: roleData.client,
        notifiedBy: currentUsername
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    console.log('✅ Status change notification sent:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Error sending status change notification:', error);
    return false;
  }
};


// Add state for copy modal
// const [showCopyRoleModal, setShowCopyRoleModal] = useState(false);
// const [roleToCopy, setRoleToCopy] = useState(null);
// const [copyRoleData, setCopyRoleData] = useState({
//   assignTo: '',
//   assignedRecruiters: []
// });

// // Add a function to open copy modal
// const openCopyRoleModal = (role, e) => {
//   e.stopPropagation();
//   setRoleToCopy(role);
//   setCopyRoleData({
//     assignTo: role.assignTo || '',
//     assignedRecruiters: []
//   });
//   setShowCopyRoleModal(true);
// };

// // Add a function to close copy modal
// const closeCopyRoleModal = () => {
//   setShowCopyRoleModal(false);
//   setRoleToCopy(null);
//   setCopyRoleData({
//     assignTo: '',
//     assignedRecruiters: []
//   });
// };

// // Add a function to handle copy role
// // Replace your existing handleCopyRole function with this fixed version
// const handleCopyRole = async () => {
//   if (!roleToCopy) return;

//   try {
//     setIsLoading(true);
//     const token = localStorage.getItem('token');
    
//     console.log('🔄 Starting role copy...');
//     console.log('Role to copy:', roleToCopy.id);
//     console.log('Copy data:', copyRoleData);
    
//     const response = await axios.post(
//       `${BASE_URL}/api/recruitment/roles/${roleToCopy.id}/copy`,
//       {
//         assignTo: copyRoleData.assignTo || null,
//         assignedRecruiters: copyRoleData.assignedRecruiters
//       },
//       {
//         headers: { Authorization: `Bearer ${token}` }
//       }
//     );

//     console.log('✅ Role copied successfully:', response.data);
    
//     // Close modal FIRST
//     closeCopyRoleModal();
    
//     // THEN refresh data
//     setIsLoading(true);
//     showNotification('⏳ Refreshing dashboard...', 2000);
    
//     const rolesResponse = await axios.get(`${BASE_URL}/api/recruitment/roles`, {
//       headers: { Authorization: `Bearer ${token}` }
//     });
    
//     setRolesData(rolesResponse.data);
//     filterRoles();
    
//     // Finally show success notification
//     setIsLoading(false);
//     showNotification('✅ Role copied successfully! New role card created.', 3000);
    
//   } catch (error) {
//     console.error('❌ Error copying role:', error);
//     setIsLoading(false);
    
//     // Show error notification
//     const errorMessage = error.response?.data?.message || 'Failed to copy role. Please try again.';
//     showNotification(`❌ ${errorMessage}`, 3000);
    
//     // Keep modal open on error so user can retry
//   }
// };
// // Add a function to render the copy modal
// // Update the renderCopyRoleModal function to better show recruiter selection
// // Replace your renderCopyRoleModal function with this version (EMAIL REMOVED)
// const renderCopyRoleModal = () => {
//   if (!showCopyRoleModal || !roleToCopy) return null;

//   // Get original role's assigned recruiters for reference
//   let originalAssignedRecruiters = [];
//   try {
//     if (roleToCopy.assignedRecruiters) {
//       originalAssignedRecruiters = typeof roleToCopy.assignedRecruiters === 'string'
//         ? JSON.parse(roleToCopy.assignedRecruiters)
//         : roleToCopy.assignedRecruiters;
//     }
//   } catch (error) {
//     console.error('Error parsing original assigned recruiters:', error);
//   }

//   return (
//     <div
//       id="copy-role-modal"
//       className="recruitment-modal"
//       onClick={(e) => {
//         if (e.target.id === 'copy-role-modal') {
//           closeCopyRoleModal();
//         }
//       }}
//     >
//       <div className="recruitment-modal-content" style={{ maxWidth: '700px' }}>
//         <div className="recruitment-modal-header">
//           <h2>Copy Role</h2>
//           <span className="recruitment-close" onClick={closeCopyRoleModal}>&times;</span>
//         </div>
//         <div className="recruitment-modal-body">
//           <div style={{ marginBottom: '20px' }}>
//             <div style={{ 
//               display: 'flex',
//               alignItems: 'center',
//               gap: '10px',
//               marginBottom: '15px',
//               padding: '10px',
//               backgroundColor: '#f8f9fa',
//               borderRadius: '6px'
//             }}>
//               <div style={{ 
//                 width: '40px',
//                 height: '40px',
//                 borderRadius: '50%',
//                 backgroundColor: '#1a6f66ff',
//                 display: 'flex',
//                 alignItems: 'center',
//                 justifyContent: 'center',
//                 color: 'white',
//                 fontWeight: 'bold'
//               }}>
//                 <i className="fas fa-copy"></i>
//               </div>
//               <div style={{ flex: 1 }}>
//                 <h4 style={{ margin: '0 0 5px 0', color: '#1a6f66ff' }}>
//                   {roleToCopy.role}
//                 </h4>
//                 <p style={{ margin: '0', fontSize: '14px', color: '#666' }}>
//                   {roleToCopy.client} • {roleToCopy.jobId || 'No Job ID'}
//                 </p>
//               </div>
//             </div>

//             <div style={{ 
//               padding: '12px',
//               backgroundColor: '#fff3cd',
//               borderRadius: '6px',
//               border: '1px solid #ffeaa7',
//               marginBottom: '15px'
//             }}>
//               <div style={{ 
//                 display: 'flex',
//                 alignItems: 'flex-start',
//                 gap: '8px',
//                 color: '#856404'
//               }}>
//                 <i className="fas fa-info-circle" style={{ marginTop: '2px' }}></i>
//                 <div style={{ fontSize: '14px' }}>
//                   <strong>Creating a new copy of this role.</strong><br />
//                   All details will be copied. You can change the role owner and assign different recruiters.
//                 </div>
//               </div>
//             </div>
//           </div>

//           <div className="recruitment-form-row" style={{ marginBottom: '20px' }}>
//             <div className="recruitment-add-role-form-group">
//               <label>
//                 <i className="fas fa-user-tie" style={{ marginRight: '8px', color: '#1a6f66ff' }}></i>
//                 New Role Owner
//               </label>
//               <select
//                 value={copyRoleData.assignTo}
//                 onChange={(e) => setCopyRoleData(prev => ({
//                   ...prev,
//                   assignTo: e.target.value
//                 }))}
//                 className="recruitment-add-role-select"
//                 style={{ width: '100%' }}
//               >
//                 <option value="">Select Role Owner (optional)</option>
//                 {recruiters
//                   .filter(recruiter =>
//                     recruiter.role === 'user' ||
//                     recruiter.role === 'teamlead' ||
//                     recruiter.role === 'manager' ||
//                     !recruiter.role
//                   )
//                   .map((recruiter, index) => (
//                     <option key={index} value={recruiter.name}>
//                       {recruiter.name}
//                       {recruiter.role && recruiter.role !== 'user' ? ` (${recruiter.role})` : ''}
//                     </option>
//                   ))}
//               </select>
             
//             </div>
//           </div>

//           <div className="recruitment-form-row">
//             <div className="recruitment-add-role-form-group" style={{ width: '100%' }}>
//               <label>
//                 <i className="fas fa-users" style={{ marginRight: '8px', color: '#1a6f66ff' }}></i>
//                 Assign Recruiters to New Role
               
//               </label>
              
//               {/* Original recruiters reference */}
//               {originalAssignedRecruiters.length > 0 && (
//                 <div style={{ 
//                   marginBottom: '10px',
//                   padding: '8px',
//                   backgroundColor: '#f8f9fa',
//                   borderRadius: '4px',
//                   fontSize: '13px'
//                 }}>
//                   <div style={{ color: '#666', marginBottom: '5px' }}>
//                     <i className="fas fa-users" style={{ marginRight: '5px' }}></i>
//                     Original recruiters ({originalAssignedRecruiters.length}):
//                   </div>
//                   <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
//                     {originalAssignedRecruiters.map((recruiter, index) => (
//                       <span
//                         key={index}
//                         style={{
//                           backgroundColor: '#e9ecef',
//                           color: '#495057',
//                           padding: '2px 8px',
//                           borderRadius: '12px',
//                           fontSize: '12px',
//                           display: 'flex',
//                           alignItems: 'center',
//                           gap: '4px'
//                         }}
//                       >
//                         {recruiter.name}
//                         {recruiter.role && recruiter.role !== 'user' && (
//                           <span style={{ 
//                             fontSize: '10px',
//                             backgroundColor: '#6c757d',
//                             color: 'white',
//                             padding: '1px 4px',
//                             borderRadius: '8px'
//                           }}>
//                             {recruiter.role}
//                           </span>
//                         )}
//                       </span>
//                     ))}
//                   </div>
//                 </div>
//               )}

//               {/* Recruiter search and selection */}
//               <div className="assign-to-container">
//                 <input
//                   type="text"
//                   className="recruitment-add-role-input"
//                   placeholder="Search and select recruiters..."
//                   value={recruiterSearchTerm}
//                   onChange={(e) => {
//                     setRecruiterSearchTerm(e.target.value);
//                     if (e.target.value.trim()) {
//                       setShowRecruiterDropdown(true);
//                     }
//                   }}
//                   onFocus={() => setShowRecruiterDropdown(true)}
//                   style={{ width: '100%', marginBottom: '10px' }}
//                 />

//                 {/* Selected recruiters display */}
//                 {copyRoleData.assignedRecruiters.length > 0 && (
//                   <div style={{ marginBottom: '15px' }}>
//                     <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
//                       <i className="fas fa-check-circle" style={{ color: '#28a745', marginRight: '5px' }}></i>
//                       Selected for new role ({copyRoleData.assignedRecruiters.length}):
//                     </div>
//                     <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
//                       {copyRoleData.assignedRecruiters.map(recruiterId => {
//                         const recruiter = recruiters.find(r => r.id === recruiterId);
//                         return recruiter ? (
//                           <div
//                             key={recruiterId}
//                             style={{
//                               backgroundColor: '#1a6f66ff',
//                               color: 'white',
//                               padding: '6px 12px',
//                               borderRadius: '16px',
//                               fontSize: '13px',
//                               display: 'flex',
//                               alignItems: 'center',
//                               gap: '8px',
//                               boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
//                             }}
//                           >
//                             <i className="fas fa-user"></i>
//                             {recruiter.name}
//                             {recruiter.role && recruiter.role !== 'user' && (
//                               <span style={{ 
//                                 fontSize: '11px',
//                                 backgroundColor: 'rgba(255,255,255,0.2)',
//                                 padding: '2px 6px',
//                                 borderRadius: '10px'
//                               }}>
//                                 {recruiter.role}
//                               </span>
//                             )}
//                             <button
//                               type="button"
//                               onClick={() => setCopyRoleData(prev => ({
//                                 ...prev,
//                                 assignedRecruiters: prev.assignedRecruiters.filter(id => id !== recruiterId)
//                               }))}
//                               style={{
//                                 background: 'none',
//                                 border: 'none',
//                                 color: 'white',
//                                 cursor: 'pointer',
//                                 fontSize: '16px',
//                                 padding: '0',
//                                 width: '18px',
//                                 height: '18px',
//                                 display: 'flex',
//                                 alignItems: 'center',
//                                 justifyContent: 'center',
//                                 fontWeight: 'bold',
//                                 lineHeight: '1'
//                               }}
//                               title="Remove recruiter"
//                             >
//                               ×
//                             </button>
//                           </div>
//                         ) : null;
//                       })}
//                     </div>
//                   </div>
//                 )}

//                 {/* Dropdown for recruiter selection */}
//                 {showRecruiterDropdown && (
//                   <div 
//                     className="recruiter-dropdown"
//                     style={{
//                       border: '1px solid #ddd',
//                       borderRadius: '6px',
//                       maxHeight: '300px',
//                       overflowY: 'auto',
//                       backgroundColor: 'white',
//                       zIndex: 1000,
//                       boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
//                       marginTop: '5px'
//                     }}
//                   >
//                     {recruiters
//                       .filter(recruiter => {
//                         const matchesSearch = recruiterSearchTerm
//                           ? recruiter.name.toLowerCase().includes(recruiterSearchTerm.toLowerCase())
//                           : true;
                        
//                         if (userRole === 'manager' || userRole === 'admin') {
//                           return matchesSearch && recruiter.isActive !== false;
//                         }
//                         else if (userRole === 'teamlead') {
//                           return (recruiter.role === 'user' || recruiter.role === 'teamlead') 
//                             && matchesSearch 
//                             && recruiter.isActive !== false;
//                         }
//                         return false;
//                       })
//                       .map((recruiter, index) => (
//                         <div
//                           key={index}
//                           className={`recruiter-option ${copyRoleData.assignedRecruiters.includes(recruiter.id) ? 'selected' : ''}`}
//                           onClick={() => {
//                             if (copyRoleData.assignedRecruiters.includes(recruiter.id)) {
//                               setCopyRoleData(prev => ({
//                                 ...prev,
//                                 assignedRecruiters: prev.assignedRecruiters.filter(id => id !== recruiter.id)
//                               }));
//                             } else {
//                               setCopyRoleData(prev => ({
//                                 ...prev,
//                                 assignedRecruiters: [...prev.assignedRecruiters, recruiter.id]
//                               }));
//                             }
//                           }}
//                           style={{
//                             padding: '12px 15px',
//                             cursor: 'pointer',
//                             borderBottom: '1px solid #f0f0f0',
//                             backgroundColor: copyRoleData.assignedRecruiters.includes(recruiter.id) 
//                               ? '#ebeff1ff' 
//                               : 'transparent',
//                             display: 'flex',
//                             alignItems: 'center',
//                             gap: '12px',
//                             transition: 'background-color 0.2s'
//                           }}
//                           onMouseEnter={(e) => {
//                             if (!copyRoleData.assignedRecruiters.includes(recruiter.id)) {
//                               e.currentTarget.style.backgroundColor = '#f8f9fa';
//                             }
//                           }}
//                           onMouseLeave={(e) => {
//                             if (!copyRoleData.assignedRecruiters.includes(recruiter.id)) {
//                               e.currentTarget.style.backgroundColor = 'transparent';
//                             }
//                           }}
//                         >
//                           <input
//                             type="checkbox"
//                             checked={copyRoleData.assignedRecruiters.includes(recruiter.id)}
//                             readOnly
//                             style={{
//                               margin: '0',
//                               cursor: 'pointer',
//                               width: '16px',
//                               height: '16px',
//                               accentColor: '#1a6f66ff'
//                             }}
//                           />
//                           <div style={{
//                             width: '32px',
//                             height: '32px',
//                             borderRadius: '50%',
//                             backgroundColor: copyRoleData.assignedRecruiters.includes(recruiter.id)
//                               ? '#1a6f66ff'
//                               : '#e9ecef',
//                             display: 'flex',
//                             alignItems: 'center',
//                             justifyContent: 'center',
//                             color: copyRoleData.assignedRecruiters.includes(recruiter.id)
//                               ? 'white'
//                               : '#666',
//                             fontWeight: 'bold',
//                             fontSize: '14px'
//                           }}>
//                             {recruiter.name.charAt(0).toUpperCase()}
//                           </div>
//                           <div style={{ flex: 1 }}>
//                             <div style={{ 
//                               fontWeight: '600', 
//                               color: '#333',
//                               fontSize: '14px'
//                             }}>
//                               {recruiter.name}
//                             </div>
//                             <div style={{ 
//                               fontSize: '12px', 
//                               color: '#666',
//                               display: 'flex',
//                               alignItems: 'center',
//                               gap: '8px',
//                               marginTop: '2px'
//                             }}>
//                               <span style={{
//                                 backgroundColor: recruiter.role === 'teamlead' ? '#ffc107' : 
//                                               recruiter.role === 'manager' ? '#dc3545' : 
//                                               recruiter.role === 'admin' ? '#6f42c1' : '#6c757d',
//                                 color: 'white',
//                                 padding: '2px 8px',
//                                 borderRadius: '10px',
//                                 fontSize: '10px',
//                                 fontWeight: '500'
//                               }}>
//                                 {recruiter.role || 'recruiter'}
//                               </span>
//                             </div>
//                           </div>
//                           {copyRoleData.assignedRecruiters.includes(recruiter.id) && (
//                             <div style={{
//                               color: '#1a6f66ff',
//                               fontSize: '12px',
//                               fontWeight: '600'
//                             }}>
//                               <i className="fas fa-check"></i> Selected
//                             </div>
//                           )}
//                         </div>
//                       ))}
                    
//                     {recruiters.filter(r => {
//                       const matchesSearch = recruiterSearchTerm
//                         ? r.name.toLowerCase().includes(recruiterSearchTerm.toLowerCase())
//                         : true;
//                       return matchesSearch && 
//                         ((userRole === 'manager' || userRole === 'admin') || 
//                          (userRole === 'teamlead' && (r.role === 'user' || r.role === 'teamlead')));
//                     }).length === 0 && (
//                       <div style={{
//                         padding: '20px',
//                         textAlign: 'center',
//                         color: '#999',
//                         fontSize: '14px'
//                       }}>
//                         <i className="fas fa-user-slash" style={{ fontSize: '24px', marginBottom: '10px' }}></i>
//                         <div>No recruiters found</div>
//                       </div>
//                     )}
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>

//           {/* Summary */}
//           <div style={{
//             marginTop: '20px',
//             padding: '15px',
//             backgroundColor: '#f8f9fa',
//             borderRadius: '6px',
//             border: '1px solid #e9ecef'
//           }}>
//             <h5 style={{ margin: '0 0 10px 0', color: '#1a6f66ff' }}>
//               <i className="fas fa-clipboard-check" style={{ marginRight: '8px' }}></i>
//               Copy Summary
//             </h5>
//             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
//               <div>
//                 <strong>Original Role:</strong> {roleToCopy.role}
//               </div>
//               <div>
//                 <strong>New Role Owner:</strong> {copyRoleData.assignTo || roleToCopy.assignTo || 'No change'}
//               </div>
//               <div>
//                 <strong>Original Recruiters:</strong> {originalAssignedRecruiters.length}
//               </div>
//               <div>
//                 <strong>New Recruiters:</strong> {copyRoleData.assignedRecruiters.length}
//               </div>
//               <div>
//                 <strong>Client:</strong> {roleToCopy.client}
//               </div>
//               <div>
//                 <strong>Status:</strong> Active (new copy)
//               </div>
//             </div>
//           </div>

//           <div className="recruitment-form-actions" style={{ marginTop: '20px' }}>
//             <button
//               type="button"
//               className="recruitment-cancel-btn"
//               onClick={closeCopyRoleModal}
//               style={{ padding: '10px 20px' }}
//             >
//               <i className="fas fa-times" style={{ marginRight: '8px' }}></i>
//               Cancel
//             </button>
//             <button
//               type="button"
//               className="recruitment-submit-btn"
//               onClick={handleCopyRole}
//               style={{ 
//                 padding: '10px 20px',
//                 backgroundColor: '#1a6f66ff',
//                 display: 'flex',
//                 alignItems: 'center',
//                 justifyContent: 'center'
//               }}
//             >
//               <i className="fas fa-copy" style={{ marginRight: '8px' }}></i>
//               Create Copy with Selected Recruiters
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// Add these state variables at the top of your component with other useState declarations
const [jdParseContent, setJdParseContent] = useState('');
const [parseStatus, setParseStatus] = useState(null);

// Modified parsing function - fills only empty fields
const handleParseJD = () => {
  parseJDContent(false); // false means don't replace existing data
};


// Main parsing logic
const parseJDContent = (replaceAll = false) => {
  try {
    const content = jdParseContent;
    let parsedFields = {};
    let fieldsUpdated = [];
    let fieldsSkipped = [];

    // Helper function to extract value after a label
    const extractValue = (text, patterns) => {
      for (const pattern of patterns) {
        const regex = new RegExp(pattern, 'i');
        const match = text.match(regex);
        if (match && match[1]) {
          return match[1].trim();
        }
      }
      return null;
    };

    // Helper to check if field should be updated
    const shouldUpdate = (fieldName, currentValue) => {
      if (replaceAll) return true;
      if (!currentValue || currentValue === '' || currentValue.length === 0) return true;
      fieldsSkipped.push(fieldName);
      return false;
    };

    // Parse Request ID / Job ID
    const requestId = extractValue(content, [
      'Request\\s*ID[:\\s]+([^\\n]+)',
        'Request\\s*Number[:\\s]+([^\\n]+)',
      'Job\\s*ID[:\\s]+([^\\n]+)',
      'Req\\s*ID[:\\s]+([^\\n]+)'
    ]);
    if (requestId && !isEditMode && shouldUpdate('Job ID', newRole.jobId)) {
      parsedFields.jobId = requestId.split(/[-\s]/)[0];
      fieldsUpdated.push('Job ID');
    }

    // Parse GBAMS ID
    const gbamsId = extractValue(content, [
      'GBaMS\\s*ReqID[:\\s]+([^\\n]+)',
      'GBAMS\\s*ID[:\\s]+([^\\n]+)',
      'GBaMS\\s*ID[:\\s]+([^\\n]+)'
    ]);
    if (gbamsId && shouldUpdate('GBAMS ID', newRole.gbamsId)) {
      parsedFields.gbamsId = gbamsId;
      fieldsUpdated.push('GBAMS ID');
    }

    // Parse Role Title - improved to handle multiple formats
// Parse Role Title - improved to handle multiple formats
    const role = extractValue(content, [
      'Job\\s*Title[:\\s]+([^\\n]+)',
      'Role[:\\s]+([^\\n]+)',
      'Position[:\\s]+([^\\n]+)'
    ]);
    if (role) {
      // Clean up role title - keep country prefix but remove department prefixes
      let cleanRole = role
        .replace(/^Information Technology_/i, '')
        .trim();
      
      if (cleanRole && shouldUpdate('Role Title', newRole.role)) {
        parsedFields.role = cleanRole;
        fieldsUpdated.push('Role Title');
      }
    }

    // IMPROVED Location Parsing with multiple strategies
    let locationData = null;
    
    // Strategy 1: Look for "Location: ONSITE- City, ST" pattern
    const locationMatch1 = content.match(/Location[:\s]+((?:ONSITE|REMOTE|HYBRID)[:\s\-]*)?([A-Za-z\s]+),\s*([A-Z]{2})(?:\s|$)/i);
    if (locationMatch1) {
      locationData = {
        workMode: locationMatch1[1] || '',
        city: locationMatch1[2].trim(),
        stateCode: locationMatch1[3].trim()
      };
    }
    
    // Strategy 2: Look for any "City, ST" pattern (but skip "US Default")
    if (!locationData) {
      const cityStatePattern = /([A-Za-z\s]+),\s*([A-Z]{2})(?:\s|$)/g;
      let match;
      while ((match = cityStatePattern.exec(content)) !== null) {
        const potentialCity = match[1].trim();
        const potentialState = match[2].trim();
        
        // Skip "US Default" or similar patterns
        if (!potentialCity.match(/^(US|USA|Default)/i) && potentialState.length === 2) {
          locationData = {
            workMode: '',
            city: potentialCity,
            stateCode: potentialState
          };
          break;
        }
      }
    }

    // Process location data if found
    if (locationData) {
      const { workMode, city, stateCode } = locationData;
      
      // Determine work mode
      const workModeUpper = workMode.toUpperCase();
      const contentUpper = content.toUpperCase();
      
      if (workModeUpper.includes('ONSITE') || contentUpper.includes('ONSITE')) {
        if (shouldUpdate('Work Mode', newRole.roleLocation)) {
          parsedFields.roleLocation = 'Onsite';
          fieldsUpdated.push('Work Mode');
        }
      } else if (workModeUpper.includes('REMOTE') || contentUpper.includes('REMOTE')) {
        if (shouldUpdate('Work Mode', newRole.roleLocation)) {
          parsedFields.roleLocation = 'Remote';
          fieldsUpdated.push('Work Mode');
        }
      } else if (workModeUpper.includes('HYBRID') || contentUpper.includes('HYBRID')) {
        if (shouldUpdate('Work Mode', newRole.roleLocation)) {
          parsedFields.roleLocation = 'Hybrid';
          fieldsUpdated.push('Work Mode');
        }
      }

      // Clean up city name - remove work mode keywords
      let cleanCity = city
        .replace(/ONSITE|REMOTE|HYBRID/gi, '')
        .replace(/[-:]/g, '')
        .trim();
      
      // Only update city if it's valid
      if (cleanCity && !cleanCity.match(/^(US|USA|Default)$/i) && cleanCity.length > 1) {
        if (replaceAll || selectedCities.length === 0) {
          setSelectedCities([cleanCity]);
          fieldsUpdated.push('Cities');
        } else {
          fieldsSkipped.push('Cities');
        }
      }
      
      // Enhanced state matching
     // In the parseJDContent function, update the location parsing section:
// Enhanced state matching
const stateAbbrevToFull = {
  'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
  'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia',
  'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
  'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
  'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi',
  'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire',
  'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina',
  'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania',
  'RI': 'Rhode Island', 'SC': 'South Carolina', 'SD': 'South Dakota', 'TN': 'Tennessee',
  'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington',
  'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming'
};

// Convert state code to full name
const stateCodeUpper = stateCode.toUpperCase();
let matchedState = stateAbbrevToFull[stateCodeUpper];

if (matchedState) {
  if (replaceAll || selectedStates.length === 0) {
    setSelectedStates([matchedState]);
    fieldsUpdated.push('States');
  } else {
    fieldsSkipped.push('States');
  }
  
  // Set country to United States when US state is detected AND set currency to USD
  if (shouldUpdate('Country', newRole.country)) {
    const usCountry = countries.find(c => c.name.includes('United States'));
    if (usCountry) {
      parsedFields.country = usCountry.name;
      parsedFields.currency = 'USD'; // Automatically set currency to USD
      fieldsUpdated.push('Country');
      fieldsUpdated.push('Currency (auto-set to USD)');
    }
  }
}
    }

    // Parse Duration
    const duration = extractValue(content, [
      'Duration[:\\s]+([^\\n]+)',
      'Contract\\s*Duration[:\\s]+([^\\n]+)',
      'Contract\\s*Length[:\\s]+([^\\n]+)'
    ]);
    if (duration) {
      const monthsMatch = duration.match(/(\d+)\s*month/i);
      if (monthsMatch && parsedFields.startDate && shouldUpdate('End Date', newRole.endDate)) {
        const months = parseInt(monthsMatch[1]);
        const startDate = new Date(parsedFields.startDate);
        startDate.setMonth(startDate.getMonth() + months);
        parsedFields.endDate = startDate.toISOString().split('T')[0];
        fieldsUpdated.push('End Date (calculated)');
      }
    }

    // Parse Bill Rate / Max Rate
// Parse Bill Rate / Max Rate
const billRate = extractValue(content, [
  'Bill\\s*Rate[:\\s]+[^$]*\\$([\\d,]+)',
  'Rate[:\\s]+[^$]*\\$([\\d,]+)',
  'MAX\\s*CONFIRMED[:\\s]+\\$([\\d,]+)',
  'Max\\s*Rate[:\\s]+\\$([\\d,]+)'
]);
if (billRate) {
  const rate = billRate.replace(/,/g, '');
  
  if (shouldUpdate('Max Rate', newRole.maxRate)) {
    parsedFields.maxRate = rate;
    fieldsUpdated.push('Max Rate');
  }
  
  if (shouldUpdate('Min Rate', newRole.minRate)) {
    parsedFields.minRate = Math.floor(rate * 0.8).toString();
    fieldsUpdated.push('Min Rate (estimated)');
  }
  
  // Auto-set currency to USD when dollar sign is detected
  if (shouldUpdate('Currency', newRole.currency)) {
    parsedFields.currency = 'USD';
    fieldsUpdated.push('Currency (auto-set to USD)');
  }
}

    // Parse Start Date
    const startDate = extractValue(content, [
      'Start\\s*Date[:\\s]+([\\d/\\-]+)',
      'Start/End\\s*Dates[:\\s]+([\\d/\\-]+)',
      'Start[:\\s]+([\\d/\\-]+)'
    ]);
    if (startDate && shouldUpdate('Start Date', newRole.startDate)) {
      const dateMatch = startDate.match(/(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})/);
      if (dateMatch) {
        const [, month, day, year] = dateMatch;
        parsedFields.startDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        fieldsUpdated.push('Start Date');
      }
    }

    // Parse End Date
    const endDate = extractValue(content, [
      'End\\s*Date[:\\s]+([\\d/\\-]+)',
      'Start/End\\s*Dates[:\\s]+[\\d/\\-]+\\s*[-–]\\s*([\\d/\\-]+)',
      'End[:\\s]+([\\d/\\-]+)'
    ]);
    if (endDate && shouldUpdate('End Date', newRole.endDate)) {
      const dateMatch = endDate.match(/(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})/);
      if (dateMatch) {
        const [, month, day, year] = dateMatch;
        parsedFields.endDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        fieldsUpdated.push('End Date');
      }
    }

    // Parse Experience
    const experience = extractValue(content, [
      'Experience\\s*requested[:\\s]+([^\\n]+)',
      'Experience[:\\s]+([^\\n]+)',
      'Years\\s*of\\s*Experience[:\\s]+([^\\n]+)',
      'Experience\\s*Level[:\\s]+([^\\n]+)'
    ]);
    if (experience && shouldUpdate('Experience Level', newRole.experience)) {
      let expValue = experience.replace(/\s*years?\s*/gi, '').trim();
      if (expValue.match(/^\d+\+?$/)) {
        expValue = `${expValue} years`;
      }
      parsedFields.experience = expValue;
      fieldsUpdated.push('Experience Level');
    }

    // Parse Client POC
    const clientPOC = extractValue(content, [
      'MSP\\s*Owner[:\\s]+([^\\n]+)',
      'Client\\s*POC[:\\s]+([^\\n]+)',
      'POC[:\\s]+([^\\n]+)',
      'Contact[:\\s]+([^\\n]+)'
    ]);
    if (clientPOC && shouldUpdate('Client POC', newRole.clientPOC)) {
      parsedFields.clientPOC = clientPOC;
      fieldsUpdated.push('Client POC');
    }

    // Parse Client Name
    const client = extractValue(content, [
      'Client[:\\s]+([^\\n]+)',
      'Company[:\\s]+([^\\n]+)',
      'Employer[:\\s]+([^\\n]+)'
    ]);
    if (client && !client.match(/POC|Owner/i) && shouldUpdate('Client', newRole.client)) {
      parsedFields.client = client;
      fieldsUpdated.push('Client');
    }

    // Extract description section for Job Description - FIXED VERSION
    const descriptionMatch = content.match(/Description:\s*([\s\S]+?)(?=\n-[A-Za-z]|$)/i);
    if (descriptionMatch && shouldUpdate('Job Description', newRole.jobDescription)) {
      let descriptionText = descriptionMatch[1];
      
      // Find the last line that starts with "-" (this is the skills line)
      const lines = descriptionText.split('\n');
      const lastDashIndex = lines.map((line, idx) => line.trim().startsWith('-') ? idx : -1)
                                  .filter(idx => idx !== -1)
                                  .pop();
      
      // If we found a skills line at the end, exclude it from description
      if (lastDashIndex !== undefined && lastDashIndex >= 0) {
        descriptionText = lines.slice(0, lastDashIndex).join('\n');
      }
      
      // Now format the description
      const descLines = descriptionText.split('\n').map(line => line.trim()).filter(line => line);
      
      let bulletPoints = [];
      
      descLines.forEach(line => {
        // Check if line is a bullet point
        if (line.match(/^[•\-\*]\s+/)) {
          const cleanLine = line.replace(/^[•\-\*]\s+/, '').trim();
          if (cleanLine) {
            bulletPoints.push(cleanLine);
          }
        }
      });
      
      // Create formatted HTML
      let formattedDesc = '';
      if (bulletPoints.length > 0) {
        formattedDesc = '<ul>' + bulletPoints.map(item => `<li>${item}</li>`).join('') + '</ul>';
      }
      
      if (formattedDesc) {
        parsedFields.jobDescription = formattedDesc;
        fieldsUpdated.push('Job Description');
      }
    }

    // Special notes parsing removed as requested

    // If replacing all, clear cities and states first
    if (replaceAll) {
      setSelectedCities([]);
      setSelectedStates([]);
    }

    // Update the form with parsed fields
    if (Object.keys(parsedFields).length > 0 || fieldsUpdated.length > 0) {
      setNewRole(prev => ({ ...prev, ...parsedFields }));
      
      let message = `✓ Successfully parsed ${fieldsUpdated.length} field(s)`;
      if (fieldsUpdated.length > 0) {
        message += `: ${fieldsUpdated.slice(0, 5).join(', ')}`;
        if (fieldsUpdated.length > 5) {
          message += ` and ${fieldsUpdated.length - 5} more`;
        }
      }
      if (fieldsSkipped.length > 0 && !replaceAll) {
        message += `. ${fieldsSkipped.length} field(s) skipped (already filled)`;
      }
      
      setParseStatus({
        type: 'success',
        message: message
      });
    } else {
      setParseStatus({
        type: 'warning',
        message: '⚠ No fields could be extracted. Please check the format and try again.'
      });
    }

    // Clear status after 6 seconds
    setTimeout(() => setParseStatus(null), 6000);

  } catch (error) {
    console.error('Error parsing JD:', error);
    setParseStatus({
      type: 'error',
      message: '✗ Error parsing content. Please check the format and try again.'
    });
    setTimeout(() => setParseStatus(null), 6000);
  }
};



  // Get current view from URL - Updated to use localStorage role

  const userRole = localStorage.getItem('role');
  const isManagerView = userRole === 'manager' || userRole === 'admin' || userRole === 'super_admin';
  const isTeamLeadView = userRole === 'teamlead';
  const isRecruiterView = userRole === 'user';

  const openEditRoleModal = (role, e) => {
    e.stopPropagation();
    setRoleToEdit(role);
    setIsEditMode(true);
    // Detect offshore: use roleCategory from DB, fall back to checking if country is India
    const countryIsIndia = ['india', 'in'].includes((role.country || '').trim().toLowerCase());
    const isOffshore = (role.roleCategory || '').trim().toLowerCase() === 'offshore' || countryIsIndia;
    setRoleCategory(isOffshore ? 'Offshore' : 'Onsite');

    // Parse visa types from string to array
    let visaTypesArray = [];
    if (role.visaTypes) {
      if (typeof role.visaTypes === 'string') {
        visaTypesArray = role.visaTypes.split(',').map(item => item.trim()).filter(item => item);
      } else if (Array.isArray(role.visaTypes)) {
        visaTypesArray = role.visaTypes;
      }
    }

    // Parse states and cities from existing role
 // Parse states and cities from existing role
    let statesArray = [];
    let citiesArray = [];

    if (role.state) {
      statesArray = typeof role.state === 'string' ?
        role.state.split(',').map(item => item.trim()).filter(item => item) :
        role.state;
    }

    if (role.city) {
      citiesArray = typeof role.city === 'string' ?
        role.city.split(',').map(item => item.trim()).filter(item => item) :
        role.city;
    }

    // Create location pairs from states and cities - THIS IS THE FIX
   // Create location pairs from states and cities
const pairs = [];
for (let i = 0; i < Math.max(statesArray.length, citiesArray.length); i++) {
  const state = statesArray[i] || '';
  const city = citiesArray[i] || '';
  
  if (city && state) {
    // 🆕 Get abbreviations for display
    const stateCode = getStateCode(getCountryCode(role.country), state);
    const countryCode = getCountryCode(role.country);
    
    pairs.push({
      city: city,
      state: state,
      stateCode: stateCode,
      countryCode: countryCode,
      country: role.country || '',
      displayName: `${city}, ${stateCode}, ${countryCode}`
    });
  }
}
setLocationPairs(pairs);

    // Populate the form with existing role data


    // Populate the form with existing role data
    setNewRole({
      jobId: role.jobId || '',
      gbamsId: role.gbamsId || '',
      systemId: role.systemId || 'AUTO',
      role: role.role || '',
      roleType: role.roleType || '',
      country: role.country || '',
      state: role.state || '',
      city: role.city || '',
      currency: role.currency || 'INR',
      minRate: role.minRate || '',
      maxRate: role.maxRate || '',
      client: role.client || '',
      clientPOC: role.clientPOC || '',
      roleLocation: role.roleLocation || '',
      experience: role.experience || '',
      urgency: role.urgency || 'Normal',
      status: role.status || 'Active',
      assignTo: role.assignTo || '',
      assignedRecruiters: role.assignedRecruiters || [],
      recruiterLead: role.recruiterLead || null,
      recruiter: role.recruiter || null,
      effectiveFrom: role.effectiveFrom ? new Date(role.effectiveFrom).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      startDate: role.startDate ? new Date(role.startDate).toISOString().split('T')[0] : '',
      endDate: role.endDate ? new Date(role.endDate).toISOString().split('T')[0] : '',
      profilesNeeded: role.profilesNeeded || 1,
      expensePaid: role.expensePaid || false,
      specialNotes: role.specialNotes || '',
      createdBy: role.createdBy || 'Manager1',
      jobDescription: role.jobDescription || '',
      visaTypes: visaTypesArray // ADD THIS LINE
    });

    // Set multi-select states and cities
    setSelectedStates(statesArray);
    setSelectedCities(citiesArray);

    // Set country-specific states
    if (role.country) {
      handleCountryChangeForEdit(role.country);
    }

    setShowEditRoleModal(true);
  };
  const [resumeFiles, setResumeFiles] = useState([]);
  const [applicationResumes, setApplicationResumes] = useState({});

  // Add this function to fetch resumes for an application
  const fetchApplicationResumes = async (applicationId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${BASE_URL}/api/recruitment/applications/${applicationId}/resumes`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setApplicationResumes(prev => ({
        ...prev,
        [applicationId]: response.data
      }));
    } catch (error) {
      console.error('Error fetching application resumes:', error);
    }
  };

  const closeEditRoleModal = () => {
    setShowEditRoleModal(false);
    setRoleToEdit(null);
    setIsEditMode(false);

    // Reset form
    setNewRole({
      jobId: '',
      gbamsId: '',
      systemId: 'AUTO',
      role: '',
      roleType: '',
      country: '',
      state: '',
      city: '',
      currency: 'INR',
      rate: '',
      client: '',
      clientPOC: '',
      roleLocation: '',
      experience: '',
      urgency: 'Normal',
      status: 'Active',
      assignTo: '',
      recruiterLead: null,
      recruiter: null,
      effectiveFrom: new Date().toISOString().split('T')[0],
      startDate: '',
      endDate: '',
      profilesNeeded: 1,
      expensePaid: false,
      specialNotes: '',
      createdBy: 'Manager1',
      jobDescription: '',
      visaTypes: [],
        vendor: '' // ADD THIS LINE
    });
  };

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'font': [] }],
      [{ 'align': [] }],
      ['blockquote', 'code-block'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'indent': '-1' }, { 'indent': '+1' }],
      ['link', 'image', 'video'],
      ['clean']
    ],
  };

  const quillFormats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link', 'image', 'video',
    'color', 'background',
    'align',
    'code-block'
  ];

  // Handle rich text editor changes
  const handleRichTextChange = (field, value) => {
    setNewRole(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCountryChangeForEdit = (countryName) => {
    const countryCode = getCountryCode(countryName);
    const countryStates = getStatesForCountry(countryCode);
    setStates(countryStates);
  };



  const [showHiringStepModal, setShowHiringStepModal] = useState(false);
  const [selectedStepData, setSelectedStepData] = useState({
    applicationId: null,
    currentStep: null,
    stepName: '',
    notes: ''
  });
  const [applicationNotes, setApplicationNotes] = useState({});

  // Add this function to open the hiring step modal
const openHiringStepModal = async (application, stepIndex, stepName, e) => {
  if (e) {
    e.stopPropagation();
  }

  try {
    const token = localStorage.getItem('token');
    
    console.log('🔍 Opening modal:', {
      appId: application.id,
      step: stepIndex,
      stepName: stepName
    });
    console.log('📋 Current notes in state:', applicationNotes[application.id]);

    // Get notes from state (already loaded by fetchApplications)
    let existingNotes = applicationNotes[application.id]?.[stepIndex] || '';
    
    console.log('📝 Notes for this step:', existingNotes);

    // If not in state (shouldn't happen, but fallback)
    if (!existingNotes) {
      console.log('⚠️ Notes not in state, fetching from backend...');
      
      try {
        const notesResponse = await axios.get(
          `${BASE_URL}/api/recruitment/applications/${application.id}/step-notes/${stepIndex}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        // This endpoint returns { notes: "...", createdAt: ..., etc }
        if (notesResponse.data && notesResponse.data.notes) {
          existingNotes = notesResponse.data.notes;
          console.log('✅ Fetched notes from backend:', existingNotes);
        }
      } catch (error) {
        console.error('❌ Error fetching step notes:', error);
      }
    }

    setSelectedStepData({
      applicationId: application.id,
      currentStep: stepIndex,
      stepName: stepName,
      notes: existingNotes
    });
    
    setShowHiringStepModal(true);

  } catch (error) {
    console.error('❌ Error in openHiringStepModal:', error);
    setSelectedStepData({
      applicationId: application.id,
      currentStep: stepIndex,
      stepName: stepName,
      notes: ''
    });
    setShowHiringStepModal(true);
  }
};
  // Add this function to close the hiring step modal
  const closeHiringStepModal = () => {
    setShowHiringStepModal(false);
    setSelectedStepData({
      applicationId: null,
      currentStep: null,
      stepName: '',
      notes: ''
    });
  };

  // Add this function to fetch all notes when loading applications
const fetchApplicationStepNotes = async (applicationId) => {
  try {
    const token = localStorage.getItem('token');
    console.log(`📋 Fetching notes for application ${applicationId}`);
    
    const response = await axios.get(
      `${BASE_URL}/api/recruitment/applications/${applicationId}/step-notes`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log(`📦 Raw API response for app ${applicationId}:`, response.data);

    if (response.data && response.data.notes) {
      const notesData = response.data.notes;
      const assignmentsData = response.data.assignments || {};
      
      console.log(`✅ Extracted notes for app ${applicationId}:`, notesData);
      console.log(`✅ Extracted assignments for app ${applicationId}:`, assignmentsData);
      
      // Store the notes in state
      setApplicationNotes(prev => ({
        ...prev,
        [applicationId]: notesData
      }));
      
      // CRITICAL FIX: If there's a screening assignment, add/update it in screeningAssignments state
      if (assignmentsData.screeningAssignedTo) {
        console.log(`🎯 Found screening assignment for app ${applicationId}:`, assignmentsData.screeningAssignedTo);
        
        setScreeningAssignments(prev => {
          // Remove any existing assignment for this application
          const filtered = prev.filter(a => a.applicationId !== applicationId);
          
          // Add the new/updated assignment
          return [...filtered, {
            applicationId: applicationId,
            assignedTo: assignmentsData.screeningAssignedTo,
            assignedBy: assignmentsData.screeningAssignedBy,
            assignedAt: assignmentsData.screeningAssignedAt
          }];
        });
        
        console.log(`✅ Updated screening assignments state for app ${applicationId}`);
      }
      
      return notesData;
    } else {
      console.log(`⚠️ No notes found for app ${applicationId}`);
      return {};
    }
    
  } catch (error) {
    console.error(`❌ Error fetching notes for app ${applicationId}:`, error);
    console.error('Error details:', error.response?.data);
    return {};
  }
};

  // Add this function to save step notes and update step
// Modify your handleSaveStepWithNotes function or add this check
// Find where you save step notes and add this check:

const handleSaveStepWithNotes = async () => {
  if (!selectedStepData.applicationId || selectedStepData.currentStep === null) return;

  try {
    const token = localStorage.getItem('token');
    
    console.log('💾 Saving notes:', {
      appId: selectedStepData.applicationId,
      step: selectedStepData.currentStep,
      notes: selectedStepData.notes
    });

    // CRITICAL: Update local state IMMEDIATELY (optimistic update)
    setApplicationNotes(prev => {
      const updated = {
        ...prev,
        [selectedStepData.applicationId]: {
          ...prev[selectedStepData.applicationId],
          [selectedStepData.currentStep]: selectedStepData.notes || ''
        }
      };
      console.log('✅ Updated notes state:', updated);
      return updated;
    });

    // Then save to backend
    await updateApplicationStepWithNotes(
      selectedStepData.applicationId,
      selectedStepData.currentStep,
      selectedRole.id,
      selectedStepData.notes,
      selectedStepData.stepName
    );

    // ✅ NEW: Check if this step is "Hired" and show option to go to onboarding
    if (selectedStepData.stepName === 'Hired') {
      // Find the application data
      const appData = applicationsData[selectedRole.id]?.find(
        app => app.id === selectedStepData.applicationId
      );
      
      if (appData) {
        // You could show a notification with option to navigate
        showNotification(
          `✅ Candidate HIRED! Click to go to onboarding`, 
          5000
        );
        
        // Optional: Automatically navigate after a short delay
        // setTimeout(() => {
        //   goToCandidateOnboarding(appData, new Event('click'));
        // }, 2000);
      }
    }

    closeHiringStepModal();
    showNotification(`Step updated to ${selectedStepData.stepName} with notes saved`);

  } catch (error) {
    console.error('❌ Error updating step with notes:', error);
    showNotification('Failed to update step');
    
    // Revert optimistic update on error
    setApplicationNotes(prev => {
      const updated = { ...prev };
      if (updated[selectedStepData.applicationId]) {
        delete updated[selectedStepData.applicationId][selectedStepData.currentStep];
      }
      return updated;
    });
  }
};
useEffect(() => {
  const loadRoleData = async () => {
    if (selectedRole && selectedRole.id) {
      console.log('🔄 Loading data for role:', selectedRole.id);
      await fetchApplications(selectedRole.id);
    }
  };
  
  loadRoleData();
}, [selectedRole?.id]);


// Add this useEffect to reset custom dates when switching away from custom filter
useEffect(() => {
  if (dateFilter !== 'custom') {
    setCustomStartDate('');
    setCustomEndDate('');
    setShowCustomDateRange(false);
  }
}, [dateFilter]);

// ✅ Smart auto-refresh - only updates changed data
useEffect(() => {
  if (!userRole) return;

  console.log(`🔄 Starting smart auto-refresh for ${userRole} dashboard`);
  const POLL_INTERVAL = 30000; // 30 seconds

  const pollInterval = setInterval(async () => {
    try {
      console.log(`📡 Checking for updates (${userRole})...`);
      
      const token = localStorage.getItem('token');
      
      // Fetch new data WITHOUT triggering loading state
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        searchTerm: searchTerm,
        status: statusFilter,
        urgency: urgencyFilter,
        locations: locationFilter, // Changed to 'locations' to match backend
        cardLocation: cardLocationFilter !== 'All' ? cardLocationFilter : undefined,
        days: dateFilter === 'today' ? 1 : 
              dateFilter === 'yesterday' ? 2 : 
              dateFilter === 'this-week' ? 7 : 
              dateFilter === 'last-week' ? 14 :
              dateFilter === 'this-month' ? 30 : 
              dateFilter === 'last-month' ? 60 : null
      };

      // Fetch current page data and stats smoothly
      const rolesResponse = await axios.get(`${BASE_URL}/api/recruitment/roles`, {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const responseData = rolesResponse.data;
      
      // Update stats and page data if something changed
      if (responseData.stats) setDashboardStats(responseData.stats);
      
      const newRolesData = responseData.data || responseData.roles || responseData;
      
      // Compare with current data - only update if there are actual changes
      if (JSON.stringify(newRolesData) !== JSON.stringify(rolesData)) {
        console.log('✅ New data detected, updating dashboard...');
        
        // Check if there are NEW roles (not just updates to existing ones)
        const currentRoleIds = rolesData.map(r => r.id);
        const newRoleIds = newRolesData.map(r => r.id);
        const addedRoles = newRoleIds.filter(id => !currentRoleIds.includes(id));
        
        if (addedRoles.length > 0) {
          // Show notification for new roles
          showNotification(`${addedRoles.length} new role(s) assigned to you!`);
        }
        
        // Update data smoothly without full reload
        setRolesData(newRolesData);
        
        // filterRoles() will automatically run due to useEffect dependency
      } else {
        console.log('ℹ️ No changes detected');
      }
      
      // Also check for new screening assignments
      const screeningResponse = await axios.get(
        `${BASE_URL}/api/recruitment/applications/screening-assignments`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const newAssignments = screeningResponse.data.assignedApplications || [];
      
      if (JSON.stringify(newAssignments) !== JSON.stringify(screeningAssignments)) {
        console.log('✅ New screening assignments detected');
        
        const addedAssignments = newAssignments.filter(
          newA => !screeningAssignments.some(oldA => oldA.applicationId === newA.applicationId)
        );
        
        if (addedAssignments.length > 0) {
          showNotification(`${addedAssignments.length} new screening task(s) assigned!`);
        }
        
        setScreeningAssignments(newAssignments);
      }
      
    } catch (error) {
      console.error('❌ Auto-refresh failed:', error);
      // Don't show error to user - silent failure
    }
  }, POLL_INTERVAL);

  return () => {
    console.log('🛑 Stopping auto-refresh polling');
    clearInterval(pollInterval);
  };
}, [userRole, rolesData, screeningAssignments, currentPage, itemsPerPage, searchTerm, statusFilter, urgencyFilter, dateFilter, locationFilter, cardLocationFilter]); // Add all filter dependencies

// Also refresh when user comes back to the tab
useEffect(() => {
  const handleVisibilityChange = async () => {
    if (!document.hidden && userRole) {
      console.log(`👁️ Tab became visible, checking for updates...`);
      
      try {
        const token = localStorage.getItem('token');
        
        const params = {
          page: currentPage,
          limit: itemsPerPage,
          searchTerm: searchTerm,
          status: statusFilter,
          urgency: urgencyFilter,
          locations: locationFilter,
          cardLocation: cardLocationFilter !== 'All' ? cardLocationFilter : undefined,
          days: dateFilter === 'today' ? 1 : 
                dateFilter === 'yesterday' ? 2 : 
                dateFilter === 'this-week' ? 7 : 
                dateFilter === 'last-week' ? 14 :
                dateFilter === 'this-month' ? 30 : 
                dateFilter === 'last-month' ? 60 : null
        };
        
        // Fetch latest data
        const rolesResponse = await axios.get(`${BASE_URL}/api/recruitment/roles`, {
          params,
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const newRolesData = rolesResponse.data.data || rolesResponse.data.roles || rolesResponse.data;
        
        // Only update if data changed
        if (JSON.stringify(newRolesData) !== JSON.stringify(rolesData)) {
          setRolesData(newRolesData);
          showNotification('Dashboard updated with latest data');
        }
        
        // Check screening assignments
        const screeningResponse = await axios.get(
          `${BASE_URL}/api/recruitment/applications/screening-assignments`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        const newAssignments = screeningResponse.data.assignedApplications || [];
        if (JSON.stringify(newAssignments) !== JSON.stringify(screeningAssignments)) {
          setScreeningAssignments(newAssignments);
        }
        
      } catch (error) {
        console.error('Error refreshing on visibility change:', error);
      }
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}, [userRole, rolesData, screeningAssignments]);

  // Add this function near your updateApplicationStep function
  const updateApplicationStepWithNotes = async (applicationId, newStepIndex, roleId, notes, stepName) => {
    try {
      const token = localStorage.getItem('token');

      // Use hiringSteps from state or default steps
      const stepsToUse = hiringSteps && hiringSteps.length > 0 ? hiringSteps : [
        { stepName: 'Applied', stepOrder: 0 },
        { stepName: 'Screening', stepOrder: 1 },
        { stepName: 'Technical Interview', stepOrder: 2 },
        { stepName: 'Manager Interview', stepOrder: 3 },
        { stepName: 'HR Interview', stepOrder: 4 },
        { stepName: 'Offer Extended', stepOrder: 5 },
        { stepName: 'Hired', stepOrder: 6 },
        { stepName: 'Rejected', stepOrder: 7 }
      ];

      // Determine new status based on step
      let newStatus = 'In Progress';
      const newStepName = stepsToUse[newStepIndex]?.stepName || stepName;

      if (newStepName === 'Rejected') {
        newStatus = 'Rejected';
      } else if (newStepName === 'Offer Extended') {
        newStatus = 'Offer Extended';
      } else if (newStepName === 'Hired') {
        newStatus = 'Hired';
      }

      // Update application status with notes
      const response = await axios.put(
        `${BASE_URL}/api/recruitment/applications/${applicationId}/status`,
        {
          currentStep: newStepIndex,
          status: newStatus,
          notes: notes || '',
          stepName: newStepName
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update local state for notes
      setApplicationNotes(prev => ({
        ...prev,
        [applicationId]: {
          ...prev[applicationId],
          [newStepIndex]: notes || ''
        }
      }));

      // Refresh applications data
      await fetchApplications(roleId);
      showNotification(`Step updated to ${newStepName} with notes saved`);

    } catch (error) {
      console.error('Error updating application step with notes:', error);
      showNotification('Failed to update application step');
      throw error; // Re-throw to handle in calling function
    }
  };



// Add this function to open assign screening modal
const openAssignScreeningModal = (application, e) => {
  if (e) e.stopPropagation();
  
  setScreeningAssignmentData({
    applicationId: application.id,
    assignedTo: ''
  });
  setShowAssignScreeningModal(true);
  
  // Fetch available users for assignment
  fetchAvailableUsers();
};

useEffect(() => {
  const loadInitialData = async () => {
    if (userRole === 'user' || userRole === 'teamlead' || userRole === 'manager') {
      console.log('📋 Loading screening assignments on mount for user role:', userRole);
      const assignments = await fetchScreeningAssignments();
      console.log('📋 Initial assignments loaded:', assignments.length);
    }
  };
  
  loadInitialData();
}, [userRole]);





 // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, locationFilter, urgencyFilter, dateFilter]);

  // Render pagination controls
  const renderPagination = () => {
    if (sortedFilteredRoles.length === 0) return null;

    const startIndex = (currentPage - 1) * itemsPerPage + 1;
    const endIndex = Math.min(currentPage * itemsPerPage, sortedFilteredRoles.length);
    
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

    return (
      <div className="recruitment-pagination" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '20px',
        padding: '10px 0',
        borderTop: '1px solid #eee',
        flexWrap: 'wrap',
        gap: '15px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ fontSize: '14px', color: '#666' }}>
            Showing {startIndex}-{endIndex} of {sortedFilteredRoles.length}
          </span>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="recruitment-per-page-select"
            style={{
              padding: '6px 12px',
              borderRadius: '4px',
              border: '1px solid #ddd',
              fontSize: '14px',
              outline: 'none',
              backgroundColor: 'white',
              cursor: 'pointer'
            }}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={15}>15</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <button
            onClick={goToPreviousPage}
            disabled={currentPage === 1}
            className={`pagination-btn ${currentPage === 1 ? 'disabled' : ''}`}
            style={{
              padding: '8px 16px',
              border: '1px solid #ddd',
              backgroundColor: currentPage === 1 ? '#f5f5f5' : 'white',
              color: currentPage === 1 ? '#999' : '#1a6f66ff',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              borderRadius: '4px',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: '500'
            }}
          >
            <ChevronLeft size={16} /> Prev
          </button>

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
                  fontSize: '14px',
                  minWidth: '40px'
                }}
              >
                1
              </button>
              {startPage > 2 && <span style={{ padding: '0 5px', color: '#666' }}>...</span>}
            </>
          )}

          {pageNumbers.map(pageNumber => (
            <button
              key={pageNumber}
              onClick={() => goToPage(pageNumber)}
              style={{
                padding: '8px 12px',
                border: `1px solid ${currentPage === pageNumber ? '#1a6f66ff' : '#ddd'}`,
                backgroundColor: currentPage === pageNumber ? '#1a6f66ff' : 'white',
                color: currentPage === pageNumber ? 'white' : '#333',
                cursor: 'pointer',
                borderRadius: '4px',
                fontSize: '14px',
                minWidth: '40px',
                fontWeight: currentPage === pageNumber ? 'bold' : 'normal',
                transition: 'all 0.2s ease'
              }}
            >
              {pageNumber}
            </button>
          ))}

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
                  fontSize: '14px',
                  minWidth: '40px'
                }}
              >
                {totalPages}
              </button>
            </>
          )}

          <button
            onClick={goToNextPage}
            disabled={currentPage === totalPages || totalPages === 0}
            className={`pagination-btn ${currentPage === totalPages || totalPages === 0 ? 'disabled' : ''}`}
            style={{
              padding: '8px 16px',
              border: '1px solid #ddd',
              backgroundColor: (currentPage === totalPages || totalPages === 0) ? '#f5f5f5' : 'white',
              color: (currentPage === totalPages || totalPages === 0) ? '#999' : '#1a6f66ff',
              cursor: (currentPage === totalPages || totalPages === 0) ? 'not-allowed' : 'pointer',
              borderRadius: '4px',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: '500'
            }}
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      </div>
    );
  };


// Add this function to fetch roles data
const fetchRoles = async () => {
  await fetchData(false);
};

// Update the fetchAvailableUsers function
const fetchAvailableUsers = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(
      `${BASE_URL}/api/recruitment/applications/users/available`, // Fixed endpoint
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    setAvailableUsers(response.data);
  } catch (error) {
    console.error('Error fetching users:', error);
    showNotification('Failed to load available users');
  }
};

// Add this function to assign screening
// Update the handleAssignScreening function
const handleAssignScreening = async () => {
  try {
    console.log('🔄 Attempting to assign screening with data:', screeningAssignmentData);
    
    const token = localStorage.getItem('token');
    
    const response = await axios.post(
      `${BASE_URL}/api/recruitment/applications/assign-screening`,
      screeningAssignmentData,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log('✅ Assignment response:', response.data);
    
    setShowAssignScreeningModal(false);
    showNotification(`Screening task assigned to ${response.data.assignedTo} successfully!`);
    
    // Refresh applications data for the current role
    if (selectedRole) {
      await fetchApplications(selectedRole.id);
    }
    
    // CRITICAL: First refresh screening assignments for current user
    await fetchScreeningAssignments();
    
    // CRITICAL: Then refresh roles data so assigned user will see the role
    await fetchRoles(); // This will now work
    
    console.log('✅ All data refreshed after assignment');
    
  } catch (error) {
    console.error('❌ Error assigning screening:', error);
    console.error('Error response:', error.response?.data);
    showNotification(error.response?.data?.message || 'Failed to assign screening task');
  }
};
// Add this function to fetch screening assignments
const fetchScreeningAssignments = async () => {
  try {
    const token = localStorage.getItem('token');
    const currentUsername = localStorage.getItem('username');
    
    console.log('=== FETCHING SCREENING ASSIGNMENTS ===');
    console.log('Current user:', currentUsername);
    
    const response = await axios.get(
      `${BASE_URL}/api/recruitment/applications/screening-assignments`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    console.log('=== SCREENING ASSIGNMENTS DEBUG ===');
    console.log('Current logged-in user:', currentUsername);
    console.log('Full API Response:', response.data);
    console.log('Assigned applications:', response.data.assignedApplications);
    
    // Log each assignment in detail
    if (response.data.assignedApplications && response.data.assignedApplications.length > 0) {
      console.log(`✅ Found ${response.data.assignedApplications.length} screening assignments`);
      response.data.assignedApplications.forEach((assignment, index) => {
        console.log(`📌 Assignment ${index + 1}:`, {
          applicationId: assignment.applicationId,
          roleId: assignment.roleId,
          roleName: assignment.roleName,
          assignedTo: assignment.assignedTo,
          candidateName: assignment.candidateName,
          isForCurrentUser: normalizeUsername(assignment.assignedTo) === normalizeUsername(currentUsername)
        });
      });
    } else {
      console.log('⚠️ No screening assignments found in response');
    }
    console.log('=== END DEBUG ===');
    
    const assignments = response.data.assignedApplications || [];
    setScreeningAssignments(assignments);
    
    // Return assignments so they can be used immediately
    return assignments;
    
  } catch (error) {
    console.error('❌ Error fetching screening assignments:', error);
    console.error('Error details:', error.response?.data);
    setScreeningAssignments([]);
    return [];
  }
};

// 3. Update the useEffect for initial load
useEffect(() => {
  const loadInitialData = async () => {
    if (userRole === 'user' || userRole === 'teamlead' || userRole === 'manager') {
      console.log('📋 Loading screening assignments on mount for user role:', userRole);
      const assignments = await fetchScreeningAssignments();
      console.log('📋 Initial assignments loaded:', assignments.length);
    }
  };
  
  loadInitialData();
}, [userRole]);

// 4. CRITICAL: Add useEffect to refetch roles when screening assignments change
useEffect(() => {
  console.log('🔄 Screening assignments state changed, count:', screeningAssignments.length);
  
  // If we have screening assignments, ensure roles are filtered
  if (screeningAssignments.length > 0 && rolesData.length > 0) {
    console.log('🔄 Re-filtering roles because screening assignments changed');
    filterRoles();
  }
}, [screeningAssignments]);

// 5. CRITICAL: Add useEffect to filter when rolesData loads/changes
useEffect(() => {
  console.log('🔄 Roles data changed, count:', rolesData.length);
  
  if (rolesData.length > 0) {
    console.log('🔄 Filtering roles because rolesData changed');
    filterRoles();
  }
}, [rolesData]);

// Add this function to complete screening
const handleCompleteScreening = async (applicationId) => {
  // Show a prompt for notes
  const notes = prompt('Please add notes about the screening:');
  
  if (notes === null) {
    // User cancelled
    return;
  }

  try {
    const token = localStorage.getItem('token');
    
    await axios.post(
      `${BASE_URL}/api/recruitment/applications/complete-screening`,
      { applicationId, notes },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    showNotification('Screening completed successfully!');
    
    // Refresh screening assignments
    await fetchScreeningAssignments();
    
    // Refresh applications data if we're viewing a role
    if (selectedRole) {
      await fetchApplications(selectedRole.id);
    }
    
  } catch (error) {
    console.error('Error completing screening:', error);
    showNotification('Failed to complete screening');
  }
};

// Add this useEffect to fetch assignments when component mounts
useEffect(() => {
  if (userRole === 'user' || userRole === 'teamlead' || userRole === 'manager') {
    fetchScreeningAssignments();
  }
}, [userRole]);



// Add this modal to your render method
const renderAssignScreeningModal = () => {
  if (!showAssignScreeningModal) return null;
  
  return (
    <div
      id="assign-screening-modal"
      className="recruitment-modal"
      style={{ zIndex: 10001 }} // Add higher z-index
      onClick={(e) => {
        if (e.target.id === 'assign-screening-modal') {
          setShowAssignScreeningModal(false);
        }
      }}
    >
      <div 
        className="recruitment-modal-content" 
        style={{ 
          maxWidth: '500px',
          zIndex: 10002 // Ensure content is also on top
        }}
      >
        <div className="recruitment-modal-header">
          <h2>Assign Screening Task</h2>
          <span 
            className="recruitment-close" 
            onClick={() => setShowAssignScreeningModal(false)}
          >
            &times;
          </span>
        </div>
        <div className="recruitment-modal-body">
          <div className="recruitment-form-group">
            <label>Assign To</label>
            <select
              value={screeningAssignmentData.assignedTo}
              onChange={(e) => setScreeningAssignmentData(prev => ({
                ...prev,
                assignedTo: e.target.value
              }))}
              className="recruitment-add-role-select"
              style={{ width: '100%', padding: '10px', fontSize: '14px' }}
            >
              <option value="">Select User</option>
              {availableUsers && availableUsers.length > 0 ? (
                availableUsers.map((user, index) => (
                  <option key={index} value={user.username}>
                    {user.name} ({user.role})
                  </option>
                ))
              ) : (
                <option value="" disabled>Loading users...</option>
              )}
            </select>
          </div>
          
          {availableUsers.length === 0 && (
            <div style={{ 
              padding: '10px', 
              backgroundColor: '#fff3cd', 
              border: '1px solid #ffc107',
              borderRadius: '4px',
              marginTop: '10px',
              fontSize: '14px'
            }}>
              No users available for assignment
            </div>
          )}
          
          <div className="recruitment-form-actions" style={{ marginTop: '20px' }}>
            <button
              type="button"
              className="recruitment-cancel-btn"
              onClick={() => setShowAssignScreeningModal(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="recruitment-submit-btn"
              onClick={handleAssignScreening}
              disabled={!screeningAssignmentData.assignedTo}
            >
              Assign Screening
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Add this function to navigate to candidate onboarding
const goToCandidateOnboarding = (application, e) => {
  e.stopPropagation(); // Prevent triggering parent click events
  
  // Get the candidate's email from the application
  const candidateEmail = application.email;
  
  if (!candidateEmail) {
    showNotification('Candidate email not found');
    return;
  }
  
  // Store the candidate email in localStorage to help with navigation
  localStorage.setItem('onboardingCandidateEmail', candidateEmail);
  
  // Navigate to the candidate onboarding page
  // The exact route depends on your routing setup
  navigate('/candidate-onboarding', { 
    state: { 
      candidateEmail: candidateEmail,
      applicationData: application,
      fromRecruitment: true 
    } 
  });
  
  showNotification(`Navigating to ${application.name}'s onboarding page...`);
};

const openStepNotesPopup = async (app, e) => {
  e.stopPropagation();
  
  console.log('🔍 Opening step notes for application:', app.id);
  console.log('📋 Current screening assignments before fetch:', screeningAssignments);
  
  // CRITICAL: Fetch fresh notes which will also update screening assignments
  await fetchApplicationStepNotes(app.id);
  
  // Small delay to ensure state is updated
  setTimeout(() => {
    console.log('📋 Current screening assignments after fetch:', screeningAssignments);
    
    // Find screening assignment for this application
    const assignment = screeningAssignments.find(
      a => a.applicationId === app.id
    );
    console.log('🎯 Found assignment for this app:', assignment);
    
    setSelectedAppStepNotes(app);
    setShowStepNotesModal(true);
  }, 100);
};
// Function to close step notes popup
const closeStepNotesPopup = () => {
  setShowStepNotesModal(false);
  setSelectedAppStepNotes(null);
};

// Render the step notes modal
const renderStepNotesModal = () => {
  if (!showStepNotesModal || !selectedAppStepNotes) return null;

  const stepsToUse = hiringSteps && hiringSteps.length > 0 ? hiringSteps : [
    { stepName: 'Applied', stepOrder: 0 },
    { stepName: 'Screening', stepOrder: 1 },
    { stepName: 'Technical Interview', stepOrder: 2 },
    { stepName: 'Manager Interview', stepOrder: 3 },
    { stepName: 'HR Interview', stepOrder: 4 },
    { stepName: 'Offer Extended', stepOrder: 5 },
    { stepName: 'Hired', stepOrder: 6 },
    { stepName: 'Rejected', stepOrder: 7 }
  ];

  console.log('🎨 Rendering modal for app:', selectedAppStepNotes.id);
  console.log('📊 Current step:', selectedAppStepNotes.currentStep);
  console.log('📋 All screening assignments:', screeningAssignments);

  return (
    <div
      id="step-notes-modal"
      className="recruitment-modal"
      onClick={(e) => {
        if (e.target.id === 'step-notes-modal') {
          closeStepNotesPopup();
        }
      }}
    >
      <div className="recruitment-modal-content" style={{ 
        maxWidth: '700px',
        maxHeight: '90vh',
        width: '95%'
      }}>
        <div className="recruitment-modal-header" style={{
          borderBottom: '1px solid #e9ecef',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ 
            margin: 0, 
            fontSize: '16px',
            fontWeight: '600',
            lineHeight: '1'
          }}>
            All Step Notes - {selectedAppStepNotes.name}
          </h3>
          <span 
            className="recruitment-close" 
            onClick={closeStepNotesPopup}
            style={{
              fontSize: '28px',
              fontWeight: 'bold',
              cursor: 'pointer',
              lineHeight: '1',
              padding: '0',
              margin: '0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '24px',
              height: '24px'
            }}
          >
            &times;
          </span>
        </div>
        
        <div className="recruitment-modal-body" style={{ 
          padding: '20px',
          overflowY: 'auto',
          maxHeight: 'calc(70vh - 60px)'
        }}>
          <div className="step-notes-container" style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            {stepsToUse.map((step, index) => {
              const stepNote = applicationNotes[selectedAppStepNotes.id]?.[index];
              const isCurrentStep = (selectedAppStepNotes.currentStep || 0) === index;
              const isCompleted = (selectedAppStepNotes.currentStep || 0) > index;
              
              // Check if this is the screening step (index 1 or stepName includes 'Screening')
              const isScreeningStep = index === 1 || 
                                     step.stepName.toLowerCase().includes('screening') ||
                                     step.stepName === 'Resume Screening';
              
              let screeningInfo = null;
              
              if (isScreeningStep) {
                console.log(`🔍 Checking screening for step ${index}:`, step.stepName);
                
                // Find screening assignment for this application
                const assignment = screeningAssignments.find(
                  a => a.applicationId === selectedAppStepNotes.id
                );
                
                console.log('🎯 Assignment found:', assignment);
                
                if (assignment) {
                  if (isCompleted) {
                    // Screening is completed - show "Screened by"
                    screeningInfo = {
                      label: 'Screened by',
                      name: assignment.assignedTo,
                      color: '#28a745' // Green
                    };
                  } else if (isCurrentStep || !isCompleted) {
                    // Screening is assigned but not completed - show "Assigned to"
                    screeningInfo = {
                      label: 'Assigned to',
                      name: assignment.assignedTo,
                      color: '#ffc107' // Yellow/Warning
                    };
                  }
                  
                  console.log('✅ Screening info to display:', screeningInfo);
                } else {
                  console.log('⚠️ No assignment found for application:', selectedAppStepNotes.id);
                }
              }
              
              return (
                <div 
                  key={index}
                  style={{
                    padding: '10px 12px',
                    border: '1px solid #e9ecef',
                    borderRadius: '6px',
                    backgroundColor: isCurrentStep ? '#f8f9fa' : 'white',
                    borderLeft: `3px solid ${
                      isCurrentStep ? '#1a6f66ff' : 
                      isCompleted ? '#1a6f66ff' : '#dee2e6'
                    }`
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: (stepNote || screeningInfo) ? '6px' : '0'
                  }}>
                    <div style={{ 
                      fontSize: '13px', 
                      fontWeight: '600',
                      color: isCurrentStep ? '#1a6f66ff' : 
                             isCompleted ? '#1a6f66ff' : '#6c757d',
                      flex: 1
                    }}>
                      {step.stepName}
                      
                      {/* Show screening assignment info */}
                      {screeningInfo && (
                        <div style={{
                          fontSize: '11px',
                          color: screeningInfo.color,
                          fontWeight: '500',
                          marginTop: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <span>{screeningInfo.label}:</span>
                          <span style={{ fontWeight: '600' }}>{screeningInfo.name}</span>
                        </div>
                      )}
                    </div>
                    
                    <div style={{
                      fontSize: '11px',
                      color: isCurrentStep ? '#1a6f66ff' : 
                             isCompleted ? '#1a6f66ff' : '#6c757d',
                      fontWeight: '500',
                      marginLeft: '10px'
                    }}>
                      {isCurrentStep ? 'Current' : 
                       isCompleted ? 'Completed' : 'Pending'}
                    </div>
                  </div>
                  
                  {/* Step Notes */}
                  {stepNote && (
                    <div style={{
                      fontSize: '12px',
                      color: '#302f2fff',
                      lineHeight: '1.4',
                      whiteSpace: 'pre-wrap',
                      backgroundColor: 'white',
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid #f1f3f4',
                      marginTop: screeningInfo ? '6px' : '0'
                    }}>
                      {stepNote}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Close Button */}
          <div style={{ 
            marginTop: '20px', 
            textAlign: 'right'
          }}>
            <button
              onClick={closeStepNotesPopup}
              style={{
                padding: '8px 20px',
                backgroundColor: '#1a6f66ff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500'
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Add this function near your other helper functions
const isInIndiaNightShift = (dateString) => {
  if (!dateString) return false;
  
  try {
    const inputDate = new Date(dateString);
    
    // Convert input date to India time (IST)
    const inputDateIST = new Date(inputDate.toLocaleString("en-US", { 
      timeZone: "Asia/Kolkata" 
    }));
    
    // Get current time in India time
    const nowIST = new Date().toLocaleString("en-US", { 
      timeZone: "Asia/Kolkata" 
    });
    const currentIST = new Date(nowIST);
    
    // Define night shift time range: 6:30 PM (18:30) to 6:00 AM (06:00) next day - INDIA TIME
    const nightShiftStart = new Date(currentIST);
    nightShiftStart.setHours(18, 30, 0, 0); // 6:30 PM today
    
    const nightShiftEnd = new Date(currentIST);
    nightShiftEnd.setDate(currentIST.getDate() + 1);
    nightShiftEnd.setHours(6, 0, 0, 0); // 6:00 AM next day
    
    // Check if input date falls within the night shift range
    return inputDateIST >= nightShiftStart && inputDateIST <= nightShiftEnd;
  } catch (error) {
    console.error('Error checking India night shift:', error);
    return false;
  }
};
// Replace the existing calculateRecruiterStats function with this:
const calculateRecruiterStats = () => {
  const stats = {};
  
  // Initialize ALL recruiters (including managers) with zero counts
  recruiters.forEach(recruiter => {
    stats[recruiter.name] = {
      totalRoles: 0,
      totalApplications: 0,
      activeRoles: 0,
      profilesShared: 0,
      profilesSharedToday: 0, // Profiles during India night shift
      todayCount: 0, // Roles assigned during India night shift
      role: recruiter.role // Store the recruiter's role for filtering
    };
  });

  // Calculate counts for each recruiter
  rolesData.forEach(role => {
    try {
      let assignedRecruiters = [];
      if (role.assignedRecruiters) {
        if (typeof role.assignedRecruiters === 'string') {
          assignedRecruiters = JSON.parse(role.assignedRecruiters);
        } else {
          assignedRecruiters = role.assignedRecruiters;
        }
      }

      // Check if role was created/assigned during India night shift (2:00 PM - 6:00 AM IST)
      const isDuringIndiaNightShift = isInIndiaNightShift(role.createdAt) || isInIndiaNightShift(role.effectiveFrom);

      assignedRecruiters.forEach(recruiter => {
        if (stats[recruiter.name]) {
          stats[recruiter.name].totalRoles += 1;
          stats[recruiter.name].totalApplications += role.applicationCount || 0;
          
          if (role.status === 'Active') {
            stats[recruiter.name].activeRoles += 1;
          }
          
          // Calculate TOTAL profiles shared (all time)
          stats[recruiter.name].profilesShared += role.applicationCount || 0;
          
          // Calculate INDIA NIGHT SHIFT counts (2:00 PM - 6:00 AM IST)
          if (isDuringIndiaNightShift) {
            stats[recruiter.name].profilesSharedToday += role.applicationCount || 0;
            stats[recruiter.name].todayCount += 1;
          }
        }
      });
    } catch (error) {
      console.error('Error calculating recruiter stats:', error);
    }
  });

  return stats;
};


// Clear parse content whenever the modal state changes
useEffect(() => {
  // Reset parse content when modal opens or closes
  setJdParseContent('');
  setParseStatus(null);
}, [showAddRoleModal, showEditRoleModal]);
// Add this useEffect to calculate recruiter stats when data changes
useEffect(() => {
  if (rolesData.length > 0 && recruiters.length > 0) {
    const stats = calculateRecruiterStats();
    setRecruiterStats(stats);
  }
}, [rolesData, recruiters]);

// Add this function to render recruiter statistics
const renderRecruiterStats = () => {
  // Show only active recruiters (those with totalRoles > 0), sorted by todayCount (highest first)
  const recruiterList = Object.entries(recruiterStats)
    .filter(([name, stats]) => (stats.role === 'user' || stats.role === 'teamlead') && stats.totalRoles > 0)
    .sort((a, b) => b[1].todayCount - a[1].todayCount);

  if (recruiterList.length === 0) {
    return (
      <div className="recruitment-no-results">
        No active recruiters found.
      </div>
    );
  }

  return (
    <div className="recruiter-stats-grid">
      {recruiterList.map(([recruiterName, stats]) => (
        <div key={recruiterName} className="recruiter-stat-card">
          <div className="recruiter-stat-header">
            <h4>{recruiterName}</h4>
            <span className="recruiter-role-badge">
              {stats.role === 'teamlead' ? 'Team Lead' : 'Recruiter'}
            </span>
          </div>
          
          <div className="recruiter-stat-numbers">
            <div className="recruiter-stat-item">
              <span className="stat-number">{stats.todayCount}</span>
              <span className="stat-label">Roles Today</span>
            </div>
            <div className="recruiter-stat-item">
              <span className="stat-number">{stats.profilesSharedToday || 0}</span>
              <span className="stat-label">Profiles Today</span>
            </div>
          </div>
          
          
        </div>
      ))}
    </div>
  );
};

// Add this function to toggle recruiter stats view
const toggleRecruiterStats = () => {
  setShowRecruiterStats(!showRecruiterStats);
};

// In your updatedCalculateStats function, update the label
const updatedCalculateStats = () => {
  const basicStats = calculateStats();
  
  // Add recruiter stats button as the last stat card
  return [
    ...basicStats,
    { 
      value: Object.keys(recruiterStats).filter(name => recruiterStats[name].totalRoles > 0).length, 
      label: 'Active Recruiters',
      isButton: true,
      onClick: toggleRecruiterStats
    }
  ];
};



  // NEW: Delete Role Functions
  const openDeleteConfirmModal = (role, e) => {
    e.stopPropagation();

    // Debug logging
    console.log('Role to delete:', role);
    console.log('Role ID:', role.id);
    console.log('Role object keys:', Object.keys(role));
    console.log('Role ID type:', typeof role.id);

    // Verify the role exists in current data
    const foundRole = rolesData.find(r => r.id === role.id);
    console.log('Role found in current data:', foundRole);

    if (!foundRole) {
      showNotification('Role not found in current data. Please refresh the page.');
      return;
    }

    setRoleToDelete(role);
    setShowDeleteConfirmModal(true);
  };

  const closeDeleteConfirmModal = () => {
    setShowDeleteConfirmModal(false);
    setRoleToDelete(null);
  };



  const refreshRolesData = async () => {
    await fetchData(false);
  }


  const handleVisaTypeSelection = (visaType) => {
    setNewRole(prev => {
      const currentVisaTypes = prev.visaTypes || [];
      const isSelected = currentVisaTypes.includes(visaType);

      if (isSelected) {
        // Remove if already selected
        return {
          ...prev,
          visaTypes: currentVisaTypes.filter(type => type !== visaType)
        };
      } else {
        // Add if not selected
        return {
          ...prev,
          visaTypes: [...currentVisaTypes, visaType]
        };
      }
    });
  };


  // Edit application functions
const openEditApplicationModal = (application, e) => {
  e.stopPropagation();
  setApplicationToEdit(application);
  setShowEditApplicationModal(true);
};





const closeEditApplicationModal = () => {
  setShowEditApplicationModal(false);
  setApplicationToEdit(null);
};
  const handleEditApplicationChange = (e) => {
    const { name, value, files } = e.target;

    if (name === 'resumeFiles' && files && files.length > 0) {
      const newFiles = Array.from(files);

      // Validate files
      const validFiles = newFiles.filter(file => {
        // Validate file size (5MB = 5 * 1024 * 1024 bytes)
        if (file.size > 5 * 1024 * 1024) {
          showNotification(`File ${file.name} exceeds 5MB limit`);
          return false;
        }

        // Validate file type
        const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!allowedTypes.includes(file.type)) {
          showNotification(`File ${file.name} is not a PDF, DOC, or DOCX`);
          return false;
        }

        return true;
      });

      // setEditApplicationData(prev => ({
      //   ...prev,
      //   resumeFiles: validFiles
      // }));

      // Clear the input
      e.target.value = '';
    } else {
      // setEditApplicationData(prev => ({
      //   ...prev,
      //   [name]: value
      // }));
    }
  };


  // Delete application functions
  const openDeleteApplicationModal = (application, e) => {
    e.stopPropagation();
    setApplicationToDelete(application);
    setShowDeleteApplicationModal(true);
  };

  const closeDeleteApplicationModal = () => {
    setShowDeleteApplicationModal(false);
    setApplicationToDelete(null);
  };
  const handleDeleteApplication = async () => {
    if (!applicationToDelete) return;

    console.log('Deleting application:', applicationToDelete.id);
    console.log('Current selected role:', selectedRole.id);

    try {
      const token = localStorage.getItem('token');

      const response = await axios.delete(
        `${BASE_URL}/api/recruitment/applications/${applicationToDelete.id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      console.log('Delete API call successful:', response.data);

      // Get the new application count from the response
      const newApplicationCount = response.data.newApplicationCount;

      // Update applications data by removing the deleted application
      setApplicationsData(prev => {
        const newData = { ...prev };
        if (newData[selectedRole.id]) {
          const filteredApplications = newData[selectedRole.id].filter(app => app.id !== applicationToDelete.id);
          newData[selectedRole.id] = filteredApplications;
          return { ...newData };
        }
        return newData;
      });

      // Update the roles data to reflect the new application count
      setRolesData(prev => {
        const updatedRoles = prev.map(role => {
          if (role.id === selectedRole.id) {
            return {
              ...role,
              applicationCount: newApplicationCount
            };
          }
          return role;
        });
        return updatedRoles;
      });

      // Also update the selectedRole's application count
      setSelectedRole(prev => ({
        ...prev,
        applicationCount: newApplicationCount
      }));

      closeDeleteApplicationModal();
      showNotification('Application deleted successfully!');

    } catch (error) {
      console.error('Error deleting application:', error);
      showNotification('Failed to delete application. Please try again.');
    }
  };
  // In your handleDeleteRole function
  const handleDeleteRole = async () => {
    if (!roleToDelete) return;

    try {
      const token = localStorage.getItem('token');

      console.log('DELETE request details:', {
        url: `${BASE_URL}/api/recruitment/roles/${roleToDelete.id}`,
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
        roleId: roleToDelete.id,
        roleData: roleToDelete
      });

      // Check if role has applications
      let hasApplications = false;
      try {
        const roleDetails = await axios.get(`${BASE_URL}/api/recruitment/roles/${roleToDelete.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        hasApplications = roleDetails.data.applications && roleDetails.data.applications.length > 0;
      } catch (error) {
        console.log('Could not fetch role details, proceeding with delete');
      }

      // Use axios.delete instead of axios with method config
      let response;
      if (hasApplications) {
        if (!window.confirm(`This role has applications. Do you want to delete it along with all applications?`)) {
          return;
        }

        // Force delete with applications
        response = await axios.delete(`${BASE_URL}/api/recruitment/roles/${roleToDelete.id}?force=true`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        // Regular delete
        response = await axios.delete(`${BASE_URL}/api/recruitment/roles/${roleToDelete.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      console.log('Delete response:', response.data);

      // Refresh data
      await refreshRolesData();

      closeDeleteConfirmModal();
      showNotification(hasApplications ?
        'Role and applications deleted successfully!' :
        'Role deleted successfully!');

    } catch (error) {
      console.error('Error deleting role:', error);
      console.error('Error response:', error.response);

      if (error.response?.status === 404) {
        showNotification('Role not found. It may have already been deleted.');
        await refreshRolesData();
      } else if (error.response?.status === 403) {
        showNotification('You do not have permission to delete roles.');
      } else if (error.response?.status === 409) {
        showNotification('Cannot delete role with existing applications. Use force delete.');
      } else {
        showNotification('Error deleting role. Please try again.');
      }

      closeDeleteConfirmModal();
    }
  };



  // Add this function near your formatCurrency function
  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';

    try {
      let dateObj;

      // Parse the date string
      if (typeof dateString === 'string') {
        // Always parse as-is, JavaScript will handle timezone info if present
        dateObj = new Date(dateString);
      } else if (dateString instanceof Date) {
        dateObj = dateString;
      } else {
        return 'Invalid Date';
      }

      // Verify it's a valid date
      if (isNaN(dateObj.getTime())) {
        return 'Invalid Date';
      }

      // Use the BROWSER'S LOCAL TIMEZONE (getHours, getMinutes, etc.)
      // This displays the time as the user sees it in their timezone
      const hours = dateObj.getHours();
      const minutes = dateObj.getMinutes().toString().padStart(2, '0');
      const seconds = dateObj.getSeconds().toString().padStart(2, '0');
      const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
      const day = dateObj.getDate().toString().padStart(2, '0');
      const year = dateObj.getFullYear();

      // Convert to 12-hour format
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const twelveHour = hours % 12 || 12;

      const formattedDate = `${month}/${day}/${year}`;
      const formattedTime = `${twelveHour}:${minutes}:${seconds} ${ampm}`;

      return `${formattedDate} ${formattedTime}`;
    } catch (error) {
      console.error('Error formatting date:', error, dateString);
      return 'Date Error';
    }
  };


  // Updated viewResume function with proper authentication
  // Updated viewResume function to get actual filename
  const viewResume = async (resumeId, applicationId, e) => {
    e.stopPropagation();
    try {
      setResumeLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        showNotification('Authentication required. Please log in again.');
        return;
      }

      const resumeUrl = `${BASE_URL}/api/recruitment/applications/${applicationId}/resume/${resumeId}`;

      // Make a HEAD request to get the content type and filename
      const headResponse = await fetch(resumeUrl, {
        method: 'HEAD',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!headResponse.ok) {
        throw new Error(`Failed to fetch resume: ${headResponse.status} ${headResponse.statusText}`);
      }

      // Get content type and filename from headers
      const contentType = headResponse.headers.get('content-type') || '';
      const contentDisposition = headResponse.headers.get('content-disposition') || '';

      let fileExtension = 'pdf';
      let actualFileName = 'Resume'; // fallback

      // Extract filename from Content-Disposition header
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          actualFileName = filenameMatch[1].replace(/['"]/g, '');
          // Get file extension from actual filename
          const extMatch = actualFileName.match(/\.([^.]+)$/);
          if (extMatch) {
            fileExtension = extMatch[1].toLowerCase();
          }
        }
      } else {
        // Fallback: determine file type from content type
        if (contentType.includes('word') || contentType.includes('msword') || contentType.includes('officedocument')) {
          fileExtension = 'docx';
        } else if (contentType.includes('pdf')) {
          fileExtension = 'pdf';
        }
      }

      // For Word documents, we'll just store the URL for download
      // For PDFs, we'll fetch the content for display
      let displayUrl = resumeUrl;
      let isWordDoc = fileExtension === 'doc' || fileExtension === 'docx';

      if (!isWordDoc) {
        // For PDFs, fetch the actual content to display
        const getResponse = await fetch(resumeUrl, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!getResponse.ok) {
          throw new Error(`Failed to fetch resume content: ${getResponse.status} ${getResponse.statusText}`);
        }

        const blob = await getResponse.blob();
        displayUrl = URL.createObjectURL(blob);
      }

      // Set the resume details and open modal
      setCurrentResumeUrl(displayUrl);
      setCurrentCandidateName(actualFileName); // Use actual filename instead of candidate name
      setCurrentFileType(fileExtension);
      setShowResumeModal(true);

    } catch (error) {
      console.error('Error viewing resume:', error);
      showNotification('Failed to open resume. Please try again.');
    } finally {
      setResumeLoading(false);
    }
  }
  const closeResumeModal = () => {
    // Clean up blob URL if it exists
    if (currentResumeUrl && currentResumeUrl.startsWith('blob:')) {
      URL.revokeObjectURL(currentResumeUrl);
    }

    setShowResumeModal(false);
    setCurrentResumeUrl('');
    setCurrentCandidateName('');
    setCurrentFileType('');
  };
  // Resume Submission Modal Functions
  const showResumeSubmission = (e) => {
    e.stopPropagation();
    setShowResumeSubmissionModal(true);
  };

const closeResumeSubmissionModal = () => {
  setShowResumeSubmissionModal(false);

  setResumeFiles([]);
};
  // Handle resume submission form changes
  const handleResumeSubmissionChange = (e) => {
    const { name, value, files } = e.target;

    if (name === 'resumeFiles' && files && files.length > 0) {
      const newFiles = Array.from(files);



      // Validate files
      const validFiles = newFiles.filter(file => {
        // Validate file size (5MB = 5 * 1024 * 1024 bytes)
        if (file.size > 5 * 1024 * 1024) {
          showNotification(`File ${file.name} exceeds 5MB limit`);
          return false;
        }

        // Validate file type
        const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!allowedTypes.includes(file.type)) {
          showNotification(`File ${file.name} is not a PDF, DOC, or DOCX`);
          return false;
        }

        return true;
      });


      setResumeFiles(prev => [...prev, ...validFiles]);

      // Clear the input
      e.target.value = '';
    } else {
      // setResumeSubmission(prev => ({
      //   ...prev,
      //   [name]: value
      // }));
    }
  };


  // Job Description Modal Functions
  const showJobDescription = (e) => {
    e.stopPropagation();
    setShowJobDescriptionModal(true);
  };

  const closeJobDescriptionModal = () => {
    setShowJobDescriptionModal(false);
  };



  // Add this function to show special notes modal
  const showSpecialNotes = (e) => {
    e.stopPropagation();
    setShowSpecialNotesModal(true);
  };

  // Add this function to close special notes modal
  const closeSpecialNotesModal = () => {
    setShowSpecialNotesModal(false);
  };

  // Helper function to check if role is ending soon
  const isRoleEndingSoon = (endDate) => {
    if (!endDate) return false;

    const today = new Date();
    const roleEndDate = new Date(endDate);
    const timeDiff = roleEndDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    return daysDiff <= 1 && daysDiff >= 0;
  };
const filterByDate = (role, filterType) => {
  // Handle custom date range
  if (filterType === 'custom') {
    // If dates are set, apply the filter
    if (customStartDate && customEndDate) {
      const roleDate = new Date(role.createdAt || role.effectiveFrom);
      const startDate = new Date(customStartDate);
      const endDate = new Date(customEndDate);
      
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      
      return roleDate >= startDate && roleDate <= endDate;
    }
    // If dates NOT set, show all roles (don't filter)
    return true;
  }

  if (!filterType) return true;
  
  const today = new Date();
  const roleDate = new Date(role.createdAt || role.effectiveFrom);

  switch (filterType) {
    case 'today':
      return roleDate.toDateString() === today.toDateString();

    case 'yesterday':
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      return roleDate.toDateString() === yesterday.toDateString();

    case 'this-week':
      const startOfWeek = new Date(today);
      const dayOfWeek = today.getDay();
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      startOfWeek.setDate(today.getDate() + diff);
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      return roleDate >= startOfWeek && roleDate <= endOfWeek;

    case 'last-week':
      const lastWeekStart = new Date(today);
      const lastWeekDayOfWeek = today.getDay();
      const lastWeekDiff = lastWeekDayOfWeek === 0 ? -13 : -6 - lastWeekDayOfWeek;
      lastWeekStart.setDate(today.getDate() + lastWeekDiff);
      lastWeekStart.setHours(0, 0, 0, 0);

      const lastWeekEnd = new Date(lastWeekStart);
      lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
      lastWeekEnd.setHours(23, 59, 59, 999);

      return roleDate >= lastWeekStart && roleDate <= lastWeekEnd;

    case 'this-month':
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      endOfMonth.setHours(23, 59, 59, 999);

      return roleDate >= startOfMonth && roleDate <= endOfMonth;

    case 'last-month':
      const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
      lastMonthEnd.setHours(23, 59, 59, 999);

      return roleDate >= lastMonthStart && roleDate <= lastMonthEnd;

    case 'ending-soon':
      return isRoleEndingSoon(role.endDate);

    default:
      return true;
  }
};

  // Add this function near your formatCurrency function
const formatLocation = (role) => {
  if (!role.city && !role.state && !role.country) {
    return 'N/A';
  }

  // For remote roles
  if (role.roleLocation === 'Remote') {
    return 'Remote' + (role.country ? `, ${role.country}` : '');
  }

  try {
    const cities = role.city ? role.city.split(',').map(c => c.trim()).filter(c => c) : [];
    const states = role.state ? role.state.split(',').map(s => s.trim()).filter(s => s) : [];
    const country = role.country || '';

    const locationPairs = [];
    
    // Create location pairs
    for (let i = 0; i < Math.max(cities.length, states.length); i++) {
      const city = cities[i] || '';
      const state = states[i] || '';
      
      if (city && state) {
        locationPairs.push(`${city}, ${state}, ${country}`);
      }
    }

    if (locationPairs.length > 0) {
      return locationPairs.join(' | ');
    }

    // Fallback for single location
    return `${role.city || ''}, ${role.state || ''}, ${country}`.replace(/^,\s*|\s*,/g, '').trim();

  } catch (error) {
    console.error('Error formatting location:', error);
    return `${role.city || ''}, ${role.state || ''}, ${role.country || ''}`.replace(/^,\s*|\s*,/g, '').trim();
  }
};



  // Add a useEffect to clear state and city when switching to Remote mode
  useEffect(() => {
    if (newRole.roleLocation === 'Remote') {
      setNewRole(prev => ({
        ...prev,
        state: '',
        city: ''
      }));
    }
  }, [newRole.roleLocation]);

  // Fetch data from API
  const fetchData = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setIsLoading(true);
      setIsDataFetching(true);
      const token = localStorage.getItem('token');

      // Prepare query parameters for server-side filtering and pagination
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        searchTerm: searchTerm,
        status: statusFilter,
        urgency: urgencyFilter,
        locations: locationFilter, // Added location filter
        cardLocation: cardLocationFilter !== 'All' ? cardLocationFilter : undefined,
        days: dateFilter === 'today' ? 1 : 
              dateFilter === 'yesterday' ? 2 : 
              dateFilter === 'this-week' ? 7 : 
              dateFilter === 'last-week' ? 14 :
              dateFilter === 'this-month' ? 30 : 
              dateFilter === 'last-month' ? 60 : null
      };

      // Fetch roles with pagination and filters
      const rolesResponse = await axios.get(`${BASE_URL}/api/recruitment/roles`, {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });

      // Handle paginated response structure
      if (rolesResponse.data && (rolesResponse.data.data || rolesResponse.data.roles)) {
        const rolesList = rolesResponse.data.data || rolesResponse.data.roles;
        setRolesData(rolesList);
        setFilteredRoles(rolesList); // Server already filtered them
        setTotalRolesCount(rolesResponse.data.totalCount);
        setTotalPagesServer(rolesResponse.data.totalPages);
        if (rolesResponse.data.stats) {
          setDashboardStats(rolesResponse.data.stats);
        }
      } else {
        // Fallback for non-paginated response
        setRolesData(rolesResponse.data);
        setFilteredRoles(rolesResponse.data);
        setTotalRolesCount(rolesResponse.data.length);
      }

      if (isInitial) {
        // Fetch recruiters
        const recruitersResponse = await axios.get(`${BASE_URL}/api/recruitment/recruiters`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRecruiters(recruitersResponse.data);

        // Fetch hiring steps
        try {
          const stepsResponse = await axios.get(`${BASE_URL}/api/recruitment/applications/hiring-steps`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setHiringSteps(stepsResponse.data || []);
        } catch (stepsError) {
          console.error('Error fetching hiring steps:', stepsError);
          setHiringSteps([
            { id: 1, stepName: 'Applied', stepOrder: 0 },
            { id: 2, stepName: 'Screening', stepOrder: 1 },
            { id: 3, stepName: 'Technical Interview', stepOrder: 2 },
            { id: 4, stepName: 'Manager Interview', stepOrder: 3 },
            { id: 5, stepName: 'HR Interview', stepOrder: 4 },
            { id: 6, stepName: 'Offer Extended', stepOrder: 5 },
            { id: 7, stepName: 'Hired', stepOrder: 6 }
          ]);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      if (isInitial) setIsLoading(false);
      setIsDataFetching(false);
    }
  }, [currentPage, itemsPerPage, searchTerm, statusFilter, urgencyFilter, dateFilter, locationFilter, cardLocationFilter]);

  useEffect(() => {
    fetchData(true);
  }, [currentPage, itemsPerPage, searchTerm, statusFilter, urgencyFilter, dateFilter, locationFilter, cardLocationFilter]);

  // Add this useEffect to handle data refresh when needed
  useEffect(() => {
    filterRoles();
  }, [rolesData, searchTerm, statusFilter, locationFilter, urgencyFilter, dateFilter, isRecruiterView]);

  // Handle country change
const handleCountryChange = (e) => {
  const countryName = e.target.value;
  const countryCode = getCountryCode(countryName);
  
  // Auto-set currency based on country
  let currency = 'USD'; // default
  if (countryName === 'India') {
    currency = 'INR';
  } else if (countryName === 'United States') {
    currency = 'USD';
  } else if (countryName === 'Canada') {
    currency = 'CAD';
  } else if (countryName === 'United Kingdom') {
    currency = 'GBP';
  } else if (countryName === 'European Union' || countryName === 'Germany' || countryName === 'France' || countryName === 'Spain' || countryName === 'Italy') {
    currency = 'EUR';
  }
  
  setNewRole(prev => ({
    ...prev,
    country: countryName,
    currency: currency
  }));

  // Reset location pairs when country changes
  setLocationPairs([]);
  setNewLocation({
    city: '',
    state: '',
    country: countryName
  });

  // Get states for the selected country
  const countryStates = getStatesForCountry(countryCode);
  setStates(countryStates);
};
useEffect(() => {
  if (newRole.roleLocation === 'Remote') {
    // Clear location pairs for remote roles
    setLocationPairs([]);
    setNewLocation({
      city: '',
      state: '',
      country: newRole.country
    });
  }
}, [newRole.roleLocation, newRole.country]);


const handleAddLocationPair = () => {
  if (!newLocation.city.trim() || !newLocation.state.trim()) {
    showNotification('Please enter both city and state');
    return;
  }

  // 🆕 Get state and country codes for abbreviation
  const stateCode = getStateCode(getCountryCode(newRole.country), newLocation.state);
  const countryCode = getCountryCode(newRole.country);

  // 🆕 Capitalize city name properly
  const cityName = newLocation.city.trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  const locationExists = locationPairs.some(pair => 
    pair.city.toLowerCase() === cityName.toLowerCase() &&
    pair.state.toLowerCase() === newLocation.state.trim().toLowerCase()
  );

  if (locationExists) {
    showNotification('This location pair already exists');
    return;
  }

  const locationPair = {
    city: cityName,
    state: newLocation.state.trim(),
    stateCode: stateCode,
    countryCode: countryCode,
    country: newRole.country || newLocation.country,
    displayName: `${cityName}, ${stateCode}, ${countryCode}`
  };

  setLocationPairs(prev => [...prev, locationPair]);
  setNewLocation({
    city: '',
    state: '',
    country: newRole.country
  });
};

const handleRemoveLocationPair = (index) => {
  setLocationPairs(prev => prev.filter((_, i) => i !== index));
};

// Update selected states and cities from location pairs
useEffect(() => {
  const cities = locationPairs.map(pair => pair.city);
  const states = locationPairs.map(pair => pair.state);
  
  setSelectedCities(cities);
  setSelectedStates(states);
}, [locationPairs]);



  const handleStateSelection = (stateName) => {
    setSelectedStates(prev => {
      if (prev.includes(stateName)) {
        return prev.filter(state => state !== stateName);
      } else {
        return [...prev, stateName];
      }
    });
    // Close dropdown after selection
    setIsStateDropdownOpen(false);
    setStateSearchQuery(''); // Clear search when closing
  };

  const handleRemoveState = (stateName) => {
    setSelectedStates(prev => prev.filter(state => state !== stateName));
  };

  // Filter states based on search query
  const filteredStates = states.filter(state =>
    state.toLowerCase().includes(stateSearchQuery.toLowerCase())
  );


  const handleCityInputChange = (e) => {
    setCityInput(e.target.value);
  };

const handleAddCity = () => {
  if (cityInput.trim() && !selectedCities.includes(cityInput.trim())) {
    // Format the city name
    const formattedCity = cityInput.trim()
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    setSelectedCities(prev => [...prev, formattedCity]);
    setCityInput('');
  }
};
  const handleRemoveCity = (cityToRemove) => {
    setSelectedCities(prev => prev.filter(city => city !== cityToRemove));
  };



  // Fetch applications for a specific role
  const fetchApplications = async (roleId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BASE_URL}/api/recruitment/applications/role/${roleId}/with-resumes`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setApplicationsData(prev => ({
        ...prev,
        [roleId]: response.data || []
      }));

    } catch (error) {
      console.error('Error fetching applications:', error);
      // Fallback to the original endpoint if the new one fails
      try {
        const token = localStorage.getItem('token');
        const fallbackResponse = await axios.get(`${BASE_URL}/api/recruitment/roles/${roleId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        setApplicationsData(prev => ({
          ...prev,
          [roleId]: fallbackResponse.data.applications || []
        }));
      } catch (fallbackError) {
        console.error('Fallback error fetching applications:', fallbackError);
        showNotification('Failed to load applications for this role');
        setApplicationsData(prev => ({
          ...prev,
          [roleId]: [] // Set empty array if request fails
        }));
      }
    }
  };




  // Filter roles based on search and filter criteria

const filterRoles = useCallback(() => {
  // Now server handles main filtering, so we just pass through rolesData
  // but keep local sorting if needed.
  let currentData = rolesData;
  setFilteredRoles(currentData);
}, [rolesData]);


// 8. Helper function to normalize usernames (if not already present)
const normalizeUsername = (username) => {
  if (!username) return '';
  return username.toLowerCase().trim();
};

  // Initialize the application
  useEffect(() => {
    filterRoles();
  }, [filterRoles]);

  // Show role applications in modal
  // In showRoleApplications function
  // Update the showRoleApplications function to include notes fetching:
  const showRoleApplications = (role) => {
    navigate(`/role-detail/${role.id}`);
  };
  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setSelectedRole(null);
  };

  // Toggle hiring process visibility
  const toggleHiringProcess = (applicationId, e) => {
    e.stopPropagation();
    setShowHiringProcess(prev => ({
      ...prev,
      [applicationId]: !prev[applicationId]
    }));
  };

  // Advance hiring step (recruiter functionality)
  const advanceStep = async (applicationId, currentStepIndex, roleId, e) => {
    e.stopPropagation();

    try {
      const token = localStorage.getItem('token');
      const newStepIndex = currentStepIndex + 1;

      // Determine new status based on step
      let newStatus = 'In Progress';
      if (newStepIndex === hiringSteps.length - 2) {
        newStatus = 'Offer Extended';
      } else if (newStepIndex === hiringSteps.length - 1) {
        newStatus = 'Hired';
      }

      await axios.put(
        `${BASE_URL}/api/recruitment/applications/${applicationId}/status`,
        {
          currentStep: newStepIndex,
          status: newStatus
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Refresh applications data
      await fetchApplications(roleId);
      showNotification(`Step completed for application ${applicationId}`);

    } catch (error) {
      console.error('Error advancing step:', error);
      showNotification('Failed to update application status');
    }
  };

  // Show notification
  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  // Handle input changes for the new role form
  // Enhanced handleNewRoleChange function with rate validation
// Enhanced handleNewRoleChange function with rate validation
const handleNewRoleChange = (e) => {
  const { name, value, type, checked } = e.target;

  // Special handling for rate fields - keep as string until blur
  if (name === 'minRate' || name === 'maxRate') {
    // Don't convert to number immediately - keep as string
    setNewRole(prev => {
      const updated = {
        ...prev,
        [name]: value // Keep the raw string value
      };

      // Clear any existing rate validation errors
      setValidationErrors(prevErrors => ({
        ...prevErrors,
        rateRange: null
      }));

      // Only validate if both fields have values
      if ((name === 'minRate' || name === 'maxRate') && value && prev.minRate && prev.maxRate) {
        const minRate = name === 'minRate' ? value : prev.minRate;
        const maxRate = name === 'maxRate' ? value : prev.maxRate;
        
        const minRateNum = parseFloat(minRate);
        const maxRateNum = parseFloat(maxRate);
        
        if (!isNaN(minRateNum) && !isNaN(maxRateNum) && minRateNum >= maxRateNum) {
          setValidationErrors(prevErrors => ({
            ...prevErrors,
            rateRange: 'Maximum rate must be greater than minimum rate'
          }));
        }
      }

      return updated;
    });
    return; // Exit early for rate fields
  }

  // Handle other fields normally
  let processedValue = value;

  // Add new options to the appropriate list when typing
  if (name === 'role' && value && !roleTitles.includes(value)) {
    setRoleTitles(prev => [...prev, value]);
  } else if (name === 'client' && value && !clients.includes(value)) {
    setClients(prev => [...prev, value]);
  } else if (name === 'assignTo' && value && !recruiters.some(r => r.name === value)) {
    setRecruiters(prev => [...prev, { name: value }]);
  } else if (name === 'clientPOC' && value && !clientPOCs.includes(value)) {
    setClientPOCs(prev => [...prev, value]);
  } else if (name === 'country') {
    // Auto-switch category toggle based on country
    const countryIsIndia = ['india', 'in'].includes((value || '').trim().toLowerCase());
    setRoleCategory(countryIsIndia ? 'Offshore' : 'Onsite');
    if (countryIsIndia) {
      // Compute next sequential offshore job ID from loaded roles
      const offshoreRoles = rolesData ? rolesData.filter(r => r.roleCategory?.toLowerCase() === 'offshore' || ['india','in'].includes((r.country || '').toLowerCase())) : [];
      const maxId = offshoreRoles.reduce((max, r) => {
        const n = parseInt(r.jobId);
        return !isNaN(n) && n > max ? n : max;
      }, 0);
      const nextOffshoreId = (maxId + 1).toString();
      setNewRole(prev => ({ ...prev, currency: 'INR', minRate: '0', jobId: nextOffshoreId }));
    } else {
      setNewRole(prev => ({ ...prev, currency: prev.currency === 'INR' ? 'USD' : prev.currency, jobId: '' }));
    }
  }

  setNewRole(prev => ({
    ...prev,
    [name]: type === 'checkbox' ? checked : processedValue
  }));
};

  // Form validation function
const validateForm = () => {
  const errors = {};

  // Required field validation
  // if (!newRole.jobId.trim()) errors.jobId = 'Job ID is required';
  if (!newRole.role.trim()) errors.role = 'Role is required';
  
  // Rate validation - allow 0 as valid value
  if (newRole.minRate === '' || newRole.minRate === null || newRole.minRate === undefined) {
    errors.minRate = 'Minimum rate is required';
  } else if (parseFloat(newRole.minRate) < 0) {
    errors.minRate = 'Minimum rate cannot be negative';
  }
  
  if (newRole.maxRate === '' || newRole.maxRate === null || newRole.maxRate === undefined) {
    errors.maxRate = 'Maximum rate is required';
  } else if (parseFloat(newRole.maxRate) < 0) {
    errors.maxRate = 'Maximum rate cannot be negative';
  }
  
  if (newRole.minRate && newRole.maxRate) {
    const minRateNum = parseFloat(newRole.minRate);
    const maxRateNum = parseFloat(newRole.maxRate);
    
    if (!isNaN(minRateNum) && !isNaN(maxRateNum)) {
      if (minRateNum >= maxRateNum) {
        errors.rateRange = 'Maximum rate must be greater than minimum rate';
      }
    }
  }

  if (!newRole.client.trim()) errors.client = 'Client is required';
  if (!newRole.country.trim()) errors.country = 'Country is required';

  // State and City are only required for Onsite and Hybrid work modes
  if (newRole.roleLocation !== 'Remote') {
    if (selectedStates.length === 0) {
      errors.state = 'At least one state is required for Onsite/Hybrid roles';
    }
    if (selectedCities.length === 0) {
      errors.city = 'At least one city is required for Onsite/Hybrid roles';
    }
  }

  setValidationErrors(errors);
  return Object.keys(errors).length === 0;
};


// Close location dropdown when clicking outside
useEffect(() => {
  const handleClickOutside = (event) => {
    if (showLocationDropdown && 
        !event.target.closest('.location-multi-select-container')) {
      setShowLocationDropdown(false);
    }
  };

  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, [showLocationDropdown]);



  // Replace the existing useEffect with this more comprehensive version
 useEffect(() => {
  if (showAddRoleModal && !isEditMode) {
    // Complete reset of all form-related states
    setSelectedStates([]);
    setSelectedCities([]);
    setCityInput('');
    setStates([]);
    setLocationPairs([]); // ADD THIS LINE
    setNewLocation({ // ADD THIS LINE
      city: '',
      state: '',
      country: ''
    });

      // Reset newRole to initial state
      setNewRole({
        jobId: '',
        gbamsId: '',
        systemId: 'AUTO',
        role: '',
        roleType: 'Full-time',
        country: '',
        state: '',
        city: '',
        currency: 'INR',
        minRate: '',
        maxRate: '',
        client: '',
        clientPOC: '',
        roleLocation: 'Onsite',
        experience: '',
        urgency: 'Normal',
        status: 'Active',
        assignTo: '',
        assignedRecruiters: [],
        recruiterLead: null,
        recruiter: null,
        effectiveFrom: new Date().toISOString().split('T')[0],
        startDate: '',
        endDate: '',
        profilesNeeded: 1,
        expensePaid: false,
        specialNotes: '',
        createdBy: localStorage.getItem('username') || 'Unknown',
        jobDescription: '',
        visaTypes: []
      });
    }
  }, [showAddRoleModal, isEditMode]);



  // Enhanced rate display component
  const RateDisplay = ({ role, currency }) => {


    return (
      <div className="rate-display">
        <span className="rate-range">
          {formatCurrency(role.minRate, role.currency)} - {formatCurrency(role.maxRate, role.currency)}
        </span>
        <span className="rate-period">
          {role.roleType === 'Contract' ? '/month' : '/annum'}
        </span>
      </div>
    );
  };

  // Helper function to reset Add Role form state completely
  const closeAddRoleModal = () => {
    setShowAddRoleModal(false);
    setRoleCategory('Onsite');
    setNewRole({
      jobId: '',
      gbamsId: '',
      systemId: 'AUTO',
      role: '',
      roleType: 'Full-time',
      country: '',
      state: '',
      city: '',
      currency: 'USD',
      minRate: '',
      maxRate: '',
      client: '',
      clientPOC: '',
      roleLocation: 'Onsite',
      experience: '',
      relevantExperience: '',
      urgency: 'Normal',
      status: 'Active',
      assignTo: '',
      assignedRecruiters: [],
      recruiterLead: null,
      recruiter: null,
      effectiveFrom: new Date().toISOString().split('T')[0],
      startDate: '',
      endDate: '',
      profilesNeeded: 1,
      expensePaid: false,
      specialNotes: '',
      createdBy: localStorage.getItem('username') || 'Unknown',
      jobDescription: '',
      visaTypes: [],
      vendor: ''
    });
    setNewLocation({ state: '', city: '', country: '' });
    setLocationPairs([]);
    setIsStateDropdownOpen(false);
  };

  // Submit the new role form (updated to handle both create and edit)
  const handleAddRoleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');

      // Add client-side validation for always required fields
      if (!newRole.role || !newRole.client || !newRole.country) {
        showNotification('Please fill in all required fields');
        return;
      }
      // State and City validation based on work mode
      // Only require State and City for Onsite and Hybrid roles, not for Remote
    // Location validation based on work mode
if (newRole.roleLocation !== 'Remote') {
  if (locationPairs.length === 0) {
    showNotification('Please add at least one location (City + State)');
    return;
  }
}

    // Rate validation - allow 0
if (newRole.minRate === '' || newRole.minRate === null || newRole.minRate === undefined) {
  showNotification('Please enter a minimum rate');
  return;
}
if (newRole.maxRate === '' || newRole.maxRate === null || newRole.maxRate === undefined) {
  showNotification('Please enter a maximum rate');
  return;
}

const minRateNum = parseFloat(newRole.minRate);
const maxRateNum = parseFloat(newRole.maxRate);

if (isNaN(minRateNum)) {
  showNotification('Please enter a valid minimum rate');
  return;
}
if (isNaN(maxRateNum)) {
  showNotification('Please enter a valid maximum rate');
  return;
}

if (minRateNum < 0) {
  showNotification('Minimum rate cannot be negative');
  return;
}
if (maxRateNum < 0) {
  showNotification('Maximum rate cannot be negative');
  return;
}

if (minRateNum >= maxRateNum) {
  showNotification('Maximum rate must be greater than minimum rate');
  return;
}
      if (!newRole.startDate) {
        showNotification('Please select a start date');
        return;
      }
setIsLoading(true); // Show loader
    showNotification(isEditMode ? '⏳ Updating role...' : '⏳ Creating role...', 10000); // 10 seconds duration

    console.log('=== DEBUGGING JOB DESCRIPTION ===');
    console.log('Full newRole object:', newRole);
    console.log('jobDescription field:', newRole.jobDescription);
    console.log('jobDescription type:', typeof newRole.jobDescription);
    console.log('jobDescription length:', newRole.jobDescription?.length);
    console.log('================================');

      const roleData = {
        jobId: newRole.jobId.trim(),
        gbamsId: newRole.gbamsId?.trim() || null,
        role: newRole.role.trim(),
        roleType: newRole.roleType,
        country: getCountryCode(newRole.country),
        // For remote roles, store the location data but the work mode will indicate it's remote
        state: locationPairs.length > 0
    ? locationPairs.map(pair => getStateCode(getCountryCode(newRole.country), pair.state)).join(', ')
    : null,
  city: locationPairs.length > 0
    ? locationPairs.map(pair => pair.city).join(', ')
    : null,
        currency: newRole.currency,
        minRate: parseFloat(newRole.minRate),
        maxRate: parseFloat(newRole.maxRate),
        client: newRole.client.trim(),
        clientPOC: newRole.clientPOC?.trim() || null,
        roleLocation: newRole.roleLocation,
        roleCategory: roleCategory,
        experience: newRole.experience.trim(),
        urgency: newRole.urgency,
        status: newRole.status,
        assignTo: newRole.assignTo?.trim() || null,
        assignedRecruiters: newRole.assignedRecruiters || [],
        jobDescription: newRole.jobDescription?.trim() || null,
        effectiveFrom: newRole.effectiveFrom || new Date().toISOString().split('T')[0],
        startDate: newRole.startDate,
        endDate: newRole.endDate || null,
        profilesNeeded: parseInt(newRole.profilesNeeded) || 1,
        expensePaid: Boolean(newRole.expensePaid),
        specialNotes: newRole.specialNotes?.trim() || null,
        visaTypes: newRole.visaTypes || [],
        createdBy: localStorage.getItem('username') || 'Unknown',
         vendor: newRole.vendor || null // ADD THIS LINE
      };


         console.log('=== DEBUGGING ROLE DATA ===');
    console.log('roleData.jobDescription:', roleData.jobDescription);
    console.log('roleData.jobDescription type:', typeof roleData.jobDescription);
    console.log('Is it HTML string?', roleData.jobDescription?.includes('<'));
    console.log('================================');

      // Rest of your submission logic...
    let response;
    let successMessage;
    let oldStatus = null;

    if (isEditMode && roleToEdit) {
      // Store old status before update
      oldStatus = roleToEdit.status;

      response = await axios.put(
        `${BASE_URL}/api/recruitment/roles/${roleToEdit.id}`,
        roleData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      successMessage = 'Role updated successfully!';

      // ✅ SEND NOTIFICATION IF STATUS CHANGED
      if (oldStatus !== newRole.status) {
        console.log(`📢 Status changed from ${oldStatus} to ${newRole.status}`);
        await sendStatusChangeNotification(
          roleToEdit.id,
          oldStatus,
          newRole.status,
          {
            role: newRole.role,
            jobId: newRole.jobId,
            client: newRole.client
          }
        );
      }
    } else {
      response = await axios.post(
        `${BASE_URL}/api/recruitment/roles`,
        roleData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      successMessage = 'New role added successfully!';
    }

    console.log('Server response:', response.data);
 showNotification(' Loading role data...', 10009);
      // Refresh roles data with pagination
      await fetchData(true);




      // Reset form and close modal
      // Reset form
      setNewRole({
        jobId: '',
        gbamsId: '', // ADD THIS LINE
        systemId: 'AUTO',
        role: '',
        roleType: '',
        country: '',
        state: '',
        city: '',
        currency: 'INR',
        rate: '',
        client: '',
        clientPOC: '',
        roleLocation: '',
        experience: '',
        urgency: 'Normal',
        status: 'Active',
        assignTo: '',
        recruiterLead: null,
        recruiter: null,
        effectiveFrom: new Date().toISOString().split('T')[0],
        startDate: '',
        endDate: '',
        profilesNeeded: 1,
        expensePaid: false,
        specialNotes: '',
        createdBy: localStorage.getItem('username') || 'Unknown',
        jobDescription: ''
      });

      if (isEditMode) {
        closeEditRoleModal();
      } else {
        closeAddRoleModal();
      }
  setIsLoading(false);
    showNotification(successMessage, 3000);

    } catch (error) {
      console.error('Error saving role:', error);
       setIsLoading(false);

      // More detailed error handling
      if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        const errorData = error.response.data;

        console.log('Error response data:', errorData);
        console.log('Error status:', status);

        if (status === 400) {
          showNotification(errorData.message || 'Bad request. Please check your input data.');
        } else if (status === 401) {
          showNotification('Authentication failed. Please log in again.');
        } else if (status === 422) {
          showNotification('Invalid data provided. Please check all fields.');
        } else if (status === 500) {
          showNotification('Server error occurred. Please try again later or contact support.');
        } else {
          showNotification(errorData.message || `Error ${status}: ${error.response.statusText}`);
        }
      } else if (error.request) {
        // Network error
        showNotification('Network error. Please check your connection.');
      } else {
        // Other error
        showNotification('An unexpected error occurred. Please try again.');
      }
    }
  };






  // Role types for dropdown
  const roleTypes = [
    "Full-time",
    "Part-time",
    "Contract",
    "Contract-to-hire",
    "C2C",
    "Internship",
    "Temporary"
  ];

  // Status options
const statusOptions = [
  "Active",
  "Inactive",
  "Modified",
  "On Hold",
  "Cancelled",
  "Filled"
];
  // Date filter options
const dateFilterOptions = [
  { value: "", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "this-week", label: "This Week" },
  { value: "last-week", label: "Last Week" },
  { value: "this-month", label: "This Month" },
  { value: "last-month", label: "Last Month" },
  { value: "ending-soon", label: "Ending Soon" },
  { value: "custom", label: "Custom Range" }  // ADD THIS LINE
];


const generateHiringSteps = (application, roleId) => {
  const stepsToUse = hiringSteps && hiringSteps.length > 0 ? hiringSteps : [
    { stepName: 'Applied', stepOrder: 0 },
    { stepName: 'Screening', stepOrder: 1 },
    { stepName: 'Technical Interview', stepOrder: 2 },
    { stepName: 'Manager Interview', stepOrder: 3 },
    { stepName: 'HR Interview', stepOrder: 4 },
    { stepName: 'Offer Extended', stepOrder: 5 },
    { stepName: 'Hired', stepOrder: 6 },
    { stepName: 'Rejected', stepOrder: 7 }
  ];
  const currentStepIndex = application.currentStep || 0;

  return (
    <div className="recruitment-hiring-process-dropdown">
      <div className="recruitment-step-selector">
        <label htmlFor={`step-select-${application.id}`}>Update Step:</label>
        <select
          id={`step-select-${application.id}`}
          value={currentStepIndex}
          onChange={async (e) => {
            const newStepIndex = parseInt(e.target.value);
            const stepName = stepsToUse[newStepIndex]?.stepName || `Step ${newStepIndex + 1}`;
            await openHiringStepModal(application, newStepIndex, stepName, e);
          }}
          className="recruitment-step-dropdown"
        >
          {stepsToUse.map((step, index) => (
            <option key={index} value={index}>
              {step.stepName}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

  // Add this function to render the hiring step modal
// Update your renderHiringStepModal function - add the button section
const renderHiringStepModal = () => {
  if (!showHiringStepModal) return null;

  return (
    <div
      id="hiring-step-modal"
      className="recruitment-modal"
      onClick={(e) => {
        if (e.target.id === 'hiring-step-modal') {
          // Remove outside click functionality
        }
      }}
    >
      <div className="recruitment-modal-content" style={{ maxWidth: '600px' }}>
        <div className="recruitment-modal-header">
          <h2>Update Hiring Step - {selectedStepData.stepName}</h2>
          <span className="recruitment-close" onClick={closeHiringStepModal}>&times;</span>
        </div>
        <div className="recruitment-modal-body">
          <div className="recruitment-form-group full-width">
            <label>
              Step Notes:
            </label>
            <textarea
              value={selectedStepData.notes}
              onChange={(e) => setSelectedStepData(prev => ({
                ...prev,
                notes: e.target.value
              }))}
              placeholder=""
              className="recruitment-form-textarea"
              rows="6"
              style={{
                minHeight: '150px',
                resize: 'vertical'
              }}
            />
            <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
              Add detailed notes about this step. These will be saved and visible to all recruiters.
            </div>
          </div>

          {/* ✅ ADD THE ASSIGN SCREENING BUTTON HERE - ONLY FOR SCREENING STEP */}
          {selectedStepData.currentStep === 1 && // Only show for screening step (step 1)
           (isManagerView || userRole === 'teamlead' || userRole === 'user') && (
            <div className="recruitment-form-group full-width" style={{ 
              marginTop: '20px', 
              paddingTop: '15px', 
              borderTop: '1px solid #eee' 
            }}>
              <label style={{ 
                fontWeight: '600', 
                color: '#1a6f66ff', 
                marginBottom: '10px',
                display: 'block'
              }}>
                Assign Screening Task:
              </label>
              <button
                type="button"
                onClick={() => openAssignScreeningModal(
                  { id: selectedStepData.applicationId }, 
                  new Event('click')
                )}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#28a77fff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  width: '100%',
                  transition: 'all 0.2s ease'
                }}
              
              >
                <i className="fas fa-user-plus" style={{ marginRight: '8px' }}></i>
                Assign Screening
              </button>
              <div style={{ 
                fontSize: '12px', 
                color: '#666', 
                marginTop: '8px', 
                textAlign: 'center' 
              }}>
                Assign this screening task to another for review
              </div>
            </div>
          )}

          <div className="recruitment-form-actions">
            <button
              type="button"
              className="recruitment-cancel-btn"
              onClick={closeHiringStepModal}
            >
              Cancel
            </button>
            <button
              type="button"
              className="recruitment-submit-btn"
              onClick={handleSaveStepWithNotes}
            >
              Update Step with Notes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

  


  const renderResumeModal = () => {
    if (!showResumeModal) return null;

    const isWordDoc = currentFileType === 'doc' || currentFileType === 'docx';
    const isPdf = currentFileType === 'pdf';

    const handleDownload = async () => {
      try {
        const token = localStorage.getItem('token');

        // Use the original URL for downloading
        const downloadUrl = currentResumeUrl;

        const response = await fetch(downloadUrl, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
          throw new Error('Download failed');
        }

        // Get the original filename from Content-Disposition header if available
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = `${currentCandidateName}.${currentFileType}`;

        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
          if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1].replace(/['"]/g, '');
          }
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename; // Use the extracted or constructed filename
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        showNotification('Resume download started!');
      } catch (error) {
        console.error('Download failed:', error);
        showNotification('Download failed. Please try again.');
      }
    };

    return (
      <div
        id="resume-modal"
        className="recruitment-modal"
      onClick={(e) => {
  if (e.target.id === 'resume-modal') {
    // Remove outside click functionality
  }
}}
      >
        <div className="recruitment-modal-content" style={{
          maxWidth: '90vw',
          maxHeight: '90vh',
          width: '1000px',
          height: '800px',
          padding: '0',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div className="recruitment-modal-header" style={{
            // padding: '15px 20px',
            borderBottom: '1px solid #ddd',
            flexShrink: 0
          }}>
            <h2 style={{ margin: 0, fontSize: '18px' }}>
              Resume - {currentCandidateName} {isWordDoc && '(Word Document)'}
            </h2>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>

              <span
                className="recruitment-close"
                onClick={closeResumeModal}
                style={{ fontSize: '24px', cursor: 'pointer' }}
              >
                &times;
              </span>
            </div>
          </div>

          <div style={{
            flex: 1,
            padding: '0',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#f8f9fa'
          }}>
            {resumeLoading ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '18px', color: '#666' }}>Loading resume...</div>
              </div>
            ) : isWordDoc ? (
              // For Word documents, show a clean preview message
              <div style={{
                textAlign: 'center',
                padding: '60px 40px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '25px',
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                border: '1px solid #e9ecef'
              }}>
                <div style={{
                  fontSize: '84px',
                  color: '#060606ff',
                  marginBottom: '10px'
                }}>📄</div>

                <div>
                  <h3 style={{
                    margin: '0 0 15px 0',
                    color: '#2c5047ff',
                    fontSize: '24px',
                    fontWeight: '600'
                  }}>
                    Word Document Resume
                  </h3>

                  <button
                    onClick={handleDownload}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#1b876cff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                    className="download-button"
                  >
                    Download Resume
                  </button>

                </div>

                <div style={{
                  fontSize: '12px',
                  color: '#999',
                  marginTop: '20px'
                }}>
                  File: {currentCandidateName}.{currentFileType}
                </div>
              </div>
            ) : (
              // For PDFs, use iframe with better error handling
              <iframe
                src={currentResumeUrl}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  backgroundColor: 'white'
                }}
                title={`Resume - ${currentCandidateName}`}
                onError={(e) => {
                  console.error('Error loading document in iframe:', e);
                  showNotification('Failed to load PDF. Please try downloading instead.');
                }}
                onLoad={() => {
                  console.log('PDF loaded successfully in iframe');
                }}
              />
            )}
          </div>
        </div>
      </div>
    );

  };
  // Add these state variables near your other state declarations
  const [selectedRecruiters, setSelectedRecruiters] = useState([]);
  const [showMultipleAssignModal, setShowMultipleAssignModal] = useState(false);
  // const [roleToAssign, setRoleToAssign] = useState(null);
  const [showRecruiterDropdown, setShowRecruiterDropdown] = useState(false);

  // Add these functions for multiple recruiter assignment
  // In openMultipleAssignModal function:
  const openMultipleAssignModal = (role, e) => {
    e.stopPropagation();
    setRoleToAssign(role);

    // Pre-select currently assigned recruiters from the correct field
    if (role.assignedRecruiters) {
      try {
        const currentlyAssigned = typeof role.assignedRecruiters === 'string'
          ? JSON.parse(role.assignedRecruiters)
          : role.assignedRecruiters;
        setSelectedRecruiters(currentlyAssigned.map(r => r.id));
      } catch (error) {
        setSelectedRecruiters([]);
      }
    } else {
      setSelectedRecruiters([]);
    }

    setShowMultipleAssignModal(true);
  };
  const closeMultipleAssignModal = () => {
    setShowMultipleAssignModal(false);
    setRoleToAssign(null);
    setSelectedRecruiters([]);
    setRecruiterSearchTerm(''); // Clear search term
    setShowRecruiterDropdown(false);
  };

  const handleRecruiterSelection = (recruiterId) => {
    setSelectedRecruiters(prev => {
      if (prev.includes(recruiterId)) {
        return prev.filter(id => id !== recruiterId);
      } else {
        return [...prev, recruiterId];
      }
    });
  };
  const handleMultipleRecruiterAssignment = async () => {
    try {
      const token = localStorage.getItem('token');
      showNotification('⏳ Assigning recruiters...', 2000);

      // Send the updated list of recruiter IDs (including removals)
      // BUT keep the original role owner unchanged
      const response = await axios.post(
        `${BASE_URL}/api/recruitment/roles/${roleToAssign.id}/assign-multiple-recruiters`,
        {
          recruiterIds: selectedRecruiters,
          // Remove this line that was incorrectly updating the roleOwner
          // roleOwner: roleToAssign.assignTo 
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Refresh roles data to reflect changes
      await refreshRolesData();
      closeMultipleAssignModal();
      showNotification('Recruiters assigned successfully!');

    } catch (error) {
      console.error('Error assigning recruiters:', error);

      if (error.response?.data?.message) {
        showNotification(error.response.data.message);
      } else {
        showNotification('Failed to assign recruiters. Please try again.');
      }
    }
  };
  // Add this function to render assigned recruiters
  // Add this state near your other state declarations
  const [expandedRecruiters, setExpandedRecruiters] = useState({});

  // Add this function to toggle recruiter expansion
  const toggleRecruiterExpansion = (roleId, e) => {
    e.stopPropagation();
    setExpandedRecruiters(prev => ({
      ...prev,
      [roleId]: !prev[roleId]
    }));
  };

  // Update the renderAssignedRecruiters function
  // Update the renderAssignedRecruiters function to show assignment times
const renderAssignedRecruiters = (role) => {
  let assignedRecruiters = [];

  try {
    if (role.assignedRecruiters) {
      // Parse the assignedRecruiters string if it's a string
      if (typeof role.assignedRecruiters === 'string') {
        assignedRecruiters = JSON.parse(role.assignedRecruiters);
      } else {
        assignedRecruiters = role.assignedRecruiters;
      }
    }
  } catch (error) {
    console.error('Error parsing assigned recruiters:', error);
  }

  if (assignedRecruiters.length === 0) {
    return (
      <span className="text-muted">
        <i className="fas fa-user-slash me-1"></i>
        No recruiters assigned
      </span>
    );
  }

  const isExpanded = expandedRecruiters[role.id];
  const displayCount = isExpanded ? assignedRecruiters.length : 2;
  const hasMore = assignedRecruiters.length > 2;

  // Sort recruiters by assignment time (newest first)
  const sortedRecruiters = assignedRecruiters.sort((a, b) => 
    new Date(b.assignedAt) - new Date(a.assignedAt)
  );
const formatAssignmentTime = (assignedAt) => {
  if (!assignedAt) return 'Recently';
  
  try {
    const assignmentDate = new Date(assignedAt);
    const now = new Date();
    
    const diffMs = now - assignmentDate;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return assignmentDate.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short'
    });
  } catch (error) {
    return 'Recently';
  }
};
const formatTooltipTime = (assignedAt) => {
  if (!assignedAt) return '';
  try {
    const date = new Date(assignedAt);
    return date.toLocaleString('en-IN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  } catch (error) {
    return '';
  }
};

  return (
    <div className="assigned-recruiters">
      <i className="fas fa-users me-1"></i>
      <div className="recruiters-list mt-1">
        {sortedRecruiters.slice(0, displayCount).map((recruiter, index) => (
          <div key={recruiter.id} className="recruiter-assignment-badge">
            <span className="badge bg-primary me-1 mb-1">
              {recruiter.name}
              <span className="assignment-time" title={`Assigned by ${recruiter.assignedBy} at ${new Date(recruiter.assignedAt).toLocaleString()}`}>
                ({formatAssignmentTime(recruiter.assignedAt)})
              </span>
            </span>
          </div>
        ))}
        {hasMore && !isExpanded && (
          <span
            className="badge bg-secondary clickable"
            onClick={(e) => toggleRecruiterExpansion(role.id, e)}
            style={{ cursor: 'pointer' }}
          >
            +{assignedRecruiters.length - 2} more
          </span>
        )}
        {hasMore && isExpanded && (
          <span
            className="badge bg-secondary clickable"
            onClick={(e) => toggleRecruiterExpansion(role.id, e)}
            style={{ cursor: 'pointer' }}
          >
            Show less
          </span>
        )}
      </div>
    </div>
  );
};



  // Render job description modal
  const renderJobDescriptionModal = () => {
    if (!selectedRole || !showJobDescriptionModal) return null;

    return (
      <div
        id="job-description-modal"
        className="recruitment-modal"
       onClick={(e) => {
  if (e.target.id === 'job-description-modal') {
    // Remove outside click functionality
  }
}}
      >
        <div className="recruitment-modal-content" style={{ maxWidth: '700px' }}>
          <div className="recruitment-modal-header">
            <h2>Job Description - {selectedRole.role}</h2>
            <span className="recruitment-close" onClick={closeJobDescriptionModal}>&times;</span>
          </div>
          <div className="recruitment-modal-body">
            <div
              className="recruitment-job-description-content"
              dangerouslySetInnerHTML={{
                __html: selectedRole.jobDescription || 'No job description provided'
              }}
              style={{
                minHeight: '200px',
                padding: '15px',
                backgroundColor: '#f9f9f9',
                borderRadius: '4px',
                border: '1px solid #ddd'
              }}
            />
          </div>
        </div>
      </div>
    );
  };


  const renderSpecialNotesModal = () => {
    if (!selectedRole || !showSpecialNotesModal) return null;

    return (
      <div
        id="special-notes-modal"
        className="recruitment-modal"
      onClick={(e) => {
  if (e.target.id === 'special-notes-modal') {
    // Remove outside click functionality
  }
}}
      >
        <div className="recruitment-modal-content" style={{ maxWidth: '700px' }}>
          <div className="recruitment-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '15px' }}>
            <h2 style={{ flex: 1, margin: 0, paddingRight: '30px' }}>Special Notes & Relevant Experience - {selectedRole.role}</h2>
            <span className="recruitment-close" onClick={closeSpecialNotesModal} style={{ flexShrink: 0, cursor: 'pointer' }}>&times;</span>
          </div>
          <div className="recruitment-modal-body">
            <div
              className="recruitment-special-notes-content"
              dangerouslySetInnerHTML={{
                __html: selectedRole.specialNotes || 'No special notes or relevant experience provided'
              }}
              style={{
                minHeight: '200px',
                padding: '15px',
                backgroundColor: '#f9f9f9',
                borderRadius: '4px',
                border: '1px solid #ddd',
                overflow: 'auto'
              }}
            />
          </div>
        </div>
      </div>
    );
  };

  // NEW: Render Delete Confirmation Modal
  const renderDeleteConfirmModal = () => {
    if (!showDeleteConfirmModal || !roleToDelete) return null;

    // Get application count for this role
    const applicationCount = applicationsData[roleToDelete.id]?.length || 0;

    return (
      <div
        id="delete-confirm-modal"
        className="recruitment-modal"
        onClick={(e) => {
  if (e.target.id === 'delete-confirm-modal') {
    // Remove outside click functionality
  }
}}
      >
        <div className="recruitment-modal-content" style={{ maxWidth: '500px' }}>
          <div className="recruitment-modal-header">
            <h2>Confirm Delete</h2>
            <span className="recruitment-close" onClick={closeDeleteConfirmModal}>&times;</span>
          </div>
          <div className="recruitment-modal-body">
            <p>Are you sure you want to delete this role?</p>
            <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
              <strong style={{ color: '#dc3545' }}>{roleToDelete.role}</strong><br />
              <small>Job ID: {roleToDelete.jobId}</small><br />
              {/* <small>Database ID: {roleToDelete.id} (Type: {typeof roleToDelete.id})</small><br /> */}
              <small>Client: {roleToDelete.client}</small><br />
              <small>Status: {roleToDelete.status}</small>
            </div>
            <div style={{
              marginBottom: '15px',
              padding: '10px',
              backgroundColor: '#fff3cd',
              borderRadius: '4px',
              border: '1px solid #ffeaa7'
            }}>
              <p style={{ color: '#856404', margin: 0, fontSize: '14px' }}>
                ⚠️ This action cannot be undone. The application will be permanently deleted.
              </p>
            </div>
            {applicationCount > 0 && (
              <div style={{
                marginBottom: '15px',
                padding: '10px',
                backgroundColor: '#fff3cd',
                borderRadius: '4px',
                border: '1px solid #ffeaa7'
              }}>
                <p style={{ color: '#856404', margin: 0 }}>
                  ⚠️ This role has {applicationCount} application(s).
                  {roleToDelete.status === 'Cancelled' || roleToDelete.status === 'Closed' ?
                    " Since the role is no longer active, you can safely delete it." :
                    " Deleting will remove all associated applications."
                  }
                </p>
              </div>
            )}

            <div className="recruitment-form-actions">
              <button
                type="button"
                className="recruitment-cancel-btn"
                onClick={closeDeleteConfirmModal}
              >
                Cancel
              </button>
              <button
                type="button"
                className="recruitment-cancel-btn"
                onClick={handleDeleteRole}
                style={{
                  background: 'linear-gradient(135deg, #009688)',
                  color: '#3d3737',
                  border: '2px solid #e1e5e9',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                {applicationCount > 0 ? 'Delete with Applications' : 'Delete Role'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };



  const calculateHiringStepCounts = (applications) => {
  const stepsToUse = hiringSteps && hiringSteps.length > 0 ? hiringSteps : [
    { stepName: 'Applied', stepOrder: 0 },
    { stepName: 'Screening', stepOrder: 1 },
    { stepName: 'Technical Interview', stepOrder: 2 },
    { stepName: 'Manager Interview', stepOrder: 3 },
    { stepName: 'HR Interview', stepOrder: 4 },
    { stepName: 'Offer Extended', stepOrder: 5 },
    { stepName: 'Hired', stepOrder: 6 },
    { stepName: 'Rejected', stepOrder: 7 }
  ];

  // Initialize counts for all steps
  const stepCounts = {};
  stepsToUse.forEach(step => {
    stepCounts[step.stepName] = 0;
  });

  // Count applications in each step
  applications.forEach(app => {
    const currentStepIndex = app.currentStep || 0;
    const currentStep = stepsToUse[currentStepIndex];
    
    if (currentStep) {
      stepCounts[currentStep.stepName]++;
    }
  });

  return stepCounts;
};


const toggleCardExpansion = (appId, e) => {
  e.stopPropagation();
  setExpandedCards(prev => ({
    ...prev,
    [appId]: !prev[appId]
  }));
};

  // Render role applications modal
const renderRoleApplicationsModal = () => {
  if (!selectedRole) return null;

  const applications = applicationsData[selectedRole.id] || [];
  const hiringStepCounts = calculateHiringStepCounts(applications);

  return (
    <>
      <div className="recruitment-role-summary">
        <div className="recruitment-role-header-actions">
          <h3 style={{ color: '#1a6f66ff', marginBottom: '15px' }}>Role Summary</h3>
          <div style={{ display: 'flex', gap: '10px' }}>
           {(isRecruiterView || isTeamLeadView || isManagerView) && (
              <button
                className="recruitment-submit-resume-btn"
                onClick={showResumeSubmission}
              >
                Submit Resume
              </button>
            )}
          </div>
        </div>

        {/* Hiring Step Counts Summary */}
        <div className="recruitment-hiring-summary" style={{
          marginBottom: '15px',
          padding: '12px',
          backgroundColor: '#f8f9fa',
          borderRadius: '6px',
          border: '1px solid #e9ecef'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
            paddingBottom: '8px',
            borderBottom: '1px solid #dee2e6'
          }}>
            <h4 style={{ 
              color: '#1a6f66ff', 
              margin: 0,
              fontSize: '14px',
              fontWeight: '600'
            }}>
              Hiring Progress Summary
            </h4>
            <div style={{
              fontSize: '12px',
              color: '#6c757d',
              fontWeight: '500'
            }}>
              Total: {applications.length}
            </div>
          </div>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '8px'
          }}>
            {Object.entries(hiringStepCounts).map(([stepName, count]) => (
              <div key={stepName} style={{
                padding: '8px',
                backgroundColor: 'white',
                borderRadius: '4px',
                border: '1px solid #dee2e6',
                textAlign: 'center',
                minWidth: '85px'
              }}>
                <div style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: stepName === 'Rejected' ? '#dc3545' : 
                         stepName === 'Hired' ? '#28a745' : '#1a6f66ff',
                  marginBottom: '4px'
                }}>
                  {count}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: '#6c757d',
                  lineHeight: '1.2'
                }}>
                  {stepName}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="recruitment-profile-details">
          <div className="recruitment-detail-item">
            <div className="recruitment-detail-label">Job ID</div>
            <div className="recruitment-detail-value">{selectedRole.jobId || 'N/A'}</div>
          </div>

          <div className="recruitment-detail-item">
            <div className="recruitment-detail-label">GBAMS ID</div>
            <div className="recruitment-detail-value">{selectedRole.gbamsId || 'N/A'}</div>
          </div>
          <div className="recruitment-detail-item">
            <div className="recruitment-detail-label">System ID</div>
            <div className="recruitment-detail-value">{selectedRole.systemId || 'N/A'}</div>
          </div>
          <div className="recruitment-detail-item">
            <div className="recruitment-detail-label">Role Title</div>
            <div className="recruitment-detail-value">{selectedRole.role || 'N/A'}</div>
          </div>

          <div className="recruitment-detail-item">
            <div className="recruitment-detail-label">Role Type</div>
            <div className="recruitment-detail-value">{selectedRole.roleType || 'N/A'}</div>
          </div>
          <div className="recruitment-detail-item">
            <div className="recruitment-detail-label">Created</div>
            <div className="recruitment-detail-value">
              {selectedRole.createdAt ? formatDateTime(selectedRole.createdAt) : 'N/A'}
            </div>
          </div>
          <div className="recruitment-detail-item">
            <div className="recruitment-detail-label">Client</div>
            <div className="recruitment-detail-value">{selectedRole.client || 'N/A'}</div>
          </div>
          <div className="recruitment-detail-item">
            <div className="recruitment-detail-label">Client POC</div>
            <div className="recruitment-detail-value">{selectedRole.clientPOC || 'N/A'}</div>
          </div>
         <div className="recruitment-detail-item">
  <div className="recruitment-detail-label">Location</div>
  <div className="recruitment-detail-value">
    {formatLocation(selectedRole)}
  </div>
</div>
          <div className="recruitment-detail-item">
            <div className="recruitment-detail-label">Work Mode</div>
            <div className="recruitment-detail-value">{selectedRole.roleLocation || 'N/A'}</div>
          </div>
          <div className="recruitment-detail-item">
            <div className="recruitment-detail-label">Experience</div>
            <div className="recruitment-detail-value">{selectedRole.experience || 'N/A'}</div>
          </div>
          <div className="recruitment-detail-item">
            <div className="recruitment-detail-label">Rate Range</div>
            <div className="recruitment-detail-value">
              {formatCurrency(selectedRole.minRate, selectedRole.currency)} -
              {formatCurrency(selectedRole.maxRate, selectedRole.currency)}
              <span style={{ fontSize: '12px', color: '#666', marginLeft: '5px' }}>
                {selectedRole.currency === 'INR' ? 'per month' : 'per hour'}
              </span>
            </div>
          </div>

          <div className="recruitment-detail-item">
  <div className="recruitment-detail-label">Vendor</div>
  <div className="recruitment-detail-value">{selectedRole.vendor || 'N/A'}</div>
</div>

          {/* Visa Types */}
          <div className="recruitment-detail-item">
            <div className="recruitment-detail-label">Visa Types</div>
            <div className="recruitment-detail-value">
              {selectedRole.visaTypes ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  {selectedRole.visaTypes.split(',').map((visaType, index) => (
                    <span
                      key={index}
                      style={{
                        backgroundColor: '#1a6f66ff',
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '12px'
                      }}
                    >
                      {visaType.trim()}
                    </span>
                  ))}
                </div>
              ) : 'N/A'}
            </div>
          </div>
          <div className="recruitment-detail-item">
            <div className="recruitment-detail-label">Urgency</div>
            <div className="recruitment-detail-value">
              <span className={`recruitment-urgency-badge recruitment-urgency-${selectedRole.urgency?.toLowerCase() || 'normal'}`}>
                {selectedRole.urgency || 'Normal'}
              </span>
            </div>
          </div>
          <div className="recruitment-detail-item">
            <div className="recruitment-detail-label">Status</div>
            <div className="recruitment-detail-value">
              <span className={`recruitment-status-badge recruitment-status-${selectedRole.status?.toLowerCase() || 'active'}`}>
                {selectedRole.status || 'Active'}
              </span>
            </div>
          </div>

          <div className="recruitment-detail-item">
            <div className="recruitment-detail-label">Start Date</div>
            <div className="recruitment-detail-value">
              {selectedRole.startDate ? new Date(selectedRole.startDate).toLocaleDateString() : 'N/A'}
            </div>
          </div>
          <div className="recruitment-detail-item">
            <div className="recruitment-detail-label">End Date</div>
            <div className="recruitment-detail-value">
              {selectedRole.endDate ? new Date(selectedRole.endDate).toLocaleDateString() : 'N/A'}
            </div>
          </div>
          <div className="recruitment-detail-item">
            <div className="recruitment-detail-label">Profiles Needed</div>
            <div className="recruitment-detail-value">{selectedRole.profilesNeeded || '1'}</div>
          </div>
          <div className="recruitment-detail-item">
            <div className="recruitment-detail-label">Expense Paid</div>
            <div className="recruitment-detail-value">
              {selectedRole.expensePaid ? 'Yes' : 'No'}
            </div>
          </div>
          <div className="recruitment-detail-item full-width">
            <div className="recruitment-detail-label">Special Notes & Relevant Experience</div>
            <div className="recruitment-detail-value clickable" onClick={showSpecialNotes}>
              Click to view special notes & relevant experience
            </div>
          </div>
          <div className="recruitment-detail-item full-width">
            <div className="recruitment-detail-label">Job Description</div>
            <div className="recruitment-detail-value clickable" onClick={showJobDescription}>
              Click to view full job description
            </div>
          </div>
        </div>
      </div>

      <div className="recruitment-profiles-list">
        <h3 style={{ color: '#1a6f66ff', margin: '20px 0 15px 0' }}>Candidate Applications</h3>
        {applications.length > 0 ? (
          applications.map(app => {
            const isExpanded = expandedCards[app.id];
            
            return (
              <div key={app.id} className="recruitment-profile-card">
                {/* Profile Header */}
                <div className="recruitment-profile-header">
                  <div className="recruitment-profile-name">{app.name}</div>
                  <div className="recruitment-profile-actions">
                    {app.appliedAt && (
                      <div className="recruitment-submission-time" style={{
                        fontSize: '12px',
                        color: '#666',
                        marginBottom: '7px',
                        fontWeight: '700'
                      }}>
                        Submitted: {formatDateTime(app.appliedAt)}
                      </div>
                    )}

                    {app.submittedBy && (
                      <div className="recruitment-submitter-info">
                        Submitted by {app.submittedBy}
                      </div>
                    )}

                    {/* Edit and Delete buttons */}
                    {(isManagerView || userRole === 'user' || userRole === 'teamlead') && (
                      <div className="recruitment-application-actions" style={{
                        display: 'flex',
                        gap: '8px',
                        marginLeft: '50%',
                        alignItems: 'center'
                      }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('Edit button clicked for application:', app.id);
                            openEditApplicationModal(app, e);
                          }}
                          style={{
                            padding: '8px 12px',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            color: '#212529',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minWidth: '36px',
                            height: '36px',
                            transition: 'all 0.2s ease',
                            fontWeight: '500'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.transform = 'scale(1.05)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.transform = 'scale(1)';
                          }}
                          title="Edit Application"
                        >
                          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z" />
                          </svg>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('Delete button clicked for application:', app.id);
                            openDeleteApplicationModal(app, e);
                          }}
                          style={{
                            padding: '8px 12px',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            color: '#212529',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minWidth: '36px',
                            height: '36px',
                            transition: 'all 0.2s ease',
                            fontWeight: '500'
                          }}
                          title="Delete Application"
                        >
                          <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
                            <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" />
                          </svg>
                        </button>

                          {/* ✅ ADD THE ONBOARDING BUTTON HERE - RIGHT AFTER DELETE BUTTON */}
  
                      </div>
                    )}
                  </div>
                </div>

                {/* Profile Details with Show More/Less */}
                <div 
                  className="recruitment-profile-details"
                  onClick={(e) => {
                    if (!e.target.closest('button') && !e.target.closest('.recruitment-application-actions')) {
                      toggleHiringProcess(app.id, e);
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Always Visible - Important Fields */}
                  <div className="recruitment-detail-item">
                    <div className="recruitment-detail-label">Email</div>
                    <div className="recruitment-detail-value">{app.email}</div>
                  </div>
                  <div className="recruitment-detail-item">
                    <div className="recruitment-detail-label">Phone</div>
                    <div className="recruitment-detail-value">{app.phone}</div>
                  </div>
                 <div className="recruitment-detail-item">
                        <div className="recruitment-detail-label">Relevant Experience</div>
                        <div className="recruitment-detail-value">{app.relevantExperience || 'N/A'}</div>
                      </div>
                  <div className="recruitment-detail-item">
                    <div className="recruitment-detail-label">Current Company</div>
                    <div className="recruitment-detail-value">{app?.currentCompany || 'N/A'}</div>
                  </div>
                  <div className="recruitment-detail-item">
                    <div className="recruitment-detail-label">Expected Salary</div>
                    <div className="recruitment-detail-value">{app.expectedSalary || 'N/A'}</div>
                  </div>
                  <div className="recruitment-detail-item">
                    <div className="recruitment-detail-label">Notice Period</div>
                    <div className="recruitment-detail-value">{app.noticePeriod || 'N/A'}</div>
                  </div>
                  <div className="recruitment-detail-item">
                    <div className="recruitment-detail-label">Skills</div>
                    <div className="recruitment-detail-value">{app.skills || 'N/A'}</div>
                  </div>

                  {/* Conditional Fields - Shown Only When Expanded */}
                  {isExpanded && (
                    <>
                      <div className="recruitment-detail-item">
                        <div className="recruitment-detail-label">First Name</div>
                        <div className="recruitment-detail-value">{app.candidateFirstName || 'N/A'}</div>
                      </div>
                      <div className="recruitment-detail-item">
                        <div className="recruitment-detail-label">Last Name</div>
                        <div className="recruitment-detail-value">{app.candidateLastName || 'N/A'}</div>
                      </div>
                      <div className="recruitment-detail-item">
                        <div className="recruitment-detail-label">Date of Birth</div>
                        <div className="recruitment-detail-value">{app.dateOfBirth || 'N/A'}</div>
                      </div>
                      <div className="recruitment-detail-item">
                        <div className="recruitment-detail-label">Work Authorization</div>
                        <div className="recruitment-detail-value">{app.workAuthorization || 'N/A'}</div>
                      </div>
                      <div className="recruitment-detail-item">
                        <div className="recruitment-detail-label">Rate</div>
                        <div className="recruitment-detail-value">{app.rate || 'N/A'}</div>
                      </div>
                      <div className="recruitment-detail-item">
                        <div className="recruitment-detail-label">Current Location</div>
                        <div className="recruitment-detail-value">{app.currentLocation || 'N/A'}</div>
                      </div>
                      <div className="recruitment-detail-item">
                        <div className="recruitment-detail-label">LinkedIn</div>
                        <div className="recruitment-detail-value">
                          {app.linkedInUrl ? (
                            <a href={app.linkedInUrl} target="_blank" rel="noopener noreferrer">
                              View Profile
                            </a>
                          ) : 'N/A'}
                        </div>
                      </div>
                      <div className="recruitment-detail-item">
                        <div className="recruitment-detail-label">Passport</div>
                        <div className="recruitment-detail-value">{app.passport || 'N/A'}</div>
                      </div>
                      <div className="recruitment-detail-item">
                        <div className="recruitment-detail-label">Total IT Experience</div>
                        <div className="recruitment-detail-value">{app.totalITExperience || 'N/A'}</div>
                      </div>
                  
                      <div className="recruitment-detail-item">
                        <div className="recruitment-detail-label">Highest Degree</div>
                        <div className="recruitment-detail-value">{app.highestDegree || 'N/A'}</div>
                      </div>
                      <div className="recruitment-detail-item">
                        <div className="recruitment-detail-label">Current Employer</div>
                        <div className="recruitment-detail-value">{app.currentEmployer || 'N/A'}</div>
                      </div>
                      <div className="recruitment-detail-item">
                        <div className="recruitment-detail-label">Current Employer Address</div>
                        <div className="recruitment-detail-value">{app.currentEmployerAddress || 'N/A'}</div>
                      </div>
                      <div className="recruitment-detail-item">
                        <div className="recruitment-detail-label">Former TCS Employee</div>
                        <div className="recruitment-detail-value">{app.isFormerTCSEmployee ? 'Yes' : 'No'}</div>
                      </div>
                      {app.isFormerTCSEmployee && (
                        <div className="recruitment-detail-item">
                          <div className="recruitment-detail-label">TCS Employee ID</div>
                          <div className="recruitment-detail-value">{app.tcsEmployeeId || 'N/A'}</div>
                        </div>
                      )}
                      <div className="recruitment-detail-item">
                        <div className="recruitment-detail-label">Former TCS Business Associate</div>
                        <div className="recruitment-detail-value">{app.isFormerTCSBusinessAssociate ? 'Yes' : 'No'}</div>
                      </div>
                      {app.isFormerTCSBusinessAssociate && (
                        <div className="recruitment-detail-item">
                          <div className="recruitment-detail-label">TCS Business Associate ID</div>
                          <div className="recruitment-detail-value">{app.tcsBusinessAssociateId || 'N/A'}</div>
                        </div>
                      )}
                      <div className="recruitment-detail-item">
                        <div className="recruitment-detail-label">Date Availability</div>
                        <div className="recruitment-detail-value">{app.dateAvailability || 'N/A'}</div>
                      </div>
                    </>
                  )}

                  {/* Resume Files Display - Always Visible */}
                  <div className="recruitment-detail-item">
                    <div className="recruitment-detail-label">Resumes</div>
                    <div className="recruitment-detail-value">
                      {applicationResumes[app.id] && applicationResumes[app.id].length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {applicationResumes[app.id].map((resume) => (
                            <div key={resume.id} style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '8px',
                              backgroundColor: '#f8f9fa',
                              borderRadius: '4px',
                              border: '1px solid #e9ecef'
                            }}>
                              <button
                                className="recruitment-view-resume-link"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  viewResume(resume.id, app.id, e);
                                }}
                                disabled={resumeLoading}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#4c63d2',
                                  textDecoration: 'underline',
                                  cursor: resumeLoading ? 'wait' : 'pointer',
                                  padding: '0',
                                  font: 'inherit',
                                  textAlign: 'left'
                                }}
                              >
                                {resume.resumeFileName}
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : app.resumeCount > 0 ? (
                        <div style={{ color: '#666', fontStyle: 'italic' }}>
                          {app.resumeCount} file(s) uploaded
                          <button
                            onClick={() => fetchApplicationResumes(app.id)}
                            style={{
                              marginLeft: '10px',
                              padding: '4px 8px',
                              backgroundColor: '#f8f9fa',
                              border: '1px solid #ddd',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            Load Resumes
                          </button>
                        </div>
                      ) : (
                        'No resumes uploaded'
                      )}
                    </div>
                  </div>

                  {/* Show More/Less Toggle Button */}
                 {/* Show More/Less Toggle Button */}
<div className="recruitment-detail-item" style={{ 
  textAlign: 'center', 
  marginTop: '25px',
  width: '100%'
}}>
  <button
    onClick={(e) => toggleCardExpansion(app.id, e)}
    style={{
      padding: '8px 16px',
      backgroundColor: 'rgb(248, 249, 250)',
      border: '1px solid #dfe9f1ff',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '12px',
      color: 'black',
      fontWeight: '500',
      width: '120px',
      minWidth: '120px',
      transition: 'all 0.2s ease'
    }}
 
  >
    {isExpanded ? 'Show Less' : 'Show More'}
  </button>
</div>
                </div>

                {/* Hiring Progress Section */}
               {/* Hiring Progress Section */}
<div className="recruitment-hiring-progress">
  <div className="recruitment-progress-header">
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        <span>
          <strong>Current Step:</strong>{' '}
          {app.status === 'Rejected' || (hiringSteps[app.currentStep]?.stepName === 'Rejected') 
            ? 'Rejected' 
            : hiringSteps[app.currentStep]?.stepName === 'Hired'
              ? 'Hired'
              : hiringSteps[app.currentStep]?.stepName ||
                (app.currentStep === 0 ? 'Applied' : `Step ${app.currentStep + 1}`)}
        </span>
        <button
          onClick={(e) => openStepNotesPopup(app, e)}
          style={{
            marginLeft: '10px',
            padding: '4px 8px',
            backgroundColor: '#1a6f66ff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '11px',
            fontWeight: '500',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#145c54';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#1a6f66ff';
          }}
          title="View all hiring process step notes"
        >
          About this Profile
        </button>
      </div>

      {/* ✅ ADD THE HIRED CANDIDATE SECTION HERE - RIGHT AFTER THE "About this Profile" BUTTON */}
      {app.status === 'Hired' && (
        <div style={{ 
          marginTop: '10px', 
          padding: '8px', 
          backgroundColor: '#d4edda', 
          borderRadius: '4px',
          border: '1px solid #c3e6cb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ color: '#155724', fontWeight: '600' }}>
            ✓ Candidate Hired
          </span>
          <button
            onClick={(e) => goToCandidateOnboarding(app, e)}
            style={{
              padding: '6px 12px',
              backgroundColor: '#1a6f66ff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#145c54';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#1a6f66ff';
            }}
          >
            Go to Onboarding
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm0 14.5a6.5 6.5 0 1 1 0-13 6.5 6.5 0 0 1 0 13z"/>
              <path d="M10.5 8L7 10.5v-5L10.5 8z"/>
            </svg>
          </button>
        </div>
      )}

      {/* Step notes display section */}
      {applicationNotes[app.id]?.[app.currentStep || 0] && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            setExpandedNotes(prev => ({
              ...prev,
              [app.id]: !prev[app.id]
            }));
          }}
          style={{
            fontSize: '13px',
            color: '#302f2fff',
            cursor: 'pointer',
            lineHeight: '1.4',
            marginTop: '2px',
            backgroundColor: '#f8f9fa',
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #e9ecef'
          }}
        >
          {expandedNotes[app.id] ? (
            <>
              <div style={{ whiteSpace: 'pre-wrap', marginBottom: '5px' }}>
                {applicationNotes[app.id][app.currentStep || 0]}
              </div>
              <span style={{
                color: '#1a6f66ff',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                Click to collapse notes
              </span>
            </>
          ) : (
            <>
              {applicationNotes[app.id][app.currentStep || 0].substring(0, 80)}
              {applicationNotes[app.id][app.currentStep || 0].length > 80 && (
                <>
                  ...
                  <span style={{
                    color: '#1a6f66ff',
                    marginLeft: '5px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    (click to see more)
                  </span>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>

    <span className="recruitment-step-number">
      {app.status === 'Rejected' || (hiringSteps[app.currentStep]?.stepName === 'Rejected') 
        ? 'Rejected' 
        : hiringSteps[app.currentStep]?.stepName === 'Hired'
          ? '9/9'
          : `${(app.currentStep || 0) + 1}/${hiringSteps.length || 7}`}
    </span>
  </div>

  <div className="recruitment-progress-bar">
    <div
      className="recruitment-progress-fill"
      style={{
        width: app.status === 'Rejected' || (hiringSteps[app.currentStep]?.stepName === 'Rejected') 
          ? '100%' 
          : hiringSteps[app.currentStep]?.stepName === 'Hired'
            ? '100%'
            : `${(((app.currentStep || 0) + 1) / (hiringSteps.length || 8)) * 100}%`,
        backgroundColor: app.status === 'Rejected' || (hiringSteps[app.currentStep]?.stepName === 'Rejected') 
          ? '#e74c3c' 
          : hiringSteps[app.currentStep]?.stepName === 'Hired'
            ? '#27ae60'
            : '#1a6f66ff'
      }}
    ></div>
  </div>
</div>

                {showHiringProcess[app.id] && (
                  <div className="recruitment-hiring-process">
                    {generateHiringSteps(app, selectedRole.id)}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="recruitment-no-applications">No applications yet for this role.</div>
        )}
      </div>
    </>
  );
};




  // Render role cards for team leads with assign to recruiter functionality
  // Render role cards for team leads with assign to recruiter functionality
  const renderRoleCardsForTeamLead = () => {
   return currentRoles.map(role => {
      const urgencyClass = role.urgency.toLowerCase();
      const statusClass = role.status.toLowerCase();
      const isEndingSoon = isRoleEndingSoon(role.endDate);

      return (
        <div
          key={role.id}
          className={`recruitment-role-card ${isEndingSoon ? 'recruitment-role-ending-soon' : ''}`}
          onClick={() => showRoleApplications(role)}
        >
          {isEndingSoon && (
            <div className="recruitment-ending-soon-banner">
              Ending Soon!
            </div>
          )}

          {/* NEW: Assign Multiple Recruiters button for team leads (same as managers) */}
          {(isManagerView || userRole === 'teamlead') && (
            <div className="recruitment-card-actions" style={{
              position: 'absolute',
              top: '10px',
              display: 'flex',
              gap: '5px',
              zIndex: 2
            }}>

             
{/* <button
  onClick={(e) => openCopyRoleModal(role, e)}
  style={{
    padding: '4px 8px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  }}
  title="Copy Role with New Recruiters"
>
  <i className="fas fa-copy"></i>
  Copy
</button> */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setRoleToPromote(role);
                  setShowPromoteModal(true);
                }}
                style={{
                  padding: '4px 8px',
                  backgroundColor: '#67d982ff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: 'bold'
                }}
                title="Promote Role"
              >
                <Megaphone size={14} /> Promote
              </button>

              <button
                onClick={(e) => openMultipleAssignModal(role, e)}
                style={{
                  padding: '4px 8px',
                  backgroundColor: '#28a77fff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
                title="Assign Multiple Recruiters"
              >
                <i className="fas fa-users"></i> Assign
              </button>

              <button
                onClick={(e) => openEditRoleModal(role, e)}
                style={{
                  padding: '4px 8px',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
                title="Edit Role"
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z" />
                </svg>
              </button>

              {/* ADDED: Delete button */}
              <button
                onClick={(e) => openDeleteConfirmModal(role, e)}
                style={{
                  padding: '4px 8px',
                  color: '#3d3737',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
                title="Delete Role"
              >
                <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
                  <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" />
                </svg>
              </button>
            </div>
          )}

          <div className="recruitment-role-header">
            <div className="recruitment-role-title">{role.role}</div>
            <div className={`recruitment-role-count recruitment-applications-badge`}>
              {role.applicationCount} {role.applicationCount === 1 ? 'Application' : 'Applications'}
            </div>
          </div>
          <div className="recruitment-role-details">
            <div className="recruitment-role-detail">
              <span><strong>Job ID:</strong> {role.jobId || 'N/A'}</span>
            </div>
            <div className="recruitment-role-detail">
              <span><strong>Created:</strong> {formatDateTime(role.createdAt)}</span>
            </div>
            <div className="recruitment-role-detail">
              <span><strong>Client:</strong> {role.client}</span>
              <span className={`recruitment-status-badge recruitment-status-${statusClass}`}>{role.status}</span>
            </div>
            <div className="recruitment-role-detail location-with-badge">
              <div className="location-content">
                <strong>Location:</strong>
                <span className="location-text">{formatLocation(role)}</span>
              </div>
              <span className={`recruitment-mode-badge recruitment-mode-${role.roleLocation?.toLowerCase() || 'onsite'}`}>
                {role.roleLocation || 'Onsite'}
              </span>
              {role.roleCategory?.trim().toLowerCase() === 'offshore' && (
                <span className="recruitment-mode-badge recruitment-mode-offshore" style={{ background: '#0f5b55', color: '#fff', marginLeft: '8px' }}>
                  OFFSHORE
                </span>
              )}
            </div>
            <div className="recruitment-role-detail">
              <span><strong>Experience:</strong> {role.experience}</span>
              <span className={`recruitment-urgency-badge recruitment-urgency-${urgencyClass}`}>{role.urgency}</span>
            </div>
            <div className="recruitment-role-detail">
              <span>
                <strong>Rate:</strong>
                {formatCurrency(role.minRate, role.currency)} - {formatCurrency(role.maxRate, role.currency)}
                <span className="rate-period">
                  {role.currency === 'INR' ? '/month' : '/hr'}
                </span>
              </span>
            </div>
            <div className="recruitment-role-detail">
              <span><strong>Role Owner:</strong> {role.assignTo || <span className="text-muted"><i className="fas fa-user-slash me-1"></i>Unassigned</span>}</span>
            </div>
            <div className="recruitment-role-detail">
              <span><strong>Assigned Recruiters:</strong> {renderAssignedRecruiters(role)}</span>
            </div>

            {role.endDate && (
              <div className="recruitment-role-detail">
                <span><strong>End Date:</strong> {new Date(role.endDate).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>
      );
    });
  };


  // State for assign recruiter modal
  const [showAssignRecruiterModal, setShowAssignRecruiterModal] = useState(false);
  const [roleToAssign, setRoleToAssign] = useState(null);
  const [selectedRecruiter, setSelectedRecruiter] = useState('');

  // Open assign recruiter modal
  const openAssignRecruiterModal = (role, e) => {
    e.stopPropagation();
    setRoleToAssign(role);
    setSelectedRecruiter(role.assignTo || '');
    setShowAssignRecruiterModal(true);
  };

  // Close assign recruiter modal
  const closeAssignRecruiterModal = () => {
    setShowAssignRecruiterModal(false);
    setRoleToAssign(null);
    setSelectedRecruiter('');
  };

  // Handle assign recruiter
  const handleAssignRecruiter = async () => {
    if (!roleToAssign || !selectedRecruiter) return;

    try {
      const token = localStorage.getItem('token');

      // Find the recruiter ID from the selected name
      const selectedRecruiterObj = recruiters.find(r => r.name === selectedRecruiter);

      if (!selectedRecruiterObj) {
        showNotification('Selected recruiter not found');
        return;
      }

      await axios.post(
        `${BASE_URL}/api/recruitment/roles/${roleToAssign.id}/assign-recruiter`,
        { recruiterId: selectedRecruiterObj.id },  // Send ID instead of name
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Refresh roles data
      const rolesResponse = await axios.get(`${BASE_URL}/api/recruitment/roles`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRolesData(rolesResponse.data);

      closeAssignRecruiterModal();
      showNotification('Role assigned to recruiter successfully!');
    } catch (error) {
      console.error('Error assigning recruiter:', error);
      showNotification('Failed to assign role to recruiter. Please try again.');
    }
  };
  // Render assign recruiter modal
  const renderAssignRecruiterModal = () => {
    if (!showAssignRecruiterModal || !roleToAssign) return null;

    // Filter to only show recruiters with role 'user'
    const recruiterUsers = recruiters.filter(recruiter =>
      recruiter.role === 'user' || !recruiter.role // handle cases where role might be undefined
    );

    return (
      <div
        id="assign-recruiter-modal"
        className="recruitment-modal"
       onClick={(e) => {
  if (e.target.id === 'assign-recruiter-modal') {
    // Remove outside click functionality
  }
}}
      >
        <div className="recruitment-modal-content" style={{ maxWidth: '500px' }}>
          <div className="recruitment-modal-header">
            <h2>Assign Role to Recruiter</h2>
            <span className="recruitment-close" onClick={closeAssignRecruiterModal}>&times;</span>
          </div>
          <div className="recruitment-modal-body">
            <div style={{ marginBottom: '15px' }}>
              <p><strong>Role:</strong> {roleToAssign.role}</p>
              <p><strong>Client:</strong> {roleToAssign.client}</p>
            </div>

            <div className="recruitment-form-group">
              <label>Select Recruiter</label>
              <select
                value={selectedRecruiter}
                onChange={(e) => setSelectedRecruiter(e.target.value)}
                className="recruitment-add-role-select"
              >
                <option value="">Select Recruiter</option>
                {recruiterUsers.map((recruiter, index) => (
                  <option key={index} value={recruiter.name}>{recruiter.name}</option>
                ))}
              </select>
            </div>

            <div className="recruitment-form-actions">
              <button
                type="button"
                className="recruitment-cancel-btn"
                onClick={closeAssignRecruiterModal}
              >
                Cancel
              </button>
              <button
                type="button"
                className="recruitment-submit-btn"
                onClick={handleAssignRecruiter}
                disabled={!selectedRecruiter}
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render role cards (UPDATED with Edit and Delete buttons)
  const renderRoleTable = () => {
    return (
      <div className="table-responsive">
        <table className="table recruitment-roles-table" style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa', color: '#555', textAlign: 'left', borderBottom: '2px solid #eaebec' }}>
              <th style={{ padding: '8px 15px', fontWeight: 'bold', fontSize: '12px' }}>JOB ID</th>
              <th style={{ padding: '8px 15px', fontWeight: 'bold', fontSize: '12px' }}>ROLE TITLE</th>
              <th style={{ padding: '8px 15px', fontWeight: 'bold', fontSize: '12px' }}>WORK MODE</th>
              <th style={{ padding: '8px 15px', fontWeight: 'bold', fontSize: '12px' }}>LOCATION</th>
              <th style={{ padding: '8px 15px', fontWeight: 'bold', fontSize: '12px' }}>EXPERIENCE</th>
              <th style={{ padding: '8px 15px', fontWeight: 'bold', fontSize: '12px' }}>RATE</th>
              <th style={{ padding: '8px 15px', fontWeight: 'bold', fontSize: '12px' }}>STATUS</th>
              <th style={{ padding: '8px 15px', fontWeight: 'bold', textAlign: 'center', fontSize: '12px' }}>APPLICATIONS</th>
              <th style={{ padding: '8px 15px', fontWeight: 'bold', fontSize: '12px' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {currentRoles.map(role => {
              const statusClass = role.status.toLowerCase();
              return (
                <tr key={role.id} onClick={() => showRoleApplications(role)} style={{ cursor: 'pointer', borderBottom: '1px solid #eaebec', fontSize: '13px' }}>
                  <td style={{ padding: '8px 15px', color: '#009688', fontWeight: '500' }}>{role.jobId || 'N/A'}</td>
                  <td style={{ padding: '8px 15px', fontWeight: '500' }}>
                    {role.role && role.role.length > 23 ? (
                      <span title={role.role} style={{ cursor: 'help' }}>
                        {role.role.substring(0, 23)}...
                      </span>
                    ) : role.role}
                  </td>
                  <td style={{ padding: '8px 15px' }}>
                    <span className={`recruitment-mode-badge recruitment-mode-${role.roleLocation?.toLowerCase() || 'onsite'}`}>
                      {role.roleLocation || 'Onsite'}
                    </span>
                    {role.roleCategory?.trim().toLowerCase() === 'offshore' && (
                      <span className="recruitment-mode-badge recruitment-mode-offshore" style={{ background: '#0f5b55', color: '#fff', marginLeft: '8px' }}>
                        OFFSHORE
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '8px 15px' }}>
                    {(() => {
                      const locationStr = formatLocation(role);
                      if (!locationStr || locationStr === 'N/A') return 'N/A';
                      const locations = locationStr.split(' | ');
                      
                      if (locations.length <= 1) {
                        return locationStr.length > 19 ? (
                          <span title={locationStr} style={{ cursor: 'help' }}>
                            {locationStr.substring(0, 19)}...
                          </span>
                        ) : locationStr;
                      }
                      
                      // For multiple locations
                      const displayStr = locations.slice(0, 1).join(' | ');
                      return (
                        <div style={{ display: 'flex', alignItems: 'center' }} title={locations.join('\n')}>
                          <span>
                            {displayStr.length > 19 ? displayStr.substring(0, 19) + '...' : displayStr}
                          </span>
                          <span style={{ 
                            color: '#009688', 
                            fontWeight: 'bold', 
                            marginLeft: '5px', 
                            cursor: 'help',
                            fontSize: '11px',
                            backgroundColor: '#e0f2f1',
                            padding: '2px 6px',
                            borderRadius: '10px',
                            whiteSpace: 'nowrap'
                          }}>
                            +{locations.length - 1}
                          </span>
                        </div>
                      );
                    })()}
                  </td>
                  <td style={{ padding: '8px 15px' }}>{role.experience}</td>
                  <td style={{ padding: '8px 15px' }}>{formatCurrency(role.minRate, role.currency)} - {formatCurrency(role.maxRate, role.currency)}</td>
                  <td style={{ padding: '8px 15px' }}>
                    <span className={`recruitment-status-badge recruitment-status-${statusClass}`}>{role.status}</span>
                  </td>
                  <td style={{ padding: '8px 15px', textAlign: 'center' }}>
                    <div style={{ display: 'inline-block', backgroundColor: '#e2f5ec', color: '#009688', padding: '4px 12px', borderRadius: '15px', fontWeight: 'bold', fontSize: '12px' }}>
                      {role.applicationCount}
                    </div>
                  </td>
                  <td style={{ padding: '8px 15px' }} onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {(isManagerView || userRole === 'teamlead') && (
                        <button
                          onClick={(e) => openMultipleAssignModal(role, e)}
                          style={{ padding: '4px 8px', backgroundColor: '#28a77fff', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                          title="Assign Multiple Recruiters"
                        >
                          <UserPlus size={14} /> Assign
                        </button>
                      )}
                      <button
                        onClick={(e) => openPromoteModal(role, e)}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#67d982ff',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontWeight: 'bold'
                        }}
                        title="Promote Role"
                      >
                        <Megaphone size={14} /> Promote
                      </button>
                      {(isManagerView || userRole === 'teamlead') && (
                        <>
                          <button
                            onClick={(e) => openEditRoleModal(role, e)}
                            style={{ padding: '4px 8px', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '12px', background: 'white' }}
                            title="Edit Role"
                          >
                            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                              <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => openDeleteConfirmModal(role, e)}
                            style={{ padding: '4px 8px', color: '#3d3737', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '12px', background: 'white' }}
                            title="Delete Role"
                          >
                            <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
                              <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
                              <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" />
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderRoleCards = () => {
    return currentRoles.map(role => {
      const urgencyClass = role.urgency.toLowerCase();
      const statusClass = role.status.toLowerCase();
      const isEndingSoon = isRoleEndingSoon(role.endDate);


      return (
        <div
          key={role.id}
          className={`recruitment-role-card ${isEndingSoon ? 'recruitment-role-ending-soon' : ''}`}
          onClick={() => showRoleApplications(role)}
        >
          {isEndingSoon && (
            <div className="recruitment-ending-soon-banner">
              Ending Soon!
            </div>
          )}

          {/* Action buttons */}
          <div className="recruitment-card-actions" style={{
            position: 'absolute',
            top: '10px',
            display: 'flex',
            gap: '5px',
            zIndex: 2
          }}>
            {(isManagerView || userRole === 'teamlead') && (
              <button
                onClick={(e) => openMultipleAssignModal(role, e)}
                style={{
                  padding: '4px 8px',
                  backgroundColor: '#28a77fff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="Assign Multiple Recruiters"
              >
                <UserPlus size={14} /> Assign
              </button>
            )}

            <button
              onClick={(e) => openPromoteModal(role, e)}
              style={{
                padding: '4px 8px',
                backgroundColor: '#71d989ff',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontWeight: 'bold'
              }}
              title="Promote Role"
            >
              <Megaphone size={14} /> Promote
            </button>

            {(isManagerView || userRole === 'teamlead') && (
              <>
                <button
                  onClick={(e) => openEditRoleModal(role, e)}
                  style={{
                    padding: '4px 8px',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                  title="Edit Role"
                >
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z" />
                  </svg>
                </button>

                <button
                  onClick={(e) => openDeleteConfirmModal(role, e)}
                  style={{
                    padding: '4px 8px',
                    color: '#3d3737',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                  title="Delete Role"
                >
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
                    <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" />
                  </svg>
                </button>
              </>
            )}
          </div>

          <div className="recruitment-role-header">
            <div className="recruitment-role-title">{role.role}</div>
            <div className={`recruitment-role-count recruitment-applications-badge`}>
              {role.applicationCount} {role.applicationCount === 1 ? 'Application' : 'Applications'}
            </div>
          </div>
          <div className="recruitment-role-details">
            <div className="recruitment-role-detail">
              <span><strong>Job ID:</strong> {role.jobId || 'N/A'}</span>
            </div>


            <div className="recruitment-role-detail">
              <span><strong>Created:</strong> {formatDateTime(role.createdAt)}</span>
            </div>
            <div className="recruitment-role-detail">
              <span><strong>Client:</strong> {role.client}</span>
              <span className={`recruitment-status-badge recruitment-status-${statusClass}`}>{role.status}</span>
            </div>
            <div className="recruitment-role-detail location-with-badge">
              <div className="location-content">
                <strong>Location:</strong>
                <span className="location-text">{formatLocation(role)}</span>
              </div>
              <span className={`recruitment-mode-badge recruitment-mode-${role.roleLocation?.toLowerCase() || 'onsite'}`}>
                {role.roleLocation || 'Onsite'}
              </span>
              {role.roleCategory?.trim().toLowerCase() === 'offshore' && (
                <span className="recruitment-mode-badge recruitment-mode-offshore" style={{ background: '#0f5b55', color: '#fff', marginLeft: '8px' }}>
                  OFFSHORE
                </span>
              )}
            </div>
            <div className="recruitment-role-detail">
              <span><strong>Experience:</strong> {role.experience}</span>
              <span className={`recruitment-urgency-badge recruitment-urgency-${urgencyClass}`}>{role.urgency}</span>
            </div>
            <div className="recruitment-role-detail">
              <span>
                <strong>Rate:</strong>
                {formatCurrency(role.minRate, role.currency)} - {formatCurrency(role.maxRate, role.currency)}
                <span className="rate-period">
                  {role.currency === 'INR' ? '/month' : '/hr'}
                </span>
              </span>
            </div>

            <div className="recruitment-role-detail">
              <span><strong>Role Owner:</strong> {role.assignTo || <span className="text-muted"><i className="fas fa-user-slash me-1"></i>Unassigned</span>}</span>
            </div>
            <div className="recruitment-role-detail">
              <span><strong>Assigned Recruiters:</strong> {renderAssignedRecruiters(role)}</span>
            </div>
            {role.endDate && (
              <div className="recruitment-role-detail">
                <span><strong>End Date:</strong> {new Date(role.endDate).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>
      );
    });
  };

  const [recruiterSearchTerm, setRecruiterSearchTerm] = useState('');


   const renderNoResults = () => {
    return (
      <div className="recruitment-no-results">
        No roles found matching your criteria.
        {filteredRoles.length > 0 && (
          <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
            Showing page {currentPage} of {totalPages}
          </div>
        )}
      </div>
    );
  };

  // Add this function to render the multiple assign modal
  const renderMultipleAssignModal = () => {
    if (!showMultipleAssignModal || !roleToAssign) return null;

    return (
      <div
        id="multiple-assign-modal"
        className="recruitment-modal"
      onClick={(e) => {
  if (e.target.id === 'multiple-assign-modal') {
    // Remove outside click functionality
  }
}}
      >
        <div className="recruitment-modal-content" style={{ maxWidth: '600px' }}>
          <div className="recruitment-modal-header">
            <h2>Assign Recruiters to Role</h2>
            <span className="recruitment-close" onClick={closeMultipleAssignModal}>&times;</span>
          </div>
          <div className="recruitment-modal-body">
            <div style={{ marginBottom: '15px' }}>
              <p><strong>Role:</strong> {roleToAssign.role}</p>
              <p><strong>Client:</strong> {roleToAssign.client}</p>
            </div>

            <div className="recruitment-form-group">
              <label>Select Recruiters</label>
              <div className="assign-to-container">
                <input
                  type="text"
                  className="recruitment-add-role-input"
                  placeholder="Search recruiters..."
                  value={recruiterSearchTerm}
                  onChange={(e) => setRecruiterSearchTerm(e.target.value)}
                  onFocus={() => setShowRecruiterDropdown(true)}
                  onBlur={() => setTimeout(() => setShowRecruiterDropdown(false), 200)}
                />

                {/* Selected recruiters display */}
                <div className="selected-recruiters" style={{ marginTop: '10px', marginBottom: '10px' }}>
                  {selectedRecruiters.map(recruiterId => {
                    const recruiter = recruiters.find(r => r.id === recruiterId);
                    return recruiter ? (
                      <span key={recruiterId} className="badge bg-primary me-1 mb-1">
                        {recruiter.name}
                        {/* {recruiter.role && recruiter.role !== 'user' && `(${recruiter.role})`} */}
                        <button
                          type="button"
                          className="btn-close btn-close-white ms-1"
                          onClick={() => handleRecruiterSelection(recruiterId)}
                          style={{ fontSize: '10px' }}
                        ></button>
                      </span>
                    ) : null;
                  })}
                </div>

                {/* Dropdown for recruiter selection */}
                {showRecruiterDropdown && (
                  <div className="recruiter-dropdown" style={{
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    backgroundColor: 'white',
                    zIndex: 1000
                  }}>
                    {recruiters
                      .filter(recruiter => {
                        // Search filtering using state
                        const matchesSearch = recruiter.name.toLowerCase().includes(recruiterSearchTerm.toLowerCase());

                        if (isManagerView) {
                          return matchesSearch; // Show filtered recruiters for managers
                        }
                        else if (userRole === 'teamlead') {
                          // Team leads can see regular users AND other team leads (including themselves)
                          return (recruiter.role === 'user' || recruiter.role === 'teamlead') && matchesSearch;
                        }
                        return false;
                      })
                      .map((recruiter, index) => (
                        <div
                          key={index}
                          className={`recruiter-option ${selectedRecruiters.includes(recruiter.id) ? 'selected' : ''}`}
                          onClick={() => handleRecruiterSelection(recruiter.id)}
                          style={{
                            padding: '8px 12px',
                            cursor: 'pointer',
                            borderBottom: '1px solid #f0f0f0',
                            backgroundColor: selectedRecruiters.includes(recruiter.id) ? '#ebeff1ff' : 'transparent'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedRecruiters.includes(recruiter.id)}
                            readOnly
                            style={{ marginRight: '8px' }}
                          />
                          <span>
                            {recruiter.name}
                            {/* {recruiter.role && recruiter.role !== 'user' && ` (${recruiter.role})`} */}
                          </span>
                        </div>
                      ))
                    }
                  </div>
                )}
              </div>
            </div>

            <div className="recruitment-form-actions">
              <button
                type="button"
                className="recruitment-cancel-btn"
                onClick={closeMultipleAssignModal}
              >
                Cancel
              </button>
              <button
                type="button"
                className="recruitment-submit-btn"
                onClick={handleMultipleRecruiterAssignment}
                disabled={selectedRecruiters.length === 0}
              >
                Assign Recruiters
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };


  // Render Delete Application Confirmation Modal
  const renderDeleteApplicationModal = () => {
    if (!showDeleteApplicationModal || !applicationToDelete) return null;

    return (
      <div
        id="delete-application-modal"
        className="recruitment-modal"
       onClick={(e) => {
  if (e.target.id === 'delete-application-modal') {
    // Remove outside click functionality
  }
}}
      >
        <div className="recruitment-modal-content" style={{ maxWidth: '500px' }}>
          <div className="recruitment-modal-header">
            <h2>Confirm Delete</h2>
            <span className="recruitment-close" onClick={closeDeleteApplicationModal}>&times;</span>
          </div>
          <div className="recruitment-modal-body">
            <p>Are you sure you want to delete this application?</p>
            <div style={{
              marginBottom: '15px',
              padding: '10px',
              backgroundColor: '#f8f9fa',
              borderRadius: '4px',
              border: '1px solid #e9ecef'
            }}>
              <strong style={{ color: '#dc3545' }}>{applicationToDelete.name}</strong><br />
              <small>Email: {applicationToDelete.email}</small><br />
              <small>Phone: {applicationToDelete.phone}</small><br />
              <small>Experience: {applicationToDelete.experience}</small>
            </div>

            <div style={{
              marginBottom: '15px',
              padding: '10px',
              backgroundColor: '#fff3cd',
              borderRadius: '4px',
              border: '1px solid #ffeaa7'
            }}>
              <p style={{ color: '#856404', margin: 0, fontSize: '14px' }}>
                ⚠️ This action cannot be undone. The application will be permanently deleted.
              </p>
            </div>

            <div className="recruitment-form-actions" >
              <button
                type="button"
                className="recruitment-cancel-btn"
                onClick={closeDeleteApplicationModal}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="recruitment-delete-btn"
                onClick={handleDeleteApplication}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#009688',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Delete Application
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const openPromoteModal = (role, e) => {
    e.stopPropagation();
    setRoleToPromote(role);
    setShowPromoteModal(true);
  };

  const closePromoteModal = () => {
    setShowPromoteModal(false);
    setShowLinkedinPreview(false);
    setShowFacebookOptions(false);
    setShowLinkedinOptions(false);
    setLinkedinSelectedPlatform('LinkedIn');
    setRoleToPromote(null);
  };

  const renderPromoteModal = () => {
    if (!showPromoteModal || !roleToPromote) return null;

    const shareUrl = `${window.location.origin}/job/${roleToPromote.id}`;

    const stripHtml = (html) => {
      if (!html) return '';
      // Better handling of block elements to prevent bunched text
      let text = html;
      text = text.replace(/<p[^>]*>/gi, '\n');
      text = text.replace(/<\/p>/gi, '\n');
      text = text.replace(/<br\s*\/?>/gi, '\n');
      text = text.replace(/<div[^>]*>/gi, '\n');
      text = text.replace(/<\/div>/gi, '\n');
      text = text.replace(/<h[1-6][^>]*>/gi, '\n');
      text = text.replace(/<\/h[1-6]>/gi, '\n');
      text = text.replace(/<li[^>]*>/gi, '\n* ');
      text = text.replace(/<\/li>/gi, '\n');
      
      // Remove all other HTML tags
      text = text.replace(/<[^>]+>/g, '');
      
      // Clean up multiple newlines to keep it professional
      text = text.replace(/\n\s*\n\s*\n/g, '\n\n');
      
      // Decode HTML entities
      const textArea = document.createElement('textarea');
      textArea.innerHTML = text;
      return textArea.value.trim();
    };

    const generateDefaultPostText = () => {
      const cleanRole = roleToPromote.role ? roleToPromote.role.replace(/[^a-zA-Z0-9]/g, '') : 'TechRole';
      const locationString = formatLocation(roleToPromote) || 'Remote';
      
      // Extract recruiter emails dynamically
      let recruiterEmails = [];
      let assignedRecruitersList = roleToPromote.assignedRecruiters || [];
      if (typeof assignedRecruitersList === 'string') {
        try { assignedRecruitersList = JSON.parse(assignedRecruitersList); } catch (e) { assignedRecruitersList = []; }
      }
      
      if (Array.isArray(assignedRecruitersList) && assignedRecruitersList.length > 0) {
        assignedRecruitersList.forEach(item => {
          const recId = typeof item === 'object' ? (item.id || item._id) : item;
          if (!recId) return;
          const foundRec = recruiters.find(r => r.id === recId || r._id === recId);
          if (foundRec && foundRec.email) recruiterEmails.push(foundRec.email);
        });
      }
      
      let emailDisplay = 'onsitejobs@prophecytechs.com'; // Default fallback
      const currentUsername = localStorage.getItem('username');
      
      if (recruiterEmails.length > 0) {
        // Find if current logged-in user is among the assigned recruiters
        const isCurrentUserAssigned = recruiterEmails.some(
          email => email.toLowerCase() === (currentUsername || '').toLowerCase()
        );
        
        if (isCurrentUserAssigned) {
          // If logged in user is assigned, use their email
          emailDisplay = currentUsername;
        } else {
          // Fallback to the first assigned recruiter's email
          emailDisplay = recruiterEmails[0];
        }
      } else if (roleToPromote.assignTo) {
        const owner = recruiters.find(r => r.name === roleToPromote.assignTo);
        if (owner && owner.email) emailDisplay = owner.email;
      }
      
      return `We’re Hiring – ${roleToPromote.role || ''}\n\nProphecy Technologies is looking for an experienced ${roleToPromote.role || ''} to join our growing team.\n\n📍 Location: ${locationString}\n💼 Experience: ${roleToPromote.experience || ''}\n\n📩 Apply now by sending your resume to:\n${emailDisplay}\n\nFeel free to share this opportunity with your network.\n\n#Hiring #Jobs #Careers #${cleanRole} #TechJobs #Recruitment #NowHiring`;
    };

    const handleLinkedInShare = (orgPlatform) => {
      setLinkedinSelectedPlatform(orgPlatform);
      setLinkedinPreviewText(generateDefaultPostText());
      setShowLinkedinOptions(false);
      setShowLinkedinPreview(true);
    };

    const submitLinkedInPost = async () => {
      try {
        const token = localStorage.getItem('token');
        const orgLabel = linkedinSelectedPlatform === 'LinkedIn_Prophecy' ? 'Prophecy LinkedIn' 
          : linkedinSelectedPlatform === 'LinkedIn_Cognifyar' ? 'Cognifyar LinkedIn' 
          : 'LinkedIn';
        showNotification(`Posting to ${orgLabel}, please wait...`);
        
        const response = await fetch(`${BASE_URL}/api/social/post`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                jobId: roleToPromote.id, 
                platforms: [linkedinSelectedPlatform], 
                postingLevels: ['Personal'],
                customText: linkedinPreviewText,
                frontendUrl: window.location.origin
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
          showNotification(`Successfully posted to ${orgLabel}!`);
          setShowLinkedinPreview(false);
          setTimeout(closePromoteModal, 1500);
        } else {
          showNotification('Failed: ' + data.message);
        }
      } catch (error) {
        showNotification('Failed to post to LinkedIn: ' + error.message);
      }
    };

    const postToPlatform = async (platform) => {
      const confirmed = window.confirm(`Are you sure you want to post "${roleToPromote.role}" to ${platform}?`);
      if (!confirmed) return;
      try {
        const token = localStorage.getItem('token');
        showNotification(`Posting to ${platform}, please wait...`);
        
        const response = await fetch(`${BASE_URL}/api/social/post`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                jobId: roleToPromote.id, 
                platforms: [platform], 
                postingLevels: ['Personal'],
                customText: generateDefaultPostText(),
                frontendUrl: window.location.origin
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
          showNotification(`Successfully posted to ${platform}!`);
          setTimeout(closePromoteModal, 1500);
        } else {
          showNotification(`Failed: ` + data.message);
        }
      } catch (error) {
        showNotification(`Failed to post to ${platform}: ` + error.message);
      }
    };

    const handleDiceShare = () => {
      const confirmed = window.confirm(`Are you sure you want to post "${roleToPromote.role}" to Dice?`);
      if (!confirmed) return;
      window.postMessage({
        type: "POST_TO_DICE",
        job: {
            id: roleToPromote.jobId || roleToPromote.id,
            title: roleToPromote.role,
            location: formatLocation(roleToPromote),
            description: roleToPromote.jobDescription,
            minRate: roleToPromote.minRate,
            maxRate: roleToPromote.maxRate,
            workSetting: roleToPromote.roleLocation || 'On-Site'
        }
      }, "*");
      showNotification('Launching Dice Automation in a new tab...');
      closePromoteModal();
    };

    const handleIndeedShare = () => {
      const confirmed = window.confirm(`Are you sure you want to post "${roleToPromote.role}" to Indeed?`);
      if (!confirmed) return;
      window.postMessage({
        type: "POST_TO_INDEED",
        job: {
            id: roleToPromote.jobId || roleToPromote.id,
            title: roleToPromote.role,
            location: formatLocation(roleToPromote),
            description: roleToPromote.jobDescription,
            minRate: roleToPromote.minRate,
            maxRate: roleToPromote.maxRate,
            workSetting: roleToPromote.roleLocation || 'On-Site'
        }
      }, "*");
      showNotification('Launching Indeed Automation in a new tab...');
      closePromoteModal();
    };

    const handleWhatsAppShare = () => {
      const description = stripHtml(roleToPromote.jobDescription || '');
      const postedDate = roleToPromote.createdAt 
        ? new Date(roleToPromote.createdAt).toISOString().split('T')[0] 
        : new Date().toISOString().split('T')[0];
      const location = formatLocation(roleToPromote);
      const roleTitle = roleToPromote.role || 'N/A';
      
      // Find all assigned recruiters' emails
      let recruiterEmails = [];
      
      // Parse assignedRecruiters if it's a string
      let assignedRecruitersList = roleToPromote.assignedRecruiters || [];
      if (typeof assignedRecruitersList === 'string') {
        try {
          assignedRecruitersList = JSON.parse(assignedRecruitersList);
        } catch (e) {
          assignedRecruitersList = [];
        }
      }

      if (Array.isArray(assignedRecruitersList) && assignedRecruitersList.length > 0) {
        assignedRecruitersList.forEach(item => {
          // Handle both simple ID values and object structures
          const recId = typeof item === 'object' ? (item.id || item._id) : item;
          if (!recId) return;
          
          const foundRec = recruiters.find(r => r.id === recId || r._id === recId);
          if (foundRec && foundRec.email) {
            recruiterEmails.push(foundRec.email);
          }
        });
      }

      // Final email display string - fallback to role owner if no specific recruiters assigned
      let emailDisplay = 'info@prophecytechs.com';
      const currentUsername = localStorage.getItem('username');

      if (recruiterEmails.length > 0) {
        // Find if current logged-in user is among the assigned recruiters
        const isCurrentUserAssigned = recruiterEmails.some(
          email => email.toLowerCase() === (currentUsername || '').toLowerCase()
        );
        
        if (isCurrentUserAssigned) {
          // If logged in user is assigned, use their email
          emailDisplay = currentUsername;
        } else {
          // Fallback to the first assigned recruiter's email
          emailDisplay = recruiterEmails[0];
        }
      } else if (roleToPromote.assignTo) {
        // Find owner email as fallback
        const owner = recruiters.find(r => r.name === roleToPromote.assignTo);
        if (owner && owner.email) {
          emailDisplay = owner.email;
        }
      }

      const message = `Role: ${roleTitle}\nLocation: ${location}\nRecruiter Email: ${emailDisplay}\nPosted: ${postedDate}\n\nDesc:\n${description}\n\nApply here: ${shareUrl}`;

      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, '_blank');
    };

    return (
      <div
        id="promote-role-modal"
        className="recruitment-modal"
        onClick={(e) => {
          if (e.target.id === 'promote-role-modal') {
            closePromoteModal();
          }
        }}
      >
        <div className="recruitment-modal-content" style={{  borderRadius: '20px', padding: '0', overflow: 'hidden', border: 'none' }}>
          <div className="recruitment-modal-header" style={{ 
            backgroundColor: '#00af91', 
            padding: '20px 25px', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            borderBottom: 'none'
          }}>
            <h2 style={{ margin: 0, fontSize: '1.6rem', color: 'white', fontWeight: '600' }}>Promote Job</h2>
            <span 
              className="recruitment-close" 
              onClick={closePromoteModal} 
              style={{ fontSize: '24px', color: 'white', cursor: 'pointer', opacity: '0.9' }}
            >
              &times;
            </span>
          </div>
          <div className="recruitment-modal-body" style={{ padding: '25px 30px 40px' }}>
            {showLinkedinPreview ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <p style={{ color: '#555', margin: 0, fontWeight: '500' }}>
                  Review and edit your{' '}
                  <strong style={{ color: '#0077b5' }}>
                    {linkedinSelectedPlatform === 'LinkedIn_Prophecy' ? 'Prophecy LinkedIn' 
                      : linkedinSelectedPlatform === 'LinkedIn_Cognifyar' ? 'Cognifyar LinkedIn' 
                      : 'Personal LinkedIn'}
                  </strong>{' '}post:
                </p>
                <textarea
                  value={linkedinPreviewText}
                  onChange={(e) => setLinkedinPreviewText(e.target.value)}
                  style={{
                    width: '100%',
                    height: '250px',
                    padding: '15px',
                    borderRadius: '8px',
                    border: '1px solid #ddd',
                    fontSize: '14px',
                    lineHeight: '1.5',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                  <button 
                    onClick={() => { setShowLinkedinPreview(false); setShowLinkedinOptions(false); }}
                    style={{ padding: '10px 20px', borderRadius: '6px', border: '1px solid #ccc', backgroundColor: 'white', cursor: 'pointer', fontWeight: '500' }}
                  >
                    Back
                  </button>
                  <button 
                    onClick={submitLinkedInPost}
                    style={{ padding: '10px 20px', borderRadius: '6px', border: 'none', backgroundColor: '#0077b5', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    Post to LinkedIn
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p style={{ color: '#555', marginBottom: '30px', fontSize: '15px', lineHeight: '1.5' }}>
                  Share this job opening on social media platforms to attract more candidates.
                </p>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '20px', marginBottom: '30px' }}>
              {/* LINKEDIN BUTTON - with org sub-selection */}
              <div 
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '15px',
                  padding: showLinkedinOptions ? '15px 10px' : '30px 20px',
                  backgroundColor: '#f1f6fa',
                  borderRadius: '16px',
                  transition: 'all 0.2s ease',
                  border: '1px solid transparent',
                  width: '120px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.06)';
                  e.currentTarget.style.borderColor = '#e1effa';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = 'transparent';
                }}
              >
                {!showLinkedinOptions ? (
                  <>
                    <div 
                      onClick={() => setShowLinkedinOptions(true)}
                      style={{ 
                        width: '70px', 
                        height: '70px', 
                        backgroundColor: '#0077b5', 
                        borderRadius: '50%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: 'white',
                        boxShadow: '0 4px 10px rgba(0, 119, 181, 0.2)',
                        cursor: 'pointer'
                      }}
                    >
                      <svg width="35" height="35" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                      </svg>
                    </div>
                    <span 
                      onClick={() => setShowLinkedinOptions(true)}
                      style={{ fontWeight: '600', color: '#333', fontSize: '18px', cursor: 'pointer' }}
                    >
                      LinkedIn
                    </span>
                  </>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#0077b5', textAlign: 'center', marginBottom: '4px' }}>Post as:</span>
                    <button 
                      onClick={() => handleLinkedInShare('LinkedIn_Prophecy')}
                      style={{ padding: '6px', borderRadius: '6px', background: '#0077b5', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' }}
                    >
                      Prophecy
                    </button>
                    <button 
                      onClick={() => handleLinkedInShare('LinkedIn_Cognifyar')}
                      style={{ padding: '6px', borderRadius: '6px', background: '#004182', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' }}
                    >
                      Cognifyar
                    </button>
                    <button 
                      onClick={() => handleLinkedInShare('LinkedIn')}
                      style={{ padding: '6px', borderRadius: '6px', background: '#00a0dc', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' }}
                    >
                      Personal
                    </button>
                    <button 
                      onClick={() => setShowLinkedinOptions(false)}
                      style={{ padding: '4px', borderRadius: '6px', background: '#e8f0fe', color: '#0077b5', border: 'none', cursor: 'pointer', fontSize: '11px', marginTop: '2px' }}
                    >
                      Back
                    </button>
                  </div>
                )}
              </div>

              {/* FACEBOOK BUTTON */}
              <div 
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '15px',
                  padding: showFacebookOptions ? '15px 10px' : '30px 20px',
                  backgroundColor: '#f0f5fa',
                  borderRadius: '16px',
                  transition: 'all 0.2s ease',
                  border: '1px solid transparent',
                  width: '120px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.06)';
                  e.currentTarget.style.borderColor = '#e1effa';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = 'transparent';
                }}
              >
                {!showFacebookOptions ? (
                  <>
                    <div 
                      onClick={() => setShowFacebookOptions(true)}
                      style={{ 
                        width: '70px', 
                        height: '70px', 
                        backgroundColor: '#1877F2', 
                        borderRadius: '50%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: 'white',
                        boxShadow: '0 4px 10px rgba(24, 119, 242, 0.2)',
                        cursor: 'pointer'
                      }}
                    >
                      <svg width="35" height="35" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    </div>
                    <span 
                      onClick={() => setShowFacebookOptions(true)}
                      style={{ fontWeight: '600', color: '#333', fontSize: '18px', cursor: 'pointer' }}
                    >
                      Facebook
                    </span>
                  </>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#555', textAlign: 'center', marginBottom: '4px' }}>Post to:</span>
                    <button 
                      onClick={() => postToPlatform('Facebook')}
                      style={{ padding: '6px', borderRadius: '6px', background: '#1877F2', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
                    >
                      Prophecy
                    </button>
                    <button 
                      onClick={() => postToPlatform('FacebookCognifyar')}
                      style={{ padding: '6px', borderRadius: '6px', background: '#3b5998', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
                    >
                      Cognifyar
                    </button>
                    <button 
                      onClick={() => setShowFacebookOptions(false)}
                      style={{ padding: '4px', borderRadius: '6px', background: '#e4e6eb', color: '#4b4f56', border: 'none', cursor: 'pointer', fontSize: '11px', marginTop: '2px' }}
                    >
                      Back
                    </button>
                  </div>
                )}
              </div>



              <div 
                onClick={handleDiceShare}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '15px',
                  padding: '30px 20px',
                  backgroundColor: '#f8f1fa',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  border: '1px solid transparent',
                  width: '120px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.06)';
                  e.currentTarget.style.borderColor = '#f0e6f5';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = 'transparent';
                }}
              >
                <div style={{ 
                  width: '70px', 
                  height: '70px', 
                  backgroundColor: '#cc0000', 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: 'white',
                  boxShadow: '0 4px 10px rgba(204, 0, 0, 0.2)'
                }}>
                  <span style={{ fontSize: '32px', fontWeight: 'bold', fontFamily: 'Arial, sans-serif' }}>D</span>
                </div>
                <span style={{ fontWeight: '600', color: '#333', fontSize: '18px' }}>Dice</span>
              </div>

              {/* INDEED BUTTON */}
              <div 
                onClick={handleIndeedShare}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '15px',
                  padding: '30px 20px',
                  backgroundColor: '#e6f0fa',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  border: '1px solid transparent',
                  width: '120px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.06)';
                  e.currentTarget.style.borderColor = '#d0e5f9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = 'transparent';
                }}
              >
                <div style={{ 
                  width: '70px', 
                  height: '70px', 
                  backgroundColor: '#003399', 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: 'white',
                  boxShadow: '0 4px 10px rgba(0, 51, 153, 0.2)'
                }}>
                  <span style={{ fontSize: '32px', fontWeight: 'bold', fontFamily: 'Arial, sans-serif' }}>I</span>
                </div>
                <span style={{ fontWeight: '600', color: '#333', fontSize: '18px' }}>Indeed</span>
              </div>

              <div 
                onClick={handleWhatsAppShare}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '15px',
                  padding: '30px 20px',
                  backgroundColor: '#f1fcf4',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  border: '1px solid transparent',
                  width: '120px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.06)';
                  e.currentTarget.style.borderColor = '#e8f5e9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = 'transparent';
                }}
              >
                <div style={{ 
                  width: '70px', 
                  height: '70px', 
                  backgroundColor: '#25d366', 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: 'white',
                  boxShadow: '0 4px 10px rgba(37, 211, 102, 0.2)'
                }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.94 3.659 1.437 5.634 1.437h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </div>
                <span style={{ fontWeight: '600', color: '#333', fontSize: '18px' }}>WhatsApp</span>
              </div>
            </div>

            <div style={{ 
              padding: '20px', 
              backgroundColor: '#fff', 
              border: '1px dashed #ced4da', 
              borderRadius: '12px' 
            }}>
              <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Copy Link</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: '#444', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>{shareUrl}</span>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(shareUrl);
                    showNotification('Link copied to clipboard!');
                  }}
                  style={{ background: 'none', border: 'none', color: '#00af91', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
                >
                  COPY
                </button>
              </div>
            </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };


  // Render add role modal (UPDATED to handle both add and edit)
  const renderAddRoleModal = () => {
    const modalTitle = isEditMode ? 'Edit Role' : 'Add New Role';
    const submitButtonText = isEditMode ? 'Update Role' : 'Add Role';
    const isVisible = showAddRoleModal || showEditRoleModal;

    if (!isVisible) return null;

    return (
      <div
        id="add-role-modal"
        className="recruitment-add-role-modal"
     onClick={(e) => {
  if (e.target.id === 'add-role-modal') {
    // Remove outside click functionality
  }
}}
      >
        <div className="recruitment-add-role-modal-content">
          <div className="recruitment-add-role-modal-header">
            <h2>{modalTitle}</h2>
            <span
              className="recruitment-add-role-close"
              onClick={() => {
                if (isEditMode) {
                  closeEditRoleModal();
                } else {
                  closeAddRoleModal();
                }
              }}
            >
              &times;
            </span>
          </div>

          <div className="recruitment-add-role-modal-body">
            {/* Onsite / Offshore Toggle */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', background: '#f0f0f0', borderRadius: '8px', padding: '4px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setRoleCategory('Onsite');
                    setNewRole(prev => ({
                      ...prev,
                      country: '',
                      currency: 'USD',
                      minRate: '',
                      vendor: '',
                      visaTypes: []
                    }));
                    setNewLocation({ state: '', city: '', country: '' });
                    setLocationPairs([]);
                    setStates([]);
                  }}
                  style={{
                    padding: '8px 24px',
                    borderRadius: '6px',
                    border: 'none',
                    background: roleCategory === 'Onsite' ? '#1a6f66ff' : 'transparent',
                    color: roleCategory === 'Onsite' ? 'white' : '#666',
                    cursor: 'pointer',
                    fontWeight: roleCategory === 'Onsite' ? '600' : 'normal',
                    transition: 'all 0.3s ease'
                  }}
                >
                  Onsite
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRoleCategory('Offshore');
                    // Compute next sequential offshore job ID from loaded roles
                    const offshoreRoles = rolesData ? rolesData.filter(r => r.roleCategory?.toLowerCase() === 'offshore' || ['india','in'].includes((r.country || '').toLowerCase())) : [];
                    const maxId = offshoreRoles.reduce((max, r) => {
                      const n = parseInt(r.jobId);
                      return !isNaN(n) && n > max ? n : max;
                    }, 0);
                    const nextOffshoreId = (maxId + 1).toString();
                    setNewRole(prev => ({
                      ...prev,
                      country: 'India',
                      currency: 'INR',
                      minRate: '0',
                      visaTypes: [],
                      vendor: '',
                      jobId: nextOffshoreId
                    }));
                    setNewLocation({ state: '', city: '', country: 'India' });
                    setLocationPairs([]);
                    const countryCode = getCountryCode('India');
                    setStates(getStatesForCountry(countryCode));
                  }}
                  style={{
                    padding: '8px 24px',
                    borderRadius: '6px',
                    border: 'none',
                    background: roleCategory === 'Offshore' ? '#1a6f66ff' : 'transparent',
                    color: roleCategory === 'Offshore' ? 'white' : '#666',
                    cursor: 'pointer',
                    fontWeight: roleCategory === 'Offshore' ? '600' : 'normal',
                    transition: 'all 0.3s ease'
                  }}
                >
                  Offshore
                </button>
              </div>
            </div>
            <form onSubmit={handleAddRoleSubmit} className="recruitment-add-role-form">
              {/* Job ID and Role Title on same row */}
              <div className="recruitment-add-role-form-row">
                <div className="recruitment-add-role-form-group">
                  <label>Job ID</label>
                  <input
                    type="text"
                    name="jobId"
                    value={newRole.jobId || ''}
                    onChange={handleNewRoleChange}
                    placeholder={roleCategory === 'Offshore' ? 'Auto-assigned...' : 'Enter job ID'}
                    className="recruitment-add-role-input"
                    disabled={roleCategory === 'Offshore'}
                    title={roleCategory === 'Offshore' ? `Will be assigned as: ${newRole.jobId || 'next number'}` : ''}
                    style={roleCategory === 'Offshore' ? { background: '#f0f4f0', color: '#1a6f66', fontWeight: '600', cursor: 'not-allowed' } : {}}
                  />
                </div>
                {roleCategory === 'Onsite' && (
                  <div className="recruitment-add-role-form-group">
                    <label>GBAMS ID</label>
                    <input
                      type="text"
                      name="gbamsId"
                      value={newRole.gbamsId || ''}
                      onChange={handleNewRoleChange}
                      placeholder="Enter GBAMS ID"
                      className="recruitment-add-role-input"
                    />
                  </div>
                )}

                <div className="recruitment-add-role-form-group">
                  <label>Role Title*</label>
                  <div className="recruitment-editable-dropdown">
                    <input
                      type="text"
                      name="role"
                      value={newRole.role}
                      onChange={handleNewRoleChange}
                      onFocus={(e) => {
                        const dropdown = e.target.nextElementSibling;
                        dropdown.style.display = 'block';
                      }}
                      onBlur={(e) => {
                        setTimeout(() => {
                          const dropdown = e.target.nextElementSibling;
                          dropdown.style.display = 'none';
                        }, 200);
                      }}
                      required
                      placeholder="Select or type role title"
                      className="recruitment-add-role-input"
                      autoComplete="off"
                    />
                    <div className="recruitment-dropdown-options" style={{ display: 'none' }}>
                      {roleTitles
                        .filter(title => title.toLowerCase().includes(newRole.role.toLowerCase()))
                        .map((title, index) => (
                          <div
                            key={index}
                            className="recruitment-dropdown-option"
                          >
                            <span
                              className="recruitment-option-text"
                              onClick={() => {
                                setNewRole(prev => ({ ...prev, role: title }));
                              }}
                            >
                              {title}
                            </span>
                            <button
                              className="recruitment-option-delete"
                              onClick={(e) => {
                                e.stopPropagation();
                                setRoleTitles(prev => prev.filter(t => t !== title));
                              }}
                              title="Delete this option"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Role Type and Client on same row */}
              <div className="recruitment-add-role-form-row">
                <div className="recruitment-add-role-form-group">
                  <label>Role Type*</label>
                  <select
                    name="roleType"
                    value={newRole.roleType}
                    onChange={handleNewRoleChange}
                    required
                    className="recruitment-add-role-select"
                  >
                    <option value="Full-time">Full-time</option>
                    {roleTypes.filter(type => type !== "Full-time").map((type, index) => (
                      <option key={index} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div className="recruitment-add-role-form-group">
                  <label>Client*</label>
                  <div className="recruitment-editable-dropdown">
                    <input
                      type="text"
                      name="client"
                      value={newRole.client}
                      onChange={handleNewRoleChange}
                      onFocus={(e) => {
                        const dropdown = e.target.nextElementSibling;
                        dropdown.style.display = 'block';
                      }}
                      onBlur={(e) => {
                        setTimeout(() => {
                          const dropdown = e.target.nextElementSibling;
                          dropdown.style.display = 'none';
                        }, 200);
                      }}
                      required
                      placeholder="Select or type client name"
                      className="recruitment-add-role-input"
                      autoComplete="off"
                    />
                    <div className="recruitment-dropdown-options" style={{ display: 'none' }}>
                      {clients
                        .filter(client => client.toLowerCase().includes(newRole.client.toLowerCase()))
                        .map((client, index) => (
                          <div
                            key={index}
                            className="recruitment-dropdown-option"
                          >
                            <span
                              className="recruitment-option-text"
                              onClick={() => {
                                setNewRole(prev => ({ ...prev, client: client }));
                              }}
                            >
                              {client}
                            </span>
                            <button
                              className="recruitment-option-delete"
                              onClick={(e) => {
                                e.stopPropagation();
                                setClients(prev => prev.filter(c => c !== client));
                              }}
                              title="Delete this option"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Keep Country and State as regular selects */}
              {/* Country and Work Mode */}
<div className="recruitment-add-role-form-row">
  <div className="recruitment-add-role-form-group">
    <label>Country*</label>
    <select
      name="country"
      value={getCountryName(newRole.country)}
      onChange={handleCountryChange}
      required
      className="recruitment-add-role-select"
    >
      <option value="">Select Country</option>
      {countries.map((country, index) => (
        <option key={index} value={country.name}>{country.name}</option>
      ))}
    </select>
  </div>
  
  <div className="recruitment-add-role-form-group">
    <label>Work Mode*</label>
    <select
      name="roleLocation"
      value={newRole.roleLocation}
      onChange={handleNewRoleChange}
      required
      className="recruitment-add-role-select"
    >
      <option value="Onsite">Onsite</option>
      <option value="Remote">Remote</option>
      <option value="Hybrid">Hybrid</option>
    </select>
  </div>
</div>

{/* Location Pairs - Only show for Onsite and Hybrid */}
{newRole.roleLocation !== 'Remote' && (
  <div className="recruitment-add-role-form-group full-width">
    <label>
      Locations
      <span style={{ color: 'black' }}>*</span>
    </label>
    
    {/* Current Location Pairs Display */}
    {locationPairs.length > 0 && (
  <div style={{ 
    marginBottom: '15px', 
    padding: '10px',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
    border: '1px solid #e9ecef'
  }}>
    <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
      Selected Locations ({locationPairs.length}):
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {locationPairs.map((pair, index) => (
        <div 
          key={index} 
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px',
            backgroundColor: 'white',
            borderRadius: '4px',
            border: '1px solid #dee2e6'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
            <span style={{ 
              backgroundColor: '#1a6f66ff',
              color: 'white',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '12px'
            }}>
              {index + 1}
            </span>
            <div style={{ fontSize: '14px', fontWeight: '500' }}>
              {/* 🆕 Shows abbreviated format: Pune, AP, IN */}
              {pair.displayName || `${pair.city}, ${pair.stateCode || pair.state}, ${pair.countryCode || pair.country}`}
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleRemoveLocationPair(index)}
            style={{
              background: 'none',
              border: 'none',
              color: '#dc3545',
              cursor: 'pointer',
              fontSize: '18px',
              padding: '0 8px'
            }}
            title="Remove location"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  </div>
)}

    {/* Add New Location Pair - WITH STATE FIRST, THEN CITY */}
    <div style={{ 
      padding: '15px',
      backgroundColor: '#f8f9fa',
      borderRadius: '4px',
      border: '1px solid #e9ecef'
    }}>
      <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '10px', color: '#1a6f66ff' }}>
        Add New Location
      </div>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
        {/* STATE FIELD - FIRST */}
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: '12px', color: '#666', marginBottom: '4px', display: 'block' }}>
            State
          </label>
          <div style={{ position: 'relative' }}>
            {/* Searchable State Input */}
            <input
              type="text"
              value={newLocation.state}
              onChange={(e) => {
                setNewLocation(prev => ({ ...prev, state: e.target.value }));
                setStateSearchQuery(e.target.value);
              }}
              onFocus={() => setIsStateDropdownOpen(true)}
              onBlur={() => setTimeout(() => setIsStateDropdownOpen(false), 200)}
              placeholder="Search and select state"
              className="recruitment-add-role-input"
              style={{ width: '100%' }}
              disabled={!newRole.country}
            />
            
            {/* State Dropdown Options */}
            {isStateDropdownOpen && newRole.country && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: '0',
                right: '0',
                border: '1px solid #ddd',
                borderRadius: '4px',
                marginTop: '4px',
                maxHeight: '200px',
                overflowY: 'auto',
                backgroundColor: '#fff',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                zIndex: 1000
              }}>
                {states
                  .filter(state => 
                    state.toLowerCase().includes(stateSearchQuery.toLowerCase())
                  )
                  .map((state, index) => (
                    <div
                      key={index}
                      style={{
                        padding: '8px 12px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #f0f0f0',
                        backgroundColor: newLocation.state === state ? '#ebeff1ff' : 'transparent',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        if (newLocation.state !== state) {
                          e.currentTarget.style.backgroundColor = '#f5f5f5';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (newLocation.state !== state) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                      onClick={() => {
                        setNewLocation(prev => ({ ...prev, state }));
                        setIsStateDropdownOpen(false);
                        setStateSearchQuery('');
                      }}
                    >
                      {state}
                    </div>
                  ))}
                
                {states.filter(state => 
                  state.toLowerCase().includes(stateSearchQuery.toLowerCase())
                ).length === 0 && (
                  <div style={{
                    padding: '12px',
                    textAlign: 'center',
                    color: '#999',
                    fontSize: '14px'
                  }}>
                    No states found
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* CITY FIELD - SECOND */}
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: '12px', color: '#666', marginBottom: '4px', display: 'block' }}>
            City
          </label>
          <input
            type="text"
            value={newLocation.city}
            onChange={(e) => setNewLocation(prev => ({ ...prev, city: e.target.value }))}
            placeholder="Enter city name"
            className="recruitment-add-role-input"
            style={{ width: '100%' }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddLocationPair();
              }
            }}
          />
        </div>
      </div>
      
      <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
        Country: <strong>{newRole.country || 'Select country first'}</strong>
      </div>
      
      <button
        type="button"
        onClick={handleAddLocationPair}
        disabled={!newLocation.city.trim() || !newLocation.state || !newRole.country}
        style={{
          padding: '8px 16px',
          backgroundColor: newLocation.city.trim() && newLocation.state && newRole.country ? '#1a6f66ff' : '#ccc',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: newLocation.city.trim() && newLocation.state && newRole.country ? 'pointer' : 'not-allowed',
          fontSize: '13px',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}
      >
        <i className="fas fa-plus"></i>
        Add Location Pair
      </button>
    </div>
    
    {locationPairs.length === 0 && validationErrors.city && (
      <div className="error-message" style={{ marginTop: '8px' }}>
        At least one location pair (City + State) is required for Onsite/Hybrid roles
      </div>
    )}
  </div>
)}

              <div className="recruitment-add-role-form-row">
                <div className="recruitment-add-role-form-group">
                  <label>Experience Level*</label>
                  <div className="recruitment-editable-dropdown">
                    <input
                      type="text"
                      name="experience"
                      value={newRole.experience}
                      onChange={handleNewRoleChange}
                      onFocus={(e) => {
                        const dropdown = e.target.nextElementSibling;
                        dropdown.style.display = 'block';
                      }}
                      onBlur={(e) => {
                        setTimeout(() => {
                          const dropdown = e.target.nextElementSibling;
                          dropdown.style.display = 'none';
                        }, 200);
                      }}
                      required
                      placeholder="Select or type experience level"
                      className="recruitment-add-role-input"
                      autoComplete="off"
                    />
                    <div className="recruitment-dropdown-options" style={{ display: 'none' }}>
                      {experienceLevels
                        .filter(level => level.toLowerCase().includes(newRole.experience.toLowerCase()))
                        .map((level, index) => (
                          <div
                            key={index}
                            className="recruitment-dropdown-option"
                          >
                            <span
                              className="recruitment-option-text"
                              onClick={() => {
                                setNewRole(prev => ({ ...prev, experience: level }));
                              }}
                            >
                              {level}
                            </span>
                            <button
                              className="recruitment-option-delete"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Note: experienceLevels is a const array, so you may want to make it a state variable
                                // For now, this won't work unless you change experienceLevels to a state variable
                                console.warn('Cannot delete experience level - make experienceLevels a state variable');
                              }}
                              title="Delete this option"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
                <div className="recruitment-add-role-form-group">
                  <label>Priority*</label>
                  <select
                    name="urgency"
                    value={newRole.urgency}
                    onChange={handleNewRoleChange}
                    required
                    className="recruitment-add-role-select"
                  >
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

          
<div className="recruitment-add-role-form-row">
{roleCategory === 'Onsite' ? (
  <div className="recruitment-add-role-form-group">
    <label>
      Min Rate*
      <span className="field-hint">
        ({newRole.currency === 'INR' ? '₹' :
          newRole.currency === 'USD' ? '$' :
            `${newRole.currency}`})
      </span>
    </label>
    <div className="rate-input-container">
      <input
        type="text"  // ✅ Changed from "number" to "text"
        name="minRate"
        value={newRole.minRate}
        onChange={handleNewRoleChange}
        onBlur={(e) => {
          // Format on blur - convert to valid number
          const value = e.target.value;
          if (value) {
            const numValue = parseFloat(value);
            if (!isNaN(numValue) && numValue > 0) {
              setNewRole(prev => ({
                ...prev,
                minRate: numValue.toString()
              }));
            }
          }
        }}
        required
        placeholder={newRole.currency === 'INR' ? '500000' : '50'}
        className={`recruitment-add-role-input rate-input ${validationErrors.minRate ? 'error' : ''}`}
        pattern="[0-9]*\.?[0-9]*"  // ✅ Only allow numbers and decimal
        inputMode="decimal"  // ✅ Shows numeric keyboard on mobile
      />
    </div>
    {validationErrors.minRate && (
      <div className="error-message">{validationErrors.minRate}</div>
    )}
  </div>
) : (
  <div className="recruitment-add-role-form-group">
    <label>Relevant Experience*</label>
    <input
      type="text"
      name="relevantExperience"
      value={newRole.relevantExperience || ''}
      onChange={handleNewRoleChange}
      placeholder="e.g. 3 years in Java"
      className="recruitment-add-role-input"
      required
    />
  </div>
)}

  <div className="recruitment-add-role-form-group">
    <label>
      Max Rate*
      <span className="field-hint">
        ({newRole.currency === 'INR' ? '₹' :
          newRole.currency === 'USD' ? '$' :
            `${newRole.currency}`})
      </span>
    </label>
    <div className="rate-input-container">
      <input
        type="text"  // ✅ Changed from "number" to "text"
        name="maxRate"
        value={newRole.maxRate}
        onChange={handleNewRoleChange}
        onBlur={(e) => {
          // Format on blur - convert to valid number
          const value = e.target.value;
          if (value) {
            const numValue = parseFloat(value);
            if (!isNaN(numValue) && numValue > 0) {
              setNewRole(prev => ({
                ...prev,
                maxRate: numValue.toString()
              }));
            }
          }
        }}
        required
        placeholder={newRole.currency === 'INR' ? '1200000' : '120'}
        className={`recruitment-add-role-input rate-input ${validationErrors.maxRate ? 'error' : ''}`}
        pattern="[0-9]*\.?[0-9]*"  // ✅ Only allow numbers and decimal
        inputMode="decimal"  // ✅ Shows numeric keyboard on mobile
      />
    </div>
    {validationErrors.maxRate && (
      <div className="error-message">{validationErrors.maxRate}</div>
    )}
  </div>

  <div className="recruitment-add-role-form-group">
    <label>Currency*</label>
    <select
      name="currency"
      value={newRole.currency}
      onChange={handleNewRoleChange}
      required
      className="recruitment-add-role-select"
    >
      <option value="INR">INR (₹)</option>
      <option value="USD">USD ($)</option>
      <option value="CAD">CAD ($)</option>
      <option value="EUR">EUR (€)</option>
      <option value="GBP">GBP (£)</option>
    </select>
  </div>
</div>
              {validationErrors.rateRange && (
                <div className="form-row-error">
                  <div className="error-message">{validationErrors.rateRange}</div>
                </div>
              )}

              {/* Rate Preview */}
              {newRole.minRate && newRole.maxRate && !validationErrors.rateRange && (
                <div className="rate-preview">
                  <span className="preview-label">Rate Range Preview:</span>
                  <span className="preview-value">
                    {newRole.currency === 'INR' ? '₹' :
                      newRole.currency === 'USD' ? '$' :
                        newRole.currency === 'EUR' ? '€' :
                          newRole.currency === 'GBP' ? '£' : newRole.currency}
                    {Number(newRole.minRate).toLocaleString()} -
                    {newRole.currency === 'INR' ? '₹' :
                      newRole.currency === 'USD' ? '$' :
                        newRole.currency === 'EUR' ? '€' :
                          newRole.currency === 'GBP' ? '£' : newRole.currency}
                    {Number(newRole.maxRate).toLocaleString()}
                    <span className="rate-type">
                      {newRole.roleType === 'Contract' ? ' ' : ' '}
                    </span>
                  </span>
                </div>
              )}

              <div className="recruitment-add-role-form-row">
                <div className="recruitment-add-role-form-group">
                  <label>Client POC*</label>
                  <div className="recruitment-editable-dropdown">
                    <input
                      type="text"
                      name="clientPOC"
                      value={newRole.clientPOC || ''}
                      onChange={handleNewRoleChange}
                      onFocus={(e) => {
                        const dropdown = e.target.nextElementSibling;
                        dropdown.style.display = 'block';
                      }}
                      onBlur={(e) => {
                        setTimeout(() => {
                          const dropdown = e.target.nextElementSibling;
                          dropdown.style.display = 'none';
                        }, 200);
                      }}
                      required
                      placeholder="Select or type client POC name"
                      className="recruitment-add-role-input"
                      autoComplete="off"
                    />
                    <div className="recruitment-dropdown-options" style={{ display: 'none' }}>
                      {clientPOCs
                        .filter(poc => poc.toLowerCase().includes((newRole.clientPOC || '').toLowerCase()))
                        .map((poc, index) => (
                          <div
                            key={index}
                            className="recruitment-dropdown-option"
                          >
                            <span
                              className="recruitment-option-text"
                              onClick={() => {
                                setNewRole(prev => ({ ...prev, clientPOC: poc }));
                              }}
                            >
                              {poc}
                            </span>
                            <button
                              className="recruitment-option-delete"
                              onClick={(e) => {
                                e.stopPropagation();
                                setClientPOCs(prev => prev.filter(p => p !== poc));
                              }}
                              title="Delete this option"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>


                <div className="recruitment-add-role-form-group">
                  <label>Status*</label>
                  <select
                    name="status"
                    value={newRole.status}
                    onChange={handleNewRoleChange}
                    required
                    className="recruitment-add-role-select"
                  >
                    {statusOptions.map((status, index) => (
                      <option key={index} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Rest of the form remains the same */}
              <div className="recruitment-add-role-form-row">
                <div className="recruitment-add-role-form-group">
                  <label>Start Date*</label>
                  <input
                    type="date"
                    name="startDate"
                    value={newRole.startDate}
                    onChange={handleNewRoleChange}
                    required
                    className="recruitment-add-role-input"
                  />
                </div>
                <div className="recruitment-add-role-form-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    name="endDate"
                    value={newRole.endDate || ''}
                    onChange={handleNewRoleChange}
                    className="recruitment-add-role-input"
                  />
                </div>
              </div>

              <div className="recruitment-add-role-form-row">
                <div className="recruitment-add-role-form-group">
                  <label>Profiles Needed*</label>
                  <input
                    type="number"
                    name="profilesNeeded"
                    value={newRole.profilesNeeded}
                    onChange={handleNewRoleChange}
                    required
                    min="1"
                    className="recruitment-add-role-input"
                  />
                </div>

                <div className="recruitment-add-role-form-row">
                  <div className="recruitment-add-role-form-group">
                    <label>Role Owner*</label>
                    <select
                      name="assignTo"
                      value={newRole.assignTo}
                      onChange={handleNewRoleChange}
                      required
                      className="recruitment-add-role-selection"
                    >
                      <option value="">Select Role Owner</option>
                      {recruiters
                        .filter(recruiter =>
                          recruiter.role === 'user' ||
                          recruiter.role === 'teamlead' ||
                          recruiter.role === 'manager' ||
                          !recruiter.role
                        )
                        .map((recruiter, index) => (
                          <option key={index} value={recruiter.name}>
                            {recruiter.name}
                            {/* {recruiter.role && recruiter.role !== 'user' ? ` (${recruiter.role})` : ''} */}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="recruitment-add-role-form-group">
                  <label>Expense Paid</label>
                  <div className="recruitment-checkbox-container">
                    <input
                      type="checkbox"
                      name="expensePaid"
                      checked={newRole.expensePaid}
                      onChange={handleNewRoleChange}
                      className="recruitment-add-role-checkbox"
                    />
                    <span className="recruitment-checkbox-label">Yes</span>
                  </div>
                </div>
              </div>

              {roleCategory === 'Onsite' && (
                <>
                  {/* Vendor Field */}
                  <div className="recruitment-add-role-form-group full-width">
                    <label>Vendors</label>
                    <div className="recruitment-editable-dropdown">
                      <input
                        type="text"
                        name="vendor"
                        value={newRole.vendor || ''}
                        onChange={handleNewRoleChange}
                        placeholder="Enter vendors"
                        className="recruitment-add-role-input"
                        autoComplete="off"
                      />
                    </div>
                  </div>

                  {/* Visa Types Section */}
                  <div className="recruitment-add-role-form-group full-width">
                    <label>Visa Types</label>
                    <div className="visa-types-container" style={{
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      padding: '10px',
                      maxHeight: '150px',
                      overflowY: 'auto',
                      backgroundColor: '#f9f9f9'
                    }}>
                      <div className="visa-types-grid" style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                        gap: '8px'
                      }}>
                        {visaTypesOptions.map((visaType, index) => (
                          <div key={index} className="visa-type-option" style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}>
                            <input
                              type="checkbox"
                              id={`visa-${index}`}
                              checked={newRole.visaTypes?.includes(visaType) || false}
                              onChange={() => handleVisaTypeSelection(visaType)}
                              style={{ margin: '0' }}
                            />
                            <label
                              htmlFor={`visa-${index}`}
                              style={{
                                margin: '0',
                                fontSize: '14px',
                                cursor: 'pointer'
                              }}
                            >
                              {visaType}
                            </label>
                          </div>
                        ))}
                      </div>

                      {/* Selected Visa Types Display */}
                      {newRole.visaTypes && newRole.visaTypes.length > 0 && (
                        <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #eee' }}>
                          <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>
                            Selected Visa Types:
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                            {newRole.visaTypes.map((visaType, index) => (
                              <span
                                key={index}
                                style={{
                                  backgroundColor: '#30aea1ff',
                                  color: 'white',
                                  padding: '2px 8px',
                                  borderRadius: '12px',
                                  fontSize: '12px'
                                }}
                              >
                                {visaType}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              <div className="recruitment-add-role-form-group full-width">
                <label>Special Notes & Relevant Experience</label>
                <div className="rich-text-editor-container">
                  <ReactQuill
                    value={newRole.specialNotes || ''}
                    onChange={(value) => handleRichTextChange('specialNotes', value)}
                    modules={quillModules}
                    formats={quillFormats}
                    placeholder="Enter any special notes or instructions
                    e.g.,Java: 3 years, Spring Boot: 2 years, AWS: 1 year"
                    style={{
                      backgroundColor: 'white',
                      borderRadius: '4px',
                      minHeight: '120px'
                    }}
                  />
                </div>
              </div>

              <div className="recruitment-add-role-form-group full-width">
                <label>Job Description</label>
                <div className="rich-text-editor-container">
                  <ReactQuill
                    value={newRole.jobDescription || ''}
                    onChange={(value) => handleRichTextChange('jobDescription', value)}
                    modules={quillModules}
                    formats={quillFormats}
                    placeholder="Enter detailed job description"
                    style={{
                      backgroundColor: 'white',
                      borderRadius: '4px',
                      minHeight: '150px'
                    }}
                  />
                </div>
              </div>

              {/* Smart Parse JD Box */}
           {/* Smart Parse JD Box */}
{/* Smart Parse JD Box */}
<div className="recruitment-add-role-form-group full-width">
  <label>
    Quick Parse JD
    <span style={{ fontSize: '12px', color: '#666', marginLeft: '8px', fontWeight: 'normal' }}>
      Paste JD content and click "Parse & Fill" to auto-populate fields
    </span>
  </label>
  <textarea
    placeholder="Paste job description content here and click 'Parse JD' to automatically fill the fields above"
    value={jdParseContent}
    onChange={(e) => setJdParseContent(e.target.value)}
    style={{
      width: '100%',
      minHeight: '120px',
      padding: '12px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      fontSize: '14px',
      fontFamily: 'monospace',
      resize: 'vertical',
      backgroundColor: '#f9f9f9'
    }}
  />
  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
    <button
      type="button"
      onClick={handleParseJD}
      disabled={!jdParseContent.trim()}
      style={{
        padding: '8px 16px',
        backgroundColor: jdParseContent.trim() ? '#30aea1ff' : '#ccc',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: jdParseContent.trim() ? 'pointer' : 'not-allowed',
        fontSize: '14px',
        fontWeight: '500'
      }}
    >
      Parse & Fill
    </button>
    <button
      type="button"
      onClick={() => {
        setJdParseContent('');
        // Clear parsed fields by resetting the form to initial state
        setNewRole({
          jobId: '',
          gbamsId: '',
          systemId: 'AUTO',
          role: '',
          roleType: 'Full-time',
          country: '',
          state: '',
          city: '',
          currency: 'INR',
          minRate: '',
          maxRate: '',
          client: '',
          clientPOC: '',
          roleLocation: 'Onsite',
          experience: '',
          urgency: 'Normal',
          status: 'Active',
          assignTo: '',
          assignedRecruiters: [],
          recruiterLead: null,
          recruiter: null,
          effectiveFrom: new Date().toISOString().split('T')[0],
          startDate: '',
          endDate: '',
          profilesNeeded: 1,
          expensePaid: false,
          specialNotes: '',
          createdBy: localStorage.getItem('username') || 'Unknown',
          jobDescription: '',
          visaTypes: []
        });
        setSelectedStates([]);
        setSelectedCities([]);
        setParseStatus(null);
      }}
      style={{
        padding: '8px 16px',
        backgroundColor: 'white',
        color: '#666',
        border: '1px solid #ddd',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '14px'
      }}
    >
      Clear All
    </button>
  </div>
  {parseStatus && (
    <div style={{
      marginTop: '10px',
      padding: '10px',
      borderRadius: '4px',
      fontSize: '13px',
      backgroundColor: parseStatus.type === 'success' ? '#d4edda' : '#fff3cd',
      color: parseStatus.type === 'success' ? '#155724' : '#856404',
      border: `1px solid ${parseStatus.type === 'success' ? '#c3e6cb' : '#ffeaa7'}`
    }}>
      {parseStatus.message}
    </div>
  )}
</div>
              <div className="recruitment-add-role-form-actions">
                <button
                  type="button"
                  className="recruitment-add-role-cancel-btn"
                  onClick={() => {
                    if (isEditMode) {
                      closeEditRoleModal();
                    } else {
                      closeAddRoleModal();
                    }
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="recruitment-add-role-submit-btn"
                >
                  {submitButtonText}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };



// Add these functions for real notifications
const fetchNotifications = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${BASE_URL}/api/recruitment/roles/notifications/all`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    setNotifications(response.data);
    
    // Calculate unread count
    const unreadCount = response.data.filter(notif => !notif.isRead).length;
    setNotificationCount(unreadCount);
    setHasNotifications(unreadCount > 0);
    
  } catch (error) {
    console.error('Error fetching notifications:', error);
  }
};

const fetchUnreadCount = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(
      `${BASE_URL}/api/recruitment/roles/notifications/unread-count`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    setNotificationCount(response.data.unreadCount);
    setHasNotifications(response.data.unreadCount > 0);
  } catch (error) {
    console.error('Error fetching unread count:', error);
  }
};

const markNotificationAsRead = async (notificationId) => {
  try {
    const token = localStorage.getItem('token');
    await axios.put(
      `${BASE_URL}/api/recruitment/roles/notifications/${notificationId}/read`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    // Refresh notifications
    await fetchUnreadCount();
    // Update local state to mark as read
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, isRead: true } : notif
      )
    );
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
};

const markAllNotificationsAsRead = async () => {
  try {
    const token = localStorage.getItem('token');
    await axios.put(
      `${BASE_URL}/api/recruitment/roles/notifications/mark-all-read`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    // Refresh notifications and count
    await fetchNotifications();
    setNotificationCount(0);
    setHasNotifications(false);
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
  }
};

// Format notification time
const formatNotificationTime = (time) => {
  const now = new Date();
  const diff = Math.floor((now - new Date(time)) / 1000); // seconds
  
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  return `${Math.floor(diff / 86400)} days ago`;
};

// Handle notification click
const handleNotificationClick = async (notification) => {
  // Mark as read
  if (!notification.isRead) {
    await markNotificationAsRead(notification.id);
  }
  
  // Handle different notification types
  try {
    const data = typeof notification.data === 'string' 
      ? JSON.parse(notification.data) 
      : notification.data;
    
    switch (notification.type) {
      case 'new_role':
      case 'new_role_created':
        if (data.roleId) {
          // Find and select the role
          const role = rolesData.find(r => r.id === data.roleId);
          if (role) {
            showRoleApplications(role);
          }
        }
        break;
        
      case 'new_application':
        if (data.roleId) {
          // Find and select the role
          const role = rolesData.find(r => r.id === data.roleId);
          if (role) {
            showRoleApplications(role);
          }
        }
        break;
        
      case 'screening_assigned':
        if (data.applicationId) {
          // Refresh screening assignments
          await fetchScreeningAssignments();
          showNotification('Screening assignment loaded');
        }
        break;
        
      default:
        console.log('Unknown notification type:', notification.type);
    }
  } catch (error) {
    console.error('Error handling notification click:', error);
  }
  
  setShowNotificationDropdown(false);
};

// Add useEffect to fetch notifications on component mount and set up polling
useEffect(() => {
  if (userRole) {
    fetchNotifications();
    
    // Poll for new notifications every 30 seconds
    const notificationInterval = setInterval(fetchUnreadCount, 30000);
    
    return () => {
      clearInterval(notificationInterval);
    };
  }
}, [userRole]);

// Add to your auto-refresh useEffect to also check notifications
useEffect(() => {
  if (!userRole) return;

  const POLL_INTERVAL = 30000; // 30 seconds

  const pollInterval = setInterval(async () => {
    try {
      // Check for new notifications
      await fetchUnreadCount();
      
      // Your existing auto-refresh logic...
      
    } catch (error) {
      console.error('❌ Auto-refresh failed:', error);
    }
  }, POLL_INTERVAL);

  return () => {
    clearInterval(pollInterval);
  };
}, [userRole, rolesData, screeningAssignments]);



const renderNotificationIcon = () => {
  return (
    <div style={{ position: 'relative', display: 'inline-block', marginLeft: '20px' }}>
      <button
        onClick={() => {
          setShowNotificationDropdown(!showNotificationDropdown);
          if (!showNotificationDropdown) {
            fetchNotifications(); // Refresh when opening
          }
        }}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          position: 'relative',
          padding: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        title="Notifications"
      >
        <svg 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke={hasNotifications ? "#1a6f66ff" : "#666"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
        {notificationCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            background: '#e74c3c',
            color: 'white',
            borderRadius: '50%',
            width: '18px',
            height: '18px',
            fontSize: '11px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold'
          }}>
            {notificationCount > 9 ? '9+' : notificationCount}
          </span>
        )}
      </button>
      
      {showNotificationDropdown && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: '0',
          marginTop: '10px',
          width: '400px',
          maxHeight: '500px',
          overflowY: 'auto',
          backgroundColor: 'white',
          border: '1px solid #ddd',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 1000
        }}>
          <div style={{
            padding: '15px',
            borderBottom: '1px solid #eee',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'sticky',
            top: 0,
            backgroundColor: 'white',
            zIndex: 1
          }}>
            <h4 style={{ margin: 0, fontSize: '16px', color: '#1a6f66ff' }}>
              Notifications
            </h4>
            {notifications.length > 0 && (
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={markAllNotificationsAsRead}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#666',
                    cursor: 'pointer',
                    fontSize: '12px',
                    textDecoration: 'underline'
                  }}
                >
                  Mark all read
                </button>
                <button
                  onClick={() => setShowNotificationDropdown(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#666',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}
                >
                  ×
                </button>
              </div>
            )}
          </div>
          
          {notifications.length > 0 ? (
            <div>
              {notifications.map((notif, index) => (
                <div 
                  key={notif.id}
                  style={{
                    padding: '15px',
                    borderBottom: index < notifications.length - 1 ? '1px solid #f0f0f0' : 'none',
                    backgroundColor: !notif.isRead ? '#f8f9fa' : 'white',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = !notif.isRead ? '#f8f9fa' : 'white'}
                  onClick={() => handleNotificationClick(notif)}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px'
                  }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: !notif.isRead ? 
                        (notif.type === 'new_role' ? '#28a745' : 
                         notif.type === 'new_application' ? '#1a6f66ff' :
                         notif.type === 'screening_assigned' ? '#ffc107' : '#1a6f66ff') : 
                        'transparent',
                      marginTop: '5px',
                      flexShrink: 0
                    }}></div>
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        fontSize: '14px', 
                        color: '#333', 
                        marginBottom: '4px',
                        fontWeight: !notif.isRead ? '600' : 'normal'
                      }}>
                        {notif.message}
                      </div>
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#999',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span>{formatNotificationTime(notif.createdAt)}</span>
                        {!notif.isRead && (
                          <span style={{
                            fontSize: '10px',
                            color: '#1a6f66ff',
                            fontWeight: '600'
                          }}>
                            NEW
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              padding: '40px 20px',
              textAlign: 'center',
              color: '#999'
            }}>
              <svg 
                width="48" 
                height="48" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="#ccc"
                strokeWidth="1.5"
                style={{ margin: '0 auto 15px' }}
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              <div>No notifications</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

  // Add this function inside your React component, before the return statement
const downloadRecruiterPerformanceReport = async (period) => {
  try {
    const token = localStorage.getItem('token');
    
    const apiUrl = `${BASE_URL}/api/recruitment/roles/export/recruiter-performance?period=${period}`;

    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Create blob from response
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;

    // Get filename from response headers or create default
    const contentDisposition = response.headers.get('content-disposition');
    let filename = `recruiter_performance_${period}_report.csv`;

    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }

    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);

    showNotification('Recruiter performance report downloaded successfully!');

  } catch (error) {
    console.error('Error downloading recruiter performance report:', error);
    let errorMessage = 'Failed to download recruiter performance report';

    if (error.message.includes('403')) {
      errorMessage = 'You do not have permission to download performance reports';
    } else if (error.message.includes('404')) {
      errorMessage = 'Report service not available';
    }

    showNotification(errorMessage);
  }
};


  const calculateStats = () => {
    // For stats, we need to apply the same filtering logic as filterRoles but without the search term
    let rolesForStats = rolesData;

    if (isManagerView) {
      // Manager sees all roles
      rolesForStats = rolesData;
    } else if (isTeamLeadView) {
      // Team lead filtering logic (same as in filterRoles)
      const currentUsername = localStorage.getItem('username').toLowerCase();
      rolesForStats = rolesData.filter(role => {
        const isRoleOwner = role.assignTo && role.assignTo.toLowerCase() === currentUsername;
        let isInAssignedRecruiters = false;
        try {
          if (role.assignedRecruiters) {
            let assignedRecruiters = [];
            if (typeof role.assignedRecruiters === 'string') {
              assignedRecruiters = JSON.parse(role.assignedRecruiters);
            } else {
              assignedRecruiters = role.assignedRecruiters;
            }
            isInAssignedRecruiters = assignedRecruiters.some(recruiter =>
              recruiter.name && recruiter.name.toLowerCase() === currentUsername
            );
          }
        } catch (error) {
          console.error('Error parsing assigned recruiters:', error);
        }
        const isCreatedByTeamLead = role.createdBy && role.createdBy.toLowerCase() === currentUsername;
        return isRoleOwner || isInAssignedRecruiters || isCreatedByTeamLead;
      });
    } else {
      // Recruiter filtering logic (same as in filterRoles)
      const currentUsername = localStorage.getItem('username').toLowerCase();
      rolesForStats = rolesData.filter(role => {
        const isRoleOwner = role.assignTo && role.assignTo.toLowerCase() === currentUsername;
        let isInAssignedRecruiters = false;
        try {
          if (role.assignedRecruiters) {
            let assignedRecruiters = [];
            if (typeof role.assignedRecruiters === 'string') {
              assignedRecruiters = JSON.parse(role.assignedRecruiters);
            } else {
              assignedRecruiters = role.assignedRecruiters;
            }
            isInAssignedRecruiters = assignedRecruiters.some(recruiter =>
              recruiter.name && recruiter.name.toLowerCase() === currentUsername
            );
          }
        } catch (error) {
          console.error('Error parsing assigned recruiters:', error);
        }
        return isRoleOwner || isInAssignedRecruiters;
      });
    }

    // Apply date filter to stats (this is the key addition)
     // Apply date filter to stats (this is the key addition)
    if (dateFilter === 'custom') {
      if (customStartDate && customEndDate) {
        rolesForStats = rolesForStats.filter(role => {
          const roleDate = new Date(role.createdAt || role.effectiveFrom);
          const startDate = new Date(customStartDate);
          const endDate = new Date(customEndDate);
          
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
          
          return roleDate >= startDate && roleDate <= endDate;
        });
      } else {
        // If custom range selected but no dates set, show no stats
        rolesForStats = [];
      }
    } else if (dateFilter) {
      rolesForStats = rolesForStats.filter(role => filterByDate(role, dateFilter));
    }

    // Apply status filter to stats
    if (statusFilter) {
      rolesForStats = rolesForStats.filter(role => role.status === statusFilter);
    }

    // Apply location filter to stats
    if (locationFilter) {
      rolesForStats = rolesForStats.filter(role => role.roleLocation === locationFilter);
    }

    // Apply urgency filter to stats
    if (urgencyFilter) {
      rolesForStats = rolesForStats.filter(role => role.urgency === urgencyFilter);
    }

    // Always use server-provided stats if available since we now pass the filter to the server
    if (dashboardStats && dashboardStats.totalRoles !== undefined) {
      return [
        { value: dashboardStats.totalRoles, label: 'Total Roles' },
        { value: dashboardStats.activeRoles, label: 'Active Roles' },
        { value: dashboardStats.totalApplications, label: 'Applications' }
      ];
    }

    // Fallback to client-side calculation (only for the current page, so less accurate)
    const activeRoles = rolesForStats.filter(role => role.status === 'Active');
    const totalApplications = rolesForStats.reduce((sum, role) => sum + (role.applicationCount || 0), 0);

    return [
      { value: rolesForStats.length, label: 'Total Roles' },
      { value: activeRoles.length, label: 'Active Roles' },
      { value: totalApplications, label: 'Applications' },
    ];
  };
  

  return (
    <>
      {/* Page Loader */}
    {/* Content Loader - Only covers main content, not sidebar */}
{isLoading && (
  <div style={{
    position: 'fixed',
    top: 0,
    left: '70px', // Sidebar width
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999
  }}>
    <div style={{
      textAlign: 'center'
    }}>
      <div style={{
        width: '50px',
        height: '50px',
        border: '4px solid #f3f3f3',
        borderTop: '4px solid #1a6f66ff',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        margin: '0 auto 15px'
      }}></div>
      <div style={{
        color: '#1a6f66ff',
        fontSize: '16px',
        fontWeight: '500'
      }}>
        Loading Recruitment Dashboard...
      </div>
    </div>
  </div>
)}
    <div className="recruitment-dashboard-container">
      {/* Notification */}
      {notification && (
        <div className="recruitment-notification" style={{ zIndex: 10003 }}>
          {notification}
        </div>
      )}

      {/* Manager View */}
         {/* Manager View */}
{isManagerView && (
  <div id="manager-view" className="recruitment-view-section active">
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      marginBottom: '20px'
    }}>
      <h2 className="recruitment-section-title" style={{ margin: 0 }}>
        {userRole === 'super_admin' ? 'Super Admin Dashboard' : userRole === 'admin' ? 'Admin Dashboard' : 'Manager Dashboard'}
      </h2>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div className="view-mode-toggles" style={{ display: 'flex', gap: '10px' }}>
          <button 
            className={`recruitment-filter ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Grid View"
            style={{ backgroundColor: viewMode === 'grid' ? '#009688' : 'white', color: viewMode === 'grid' ? 'white' : 'black', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <LayoutGrid size={18} />
          </button>
          <button 
            className={`recruitment-filter ${viewMode === 'rows' ? 'active' : ''}`}
            onClick={() => setViewMode('rows')}
            title="Rows View"
            style={{ backgroundColor: viewMode === 'rows' ? '#009688' : 'white', color: viewMode === 'rows' ? 'white' : 'black', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <List size={18} />
          </button>
        </div>
        {renderNotificationIcon()}
      </div>
    </div>

        {/* ADD THE UPDATED STATS GRID HERE */}
        <div className="recruitment-stats-grid">
          {updatedCalculateStats().map((stat, index) => (
            <div 
              key={index} 
              className={`recruitment-stat-card ${stat.isButton ? 'stats-button' : ''}`}
              onClick={stat.isButton ? stat.onClick : undefined}
              style={stat.isButton ? { cursor: 'pointer' } : {}}
            >
              <div className="recruitment-stat-number">
                {stat.value}
                {stat.label === 'Active Recruiters' && (
                  <span className="night-shift-badge"></span>
                )}
              </div>
              <div className="recruitment-stat-label">{stat.label}</div>
            </div>
          ))}
        </div>

{(userRole === 'user' || userRole === 'teamlead' || userRole === 'manager') && 
 screeningAssignments.length > 0 && (
  <div className="screening-assignments-section" style={{
    marginBottom: '30px',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    border: '1px solid #e9ecef'
  }}>
    <h3 style={{ color: '#1a6f66ff', marginBottom: '15px' }}>
      <i className="fas fa-tasks" style={{ marginRight: '10px' }}></i>
      My Screening Assignments ({screeningAssignments.length})
    </h3>
    
    <div className="screening-assignments-grid">
      {screeningAssignments.map(assignment => (
        <div key={assignment.applicationId} className="screening-assignment-card" style={{
          padding: '15px',
          backgroundColor: 'white',
          borderRadius: '6px',
          border: '1px solid #dee2e6',
          marginBottom: '10px',
          borderLeft: '4px solid #28a77fff'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: '0 0 5px 0', color: '#1a6f66ff' }}>
                {assignment.candidateName}
              </h4>
              <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#666' }}>
                <strong>Role:</strong> {assignment.roleName} at {assignment.client}
              </p>
              <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#666' }}>
                <strong>Email:</strong> {assignment.email} | <strong>Phone:</strong> {assignment.phone}
              </p>
              
              {/* Resume Section */}
              <div style={{ margin: '10px 0' }}>
                <strong style={{ fontSize: '14px', color: '#333' }}>Resumes:</strong>
                {applicationResumes[assignment.applicationId] && 
                 applicationResumes[assignment.applicationId].length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '5px' }}>
                    {applicationResumes[assignment.applicationId].map((resume) => (
                      <button
                        key={resume.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          viewResume(resume.id, assignment.applicationId, e);
                        }}
                        disabled={resumeLoading}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#f8f9fa',
                          border: '1px solid #dee2e6',
                          borderRadius: '4px',
                          cursor: resumeLoading ? 'wait' : 'pointer',
                          fontSize: '12px',
                          textAlign: 'left',
                          color: '#1a6f66ff',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          maxWidth: '250px'
                        }}
                      >
                        <i className="fas fa-file-pdf" style={{ color: '#e74c3c' }}></i>
                        {resume.resumeFileName}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#999', 
                    fontStyle: 'italic',
                    marginTop: '5px'
                  }}>
                    No resumes available
                    <button
                      onClick={() => fetchApplicationResumes(assignment.applicationId)}
                      style={{
                        marginLeft: '10px',
                        padding: '4px 8px',
                        backgroundColor: '#f8f9fa',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '11px'
                      }}
                    >
                      Load Resumes
                    </button>
                  </div>
                )}
              </div>

              {/* Job Description Section */}
              <div style={{ margin: '10px 0' }}>
                <strong style={{ fontSize: '14px', color: '#333' }}>Job Description:</strong>
                <div style={{ marginTop: '5px' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Find the role to show JD
                      const role = rolesData.find(r => r.id === assignment.roleId);
                      if (role) {
                        setSelectedRole(role);
                        setShowJobDescriptionModal(true);
                      }
                    }}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#1a6f66ff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <i className="fas fa-file-alt"></i>
                    View Job Description
                  </button>
                </div>
              </div>

              <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#999' }}>
                Assigned by {assignment.assignedBy} on {formatDateTime(assignment.assignedAt)}
              </p>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '150px' }}>
              <button
                onClick={() => handleCompleteScreening(assignment.applicationId)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#1a6f66ff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '500'
                }}
              >
                Complete Screening
              </button>
              
              {/* Quick View Role Details Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const role = rolesData.find(r => r.id === assignment.roleId);
                  if (role) {
                    showRoleApplications(role);
                  }
                }}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '11px'
                }}
              >
                View Role Details
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
)}
        {/* ADD RECRUITER STATS SECTION HERE (after stats grid) */}
        {showRecruiterStats && (
          <div className="recruiter-stats-section">
            <div className="recruiter-stats-header">
              <h3>Recruiter Performance Dashboard</h3>
              <button 
                className="recruitment-cancel-btn"
                onClick={toggleRecruiterStats}
              >
                Close
              </button>
            </div>
            {renderRecruiterStats()}
          </div>
        )}


          <div className="recruitment-search-filter">
            <input
              type="text"
              className="recruitment-search-input"
              placeholder="Search roles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          <select
  className="recruitment-filter-select"
  value={statusFilter}
  onChange={(e) => setStatusFilter(e.target.value)}
>
  <option value="">All Status</option>
  <option value="Active">Active</option>
  <option value="Inactive">Inactive</option>
  <option value="Modified">Modified</option>
  <option value="On Hold">On Hold</option>
  <option value="Cancelled">Cancelled</option>
  <option value="Filled">Filled</option>
</select>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
  <select
    className="recruitment-filter-select"
    value={dateFilter}
    onChange={(e) => {
      const value = e.target.value;
      setDateFilter(value);
      if (value !== 'custom') {
        setShowCustomDateRange(false);
      } else {
        setShowCustomDateRange(true);
      }
    }}
    style={{ width: '150px' }}
  >
    {dateFilterOptions.map((option, index) => (
      <option key={index} value={option.value}>{option.label}</option>
    ))}
  </select>
  
{showCustomDateRange && dateFilter === 'custom' && (
  <div style={{ 
    display: 'flex', 
    alignItems: 'center', 
    gap: '8px',
    backgroundColor: '#f8f9fa',
    padding: '8px 12px',
    borderRadius: '4px',
    border: '1px solid #dee2e6'
  }}>
    {/* START DATE INPUT */}
    <input
      type="date"
      value={customStartDate}
      onChange={(e) => {
        const newDate = e.target.value;
        setCustomStartDate(newDate);
      }}
      className="recruitment-filter-select"
      style={{ 
        width: '140px', 
        padding: '8px 10px',
        fontSize: '13px',
        border: '1px solid #ced4da',
        borderRadius: '4px',
        outline: 'none',
        cursor: 'text'
      }}
      placeholder="Start Date"
      min="2020-01-01"
      max={new Date().toISOString().split('T')[0]}
    />
    
    {/* "TO" TEXT */}
    <span style={{ color: '#666', fontSize: '13px', fontWeight: '500' }}>to</span>
    
    {/* END DATE INPUT */}
    <input
      type="date"
      value={customEndDate}
      onChange={(e) => {
        const newDate = e.target.value;
        setCustomEndDate(newDate);
      }}
      className="recruitment-filter-select"
      style={{ 
        width: '140px', 
        padding: '8px 10px',
        fontSize: '13px',
        border: '1px solid #ced4da',
        borderRadius: '4px',
        outline: 'none',
        cursor: 'text'
      }}
      placeholder="End Date"
      min="2020-01-01"
      max={new Date().toISOString().split('T')[0]}
    />
    
    {/* APPLY BUTTON - FIX #1 */}
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Validate
        if (!customStartDate) {
          showNotification('Please select a start date');
          return;
        }
        if (!customEndDate) {
          showNotification('Please select an end date');
          return;
        }
        
        // Check date range
        const startDate = new Date(customStartDate);
        const endDate = new Date(customEndDate);
        if (startDate > endDate) {
          showNotification('Start date must be before end date');
          return;
        }
        
        // Apply filter
        filterRoles();
        showNotification(`Filter applied: ${customStartDate} to ${customEndDate}`);
      }}
      style={{
        padding: '8px 16px',
        backgroundColor: '#1a6f66ff',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: '500',
        transition: 'all 0.2s ease',
        whiteSpace: 'nowrap'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#145c54';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#1a6f66ff';
      }}
    >
      Apply
    </button>
    
    {/* CLEAR BUTTON */}
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setCustomStartDate('');
        setCustomEndDate('');
        setShowCustomDateRange(false);
        setDateFilter('');
        filterRoles();
        showNotification('Date filter cleared');
      }}
      style={{
        padding: '8px 12px',
        backgroundColor: '#6c757d',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: '500',
        transition: 'all 0.2s ease',
        whiteSpace: 'nowrap'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#5a6268';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#6c757d';
      }}
    >
      ✕ Clear
    </button>
  </div>
)}
</div>
          
{/* <div className="report-period-dropdown">
  <select
    className="recruitment-filter-select"
    value="" // Always set to empty string
    onChange={(e) => {
      const period = e.target.value;
      if (period) {
        if (period === 'recruiter-weekly' || period === 'recruiter-monthly') {
          // Handle recruiter performance report
          const reportType = period.replace('recruiter-', '');
          downloadRecruiterPerformanceReport(reportType);
        } else {
          openReportColumnModal(period);
        }
        // Reset the select value to empty after selection
        e.target.value = "";
      }
    }}
  >
    <option value="" disabled>Download Report</option>
    <option value="daily">Daily Report</option>
    <option value="weekly">Weekly Report</option>
    <option value="monthly">Monthly Report</option>
    <option value="recruiter-weekly">Weekly Performance</option>
    <option value="recruiter-monthly">Monthly Performance</option>
  </select>
</div> */}

            <select
              className="recruitment-filter-select"
              style={{ marginRight: '10px' }}
              value={cardLocationFilter}
              onChange={(e) => setCardLocationFilter(e.target.value)}
            >
              <option value="All">All Locations</option>
              <option value="Onsite">Onsite</option>
              <option value="Offshore">Offshore</option>
            </select>
            <button
              className="recruitment-filter"
              onClick={() => setShowAddRoleModal(true)}
            >
              Add New Role
            </button>
            <button
              className="recruitment-filter"
              onClick={() => setShowPerformanceReport(true)}
              style={{ marginLeft: '10px', backgroundColor: '#1a6f66ff', color: 'white' }}
            >
              Performance Report
            </button>
          </div>
        <div className={viewMode === 'rows' ? "recruitment-roles-rows" : "recruitment-roles-grid"}>
        {currentRoles.length > 0 ? (
          viewMode === 'rows' ? renderRoleTable() : renderRoleCards()
        ) : (
          renderNoResults()
        )}
      </div>
      
      {renderPagination()}
    </div>
  )}
   {isTeamLeadView && (
  <div id="teamlead-view" className="recruitment-view-section active">
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      marginBottom: '20px'
    }}>
      <h2 className="recruitment-section-title" style={{ margin: 0 }}>Team Lead Dashboard</h2>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div className="view-mode-toggles" style={{ display: 'flex', gap: '10px' }}>
          <button 
            className={`recruitment-filter ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Grid View"
            style={{ backgroundColor: viewMode === 'grid' ? '#009688' : 'white', color: viewMode === 'grid' ? 'white' : 'black', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <LayoutGrid size={18} />
          </button>
          <button 
            className={`recruitment-filter ${viewMode === 'rows' ? 'active' : ''}`}
            onClick={() => setViewMode('rows')}
            title="Rows View"
            style={{ backgroundColor: viewMode === 'rows' ? '#009688' : 'white', color: viewMode === 'rows' ? 'white' : 'black', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <List size={18} />
          </button>
        </div>
        {renderNotificationIcon()}
      </div>
    </div>

            {/* ADD THE UPDATED STATS GRID HERE */}
        <div className="recruitment-stats-grid">
          {updatedCalculateStats().map((stat, index) => (
            <div 
              key={index} 
              className={`recruitment-stat-card ${stat.isButton ? 'stats-button' : ''}`}
              onClick={stat.isButton ? stat.onClick : undefined}
              style={stat.isButton ? { cursor: 'pointer' } : {}}
            >
              <div className="recruitment-stat-number">
                {stat.value}
                {stat.label === 'Active Recruiters' && (
                  <span className="night-shift-badge"></span>
                )}
              </div>
              <div className="recruitment-stat-label">{stat.label}</div>
            </div>
          ))}
        </div>

{(userRole === 'user' || userRole === 'teamlead' || userRole === 'manager') && 
 screeningAssignments.length > 0 && (
  <div className="screening-assignments-section" style={{
    marginBottom: '30px',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    border: '1px solid #e9ecef'
  }}>
    <h3 style={{ color: '#1a6f66ff', marginBottom: '15px' }}>
      <i className="fas fa-tasks" style={{ marginRight: '10px' }}></i>
      My Screening Assignments ({screeningAssignments.length})
    </h3>
    
    <div className="screening-assignments-grid">
      {screeningAssignments.map(assignment => (
        <div key={assignment.applicationId} className="screening-assignment-card" style={{
          padding: '15px',
          backgroundColor: 'white',
          borderRadius: '6px',
          border: '1px solid #dee2e6',
          marginBottom: '10px',
          borderLeft: '4px solid #28a77fff'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: '0 0 5px 0', color: '#1a6f66ff' }}>
                {assignment.candidateName}
              </h4>
              <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#666' }}>
                <strong>Role:</strong> {assignment.roleName} at {assignment.client}
              </p>
              <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#666' }}>
                <strong>Email:</strong> {assignment.email} | <strong>Phone:</strong> {assignment.phone}
              </p>
              
              {/* Resume Section */}
              <div style={{ margin: '10px 0' }}>
                <strong style={{ fontSize: '14px', color: '#333' }}>Resumes:</strong>
                {applicationResumes[assignment.applicationId] && 
                 applicationResumes[assignment.applicationId].length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '5px' }}>
                    {applicationResumes[assignment.applicationId].map((resume) => (
                      <button
                        key={resume.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          viewResume(resume.id, assignment.applicationId, e);
                        }}
                        disabled={resumeLoading}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#f8f9fa',
                          border: '1px solid #dee2e6',
                          borderRadius: '4px',
                          cursor: resumeLoading ? 'wait' : 'pointer',
                          fontSize: '12px',
                          textAlign: 'left',
                          color: '#1a6f66ff',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          maxWidth: '250px'
                        }}
                      >
                        <i className="fas fa-file-pdf" style={{ color: '#e74c3c' }}></i>
                        {resume.resumeFileName}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#999', 
                    fontStyle: 'italic',
                    marginTop: '5px'
                  }}>
                    No resumes available
                    <button
                      onClick={() => fetchApplicationResumes(assignment.applicationId)}
                      style={{
                        marginLeft: '10px',
                        padding: '4px 8px',
                        backgroundColor: '#f8f9fa',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '11px'
                      }}
                    >
                      Load Resumes
                    </button>
                  </div>
                )}
              </div>

              {/* Job Description Section */}
              <div style={{ margin: '10px 0' }}>
                <strong style={{ fontSize: '14px', color: '#333' }}>Job Description:</strong>
                <div style={{ marginTop: '5px' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Find the role to show JD
                      const role = rolesData.find(r => r.id === assignment.roleId);
                      if (role) {
                        setSelectedRole(role);
                        setShowJobDescriptionModal(true);
                      }
                    }}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#1a6f66ff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <i className="fas fa-file-alt"></i>
                    View Job Description
                  </button>
                </div>
              </div>

              <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#999' }}>
                Assigned by {assignment.assignedBy} on {formatDateTime(assignment.assignedAt)}
              </p>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '150px' }}>
              <button
                onClick={() => handleCompleteScreening(assignment.applicationId)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#1a6f66ff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '500'
                }}
              >
                Complete Screening
              </button>
              
              {/* Quick View Role Details Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const role = rolesData.find(r => r.id === assignment.roleId);
                  if (role) {
                    showRoleApplications(role);
                  }
                }}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '11px'
                }}
              >
                View Role Details
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
)}
        {/* ADD RECRUITER STATS SECTION HERE (after stats grid) */}
        {showRecruiterStats && (
          <div className="recruiter-stats-section">
            <div className="recruiter-stats-header">
              <h3>Recruiter Performance Dashboard</h3>
              <button 
                className="recruitment-cancel-btn"
                onClick={toggleRecruiterStats}
              >
                Close
              </button>
            </div>
            {renderRecruiterStats()}
          </div>
        )}

          <div className="recruitment-search-filter">
            <input
              type="text"
              className="recruitment-search-input"
              placeholder="Search roles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              className="recruitment-filter-select"
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value)}
            >
              <option value="">All Urgency</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Normal">Normal</option>
              <option value="Low">Low</option>
            </select>
         <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
  <select
    className="recruitment-filter-select"
    value={dateFilter}
    onChange={(e) => {
      const value = e.target.value;
      setDateFilter(value);
      if (value !== 'custom') {
        setShowCustomDateRange(false);
      } else {
        setShowCustomDateRange(true);
      }
    }}
    style={{ width: '150px' }}
  >
    {dateFilterOptions.map((option, index) => (
      <option key={index} value={option.value}>{option.label}</option>
    ))}
  </select>
 {showCustomDateRange && dateFilter === 'custom' && (
  <div style={{ 
    display: 'flex', 
    alignItems: 'center', 
    gap: '8px',
    backgroundColor: '#f8f9fa',
    padding: '8px 12px',
    borderRadius: '4px',
    border: '1px solid #dee2e6'
  }}>
    {/* START DATE INPUT */}
    <input
      type="date"
      value={customStartDate}
      onChange={(e) => {
        const newDate = e.target.value;
        setCustomStartDate(newDate);
      }}
      className="recruitment-filter-select"
      style={{ 
        width: '140px', 
        padding: '8px 10px',
        fontSize: '13px',
        border: '1px solid #ced4da',
        borderRadius: '4px',
        outline: 'none',
        cursor: 'text'
      }}
      placeholder="Start Date"
      min="2020-01-01"
      max={new Date().toISOString().split('T')[0]}
    />
    
    {/* "TO" TEXT */}
    <span style={{ color: '#666', fontSize: '13px', fontWeight: '500' }}>to</span>
    
    {/* END DATE INPUT */}
    <input
      type="date"
      value={customEndDate}
      onChange={(e) => {
        const newDate = e.target.value;
        setCustomEndDate(newDate);
      }}
      className="recruitment-filter-select"
      style={{ 
        width: '140px', 
        padding: '8px 10px',
        fontSize: '13px',
        border: '1px solid #ced4da',
        borderRadius: '4px',
        outline: 'none',
        cursor: 'text'
      }}
      placeholder="End Date"
      min="2020-01-01"
      max={new Date().toISOString().split('T')[0]}
    />
    
    {/* APPLY BUTTON - FIX #1 */}
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Validate
        if (!customStartDate) {
          showNotification('Please select a start date');
          return;
        }
        if (!customEndDate) {
          showNotification('Please select an end date');
          return;
        }
        
        // Check date range
        const startDate = new Date(customStartDate);
        const endDate = new Date(customEndDate);
        if (startDate > endDate) {
          showNotification('Start date must be before end date');
          return;
        }
        
        // Apply filter
        filterRoles();
        showNotification(`Filter applied: ${customStartDate} to ${customEndDate}`);
      }}
      style={{
        padding: '8px 16px',
        backgroundColor: '#1a6f66ff',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: '500',
        transition: 'all 0.2s ease',
        whiteSpace: 'nowrap'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#145c54';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#1a6f66ff';
      }}
    >
      Apply
    </button>
    
    {/* CLEAR BUTTON */}
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setCustomStartDate('');
        setCustomEndDate('');
        setShowCustomDateRange(false);
        setDateFilter('');
        filterRoles();
        showNotification('Date filter cleared');
      }}
      style={{
        padding: '8px 12px',
        backgroundColor: '#6c757d',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: '500',
        transition: 'all 0.2s ease',
        whiteSpace: 'nowrap'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#5a6268';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#6c757d';
      }}
    >
      ✕ Clear
    </button>
  </div>
)}
</div>

            {/* ADD THIS BUTTON FOR TEAM LEAD */}
            <select
              className="recruitment-filter-select"
              style={{ marginRight: '10px' }}
              value={cardLocationFilter}
              onChange={(e) => setCardLocationFilter(e.target.value)}
            >
              <option value="All">All Locations</option>
              <option value="Onsite">Onsite</option>
              <option value="Offshore">Offshore</option>
            </select>
            <button
              className="recruitment-filter"
              onClick={() => setShowAddRoleModal(true)}
            >
              Add New Role
            </button>
            <button
              className="recruitment-filter"
              onClick={() => setShowPerformanceReport(true)}
              style={{ marginLeft: '10px', backgroundColor: '#1a6f66ff', color: 'white' }}
            >
              Performance Report
            </button>
{/*             <div className="report-period-dropdown">
              <select
                className="recruitment-filter-select"
                value="" // Always set to empty string
                onChange={(e) => {
                  const period = e.target.value;
                  if (period) {
                    openReportColumnModal(period);
                    // Reset the select value to empty after selection
                    e.target.value = "";
                  }
                }}
              >
                <option value="" disabled>Download Report</option>
                <option value="daily">Daily Report</option>
                <option value="weekly">Weekly Report</option>
                <option value="monthly">Monthly Report</option>
              </select>
            </div> */}
          </div>

          <div className={viewMode === 'rows' ? "recruitment-roles-rows" : "recruitment-roles-grid"}>
        {currentRoles.length > 0 ? (
          viewMode === 'rows' ? renderRoleTable() : renderRoleCardsForTeamLead()
        ) : (
          renderNoResults()
        )}
      </div>
      
      {renderPagination()}
    </div>
  )}
      {/* Recruiter View */}
 {isRecruiterView && (
  <div id="recruiter-view" className="recruitment-view-section active">
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      marginBottom: '20px'
    }}>
      <h2 className="recruitment-section-title" style={{ margin: 0 }}>Recruiter Dashboard</h2>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div className="view-mode-toggles" style={{ display: 'flex', gap: '10px' }}>
          <button 
            className={`recruitment-filter ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Grid View"
            style={{ backgroundColor: viewMode === 'grid' ? '#009688' : 'white', color: viewMode === 'grid' ? 'white' : 'black', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <LayoutGrid size={18} />
          </button>
          <button 
            className={`recruitment-filter ${viewMode === 'rows' ? 'active' : ''}`}
            onClick={() => setViewMode('rows')}
            title="Rows View"
            style={{ backgroundColor: viewMode === 'rows' ? '#009688' : 'white', color: viewMode === 'rows' ? 'white' : 'black', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <List size={18} />
          </button>
        </div>
        {renderNotificationIcon()}
      </div>
    </div>

    <div className="recruitment-stats-grid">
      {calculateStats().map((stat, index) => (
        <div key={index} className="recruitment-stat-card">
          <div className="recruitment-stat-number">{stat.value}</div>
          <div className="recruitment-stat-label">{stat.label}</div>
        </div>
      ))}
    </div>

 {(userRole === 'user' || userRole === 'teamlead' || userRole === 'manager') && 
 screeningAssignments.length > 0 && (
  <div className="screening-assignments-section" style={{
    marginBottom: '30px',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    border: '1px solid #e9ecef'
  }}>
    <h3 style={{ color: '#1a6f66ff', marginBottom: '15px' }}>
      <i className="fas fa-tasks" style={{ marginRight: '10px' }}></i>
      My Screening Assignments ({screeningAssignments.length})
    </h3>
    
    <div className="screening-assignments-grid">
      {screeningAssignments.map(assignment => (
        <div key={assignment.applicationId} className="screening-assignment-card" style={{
          padding: '15px',
          backgroundColor: 'white',
          borderRadius: '6px',
          border: '1px solid #dee2e6',
          marginBottom: '10px',
          borderLeft: '4px solid #28a77fff'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: '0 0 5px 0', color: '#1a6f66ff' }}>
                {assignment.candidateName}
              </h4>
              <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#666' }}>
                <strong>Role:</strong> {assignment.roleName} at {assignment.client}
              </p>
              <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#666' }}>
                <strong>Email:</strong> {assignment.email} | <strong>Phone:</strong> {assignment.phone}
              </p>
              
              {/* Resume Section */}
              <div style={{ margin: '10px 0' }}>
                <strong style={{ fontSize: '14px', color: '#333' }}>Resumes:</strong>
                {applicationResumes[assignment.applicationId] && 
                 applicationResumes[assignment.applicationId].length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '5px' }}>
                    {applicationResumes[assignment.applicationId].map((resume) => (
                      <button
                        key={resume.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          viewResume(resume.id, assignment.applicationId, e);
                        }}
                        disabled={resumeLoading}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#f8f9fa',
                          border: '1px solid #dee2e6',
                          borderRadius: '4px',
                          cursor: resumeLoading ? 'wait' : 'pointer',
                          fontSize: '12px',
                          textAlign: 'left',
                          color: '#1a6f66ff',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          maxWidth: '250px'
                        }}
                      >
                        <i className="fas fa-file-pdf" style={{ color: '#e74c3c' }}></i>
                        {resume.resumeFileName}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#999', 
                    fontStyle: 'italic',
                    marginTop: '5px'
                  }}>
                    No resumes available
                    <button
                      onClick={() => fetchApplicationResumes(assignment.applicationId)}
                      style={{
                        marginLeft: '10px',
                        padding: '4px 8px',
                        backgroundColor: '#f8f9fa',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '11px'
                      }}
                    >
                      Load Resumes
                    </button>
                  </div>
                )}
              </div>

              {/* Job Description Section */}
              <div style={{ margin: '10px 0' }}>
                <strong style={{ fontSize: '14px', color: '#333' }}>Job Description:</strong>
                <div style={{ marginTop: '5px' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Find the role to show JD
                      const role = rolesData.find(r => r.id === assignment.roleId);
                      if (role) {
                        setSelectedRole(role);
                        setShowJobDescriptionModal(true);
                      }
                    }}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#1a6f66ff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <i className="fas fa-file-alt"></i>
                    View Job Description
                  </button>
                </div>
              </div>

              <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#999' }}>
                Assigned by {assignment.assignedBy} on {formatDateTime(assignment.assignedAt)}
              </p>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '150px' }}>
              <button
                onClick={() => handleCompleteScreening(assignment.applicationId)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#1a6f66ff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '500'
                }}
              >
                Complete Screening
              </button>
              
              {/* Quick View Role Details Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const role = rolesData.find(r => r.id === assignment.roleId);
                  if (role) {
                    showRoleApplications(role);
                  }
                }}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '11px'
                }}
              >
                View Role Details
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
)}
          <div className="recruitment-search-filter">
            <input
              type="text"
              className="recruitment-search-input"
              placeholder="Search roles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              className="recruitment-filter-select"
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value)}
            >
              <option value="">All Urgency</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Normal">Normal</option>
              <option value="Low">Low</option>
            </select>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
  <select
    className="recruitment-filter-select"
    value={dateFilter}
    onChange={(e) => {
      const value = e.target.value;
      setDateFilter(value);
      if (value !== 'custom') {
        setShowCustomDateRange(false);
      } else {
        setShowCustomDateRange(true);
      }
    }}
    style={{ width: '150px' }}
  >
    {dateFilterOptions.map((option, index) => (
      <option key={index} value={option.value}>{option.label}</option>
    ))}
  </select>
  
{showCustomDateRange && dateFilter === 'custom' && (
  <div style={{ 
    display: 'flex', 
    alignItems: 'center', 
    gap: '8px',
    backgroundColor: '#f8f9fa',
    padding: '8px 12px',
    borderRadius: '4px',
    border: '1px solid #dee2e6'
  }}>
    {/* START DATE INPUT */}
    <input
      type="date"
      value={customStartDate}
      onChange={(e) => {
        const newDate = e.target.value;
        setCustomStartDate(newDate);
      }}
      className="recruitment-filter-select"
      style={{ 
        width: '140px', 
        padding: '8px 10px',
        fontSize: '13px',
        border: '1px solid #ced4da',
        borderRadius: '4px',
        outline: 'none',
        cursor: 'text'
      }}
      placeholder="Start Date"
      min="2020-01-01"
      max={new Date().toISOString().split('T')[0]}
    />
    
    {/* "TO" TEXT */}
    <span style={{ color: '#666', fontSize: '13px', fontWeight: '500' }}>to</span>
    
    {/* END DATE INPUT */}
    <input
      type="date"
      value={customEndDate}
      onChange={(e) => {
        const newDate = e.target.value;
        setCustomEndDate(newDate);
      }}
      className="recruitment-filter-select"
      style={{ 
        width: '140px', 
        padding: '8px 10px',
        fontSize: '13px',
        border: '1px solid #ced4da',
        borderRadius: '4px',
        outline: 'none',
        cursor: 'text'
      }}
      placeholder="End Date"
      min="2020-01-01"
      max={new Date().toISOString().split('T')[0]}
    />
    
    {/* APPLY BUTTON - FIX #1 */}
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Validate
        if (!customStartDate) {
          showNotification('Please select a start date');
          return;
        }
        if (!customEndDate) {
          showNotification('Please select an end date');
          return;
        }
        
        // Check date range
        const startDate = new Date(customStartDate);
        const endDate = new Date(customEndDate);
        if (startDate > endDate) {
          showNotification('Start date must be before end date');
          return;
        }
        
        // Apply filter
        filterRoles();
        showNotification(`Filter applied: ${customStartDate} to ${customEndDate}`);
      }}
      style={{
        padding: '8px 16px',
        backgroundColor: '#1a6f66ff',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: '500',
        transition: 'all 0.2s ease',
        whiteSpace: 'nowrap'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#145c54';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#1a6f66ff';
      }}
    >
      Apply
    </button>
    
    {/* CLEAR BUTTON */}
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setCustomStartDate('');
        setCustomEndDate('');
        setShowCustomDateRange(false);
        setDateFilter('');
        filterRoles();
        showNotification('Date filter cleared');
      }}
      style={{
        padding: '8px 12px',
        backgroundColor: '#6c757d',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: '500',
        transition: 'all 0.2s ease',
        whiteSpace: 'nowrap'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#5a6268';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#6c757d';
      }}
    >
      ✕ Clear
    </button>
  </div>
)}
</div>
            {/* Add download report dropdown for Recruiter */}
{/*             <div className="report-period-dropdown">
              <select
                className="recruitment-filter-select"
                value="" // Always set to empty string
                onChange={(e) => {
                  const period = e.target.value;
                  if (period) {
                    openReportColumnModal(period);
                    // Reset the select value to empty after selection
                    e.target.value = "";
                  }
                }}
              >
                <option value="" disabled>Download Report</option>
                <option value="daily">Daily Report</option>
                <option value="weekly">Weekly Report</option>
                <option value="monthly">Monthly Report</option>
              </select>
            </div> */}
          </div>

           <div className={viewMode === 'rows' ? "recruitment-roles-rows" : "recruitment-roles-grid"}>
        {currentRoles.length > 0 ? (
          viewMode === 'rows' ? renderRoleTable() : renderRoleCards()
        ) : (
          renderNoResults()
        )}
      </div>
      
      {renderPagination()}
    </div>
  )}


  {/* ADD: New Modal Components */}
      <ResumeSubmissionModal
        selectedRole={selectedRole}
        showResumeSubmissionModal={showResumeSubmissionModal}
        closeResumeSubmissionModal={closeResumeSubmissionModal}
        fetchApplications={fetchApplications}
        showNotification={showNotification}
        refreshRolesData={refreshRolesData}
      />

      <EditApplicationModal
        showEditApplicationModal={showEditApplicationModal}
        applicationToEdit={applicationToEdit}
        closeEditApplicationModal={closeEditApplicationModal}
        fetchApplications={fetchApplications}
        selectedRole={selectedRole}
        showNotification={showNotification}
        applicationResumes={applicationResumes}
        fetchApplicationResumes={fetchApplicationResumes}
        viewResume={viewResume}
      />
   {/* ADD THIS MODAL - Report Column Modal */}
    <ReportColumnModal
      showModal={showReportColumnModal}
      onClose={closeReportColumnModal}
      selectedPeriod={selectedReportPeriod}
      reportColumns={reportColumns}
      onToggleColumn={toggleReportColumn}
      onSelectAll={selectAllColumns}
      onDeselectAll={deselectAllColumns}
      onDownload={downloadRolesReportWithColumns}
      showNotification={showNotification}
       onSelectGroup={selectGroupColumns}        // ADD THIS
  onDeselectGroup={deselectGroupColumns} 
    />
      {/* Add/Edit Role Modal */}
      {renderAddRoleModal()}

      {/* Delete Confirmation Modal */}
      {renderDeleteConfirmModal()}

      {/* Job Description Modal */}
      {showJobDescriptionModal && renderJobDescriptionModal()}

      {/* Resume Submission Modal */}
      {showResumeSubmissionModal}

      {showEditApplicationModal}
      {renderDeleteApplicationModal()}

      {renderMultipleAssignModal()}
      {renderAssignRecruiterModal()}
     {renderStepNotesModal()}
      {renderAssignScreeningModal()}

      {renderHiringStepModal()}
      {showSpecialNotesModal && renderSpecialNotesModal()}

      {/* Resume Viewer Modal */}
      {renderResumeModal()}

      {/* Promote Role Modal */}
      {renderPromoteModal()}

      {showPerformanceReport && (
        <div className="recruitment-modal" onClick={(e) => {
          if (e.target.className === 'recruitment-modal') setShowPerformanceReport(false);
        }} style={{ zIndex: 10000 }}>
          <div className="recruitment-modal-content" style={{ maxWidth: '90%', width: '1200px', padding: 0, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className="recruitment-modal-header" style={{ padding: '20px', borderBottom: '1px solid #ddd', flexShrink: 0 }}>
              <h2 style={{ margin: 0 }}>Recruiter Performance</h2>
              <span className="recruitment-close" onClick={() => setShowPerformanceReport(false)}>&times;</span>
            </div>
            <div className="recruitment-modal-body" style={{ padding: '0', overflowY: 'auto', flexGrow: 1 }}>
              <RecruiterPerformanceReport />
            </div>
          </div>
        </div>
      )}
    </div>
      </>
  );
};

export default RecruitmentDashboard;