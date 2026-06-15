// import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
// import { Plus, Download, SlidersHorizontal, Filter, Search, Upload, Loader, Share2, Sparkles, Heart, X, Bookmark, Trash2, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
// import { useNavigate, useLocation } from 'react-router-dom';
// import {
//   CANDIDATE_STATUS_OPTIONS, REMOTE_STATUS_OPTIONS, DATE_OPTIONS, formatDate,
//   WORK_AUTHORIZATION_OPTIONS, EMPLOYMENT_TYPE_OPTIONS, SECURITY_CLEARANCE_OPTIONS,
//   RATE_TYPE_OPTIONS, MARITAL_STATUS_OPTIONS, INDUSTRY_OPTIONS
// } from '../utils/mockData';
// import CandidateTable from './CandidateTable';
// import AddModal from './AddModal';
// import FilterModal from './FilterModal';
// import ShareResumeModal from './ShareResumeModal';
// import { CandidateJobsModal, ScheduleInterviewModal } from './ScheduleInterviewModals';
// import { SubmitProfileModal } from './SubmitProfileModal';
// import { ConfirmParseModal, ParsingLoadingModal, DuplicateResumeModal } from './ParseFlowModals';
// import ColumnFilterSidebar from './ColumnFilterSidebar';
// import CandidateFilterSidebar from './CandidateFilterSidebar';
// import AskAiSidebar from './AskAiSidebar';
// import '../styles/Dashboard.css';
// import '../styles/CandidateTableCustom.css';
// import '../styles/AddModalCustom.css';
// import Swal from 'sweetalert2';
// import * as XLSX from 'xlsx';
// import BASE_URL, { RESUME_PARSER_URL } from "../../url";
// import { formatName, formatJobTitle, formatNameFields, formatFullName } from '../utils/nameFormatter';
// import {
//   countriesData,
//   getCountryCode,
//   getStateCode
// } from '../../erprecruitment/config/locationConfig';

// // ─── Helper to get auth headers ──────────────────────────────────────────────
// const getAuthHeaders = () => {
//   const token = localStorage.getItem('token');
//   return {
//     'Authorization': `Bearer ${token}`,
//   };
// };

// // ─── Module-level cache so multiple mounts don't re-fetch ─────────────────────
// let _cachedCandidates = null;
// let _cachedSearchTerm = '';
// let _cachedStatusFilter = 'all';
// let _cachedAiSearchResults = null;
// let _cachedUseAiSearch = true;
// let _cachedItemsPerPage = 30;
// // ──────────────────────────────────────────────────────────────────────────────

// const formatToMonth = (dateStr) => {
//   if (!dateStr) return '';
//   const d = new Date(dateStr);
//   if (isNaN(d.getTime())) return typeof dateStr === 'string' && dateStr.length >= 7 ? dateStr.substring(0, 7) : dateStr;
//   return d.toISOString().substring(0, 7);
// };

// // ── Transform a raw API candidate object into the shape the UI needs ──────────
// const transformCandidate = (candidate) => {
//   const isEmployee = !!candidate.employee_id;
//   const empId = candidate.employee_id || '';

//   return {
//     CandidateId: candidate.candidate_id,
//     CandidateCode: candidate.candidate_code || `CAN-${String(candidate.candidate_id).padStart(6, '0')}`,
//     EmployeeCode: empId,
//     IsEmployee: isEmployee,
//     FirstName: formatName(candidate.first_name || ''),
//     LastName: formatName(candidate.last_name || ''),
//     MiddleName: formatName(candidate.middle_name || ''),
//     JobTitle: formatJobTitle(candidate.job_title || ''),
//     YearsOfExperience: candidate.years_exp,
//     CandidateStatus: candidate.status || 'Available',
//     RemoteStatus: candidate.remote_status || 'OnSite',
//     CreatedDt: candidate.created_on,
//     ProfileSummary: candidate.profile_summary || '',
//     LinkedInUrl: candidate.linkedin_url || '',
//     GitHubUrl: candidate.github_url || '',
//     TwitterUrl: candidate.twitter_url || '',
//     VideoResumeUrl: candidate.video_resume_url || '',
//     Gender: candidate.gender || '',
//     CurrentLocation: candidate.current_location || '',
//     Source: candidate.source || '',

//     // NEW FIELDS from backend
//     WorkAuthorization: candidate.work_authorization || '',
//     SecurityClearance: candidate.security_clearance || '',
//     WillingToRelocate: candidate.willing_to_relocate || false,
//     IsBench: candidate.is_bench || false,
//     EmploymentType: candidate.employment_type || '',
//     ExpectedRateFrom: candidate.expected_rate_from || '',
//     ExpectedRateTo: candidate.expected_rate_to || '',
//     ExpectedRateType: candidate.expected_rate_type || 'Hourly',
//     CurrentRate: candidate.current_rate || '',
//     CurrentRateType: candidate.current_rate_type || 'Hourly',
//     MaritalStatus: candidate.marital_status || '',
//     Industry: candidate.industry || '',
//     Mobile: candidate.mobile || '',

//     Contact: {
//       Email: candidate.email || '',
//       Phone: candidate.phone || '',
//       Mobile: candidate.mobile || '',
//     },
//     Phones: candidate.phones || [],
//     Emails: candidate.emails || [],
//     Skills: (candidate.skills || []).map(s =>
//       typeof s === 'string'
//         ? { SkillName: s, SkillType: 'HARD' }
//         : { SkillName: s.skill_name || s.SkillName || '', SkillType: s.skill_type || s.SkillType || 'HARD' }
//     ),
//     Education: (candidate.education || []).map(e => ({
//       Institution: formatName(e.Institution || e.institution || ''),
//       Degree: formatName(e.Degree || e.degree || ''),
//       FieldOfStudy: e.FieldOfStudy || e.fieldOfStudy || '',
//       StartDate: formatToMonth(e.StartDate || e.startDate),
//       EndDate: formatToMonth(e.EndDate || e.endDate),
//       GPA: e.GPA || e.gpa || '',
//     })),
//     WorkExperience: (candidate.work_experience || []).map(w => ({
//       Company: w.Company || w.company || '',
//       JobTitle: formatJobTitle(w.JobTitle || w.jobTitle || ''),
//       StartDate: formatToMonth(w.StartDate || w.startDate),
//       EndDate: formatToMonth(w.EndDate || w.endDate),
//       IsCurrent: w.IsCurrent ?? w.isCurrent ?? false,
//       Description: w.Description || w.description || '',
//     })),
//     Certifications: (candidate.certifications || []).map(c => ({
//       CertificationName: formatName(c.CertificationName || c.name || ''),
//       IssuingOrganization: c.IssuingOrganization || c.issuingOrg || '',
//       IssueDate: formatToMonth(c.IssueDate || c.issueDate),
//       ExpiryDate: formatToMonth(c.ExpiryDate || c.expiryDate),
//       CredentialId: c.CredentialId || c.credentialId || '',
//       CredentialUrl: c.CredentialUrl || c.credentialUrl || '',
//     })),
//     Document: candidate.document ? {
//       DocumentId: candidate.document.DocumentId,
//       FileNameOriginal: candidate.document.FileNameOriginal,
//       FileExtension: candidate.document.FileExtension,
//       MimeType: candidate.document.MimeType,
//       FileSizeBytes: candidate.document.FileSizeBytes,
//       StorageLocator: candidate.document.StorageLocator,
//       ParseStatus: candidate.document.ParseStatus,
//       DownloadUrl: candidate.document.DownloadUrl,
//     } : null,
//     Documents: (candidate.documents || []).map(d => ({
//       DocumentId: d.DocumentId || d.documentId,
//       DocumentType: d.DocumentType || d.documentType || 'Certificate',
//       DocumentName: d.FileNameOriginal ? d.FileNameOriginal.replace(/\.[^/.]+$/, "") : (d.DocumentName || ''),
//       FileNameOriginal: d.FileNameOriginal || d.fileNameOriginal,
//       FileExtension: d.FileExtension || d.fileExtension,
//       MimeType: d.MimeType || d.mimeType,
//       FileSizeBytes: d.FileSizeBytes || d.fileSizeBytes,
//       UploadedOn: d.UploadedOn || d.uploadedOn,
//       VersionNo: d.VersionNo || d.versionNo,
//       IsPrimary: d.IsPrimary || d.isPrimary,
//     })),
//   };
// };

// const ResumeDashboard = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const queryParams = new URLSearchParams(location.search);
//   const currentView = queryParams.get('view') || 'all';
//   const [candidates, setCandidates] = useState(_cachedCandidates || []);
//   const [loading, setLoading] = useState(_cachedCandidates === null);
//   const isFetchingRef = useRef(false);
//   const [searchTerm, setSearchTerm] = useState(_cachedSearchTerm);
//   const [selectedCandidate, setSelectedCandidate] = useState(null);
//   const [showViewModal, setShowViewModal] = useState(false);
//   const [loadingDetail, setLoadingDetail] = useState(false);
//   const [showAddModal, setShowAddModal] = useState(false);
//   const [sortConfig, setSortConfig] = useState({ key: 'CreatedOn', direction: 'desc' });
//   const [currentPage, setCurrentPage] = useState(1);
//   const [itemsPerPage, setItemsPerPage] = useState(_cachedItemsPerPage);
//   const [editingCandidate, setEditingCandidate] = useState(null);
//   const [showColumnSidebar, setShowColumnSidebar] = useState(false);
//   const [exporting, setExporting] = useState(false);
//   const [showFilterModal, setShowFilterModal] = useState(false);
//   const [advancedFilters, setAdvancedFilters] = useState({ rows: [], logic: 'AND' });
//   const [showAiSidebar, setShowAiSidebar] = useState(false);
//   const [uploadingResume, setUploadingResume] = useState(false);
//   const [useAiSearch, setUseAiSearch] = useState(_cachedUseAiSearch);
//   const [isAiSearching, setIsAiSearching] = useState(false);
//   const [aiSearchResults, setAiSearchResults] = useState(_cachedAiSearchResults);

//   // Parse Flow States
//   const [parsedResumeData, setParsedResumeData] = useState(null);
//   const [parsingFromToolbar, setParsingFromToolbar] = useState(false);
//   const [pendingParseFile, setPendingParseFile] = useState(null);
//   const [showConfirmParse, setShowConfirmParse] = useState(false);
//   const [showParsingLoading, setShowParsingLoading] = useState(false);
//   const [showDuplicateModal, setShowDuplicateModal] = useState(false);
//   const [duplicateCandidate, setDuplicateCandidate] = useState(null);
//   const [statusFilter, setStatusFilter] = useState(_cachedStatusFilter);
//   const [showFilterSidebar, setShowFilterSidebar] = useState(true);

//   // Sidebar Filter State
//   const [sidebarFilters, setSidebarFilters] = useState({
//     search: '',
//     status: [],
//     workType: [],
//     experience: 'all',
//     country: '',
//     state: '',
//     city: '',
//     sources: [],
//     employmentTypes: [],
//     industries: [],
//     isBench: 'all',
//     personType: 'all',
//     gender: [],
//     relocate: 'all',
//     workAuth: []
//   });

//   // Visible Sidebar Filters (Dynamic filter visibility)
//   const [visibleSidebarFilters, setVisibleSidebarFilters] = useState([
//     'CandidateStatus', 'PersonType', 'IsBench', 'RemoteStatus', 'Experience',
//     'Gender', 'Relocation', 'WorkAuthorization', 'EmploymentType', 'Industry', 'CurrentLocation'
//   ]);

//   // Sync top search TO sidebar search only once on mount or when searchTerm changes externally
//   useEffect(() => {
//     setSidebarFilters(prev => ({ ...prev, search: searchTerm }));
//   }, [searchTerm]);

//   // Auto-save active search filters
//   useEffect(() => {
//     _cachedSearchTerm = searchTerm;
//   }, [searchTerm]);

//   useEffect(() => {
//     _cachedStatusFilter = statusFilter;
//   }, [statusFilter]);

//   useEffect(() => {
//     _cachedAiSearchResults = aiSearchResults;
//   }, [aiSearchResults]);

//   useEffect(() => {
//     _cachedUseAiSearch = useAiSearch;
//   }, [useAiSearch]);

//   useEffect(() => {
//     _cachedItemsPerPage = itemsPerPage;
//   }, [itemsPerPage]);

//   // Share Resume State
//   const [showShareModal, setShowShareModal] = useState(false);
//   const [shareModalCandidates, setShareModalCandidates] = useState([]);
//   const [selectedCandidateIds, setSelectedCandidateIds] = useState([]);

//   // Schedule Interview State
//   const [showJobsModal, setShowJobsModal] = useState(false);
//   const [showScheduleModal, setShowScheduleModal] = useState(false);
//   const [scheduleCandidate, setScheduleCandidate] = useState(null);
//   const [selectedJobForInterview, setSelectedJobForInterview] = useState(null);

//   // Submit Profile State
//   const [showSubmitModal, setShowSubmitModal] = useState(false);
//   const [submitCandidate, setSubmitCandidate] = useState(null);

//   const parseFileInputRef = useRef(null);

//   // Saved Searches State
//   const [savedSearches, setSavedSearches] = useState([]);

//   useEffect(() => {
//     const saved = localStorage.getItem('erp_saved_searches');
//     if (saved) {
//       try {
//         setSavedSearches(JSON.parse(saved));
//       } catch (e) { }
//     }
//   }, []);

//   const handleSaveSearch = () => {
//     if (!searchTerm && statusFilter === 'all') return;

//     const exists = savedSearches.some(s => s.term === searchTerm && s.status === statusFilter);
//     if (exists) return;

//     const newSaved = [...savedSearches, { term: searchTerm, status: statusFilter, id: Date.now() }];
//     setSavedSearches(newSaved);
//     localStorage.setItem('erp_saved_searches', JSON.stringify(newSaved));

//     Swal.fire({
//       title: 'Search Saved!',
//       text: 'Your current search and filters have been saved.',
//       icon: 'success',
//       timer: 1500,
//       showConfirmButton: false
//     });
//   };

//   const handleLoadSearch = (search) => {
//     setSearchTerm(search.term);
//     setStatusFilter(search.status || 'all');
//     setCurrentPage(1);

//     if (useAiSearch && search.term) {
//       handleAiSearch(search.term);
//     } else {
//       setAiSearchResults(null);
//     }
//   };

//   const removeSavedSearch = (id) => {
//     const updated = savedSearches.filter(s => s.id !== id);
//     setSavedSearches(updated);
//     localStorage.setItem('erp_saved_searches', JSON.stringify(updated));
//   };

//   // ─── Column Configuration ────────────────────────────────────────────────
//   const availableColumns = [
//     { key: 'CandidateCode', label: 'Candidate ID' },
//     { key: 'EmployeeCode', label: 'Employee ID' },
//     { key: 'Candidate', label: 'Name' },
//     { key: 'Email', label: 'Email' },
//     { key: 'Phone', label: 'Phone' },
//     { key: 'Mobile', label: 'Mobile' },
//     { key: 'JobTitle', label: 'Job Title' },
//     { key: 'YearsOfExperience', label: 'Years of Exp.' },
//     { key: 'Skills', label: 'Skills' },
//     { key: 'CandidateStatus', label: 'Status' },
//     { key: 'RemoteStatus', label: 'Work Type' },
//     { key: 'CreatedDate', label: 'Created Date' },
//     { key: 'LinkedInUrl', label: 'LinkedIn URL' },
//     { key: 'GitHubUrl', label: 'GitHub URL' },
//     { key: 'CurrentLocation', label: 'Location' },
//     { key: 'Gender', label: 'Gender' },
//     { key: 'ProfileSummary', label: 'Profile Summary' },
//     { key: 'PersonType', label: 'Type' },
//     { key: 'IsBench', label: 'Bench Status' },
//     { key: 'Experience', label: 'Experience' },
//     { key: 'Relocation', label: 'Relocation' },
//     { key: 'Source', label: 'Source' },
//     { key: 'Actions', label: 'Actions' },
//   ];

//   const availableSidebarFilters = [
//     { key: 'CandidateStatus', label: 'Status' },
//     { key: 'PersonType', label: 'Type' },
//     { key: 'IsBench', label: 'Bench Status' },
//     { key: 'RemoteStatus', label: 'Work Type' },
//     { key: 'Experience', label: 'Experience' },
//     { key: 'Gender', label: 'Gender' },
//     { key: 'Relocation', label: 'Relocation' },
//     { key: 'CurrentLocation', label: 'Location' },
//     { key: 'Skills', label: 'Skills (Search)' },
//     { key: 'Email', label: 'Email (Search)' },
//     { key: 'Phone', label: 'Phone (Search)' },
//     { key: 'JobTitle', label: 'Job Title (Search)' },
//   ];

//   const [visibleColumns, setVisibleColumns] = useState([
//     'CandidateCode', 'EmployeeCode', 'Candidate', 'Email', 'Phone', 'JobTitle',
//     'YearsOfExperience', 'Skills', 'CandidateStatus', 'RemoteStatus', 'CreatedDate', 'Actions',
//   ]);

//   // ── Fetch candidate list ──────────────────────────────────────────────────
//   const fetchCandidates = useCallback(async (force = false) => {
//     if (_cachedCandidates && !force) {
//       setCandidates(_cachedCandidates);
//       setLoading(false);
//       return;
//     }
//     if (isFetchingRef.current) return;
//     isFetchingRef.current = true;
//     setLoading(true);

//     try {
//       const response = await fetch(`${BASE_URL}/api/resumes`, {
//         headers: getAuthHeaders(),
//       });
//       if (!response.ok) throw new Error(`Server error: ${response.status} ${response.statusText}`);

//       const raw = await response.json();
//       const data = Array.isArray(raw)
//         ? raw
//         : Array.isArray(raw?.data) ? raw.data
//           : Array.isArray(raw?.candidates) ? raw.candidates
//             : [];

//       const transformedCandidates = data.map(transformCandidate);

//       // De-duplicate by CandidateId
//       const uniqueItems = [];
//       const seenIds = new Set();
//       transformedCandidates.forEach(c => {
//         const id = String(c.CandidateId);
//         if (!seenIds.has(id)) {
//           seenIds.add(id);
//           uniqueItems.push(c);
//         }
//       });

//       _cachedCandidates = uniqueItems;
//       setCandidates(uniqueItems);

//     } catch (error) {
//       console.error('[ResumeDashboard] Error fetching candidates:', error);
//       Swal.fire({
//         title: 'Connection Error',
//         html: `<p>Could not load candidates from the server.</p>
//                <small style="color:#888">Make sure the backend server is running and reachable.</small>`,
//         icon: 'error',
//         confirmButtonText: 'OK',
//       });
//       setCandidates([]);
//     } finally {
//       isFetchingRef.current = false;
//       setLoading(false);
//     }
//   }, []);

//   const handleAiSearch = useCallback(async (query) => {
//     if (!query || !query.trim()) {
//       setAiSearchResults(null);
//       return;
//     }

//     setIsAiSearching(true);
//     try {
//       const countMatch = query.match(/(\d+)\s*(?:candidates|results|people)/i);
//       const requestedLimit = countMatch ? parseInt(countMatch[1]) : 50;

//       const response = await fetch(`${BASE_URL}/api/resumes/search`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           ...getAuthHeaders()
//         },
//         body: JSON.stringify({
//           query: query.trim(),
//           top_k: requestedLimit,
//           limit: requestedLimit,
//           size: requestedLimit
//         }),
//       });

//       if (!response.ok) throw new Error('AI Search failed');
//       const data = await response.json();

//       if (data && data.results) {
//         console.log(`🔍 AI Search returned ${data.results.length} results (Requested: ${requestedLimit})`);

//         const seenIds = new Set();
//         const mappedResults = data.results
//           .filter(res => {
//             const id = String(res.candidate_id);
//             if (seenIds.has(id)) return false;
//             seenIds.add(id);
//             return true;
//           })
//           .map(res => {
//             const localMatch = candidates.find(c => String(c.CandidateId) === String(res.candidate_id));

//             if (localMatch) {
//               return {
//                 ...localMatch,
//                 aiScore: res.score,
//                 aiRank: res.rank,
//                 matchReason: res.match_reason
//               };
//             }

//             return {
//               CandidateId: res.candidate_id,
//               FirstName: res.name?.split(' ')[0] || 'Unknown',
//               LastName: res.name?.split(' ').slice(1).join(' ') || '',
//               JobTitle: res.job_title || 'N/A',
//               YearsOfExperience: res.years_experience,
//               Skills: (res.skills || []).map(s => ({ SkillName: s, SkillType: 'HARD' })),
//               CandidateStatus: 'Available',
//               RemoteStatus: res.remote_status || 'OnSite',
//               Contact: {
//                 Email: '',
//                 Phone: '',
//                 Mobile: ''
//               },
//               matchReason: res.match_reason,
//               aiScore: res.score,
//               aiRank: res.rank
//             };
//           });

//         setAiSearchResults(mappedResults);
//         setCurrentPage(1);
//       }
//     } catch (error) {
//       console.error('AI Search Error:', error);
//       Swal.fire({
//         title: 'Search Error',
//         text: 'The AI search service is currently unavailable.',
//         icon: 'error',
//         timer: 2000,
//         showConfirmButton: false
//       });
//     } finally {
//       setIsAiSearching(false);
//     }
//   }, [candidates]);

//   // ── Debounced AI Search Flow ─────────────────────────────────────────────
//   useEffect(() => {
//     if (!useAiSearch || !searchTerm || !searchTerm.trim()) {
//       if (!searchTerm) {
//         setAiSearchResults(null);
//       }
//       // If we cleared the search, we stop searching
//       if (!searchTerm) setIsAiSearching(false);
//       return;
//     }

//     // Immediately indicate searching state to trigger animation
//     setIsAiSearching(true);

//     const timer = setTimeout(() => {
//       handleAiSearch(searchTerm);
//     }, 1200); // Slightly longer debounce for semantic analysis

//     return () => clearTimeout(timer);
//   }, [searchTerm, useAiSearch, handleAiSearch]);

//   // Reset search and filters when view changes
//   useEffect(() => {
//     setSearchTerm('');
//     setAiSearchResults(null);
//     setAdvancedFilters({ rows: [], logic: 'AND' });
//     setCurrentPage(1);
//     fetchCandidates(true);
//   }, [currentView, fetchCandidates]);

//   // ── Navigate to full candidate detail page ────────────────────────────
//   const viewCandidate = (id) => {
//     navigate(`/candidates/${id}`);
//   };

//   // ── Get field value from candidate ──
//   const getFieldValue = useCallback((candidate, field) => {
//     switch (field) {
//       case 'FirstName':
//         return formatFullName(candidate.FirstName, candidate.MiddleName, candidate.LastName);
//       case 'Email': return candidate.Contact?.Email || '';
//       case 'Phone': return candidate.Contact?.Phone || '';
//       case 'Skills':
//         return (candidate.Skills || []).map(s => s.SkillName || s).join(', ');
//       case 'YearsOfExperience': return candidate.YearsOfExperience != null ? String(candidate.YearsOfExperience) : '';
//       case 'CreatedDt': return candidate.CreatedDt || '';
//       default: {
//         const val = candidate[field];
//         return (val !== null && val !== undefined) ? String(val) : '';
//       }
//     }
//   }, []);

//   // ── Check if a candidate matches a single filter row ──
//   const matchesRow = useCallback((candidate, row) => {
//     const rawVal = getFieldValue(candidate, row.field);
//     const target = (row.value || '').trim();

//     if (row.condition === 'is_empty') return !rawVal || String(rawVal).trim() === '';
//     if (row.condition === 'is_not_empty') return rawVal && String(rawVal).trim() !== '';

//     const valStr = String(rawVal || '').trim();
//     const valLower = valStr.toLowerCase();
//     const targetLower = target.toLowerCase();

//     const numVal = parseFloat(valStr);
//     const numTarget = parseFloat(target);
//     const isNumericMatch = !isNaN(numVal) && !isNaN(numTarget) && isFinite(valStr) && isFinite(target);

//     const dateVal = new Date(valStr);
//     const dateTarget = new Date(target);
//     const isDateMatch = !isNaN(dateVal.getTime()) && !isNaN(dateTarget.getTime()) && valStr.includes('-') && target.includes('-');

//     switch (row.condition) {
//       case 'contains': return valLower.includes(targetLower);
//       case 'not_contains': return !valLower.includes(targetLower);
//       case 'equals':
//         if (isNumericMatch) return numVal === numTarget;
//         if (isDateMatch) {
//           const d1 = new Date(dateVal).setHours(0, 0, 0, 0);
//           const d2 = new Date(dateTarget).setHours(0, 0, 0, 0);
//           return d1 === d2;
//         }
//         if (row.field === 'Skills') {
//           return valLower.split(',').map(s => s.trim()).includes(targetLower);
//         }
//         return valLower === targetLower;
//       case 'not_equals':
//         if (isNumericMatch) return numVal !== numTarget;
//         if (isDateMatch) {
//           const d1 = new Date(dateVal).setHours(0, 0, 0, 0);
//           const d2 = new Date(dateTarget).setHours(0, 0, 0, 0);
//           return d1 !== d2;
//         }
//         if (row.field === 'Skills') {
//           return !valLower.split(',').map(s => s.trim()).includes(targetLower);
//         }
//         return valLower !== targetLower;
//       case 'starts_with': return valLower.startsWith(targetLower);
//       case 'ends_with': return valLower.endsWith(targetLower);
//       case 'greater_than':
//         if (isNumericMatch) return numVal > numTarget;
//         if (isDateMatch) return dateVal.setHours(0, 0, 0, 0) > dateTarget.setHours(0, 0, 0, 0);
//         return valLower > targetLower;
//       case 'less_than':
//         if (isNumericMatch) return numVal < numTarget;
//         if (isDateMatch) return dateVal.setHours(0, 0, 0, 0) < dateTarget.setHours(0, 0, 0, 0);
//         return valLower < targetLower;
//       default: return true;
//     }
//   }, [getFieldValue]);

//   // ── Derived filter options ─────────────────────────────────────────────
//   const availableStatuses = useMemo(() => {
//     return ['Available', 'In Process', 'Not Available', 'Hired'];
//   }, []);

//   const availableWorkTypes = useMemo(() => {
//     return ['Remote', 'OnSite', 'Hybrid'];
//   }, []);

//   const availableLocations = useMemo(() => {
//     const locs = [...new Set(candidates.map(c => {
//       if (c.CurrentLocation) {
//         const parts = c.CurrentLocation.split(',').map(p => p.trim());
//         if (parts.length >= 2) {
//           return parts.slice(-2).join(', ');
//         }
//         return parts[0];
//       }
//       return null;
//     }))].filter(Boolean);
//     return locs.sort();
//   }, [candidates]);

//   const availableSources = useMemo(() => {
//     const sources = [...new Set(candidates.map(c => c.Source))].filter(Boolean);
//     return sources.sort();
//   }, [candidates]);

//   const availableEmploymentTypes = useMemo(() => {
//     const types = [...new Set(candidates.map(c => c.EmploymentType))].filter(Boolean);
//     return types.sort();
//   }, [candidates]);

//   const availableIndustries = useMemo(() => {
//     const inds = [...new Set(candidates.map(c => c.Industry))].filter(Boolean);
//     return inds.sort();
//   }, [candidates]);

//   const availableWorkAuths = useMemo(() => {
//     const auths = [...new Set(candidates.map(c => c.WorkAuthorization))].filter(Boolean);
//     return auths.sort();
//   }, [candidates]);

//   const availableGenders = useMemo(() => {
//     const genders = [...new Set(candidates.map(c => c.Gender))].filter(Boolean);
//     return genders.sort();
//   }, [candidates]);

//   // ── Filter & Sort Logic ────────────────────────────────────────────────
//   const filteredCandidates = useMemo(() => {
//     // 1️⃣ Priority: If AI search was just performed, use those results as our working set
//     let result = aiSearchResults !== null ? [...aiSearchResults] : [...candidates];

//     // 2️⃣ Standard global search filtering - Skip if AI Search is active
//     if (aiSearchResults === null && searchTerm && !useAiSearch) {
//       const term = searchTerm.toLowerCase();
//       result = result.filter(c => {
//         const fullName = formatFullName(c.FirstName, c.MiddleName, c.LastName).toLowerCase();
//         const skillsText = (c.Skills || []).map(s => s.SkillName || s).join(' ').toLowerCase();
//         const exp = (c.YearsOfExperience !== undefined && c.YearsOfExperience !== null) ? c.YearsOfExperience : '';
//         const expText = exp !== '' ? `${exp}y ${exp} yr ${exp} year ${exp} years` : '';

//         const matchesName = fullName.includes(term);
//         const matchesJob = visibleSidebarFilters.includes('JobTitle') && (c.JobTitle || '').toLowerCase().includes(term);
//         const matchesCode = (c.CandidateCode || '').toLowerCase().includes(term);
//         const matchesEmail = visibleSidebarFilters.includes('Email') && (c.Contact?.Email || '').toLowerCase().includes(term);
//         const matchesPhone = visibleSidebarFilters.includes('Phone') && (
//           (c.Contact?.Phone || '').toLowerCase().includes(term) ||
//           (c.Contact?.Mobile || '').toLowerCase().includes(term)
//         );
//         const matchesSkills = visibleSidebarFilters.includes('Skills') && skillsText.includes(term);
//         const matchesExp = expText.toLowerCase().includes(term);

//         return matchesName || matchesJob || matchesCode || matchesEmail || matchesPhone || matchesSkills || matchesExp;
//       });
//     }

//     // 3️⃣ Sidebar-specific search filtering - Skip if AI Search is active
//     if (aiSearchResults === null && sidebarFilters.search) {
//       const term = sidebarFilters.search.toLowerCase();
//       result = result.filter(c => {
//         const fullName = formatFullName(c.FirstName, c.MiddleName, c.LastName).toLowerCase();
//         const skillsText = (c.Skills || []).map(s => s.SkillName || s).join(' ').toLowerCase();
//         const exp = (c.YearsOfExperience !== undefined && c.YearsOfExperience !== null) ? c.YearsOfExperience : '';
//         const expText = exp !== '' ? `${exp}y ${exp} yr ${exp} year ${exp} years` : '';

//         const matchesName = fullName.includes(term);
//         const matchesJob = visibleSidebarFilters.includes('JobTitle') && (c.JobTitle || '').toLowerCase().includes(term);
//         const matchesCode = (c.CandidateCode || '').toLowerCase().includes(term);
//         const matchesEmail = visibleSidebarFilters.includes('Email') && (c.Contact?.Email || '').toLowerCase().includes(term);
//         const matchesPhone = visibleSidebarFilters.includes('Phone') && (
//           (c.Contact?.Phone || '').toLowerCase().includes(term) ||
//           (c.Contact?.Mobile || '').toLowerCase().includes(term)
//         );
//         const matchesSkills = visibleSidebarFilters.includes('Skills') && skillsText.includes(term);
//         const matchesExp = expText.toLowerCase().includes(term);

//         return matchesName || matchesJob || matchesCode || matchesEmail || matchesPhone || matchesSkills || matchesExp;
//       });
//     }

//     // Status filter
//     if (statusFilter !== 'all') {
//       result = result.filter(c => {
//         if (statusFilter === 'On Bench') {
//           return c.IsBench === true || c.CandidateStatus === 'On Bench';
//         }
//         return (c.CandidateStatus || '').toLowerCase() === statusFilter.toLowerCase();
//       });
//     }

//     // Category filter based on 'view' query parameter - Skip strict sourcing/review checks if AI Search is active
//     if (aiSearchResults === null) {
//       if (currentView === 'sourcing') {
//         result = result.filter(c => {
//           const hasEmail = (c.Contact?.Email || '').trim();
//           const hasPhone = (c.Contact?.Phone || '').trim() || (c.Contact?.Mobile || '').trim() || (c.Mobile || '').trim();
//           const allowBench = sidebarFilters.isBench === 'bench';
//           return (allowBench || !c.IsBench) && hasEmail && hasPhone;
//         });
//       } else if (currentView === 'bench') {
//         result = result.filter(c => c.IsBench === true);
//       } else if (currentView === 'review') {
//         result = result.filter(c => {
//           const hasEmail = (c.Contact?.Email || '').trim();
//           const hasPhone = (c.Contact?.Phone || '').trim() || (c.Contact?.Mobile || '').trim() || (c.Mobile || '').trim();
//           return !hasEmail || !hasPhone;
//         });
//       }
//     }

//     // Sidebar Filters Logic
//     if ((sidebarFilters.status || []).length > 0) {
//       const selected = sidebarFilters.status.map(s => s.toLowerCase());
//       result = result.filter(c => selected.includes((c.CandidateStatus || '').toLowerCase()));
//     }
//     if ((sidebarFilters.workType || []).length > 0) {
//       const selected = sidebarFilters.workType.map(w => w.toLowerCase());
//       result = result.filter(c => selected.includes((c.RemoteStatus || '').toLowerCase()));
//     }

//     // Advanced location filtering with Country/State/City support
//     if (sidebarFilters.country) {
//       const selectedCountryName = sidebarFilters.country;
//       const selectedCountryCode = getCountryCode(selectedCountryName);

//       result = result.filter(c => {
//         if (!c.CurrentLocation) return false;
//         const locLower = c.CurrentLocation.toLowerCase();
//         return locLower.includes(selectedCountryName.toLowerCase()) ||
//           locLower.includes(selectedCountryCode.toLowerCase());
//       });
//     }

//     if (sidebarFilters.state) {
//       const selectedStateName = sidebarFilters.state;
//       const countryCode = getCountryCode(sidebarFilters.country);
//       const selectedStateCode = getStateCode(countryCode, selectedStateName);

//       result = result.filter(c => {
//         if (!c.CurrentLocation) return false;
//         const locLower = c.CurrentLocation.toLowerCase();
//         return locLower.includes(selectedStateName.toLowerCase()) ||
//           locLower.includes(selectedStateCode.toLowerCase());
//       });
//     }

//     if (sidebarFilters.city) {
//       const cityTerm = sidebarFilters.city.toLowerCase().trim();
//       result = result.filter(c => {
//         if (!c.CurrentLocation) return false;
//         const locLower = c.CurrentLocation.toLowerCase();
//         return locLower.includes(cityTerm);
//       });
//     }

//     if ((sidebarFilters.workAuth || []).length > 0) {
//       const selected = sidebarFilters.workAuth.map(a => a.toLowerCase());
//       result = result.filter(c => selected.includes((c.WorkAuthorization || '').toLowerCase()));
//     }

//     if ((sidebarFilters.employmentTypes || []).length > 0) {
//       const selected = sidebarFilters.employmentTypes.map(t => t.toLowerCase());
//       result = result.filter(c => selected.includes((c.EmploymentType || '').toLowerCase()));
//     }

//     if ((sidebarFilters.industries || []).length > 0) {
//       const selected = sidebarFilters.industries.map(i => i.toLowerCase());
//       result = result.filter(c => selected.includes((c.Industry || '').toLowerCase()));
//     }

//     if ((sidebarFilters.sources || []).length > 0) {
//       const selected = sidebarFilters.sources.map(s => s.toLowerCase());
//       result = result.filter(c => selected.includes((c.Source || '').toLowerCase()));
//     }

//     if ((sidebarFilters.gender || []).length > 0) {
//       const selected = sidebarFilters.gender.map(g => g.toLowerCase());
//       result = result.filter(c => selected.includes((c.Gender || '').toLowerCase()));
//     }

//     if (sidebarFilters.isBench && sidebarFilters.isBench !== 'all') {
//       result = result.filter(c => sidebarFilters.isBench === 'bench' ? c.IsBench : !c.IsBench);
//     }

//     if (sidebarFilters.personType && sidebarFilters.personType !== 'all') {
//       result = result.filter(c => sidebarFilters.personType === 'employees' ? c.IsEmployee : !c.IsEmployee);
//     }

//     if (sidebarFilters.relocate && sidebarFilters.relocate !== 'all') {
//       result = result.filter(c => sidebarFilters.relocate === 'yes' ? c.WillingToRelocate : !c.WillingToRelocate);
//     }

//     if (sidebarFilters.experience !== 'all') {
//       switch (sidebarFilters.experience) {
//         case '0-2': result = result.filter(c => (parseFloat(c.YearsOfExperience) || 0) <= 2); break;
//         case '3-5': result = result.filter(c => { const e = parseFloat(c.YearsOfExperience) || 0; return e > 2 && e <= 5; }); break;
//         case '5-10': result = result.filter(c => { const e = parseFloat(c.YearsOfExperience) || 0; return e > 5 && e <= 10; }); break;
//         case '10+': result = result.filter(c => (parseFloat(c.YearsOfExperience) || 0) > 10); break;
//         default: break;
//       }
//     }

//     // Advanced filters
//     const validRows = (advancedFilters.rows || []).filter(r => r.field && r.condition);
//     if (validRows.length > 0) {
//       result = result.filter(c => {
//         let isMatch = matchesRow(c, validRows[0]);

//         for (let i = 1; i < validRows.length; i++) {
//           const row = validRows[i];
//           const op = row.operator || 'AND';

//           if (op === 'OR') {
//             isMatch = isMatch || matchesRow(c, row);
//           } else {
//             isMatch = isMatch && matchesRow(c, row);
//           }
//         }
//         return isMatch;
//       });
//     }

//     // Standard sorting
//     result.sort((a, b) => {
//       let av, bv;
//       if (sortConfig.key === 'CreatedDt') {
//         av = new Date(a.CreatedDt || 0); bv = new Date(b.CreatedDt || 0);
//       } else if (sortConfig.key === 'YearsOfExperience') {
//         av = a.YearsOfExperience || 0; bv = b.YearsOfExperience || 0;
//       } else if (sortConfig.key === 'Email') {
//         av = (a.Email || '').toLowerCase();
//         bv = (b.Email || '').toLowerCase();
//       } else if (sortConfig.key === 'FirstName') {
//         av = formatFullName(a.FirstName, a.MiddleName, a.LastName).toLowerCase();
//         bv = formatFullName(b.FirstName, b.MiddleName, b.LastName).toLowerCase();
//       } else {
//         av = String(a[sortConfig.key] || '').toLowerCase();
//         bv = String(b[sortConfig.key] || '').toLowerCase();
//       }
//       if (av < bv) return sortConfig.direction === 'asc' ? -1 : 1;
//       if (av > bv) return sortConfig.direction === 'asc' ? 1 : -1;
//       return 0;
//     });

//     return result;
//   }, [candidates, searchTerm, statusFilter, advancedFilters, sortConfig, aiSearchResults, matchesRow, currentView, sidebarFilters, visibleSidebarFilters, useAiSearch]);

//   const totalPages = Math.ceil(filteredCandidates.length / itemsPerPage);
//   const paginatedCandidates = filteredCandidates.slice(
//     (currentPage - 1) * itemsPerPage,
//     currentPage * itemsPerPage
//   );

//   const handleResetFilters = () => {
//     setSearchTerm('');
//     setAiSearchResults(null);
//     setAdvancedFilters({ rows: [], logic: 'AND' });
//     setSortConfig({ key: 'CreatedDt', direction: 'desc' });
//     setStatusFilter('all');
//     setSidebarFilters({
//       search: '',
//       status: [],
//       workType: [],
//       experience: 'all',
//       country: '',
//       state: '',
//       city: '',
//       sources: [],
//       employmentTypes: [],
//       industries: [],
//       isBench: 'all',
//       personType: 'all',
//       gender: [],
//       relocate: 'all',
//       workAuth: []
//     });
//   };

//   const handleApplyFilters = (filters) => {
//     setAdvancedFilters(filters);
//     setCurrentPage(1);
//   };

//   const requestSort = (key) => {
//     setSortConfig(prev => ({
//       key,
//       direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
//     }));
//     setCurrentPage(1);
//   };

//   const editCandidate = (candidate) => {
//     setEditingCandidate(candidate);
//     setParsedResumeData(null);
//     setShowAddModal(true);
//   };

//   const getFullCandidate = async (id) => {
//     const response = await fetch(`${BASE_URL}/api/resumes/${id}`, {
//       headers: getAuthHeaders(),
//     });
//     if (!response.ok) throw new Error('Failed to fetch details');
//     const data = await response.json();
//     return transformCandidate(data);
//   };

//   const deleteCandidate = async (id) => {
//     const candidate = candidates.find(c => c.CandidateId === id);
//     const name = formatFullName(candidate?.FirstName, candidate?.MiddleName, candidate?.LastName);

//     const confirm = await Swal.fire({
//       title: 'Delete Candidate?',
//       text: `This will permanently delete ${name}'s record.`,
//       icon: 'warning',
//       showCancelButton: true,
//       confirmButtonColor: '#ef4444',
//       cancelButtonColor: '#6b7280',
//       confirmButtonText: 'Yes, delete',
//     });

//     if (confirm.isConfirmed) {
//       try {
//         const response = await fetch(`${BASE_URL}/api/resumes/${id}`, {
//           method: 'DELETE',
//           headers: getAuthHeaders(),
//         });
//         if (!response.ok) throw new Error('Failed to delete candidate');
//         setCandidates(prev => prev.filter(c => c.CandidateId !== id));
//         Swal.fire({ title: 'Deleted!', text: `${name} has been removed.`, icon: 'success', timer: 1800, showConfirmButton: false });
//       } catch (error) {
//         console.error('Error deleting candidate:', error);
//         Swal.fire({ title: 'Error', text: 'Failed to delete candidate', icon: 'error' });
//       }
//     }
//   };

//   // ── Parse Resume Flow ──────────────────────────────────────────────────
//   const handleParseFileSelect = (e) => {
//     const file = e.target.files?.[0];
//     if (!file) return;
//     e.target.value = '';
//     setPendingParseFile(file);
//     setShowConfirmParse(true);
//   };

//   const handleConfirmParse = async () => {
//     if (!pendingParseFile) return;
//     setShowConfirmParse(false);
//     setShowParsingLoading(true);
//     setParsingFromToolbar(true);

//     try {
//       const formData = new FormData();
//       formData.append('file1', pendingParseFile);

//       const response = await fetch(`${BASE_URL}/api/resumes/parse`, {
//         method: 'POST',
//         headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
//         body: formData
//       });
//       if (!response.ok) throw new Error('Failed to parse resume');

//       const data = await response.json();
//       const parsed = {
//         FirstName: formatName(data.firstName || ''),
//         LastName: formatName(data.lastName || ''),
//         MiddleName: formatName(data.middleName || ''),
//         Email: data.email || '',
//         Phone: data.phone || '',
//         Mobile: data.mobile || '',
//         TwitterUrl: data.twitterUrl || '',
//         VideoResumeUrl: data.videoResumeUrl || '',
//         JobTitle: formatJobTitle(data.jobTitle || ''),
//         YearsOfExperience: data.yearsOfExperience ? parseFloat(data.yearsOfExperience) : '',
//         ProfileSummary: data.profileSummary || '',
//         LinkedInUrl: data.linkedInUrl || '',
//         GitHubUrl: data.gitHubUrl || '',
//         Gender: data.gender || '',
//         CurrentLocation: data.currentLocation || '',
//         cityName: data.cityName || '',
//         stateName: data.stateName || '',
//         countryIso2: data.countryIso2 || '',
//         countryName: data.countryName || '',
//         WorkAuthorization: data.workAuthorization || '',
//         EmploymentType: data.employmentType || '',
//         skills: (data.skills || []).map(s => ({ SkillName: typeof s === 'string' ? s : s.skill_name || '', SkillType: 'HARD' })),
//         workExperience: (data.workExperience || []).map(exp => ({
//           Company: exp.company || '',
//           JobTitle: formatJobTitle(exp.jobTitle || ''),
//           StartDate: exp.startDate || '', EndDate: exp.endDate || '',
//           IsCurrent: exp.isCurrent || false, Description: exp.description || '',
//         })),
//         education: (data.education || []).map(edu => ({
//           Institution: formatName(edu.institution || ''),
//           Degree: formatName(edu.degree || ''),
//           FieldOfStudy: edu.fieldOfStudy || '', StartDate: edu.startDate || '',
//           EndDate: edu.endDate || '', GPA: edu.gpa || '',
//         })),
//         certifications: (data.certifications || []).map(cert => ({
//           CertificationName: formatName(cert.name || ''),
//           IssuingOrganization: cert.issuingOrg || '',
//           IssueDate: cert.issueDate || '', ExpiryDate: cert.expiryDate || '',
//           CredentialId: cert.credentialId || '', CredentialUrl: cert.credentialUrl || '',
//         })),
//         ResumeFile: pendingParseFile,
//         RawPayloadJson: JSON.stringify(data),
//         ParseStatus: data.parseStatus || data.parse_status || 'SUCCESS',
//         ParsedText: data.parsedText || data.parsed_text || '',
//         ParserVendor: data.vendor || 'llama-3.1-8b-instant',
//         ExtractedEmail: data.email || data.extracted_email || '',
//         ExtractedPhone: data.phone || data.mobile || data.extracted_phone || '',
//       };

//       const dup = candidates.find(c =>
//         (parsed.Email && c.Contact?.Email?.toLowerCase() === parsed.Email.toLowerCase()) ||
//         (parsed.LinkedInUrl && c.LinkedInUrl?.toLowerCase() === parsed.LinkedInUrl.toLowerCase())
//       );

//       setShowParsingLoading(false);

//       if (dup) {
//         setParsedResumeData(parsed);
//         setDuplicateCandidate(dup);
//         setShowDuplicateModal(true);
//       } else {
//         setParsedResumeData(parsed);
//         setEditingCandidate(null);
//         setShowAddModal(true);
//       }

//     } catch (error) {
//       console.error('Error parsing resume:', error);
//       setShowParsingLoading(false);
//       Swal.fire({ title: 'Error', text: 'Failed to parse resume. Please try again or add candidate manually.', icon: 'error' });
//     } finally {
//       setParsingFromToolbar(false);
//       setPendingParseFile(null);
//     }
//   };

//   const handleDuplicateAction = async (action) => {
//     setShowDuplicateModal(false);

//     if (action === 'cancel') {
//       setParsedResumeData(null);
//       setDuplicateCandidate(null);
//       return;
//     }

//     let fullDuplicateCandidate = duplicateCandidate;
//     try {
//       Swal.fire({ title: 'Loading...', text: 'Fetching candidate details', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
//       const response = await fetch(`${BASE_URL}/api/resumes/${duplicateCandidate.CandidateId}`, { headers: getAuthHeaders() });
//       if (response.ok) {
//         const data = await response.json();
//         fullDuplicateCandidate = transformCandidate(data);
//       }
//       Swal.close();
//     } catch (e) {
//       console.error('Error fetching duplicate candidate full details:', e);
//       Swal.close();
//     }

//     if (action === 'add_resume') {
//       setParsedResumeData({ ResumeFile: parsedResumeData.ResumeFile });
//       setEditingCandidate(fullDuplicateCandidate);
//       setShowAddModal(true);
//     }
//     else if (action === 'overwrite') {
//       setEditingCandidate({
//         CandidateId: fullDuplicateCandidate.CandidateId,
//         Document: fullDuplicateCandidate.Document,
//         Contact: { Email: fullDuplicateCandidate.Contact?.Email }
//       });
//       setShowAddModal(true);
//     }
//     else if (action === 'append') {
//       const synthCandidate = { ...fullDuplicateCandidate };

//       for (const [key, value] of Object.entries(parsedResumeData)) {
//         if (typeof value === 'string' && value.trim() !== '') {
//           synthCandidate[key] = value;
//         } else if (typeof value === 'number') {
//           synthCandidate[key] = value;
//         }
//       }

//       const appendedSkills = [...(fullDuplicateCandidate.Skills || [])];
//       (parsedResumeData.skills || []).forEach(s => appendedSkills.push({ ...s }));
//       synthCandidate.Skills = appendedSkills;

//       synthCandidate.WorkExperience = [...(fullDuplicateCandidate.WorkExperience || []), ...(parsedResumeData.workExperience || [])];
//       synthCandidate.Education = [...(fullDuplicateCandidate.Education || []), ...(parsedResumeData.education || [])];
//       synthCandidate.Certifications = [...(fullDuplicateCandidate.Certifications || []), ...(parsedResumeData.certifications || [])];

//       setParsedResumeData({ ResumeFile: parsedResumeData.ResumeFile });
//       setEditingCandidate(synthCandidate);
//       setShowAddModal(true);
//     }
//   };

//   // ── Resume upload / extract ──
//   const handleResumeUpload = async (file) => {
//     try {
//       setUploadingResume(true);
//       const formData = new FormData();
//       formData.append('file1', file);

//       const response = await fetch(`${BASE_URL}/api/resumes/parse`, {
//         method: 'POST',
//         headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
//         body: formData
//       });
//       if (!response.ok) throw new Error('Failed to parse resume');

//       const data = await response.json();
//       return {
//         FirstName: formatName(data.firstName || ''),
//         LastName: formatName(data.lastName || ''),
//         MiddleName: formatName(data.middleName || ''),
//         Email: data.email || '',
//         Phone: data.phone || '',
//         Mobile: data.mobile || '',
//         TwitterUrl: data.twitterUrl || '',
//         VideoResumeUrl: data.videoResumeUrl || '',
//         JobTitle: formatJobTitle(data.jobTitle || ''),
//         YearsOfExperience: data.yearsOfExperience ? parseFloat(data.yearsOfExperience) : '',
//         ProfileSummary: data.profileSummary || '',
//         LinkedInUrl: data.linkedInUrl || '',
//         GitHubUrl: data.gitHubUrl || '',
//         Gender: data.gender || '',
//         CurrentLocation: data.currentLocation || '',
//         cityName: data.cityName || '',
//         stateName: data.stateName || '',
//         countryIso2: data.countryIso2 || '',
//         countryName: data.countryName || '',
//         WorkAuthorization: data.workAuthorization || '',
//         EmploymentType: data.employmentType || '',
//         Skills: (data.skills || []).map(s => ({ SkillName: typeof s === 'string' ? s : s.skill_name || '', SkillType: 'HARD' })),
//         WorkExperience: (data.workExperience || []).map(exp => ({
//           Company: exp.company || '',
//           JobTitle: formatJobTitle(exp.jobTitle || ''),
//           StartDate: exp.startDate || '',
//           EndDate: exp.endDate || '',
//           IsCurrent: exp.isCurrent || false,
//           Description: exp.description || '',
//         })),
//         Education: (data.education || []).map(edu => ({
//           Institution: formatName(edu.institution || ''),
//           Degree: formatName(edu.degree || ''),
//           FieldOfStudy: edu.fieldOfStudy || '',
//           StartDate: edu.startDate || '',
//           EndDate: edu.endDate || '',
//           GPA: edu.gpa || '',
//         })),
//         Certifications: (data.certifications || []).map(cert => ({
//           CertificationName: formatName(cert.name || ''),
//           IssuingOrganization: cert.issuingOrg || '',
//           IssueDate: cert.issueDate || '',
//           ExpiryDate: cert.expiryDate || '',
//           CredentialId: cert.credentialId || '',
//           CredentialUrl: cert.credentialUrl || '',
//         })),
//         RawPayloadJson: JSON.stringify(data),
//         ParseStatus: data.parseStatus || data.parse_status || 'SUCCESS',
//         ParsedText: data.parsedText || data.parsed_text || '',
//         ParserVendor: data.vendor || 'llama-3.1-8b-instant',
//         ExtractedEmail: data.email || data.extracted_email || '',
//         ExtractedPhone: data.phone || data.mobile || data.extracted_phone || '',
//       };
//     } catch (error) {
//       console.error('Error parsing resume:', error);
//       Swal.fire({ title: 'Error', text: 'Failed to parse resume. Please fill the form manually.', icon: 'error' });
//       return null;
//     } finally {
//       setUploadingResume(false);
//     }
//   };

//   // ── Save candidate ──
//   const handleSaveCandidate = async (data) => {
//     try {
//       setUploadingResume(true);

//       if (data.currentLocation && data.currentLocation.trim()) {
//         const parts = data.currentLocation.split(',').map(s => s.trim()).filter(Boolean);
//         console.log(`📍 Location being saved: "${data.currentLocation}" (${parts.length} parts)`);
//       }

//       const isEditing = !!(editingCandidate?.CandidateId || data.candidateId);
//       const candidateId = editingCandidate?.CandidateId || data.candidateId;

//       const formData = new FormData();

//       const firstName = formatName(data.firstName || data.FirstName || '');
//       const lastName = formatName(data.lastName || data.LastName || '');
//       const middleName = formatName(data.middleName || data.MiddleName || '');
//       const jobTitle = formatJobTitle(data.jobTitle || data.JobTitle || '');

//       formData.append('FirstName', firstName);
//       formData.append('LastName', lastName);
//       formData.append('MiddleName', middleName);
//       formData.append('EmailID', (data.email || data.Email || '').trim());
//       formData.append('Phone', (data.phone || data.Phone || '').trim());
//       formData.append('Mobile', (data.mobile || data.Mobile || '').trim());
//       formData.append('JobTitle', jobTitle);
//       formData.append('YearsOfExperience', data.yearsOfExperience ?? data.YearsOfExperience ?? '');
//       formData.append('Gender', (data.gender || data.Gender || '').trim());
//       formData.append('ProfileSummary', (data.profileSummary || data.ProfileSummary || '').trim());
//       formData.append('LinkedInProfile', (data.linkedInUrl || data.LinkedInUrl || '').trim());
//       formData.append('GitHubUrl', (data.gitHubUrl || data.GitHubUrl || '').trim());
//       formData.append('TwitterUrl', (data.twitterUrl || data.TwitterUrl || '').trim());
//       formData.append('VideoResumeUrl', (data.videoResumeUrl || data.VideoResumeUrl || '').trim());
//       formData.append('CandidateStatus', data.candidateStatus || data.CandidateStatus || 'Available');
//       formData.append('RemoteStatus', data.remoteStatus || data.RemoteStatus || 'OnSite');
//       formData.append('CurrentLocation', (data.currentLocation || data.CurrentLocation || '').trim());

//       formData.append('WorkAuthorization', data.workAuthorization || data.WorkAuthorization || '');
//       formData.append('EmploymentType', data.employmentType || data.EmploymentType || '');
//       formData.append('SecurityClearance', data.securityClearance || data.SecurityClearance || '');
//       formData.append('WillingToRelocate', data.willingToRelocate ? 'true' : 'false');
//       formData.append('IsBench', data.isBench ? 'true' : 'false');
//       formData.append('ExpectedRateFrom', data.expectedRateFrom || data.ExpectedRateFrom || '');
//       formData.append('ExpectedRateTo', data.expectedRateTo || data.ExpectedRateTo || '');
//       formData.append('ExpectedRateType', data.expectedRateType || data.ExpectedRateType || 'Hourly');
//       formData.append('CurrentRate', data.currentRate || data.CurrentRate || '');
//       formData.append('CurrentRateType', data.currentRateType || data.CurrentRateType || 'Hourly');
//       formData.append('MaritalStatus', data.maritalStatus || data.MaritalStatus || '');
//       formData.append('Industry', data.industry || data.Industry || '');

//       const skillsList = (data.skills || data.Skills || []).map(s =>
//         typeof s === 'string' ? s : (s.SkillName || s.skillName || '')
//       ).filter(Boolean);
//       formData.append('Skills', JSON.stringify(skillsList));

//       const workList = (data.workExperience || data.WorkExperience || [])
//         .filter(w => (w.company || w.Company || '').trim() || (w.jobTitle || w.JobTitle || '').trim())
//         .map(exp => ({
//           Company: (exp.company || exp.Company || '').trim(),
//           JobTitle: formatJobTitle(exp.jobTitle || exp.JobTitle || ''),
//           StartDate: exp.startDate || exp.StartDate || '',
//           EndDate: exp.endDate || exp.EndDate || '',
//           IsCurrent: exp.isCurrent ?? exp.IsCurrent ?? false,
//           Description: (exp.description || exp.Description || '').trim(),
//         }));
//       formData.append('WorkExperience', JSON.stringify(workList));

//       const eduList = (data.education || data.Education || [])
//         .filter(e => (e.institution || e.Institution || '').trim() || (e.degree || e.Degree || '').trim())
//         .map(edu => ({
//           Institution: formatName(edu.institution || edu.Institution || ''),
//           Degree: formatName(edu.degree || edu.Degree || ''),
//           FieldOfStudy: (edu.fieldOfStudy || edu.FieldOfStudy || '').trim(),
//           StartDate: edu.startDate || edu.StartDate || '',
//           EndDate: edu.endDate || edu.EndDate || '',
//           GPA: (edu.gpa || edu.GPA || '').trim(),
//         }));
//       formData.append('Education', JSON.stringify(eduList));

//       const certList = (data.certifications || data.Certifications || [])
//         .filter(c => (c.name || c.CertificationName || '').trim())
//         .map(cert => ({
//           CertificationName: formatName(cert.name || cert.CertificationName || ''),
//           IssuingOrganization: (cert.issuingOrg || cert.IssuingOrganization || '').trim(),
//           IssueDate: cert.issueDate || cert.IssueDate || '',
//           ExpiryDate: cert.expiryDate || cert.ExpiryDate || '',
//           CredentialId: (cert.credentialId || cert.CredentialId || '').trim(),
//           CredentialUrl: (cert.credentialUrl || cert.CredentialUrl || '').trim(),
//         }));
//       formData.append('Certifications', JSON.stringify(certList));

//       if (data.ResumeFile) {
//         formData.append('ResumeUpload', data.ResumeFile);
//       }

//       if (data.RawPayloadJson) formData.append('RawPayloadJson', data.RawPayloadJson);
//       if (data.ParseStatus) formData.append('ParseStatus', data.ParseStatus);
//       if (data.ParsedText) formData.append('ParsedText', data.ParsedText);
//       if (data.ParserVendor) formData.append('ParserVendor', data.ParserVendor);
//       if (data.ExtractedEmail) formData.append('ExtractedEmail', data.ExtractedEmail);
//       if (data.ExtractedPhone) formData.append('ExtractedPhone', data.ExtractedPhone);

//       const additionalDocs = (data.documents || []).filter(d => d.file instanceof File);
//       let docIndex = 0;
//       for (const doc of additionalDocs) {
//         formData.append(`AdditionalDoc_${docIndex}`, doc.file);
//         formData.append(`AdditionalDoc_${docIndex}_Name`, doc.documentName || doc.file.name);
//         formData.append(`AdditionalDoc_${docIndex}_Type`, doc.documentType || 'Certificate');
//         docIndex++;
//       }
//       formData.append('AdditionalDocsCount', String(docIndex));

//       const url = isEditing
//         ? `${BASE_URL}/api/resumes/${candidateId}`
//         : `${BASE_URL}/api/resumes`;

//       const response = await fetch(url, {
//         method: isEditing ? 'PUT' : 'POST',
//         headers: getAuthHeaders(),
//         body: formData,
//       });

//       if (!response.ok) {
//         const errorData = await response.json().catch(() => ({}));
//         throw new Error(errorData.error || errorData.detail || 'Failed to save candidate');
//       }

//       _cachedCandidates = null;
//       await fetchCandidates(true);
//       setShowAddModal(false);
//       setEditingCandidate(null);
//       setParsedResumeData(null);
//       Swal.fire({ title: 'Success!', text: 'Candidate saved successfully.', icon: 'success', timer: 1800, showConfirmButton: false });

//     } catch (error) {
//       console.error('Error saving candidate:', error);
//       Swal.fire({ title: 'Error', text: error.message || 'Failed to save candidate', icon: 'error' });
//     } finally {
//       setUploadingResume(false);
//     }
//   };

//   const exportToExcel = () => {
//     setExporting(true);
//     const data = filteredCandidates.map(c => ({
//       'Candidate Code': c.CandidateCode,
//       'First Name': c.FirstName,
//       'Last Name': c.LastName,
//       'Middle Name': c.MiddleName || '',
//       'Job Title': c.JobTitle,
//       'Email': c.Contact?.Email || '',
//       'Phone': c.Contact?.Phone || '',
//       'Mobile': c.Mobile || '',
//       'Twitter URL': c.TwitterUrl || '',
//       'Video Resume URL': c.VideoResumeUrl || '',
//       'Years of Experience': c.YearsOfExperience,
//       'Gender': c.Gender,
//       'Candidate Status': c.CandidateStatus,
//       'Remote Status': c.RemoteStatus,
//       'Work Authorization': c.WorkAuthorization || '',
//       'Employment Type': c.EmploymentType || '',
//       'Security Clearance': c.SecurityClearance || '',
//       'Willing to Relocate': c.WillingToRelocate ? 'Yes' : 'No',
//       'Expected Rate From': c.ExpectedRateFrom || '',
//       'Expected Rate To': c.ExpectedRateTo || '',
//       'Expected Rate Type': c.ExpectedRateType || '',
//       'Current Rate': c.CurrentRate || '',
//       'Current Rate Type': c.CurrentRateType || '',
//       'Marital Status': c.MaritalStatus || '',
//       'Industry': c.Industry || '',
//       'LinkedIn': c.LinkedInUrl || '',
//       'GitHub': c.GitHubUrl || '',
//       'Location': c.CurrentLocation || '',
//       'Profile Summary': c.ProfileSummary || '',
//       'Skills': (c.Skills || []).map(s => s.SkillName || s).join(', '),
//       'Resume File': c.Document?.FileNameOriginal || '',
//       'Created Date': formatDate(c.CreatedDt),
//     }));
//     const ws = XLSX.utils.json_to_sheet(data);
//     const wb = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(wb, ws, 'Candidates');
//     XLSX.writeFile(wb, `candidates_${new Date().toISOString().split('T')[0]}.xlsx`);
//     setExporting(false);
//     Swal.fire({ title: 'Exported!', text: `${data.length} candidates exported.`, icon: 'success', timer: 1800, showConfirmButton: false });
//   };

//   if (loading) {
//     return (
//       <div className="cm-loading-container">
//         <div className="cm-loading-spinner"></div>
//         <p className="cm-loading-text">Loading candidates...</p>
//       </div>
//     );
//   }

//   return (
//     <div className="cm-dashboard" style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: '24px' }}>
//       {/* Header Area */}
//       <div style={{ padding: '16px 32px 12px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
//         <div>
//           <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#111827', margin: 0, lineHeight: 1.2 }}>
//             {currentView === 'sourcing' ? 'Sourcing' :
//               currentView === 'bench' ? 'Bench Candidates' :
//                 currentView === 'review' ? 'Need To Review' :
//                   'Candidates'}
//           </h1>
//           <p style={{ color: '#6b7280', fontSize: '14px', margin: '4px 0 0 0' }}>
//             {currentView === 'sourcing' ? 'Explore active sourcing candidates' :
//               currentView === 'bench' ? 'Manage bench candidates' :
//                 currentView === 'review' ? 'Review candidates with missing information' :
//                   'Manage and explore your candidate database'}
//           </p>
//         </div>

//         <div className="cm-toolbar-actions" style={{ flexWrap: 'wrap', borderBottom: 'none' }}>
//           {selectedCandidateIds.length > 0 && (
//             <button
//               className="cm-btn cm-btn-primary"
//               style={{ backgroundColor: '#0d9488', borderColor: '#0d9488', marginRight: '8px' }}
//               onClick={() => {
//                 const selectedCands = candidates.filter(c => selectedCandidateIds.includes(c.CandidateId));
//                 setShareModalCandidates(selectedCands);
//                 setShowShareModal(true);
//               }}
//             >
//               <Share2 size={16} /> Share Bulk Profile
//             </button>
//           )}

//           <button className="cm-btn cm-btn-primary" style={{ backgroundColor: '#0d9488', borderColor: '#0d9488' }} onClick={() => { setEditingCandidate(null); setParsedResumeData(null); setShowAddModal(true); }}>
//             <Plus size={16} /> Add Candidate
//           </button>
//           <button
//             className="cm-btn cm-btn-outline"
//             onClick={() => parseFileInputRef.current?.click()}
//             disabled={parsingFromToolbar}
//           >
//             {parsingFromToolbar
//               ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Parsing...</>
//               : <><Upload size={16} /> Parse Resume</>}
//           </button>
//           <input
//             ref={parseFileInputRef}
//             type="file"
//             accept=".pdf,.doc,.docx,.txt"
//             style={{ display: 'none' }}
//             onChange={handleParseFileSelect}
//           />
//           <button className="cm-btn cm-btn-outline" onClick={exportToExcel} disabled={exporting}>
//             <Download size={16} /> {exporting ? 'Exporting...' : 'Export'}
//           </button>

//           <button className="cm-btn cm-btn-outline" title="Manage Columns" onClick={() => setShowColumnSidebar(true)} style={{ padding: '0 10px' }}>
//             <SlidersHorizontal size={16} />
//           </button>

//           <button
//             className={`cm-btn cm-btn-outline ${showFilterSidebar ? 'cm-btn-icon--active' : ''}`}
//             title={showFilterSidebar ? "Close Sidebar" : "Open Sidebar"}
//             onClick={() => setShowFilterSidebar(prev => !prev)}
//             style={{ padding: '0 10px' }}
//           >
//             {showFilterSidebar ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
//           </button>

//           <button
//             className={`cm-btn cm-btn-outline ${advancedFilters.rows.filter(r => r.field && r.condition).length > 0 ? 'cm-btn-icon--active' : ''}`}
//             title="Filters"
//             onClick={() => setShowFilterModal(true)}
//             style={{
//               padding: '0 10px', ...(advancedFilters.rows.filter(r => r.field && r.condition).length > 0 ? {
//                 background: '#f0fdf4', border: '1px solid #14b8a6', color: '#0d9488'
//               } : {})
//             }}
//           >
//             <Filter size={16} />
//             {advancedFilters.rows.filter(r => r.field && r.condition).length > 0 && (
//               <span style={{
//                 position: 'absolute', top: -4, right: -4,
//                 width: 16, height: 16, borderRadius: '50%',
//                 background: '#0d9488', color: '#fff',
//                 fontSize: 9, fontWeight: 800,
//                 display: 'flex', alignItems: 'center', justifyContent: 'center',
//               }}>
//                 {advancedFilters.rows.filter(r => r.field && r.condition).length}
//               </span>
//             )}
//           </button>

//           <button
//             className={`cm-ask-ai-btn ${showAiSidebar ? 'cm-ask-ai-btn--active' : ''}`}
//             title="Ask AI"
//             onClick={() => setShowAiSidebar(prev => !prev)}
//             style={{ marginLeft: '4px' }}
//           >
//             <Sparkles size={15} />
//             Ask AI
//           </button>
//         </div>
//       </div>

//       {/* Search & Saved Filters Area */}
//       <div style={{ margin: '0 32px 12px 32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

//         {/* Top Row: Search Input */}
//         <div
//           className="cm-modern-search-bar"
//           style={{
//             display: 'flex', alignItems: 'center',
//             border: '1px solid #e2e8f0', borderRadius: '8px',
//             padding: '4px 8px 4px 16px', height: '40px',
//             transition: 'all 0.2s ease', background: '#fff',
//             boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
//           }}
//           onFocus={(e) => { e.currentTarget.style.borderColor = '#0d9488'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(13, 148, 136, 0.15)'; }}
//           onBlur={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.02)'; }}
//         >
//           <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginRight: '10px', flexShrink: 0 }}>
//             <Search
//               size={17}
//               color={useAiSearch ? "#229C8B" : "#64748b"}
//               className={isAiSearching ? "cm-pulse" : ""}
//               style={{ cursor: 'pointer' }}
//               onClick={() => {
//                 if (useAiSearch) {
//                   handleAiSearch(searchTerm);
//                 } else {
//                   setAiSearchResults(null);
//                   setCurrentPage(1);
//                 }
//               }}
//               title={useAiSearch ? "Search with AI" : "Search by keyword"}
//             />
//             <Sparkles
//               size={8}
//               color="#229C8B"
//               style={{
//                 position: 'absolute', top: -3, right: -4,
//                 animation: 'cm-spin 4s linear infinite',
//                 opacity: 0.8
//               }}
//             />
//           </div>
//           <input
//             className="cm-search-input-modern"
//             placeholder={useAiSearch ? "Ask AI for semantic search..." : "Search by keyword..."}
//             value={searchTerm}
//             onChange={e => {
//               const val = e.target.value;
//               setSearchTerm(val);
//               if (!useAiSearch) {
//                 if (!val) setAiSearchResults(null);
//                 setCurrentPage(1);
//               }
//             }}
//             onKeyDown={e => {
//               if (e.key === 'Enter') {
//                 if (useAiSearch) {
//                   // Manual trigger if user hits enter early
//                   handleAiSearch(searchTerm);
//                 } else {
//                   setAiSearchResults(null);
//                   setCurrentPage(1);
//                 }
//               }
//             }}
//             style={{
//               border: 'none', outline: 'none', background: 'transparent',
//               flex: 1, fontSize: '14px', color: '#0f172a', height: '100%',
//               fontFamily: 'inherit'
//             }}
//           />
//           {isAiSearching && (
//             <div style={{ marginRight: '10px', display: 'flex', alignItems: 'center' }}>
//               <Loader size={14} style={{ animation: 'cm-spin 1s linear infinite', color: '#229C8B' }} />
//             </div>
//           )}
//           <div style={{ width: '1px', height: '20px', background: '#e2e8f0', margin: '0 8px' }}></div>
//           <button
//             onClick={() => {
//               const next = !useAiSearch;
//               setUseAiSearch(next);
//               if (!next) setAiSearchResults(null);
//             }}
//             style={{
//               display: 'flex', alignItems: 'center', gap: '6px',
//               padding: '4px 12px', border: useAiSearch ? '1px solid #14b8a6' : '1px solid #e2e8f0',
//               borderRadius: '20px', background: useAiSearch ? '#f0fdfa' : '#fff',
//               color: useAiSearch ? '#0d9488' : '#64748b', fontSize: '12px',
//               fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s ease',
//               marginRight: '8px'
//             }}
//           >
//             <Sparkles size={13} color={useAiSearch ? "#14b8a6" : "#94a3b8"} fill={useAiSearch ? "#14b8a6" : "none"} />
//             AI Search: {useAiSearch ? 'ON' : 'OFF'}
//           </button>
//           <button
//             onClick={handleSaveSearch}
//             className="cm-btn"
//             style={{
//               height: '28px', background: '#f8fafc', color: '#475569',
//               border: '1px solid transparent', borderRadius: '6px',
//               padding: '0 12px', fontWeight: 500, display: 'flex',
//               gap: '6px', alignItems: 'center', transition: 'all 0.2s',
//               flexShrink: 0, fontSize: '12.5px'
//             }}
//             onMouseOver={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#0f172a'; }}
//             onMouseOut={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#475569'; }}
//           >
//             <Bookmark size={14} /> Save
//           </button>
//         </div>

//         {/* Bottom Area: Saved Searches */}
//         <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
//           <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', scrollbarWidth: 'none', flexShrink: 1, paddingBottom: '2px' }}>
//             {savedSearches.map((s) => {
//               const isActive = s.term === searchTerm && s.status === statusFilter;
//               return (
//                 <button
//                   key={s.id}
//                   onClick={() => handleLoadSearch(s)}
//                   style={{
//                     fontSize: '12.5px',
//                     padding: '0 8px 0 10px',
//                     height: '26px',
//                     borderRadius: '6px',
//                     border: '1px solid transparent',
//                     background: isActive ? '#0d9488' : '#f1f5f9',
//                     color: isActive ? '#fff' : '#475569',
//                     cursor: 'pointer',
//                     display: 'flex',
//                     alignItems: 'center',
//                     gap: '6px',
//                     whiteSpace: 'nowrap',
//                     transition: 'all 0.2s ease',
//                     fontWeight: isActive ? 500 : 400,
//                     flexShrink: 0
//                   }}
//                   title={`Load search: ${s.term || 'All'} in ${s.status}`}
//                   onMouseOver={(e) => { if (!isActive) { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#0f172a'; } }}
//                   onMouseOut={(e) => { if (!isActive) { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#475569'; } }}
//                 >
//                   <span>{s.term || 'All'} {s.status !== 'all' ? `(${s.status})` : ''}</span>
//                   <span
//                     onClick={(e) => { e.stopPropagation(); removeSavedSearch(s.id); }}
//                     style={{
//                       display: 'flex', alignItems: 'center', justifyContent: 'center',
//                       width: '18px', height: '18px', borderRadius: '4px', transition: 'all 0.2s',
//                       color: isActive ? '#fff' : '#94a3b8'
//                     }}
//                     onMouseOver={(e) => { e.currentTarget.style.background = isActive ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.05)'; e.currentTarget.style.color = isActive ? '#fff' : '#0f172a'; }}
//                     onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = isActive ? '#fff' : '#94a3b8'; }}
//                   >
//                     <X size={13} />
//                   </span>
//                 </button>
//               );
//             })}
//           </div>

//           {savedSearches.length > 0 && (
//             <button
//               onClick={() => { setSavedSearches([]); localStorage.removeItem('erp_saved_searches'); }}
//               style={{ marginLeft: 'auto', background: 'none', border: 'none', fontSize: '12px', color: '#cbd5e1', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', transition: 'color 0.2s', padding: 0 }}
//               onMouseOver={(e) => e.currentTarget.style.color = '#ef4444'}
//               onMouseOut={(e) => e.currentTarget.style.color = '#cbd5e1'}
//             >
//               Clear
//             </button>
//           )}
//         </div>
//       </div>

//       {/* Main Content Layout */}
//       <div style={{ display: 'flex', borderTop: '1px solid #e2e8f0', minHeight: 'calc(100vh - 180px)' }}>
//         {/* Left Sidebar Filter */}
//         {showFilterSidebar ? (
//           <CandidateFilterSidebar
//             totalCount={filteredCandidates.length}
//             overallTotal={candidates.length}
//             filters={sidebarFilters}
//             setFilters={setSidebarFilters}
//             onClearAll={handleResetFilters}
//             availableStatuses={availableStatuses}
//             availableWorkTypes={availableWorkTypes}
//             availableLocations={availableLocations}
//             availableSources={availableSources}
//             availableEmploymentTypes={availableEmploymentTypes}
//             availableIndustries={availableIndustries}
//             availableWorkAuths={availableWorkAuths}
//             availableGenders={availableGenders}
//             onClose={() => setShowFilterSidebar(false)}
//             visibleColumns={visibleSidebarFilters}
//             setVisibleColumns={setVisibleSidebarFilters}
//           />
//         ) : (
//           <div
//             className="cm-sidebar-reopen-strip"
//             onClick={() => setShowFilterSidebar(true)}
//             title="Open Filters"
//             style={{
//               width: '12px',
//               background: '#f1f5f9',
//               borderRight: '1px solid #e2e8f0',
//               cursor: 'pointer',
//               display: 'flex',
//               alignItems: 'center',
//               justifyContent: 'center',
//               transition: 'all 0.2s ease',
//               position: 'relative',
//               zIndex: 10
//             }}
//             onMouseOver={(e) => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.width = '20px'; }}
//             onMouseOut={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.width = '12px'; }}
//           >
//             <div style={{
//               transform: 'rotate(90deg)',
//               whiteSpace: 'nowrap',
//               fontSize: '10px',
//               fontWeight: 700,
//               color: '#64748b',
//               letterSpacing: '0.1em',
//               textTransform: 'uppercase'
//             }}>
//               Filters
//             </div>
//           </div>
//         )}

//         {/* Right Content Area */}
//         <div style={{ flex: 1, minWidth: 0, padding: '0 0 24px 0' }}>
//           {/* AI Search Active Indicator */}
//           {aiSearchResults && (
//             <div style={{
//               padding: '10px 32px',
//               display: 'flex',
//               alignItems: 'center',
//               gap: '10px',
//               background: '#f0fdfa',
//               borderBottom: '1px solid #ccfbf1',
//               animation: 'cm-slide-down 0.3s ease'
//             }}>
//               <Sparkles size={16} color="#0d9488" className="cm-pulse" />
//               <span style={{ fontSize: '13px', color: '#0d9488', fontWeight: 600 }}>
//                 AI-Powered Search Active
//               </span>
//               <span style={{ fontSize: '12.5px', color: '#475569' }}>
//                 — {aiSearchResults.length} candidates ranked by semantic relevance
//               </span>
//               <button
//                 onClick={() => { setAiSearchResults(null); setSearchTerm(''); }}
//                 style={{
//                   marginLeft: 'auto',
//                   background: '#fff',
//                   border: '1px solid #0d9488',
//                   color: '#0d9488',
//                   borderRadius: '6px',
//                   padding: '4px 12px',
//                   fontSize: '11.5px',
//                   fontWeight: 600,
//                   cursor: 'pointer',
//                   transition: 'all 0.2s',
//                   boxShadow: '0 1px 2px rgba(13, 148, 136, 0.1)'
//                 }}
//                 onMouseOver={(e) => { e.currentTarget.style.background = '#0d9488'; e.currentTarget.style.color = '#fff'; }}
//                 onMouseOut={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#0d9488'; }}
//               >
//                 Clear AI Search
//               </button>
//             </div>
//           )}

//           {/* Active Filters Indicator */}
//           {(advancedFilters.rows.filter(r => r.field && r.condition).length > 0 ||
//             (sidebarFilters.status || []).length > 0 ||
//             (sidebarFilters.workType || []).length > 0 ||
//             sidebarFilters.country ||
//             sidebarFilters.state ||
//             sidebarFilters.city ||
//             (sidebarFilters.sources || []).length > 0 ||
//             (sidebarFilters.experience && sidebarFilters.experience !== 'all') ||
//             (sidebarFilters.isBench && sidebarFilters.isBench !== 'all') ||
//             (sidebarFilters.gender || []).length > 0 ||
//             (sidebarFilters.workAuth || []).length > 0 ||
//             (sidebarFilters.relocate && sidebarFilters.relocate !== 'all')) && (
//               <div style={{
//                 display: 'flex', alignItems: 'center', gap: 12,
//                 padding: '10px 32px', background: '#f8fafc',
//                 borderBottom: '1px solid #e2e8f0', fontSize: 13,
//                 flexWrap: 'wrap'
//               }}>
//                 <span style={{ fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', gap: 4 }}>
//                   <Filter size={14} /> Active Filters:
//                 </span>

//                 <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
//                   {(sidebarFilters.status || []).map(s => (
//                     <span key={s} style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 500 }}>{s}</span>
//                   ))}
//                   {(sidebarFilters.workType || []).map(w => (
//                     <span key={w} style={{ background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 500 }}>{w}</span>
//                   ))}
//                   {sidebarFilters.country && (
//                     <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 500 }}>Country: {sidebarFilters.country}</span>
//                   )}
//                   {sidebarFilters.state && (
//                     <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 500 }}>State: {sidebarFilters.state}</span>
//                   )}
//                   {sidebarFilters.city && (
//                     <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 500 }}>City: {sidebarFilters.city}</span>
//                   )}
//                   {(sidebarFilters.workAuth || []).map(auth => (
//                     <span key={auth} style={{ background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 500 }}>Auth: {auth}</span>
//                   ))}
//                   {(sidebarFilters.employmentTypes || []).map(type => (
//                     <span key={type} style={{ background: '#ecfdf5', color: '#065f46', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 500 }}>{type}</span>
//                   ))}
//                   {(sidebarFilters.industries || []).map(ind => (
//                     <span key={ind} style={{ background: '#f8fafc', color: '#475569', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 500 }}>{ind}</span>
//                   ))}
//                   {sidebarFilters.experience && sidebarFilters.experience !== 'all' && (
//                     <span style={{ background: '#f3e8ff', color: '#6b21a8', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 500 }}>Exp: {sidebarFilters.experience}</span>
//                   )}
//                   {sidebarFilters.isBench && sidebarFilters.isBench !== 'all' && (
//                     <span style={{ background: '#ffedd5', color: '#9a3412', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 500 }}>{sidebarFilters.isBench === 'bench' ? 'Bench Only' : 'Non-Bench'}</span>
//                   )}
//                 </div>

//                 <button
//                   onClick={handleResetFilters}
//                   style={{
//                     marginLeft: 'auto', background: 'none', border: 'none',
//                     color: '#ef4444', fontSize: 12, fontWeight: 600, cursor: 'pointer',
//                     display: 'flex', alignItems: 'center', gap: 4
//                   }}
//                 >
//                   Clear All
//                 </button>
//               </div>
//             )}

//           {/* Table or AI Loading */}
//           {isAiSearching ? (
//             <div className="cm-ai-search-loading">
//               <div className="cm-ai-search-loading-icon-wrapper">
//                 <Sparkles size={48} color="#0d9488" fill="#0d9488" className="cm-ai-loading-sparkles" />
//               </div>
//               <h2 className="cm-ai-search-loading-title">AI Is analyzing your database...</h2>
//               <p className="cm-ai-search-loading-subtitle">Finding the best matches based on semantic relevance</p>
//               <div className="cm-ai-search-loading-progress-container">
//                 <div className="cm-ai-search-loading-progress-bar"></div>
//               </div>
//             </div>
//           ) : (
//             <CandidateTable
//               candidates={paginatedCandidates}
//               isAiSearching={isAiSearching}
//               visibleColumns={visibleColumns}
//               sortConfig={sortConfig}
//               onSort={requestSort}
//               onView={viewCandidate}
//               onEdit={editCandidate}
//               onShare={(candidate) => {
//                 setShareModalCandidates([candidate]);
//                 setShowShareModal(true);
//               }}
//               onSchedule={(candidate) => {
//                 setScheduleCandidate(candidate);
//                 setShowJobsModal(true);
//               }}
//               onSubmitProfile={(candidate) => {
//                 setSubmitCandidate(candidate);
//                 setShowSubmitModal(true);
//               }}
//               onDelete={deleteCandidate}
//               currentPage={currentPage}
//               totalPages={totalPages}
//               totalCount={filteredCandidates.length}
//               onPageChange={setCurrentPage}
//               itemsPerPage={itemsPerPage}
//               onItemsPerPageChange={(newVal) => {
//                 setItemsPerPage(newVal);
//                 setCurrentPage(1);
//               }}
//               selectedRows={selectedCandidateIds}
//               onSelectionChange={setSelectedCandidateIds}
//             />
//           )}
//         </div>
//       </div>

//       {/* Modals */}
//       <ShareResumeModal
//         isOpen={showShareModal}
//         onClose={() => { setShowShareModal(false); setShareModalCandidates([]); }}
//         candidates={shareModalCandidates}
//       />

//       <CandidateJobsModal
//         isOpen={showJobsModal}
//         onClose={() => { setShowJobsModal(false); setScheduleCandidate(null); }}
//         candidate={scheduleCandidate}
//         onSelectJob={(job) => {
//           setSelectedJobForInterview(job);
//           setShowJobsModal(false);
//           setShowScheduleModal(true);
//         }}
//       />

//       <ScheduleInterviewModal
//         isOpen={showScheduleModal}
//         onClose={() => { setShowScheduleModal(false); setScheduleCandidate(null); setSelectedJobForInterview(null); }}
//         candidate={scheduleCandidate}
//         job={selectedJobForInterview}
//       />

//       <SubmitProfileModal
//         isOpen={showSubmitModal}
//         onClose={() => { setShowSubmitModal(false); setSubmitCandidate(null); }}
//         candidate={submitCandidate}
//       />

//       {showAddModal && (
//         <AddModal
//           candidate={editingCandidate}
//           onClose={() => { setShowAddModal(false); setEditingCandidate(null); setParsedResumeData(null); }}
//           onSave={handleSaveCandidate}
//           onResumeUpload={handleResumeUpload}
//           uploading={uploadingResume}
//           parsedData={parsedResumeData}
//           fetchFullCandidateDetails={getFullCandidate}
//         />
//       )}

//       <FilterModal
//         isOpen={showFilterModal}
//         onClose={() => setShowFilterModal(false)}
//         onApply={handleApplyFilters}
//         initialFilters={advancedFilters}
//       />

//       <ConfirmParseModal
//         isOpen={showConfirmParse}
//         onConfirm={handleConfirmParse}
//         onCancel={() => { setShowConfirmParse(false); setPendingParseFile(null); }}
//       />

//       <ParsingLoadingModal
//         isOpen={showParsingLoading}
//       />

//       <DuplicateResumeModal
//         isOpen={showDuplicateModal}
//         duplicateCandidate={duplicateCandidate}
//         onProceed={handleDuplicateAction}
//         onCancel={() => handleDuplicateAction('cancel')}
//       />

//       <ColumnFilterSidebar
//         availableColumns={availableColumns}
//         selectedColumns={visibleColumns}
//         setSelectedColumns={setVisibleColumns}
//         availableFilters={availableSidebarFilters}
//         selectedFilters={visibleSidebarFilters}
//         setSelectedFilters={setVisibleSidebarFilters}
//         onClose={() => setShowColumnSidebar(false)}
//         isOpen={showColumnSidebar}
//       />

//       {showAiSidebar && (
//         <div className="cm-ai-overlay" onClick={() => setShowAiSidebar(false)} />
//       )}
//       <AskAiSidebar
//         isOpen={showAiSidebar}
//         onClose={() => setShowAiSidebar(false)}
//         candidates={candidates}
//       />
//     </div>
//   );
// };

// export default ResumeDashboard;



import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Plus, Download, SlidersHorizontal, Filter, Search, Upload, Loader, Share2, Sparkles, Heart, X, Bookmark, Trash2, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  CANDIDATE_STATUS_OPTIONS, REMOTE_STATUS_OPTIONS, DATE_OPTIONS, formatDate,
  WORK_AUTHORIZATION_OPTIONS, EMPLOYMENT_TYPE_OPTIONS, SECURITY_CLEARANCE_OPTIONS,
  RATE_TYPE_OPTIONS, MARITAL_STATUS_OPTIONS, INDUSTRY_OPTIONS
} from '../utils/mockData';
import CandidateTable from './CandidateTable';
import AddModal from './AddModal';
import FilterModal from './FilterModal';
import ShareResumeModal from './ShareResumeModal';
import { CandidateJobsModal, ScheduleInterviewModal } from './ScheduleInterviewModals';
import { SubmitProfileModal } from './SubmitProfileModal';
import { ConfirmParseModal, ParsingLoadingModal, DuplicateResumeModal } from './ParseFlowModals';
import ColumnFilterSidebar from './ColumnFilterSidebar';
import CandidateFilterSidebar from './CandidateFilterSidebare';
import AskAiSidebar from './AskAiSidebar';
import '../styles/Dashboard.css';
import '../styles/CandidateTableCustom.css';
import '../styles/AddModalCustom.css';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import BASE_URL, { RESUME_PARSER_URL } from "../../url";
import { formatName, formatJobTitle, formatNameFields, formatFullName } from '../utils/nameFormatter';
import {
  countriesData,
  getCountryCode,
  getStateCode
} from '../../erprecruitment/config/locationConfig';

// ─── Helper to get auth headers ──────────────────────────────────────────────
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
  };
};

// ─── Module-level cache so multiple mounts don't re-fetch ─────────────────────
let _cachedCandidates = null;
let _cachedSearchTerm = '';
let _cachedStatusFilter = 'all';
let _cachedAiSearchResults = null;
let _cachedUseAiSearch = true;
let _cachedItemsPerPage = 30;
// ──────────────────────────────────────────────────────────────────────────────

const formatToMonth = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return typeof dateStr === 'string' && dateStr.length >= 7 ? dateStr.substring(0, 7) : dateStr;
  return d.toISOString().substring(0, 7);
};

// ── Transform a raw API candidate object into the shape the UI needs ──────────
const transformCandidate = (candidate) => {
  const isEmployee = !!candidate.employee_id;
  const empId = candidate.employee_id || '';

  return {
    CandidateId: candidate.candidate_id,
    CandidateCode: candidate.candidate_code || `CAN-${String(candidate.candidate_id).padStart(6, '0')}`,
    EmployeeCode: empId,
    IsEmployee: isEmployee,
    FirstName: formatName(candidate.first_name || ''),
    LastName: formatName(candidate.last_name || ''),
    MiddleName: formatName(candidate.middle_name || ''),
    JobTitle: formatJobTitle(candidate.job_title || ''),
    YearsOfExperience: candidate.years_exp,
    CandidateStatus: candidate.status || 'Available',
    RemoteStatus: candidate.remote_status || 'OnSite',
    CreatedDt: candidate.created_on,
    ProfileSummary: candidate.profile_summary || '',
    LinkedInUrl: candidate.linkedin_url || '',
    GitHubUrl: candidate.github_url || '',
    TwitterUrl: candidate.twitter_url || '',
    VideoResumeUrl: candidate.video_resume_url || '',
    Gender: candidate.gender || '',
    CurrentLocation: candidate.current_location || '',
    Source: candidate.source || '',

    // NEW FIELDS from backend
    WorkAuthorization: candidate.work_authorization || '',
    SecurityClearance: candidate.security_clearance || '',
    WillingToRelocate: candidate.willing_to_relocate || false,
    IsBench: candidate.is_bench || false,
    EmploymentType: candidate.employment_type || '',
    ExpectedRateFrom: candidate.expected_rate_from || '',
    ExpectedRateTo: candidate.expected_rate_to || '',
    ExpectedRateType: candidate.expected_rate_type || 'Hourly',
    CurrentRate: candidate.current_rate || '',
    CurrentRateType: candidate.current_rate_type || 'Hourly',
    MaritalStatus: candidate.marital_status || '',
    Industry: candidate.industry || '',
    Mobile: candidate.mobile || '',

    Contact: {
      Email: candidate.email || '',
      Phone: candidate.phone || '',
      Mobile: candidate.mobile || '',
    },
    Phones: candidate.phones || [],
    Emails: candidate.emails || [],
    Skills: (candidate.skills || []).map(s =>
      typeof s === 'string'
        ? { SkillName: s, SkillType: 'HARD' }
        : { SkillName: s.skill_name || s.SkillName || '', SkillType: s.skill_type || s.SkillType || 'HARD' }
    ),
    Education: (candidate.education || []).map(e => ({
      Institution: formatName(e.Institution || e.institution || ''),
      Degree: formatName(e.Degree || e.degree || ''),
      FieldOfStudy: e.FieldOfStudy || e.fieldOfStudy || '',
      StartDate: formatToMonth(e.StartDate || e.startDate),
      EndDate: formatToMonth(e.EndDate || e.endDate),
      GPA: e.GPA || e.gpa || '',
    })),
    WorkExperience: (candidate.work_experience || []).map(w => ({
      Company: w.Company || w.company || '',
      JobTitle: formatJobTitle(w.JobTitle || w.jobTitle || ''),
      StartDate: formatToMonth(w.StartDate || w.startDate),
      EndDate: formatToMonth(w.EndDate || w.endDate),
      IsCurrent: w.IsCurrent ?? w.isCurrent ?? false,
      Description: w.Description || w.description || '',
    })),
    Certifications: (candidate.certifications || []).map(c => ({
      CertificationName: formatName(c.CertificationName || c.name || ''),
      IssuingOrganization: c.IssuingOrganization || c.issuingOrg || '',
      IssueDate: formatToMonth(c.IssueDate || c.issueDate),
      ExpiryDate: formatToMonth(c.ExpiryDate || c.expiryDate),
      CredentialId: c.CredentialId || c.credentialId || '',
      CredentialUrl: c.CredentialUrl || c.credentialUrl || '',
    })),
    Document: candidate.document ? {
      DocumentId: candidate.document.DocumentId,
      FileNameOriginal: candidate.document.FileNameOriginal,
      FileExtension: candidate.document.FileExtension,
      MimeType: candidate.document.MimeType,
      FileSizeBytes: candidate.document.FileSizeBytes,
      StorageLocator: candidate.document.StorageLocator,
      ParseStatus: candidate.document.ParseStatus,
      DownloadUrl: candidate.document.DownloadUrl,
    } : null,
    Documents: (candidate.documents || []).map(d => ({
      DocumentId: d.DocumentId || d.documentId,
      DocumentType: d.DocumentType || d.documentType || 'Certificate',
      DocumentName: d.FileNameOriginal ? d.FileNameOriginal.replace(/\.[^/.]+$/, "") : (d.DocumentName || ''),
      FileNameOriginal: d.FileNameOriginal || d.fileNameOriginal,
      FileExtension: d.FileExtension || d.fileExtension,
      MimeType: d.MimeType || d.mimeType,
      FileSizeBytes: d.FileSizeBytes || d.fileSizeBytes,
      UploadedOn: d.UploadedOn || d.uploadedOn,
      VersionNo: d.VersionNo || d.versionNo,
      IsPrimary: d.IsPrimary || d.isPrimary,
    })),
  };
};

const ResumeDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const currentView = queryParams.get('view') || 'all';
  const [candidates, setCandidates] = useState(_cachedCandidates || []);
  const [loading, setLoading] = useState(_cachedCandidates === null);
  const isFetchingRef = useRef(false);
  const [searchTerm, setSearchTerm] = useState(_cachedSearchTerm);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'CreatedOn', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(_cachedItemsPerPage);
  const [editingCandidate, setEditingCandidate] = useState(null);
  const [showColumnSidebar, setShowColumnSidebar] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({ rows: [], logic: 'AND' });
  const [showAiSidebar, setShowAiSidebar] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [useAiSearch, setUseAiSearch] = useState(_cachedUseAiSearch);
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [aiSearchResults, setAiSearchResults] = useState(_cachedAiSearchResults);

  // Parse Flow States
  const [parsedResumeData, setParsedResumeData] = useState(null);
  const [parsingFromToolbar, setParsingFromToolbar] = useState(false);
  const [pendingParseFile, setPendingParseFile] = useState(null);
  const [showConfirmParse, setShowConfirmParse] = useState(false);
  const [showParsingLoading, setShowParsingLoading] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateCandidate, setDuplicateCandidate] = useState(null);
  const [statusFilter, setStatusFilter] = useState(_cachedStatusFilter);
  const [showFilterSidebar, setShowFilterSidebar] = useState(true);

  // Sidebar Filter State
  const [sidebarFilters, setSidebarFilters] = useState({
    search: '',
    status: [],
    workType: [],
    experience: 'all',
    country: '',
    state: '',
    city: '',
    sources: [],
    employmentTypes: [],
    industries: [],
    isBench: 'all',
    personType: 'all',
    gender: [],
    relocate: 'all',
    workAuth: []
  });

  // Visible Sidebar Filters (Dynamic filter visibility)
  const [visibleSidebarFilters, setVisibleSidebarFilters] = useState([
    'CandidateStatus', 'PersonType', 'IsBench', 'RemoteStatus', 'Experience',
    'Gender', 'Relocation', 'WorkAuthorization', 'EmploymentType', 'Industry', 'CurrentLocation'
  ]);

  // Sync top search TO sidebar search only once on mount or when searchTerm changes externally
  useEffect(() => {
    setSidebarFilters(prev => ({ ...prev, search: searchTerm }));
  }, [searchTerm]);

  // Auto-save active search filters
  useEffect(() => {
    _cachedSearchTerm = searchTerm;
  }, [searchTerm]);

  useEffect(() => {
    _cachedStatusFilter = statusFilter;
  }, [statusFilter]);

  useEffect(() => {
    _cachedAiSearchResults = aiSearchResults;
  }, [aiSearchResults]);

  useEffect(() => {
    _cachedUseAiSearch = useAiSearch;
  }, [useAiSearch]);

  useEffect(() => {
    _cachedItemsPerPage = itemsPerPage;
  }, [itemsPerPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [sidebarFilters, searchTerm, aiSearchResults]);

  // Share Resume State
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareModalCandidates, setShareModalCandidates] = useState([]);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState([]);

  // Schedule Interview State
  const [showJobsModal, setShowJobsModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleCandidate, setScheduleCandidate] = useState(null);
  const [selectedJobForInterview, setSelectedJobForInterview] = useState(null);

  // Submit Profile State
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitCandidate, setSubmitCandidate] = useState(null);

  const parseFileInputRef = useRef(null);

  // Saved Searches State
  const [savedSearches, setSavedSearches] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('erp_saved_searches');
    if (saved) {
      try {
        setSavedSearches(JSON.parse(saved));
      } catch (e) { }
    }
  }, []);

  const handleSaveSearch = () => {
    if (!searchTerm && statusFilter === 'all') return;

    const exists = savedSearches.some(s => s.term === searchTerm && s.status === statusFilter);
    if (exists) return;

    const newSaved = [...savedSearches, { term: searchTerm, status: statusFilter, id: Date.now() }];
    setSavedSearches(newSaved);
    localStorage.setItem('erp_saved_searches', JSON.stringify(newSaved));

    Swal.fire({
      title: 'Search Saved!',
      text: 'Your current search and filters have been saved.',
      icon: 'success',
      timer: 1500,
      showConfirmButton: false
    });
  };

  const handleLoadSearch = (search) => {
    setSearchTerm(search.term);
    setStatusFilter(search.status || 'all');
    setCurrentPage(1);

    if (useAiSearch && search.term) {
      handleAiSearch(search.term);
    } else {
      setAiSearchResults(null);
    }
  };

  const removeSavedSearch = (id) => {
    const updated = savedSearches.filter(s => s.id !== id);
    setSavedSearches(updated);
    localStorage.setItem('erp_saved_searches', JSON.stringify(updated));
  };

  // ─── Column Configuration ────────────────────────────────────────────────
  const availableColumns = [
    { key: 'CandidateCode', label: 'Candidate ID' },
    { key: 'EmployeeCode', label: 'Employee ID' },
    { key: 'Candidate', label: 'Name' },
    { key: 'Email', label: 'Email' },
    { key: 'Phone', label: 'Phone' },
    { key: 'Mobile', label: 'Mobile' },
    { key: 'JobTitle', label: 'Job Title' },
    { key: 'YearsOfExperience', label: 'Years of Exp.' },
    { key: 'Skills', label: 'Skills' },
    { key: 'CandidateStatus', label: 'Status' },
    { key: 'RemoteStatus', label: 'Work Type' },
    { key: 'CreatedDate', label: 'Created Date' },
    { key: 'LinkedInUrl', label: 'LinkedIn URL' },
    { key: 'GitHubUrl', label: 'GitHub URL' },
    { key: 'CurrentLocation', label: 'Location' },
    { key: 'Gender', label: 'Gender' },
    { key: 'ProfileSummary', label: 'Profile Summary' },
    { key: 'PersonType', label: 'Type' },
    { key: 'IsBench', label: 'Bench Status' },
    { key: 'Experience', label: 'Experience' },
    { key: 'Relocation', label: 'Relocation' },
    { key: 'Source', label: 'Source' },
    { key: 'Actions', label: 'Actions' },
  ];

  const availableSidebarFilters = [
    { key: 'CandidateStatus', label: 'Status' },
    { key: 'PersonType', label: 'Type' },
    { key: 'IsBench', label: 'Bench Status' },
    { key: 'RemoteStatus', label: 'Work Type' },
    { key: 'Experience', label: 'Experience' },
    { key: 'Gender', label: 'Gender' },
    { key: 'Relocation', label: 'Relocation' },
    { key: 'CurrentLocation', label: 'Location' },
    { key: 'Skills', label: 'Skills (Search)' },
    { key: 'Email', label: 'Email (Search)' },
    { key: 'Phone', label: 'Phone (Search)' },
    { key: 'JobTitle', label: 'Job Title (Search)' },
  ];

  const [visibleColumns, setVisibleColumns] = useState([
    'CandidateCode', 'EmployeeCode', 'Candidate', 'Email', 'Phone', 'JobTitle',
    'YearsOfExperience', 'Skills', 'CandidateStatus', 'RemoteStatus', 'CreatedDate', 'Actions',
  ]);

  // ── Fetch candidate list ──────────────────────────────────────────────────
  const fetchCandidates = useCallback(async (force = false) => {
    if (_cachedCandidates && !force) {
      setCandidates(_cachedCandidates);
      setLoading(false);
      return;
    }
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoading(true);

    try {
      const response = await fetch(`${BASE_URL}/api/resumes`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error(`Server error: ${response.status} ${response.statusText}`);

      const raw = await response.json();
      const data = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.data) ? raw.data
          : Array.isArray(raw?.candidates) ? raw.candidates
            : [];

      const transformedCandidates = data.map(transformCandidate);

      // De-duplicate by CandidateId
      const uniqueItems = [];
      const seenIds = new Set();
      transformedCandidates.forEach(c => {
        const id = String(c.CandidateId);
        if (!seenIds.has(id)) {
          seenIds.add(id);
          uniqueItems.push(c);
        }
      });

      _cachedCandidates = uniqueItems;
      setCandidates(uniqueItems);

    } catch (error) {
      console.error('[ResumeDashboard] Error fetching candidates:', error);
      Swal.fire({
        title: 'Connection Error',
        html: `<p>Could not load candidates from the server.</p>
               <small style="color:#888">Make sure the backend server is running and reachable.</small>`,
        icon: 'error',
        confirmButtonText: 'OK',
      });
      setCandidates([]);
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  }, []);

  const handleAiSearch = useCallback(async (query) => {
    if (!query || !query.trim()) {
      setAiSearchResults(null);
      return;
    }

    setIsAiSearching(true);
    try {
      const countMatch = query.match(/(\d+)\s*(?:candidates|results|people)/i);
      const requestedLimit = countMatch ? parseInt(countMatch[1]) : 50;

      const response = await fetch(`${BASE_URL}/api/resumes/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          query: query.trim(),
          top_k: requestedLimit,
          limit: requestedLimit,
          size: requestedLimit
        }),
      });

      if (!response.ok) throw new Error('AI Search failed');
      const data = await response.json();

      if (data && data.results) {
        console.log(`🔍 AI Search returned ${data.results.length} results (Requested: ${requestedLimit})`);

        const seenIds = new Set();
        const mappedResults = data.results
          .filter(res => {
            const id = String(res.candidate_id);
            if (seenIds.has(id)) return false;
            seenIds.add(id);
            return true;
          })
          .map(res => {
            const localMatch = candidates.find(c => String(c.CandidateId) === String(res.candidate_id));

            if (localMatch) {
              return {
                ...localMatch,
                aiScore: res.score,
                aiRank: res.rank,
                matchReason: res.match_reason
              };
            }

            return {
              CandidateId: res.candidate_id,
              FirstName: res.name?.split(' ')[0] || 'Unknown',
              LastName: res.name?.split(' ').slice(1).join(' ') || '',
              JobTitle: res.job_title || 'N/A',
              YearsOfExperience: res.years_experience,
              Skills: (res.skills || []).map(s => ({ SkillName: s, SkillType: 'HARD' })),
              CandidateStatus: 'Available',
              RemoteStatus: res.remote_status || 'OnSite',
              Contact: {
                Email: '',
                Phone: '',
                Mobile: ''
              },
              matchReason: res.match_reason,
              aiScore: res.score,
              aiRank: res.rank
            };
          });

        setAiSearchResults(mappedResults);
        setCurrentPage(1);
      }
    } catch (error) {
      console.error('AI Search Error:', error);
      Swal.fire({
        title: 'Search Error',
        text: 'The AI search service is currently unavailable.',
        icon: 'error',
        timer: 2000,
        showConfirmButton: false
      });
    } finally {
      setIsAiSearching(false);
    }
  }, [candidates]);

  // ── Manual AI Search Flow ──────────────────────────────────────────────
  // Clear AI search results when search term is cleared
  useEffect(() => {
    if (!searchTerm || !searchTerm.trim()) {
      setAiSearchResults(null);
      setIsAiSearching(false);
    }
  }, [searchTerm]);

  // Reset search and filters when view changes
  useEffect(() => {
    setSearchTerm('');
    setAiSearchResults(null);
    setAdvancedFilters({ rows: [], logic: 'AND' });
    setCurrentPage(1);
    fetchCandidates(true);
  }, [currentView, fetchCandidates]);

  // ── Navigate to full candidate detail page ────────────────────────────
  const viewCandidate = (id) => {
    navigate(`/candidates/${id}`);
  };

  // ── Get field value from candidate ──
  const getFieldValue = useCallback((candidate, field) => {
    switch (field) {
      case 'FirstName':
        return formatFullName(candidate.FirstName, candidate.MiddleName, candidate.LastName);
      case 'Email': return candidate.Contact?.Email || '';
      case 'Phone': return candidate.Contact?.Phone || '';
      case 'Skills':
        return (candidate.Skills || []).map(s => s.SkillName || s).join(', ');
      case 'YearsOfExperience': return candidate.YearsOfExperience != null ? String(candidate.YearsOfExperience) : '';
      case 'CreatedDt': return candidate.CreatedDt || '';
      default: {
        const val = candidate[field];
        return (val !== null && val !== undefined) ? String(val) : '';
      }
    }
  }, []);

  // ── Check if a candidate matches a single filter row ──
  const matchesRow = useCallback((candidate, row) => {
    const rawVal = getFieldValue(candidate, row.field);
    const target = (row.value || '').trim();

    if (row.condition === 'is_empty') return !rawVal || String(rawVal).trim() === '';
    if (row.condition === 'is_not_empty') return rawVal && String(rawVal).trim() !== '';

    const valStr = String(rawVal || '').trim();
    const valLower = valStr.toLowerCase();
    const targetLower = target.toLowerCase();

    const numVal = parseFloat(valStr);
    const numTarget = parseFloat(target);
    const isNumericMatch = !isNaN(numVal) && !isNaN(numTarget) && isFinite(valStr) && isFinite(target);

    const dateVal = new Date(valStr);
    const dateTarget = new Date(target);
    const isDateMatch = !isNaN(dateVal.getTime()) && !isNaN(dateTarget.getTime()) && valStr.includes('-') && target.includes('-');

    switch (row.condition) {
      case 'contains': return valLower.includes(targetLower);
      case 'not_contains': return !valLower.includes(targetLower);
      case 'equals':
        if (isNumericMatch) return numVal === numTarget;
        if (isDateMatch) {
          const d1 = new Date(dateVal).setHours(0, 0, 0, 0);
          const d2 = new Date(dateTarget).setHours(0, 0, 0, 0);
          return d1 === d2;
        }
        if (row.field === 'Skills') {
          return valLower.split(',').map(s => s.trim()).includes(targetLower);
        }
        return valLower === targetLower;
      case 'not_equals':
        if (isNumericMatch) return numVal !== numTarget;
        if (isDateMatch) {
          const d1 = new Date(dateVal).setHours(0, 0, 0, 0);
          const d2 = new Date(dateTarget).setHours(0, 0, 0, 0);
          return d1 !== d2;
        }
        if (row.field === 'Skills') {
          return !valLower.split(',').map(s => s.trim()).includes(targetLower);
        }
        return valLower !== targetLower;
      case 'starts_with': return valLower.startsWith(targetLower);
      case 'ends_with': return valLower.endsWith(targetLower);
      case 'greater_than':
        if (isNumericMatch) return numVal > numTarget;
        if (isDateMatch) return dateVal.setHours(0, 0, 0, 0) > dateTarget.setHours(0, 0, 0, 0);
        return valLower > targetLower;
      case 'less_than':
        if (isNumericMatch) return numVal < numTarget;
        if (isDateMatch) return dateVal.setHours(0, 0, 0, 0) < dateTarget.setHours(0, 0, 0, 0);
        return valLower < targetLower;
      default: return true;
    }
  }, [getFieldValue]);

  // ── Derived filter options ─────────────────────────────────────────────
  const availableStatuses = useMemo(() => {
    return ['Available', 'In Process', 'Not Available', 'Hired'];
  }, []);

  const availableWorkTypes = useMemo(() => {
    return ['Remote', 'OnSite', 'Hybrid'];
  }, []);

  const availableLocations = useMemo(() => {
    const locs = [...new Set(candidates.map(c => {
      if (c.CurrentLocation) {
        const parts = c.CurrentLocation.split(',').map(p => p.trim());
        if (parts.length >= 2) {
          return parts.slice(-2).join(', ');
        }
        return parts[0];
      }
      return null;
    }))].filter(Boolean);
    return locs.sort();
  }, [candidates]);

  const availableSources = useMemo(() => {
    const sources = [...new Set(candidates.map(c => c.Source))].filter(Boolean);
    return sources.sort();
  }, [candidates]);

  const availableEmploymentTypes = useMemo(() => {
    const types = [...new Set(candidates.map(c => c.EmploymentType))].filter(Boolean);
    return types.sort();
  }, [candidates]);

  const availableIndustries = useMemo(() => {
    const inds = [...new Set(candidates.map(c => c.Industry))].filter(Boolean);
    return inds.sort();
  }, [candidates]);

  const availableWorkAuths = useMemo(() => {
    const auths = [...new Set(candidates.map(c => c.WorkAuthorization))].filter(Boolean);
    return auths.sort();
  }, [candidates]);

  const availableGenders = useMemo(() => {
    const genders = [...new Set(candidates.map(c => c.Gender))].filter(Boolean);
    return genders.sort();
  }, [candidates]);


  // ── Filter & Sort Logic ────────────────────────────────────────────────
  const filteredCandidates = useMemo(() => {
    // 1️⃣ Priority: If AI search was just performed, use those results as our working set
    let result = aiSearchResults !== null ? [...aiSearchResults] : [...candidates];

    // 2️⃣ Standard global search filtering - Skip if AI Search is active
    if (aiSearchResults === null && searchTerm && !useAiSearch) {
      const term = searchTerm.toLowerCase();
      result = result.filter(c => {
        const fullName = formatFullName(c.FirstName, c.MiddleName, c.LastName).toLowerCase();
        const skillsText = (c.Skills || []).map(s => s.SkillName || s).join(' ').toLowerCase();
        const exp = (c.YearsOfExperience !== undefined && c.YearsOfExperience !== null) ? c.YearsOfExperience : '';
        const expText = exp !== '' ? `${exp}y ${exp} yr ${exp} year ${exp} years` : '';

        const matchesName = fullName.includes(term);
        const matchesJob = (c.JobTitle || '').toLowerCase().includes(term);
        const matchesCode = (c.CandidateCode || '').toLowerCase().includes(term);
        const matchesEmail = (c.Contact?.Email || '').toLowerCase().includes(term);
        const matchesPhone = (
          (c.Contact?.Phone || '').toLowerCase().includes(term) ||
          (c.Contact?.Mobile || '').toLowerCase().includes(term)
        );
        const matchesSkills = skillsText.includes(term);
        const matchesExp = expText.toLowerCase().includes(term);

        return matchesName || matchesJob || matchesCode || matchesEmail || matchesPhone || matchesSkills || matchesExp;
      });
    }

    // 3️⃣ Sidebar-specific search filtering - Skip if AI Search is active
    if (aiSearchResults === null && sidebarFilters.search && !useAiSearch) {
      const term = sidebarFilters.search.toLowerCase();
      result = result.filter(c => {
        const fullName = formatFullName(c.FirstName, c.MiddleName, c.LastName).toLowerCase();
        const skillsText = (c.Skills || []).map(s => s.SkillName || s).join(' ').toLowerCase();
        const exp = (c.YearsOfExperience !== undefined && c.YearsOfExperience !== null) ? c.YearsOfExperience : '';
        const expText = exp !== '' ? `${exp}y ${exp} yr ${exp} year ${exp} years` : '';

        const matchesName = fullName.includes(term);
        const matchesJob = (c.JobTitle || '').toLowerCase().includes(term);
        const matchesCode = (c.CandidateCode || '').toLowerCase().includes(term);
        const matchesEmail = (c.Contact?.Email || '').toLowerCase().includes(term);
        const matchesPhone = (
          (c.Contact?.Phone || '').toLowerCase().includes(term) ||
          (c.Contact?.Mobile || '').toLowerCase().includes(term)
        );
        const matchesSkills = skillsText.includes(term);
        const matchesExp = expText.toLowerCase().includes(term);

        return matchesName || matchesJob || matchesCode || matchesEmail || matchesPhone || matchesSkills || matchesExp;
      });
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(c => {
        if (statusFilter === 'On Bench') {
          return c.IsBench === true || c.CandidateStatus === 'On Bench';
        }
        return (c.CandidateStatus || '').toLowerCase() === statusFilter.toLowerCase();
      });
    }

    // Category filter based on 'view' query parameter - Skip strict sourcing/review checks if AI Search is active
    if (aiSearchResults === null) {
      if (currentView === 'sourcing') {
        result = result.filter(c => {
          const hasEmail = (c.Contact?.Email || '').trim();
          const hasPhone = (c.Contact?.Phone || '').trim() || (c.Contact?.Mobile || '').trim() || (c.Mobile || '').trim();
          const allowBench = sidebarFilters.isBench === 'bench';
          return (allowBench || !c.IsBench) && hasEmail && hasPhone;
        });
      } else if (currentView === 'bench') {
        result = result.filter(c => c.IsBench === true);
      } else if (currentView === 'review') {
        result = result.filter(c => {
          const hasEmail = (c.Contact?.Email || '').trim();
          const hasPhone = (c.Contact?.Phone || '').trim() || (c.Contact?.Mobile || '').trim() || (c.Mobile || '').trim();
          return !hasEmail || !hasPhone;
        });
      }
    }

    // Sidebar Filters Logic
    if ((sidebarFilters.status || []).length > 0) {
      const selected = sidebarFilters.status.map(s => s.toLowerCase());
      result = result.filter(c => selected.includes((c.CandidateStatus || '').toLowerCase()));
    }
    if ((sidebarFilters.workType || []).length > 0) {
      const selected = sidebarFilters.workType.map(w => w.toLowerCase());
      result = result.filter(c => selected.includes((c.RemoteStatus || '').toLowerCase()));
    }

    // Advanced location filtering with Country/State/City support
    if (sidebarFilters.country) {
      const selectedCountryName = sidebarFilters.country;
      const selectedCountryCode = getCountryCode(selectedCountryName);

      result = result.filter(c => {
        if (!c.CurrentLocation) return false;
        const locLower = c.CurrentLocation.toLowerCase();
        return locLower.includes(selectedCountryName.toLowerCase()) ||
          locLower.includes(selectedCountryCode.toLowerCase());
      });
    }

    if (sidebarFilters.state) {
      const selectedStateName = sidebarFilters.state;
      const countryCode = getCountryCode(sidebarFilters.country);
      const selectedStateCode = getStateCode(countryCode, selectedStateName);

      result = result.filter(c => {
        if (!c.CurrentLocation) return false;
        const locLower = c.CurrentLocation.toLowerCase();
        return locLower.includes(selectedStateName.toLowerCase()) ||
          locLower.includes(selectedStateCode.toLowerCase());
      });
    }

    if (sidebarFilters.city) {
      const cityTerm = sidebarFilters.city.toLowerCase().trim();
      result = result.filter(c => {
        if (!c.CurrentLocation) return false;
        const locLower = c.CurrentLocation.toLowerCase();
        return locLower.includes(cityTerm);
      });
    }

    if ((sidebarFilters.workAuth || []).length > 0) {
      const selected = sidebarFilters.workAuth.map(a => a.toLowerCase());
      result = result.filter(c => selected.includes((c.WorkAuthorization || '').toLowerCase()));
    }

    if ((sidebarFilters.employmentTypes || []).length > 0) {
      const selected = sidebarFilters.employmentTypes.map(t => t.toLowerCase());
      result = result.filter(c => selected.includes((c.EmploymentType || '').toLowerCase()));
    }

    if ((sidebarFilters.industries || []).length > 0) {
      const selected = sidebarFilters.industries.map(i => i.toLowerCase());
      result = result.filter(c => selected.includes((c.Industry || '').toLowerCase()));
    }

    if ((sidebarFilters.sources || []).length > 0) {
      const selected = sidebarFilters.sources.map(s => s.toLowerCase());
      result = result.filter(c => selected.includes((c.Source || '').toLowerCase()));
    }

    if ((sidebarFilters.gender || []).length > 0) {
      const selected = sidebarFilters.gender.map(g => g.toLowerCase());
      result = result.filter(c => selected.includes((c.Gender || '').toLowerCase()));
    }

    if (sidebarFilters.isBench && sidebarFilters.isBench !== 'all') {
      result = result.filter(c => sidebarFilters.isBench === 'bench' ? c.IsBench : !c.IsBench);
    }

    if (sidebarFilters.personType && sidebarFilters.personType !== 'all') {
      result = result.filter(c => sidebarFilters.personType === 'employees' ? c.IsEmployee : !c.IsEmployee);
    }

    if (sidebarFilters.relocate && sidebarFilters.relocate !== 'all') {
      result = result.filter(c => sidebarFilters.relocate === 'yes' ? c.WillingToRelocate : !c.WillingToRelocate);
    }

    if (sidebarFilters.experience !== 'all') {
      switch (sidebarFilters.experience) {
        case '0-2': result = result.filter(c => (parseFloat(c.YearsOfExperience) || 0) <= 2); break;
        case '3-5': result = result.filter(c => { const e = parseFloat(c.YearsOfExperience) || 0; return e > 2 && e <= 5; }); break;
        case '5-10': result = result.filter(c => { const e = parseFloat(c.YearsOfExperience) || 0; return e > 5 && e <= 10; }); break;
        case '10+': result = result.filter(c => (parseFloat(c.YearsOfExperience) || 0) > 10); break;
        default: break;
      }
    }

    // Advanced filters
    const validRows = (advancedFilters.rows || []).filter(r => r.field && r.condition);
    if (validRows.length > 0) {
      result = result.filter(c => {
        let isMatch = matchesRow(c, validRows[0]);

        for (let i = 1; i < validRows.length; i++) {
          const row = validRows[i];
          const op = row.operator || 'AND';

          if (op === 'OR') {
            isMatch = isMatch || matchesRow(c, row);
          } else {
            isMatch = isMatch && matchesRow(c, row);
          }
        }
        return isMatch;
      });
    }

    // Standard sorting
    result.sort((a, b) => {
      let av, bv;
      if (sortConfig.key === 'CreatedDt') {
        av = new Date(a.CreatedDt || 0); bv = new Date(b.CreatedDt || 0);
      } else if (sortConfig.key === 'YearsOfExperience') {
        av = a.YearsOfExperience || 0; bv = b.YearsOfExperience || 0;
      } else if (sortConfig.key === 'Email') {
        av = (a.Email || '').toLowerCase();
        bv = (b.Email || '').toLowerCase();
      } else if (sortConfig.key === 'FirstName') {
        av = formatFullName(a.FirstName, a.MiddleName, a.LastName).toLowerCase();
        bv = formatFullName(b.FirstName, b.MiddleName, b.LastName).toLowerCase();
      } else {
        av = String(a[sortConfig.key] || '').toLowerCase();
        bv = String(b[sortConfig.key] || '').toLowerCase();
      }
      if (av < bv) return sortConfig.direction === 'asc' ? -1 : 1;
      if (av > bv) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [candidates, searchTerm, statusFilter, advancedFilters, sortConfig, aiSearchResults, matchesRow, currentView, sidebarFilters, visibleSidebarFilters, useAiSearch]);

  const totalPages = Math.ceil(filteredCandidates.length / itemsPerPage);
  const paginatedCandidates = filteredCandidates.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleResetFilters = () => {
    setSearchTerm('');
    setAiSearchResults(null);
    setAdvancedFilters({ rows: [], logic: 'AND' });
    setSortConfig({ key: 'CreatedDt', direction: 'desc' });
    setStatusFilter('all');
    setSidebarFilters({
      search: '',
      status: [],
      workType: [],
      experience: 'all',
      country: '',
      state: '',
      city: '',
      sources: [],
      employmentTypes: [],
      industries: [],
      isBench: 'all',
      personType: 'all',
      gender: [],
      relocate: 'all',
      workAuth: []
    });
  };

  const handleApplyFilters = (filters) => {
    setAdvancedFilters(filters);
    setCurrentPage(1);
  };

  const requestSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
    setCurrentPage(1);
  };

  const editCandidate = (candidate) => {
    setEditingCandidate(candidate);
    setParsedResumeData(null);
    setShowAddModal(true);
  };

  const getFullCandidate = async (id) => {
    const response = await fetch(`${BASE_URL}/api/resumes/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch details');
    const data = await response.json();
    return transformCandidate(data);
  };

  const deleteCandidate = async (id) => {
    const candidate = candidates.find(c => c.CandidateId === id);
    const name = formatFullName(candidate?.FirstName, candidate?.MiddleName, candidate?.LastName);

    const confirm = await Swal.fire({
      title: 'Delete Candidate?',
      text: `This will permanently delete ${name}'s record.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete',
    });

    if (confirm.isConfirmed) {
      try {
        const response = await fetch(`${BASE_URL}/api/resumes/${id}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        });
        if (!response.ok) throw new Error('Failed to delete candidate');
        setCandidates(prev => prev.filter(c => c.CandidateId !== id));
        Swal.fire({ title: 'Deleted!', text: `${name} has been removed.`, icon: 'success', timer: 1800, showConfirmButton: false });
      } catch (error) {
        console.error('Error deleting candidate:', error);
        Swal.fire({ title: 'Error', text: 'Failed to delete candidate', icon: 'error' });
      }
    }
  };

  // ── Parse Resume Flow ──────────────────────────────────────────────────
  const handleParseFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setPendingParseFile(file);
    setShowConfirmParse(true);
  };

  const handleConfirmParse = async () => {
    if (!pendingParseFile) return;
    setShowConfirmParse(false);
    setShowParsingLoading(true);
    setParsingFromToolbar(true);

    try {
      const formData = new FormData();
      formData.append('file1', pendingParseFile);

      const response = await fetch(`${BASE_URL}/api/resumes/parse`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData
      });
      if (!response.ok) throw new Error('Failed to parse resume');

      const data = await response.json();
      const parsed = {
        FirstName: formatName(data.firstName || ''),
        LastName: formatName(data.lastName || ''),
        MiddleName: formatName(data.middleName || ''),
        Email: data.email || '',
        Phone: data.phone || '',
        Mobile: data.mobile || '',
        TwitterUrl: data.twitterUrl || '',
        VideoResumeUrl: data.videoResumeUrl || '',
        JobTitle: formatJobTitle(data.jobTitle || ''),
        YearsOfExperience: data.yearsOfExperience ? parseFloat(data.yearsOfExperience) : '',
        ProfileSummary: data.profileSummary || '',
        LinkedInUrl: data.linkedInUrl || '',
        GitHubUrl: data.gitHubUrl || '',
        Gender: data.gender || '',
        CurrentLocation: data.currentLocation || '',
        cityName: data.cityName || '',
        stateName: data.stateName || '',
        countryIso2: data.countryIso2 || '',
        countryName: data.countryName || '',
        WorkAuthorization: data.workAuthorization || '',
        EmploymentType: data.employmentType || '',
        skills: (data.skills || []).map(s => ({ SkillName: typeof s === 'string' ? s : s.skill_name || '', SkillType: 'HARD' })),
        workExperience: (data.workExperience || []).map(exp => ({
          Company: exp.company || '',
          JobTitle: formatJobTitle(exp.jobTitle || ''),
          StartDate: exp.startDate || '', EndDate: exp.endDate || '',
          IsCurrent: exp.isCurrent || false, Description: exp.description || '',
        })),
        education: (data.education || []).map(edu => ({
          Institution: formatName(edu.institution || ''),
          Degree: formatName(edu.degree || ''),
          FieldOfStudy: edu.fieldOfStudy || '', StartDate: edu.startDate || '',
          EndDate: edu.endDate || '', GPA: edu.gpa || '',
        })),
        certifications: (data.certifications || []).map(cert => ({
          CertificationName: formatName(cert.name || ''),
          IssuingOrganization: cert.issuingOrg || '',
          IssueDate: cert.issueDate || '', ExpiryDate: cert.expiryDate || '',
          CredentialId: cert.credentialId || '', CredentialUrl: cert.credentialUrl || '',
        })),
        ResumeFile: pendingParseFile,
        RawPayloadJson: JSON.stringify(data),
        ParseStatus: data.parseStatus || data.parse_status || 'SUCCESS',
        ParsedText: data.parsedText || data.parsed_text || '',
        ParserVendor: data.vendor || 'llama-3.1-8b-instant',
        ExtractedEmail: data.email || data.extracted_email || '',
        ExtractedPhone: data.phone || data.mobile || data.extracted_phone || '',
      };

      const dup = candidates.find(c =>
        (parsed.Email && c.Contact?.Email?.toLowerCase() === parsed.Email.toLowerCase()) ||
        (parsed.LinkedInUrl && c.LinkedInUrl?.toLowerCase() === parsed.LinkedInUrl.toLowerCase())
      );

      setShowParsingLoading(false);

      if (dup) {
        setParsedResumeData(parsed);
        setDuplicateCandidate(dup);
        setShowDuplicateModal(true);
      } else {
        setParsedResumeData(parsed);
        setEditingCandidate(null);
        setShowAddModal(true);
      }

    } catch (error) {
      console.error('Error parsing resume:', error);
      setShowParsingLoading(false);
      Swal.fire({ title: 'Error', text: 'Failed to parse resume. Please try again or add candidate manually.', icon: 'error' });
    } finally {
      setParsingFromToolbar(false);
      setPendingParseFile(null);
    }
  };

  const handleDuplicateAction = async (action) => {
    setShowDuplicateModal(false);

    if (action === 'cancel') {
      setParsedResumeData(null);
      setDuplicateCandidate(null);
      return;
    }

    let fullDuplicateCandidate = duplicateCandidate;
    try {
      Swal.fire({ title: 'Loading...', text: 'Fetching candidate details', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      const response = await fetch(`${BASE_URL}/api/resumes/${duplicateCandidate.CandidateId}`, { headers: getAuthHeaders() });
      if (response.ok) {
        const data = await response.json();
        fullDuplicateCandidate = transformCandidate(data);
      }
      Swal.close();
    } catch (e) {
      console.error('Error fetching duplicate candidate full details:', e);
      Swal.close();
    }

    if (action === 'add_resume') {
      setParsedResumeData({ ResumeFile: parsedResumeData.ResumeFile });
      setEditingCandidate(fullDuplicateCandidate);
      setShowAddModal(true);
    }
    else if (action === 'overwrite') {
      setEditingCandidate({
        CandidateId: fullDuplicateCandidate.CandidateId,
        Document: fullDuplicateCandidate.Document,
        Contact: { Email: fullDuplicateCandidate.Contact?.Email }
      });
      setShowAddModal(true);
    }
    else if (action === 'append') {
      const synthCandidate = { ...fullDuplicateCandidate };

      for (const [key, value] of Object.entries(parsedResumeData)) {
        if (typeof value === 'string' && value.trim() !== '') {
          synthCandidate[key] = value;
        } else if (typeof value === 'number') {
          synthCandidate[key] = value;
        }
      }

      const appendedSkills = [...(fullDuplicateCandidate.Skills || [])];
      (parsedResumeData.skills || []).forEach(s => appendedSkills.push({ ...s }));
      synthCandidate.Skills = appendedSkills;

      synthCandidate.WorkExperience = [...(fullDuplicateCandidate.WorkExperience || []), ...(parsedResumeData.workExperience || [])];
      synthCandidate.Education = [...(fullDuplicateCandidate.Education || []), ...(parsedResumeData.education || [])];
      synthCandidate.Certifications = [...(fullDuplicateCandidate.Certifications || []), ...(parsedResumeData.certifications || [])];

      setParsedResumeData({ ResumeFile: parsedResumeData.ResumeFile });
      setEditingCandidate(synthCandidate);
      setShowAddModal(true);
    }
  };

  // ── Resume upload / extract ──
  const handleResumeUpload = async (file) => {
    try {
      setUploadingResume(true);
      const formData = new FormData();
      formData.append('file1', file);

      const response = await fetch(`${BASE_URL}/api/resumes/parse`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData
      });
      if (!response.ok) throw new Error('Failed to parse resume');

      const data = await response.json();
      return {
        FirstName: formatName(data.firstName || ''),
        LastName: formatName(data.lastName || ''),
        MiddleName: formatName(data.middleName || ''),
        Email: data.email || '',
        Phone: data.phone || '',
        Mobile: data.mobile || '',
        TwitterUrl: data.twitterUrl || '',
        VideoResumeUrl: data.videoResumeUrl || '',
        JobTitle: formatJobTitle(data.jobTitle || ''),
        YearsOfExperience: data.yearsOfExperience ? parseFloat(data.yearsOfExperience) : '',
        ProfileSummary: data.profileSummary || '',
        LinkedInUrl: data.linkedInUrl || '',
        GitHubUrl: data.gitHubUrl || '',
        Gender: data.gender || '',
        CurrentLocation: data.currentLocation || '',
        cityName: data.cityName || '',
        stateName: data.stateName || '',
        countryIso2: data.countryIso2 || '',
        countryName: data.countryName || '',
        WorkAuthorization: data.workAuthorization || '',
        EmploymentType: data.employmentType || '',
        Skills: (data.skills || []).map(s => ({ SkillName: typeof s === 'string' ? s : s.skill_name || '', SkillType: 'HARD' })),
        WorkExperience: (data.workExperience || []).map(exp => ({
          Company: exp.company || '',
          JobTitle: formatJobTitle(exp.jobTitle || ''),
          StartDate: exp.startDate || '',
          EndDate: exp.endDate || '',
          IsCurrent: exp.isCurrent || false,
          Description: exp.description || '',
        })),
        Education: (data.education || []).map(edu => ({
          Institution: formatName(edu.institution || ''),
          Degree: formatName(edu.degree || ''),
          FieldOfStudy: edu.fieldOfStudy || '',
          StartDate: edu.startDate || '',
          EndDate: edu.endDate || '',
          GPA: edu.gpa || '',
        })),
        Certifications: (data.certifications || []).map(cert => ({
          CertificationName: formatName(cert.name || ''),
          IssuingOrganization: cert.issuingOrg || '',
          IssueDate: cert.issueDate || '',
          ExpiryDate: cert.expiryDate || '',
          CredentialId: cert.credentialId || '',
          CredentialUrl: cert.credentialUrl || '',
        })),
        RawPayloadJson: JSON.stringify(data),
        ParseStatus: data.parseStatus || data.parse_status || 'SUCCESS',
        ParsedText: data.parsedText || data.parsed_text || '',
        ParserVendor: data.vendor || 'llama-3.1-8b-instant',
        ExtractedEmail: data.email || data.extracted_email || '',
        ExtractedPhone: data.phone || data.mobile || data.extracted_phone || '',
      };
    } catch (error) {
      console.error('Error parsing resume:', error);
      Swal.fire({ title: 'Error', text: 'Failed to parse resume. Please fill the form manually.', icon: 'error' });
      return null;
    } finally {
      setUploadingResume(false);
    }
  };

  // ── Save candidate ──
  const handleSaveCandidate = async (data) => {
    try {
      setUploadingResume(true);

      if (data.currentLocation && data.currentLocation.trim()) {
        const parts = data.currentLocation.split(',').map(s => s.trim()).filter(Boolean);
        console.log(`📍 Location being saved: "${data.currentLocation}" (${parts.length} parts)`);
      }

      const isEditing = !!(editingCandidate?.CandidateId || data.candidateId);
      const candidateId = editingCandidate?.CandidateId || data.candidateId;

      const formData = new FormData();

      const firstName = formatName(data.firstName || data.FirstName || '');
      const lastName = formatName(data.lastName || data.LastName || '');
      const middleName = formatName(data.middleName || data.MiddleName || '');
      const jobTitle = formatJobTitle(data.jobTitle || data.JobTitle || '');

      formData.append('FirstName', firstName);
      formData.append('LastName', lastName);
      formData.append('MiddleName', middleName);
      formData.append('EmailID', (data.email || data.Email || '').trim());
      formData.append('Phone', (data.phone || data.Phone || '').trim());
      formData.append('Mobile', (data.mobile || data.Mobile || '').trim());
      formData.append('JobTitle', jobTitle);
      formData.append('YearsOfExperience', data.yearsOfExperience ?? data.YearsOfExperience ?? '');
      formData.append('Gender', (data.gender || data.Gender || '').trim());
      formData.append('ProfileSummary', (data.profileSummary || data.ProfileSummary || '').trim());
      formData.append('LinkedInProfile', (data.linkedInUrl || data.LinkedInUrl || '').trim());
      formData.append('GitHubUrl', (data.gitHubUrl || data.GitHubUrl || '').trim());
      formData.append('TwitterUrl', (data.twitterUrl || data.TwitterUrl || '').trim());
      formData.append('VideoResumeUrl', (data.videoResumeUrl || data.VideoResumeUrl || '').trim());
      formData.append('CandidateStatus', data.candidateStatus || data.CandidateStatus || 'Available');
      formData.append('RemoteStatus', data.remoteStatus || data.RemoteStatus || 'OnSite');
      formData.append('CurrentLocation', (data.currentLocation || data.CurrentLocation || '').trim());

      formData.append('WorkAuthorization', data.workAuthorization || data.WorkAuthorization || '');
      formData.append('EmploymentType', data.employmentType || data.EmploymentType || '');
      formData.append('SecurityClearance', data.securityClearance || data.SecurityClearance || '');
      formData.append('WillingToRelocate', data.willingToRelocate ? 'true' : 'false');
      formData.append('IsBench', data.isBench ? 'true' : 'false');
      formData.append('ExpectedRateFrom', data.expectedRateFrom || data.ExpectedRateFrom || '');
      formData.append('ExpectedRateTo', data.expectedRateTo || data.ExpectedRateTo || '');
      formData.append('ExpectedRateType', data.expectedRateType || data.ExpectedRateType || 'Hourly');
      formData.append('CurrentRate', data.currentRate || data.CurrentRate || '');
      formData.append('CurrentRateType', data.currentRateType || data.CurrentRateType || 'Hourly');
      formData.append('MaritalStatus', data.maritalStatus || data.MaritalStatus || '');
      formData.append('Industry', data.industry || data.Industry || '');

      const skillsList = (data.skills || data.Skills || []).map(s =>
        typeof s === 'string' ? s : (s.SkillName || s.skillName || '')
      ).filter(Boolean);
      formData.append('Skills', JSON.stringify(skillsList));

      const workList = (data.workExperience || data.WorkExperience || [])
        .filter(w => (w.company || w.Company || '').trim() || (w.jobTitle || w.JobTitle || '').trim())
        .map(exp => ({
          Company: (exp.company || exp.Company || '').trim(),
          JobTitle: formatJobTitle(exp.jobTitle || exp.JobTitle || ''),
          StartDate: exp.startDate || exp.StartDate || '',
          EndDate: exp.endDate || exp.EndDate || '',
          IsCurrent: exp.isCurrent ?? exp.IsCurrent ?? false,
          Description: (exp.description || exp.Description || '').trim(),
        }));
      formData.append('WorkExperience', JSON.stringify(workList));

      const eduList = (data.education || data.Education || [])
        .filter(e => (e.institution || e.Institution || '').trim() || (e.degree || e.Degree || '').trim())
        .map(edu => ({
          Institution: formatName(edu.institution || edu.Institution || ''),
          Degree: formatName(edu.degree || edu.Degree || ''),
          FieldOfStudy: (edu.fieldOfStudy || edu.FieldOfStudy || '').trim(),
          StartDate: edu.startDate || edu.StartDate || '',
          EndDate: edu.endDate || edu.EndDate || '',
          GPA: (edu.gpa || edu.GPA || '').trim(),
        }));
      formData.append('Education', JSON.stringify(eduList));

      const certList = (data.certifications || data.Certifications || [])
        .filter(c => (c.name || c.CertificationName || '').trim())
        .map(cert => ({
          CertificationName: formatName(cert.name || cert.CertificationName || ''),
          IssuingOrganization: (cert.issuingOrg || cert.IssuingOrganization || '').trim(),
          IssueDate: cert.issueDate || cert.IssueDate || '',
          ExpiryDate: cert.expiryDate || cert.ExpiryDate || '',
          CredentialId: (cert.credentialId || cert.CredentialId || '').trim(),
          CredentialUrl: (cert.credentialUrl || cert.CredentialUrl || '').trim(),
        }));
      formData.append('Certifications', JSON.stringify(certList));

      if (data.ResumeFile) {
        formData.append('ResumeUpload', data.ResumeFile);
      }

      if (data.RawPayloadJson) formData.append('RawPayloadJson', data.RawPayloadJson);
      if (data.ParseStatus) formData.append('ParseStatus', data.ParseStatus);
      if (data.ParsedText) formData.append('ParsedText', data.ParsedText);
      if (data.ParserVendor) formData.append('ParserVendor', data.ParserVendor);
      if (data.ExtractedEmail) formData.append('ExtractedEmail', data.ExtractedEmail);
      if (data.ExtractedPhone) formData.append('ExtractedPhone', data.ExtractedPhone);

      const additionalDocs = (data.documents || []).filter(d => d.file instanceof File);
      let docIndex = 0;
      for (const doc of additionalDocs) {
        formData.append(`AdditionalDoc_${docIndex}`, doc.file);
        formData.append(`AdditionalDoc_${docIndex}_Name`, doc.documentName || doc.file.name);
        formData.append(`AdditionalDoc_${docIndex}_Type`, doc.documentType || 'Certificate');
        docIndex++;
      }
      formData.append('AdditionalDocsCount', String(docIndex));

      const url = isEditing
        ? `${BASE_URL}/api/resumes/${candidateId}`
        : `${BASE_URL}/api/resumes`;

      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: getAuthHeaders(),
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.detail || 'Failed to save candidate');
      }

      _cachedCandidates = null;
      await fetchCandidates(true);
      setShowAddModal(false);
      setEditingCandidate(null);
      setParsedResumeData(null);
      Swal.fire({ title: 'Success!', text: 'Candidate saved successfully.', icon: 'success', timer: 1800, showConfirmButton: false });

    } catch (error) {
      console.error('Error saving candidate:', error);
      Swal.fire({ title: 'Error', text: error.message || 'Failed to save candidate', icon: 'error' });
    } finally {
      setUploadingResume(false);
    }
  };

  const exportToExcel = () => {
    setExporting(true);
    const data = filteredCandidates.map(c => ({
      'Candidate Code': c.CandidateCode,
      'First Name': c.FirstName,
      'Last Name': c.LastName,
      'Middle Name': c.MiddleName || '',
      'Job Title': c.JobTitle,
      'Email': c.Contact?.Email || '',
      'Phone': c.Contact?.Phone || '',
      'Mobile': c.Mobile || '',
      'Twitter URL': c.TwitterUrl || '',
      'Video Resume URL': c.VideoResumeUrl || '',
      'Years of Experience': c.YearsOfExperience,
      'Gender': c.Gender,
      'Candidate Status': c.CandidateStatus,
      'Remote Status': c.RemoteStatus,
      'Work Authorization': c.WorkAuthorization || '',
      'Employment Type': c.EmploymentType || '',
      'Security Clearance': c.SecurityClearance || '',
      'Willing to Relocate': c.WillingToRelocate ? 'Yes' : 'No',
      'Expected Rate From': c.ExpectedRateFrom || '',
      'Expected Rate To': c.ExpectedRateTo || '',
      'Expected Rate Type': c.ExpectedRateType || '',
      'Current Rate': c.CurrentRate || '',
      'Current Rate Type': c.CurrentRateType || '',
      'Marital Status': c.MaritalStatus || '',
      'Industry': c.Industry || '',
      'LinkedIn': c.LinkedInUrl || '',
      'GitHub': c.GitHubUrl || '',
      'Location': c.CurrentLocation || '',
      'Profile Summary': c.ProfileSummary || '',
      'Skills': (c.Skills || []).map(s => s.SkillName || s).join(', '),
      'Resume File': c.Document?.FileNameOriginal || '',
      'Created Date': formatDate(c.CreatedDt),
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Candidates');
    XLSX.writeFile(wb, `candidates_${new Date().toISOString().split('T')[0]}.xlsx`);
    setExporting(false);
    Swal.fire({ title: 'Exported!', text: `${data.length} candidates exported.`, icon: 'success', timer: 1800, showConfirmButton: false });
  };

  if (loading) {
    return (
      <div className="cm-loading-container">
        <div className="cm-loading-spinner"></div>
        <p className="cm-loading-text">Loading candidates...</p>
      </div>
    );
  }

  return (
    <div className="cm-dashboard" style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: '24px' }}>
      {/* Header Area */}
      <div style={{ padding: '16px 32px 12px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#111827', margin: 0, lineHeight: 1.2 }}>
            {currentView === 'sourcing' ? 'Sourcing' :
              currentView === 'bench' ? 'Bench Candidates' :
                currentView === 'review' ? 'Need To Review' :
                  'Candidates'}
          </h1>
          <p style={{ color: '#6b7280', fontSize: '14px', margin: '4px 0 0 0' }}>
            {currentView === 'sourcing' ? 'Explore active sourcing candidates' :
              currentView === 'bench' ? 'Manage bench candidates' :
                currentView === 'review' ? 'Review candidates with missing information' :
                  'Manage and explore your candidate database'}
          </p>
        </div>

        <div className="cm-toolbar-actions" style={{ flexWrap: 'wrap', borderBottom: 'none' }}>
          {selectedCandidateIds.length > 0 && (
            <button
              className="cm-btn cm-btn-primary"
              style={{ backgroundColor: '#0d9488', borderColor: '#0d9488', marginRight: '8px' }}
              onClick={() => {
                const selectedCands = candidates.filter(c => selectedCandidateIds.includes(c.CandidateId));
                setShareModalCandidates(selectedCands);
                setShowShareModal(true);
              }}
            >
              <Share2 size={16} /> Share Bulk Profile
            </button>
          )}

          <button className="cm-btn cm-btn-primary" style={{ backgroundColor: '#0d9488', borderColor: '#0d9488' }} onClick={() => { setEditingCandidate(null); setParsedResumeData(null); setShowAddModal(true); }}>
            <Plus size={16} /> Add Candidate
          </button>
          <button
            className="cm-btn cm-btn-outline"
            onClick={() => parseFileInputRef.current?.click()}
            disabled={parsingFromToolbar}
          >
            {parsingFromToolbar
              ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Parsing...</>
              : <><Upload size={16} /> Parse Resume</>}
          </button>
          <input
            ref={parseFileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            style={{ display: 'none' }}
            onChange={handleParseFileSelect}
          />
          <button className="cm-btn cm-btn-outline" onClick={exportToExcel} disabled={exporting}>
            <Download size={16} /> {exporting ? 'Exporting...' : 'Export'}
          </button>

          <button className="cm-btn cm-btn-outline" title="Manage Columns" onClick={() => setShowColumnSidebar(true)} style={{ padding: '0 10px' }}>
            <SlidersHorizontal size={16} />
          </button>

          <button
            className={`cm-btn cm-btn-outline ${showFilterSidebar ? 'cm-btn-icon--active' : ''}`}
            title={showFilterSidebar ? "Close Sidebar" : "Open Sidebar"}
            onClick={() => setShowFilterSidebar(prev => !prev)}
            style={{ padding: '0 10px' }}
          >
            {showFilterSidebar ? <Filter size={16} />: <Filter size={16} />}
          </button>

          {/* <button
            className={`cm-btn cm-btn-outline ${advancedFilters.rows.filter(r => r.field && r.condition).length > 0 ? 'cm-btn-icon--active' : ''}`}
            title="Filters"
            onClick={() => setShowFilterModal(true)}
            style={{
              padding: '0 10px', ...(advancedFilters.rows.filter(r => r.field && r.condition).length > 0 ? {
                background: '#f0fdf4', border: '1px solid #14b8a6', color: '#0d9488'
              } : {})
            }}
          >
            <Filter size={16} />
            {advancedFilters.rows.filter(r => r.field && r.condition).length > 0 && (
              <span style={{
                position: 'absolute', top: -4, right: -4,
                width: 16, height: 16, borderRadius: '50%',
                background: '#0d9488', color: '#fff',
                fontSize: 9, fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {advancedFilters.rows.filter(r => r.field && r.condition).length}
              </span>
            )}
          </button> */}

          <button
            className={`cm-ask-ai-btn ${showAiSidebar ? 'cm-ask-ai-btn--active' : ''}`}
            title="Ask AI"
            onClick={() => setShowAiSidebar(prev => !prev)}
            style={{ marginLeft: '4px' }}
          >
            <Sparkles size={15} />
            Ask AI
          </button>
        </div>
      </div>

      {/* Search & Saved Filters Area */}
      <div style={{ margin: '0 32px 12px 32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Top Row: Search Input */}
        <div
          className="cm-modern-search-bar"
          style={{
            display: 'flex', alignItems: 'center',
            border: '1px solid #e2e8f0', borderRadius: '8px',
            padding: '4px 8px 4px 16px', height: '40px',
            transition: 'all 0.2s ease', background: '#fff',
            boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = '#0d9488'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(13, 148, 136, 0.15)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.02)'; }}
        >
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginRight: '10px', flexShrink: 0 }}>
            <Search
              size={17}
              color={useAiSearch ? "#229C8B" : "#64748b"}
              className={isAiSearching ? "cm-pulse" : ""}
              style={{ cursor: 'pointer' }}
              onClick={() => {
                if (useAiSearch) {
                  handleAiSearch(searchTerm);
                } else {
                  setAiSearchResults(null);
                  setCurrentPage(1);
                }
              }}
              title={useAiSearch ? "Search with AI" : "Search by keyword"}
            />
            <Sparkles
              size={8}
              color="#229C8B"
              style={{
                position: 'absolute', top: -3, right: -4,
                animation: 'cm-spin 4s linear infinite',
                opacity: 0.8
              }}
            />
          </div>
          <input
            className="cm-search-input-modern"
            placeholder={useAiSearch ? "Ask AI for semantic search..." : "Search by keyword..."}
            value={searchTerm}
            onChange={e => {
              const val = e.target.value;
              setSearchTerm(val);
              if (!useAiSearch) {
                if (!val) setAiSearchResults(null);
                setCurrentPage(1);
              }
            }}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                if (useAiSearch) {
                  // Manual trigger if user hits enter early
                  handleAiSearch(searchTerm);
                } else {
                  setAiSearchResults(null);
                  setCurrentPage(1);
                }
              }
            }}
            style={{
              border: 'none', outline: 'none', background: 'transparent',
              flex: 1, fontSize: '14px', color: '#0f172a', height: '100%',
              fontFamily: 'inherit'
            }}
          />
          {isAiSearching && (
            <div style={{ marginRight: '10px', display: 'flex', alignItems: 'center' }}>
              <Loader size={14} style={{ animation: 'cm-spin 1s linear infinite', color: '#229C8B' }} />
            </div>
          )}
          <div style={{ width: '1px', height: '20px', background: '#e2e8f0', margin: '0 8px' }}></div>
          <button
            onClick={() => {
              const next = !useAiSearch;
              setUseAiSearch(next);
              if (!next) setAiSearchResults(null);
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '4px 12px', border: useAiSearch ? '1px solid #14b8a6' : '1px solid #e2e8f0',
              borderRadius: '20px', background: useAiSearch ? '#f0fdfa' : '#fff',
              color: useAiSearch ? '#0d9488' : '#64748b', fontSize: '12px',
              fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s ease',
              marginRight: '8px'
            }}
          >
            <Sparkles size={13} color={useAiSearch ? "#14b8a6" : "#94a3b8"} fill={useAiSearch ? "#14b8a6" : "none"} />
            AI Search: {useAiSearch ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={handleSaveSearch}
            className="cm-btn"
            style={{
              height: '28px', background: '#f8fafc', color: '#475569',
              border: '1px solid transparent', borderRadius: '6px',
              padding: '0 12px', fontWeight: 500, display: 'flex',
              gap: '6px', alignItems: 'center', transition: 'all 0.2s',
              flexShrink: 0, fontSize: '12.5px'
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#0f172a'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#475569'; }}
          >
            <Bookmark size={14} /> Save
          </button>
        </div>

        {/* Bottom Area: Saved Searches */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', scrollbarWidth: 'none', flexShrink: 1, paddingBottom: '2px' }}>
            {savedSearches.map((s) => {
              const isActive = s.term === searchTerm && s.status === statusFilter;
              return (
                <button
                  key={s.id}
                  onClick={() => handleLoadSearch(s)}
                  style={{
                    fontSize: '12.5px',
                    padding: '0 8px 0 10px',
                    height: '26px',
                    borderRadius: '6px',
                    border: '1px solid transparent',
                    background: isActive ? '#0d9488' : '#f1f5f9',
                    color: isActive ? '#fff' : '#475569',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s ease',
                    fontWeight: isActive ? 500 : 400,
                    flexShrink: 0
                  }}
                  title={`Load search: ${s.term || 'All'} in ${s.status}`}
                  onMouseOver={(e) => { if (!isActive) { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#0f172a'; } }}
                  onMouseOut={(e) => { if (!isActive) { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#475569'; } }}
                >
                  <span>{s.term || 'All'} {s.status !== 'all' ? `(${s.status})` : ''}</span>
                  <span
                    onClick={(e) => { e.stopPropagation(); removeSavedSearch(s.id); }}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      width: '18px', height: '18px', borderRadius: '4px', transition: 'all 0.2s',
                      color: isActive ? '#fff' : '#94a3b8'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.background = isActive ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.05)'; e.currentTarget.style.color = isActive ? '#fff' : '#0f172a'; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = isActive ? '#fff' : '#94a3b8'; }}
                  >
                    <X size={13} />
                  </span>
                </button>
              );
            })}
          </div>

          {savedSearches.length > 0 && (
            <button
              onClick={() => { setSavedSearches([]); localStorage.removeItem('erp_saved_searches'); }}
              style={{ marginLeft: 'auto', background: 'none', border: 'none', fontSize: '12px', color: '#cbd5e1', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', transition: 'color 0.2s', padding: 0 }}
              onMouseOver={(e) => e.currentTarget.style.color = '#ef4444'}
              onMouseOut={(e) => e.currentTarget.style.color = '#cbd5e1'}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Main Content Layout */}
      <div style={{ display: 'flex', borderTop: '1px solid #e2e8f0', minHeight: 'calc(100vh - 180px)' }}>
        {/* Left Sidebar Filter */}
        {showFilterSidebar ? (
          <CandidateFilterSidebar
            totalCount={filteredCandidates.length}
            overallTotal={candidates.length}
            filters={sidebarFilters}
            setFilters={setSidebarFilters}
            onClearAll={handleResetFilters}
            availableStatuses={availableStatuses}
            availableWorkTypes={availableWorkTypes}
            availableLocations={availableLocations}
            availableSources={availableSources}
            availableEmploymentTypes={availableEmploymentTypes}
            availableIndustries={availableIndustries}
            availableWorkAuths={availableWorkAuths}
            availableGenders={availableGenders}
            onClose={() => setShowFilterSidebar(false)}
            visibleColumns={visibleSidebarFilters}
            setVisibleColumns={setVisibleSidebarFilters}
          />
        ) : (
          <div
            className="cm-sidebar-reopen-strip"
            onClick={() => setShowFilterSidebar(true)}
            title="Open Filters"
            style={{
              width: '12px',
              background: '#f1f5f9',
              borderRight: '1px solid #e2e8f0',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              position: 'relative',
              zIndex: 10
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.width = '20px'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.width = '12px'; }}
          >
            <div style={{
              transform: 'rotate(90deg)',
              whiteSpace: 'nowrap',
              fontSize: '10px',
              fontWeight: 700,
              color: '#64748b',
              letterSpacing: '0.1em',
              textTransform: 'uppercase'
            }}>
              Filters
            </div>
          </div>
        )}

        {/* Right Content Area */}
        <div style={{ flex: 1, minWidth: 0, padding: '0 0 24px 0' }}>
          {/* AI Search Active Indicator */}
          {aiSearchResults && (
            <div style={{
              padding: '10px 32px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: '#f0fdfa',
              borderBottom: '1px solid #ccfbf1',
              animation: 'cm-slide-down 0.3s ease'
            }}>
              <Sparkles size={16} color="#0d9488" className="cm-pulse" />
              <span style={{ fontSize: '13px', color: '#0d9488', fontWeight: 600 }}>
                AI-Powered Search Active
              </span>
              <span style={{ fontSize: '12.5px', color: '#475569' }}>
                — {aiSearchResults.length} candidates ranked by semantic relevance
              </span>
              <button
                onClick={() => { setAiSearchResults(null); setSearchTerm(''); }}
                style={{
                  marginLeft: 'auto',
                  background: '#fff',
                  border: '1px solid #0d9488',
                  color: '#0d9488',
                  borderRadius: '6px',
                  padding: '4px 12px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 1px 2px rgba(13, 148, 136, 0.1)'
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = '#0d9488'; e.currentTarget.style.color = '#fff'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#0d9488'; }}
              >
                Clear AI Search
              </button>
            </div>
          )}

          {/* Active Filters Indicator */}
          {(advancedFilters.rows.filter(r => r.field && r.condition).length > 0 ||
            (sidebarFilters.status || []).length > 0 ||
            (sidebarFilters.workType || []).length > 0 ||
            sidebarFilters.country ||
            sidebarFilters.state ||
            sidebarFilters.city ||
            (sidebarFilters.sources || []).length > 0 ||
            (sidebarFilters.experience && sidebarFilters.experience !== 'all') ||
            (sidebarFilters.isBench && sidebarFilters.isBench !== 'all') ||
            (sidebarFilters.gender || []).length > 0 ||
            (sidebarFilters.workAuth || []).length > 0 ||
            (sidebarFilters.relocate && sidebarFilters.relocate !== 'all')) && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 32px', background: '#f8fafc',
                borderBottom: '1px solid #e2e8f0', fontSize: 13,
                flexWrap: 'wrap'
              }}>
                <span style={{ fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Filter size={14} /> Active Filters:
                </span>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {(sidebarFilters.status || []).map(s => (
                    <span key={s} style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 500 }}>{s}</span>
                  ))}
                  {(sidebarFilters.workType || []).map(w => (
                    <span key={w} style={{ background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 500 }}>{w}</span>
                  ))}
                  {sidebarFilters.country && (
                    <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 500 }}>Country: {sidebarFilters.country}</span>
                  )}
                  {sidebarFilters.state && (
                    <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 500 }}>State: {sidebarFilters.state}</span>
                  )}
                  {sidebarFilters.city && (
                    <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 500 }}>City: {sidebarFilters.city}</span>
                  )}
                  {(sidebarFilters.workAuth || []).map(auth => (
                    <span key={auth} style={{ background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 500 }}>Auth: {auth}</span>
                  ))}
                  {(sidebarFilters.employmentTypes || []).map(type => (
                    <span key={type} style={{ background: '#ecfdf5', color: '#065f46', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 500 }}>{type}</span>
                  ))}
                  {(sidebarFilters.industries || []).map(ind => (
                    <span key={ind} style={{ background: '#f8fafc', color: '#475569', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 500 }}>{ind}</span>
                  ))}
                  {sidebarFilters.experience && sidebarFilters.experience !== 'all' && (
                    <span style={{ background: '#f3e8ff', color: '#6b21a8', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 500 }}>Exp: {sidebarFilters.experience}</span>
                  )}
                  {sidebarFilters.isBench && sidebarFilters.isBench !== 'all' && (
                    <span style={{ background: '#ffedd5', color: '#9a3412', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 500 }}>{sidebarFilters.isBench === 'bench' ? 'Bench Only' : 'Non-Bench'}</span>
                  )}
                </div>

                <button
                  onClick={handleResetFilters}
                  style={{
                    marginLeft: 'auto', background: 'none', border: 'none',
                    color: '#ef4444', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 4
                  }}
                >
                  Clear All
                </button>
              </div>
            )}

          {/* Table or AI Loading */}
          {isAiSearching ? (
            <div className="cm-ai-search-loading">
              <div className="cm-ai-search-loading-icon-wrapper">
                <Sparkles size={48} color="#0d9488" fill="#0d9488" className="cm-ai-loading-sparkles" />
              </div>
              <h2 className="cm-ai-search-loading-title">AI Is analyzing your database...</h2>
              <p className="cm-ai-search-loading-subtitle">Finding the best matches based on semantic relevance</p>
              <div className="cm-ai-search-loading-progress-container">
                <div className="cm-ai-search-loading-progress-bar"></div>
              </div>
            </div>
          ) : (
            <CandidateTable
              candidates={paginatedCandidates}
              isAiSearching={isAiSearching}
              visibleColumns={visibleColumns}
              sortConfig={sortConfig}
              onSort={requestSort}
              onView={viewCandidate}
              onEdit={editCandidate}
              onShare={(candidate) => {
                setShareModalCandidates([candidate]);
                setShowShareModal(true);
              }}
              onSchedule={(candidate) => {
                setScheduleCandidate(candidate);
                setShowJobsModal(true);
              }}
              onSubmitProfile={(candidate) => {
                setSubmitCandidate(candidate);
                setShowSubmitModal(true);
              }}
              onDelete={deleteCandidate}
              currentPage={currentPage}
              totalPages={totalPages}
              totalCount={filteredCandidates.length}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={(newVal) => {
                setItemsPerPage(newVal);
                setCurrentPage(1);
              }}
              selectedRows={selectedCandidateIds}
              onSelectionChange={setSelectedCandidateIds}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      <ShareResumeModal
        isOpen={showShareModal}
        onClose={() => { setShowShareModal(false); setShareModalCandidates([]); }}
        candidates={shareModalCandidates}
      />

      <CandidateJobsModal
        isOpen={showJobsModal}
        onClose={() => { setShowJobsModal(false); setScheduleCandidate(null); }}
        candidate={scheduleCandidate}
        onSelectJob={(job) => {
          setSelectedJobForInterview(job);
          setShowJobsModal(false);
          setShowScheduleModal(true);
        }}
      />

      <ScheduleInterviewModal
        isOpen={showScheduleModal}
        onClose={() => { setShowScheduleModal(false); setScheduleCandidate(null); setSelectedJobForInterview(null); }}
        candidate={scheduleCandidate}
        job={selectedJobForInterview}
      />

      <SubmitProfileModal
        isOpen={showSubmitModal}
        onClose={() => { setShowSubmitModal(false); setSubmitCandidate(null); }}
        candidate={submitCandidate}
      />

      {showAddModal && (
        <AddModal
          candidate={editingCandidate}
          onClose={() => { setShowAddModal(false); setEditingCandidate(null); setParsedResumeData(null); }}
          onSave={handleSaveCandidate}
          onResumeUpload={handleResumeUpload}
          uploading={uploadingResume}
          parsedData={parsedResumeData}
          fetchFullCandidateDetails={getFullCandidate}
        />
      )}

      <FilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={handleApplyFilters}
        initialFilters={advancedFilters}
      />

      <ConfirmParseModal
        isOpen={showConfirmParse}
        onConfirm={handleConfirmParse}
        onCancel={() => { setShowConfirmParse(false); setPendingParseFile(null); }}
      />

      <ParsingLoadingModal
        isOpen={showParsingLoading}
      />

      <DuplicateResumeModal
        isOpen={showDuplicateModal}
        duplicateCandidate={duplicateCandidate}
        onProceed={handleDuplicateAction}
        onCancel={() => handleDuplicateAction('cancel')}
      />

      <ColumnFilterSidebar
        availableColumns={availableColumns}
        selectedColumns={visibleColumns}
        setSelectedColumns={setVisibleColumns}
        availableFilters={availableSidebarFilters}
        selectedFilters={visibleSidebarFilters}
        setSelectedFilters={setVisibleSidebarFilters}
        onClose={() => setShowColumnSidebar(false)}
        isOpen={showColumnSidebar}
      />

      {showAiSidebar && (
        <div className="cm-ai-overlay" onClick={() => setShowAiSidebar(false)} />
      )}
      <AskAiSidebar
        isOpen={showAiSidebar}
        onClose={() => setShowAiSidebar(false)}
        candidates={candidates}
      />
    </div>
  );
};

export default ResumeDashboard;




// import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
// import { Plus, Download, SlidersHorizontal, Filter, Search, Upload, Loader, Share2, Sparkles, Heart, X, Bookmark, Trash2, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
// import { useNavigate, useLocation } from 'react-router-dom';
// import {
//   CANDIDATE_STATUS_OPTIONS, REMOTE_STATUS_OPTIONS, DATE_OPTIONS, formatDate,
//   WORK_AUTHORIZATION_OPTIONS, EMPLOYMENT_TYPE_OPTIONS, SECURITY_CLEARANCE_OPTIONS,
//   RATE_TYPE_OPTIONS, MARITAL_STATUS_OPTIONS, INDUSTRY_OPTIONS
// } from '../utils/mockData';
// import CandidateTable from './CandidateTable';
// import AddModal from './AddModal';
// import FilterModal from './FilterModal';
// import ShareResumeModal from './ShareResumeModal';
// import { CandidateJobsModal, ScheduleInterviewModal } from './ScheduleInterviewModals';
// import { SubmitProfileModal } from './SubmitProfileModal';
// import { ConfirmParseModal, ParsingLoadingModal, DuplicateResumeModal } from './ParseFlowModals';
// import ColumnFilterSidebar from './ColumnFilterSidebar';
// import CandidateFilterSidebar from './CandidateFilterSidebare';
// import AskAiSidebar from './AskAiSidebar';
// import '../styles/Dashboard.css';
// import '../styles/CandidateTableCustom.css';
// import '../styles/AddModalCustom.css';
// import Swal from 'sweetalert2';
// import * as XLSX from 'xlsx';
// import BASE_URL, { RESUME_PARSER_URL } from "../../url";
// import { formatName, formatJobTitle, formatNameFields, formatFullName } from '../utils/nameFormatter';
// import {
//   countriesData,
//   getCountryCode,
//   getStateCode
// } from '../../erprecruitment/config/locationConfig';

// // ─── Helper to get auth headers ──────────────────────────────────────────────
// const getAuthHeaders = () => {
//   const token = localStorage.getItem('token');
//   return {
//     'Authorization': `Bearer ${token}`,
//   };
// };

// // ─── Module-level cache so multiple mounts don't re-fetch ─────────────────────
// let _cachedCandidates = null;
// let _cachedSearchTerm = '';
// let _cachedStatusFilter = 'all';
// let _cachedAiSearchResults = null;
// let _cachedUseAiSearch = true;
// let _cachedItemsPerPage = 30;
// // ──────────────────────────────────────────────────────────────────────────────

// const formatToMonth = (dateStr) => {
//   if (!dateStr) return '';
//   const d = new Date(dateStr);
//   if (isNaN(d.getTime())) return typeof dateStr === 'string' && dateStr.length >= 7 ? dateStr.substring(0, 7) : dateStr;
//   return d.toISOString().substring(0, 7);
// };

// // ── Transform a raw API candidate object into the shape the UI needs ──────────
// const transformCandidate = (candidate) => {
//   const isEmployee = !!candidate.employee_id;
//   const empId = candidate.employee_id || '';

//   return {
//     CandidateId: candidate.candidate_id,
//     CandidateCode: candidate.candidate_code || `CAN-${String(candidate.candidate_id).padStart(6, '0')}`,
//     EmployeeCode: empId,
//     IsEmployee: isEmployee,
//     FirstName: formatName(candidate.first_name || ''),
//     LastName: formatName(candidate.last_name || ''),
//     MiddleName: formatName(candidate.middle_name || ''),
//     JobTitle: formatJobTitle(candidate.job_title || ''),
//     YearsOfExperience: candidate.years_exp,
//     CandidateStatus: candidate.status || 'Available',
//     RemoteStatus: candidate.remote_status || 'OnSite',
//     CreatedDt: candidate.created_on,
//     ProfileSummary: candidate.profile_summary || '',
//     LinkedInUrl: candidate.linkedin_url || '',
//     GitHubUrl: candidate.github_url || '',
//     TwitterUrl: candidate.twitter_url || '',
//     VideoResumeUrl: candidate.video_resume_url || '',
//     Gender: candidate.gender || '',
//     CurrentLocation: candidate.current_location || '',
//     Source: candidate.source || '',

//     // NEW FIELDS from backend
//     WorkAuthorization: candidate.work_authorization || '',
//     SecurityClearance: candidate.security_clearance || '',
//     WillingToRelocate: candidate.willing_to_relocate || false,
//     IsBench: candidate.is_bench || false,
//     EmploymentType: candidate.employment_type || '',
//     ExpectedRateFrom: candidate.expected_rate_from || '',
//     ExpectedRateTo: candidate.expected_rate_to || '',
//     ExpectedRateType: candidate.expected_rate_type || 'Hourly',
//     CurrentRate: candidate.current_rate || '',
//     CurrentRateType: candidate.current_rate_type || 'Hourly',
//     MaritalStatus: candidate.marital_status || '',
//     Industry: candidate.industry || '',
//     Mobile: candidate.mobile || '',

//     Contact: {
//       Email: candidate.email || '',
//       Phone: candidate.phone || '',
//       Mobile: candidate.mobile || '',
//     },
//     Phones: candidate.phones || [],
//     Emails: candidate.emails || [],
//     Skills: (candidate.skills || []).map(s =>
//       typeof s === 'string'
//         ? { SkillName: s, SkillType: 'HARD' }
//         : { SkillName: s.skill_name || s.SkillName || '', SkillType: s.skill_type || s.SkillType || 'HARD' }
//     ),
//     Education: (candidate.education || []).map(e => ({
//       Institution: formatName(e.Institution || e.institution || ''),
//       Degree: formatName(e.Degree || e.degree || ''),
//       FieldOfStudy: e.FieldOfStudy || e.fieldOfStudy || '',
//       StartDate: formatToMonth(e.StartDate || e.startDate),
//       EndDate: formatToMonth(e.EndDate || e.endDate),
//       GPA: e.GPA || e.gpa || '',
//     })),
//     WorkExperience: (candidate.work_experience || []).map(w => ({
//       Company: w.Company || w.company || '',
//       JobTitle: formatJobTitle(w.JobTitle || w.jobTitle || ''),
//       StartDate: formatToMonth(w.StartDate || w.startDate),
//       EndDate: formatToMonth(w.EndDate || w.endDate),
//       IsCurrent: w.IsCurrent ?? w.isCurrent ?? false,
//       Description: w.Description || w.description || '',
//     })),
//     Certifications: (candidate.certifications || []).map(c => ({
//       CertificationName: formatName(c.CertificationName || c.name || ''),
//       IssuingOrganization: c.IssuingOrganization || c.issuingOrg || '',
//       IssueDate: formatToMonth(c.IssueDate || c.issueDate),
//       ExpiryDate: formatToMonth(c.ExpiryDate || c.expiryDate),
//       CredentialId: c.CredentialId || c.credentialId || '',
//       CredentialUrl: c.CredentialUrl || c.credentialUrl || '',
//     })),
//     Document: candidate.document ? {
//       DocumentId: candidate.document.DocumentId,
//       FileNameOriginal: candidate.document.FileNameOriginal,
//       FileExtension: candidate.document.FileExtension,
//       MimeType: candidate.document.MimeType,
//       FileSizeBytes: candidate.document.FileSizeBytes,
//       StorageLocator: candidate.document.StorageLocator,
//       ParseStatus: candidate.document.ParseStatus,
//       DownloadUrl: candidate.document.DownloadUrl,
//     } : null,
//     Documents: (candidate.documents || []).map(d => ({
//       DocumentId: d.DocumentId || d.documentId,
//       DocumentType: d.DocumentType || d.documentType || 'Certificate',
//       DocumentName: d.FileNameOriginal ? d.FileNameOriginal.replace(/\.[^/.]+$/, "") : (d.DocumentName || ''),
//       FileNameOriginal: d.FileNameOriginal || d.fileNameOriginal,
//       FileExtension: d.FileExtension || d.fileExtension,
//       MimeType: d.MimeType || d.mimeType,
//       FileSizeBytes: d.FileSizeBytes || d.fileSizeBytes,
//       UploadedOn: d.UploadedOn || d.uploadedOn,
//       VersionNo: d.VersionNo || d.versionNo,
//       IsPrimary: d.IsPrimary || d.isPrimary,
//     })),
//   };
// };

// const ResumeDashboard = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const queryParams = new URLSearchParams(location.search);
//   const currentView = queryParams.get('view') || 'all';
//   const [candidates, setCandidates] = useState(_cachedCandidates || []);
//   const [loading, setLoading] = useState(_cachedCandidates === null);
//   const isFetchingRef = useRef(false);
//   const [searchTerm, setSearchTerm] = useState(_cachedSearchTerm);
//   const [selectedCandidate, setSelectedCandidate] = useState(null);
//   const [showViewModal, setShowViewModal] = useState(false);
//   const [loadingDetail, setLoadingDetail] = useState(false);
//   const [showAddModal, setShowAddModal] = useState(false);
//   const [sortConfig, setSortConfig] = useState({ key: 'CreatedOn', direction: 'desc' });
//   const [currentPage, setCurrentPage] = useState(1);
//   const [itemsPerPage, setItemsPerPage] = useState(_cachedItemsPerPage);
//   const [editingCandidate, setEditingCandidate] = useState(null);
//   const [showColumnSidebar, setShowColumnSidebar] = useState(false);
//   const [exporting, setExporting] = useState(false);
//   const [showFilterModal, setShowFilterModal] = useState(false);
//   const [advancedFilters, setAdvancedFilters] = useState({ rows: [], logic: 'AND' });
//   const [showAiSidebar, setShowAiSidebar] = useState(false);
//   const [uploadingResume, setUploadingResume] = useState(false);
//   const [useAiSearch, setUseAiSearch] = useState(_cachedUseAiSearch);
//   const [isAiSearching, setIsAiSearching] = useState(false);
//   const [aiSearchResults, setAiSearchResults] = useState(_cachedAiSearchResults);

//   // Parse Flow States
//   const [parsedResumeData, setParsedResumeData] = useState(null);
//   const [parsingFromToolbar, setParsingFromToolbar] = useState(false);
//   const [pendingParseFile, setPendingParseFile] = useState(null);
//   const [showConfirmParse, setShowConfirmParse] = useState(false);
//   const [showParsingLoading, setShowParsingLoading] = useState(false);
//   const [showDuplicateModal, setShowDuplicateModal] = useState(false);
//   const [duplicateCandidate, setDuplicateCandidate] = useState(null);
//   const [statusFilter, setStatusFilter] = useState(_cachedStatusFilter);
//   const [showFilterSidebar, setShowFilterSidebar] = useState(true);

//   // Sidebar Filter State
//   const [sidebarFilters, setSidebarFilters] = useState({
//     search: '',
//     status: [],
//     workType: [],
//     experience: 'all',
//     country: '',
//     state: '',
//     city: '',
//     sources: [],
//     employmentTypes: [],
//     industries: [],
//     isBench: 'all',
//     personType: 'all',
//     gender: [],
//     relocate: 'all',
//     workAuth: []
//   });

//   // Visible Sidebar Filters (Dynamic filter visibility)
//   const [visibleSidebarFilters, setVisibleSidebarFilters] = useState([
//     'CandidateStatus', 'PersonType', 'IsBench', 'RemoteStatus', 'Experience',
//     'Gender', 'Relocation', 'WorkAuthorization', 'EmploymentType', 'Industry', 'CurrentLocation'
//   ]);

//   // Sync top search TO sidebar search only once on mount or when searchTerm changes externally
//   useEffect(() => {
//     setSidebarFilters(prev => ({ ...prev, search: searchTerm }));
//   }, [searchTerm]);

//   // Auto-save active search filters
//   useEffect(() => {
//     _cachedSearchTerm = searchTerm;
//   }, [searchTerm]);

//   useEffect(() => {
//     _cachedStatusFilter = statusFilter;
//   }, [statusFilter]);

//   useEffect(() => {
//     _cachedAiSearchResults = aiSearchResults;
//   }, [aiSearchResults]);

//   useEffect(() => {
//     _cachedUseAiSearch = useAiSearch;
//   }, [useAiSearch]);

//   useEffect(() => {
//     _cachedItemsPerPage = itemsPerPage;
//   }, [itemsPerPage]);

//   // Reset page when filters change
//   useEffect(() => {
//     setCurrentPage(1);
//   }, [sidebarFilters, searchTerm, aiSearchResults]);

//   // Share Resume State
//   const [showShareModal, setShowShareModal] = useState(false);
//   const [shareModalCandidates, setShareModalCandidates] = useState([]);
//   const [selectedCandidateIds, setSelectedCandidateIds] = useState([]);

//   // Schedule Interview State
//   const [showJobsModal, setShowJobsModal] = useState(false);
//   const [showScheduleModal, setShowScheduleModal] = useState(false);
//   const [scheduleCandidate, setScheduleCandidate] = useState(null);
//   const [selectedJobForInterview, setSelectedJobForInterview] = useState(null);

//   // Submit Profile State
//   const [showSubmitModal, setShowSubmitModal] = useState(false);
//   const [submitCandidate, setSubmitCandidate] = useState(null);

//   const parseFileInputRef = useRef(null);

//   // Saved Searches State
//   const [savedSearches, setSavedSearches] = useState([]);

//   useEffect(() => {
//     const saved = localStorage.getItem('erp_saved_searches');
//     if (saved) {
//       try {
//         setSavedSearches(JSON.parse(saved));
//       } catch (e) { }
//     }
//   }, []);

//   const handleSaveSearch = () => {
//     if (!searchTerm && statusFilter === 'all') return;

//     const exists = savedSearches.some(s => s.term === searchTerm && s.status === statusFilter);
//     if (exists) return;

//     const newSaved = [...savedSearches, { term: searchTerm, status: statusFilter, id: Date.now() }];
//     setSavedSearches(newSaved);
//     localStorage.setItem('erp_saved_searches', JSON.stringify(newSaved));

//     Swal.fire({
//       title: 'Search Saved!',
//       text: 'Your current search and filters have been saved.',
//       icon: 'success',
//       timer: 1500,
//       showConfirmButton: false
//     });
//   };

//   const handleLoadSearch = (search) => {
//     setSearchTerm(search.term);
//     setStatusFilter(search.status || 'all');
//     setCurrentPage(1);

//     if (useAiSearch && search.term) {
//       handleAiSearch(search.term);
//     } else {
//       setAiSearchResults(null);
//     }
//   };

//   const removeSavedSearch = (id) => {
//     const updated = savedSearches.filter(s => s.id !== id);
//     setSavedSearches(updated);
//     localStorage.setItem('erp_saved_searches', JSON.stringify(updated));
//   };

//   // ─── Column Configuration ────────────────────────────────────────────────
//   const availableColumns = [
//     { key: 'CandidateCode', label: 'Candidate ID' },
//     { key: 'EmployeeCode', label: 'Employee ID' },
//     { key: 'Candidate', label: 'Name' },
//     { key: 'Email', label: 'Email' },
//     { key: 'Phone', label: 'Phone' },
//     { key: 'Mobile', label: 'Mobile' },
//     { key: 'JobTitle', label: 'Job Title' },
//     { key: 'YearsOfExperience', label: 'Years of Exp.' },
//     { key: 'Skills', label: 'Skills' },
//     { key: 'CandidateStatus', label: 'Status' },
//     { key: 'RemoteStatus', label: 'Work Type' },
//     { key: 'CreatedDate', label: 'Created Date' },
//     { key: 'LinkedInUrl', label: 'LinkedIn URL' },
//     { key: 'GitHubUrl', label: 'GitHub URL' },
//     { key: 'CurrentLocation', label: 'Location' },
//     { key: 'Gender', label: 'Gender' },
//     { key: 'ProfileSummary', label: 'Profile Summary' },
//     { key: 'PersonType', label: 'Type' },
//     { key: 'IsBench', label: 'Bench Status' },
//     { key: 'Experience', label: 'Experience' },
//     { key: 'Relocation', label: 'Relocation' },
//     { key: 'Source', label: 'Source' },
//     { key: 'Actions', label: 'Actions' },
//   ];

//   const availableSidebarFilters = [
//     { key: 'CandidateStatus', label: 'Status' },
//     { key: 'PersonType', label: 'Type' },
//     { key: 'IsBench', label: 'Bench Status' },
//     { key: 'RemoteStatus', label: 'Work Type' },
//     { key: 'Experience', label: 'Experience' },
//     { key: 'Gender', label: 'Gender' },
//     { key: 'Relocation', label: 'Relocation' },
//     { key: 'CurrentLocation', label: 'Location' },
//     { key: 'Skills', label: 'Skills (Search)' },
//     { key: 'Email', label: 'Email (Search)' },
//     { key: 'Phone', label: 'Phone (Search)' },
//     { key: 'JobTitle', label: 'Job Title (Search)' },
//   ];

//   const [visibleColumns, setVisibleColumns] = useState([
//     'CandidateCode', 'EmployeeCode', 'Candidate', 'Email', 'Phone', 'JobTitle',
//     'YearsOfExperience', 'Skills', 'CandidateStatus', 'RemoteStatus', 'CreatedDate', 'Actions',
//   ]);

//   // ── Fetch candidate list ──────────────────────────────────────────────────
//   const fetchCandidates = useCallback(async (force = false) => {
//     if (_cachedCandidates && !force) {
//       setCandidates(_cachedCandidates);
//       setLoading(false);
//       return;
//     }
//     if (isFetchingRef.current) return;
//     isFetchingRef.current = true;
//     setLoading(true);

//     try {
//       const response = await fetch(`${BASE_URL}/api/resumes`, {
//         headers: getAuthHeaders(),
//       });
//       if (!response.ok) throw new Error(`Server error: ${response.status} ${response.statusText}`);

//       const raw = await response.json();
//       const data = Array.isArray(raw)
//         ? raw
//         : Array.isArray(raw?.data) ? raw.data
//           : Array.isArray(raw?.candidates) ? raw.candidates
//             : [];

//       const transformedCandidates = data.map(transformCandidate);

//       // De-duplicate by CandidateId
//       const uniqueItems = [];
//       const seenIds = new Set();
//       transformedCandidates.forEach(c => {
//         const id = String(c.CandidateId);
//         if (!seenIds.has(id)) {
//           seenIds.add(id);
//           uniqueItems.push(c);
//         }
//       });

//       _cachedCandidates = uniqueItems;
//       setCandidates(uniqueItems);

//     } catch (error) {
//       console.error('[ResumeDashboard] Error fetching candidates:', error);
//       Swal.fire({
//         title: 'Connection Error',
//         html: `<p>Could not load candidates from the server.</p>
//                <small style="color:#888">Make sure the backend server is running and reachable.</small>`,
//         icon: 'error',
//         confirmButtonText: 'OK',
//       });
//       setCandidates([]);
//     } finally {
//       isFetchingRef.current = false;
//       setLoading(false);
//     }
//   }, []);

//   const handleAiSearch = useCallback(async (query) => {
//     if (!query || !query.trim()) {
//       setAiSearchResults(null);
//       return;
//     }

//     setIsAiSearching(true);
//     try {
//       const countMatch = query.match(/(\d+)\s*(?:candidates|results|people)/i);
//       const requestedLimit = countMatch ? parseInt(countMatch[1]) : 50;

//       const response = await fetch(`${BASE_URL}/api/resumes/search`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           ...getAuthHeaders()
//         },
//         body: JSON.stringify({
//           query: query.trim(),
//           top_k: requestedLimit,
//           limit: requestedLimit,
//           size: requestedLimit
//         }),
//       });

//       if (!response.ok) throw new Error('AI Search failed');
//       const data = await response.json();

//       if (data && data.results) {
//         console.log(`🔍 AI Search returned ${data.results.length} results (Requested: ${requestedLimit})`);

//         const seenIds = new Set();
//         const mappedResults = data.results
//           .filter(res => {
//             const id = String(res.candidate_id);
//             if (seenIds.has(id)) return false;
//             seenIds.add(id);
//             return true;
//           })
//           .map(res => {
//             const localMatch = candidates.find(c => String(c.CandidateId) === String(res.candidate_id));

//             if (localMatch) {
//               return {
//                 ...localMatch,
//                 aiScore: res.score,
//                 aiRank: res.rank,
//                 matchReason: res.match_reason
//               };
//             }

//             return {
//               CandidateId: res.candidate_id,
//               FirstName: res.name?.split(' ')[0] || 'Unknown',
//               LastName: res.name?.split(' ').slice(1).join(' ') || '',
//               JobTitle: res.job_title || 'N/A',
//               YearsOfExperience: res.years_experience,
//               Skills: (res.skills || []).map(s => ({ SkillName: s, SkillType: 'HARD' })),
//               CandidateStatus: 'Available',
//               RemoteStatus: res.remote_status || 'OnSite',
//               Contact: {
//                 Email: '',
//                 Phone: '',
//                 Mobile: ''
//               },
//               matchReason: res.match_reason,
//               aiScore: res.score,
//               aiRank: res.rank
//             };
//           });

//         setAiSearchResults(mappedResults);
//         setCurrentPage(1);
//       }
//     } catch (error) {
//       console.error('AI Search Error:', error);
//       Swal.fire({
//         title: 'Search Error',
//         text: 'The AI search service is currently unavailable.',
//         icon: 'error',
//         timer: 2000,
//         showConfirmButton: false
//       });
//     } finally {
//       setIsAiSearching(false);
//     }
//   }, [candidates]);

//   // ── Debounced AI Search Flow ─────────────────────────────────────────────
//   useEffect(() => {
//     if (!useAiSearch || !searchTerm || !searchTerm.trim()) {
//       if (!searchTerm) {
//         setAiSearchResults(null);
//       }
//       // If we cleared the search, we stop searching
//       if (!searchTerm) setIsAiSearching(false);
//       return;
//     }

//     // Immediately indicate searching state to trigger animation
//     setIsAiSearching(true);

//     const timer = setTimeout(() => {
//       handleAiSearch(searchTerm);
//     }, 1200); // Slightly longer debounce for semantic analysis

//     return () => clearTimeout(timer);
//   }, [searchTerm, useAiSearch, handleAiSearch]);

//   // Reset search and filters when view changes
//   useEffect(() => {
//     setSearchTerm('');
//     setAiSearchResults(null);
//     setAdvancedFilters({ rows: [], logic: 'AND' });
//     setCurrentPage(1);
//     fetchCandidates(true);
//   }, [currentView, fetchCandidates]);

//   // ── Navigate to full candidate detail page ────────────────────────────
//   const viewCandidate = (id) => {
//     navigate(`/candidates/${id}`);
//   };

//   // ── Get field value from candidate ──
//   const getFieldValue = useCallback((candidate, field) => {
//     switch (field) {
//       case 'FirstName':
//         return formatFullName(candidate.FirstName, candidate.MiddleName, candidate.LastName);
//       case 'Email': return candidate.Contact?.Email || '';
//       case 'Phone': return candidate.Contact?.Phone || '';
//       case 'Skills':
//         return (candidate.Skills || []).map(s => s.SkillName || s).join(', ');
//       case 'YearsOfExperience': return candidate.YearsOfExperience != null ? String(candidate.YearsOfExperience) : '';
//       case 'CreatedDt': return candidate.CreatedDt || '';
//       default: {
//         const val = candidate[field];
//         return (val !== null && val !== undefined) ? String(val) : '';
//       }
//     }
//   }, []);

//   // ── Check if a candidate matches a single filter row ──
//   const matchesRow = useCallback((candidate, row) => {
//     const rawVal = getFieldValue(candidate, row.field);
//     const target = (row.value || '').trim();

//     if (row.condition === 'is_empty') return !rawVal || String(rawVal).trim() === '';
//     if (row.condition === 'is_not_empty') return rawVal && String(rawVal).trim() !== '';

//     const valStr = String(rawVal || '').trim();
//     const valLower = valStr.toLowerCase();
//     const targetLower = target.toLowerCase();

//     const numVal = parseFloat(valStr);
//     const numTarget = parseFloat(target);
//     const isNumericMatch = !isNaN(numVal) && !isNaN(numTarget) && isFinite(valStr) && isFinite(target);

//     const dateVal = new Date(valStr);
//     const dateTarget = new Date(target);
//     const isDateMatch = !isNaN(dateVal.getTime()) && !isNaN(dateTarget.getTime()) && valStr.includes('-') && target.includes('-');

//     switch (row.condition) {
//       case 'contains': return valLower.includes(targetLower);
//       case 'not_contains': return !valLower.includes(targetLower);
//       case 'equals':
//         if (isNumericMatch) return numVal === numTarget;
//         if (isDateMatch) {
//           const d1 = new Date(dateVal).setHours(0, 0, 0, 0);
//           const d2 = new Date(dateTarget).setHours(0, 0, 0, 0);
//           return d1 === d2;
//         }
//         if (row.field === 'Skills') {
//           return valLower.split(',').map(s => s.trim()).includes(targetLower);
//         }
//         return valLower === targetLower;
//       case 'not_equals':
//         if (isNumericMatch) return numVal !== numTarget;
//         if (isDateMatch) {
//           const d1 = new Date(dateVal).setHours(0, 0, 0, 0);
//           const d2 = new Date(dateTarget).setHours(0, 0, 0, 0);
//           return d1 !== d2;
//         }
//         if (row.field === 'Skills') {
//           return !valLower.split(',').map(s => s.trim()).includes(targetLower);
//         }
//         return valLower !== targetLower;
//       case 'starts_with': return valLower.startsWith(targetLower);
//       case 'ends_with': return valLower.endsWith(targetLower);
//       case 'greater_than':
//         if (isNumericMatch) return numVal > numTarget;
//         if (isDateMatch) return dateVal.setHours(0, 0, 0, 0) > dateTarget.setHours(0, 0, 0, 0);
//         return valLower > targetLower;
//       case 'less_than':
//         if (isNumericMatch) return numVal < numTarget;
//         if (isDateMatch) return dateVal.setHours(0, 0, 0, 0) < dateTarget.setHours(0, 0, 0, 0);
//         return valLower < targetLower;
//       default: return true;
//     }
//   }, [getFieldValue]);

//   // ── Derived filter options ─────────────────────────────────────────────
//   const availableStatuses = useMemo(() => {
//     return ['Available', 'In Process', 'Not Available', 'Hired'];
//   }, []);

//   const availableWorkTypes = useMemo(() => {
//     return ['Remote', 'OnSite', 'Hybrid'];
//   }, []);

//   const availableLocations = useMemo(() => {
//     const locs = [...new Set(candidates.map(c => {
//       if (c.CurrentLocation) {
//         const parts = c.CurrentLocation.split(',').map(p => p.trim());
//         if (parts.length >= 2) {
//           return parts.slice(-2).join(', ');
//         }
//         return parts[0];
//       }
//       return null;
//     }))].filter(Boolean);
//     return locs.sort();
//   }, [candidates]);

//   const availableSources = useMemo(() => {
//     const sources = [...new Set(candidates.map(c => c.Source))].filter(Boolean);
//     return sources.sort();
//   }, [candidates]);

//   const availableEmploymentTypes = useMemo(() => {
//     const types = [...new Set(candidates.map(c => c.EmploymentType))].filter(Boolean);
//     return types.sort();
//   }, [candidates]);

//   const availableIndustries = useMemo(() => {
//     const inds = [...new Set(candidates.map(c => c.Industry))].filter(Boolean);
//     return inds.sort();
//   }, [candidates]);

//   const availableWorkAuths = useMemo(() => {
//     const auths = [...new Set(candidates.map(c => c.WorkAuthorization))].filter(Boolean);
//     return auths.sort();
//   }, [candidates]);

//   const availableGenders = useMemo(() => {
//     const genders = [...new Set(candidates.map(c => c.Gender))].filter(Boolean);
//     return genders.sort();
//   }, [candidates]);


//   // ── Filter & Sort Logic ────────────────────────────────────────────────
//   const filteredCandidates = useMemo(() => {
//     // 1️⃣ Priority: If AI search was just performed, use those results as our working set
//     let result = aiSearchResults !== null ? [...aiSearchResults] : [...candidates];

//     // 2️⃣ Standard global search filtering - Skip if AI Search is active
//     if (aiSearchResults === null && searchTerm && !useAiSearch) {
//       const term = searchTerm.toLowerCase();
//       result = result.filter(c => {
//         const fullName = formatFullName(c.FirstName, c.MiddleName, c.LastName).toLowerCase();
//         const skillsText = (c.Skills || []).map(s => s.SkillName || s).join(' ').toLowerCase();
//         const exp = (c.YearsOfExperience !== undefined && c.YearsOfExperience !== null) ? c.YearsOfExperience : '';
//         const expText = exp !== '' ? `${exp}y ${exp} yr ${exp} year ${exp} years` : '';

//         const matchesName = fullName.includes(term);
//         const matchesJob = visibleSidebarFilters.includes('JobTitle') && (c.JobTitle || '').toLowerCase().includes(term);
//         const matchesCode = (c.CandidateCode || '').toLowerCase().includes(term);
//         const matchesEmail = visibleSidebarFilters.includes('Email') && (c.Contact?.Email || '').toLowerCase().includes(term);
//         const matchesPhone = visibleSidebarFilters.includes('Phone') && (
//           (c.Contact?.Phone || '').toLowerCase().includes(term) ||
//           (c.Contact?.Mobile || '').toLowerCase().includes(term)
//         );
//         const matchesSkills = visibleSidebarFilters.includes('Skills') && skillsText.includes(term);
//         const matchesExp = expText.toLowerCase().includes(term);

//         return matchesName || matchesJob || matchesCode || matchesEmail || matchesPhone || matchesSkills || matchesExp;
//       });
//     }

//     // 3️⃣ Sidebar-specific search filtering - Skip if AI Search is active
//     if (aiSearchResults === null && sidebarFilters.search) {
//       const term = sidebarFilters.search.toLowerCase();
//       result = result.filter(c => {
//         const fullName = formatFullName(c.FirstName, c.MiddleName, c.LastName).toLowerCase();
//         const skillsText = (c.Skills || []).map(s => s.SkillName || s).join(' ').toLowerCase();
//         const exp = (c.YearsOfExperience !== undefined && c.YearsOfExperience !== null) ? c.YearsOfExperience : '';
//         const expText = exp !== '' ? `${exp}y ${exp} yr ${exp} year ${exp} years` : '';

//         const matchesName = fullName.includes(term);
//         const matchesJob = visibleSidebarFilters.includes('JobTitle') && (c.JobTitle || '').toLowerCase().includes(term);
//         const matchesCode = (c.CandidateCode || '').toLowerCase().includes(term);
//         const matchesEmail = visibleSidebarFilters.includes('Email') && (c.Contact?.Email || '').toLowerCase().includes(term);
//         const matchesPhone = visibleSidebarFilters.includes('Phone') && (
//           (c.Contact?.Phone || '').toLowerCase().includes(term) ||
//           (c.Contact?.Mobile || '').toLowerCase().includes(term)
//         );
//         const matchesSkills = visibleSidebarFilters.includes('Skills') && skillsText.includes(term);
//         const matchesExp = expText.toLowerCase().includes(term);

//         return matchesName || matchesJob || matchesCode || matchesEmail || matchesPhone || matchesSkills || matchesExp;
//       });
//     }

//     // Status filter
//     if (statusFilter !== 'all') {
//       result = result.filter(c => {
//         if (statusFilter === 'On Bench') {
//           return c.IsBench === true || c.CandidateStatus === 'On Bench';
//         }
//         return (c.CandidateStatus || '').toLowerCase() === statusFilter.toLowerCase();
//       });
//     }

//     // Category filter based on 'view' query parameter - Skip strict sourcing/review checks if AI Search is active
//     if (aiSearchResults === null) {
//       if (currentView === 'sourcing') {
//         result = result.filter(c => {
//           const hasEmail = (c.Contact?.Email || '').trim();
//           const hasPhone = (c.Contact?.Phone || '').trim() || (c.Contact?.Mobile || '').trim() || (c.Mobile || '').trim();
//           const allowBench = sidebarFilters.isBench === 'bench';
//           return (allowBench || !c.IsBench) && hasEmail && hasPhone;
//         });
//       } else if (currentView === 'bench') {
//         result = result.filter(c => c.IsBench === true);
//       } else if (currentView === 'review') {
//         result = result.filter(c => {
//           const hasEmail = (c.Contact?.Email || '').trim();
//           const hasPhone = (c.Contact?.Phone || '').trim() || (c.Contact?.Mobile || '').trim() || (c.Mobile || '').trim();
//           return !hasEmail || !hasPhone;
//         });
//       }
//     }

//     // Sidebar Filters Logic
//     if ((sidebarFilters.status || []).length > 0) {
//       const selected = sidebarFilters.status.map(s => s.toLowerCase());
//       result = result.filter(c => selected.includes((c.CandidateStatus || '').toLowerCase()));
//     }
//     if ((sidebarFilters.workType || []).length > 0) {
//       const selected = sidebarFilters.workType.map(w => w.toLowerCase());
//       result = result.filter(c => selected.includes((c.RemoteStatus || '').toLowerCase()));
//     }

//     // Advanced location filtering with Country/State/City support
//     if (sidebarFilters.country) {
//       const selectedCountryName = sidebarFilters.country;
//       const selectedCountryCode = getCountryCode(selectedCountryName);

//       result = result.filter(c => {
//         if (!c.CurrentLocation) return false;
//         const locLower = c.CurrentLocation.toLowerCase();
//         return locLower.includes(selectedCountryName.toLowerCase()) ||
//           locLower.includes(selectedCountryCode.toLowerCase());
//       });
//     }

//     if (sidebarFilters.state) {
//       const selectedStateName = sidebarFilters.state;
//       const countryCode = getCountryCode(sidebarFilters.country);
//       const selectedStateCode = getStateCode(countryCode, selectedStateName);

//       result = result.filter(c => {
//         if (!c.CurrentLocation) return false;
//         const locLower = c.CurrentLocation.toLowerCase();
//         return locLower.includes(selectedStateName.toLowerCase()) ||
//           locLower.includes(selectedStateCode.toLowerCase());
//       });
//     }

//     if (sidebarFilters.city) {
//       const cityTerm = sidebarFilters.city.toLowerCase().trim();
//       result = result.filter(c => {
//         if (!c.CurrentLocation) return false;
//         const locLower = c.CurrentLocation.toLowerCase();
//         return locLower.includes(cityTerm);
//       });
//     }

//     if ((sidebarFilters.workAuth || []).length > 0) {
//       const selected = sidebarFilters.workAuth.map(a => a.toLowerCase());
//       result = result.filter(c => selected.includes((c.WorkAuthorization || '').toLowerCase()));
//     }

//     if ((sidebarFilters.employmentTypes || []).length > 0) {
//       const selected = sidebarFilters.employmentTypes.map(t => t.toLowerCase());
//       result = result.filter(c => selected.includes((c.EmploymentType || '').toLowerCase()));
//     }

//     if ((sidebarFilters.industries || []).length > 0) {
//       const selected = sidebarFilters.industries.map(i => i.toLowerCase());
//       result = result.filter(c => selected.includes((c.Industry || '').toLowerCase()));
//     }

//     if ((sidebarFilters.sources || []).length > 0) {
//       const selected = sidebarFilters.sources.map(s => s.toLowerCase());
//       result = result.filter(c => selected.includes((c.Source || '').toLowerCase()));
//     }

//     if ((sidebarFilters.gender || []).length > 0) {
//       const selected = sidebarFilters.gender.map(g => g.toLowerCase());
//       result = result.filter(c => selected.includes((c.Gender || '').toLowerCase()));
//     }

//     if (sidebarFilters.isBench && sidebarFilters.isBench !== 'all') {
//       result = result.filter(c => sidebarFilters.isBench === 'bench' ? c.IsBench : !c.IsBench);
//     }

//     if (sidebarFilters.personType && sidebarFilters.personType !== 'all') {
//       result = result.filter(c => sidebarFilters.personType === 'employees' ? c.IsEmployee : !c.IsEmployee);
//     }

//     if (sidebarFilters.relocate && sidebarFilters.relocate !== 'all') {
//       result = result.filter(c => sidebarFilters.relocate === 'yes' ? c.WillingToRelocate : !c.WillingToRelocate);
//     }

//     if (sidebarFilters.experience !== 'all') {
//       switch (sidebarFilters.experience) {
//         case '0-2': result = result.filter(c => (parseFloat(c.YearsOfExperience) || 0) <= 2); break;
//         case '3-5': result = result.filter(c => { const e = parseFloat(c.YearsOfExperience) || 0; return e > 2 && e <= 5; }); break;
//         case '5-10': result = result.filter(c => { const e = parseFloat(c.YearsOfExperience) || 0; return e > 5 && e <= 10; }); break;
//         case '10+': result = result.filter(c => (parseFloat(c.YearsOfExperience) || 0) > 10); break;
//         default: break;
//       }
//     }

//     // Advanced filters
//     const validRows = (advancedFilters.rows || []).filter(r => r.field && r.condition);
//     if (validRows.length > 0) {
//       result = result.filter(c => {
//         let isMatch = matchesRow(c, validRows[0]);

//         for (let i = 1; i < validRows.length; i++) {
//           const row = validRows[i];
//           const op = row.operator || 'AND';

//           if (op === 'OR') {
//             isMatch = isMatch || matchesRow(c, row);
//           } else {
//             isMatch = isMatch && matchesRow(c, row);
//           }
//         }
//         return isMatch;
//       });
//     }

//     // Standard sorting
//     result.sort((a, b) => {
//       let av, bv;
//       if (sortConfig.key === 'CreatedDt') {
//         av = new Date(a.CreatedDt || 0); bv = new Date(b.CreatedDt || 0);
//       } else if (sortConfig.key === 'YearsOfExperience') {
//         av = a.YearsOfExperience || 0; bv = b.YearsOfExperience || 0;
//       } else if (sortConfig.key === 'Email') {
//         av = (a.Email || '').toLowerCase();
//         bv = (b.Email || '').toLowerCase();
//       } else if (sortConfig.key === 'FirstName') {
//         av = formatFullName(a.FirstName, a.MiddleName, a.LastName).toLowerCase();
//         bv = formatFullName(b.FirstName, b.MiddleName, b.LastName).toLowerCase();
//       } else {
//         av = String(a[sortConfig.key] || '').toLowerCase();
//         bv = String(b[sortConfig.key] || '').toLowerCase();
//       }
//       if (av < bv) return sortConfig.direction === 'asc' ? -1 : 1;
//       if (av > bv) return sortConfig.direction === 'asc' ? 1 : -1;
//       return 0;
//     });

//     return result;
//   }, [candidates, searchTerm, statusFilter, advancedFilters, sortConfig, aiSearchResults, matchesRow, currentView, sidebarFilters, visibleSidebarFilters, useAiSearch]);

//   const totalPages = Math.ceil(filteredCandidates.length / itemsPerPage);
//   const paginatedCandidates = filteredCandidates.slice(
//     (currentPage - 1) * itemsPerPage,
//     currentPage * itemsPerPage
//   );

//   const handleResetFilters = () => {
//     setSearchTerm('');
//     setAiSearchResults(null);
//     setAdvancedFilters({ rows: [], logic: 'AND' });
//     setSortConfig({ key: 'CreatedDt', direction: 'desc' });
//     setStatusFilter('all');
//     setSidebarFilters({
//       search: '',
//       status: [],
//       workType: [],
//       experience: 'all',
//       country: '',
//       state: '',
//       city: '',
//       sources: [],
//       employmentTypes: [],
//       industries: [],
//       isBench: 'all',
//       personType: 'all',
//       gender: [],
//       relocate: 'all',
//       workAuth: []
//     });
//   };

//   const handleApplyFilters = (filters) => {
//     setAdvancedFilters(filters);
//     setCurrentPage(1);
//   };

//   const requestSort = (key) => {
//     setSortConfig(prev => ({
//       key,
//       direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
//     }));
//     setCurrentPage(1);
//   };

//   const editCandidate = (candidate) => {
//     setEditingCandidate(candidate);
//     setParsedResumeData(null);
//     setShowAddModal(true);
//   };

//   const getFullCandidate = async (id) => {
//     const response = await fetch(`${BASE_URL}/api/resumes/${id}`, {
//       headers: getAuthHeaders(),
//     });
//     if (!response.ok) throw new Error('Failed to fetch details');
//     const data = await response.json();
//     return transformCandidate(data);
//   };

//   const deleteCandidate = async (id) => {
//     const candidate = candidates.find(c => c.CandidateId === id);
//     const name = formatFullName(candidate?.FirstName, candidate?.MiddleName, candidate?.LastName);

//     const confirm = await Swal.fire({
//       title: 'Delete Candidate?',
//       text: `This will permanently delete ${name}'s record.`,
//       icon: 'warning',
//       showCancelButton: true,
//       confirmButtonColor: '#ef4444',
//       cancelButtonColor: '#6b7280',
//       confirmButtonText: 'Yes, delete',
//     });

//     if (confirm.isConfirmed) {
//       try {
//         const response = await fetch(`${BASE_URL}/api/resumes/${id}`, {
//           method: 'DELETE',
//           headers: getAuthHeaders(),
//         });
//         if (!response.ok) throw new Error('Failed to delete candidate');
//         setCandidates(prev => prev.filter(c => c.CandidateId !== id));
//         Swal.fire({ title: 'Deleted!', text: `${name} has been removed.`, icon: 'success', timer: 1800, showConfirmButton: false });
//       } catch (error) {
//         console.error('Error deleting candidate:', error);
//         Swal.fire({ title: 'Error', text: 'Failed to delete candidate', icon: 'error' });
//       }
//     }
//   };

//   // ── Parse Resume Flow ──────────────────────────────────────────────────
//   const handleParseFileSelect = (e) => {
//     const file = e.target.files?.[0];
//     if (!file) return;
//     e.target.value = '';
//     setPendingParseFile(file);
//     setShowConfirmParse(true);
//   };

//   const handleConfirmParse = async () => {
//     if (!pendingParseFile) return;
//     setShowConfirmParse(false);
//     setShowParsingLoading(true);
//     setParsingFromToolbar(true);

//     try {
//       const formData = new FormData();
//       formData.append('file1', pendingParseFile);

//       const response = await fetch(`${BASE_URL}/api/resumes/parse`, {
//         method: 'POST',
//         headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
//         body: formData
//       });
//       if (!response.ok) throw new Error('Failed to parse resume');

//       const data = await response.json();
//       const parsed = {
//         FirstName: formatName(data.firstName || ''),
//         LastName: formatName(data.lastName || ''),
//         MiddleName: formatName(data.middleName || ''),
//         Email: data.email || '',
//         Phone: data.phone || '',
//         Mobile: data.mobile || '',
//         TwitterUrl: data.twitterUrl || '',
//         VideoResumeUrl: data.videoResumeUrl || '',
//         JobTitle: formatJobTitle(data.jobTitle || ''),
//         YearsOfExperience: data.yearsOfExperience ? parseFloat(data.yearsOfExperience) : '',
//         ProfileSummary: data.profileSummary || '',
//         LinkedInUrl: data.linkedInUrl || '',
//         GitHubUrl: data.gitHubUrl || '',
//         Gender: data.gender || '',
//         CurrentLocation: data.currentLocation || '',
//         cityName: data.cityName || '',
//         stateName: data.stateName || '',
//         countryIso2: data.countryIso2 || '',
//         countryName: data.countryName || '',
//         WorkAuthorization: data.workAuthorization || '',
//         EmploymentType: data.employmentType || '',
//         skills: (data.skills || []).map(s => ({ SkillName: typeof s === 'string' ? s : s.skill_name || '', SkillType: 'HARD' })),
//         workExperience: (data.workExperience || []).map(exp => ({
//           Company: exp.company || '',
//           JobTitle: formatJobTitle(exp.jobTitle || ''),
//           StartDate: exp.startDate || '', EndDate: exp.endDate || '',
//           IsCurrent: exp.isCurrent || false, Description: exp.description || '',
//         })),
//         education: (data.education || []).map(edu => ({
//           Institution: formatName(edu.institution || ''),
//           Degree: formatName(edu.degree || ''),
//           FieldOfStudy: edu.fieldOfStudy || '', StartDate: edu.startDate || '',
//           EndDate: edu.endDate || '', GPA: edu.gpa || '',
//         })),
//         certifications: (data.certifications || []).map(cert => ({
//           CertificationName: formatName(cert.name || ''),
//           IssuingOrganization: cert.issuingOrg || '',
//           IssueDate: cert.issueDate || '', ExpiryDate: cert.expiryDate || '',
//           CredentialId: cert.credentialId || '', CredentialUrl: cert.credentialUrl || '',
//         })),
//         ResumeFile: pendingParseFile,
//         RawPayloadJson: JSON.stringify(data),
//         ParseStatus: data.parseStatus || data.parse_status || 'SUCCESS',
//         ParsedText: data.parsedText || data.parsed_text || '',
//         ParserVendor: data.vendor || 'llama-3.1-8b-instant',
//         ExtractedEmail: data.email || data.extracted_email || '',
//         ExtractedPhone: data.phone || data.mobile || data.extracted_phone || '',
//       };

//       const dup = candidates.find(c =>
//         (parsed.Email && c.Contact?.Email?.toLowerCase() === parsed.Email.toLowerCase()) ||
//         (parsed.LinkedInUrl && c.LinkedInUrl?.toLowerCase() === parsed.LinkedInUrl.toLowerCase())
//       );

//       setShowParsingLoading(false);

//       if (dup) {
//         setParsedResumeData(parsed);
//         setDuplicateCandidate(dup);
//         setShowDuplicateModal(true);
//       } else {
//         setParsedResumeData(parsed);
//         setEditingCandidate(null);
//         setShowAddModal(true);
//       }

//     } catch (error) {
//       console.error('Error parsing resume:', error);
//       setShowParsingLoading(false);
//       Swal.fire({ title: 'Error', text: 'Failed to parse resume. Please try again or add candidate manually.', icon: 'error' });
//     } finally {
//       setParsingFromToolbar(false);
//       setPendingParseFile(null);
//     }
//   };

//   const handleDuplicateAction = async (action) => {
//     setShowDuplicateModal(false);

//     if (action === 'cancel') {
//       setParsedResumeData(null);
//       setDuplicateCandidate(null);
//       return;
//     }

//     let fullDuplicateCandidate = duplicateCandidate;
//     try {
//       Swal.fire({ title: 'Loading...', text: 'Fetching candidate details', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
//       const response = await fetch(`${BASE_URL}/api/resumes/${duplicateCandidate.CandidateId}`, { headers: getAuthHeaders() });
//       if (response.ok) {
//         const data = await response.json();
//         fullDuplicateCandidate = transformCandidate(data);
//       }
//       Swal.close();
//     } catch (e) {
//       console.error('Error fetching duplicate candidate full details:', e);
//       Swal.close();
//     }

//     if (action === 'add_resume') {
//       setParsedResumeData({ ResumeFile: parsedResumeData.ResumeFile });
//       setEditingCandidate(fullDuplicateCandidate);
//       setShowAddModal(true);
//     }
//     else if (action === 'overwrite') {
//       setEditingCandidate({
//         CandidateId: fullDuplicateCandidate.CandidateId,
//         Document: fullDuplicateCandidate.Document,
//         Contact: { Email: fullDuplicateCandidate.Contact?.Email }
//       });
//       setShowAddModal(true);
//     }
//     else if (action === 'append') {
//       const synthCandidate = { ...fullDuplicateCandidate };

//       for (const [key, value] of Object.entries(parsedResumeData)) {
//         if (typeof value === 'string' && value.trim() !== '') {
//           synthCandidate[key] = value;
//         } else if (typeof value === 'number') {
//           synthCandidate[key] = value;
//         }
//       }

//       const appendedSkills = [...(fullDuplicateCandidate.Skills || [])];
//       (parsedResumeData.skills || []).forEach(s => appendedSkills.push({ ...s }));
//       synthCandidate.Skills = appendedSkills;

//       synthCandidate.WorkExperience = [...(fullDuplicateCandidate.WorkExperience || []), ...(parsedResumeData.workExperience || [])];
//       synthCandidate.Education = [...(fullDuplicateCandidate.Education || []), ...(parsedResumeData.education || [])];
//       synthCandidate.Certifications = [...(fullDuplicateCandidate.Certifications || []), ...(parsedResumeData.certifications || [])];

//       setParsedResumeData({ ResumeFile: parsedResumeData.ResumeFile });
//       setEditingCandidate(synthCandidate);
//       setShowAddModal(true);
//     }
//   };

//   // ── Resume upload / extract ──
//   const handleResumeUpload = async (file) => {
//     try {
//       setUploadingResume(true);
//       const formData = new FormData();
//       formData.append('file1', file);

//       const response = await fetch(`${BASE_URL}/api/resumes/parse`, {
//         method: 'POST',
//         headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
//         body: formData
//       });
//       if (!response.ok) throw new Error('Failed to parse resume');

//       const data = await response.json();
//       return {
//         FirstName: formatName(data.firstName || ''),
//         LastName: formatName(data.lastName || ''),
//         MiddleName: formatName(data.middleName || ''),
//         Email: data.email || '',
//         Phone: data.phone || '',
//         Mobile: data.mobile || '',
//         TwitterUrl: data.twitterUrl || '',
//         VideoResumeUrl: data.videoResumeUrl || '',
//         JobTitle: formatJobTitle(data.jobTitle || ''),
//         YearsOfExperience: data.yearsOfExperience ? parseFloat(data.yearsOfExperience) : '',
//         ProfileSummary: data.profileSummary || '',
//         LinkedInUrl: data.linkedInUrl || '',
//         GitHubUrl: data.gitHubUrl || '',
//         Gender: data.gender || '',
//         CurrentLocation: data.currentLocation || '',
//         cityName: data.cityName || '',
//         stateName: data.stateName || '',
//         countryIso2: data.countryIso2 || '',
//         countryName: data.countryName || '',
//         WorkAuthorization: data.workAuthorization || '',
//         EmploymentType: data.employmentType || '',
//         Skills: (data.skills || []).map(s => ({ SkillName: typeof s === 'string' ? s : s.skill_name || '', SkillType: 'HARD' })),
//         WorkExperience: (data.workExperience || []).map(exp => ({
//           Company: exp.company || '',
//           JobTitle: formatJobTitle(exp.jobTitle || ''),
//           StartDate: exp.startDate || '',
//           EndDate: exp.endDate || '',
//           IsCurrent: exp.isCurrent || false,
//           Description: exp.description || '',
//         })),
//         Education: (data.education || []).map(edu => ({
//           Institution: formatName(edu.institution || ''),
//           Degree: formatName(edu.degree || ''),
//           FieldOfStudy: edu.fieldOfStudy || '',
//           StartDate: edu.startDate || '',
//           EndDate: edu.endDate || '',
//           GPA: edu.gpa || '',
//         })),
//         Certifications: (data.certifications || []).map(cert => ({
//           CertificationName: formatName(cert.name || ''),
//           IssuingOrganization: cert.issuingOrg || '',
//           IssueDate: cert.issueDate || '',
//           ExpiryDate: cert.expiryDate || '',
//           CredentialId: cert.credentialId || '',
//           CredentialUrl: cert.credentialUrl || '',
//         })),
//         RawPayloadJson: JSON.stringify(data),
//         ParseStatus: data.parseStatus || data.parse_status || 'SUCCESS',
//         ParsedText: data.parsedText || data.parsed_text || '',
//         ParserVendor: data.vendor || 'llama-3.1-8b-instant',
//         ExtractedEmail: data.email || data.extracted_email || '',
//         ExtractedPhone: data.phone || data.mobile || data.extracted_phone || '',
//       };
//     } catch (error) {
//       console.error('Error parsing resume:', error);
//       Swal.fire({ title: 'Error', text: 'Failed to parse resume. Please fill the form manually.', icon: 'error' });
//       return null;
//     } finally {
//       setUploadingResume(false);
//     }
//   };

//   // ── Save candidate ──
//   const handleSaveCandidate = async (data) => {
//     try {
//       setUploadingResume(true);

//       if (data.currentLocation && data.currentLocation.trim()) {
//         const parts = data.currentLocation.split(',').map(s => s.trim()).filter(Boolean);
//         console.log(`📍 Location being saved: "${data.currentLocation}" (${parts.length} parts)`);
//       }

//       const isEditing = !!(editingCandidate?.CandidateId || data.candidateId);
//       const candidateId = editingCandidate?.CandidateId || data.candidateId;

//       const formData = new FormData();

//       const firstName = formatName(data.firstName || data.FirstName || '');
//       const lastName = formatName(data.lastName || data.LastName || '');
//       const middleName = formatName(data.middleName || data.MiddleName || '');
//       const jobTitle = formatJobTitle(data.jobTitle || data.JobTitle || '');

//       formData.append('FirstName', firstName);
//       formData.append('LastName', lastName);
//       formData.append('MiddleName', middleName);
//       formData.append('EmailID', (data.email || data.Email || '').trim());
//       formData.append('Phone', (data.phone || data.Phone || '').trim());
//       formData.append('Mobile', (data.mobile || data.Mobile || '').trim());
//       formData.append('JobTitle', jobTitle);
//       formData.append('YearsOfExperience', data.yearsOfExperience ?? data.YearsOfExperience ?? '');
//       formData.append('Gender', (data.gender || data.Gender || '').trim());
//       formData.append('ProfileSummary', (data.profileSummary || data.ProfileSummary || '').trim());
//       formData.append('LinkedInProfile', (data.linkedInUrl || data.LinkedInUrl || '').trim());
//       formData.append('GitHubUrl', (data.gitHubUrl || data.GitHubUrl || '').trim());
//       formData.append('TwitterUrl', (data.twitterUrl || data.TwitterUrl || '').trim());
//       formData.append('VideoResumeUrl', (data.videoResumeUrl || data.VideoResumeUrl || '').trim());
//       formData.append('CandidateStatus', data.candidateStatus || data.CandidateStatus || 'Available');
//       formData.append('RemoteStatus', data.remoteStatus || data.RemoteStatus || 'OnSite');
//       formData.append('CurrentLocation', (data.currentLocation || data.CurrentLocation || '').trim());

//       formData.append('WorkAuthorization', data.workAuthorization || data.WorkAuthorization || '');
//       formData.append('EmploymentType', data.employmentType || data.EmploymentType || '');
//       formData.append('SecurityClearance', data.securityClearance || data.SecurityClearance || '');
//       formData.append('WillingToRelocate', data.willingToRelocate ? 'true' : 'false');
//       formData.append('IsBench', data.isBench ? 'true' : 'false');
//       formData.append('ExpectedRateFrom', data.expectedRateFrom || data.ExpectedRateFrom || '');
//       formData.append('ExpectedRateTo', data.expectedRateTo || data.ExpectedRateTo || '');
//       formData.append('ExpectedRateType', data.expectedRateType || data.ExpectedRateType || 'Hourly');
//       formData.append('CurrentRate', data.currentRate || data.CurrentRate || '');
//       formData.append('CurrentRateType', data.currentRateType || data.CurrentRateType || 'Hourly');
//       formData.append('MaritalStatus', data.maritalStatus || data.MaritalStatus || '');
//       formData.append('Industry', data.industry || data.Industry || '');

//       const skillsList = (data.skills || data.Skills || []).map(s =>
//         typeof s === 'string' ? s : (s.SkillName || s.skillName || '')
//       ).filter(Boolean);
//       formData.append('Skills', JSON.stringify(skillsList));

//       const workList = (data.workExperience || data.WorkExperience || [])
//         .filter(w => (w.company || w.Company || '').trim() || (w.jobTitle || w.JobTitle || '').trim())
//         .map(exp => ({
//           Company: (exp.company || exp.Company || '').trim(),
//           JobTitle: formatJobTitle(exp.jobTitle || exp.JobTitle || ''),
//           StartDate: exp.startDate || exp.StartDate || '',
//           EndDate: exp.endDate || exp.EndDate || '',
//           IsCurrent: exp.isCurrent ?? exp.IsCurrent ?? false,
//           Description: (exp.description || exp.Description || '').trim(),
//         }));
//       formData.append('WorkExperience', JSON.stringify(workList));

//       const eduList = (data.education || data.Education || [])
//         .filter(e => (e.institution || e.Institution || '').trim() || (e.degree || e.Degree || '').trim())
//         .map(edu => ({
//           Institution: formatName(edu.institution || edu.Institution || ''),
//           Degree: formatName(edu.degree || edu.Degree || ''),
//           FieldOfStudy: (edu.fieldOfStudy || edu.FieldOfStudy || '').trim(),
//           StartDate: edu.startDate || edu.StartDate || '',
//           EndDate: edu.endDate || edu.EndDate || '',
//           GPA: (edu.gpa || edu.GPA || '').trim(),
//         }));
//       formData.append('Education', JSON.stringify(eduList));

//       const certList = (data.certifications || data.Certifications || [])
//         .filter(c => (c.name || c.CertificationName || '').trim())
//         .map(cert => ({
//           CertificationName: formatName(cert.name || cert.CertificationName || ''),
//           IssuingOrganization: (cert.issuingOrg || cert.IssuingOrganization || '').trim(),
//           IssueDate: cert.issueDate || cert.IssueDate || '',
//           ExpiryDate: cert.expiryDate || cert.ExpiryDate || '',
//           CredentialId: (cert.credentialId || cert.CredentialId || '').trim(),
//           CredentialUrl: (cert.credentialUrl || cert.CredentialUrl || '').trim(),
//         }));
//       formData.append('Certifications', JSON.stringify(certList));

//       if (data.ResumeFile) {
//         formData.append('ResumeUpload', data.ResumeFile);
//       }

//       if (data.RawPayloadJson) formData.append('RawPayloadJson', data.RawPayloadJson);
//       if (data.ParseStatus) formData.append('ParseStatus', data.ParseStatus);
//       if (data.ParsedText) formData.append('ParsedText', data.ParsedText);
//       if (data.ParserVendor) formData.append('ParserVendor', data.ParserVendor);
//       if (data.ExtractedEmail) formData.append('ExtractedEmail', data.ExtractedEmail);
//       if (data.ExtractedPhone) formData.append('ExtractedPhone', data.ExtractedPhone);

//       const additionalDocs = (data.documents || []).filter(d => d.file instanceof File);
//       let docIndex = 0;
//       for (const doc of additionalDocs) {
//         formData.append(`AdditionalDoc_${docIndex}`, doc.file);
//         formData.append(`AdditionalDoc_${docIndex}_Name`, doc.documentName || doc.file.name);
//         formData.append(`AdditionalDoc_${docIndex}_Type`, doc.documentType || 'Certificate');
//         docIndex++;
//       }
//       formData.append('AdditionalDocsCount', String(docIndex));

//       const url = isEditing
//         ? `${BASE_URL}/api/resumes/${candidateId}`
//         : `${BASE_URL}/api/resumes`;

//       const response = await fetch(url, {
//         method: isEditing ? 'PUT' : 'POST',
//         headers: getAuthHeaders(),
//         body: formData,
//       });

//       if (!response.ok) {
//         const errorData = await response.json().catch(() => ({}));
//         throw new Error(errorData.error || errorData.detail || 'Failed to save candidate');
//       }

//       _cachedCandidates = null;
//       await fetchCandidates(true);
//       setShowAddModal(false);
//       setEditingCandidate(null);
//       setParsedResumeData(null);
//       Swal.fire({ title: 'Success!', text: 'Candidate saved successfully.', icon: 'success', timer: 1800, showConfirmButton: false });

//     } catch (error) {
//       console.error('Error saving candidate:', error);
//       Swal.fire({ title: 'Error', text: error.message || 'Failed to save candidate', icon: 'error' });
//     } finally {
//       setUploadingResume(false);
//     }
//   };

//   const exportToExcel = () => {
//     setExporting(true);
//     const data = filteredCandidates.map(c => ({
//       'Candidate Code': c.CandidateCode,
//       'First Name': c.FirstName,
//       'Last Name': c.LastName,
//       'Middle Name': c.MiddleName || '',
//       'Job Title': c.JobTitle,
//       'Email': c.Contact?.Email || '',
//       'Phone': c.Contact?.Phone || '',
//       'Mobile': c.Mobile || '',
//       'Twitter URL': c.TwitterUrl || '',
//       'Video Resume URL': c.VideoResumeUrl || '',
//       'Years of Experience': c.YearsOfExperience,
//       'Gender': c.Gender,
//       'Candidate Status': c.CandidateStatus,
//       'Remote Status': c.RemoteStatus,
//       'Work Authorization': c.WorkAuthorization || '',
//       'Employment Type': c.EmploymentType || '',
//       'Security Clearance': c.SecurityClearance || '',
//       'Willing to Relocate': c.WillingToRelocate ? 'Yes' : 'No',
//       'Expected Rate From': c.ExpectedRateFrom || '',
//       'Expected Rate To': c.ExpectedRateTo || '',
//       'Expected Rate Type': c.ExpectedRateType || '',
//       'Current Rate': c.CurrentRate || '',
//       'Current Rate Type': c.CurrentRateType || '',
//       'Marital Status': c.MaritalStatus || '',
//       'Industry': c.Industry || '',
//       'LinkedIn': c.LinkedInUrl || '',
//       'GitHub': c.GitHubUrl || '',
//       'Location': c.CurrentLocation || '',
//       'Profile Summary': c.ProfileSummary || '',
//       'Skills': (c.Skills || []).map(s => s.SkillName || s).join(', '),
//       'Resume File': c.Document?.FileNameOriginal || '',
//       'Created Date': formatDate(c.CreatedDt),
//     }));
//     const ws = XLSX.utils.json_to_sheet(data);
//     const wb = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(wb, ws, 'Candidates');
//     XLSX.writeFile(wb, `candidates_${new Date().toISOString().split('T')[0]}.xlsx`);
//     setExporting(false);
//     Swal.fire({ title: 'Exported!', text: `${data.length} candidates exported.`, icon: 'success', timer: 1800, showConfirmButton: false });
//   };

//   if (loading) {
//     return (
//       <div className="cm-loading-container">
//         <div className="cm-loading-spinner"></div>
//         <p className="cm-loading-text">Loading candidates...</p>
//       </div>
//     );
//   }

//   return (
//     <div className="cm-dashboard" style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: '24px' }}>
//       {/* Header Area */}
//       <div style={{ padding: '16px 32px 12px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
//         <div>
//           <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#111827', margin: 0, lineHeight: 1.2 }}>
//             {currentView === 'sourcing' ? 'Sourcing' :
//               currentView === 'bench' ? 'Bench Candidates' :
//                 currentView === 'review' ? 'Need To Review' :
//                   'Candidates'}
//           </h1>
//           <p style={{ color: '#6b7280', fontSize: '14px', margin: '4px 0 0 0' }}>
//             {currentView === 'sourcing' ? 'Explore active sourcing candidates' :
//               currentView === 'bench' ? 'Manage bench candidates' :
//                 currentView === 'review' ? 'Review candidates with missing information' :
//                   'Manage and explore your candidate database'}
//           </p>
//         </div>

//         <div className="cm-toolbar-actions" style={{ flexWrap: 'wrap', borderBottom: 'none' }}>
//           {selectedCandidateIds.length > 0 && (
//             <button
//               className="cm-btn cm-btn-primary"
//               style={{ backgroundColor: '#0d9488', borderColor: '#0d9488', marginRight: '8px' }}
//               onClick={() => {
//                 const selectedCands = candidates.filter(c => selectedCandidateIds.includes(c.CandidateId));
//                 setShareModalCandidates(selectedCands);
//                 setShowShareModal(true);
//               }}
//             >
//               <Share2 size={16} /> Share Bulk Profile
//             </button>
//           )}

//           <button className="cm-btn cm-btn-primary" style={{ backgroundColor: '#0d9488', borderColor: '#0d9488' }} onClick={() => { setEditingCandidate(null); setParsedResumeData(null); setShowAddModal(true); }}>
//             <Plus size={16} /> Add Candidate
//           </button>
//           <button
//             className="cm-btn cm-btn-outline"
//             onClick={() => parseFileInputRef.current?.click()}
//             disabled={parsingFromToolbar}
//           >
//             {parsingFromToolbar
//               ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Parsing...</>
//               : <><Upload size={16} /> Parse Resume</>}
//           </button>
//           <input
//             ref={parseFileInputRef}
//             type="file"
//             accept=".pdf,.doc,.docx,.txt"
//             style={{ display: 'none' }}
//             onChange={handleParseFileSelect}
//           />
//           <button className="cm-btn cm-btn-outline" onClick={exportToExcel} disabled={exporting}>
//             <Download size={16} /> {exporting ? 'Exporting...' : 'Export'}
//           </button>

//           <button className="cm-btn cm-btn-outline" title="Manage Columns" onClick={() => setShowColumnSidebar(true)} style={{ padding: '0 10px' }}>
//             <SlidersHorizontal size={16} />
//           </button>

//           <button
//             className={`cm-btn cm-btn-outline ${showFilterSidebar ? 'cm-btn-icon--active' : ''}`}
//             title={showFilterSidebar ? "Close Sidebar" : "Open Sidebar"}
//             onClick={() => setShowFilterSidebar(prev => !prev)}
//             style={{ padding: '0 10px' }}
//           >
//             {showFilterSidebar ? <Filter size={16} />: <Filter size={16} />}
//           </button>

//           {/* <button
//             className={`cm-btn cm-btn-outline ${advancedFilters.rows.filter(r => r.field && r.condition).length > 0 ? 'cm-btn-icon--active' : ''}`}
//             title="Filters"
//             onClick={() => setShowFilterModal(true)}
//             style={{
//               padding: '0 10px', ...(advancedFilters.rows.filter(r => r.field && r.condition).length > 0 ? {
//                 background: '#f0fdf4', border: '1px solid #14b8a6', color: '#0d9488'
//               } : {})
//             }}
//           >
//             <Filter size={16} />
//             {advancedFilters.rows.filter(r => r.field && r.condition).length > 0 && (
//               <span style={{
//                 position: 'absolute', top: -4, right: -4,
//                 width: 16, height: 16, borderRadius: '50%',
//                 background: '#0d9488', color: '#fff',
//                 fontSize: 9, fontWeight: 800,
//                 display: 'flex', alignItems: 'center', justifyContent: 'center',
//               }}>
//                 {advancedFilters.rows.filter(r => r.field && r.condition).length}
//               </span>
//             )}
//           </button> */}

//           <button
//             className={`cm-ask-ai-btn ${showAiSidebar ? 'cm-ask-ai-btn--active' : ''}`}
//             title="Ask AI"
//             onClick={() => setShowAiSidebar(prev => !prev)}
//             style={{ marginLeft: '4px' }}
//           >
//             <Sparkles size={15} />
//             Ask AI
//           </button>
//         </div>
//       </div>

//       {/* Search & Saved Filters Area */}
//       <div style={{ margin: '0 32px 12px 32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

//         {/* Top Row: Search Input */}
//         <div
//           className="cm-modern-search-bar"
//           style={{
//             display: 'flex', alignItems: 'center',
//             border: '1px solid #e2e8f0', borderRadius: '8px',
//             padding: '4px 8px 4px 16px', height: '40px',
//             transition: 'all 0.2s ease', background: '#fff',
//             boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
//           }}
//           onFocus={(e) => { e.currentTarget.style.borderColor = '#0d9488'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(13, 148, 136, 0.15)'; }}
//           onBlur={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.02)'; }}
//         >
//           <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginRight: '10px', flexShrink: 0 }}>
//             <Search
//               size={17}
//               color={useAiSearch ? "#229C8B" : "#64748b"}
//               className={isAiSearching ? "cm-pulse" : ""}
//               style={{ cursor: 'pointer' }}
//               onClick={() => {
//                 if (useAiSearch) {
//                   handleAiSearch(searchTerm);
//                 } else {
//                   setAiSearchResults(null);
//                   setCurrentPage(1);
//                 }
//               }}
//               title={useAiSearch ? "Search with AI" : "Search by keyword"}
//             />
//             <Sparkles
//               size={8}
//               color="#229C8B"
//               style={{
//                 position: 'absolute', top: -3, right: -4,
//                 animation: 'cm-spin 4s linear infinite',
//                 opacity: 0.8
//               }}
//             />
//           </div>
//           <input
//             className="cm-search-input-modern"
//             placeholder={useAiSearch ? "Ask AI for semantic search..." : "Search by keyword..."}
//             value={searchTerm}
//             onChange={e => {
//               const val = e.target.value;
//               setSearchTerm(val);
//               if (!useAiSearch) {
//                 if (!val) setAiSearchResults(null);
//                 setCurrentPage(1);
//               }
//             }}
//             onKeyDown={e => {
//               if (e.key === 'Enter') {
//                 if (useAiSearch) {
//                   // Manual trigger if user hits enter early
//                   handleAiSearch(searchTerm);
//                 } else {
//                   setAiSearchResults(null);
//                   setCurrentPage(1);
//                 }
//               }
//             }}
//             style={{
//               border: 'none', outline: 'none', background: 'transparent',
//               flex: 1, fontSize: '14px', color: '#0f172a', height: '100%',
//               fontFamily: 'inherit'
//             }}
//           />
//           {isAiSearching && (
//             <div style={{ marginRight: '10px', display: 'flex', alignItems: 'center' }}>
//               <Loader size={14} style={{ animation: 'cm-spin 1s linear infinite', color: '#229C8B' }} />
//             </div>
//           )}
//           <div style={{ width: '1px', height: '20px', background: '#e2e8f0', margin: '0 8px' }}></div>
//           <button
//             onClick={() => {
//               const next = !useAiSearch;
//               setUseAiSearch(next);
//               if (!next) setAiSearchResults(null);
//             }}
//             style={{
//               display: 'flex', alignItems: 'center', gap: '6px',
//               padding: '4px 12px', border: useAiSearch ? '1px solid #14b8a6' : '1px solid #e2e8f0',
//               borderRadius: '20px', background: useAiSearch ? '#f0fdfa' : '#fff',
//               color: useAiSearch ? '#0d9488' : '#64748b', fontSize: '12px',
//               fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s ease',
//               marginRight: '8px'
//             }}
//           >
//             <Sparkles size={13} color={useAiSearch ? "#14b8a6" : "#94a3b8"} fill={useAiSearch ? "#14b8a6" : "none"} />
//             AI Search: {useAiSearch ? 'ON' : 'OFF'}
//           </button>
//           <button
//             onClick={handleSaveSearch}
//             className="cm-btn"
//             style={{
//               height: '28px', background: '#f8fafc', color: '#475569',
//               border: '1px solid transparent', borderRadius: '6px',
//               padding: '0 12px', fontWeight: 500, display: 'flex',
//               gap: '6px', alignItems: 'center', transition: 'all 0.2s',
//               flexShrink: 0, fontSize: '12.5px'
//             }}
//             onMouseOver={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#0f172a'; }}
//             onMouseOut={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#475569'; }}
//           >
//             <Bookmark size={14} /> Save
//           </button>
//         </div>

//         {/* Bottom Area: Saved Searches */}
//         <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
//           <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', scrollbarWidth: 'none', flexShrink: 1, paddingBottom: '2px' }}>
//             {savedSearches.map((s) => {
//               const isActive = s.term === searchTerm && s.status === statusFilter;
//               return (
//                 <button
//                   key={s.id}
//                   onClick={() => handleLoadSearch(s)}
//                   style={{
//                     fontSize: '12.5px',
//                     padding: '0 8px 0 10px',
//                     height: '26px',
//                     borderRadius: '6px',
//                     border: '1px solid transparent',
//                     background: isActive ? '#0d9488' : '#f1f5f9',
//                     color: isActive ? '#fff' : '#475569',
//                     cursor: 'pointer',
//                     display: 'flex',
//                     alignItems: 'center',
//                     gap: '6px',
//                     whiteSpace: 'nowrap',
//                     transition: 'all 0.2s ease',
//                     fontWeight: isActive ? 500 : 400,
//                     flexShrink: 0
//                   }}
//                   title={`Load search: ${s.term || 'All'} in ${s.status}`}
//                   onMouseOver={(e) => { if (!isActive) { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#0f172a'; } }}
//                   onMouseOut={(e) => { if (!isActive) { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#475569'; } }}
//                 >
//                   <span>{s.term || 'All'} {s.status !== 'all' ? `(${s.status})` : ''}</span>
//                   <span
//                     onClick={(e) => { e.stopPropagation(); removeSavedSearch(s.id); }}
//                     style={{
//                       display: 'flex', alignItems: 'center', justifyContent: 'center',
//                       width: '18px', height: '18px', borderRadius: '4px', transition: 'all 0.2s',
//                       color: isActive ? '#fff' : '#94a3b8'
//                     }}
//                     onMouseOver={(e) => { e.currentTarget.style.background = isActive ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.05)'; e.currentTarget.style.color = isActive ? '#fff' : '#0f172a'; }}
//                     onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = isActive ? '#fff' : '#94a3b8'; }}
//                   >
//                     <X size={13} />
//                   </span>
//                 </button>
//               );
//             })}
//           </div>

//           {savedSearches.length > 0 && (
//             <button
//               onClick={() => { setSavedSearches([]); localStorage.removeItem('erp_saved_searches'); }}
//               style={{ marginLeft: 'auto', background: 'none', border: 'none', fontSize: '12px', color: '#cbd5e1', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', transition: 'color 0.2s', padding: 0 }}
//               onMouseOver={(e) => e.currentTarget.style.color = '#ef4444'}
//               onMouseOut={(e) => e.currentTarget.style.color = '#cbd5e1'}
//             >
//               Clear
//             </button>
//           )}
//         </div>
//       </div>

//       {/* Main Content Layout */}
//       <div style={{ display: 'flex', borderTop: '1px solid #e2e8f0', minHeight: 'calc(100vh - 180px)' }}>
//         {/* Left Sidebar Filter */}
//         {showFilterSidebar ? (
//           <CandidateFilterSidebar
//             totalCount={filteredCandidates.length}
//             overallTotal={candidates.length}
//             filters={sidebarFilters}
//             setFilters={setSidebarFilters}
//             onClearAll={handleResetFilters}
//             availableStatuses={availableStatuses}
//             availableWorkTypes={availableWorkTypes}
//             availableLocations={availableLocations}
//             availableSources={availableSources}
//             availableEmploymentTypes={availableEmploymentTypes}
//             availableIndustries={availableIndustries}
//             availableWorkAuths={availableWorkAuths}
//             availableGenders={availableGenders}
//             onClose={() => setShowFilterSidebar(false)}
//             visibleColumns={visibleSidebarFilters}
//             setVisibleColumns={setVisibleSidebarFilters}
//           />
//         ) : (
//           <div
//             className="cm-sidebar-reopen-strip"
//             onClick={() => setShowFilterSidebar(true)}
//             title="Open Filters"
//             style={{
//               width: '12px',
//               background: '#f1f5f9',
//               borderRight: '1px solid #e2e8f0',
//               cursor: 'pointer',
//               display: 'flex',
//               alignItems: 'center',
//               justifyContent: 'center',
//               transition: 'all 0.2s ease',
//               position: 'relative',
//               zIndex: 10
//             }}
//             onMouseOver={(e) => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.width = '20px'; }}
//             onMouseOut={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.width = '12px'; }}
//           >
//             <div style={{
//               transform: 'rotate(90deg)',
//               whiteSpace: 'nowrap',
//               fontSize: '10px',
//               fontWeight: 700,
//               color: '#64748b',
//               letterSpacing: '0.1em',
//               textTransform: 'uppercase'
//             }}>
//               Filters
//             </div>
//           </div>
//         )}

//         {/* Right Content Area */}
//         <div style={{ flex: 1, minWidth: 0, padding: '0 0 24px 0' }}>
//           {/* AI Search Active Indicator */}
//           {aiSearchResults && (
//             <div style={{
//               padding: '10px 32px',
//               display: 'flex',
//               alignItems: 'center',
//               gap: '10px',
//               background: '#f0fdfa',
//               borderBottom: '1px solid #ccfbf1',
//               animation: 'cm-slide-down 0.3s ease'
//             }}>
//               <Sparkles size={16} color="#0d9488" className="cm-pulse" />
//               <span style={{ fontSize: '13px', color: '#0d9488', fontWeight: 600 }}>
//                 AI-Powered Search Active
//               </span>
//               <span style={{ fontSize: '12.5px', color: '#475569' }}>
//                 — {aiSearchResults.length} candidates ranked by semantic relevance
//               </span>
//               <button
//                 onClick={() => { setAiSearchResults(null); setSearchTerm(''); }}
//                 style={{
//                   marginLeft: 'auto',
//                   background: '#fff',
//                   border: '1px solid #0d9488',
//                   color: '#0d9488',
//                   borderRadius: '6px',
//                   padding: '4px 12px',
//                   fontSize: '11.5px',
//                   fontWeight: 600,
//                   cursor: 'pointer',
//                   transition: 'all 0.2s',
//                   boxShadow: '0 1px 2px rgba(13, 148, 136, 0.1)'
//                 }}
//                 onMouseOver={(e) => { e.currentTarget.style.background = '#0d9488'; e.currentTarget.style.color = '#fff'; }}
//                 onMouseOut={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#0d9488'; }}
//               >
//                 Clear AI Search
//               </button>
//             </div>
//           )}

//           {/* Active Filters Indicator */}
//           {(advancedFilters.rows.filter(r => r.field && r.condition).length > 0 ||
//             (sidebarFilters.status || []).length > 0 ||
//             (sidebarFilters.workType || []).length > 0 ||
//             sidebarFilters.country ||
//             sidebarFilters.state ||
//             sidebarFilters.city ||
//             (sidebarFilters.sources || []).length > 0 ||
//             (sidebarFilters.experience && sidebarFilters.experience !== 'all') ||
//             (sidebarFilters.isBench && sidebarFilters.isBench !== 'all') ||
//             (sidebarFilters.gender || []).length > 0 ||
//             (sidebarFilters.workAuth || []).length > 0 ||
//             (sidebarFilters.relocate && sidebarFilters.relocate !== 'all')) && (
//               <div style={{
//                 display: 'flex', alignItems: 'center', gap: 12,
//                 padding: '10px 32px', background: '#f8fafc',
//                 borderBottom: '1px solid #e2e8f0', fontSize: 13,
//                 flexWrap: 'wrap'
//               }}>
//                 <span style={{ fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', gap: 4 }}>
//                   <Filter size={14} /> Active Filters:
//                 </span>

//                 <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
//                   {(sidebarFilters.status || []).map(s => (
//                     <span key={s} style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 500 }}>{s}</span>
//                   ))}
//                   {(sidebarFilters.workType || []).map(w => (
//                     <span key={w} style={{ background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 500 }}>{w}</span>
//                   ))}
//                   {sidebarFilters.country && (
//                     <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 500 }}>Country: {sidebarFilters.country}</span>
//                   )}
//                   {sidebarFilters.state && (
//                     <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 500 }}>State: {sidebarFilters.state}</span>
//                   )}
//                   {sidebarFilters.city && (
//                     <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 500 }}>City: {sidebarFilters.city}</span>
//                   )}
//                   {(sidebarFilters.workAuth || []).map(auth => (
//                     <span key={auth} style={{ background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 500 }}>Auth: {auth}</span>
//                   ))}
//                   {(sidebarFilters.employmentTypes || []).map(type => (
//                     <span key={type} style={{ background: '#ecfdf5', color: '#065f46', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 500 }}>{type}</span>
//                   ))}
//                   {(sidebarFilters.industries || []).map(ind => (
//                     <span key={ind} style={{ background: '#f8fafc', color: '#475569', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 500 }}>{ind}</span>
//                   ))}
//                   {sidebarFilters.experience && sidebarFilters.experience !== 'all' && (
//                     <span style={{ background: '#f3e8ff', color: '#6b21a8', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 500 }}>Exp: {sidebarFilters.experience}</span>
//                   )}
//                   {sidebarFilters.isBench && sidebarFilters.isBench !== 'all' && (
//                     <span style={{ background: '#ffedd5', color: '#9a3412', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 500 }}>{sidebarFilters.isBench === 'bench' ? 'Bench Only' : 'Non-Bench'}</span>
//                   )}
//                 </div>

//                 <button
//                   onClick={handleResetFilters}
//                   style={{
//                     marginLeft: 'auto', background: 'none', border: 'none',
//                     color: '#ef4444', fontSize: 12, fontWeight: 600, cursor: 'pointer',
//                     display: 'flex', alignItems: 'center', gap: 4
//                   }}
//                 >
//                   Clear All
//                 </button>
//               </div>
//             )}

//           {/* Table or AI Loading */}
//           {isAiSearching ? (
//             <div className="cm-ai-search-loading">
//               <div className="cm-ai-search-loading-icon-wrapper">
//                 <Sparkles size={48} color="#0d9488" fill="#0d9488" className="cm-ai-loading-sparkles" />
//               </div>
//               <h2 className="cm-ai-search-loading-title">AI Is analyzing your database...</h2>
//               <p className="cm-ai-search-loading-subtitle">Finding the best matches based on semantic relevance</p>
//               <div className="cm-ai-search-loading-progress-container">
//                 <div className="cm-ai-search-loading-progress-bar"></div>
//               </div>
//             </div>
//           ) : (
//             <CandidateTable
//               candidates={paginatedCandidates}
//               isAiSearching={isAiSearching}
//               visibleColumns={visibleColumns}
//               sortConfig={sortConfig}
//               onSort={requestSort}
//               onView={viewCandidate}
//               onEdit={editCandidate}
//               onShare={(candidate) => {
//                 setShareModalCandidates([candidate]);
//                 setShowShareModal(true);
//               }}
//               onSchedule={(candidate) => {
//                 setScheduleCandidate(candidate);
//                 setShowJobsModal(true);
//               }}
//               onSubmitProfile={(candidate) => {
//                 setSubmitCandidate(candidate);
//                 setShowSubmitModal(true);
//               }}
//               onDelete={deleteCandidate}
//               currentPage={currentPage}
//               totalPages={totalPages}
//               totalCount={filteredCandidates.length}
//               onPageChange={setCurrentPage}
//               itemsPerPage={itemsPerPage}
//               onItemsPerPageChange={(newVal) => {
//                 setItemsPerPage(newVal);
//                 setCurrentPage(1);
//               }}
//               selectedRows={selectedCandidateIds}
//               onSelectionChange={setSelectedCandidateIds}
//             />
//           )}
//         </div>
//       </div>

//       {/* Modals */}
//       <ShareResumeModal
//         isOpen={showShareModal}
//         onClose={() => { setShowShareModal(false); setShareModalCandidates([]); }}
//         candidates={shareModalCandidates}
//       />

//       <CandidateJobsModal
//         isOpen={showJobsModal}
//         onClose={() => { setShowJobsModal(false); setScheduleCandidate(null); }}
//         candidate={scheduleCandidate}
//         onSelectJob={(job) => {
//           setSelectedJobForInterview(job);
//           setShowJobsModal(false);
//           setShowScheduleModal(true);
//         }}
//       />

//       <ScheduleInterviewModal
//         isOpen={showScheduleModal}
//         onClose={() => { setShowScheduleModal(false); setScheduleCandidate(null); setSelectedJobForInterview(null); }}
//         candidate={scheduleCandidate}
//         job={selectedJobForInterview}
//       />

//       <SubmitProfileModal
//         isOpen={showSubmitModal}
//         onClose={() => { setShowSubmitModal(false); setSubmitCandidate(null); }}
//         candidate={submitCandidate}
//       />

//       {showAddModal && (
//         <AddModal
//           candidate={editingCandidate}
//           onClose={() => { setShowAddModal(false); setEditingCandidate(null); setParsedResumeData(null); }}
//           onSave={handleSaveCandidate}
//           onResumeUpload={handleResumeUpload}
//           uploading={uploadingResume}
//           parsedData={parsedResumeData}
//           fetchFullCandidateDetails={getFullCandidate}
//         />
//       )}

//       <FilterModal
//         isOpen={showFilterModal}
//         onClose={() => setShowFilterModal(false)}
//         onApply={handleApplyFilters}
//         initialFilters={advancedFilters}
//       />

//       <ConfirmParseModal
//         isOpen={showConfirmParse}
//         onConfirm={handleConfirmParse}
//         onCancel={() => { setShowConfirmParse(false); setPendingParseFile(null); }}
//       />

//       <ParsingLoadingModal
//         isOpen={showParsingLoading}
//       />

//       <DuplicateResumeModal
//         isOpen={showDuplicateModal}
//         duplicateCandidate={duplicateCandidate}
//         onProceed={handleDuplicateAction}
//         onCancel={() => handleDuplicateAction('cancel')}
//       />

//       <ColumnFilterSidebar
//         availableColumns={availableColumns}
//         selectedColumns={visibleColumns}
//         setSelectedColumns={setVisibleColumns}
//         availableFilters={availableSidebarFilters}
//         selectedFilters={visibleSidebarFilters}
//         setSelectedFilters={setVisibleSidebarFilters}
//         onClose={() => setShowColumnSidebar(false)}
//         isOpen={showColumnSidebar}
//       />

//       {showAiSidebar && (
//         <div className="cm-ai-overlay" onClick={() => setShowAiSidebar(false)} />
//       )}
//       <AskAiSidebar
//         isOpen={showAiSidebar}
//         onClose={() => setShowAiSidebar(false)}
//         candidates={candidates}
//       />
//     </div>
//   );
// };

// export default ResumeDashboard;