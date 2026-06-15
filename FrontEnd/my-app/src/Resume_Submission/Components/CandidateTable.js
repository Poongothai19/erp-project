import React, { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Edit2, Trash2, ArrowUp, ArrowDown, ArrowUpDown, ChevronLeft, ChevronRight, MoreVertical, Share2, Calendar, Flag, Sparkles, Send } from 'lucide-react';
import { formatDate } from '../utils/mockData';
import '../styles/CandidateTableCustom.css';
import { formatFullName } from '../utils/nameFormatter';

/* ── Helper: initials from name ── */
const getInitials = (first, last) => {
  const f = (first || '').charAt(0).toUpperCase();
  const l = (last || '').charAt(0).toUpperCase();
  return f + l || '?';
};

/* ── Avatar colour from name (deterministic) ── */
const AVATAR_COLORS = [
  '#229C8B', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b',
  '#10b981', '#6366f1', '#ef4444', '#14b8a6', '#f97316',
];
const avatarColor = (name) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

/* ── Normalize skills: split "Html,css,javascript" into ["Html","css","javascript"] ── */
const normalizeSkills = (skills = []) =>
  skills.flatMap(s => {
    const name = (s.SkillName || s || '').toString().trim();
    return name.includes(',')
      ? name.split(',').map(n => n.trim()).filter(Boolean)
      : name ? [name] : [];
  });

/* ── Format phone: ensure '+' prefix for international numbers ── */
const formatPhone = (phone) => {
  if (!phone) return null;
  const cleaned = phone.toString().trim();
  if (!cleaned) return null;
  return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
};

/* ── Sort Icon ── */
const SortIcon = ({ columnKey, sortConfig }) => {
  if (sortConfig.key !== columnKey)
    return <ArrowUpDown size={12} className="ct-sort-icon ct-sort-icon--inactive" />;
  return sortConfig.direction === 'asc'
    ? <ArrowUp   size={12} className="ct-sort-icon ct-sort-icon--active" />
    : <ArrowDown size={12} className="ct-sort-icon ct-sort-icon--active" />;
};

/* ── Status Badge ── */
const StatusBadge = ({ status }) => {
  const map = {
    Available:       'ct-badge--green',
    Hired:           'ct-badge--blue',
    'In Process':    'ct-badge--yellow',
    Interviewing:    'ct-badge--yellow',
    'Not Available': 'ct-badge--red',
    Unavailable:     'ct-badge--red',
    Placed:          'ct-badge--purple',
    'On Hold':       'ct-badge--gray',
    'On Bench':      'ct-badge--orange',
  };

  return <span className={`ct-badge ${map[status] || 'ct-badge--gray'}`}>{status || '—'}</span>;
};

/* ── Remote Badge ── */
const RemoteBadge = ({ status }) => {
  const map = {
    Remote: 'ct-badge--teal',
    OnSite: 'ct-badge--orange',
    Hybrid: 'ct-badge--indigo',
  };
  return (
    <span className={`ct-badge ${map[status] || 'ct-badge--gray'}`}>
      {status === 'OnSite' ? 'On-Site' : status || '—'}
    </span>
  );
};

/* ──────────────────────────────────────────────────────────────
   Main Component
   ────────────────────────────────────────────────────────────── */
const CandidateTable = ({
  candidates     = [],
  onView,
  onEdit,
  onShare,
  onSchedule,
  onDelete,
  visibleColumns = [],
  sortConfig     = { key: '', direction: 'asc' },
  onSort,
  currentPage    = 1,
  totalPages     = 1,
  totalCount     = 0,
  onPageChange,
  itemsPerPage   = 30,
  onItemsPerPageChange,
  selectedRows   = [],
  isAiSearching = false,
  onSelectionChange,
  onSubmitProfile,
}) => {
  const navigate = useNavigate();
  const show = (key) => visibleColumns.includes(key);
  const [hoveredRow, setHoveredRow] = useState(null);
  const [hoveredSkills, setHoveredSkills] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0, position: 'top', maxHeight: null });
  const [actionDropdown, setActionDropdown] = useState(null);
  const skillsRefMap = useRef({});
  const closeTimeoutRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.ct-action-dropdown-wrapper')) {
        setActionDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSkillsEnter = useCallback((candidateId, el) => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    if (el) {
      const rect = el.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const spaceAbove = rect.top;
      const spaceBelow = windowHeight - rect.bottom;

      // Show below if there's very little space above OR there's a lot more space below
      const showBelow = spaceAbove < 250 || spaceBelow > (spaceAbove + 100);

      setTooltipPos({
        top: showBelow ? rect.bottom + 8 : rect.top - 8,
        left: Math.min(rect.left, window.innerWidth - 380), // Prevent going off right edge (360px max-width + padding)
        position: showBelow ? 'bottom' : 'top',
        maxHeight: showBelow ? Math.max(150, spaceBelow - 24) : Math.max(150, spaceAbove - 24)
      });
    }
    setHoveredSkills(candidateId);
  }, []);

  const handleSkillsLeave = useCallback(() => {
    closeTimeoutRef.current = setTimeout(() => {
      setHoveredSkills(null);
    }, 250);
  }, []);

  const SortTh = ({ label, columnKey, className = '' }) => (
    <th
      className={`ct-th ct-th--sortable ${className}`}
      onClick={() => onSort && onSort(columnKey)}
    >
      <span className="ct-th-inner">
        {label}
        <SortIcon columnKey={columnKey} sortConfig={sortConfig} />
      </span>
    </th>
  );

  if (isAiSearching) {
    return (
      <div className="ct-empty ct-ai-searching-container">
        <div className="ct-ai-pulse-wrapper">
          <Sparkles className="ct-ai-pulse-icon" size={48} color="#229C8B" fill="#229C8B" />
          <div className="ct-ai-pulse-ring"></div>
          <div className="ct-ai-pulse-ring" style={{ animationDelay: '1s' }}></div>
          <div className="ct-ai-pulse-ring" style={{ animationDelay: '2s' }}></div>
        </div>
        <p className="ct-empty-title ct-ai-searching-text">AI is analyzing your database...</p>
        <p className="ct-empty-sub">Finding the best matches based on semantic relevance</p>
        
        <div className="ct-ai-progress-bar">
          <div className="ct-ai-progress-inner"></div>
        </div>
      </div>
    );
  }

  if (!candidates || candidates.length === 0) {
    return (
      <div className="ct-empty">
        <div className="ct-empty-icon text-gray-300">📋</div>
        <p className="ct-empty-title">No candidates found</p>
        <p className="ct-empty-sub">Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <div className="ct-container">
      <div className="ct-wrapper">
        <table className="ct-table">
          <thead>
            <tr>
              <th className="ct-th" style={{ width: '1%', minWidth: '30px', padding: '0 8px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                <input 
                  type="checkbox" 
                  checked={candidates.length > 0 && selectedRows && candidates.every(c => selectedRows.includes(c.CandidateId))}
                  onChange={(e) => {
                    if (e.target.checked) {
                      const newSelected = [...(selectedRows || [])];
                      candidates.forEach(c => {
                        if (!newSelected.includes(c.CandidateId)) newSelected.push(c.CandidateId);
                      });
                      onSelectionChange && onSelectionChange(newSelected);
                    } else {
                      const currentIds = candidates.map(c => c.CandidateId);
                      onSelectionChange && onSelectionChange((selectedRows || []).filter(id => !currentIds.includes(id)));
                    }
                  }}
                  style={{ accentColor: '#229C8B', width: 15, height: 15, cursor: 'pointer' }}
                />
              </th>
              {show('CandidateCode')     && <SortTh label="Candidate ID"  columnKey="CandidateCode" />}
              {show('EmployeeCode')      && <SortTh label="Employee ID"   columnKey="EmployeeCode" />}
              {show('Candidate')         && <SortTh label="Name"          columnKey="FirstName" />}
              {show('Email')             && <SortTh label="Email"         columnKey="Email" />}
              {show('Phone')             && <th className="ct-th">Phone</th>}
              {show('JobTitle')          && <SortTh label="Job Title"     columnKey="JobTitle" />}
              {show('YearsOfExperience') && <SortTh label="Exp."          columnKey="YearsOfExperience" className="ct-th--center" />}
              {show('Skills')            && <th className="ct-th">Skills</th>}
              {show('CandidateStatus')   && <SortTh label="Status"        columnKey="CandidateStatus" />}
              {show('RemoteStatus')      && <th className="ct-th">Work Type</th>}
              {show('CreatedDate')       && <SortTh label="Created"       columnKey="CreatedDt" />}
              {show('LinkedInUrl')       && <th className="ct-th">LinkedIn</th>}
              {show('GitHubUrl')         && <th className="ct-th">GitHub</th>}
              {show('CurrentLocation')   && <SortTh label="Location"       columnKey="CurrentLocation" />}
              {show('Gender')            && <SortTh label="Gender"         columnKey="Gender" />}
              {show('PersonType')        && <SortTh label="Type"           columnKey="IsEmployee" />}
              {show('IsBench')           && <SortTh label="Bench"          columnKey="IsBench" />}
              {show('Experience')        && <SortTh label="Experience"      columnKey="YearsOfExperience" />}
              {show('Relocation')        && <SortTh label="Reloc."         columnKey="WillingToRelocate" />}
              {show('Source')            && <th className="ct-th">Source</th>}
              {show('ProfileSummary')    && <th className="ct-th">Summary</th>}
              {show('Actions')           && <th className="ct-th ct-th--center">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {candidates.map((c, idx) => {
              const fullName = formatFullName(c.FirstName, c.MiddleName, c.LastName);
              const color = avatarColor(fullName || 'Unknown');
              const isHovered = hoveredRow === c.CandidateId;

              return (
                <tr
                  key={c.CandidateId}
                  className={`ct-row ${idx % 2 === 0 ? '' : 'ct-row--alt'} ${isHovered ? 'ct-row--hover' : ''}`}
                  onMouseEnter={() => setHoveredRow(c.CandidateId)}
                  onMouseLeave={() => setHoveredRow(null)}
                  style={{ zIndex: actionDropdown === c.CandidateId ? 99 : 'auto', position: 'relative' }}
                >

                  <td className="ct-td" style={{ width: '1%', minWidth: '30px', padding: '0 8px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                    <input 
                      type="checkbox" 
                      checked={selectedRows?.includes(c.CandidateId)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          onSelectionChange && onSelectionChange([...(selectedRows || []), c.CandidateId]);
                        } else {
                          onSelectionChange && onSelectionChange((selectedRows || []).filter(id => id !== c.CandidateId));
                        }
                      }}
                      style={{ accentColor: '#229C8B', width: 15, height: 15, cursor: 'pointer' }}
                    />
                  </td>

                  {show('CandidateCode') && (
                    <td className="ct-td">
                      <span
                        className="ct-code"
                        onClick={() => navigate(`/candidates/${c.CandidateId}`)}
                        style={{ cursor: 'pointer' }}
                      >
                        {c.CandidateCode || '—'}
                      </span>
                    </td>
                  )}

                  {show('EmployeeCode') && (
                    <td className="ct-td">
                      <span className="ct-code" style={{ color: '#64748b' }}>
                        {c.EmployeeCode || '—'}
                      </span>
                    </td>
                  )}

                  {show('Candidate') && (
                    <td className="ct-td">
                      <div className="ct-name-cell">
                        <div className="ct-avatar" style={{ background: color }}>
                          {getInitials(c.FirstName, c.LastName)}
                        </div>
                        <span
                          className="ct-name-link"
                          onClick={() => navigate(`/candidates/${c.CandidateId}`)}
                          title={fullName}
                          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          {fullName || '—'}
                          {c.IsBench && (
                            <span 
                              title="Bench Candidate" 
                              style={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                backgroundColor: '#fef3c7', 
                                color: '#d97706', 
                                borderRadius: '4px',
                                padding: '2px 4px'
                              }}
                            >
                              <Flag size={12} fill="#d97706" />
                            </span>
                          )}
                        </span>
                      </div>
                      {c.matchReason && (
                        <div className="ct-ai-reason" style={{ 
                          fontSize: '11.5px', color: '#0d9488', marginTop: '4px', 
                          fontStyle: 'italic', display: 'flex', alignItems: 'flex-start', gap: '6px',
                          paddingLeft: '32px', lineHeight: '1.4', maxWidth: '300px'
                        }}>
                          <Sparkles size={12} style={{ marginTop: '2px', flexShrink: 0 }} /> 
                          <span>{c.matchReason}</span>
                        </div>
                      )}
                    </td>
                  )}

                  {show('Email') && (
                    <td className="ct-td">
                      <span className="ct-email" title={c.Contact?.Email || ''}>
                        {c.Contact?.Email || <span className="ct-na">—</span>}
                      </span>
                    </td>
                  )}

                  {show('Phone') && (
                    <td className="ct-td">
                      <span className="ct-phone">{formatPhone(c.Contact?.Phone || c.Mobile || c.Contact?.Mobile) || <span className="ct-na">—</span>}</span>
                    </td>
                  )}

                  {show('JobTitle') && (
                    <td className="ct-td">
                      <span 
                        className="ct-jobtitle" 
                        title={c.JobTitle || ''}
                        style={{ 
                          cursor: 'pointer',
                          maxWidth: '200px',
                          display: 'inline-block'
                        }}
                      >
                        {c.JobTitle ? (
                          c.JobTitle.length > 25 
                            ? `${c.JobTitle.substring(0, 25)}...` 
                            : c.JobTitle
                        ) : (
                          <span className="ct-na">—</span>
                        )}
                      </span>
                    </td>
                  )}

                  {show('YearsOfExperience') && (
                    <td className="ct-td ct-td--center">
                      {c.YearsOfExperience != null
                        ? <span className="ct-exp">{c.YearsOfExperience}<small> yr</small></span>
                        : <span className="ct-na">—</span>}
                    </td>
                  )}

                  {show('Skills') && (() => {
                    const skills = normalizeSkills(c.Skills);
                    return (
                      <td className="ct-td ct-td--skills">
                        <div
                          className="ct-skills-wrapper"
                          ref={el => { if (el) skillsRefMap.current[c.CandidateId] = el; }}
                          onMouseEnter={(e) => skills.length > 0 && handleSkillsEnter(c.CandidateId, e.currentTarget)}
                          onMouseLeave={handleSkillsLeave}
                        >
                          <div className="ct-skills">
                            {skills.length > 0 ? (
                              <>
                                {skills.slice(0, 2).map((name, i) => (
                                  <span key={i} className="ct-skill-chip">{name}</span>
                                ))}
                                {skills.length > 2 && (
                                  <span style={{ color: '#6b7280', fontWeight: 'bold', marginLeft: '4px', fontSize: '14px', letterSpacing: '1px' }}>...</span>
                                )}
                              </>
                            ) : (
                              <span className="ct-na">—</span>
                            )}
                          </div>
                        </div>
                      </td>
                    );
                  })()}

                  {show('CandidateStatus') && (
                    <td className="ct-td ct-td--no-clip">
                      <StatusBadge status={c.CandidateStatus} />
                    </td>
                  )}

                  {show('RemoteStatus') && (
                    <td className="ct-td ct-td--no-clip">
                      <RemoteBadge status={c.RemoteStatus} />
                    </td>
                  )}

                  {show('CreatedDate') && (
                    <td className="ct-td ct-td--no-clip">
                      <span className="ct-date">{formatDate(c.CreatedDt) || '—'}</span>
                    </td>
                  )}

                  {show('LinkedInUrl') && (
                    <td className="ct-td">
                      {c.LinkedInUrl
                        ? <a href={c.LinkedInUrl} target="_blank" rel="noopener noreferrer" className="ct-link" title={c.LinkedInUrl} style={{ color: '#0077b5', textDecoration: 'none', fontSize: '12px' }}>
                            🔗 LinkedIn
                          </a>
                        : <span className="ct-na">—</span>}
                    </td>
                  )}

                  {show('GitHubUrl') && (
                    <td className="ct-td">
                      {c.GitHubUrl
                        ? <a href={c.GitHubUrl} target="_blank" rel="noopener noreferrer" className="ct-link" title={c.GitHubUrl} style={{ color: '#333', textDecoration: 'none', fontSize: '12px' }}>
                            🐙 GitHub
                          </a>
                        : <span className="ct-na">—</span>}
                    </td>
                  )}

                  {show('CurrentLocation') && (
                    <td className="ct-td">
                      <span className="ct-jobtitle" title={c.CurrentLocation || ''}>
                        {c.CurrentLocation || <span className="ct-na">—</span>}
                      </span>
                    </td>
                  )}

                  {show('Gender') && (
                    <td className="ct-td">
                      <span>{c.Gender || <span className="ct-na">—</span>}</span>
                    </td>
                  )}

                  {show('PersonType') && (
                    <td className="ct-td">
                      <span className={`ct-badge ${c.IsEmployee ? 'ct-badge--indigo' : 'ct-badge--teal'}`}>
                        {c.IsEmployee ? 'Employee' : 'Candidate'}
                      </span>
                    </td>
                  )}

                  {show('IsBench') && (
                    <td className="ct-td">
                      <span className={`ct-badge ${c.IsBench ? 'ct-badge--orange' : 'ct-badge--gray'}`}>
                        {c.IsBench ? 'Bench' : 'Non-Bench'}
                      </span>
                    </td>
                  )}

                  {show('Experience') && (
                    <td className="ct-td">
                      <span>{c.YearsOfExperience != null ? `${c.YearsOfExperience} yr` : <span className="ct-na">—</span>}</span>
                    </td>
                  )}

                  {show('Relocation') && (
                    <td className="ct-td">
                      <span className={`ct-badge ${c.WillingToRelocate ? 'ct-badge--green' : 'ct-badge--red'}`}>
                        {c.WillingToRelocate ? 'Yes' : 'No'}
                      </span>
                    </td>
                  )}

                  {show('Source') && (
                    <td className="ct-td">
                      <span>{c.Source || <span className="ct-na">—</span>}</span>
                    </td>
                  )}

                  {show('ProfileSummary') && (
                    <td className="ct-td" style={{ maxWidth: '200px' }}>
                      <span
                        className="ct-jobtitle"
                        title={c.ProfileSummary || ''}
                        style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '12px', color: '#6b7280' }}
                      >
                        {c.ProfileSummary || <span className="ct-na">—</span>}
                      </span>
                    </td>
                  )}

                  {show('Actions') && (
                    <td className="ct-td ct-td--center" style={{ overflow: 'visible', position: 'relative' }}>
                      <div className={`ct-actions ${(isHovered || actionDropdown === c.CandidateId) ? 'ct-actions--visible' : ''}`}>
                        <div className="ct-action-dropdown-wrapper" style={{ position: 'relative' }}>
                          <button
                            className="ct-action-btn ct-action-btn--view"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActionDropdown(actionDropdown === c.CandidateId ? null : c.CandidateId);
                            }}
                            title="More Actions"
                          >
                            <MoreVertical size={15} />
                          </button>
                          
                          {actionDropdown === c.CandidateId && (
                            <div style={{
                              position: 'absolute',
                              top: '100%',
                              right: 0,
                              marginTop: '4px',
                              backgroundColor: '#fff',
                              border: '1px solid #e5e7eb',
                              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                              borderRadius: '8px',
                              padding: '6px',
                              zIndex: 50,
                              minWidth: '170px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '2px'
                            }}>
                              <button
                                className="ct-dropdown-item"
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', fontSize: '13px', background: 'none', border: 'none', cursor: 'pointer', color: '#374151', borderRadius: '6px', textAlign: 'left', width: '100%' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActionDropdown(null);
                                  if (onShare) onShare(c);
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                              >
                                <Share2 size={14} color="#6b7280" /> Share Resume
                              </button>
                              <button
                                className="ct-dropdown-item"
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', fontSize: '13px', background: 'none', border: 'none', cursor: 'pointer', color: '#374151', borderRadius: '6px', textAlign: 'left', width: '100%' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActionDropdown(null);
                                  if (onSchedule) onSchedule(c);
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                              >
                                <Calendar size={14} color="#6b7280" /> Schedule Interview
                              </button>
                              <button
                                className="ct-dropdown-item"
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', fontSize: '13px', background: 'none', border: 'none', cursor: 'pointer', color: '#374151', borderRadius: '6px', textAlign: 'left', width: '100%' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActionDropdown(null);
                                  if (onSubmitProfile) onSubmitProfile(c);
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                              >
                                <Send size={14} color="#6b7280" /> Submit Profile
                              </button>
                            </div>
                          )}
                        </div>

                        <button
                          className="ct-action-btn ct-action-btn--edit"
                          onClick={() => onEdit && onEdit(c)}
                          title="Edit"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          className="ct-action-btn ct-action-btn--delete"
                          onClick={() => onDelete && onDelete(c.CandidateId)}
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  )}

                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalCount > 0 && (
        <div className="ct-pagination">
          <span className="ct-pagination-info">
            Showing <strong>{(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, totalCount)}</strong> of <strong>{totalCount}</strong>
            
            <select
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange && onItemsPerPageChange(Number(e.target.value))}
              style={{
                marginLeft: '12px',
                padding: '4px 8px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                outline: 'none',
                background: '#fff',
                color: '#374151',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              {[10, 15, 20, 25, 30, 35, 40, 45, 50].map(val => (
                <option key={val} value={val}>{val}</option>
              ))}
            </select>
          </span>
          <div className="ct-pagination-btns">
            <button
              className="ct-page-btn"
              disabled={currentPage <= 1}
              onClick={() => onPageChange && onPageChange(currentPage - 1)}
            >
              <ChevronLeft size={14} /> Prev
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let page;
              if (totalPages <= 5) {
                page = i + 1;
              } else if (currentPage <= 3) {
                page = i + 1;
              } else if (currentPage >= totalPages - 2) {
                page = totalPages - 4 + i;
              } else {
                page = currentPage - 2 + i;
              }
              return (
                <button
                  key={page}
                  className={`ct-page-btn ct-page-num ${currentPage === page ? 'ct-page-num--active' : ''}`}
                  onClick={() => onPageChange && onPageChange(page)}
                >
                  {page}
                </button>
              );
            })}
            <button
              className="ct-page-btn"
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange && onPageChange(currentPage + 1)}
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── Skills Tooltip Portal (renders outside the table to avoid overflow clipping) ── */}
      {hoveredSkills != null && (() => {
        const c = candidates.find(cd => cd.CandidateId === hoveredSkills);
        if (!c) return null;
        const skills = normalizeSkills(c.Skills);
        if (skills.length === 0) return null;
        return createPortal(
          <div
            className="ct-skills-tooltip"
            onMouseEnter={() => {
              if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
            }}
            onMouseLeave={handleSkillsLeave}
            style={{
              position: 'fixed',
              top: tooltipPos.top,
              left: tooltipPos.left,
              transform: tooltipPos.position === 'top' ? 'translateY(-100%)' : 'none',
              zIndex: 99999,
              pointerEvents: 'auto',
              maxHeight: tooltipPos.maxHeight ? `${tooltipPos.maxHeight}px` : undefined,
              overflowY: 'auto'
            }}
          >
            <div className="ct-tooltip-header">
              <span className="ct-tooltip-title">All Skills</span>
              <span className="ct-tooltip-count">{skills.length}</span>
            </div>
            <div className="ct-tooltip-chips">
              {skills.map((name, i) => (
                <span key={i} className="ct-tooltip-chip">{name}</span>
              ))}
            </div>
          </div>,
          document.body
        );
      })()}
    </div>
  );
};

export default CandidateTable;