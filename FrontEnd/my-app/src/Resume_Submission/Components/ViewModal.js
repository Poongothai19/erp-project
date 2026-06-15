import React, { useState, useEffect } from 'react';
import {
  X, Download, FileText, Loader, Eye,
  Mail, Phone, Briefcase, GraduationCap, Award, Clock,
  Linkedin, Github, MapPin, User, ExternalLink, File
} from 'lucide-react';
import { formatDate, formatFileSize, formatMonthYear } from '../utils/mockData';
import BASE_URL from '../../url';

// ── Badge colour maps ─────────────────────────────────────────────────────────
const STATUS_COLORS = {
  'Available':     { bg: '#d1fae5', color: '#065f46' },
  'In Process':    { bg: '#fef3c7', color: '#92400e' },
  'Hired':         { bg: '#dbeafe', color: '#1d4ed8' },
  'Not Available': { bg: '#fee2e2', color: '#991b1b' },
  'On Hold':       { bg: '#f3f4f6', color: '#4b5563' },
};

const REMOTE_COLORS = {
  'Remote':  { bg: '#ede9fe', color: '#5b21b6' },
  'OnSite':  { bg: '#e0f2fe', color: '#0369a1' },
  'Hybrid':  { bg: '#fef9c3', color: '#713f12' },
};

const SKILL_TYPE_COLORS = {
  'HARD': { bg: '#e0f2fe', color: '#0369a1' },
  'SOFT': { bg: '#fce7f3', color: '#9d174d' },
};

// ── Main Component ────────────────────────────────────────────────────────────
const ViewModal = ({ candidate: c, loading: detailLoading = false, onClose }) => {
  const [downloading, setDownloading]       = useState(null); // track which doc is downloading
  const [previewUrl, setPreviewUrl]         = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError]     = useState(null);
  const [activeDocId, setActiveDocId]       = useState(null); // which doc is previewing
  const [previewType, setPreviewType]       = useState(null); // content type of the loaded preview blob

  // Determine all Documents from the candidate
  const documents = c?.Documents?.length > 0 ? c.Documents : (c?.Document ? [c.Document] : []);

  useEffect(() => {
    if (!c) return;
    // Pick the first document to preview
    const firstDoc = documents[0];
    if (firstDoc?.DocumentId) {
      setActiveDocId(firstDoc.DocumentId);
      loadPreview(firstDoc.DocumentId);
    }
    return () => {
      if (previewUrl) window.URL.revokeObjectURL(previewUrl);
    };
  }, [c?.CandidateId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!c) return null;

  const statusStyle = STATUS_COLORS[c.CandidateStatus] || STATUS_COLORS['On Hold'];
  const remoteStyle = REMOTE_COLORS[c.RemoteStatus]    || REMOTE_COLORS['OnSite'];
  const fullName    = `${c.FirstName || ''} ${c.MiddleName ? c.MiddleName + ' ' : ''}${c.LastName || ''}`.trim();
  const initials    = (c.FirstName?.charAt(0) || '') + (c.LastName?.charAt(0) || '');

  // All phones and emails
  const phones = c.Phones?.length > 0 ? c.Phones : (c.Contact?.Phone ? [c.Contact.Phone] : []);
  const emails = c.Emails?.length > 0 ? c.Emails : (c.Contact?.Email ? [c.Contact.Email] : []);

  // Active document info
  const activeDoc = documents.find(d => d.DocumentId === activeDocId) || documents[0] || null;
  // Whether the preview can be shown inline (PDF or HTML converted from Word)
  const isPreviewable = previewType === 'application/pdf' || previewType?.startsWith('text/html');

  // ── Load preview blob ─────────────────────────────────────────────────────
  const loadPreview = async (docId) => {
    if (!docId) return;
    // Cleanup old URL
    if (previewUrl) window.URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPreviewType(null);
    try {
      setPreviewLoading(true);
      setPreviewError(null);
      setActiveDocId(docId);
      const token = localStorage.getItem('token');
      const res = await fetch(`${BASE_URL}/api/resumes/${docId}/preview`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      setPreviewType(blob.type || res.headers.get('content-type'));
      setPreviewUrl(window.URL.createObjectURL(blob));
    } catch (err) {
      console.error('Preview load error:', err);
      setPreviewError('Could not load preview. Use the Download button instead.');
    } finally {
      setPreviewLoading(false);
    }
  };

  // ── Download ──────────────────────────────────────────────────────────────
  const handleDownload = async (docId, fileName) => {
    if (!docId) return;
    try {
      setDownloading(docId);
      const token = localStorage.getItem('token');
      const res = await fetch(`${BASE_URL}/api/resumes/${docId}/download`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url  = window.URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = fileName || 'resume';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download resume. Please try again.');
    } finally {
      setDownloading(null);
    }
  };

  const handleOpenInTab = () => {
    const token = localStorage.getItem('token');
    if (previewUrl) {
      window.open(previewUrl, '_blank');
    } else if (activeDoc?.DocumentId) {
      window.open(`${BASE_URL}/api/resumes/${activeDoc.DocumentId}/preview?token=${token}`, '_blank');
    }
  };

  // ────────────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes vm-fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes vm-slideUp { from { opacity: 0; transform: translateY(20px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes vm-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        .vm-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px; animation: vm-fadeIn 0.2s ease; }
        .vm-container { background: #fff; border-radius: 16px; width: 100%; max-width: 1140px; max-height: 90vh; display: flex; flex-direction: column; box-shadow: 0 25px 60px rgba(0,0,0,0.3); overflow: hidden; animation: vm-slideUp 0.3s ease; }

        .vm-header { padding: 20px 28px; display: flex; justify-content: space-between; align-items: flex-start; background: linear-gradient(135deg, #0f766e 0%, #229C8B 50%, #14b8a6 100%); flex-shrink: 0; position: relative; }
        .vm-header::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #14b8a6, #f59e0b, #ec4899, #6366f1); }

        .vm-header-left { display: flex; align-items: center; gap: 16px; }
        .vm-avatar { width: 52px; height: 52px; border-radius: 14px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.2); color: #fff; font-size: 18px; font-weight: 800; flex-shrink: 0; border: 2px solid rgba(255,255,255,0.3); }
        .vm-header-info h2 { margin: 0; font-size: 22px; font-weight: 800; color: #fff; letter-spacing: -0.01em; }
        .vm-header-info p { margin: 4px 0 0; font-size: 14px; color: rgba(255,255,255,0.8); font-weight: 500; }

        .vm-header-actions { display: flex; gap: 8px; align-items: center; }
        .vm-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; transition: all 0.18s; font-family: inherit; }
        .vm-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .vm-btn--preview { background: rgba(255,255,255,0.15); color: #fff; border: 1px solid rgba(255,255,255,0.3); }
        .vm-btn--preview:hover:not(:disabled) { background: rgba(255,255,255,0.25); }
        .vm-btn--download { background: #fff; color: #229C8B; box-shadow: 0 2px 8px rgba(0,0,0,0.15); }
        .vm-btn--download:hover:not(:disabled) { background: #f0fdfa; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
        .vm-btn--close { background: rgba(255,255,255,0.15); border: none; border-radius: 10px; padding: 8px 10px; cursor: pointer; color: #fff; display: flex; align-items: center; transition: background 0.15s; }
        .vm-btn--close:hover { background: rgba(255,255,255,0.3); }

        .vm-body { display: flex; flex: 1; overflow: hidden; min-height: 0; }

        .vm-left { width: 420px; flex-shrink: 0; overflow-y: auto; padding: 20px 24px; background: #fff; }
        .vm-left::-webkit-scrollbar { width: 4px; }
        .vm-left::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 2px; }

        .vm-badges { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 18px; }
        .vm-badge { font-size: 12px; padding: 4px 14px; border-radius: 20px; font-weight: 600; display: inline-block; }

        .vm-summary { font-size: 13px; color: #444; line-height: 1.75; padding: 14px 16px; background: linear-gradient(135deg, #f8fafc, #f0fdfa); border-radius: 10px; border-left: 4px solid #229C8B; margin-bottom: 20px; }

        .vm-section { background: #fff; border-radius: 12px; padding: 18px; margin-bottom: 16px; border: 1px solid #f1f5f9; transition: box-shadow 0.2s; }
        .vm-section:hover { box-shadow: 0 2px 12px rgba(0,0,0,0.04); }

        .vm-section-title { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; color: #229C8B; margin: 0 0 14px; padding-bottom: 10px; border-bottom: 1px solid #f1f5f9; }

        .vm-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 20px; }
        .vm-info-label { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 2px; }
        .vm-info-value { font-size: 13px; color: #1e293b; font-weight: 500; }
        .vm-info-na { color: #d1d5db; }

        .vm-link { color: #229C8B; text-decoration: none; font-weight: 600; display: inline-flex; align-items: center; gap: 4px; transition: color 0.15s; }
        .vm-link:hover { color: #187e71; text-decoration: underline; }

        .vm-skills { display: flex; flex-wrap: wrap; gap: 6px; }
        .vm-skill-chip { padding: 5px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; }

        .vm-exp-card { padding: 14px 16px; background: #f8fafc; border-radius: 10px; border-left: 3px solid #229C8B; transition: background 0.15s; }
        .vm-exp-card:hover { background: #f0fdfa; }
        .vm-edu-card { padding: 14px 16px; background: #f8fafc; border-radius: 10px; transition: background 0.15s; }
        .vm-edu-card:hover { background: #eff6ff; }
        .vm-cert-card { padding: 14px 16px; background: #f0fdf4; border-radius: 10px; border: 1px solid #bbf7d0; transition: background 0.15s; }
        .vm-cert-card:hover { background: #ecfdf5; }

        .vm-phone-list { display: flex; flex-direction: column; gap: 4px; }
        .vm-phone-item { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #1e293b; font-weight: 500; }
        .vm-phone-badge { font-size: 10px; padding: 1px 6px; border-radius: 8px; background: #e0f2fe; color: #0369a1; font-weight: 600; }

        .vm-right { flex: 1; display: flex; flex-direction: column; background: #f8fafc; min-width: 0; border-left: 1px solid #e5e7eb; }
        .vm-preview-header { padding: 14px 20px; border-bottom: 1px solid #e5e7eb; background: #fff; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }
        .vm-preview-title { margin: 0; font-size: 14px; font-weight: 700; color: #374151; display: flex; align-items: center; gap: 8px; }
        .vm-preview-meta { font-size: 12px; color: #6b7280; }
        .vm-preview-body { flex: 1; overflow: hidden; position: relative; min-height: 0; }
        .vm-centered { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px; }

        .vm-doc-tabs { display: flex; gap: 6px; padding: 10px 20px; background: #fff; border-bottom: 1px solid #e5e7eb; overflow-x: auto; flex-shrink: 0; }
        .vm-doc-tab { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; border: 1px solid #e2e8f0; background: #fff; color: #475569; transition: all 0.15s; white-space: nowrap; }
        .vm-doc-tab:hover { border-color: #229C8B; color: #229C8B; }
        .vm-doc-tab--active { background: #f0fdfa; border-color: #229C8B; color: #229C8B; }
        .vm-doc-tab-primary { font-size: 9px; padding: 1px 5px; border-radius: 4px; background: #229C8B; color: #fff; font-weight: 700; }
        .vm-doc-tab-download { background: none; border: none; cursor: pointer; color: #94a3b8; padding: 2px; display: flex; align-items: center; transition: color 0.15s; }
        .vm-doc-tab-download:hover { color: #229C8B; }

        @media (max-width: 900px) {
          .vm-body { flex-direction: column; }
          .vm-left { width: 100%; max-height: 50vh; border-right: none; border-bottom: 1px solid #e5e7eb; }
          .vm-right { border-left: none; }
        }
      `}</style>

      <div className="vm-overlay" onClick={onClose}>
        <div className="vm-container" onClick={e => e.stopPropagation()}>

          {/* ── Header ── */}
          <div className="vm-header">
            <div className="vm-header-left">
              <div className="vm-avatar">{initials || '?'}</div>
              <div className="vm-header-info">
                <h2>{fullName || '—'}</h2>
                <p>{c.JobTitle || 'No job title'}</p>
              </div>
            </div>
            <div className="vm-header-actions">
              {activeDoc?.DocumentId && (
                <>
                  <button className="vm-btn vm-btn--preview" onClick={handleOpenInTab} disabled={previewLoading}>
                    {previewLoading
                      ? <><Loader size={14} style={{ animation: 'vm-spin 1s linear infinite' }} /> Loading…</>
                      : <><Eye size={14} /> Open Preview</>}
                  </button>
                  <button className="vm-btn vm-btn--download" onClick={() => handleDownload(activeDoc.DocumentId, activeDoc.FileNameOriginal)} disabled={downloading === activeDoc.DocumentId}>
                    {downloading === activeDoc.DocumentId
                      ? <><Loader size={14} style={{ animation: 'vm-spin 1s linear infinite' }} /> Downloading…</>
                      : <><Download size={14} /> Download</>}
                  </button>
                </>
              )}
              <button className="vm-btn--close" onClick={onClose}><X size={18} /></button>
            </div>
          </div>

          {/* ── Body ── */}
          <div className="vm-body">

            {/* ── Left Panel ── */}
            <div className="vm-left">

              {detailLoading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, color: '#229C8B', fontSize: 13 }}>
                  <Loader size={14} style={{ animation: 'vm-spin 1s linear infinite' }} /> Loading full details…
                </div>
              )}

              {/* Badges */}
              <div className="vm-badges">
                <span className="vm-badge" style={{ background: statusStyle.bg, color: statusStyle.color }}>
                  {c.CandidateStatus || 'Available'}
                </span>
                <span className="vm-badge" style={{ background: remoteStyle.bg, color: remoteStyle.color }}>
                  {c.RemoteStatus === 'OnSite' ? 'On-Site' : (c.RemoteStatus || 'On-Site')}
                </span>
                {c.CandidateCode && (
                  <span className="vm-badge" style={{ background: '#f1f5f9', color: '#475569' }}>{c.CandidateCode}</span>
                )}
              </div>

              {/* Summary */}
              {c.ProfileSummary && <div className="vm-summary">{c.ProfileSummary}</div>}

              {/* Contact — show ALL emails & phones */}
              <div className="vm-section">
                <h4 className="vm-section-title"><Mail size={15} /> Contact Information</h4>
                <div className="vm-info-grid">

                  {/* Emails */}
                  <div>
                    <div className="vm-info-label">Email{emails.length > 1 ? 's' : ''}</div>
                    <div className="vm-info-value">
                      {emails.length > 0
                        ? emails.map((em, i) => (
                            <div key={i} style={{ marginBottom: i < emails.length - 1 ? 4 : 0 }}>
                              <a href={`mailto:${em}`} className="vm-link">{em}</a>
                            </div>
                          ))
                        : <span className="vm-info-na">N/A</span>}
                    </div>
                  </div>

                  {/* Phones */}
                  <div>
                    <div className="vm-info-label">Phone{phones.length > 1 ? 's' : ''}</div>
                    <div className="vm-phone-list">
                      {phones.length > 0
                        ? phones.map((ph, i) => (
                            <div key={i} className="vm-phone-item">
                              <Phone size={12} color="#229C8B" />
                              {ph}
                              {i === 0 && phones.length > 1 && <span className="vm-phone-badge">Primary</span>}
                            </div>
                          ))
                        : <span className="vm-info-na">N/A</span>}
                    </div>
                  </div>

                  <div>
                    <div className="vm-info-label">Gender</div>
                    <div className="vm-info-value">{c.Gender || <span className="vm-info-na">N/A</span>}</div>
                  </div>
                  <div>
                    <div className="vm-info-label">Years of Experience</div>
                    <div className="vm-info-value">
                      {c.YearsOfExperience != null
                        ? <span style={{ fontWeight: 700, color: '#229C8B' }}>{c.YearsOfExperience} yrs</span>
                        : <span className="vm-info-na">N/A</span>}
                    </div>
                  </div>
                  {c.LinkedInUrl && (
                    <div>
                      <div className="vm-info-label">LinkedIn</div>
                      <div className="vm-info-value">
                        <a href={c.LinkedInUrl} target="_blank" rel="noopener noreferrer" className="vm-link"><Linkedin size={13} /> View Profile</a>
                      </div>
                    </div>
                  )}
                  {c.GitHubUrl && (
                    <div>
                      <div className="vm-info-label">GitHub</div>
                      <div className="vm-info-value">
                        <a href={c.GitHubUrl} target="_blank" rel="noopener noreferrer" className="vm-link"><Github size={13} /> View Profile</a>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Skills */}
              {c.Skills?.length > 0 && (
                <div className="vm-section">
                  <h4 className="vm-section-title"><Award size={15} /> Skills ({c.Skills.length})</h4>
                  <div className="vm-skills">
                    {c.Skills.map((skill, i) => {
                      const sc = SKILL_TYPE_COLORS[skill.SkillType] || SKILL_TYPE_COLORS['HARD'];
                      return (
                        <span key={i} className="vm-skill-chip" style={{ background: sc.bg, color: sc.color }}>
                          {skill.SkillName}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Work Experience */}
              {c.WorkExperience?.length > 0 && (
                <div className="vm-section">
                  <h4 className="vm-section-title"><Briefcase size={15} /> Work Experience ({c.WorkExperience.length})</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {c.WorkExperience.map((exp, i) => (
                      <div key={i} className="vm-exp-card">
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>{exp.JobTitle || '—'}</div>
                        <div style={{ fontSize: 13, color: '#229C8B', fontWeight: 600, marginBottom: 4 }}>{exp.Company || '—'}</div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>
                          {formatMonthYear(exp.StartDate) || '—'} — {exp.IsCurrent
                            ? <span style={{ color: '#229C8B', fontWeight: 600 }}>Present</span>
                            : (formatMonthYear(exp.EndDate) || '—')}
                        </div>
                        {exp.Description && (
                          <p style={{ margin: '8px 0 0', fontSize: 12, color: '#555', lineHeight: 1.65 }}>{exp.Description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {c.Education?.length > 0 && (
                <div className="vm-section">
                  <h4 className="vm-section-title"><GraduationCap size={15} /> Education ({c.Education.length})</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {c.Education.map((edu, i) => (
                      <div key={i} className="vm-edu-card">
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>
                          {edu.Degree}{edu.FieldOfStudy ? ` — ${edu.FieldOfStudy}` : ''}
                        </div>
                        <div style={{ fontSize: 13, color: '#229C8B', fontWeight: 600 }}>{edu.Institution}</div>
                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                          {formatMonthYear(edu.StartDate)} — {formatMonthYear(edu.EndDate)}
                          {edu.GPA && <span style={{ marginLeft: 10 }}>· GPA: {edu.GPA}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Certifications */}
              {c.Certifications?.length > 0 && (
                <div className="vm-section">
                  <h4 className="vm-section-title"><Award size={15} /> Certifications ({c.Certifications.length})</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {c.Certifications.map((cert, i) => (
                      <div key={i} className="vm-cert-card">
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>{cert.CertificationName || '—'}</div>
                        <div style={{ fontSize: 13, color: '#065f46', fontWeight: 600 }}>{cert.IssuingOrganization}</div>
                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                          Issued: {formatMonthYear(cert.IssueDate) || '—'}
                          {cert.ExpiryDate && <span style={{ marginLeft: 10 }}>· Expires: {formatMonthYear(cert.ExpiryDate)}</span>}
                          {cert.CredentialId && <span style={{ marginLeft: 10 }}>· ID: {cert.CredentialId}</span>}
                        </div>
                        {cert.CredentialUrl && (
                          <a href={cert.CredentialUrl} target="_blank" rel="noopener noreferrer" className="vm-link" style={{ marginTop: 6, display: 'inline-flex' }}>
                            <ExternalLink size={12} /> Verify Credential
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Record Info */}
              <div className="vm-section">
                <h4 className="vm-section-title"><Clock size={15} /> Record Info</h4>
                <div className="vm-info-grid">
                  <div>
                    <div className="vm-info-label">Created Date</div>
                    <div className="vm-info-value">{formatDate(c.CreatedDt) || <span className="vm-info-na">N/A</span>}</div>
                  </div>
                  <div>
                    <div className="vm-info-label">Created By</div>
                    <div className="vm-info-value">{c.CreatedBy || <span className="vm-info-na">—</span>}</div>
                  </div>
                </div>
              </div>

            </div>{/* end left panel */}

            {/* ── Right Panel — Resume Preview ── */}
            <div className="vm-right">

              {/* Document tabs (show all versions) */}
              {documents.length > 1 && (
                <div className="vm-doc-tabs">
                  {documents.map((doc, i) => (
                    <div
                      key={doc.DocumentId}
                      className={`vm-doc-tab ${doc.DocumentId === activeDocId ? 'vm-doc-tab--active' : ''}`}
                      onClick={() => loadPreview(doc.DocumentId)}
                    >
                      <FileText size={13} />
                      <span>{doc.FileNameOriginal || `Resume v${doc.VersionNo || i + 1}`}</span>
                      {doc.IsPrimary && <span className="vm-doc-tab-primary">PRIMARY</span>}
                      <button
                        className="vm-doc-tab-download"
                        onClick={(e) => { e.stopPropagation(); handleDownload(doc.DocumentId, doc.FileNameOriginal); }}
                        title="Download this version"
                      >
                        <Download size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Preview header */}
              <div className="vm-preview-header">
                <h4 className="vm-preview-title">
                  <FileText size={15} color="#229C8B" />
                  Resume Document
                  {documents.length > 1 && <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 400 }}>({documents.length} versions)</span>}
                </h4>
                {activeDoc?.FileNameOriginal && (
                  <span className="vm-preview-meta">
                    {activeDoc.FileNameOriginal}
                    {activeDoc.FileSizeBytes ? ` · ${formatFileSize(activeDoc.FileSizeBytes)}` : ''}
                  </span>
                )}
              </div>

              {/* Preview body */}
              <div className="vm-preview-body">
                {/* No document */}
                {documents.length === 0 && (
                  <div className="vm-centered">
                    <FileText size={52} color="#d1d5db" />
                    <p style={{ color: '#94a3b8', marginTop: 12, fontSize: 14 }}>No resume file available</p>
                  </div>
                )}

                {/* Loading */}
                {documents.length > 0 && previewLoading && (
                  <div className="vm-centered">
                    <Loader size={36} color="#229C8B" style={{ animation: 'vm-spin 1s linear infinite' }} />
                    <p style={{ color: '#229C8B', marginTop: 12, fontSize: 14 }}>Loading preview…</p>
                  </div>
                )}

                {/* Error */}
                {documents.length > 0 && !previewLoading && previewError && (
                  <div className="vm-centered">
                    <FileText size={52} color="#fca5a5" />
                    <p style={{ color: '#ef4444', marginTop: 12, fontSize: 14, textAlign: 'center', maxWidth: 280 }}>{previewError}</p>
                    <button className="vm-btn vm-btn--download" onClick={() => handleDownload(activeDoc?.DocumentId, activeDoc?.FileNameOriginal)} style={{ marginTop: 12 }}>
                      <Download size={14} /> Download Instead
                    </button>
                  </div>
                )}

                {/* Inline preview (PDF or Word converted to HTML) */}
                {documents.length > 0 && !previewLoading && !previewError && previewUrl && isPreviewable && (
                  <iframe src={previewUrl} title="Resume Preview" style={{ width: '100%', height: '100%', border: 'none', display: 'block' }} />
                )}

                {/* Non-previewable files */}
                {documents.length > 0 && !previewLoading && !previewError && previewUrl && !isPreviewable && (
                  <div className="vm-centered">
                    <div style={{ width: 72, height: 72, background: '#e0f2fe', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FileText size={32} color="#0369a1" />
                    </div>
                    <div style={{ textAlign: 'center', marginTop: 12 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: '#111' }}>{activeDoc?.FileNameOriginal}</div>
                      <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
                        {(activeDoc?.FileExtension || '').toUpperCase().replace('.', '')} file · {formatFileSize(activeDoc?.FileSizeBytes)}
                      </div>
                      <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 8, maxWidth: 260 }}>This file type cannot be previewed in the browser.</p>
                    </div>
                    <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                      <button className="vm-btn vm-btn--preview" onClick={handleOpenInTab} style={{ color: '#229C8B', borderColor: '#229C8B' }}>
                        <ExternalLink size={14} /> Open in Tab
                      </button>
                      <button className="vm-btn vm-btn--download" onClick={() => handleDownload(activeDoc?.DocumentId, activeDoc?.FileNameOriginal)} disabled={downloading === activeDoc?.DocumentId}>
                        {downloading === activeDoc?.DocumentId ? <><Loader size={14} /> Downloading…</> : <><Download size={14} /> Download</>}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>{/* end right panel */}

          </div>{/* end body */}
        </div>
      </div>
    </>
  );
};

export default ViewModal;