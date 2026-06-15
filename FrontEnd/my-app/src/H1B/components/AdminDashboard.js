import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/H1B.css';
import BASE_URL from '../../url';
import { FaTrash, FaCheckCircle, FaTimesCircle, FaSpinner, FaDownload, FaCircle, FaFileAlt, FaFilePdf, FaFileWord, FaEye } from 'react-icons/fa';
import { generateSubmissionPDF } from '../utils/pdfUtils';
import { generateSubmissionWord } from '../utils/wordUtils';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [companyFilter, setCompanyFilter] = useState("Prophecy Technologies");
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState("online");
  const [stats, setStats] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); // { id, name }
  const [pdfLoadingId, setPdfLoadingId] = useState(null);
  const [wordLoadingId, setWordLoadingId] = useState(null);

  const checkBackendConnection = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/h1b/statistics`);
      if (response.ok) {
        setBackendStatus("online");
        load();
      } else {
        setBackendStatus("offline");
      }
    } catch (error) {
      setBackendStatus("offline");
    }
  };

  const downloadPDF = async (submissionId, row) => {
    setPdfLoadingId(submissionId);
    try {
      const fileName = await generateSubmissionPDF(submissionId, row);
      setMsg(<span><FaCheckCircle style={{ marginRight: 4 }} /> PDF downloaded: {fileName}</span>);
    } catch (err) {
      console.error('PDF error:', err);
      setMsg(<span><FaTimesCircle style={{ marginRight: 4 }} /> Failed to generate PDF: {err.message}</span>);
    } finally {
      setPdfLoadingId(null);
    }
  };

  const downloadWord = async (submissionId, row) => {
    setWordLoadingId(submissionId);
    try {
      const fileName = await generateSubmissionWord(submissionId, row);
      setMsg(<span><FaCheckCircle style={{ marginRight: 4 }} /> Word downloaded: {fileName}</span>);
    } catch (err) {
      console.error('Word error:', err);
      setMsg(<span><FaTimesCircle style={{ marginRight: 4 }} /> Failed to generate Word: {err.message}</span>);
    } finally {
      setWordLoadingId(null);
    }
  };

  const load = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (companyFilter !== "All") params.append('company', companyFilter);
      const response = await fetch(`${BASE_URL}/api/h1b/submissions?${params.toString()}`);
      if (!response.ok) throw new Error(`Failed to fetch submissions: ${response.status}`);
      const result = await response.json();
      if (result.success) {
        setRows(result.data || []);
        setBackendStatus("online");
      } else {
        throw new Error(result.message || 'Failed to load data');
      }
    } catch (error) {
      console.error('Load error:', error);
      setBackendStatus("offline");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsParams = new URLSearchParams();
      if (companyFilter !== "All") statsParams.append('company', companyFilter);
      const response = await fetch(`${BASE_URL}/api/h1b/statistics?${statsParams.toString()}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) setStats(result.data);
      }
    } catch (error) {
      console.error('Stats error:', error);
    }
  };

  const checkLoginStatus = () => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    if (!token || role !== 'admin') return false;
    return true;
  };

  const handleViewDetails = (id) => {
    navigate(`/h1b/submissions/${id}`);
  };

  // ✅ Show delete confirmation modal
  const handleDeleteConfirm = (row) => {
    setConfirmDelete({ id: row.Id, name: `${row.FirstName} ${row.LastName}` });
  };

  const handleDeleteCancel = () => {
    setConfirmDelete(null);
  };

  // ✅ Execute delete after confirmation
  const handleDeleteSubmit = async () => {
    if (!confirmDelete) return;
    const { id, name } = confirmDelete;
    setConfirmDelete(null);
    setDeletingId(id);
    setMsg(null);

    try {
      const response = await fetch(`${BASE_URL}/api/h1b/submissions/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setRows(prev => prev.filter(r => r.Id !== id));
        setMsg(`Excel file downloaded successfully`);
        loadStats();
      } else {
        throw new Error(result.message || 'Failed to delete submission');
      }
    } catch (error) {
      console.error('Delete error:', error);
      setMsg(`Error: ${error.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  // ✅ Export ALL submissions with ALL fields to Excel/CSV
  const exportAllToExcel = async () => {
    setExportLoading(true);
    setMsg(null);
    try {
      const exportParams = new URLSearchParams();
      if (companyFilter !== "All") exportParams.append('company', companyFilter);
      const response = await fetch(`${BASE_URL}/api/h1b/submissions?${exportParams.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch all submissions');
      const result = await response.json();
      if (!result.success) throw new Error(result.message || 'Failed to load data');

      const allRows = result.data || [];
      if (allRows.length === 0) {
        setMsg(<span><FaTimesCircle /> No submissions found to export.</span>);
        return;
      }

      const headers = [
        'Submission ID', 'Submission Date', 'Status',
        'Prefix', 'First Name', 'Middle Name', 'Last Name',
        'Gender', 'Date of Birth', 'Email', 'Phone',
        'Passport Number', 'Passport Expiry Date', 'Nationality',
        'Country of Birth', 'Place of Birth',
        'Current Nonimmigrant Status', 'I-94 Expiration',
        'Filing Type', 'Employer Name', 'Anticipated Start Date',
        'Job Title', 'Expected Salary', 'Job Summary',
        'Worksite Address', 'Home Address', 'Offsite Details',
        'End Client', 'Tier 1 Vendor', 'Tier 2 Vendor', 'Tier 3 Vendor',
        "Bachelor's Degree", "Bachelor's Field",
        "Master's Degree", "Master's Field", "Master's Cap Quota Eligible",
        'H4 Required', 'Consent',
        'Passport File', 'Visa Copy File', 'Resume File'
      ];

      const escapeCSV = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;

      const dataRows = allRows.map(r => [
        r.SubmissionId || r.Id || '',
        r.CreatedAt ? new Date(r.CreatedAt).toLocaleDateString() : '',
        r.PetitionStatus || '',
        r.Prefix || '',
        r.FirstName || '',
        r.MiddleName || '',
        r.LastName || '',
        r.Gender || '',
        r.DateOfBirth ? new Date(r.DateOfBirth).toLocaleDateString() : '',
        r.Email || '',
        r.Phone || '',
        r.PassportNumber || '',
        r.PassportExpiryDate ? new Date(r.PassportExpiryDate).toLocaleDateString() : '',
        r.Nationality || '',
        r.CountryOfBirth || '',
        r.PlaceOfBirth || '',
        r.CurrentStatus || '',
        r.I94Expiration ? new Date(r.I94Expiration).toLocaleDateString() : '',
        r.FilingType || '',
        r.EmployerName || '',
        r.AnticipatedStartDate ? new Date(r.AnticipatedStartDate).toLocaleDateString() : '',
        r.PositionTitle || '',
        r.ExpectedSalary || '',
        r.JobSummary || '',
        r.WorksiteAddress || '',
        r.HomeAddress || '',
        r.OffsiteDetails || '',
        r.EndClient || '',
        r.Tier1Vendor || '',
        r.Tier2Vendor || '',
        r.Tier3Vendor || '',
        r.BachelorsDegree || '',
        r.BachelorsField || '',
        r.MastersDegree || '',
        r.MastersField || '',
        r.MastersCapQuotaEligible || '',
        r.H4Required || '',
        r.Consent ? 'Yes' : 'No',
        r.PassportCopyS3Key || '',
        r.VisaCopyS3Key || '',
        r.ResumeS3Key || ''
      ].map(escapeCSV).join(','));

      const csvContent = [headers.map(escapeCSV).join(','), ...dataRows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `h1b-all-submissions-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      setMsg(<span><FaCheckCircle /> Exported {allRows.length} submission(s) successfully!</span>);
    } catch (error) {
      console.error('Export error:', error);
      setMsg(<span><FaTimesCircle /> Export failed: {error.message}</span>);
    } finally {
      setExportLoading(false);
    }
  };

  useEffect(() => {
    if (checkLoginStatus()) {
      load();
      loadStats();
    } else {
      setTimeout(() => navigate("/login"), 1000);
    }
  }, [companyFilter]);

  return (
    <div className="applicants-table-wrapper" style={{ padding: '20px', background: '#f5f5f5', minHeight: '100vh' }}>

      {/* ✅ Delete Confirmation Modal */}
      {confirmDelete && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: 'white', borderRadius: '14px',
            padding: '36px 32px', maxWidth: '420px', width: '90%',
            boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
            textAlign: 'center'
          }}>
            <FaTrash size={48} style={{ marginBottom: '12px' }} />
            <h3 style={{ margin: '0 0 10px 0', color: '#1e293b', fontSize: '20px', fontWeight: 800 }}>
              Delete Submission?
            </h3>
            <p style={{ margin: '0 0 28px 0', color: '#64748B', fontSize: '14px', lineHeight: 1.6 }}>
              You are about to permanently delete the submission for{' '}
              <strong style={{ color: '#1e293b' }}>{confirmDelete.name}</strong>.
              <br />
              <span style={{ color: '#ef4444', fontWeight: 600 }}>This action cannot be undone.</span>
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleDeleteCancel}
                style={{
                  flex: 1, padding: '11px 16px',
                  border: '1.5px solid #e2e8f0', borderRadius: '8px',
                  background: 'white', color: '#475569',
                  fontSize: '14px', fontWeight: 600, cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSubmit}
                style={{
                  flex: 1, padding: '11px 16px',
                  border: 'none', borderRadius: '8px',
                  background: '#ef4444', color: 'white',
                  fontSize: '14px', fontWeight: 700, cursor: 'pointer'
                }}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <header style={{ marginBottom: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 800, color: '#333' }}>
              H1B Admin
            </h1>
            {/* <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>H-1B Intake Dashboard</div> */}
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={exportAllToExcel}
              disabled={exportLoading}
              className="applicants-submit-resume-btn"
              style={{
                background: exportLoading ? '#64748B' : '#10b981',
                color: 'white', padding: '8px 18px', border: 'none',
                borderRadius: '6px', cursor: exportLoading ? 'not-allowed' : 'pointer',
                fontSize: '13px', fontWeight: 600
              }}
            >
              {exportLoading ? <FaSpinner className="spin" /> : <FaDownload />} Export All to Excel
            </button>
            <div style={{
              fontSize: '12px', padding: '6px 12px',
              background: backendStatus === 'online' ? '#d1fae5' : '#fee2e2',
              color: backendStatus === 'online' ? '#065f46' : '#991b1b',
              borderRadius: '4px', fontWeight: 600
            }}>
              {backendStatus === 'online' ? <><FaCircle style={{color: '#10b981'}} /> Online</> : <><FaCircle style={{color: '#ef4444'}} /> Offline</>}
            </div>
          </div>
        </div>
      </header>

      {msg && (
        <div style={{
          marginBottom: '16px', padding: '12px 16px',
          background: typeof msg === 'string' && msg.includes("✅") ? '#d1fae5' : '#fee2e2',
          borderRadius: '6px',
          color: typeof msg === 'string' && msg.includes("✅") ? '#065f46' : '#dc2626',
          fontWeight: 500, fontSize: '14px'
        }}>
          {msg}
        </div>
      )}

      {stats && (
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "12px", marginBottom: "20px"
        }}>
          <div style={{
            padding: "16px", background: "white", borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)", textAlign: "center", border: "1px solid #e0e0e0"
          }}>
            <div style={{ fontSize: "24px", fontWeight: 800, color: "#0B2A4A" }}>{stats.total}</div>
            <div style={{ fontSize: "12px", color: "#64748B" }}>Total Submissions</div>
          </div>
          {stats.byStatus?.map(s => (
            <div key={s.PetitionStatus} style={{
              padding: "16px", background: "white", borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)", textAlign: "center", border: "1px solid #e0e0e0"
            }}>
              <div style={{
                fontSize: "24px", fontWeight: 800,
                color: s.PetitionStatus === 'approved' ? '#10b981' :
                       s.PetitionStatus === 'rejected' ? '#ef4444' : '#f59e0b'
              }}>
                {s.count}
              </div>
              <div style={{ fontSize: "12px", color: "#64748B", textTransform: "capitalize" }}>
                {s.PetitionStatus}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: '24px' }}>
        <div className="applicants-filters-section" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <select 
            value={companyFilter} 
            onChange={(e) => setCompanyFilter(e.target.value)}
            style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc', outline: 'none' }}
          >
            <option value="Prophecy Technologies">Prophecy Technologies</option>
            <option value="Cognifyar Technologies">Cognifyar Technologies</option>
            <option value="Disensystem">Disensystem</option>
          </select>
          <div className="applicants-search-box" style={{ flex: 1, minWidth: '200px' }}>
            <svg className="applicants-search-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor">
              <path d="M11.5 11.5L14 14" strokeLinecap="round"/>
              <circle cx="7" cy="7" r="5"/>
            </svg>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, email, passport..."
              className="applicants-search-input"
              onKeyPress={(e) => e.key === 'Enter' && load()}
            />
          </div>
          <button
            onClick={load}
            disabled={loading || backendStatus === "offline"}
            className="applicants-submit-resume-btn"
            style={{ minWidth: "100px", padding: "10px 20px" }}
          >
            {loading ? "Loading..." : "Search"}
          </button>
        </div>

        {backendStatus === "offline" ? (
          <div style={{
            textAlign: "center", padding: "40px", background: "white",
            borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", border: "1px solid #e0e0e0"
          }}>
            <div style={{ fontSize: '16px', color: '#ef4444', marginBottom: '12px' }}><FaTimesCircle /> Backend Server is Offline</div>
            <div style={{ fontSize: "14px", color: "#64748B", marginBottom: "20px" }}>
              Cannot connect to backend server at {BASE_URL}
            </div>
            <button onClick={checkBackendConnection} className="applicants-submit-resume-btn">
              Retry Connection
            </button>
          </div>
        ) : loading ? (
          <div style={{
            textAlign: "center", padding: "40px", background: "white",
            borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", border: "1px solid #e0e0e0"
          }}>
            <div style={{ fontSize: "16px", color: "#64748B" }}>Loading submissions...</div>
            <div style={{ marginTop: "20px" }}>
              <div style={{
                width: "40px", height: "40px",
                border: "4px solid #f3f3f3", borderTop: "4px solid #038a77",
                borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto"
              }}></div>
            </div>
          </div>
        ) : (
          <div className="applicants-table-container">
            <div style={{
              padding: "14px", display: "flex", justifyContent: "space-between",
              alignItems: "center", background: "white", borderBottom: "1px solid #e0e0e0"
            }}>
              <div style={{ fontSize: "16px", fontWeight: 600, color: "#333" }}>
                Latest Submissions ({rows.length})
              </div>
              <div style={{ fontSize: "12px", color: "#64748B" }}>Live Data</div>
            </div>

            {rows.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#475569", background: "white" }}>
                <div style={{ marginBottom: "12px" }}>No submissions found.</div>
                <div style={{ fontSize: "13px", color: "#64748B" }}>Try submitting a form from the main page first.</div>
                <div style={{ marginTop: "16px" }}>
                  <a
                    href="/h1b-intake"
                    className="applicants-submit-resume-btn"
                    style={{ display: "inline-block", textDecoration: "none", fontSize: "13px", padding: "8px 16px" }}
                  >
                    Go to H1B Intake Form
                  </a>
                </div>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="applicants-data-table">
                  <thead>
                    <tr className="applicants-header-row">
                      <th className="applicants-header-cell">Submitted</th>
                      <th className="applicants-header-cell">Name</th>
                      <th className="applicants-header-cell">Email</th>
                      <th className="applicants-header-cell">Passport</th>
                      <th className="applicants-header-cell">Filing Type</th>
                      <th className="applicants-header-cell">Status</th>
                      <th className="applicants-header-cell">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="applicants-table-body">
                    {rows.map((r) => (
                      <tr
                        key={r.Id}
                        className="applicants-body-row"
                        style={{ opacity: deletingId === r.Id ? 0.4 : 1, transition: 'opacity 0.3s' }}
                      >
                        <td className="applicants-body-cell" style={{ whiteSpace: "nowrap" }}>
                          {new Date(r.CreatedAt).toLocaleDateString()}
                        </td>
                        <td className="applicants-body-cell" style={{ fontWeight: 800 }}>
                          {r.FirstName} {r.LastName}
                        </td>
                        <td className="applicants-body-cell">
                          <a href={`mailto:${r.Email}`} className="applicants-email-link">{r.Email}</a>
                        </td>
                        <td className="applicants-body-cell" style={{ fontFamily: "monospace" }}>
                          {r.PassportNumber || '-'}
                        </td>
                        <td className="applicants-body-cell">{r.FilingType}</td>
                        <td className="applicants-body-cell">
                          <span className={`applicants-position-badge ${
                            r.PetitionStatus === "approved" ? "h1b-status-approved" :
                            r.PetitionStatus === "rejected" ? "h1b-status-rejected" :
                            "h1b-status-pending"
                          }`}>
                            {r.PetitionStatus}
                          </span>
                        </td>
                        <td className="applicants-actions-cell">
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            {/* Download PDF Button */}
                            <button
                              onClick={() => downloadPDF(r.Id, r)}
                              disabled={pdfLoadingId === r.Id}
                              title="Download as PDF"
                              style={{
                                padding: "8px", fontSize: "14px",
                                border: "none", borderRadius: "6px",
                                cursor: pdfLoadingId === r.Id ? 'not-allowed' : 'pointer',
                                background: pdfLoadingId === r.Id ? '#94a3b8' : '#6366f1',
                                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center'
                              }}
                            >
                              {pdfLoadingId === r.Id ? <FaSpinner className="spin" /> : <FaFilePdf />}
                            </button>
                            {/* Download Word Button */}
                            <button
                              onClick={() => downloadWord(r.Id, r)}
                              disabled={wordLoadingId === r.Id}
                              title="Download as Word"
                              style={{
                                padding: "8px", fontSize: "14px",
                                border: "none", borderRadius: "6px",
                                cursor: wordLoadingId === r.Id ? 'not-allowed' : 'pointer',
                                background: wordLoadingId === r.Id ? '#94a3b8' : '#2563eb',
                                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center'
                              }}
                            >
                              {wordLoadingId === r.Id ? <FaSpinner className="spin" /> : <FaFileWord />}
                            </button>
                            {/* View Details Button */}
                            <button
                              onClick={() => handleViewDetails(r.Id)}
                              title="View Details"
                              className="applicants-submit-resume-btn"
                              style={{
                                padding: "8px", fontSize: "14px",
                                border: "none", borderRadius: "6px", cursor: "pointer",
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: '#038a77', color: 'white'
                              }}
                            >
                              <FaEye />
                            </button>
                            {/* Delete Button */}
                            <button
                              onClick={() => handleDeleteConfirm(r)}
                              disabled={deletingId === r.Id}
                              title="Delete Submission"
                              style={{
                                padding: "8px", fontSize: "14px",
                                border: "none", borderRadius: "6px",
                                cursor: deletingId === r.Id ? 'not-allowed' : 'pointer',
                                background: deletingId === r.Id ? '#94a3b8' : '#ef4444',
                                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center'
                              }}
                            >
                              {deletingId === r.Id ? <FaSpinner className="spin" /> : <FaTrash />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}