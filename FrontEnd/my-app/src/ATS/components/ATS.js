import React, { useState, useEffect } from 'react';
import ApplicantsTable from './ApplicantsTable';
import CandidateForm from './CandidateForm';
import '../styles/ATS.css';
import { RefreshCw, AlertCircle } from 'lucide-react';
import BASE_URL from '../../url';

export default function ATS() {
  const [isCandidateView, setIsCandidateView] = useState(false);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);

  // Check if this is candidate form view from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('candidateForm') === 'true') {
      setIsCandidateView(true);
      document.body.classList.add('ats-candidate-view-active');
      return () => {
        document.body.classList.remove('ats-candidate-view-active');
      };
    }
  }, []);

  // Fetch applicants - NO AUTH REQUIRED
  const fetchApplicants = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('📡 Fetching applicants (no auth)...');
      
      const response = await fetch(`${BASE_URL}/api/ats/applicants`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('📥 Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setApplicants(data.data || []);
        setError('');
        console.log('✅ Loaded', data.data?.length || 0, 'applicants');
      }
    } catch (err) {
      console.error('❌ Fetch error:', err);
      setError(err.message || 'Failed to load applicants');
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics - NO AUTH REQUIRED
  const fetchStatistics = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/ats/statistics/dashboard`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStats(data.data);
          console.log('✅ Statistics loaded');
        }
      }
    } catch (err) {
      console.error('Stats error:', err);
    }
  };

  // Load data when component mounts
  useEffect(() => {
    if (!isCandidateView) {
      console.log('🔄 Loading ATS data...');
      fetchApplicants();
      fetchStatistics();
    }
  }, [isCandidateView]);

  const handleAddApplicant = (newApplicant) => {
    setApplicants([
      {
        id: newApplicant.id || applicants.length + 1,
        ...newApplicant,
        created_at: newApplicant.created_at || new Date().toISOString()
      },
      ...applicants
    ]);
    fetchStatistics();
  };

  const handleDeleteApplicant = () => {
    fetchStatistics();
  };

  const handleRefresh = () => {
    fetchApplicants();
    fetchStatistics();
  };

  // Candidate View
  if (isCandidateView) {
    return (
      <div className="ats-candidate-view-container">
        <div className="ats-candidate-view-wrapper">
          <CandidateForm onSubmit={handleAddApplicant} />
        </div>
      </div>
    );
  }

  // Main View
  return (
    <div className="ats-main-container">
      <div className="ats-main-header">
        <div className="ats-header-content">
          <h1 className="ats-main-title">ATS - Applicant Tracking System</h1>
          <p className="ats-header-subtitle">Manage and track job applicants</p>
        </div>
        <button
          className="ats-refresh-btn"
          onClick={handleRefresh}
          disabled={loading}
          title="Refresh applicants"
        >
          <RefreshCw size={20} className={loading ? 'spinning' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="ats-error-banner">
          <AlertCircle size={18} className="ats-error-icon" />
          <span>{error}</span>
        </div>
      )}

      {/* Statistics Dashboard */}
      {stats && (
        <div className="ats-stats-section">
          <div className="ats-stat-card">
            <div className="ats-stat-value">{stats.totalApplicants}</div>
            <div className="ats-stat-label">Total Applicants</div>
          </div>
          <div className="ats-stat-card">
            <div className="ats-stat-value">{stats.applicantsByPosition?.length || 0}</div>
            <div className="ats-stat-label">Open Positions</div>
          </div>
          <div className="ats-stat-card">
            <div className="ats-stat-value">{stats.recentApplicants?.length || 0}</div>
            <div className="ats-stat-label">Recent (Last 5)</div>
          </div>
        </div>
      )}

      <div className="ats-main-content">
        {loading && applicants.length === 0 ? (
          <div className="ats-loading-state">
            <div className="ats-loader"></div>
            <p>Loading applicants...</p>
          </div>
        ) : (
          <ApplicantsTable
            applicants={applicants}
            onDelete={handleDeleteApplicant}
            onRefresh={handleRefresh}
          />
        )}
      </div>
    </div>
  );
}