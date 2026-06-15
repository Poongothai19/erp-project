import React, { useState, useEffect, useCallback } from 'react';
import { X, Search, Loader, Sparkles, Send } from 'lucide-react';
import Swal from 'sweetalert2';
import axios from 'axios';
import BASE_URL from '../../url';
import '../../Resume_Submission/styles/ScheduleInterviewModals.css';

const SourceCandidateModal = ({ isOpen, onClose, role, onProfileSubmitted }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCandidates = useCallback(async () => {
    if (!isOpen || !role) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${BASE_URL}/api/resumes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // The API might return the data directly or wrapped in a data/candidates property
      const rawCandidates = Array.isArray(res.data) 
        ? res.data 
        : (res.data.data || res.data.candidates || []);

      const jobTitle = (role.role || '').toLowerCase();
      const jobDesc = (role.jobDescription || '').replace(/<[^>]*>?/gm, '').toLowerCase(); // Strip HTML

      // Map and sort candidates by relevance
      const scoredCandidates = rawCandidates.map(candidate => {
        // Transform the candidate data if needed (some APIs return camelCase, some snake_case)
        const c = {
          id: candidate.candidate_id || candidate.CandidateId,
          firstName: candidate.first_name || candidate.FirstName || '',
          lastName: candidate.last_name || candidate.LastName || '',
          email: candidate.email || candidate.Contact?.Email || '',
          phone: candidate.phone || candidate.Contact?.Phone || candidate.Mobile || '',
          jobTitle: (candidate.job_title || candidate.JobTitle || '').toLowerCase(),
          skills: Array.isArray(candidate.skills) 
            ? candidate.skills.map(s => (typeof s === 'string' ? s : s.skill_name || s.SkillName || '').toLowerCase())
            : (candidate.skills || '').toString().toLowerCase().split(',').map(s => s.trim()).filter(Boolean),
          experience: candidate.years_exp || candidate.YearsOfExperience || 0,
          location: candidate.current_location || candidate.CurrentLocation || 'N/A',
          isBench: candidate.is_bench || candidate.IsBench || false,
          raw: candidate
        };

        let score = 0;
        
        // 1. Job Title Match
        if (jobTitle && c.jobTitle && (c.jobTitle.includes(jobTitle) || jobTitle.includes(c.jobTitle))) {
          score += 15;
        }
        
        // 2. Skills Match
        c.skills.forEach(skill => {
          if (jobTitle.includes(skill)) score += 5;
          if (jobDesc && jobDesc.includes(skill)) score += 3;
        });

        return { ...c, score };
      });

      // Filter by high relevance (score >= 10)
      const relevantOnes = scoredCandidates
        .filter(c => c.score >= 10)
        .sort((a, b) => b.score - a.score);
      
      setCandidates(relevantOnes);
    } catch (error) {
      console.error('Error fetching candidates:', error);
      Swal.fire('Error', 'Failed to fetch candidates matching this role.', 'error');
    } finally {
      setLoading(false);
    }
  }, [isOpen, role]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  const handleSubmitProfile = async (candidate) => {
    const confirm = await Swal.fire({
      title: 'Submit Profile?',
      text: `Are you sure you want to submit ${candidate.firstName} ${candidate.lastName} for the role "${role.role}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Submit',
      confirmButtonColor: '#1a6f66'
    });

    if (!confirm.isConfirmed) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      
      const formData = new FormData();
      formData.append('roleId', role.id);
      formData.append('candidateFirstName', candidate.firstName);
      formData.append('candidateLastName', candidate.lastName);
      formData.append('name', `${candidate.firstName} ${candidate.lastName}`.trim());
      formData.append('email', candidate.email);
      formData.append('phone', candidate.phone);
      formData.append('experience', candidate.experience);
      formData.append('location', candidate.location);
      formData.append('currentLocation', candidate.location);
      formData.append('skills', candidate.skills.join(', '));
      
      // Mapping additional fields from raw candidate if available
      const raw = candidate.raw;
      formData.append('workAuthorization', raw.work_authorization || raw.WorkAuthorization || '');
      formData.append('expectedSalary', raw.expected_rate_from || raw.ExpectedRateFrom || '');
      formData.append('rate', raw.current_rate || raw.CurrentRate || '');
      formData.append('currentEmployer', raw.current_employer || raw.CurrentEmployer || '');
      formData.append('noticePeriod', raw.notice_period || raw.NoticePeriod || '');

      // TRY TO ATTACH RESUME
      if (candidate.id) {
        try {
          // Check for primary document
          let documentId = raw.document?.DocumentId || raw.document_id;
          
          if (!documentId && raw.documents) {
            const primaryDoc = raw.documents.find(d => d.is_primary || d.IsPrimary) || raw.documents[0];
            documentId = primaryDoc?.document_id || primaryDoc?.DocumentId;
          }

          if (documentId) {
            const downloadUrl = `${BASE_URL}/api/resumes/${documentId}/download`;
            const resumeRes = await axios.get(downloadUrl, {
              headers: { Authorization: `Bearer ${token}` },
              responseType: 'blob'
            });
            
            if (resumeRes.data && resumeRes.data.size > 0) {
              const contentDisp = resumeRes.headers['content-disposition'];
              let fileName = 'resume.pdf';
              if (contentDisp && contentDisp.includes('filename=')) {
                fileName = contentDisp.split('filename=')[1].replace(/[";]/g, '');
              }
              const file = new File([resumeRes.data], fileName, { type: resumeRes.data.type || 'application/pdf' });
              formData.append('resume', file);
            }
          }
        } catch (err) {
          console.warn('⚠️ Could not attach resume:', err.message);
        }
      }

      const response = await axios.post(`${BASE_URL}/api/recruitment/applications`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        await Swal.fire('Submitted!', 'Candidate has been submitted successfully.', 'success');
        if (onProfileSubmitted) onProfileSubmitted();
        onClose(); // Close the modal after success
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

  const filteredCandidates = candidates.filter(c => 
    c.firstName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.jobTitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="si-modal-overlay" style={{ zIndex: 1000 }}>
      <div className="jobs-modal-container" style={{ maxWidth: '1600px', width: '98%' }}>
        
        <div className="si-modal-header" style={{ background: '#1a6f66', borderBottom: 'none', padding: '18px 24px' }}>
          <h2 className="si-modal-title" style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px' }}>
            <Sparkles size={20} fill="#fff" style={{ opacity: 0.9 }} /> Source Candidates for "{role.role}"
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
          <div className="jobs-search-container" style={{ marginBottom: '20px' }}>
            <Search className="jobs-search-icon" size={16} />
            <input 
              type="text" 
              className="jobs-search-input" 
              placeholder="Search by name, email, or job title..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: '12px 12px 12px 40px', fontSize: '14px' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <p style={{ fontSize: '14px', color: '#64748b' }}>
              We found <strong>{candidates.length}</strong> candidates in our database matching this role's requirements.
            </p>
          </div>

          <div style={{ overflowX: 'auto', maxHeight: '55vh', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <table className="jobs-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 1, background: '#f8fafc' }}>
                <tr>
                  <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, letterSpacing: '0.5px', width: '180px' }}>CANDIDATE NAME</th>
                  <th style={{ textAlign: 'center', padding: '10px 12px', fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, letterSpacing: '0.5px', width: '80px' }}>SCORE</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, letterSpacing: '0.5px', width: '150px' }}>JOB TITLE</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, letterSpacing: '0.5px', width: '220px' }}>EMAIL</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, letterSpacing: '0.5px', width: '130px' }}>PHONE</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, letterSpacing: '0.5px', width: '150px' }}>LOCATION</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, letterSpacing: '0.5px', width: '70px' }}>EXP.</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, letterSpacing: '0.5px', width: '150px' }}>SKILLS</th>
                  <th style={{ textAlign: 'center', padding: '10px 12px', fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, letterSpacing: '0.5px', width: '100px' }}>BENCH CAN</th>
                  <th style={{ textAlign: 'center', padding: '10px 12px', fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, letterSpacing: '0.5px', width: '160px' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="10" style={{ textAlign: 'center', padding: '60px' }}>
                      <Loader className="spin" size={32} color="#1a6f66" style={{ margin: '0 auto', animation: 'spin 1s linear infinite' }} />
                      <p style={{ marginTop: '12px', color: '#64748b' }}>Analyzing database for matching candidates...</p>
                    </td>
                  </tr>
                ) : filteredCandidates.length > 0 ? filteredCandidates.map((c, idx) => (
                  <tr key={idx} style={{ borderTop: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '8px 12px', verticalAlign: 'middle', textAlign: 'left' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontWeight: 600, color: '#1e293b', fontSize: '13px' }}>{c.firstName} {c.lastName}</span>
                        {c.score > 5 && (
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
                            marginTop: '2px',
                            fontWeight: 700,
                            textTransform: 'uppercase'
                          }}>
                            <Sparkles size={8} fill="#166534" /> Relevant
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'center', verticalAlign: 'middle' }}>
                      <span style={{ 
                        fontWeight: 700, 
                        color: '#1a6f66', 
                        background: '#f0fdfa', 
                        padding: '4px 10px', 
                        borderRadius: '6px',
                        fontSize: '13px'
                      }}>
                        {c.score}
                      </span>
                    </td>
                    <td style={{ padding: '8px 12px', color: '#475569', fontSize: '12px', textTransform: 'capitalize', verticalAlign: 'middle', textAlign: 'left' }}>{c.jobTitle || 'N/A'}</td>
                    <td style={{ padding: '8px 12px', color: '#475569', fontSize: '12px', verticalAlign: 'middle', textAlign: 'left' }}>{c.email || 'N/A'}</td>
                    <td style={{ padding: '8px 12px', color: '#475569', fontSize: '12px', verticalAlign: 'middle', textAlign: 'left' }}>{c.phone || 'N/A'}</td>
                    <td style={{ padding: '8px 12px', color: '#475569', fontSize: '12px', verticalAlign: 'middle', textAlign: 'left' }}>{c.location}</td>
                    <td style={{ padding: '8px 12px', color: '#475569', fontSize: '12px', verticalAlign: 'middle', whiteSpace: 'nowrap', textAlign: 'left' }}>
                      <strong>{c.experience}</strong> <span style={{ color: '#94a3b8' }}>yrs</span>
                    </td>
                    <td style={{ padding: '8px 12px', verticalAlign: 'middle', textAlign: 'left' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center' }}>
                        {c.skills.slice(0, 2).map((skill, i) => (
                          <span key={i} style={{ fontSize: '10px', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', color: '#475569', fontWeight: 500 }}>
                            {skill}
                          </span>
                        ))}
                        {c.skills.length > 2 && (
                          <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 500, marginLeft: '2px' }}>
                            +{c.skills.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'center', verticalAlign: 'middle' }}>
                      <span style={{ 
                        fontSize: '11px', 
                        padding: '2px 8px', 
                        borderRadius: '4px', 
                        fontWeight: 600,
                        background: c.isBench ? '#fef3c7' : '#f1f5f9',
                        color: c.isBench ? '#92400e' : '#475569',
                        border: c.isBench ? '1px solid #fde68a' : '1px solid #e2e8f0'
                      }}>
                        {c.isBench ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'center', verticalAlign: 'middle' }}>
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
                          transition: 'transform 0.2s, background 0.2s'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#124d47'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = '#1a6f66'; e.currentTarget.style.transform = 'translateY(0)'; }}
                        onClick={() => handleSubmitProfile(c)}
                        disabled={isSubmitting}
                      >
                        <Send size={14} /> {isSubmitting ? 'Submitting...' : 'Submit Profile'}
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="10" style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                      {searchTerm ? 'No matching candidates found' : 'No highly relevant candidates found for this role.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="si-modal-footer" style={{ padding: '16px 24px', borderTop: '1px solid #f1f5f9', justifyContent: 'center' }}>
          <button 
            className="si-btn-cancel" 
            onClick={onClose} 
            disabled={isSubmitting}
            style={{ 
              padding: '10px 30px', 
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

export default SourceCandidateModal;
