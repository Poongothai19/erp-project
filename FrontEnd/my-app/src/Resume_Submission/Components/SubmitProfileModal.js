import React, { useState, useEffect } from 'react';
import { X, Search, Loader, Sparkles, Send } from 'lucide-react';
import Swal from 'sweetalert2';
import axios from 'axios';
import BASE_URL from '../../url';
import '../styles/ScheduleInterviewModals.css';

export const SubmitProfileModal = ({ isOpen, onClose, candidate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && candidate) {
      const fetchJobs = async () => {
        setLoading(true);
        try {
          const token = localStorage.getItem('token');
          // Request only roles from the last 3 days, and only Active ones
          const res = await axios.get(`${BASE_URL}/api/recruitment/roles?days=3&status=Active`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          // Get candidate matching data
          const candidateTitle = (candidate?.JobTitle || '').toLowerCase();
          const candidateSkills = (candidate?.Skills || []).map(s => 
            (typeof s === 'string' ? s : s?.SkillName || '').toLowerCase()
          ).filter(Boolean);

          // Filtering by last 3 days (72 hours)
          const threeDaysAgo = new Date();
          threeDaysAgo.setHours(threeDaysAgo.getHours() - 72);

          // Map and sort jobs by relevance
          const formattedJobs = res.data
            .filter(role => {
              // Filter by last 3 days
              const jobCreatedDate = role.createdAt ? new Date(role.createdAt) : new Date(0);
              return jobCreatedDate >= threeDaysAgo;
            })
            .map(role => {
              const jobTitle = (role.role || '').toLowerCase();
              const jobDesc = (role.jobDescription || '').toLowerCase();
              let score = 0;
              
              // Relevance Analysis
              // 1. Job Title Match
              if (candidateTitle && jobTitle.includes(candidateTitle)) score += 10;
              if (candidateTitle && candidateTitle.includes(jobTitle)) score += 5;
              
              // 2. Skills Match
              candidateSkills.forEach(skill => {
                if (jobTitle.includes(skill)) score += 3;
                if (jobDesc && jobDesc.includes(skill)) score += 2;
              });

              // Format location
              let location = role.location;
              if (!location || location === 'Not specified') {
                const parts = [role.city, role.state, role.country].filter(Boolean);
                location = parts.length > 0 ? parts.join(', ') : 'N/A';
              }

              return {
                id: role.id,
                jobId: role.jobId || role.systemId,
                title: String(role.role || 'N/A'),
                location: String(location || 'N/A'),
                workMode: String(role.roleLocation || 'N/A'),
                roleOwner: String(role.assignTo || 'N/A'),
                assignedRecruiters: String(Array.isArray(role.assignedRecruiters) ? role.assignedRecruiters.map(r => r.name).join(', ') : 'N/A') || 'N/A',
                createdAt: role.createdAt,
                score
              };
            });
          
          // Sort and filter by relevance
          const relevantJobs = formattedJobs
            .filter(job => job.score > 5)
            .sort((a, b) => b.score - a.score);
          
          setJobs(relevantJobs);
        } catch (error) {
          console.error('Error fetching jobs:', error);
          Swal.fire('Error', 'Failed to fetch jobs.', 'error');
        } finally {
          setLoading(false);
        }
      };
      
      fetchJobs();
    }
  }, [isOpen, candidate]);

  const handleSubmitProfile = async (job) => {
    const confirm = await Swal.fire({
      title: 'Submit Profile?',
      text: `Are you sure you want to submit ${candidate.FirstName} ${candidate.LastName} for the role "${job.title}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Submit',
      confirmButtonColor: '#229C8B'
    });

    if (!confirm.isConfirmed) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      
      // Building form data for recruitment application
      const formData = new FormData();
      formData.append('roleId', job.id);
      
      // Use the correct keys expected by applicationController.js
      formData.append('candidateFirstName', candidate.FirstName || '');
      formData.append('candidateLastName', candidate.LastName || '');
      formData.append('name', `${candidate.FirstName} ${candidate.LastName}`.trim());
      formData.append('email', candidate.Contact?.Email || '');
      formData.append('phone', candidate.Contact?.Phone || candidate.Mobile || '');
      formData.append('experience', candidate.YearsOfExperience || '');
      formData.append('location', candidate.CurrentLocation || '');
      formData.append('currentLocation', candidate.CurrentLocation || '');
      formData.append('linkedInUrl', candidate.LinkedInUrl || '');
      formData.append('skills', (candidate.Skills || []).map(s => typeof s === 'string' ? s : s.SkillName).join(', '));
      
      // More fields mapping
      formData.append('workAuthorization', candidate.WorkAuthorization || '');
      formData.append('currentCompany', (candidate.WorkExperience || [])[0]?.Company || '');
      formData.append('currentEmployerAddress', candidate.CurrentEmployerAddress || '');
      formData.append('expectedSalary', candidate.ExpectedRateFrom || '');
      formData.append('rate', candidate.CurrentRate || '');
      formData.append('highestDegree', (candidate.Education || [])[0]?.Degree || '');
      formData.append('currentEmployer', candidate.CurrentEmployer || '');
      formData.append('availability', candidate.Availability || '');
      formData.append('noticePeriod', candidate.NoticePeriod || ''); 
      
      // Professional experience mapping
      formData.append('totalITExperience', candidate.YearsOfExperience || '');
      formData.append('relevantExperience', candidate.RelevantExperience || '');
      formData.append('experience', candidate.YearsOfExperience || '');
      
      // TRY TO ATTACH RESUME FROM SERVER
      const candidateId = candidate.CandidateId || candidate.candidate_id;
      if (candidateId) {
        try {
          // Identify the DocumentId for the primary resume
          let documentId = candidate.Document?.DocumentId || 
                           (candidate.Documents || []).find(d => d.IsPrimary || d.IsPrimaryResume)?.DocumentId;
          
          // Fallback: If documentId is not in the object, find it via the documents endpoint
          if (!documentId) {
            console.log('🔍 Document ID not found on candidate object, fetching document list...');
            try {
              const docsRes = await axios.get(`${BASE_URL}/api/resumes/${candidateId}/documents`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              const primaryDoc = (docsRes.data || []).find(d => d.IsPrimary || d.IsPrimaryResume) || docsRes.data?.[0];
              documentId = primaryDoc?.DocumentId || primaryDoc?.documentId;
              if (documentId) console.log('✅ Found Document ID via API:', documentId);
            } catch (docErr) {
              console.warn('⚠️ Could not fetch documents list:', docErr.message);
            }
          }

          if (documentId) {
            const downloadUrl = `${BASE_URL}/api/resumes/${documentId}/download`;
            console.log('📄 Attempting to fetch resume from:', downloadUrl);
            
            const resumeRes = await axios.get(downloadUrl, {
              headers: { Authorization: `Bearer ${token}` },
              responseType: 'blob'
            });
            
            if (resumeRes.data && resumeRes.data.size > 0) {
              // Try to get original filename
              const contentDisp = resumeRes.headers['content-disposition'];
              let fileName = 'resume.pdf';
              if (contentDisp && contentDisp.includes('filename=')) {
                fileName = contentDisp.split('filename=')[1].replace(/[";]/g, '');
              }
              
              const file = new File([resumeRes.data], fileName, { type: resumeRes.data.type || 'application/pdf' });
              formData.append('resume', file);
              console.log('✅ Resume attached successfully:', fileName, `(${file.size} bytes)`);
            } else {
              console.warn('⚠️ Resume download returned empty data');
            }
          } else {
            console.warn('⚠️ No DocumentId found for candidate, skipping resume attachment');
          }
        } catch (error) {
          console.error('❌ Error fetching/attaching resume:', error.message);
        }
      } else {
        console.warn('⚠️ No CandidateId found to fetch resume');
      }
      
      // Log for debugging
      console.log('📤 Sending Application FormData:');
      for (let [key, value] of formData.entries()) {
        console.log(`  - ${key}:`, value instanceof File ? `File(${value.name})` : value);
      }

      const response = await axios.post(`${BASE_URL}/api/recruitment/applications`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        Swal.fire('Submitted!', 'Profile has been submitted successfully.', 'success');
        onClose();
      } else {
        throw new Error(response.data.message || 'Submission failed');
      }
    } catch (error) {
      console.error('Error submitting profile:', error);
      Swal.fire('Error', error.response?.data?.message || 'Failed to submit profile.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredJobs = jobs.filter(j => 
    j.jobId?.toString().toLowerCase().includes(searchTerm.toLowerCase()) || 
    j.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    j.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="si-modal-overlay" style={{ zIndex: 1000 }}>
      <div className="jobs-modal-container" style={{ maxWidth: '1200px', width: '95%' }}>
        
        <div className="si-modal-header" style={{ background: '#1a6f66', borderBottom: 'none', padding: '18px 24px' }}>
          <h2 className="si-modal-title" style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px' }}>
            <Sparkles size={20} fill="#fff" style={{ opacity: 0.9 }} /> Select Relevant Job for "{candidate?.FirstName} {candidate?.LastName}"
          </h2>
          <button 
            className="si-modal-close" 
            onClick={onClose}
            style={{ 
              background: 'rgba(255,255,255,0.15)', 
              color: 'white',
              border: 'none',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
          >
            <X size={18} />
          </button>
        </div>

        <div className="jobs-modal-content" style={{ padding: '24px' }}>
          <div className="jobs-search-container" style={{ marginBottom: '20px', width: '100%', maxWidth: '400px' }}>
            <Search className="jobs-search-icon" size={16} />
            <input 
              type="text" 
              className="jobs-search-input" 
              placeholder="Search by Job ID, Title, or Location..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: '10px 12px 10px 40px', fontSize: '14px', borderRadius: '6px' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <p style={{ fontSize: '14px', color: '#64748b' }}>
              Showing relevant jobs matching <strong>{candidate?.FirstName} {candidate?.LastName}</strong>'s profile.
            </p>
          </div>

          <div style={{ overflowX: 'auto', maxHeight: '55vh', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <table className="jobs-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 1, background: '#f8fafc' }}>
                <tr>
                  <th style={{ textAlign: 'left', padding: '14px 12px', fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, letterSpacing: '0.5px' }}>JOB ID</th>
                  <th style={{ textAlign: 'left', padding: '14px 12px', fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, letterSpacing: '0.5px' }}>JOB TITLE (RELEVANCE)</th>
                  <th style={{ textAlign: 'center', padding: '14px 12px', fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, letterSpacing: '0.5px' }}>SCORE</th>
                  <th style={{ textAlign: 'left', padding: '14px 12px', fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, letterSpacing: '0.5px' }}>LOCATION</th>
                  <th style={{ textAlign: 'left', padding: '14px 12px', fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, letterSpacing: '0.5px' }}>WORK MODE</th>
                  <th style={{ textAlign: 'left', padding: '14px 12px', fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, letterSpacing: '0.5px' }}>ROLE OWNER</th>
                  <th style={{ textAlign: 'left', padding: '14px 12px', fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, letterSpacing: '0.5px' }}>ASSIGNED RECRUITERS</th>
                  <th style={{ textAlign: 'left', padding: '14px 12px', fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, letterSpacing: '0.5px' }}>POSTED DATE</th>
                  <th style={{ textAlign: 'center', padding: '14px 12px', fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, letterSpacing: '0.5px' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '60px' }}>
                      <Loader className="spin" size={32} color="#1a6f66" style={{ margin: '0 auto', animation: 'spin 1s linear infinite' }} />
                      <p style={{ marginTop: '12px', color: '#64748b' }}>Analyzing jobs for matching profile...</p>
                    </td>
                  </tr>
                ) : filteredJobs.length > 0 ? filteredJobs.map((job, idx) => (
                  <tr key={idx} style={{ borderTop: '1px solid #f1f5f9' }}>
                    <td style={{ fontWeight: 700, color: '#1a6f66', padding: '16px 12px', fontSize: '13px' }}>{job.jobId}</td>
                    <td style={{ padding: '16px 12px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontWeight: 600, color: '#1e293b', fontSize: '13px' }}>{job.title}</span>
                        {job.score > 5 && (
                          <span style={{ 
                            fontSize: '9px', 
                            background: '#dcfce7', 
                            color: '#166534', 
                            padding: '1px 6px', 
                            borderRadius: '12px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            width: 'fit-content',
                            fontWeight: 700,
                            textTransform: 'uppercase'
                          }}>
                            <Sparkles size={8} fill="#166534" /> Relevant
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                      <span style={{ 
                        fontWeight: 700, 
                        color: '#1a6f66', 
                        background: '#f0fdfa', 
                        padding: '4px 10px', 
                        borderRadius: '6px',
                        fontSize: '13px'
                      }}>
                        {job.score}
                      </span>
                    </td>
                    <td title={job.location || ''} style={{ padding: '16px 12px', color: '#475569', fontSize: '12px' }}>
                      {(job.location || '').length > 25 ? (job.location || '').substring(0, 25) + '...' : (job.location || 'N/A')}
                    </td>
                    <td style={{ padding: '16px 12px' }}>
                      <span style={{ 
                        fontSize: '11px', 
                        background: job.workMode === 'Remote' ? '#f0fdfa' : '#fff7ed', 
                        color: job.workMode === 'Remote' ? '#0d9488' : '#c2410c', 
                        padding: '2px 8px', 
                        borderRadius: '4px',
                        fontWeight: 600
                      }}>
                        {job.workMode || 'N/A'}
                      </span>
                    </td>
                    <td style={{ padding: '16px 12px', color: '#475569', fontSize: '12px' }}>{job.roleOwner || 'N/A'}</td>
                    <td title={job.assignedRecruiters || ''} style={{ padding: '16px 12px', color: '#475569', fontSize: '12px' }}>
                      {(job.assignedRecruiters || '').length > 25 ? (job.assignedRecruiters || '').substring(0, 25) + '...' : (job.assignedRecruiters || 'N/A')}
                    </td>
                    <td style={{ padding: '16px 12px', color: '#475569', fontSize: '12px' }}>
                      {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                      <button 
                        className="si-btn-save" 
                        style={{ 
                          background: '#1a6f66', 
                          padding: '8px 12px', 
                          fontSize: '12px', 
                          borderRadius: '6px', 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '8px', 
                          margin: '0 auto',
                          height: '36px',
                          border: 'none',
                          color: 'white',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          whiteSpace: 'nowrap'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#124d47'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = '#1a6f66'; e.currentTarget.style.transform = 'translateY(0)'; }}
                        onClick={() => handleSubmitProfile(job)}
                        disabled={isSubmitting}
                      >
                        <Send size={14} /> {isSubmitting ? 'Submitting...' : 'Submit Profile'}
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                      {searchTerm ? 'No matching jobs found' : 'No relevant jobs found in last 3 days'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="jobs-pagination" style={{ padding: '15px 0', fontSize: '12px', color: '#64748b' }}>
            Showing <strong>1</strong> to <strong>{filteredJobs.length}</strong> of <strong>{filteredJobs.length}</strong> relevant jobs
          </div>
        </div>

        <div className="si-modal-footer" style={{ padding: '16px 24px', borderTop: '1px solid #f1f5f9', justifyContent: 'center' }}>
          <button 
            className="si-btn-cancel" 
            onClick={onClose} 
            disabled={isSubmitting}
            style={{ 
              padding: '10px 40px', 
              borderRadius: '8px', 
              background: '#f1f5f9', 
              border: '1px solid #e2e8f0',
              color: '#475569',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#1e293b'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#475569'; }}
          >
            Close
          </button>
        </div>


      </div>
    </div>
  );
};
