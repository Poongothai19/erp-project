import React, { useState, useEffect } from 'react';
import { X, Search, Bold, Italic, Link, List, Image, Layout, FileText, ChevronDown, Loader } from 'lucide-react';
import Swal from 'sweetalert2';
import axios from 'axios';
import BASE_URL from '../../url';
import '../styles/ScheduleInterviewModals.css';

// -------------------------------------------------------------
// 1. Candidate Jobs Modal (Shows jobs to schedule interview for)
// -------------------------------------------------------------
export const CandidateJobsModal = ({ isOpen, onClose, candidate, onSelectJob }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchJobs = async () => {
        setLoading(true);
        try {
          const token = localStorage.getItem('token');
          const res = await axios.get(`${BASE_URL}/api/recruitment/roles`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          // Compute basic relevance to profile
          const candidateTitle = (candidate?.JobTitle || '').toLowerCase();
          const candidateSkills = (candidate?.Skills || []).map(s => 
            (typeof s === 'string' ? s : s?.SkillName || '').toLowerCase()
          ).filter(Boolean);

          const now = new Date();
          const twoDaysAgo = new Date(now);
          twoDaysAgo.setDate(now.getDate() - 2);
          twoDaysAgo.setHours(0, 0, 0, 0);

          // Map backend structure to modal's expected attributes with score
          const formattedJobs = res.data
            .filter(role => {
              if (!role.createdAt) return false;
              const createdDate = new Date(role.createdAt);
              return createdDate >= twoDaysAgo;
            })
            .map(role => {
              const jobTitle = (role.role || '').toLowerCase();
              const jobDesc = (role.jobDescription || '').toLowerCase();
              let score = 0;
              
              // Match job title
              if (candidateTitle && jobTitle.includes(candidateTitle)) score += 15;
              if (candidateTitle && candidateTitle.includes(jobTitle)) score += 10;
              
              // Match skills
              candidateSkills.forEach(skill => {
                const s = skill.toLowerCase();
                if (jobTitle.includes(s)) score += 5;
                if (jobDesc.includes(s)) score += 2;
              });

              return {
                id: role.jobId || role.systemId || role.id,
                title: role.role || 'N/A',
                location: role.city && role.state ? `${role.city}, ${role.state}` : role.roleLocation || 'N/A',
                createdBy: role.createdBy || 'Unknown',
                score,
                createdAt: role.createdAt
              };
            });
          
          // Filter to show ONLY matching jobs (score > 0)
          const matchingJobs = formattedJobs.filter(j => j.score > 0);
          
          // Sort by relevance score, descending
          matchingJobs.sort((a, b) => b.score - a.score);
          
          setJobs(matchingJobs);
        } catch (error) {
          console.error('Error fetching jobs:', error);
          Swal.fire('Error', 'Failed to fetch jobs.', 'error');
        } finally {
          setLoading(false);
        }
      };
      
      fetchJobs();
    }
  }, [isOpen]);

  const filteredJobs = jobs.filter(j => 
    j.id?.toString().toLowerCase().includes(searchTerm.toLowerCase()) || 
    j.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="si-modal-overlay">
      <div className="jobs-modal-container">
        
        <div className="si-modal-header">
          <h2 className="si-modal-title">Jobs</h2>
          <button className="si-modal-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="jobs-modal-content">
          <div className="jobs-search-container">
            <Search className="jobs-search-icon" size={14} />
            <input 
              type="text" 
              className="jobs-search-input" 
              placeholder="Search..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <table className="jobs-table">
            <thead>
              <tr>
                <th>JOB ID</th>
                <th>JOB TITLE (Relevance)</th>
                <th>LOCATION</th>
                <th>CREATED BY</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '40px' }}>
                    <Loader className="spin" size={24} color="#3b82f6" style={{ margin: '0 auto', animation: 'spin 1s linear infinite' }} />
                  </td>
                </tr>
              ) : filteredJobs.length > 0 ? filteredJobs.map((job, idx) => (
                <tr key={idx}>
                  <td>
                    <span className="job-id-link" onClick={() => onSelectJob(job)}>{job.id}</span>
                  </td>
                  <td>
                    {job.title}
                    {job.score > 0 && (
                      <span style={{ marginLeft: 8, fontSize: 10, background: '#dcfce7', color: '#166534', padding: '2px 6px', borderRadius: 4 }}>
                        Relevant
                      </span>
                    )}
                  </td>
                  <td>{job.location}</td>
                  <td>{job.createdBy}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', color: '#9ca3af' }}>No matching jobs found</td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="jobs-pagination">
            Showing 1 to {filteredJobs.length} of {filteredJobs.length}
            <span>«</span>
            <span>‹</span>
            <button className="jobs-pagination-btn active">1</button>
            <span>›</span>
            <span>»</span>
          </div>
        </div>

        <div className="si-modal-footer" style={{ borderTop: 'none', paddingTop: 0 }}>
          <button className="si-btn-cancel" onClick={onClose}>Cancel</button>
        </div>

      </div>
    </div>
  );
};


// -------------------------------------------------------------
// 2. Schedule Interview Modal (Complex Form)
// -------------------------------------------------------------
export const ScheduleInterviewModal = ({ isOpen, onClose, candidate, job }) => {
  const [title, setTitle] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [timeFrom, setTimeFrom] = useState('01:00 PM');
  const [dateTo, setDateTo] = useState('');
  const [timeTo, setTimeTo] = useState('01:30 PM');
  
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [toEmail, setToEmail] = useState('');
  const [ccEmail, setCcEmail] = useState('');
  const [bccEmail, setBccEmail] = useState('');
  const [isScheduling, setIsScheduling] = useState(false);
  
  useEffect(() => {
    if (candidate && job) {
      const fullName = `${candidate.FirstName || ''} ${candidate.LastName || ''}`.trim() || 'Candidate';
      setTitle(`Scheduled Interview : ${fullName} for ${job.title} in ${job.location}`);
      
      const today = new Date().toISOString().split('T')[0];
      setDateFrom(today);
      setDateTo(today);
      
      setToEmail(candidate?.Contact?.Email || candidate?.Email || '');
    }
  }, [candidate, job]);

  const placeholderEditorIcons = [
    <Bold size={14} />, <Italic size={14} />, <Layout size={14} />, <List size={14} />, <Link size={14} />, <Image size={14} />
  ];

  const EditorToolbar = () => (
    <div className="sched-editor-toolbar">
      <div style={{ display: 'flex', gap: 4, paddingRight: 8, borderRight: '1px solid #d1d5db' }}>
        {placeholderEditorIcons.map((icon, idx) => (
          <button key={idx} style={{ background: 'none', border: 'none', color: '#4b5563', cursor: 'pointer' }}>{icon}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 4, paddingRight: 8, borderRight: '1px solid #d1d5db' }}>
        <span style={{ fontSize: '13px', padding: '0 4px', color: '#4b5563', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>Styles <ChevronDown size={14}/></span>
      </div>
      <div style={{ display: 'flex', gap: 4, paddingRight: 8, borderRight: '1px solid #d1d5db' }}>
        <span style={{ fontSize: '13px', padding: '0 4px', color: '#4b5563', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>Format <ChevronDown size={14}/></span>
      </div>
      <div style={{ display: 'flex', gap: 4, paddingRight: 8, borderRight: '1px solid #d1d5db' }}>
        <span style={{ fontSize: '13px', padding: '0 4px', color: '#4b5563', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>Font <ChevronDown size={14}/></span>
      </div>
      <div style={{ display: 'flex', gap: 4, paddingRight: 8, borderRight: '1px solid #d1d5db' }}>
        <span style={{ fontSize: '13px', padding: '0 4px', color: '#4b5563', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>Size <ChevronDown size={14}/></span>
      </div>
      <div>
        <span style={{ fontSize: '13px', padding: '0 4px', color: '#4b5563', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}><FileText size={14}/> Source</span>
      </div>
    </div>
  );

  const handleSave = () => {
    Swal.fire('Saved', 'Interview details saved successfully.', 'success');
  };

  const handleSaveAndSchedule = async () => {
    if (!toEmail) {
      Swal.fire('Error', 'Please provide a recipient email address.', 'error');
      return;
    }

    setIsScheduling(true);
    try {
      const token = localStorage.getItem('token');
      
      const emailBody = `
        <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
          <h2>${title}</h2>
          <p><strong>Date:</strong> ${dateFrom} to ${dateTo}</p>
          <p><strong>Time:</strong> ${timeFrom} to ${timeTo}</p>
          <p><strong>Location:</strong> ${location || 'TBA'}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p><strong>Description / Meeting Details:</strong></p>
          <div style="background: #f9fafb; padding: 15px; border-radius: 6px;">
            ${description ? description.replace(/\n/g, '<br/>') : 'No additional details provided.'}
          </div>
          <br/>
          <p>Best regards,<br/>The Prophecy Tech Team</p>
        </div>
      `;

      await axios.post(`${BASE_URL}/api/resumes/schedule-interview`, {
        to: toEmail,
        cc: ccEmail,
        bcc: bccEmail,
        subject: title,
        body: emailBody
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      Swal.fire('Scheduled!', 'The interview has been successfully scheduled and invitations sent.', 'success').then(() => {
        onClose();
      });
    } catch (error) {
      console.error('Error scheduling interview:', error);
      Swal.fire('Error', 'Failed to schedule the interview. ' + (error.response?.data?.error || ''), 'error');
    } finally {
      setIsScheduling(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="si-modal-overlay">
      <div className="sched-modal-container">
        
        <div className="si-modal-header">
          <h2 className="si-modal-title">Schedule Interview</h2>
          <button className="si-modal-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="sched-modal-content">

          <div className="sched-form-row">
            <div className="sched-form-group full">
              <label className="sched-form-label">Title *</label>
              <input type="text" className="sched-input" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
          </div>

          <div className="sched-form-row">
            <div className="sched-form-group" style={{ flex: 1.5 }}>
              <label className="sched-form-label">Interview Date & Time *</label>
              <div style={{ display: 'flex', gap: 10 }}>
                <input type="date" className="sched-input" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                <input type="text" className="sched-input" value={timeFrom} onChange={(e) => setTimeFrom(e.target.value)} style={{ width: 120 }} />
              </div>
            </div>
            
            <div className="sched-form-group" style={{ flex: 1.5 }}>
              <label className="sched-form-label">To *</label>
              <div style={{ display: 'flex', gap: 10 }}>
                <input type="date" className="sched-input" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                <input type="text" className="sched-input" value={timeTo} onChange={(e) => setTimeTo(e.target.value)} style={{ width: 120 }} />
              </div>
            </div>
          </div>

          <div className="sched-form-row">
            <div className="sched-form-group">
              <label className="sched-form-label">Time Zone *</label>
              <select className="sched-select">
                <option>USA</option>
              </select>
            </div>
            <div className="sched-form-group">
              <label className="sched-form-label">&nbsp;</label>
              <select className="sched-select">
                <option>(UTC -06:00) Central Time (US & Canada)</option>
              </select>
            </div>
            <div className="sched-form-group">
              <label className="sched-form-label">Interview Type *</label>
              <select className="sched-select">
                <option>Telephonic</option>
                <option>Video Call</option>
                <option>In-Person</option>
              </select>
            </div>
            <div className="sched-form-group">
              <label className="sched-form-label">Status *</label>
              <select className="sched-select">
                <option>Scheduled</option>
              </select>
            </div>
          </div>

          <div className="sched-form-row">
            <div className="sched-form-group" style={{ maxWidth: '25%' }}>
              <label className="sched-form-label">Stage *</label>
              <select className="sched-select">
                <option>Select</option>
              </select>
            </div>
          </div>

          {/* Editors Row */}
          <div className="sched-form-row">
            <div className="sched-wysiwyg-wrapper">
              <div className="sched-wysiwyg-label">Location (Meeting Link / Office Address)</div>
              <div className="sched-editor-container">
                <EditorToolbar />
                <textarea 
                  className="sched-editor-textarea"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                ></textarea>
              </div>
            </div>
            
            <div className="sched-wysiwyg-wrapper">
              <div className="sched-wysiwyg-label">Description / Instructions</div>
              <div className="sched-editor-container">
                <EditorToolbar />
                <textarea 
                  className="sched-editor-textarea"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                ></textarea>
              </div>
            </div>
          </div>


          <div className="sched-form-row">
            <div className="sched-form-group">
              <label className="sched-form-label">To Email *</label>
              <input 
                type="text" 
                className="sched-input" 
                placeholder="Candidate Email" 
                value={toEmail}
                onChange={(e) => setToEmail(e.target.value)}
              />
            </div>
            <div className="sched-form-group">
              <label className="sched-form-label">CC</label>
              <input 
                type="text" 
                className="sched-input" 
                placeholder="CC Emails (comma loc.)" 
                value={ccEmail}
                onChange={(e) => setCcEmail(e.target.value)}
              />
            </div>
            <div className="sched-form-group">
              <label className="sched-form-label">BCC</label>
              <input 
                type="text" 
                className="sched-input" 
                placeholder="BCC Emails" 
                value={bccEmail}
                onChange={(e) => setBccEmail(e.target.value)}
              />
            </div>
          </div>
          
          <div style={{ textAlign: 'right', marginBottom: 16 }}>
            <span style={{ fontSize: 13, color: '#3b82f6', cursor: 'pointer' }}>Create Task</span>
          </div>

          <div className="sched-checkbox-container">
            <label className="sched-checkbox">
              <input type="checkbox" /> Include Job Description
            </label>
            <label className="sched-checkbox">
              <input type="checkbox" /> Mask Contact Details in Resume(s)
            </label>
            <label className="sched-checkbox">
              <input type="checkbox" /> Include Previous Interview(s) Feedback
            </label>
          </div>

        </div>

        <div className="si-modal-footer">
          <button className="si-btn-cancel" onClick={onClose} disabled={isScheduling}>Cancel</button>
          <button className="si-btn-primary" onClick={handleSave} disabled={isScheduling}>Save</button>
          <button className="si-btn-save" onClick={handleSaveAndSchedule} disabled={isScheduling}>
            {isScheduling ? 'Sending...' : 'Save & Schedule'}
          </button>
        </div>

      </div>
    </div>
  );
};
