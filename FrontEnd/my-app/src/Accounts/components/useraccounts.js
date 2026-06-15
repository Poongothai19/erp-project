import React, { useState, useEffect } from 'react';
import '../styles/useraccounts.css'
import axios from 'axios';
import BASE_URL from '../../url';
import { 
  Clock, Edit3, Save, Send, BarChart3, FileText, Timer, Coffee, 
  Settings, ChevronDown, ChevronRight, Plus, Search, Filter, Download, 
  Eye, CheckCircle2, AlertCircle, XCircle, MessageSquare, Users, User, 
  X, FileSpreadsheet, Trash2, Image, File, ArrowLeft, Briefcase, MapPin,
  Mail, Phone, Calendar, Building2, CheckSquare2, SquareUser
} from 'lucide-react';

const Accounts = ({ employeeData, companyData }) => {
  const [activeTab, setActiveTab] = useState('employee-details');
  const [employee, setEmployee] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch employee and company data on component mount
  useEffect(() => {
    fetchAccountsData();
  }, [employeeData, companyData]);

  // Listen for data updates from other components
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'statementCreated' || e.key === 'reportUploaded') {
        console.log('📢 Data updated event received:', e.key);
        setRefreshKey(prev => prev + 1);
        
        if (e.key === 'statementCreated') {
          setActiveTab('statements');
        } else if (e.key === 'reportUploaded') {
          setActiveTab('reports');
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const fetchAccountsData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');

      // Fetch from the new accounts API endpoint
      const response = await axios.get(`${BASE_URL}/api/accounts/my-details`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setEmployee(response.data.data.employee);
        setCompany(response.data.data.company);
        console.log('✅ Employee data fetched:', response.data.data.employee.Name);
      }

      setLoading(false);
    } catch (err) {
      console.error('Error fetching accounts data:', err);
      setError('Failed to load account data: ' + (err.response?.data?.message || err.message));
      setLoading(false);
    }
  };
  

  const handleStatementsTabClick = () => {
    setActiveTab('statements');
    setRefreshKey(prev => prev + 1);
  };

  const handleReportsTabClick = () => {
    setActiveTab('reports');
    setRefreshKey(prev => prev + 1);
  };

  const renderTabContent = () => {
    switch(activeTab) {
      case 'employee-details':
        return <EmployeeProfileCard employee={employee} />;
      case 'statements':
        return <Statements employee={employee} company={company} refreshKey={refreshKey} />;
      case 'reports':
        return <ReportsComponent employee={employee} company={company} refreshKey={refreshKey} />;
      case 'benefits':
        return <Benefits />;
      case 'immigration':
        return <Immigration />;
      default:
        return <EmployeeProfileCard employee={employee} />;
    }
  };

  if (loading) {
    return (
      <div className="accounts-container">
        <div className="accounts-header">
          <h1>Accounts</h1>
        </div>
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <p>Loading account information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="accounts-container">
        <div className="accounts-header">
          <h1>Accounts</h1>
        </div>
        <div style={{ padding: '40px', textAlign: 'center', color: 'red' }}>
          <p>{error}</p>
          <button onClick={fetchAccountsData} style={{ marginTop: '20px', padding: '10px 20px', cursor: 'pointer' }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="accounts-container">
      <div className="accounts-header">
        <h1>Accounts</h1>
      </div>

      <div className="accounts-tabs">
        <button 
          className={`accounts-tab-button ${activeTab === 'employee-details' ? 'active' : ''}`}
          onClick={() => setActiveTab('employee-details')}
        >
          Employee Details
        </button>
        <button 
          className={`accounts-tab-button ${activeTab === 'statements' ? 'active' : ''}`}
          onClick={handleStatementsTabClick}
        >
          Statements
        </button>
        <button 
          className={`accounts-tab-button ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={handleReportsTabClick}
        >
          Reports
        </button>
        <button 
          className={`accounts-tab-button ${activeTab === 'benefits' ? 'active' : ''}`}
          onClick={() => setActiveTab('benefits')}
        >
          Benefits
        </button>
        <button 
          className={`accounts-tab-button ${activeTab === 'immigration' ? 'active' : ''}`}
          onClick={() => setActiveTab('immigration')}
        >
          Immigration
        </button>
      </div>

      <div className="accounts-content">
        {renderTabContent()}
      </div>
    </div>
  );
};

// ===== IMPROVED EMPLOYEE PROFILE CARD COMPONENT =====
const EmployeeProfileCard = ({ employee }) => {
  if (!employee) {
    return (
      <div className="accounts-tab-content">
        <h2>Employee Details</h2>
        <p>No employee data available</p>
      </div>
    );
  }

  const employeeInfo = [
    { icon: <User size={20} />, label: 'Full Name', value: employee.Name || employee.name || 'N/A', category: 'personal' },
    { icon: <SquareUser size={20} />, label: 'Employee Code', value: employee.EmployeeCode || employee.employeeCode || employee.employeeId || employee.EmployeeId || 'N/A', category: 'personal' },
    { icon: <Mail size={20} />, label: 'Email', value: employee.Email || employee.email || 'N/A', category: 'personal' },
    { icon: <Phone size={20} />, label: 'Phone', value: employee.Phone || employee.phone || 'N/A', category: 'personal' },
    { icon: <Briefcase size={20} />, label: 'Position', value: employee.Position || employee.position || 'N/A', category: 'work' },
    { icon: <Calendar size={20} />, label: 'Start Date', value: employee.HireDate || employee.hireDate ? new Date(employee.HireDate || employee.hireDate).toLocaleDateString() : 'N/A', category: 'work' },
    { icon: <MapPin size={20} />, label: 'Location', value: employee.Location || employee.location || 'N/A', category: 'work' },
    { icon: <Clock size={20} />, label: 'Employment Type', value: employee.EmploymentType || employee.employmentType || 'N/A', category: 'work' },
    { icon: <CheckCircle2 size={20} />, label: 'Status', value: employee.Status || employee.status || 'N/A', category: 'work' },
  ];

  return (
    <div className="accounts-tab-content">
      <div className="employee-profile-header">
        <div className="employee-profile-avatar">
          <span className="employee-profile-initials">
            {(employee.Name || employee.name || 'E')
              .split(' ')
              .map(n => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2)}
          </span>
        </div>
        <div className="employee-profile-title-section">
          <h2 className="employee-profile-name">{employee.Name || employee.name || 'N/A'}</h2>
          <p className="employee-profile-position">{employee.Position || employee.position || 'Position not specified'}</p>
          <span className={`employee-profile-status-badge ${(employee.Status || employee.status || '').toLowerCase()}`}>
            {employee.Status || employee.status || 'N/A'}
          </span>
        </div>
      </div>

      <div className="employee-profile-sections">
        {/* Personal Information */}
        <div className="employee-profile-detail-section">
          <h3 className="employee-profile-section-title">
            <User size={20} /> Personal Information
          </h3>
          <div className="employee-profile-section-content">
            {employeeInfo
              .filter(item => item.category === 'personal')
              .map((item, idx) => (
                <div key={idx} className="employee-profile-detail-row">
                  <div className="employee-profile-label-wrapper">
                    <span className="employee-profile-icon">{item.icon}</span>
                    <label className="employee-profile-label">{item.label}</label>
                  </div>
                  <p className="employee-profile-value">{item.value}</p>
                </div>
              ))}
          </div>
        </div>


        {/* Work Information */}
        <div className="employee-profile-detail-section">
          <h3 className="employee-profile-section-title">
            <Briefcase size={20} /> Work Information
          </h3>
          <div className="employee-profile-section-content">
            {employeeInfo
              .filter(item => item.category === 'work')
              .map((item, idx) => (
                <div key={idx} className="employee-profile-detail-row">
                  <div className="employee-profile-label-wrapper">
                    <span className="employee-profile-icon">{item.icon}</span>
                    <label className="employee-profile-label">{item.label}</label>
                  </div>
                  <p className="employee-profile-value">{item.value}</p>
                </div>
              ))}
          </div>
        </div>


      </div>
    </div>
  );
};

// Statements Component - FETCH REAL DATA
const Statements = ({ employee, company, refreshKey }) => {
  const [activeStatement, setActiveStatement] = useState('payroll');
  const [statements, setStatements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Filtering states
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (employee && company) {
      fetchStatements();
    }
  }, [employee, company, refreshKey]);

  const fetchStatements = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');

      console.log('📊 Fetching statements for:', employee.EmployeeId);

      const response = await axios.get(
        `${BASE_URL}/api/accounts/my-statements`,
        {
          params: {
            companyId: company.id,
            employeeId: employee.EmployeeId || employee.employeeId
          },
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setStatements(response.data.data || []);
        console.log('✅ Statements loaded:', response.data.data.length);
      } else {
        setStatements([]);
      }
    } catch (error) {
      console.error('Error fetching statements:', error);
      setStatements([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredStatements = statements.filter((statement) => {
    const periodStr = statement.PeriodStartDate && statement.PeriodEndDate 
      ? `${new Date(statement.PeriodStartDate).toLocaleDateString()} - ${new Date(statement.PeriodEndDate).toLocaleDateString()}`
      : 'N/A';

    const matchesSearch =
      (statement.Description?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      periodStr.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesDate = true;
    if (startDate) {
      matchesDate = matchesDate && new Date(statement.CheckDate) >= new Date(startDate);
    }
    if (endDate) {
      const endD = new Date(endDate);
      endD.setHours(23, 59, 59, 999);
      matchesDate = matchesDate && new Date(statement.CheckDate) <= endD;
    }
    return matchesSearch && matchesDate;
  });

  const renderFinancialStatements = () => (
    <div className="premium-table-container">
      <div className="statements-filters">
        <div className="search-bar-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search by description or period..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="statements-search-input"
          />
        </div>
        <div className="date-filters">
          <div className="date-input-group">
            <label>Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="statements-date-input"
            />
          </div>
          <div className="date-input-group">
            <label>End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="statements-date-input"
            />
          </div>
        </div>
      </div>

      <div className="statements-meta-info">
        <span className="showing-text">Showing {filteredStatements.length} of {statements.length} statements</span>
        <div className="meta-right">
          <span className="pay-frequency">Pay Frequency: <strong>Monthly</strong></span>
          <span className="employee-name-meta">Employee: <strong>{employee?.Name || employee?.name || 'Employee'}</strong></span>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="premium-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Pay Period</th>
              <th>Description</th>
              <th>Hours</th>
              <th>Pay Rate</th>
              <th>Credit</th>
              <th>Debit</th>
              <th>Balance</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="empty-state">Loading statements...</td>
              </tr>
            ) : filteredStatements.length > 0 ? (
              filteredStatements.map((statement, index) => {
                const periodStr = statement.PeriodStartDate && statement.PeriodEndDate 
                  ? `${new Date(statement.PeriodStartDate).toLocaleDateString()} - ${new Date(statement.PeriodEndDate).toLocaleDateString()}`
                  : statement.Period || 'N/A';
                  
                return (
                  <tr key={statement.Id || index} className="table-row-hover">
                    <td>{new Date(statement.CheckDate).toLocaleDateString()}</td>
                    <td>{periodStr}</td>
                    <td>{statement.Description || 'N/A'}</td>
                    <td>{statement.Hours || '-'}</td>
                    <td>{statement.PayRate ? `$${statement.PayRate}` : '-'}</td>
                    <td className="credit-cell">{statement.Credit ? `$${statement.Credit}` : '-'}</td>
                    <td className="debit-cell">{statement.Debit ? `$${statement.Debit}` : '-'}</td>
                    <td className="balance-cell">{statement.Balance ? `$${statement.Balance}` : '-'}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="8" className="empty-state">No financial statements found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="accounts-tab-content">
      <h2>Payroll Statement - {employee?.Name || employee?.name || 'Employee'}</h2>

      <div className="statements-content-area">
        {renderFinancialStatements()}
      </div>
    </div>
  );
};

// Reports Component - FETCH REAL DATA
const ReportsComponent = ({ employee, company, refreshKey }) => {
  const [selectedReport, setSelectedReport] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (employee && company) {
      fetchReports();
    }
  }, [employee, company, refreshKey]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');

      console.log('📄 Fetching reports for:', employee.EmployeeId);

      const response = await axios.get(
        `${BASE_URL}/api/accounts/my-reports`,
        {
          params: {
            companyId: company.id,
            employeeId: employee.EmployeeId || employee.employeeId
          },
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setReports(response.data.data || []);
        console.log('✅ Reports loaded:', response.data.data.length);
      } else {
        setReports([]);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      'Completed': 'accounts-status-badge-completed',
      'In Progress': 'accounts-status-badge-in-progress',
      'Active': 'accounts-status-badge-active',
      'Inactive': 'accounts-status-badge-inactive',
      'Renewal Pending': 'accounts-status-badge-renewal-pending'
    };
    return `accounts-status-badge ${statusMap[status] || 'accounts-status-badge-active'}`;
  };

  const handleDownloadReport = async (report) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.get(
        `${BASE_URL}/api/accounts/download-report/${report.Id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          responseType: 'blob'
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', report.FileName || 'report.pdf');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log('✅ Report downloaded:', report.FileName);
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('Failed to download report. Please try again.');
    }
  };

  const handleViewReport = (report) => {
    setSelectedReport(report);
  };

  const handleCloseReport = () => {
    setSelectedReport(null);
  };

  return (
    <div className="accounts-tab-content">
      <h2>Reports - {employee?.Name || employee?.name || 'Employee'}</h2>
      
      {selectedReport && (
        <div className="report-modal" style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'white',
          padding: '2rem',
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          zIndex: 1000,
          minWidth: '400px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>Report Details</h3>
            <button 
              onClick={handleCloseReport}
              style={{ 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer',
                color: '#666'
              }}
            >
              <X size={24} />
            </button>
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <p><strong>Report Name:</strong> {selectedReport.FileName || 'N/A'}</p>
            <p><strong>Upload Date:</strong> {selectedReport.UploadDate ? new Date(selectedReport.UploadDate).toLocaleDateString() : 'N/A'}</p>
            <p><strong>Type:</strong> {selectedReport.Type || 'N/A'}</p>
            <p><strong>Description:</strong> {selectedReport.Description || 'N/A'}</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button className="accounts-details-btn" onClick={handleCloseReport}>
              Close
            </button>
          </div>
        </div>
      )}

      {selectedReport && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 999
        }} onClick={handleCloseReport}></div>
      )}

      <div className="reports-table-container">
        <table className="reports-table">
          <thead>
            <tr>
              <th>File Name</th>
              <th>Upload Date</th>
              <th>Type</th>
              <th></th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>Loading...</td>
              </tr>
            ) : reports.length > 0 ? (
              reports.map(report => (
                <tr key={report.Id}>
                  <td>{report.FileName || 'N/A'}</td>
                  <td>{report.UploadDate ? new Date(report.UploadDate).toLocaleDateString() : 'N/A'}</td>
                  <td>{report.Type || 'N/A'}</td>
                  <td></td>
                  <td>
                    <button 
                      className="accounts-view-btn"
                      onClick={() => handleDownloadReport(report)}
                    >
                      <Download size={16} style={{ marginRight: '4px' }} />
                      Download
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>No reports found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Benefits Component
const Benefits = () => {
  const [selectedBenefit, setSelectedBenefit] = useState(null);

  const benefits = [
    { 
      id: 1, 
      name: 'Health Insurance', 
      provider: 'Blue Cross', 
      coverage: 'Family', 
      status: 'Active',
      plan: 'Gold PPO',
      startDate: '01/15/2023',
      endDate: '12/31/2024',
      premium: '$450/month',
    },
    { 
      id: 2, 
      name: 'Dental Insurance', 
      provider: 'Delta Dental', 
      coverage: 'Individual', 
      status: 'Active',
      plan: 'Premium Plan',
      startDate: '01/15/2023',
      endDate: '12/31/2024',
      premium: '$35/month',
    },
    { 
      id: 3, 
      name: '401(k) Retirement Plan', 
      provider: 'Fidelity', 
      coverage: 'N/A', 
      status: 'Active',
      plan: 'Traditional 401(k)',
      startDate: '01/15/2023',
      employerMatch: '4%',
      contribution: '8% of salary',
      vesting: '3 years'
    },
    { 
      id: 4, 
      name: 'Life Insurance', 
      provider: 'MetLife', 
      coverage: '$500,000', 
      status: 'Active',
      plan: 'Group Term Life',
      startDate: '01/15/2023',
      endDate: '12/31/2024',
      premium: 'Employer Paid',
      beneficiary: 'Primary: Spouse'
    },
  ];

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      'Completed': 'accounts-status-badge-completed',
      'In Progress': 'accounts-status-badge-in-progress',
      'Active': 'accounts-status-badge-active',
      'Inactive': 'accounts-status-badge-inactive',
      'Renewal Pending': 'accounts-status-badge-renewal-pending'
    };
    return `accounts-status-badge ${statusMap[status] || 'accounts-status-badge-active'}`;
  };

  const handleViewDetails = (benefit) => {
    setSelectedBenefit(benefit);
  };

  const handleCloseDetails = () => {
    setSelectedBenefit(null);
  };

  const renderBenefitDetails = (benefit) => {
    switch(benefit.name) {
      case 'Health Insurance':
        return (
          <div className="benefit-details-content">
            <div className="detail-grid">
              <div className="detail-item">
                <label>Plan Type:</label>
                <p>{benefit.plan}</p>
              </div>
              <div className="detail-item">
                <label>Coverage Start:</label>
                <p>{benefit.startDate}</p>
              </div>
              <div className="detail-item">
                <label>Coverage End:</label>
                <p>{benefit.endDate}</p>
              </div>
              <div className="detail-item">
                <label>Monthly Premium:</label>
                <p>{benefit.premium}</p>
              </div>
            </div>
          </div>
        );
      
      case 'Dental Insurance':
        return (
          <div className="benefit-details-content">
            <div className="detail-grid">
              <div className="detail-item">
                <label>Plan Type:</label>
                <p>{benefit.plan}</p>
              </div>
              <div className="detail-item">
                <label>Coverage Start:</label>
                <p>{benefit.startDate}</p>
              </div>
              <div className="detail-item">
                <label>Coverage End:</label>
                <p>{benefit.endDate}</p>
              </div>
              <div className="detail-item">
                <label>Monthly Premium:</label>
                <p>{benefit.premium}</p>
              </div>
            </div>
          </div>
        );
      
      case '401(k) Retirement Plan':
        return (
          <div className="benefit-details-content">
            <div className="detail-grid">
              <div className="detail-item">
                <label>Plan Type:</label>
                <p>{benefit.plan}</p>
              </div>
              <div className="detail-item">
                <label>Enrollment Date:</label>
                <p>{benefit.startDate}</p>
              </div>
              <div className="detail-item">
                <label>Employer Match:</label>
                <p>{benefit.employerMatch}</p>
              </div>
              <div className="detail-item">
                <label>Your Contribution:</label>
                <p>{benefit.contribution}</p>
              </div>
              <div className="detail-item">
                <label>Vesting Schedule:</label>
                <p>{benefit.vesting}</p>
              </div>
            </div>
          </div>
        );
      
      case 'Life Insurance':
        return (
          <div className="benefit-details-content">
            <div className="detail-grid">
              <div className="detail-item">
                <label>Plan Type:</label>
                <p>{benefit.plan}</p>
              </div>
              <div className="detail-item">
                <label>Coverage Start:</label>
                <p>{benefit.startDate}</p>
              </div>
              <div className="detail-item">
                <label>Coverage End:</label>
                <p>{benefit.endDate}</p>
              </div>
              <div className="detail-item">
                <label>Premium:</label>
                <p>{benefit.premium}</p>
              </div>
              <div className="detail-item">
                <label>Beneficiary:</label>
                <p>{benefit.beneficiary}</p>
              </div>
            </div>
          </div>
        );
      
      default:
        return <p>Details not available.</p>;
    }
  };

  return (
    <div className="accounts-tab-content">
      <h2>Employee Benefits</h2>
      
      {selectedBenefit && (
        <div className="benefit-modal" style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'white',
          padding: '2rem',
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          zIndex: 1000,
          minWidth: '500px',
          maxWidth: '600px',
          maxHeight: '80vh',
          overflowY: 'auto'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3>{selectedBenefit.name} Details</h3>
            <button 
              onClick={handleCloseDetails}
              style={{ 
                background: 'none', 
                border: 'none',
                cursor: 'pointer',
                color: '#666'
              }}
            >
              <X size={24} />
            </button>
          </div>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem' }}>
              <div>
                <strong>Provider:</strong> {selectedBenefit.provider}
              </div>
              <div>
                <strong>Status:</strong> 
                <span className={getStatusBadgeClass(selectedBenefit.status)} style={{ marginLeft: '0.5rem' }}>
                  {selectedBenefit.status}
                </span>
              </div>
            </div>
            <div>
              <strong>Coverage:</strong> {selectedBenefit.coverage}
            </div>
          </div>

          {renderBenefitDetails(selectedBenefit)}

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
            <button className="accounts-details-btn" onClick={handleCloseDetails}>Close</button>
          </div>
        </div>
      )}

      {selectedBenefit && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 999
        }} onClick={handleCloseDetails}></div>
      )}

      <div className="benefits-table-container">
        <table className="benefits-table">
          <thead>
            <tr>
              <th>Benefit Name</th>
              <th>Provider</th>
              <th>Coverage</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {benefits.map(benefit => (
              <tr key={benefit.id}>
                <td>{benefit.name}</td>
                <td>{benefit.provider}</td>
                <td>{benefit.coverage}</td>
                <td>
                  <span className={getStatusBadgeClass(benefit.status)}>
                    {benefit.status}
                  </span>
                </td>
                <td>
                  <button 
                    className="accounts-details-btn"
                    onClick={() => handleViewDetails(benefit)}
                  >
                    Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Immigration Component
const Immigration = () => {
  const [selectedDocument, setSelectedDocument] = useState(null);

  const documents = [
    { 
      id: 1, 
      type: 'Work Visa', 
      number: 'H1B-123456', 
      issued: '01/15/2023', 
      expires: '01/15/2026', 
      status: 'Active',
      category: 'H-1B Specialty Occupation',
      issuingAuthority: 'USCIS',
      notes: 'Primary work authorization'
    },
    { 
      id: 2, 
      type: 'I-94 Travel Record', 
      number: 'I94-789012', 
      issued: '01/15/2023', 
      expires: '01/15/2026', 
      status: 'Active',
      category: 'Arrival/Departure Record',
      issuingAuthority: 'CBP',
      notes: 'Electronic I-94 record'
    },
    { 
      id: 3, 
      type: 'EAD Card', 
      number: 'EAD-345678', 
      issued: '01/15/2023', 
      expires: '01/15/2025', 
      status: 'Renewal Pending',
      category: 'Employment Authorization Document',
      issuingAuthority: 'USCIS',
      notes: 'Renewal application submitted on 12/01/2024'
    },
  ];

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      'Completed': 'accounts-status-badge-completed',
      'In Progress': 'accounts-status-badge-in-progress',
      'Active': 'accounts-status-badge-active',
      'Inactive': 'accounts-status-badge-inactive',
      'Renewal Pending': 'accounts-status-badge-renewal-pending'
    };
    return `accounts-status-badge ${statusMap[status] || 'accounts-status-badge-active'}`;
  };

  const handleViewDocument = (document) => {
    setSelectedDocument(document);
  };

  const handleCloseDocument = () => {
    setSelectedDocument(null);
  };

  return (
    <div className="accounts-tab-content">
      <h2>Immigration Documents</h2>
      
      {selectedDocument && (
        <div className="document-modal" style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'white',
          padding: '2rem',
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          zIndex: 1000,
          minWidth: '500px',
          maxWidth: '600px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3>Document Details</h3>
            <button 
              onClick={handleCloseDocument}
              style={{ 
                background: 'none', 
                border: 'none',
                cursor: 'pointer',
                color: '#666'
              }}
            >
              <X size={24} />
            </button>
          </div>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <div className="document-detail-grid" style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
              marginBottom: '1rem'
            }}>
              <div className="detail-item">
                <label>Document Type:</label>
                <p>{selectedDocument.type}</p>
              </div>
              <div className="detail-item">
                <label>Document Number:</label>
                <p>{selectedDocument.number}</p>
              </div>
              <div className="detail-item">
                <label>Issue Date:</label>
                <p>{selectedDocument.issued}</p>
              </div>
              <div className="detail-item">
                <label>Expiry Date:</label>
                <p>{selectedDocument.expires}</p>
              </div>
              <div className="detail-item">
                <label>Category:</label>
                <p>{selectedDocument.category}</p>
              </div>
              <div className="detail-item">
                <label>Issuing Authority:</label>
                <p>{selectedDocument.issuingAuthority}</p>
              </div>
            </div>
            
            <div className="detail-item">
              <label>Status:</label>
              <p>
                <span className={getStatusBadgeClass(selectedDocument.status)}>
                  {selectedDocument.status}
                </span>
              </p>
            </div>
            
            <div className="detail-item">
              <label>Notes:</label>
              <p>{selectedDocument.notes}</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button className="accounts-details-btn" onClick={handleCloseDocument}>
              Close
            </button>
          </div>
        </div>
      )}

      {selectedDocument && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 999
        }} onClick={handleCloseDocument}></div>
      )}

      <div className="immigration-table-container">
        <table className="immigration-table">
          <thead>
            <tr>
              <th>Document Type</th>
              <th>Document Number</th>
              <th>Issue Date</th>
              <th>Expiry Date</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {documents.map(doc => (
              <tr key={doc.id}>
                <td>{doc.type}</td>
                <td>{doc.number}</td>
                <td>{doc.issued}</td>
                <td>{doc.expires}</td>
                <td>
                  <span className={getStatusBadgeClass(doc.status)}>
                    {doc.status}
                  </span>
                </td>
                <td>
                  <button 
                    className="accounts-view-btn"
                    onClick={() => handleViewDocument(doc)}
                  >
                    <Eye size={16} style={{ marginRight: '4px' }} />
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Accounts;