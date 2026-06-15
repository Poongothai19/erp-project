

// import React, { useState, useMemo, useEffect } from 'react';
// import '../styles/ApplicantsTable.css';
// import { Download, Search, Filter, Trash2, AlertCircle, Zap, ChevronDown } from 'lucide-react';
// import BASE_URL from '../../url';

// export default function ApplicantsTable({ applicants, onDelete, onRefresh }) {
//   const [searchTerm, setSearchTerm] = useState('');
//   const [filterPosition, setFilterPosition] = useState('All');
//   const [loading, setLoading] = useState(false);
//   const [localApplicants, setLocalApplicants] = useState(applicants || []);
//   const [error, setError] = useState('');
//   const [deleteConfirm, setDeleteConfirm] = useState(null);
//   const [scoringApplicant, setScoringApplicant] = useState(null);
//   const [scoreDetails, setScoreDetails] = useState({});
//   const [showScoreModal, setShowScoreModal] = useState(false);
//   const [jobDescriptionInput, setJobDescriptionInput] = useState('');
//   const [jobDescriptions, setJobDescriptions] = useState({});

//   useEffect(() => {
//     setLocalApplicants(applicants || []);
//   }, [applicants]);

//   // Fetch job description from RecruitmentRoles (using public endpoint)
//   const fetchJobDescription = async (jobId) => {
//     try {
//       console.log('📄 Fetching job description for Job ID:', jobId);
      
//       const response = await fetch(`${BASE_URL}/api/recruitment/public/roles`, {
//         method: 'GET',
//         headers: {
//           'Content-Type': 'application/json'
//         }
//       });

//       if (!response.ok) {
//         console.warn(`⚠️ Could not fetch recruitment roles`);
//         return null;
//       }

//       const allRoles = await response.json();
//       console.log('Fetched all roles:', allRoles.length);
      
//       // Find role by jobId (convert to string for comparison)
//       const foundRole = allRoles.find(role => {
//         console.log('Comparing:', role.jobId, 'with', jobId, 'Match:', role.jobId?.toString() === jobId?.toString());
//         return role.jobId?.toString() === jobId?.toString();
//       });
      
//       if (foundRole) {
//         const jd = foundRole.description || foundRole.jobDescription || '';
//         console.log('✅ Found job description for Job ID:', jobId);
        
//         if (jd) {
//           setJobDescriptions(prev => ({
//             ...prev,
//             [jobId]: jd
//           }));
//           return jd;
//         }
//       } else {
//         console.warn(`⚠️ Job ID ${jobId} not found in recruitment roles`);
//       }
      
//       return null;
//     } catch (err) {
//       console.error('Error fetching job description:', err);
//       return null;
//     }
//   };

//   const positions = ['All', ...new Set(localApplicants.map(a => a.position))];

//   const filteredApplicants = useMemo(() => {
//     return localApplicants.filter(applicant => {
//       const matchesSearch =
//         applicant.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         applicant.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         applicant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         applicant.phone.includes(searchTerm) ||
//         (applicant.job_id && applicant.job_id.toString().includes(searchTerm));

//       const matchesPosition =
//         filterPosition === 'All' || applicant.position === filterPosition;

//       return matchesSearch && matchesPosition;
//     });
//   }, [localApplicants, searchTerm, filterPosition]);

//   const handleDownload = async (applicantId, firstName, lastName) => {
//     try {
//       setLoading(true);

//       const response = await fetch(`${BASE_URL}/api/ats/download-resume/${applicantId}`, {
//         method: 'GET',
//         headers: {
//           'Content-Type': 'application/json'
//         }
//       });
      
//       if (!response.ok) {
//         throw new Error('Download failed');
//       }

//       const disposition = response.headers.get('content-disposition');
//       let filename = `${firstName}_${lastName}_resume.pdf`;
      
//       if (disposition) {
//         const filenameMatch = disposition.match(/filename="?([^"]+)"?/);
//         if (filenameMatch) {
//           filename = filenameMatch[1];
//         }
//       }

//       const blob = await response.blob();
//       const url = window.URL.createObjectURL(blob);
//       const link = document.createElement('a');
//       link.href = url;
//       link.download = filename;
//       document.body.appendChild(link);
//       link.click();
//       window.URL.revokeObjectURL(url);
//       document.body.removeChild(link);

//       console.log('✅ Downloaded');
//     } catch (err) {
//       setError('Download failed');
//       setTimeout(() => setError(''), 3000);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleDelete = async (applicantId) => {
//     try {
//       setLoading(true);

//       const response = await fetch(`${BASE_URL}/api/ats/${applicantId}`, {
//         method: 'DELETE',
//         headers: {
//           'Content-Type': 'application/json'
//         }
//       });

//       if (!response.ok) {
//         throw new Error('Delete failed');
//       }

//       setLocalApplicants(localApplicants.filter(a => a.id !== applicantId));
//       setDeleteConfirm(null);

//       if (onDelete) {
//         onDelete(applicantId);
//       }

//       console.log('✅ Deleted');
//     } catch (err) {
//       setError('Delete failed');
//       setTimeout(() => setError(''), 3000);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleScoreResume = async (applicantId, useJobId = false, jobId = null) => {
//     try {
//       let jobDesc = '';

//       if (useJobId && jobId) {
//         // Try to fetch from cache first
//         if (jobDescriptions[jobId]) {
//           jobDesc = jobDescriptions[jobId];
//         } else {
//           // Fetch from API
//           const fetchedDesc = await fetchJobDescription(jobId);
//           if (!fetchedDesc) {
//             setError('Could not fetch job description for this Job ID. Please enter manually.');
//             return;
//           }
//           jobDesc = fetchedDesc;
//         }
//       } else {
//         // Use manual input
//         if (!jobDescriptionInput.trim()) {
//           setError('Please enter a job description');
//           return;
//         }
//         jobDesc = jobDescriptionInput;
//       }

//       setScoringApplicant(applicantId);
//       setLoading(true);

//       const response = await fetch(`${BASE_URL}/api/ats/score-resume`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({
//           applicantId: applicantId,
//           jobDescription: jobDesc
//         })
//       });

//       const data = await response.json();

//       if (!response.ok) {
//         setError(data.message || 'Failed to score resume');
//         return;
//       }

//       setScoreDetails(prev => ({
//         ...prev,
//         [applicantId]: data.data
//       }));

//       setLocalApplicants(prev => 
//         prev.map(a => 
//           a.id === applicantId 
//             ? { ...a, resume_score: data.data.score }
//             : a
//         )
//       );

//       console.log('✅ Resume scored:', data.data.score);
//       setJobDescriptionInput('');

//     } catch (err) {
//       setError('Error scoring resume');
//       console.error('Score error:', err);
//     } finally {
//       setLoading(false);
//       setScoringApplicant(null);
//     }
//   };

//   const getScoreColor = (score) => {
//     if (score >= 80) return '#10b981';
//     if (score >= 60) return '#f59e0b';
//     if (score >= 40) return '#f97316';
//     return '#ef4444';
//   };

//   const getScoreLabel = (score) => {
//     if (score >= 80) return 'Excellent';
//     if (score >= 60) return 'Good';
//     if (score >= 40) return 'Fair';
//     return 'Poor';
//   };

//   const handleAutoScore = async (applicantId, jobId) => {
//     if (!jobId) {
//       setError('No Job ID available for auto scoring');
//       return;
//     }

//     setScoringApplicant(applicantId);
//     setShowScoreModal(true);
    
//     // Auto-score with Job ID
//     setTimeout(() => {
//       handleScoreResume(applicantId, true, jobId);
//     }, 100);
//   };

//   return (
//     <div className="applicants-table-wrapper">
//       {error && (
//         <div className="applicants-error-banner">
//           <AlertCircle size={18} className="applicants-error-icon" />
//           <span>{error}</span>
//         </div>
//       )}

//       <div className="applicants-filters-section">
//         <div className="applicants-search-box">
//           <Search size={18} className="applicants-search-icon" />
//           <input
//             type="text"
//             placeholder="Search by name, email, phone, or job ID..."
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             className="applicants-search-input"
//           />
//         </div>

//         <div className="applicants-filter-box">
//           <Filter size={18} className="applicants-filter-icon" />
//           <select
//             value={filterPosition}
//             onChange={(e) => setFilterPosition(e.target.value)}
//             className="applicants-filter-select"
//           >
//             {positions.map(position => (
//               <option key={position} value={position}>
//                 {position}
//               </option>
//             ))}
//           </select>
//         </div>
//       </div>

//       <div className="applicants-table-container">
//         <table className="applicants-data-table">
//           <thead className="applicants-table-head">
//             <tr className="applicants-header-row">
//               <th className="applicants-header-cell">Job ID</th>
//               <th className="applicants-header-cell">First Name</th>
//               <th className="applicants-header-cell">Last Name</th>
//               <th className="applicants-header-cell">Email</th>
//               <th className="applicants-header-cell">Phone</th>
//               <th className="applicants-header-cell">Position</th>
//               <th className="applicants-header-cell">Visa Type</th>
//               <th className="applicants-header-cell">State</th>
//               <th className="applicants-header-cell">City</th>
//               <th className="applicants-header-cell">Employment Type</th>
//               <th className="applicants-header-cell">Resume Score</th>
//               <th className="applicants-header-cell">Date Applied</th>
//               <th className="applicants-header-cell">Actions</th>
//             </tr>
//           </thead>
//           <tbody className="applicants-table-body">
//             {filteredApplicants.length > 0 ? (
//               filteredApplicants.map((applicant) => (
//                 <tr key={applicant.id} className="applicants-body-row">
//                   <td className="applicants-body-cell">
//                     <span className="applicants-jobid-badge">{applicant.job_id || 'N/A'}</span>
//                   </td>
//                   <td className="applicants-body-cell">{applicant.first_name}</td>
//                   <td className="applicants-body-cell">{applicant.last_name}</td>
//                   <td className="applicants-body-cell">
//                     <a href={`mailto:${applicant.email}`} className="applicants-email-link">
//                       {applicant.email}
//                     </a>
//                   </td>
//                   <td className="applicants-body-cell">
//                     <a href={`tel:${applicant.phone}`} className="applicants-phone-link">
//                       {applicant.phone}
//                     </a>
//                   </td>
//                   <td className="applicants-body-cell">
//                     <span className="applicants-position-badge">{applicant.position}</span>
//                   </td>
//                   <td className="applicants-body-cell">
//                     <span className="applicants-visa-badge">{applicant.visa_type || 'N/A'}</span>
//                   </td>
//                   <td className="applicants-body-cell">{applicant.current_state || 'N/A'}</td>
//                   <td className="applicants-body-cell">{applicant.current_city || 'N/A'}</td>
//                   <td className="applicants-body-cell">
//                     <span className="applicants-employment-badge">{applicant.employment_type || 'N/A'}</span>
//                   </td>
//                   <td className="applicants-body-cell">
//                     {applicant.resume_score ? (
//                       <div className="applicants-score-container">
//                         <div 
//                           className="applicants-score-badge"
//                           style={{ backgroundColor: getScoreColor(applicant.resume_score) }}
//                         >
//                           {applicant.resume_score}%
//                         </div>
//                         <div className="applicants-score-label">
//                           {getScoreLabel(applicant.resume_score)}
//                         </div>
//                         {scoreDetails[applicant.id] && (
//                           <div 
//                             className="applicants-score-details-link"
//                             onClick={() => {
//                               setShowScoreModal(true);
//                               setScoringApplicant(applicant.id);
//                             }}
//                           >
//                             View Details
//                           </div>
//                         )}
//                         {!scoreDetails[applicant.id] && (
//                           <button
//                             className="applicants-score-btn"
//                             onClick={() => {
//                               setScoringApplicant(applicant.id);
//                               setShowScoreModal(true);
//                             }}
//                             title="View Score Details"
//                             disabled={loading}
//                           >
//                             <Zap size={16} />
//                             Check
//                           </button>
//                         )}
//                       </div>
//                     ) : (
//                       <>
//                         {applicant.job_id ? (
//                           <button
//                             className="applicants-score-btn"
//                             onClick={() => handleAutoScore(applicant.id, applicant.job_id)}
//                             title="Auto Score from Job ID"
//                             disabled={loading}
//                           >
//                             <Zap size={16} />
//                             View Score
//                           </button>
//                         ) : (
//                           <button
//                             className="applicants-score-btn"
//                             onClick={() => {
//                               setScoringApplicant(applicant.id);
//                               setShowScoreModal(true);
//                             }}
//                             title="Score Resume with AI"
//                             disabled={loading}
//                           >
//                             <Zap size={16} />
//                             Score
//                           </button>
//                         )}
//                       </>
//                     )}
//                   </td>
//                   <td className="applicants-body-cell">
//                     {applicant.created_at 
//                       ? new Date(applicant.created_at).toLocaleDateString()
//                       : 'N/A'
//                     }
//                   </td>
//                   <td className="applicants-body-cell applicants-actions-cell">
//                     <div className="applicants-actions-group">
//                       <button
//                         className="applicants-action-btn applicants-download-btn"
//                         onClick={() => handleDownload(applicant.id, applicant.first_name, applicant.last_name)}
//                         title="Download Resume"
//                         disabled={loading}
//                       >
//                         <Download size={18} className="applicants-action-icon" />
//                       </button>
//                       <button
//                         className="applicants-action-btn applicants-delete-btn"
//                         onClick={() => setDeleteConfirm(applicant.id)}
//                         title="Delete Applicant"
//                         disabled={loading}
//                       >
//                         <Trash2 size={18} className="applicants-action-icon" />
//                       </button>
//                     </div>
//                   </td>
//                 </tr>
//               ))
//             ) : (
//               <tr className="applicants-no-results-row">
//                 <td colSpan="13" className="applicants-no-results-cell">
//                   {localApplicants.length === 0 ? 'No applicants yet' : 'No applicants found matching your search'}
//                 </td>
//               </tr>
//             )}
//           </tbody>
//         </table>
//       </div>

//       <div className="applicants-table-footer">
//         <p className="applicants-footer-text">
//           Showing {filteredApplicants.length} of {localApplicants.length} applicants
//         </p>
//       </div>

//       {/* Score Resume Modal */}
//       {showScoreModal && (
//         <div className="applicants-modal-overlay" onClick={() => setShowScoreModal(false)}>
//           <div className="applicants-modal-content" onClick={(e) => e.stopPropagation()}>
//             <h3 className="applicants-modal-title">Score Resume with AI</h3>
            
//             {scoreDetails[scoringApplicant] ? (
//               <div className="applicants-score-details">
//                 <div className="applicants-score-header">
//                   <div 
//                     className="applicants-large-score"
//                     style={{ color: getScoreColor(scoreDetails[scoringApplicant].score) }}
//                   >
//                     {scoreDetails[scoringApplicant].score}%
//                   </div>
//                   <div className="applicants-score-summary">
//                     {scoreDetails[scoringApplicant].summary}
//                   </div>
//                 </div>

//                 <div className="applicants-score-section">
//                   <h4>✓ Matched Skills</h4>
//                   <div className="applicants-skills-list">
//                     {scoreDetails[scoringApplicant].matchedSkills.length > 0 ? (
//                       scoreDetails[scoringApplicant].matchedSkills.map((skill, idx) => (
//                         <span key={idx} className="applicants-skill-badge applicants-skill-matched">
//                           {skill}
//                         </span>
//                       ))
//                     ) : (
//                       <p className="applicants-empty-skills">No matched skills</p>
//                     )}
//                   </div>
//                 </div>

//                 <div className="applicants-score-section">
//                   <h4>✗ Missing Skills</h4>
//                   <div className="applicants-skills-list">
//                     {scoreDetails[scoringApplicant].missingSkills.length > 0 ? (
//                       scoreDetails[scoringApplicant].missingSkills.map((skill, idx) => (
//                         <span key={idx} className="applicants-skill-badge applicants-skill-missing">
//                           {skill}
//                         </span>
//                       ))
//                     ) : (
//                       <p className="applicants-empty-skills">No missing skills</p>
//                     )}
//                   </div>
//                 </div>

//                 <div className="applicants-modal-actions">
//                   <button
//                     className="applicants-modal-btn applicants-modal-cancel"
//                     onClick={() => setShowScoreModal(false)}
//                   >
//                     Close
//                   </button>
//                   <button
//                     className="applicants-modal-btn applicants-modal-delete"
//                     onClick={() => {
//                       setJobDescriptionInput('');
//                       setScoringApplicant(null);
//                     }}
//                   >
//                     Score Another
//                   </button>
//                 </div>
//               </div>
//             ) : (
//               <>
//                 <p className="applicants-modal-message">
//                   Enter the job description to score the candidate's resume against this position.
//                 </p>
                
//                 <textarea
//                   value={jobDescriptionInput}
//                   onChange={(e) => setJobDescriptionInput(e.target.value)}
//                   placeholder="Paste the job description here..."
//                   className="applicants-job-desc-textarea"
//                   rows={6}
//                   disabled={loading}
//                 />

//                 <div className="applicants-modal-actions">
//                   <button
//                     className="applicants-modal-btn applicants-modal-cancel"
//                     onClick={() => setShowScoreModal(false)}
//                     disabled={loading}
//                   >
//                     Cancel
//                   </button>
//                   <button
//                     className="applicants-modal-btn applicants-modal-delete"
//                     onClick={() => handleScoreResume(scoringApplicant, false)}
//                     disabled={loading || !jobDescriptionInput.trim()}
//                   >
//                     {loading ? 'Scoring...' : 'Score Resume'}
//                   </button>
//                 </div>
//               </>
//             )}
//           </div>
//         </div>
//       )}

//       {/* Delete Confirmation Modal */}
//       {deleteConfirm && (
//         <div className="applicants-modal-overlay" onClick={() => setDeleteConfirm(null)}>
//           <div className="applicants-modal-content" onClick={(e) => e.stopPropagation()}>
//             <h3 className="applicants-modal-title">Delete Applicant?</h3>
//             <p className="applicants-modal-message">
//               This action cannot be undone. The applicant's information and resume will be permanently deleted.
//             </p>
//             <div className="applicants-modal-actions">
//               <button
//                 className="applicants-modal-btn applicants-modal-cancel"
//                 onClick={() => setDeleteConfirm(null)}
//                 disabled={loading}
//               >
//                 Cancel
//               </button>
//               <button
//                 className="applicants-modal-btn applicants-modal-delete"
//                 onClick={() => handleDelete(deleteConfirm)}
//                 disabled={loading}
//               >
//                 {loading ? 'Deleting...' : 'Delete'}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }


// import React, { useState, useMemo, useEffect } from 'react';
// import '../styles/ApplicantsTable.css';
// import { Download, Search, Filter, Trash2, AlertCircle, Zap, ChevronDown, Upload, Link2 } from 'lucide-react';
// import BASE_URL from '../../url';

// // ✅ Helper function to normalize Job IDs
// const normalizeJobId = (jobId) => {
//   if (!jobId) return null;
//   // Remove any suffix like "-1", "-2", etc. and convert to number for comparison
//   const baseId = String(jobId).split('-')[0].trim();
//   return parseInt(baseId, 10);
// };

// export default function ApplicantsTable({ applicants, onDelete, onRefresh, onSubmitResume }) {
//   const [searchTerm, setSearchTerm] = useState('');
//   const [filterPosition, setFilterPosition] = useState('All');
//   const [loading, setLoading] = useState(false);
//   const [localApplicants, setLocalApplicants] = useState(applicants || []);
//   const [error, setError] = useState('');
//   const [deleteConfirm, setDeleteConfirm] = useState(null);
//   const [scoringApplicant, setScoringApplicant] = useState(null);
//   const [scoreDetails, setScoreDetails] = useState({});
//   const [showScoreModal, setShowScoreModal] = useState(false);
//   const [jobDescriptionInput, setJobDescriptionInput] = useState('');
//   const [jobDescriptions, setJobDescriptions] = useState({});
//   const [submittingApplicantId, setSubmittingApplicantId] = useState(null);
//   const [showScoreDetailsModal, setShowScoreDetailsModal] = useState(false);
//   const [selectedScoreDetails, setSelectedScoreDetails] = useState(null);
//   const [jobIdMap, setJobIdMap] = useState({});
//   const safeApplicants = Array.isArray(applicants) ? applicants : [];

//   useEffect(() => {
//     const applicantsArray = Array.isArray(applicants) ? applicants : [];
//     setLocalApplicants(applicantsArray);
//   }, [applicants]);

//   // ✅ NEW: Fetch all job IDs from recruitment dashboard on component mount
//   useEffect(() => {
//     const fetchAllJobIds = async () => {
//       try {
//         const response = await fetch(`${BASE_URL}/api/recruitment/public/roles`, {
//           method: 'GET',
//           headers: {
//             'Content-Type': 'application/json'
//           }
//         });

//         if (response.ok) {
//           const allRoles = await response.json();
          
//           // Create a map of normalized IDs to full Job IDs
//           const idMap = {};
//           allRoles.forEach(role => {
//             const normalizedId = normalizeJobId(role.jobId);
//             idMap[normalizedId] = role.jobId; // Store the full format like "47611-1"
//           });
          
//           console.log('📋 Job ID Map created:', idMap);
//           setJobIdMap(idMap);
//         }
//       } catch (err) {
//         console.error('Error fetching job IDs:', err);
//       }
//     };

//     fetchAllJobIds();
//   }, []);

//   // ✅ FIXED: Fetch job description with normalized Job ID comparison
//   const fetchJobDescription = async (jobId) => {
//     try {
//       console.log('📄 Fetching job description for Job ID:', jobId);
      
//       const response = await fetch(`${BASE_URL}/api/recruitment/public/roles`, {
//         method: 'GET',
//         headers: {
//           'Content-Type': 'application/json'
//         }
//       });

//       if (!response.ok) {
//         console.warn(`⚠️ Could not fetch recruitment roles`);
//         return null;
//       }

//       const allRoles = await response.json();
//       console.log('Fetched all roles:', allRoles.length);
      
//       // ✅ FIX: Normalize job IDs before comparison
//       const normalizedSearchId = normalizeJobId(jobId);
//       console.log('🔍 Normalized search ID:', normalizedSearchId);
      
//       const foundRole = allRoles.find(role => {
//         const normalizedRoleId = normalizeJobId(role.jobId);
//         const isMatch = normalizedRoleId === normalizedSearchId;
        
//         if (isMatch || role.jobId === jobId) {
//           console.log('✅ Match found! Role ID:', role.jobId, 'Normalized:', normalizedRoleId);
//         }
        
//         return isMatch;
//       });
      
//       if (foundRole) {
//         const jd = foundRole.description || foundRole.jobDescription || '';
//         console.log('✅ Found job description for Job ID:', jobId);
        
//         if (jd) {
//           setJobDescriptions(prev => ({
//             ...prev,
//             [jobId]: jd
//           }));
//           return jd;
//         }
//       } else {
//         console.warn(`⚠️ Job ID ${jobId} not found in recruitment roles`);
//       }
      
//       return null;
//     } catch (err) {
//       console.error('Error fetching job description:', err);
//       return null;
//     }
//   };

//   const positions = ['All', ...new Set(localApplicants.map(a => a.position))];

//   const filteredApplicants = useMemo(() => {
//     return localApplicants.filter(applicant => {
//       const matchesSearch =
//         applicant.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         applicant.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         applicant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         applicant.phone.includes(searchTerm) ||
//         (applicant.job_id && applicant.job_id.toString().includes(searchTerm));

//       const matchesPosition =
//         filterPosition === 'All' || applicant.position === filterPosition;

//       return matchesSearch && matchesPosition;
//     });
//   }, [localApplicants, searchTerm, filterPosition]);

//   const handleDownload = async (applicantId, firstName, lastName) => {
//     try {
//       setLoading(true);

//       const response = await fetch(`${BASE_URL}/api/ats/download-resume/${applicantId}`, {
//         method: 'GET',
//         headers: {
//           'Content-Type': 'application/json'
//         }
//       });
      
//       if (!response.ok) {
//         throw new Error('Download failed');
//       }

//       const disposition = response.headers.get('content-disposition');
//       let filename = `${firstName}_${lastName}_resume.pdf`;
      
//       if (disposition) {
//         const filenameMatch = disposition.match(/filename="?([^"]+)"?/);
//         if (filenameMatch) {
//           filename = filenameMatch[1];
//         }
//       }

//       const blob = await response.blob();
//       const url = window.URL.createObjectURL(blob);
//       const link = document.createElement('a');
//       link.href = url;
//       link.download = filename;
//       document.body.appendChild(link);
//       link.click();
//       window.URL.revokeObjectURL(url);
//       document.body.removeChild(link);

//       console.log('✅ Downloaded');
//     } catch (err) {
//       setError('Download failed');
//       setTimeout(() => setError(''), 3000);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleDelete = async (applicantId) => {
//     try {
//       setLoading(true);

//       const response = await fetch(`${BASE_URL}/api/ats/${applicantId}`, {
//         method: 'DELETE',
//         headers: {
//           'Content-Type': 'application/json'
//         }
//       });

//       if (!response.ok) {
//         throw new Error('Delete failed');
//       }

//       setLocalApplicants(localApplicants.filter(a => a.id !== applicantId));
//       setDeleteConfirm(null);

//       if (onDelete) {
//         onDelete(applicantId);
//       }

//       console.log('✅ Deleted');
//     } catch (err) {
//       setError('Delete failed');
//       setTimeout(() => setError(''), 3000);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ✅ FIXED: Submit resume with normalized Job ID comparison
//   const handleDirectSubmitResume = async (applicant) => {
//     try {
//       setSubmittingApplicantId(applicant.id);
//       setLoading(true);

//       const token = localStorage.getItem('token');

//       if (!token) {
//         setError('Authentication required. Please log in again.');
//         return;
//       }

//       if (!applicant.job_id) {
//         setError('No Job ID found for this applicant. Cannot submit to recruitment.');
//         return;
//       }

//       const rolesResponse = await fetch(`${BASE_URL}/api/recruitment/public/roles`, {
//         method: 'GET',
//         headers: {
//           'Content-Type': 'application/json'
//         }
//       });

//       if (!rolesResponse.ok) {
//         setError('Could not find the recruitment role. Please try again.');
//         return;
//       }

//       const allRoles = await rolesResponse.json();
      
//       // ✅ FIX: Normalize job IDs before comparison
//       const normalizedApplicantId = normalizeJobId(applicant.job_id);
//       console.log('🔍 Normalized applicant job ID:', normalizedApplicantId);
      
//       const foundRole = allRoles.find(role => {
//         const normalizedRoleId = normalizeJobId(role.jobId);
//         return normalizedRoleId === normalizedApplicantId;
//       });

//       if (!foundRole) {
//         setError(`No recruitment role found with Job ID: ${applicant.job_id}`);
//         return;
//       }

//       let resumeBlob = null;
//       let resumeFileName = `${applicant.first_name}_${applicant.last_name}_resume.pdf`;
      
//       console.log('📥 Downloading resume for submission...');
//       try {
//         const resumeResponse = await fetch(`${BASE_URL}/api/ats/download-resume/${applicant.id}`, {
//           method: 'GET',
//           headers: {
//             'Authorization': `Bearer ${token}`
//           }
//         });

//         if (resumeResponse.ok) {
//           resumeBlob = await resumeResponse.blob();
//           console.log('✅ Resume blob size:', resumeBlob.size);
          
//           const disposition = resumeResponse.headers.get('content-disposition');
//           if (disposition) {
//             const match = disposition.match(/filename="?([^"]+)"?/);
//             if (match) {
//               resumeFileName = match[1];
//             }
//           }
//           console.log('✅ Resume downloaded successfully:', resumeFileName);
//         } else {
//           console.warn('⚠️ Resume download returned status:', resumeResponse.status);
//         }
//       } catch (resumeError) {
//         console.warn('⚠️ Could not download resume:', resumeError.message);
//       }

//       const formData = new FormData();
//       formData.append('roleId', foundRole.id);
//       formData.append('candidateFirstName', applicant.first_name || '');
//       formData.append('candidateLastName', applicant.last_name || '');
//       formData.append('email', applicant.email || '');
//       formData.append('phone', applicant.phone || '');
//       formData.append('currentLocation', applicant.current_city && applicant.current_state 
//         ? `${applicant.current_city}, ${applicant.current_state}` 
//         : '');
//       formData.append('skills', applicant.skills || '');
//       formData.append('workAuthorization', applicant.visa_type || '');
//       formData.append('relevantExperience', applicant.experience || '');
//       formData.append('currentCompany', applicant.current_employer || '');
//       formData.append('rate', applicant.expected_rate || '');

//       if (resumeBlob && resumeBlob.size > 0) {
//         console.log('📎 Appending resume to FormData...');
//         formData.append('resume', resumeBlob, resumeFileName);
//         console.log('✅ Resume appended to FormData');
//       } else {
//         console.warn('⚠️ Resume blob is empty or null');
//       }

//       console.log('📤 Submitting to recruitment dashboard...');
//       const submitResponse = await fetch(`${BASE_URL}/api/recruitment/applications`, {
//         method: 'POST',
//         headers: {
//           'Authorization': `Bearer ${token}`
//         },
//         body: formData
//       });

//       const submitData = await submitResponse.json();

//       if (!submitResponse.ok) {
//         console.error('❌ Submission failed:', submitResponse.status, submitData);
//         if (submitResponse.status === 409) {
//           setError('This candidate has already been submitted for this role.');
//         } else {
//           setError(submitData.message || 'Failed to submit resume. Please try again.');
//         }
//         return;
//       }

//       setError('');
//       const successMessage = `✅ ${applicant.first_name} ${applicant.last_name} submitted to Job ID: ${applicant.job_id}${resumeBlob ? ' (with resume)' : ''}`;
//       console.log('✅ SUCCESS:', successMessage);
      
//       setTimeout(() => {
//         setError(successMessage);
//         setTimeout(() => setError(''), 5000);
//       }, 100);

//       console.log('✅ Response from recruitment:', submitData);

//     } catch (err) {
//       console.error('❌ Error submitting resume:', err);
//       setError(err.message || 'Error submitting resume to recruitment. Please try again.');
//     } finally {
//       setLoading(false);
//       setSubmittingApplicantId(null);
//     }
//   };

//   const handleScoreResume = async (applicantId, useJobId = false, jobId = null) => {
//     try {
//       let jobDesc = '';

//       if (useJobId && jobId) {
//         if (jobDescriptions[jobId]) {
//           jobDesc = jobDescriptions[jobId];
//         } else {
//           const fetchedDesc = await fetchJobDescription(jobId);
//           if (!fetchedDesc) {
//             setError('Could not fetch job description for this Job ID. Please enter manually.');
//             return;
//           }
//           jobDesc = fetchedDesc;
//         }
//       } else {
//         if (!jobDescriptionInput.trim()) {
//           setError('Please enter a job description');
//           return;
//         }
//         jobDesc = jobDescriptionInput;
//       }

//       setScoringApplicant(applicantId);
//       setLoading(true);

//       console.log('🎯 Scoring resume for applicant:', applicantId);
//       console.log('📄 Job description length:', jobDesc.length);

//       const response = await fetch(`${BASE_URL}/api/ats/score-resume`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({
//           applicantId: applicantId,
//           jobDescription: jobDesc
//         })
//       });

//       const data = await response.json();
//       console.log('📊 Score response:', data);

//       if (!response.ok) {
//         console.error('❌ Score error:', data.message);
//         setError(data.message || 'Failed to score resume');
//         return;
//       }

//       console.log('✅ Score data received:', data.data);
      
//       let matchedSkills = [];
//       let missingSkills = [];
      
//       if (data.data.matchedSkills) {
//         matchedSkills = Array.isArray(data.data.matchedSkills) ? data.data.matchedSkills : [];
//       }
      
//       if (data.data.missingSkills) {
//         missingSkills = Array.isArray(data.data.missingSkills) ? data.data.missingSkills : [];
//       }

//       const scoreData = {
//         score: data.data.score || 0,
//         matchedSkills: matchedSkills,
//         missingSkills: missingSkills,
//         summary: data.data.summary || 'Resume scored'
//       };

//       console.log('📝 Score data to store:', scoreData);
//       console.log('🎯 Matched Skills:', matchedSkills);
//       console.log('❌ Missing Skills:', missingSkills);

//       setScoreDetails(prev => {
//         const updated = {
//           ...prev,
//           [applicantId]: scoreData
//         };
//         console.log('📊 Updated scoreDetails state:', updated);
//         console.log('🔑 Keys in scoreDetails:', Object.keys(updated));
//         return updated;
//       });

//       setLocalApplicants(prev => {
//         const updated = prev.map(a => 
//           a.id === applicantId 
//             ? { ...a, resume_score: scoreData.score }
//             : a
//         );
//         console.log('✅ Updated local applicants, score for ID', applicantId, ':', scoreData.score);
//         return updated;
//       });

//       console.log('✅ Resume scored successfully:', scoreData.score);
//       console.log('📝 Score details stored in state for applicant:', applicantId);
//       setJobDescriptionInput('');
//       setError('');
      
//       setTimeout(() => {
//         setError(`✅ Resume scored: ${scoreData.score}% - Click "View Details" to see breakdown`);
//         setTimeout(() => setError(''), 4000);
//       }, 100);

//     } catch (err) {
//       console.error('❌ Error scoring resume:', err);
//       setError('Error scoring resume: ' + err.message);
//     } finally {
//       setLoading(false);
//       setScoringApplicant(null);
//     }
//   };

//   const getScoreColor = (score) => {
//     if (score >= 80) return '#10b981';
//     if (score >= 60) return '#f59e0b';
//     if (score >= 40) return '#f97316';
//     return '#ef4444';
//   };

//   const getScoreLabel = (score) => {
//     if (score >= 80) return 'Excellent';
//     if (score >= 60) return 'Good';
//     if (score >= 40) return 'Fair';
//     return 'Poor';
//   };

//   const handleAutoScore = async (applicantId, jobId) => {
//     if (!jobId) {
//       setError('No Job ID available for auto scoring');
//       return;
//     }

//     setScoringApplicant(applicantId);
//     setShowScoreModal(true);
    
//     setTimeout(() => {
//       handleScoreResume(applicantId, true, jobId);
//     }, 100);
//   };

//   const handleViewScoreDetails = async (applicantId) => {
//     console.log('👁️ Viewing score details for applicant:', applicantId);
//     console.log('📊 All scoreDetails:', scoreDetails);
//     console.log('🔍 Looking for applicant ID:', applicantId);
    
//     try {
//       console.log('📥 Fetching applicant data from database...');
//       const response = await fetch(`${BASE_URL}/api/ats/${applicantId}`, {
//         method: 'GET',
//         headers: {
//           'Content-Type': 'application/json'
//         }
//       });

//       if (response.ok) {
//         const data = await response.json();
//         const applicant = data.data;
        
//         console.log('✅ Applicant data from DB:', applicant);
        
//         if (applicant.resume_score) {
//           let matchedSkills = [];
//           let missingSkills = [];
          
//           if (applicant.matched_skills) {
//             try {
//               matchedSkills = typeof applicant.matched_skills === 'string' 
//                 ? JSON.parse(applicant.matched_skills)
//                 : applicant.matched_skills;
//             } catch (e) {
//               console.warn('⚠️ Could not parse matched_skills:', e.message);
//               matchedSkills = [];
//             }
//           }
          
//           if (applicant.missing_skills) {
//             try {
//               missingSkills = typeof applicant.missing_skills === 'string'
//                 ? JSON.parse(applicant.missing_skills)
//                 : applicant.missing_skills;
//             } catch (e) {
//               console.warn('⚠️ Could not parse missing_skills:', e.message);
//               missingSkills = [];
//             }
//           }

//           const validDetails = {
//             score: applicant.resume_score || 0,
//             summary: `Resume score: ${applicant.resume_score}%`,
//             matchedSkills: Array.isArray(matchedSkills) ? matchedSkills : [],
//             missingSkills: Array.isArray(missingSkills) ? missingSkills : []
//           };
          
//           console.log('✅ Valid details to display:', validDetails);
//           console.log('✅ Matched Skills from DB:', validDetails.matchedSkills);
//           console.log('✅ Missing Skills from DB:', validDetails.missingSkills);
          
//           setSelectedScoreDetails(validDetails);
//           setShowScoreDetailsModal(true);
//           return;
//         }
//       }
      
//       let details = scoreDetails[applicantId];
      
//       if (details && details.score !== undefined) {
//         console.log('✅ Score details found in state:', details);
        
//         const validDetails = {
//           score: details.score || 0,
//           summary: details.summary || 'Resume evaluated',
//           matchedSkills: Array.isArray(details.matchedSkills) ? details.matchedSkills : [],
//           missingSkills: Array.isArray(details.missingSkills) ? details.missingSkills : []
//         };
        
//         console.log('✅ Valid details to display:', validDetails);
//         setSelectedScoreDetails(validDetails);
//         setShowScoreDetailsModal(true);
//       } else {
//         console.warn('⚠️ No valid score details found for applicant:', applicantId);
//         setError('⚠️ Score details not available. Please score the resume first to see detailed breakdown.');
//         setTimeout(() => setError(''), 4000);
//       }
      
//     } catch (err) {
//       console.error('❌ Error fetching applicant data:', err);
//       setError('⚠️ Could not load score details. Please try again.');
//       setTimeout(() => setError(''), 4000);
//     }
//   };

//   return (
//     <div className="applicants-table-wrapper">
//       {error && (
//         <div style={{
//           position: 'fixed',
//           top: '20px',
//           right: '20px',
//           backgroundColor: (error.includes('✅') || error.includes('submitted')) ? '#d4edda' : '#f8d7da',
//           color: (error.includes('✅') || error.includes('submitted')) ? '#155724' : '#721c24',
//           padding: '12px 20px',
//           borderRadius: '4px',
//           border: (error.includes('✅') || error.includes('submitted')) ? '1px solid #c3e6cb' : '1px solid #f5c6cb',
//           boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
//           zIndex: 10003,
//           display: 'flex',
//           alignItems: 'center',
//           justifyContent: 'space-between',
//           minWidth: '300px',
//           maxWidth: '500px',
//           animation: 'slideInRight 0.4s ease-out',
//           transition: 'all 0.3s ease'
//         }}>
//           <style>{`
//             @keyframes slideInRight {
//               from {
//                 transform: translateX(400px);
//                 opacity: 0;
//               }
//               to {
//                 transform: translateX(0);
//                 opacity: 1;
//               }
//             }
//             @keyframes slideOutRight {
//               from {
//                 transform: translateX(0);
//                 opacity: 1;
//               }
//               to {
//                 transform: translateX(400px);
//                 opacity: 0;
//               }
//             }
//           `}</style>
//           <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
//             <div style={{
//               width: '20px',
//               height: '20px',
//               borderRadius: '50%',
//               backgroundColor: (error.includes('✅') || error.includes('submitted')) ? '#28a745' : '#dc3545',
//               display: 'flex',
//               alignItems: 'center',
//               justifyContent: 'center',
//               color: 'white',
//               fontSize: '12px',
//               fontWeight: 'bold'
//             }}>
//               {(error.includes('✅') || error.includes('submitted')) ? '✓' : '!'}
//             </div>
//             <span style={{ fontSize: '14px', fontWeight: '500' }}>{error}</span>
//           </div>
//           <button
//             onClick={() => setError('')}
//             style={{
//               background: 'none',
//               border: 'none',
//               color: (error.includes('✅') || error.includes('submitted')) ? '#155724' : '#721c24',
//               fontSize: '18px',
//               cursor: 'pointer',
//               padding: '0',
//               marginLeft: '10px',
//               transition: 'transform 0.2s ease'
//             }}
//             onMouseEnter={(e) => e.target.style.transform = 'rotate(90deg)'}
//             onMouseLeave={(e) => e.target.style.transform = 'rotate(0deg)'}
//           >
//             ×
//           </button>
//         </div>
//       )}

//       <div className="applicants-filters-section">
//         <div className="applicants-search-box">
//           <Search size={18} className="applicants-search-icon" />
//           <input
//             type="text"
//             placeholder="Search by name, email, phone, or job ID..."
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             className="applicants-search-input"
//           />
//         </div>

//         <div className="applicants-filter-box">
//           <Filter size={18} className="applicants-filter-icon" />
//           <select
//             value={filterPosition}
//             onChange={(e) => setFilterPosition(e.target.value)}
//             className="applicants-filter-select"
//           >
//             {['All', ...new Set(localApplicants.map(a => a.position))].map(position => (
//               <option key={position} value={position}>
//                 {position}
//               </option>
//             ))}
//           </select>
//         </div>
//       </div>

//       <div className="applicants-table-container">
//         <table className="applicants-data-table">
//           <thead className="applicants-table-head">
//             <tr className="applicants-header-row">
//               <th className="applicants-header-cell">Job ID</th>
//               <th className="applicants-header-cell">First Name</th>
//               <th className="applicants-header-cell">Last Name</th>
//               <th className="applicants-header-cell">Email</th>
//               <th className="applicants-header-cell">Phone</th>
//               <th className="applicants-header-cell">Position</th>
//               <th className="applicants-header-cell">Visa Type</th>
//               <th className="applicants-header-cell">State</th>
//               <th className="applicants-header-cell">City</th>
//               <th className="applicants-header-cell">Employment Type</th>
//               <th className="applicants-header-cell">Resume Score</th>
//               <th className="applicants-header-cell">Date Applied</th>
//               <th className="applicants-header-cell">Actions</th>
//             </tr>
//           </thead>
//           <tbody className="applicants-table-body">
//             {filteredApplicants.length > 0 ? (
//               filteredApplicants.map((applicant) => (
//                 <tr key={applicant.id} className="applicants-body-row">
//                   <td className="applicants-body-cell">
//                     <span className="applicants-jobid-badge">
//                       {applicant.job_id 
//                         ? (jobIdMap[normalizeJobId(applicant.job_id)] || applicant.job_id)
//                         : 'N/A'
//                       }
//                     </span>
//                   </td>
//                   <td className="applicants-body-cell">{applicant.first_name}</td>
//                   <td className="applicants-body-cell">{applicant.last_name}</td>
//                   <td className="applicants-body-cell">
//                     <a href={`mailto:${applicant.email}`} className="applicants-email-link">
//                       {applicant.email}
//                     </a>
//                   </td>
//                   <td className="applicants-body-cell">
//                     <a href={`tel:${applicant.phone}`} className="applicants-phone-link">
//                       {applicant.phone}
//                     </a>
//                   </td>
//                   <td className="applicants-body-cell">
//                     <span className="applicants-position-badge">{applicant.position}</span>
//                   </td>
//                   <td className="applicants-body-cell">
//                     <span className="applicants-visa-badge">{applicant.visa_type || 'N/A'}</span>
//                   </td>
//                   <td className="applicants-body-cell">{applicant.current_state || 'N/A'}</td>
//                   <td className="applicants-body-cell">{applicant.current_city || 'N/A'}</td>
//                   <td className="applicants-body-cell">
//                     <span className="applicants-employment-badge">{applicant.employment_type || 'N/A'}</span>
//                   </td>
//                   <td className="applicants-body-cell">
//                     {applicant.resume_score ? (
//                       <div className="applicants-score-container">
//                         <div 
//                           className="applicants-score-badge"
//                           style={{ backgroundColor: getScoreColor(applicant.resume_score) }}
//                         >
//                           {applicant.resume_score}%
//                         </div>
//                         <div className="applicants-score-label">
//                           {getScoreLabel(applicant.resume_score)}
//                         </div>
//                         <button
//                           onClick={() => handleViewScoreDetails(applicant.id)}
//                           style={{
//                             marginTop: '5px',
//                             padding: '4px 8px',
//                             backgroundColor: 'transparent',
//                             color: '#1a6f66ff',
//                             border: '1px solid #1a6f66ff',
//                             borderRadius: '3px',
//                             cursor: 'pointer',
//                             fontSize: '10px',
//                             fontWeight: '500',
//                             transition: 'all 0.2s'
//                           }}
//                           onMouseEnter={(e) => {
//                             e.target.style.backgroundColor = '#1a6f66ff';
//                             e.target.style.color = 'white';
//                           }}
//                           onMouseLeave={(e) => {
//                             e.target.style.backgroundColor = 'transparent';
//                             e.target.style.color = '#1a6f66ff';
//                           }}
//                         >
//                           View Details
//                         </button>
//                       </div>
//                     ) : (
//                       <button
//                         className="applicants-score-btn"
//                         onClick={() => handleAutoScore(applicant.id, applicant.job_id)}
//                         title="Score Resume with AI"
//                         disabled={loading}
//                       >
//                         <Zap size={16} />
//                         Score
//                       </button>
//                     )}
//                   </td>
//                   <td className="applicants-body-cell">
//                     {applicant.created_at 
//                       ? new Date(applicant.created_at).toLocaleDateString()
//                       : 'N/A'
//                     }
//                   </td>
//                   <td className="applicants-body-cell applicants-actions-cell">
//                     <div className="applicants-actions-group">
//                       {/* <button
//                         className="applicants-action-btn applicants-submit-resume-btn"
//                         onClick={(e) => {
//                           e.stopPropagation();
//                           handleDirectSubmitResume(applicant);
//                         }}
//                         title="Submit to Recruitment Dashboard"
//                         disabled={loading || submittingApplicantId === applicant.id}
//                         style={{
//                           backgroundColor: submittingApplicantId === applicant.id ? '#cccccc' : '#1a6f66ff',
//                           color: 'white',
//                           border: 'none',
//                           padding: '6px 10px',
//                           borderRadius: '4px',
//                           cursor: loading || submittingApplicantId === applicant.id ? 'not-allowed' : 'pointer',
//                           display: 'flex',
//                           alignItems: 'center',
//                           justifyContent: 'center',
//                           opacity: loading || submittingApplicantId === applicant.id ? 0.6 : 1,
//                           transition: 'all 0.2s ease',
//                           position: 'relative'
//                         }}
//                         onMouseEnter={(e) => {
//                           if (!loading && submittingApplicantId !== applicant.id) {
//                             e.target.style.backgroundColor = '#145c54';
//                           }
//                         }}
//                         onMouseLeave={(e) => {
//                           if (!loading && submittingApplicantId !== applicant.id) {
//                             e.target.style.backgroundColor = '#1a6f66ff';
//                           }
//                         }}
//                       >
//                         {submittingApplicantId === applicant.id ? (
//                           <span style={{ fontSize: '12px' }}>Submitting...</span>
//                         ) : (
//                           <Link2 size={18} />
//                         )}
//                       </button> */}

//                       <button
//                         className="applicants-action-btn applicants-download-btn"
//                         onClick={(e) => {
//                           e.stopPropagation();
//                           handleDownload(applicant.id, applicant.first_name, applicant.last_name);
//                         }}
//                         title="Download Resume"
//                         disabled={loading}
//                       >
//                         <Download size={18} className="applicants-action-icon" />
//                       </button>

//                       <button
//                         className="applicants-action-btn applicants-delete-btn"
//                         onClick={(e) => {
//                           e.stopPropagation();
//                           setDeleteConfirm(applicant.id);
//                         }}
//                         title="Delete Applicant"
//                         disabled={loading}
//                       >
//                         <Trash2 size={18} className="applicants-action-icon" />
//                       </button>
//                     </div>
//                   </td>
//                 </tr>
//               ))
//             ) : (
//               <tr className="applicants-no-results-row">
//                 <td colSpan="13" className="applicants-no-results-cell">
//                   {localApplicants.length === 0 ? 'No applicants yet' : 'No applicants found matching your search'}
//                 </td>
//               </tr>
//             )}
//           </tbody>
//         </table>
//       </div>

//       <div className="applicants-table-footer">
//         <p className="applicants-footer-text">
//           Showing {filteredApplicants.length} of {localApplicants.length} applicants
//         </p>
//       </div>

//       {/* Score Details Modal */}
//       {showScoreDetailsModal && selectedScoreDetails && (
//         <div className="applicants-modal-overlay" onClick={() => setShowScoreDetailsModal(false)}>
//           <div className="applicants-modal-content" onClick={(e) => e.stopPropagation()}>
//             <h3 className="applicants-modal-title">Resume Score Details</h3>
            
//             <div style={{ padding: '20px' }}>
//               <div style={{
//                 display: 'flex',
//                 alignItems: 'center',
//                 marginBottom: '20px',
//                 justifyContent: 'center'
//               }}>
//                 <div style={{
//                   fontSize: '48px',
//                   fontWeight: 'bold',
//                   color: getScoreColor(selectedScoreDetails.score),
//                   marginRight: '20px'
//                 }}>
//                   {selectedScoreDetails.score}%
//                 </div>
//                 <div>
//                   <div style={{ fontSize: '16px', fontWeight: '600', color: '#333' }}>
//                     {getScoreLabel(selectedScoreDetails.score)}
//                   </div>
//                   <div style={{ fontSize: '14px', color: '#666' }}>
//                     {selectedScoreDetails.summary}
//                   </div>
//                 </div>
//               </div>

//               <div style={{ marginBottom: '20px' }}>
//                 <h4 style={{ marginBottom: '10px', fontWeight: '600', color: '#333' }}>
//                   ✓ Matched Skills ({selectedScoreDetails.matchedSkills?.length || 0})
//                 </h4>
//                 <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
//                   {selectedScoreDetails.matchedSkills && selectedScoreDetails.matchedSkills.length > 0 ? (
//                     selectedScoreDetails.matchedSkills.map((skill, idx) => (
//                       <span key={idx} style={{
//                         backgroundColor: '#d4edda',
//                         color: '#155724',
//                         padding: '6px 12px',
//                         borderRadius: '12px',
//                         fontSize: '12px',
//                         fontWeight: '500'
//                       }}>
//                         {String(skill).trim()}
//                       </span>
//                     ))
//                   ) : (
//                     <p style={{ color: '#999', fontSize: '13px' }}>No matched skills found</p>
//                   )}
//                 </div>
//               </div>

//               <div style={{ marginBottom: '20px' }}>
//                 <h4 style={{ marginBottom: '10px', fontWeight: '600', color: '#333' }}>
//                   ✗ Missing Skills ({selectedScoreDetails.missingSkills?.length || 0})
//                 </h4>
//                 <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
//                   {selectedScoreDetails.missingSkills && selectedScoreDetails.missingSkills.length > 0 ? (
//                     selectedScoreDetails.missingSkills.map((skill, idx) => (
//                       <span key={idx} style={{
//                         backgroundColor: '#f8d7da',
//                         color: '#721c24',
//                         padding: '6px 12px',
//                         borderRadius: '12px',
//                         fontSize: '12px',
//                         fontWeight: '500'
//                       }}>
//                         {String(skill).trim()}
//                       </span>
//                     ))
//                   ) : (
//                     <p style={{ color: '#999', fontSize: '13px' }}>No missing skills identified</p>
//                   )}
//                 </div>
//               </div>
//             </div>

//             <div className="applicants-modal-actions">
//               <button
//                 className="applicants-modal-btn applicants-modal-cancel"
//                 onClick={() => setShowScoreDetailsModal(false)}
//               >
//                 Close
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Delete Confirmation Modal */}
//       {deleteConfirm && (
//         <div className="applicants-modal-overlay" onClick={() => setDeleteConfirm(null)}>
//           <div className="applicants-modal-content" onClick={(e) => e.stopPropagation()}>
//             <h3 className="applicants-modal-title">Delete Applicant?</h3>
//             <p className="applicants-modal-message">
//               This action cannot be undone. The applicant's information and resume will be permanently deleted.
//             </p>
//             <div className="applicants-modal-actions">
//               <button
//                 className="applicants-modal-btn applicants-modal-cancel"
//                 onClick={() => setDeleteConfirm(null)}
//                 disabled={loading}
//               >
//                 Cancel
//               </button>
//               <button
//                 className="applicants-modal-btn applicants-modal-delete"
//                 onClick={() => handleDelete(deleteConfirm)}
//                 disabled={loading}
//               >
//                 {loading ? 'Deleting...' : 'Delete'}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }



import React, { useState, useMemo, useEffect } from 'react';
import '../styles/ApplicantsTable.css';
import { Download, Search, Filter, Trash2, AlertCircle, Zap, ChevronDown, Upload, Link2, X } from 'lucide-react';
import BASE_URL from '../../url';

// ✅ Helper function to normalize Job IDs
const normalizeJobId = (jobId) => {
  if (!jobId) return null;
  const baseId = String(jobId).split('-')[0].trim();
  return parseInt(baseId, 10);
};

export default function ApplicantsTable({ applicants, onDelete, onRefresh, onSubmitResume }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPosition, setFilterPosition] = useState('All');
  const [loading, setLoading] = useState(false);
  const [localApplicants, setLocalApplicants] = useState(applicants || []);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [scoringApplicant, setScoringApplicant] = useState(null);
  const [scoreDetails, setScoreDetails] = useState({});
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [jobDescriptionInput, setJobDescriptionInput] = useState('');
  const [jobDescriptions, setJobDescriptions] = useState({});
  const [showScoreDetailsModal, setShowScoreDetailsModal] = useState(false);
  const [selectedScoreDetails, setSelectedScoreDetails] = useState(null);
  const [manualScoreApplicantId, setManualScoreApplicantId] = useState(null);
  const [scoreMode, setScoreMode] = useState('auto'); // 'auto' or 'manual'
  const [submittingApplicantId, setSubmittingApplicantId] = useState(null);
  const safeApplicants = Array.isArray(applicants) ? applicants : [];

  useEffect(() => {
    const applicantsArray = Array.isArray(applicants) ? applicants : [];
    setLocalApplicants(applicantsArray);
  }, [applicants]);

  // ✅ Fetch job description
  const fetchJobDescription = async (jobId) => {
    try {
      console.log('📄 Fetching job description for Job ID:', jobId);
      
      const response = await fetch(`${BASE_URL}/api/recruitment/public/roles`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.warn(`⚠️ Could not fetch recruitment roles`);
        return null;
      }

      const allRoles = await response.json();
      const normalizedSearchId = normalizeJobId(jobId);
      
      const foundRole = allRoles.find(role => {
        const normalizedRoleId = normalizeJobId(role.jobId);
        return normalizedRoleId === normalizedSearchId;
      });
      
      if (foundRole) {
        const jd = foundRole.description || foundRole.jobDescription || '';
        if (jd) {
          setJobDescriptions(prev => ({
            ...prev,
            [jobId]: jd
          }));
          return jd;
        }
      }
      
      return null;
    } catch (err) {
      console.error('Error fetching job description:', err);
      return null;
    }
  };

  const positions = ['All', ...new Set(localApplicants.map(a => a.position))];

  const filteredApplicants = useMemo(() => {
    return localApplicants.filter(applicant => {
      const matchesSearch =
        applicant.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        applicant.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        applicant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        applicant.phone.includes(searchTerm) ||
        (applicant.job_id && applicant.job_id.toString().includes(searchTerm));

      const matchesPosition =
        filterPosition === 'All' || applicant.position === filterPosition;

      return matchesSearch && matchesPosition;
    });
  }, [localApplicants, searchTerm, filterPosition]);

  const handleDownload = async (applicantId, firstName, lastName) => {
    try {
      setLoading(true);

      const response = await fetch(`${BASE_URL}/api/ats/download-resume/${applicantId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Download failed');
      }

      const disposition = response.headers.get('content-disposition');
      let filename = `${firstName}_${lastName}_resume.pdf`;
      
      if (disposition) {
        const filenameMatch = disposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);

      console.log('✅ Downloaded');
    } catch (err) {
      setError('Download failed');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (applicantId) => {
    try {
      setLoading(true);

      const response = await fetch(`${BASE_URL}/api/ats/${applicantId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Delete failed');
      }

      setLocalApplicants(localApplicants.filter(a => a.id !== applicantId));
      setDeleteConfirm(null);

      if (onDelete) {
        onDelete(applicantId);
      }

      console.log('✅ Deleted');
    } catch (err) {
      setError('Delete failed');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  // ✅ SUBMIT RESUME TO RECRUITMENT DASHBOARD
  const handleDirectSubmitResume = async (applicant) => {
    try {
      setSubmittingApplicantId(applicant.id);
      setLoading(true);

      const token = localStorage.getItem('token');

      if (!token) {
        setError('Authentication required. Please log in again.');
        return;
      }

      if (!applicant.job_id) {
        setError('No Job ID found for this applicant. Cannot submit to recruitment.');
        return;
      }

      // Fetch all recruitment roles
      const rolesResponse = await fetch(`${BASE_URL}/api/recruitment/public/roles`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!rolesResponse.ok) {
        setError('Could not find the recruitment role. Please try again.');
        return;
      }

      const allRoles = await rolesResponse.json();
      
      // ✅ Normalize job IDs for comparison
      const normalizedApplicantId = normalizeJobId(applicant.job_id);
      console.log('🔍 Normalized applicant job ID:', normalizedApplicantId);
      
      const foundRole = allRoles.find(role => {
        const normalizedRoleId = normalizeJobId(role.jobId);
        return normalizedRoleId === normalizedApplicantId;
      });

      if (!foundRole) {
        setError(`No recruitment role found with Job ID: ${applicant.job_id}`);
        return;
      }

      let resumeBlob = null;
      let resumeFileName = `${applicant.first_name}_${applicant.last_name}_resume.pdf`;
      
      console.log('📥 Downloading resume for submission...');
      console.log('📋 Applicant ID:', applicant.id);
      console.log('📋 Resume S3 Key:', applicant.resume_s3_key);
      
      try {
        const resumeResponse = await fetch(`${BASE_URL}/api/ats/download-resume/${applicant.id}`, {
          method: 'GET'
        });

        console.log('📊 Resume download response status:', resumeResponse.status);
        console.log('📊 Resume response headers:', {
          contentType: resumeResponse.headers.get('content-type'),
          contentLength: resumeResponse.headers.get('content-length'),
          contentDisposition: resumeResponse.headers.get('content-disposition')
        });

        if (resumeResponse.ok) {
          resumeBlob = await resumeResponse.blob();
          console.log('✅ Resume blob received');
          console.log('✅ Resume blob type:', resumeBlob.type);
          console.log('✅ Resume blob size:', resumeBlob.size);
          
          if (resumeBlob.size === 0) {
            console.warn('⚠️ Resume blob is empty!');
            resumeBlob = null;
          }
          
          const disposition = resumeResponse.headers.get('content-disposition');
          if (disposition) {
            const match = disposition.match(/filename\*?=(?:UTF-8'')?(?:"([^"]+)"|([^;]+))/);
            if (match) {
              resumeFileName = decodeURIComponent(match[1] || match[2]);
              console.log('✅ Extracted filename:', resumeFileName);
            }
          }
          console.log('✅ Resume downloaded successfully:', resumeFileName);
        } else {
          console.warn('⚠️ Resume download failed with status:', resumeResponse.status);
          const errorText = await resumeResponse.text();
          console.warn('⚠️ Error response:', errorText);
        }
      } catch (resumeError) {
        console.warn('⚠️ Could not download resume:', resumeError.message);
        console.warn('⚠️ Stack:', resumeError.stack);
      }

      console.log('📋 Final resume state before submission:');
      console.log('   - resumeBlob:', resumeBlob ? `${resumeBlob.size} bytes (${resumeBlob.type})` : 'null');
      console.log('   - resumeFileName:', resumeFileName);

      // Create FormData for submission
      const formData = new FormData();
      formData.append('roleId', foundRole.id);
      formData.append('candidateFirstName', applicant.first_name || '');
      formData.append('candidateLastName', applicant.last_name || '');
      formData.append('email', applicant.email || '');
      formData.append('phone', applicant.phone || '');
      formData.append('currentLocation', applicant.current_city && applicant.current_state 
        ? `${applicant.current_city}, ${applicant.current_state}` 
        : '');
      formData.append('skills', applicant.skills || '');
      formData.append('workAuthorization', applicant.visa_type || '');
      formData.append('relevantExperience', applicant.experience || '');
      formData.append('currentCompany', applicant.current_employer || '');
      formData.append('rate', applicant.expected_rate || '');

      // Append resume if available
      if (resumeBlob && resumeBlob.size > 0) {
        console.log('📎 Appending resume to FormData...');
        formData.append('resume', resumeBlob, resumeFileName);
        console.log('✅ Resume appended to FormData');
      } else {
        console.warn('⚠️ Resume blob is empty or null');
      }

      console.log('📤 Submitting to recruitment dashboard...');
      const submitResponse = await fetch(`${BASE_URL}/api/recruitment/applications`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const submitData = await submitResponse.json();

      if (!submitResponse.ok) {
        console.error('❌ Submission failed:', submitResponse.status, submitData);
        if (submitResponse.status === 409) {
          setError('This candidate has already been submitted for this role.');
        } else {
          setError(submitData.message || 'Failed to submit resume. Please try again.');
        }
        return;
      }

      setError('');
      const successMessage = `✅ ${applicant.first_name} ${applicant.last_name} submitted to Job ID: ${applicant.job_id}${resumeBlob ? ' (with resume)' : ''}`;
      console.log('✅ SUCCESS:', successMessage);
      
      setTimeout(() => {
        setError(successMessage);
        setTimeout(() => setError(''), 5000);
      }, 100);

      console.log('✅ Response from recruitment:', submitData);

    } catch (err) {
      console.error('❌ Error submitting resume:', err);
      setError(err.message || 'Error submitting resume to recruitment. Please try again.');
    } finally {
      setLoading(false);
      setSubmittingApplicantId(null);
    }
  };

  const handleScoreResume = async (applicantId, useJobId = false, jobId = null) => {
    try {
      let jobDesc = '';

      if (useJobId && jobId) {
        if (jobDescriptions[jobId]) {
          jobDesc = jobDescriptions[jobId];
        } else {
          const fetchedDesc = await fetchJobDescription(jobId);
          if (!fetchedDesc) {
            setError('Could not fetch job description for this Job ID. Please enter manually.');
            return;
          }
          jobDesc = fetchedDesc;
        }
      } else {
        if (!jobDescriptionInput.trim()) {
          setError('Please enter a job description');
          return;
        }
        jobDesc = jobDescriptionInput;
      }

      setScoringApplicant(applicantId);
      setLoading(true);

      console.log('🎯 Scoring resume for applicant:', applicantId);

      const response = await fetch(`${BASE_URL}/api/ats/score-resume`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          applicantId: applicantId,
          jobDescription: jobDesc
        })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ Score error:', data.message);
        setError(data.message || 'Failed to score resume');
        return;
      }

      let matchedSkills = [];
      let missingSkills = [];
      
      if (data.data.matchedSkills) {
        matchedSkills = Array.isArray(data.data.matchedSkills) ? data.data.matchedSkills : [];
      }
      
      if (data.data.missingSkills) {
        missingSkills = Array.isArray(data.data.missingSkills) ? data.data.missingSkills : [];
      }

      const scoreData = {
        score: data.data.score || 0,
        matchedSkills: matchedSkills,
        missingSkills: missingSkills,
        summary: data.data.summary || 'Resume scored'
      };

      setScoreDetails(prev => ({
        ...prev,
        [applicantId]: scoreData
      }));

      setLocalApplicants(prev => {
        return prev.map(a => 
          a.id === applicantId 
            ? { ...a, resume_score: scoreData.score }
            : a
        );
      });

      setJobDescriptionInput('');
      setError('');
      
      setTimeout(() => {
        setError(`✅ Resume scored: ${scoreData.score}% - Click "View Details" to see breakdown`);
        setTimeout(() => setError(''), 4000);
      }, 100);

      // Close modal after successful scoring
      setShowScoreModal(false);
      setManualScoreApplicantId(null);
      setScoreMode('auto');

    } catch (err) {
      console.error('❌ Error scoring resume:', err);
      setError('Error scoring resume: ' + err.message);
    } finally {
      setLoading(false);
      setScoringApplicant(null);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    if (score >= 40) return '#f97316';
    return '#ef4444';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  const handleAutoScore = async (applicantId, jobId) => {
    if (!jobId) {
      setError('No Job ID available for auto scoring');
      return;
    }

    setScoringApplicant(applicantId);
    setScoreMode('auto');
    setShowScoreModal(true);
    setManualScoreApplicantId(null);
    
    setTimeout(() => {
      handleScoreResume(applicantId, true, jobId);
    }, 100);
  };

  const handleManualScore = (applicantId) => {
    setManualScoreApplicantId(applicantId);
    setScoreMode('manual');
    setJobDescriptionInput('');
    setShowScoreModal(true);
  };

  const handleViewScoreDetails = async (applicantId) => {
    try {
      const response = await fetch(`${BASE_URL}/api/ats/${applicantId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const applicant = data.data;
        
        if (applicant.resume_score) {
          let matchedSkills = [];
          let missingSkills = [];
          
          if (applicant.matched_skills) {
            try {
              matchedSkills = typeof applicant.matched_skills === 'string' 
                ? JSON.parse(applicant.matched_skills)
                : applicant.matched_skills;
            } catch (e) {
              matchedSkills = [];
            }
          }
          
          if (applicant.missing_skills) {
            try {
              missingSkills = typeof applicant.missing_skills === 'string'
                ? JSON.parse(applicant.missing_skills)
                : applicant.missing_skills;
            } catch (e) {
              missingSkills = [];
            }
          }

          const validDetails = {
            score: applicant.resume_score || 0,
            summary: `Resume score: ${applicant.resume_score}%`,
            matchedSkills: Array.isArray(matchedSkills) ? matchedSkills : [],
            missingSkills: Array.isArray(missingSkills) ? missingSkills : []
          };
          
          setSelectedScoreDetails(validDetails);
          setShowScoreDetailsModal(true);
          return;
        }
      }
      
      let details = scoreDetails[applicantId];
      
      if (details && details.score !== undefined) {
        const validDetails = {
          score: details.score || 0,
          summary: details.summary || 'Resume evaluated',
          matchedSkills: Array.isArray(details.matchedSkills) ? details.matchedSkills : [],
          missingSkills: Array.isArray(details.missingSkills) ? details.missingSkills : []
        };
        
        setSelectedScoreDetails(validDetails);
        setShowScoreDetailsModal(true);
      } else {
        setError('⚠️ Score details not available. Please score the resume first to see detailed breakdown.');
        setTimeout(() => setError(''), 4000);
      }
      
    } catch (err) {
      console.error('❌ Error fetching applicant data:', err);
      setError('⚠️ Could not load score details. Please try again.');
      setTimeout(() => setError(''), 4000);
    }
  };

  const closeScoreModal = () => {
    setShowScoreModal(false);
    setManualScoreApplicantId(null);
    setJobDescriptionInput('');
    setScoreMode('auto');
  };

  return (
    <div className="applicants-table-wrapper">
      {error && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: (error.includes('✅') || error.includes('submitted')) ? '#d4edda' : '#f8d7da',
          color: (error.includes('✅') || error.includes('submitted')) ? '#155724' : '#721c24',
          padding: '12px 20px',
          borderRadius: '4px',
          border: (error.includes('✅') || error.includes('submitted')) ? '1px solid #c3e6cb' : '1px solid #f5c6cb',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          zIndex: 10003,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minWidth: '300px',
          maxWidth: '500px',
          animation: 'slideInRight 0.4s ease-out',
          transition: 'all 0.3s ease'
        }}>
          <style>{`
            @keyframes slideInRight {
              from {
                transform: translateX(400px);
                opacity: 0;
              }
              to {
                transform: translateX(0);
                opacity: 1;
              }
            }
          `}</style>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              backgroundColor: (error.includes('✅') || error.includes('submitted')) ? '#28a745' : '#dc3545',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              {(error.includes('✅') || error.includes('submitted')) ? '✓' : '!'}
            </div>
            <span style={{ fontSize: '14px', fontWeight: '500' }}>{error}</span>
          </div>
          <button
            onClick={() => setError('')}
            style={{
              background: 'none',
              border: 'none',
              color: (error.includes('✅') || error.includes('submitted')) ? '#155724' : '#721c24',
              fontSize: '18px',
              cursor: 'pointer',
              padding: '0',
              marginLeft: '10px',
              transition: 'transform 0.2s ease'
            }}
            onMouseEnter={(e) => e.target.style.transform = 'rotate(90deg)'}
            onMouseLeave={(e) => e.target.style.transform = 'rotate(0deg)'}
          >
            ×
          </button>
        </div>
      )}

      <div className="applicants-filters-section">
        <div className="applicants-search-box">
          <Search size={18} className="applicants-search-icon" />
          <input
            type="text"
            placeholder="Search by name, email, phone, or job ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="applicants-search-input"
          />
        </div>

        <div className="applicants-filter-box">
          <Filter size={18} className="applicants-filter-icon" />
          <select
            value={filterPosition}
            onChange={(e) => setFilterPosition(e.target.value)}
            className="applicants-filter-select"
          >
            {['All', ...new Set(localApplicants.map(a => a.position))].map(position => (
              <option key={position} value={position}>
                {position}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="applicants-table-container">
        <table className="applicants-data-table">
          <thead className="applicants-table-head">
            <tr className="applicants-header-row">
              <th className="applicants-header-cell">Job ID</th>
              <th className="applicants-header-cell">First Name</th>
              <th className="applicants-header-cell">Last Name</th>
              <th className="applicants-header-cell">Email</th>
              <th className="applicants-header-cell">Phone</th>
              <th className="applicants-header-cell">Position</th>
              <th className="applicants-header-cell">Visa Type</th>
              <th className="applicants-header-cell">State</th>
              <th className="applicants-header-cell">City</th>
              <th className="applicants-header-cell">Employment Type</th>
              <th className="applicants-header-cell">Resume Score</th>
              <th className="applicants-header-cell">Date Applied</th>
              <th className="applicants-header-cell">Actions</th>
            </tr>
          </thead>
          <tbody className="applicants-table-body">
            {filteredApplicants.length > 0 ? (
              filteredApplicants.map((applicant) => (
                <tr key={applicant.id} className="applicants-body-row">
                  <td className="applicants-body-cell">
                    <span className="applicants-jobid-badge">
                      {applicant.job_id || 'N/A'}
                    </span>
                  </td>
                  <td className="applicants-body-cell">{applicant.first_name}</td>
                  <td className="applicants-body-cell">{applicant.last_name}</td>
                  <td className="applicants-body-cell">
                    <a href={`mailto:${applicant.email}`} className="applicants-email-link">
                      {applicant.email}
                    </a>
                  </td>
                  <td className="applicants-body-cell">
                    <a href={`tel:${applicant.phone}`} className="applicants-phone-link">
                      {applicant.phone}
                    </a>
                  </td>
                  <td className="applicants-body-cell">
                    <span className="applicants-position-badge">{applicant.position}</span>
                  </td>
                  <td className="applicants-body-cell">
                    <span className="applicants-visa-badge">{applicant.visa_type || 'N/A'}</span>
                  </td>
                  <td className="applicants-body-cell">{applicant.current_state || 'N/A'}</td>
                  <td className="applicants-body-cell">{applicant.current_city || 'N/A'}</td>
                  <td className="applicants-body-cell">
                    <span className="applicants-employment-badge">{applicant.employment_type || 'N/A'}</span>
                  </td>
                  <td className="applicants-body-cell">
                    {applicant.resume_score ? (
                      <div className="applicants-score-container">
                        <div 
                          className="applicants-score-badge"
                          style={{ backgroundColor: getScoreColor(applicant.resume_score) }}
                        >
                          {applicant.resume_score}%
                        </div>
                        <div className="applicants-score-label">
                          {getScoreLabel(applicant.resume_score)}
                        </div>
                        <button
                          onClick={() => handleViewScoreDetails(applicant.id)}
                          style={{
                            marginTop: '5px',
                            padding: '4px 8px',
                            backgroundColor: 'transparent',
                            color: '#1a6f66ff',
                            border: '1px solid #1a6f66ff',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontSize: '10px',
                            fontWeight: '500',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#1a6f66ff';
                            e.target.style.color = 'white';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'transparent';
                            e.target.style.color = '#1a6f66ff';
                          }}
                        >
                          View Details
                        </button>
                      </div>
                    ) : (
                      <>
                        {applicant.job_id ? (
                          <button
                            className="applicants-score-btn"
                            onClick={() => handleAutoScore(applicant.id, applicant.job_id)}
                            title="Score Resume with AI (Auto)"
                            disabled={loading}
                            style={{
                              padding: '5px 8px',
                              fontSize: '11px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px'
                            }}
                          >
                            <Zap size={14} />
                            Auto
                          </button>
                        ) : (
                          <button
                            onClick={() => handleManualScore(applicant.id)}
                            title="Score Resume Manually"
                            disabled={loading}
                            style={{
                              padding: '5px 8px',
                              fontSize: '11px',
                              backgroundColor: '#6c757d',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#5a6268'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = '#6c757d'}
                          >
                            Manual
                          </button>
                        )}
                      </>
                    )}
                  </td>
                  <td className="applicants-body-cell">
                    {applicant.created_at 
                      ? new Date(applicant.created_at).toLocaleDateString()
                      : 'N/A'
                    }
                  </td>
                  <td className="applicants-body-cell applicants-actions-cell">
                    <div className="applicants-actions-group">
                      {/* ✅ SUBMIT RESUME BUTTON */}
                      <button
                        className="applicants-action-btn applicants-submit-resume-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDirectSubmitResume(applicant);
                        }}
                        title="Submit to Recruitment Dashboard"
                        disabled={loading || submittingApplicantId === applicant.id}
                        style={{
                          backgroundColor: submittingApplicantId === applicant.id ? '#cccccc' : '#1a6f66ff',
                          color: 'white',
                          border: 'none',
                          padding: '6px 10px',
                          borderRadius: '4px',
                          cursor: loading || submittingApplicantId === applicant.id ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          opacity: loading || submittingApplicantId === applicant.id ? 0.6 : 1,
                          transition: 'all 0.2s ease',
                          position: 'relative'
                        }}
                        onMouseEnter={(e) => {
                          if (!loading && submittingApplicantId !== applicant.id) {
                            e.target.style.backgroundColor = '#145c54';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!loading && submittingApplicantId !== applicant.id) {
                            e.target.style.backgroundColor = '#1a6f66ff';
                          }
                        }}
                      >
                        {submittingApplicantId === applicant.id ? (
                          <span style={{ fontSize: '12px' }}>Submitting...</span>
                        ) : (
                          <>
                            <Link2 size={14} />
                            {/* <span style={{ fontSize: '12px' }}>Submit</span> */}
                          </>
                        )}
                      </button>

                      {/* ✅ DOWNLOAD RESUME BUTTON */}
                      <button
                        className="applicants-action-btn applicants-download-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(applicant.id, applicant.first_name, applicant.last_name);
                        }}
                        title="Download Resume"
                        disabled={loading}
                      >
                        <Download size={18} className="applicants-action-icon" />
                      </button>

                      {/* ✅ DELETE APPLICANT BUTTON */}
                      <button
                        className="applicants-action-btn applicants-delete-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirm(applicant.id);
                        }}
                        title="Delete Applicant"
                        disabled={loading}
                      >
                        <Trash2 size={18} className="applicants-action-icon" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr className="applicants-no-results-row">
                <td colSpan="13" className="applicants-no-results-cell">
                  {localApplicants.length === 0 ? 'No applicants yet' : 'No applicants found matching your search'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="applicants-table-footer">
        <p className="applicants-footer-text">
          Showing {filteredApplicants.length} of {localApplicants.length} applicants
        </p>
      </div>

      {/* Manual Score Modal */}
      {showScoreModal && scoreMode === 'manual' && (
        <div className="applicants-modal-overlay" onClick={closeScoreModal}>
          <div className="applicants-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 className="applicants-modal-title">Score Resume Manually</h3>
              <button
                onClick={closeScoreModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                <X size={24} />
              </button>
            </div>

            <div style={{ padding: '0 20px 20px 20px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600', color: '#333' }}>
                Job Description
              </label>
              <p style={{ fontSize: '13px', color: '#666', marginBottom: '12px' }}>
                Paste the job description below and we'll score the applicant's resume against it.
              </p>
              <textarea
                value={jobDescriptionInput}
                onChange={(e) => setJobDescriptionInput(e.target.value)}
                placeholder="Paste job description here..."
                style={{
                  width: '100%',
                  minHeight: '250px',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontFamily: 'Arial, sans-serif',
                  fontSize: '13px',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div className="applicants-modal-actions" style={{ padding: '0 20px 20px 20px' }}>
              <button
                className="applicants-modal-btn applicants-modal-cancel"
                onClick={closeScoreModal}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className="applicants-modal-btn"
                onClick={() => handleScoreResume(manualScoreApplicantId, false)}
                disabled={loading || !jobDescriptionInput.trim()}
                style={{
                  backgroundColor: '#1a6f66ff',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '4px',
                  cursor: loading || !jobDescriptionInput.trim() ? 'not-allowed' : 'pointer',
                  opacity: loading || !jobDescriptionInput.trim() ? 0.6 : 1,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!loading && jobDescriptionInput.trim()) {
                    e.target.style.backgroundColor = '#145c54';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading && jobDescriptionInput.trim()) {
                    e.target.style.backgroundColor = '#1a6f66ff';
                  }
                }}
              >
                {loading ? 'Scoring...' : 'Score Resume'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Score Details Modal */}
      {showScoreDetailsModal && selectedScoreDetails && (
        <div className="applicants-modal-overlay" onClick={() => setShowScoreDetailsModal(false)}>
          <div className="applicants-modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="applicants-modal-title">Resume Score Details</h3>
            
            <div style={{ padding: '20px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '20px',
                justifyContent: 'center'
              }}>
                <div style={{
                  fontSize: '48px',
                  fontWeight: 'bold',
                  color: getScoreColor(selectedScoreDetails.score),
                  marginRight: '20px'
                }}>
                  {selectedScoreDetails.score}%
                </div>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#333' }}>
                    {getScoreLabel(selectedScoreDetails.score)}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    {selectedScoreDetails.summary}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ marginBottom: '10px', fontWeight: '600', color: '#333' }}>
                  ✓ Matched Skills ({selectedScoreDetails.matchedSkills?.length || 0})
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {selectedScoreDetails.matchedSkills && selectedScoreDetails.matchedSkills.length > 0 ? (
                    selectedScoreDetails.matchedSkills.map((skill, idx) => (
                      <span key={idx} style={{
                        backgroundColor: '#d4edda',
                        color: '#155724',
                        padding: '6px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {String(skill).trim()}
                      </span>
                    ))
                  ) : (
                    <p style={{ color: '#999', fontSize: '13px' }}>No matched skills found</p>
                  )}
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ marginBottom: '10px', fontWeight: '600', color: '#333' }}>
                  ✗ Missing Skills ({selectedScoreDetails.missingSkills?.length || 0})
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {selectedScoreDetails.missingSkills && selectedScoreDetails.missingSkills.length > 0 ? (
                    selectedScoreDetails.missingSkills.map((skill, idx) => (
                      <span key={idx} style={{
                        backgroundColor: '#f8d7da',
                        color: '#721c24',
                        padding: '6px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {String(skill).trim()}
                      </span>
                    ))
                  ) : (
                    <p style={{ color: '#999', fontSize: '13px' }}>No missing skills identified</p>
                  )}
                </div>
              </div>
            </div>

            <div className="applicants-modal-actions">
              <button
                className="applicants-modal-btn applicants-modal-cancel"
                onClick={() => setShowScoreDetailsModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="applicants-modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="applicants-modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="applicants-modal-title">Delete Applicant?</h3>
            <p className="applicants-modal-message">
              This action cannot be undone. The applicant's information and resume will be permanently deleted.
            </p>
            <div className="applicants-modal-actions">
              <button
                className="applicants-modal-btn applicants-modal-cancel"
                onClick={() => setDeleteConfirm(null)}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className="applicants-modal-btn applicants-modal-delete"
                onClick={() => handleDelete(deleteConfirm)}
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}