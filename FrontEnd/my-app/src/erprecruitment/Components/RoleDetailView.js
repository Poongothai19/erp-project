import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import BASE_URL from '../../url';
import '../styles/erprecruitment.css';
import '../styles/RoleDetailView.css';
import { 
    ChevronLeft, 
    Building, 
    MapPin, 
    Hash,
    Layers,
    XCircle,
    FileText,
    Trash2,
    Activity,
    Briefcase,
    Calendar,
    User,
    Globe,
    Award,
    DollarSign,
    Users,
    Clock
} from 'lucide-react';
import { formatLocation } from '../config/locationConfig';
import ResumeSubmissionModal from './ResumeSubmissionModal';
import EditApplicationModal from './EditApplicationModal';
import SourceCandidateModal from './SourceCandidateModal';

const RoleDetailView = () => {
    const { roleId } = useParams();
    const navigate = useNavigate();
    const [role, setRole] = useState(null);
    const [applications, setApplications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hiringSteps, setHiringSteps] = useState([]);
    const [applicationResumes, setApplicationResumes] = useState({});
    const [applicationNotes, setApplicationNotes] = useState({});
    const [expandedCandidateId, setExpandedCandidateId] = useState(null);
    const [showHiringProcess, setShowHiringProcess] = useState({});
    const [resumeLoading, setResumeLoading] = useState(false);
    const [showResumeModal, setShowResumeModal] = useState(false);
    const [currentResumeUrl, setCurrentResumeUrl] = useState('');
    const [currentCandidateName, setCurrentCandidateName] = useState('');
    const [userRole, setUserRole] = useState(localStorage.getItem('role'));

    const [showResumeSubmissionModal, setShowResumeSubmissionModal] = useState(false);
    const [showEditApplicationModal, setShowEditApplicationModal] = useState(false);
    const [showSourceCandidateModal, setShowSourceCandidateModal] = useState(false);
    const [applicationToEdit, setApplicationToEdit] = useState(null);

    const formatCurrency = (amount, currencyCode) => {
        if (amount === undefined || amount === null) return 'N/A';
        const symbols = { 'INR': '₹', 'USD': '$', 'CAD': '$', 'EUR': '€', 'GBP': '£' };
        return `${symbols[currencyCode] || currencyCode}${amount.toLocaleString()}`;
    };

    const formatDateTime = (dateStr) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleString();
    };

    const fetchApplicationResumes = useCallback(async (applicationId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${BASE_URL}/api/recruitment/applications/${applicationId}/resumes`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setApplicationResumes(prev => ({ ...prev, [applicationId]: response.data }));
        } catch (error) {
            console.error(`Error fetching resumes:`, error);
        }
    }, []);

    const fetchApplicationStepNotes = useCallback(async (applicationId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${BASE_URL}/api/recruitment/applications/${applicationId}/step-notes`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const notesMap = {};
            response.data.forEach(note => { notesMap[note.stepIndex] = note.notes; });
            setApplicationNotes(prev => ({ ...prev, [applicationId]: notesMap }));
        } catch (error) {
            console.error(`Error fetching notes:`, error);
        }
    }, []);

    const fetchApplications = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${BASE_URL}/api/recruitment/applications/role/${roleId}/with-resumes`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setApplications(response.data);
            
            for (const app of response.data) {
                if (app.resumeCount > 0) fetchApplicationResumes(app.id);
                fetchApplicationStepNotes(app.id);
            }
        } catch (error) {
            console.error('Error fetching applications:', error);
        }
    }, [roleId, fetchApplicationResumes, fetchApplicationStepNotes]);

    const fetchRoleData = useCallback(async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get(`${BASE_URL}/api/recruitment/roles/${roleId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRole(response.data);
            await fetchApplications();
            
            const stepsResponse = await axios.get(`${BASE_URL}/api/recruitment/applications/hiring-steps`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setHiringSteps(stepsResponse.data);
        } catch (error) {
            console.error('Error fetching role details:', error);
        } finally {
            setIsLoading(false);
        }
    }, [roleId, fetchApplications]);

    useEffect(() => {
        fetchRoleData();
    }, [fetchRoleData]);

    const openEditApplicationModal = useCallback((app, e) => {
        if (e) e.stopPropagation();
        setApplicationToEdit(app);
        setShowEditApplicationModal(true);
    }, []);

    const closeEditApplicationModal = useCallback(() => {
        setShowEditApplicationModal(false);
        setApplicationToEdit(null);
    }, []);

    const calculateHiringStepCounts = (apps) => {
        const steps = hiringSteps.length > 0 ? hiringSteps : [];
        const counts = {};
        steps.forEach(s => { counts[s.stepName] = 0; });
        apps.forEach(app => {
            const step = steps[app.currentStep];
            if (step) counts[step.stepName]++;
        });
        return counts;
    };

    const toggleCandidateExpand = (appId, e) => {
        e.stopPropagation();
        setExpandedCandidateId(expandedCandidateId === appId ? null : appId);
    };

    const toggleHiringProcess = (applicationId, e) => {
        e.stopPropagation();
        setShowHiringProcess(prev => ({ ...prev, [applicationId]: !prev[applicationId] }));
    };

    const viewResume = async (resumeId, applicationId, e) => {
        e.stopPropagation();
        try {
            setResumeLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get(`${BASE_URL}/api/recruitment/applications/${applicationId}/resume/${resumeId}`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });

            if (!response.data || response.data.size === 0) {
              throw new Error('Received an empty resume file');
            }
            
            const fileURL = URL.createObjectURL(response.data);
            setCurrentResumeUrl(fileURL);
            const app = applications.find(a => a.id === applicationId);
            setCurrentCandidateName(app ? app.name : 'Candidate');
            setShowResumeModal(true);
        } catch (error) {
            console.error('Error viewing resume:', error);
            Swal.fire({
                title: 'Error Rendering PDF',
                text: 'The resume file appears to be corrupted or could not be retrieved from the database.',
                icon: 'error'
            });
        } finally {
            setResumeLoading(false);
        }
    };

    const advanceStep = async (applicationId, currentStepIndex, e) => {
        if (e) e.stopPropagation();
        const result = await Swal.fire({
            title: 'Advance Candidate?',
            text: "Move this candidate to the next step?",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#1a6f66',
            confirmButtonText: 'Yes, advance'
        });
        if (!result.isConfirmed) return;
        try {
            const token = localStorage.getItem('token');
            const newIndex = currentStepIndex + 1;
            let status = 'In Progress';
            if (newIndex === hiringSteps.length - 2) status = 'Offer Extended';
            else if (newIndex === hiringSteps.length - 1) status = 'Hired';
            await axios.put(`${BASE_URL}/api/recruitment/applications/${applicationId}/status`, 
                { currentStep: newIndex, status },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            Swal.fire({ title: 'Success!', icon: 'success', timer: 1500, showConfirmButton: false });
            fetchApplications();
        } catch (error) {
            Swal.fire('Error', 'Failed to advance step.', 'error');
        }
    };

    const rejectCandidate = async (applicationId, app, e) => {
        if (e) e.stopPropagation();
        const result = await Swal.fire({
            title: 'Reject Candidate?',
            text: `REJECT ${app.name}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Yes, reject'
        });
        if (!result.isConfirmed) return;
        try {
            const token = localStorage.getItem('token');
            
            // Find the index of the "REJECTED" step in hiringSteps (case-insensitive)
            // If not found, use the last step index
            const rejectedStepIndex = hiringSteps.findIndex(s => s.stepName.toUpperCase() === 'REJECTED');
            const targetStep = rejectedStepIndex !== -1 ? rejectedStepIndex : (hiringSteps.length - 1);
            
            await axios.put(`${BASE_URL}/api/recruitment/applications/${applicationId}/status`,
                { 
                    status: 'Rejected', 
                    currentStep: targetStep, 
                    stepName: hiringSteps[targetStep]?.stepName 
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            Swal.fire({ title: 'Rejected', icon: 'info', timer: 1500, showConfirmButton: false });
            fetchApplications();
        } catch (error) {
            Swal.fire('Error', 'Failed to update status.', 'error');
        }
    };

    const getInitials = (name) => {
        if (!name) return '??';
        const parts = name.trim().split(/\s+/);
        return parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
    };

    const deleteApplication = async (applicationId, name, e) => {
        if (e) e.stopPropagation();
        const result = await Swal.fire({
            title: 'Delete?',
            text: `Permanently delete ${name}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Yes, delete'
        });
        if (!result.isConfirmed) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${BASE_URL}/api/recruitment/applications/${applicationId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            Swal.fire('Deleted!', 'Removed successfully.', 'success');
            fetchApplications();
        } catch (error) {
            Swal.fire('Error', 'Failed to delete.', 'error');
        }
    };

    const generateHiringSteps = (app) => {
        if (!hiringSteps || hiringSteps.length === 0) return null;
        return (
            <div className="rd-pipeline-steps-container">
                {hiringSteps.map((step, index) => {
                    const isRejectedState = app.status === 'Rejected';
                    const isCompleted = index < app.currentStep;
                    const isCurrent = index === app.currentStep;
                    const isRejected = isRejectedState && isCurrent;
                    const isHired = app.status === 'Hired' && index === hiringSteps.length - 1;
                    
                    let cls = 'rd-step-pending';
                    if (isRejected) cls = 'rd-step-rejected';
                    else if (isHired || (isCompleted && !isRejectedState)) cls = 'rd-step-completed';
                    else if (isCurrent && !isRejectedState) cls = 'rd-step-current';
                    else if (isCurrent && isRejectedState) cls = 'rd-step-rejected'; // Double safeguard

                    const canAdv = isCurrent && !isRejected && !isHired && index < hiringSteps.length - 1;
                    return (
                        <div key={index} className={`rd-pipeline-step ${cls} ${canAdv ? 'rd-step-advanceable' : ''}`}
                            onClick={(e) => canAdv && advanceStep(app.id, index, e)}>
                            <div className="rd-step-number">{isHired || (isCompleted && !isRejected) ? '✓' : isRejected ? '✗' : index + 1}</div>
                            <div className="rd-step-label">{step.stepName}</div>
                            {isCurrent && !isRejected && !isHired && (
                                <button className="rd-reject-step-btn" onClick={(e) => rejectCandidate(app.id, app, e)}><XCircle size={14} /></button>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderExpandedDetails = (app) => {
        const submittedDate = formatDateTime(app.appliedAt || app.created_at || app.submittedAt || app.submitted_at);
        return (
            <div className="candidate-expanded-content">
                <div className="submission-audit-row">
                    <span><strong>Submitted:</strong> {submittedDate}</span>
                    <span className="submitted-by"><strong>Submitted by:</strong> {app.submittedBy || 'admin'}</span>
                </div>

                <div className="detail-grid-section">
                    <h4>Personal Information</h4>
                    <div className="expanded-detail-grid">
                        <div className="detail-field"><label>First Name</label><span>{app.candidateFirstName || 'N/A'}</span></div>
                        <div className="detail-field"><label>Last Name</label><span>{app.candidateLastName || 'N/A'}</span></div>
                        <div className="detail-field"><label>Email</label><span>{app.email}</span></div>
                        <div className="detail-field"><label>Phone</label><span>{app.phone}</span></div>
                        <div className="detail-field"><label>Date of Birth</label><span>{app.dateOfBirth ? new Date(app.dateOfBirth).toLocaleDateString() : 'N/A'}</span></div>
                        <div className="detail-field"><label>Current Location</label><span>{app.currentLocation || 'N/A'}</span></div>
                        <div className="detail-field"><label>LinkedIn</label>{app.linkedInUrl ? <a href={app.linkedInUrl} target="_blank" rel="noopener noreferrer">Link</a> : 'N/A'}</div>
                        <div className="detail-field"><label>Passport</label><span>{app.passport || 'N/A'}</span></div>
                        <div className="detail-field"><label>Work Auth</label><span>{app.workAuthorization || 'N/A'}</span></div>
                        <div className="detail-field"><label>Date Availability</label><span>{app.dateAvailability ? new Date(app.dateAvailability).toLocaleDateString() : 'N/A'}</span></div>
                    </div>
                </div>

                <div className="detail-grid-section">
                <h4>Professional Details</h4>
                <div className="expanded-detail-grid">
                    <div className="detail-field"><label>Total IT Experience</label><span>{app.totalITExperience || app.experience || 'N/A'} {app.totalITExperience || app.experience ? 'Years' : ''}</span></div>
                    <div className="detail-field"><label>Relevant Experience</label><span>{app.relevantExperience || 'N/A'} {app.relevantExperience ? 'Years' : ''}</span></div>
                    <div className="detail-field"><label>Current Company</label><span>{app.currentCompany || 'N/A'}</span></div>
                    <div className="detail-field"><label>Current Employer</label><span>{app.currentEmployer || 'N/A'}</span></div>
                    <div className="detail-field"><label>Expected Salary</label><span>{app.expectedSalary || 'N/A'}</span></div>
                    <div className="detail-field"><label>Rate</label><span>{app.rate || 'N/A'}</span></div>
                    <div className="detail-field"><label>Notice Period</label><span>{app.noticePeriod} Days</span></div>
                    <div className="detail-field"><label>Highest Degree</label><span>{app.highestDegree || 'N/A'}</span></div>
                    <div className="detail-field full-width"><label>Skills</label><span className="skills-tags">{app.skills}</span></div>
                    <div className="detail-field full-width"><label>Current Employer Address</label><span>{app.currentEmployerAddress || 'N/A'}</span></div>
                </div>
            </div>

            {(app.isFormerTCSEmployee || app.isFormerTCSBusinessAssociate) && (
                <div className="detail-grid-section">
                    <h4>TCS Information</h4>
                    <div className="expanded-detail-grid">
                        <div className="detail-field"><label>Former TCS Employee</label><span>{app.isFormerTCSEmployee ? 'Yes' : 'No'}</span></div>
                        {app.isFormerTCSEmployee && <div className="detail-field"><label>TCS Employee ID</label><span>{app.tcsEmployeeId || 'N/A'}</span></div>}
                        <div className="detail-field"><label>Former TCS Business Associate</label><span>{app.isFormerTCSBusinessAssociate ? 'Yes' : 'No'}</span></div>
                        {app.isFormerTCSBusinessAssociate && <div className="detail-field"><label>TCS Business Associate ID</label><span>{app.tcsBusinessAssociateId || 'N/A'}</span></div>}
                    </div>
                </div>
            )}

            <div className="expanded-actions-row">
                <div className="resumes-list">
                    <label>Resumes:</label>
                    {applicationResumes[app.id]?.length > 0 ? (
                        <div className="resume-chips">
                            {applicationResumes[app.id].map(res => (
                                <button key={res.id} className="resume-link" onClick={(e) => viewResume(res.id, app.id, e)}>
                                    <FileText size={12} /> {res.resumeFileName}
                                </button>
                            ))}
                        </div>
                    ) : <span className="no-data">None</span>}
                </div>
            </div>
        </div>
    );
    };   

    if (isLoading) return <div className="role-detail-loading"><div className="spinner"></div><p>Loading...</p></div>;
    if (!role) return <div className="role-detail-error">Role not found.</div>;

    const hiringStepCounts = calculateHiringStepCounts(applications);

    return (
        <div className="role-detail-page-container">
            <div className="role-detail-top-nav">
                <button className="back-link-btn" onClick={() => navigate(-1)}><ChevronLeft size={18} /> Back</button>
            </div>

            <div className="role-detail-main-header">
                <div className="title-section">
                    <h1>{role.role}</h1>
                    <div className="badge-group">
                        <span className={`status-badge ${role.status?.toLowerCase()}`}>{role.status}</span>
                        <span className={`urgency-badge ${role.urgency?.toLowerCase()}`}>{role.urgency}</span>
                    </div>
                </div>
            </div>

            <div className="rd-bento-grid">
                <div className="rd-bento-item rd-summary-box">
                    <div className="card-header">
                        <h2>Role Summary</h2>
                        <div style={{ display: 'flex', gap: '4px' }}>
                            <button className="source-candidate-btn" onClick={() => setShowSourceCandidateModal(true)}>Source Candidate</button>
                            <button className="recruitment-submit-resume-btn" onClick={() => setShowResumeSubmissionModal(true)}>Submit Resume</button>
                        </div>
                    </div>
                    <div className="hiring-progress-summary">
                        <div className="summary-title"><h3>Pipeline</h3><span>Total: {applications.length}</span></div>
                        <div className="stats-grid">
                            {Object.entries(hiringStepCounts).map(([name, count]) => (
                                <div key={name} className="stat-box"><div className="stat-count">{count}</div><div className="stat-name">{name}</div></div>
                            ))}
                        </div>
                    </div>
                    <div className="details-section">
                        <div className="detail-item">
                            <div className="detail-label"><Hash size={14} /><label>Job ID</label></div>
                            <span>{role.jobId || 'N/A'}</span>
                        </div>
                        {role.roleCategory?.trim().toLowerCase() !== 'offshore' && (
                            <div className="detail-item">
                                <div className="detail-label"><Layers size={14} /><label>GBAMS ID</label></div>
                                <span>{role.gbamsId || 'N/A'}</span>
                            </div>
                        )}
                        <div className="detail-item">
                            <div className="detail-label"><Activity size={14} /><label>System ID</label></div>
                            <span>JOB-{String(role.id).padStart(5, '0')}</span>
                        </div>
                        <div className="detail-item" data-tooltip={role.role}>
                            <div className="detail-label"><Briefcase size={14} /><label>Role Title</label></div>
                            <span>{role.role || 'N/A'}</span>
                        </div>
                        <div className="detail-item">
                            <div className="detail-label"><Activity size={14} /><label>Role Type</label></div>
                            <span>{role.roleType || 'N/A'}</span>
                        </div>
                        <div className="detail-item">
                            <div className="detail-label"><Calendar size={14} /><label>Created</label></div>
                            <span>{formatDateTime(role.created_at)}</span>
                        </div>
                        <div className="detail-item">
                            <div className="detail-label"><Building size={14} /><label>Client</label></div>
                            <span>{role.client || 'N/A'}</span>
                        </div>
                        <div className="detail-item">
                            <div className="detail-label"><User size={14} /><label>Client POC</label></div>
                            <span>{role.clientPocName || 'N/A'}</span>
                        </div>
                        <div className="detail-item" data-tooltip={formatLocation(role)}>
                            <div className="detail-label"><MapPin size={14} /><label>Location</label></div>
                            <span>{formatLocation(role)}</span>
                        </div>
                        <div className="detail-item">
                            <div className="detail-label"><Globe size={14} /><label>Work Mode</label></div>
                            <span>{role.roleLocation || 'N/A'}</span>
                        </div>
                        <div className="detail-item">
                            <div className="detail-label"><MapPin size={14} /><label>Role Category</label></div>
                            <span>{role.roleCategory?.trim().toLowerCase() === 'offshore' ? 'Offshore' : 'Onsite'}</span>
                        </div>
                        <div className="detail-item">
                            <div className="detail-label"><Award size={14} /><label>Experience</label></div>
                            <span>{role.experience || 'N/A'}</span>
                        </div>
                        <div className="detail-item">
                            <div className="detail-label"><DollarSign size={14} /><label>Rate Range</label></div>
                            <span>
                                {role.minRate !== undefined && role.minRate !== null && role.maxRate !== undefined && role.maxRate !== null 
                                    ? `${formatCurrency(role.minRate, role.currency)} - ${formatCurrency(role.maxRate, role.currency)}${role.currency === 'INR' ? '/month' : '/hr'}` 
                                    : 'N/A'}
                            </span>
                        </div>
                        <div className="detail-item">
                            <div className="detail-label"><Users size={14} /><label>Vendor</label></div>
                            <span>{role.vendorName || 'N/A'}</span>
                        </div>
                        <div className="detail-item">
                            <div className="detail-label"><Globe size={14} /><label>Visa Types</label></div>
                            <span>{role.visaTypes || 'N/A'}</span>
                        </div>
                        <div className="detail-item">
                            <div className="detail-label"><Clock size={14} /><label>Urgency</label></div>
                            <span className={`urgency-text ${role.urgency?.toLowerCase()}`}>{role.urgency || 'Normal'}</span>
                        </div>
                        <div className="detail-item">
                            <div className="detail-label"><Activity size={14} /><label>Status</label></div>
                            <span className={`status-text ${role.status?.toLowerCase()}`}>{role.status || 'Active'}</span>
                        </div>
                        <div className="detail-item">
                            <div className="detail-label"><Calendar size={14} /><label>Start Date</label></div>
                            <span>{formatDateTime(role.startDate)}</span>
                        </div>
                        <div className="detail-item">
                            <div className="detail-label"><Calendar size={14} /><label>End Date</label></div>
                            <span>{formatDateTime(role.endDate)}</span>
                        </div>
                    </div>
                </div>

                <div className="rd-bento-item rd-description-box">
                    <div className="card-header"><h2>Job Description</h2></div>
                    <div className="description-content-full" dangerouslySetInnerHTML={{ __html: role.jobDescription || 'No description.' }} />
                </div>

                <div className="rd-bento-item rd-candidates-box">
                    <div className="section-header"><h2>Applications ({applications.length})</h2></div>
                    {applications.length === 0 ? (
                        <div className="no-candidates-state"><h3>No Applications</h3></div>
                    ) : (
                        <div className="candidates-list">
                            {applications.map(app => (
                                <div key={app.id} className="candidate-card">
                                    <div className="candidate-header">
                                        <div className="candidate-info-wrapper">
                                            <div className="candidate-avatar">{getInitials(app.name)}</div>
                                            <div className="candidate-info"><h3>{app.name}</h3><p>{app.email} | {app.phone}</p></div>
                                        </div>
                                        <div className="candidate-actions">
                                            <button className="edit-btn" onClick={(e) => openEditApplicationModal(app, e)}>Edit</button>
                                            <button className="delete-btn" onClick={(e) => deleteApplication(app.id, app.name, e)}><Trash2 size={16} /></button>
                                            <button className="expand-btn" onClick={(e) => toggleCandidateExpand(app.id, e)}>{expandedCandidateId === app.id ? 'Less ▲' : 'More ▼'}</button>
                                        </div>
                                    </div>
                                    <div className="hiring-pipeline-view">
                                        <div className="pipeline-header" onClick={(e) => toggleHiringProcess(app.id, e)}>
                                            <span><strong>Status:</strong> {app.status}</span>
                                            <span>{showHiringProcess[app.id] ? '▲' : '▼'}</span>
                                        </div>
                                        {showHiringProcess[app.id] && <div className="pipeline-steps">{generateHiringSteps(app)}</div>}
                                    </div>
                                    {expandedCandidateId === app.id && renderExpandedDetails(app)}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {showResumeModal && (
                <div className="recruitment-modal" onClick={() => setShowResumeModal(false)}>
                    <div className="recruitment-modal-content" style={{ maxWidth: '1000px', height: '90vh' }} onClick={e => e.stopPropagation()}>
                        <div className="recruitment-modal-header"><h2>Resume: {currentCandidateName}</h2><span className="recruitment-close" onClick={() => setShowResumeModal(false)}>&times;</span></div>
                        <div className="recruitment-modal-body" style={{ height: 'calc(100% - 80px)', padding: 0 }}><iframe src={currentResumeUrl} width="100%" height="100%" title="Resume" /></div>
                    </div>
                </div>
            )}

            <ResumeSubmissionModal selectedRole={role} showResumeSubmissionModal={showResumeSubmissionModal} closeResumeSubmissionModal={() => setShowResumeSubmissionModal(false)} fetchApplications={fetchApplications} showNotification={() => {}} refreshRolesData={() => {}} />
            <EditApplicationModal showEditApplicationModal={showEditApplicationModal} applicationToEdit={applicationToEdit} closeEditApplicationModal={closeEditApplicationModal} fetchApplications={fetchApplications} selectedRole={role} showNotification={() => {}} applicationResumes={applicationResumes} fetchApplicationResumes={fetchApplicationResumes} viewResume={viewResume} />
            <SourceCandidateModal isOpen={showSourceCandidateModal} onClose={() => setShowSourceCandidateModal(false)} role={role} onProfileSubmitted={fetchApplications} />
        </div>
    );
};

export default RoleDetailView;
