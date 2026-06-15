// Timesheets.js - MODIFIED VERSION
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import InternalTimesheet from "./InternalTimesheet";
import ExternalTimesheet from "./ExternalTimesheet";
import OtherTimesheets from "./OtherTimesheets";
import { 
  Clock, 
  Upload, 
  FileText, 
  User, 
  Mail, 
  Briefcase,
  AlertCircle
} from "lucide-react";
import axios from 'axios';
import BASE_URL from '../../url';
import TimePunchWidget from "../../TimeSheetManagement/components/TimePunchWidget";
import "../styles/Timesheets.css";

const Timesheets = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const mode = queryParams.get('mode');

  const [activeTab, setActiveTab] = useState("internal");
  const [userInfo, setUserInfo] = useState(null);
  const [employeeInfo, setEmployeeInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Get user role from localStorage
  const userRole = localStorage.getItem('role');
  const isEmployee = userRole === 'employee';

  useEffect(() => {
    fetchUserAndEmployeeInfo();
  }, []);

  const fetchUserAndEmployeeInfo = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      // Get current user info
      const userResponse = await axios.get(`${BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const user = userResponse.data;
      console.log('User data from API:', user);
      setUserInfo(user);

      const employeeId = user.EmployeeId || user.employeeId;
      
      if (!employeeId) {
        setError('No employee ID assigned to your account. Please contact administrator.');
        setLoading(false);
        return;
      }

      console.log('Employee ID found:', employeeId);

      // Dynamically fetch all companies so we always use the correct IDs
      let companies = [];
      try {
        const companiesResponse = await axios.get(`${BASE_URL}/api/companies`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (companiesResponse.data && companiesResponse.data.data) {
          companies = companiesResponse.data.data.map(c => ({ id: c.Id, name: c.Name }));
        }
      } catch (compErr) {
        console.warn('Could not fetch companies dynamically, using fallback IDs');
        companies = [
          { id: 4, name: 'Prophecy Consulting INC' },
          { id: 5, name: 'Prophecy Offshore' },
          { id: 6, name: 'Cognifyar Technologies' }
        ];
      }

      // Fetch employee details from the appropriate company table
      let employeeFound = false;

      for (const company of companies) {
        try {
          console.log(`Searching in company ${company.name} (ID: ${company.id}) for employee ${employeeId}`);
          
          const empResponse = await axios.get(
            `${BASE_URL}/api/employees/company/${company.id}/${employeeId}`,
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          );

          console.log(`Response from ${company.name}:`, empResponse.data);

          if (empResponse.data.success) {
            setEmployeeInfo({
              ...empResponse.data.data,
              companyId: company.id,
              companyName: company.name
            });
            employeeFound = true;
            console.log('Employee found in company:', company.name);
            break;
          }
        } catch (err) {
          console.log(`Not found in ${company.name}, trying next...`);
          continue;
        }
      }

      if (!employeeFound) {
        setError('Employee record not found. Please contact administrator.');
        console.error('Employee not found in any company');
      }

      setLoading(false);
    } catch (err) {
      console.error('Error fetching user/employee info:', err);
      setError('Failed to load user information: ' + (err.response?.data?.message || err.message));
      setLoading(false);
    }
  };
  
  const handlePunchSuccess = () => {
    console.log('🔔 Punch success detected! Triggering timesheet refresh...');
    setRefreshTrigger(prev => prev + 1);
  };

  // ✅ Define tabs based on user role
  // Employees see all three tabs: Internal, External, Other
  // Non-employees see only Internal timesheet (no tabs)
  const getAllTabs = () => [
    { 
      id: "internal", 
      label: "Internal Timesheets",
      icon: <Clock size={18} />,
      description: "Track your daily work hours"
    },
    { 
      id: "external", 
      label: "External Timesheets",
      icon: <Upload size={18} />,
      description: "Upload client timesheets"
    },
    { 
      id: "other", 
      label: "Other Timesheets",
      icon: <FileText size={18} />,
      description: "Additional timesheet options"
    }
  ];

  // Only employees get all tabs, others get no tabs (only internal content)
  const tabs = isEmployee ? getAllTabs() : [];

  const renderContent = () => {
    if (loading) {
      return (
        <div className="timesheets-loading">
          <div className="timesheets-spinner"></div>
          <p>Loading your timesheets...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="timesheets-error">
          <AlertCircle size={48} color="#ef4444" />
          <h3>Unable to Load Timesheets</h3>
          <p>{error}</p>
          <button 
            className="timesheets-retry-btn"
            onClick={fetchUserAndEmployeeInfo}
          >
            Retry
          </button>
        </div>
      );
    }

    // For non-employees, always show InternalTimesheet (no tabs)
    if (!isEmployee) {
      return <InternalTimesheet employeeInfo={employeeInfo} userInfo={userInfo} refreshTrigger={refreshTrigger} />;
    }

    // For employees, show based on active tab
    switch (activeTab) {
      case "internal":
        return <InternalTimesheet employeeInfo={employeeInfo} userInfo={userInfo} refreshTrigger={refreshTrigger} />;
      case "external":
        return <ExternalTimesheet employeeInfo={employeeInfo} userInfo={userInfo} />;
      case "other":
        return <OtherTimesheets employeeInfo={employeeInfo} userInfo={userInfo} />;
      default:
        return <InternalTimesheet employeeInfo={employeeInfo} userInfo={userInfo} />;
    }
  };

  return (
    <div className="timesheets-container">
      {/* Header Section */}
      <div className="timesheets-header">
        <div className="timesheets-header-content">
          <h1>Timesheets</h1>
          <p>Every minute matters.</p>
        </div>

        {/* Time Punch Widget Integration */}
        {(() => {
          const empId = employeeInfo?.EmployeeId || employeeInfo?.employeeId || userInfo?.employeeId || userInfo?.EmployeeId;
          const isPunchEnabled = employeeInfo?.TimePunchEnabled !== undefined 
            ? !!employeeInfo.TimePunchEnabled 
            : !!userInfo?.timePunchEnabled;
          const isAdmin = userInfo?.role === 'admin' || userInfo?.role === 'super_admin';
          
          console.log('⏰ Time Punch Display Debug:', { empId, isPunchEnabled, isAdmin });

          // Show ONLY if explicitly enabled for this employee
          if (isPunchEnabled && empId) {
            return (
              <div className="timesheet-punch-wrapper">
                <TimePunchWidget 
                  employeeId={empId} 
                  compact={true} 
                  onPunchSuccess={handlePunchSuccess}
                />
              </div>
            );
          }
          return null;
        })()}
      </div>

      {/* Tabs Navigation - Only shown for employees and when mode is not 'internal' */}
      {isEmployee && mode !== 'internal' && (
        <div className="timesheet-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
              disabled={loading || !!error}
            >
              <span className="tab-icon">{tab.icon}</span>
              <div className="tab-text">
                <span className="tab-label">{tab.label}</span>
                <span className="tab-description">{tab.description}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Tab Content */}
      <div className="tab-content">
        {renderContent()}
      </div>
    </div>
  );
};

export default Timesheets;