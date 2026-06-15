import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, Users, CheckCircle, Clock, AlertCircle, Plus } from 'lucide-react';
import axios from 'axios';
import BASE_URL from "../../url";
import '../styles/OnboardingPage.css';
import OnboardingPopup from '../../OnboardingModule/components/OnboardingPopup';

const OnboardingCompany = () => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [popupOpen, setPopupOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [employeeCounts, setEmployeeCounts] = useState({});

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      // Use the correct endpoint - /api/onboarding-companies (from onboarding-module)
      const response = await axios.get(`${BASE_URL}/api/onboarding-companies`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        const companiesData = response.data.data;
        setCompanies(companiesData);
        
        // Fetch employee counts for each company from the employee tables
        await fetchEmployeeCounts(companiesData);
      }
    } catch (error) {
      console.error("Fetch companies error:", error);
      if (error.response?.status === 401) {
        navigate('/login');
      } else {
        setError('Failed to load companies');
      }
    } finally {
      setLoading(false);
    }
  };

const fetchEmployeeCounts = async (companiesData) => {
  const token = localStorage.getItem('token');
  const counts = {};

  for (const company of companiesData) {
    try {
      // Use the workflow employees endpoint instead
      const response = await axios.get(
        `${BASE_URL}/api/onboarding-workflow-employees/company/${company.id}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      if (response.data.success) {
        // The response structure might be different
        // Based on your onboardingWorkflowEmployeeController.js, it returns:
        // { success: true, data: [...], count: ... }
        counts[company.id] = response.data.count || response.data.data?.length || 0;
      }
    } catch (error) {
      console.error(`Error fetching employees for company ${company.id}:`, error);
      counts[company.id] = 0;
    }
  }

  setEmployeeCounts(counts);
};

  const handleCardClick = (company) => {
    navigate('/employee-directory', { 
      state: { 
        company: {
          id: company.id,
          name: company.name,
          clientId: company.clientId,
          address: company.address
        }
      } 
    });
  };

  const handleAddNewOnboarding = (company, e) => {
    e.stopPropagation();
    setSelectedCompany({
      id: company.id,
      name: company.name,
      clientId: company.clientId
    });
    setPopupOpen(true);
  };

  const handlePopupClose = () => {
    setPopupOpen(false);
    setSelectedCompany(null);
    // Refresh employee counts after adding new employee
    fetchEmployeeCounts(companies);
  };

  const stats = {
    total: companies.length,
    active: companies.filter(c => c.status === 'Active').length,
    totalEmployees: Object.values(employeeCounts).reduce((sum, count) => sum + count, 0)
  };

  if (loading) {
    return (
      <div className="onboarding-loading-state">
        <div className="loading-spinner"></div>
        <p>Loading companies...</p>
      </div>
    );
  }

  return (
    <div className="onboarding-page-container">
      <div className="onboarding-page-header">
        <h1>Company Onboarding</h1>
        <p>Select a company to manage employees or add new onboarding</p>
      </div>

      <div className="onboarding-stats-section">
        <div className="onboarding-stat-card">
          <Building size={24} color="#019d88" />
          <div className="onboarding-stat-content">
            <span className="onboarding-stat-number">{stats.total}</span>
            <span className="onboarding-stat-label">Total Companies</span>
          </div>
        </div>
        <div className="onboarding-stat-card">
          <CheckCircle size={24} color="#019d88" />
          <div className="onboarding-stat-content">
            <span className="onboarding-stat-number">{stats.active}</span>
            <span className="onboarding-stat-label">Active</span>
          </div>
        </div>
        <div className="onboarding-stat-card">
          <Users size={24} color="#019d88" />
          <div className="onboarding-stat-content">
            <span className="onboarding-stat-number">{stats.totalEmployees}</span>
            <span className="onboarding-stat-label">Total Employees</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="onboarding-error-state">
          <AlertCircle size={48} color="#dc2626" />
          <p>{error}</p>
          <button onClick={fetchCompanies} className="onboarding-retry-btn">
            Retry
          </button>
        </div>
      )}

      <div className="onboarding-companies-grid">
        {companies.map(company => (
          <div 
            key={company.id} 
            className="onboarding-company-card"
            onClick={() => handleCardClick(company)}
          >
            <div className="onboarding-card-header">
              <h3>{company.name}</h3>
              <span className={`onboarding-company-status ${company.status?.toLowerCase() || 'active'}`}>
                {company.status === 'Active' ? <CheckCircle size={14} /> : <Clock size={14} />}
                <span>{company.status || 'Active'}</span>
              </span>
            </div>

            <div className="onboarding-card-details">
              <p><strong>ID:</strong> {company.clientId || 'N/A'}</p>
              <p><strong>Employees:</strong> {employeeCounts[company.id] || 0}</p>
              <p><strong>Address:</strong> {company.address || 'No address provided'}</p>
            </div>

            <button
              className="onboarding-add-btn"
              onClick={(e) => handleAddNewOnboarding(company, e)}
            >
              <Plus size={16} /> Add New Onboarding
            </button>
          </div>
        ))}
      </div>

      {companies.length === 0 && !error && (
        <div className="onboarding-empty-state">
          <Building size={64} color="#64748b" />
          <h3>No Companies Found</h3>
          <p>No active companies are available for onboarding.</p>
        </div>
      )}

      <OnboardingPopup
        isOpen={popupOpen}
        onClose={handlePopupClose}
        company={selectedCompany}
        onSuccess={handlePopupClose}
      />
    </div>
  );
};

export default OnboardingCompany;