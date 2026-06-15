import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Clock, Edit3, Save, BarChart3, FileText, Plus, Search, Filter, Download,
  Eye, CheckCircle2, XCircle, User,
  X, FileSpreadsheet, Trash2, Image, ArrowLeft, Upload, AlertCircle
} from 'lucide-react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import BASE_URL from "../../url";
import Swal from 'sweetalert2';
import '../styles/EmployeeDetails.css';

// Helper function to get file icon
const getFileIcon = (fileName) => {
  const extension = fileName.split('.').pop().toLowerCase();
  switch (extension) {
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'bmp':
    case 'svg':
      return Image;
    case 'xlsx':
    case 'xls':
    case 'csv':
      return FileSpreadsheet;
    default:
      return FileText;
  }
};


const STATES_BY_COUNTRY = {
  'United States': [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ],
  'Canada': [
    'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador',
    'Northwest Territories', 'Nova Scotia', 'Nunavut', 'Ontario', 'Prince Edward Island',
    'Quebec', 'Saskatchewan', 'Yukon'
  ],
  'Australia': [
    'New South Wales', 'Queensland', 'South Australia', 'Tasmania', 'Victoria',
    'Western Australia', 'Australian Capital Territory', 'Northern Territory'
  ],
  'India': [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
  ],
  'United Kingdom': [
    'England', 'Scotland', 'Wales', 'Northern Ireland'
  ],
  'Germany': [
    'Baden-Württemberg', 'Bavaria', 'Berlin', 'Brandenburg', 'Bremen',
    'Hamburg', 'Hesse', 'Lower Saxony', 'Mecklenburg-Vorpommern', 'North Rhine-Westphalia',
    'Rhineland-Palatinate', 'Saarland', 'Saxony', 'Saxony-Anhalt', 'Schleswig-Holstein', 'Thuringia'
  ],
  'France': [
    'Île-de-France', 'Provence-Alpes-Côte d\'Azur', 'Auvergne-Rhône-Alpes',
    'Nouvelle-Aquitaine', 'Occitanie', 'Bourgogne-Franche-Comté', 'Brittany',
    'Normandy', 'Hauts-de-France', 'Grand Est', 'Centre-Val de Loire', 'Pays de la Loire'
  ],
  'Japan': [
    'Aichi', 'Akita', 'Aomori', 'Chiba', 'Ehime', 'Fukui', 'Fukuoka', 'Fukushima',
    'Gifu', 'Gunma', 'Hiroshima', 'Hokkaido', 'Hyogo', 'Ibaraki', 'Ishikawa', 'Iwate',
    'Kagawa', 'Kagoshima', 'Kanagawa', 'Kochi', 'Kumamoto', 'Kyoto', 'Mie', 'Miyagi',
    'Miyazaki', 'Nagano', 'Nagasaki', 'Nara', 'Niigata', 'Okinawa', 'Osaka', 'Saga',
    'Saitama', 'Shiga', 'Shimane', 'Shizuoka', 'Tochigi', 'Tokushima', 'Tokyo', 'Tottori',
    'Toyama', 'Wakayama', 'Yamagata', 'Yamaguchi', 'Yamanashi'
  ]
};

const CountryStateFieldForDetails = ({ value, onChange, isEditing }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Create a flat list of all states with their countries
  const allStatesWithCountry = [];
  Object.entries(STATES_BY_COUNTRY).forEach(([country, states]) => {
    states.forEach(state => {
      allStatesWithCountry.push({
        label: `${state} (${country})`,
        value: state,
        country: country,
        state: state
      });
    });
  });

  // Filter based on search term
  const filteredStates = allStatesWithCountry.filter(item =>
    item.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStateSelect = (item) => {
    onChange(item.value);
    setIsOpen(false);
    setSearchTerm('');
  };

  // Get the country for the selected state
  const getCountryForState = (stateValue) => {
    if (!stateValue) return '';
    const item = allStatesWithCountry.find(s => s.value === stateValue);
    return item ? item.country : '';
  };

  const selectedDisplay = value ? `${value} (${getCountryForState(value)})` : '';

  if (!isEditing) {
    return (
      <span>{value || 'N/A'}</span>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <input
        type="text"
        value={searchTerm || selectedDisplay}
        onChange={(e) => setSearchTerm(e.target.value)}
        onFocus={() => setIsOpen(true)}
        placeholder="Search states/provinces..."
        style={{
          width: '100%',
          padding: '8px 12px',
          border: isOpen ? '2px solid #10b981' : '1px solid #d1d5db',
          borderRadius: '4px',
          fontSize: '14px',
          boxSizing: 'border-box',
          fontFamily: 'inherit'
        }}
      />

      {/* Dropdown List */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          backgroundColor: '#fff',
          border: '1px solid #d1d5db',
          borderTop: 'none',
          borderRadius: '0 0 4px 4px',
          maxHeight: '250px',
          overflowY: 'auto',
          zIndex: 1000,
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          {filteredStates.length > 0 ? (
            filteredStates.map((item, index) => (
              <div
                key={index}
                onClick={() => handleStateSelect(item)}
                style={{
                  padding: '10px 12px',
                  cursor: 'pointer',
                  backgroundColor: value === item.value ? '#e0f2fe' : '#fff',
                  borderBottom: '1px solid #f3f4f6',
                  fontSize: '14px',
                  color: value === item.value ? '#0369a1' : '#1f2937',
                  fontWeight: value === item.value ? '600' : '400',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (value !== item.value) {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                  }
                }}
                onMouseLeave={(e) => {
                  if (value !== item.value) {
                    e.currentTarget.style.backgroundColor = '#fff';
                  }
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{item.state}</span>
                  <span style={{
                    fontSize: '12px',
                    color: '#9ca3af',
                    marginLeft: '12px'
                  }}>
                    {item.country}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div style={{
              padding: '10px 12px',
              color: '#9ca3af',
              fontSize: '14px',
              textAlign: 'center'
            }}>
              No states found
            </div>
          )}
        </div>
      )}

      {/* Close dropdown when clicking outside */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999
          }}
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

const EmployeeDetailsPage = () => {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Get employee and company from navigation state
  const passedEmployee = location.state?.employee;
  const passedCompany = location.state?.company;

  const shouldHideTabs = useCallback((companyData) => {
    if (!companyData) return false;

    // Check if company name is "Prophecy Offshore"
    // Hide only externalTimesheets and statement, NOT report
    if (companyData.name === 'Prophecy Offshore' ||
      companyData.clientId === '25642740') {
      return true; // This still hides the tabs
    }
    return false;
  }, []);

  // View states
  const [activeView, setActiveView] = useState('employeeDetails');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [allEmployees, setAllEmployees] = useState([]);
  const [useMailingAddress, setUseMailingAddress] = useState(false);

  // Data states
  const [employee, setEmployee] = useState(passedEmployee || null);
  const [company, setCompany] = useState(passedCompany || null);
  const [editedEmployee, setEditedEmployee] = useState({});
  const [timesheets, setTimesheets] = useState([]);
  const [externalTimesheets, setExternalTimesheets] = useState([]);
  const [statements, setStatements] = useState([]);
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({});

  const [editingStatementId, setEditingStatementId] = useState(null);
  const [editingStatement, setEditingStatement] = useState({});
  const [externalSearchTerm, setExternalSearchTerm] = useState('');
  const [externalFilterStatus, setExternalFilterStatus] = useState('all');
  const [externalFilterPeriod, setExternalFilterPeriod] = useState('all');

  const [permissionStatus, setPermissionStatus] = useState({
    hasPermission: false,
    allowEditing: false
  });

  const [statementFileUpload, setStatementFileUpload] = useState({
    isUploading: false,
    progress: 0,
    selectedFile: null
  });

  const [statementSearchTerm, setStatementSearchTerm] = useState('');
  const [statementFilterStartDate, setStatementFilterStartDate] = useState('');
  const [statementFilterEndDate, setStatementFilterEndDate] = useState('');


  // Pay Structure states
  const [showPayStructureModal, setShowPayStructureModal] = useState(false);
  const [payStructureData, setPayStructureData] = useState({
    lca: 120000,
    vendorRate: 92,
    consultantRate: 82,
    adpRate: 62.5,
    biweeklyHours: 80,
    payrollMode: 'Payroll and Perdiem mode'
  });
  const [isEditingPayStructure, setIsEditingPayStructure] = useState(false);
  const [payrollInfo, setPayrollInfo] = useState({
    payType: 'Hourly',
    basisOfPay: 'Same as Pay Type',
    paySchedule: 'Monthly',
    employmentType: 'Full-time',  // 👈 ADD THIS LINE
    seasonalEmployee: 'No',
    ownerOfficer: 'No',
    semiMonthlySalary: 0,
    hourlyRate: 0
  });
  const [isEditingPayroll, setIsEditingPayroll] = useState(false);
  const [payrollLoading, setPayrollLoading] = useState(false);


  useEffect(() => {
    if (showPayStructureModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showPayStructureModal]);

  useEffect(() => {
    // If user tries to access hidden tabs for Prophecy Offshore, redirect to employeeDetails
    if (shouldHideTabs(company) && ['externalTimesheets', 'statement'].includes(activeView)) {
      setActiveView('employeeDetails');
    }
  }, [company, activeView]);

  // Statement helper functions
  const handleEditStatement = (statement) => {
    setEditingStatementId(statement.Id);
    setEditingStatement({
      ...statement,
      CheckDate: statement.CheckDate ? new Date(statement.CheckDate).toISOString().split('T')[0] : '',
      Credit: parseFloat(statement.Credit) || 0,
      Debit: parseFloat(statement.Debit) || 0,
      Balance: parseFloat(statement.Balance) || 0,
      Hours: parseFloat(statement.Hours) || 0,
      PayRate: parseFloat(statement.PayRate) || 0
    });
  };

  const handleStatementFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      // Validate file type
      const allowedExtensions = ['.csv', '.xlsx', '.xls'];
      const fileExtension = '.' + file.name.split('.').pop().toLowerCase();

      if (!allowedExtensions.includes(fileExtension)) {
        Swal.fire({
          title: 'Invalid File Type',
          text: 'Please upload a CSV or Excel file (.csv, .xlsx, .xls)',
          icon: 'error'
        });
        e.target.value = '';
        return;
      }

      // Validate file size (50MB limit)
      const MAX_FILE_SIZE = 50 * 1024 * 1024;
      if (file.size > MAX_FILE_SIZE) {
        Swal.fire({
          title: 'File Too Large',
          text: 'File size must be less than 50MB',
          icon: 'error'
        });
        e.target.value = '';
        return;
      }

      setStatementFileUpload({
        isUploading: true,
        progress: 0,
        selectedFile: file
      });

      // Create FormData
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('token');

      console.log('📤 Uploading payroll statement file:', file.name);
      console.log('Company ID:', company.id);
      console.log('Employee ID (numeric):', employee.Id);

      // Upload file
      const response = await axios.post(
        `${BASE_URL}/api/employees/company/${company.id}/${employee.Id}/statements/upload-file`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setStatementFileUpload(prev => ({
              ...prev,
              progress: percentCompleted
            }));
          }
        }
      );

      console.log('✅ File upload response:', response.data);

      if (response.data.success) {
        Swal.fire({
          title: 'Success!',
          html: `
          <div style="text-align: left;">
            <p><strong>File:</strong> ${file.name}</p>
            <p><strong>Total Rows:</strong> ${response.data.data.totalStatements}</p>
            <p><strong>Successfully Imported:</strong> <span style="color: #10b981;">${response.data.data.importedStatements}</span></p>
            ${response.data.data.failedStatements > 0 ? `
              <p><strong>Failed:</strong> <span style="color: #ef4444;">${response.data.data.failedStatements}</span></p>
            ` : ''}
            ${response.data.data.warnings && response.data.data.warnings.length > 0 ? `
              <div style="background: #fff3cd; padding: 12px; border-radius: 4px; margin-top: 12px; text-align: left;">
                <p style="margin: 0 0 8px 0; font-weight: bold; color: #856404;">⚠️ Warnings:</p>
                <ul style="margin: 0; padding-left: 20px; color: #856404;">
                  ${response.data.data.warnings.slice(0, 5).map(w => `<li>${w}</li>`).join('')}
                  ${response.data.data.warnings.length > 5 ? `<li>... and ${response.data.data.warnings.length - 5} more</li>` : ''}
                </ul>
              </div>
            ` : ''}
          </div>
        `,
          icon: 'success',
          timer: 5000,
          showConfirmButton: true,
          confirmButtonText: 'OK',
          confirmButtonColor: '#10b981'
        });

        // Refresh statements
        const statementsResponse = await axios.get(
          `${BASE_URL}/api/employees/company/${company.id}/${employee.Id}/statements`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (statementsResponse.data.success) {
          setStatements(statementsResponse.data.data);
        }
      } else {
        Swal.fire({
          title: 'Error',
          text: response.data.message || 'Failed to import statements',
          icon: 'error'
        });
      }

      // Reset upload state
      setStatementFileUpload({
        isUploading: false,
        progress: 0,
        selectedFile: null
      });
      e.target.value = '';

    } catch (error) {
      console.error('Error uploading statement file:', error);

      Swal.fire({
        title: 'Error',
        text: error.response?.data?.message || 'Failed to upload payroll statement file',
        icon: 'error'
      });

      setStatementFileUpload({
        isUploading: false,
        progress: 0,
        selectedFile: null
      });
      e.target.value = '';
    }
  };

  const fetchPermissionStatus = async () => {
    if (!employee?.EmployeeId) return;
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${BASE_URL}/api/timesheets/employee-permission/${employee.EmployeeId}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (response.data.success) {
        setPermissionStatus({
          hasPermission: response.data.hasPermission,
          allowEditing: response.data.allowEditing
        });
      }
    } catch (error) {
      console.error('Error fetching permission status:', error);
    }
  };

  useEffect(() => {
    if (employee?.EmployeeId) {
      fetchPermissionStatus();

      // Add 5-second polling as requested
      const interval = setInterval(() => {
        fetchPermissionStatus();
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [employee]);


  const handleEditStatementInputChange = (e) => {
    const { name, value } = e.target;

    let updatedStatement = {
      ...editingStatement,
      [name]: value
    };

    // Auto-calculate credit if both hours and payRate are entered
    if ((name === 'Hours' || name === 'PayRate') && updatedStatement.Hours && updatedStatement.PayRate) {
      const calculatedCredit = parseFloat(updatedStatement.Hours) * parseFloat(updatedStatement.PayRate);
      updatedStatement.Credit = calculatedCredit.toFixed(2);

      // Auto-calculate balance: previousBalance + credit - debit
      const debit = parseFloat(updatedStatement.Debit) || 0;
      const newBalance = parseFloat(editingStatement.previousBalance || 0) + calculatedCredit - debit;
      updatedStatement.Balance = newBalance.toFixed(2);
    }

    // Auto-calculate balance if debit changes
    if (name === 'Debit' && updatedStatement.Credit) {
      const credit = parseFloat(updatedStatement.Credit) || 0;
      const debit = parseFloat(value) || 0;
      const newBalance = parseFloat(editingStatement.previousBalance || 0) + credit - debit;
      updatedStatement.Balance = newBalance.toFixed(2);
    }

    setEditingStatement(updatedStatement);
  };

  const handleSaveEditStatement = async (statementId) => {
    try {
      const token = localStorage.getItem('token');

      const response = await axios.put(
        `${BASE_URL}/api/employees/company/${company.id}/${employee.Id}/statements/${statementId}`,
        {
          checkDate: editingStatement.CheckDate,
          period: editingStatement.Period,
          description: editingStatement.Description,
          hours: editingStatement.Hours || 0,
          payRate: editingStatement.PayRate || 0,
          credit: editingStatement.Credit || 0,
          debit: editingStatement.Debit || 0,
          balance: editingStatement.Balance || 0
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setStatements(statements.map(s =>
          s.Id === statementId ? response.data.data : s
        ));

        setEditingStatementId(null);
        setEditingStatement({});

        Swal.fire({
          title: 'Success!',
          text: 'Statement updated successfully',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      }
    } catch (error) {
      console.error('Error updating statement:', error);
      Swal.fire({
        title: 'Error',
        text: error.response?.data?.message || 'Failed to update statement',
        icon: 'error'
      });
    }
  };

  const handleCancelEditStatement = () => {
    setEditingStatementId(null);
    setEditingStatement({});
  };

  // Statement-related states
  const [isAddingNewRow, setIsAddingNewRow] = useState(false);
  const [newStatementRow, setNewStatementRow] = useState({
    date: '',
    retention: '',
    description: '',
    hours: '',
    payRate: '',
    credit: '',
    debit: '',
    balance: ''
  });

  // Calculate pay structure based on Excel formulas
  const calculatePayStructureValues = () => {
    const {
      lca,
      vendorRate,
      consultantRate,
      adpRate,
      biweeklyHours,
      payrollMode
    } = payStructureData;

    // Calculate as per LCA Rate (LCA / 24 / 80)
    const asPerLCARate = lca / 24 / 80;

    // Biweekly calculation
    const biweeklyConsultant = consultantRate * biweeklyHours;
    const biweeklyAdp = adpRate * biweeklyHours;

    // Perdiem Rate (from Excel: =D13/80, but D13 is not defined in provided data)
    // Using a default calculation based on the difference
    const perdiemRate = (vendorRate - adpRate) * 0.89; // Approximation based on 89% factor

    // Paying Rate (ADP Rate + Perdiem Rate)
    const payingRate = adpRate + perdiemRate;

    // Net Pay calculations
    const netPayConsultant = biweeklyConsultant * 0.89; // 89% of consultant rate
    const netPayAdp = biweeklyAdp + (perdiemRate * biweeklyHours); // ADP + Perdiem

    // Perdiem amount
    const perdiemAmount = netPayConsultant - netPayAdp;

    // Gross Pay
    const grossPayConsultant = biweeklyConsultant;
    const grossPayAdp = biweeklyAdp;

    return {
      asPerLCARate: asPerLCARate.toFixed(2),
      biweeklyConsultant: biweeklyConsultant.toFixed(2),
      biweeklyAdp: biweeklyAdp.toFixed(2),
      perdiemRate: perdiemRate.toFixed(2),
      payingRate: payingRate.toFixed(2),
      netPayConsultant: netPayConsultant.toFixed(2),
      netPayAdp: netPayAdp.toFixed(2),
      perdiemAmount: perdiemAmount.toFixed(2),
      grossPayConsultant: grossPayConsultant.toFixed(2),
      grossPayAdp: grossPayAdp.toFixed(2)
    };
  };

  const handleOpenPayStructure = () => {
    setShowPayStructureModal(true);
  };

  const handleClosePayStructure = () => {
    setShowPayStructureModal(false);
    setIsEditingPayStructure(false);
  };

  const handleEditPayStructure = () => {
    setIsEditingPayStructure(true);
  };

  const handleSavePayStructure = () => {
    setIsEditingPayStructure(false);
    Swal.fire({
      title: 'Success!',
      text: 'Pay structure updated successfully',
      icon: 'success',
      timer: 2000,
      showConfirmButton: false
    });
  };

  const handleCancelEditPayStructure = () => {
    setIsEditingPayStructure(false);
  };

  const handlePayStructureInputChange = (e) => {
    const { name, value } = e.target;
    setPayStructureData(prev => ({
      ...prev,
      [name]: parseFloat(value) || value
    }));
  };

  const filteredStatements = statements.filter(statement => {
    // Search filter
    const matchesSearch =
      statement.Description?.toLowerCase().includes(statementSearchTerm.toLowerCase()) ||
      statement.Period?.toLowerCase().includes(statementSearchTerm.toLowerCase());

    // Date range filter
    let matchesDateRange = true;
    if (statementFilterStartDate || statementFilterEndDate) {
      const statementDate = new Date(statement.CheckDate);

      if (statementFilterStartDate) {
        const startDate = new Date(statementFilterStartDate);
        matchesDateRange = matchesDateRange && statementDate >= startDate;
      }

      if (statementFilterEndDate) {
        const endDate = new Date(statementFilterEndDate);
        // Set end date to end of day
        endDate.setHours(23, 59, 59, 999);
        matchesDateRange = matchesDateRange && statementDate <= endDate;
      }
    }

    return matchesSearch && matchesDateRange;
  });




  // Fetch employee details and all related data
  useEffect(() => {
    const fetchEmployeeData = async () => {
      if (!employeeId) {
        Swal.fire({
          title: 'Error',
          text: 'Missing employee information',
          icon: 'error'
        });
        navigate(-1);
        return;
      }

      // If employee data was passed via state, use it directly
      if (passedEmployee && passedCompany) {
        console.log('Using passed employee data:', passedEmployee);
        console.log('Company:', passedCompany);

        setEmployee(passedEmployee);
        setCompany(passedCompany);
        setEditedEmployee(passedEmployee);

        // Fetch only stats using the employee's database Id
        try {
          setLoading(true);
          const token = localStorage.getItem('token');
          const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          };

          // Use the database Id for stats
          const statsResponse = await axios.get(
            `${BASE_URL}/api/employees/company/${passedCompany.id}/${passedEmployee.Id}/details`,
            { headers }
          );

          if (statsResponse.data.success) {
            setStats(statsResponse.data.data.stats || {});
          }
        } catch (error) {
          console.error('Error fetching employee stats:', error);
        } finally {
          setLoading(false);
        }
        return;
      }

      // If no employee data passed, this is an error
      Swal.fire({
        title: 'Error',
        text: 'No employee data available. Please navigate from the employee list.',
        icon: 'error'
      });
      navigate(-1);
    };

    fetchEmployeeData();

    // Fetch all employees for supervisor selection
    const fetchAllEmployees = async () => {
      if (passedCompany?.id || company?.id) {
        try {
          const token = localStorage.getItem('token');
          const cid = passedCompany?.id || company?.id;
          const response = await axios.get(`${BASE_URL}/api/employees/company/${cid}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.data.success) {
            setAllEmployees(response.data.data);
          }
        } catch (error) {
          console.error('Error fetching employees:', error);
        }
      }
    };
    fetchAllEmployees();
  }, [employeeId, navigate, passedEmployee, passedCompany, company?.id]);

  // Fetch data based on active view
  useEffect(() => {
    const fetchViewData = async () => {
      if (!company?.id || !employee?.EmployeeId) return;

      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      try {
        switch (activeView) {
          case 'internalTimesheets':
            console.log('Fetching internal timesheets for employee ID (database):', employee.Id);
            const timesheetsResponse = await axios.get(
              `${BASE_URL}/api/employees/company/${company.id}/${employee.Id}/timesheets`,
              { headers, params: { status: filterStatus !== 'all' ? filterStatus : undefined } }
            );
            if (timesheetsResponse.data.success) {
              setTimesheets(timesheetsResponse.data.data);
            }
            break;
          case 'externalTimesheets':
            console.log('Fetching external timesheets for EmployeeId:', employee.EmployeeId);
            try {
              const externalResponse = await axios.get(
                `${BASE_URL}/api/employees/company/${company.id}/${employee.EmployeeId}/external-timesheets`,
                { headers }
              );
              console.log('External timesheets response:', externalResponse.data);

              if (externalResponse.data.success) {
                console.log('External timesheets data:', externalResponse.data.data);
                setExternalTimesheets(externalResponse.data.data || []);
              } else {
                console.warn('External timesheets API returned success: false');
                setExternalTimesheets([]);
              }
            } catch (error) {
              console.error('Error fetching external timesheets:', error);
              setExternalTimesheets([]);
            }
            break;

          case 'statement':
            const statementsResponse = await axios.get(
              `${BASE_URL}/api/employees/company/${company.id}/${employee.Id}/statements`,
              { headers }
            );
            if (statementsResponse.data.success) {
              setStatements(statementsResponse.data.data);
            }
            break;

          case 'report':
            const reportsResponse = await axios.get(
              `${BASE_URL}/api/employees/company/${company.id}/${employee.Id}/reports`,
              { headers }
            );
            if (reportsResponse.data.success) {
              setReports(reportsResponse.data.data);
            }
            break;
        }
      } catch (error) {
        console.error(`Error fetching ${activeView} data:`, error);
        Swal.fire({
          title: 'Error',
          text: `Failed to load ${activeView}: ${error.response?.data?.message || error.message}`,
          icon: 'error'
        });
      }
    };

    fetchViewData();
  }, [activeView, company, employee, filterStatus]);

  // Add this new useEffect after your employee data fetch useEffect and BEFORE the fetchViewData useEffect:
  useEffect(() => {
    if (!company?.id || !employee?.EmployeeId) return;

    const token = localStorage.getItem('token');
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    const fetchExternalTimesheetsForBadge = async () => {
      try {
        // FIX: Use employee.EmployeeId
        const externalResponse = await axios.get(
          `${BASE_URL}/api/employees/company/${company.id}/${employee.EmployeeId}/external-timesheets`,
          { headers }
        );
        if (externalResponse.data.success) {
          setExternalTimesheets(externalResponse.data.data);
        }
      } catch (error) {
        console.error('Error fetching external timesheets for badge:', error);
      }
    };

    fetchExternalTimesheetsForBadge();
  }, [company, employee]);

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchPayrollInfo = async () => {
      if (!company?.id || !employee?.Id) return;

      try {
        setPayrollLoading(true);
        const token = localStorage.getItem('token');

        const response = await axios.get(
          `${BASE_URL}/api/employees/company/${company.id}/${employee.Id}/payroll-info`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.data.success) {
          setPayrollInfo(prev => ({
            ...prev,
            ...response.data.data.payrollInfo,
            employmentType: employee.EmploymentType || 'Full-time'  // 👈 ADD THIS
          }));
        }
      } catch (error) {
        console.error('Error fetching payroll info:', error);
      } finally {
        setPayrollLoading(false);
      }
    };

    fetchPayrollInfo();
  }, [company?.id, employee?.Id]);

  // Statement helper functions
  const handleAddNewRow = async () => {
    if (isAddingNewRow) {
      if (!newStatementRow.date || !newStatementRow.description) {
        Swal.fire({
          title: 'Validation Error',
          text: 'Please fill in Date and Description fields',
          icon: 'warning'
        });
        return;
      }

      // Calculate Credit from Hours * Pay Rate if provided
      let credit = 0;
      if (newStatementRow.hours && newStatementRow.payRate) {
        credit = parseFloat(newStatementRow.hours) * parseFloat(newStatementRow.payRate);
      } else if (newStatementRow.credit) {
        credit = parseFloat(newStatementRow.credit.replace(/,/g, ''));
      }

      // Get the last statement's balance to calculate new balance
      let previousBalance = 0;
      if (statements.length > 0) {
        const lastStatement = statements[statements.length - 1];
        previousBalance = parseFloat(lastStatement.Balance || 0);
      }

      // Calculate new balance: previousBalance + credit - debit
      const debit = parseFloat(newStatementRow.debit.replace(/,/g, '')) || 0;
      const newBalance = previousBalance + credit - debit;

      try {
        const token = localStorage.getItem('token');
        const response = await axios.post(
          `${BASE_URL}/api/employees/company/${company.id}/${employee.Id}/statements`,
          {
            checkDate: newStatementRow.date,
            period: newStatementRow.retention,
            description: newStatementRow.description,
            hours: newStatementRow.hours || 0,
            payRate: newStatementRow.payRate || 0,
            credit: credit,
            debit: debit,
            balance: newBalance
          },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.data.success) {
          Swal.fire({
            title: 'Success!',
            text: 'Statement row added successfully',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          });

          const statementsResponse = await axios.get(
            `${BASE_URL}/api/employees/company/${company.id}/${employee.Id}/statements`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );

          if (statementsResponse.data.success) {
            setStatements(statementsResponse.data.data);
          }

          setIsAddingNewRow(false);
          setNewStatementRow({
            date: '',
            retention: '',
            description: '',
            hours: '',
            payRate: '',
            credit: '',
            debit: '',
            balance: ''
          });
        }
      } catch (error) {
        console.error('Error adding statement:', error);
        Swal.fire({
          title: 'Error',
          text: error.response?.data?.message || 'Failed to add statement',
          icon: 'error'
        });
      }
    } else {
      setIsAddingNewRow(true);
    }
  };

  const handleNewRowInputChange = (e) => {
    const { name, value } = e.target;

    let updatedRow = {
      ...newStatementRow,
      [name]: value
    };

    // Auto-calculate credit if both hours and payRate are entered
    if ((name === 'hours' || name === 'payRate') && updatedRow.hours && updatedRow.payRate) {
      const calculatedCredit = parseFloat(updatedRow.hours) * parseFloat(updatedRow.payRate);
      updatedRow.credit = calculatedCredit.toFixed(2);

      // Auto-calculate balance: previousBalance + credit - debit
      let previousBalance = 0;
      if (statements.length > 0) {
        const lastStatement = statements[statements.length - 1];
        previousBalance = parseFloat(lastStatement.Balance || 0);
      }

      const debit = parseFloat(updatedRow.debit.replace(/,/g, '')) || 0;
      const newBalance = previousBalance + calculatedCredit - debit;
      updatedRow.balance = newBalance.toFixed(2);
    }

    // Auto-calculate balance if debit changes
    if (name === 'debit' && updatedRow.credit) {
      let previousBalance = 0;
      if (statements.length > 0) {
        const lastStatement = statements[statements.length - 1];
        previousBalance = parseFloat(lastStatement.Balance || 0);
      }

      const credit = parseFloat(updatedRow.credit.replace(/,/g, '')) || 0;
      const debit = parseFloat(value.replace(/,/g, '')) || 0;
      const newBalance = previousBalance + credit - debit;
      updatedRow.balance = newBalance.toFixed(2);
    }

    setNewStatementRow(updatedRow);
  };

  const handleCancelNewRow = () => {
    setIsAddingNewRow(false);
    setNewStatementRow({
      date: '',
      retention: '',
      description: '',
      hours: '',
      payRate: '',
      credit: '',
      debit: '',
      balance: ''
    });
  };

  const formatCurrency = (value) => {
    if (!value) return '0.00';
    return parseFloat(value).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Employee edit functions
  const handleEdit = () => setIsEditing(true);

  const handleSave = async () => {
    // Validation
    if (!editedEmployee.Name?.trim() && !editedEmployee.Email?.trim()) {
      // Only block if both are missing, or just allow saving everything?
      // User said "remove the mandatory fields", so I'll be very permissive.
    }

    try {
      const token = localStorage.getItem('token');

      // Construct the payload with all necessary fields
      const payload = {
        name: editedEmployee.Name?.trim(),
        email: editedEmployee.Email?.trim(),
        // department: editedEmployee.Department?.trim(), // Commented out as requested
        phone: editedEmployee.Phone?.trim(),
        position: editedEmployee.Position?.trim(),
        employmentType: editedEmployee.EmploymentType,
        status: editedEmployee.EmploymentStatus || editedEmployee.Status,
        hireDate: editedEmployee.HireDate,

        // Supervisor fields
        supervisorEmployeeId: editedEmployee.SupervisorEmployeeId,
        backupSupervisorEmployeeId: editedEmployee.BackupSupervisorEmployeeId,
        timesheetRequired: editedEmployee.TimesheetRequired,

        // Emergency contact
        emergencyContactName: editedEmployee.EmergencyContactName?.trim(),
        emergencyContactPhone: editedEmployee.EmergencyContactPhone?.trim(),

        // Address fields
        streetAddress: editedEmployee.StreetAddress?.trim(),
        apartmentSuite: editedEmployee.ApartmentSuite?.trim(),
        city: editedEmployee.City?.trim(),
        state: editedEmployee.State?.trim(),
        zipCode: editedEmployee.ZipCode?.trim()
      };

      const response = await axios.put(
        `${BASE_URL}/api/employees/company/${company.id}/${employee.EmployeeId}`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        // The backend should return the full updated employee object
        const updatedData = response.data.data;
        setEmployee(updatedData);
        setEditedEmployee(updatedData);
        setIsEditing(false);

        Swal.fire({
          title: 'Success!',
          text: 'Employee updated successfully',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      }
    } catch (error) {
      console.error('Error updating employee:', error);
      Swal.fire({
        title: 'Error',
        text: error.response?.data?.message || 'Failed to update employee',
        icon: 'error'
      });
    }
  };
  const handleCancel = () => {
    setEditedEmployee(employee);
    setIsEditing(false);
  };

  // Add these functions to your EmployeeDetailsPage component
  const handleGrantEditingPermission = async (employeeId) => {
    const result = await Swal.fire({
      title: 'Grant Editing Permission?',
      text: 'This will allow the employee to edit their submitted timesheets. Are you sure?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, grant permission!',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('token');

        const response = await axios.post(
          `${BASE_URL}/api/timesheets/grant-editing-permission`,
          {
            employeeId: employeeId,
            allowEditing: true
          },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.data.success) {
          Swal.fire({
            title: 'Permission Granted!',
            text: 'Employee can now edit their submitted timesheets.',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          });
          fetchPermissionStatus(); // Refresh status
        }
      } catch (error) {
        console.error('Error granting editing permission:', error);
        Swal.fire({
          title: 'Error',
          text: error.response?.data?.message || 'Failed to grant editing permission',
          icon: 'error'
        });
      }
    }
  };

  const handleRevokeEditingPermission = async (employeeId) => {
    const result = await Swal.fire({
      title: 'Revoke Editing Permission?',
      text: 'This will prevent the employee from editing their submitted timesheets. Are you sure?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, revoke permission!',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('token');

        const response = await axios.post(
          `${BASE_URL}/api/timesheets/grant-editing-permission`,
          {
            employeeId: employeeId,
            allowEditing: false
          },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.data.success) {
          Swal.fire({
            title: 'Permission Revoked!',
            text: 'Employee can no longer edit submitted timesheets.',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          });
          fetchPermissionStatus(); // Refresh status
        }
      } catch (error) {
        console.error('Error revoking editing permission:', error);
        Swal.fire({
          title: 'Error',
          text: error.response?.data?.message || 'Failed to revoke editing permission',
          icon: 'error'
        });
      }
    }
  };

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: 'Delete Employee?',
      text: `Are you sure you want to delete ${employee.Name}? This will also delete all associated timesheets.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('token');

        const response = await axios.delete(
          `${BASE_URL}/api/employees/company/${company.id}/${employee.EmployeeId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.data.success) {
          Swal.fire({
            title: 'Deleted!',
            text: response.data.message,
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          });
          navigate(-1);
        }
      } catch (error) {
        console.error('Error deleting employee:', error);
        Swal.fire({
          title: 'Error',
          text: error.response?.data?.message || 'Failed to delete employee',
          icon: 'error'
        });
      }
    }
  };

  // Export timesheet to CSV
  const exportTimesheetToCSV = (timesheet, entries) => {
    const csvRows = [];

    // Add header information
    csvRows.push(`Timesheet Tasks - ${employee.Name}`);
    csvRows.push(`Period:,${new Date(timesheet.PeriodStart).toLocaleDateString()} - ${new Date(timesheet.PeriodEnd).toLocaleDateString()}`);
    csvRows.push(`Total Hours:,${timesheet.totalHours || 0} hours`);
    csvRows.push(`Status:,${timesheet.status}`);
    if (timesheet.notes) {
      csvRows.push(`Notes:,${timesheet.notes}`);
    }
    csvRows.push(''); // Empty row

    // Add table headers
    csvRows.push('Date,Day,Hours,Type,Task');

    // Add entries
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    entries.forEach(entry => {
      const entryDate = new Date(entry.Date);
      const dayName = dayNames[entryDate.getDay()];
      const task = (!entry.Task || entry.Task === 'General Work' ? 'Task cannot be updated' : entry.Task).replace(/,/g, ';'); // Replace commas in task

      // Format date with tab character to force text format in Excel
      const formattedDate = `="${entryDate.toLocaleDateString()}"`;

      csvRows.push(`${formattedDate},${dayName},${entry.Hours || 0},${entry.DayType || 'Regular'},${task}`);
    });

    // Create CSV content
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `Timesheet_${employee.Name}_${new Date(timesheet.PeriodStart).toLocaleDateString().replace(/\//g, '-')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // View Timesheet Tasks - FIXED VERSION WITH CORRECT ID PROPERTY
  const handleViewTimesheetTasks = async (timesheetId) => {
    try {
      const token = localStorage.getItem('token');

      console.log('🔍 Fetching timesheet details for ID:', timesheetId);

      // First, get the timesheet basic info
      const timesheetResponse = await axios.get(
        `${BASE_URL}/api/employees/company/${company.id}/${employee.Id}/timesheets`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!timesheetResponse.data.success) {
        throw new Error('Failed to fetch timesheets');
      }

      // FIX: Check for both 'id' and 'Id' properties since API might return either
      const timesheet = timesheetResponse.data.data.find(ts => ts.id === timesheetId || ts.Id === timesheetId);

      if (!timesheet) {
        throw new Error('Timesheet not found');
      }

      console.log('✅ Found timesheet:', timesheet);

      // Now fetch the entries for this timesheet
      const entriesResponse = await axios.get(
        `${BASE_URL}/api/timesheets/${timesheetId}/entries`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Entries response:', entriesResponse.data);

      const entries = entriesResponse.data.entries || entriesResponse.data || [];

      const getTableHtml = (isEdit) => {
        if (entries.length === 0) return '<p style="text-align: center; padding: 20px; color: #6b7280;">No entries found for this timesheet.</p>';

        let html = '<table style="width: 100%; border-collapse: collapse; text-align: left;">';
        html += '<thead><tr style="background: #f3f4f6; border-bottom: 2px solid #e5e7eb;">';
        html += '<th style="padding: 12px;">Date</th>';
        html += '<th style="padding: 12px;">Day</th>';
        html += '<th style="padding: 12px;">Hours</th>';
        html += '<th style="padding: 12px;">Type</th>';
        html += '<th style="padding: 12px;">Task</th>';
        html += '</tr></thead><tbody>';

        entries.forEach(entry => {
          const entryDate = new Date(entry.Date);
          const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          const dayName = dayNames[entryDate.getDay()];

          const rawType = entry.DayType || entry.HourType || 'Regular';
          const isLeave = rawType.toLowerCase() === 'leave' || entry.IsLeave === true || entry.IsLeave === 1;
          const isHoliday = rawType.toLowerCase() === 'holiday' || entry.IsHoliday === true || entry.IsHoliday === 1;

          const displayHours = (isLeave || isHoliday) ? 0 : (entry.Hours || 0);
          let rawTask = entry.Task || entry.task || entry.Description || entry.description || entry.Notes;
          if (rawTask === 'General Work') rawTask = 'Task cannot be updated';
          const taskText = (isLeave || isHoliday) ? 'No task' : (rawTask || 'Task cannot be updated');

          html += `<tr style="border-bottom: 1px solid #e5e7eb;" class="mts-entry-row" data-id="${entry.TimesheetEntryId || entry.id || entry.Id}">`;
          html += `<td style="padding: 10px;">${entryDate.toLocaleDateString()}</td>`;
          html += `<td style="padding: 10px;">${dayName}</td>`;

          if (isEdit) {
            html += `<td style="padding: 10px;"><input type="number" step="0.5" class="mts-hours-input" value="${displayHours}" style="width: 60px; padding: 4px; border: 1px solid #d1d5db; border-radius: 4px;"></td>`;
            html += `<td style="padding: 10px;">
                <select class="mts-type-input" style="padding: 4px; border: 1px solid #d1d5db; border-radius: 4px;">
                    <option value="REGULAR" ${rawType.toUpperCase() === 'REGULAR' ? 'selected' : ''}>REGULAR</option>
                    <option value="LEAVE" ${rawType.toUpperCase() === 'LEAVE' ? 'selected' : ''}>LEAVE</option>
                    <option value="HOLIDAY" ${rawType.toUpperCase() === 'HOLIDAY' ? 'selected' : ''}>HOLIDAY</option>
                    <option value="PTO" ${rawType.toUpperCase() === 'PTO' ? 'selected' : ''}>PTO</option>
                    <option value="SICK" ${rawType.toUpperCase() === 'SICK' ? 'selected' : ''}>SICK</option>
                </select>
            </td>`;
            html += `<td style="padding: 10px;"><input type="text" class="mts-task-input" value="${taskText.replace(/"/g, '&quot;')}" style="width: 100%; padding: 4px; border: 1px solid #d1d5db; border-radius: 4px;"></td>`;
          } else {
            html += `<td style="padding: 10px; font-weight: 600;">${displayHours} hrs</td>`;
            html += `<td style="padding: 10px;">${rawType}</td>`;
            html += `<td style="padding: 10px;" class="mts-task-hover-cell" data-full-task="${taskText.replace(/"/g, '&quot;')}"><span class="mts-task-cell">${taskText}</span></td>`;
          }
          html += '</tr>';
        });
        html += '</tbody></table>';
        return html;
      };

      const handleSaveEntries = async (ts, updatedEntries) => {
        try {
          const token = localStorage.getItem('token');
          const response = await axios.put(
            `${BASE_URL}/api/timesheets/company/${company.id}/${ts.Id || ts.id}/entries`,
            { entries: updatedEntries },
            { headers: { 'Authorization': `Bearer ${token}` } }
          );

          if (response.data.success) {
            // Update local state by refreshing the list (standard pattern in UserDetails.js)
            const timesheetsResponse = await axios.get(
              `${BASE_URL}/api/employees/company/${company.id}/${employee.Id}/timesheets`,
              { headers: { 'Authorization': `Bearer ${token}` } }
            );
            if (timesheetsResponse.data.success) {
              setTimesheets(timesheetsResponse.data.data);
            }

            Swal.fire({
              title: 'Saved!',
              text: 'Timesheet entries updated successfully.',
              icon: 'success',
              timer: 1500,
              showConfirmButton: false
            });
            return true;
          }
          return false;
        } catch (error) {
          console.error('Error saving timesheet entries:', error);
          Swal.fire('Error', error.response?.data?.message || 'Failed to save entries', 'error');
          return false;
        }
      };

      Swal.fire({
        title: `Timesheet Tasks - ${employee.Name}`,
        html: `
          <div style="text-align: left; margin-bottom: 20px;">
            <p><strong>Period:</strong> ${new Date(timesheet.PeriodStart).toLocaleDateString()} - ${new Date(timesheet.PeriodEnd).toLocaleDateString()}</p>
            <p><strong>Total Hours:</strong> <span id="mts-modal-total-hours">${timesheet.totalHours || timesheet.TotalHours || 0}</span> hours</p>
            <p><strong>Status:</strong> <span style="padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; background: ${(timesheet.status || timesheet.Status) === 'Approved' ? '#d1fae5' :
            (timesheet.status || timesheet.Status) === 'Rejected' ? '#fee2e2' : '#fff3cd'
          }; color: ${(timesheet.status || timesheet.Status) === 'Approved' ? '#065f46' :
            (timesheet.status || timesheet.Status) === 'Rejected' ? '#991b1b' : '#856404'
          };">${timesheet.status || timesheet.Status}</span></p>
            ${timesheet.notes || timesheet.Notes ? `<p><strong>Notes:</strong> ${timesheet.notes || timesheet.Notes}</p>` : ''}
          </div>
          <div id="mts-table-container" style="max-height: 400px; overflow-y: auto; padding-bottom: 20px;">
            ${getTableHtml(false)}
          </div>
        `,
        width: '900px',
        showConfirmButton: (timesheet.status || timesheet.Status) !== 'Approved',
        showDenyButton: (timesheet.status || timesheet.Status) !== 'Approved',
        showCancelButton: true,
        confirmButtonText: 'Approve',
        denyButtonText: 'Reject',
        cancelButtonText: 'Close',
        confirmButtonColor: '#10b981',
        denyButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        didOpen: () => {
          const container = Swal.getHtmlContainer();
          const actions = container.closest('.swal2-popup').querySelector('.swal2-actions');
          let isEditMode = false;

          // Add Edit button if it's not approved
          if ((timesheet.status || timesheet.Status) !== 'Approved') {
            const editBtn = document.createElement('button');
            editBtn.type = 'button';
            editBtn.id = 'mts-edit-toggle-btn';
            editBtn.innerText = 'Edit';
            editBtn.className = 'swal2-confirm swal2-styled';
            editBtn.style.backgroundColor = '#3b82f6';
            editBtn.style.marginRight = '10px';

            const confirmBtn = actions.querySelector('.swal2-confirm');
            actions.insertBefore(editBtn, confirmBtn);

            editBtn.onclick = async () => {
              if (!isEditMode) {
                isEditMode = true;
                editBtn.innerText = 'Save Changes';
                editBtn.style.backgroundColor = '#10b981';
                const tableContainer = container.querySelector('#mts-table-container');
                if (tableContainer) tableContainer.innerHTML = getTableHtml(true);
              } else {
                const rows = Array.from(container.querySelectorAll('.mts-entry-row'));
                const updatedEntries = rows.map(row => {
                  const hoursInput = row.querySelector('.mts-hours-input');
                  const taskInput = row.querySelector('.mts-task-input');
                  const typeInput = row.querySelector('.mts-type-input');
                  if (hoursInput && taskInput && typeInput) {
                    return {
                      id: row.dataset.id,
                      hours: hoursInput.value,
                      task: taskInput.value,
                      hourType: typeInput.value
                    };
                  }
                  return null;
                }).filter(Boolean);

                if (updatedEntries.length > 0) {
                  editBtn.disabled = true;
                  editBtn.innerText = 'Saving...';
                  const success = await handleSaveEntries(timesheet, updatedEntries);
                  if (success) {
                    const newTotal = updatedEntries.reduce((sum, e) => sum + parseFloat(e.hours || 0), 0);
                    const totalDisplay = container.querySelector('#mts-modal-total-hours');
                    if (totalDisplay) totalDisplay.innerText = newTotal;

                    updatedEntries.forEach(upd => {
                      const entry = entries.find(e => String(e.TimesheetEntryId || e.id || e.Id) === String(upd.id));
                      if (entry) {
                        entry.Hours = parseFloat(upd.hours);
                        entry.Task = upd.task;
                        entry.HourType = upd.hourType;
                        entry.DayType = upd.hourType;
                      }
                    });

                    isEditMode = false;
                    editBtn.innerText = 'Edit';
                    editBtn.style.backgroundColor = '#3b82f6';
                    const tableContainer = container.querySelector('#mts-table-container');
                    if (tableContainer) tableContainer.innerHTML = getTableHtml(false);
                  }
                  editBtn.disabled = false;
                }
              }
            };
          }

          const attachTooltips = () => {
            const hoverCells = container.querySelectorAll('.mts-task-hover-cell');
            let tooltip = document.getElementById('mts-floating-tooltip-user');
            if (!tooltip) {
              tooltip = document.createElement('div');
              tooltip.id = 'mts-floating-tooltip-user';
              tooltip.style.position = 'fixed';
              tooltip.style.display = 'none';
              tooltip.style.padding = '12px 16px';
              tooltip.style.background = '#0f172a';
              tooltip.style.color = '#ffffff';
              tooltip.style.borderRadius = '8px';
              tooltip.style.zIndex = '9999999';
              tooltip.style.pointerEvents = 'none';
              tooltip.style.maxWidth = '350px';
              tooltip.style.fontSize = '13px';
              tooltip.style.lineHeight = '1.5';
              tooltip.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.4)';
              tooltip.style.border = '1px solid rgba(255, 255, 255, 0.2)';
              document.body.appendChild(tooltip);
            }

            hoverCells.forEach(cell => {
              cell.addEventListener('mousemove', (e) => {
                tooltip.innerText = cell.getAttribute('data-full-task');
                tooltip.style.display = 'block';
                tooltip.style.left = (e.clientX + 15) + 'px';
                tooltip.style.top = (e.clientY + 15) + 'px';

                const rect = tooltip.getBoundingClientRect();
                if (rect.right > window.innerWidth) {
                  tooltip.style.left = (e.clientX - rect.width - 15) + 'px';
                }
                if (rect.bottom > window.innerHeight) {
                  tooltip.style.top = (e.clientY - rect.height - 15) + 'px';
                }
              });
              cell.addEventListener('mouseleave', () => {
                tooltip.style.display = 'none';
              });
            });
          };

          attachTooltips();
          const observer = new MutationObserver(attachTooltips);
          const tableContainer = container.querySelector('#mts-table-container');
          if (tableContainer) observer.observe(tableContainer, { childList: true });
        },
        willClose: () => {
          const tooltip = document.getElementById('mts-floating-tooltip-user');
          if (tooltip) tooltip.remove();
        }
      }).then((result) => {
        if (result.isConfirmed) {
          handleApproveInternalTimesheet(timesheet.Id || timesheet.id);
        } else if (result.isDenied) {
          handleRejectInternalTimesheet(timesheet.Id || timesheet.id);
        }
      });
    } catch (error) {
      console.error('❌ Error fetching timesheet details:', error);
      console.error('Error response:', error.response?.data);

      Swal.fire({
        title: 'Error',
        text: error.response?.data?.message || 'Failed to load timesheet details',
        icon: 'error'
      });
    }
  };

  // Approve Internal Timesheet
  const handleApproveInternalTimesheet = async (timesheetId) => {
    const result = await Swal.fire({
      title: 'Approve Timesheet?',
      text: 'Are you sure you want to approve this timesheet?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, approve it!',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('token');

        const response = await axios.post(
          `${BASE_URL}/api/timesheets/${timesheetId}/approve`,
          {},
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.data.success) {
          // Refresh the timesheets list
          const timesheetsResponse = await axios.get(
            `${BASE_URL}/api/employees/company/${company.id}/${employee.Id}/timesheets`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              params: { status: filterStatus !== 'all' ? filterStatus : undefined }
            }
          );

          if (timesheetsResponse.data.success) {
            setTimesheets(timesheetsResponse.data.data);
          }

          // Refresh stats
          const statsResponse = await axios.get(
            `${BASE_URL}/api/employees/company/${company.id}/${employee.Id}/details`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );

          if (statsResponse.data.success) {
            setStats(statsResponse.data.data.stats || {});
          }

          Swal.fire({
            title: 'Approved!',
            text: 'Timesheet has been approved successfully.',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          });
        }
      } catch (error) {
        console.error('Error approving timesheet:', error);
        Swal.fire({
          title: 'Error',
          text: error.response?.data?.message || 'Failed to approve timesheet',
          icon: 'error'
        });
      }
    }
  };

  // Reject Internal Timesheet
  const handleRejectInternalTimesheet = async (timesheetId) => {
    const { value: reason, isConfirmed } = await Swal.fire({
      title: 'Reject Timesheet?',
      input: 'textarea',
      inputLabel: 'Rejection Reason (optional)',
      inputPlaceholder: 'Enter reason for rejection...',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, reject it!',
      cancelButtonText: 'Cancel'
    });

    if (isConfirmed) {
      try {
        const token = localStorage.getItem('token');

        const response = await axios.post(
          `${BASE_URL}/api/timesheets/${timesheetId}/reject`,
          {
            reason: reason || 'No reason provided'
          },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.data.success) {
          // Refresh the timesheets list
          const timesheetsResponse = await axios.get(
            `${BASE_URL}/api/employees/company/${company.id}/${employee.Id}/timesheets`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              params: { status: filterStatus !== 'all' ? filterStatus : undefined }
            }
          );

          if (timesheetsResponse.data.success) {
            setTimesheets(timesheetsResponse.data.data);
          }

          // Refresh stats
          const statsResponse = await axios.get(
            `${BASE_URL}/api/employees/company/${company.id}/${employee.Id}/details`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );

          if (statsResponse.data.success) {
            setStats(statsResponse.data.data.stats || {});
          }

          Swal.fire({
            title: 'Rejected!',
            text: 'Timesheet has been rejected.',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          });
        }
      } catch (error) {
        console.error('Error rejecting timesheet:', error);
        Swal.fire({
          title: 'Error',
          text: error.response?.data?.message || 'Failed to reject timesheet',
          icon: 'error'
        });
      }
    }
  };

  // Delete Internal Timesheet
  const deleteInternalTimesheet = async (timesheetId) => {
    const result = await Swal.fire({
      title: 'Delete Timesheet?',
      text: 'Are you sure you want to delete this timesheet? This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(
          `${BASE_URL}/api/timesheets/${timesheetId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        // Refresh the timesheets list - fix: use both Id and id
        setTimesheets(prev => prev.filter(ts => ts.Id !== timesheetId && ts.id !== timesheetId));

        // Refresh stats
        const statsResponse = await axios.get(
          `${BASE_URL}/api/employees/company/${company.id}/${employee.Id}/details`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (statsResponse.data.success) {
          setStats(statsResponse.data.data.stats || {});
        }

        Swal.fire({
          title: 'Deleted!',
          text: 'Timesheet has been deleted.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      } catch (error) {
        console.error('Error deleting timesheet:', error);
        Swal.fire('Error', 'Failed to delete timesheet', 'error');
      }
    }
  };

  // Approve external timesheet
  const handleApproveExternalTimesheet = async (timesheetId) => {
    const result = await Swal.fire({
      title: 'Approve Timesheet?',
      text: 'Are you sure you want to approve this external timesheet?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, approve it!',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('token');

        // FIX: Pass companyId as param, use EmployeeId in route, timesheetId in path
        const response = await axios.post(
          `${BASE_URL}/api/employees/company/${company.id}/${employee.EmployeeId}/external-timesheets/${timesheetId}/approve`,
          {},
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.data.success) {
          // Refresh the external timesheets list using EmployeeId
          const timesheetsResponse = await axios.get(
            `${BASE_URL}/api/employees/company/${company.id}/${employee.EmployeeId}/external-timesheets`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );

          if (timesheetsResponse.data.success) {
            setExternalTimesheets(timesheetsResponse.data.data);
          }

          Swal.fire({
            title: 'Approved!',
            text: 'External timesheet has been approved successfully.',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          });
        }
      } catch (error) {
        console.error('Error approving timesheet:', error);
        console.error('Error details:', error.response?.data);

        Swal.fire({
          title: 'Error',
          text: error.response?.data?.message || 'Failed to approve timesheet',
          icon: 'error'
        });
      }
    }
  };

  // Reject external timesheet
  const handleRejectExternalTimesheet = async (timesheetId) => {
    const { value: reason, isConfirmed } = await Swal.fire({
      title: 'Reject Timesheet?',
      input: 'textarea',
      inputLabel: 'Rejection Reason (optional)',
      inputPlaceholder: 'Enter reason for rejection...',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, reject it!',
      cancelButtonText: 'Cancel'
    });

    if (isConfirmed) {
      try {
        const token = localStorage.getItem('token');

        // FIX: Pass companyId as param, use EmployeeId in route, timesheetId in path
        const response = await axios.post(
          `${BASE_URL}/api/employees/company/${company.id}/${employee.EmployeeId}/external-timesheets/${timesheetId}/reject`,
          {
            reason: reason || 'No reason provided'
          },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.data.success) {
          // Refresh the external timesheets list using EmployeeId
          const timesheetsResponse = await axios.get(
            `${BASE_URL}/api/employees/company/${company.id}/${employee.EmployeeId}/external-timesheets`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );

          if (timesheetsResponse.data.success) {
            setExternalTimesheets(timesheetsResponse.data.data);
          }

          Swal.fire({
            title: 'Rejected!',
            text: 'External timesheet has been rejected.',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          });
        }
      } catch (error) {
        console.error('Error rejecting timesheet:', error);
        console.error('Error details:', error.response?.data);

        Swal.fire({
          title: 'Error',
          text: error.response?.data?.message || 'Failed to reject timesheet',
          icon: 'error'
        });
      }
    }
  };

  // Download external timesheet
  const handleDownloadExternalTimesheet = async (timesheetId, fileName) => {
    try {
      const token = localStorage.getItem('token');
      // FIX: Use EmployeeId instead of Id
      const response = await axios.get(
        `${BASE_URL}/api/employees/company/${company.id}/${employee.EmployeeId}/external-timesheets/${timesheetId}/download`,
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
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      Swal.fire({
        title: 'Error',
        text: 'Failed to download file',
        icon: 'error'
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedEmployee(prev => ({ ...prev, [name]: value }));
  };
  const handlePayrollInputChange = (e) => {
    const { name, value } = e.target;
    setPayrollInfo(prev => ({
      ...prev,
      [name]: isNaN(value) ? value : parseFloat(value)
    }));
  };

  const handleSavePayrollInfo = async () => {
    try {
      const token = localStorage.getItem('token');

      const response = await axios.put(
        `${BASE_URL}/api/employees/company/${company.id}/${employee.Id}/payroll-info`,
        {
          payType: payrollInfo.payType,
          basisOfPay: payrollInfo.basisOfPay,
          paySchedule: payrollInfo.paySchedule,
          employmentType: payrollInfo.employmentType,  // 👈 ADD THIS
          seasonalEmployee: payrollInfo.seasonalEmployee,
          ownerOfficer: payrollInfo.ownerOfficer,
          semiMonthlySalary: parseFloat(payrollInfo.semiMonthlySalary) || 0,
          hourlyRate: parseFloat(payrollInfo.hourlyRate) || 0
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setPayrollInfo(response.data.data.payrollInfo);
        setIsEditingPayroll(false);

        Swal.fire({
          title: 'Success!',
          text: 'Payroll information updated successfully',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      }
    } catch (error) {
      console.error('Error updating payroll info:', error);
      Swal.fire({
        title: 'Error',
        text: error.response?.data?.message || 'Failed to update payroll information',
        icon: 'error'
      });
    }
  };

  const handleCancelPayrollEdit = () => {
    setIsEditingPayroll(false);
  };

  // File upload handlers
  const handleReportUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      // Validate file size (50MB limit)
      const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
      if (file.size > MAX_FILE_SIZE) {
        Swal.fire({
          title: 'File Too Large',
          text: 'File size must be less than 50MB',
          icon: 'error'
        });
        e.target.value = '';
        return;
      }

      // Create FormData object
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'Custom Report');
      formData.append('description', '');

      const token = localStorage.getItem('token');

      console.log('Uploading report for company:', company.id, 'employee:', employee.Id);
      console.log('File name:', file.name, 'Size:', file.size);

      const response = await axios.post(
        `${BASE_URL}/api/employees/company/${company.id}/${employee.Id}/reports`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      console.log('Upload response:', response.data);

      if (response.data.success) {
        Swal.fire({
          title: 'Success!',
          text: 'Report uploaded successfully',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });

        // Refresh reports list
        const reportsResponse = await axios.get(
          `${BASE_URL}/api/employees/company/${company.id}/${employee.Id}/reports`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (reportsResponse.data.success) {
          setReports(reportsResponse.data.data);
        }

        // Clear the input
        e.target.value = '';
      }
    } catch (error) {
      console.error('Error uploading report:', error);
      console.error('Error response:', error.response?.data);

      Swal.fire({
        title: 'Error',
        text: error.response?.data?.message || 'Failed to upload report',
        icon: 'error'
      });

      // Clear the input
      e.target.value = '';
    }
  };

  // Delete handlers
  const deleteExternalTimesheet = async (id) => {
    const result = await Swal.fire({
      title: 'Delete Timesheet?',
      text: 'Are you sure you want to delete this timesheet?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('token');
        // FIX: Use EmployeeId instead of Id
        await axios.delete(
          `${BASE_URL}/api/employees/company/${company.id}/${employee.EmployeeId}/external-timesheets/${id}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        setExternalTimesheets(prev => prev.filter(ts => ts.Id !== id));
        Swal.fire('Deleted!', 'Timesheet has been deleted.', 'success');
      } catch (error) {
        console.error('Error deleting timesheet:', error);
        Swal.fire('Error', 'Failed to delete timesheet', 'error');
      }
    }
  };

  const deleteReport = async (id) => {
    const result = await Swal.fire({
      title: 'Delete Report?',
      text: 'Are you sure you want to delete this report?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(
          `${BASE_URL}/api/employees/company/${company.id}/${employee.Id}/reports/${id}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        setReports(prev => prev.filter(report => report.Id !== id));
        Swal.fire('Deleted!', 'Report has been deleted.', 'success');
      } catch (error) {
        console.error('Error deleting report:', error);
        Swal.fire('Error', 'Failed to delete report', 'error');
      }
    }
  };

  const deleteStatement = async (id) => {
    const result = await Swal.fire({
      title: 'Delete Statement?',
      text: 'Are you sure you want to delete this statement?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(
          `${BASE_URL}/api/employees/company/${company.id}/${employee.Id}/statements/${id}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        setStatements(prev => prev.filter(statement => statement.Id !== id));
        Swal.fire('Deleted!', 'Statement has been deleted.', 'success');
      } catch (error) {
        console.error('Error deleting statement:', error);
        Swal.fire('Error', 'Failed to delete statement', 'error');
      }
    }
  };

  if (loading || !employee) {
    return (
      <div className="employee-details-main-container">
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh'
        }}>
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  const filteredTimesheets = timesheets.filter(ts => {
    const matchesSearch = ts.EmployeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ts.Period?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Filter function for External Timesheets
  const filteredExternalTimesheets = externalTimesheets.filter(ts => {
    // Search filter
    const matchesSearch =
      ts.FileName?.toLowerCase().includes(externalSearchTerm.toLowerCase()) ||
      ts.Period?.toLowerCase().includes(externalSearchTerm.toLowerCase());

    // Status filter
    const matchesStatus = externalFilterStatus === 'all' ||
      (ts.Status || 'Pending') === externalFilterStatus;

    // Period filter
    let matchesPeriod = true;
    if (externalFilterPeriod !== 'all') {
      const uploadDate = new Date(ts.UploadDate);
      const currentDate = new Date();
      const monthsAgo = new Date(currentDate.getFullYear(), currentDate.getMonth() - parseInt(externalFilterPeriod), currentDate.getDate());
      matchesPeriod = uploadDate >= monthsAgo;
    }

    return matchesSearch && matchesStatus && matchesPeriod;
  });

  return (
    <div className="employee-details-main-container">
      {/* Header */}
      <div className="employee-details-header">
        <div className="employee-details-header-content">
          <div className="employee-details-header-left">
            <button className="employee-details-back-button" onClick={() => navigate(-1)}>
              <ArrowLeft size={20} />
              Back
            </button>
            <div>
              <h1>{employee.Name} - Employee Details</h1>
              <p>Employee Code: {employee.EmployeeCode || employee.employeeCode || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="employee-details-navigation-tabs">
          <button
            className={`employee-details-tab-button ${activeView === 'employeeDetails' ? 'active' : ''}`}
            onClick={() => setActiveView('employeeDetails')}
          >
            <User size={16} />
            Employee Details
          </button>
          <button
            className={`employee-details-tab-button ${activeView === 'internalTimesheets' ? 'active' : ''}`}
            onClick={() => setActiveView('internalTimesheets')}
          >
            <FileText size={16} />
            Internal Timesheets
            {stats.timesheets?.internalPending > 0 && (
              <span style={{
                marginLeft: '8px',
                backgroundColor: '#ef4444',
                color: 'white',
                borderRadius: '50%',
                padding: '2px 6px',
                fontSize: '11px'
              }}>
                {stats.timesheets.internalPending}
              </span>
            )}
          </button>

          {/* HIDE THESE TABS FOR PROPHECY OFFSHORE */}
          {!shouldHideTabs(company) && (
            <>
              <button
                className={`employee-details-tab-button ${activeView === 'externalTimesheets' ? 'active' : ''}`}
                onClick={() => setActiveView('externalTimesheets')}
              >
                <FileSpreadsheet size={16} />
                External Timesheets
                {stats.timesheets?.externalPending > 0 && (
                  <span style={{
                    marginLeft: '8px',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    borderRadius: '50%',
                    padding: '2px 6px',
                    fontSize: '11px'
                  }}>
                    {stats.timesheets.externalPending}
                  </span>
                )}
              </button>
              <button
                className={`employee-details-tab-button ${activeView === 'statement' ? 'active' : ''}`}
                onClick={() => setActiveView('statement')}
              >
                <BarChart3 size={16} />
                Statement
              </button>
            </>
          )}
          <button
            className={`employee-details-tab-button ${activeView === 'report' ? 'active' : ''}`}
            onClick={() => setActiveView('report')}
          >
            <FileText size={16} />
            Report
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="employee-details-main-content">
        {/* Employee Details View */}
        {activeView === 'employeeDetails' && (
          <div className="employee-details-content-section">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px', alignItems: 'start' }}>
              {/* LEFT COLUMN - Employee Details Card */}
              <div className="employee-details-card">
                <div className="employee-details-card-header">
                  <h3>Employee Details - {employee.Name}</h3>

                  {isEditing ? (
                    <div className="employee-details-action-buttons">
                      <button className="employee-details-btn employee-details-btn-success" onClick={handleSave}>
                        <Save size={16} />
                        Save
                      </button>
                      <button className="employee-details-btn employee-details-btn-danger" onClick={handleCancel}>
                        <X size={16} />
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="employee-details-action-buttons">
                      <button className="employee-details-btn employee-details-btn-primary" onClick={handleEdit}>
                        <Edit3 size={16} />
                        Edit
                      </button>
                      <button className="employee-details-btn employee-details-btn-danger" onClick={handleDelete}>
                        <Trash2 size={16} />
                        Delete
                      </button>
                    </div>
                  )}
                </div>

                <div className="employee-details-info-grid">
                  <div className="employee-details-employee-card">
                    <div className="employee-details-header-info">
                      <div className="employee-details-avatar">
                        {employee.Name.charAt(0)}
                      </div>
                      <div>
                        {isEditing ? (
                          <input
                            name="Name"
                            value={editedEmployee.Name}
                            onChange={handleInputChange}
                            className="employee-details-edit-input"
                          />
                        ) : (
                          <h4>{employee.Name}</h4>
                        )}
                        {isEditing ? (
                          <input
                            name="Position"
                            value={editedEmployee.Position}
                            onChange={handleInputChange}
                            className="employee-details-edit-input"
                          />
                        ) : (
                          <p>{employee.Position}</p>
                        )}
                      </div>
                    </div>

                    <div className="employee-details-list">
                      <div className="employee-details-detail-row">
                        <span>Employee Code:</span>
                        <span>{employee.EmployeeCode || employee.employeeCode || 'N/A'}</span>
                      </div>
                      {/* 
                          <div className="employee-details-detail-row">
                            <span>Department:</span>
                            {isEditing ? (
                              <input
                                name="Department"
                                value={editedEmployee.Department}
                                onChange={handleInputChange}
                                className="employee-details-edit-input small"
                              />
                            ) : (
                              <span>{employee.Department}</span>
                            )}
                          </div>
                          */}
                      <div className="employee-details-detail-row">
                        <span>Email:</span>
                        {isEditing ? (
                          <input
                            name="Email"
                            value={editedEmployee.Email}
                            onChange={handleInputChange}
                            className="employee-details-edit-input medium"
                          />
                        ) : (
                          <span>{employee.Email}</span>
                        )}
                      </div>
                      <div className="employee-details-detail-row">
                        <span>Phone:</span>
                        {isEditing ? (
                          <input
                            name="Phone"
                            value={editedEmployee.Phone}
                            onChange={handleInputChange}
                            className="employee-details-edit-input medium"
                          />
                        ) : (
                          <span>{employee.Phone}</span>
                        )}
                      </div>
                      <div className="employee-details-detail-row">
                        <span>Hire Date:</span>
                        {isEditing ? (
                          <input
                            type="date"
                            name="HireDate"
                            value={editedEmployee.HireDate ? editedEmployee.HireDate.split('T')[0] : ''}
                            onChange={handleInputChange}
                            className="employee-details-edit-input small"
                          />
                        ) : (
                          <span>{employee.HireDate ?
                            (!isNaN(new Date(employee.HireDate).getTime()) ?
                              new Date(employee.HireDate).toLocaleDateString() :
                              String(employee.HireDate).split('T')[0])
                            : 'N/A'}</span>
                        )}
                      </div>
                      <div className="employee-details-detail-row">
                        <span>Street Address:</span>
                        {isEditing ? (
                          <input
                            name="StreetAddress"
                            value={editedEmployee.StreetAddress || ''}
                            onChange={handleInputChange}
                            className="employee-details-edit-input"
                            placeholder="Enter street address"
                          />
                        ) : (
                          <span>{employee.StreetAddress || 'N/A'}</span>
                        )}
                      </div>
                      <div className="employee-details-detail-row">
                        <span>Apartment, Suite, Unit, Building, or Floor:</span>
                        {isEditing ? (
                          <input
                            name="ApartmentSuite"
                            value={editedEmployee.ApartmentSuite || ''}
                            onChange={handleInputChange}
                            className="employee-details-edit-input"
                            placeholder="Enter apartment/suite (optional)"
                          />
                        ) : (
                          <span>{employee.ApartmentSuite || 'N/A'}</span>
                        )}
                      </div>
                      <div className="employee-details-detail-row">
                        <span>City:</span>
                        {isEditing ? (
                          <input
                            name="City"
                            value={editedEmployee.City || ''}
                            onChange={handleInputChange}
                            className="employee-details-edit-input"
                            placeholder="Enter city"
                          />
                        ) : (
                          <span>{employee.City || 'N/A'}</span>
                        )}
                      </div>
                      <div className="employee-details-detail-row">
                        <span>State:</span>
                        <CountryStateFieldForDetails
                          value={editedEmployee.State || ''}
                          onChange={(value) => setEditedEmployee(prev => ({ ...prev, State: value }))}
                          isEditing={isEditing}
                        />
                      </div>
                      <div className="employee-details-detail-row">
                        <span>Zip Code:</span>
                        {isEditing ? (
                          <input
                            name="ZipCode"
                            value={editedEmployee.ZipCode || ''}
                            onChange={handleInputChange}
                            className="employee-details-edit-input"
                            placeholder="Enter zip code"
                          />
                        ) : (
                          <span>{employee.ZipCode || 'N/A'}</span>
                        )}
                      </div>

                      {/* 
                          <div className="employee-details-detail-row">
                            <span>Employment Type:</span>
                            {isEditing ? (
                              <select
                                name="EmploymentType"
                                value={editedEmployee.EmploymentType}
                                onChange={handleInputChange}
                                className="employee-details-status-select"
                              >
                                <option value="Full-time">Full-time</option>
                                <option value="Part-time">Part-time</option>
                                <option value="Contract">Contract</option>
                              </select>
                            ) : (
                              <span>{employee.EmploymentType}</span>
                            )}
                          </div>
                          <div className="employee-details-detail-row">
                            <span>Status:</span>
                            {isEditing ? (
                              <select
                                name="Status"
                                value={editedEmployee.Status}
                                onChange={handleInputChange}
                                className="employee-details-status-select"
                              >
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                                <option value="On Leave">On Leave</option>
                              </select>
                            ) : (
                              <span className="employee-details-status-badge">{employee.Status}</span>
                            )}
                          </div>
                          */}

                      <div className="employee-details-detail-row">
                        <span>Supervisor:</span>
                        {isEditing ? (
                          <select
                            name="SupervisorEmployeeId"
                            value={editedEmployee.SupervisorEmployeeId || ''}
                            onChange={handleInputChange}
                            className="employee-details-edit-input"
                          >
                            <option value="">Select Supervisor</option>
                            {allEmployees.map(emp => (
                              <option key={emp.Id} value={emp.Id}>{emp.Name}</option>
                            ))}
                          </select>
                        ) : (
                          <span>{employee.SupervisorName || 'N/A'}</span>
                        )}
                      </div>

                      <div className="employee-details-detail-row">
                        <span>Backup Supervisor:</span>
                        {isEditing ? (
                          <select
                            name="BackupSupervisorEmployeeId"
                            value={editedEmployee.BackupSupervisorEmployeeId || ''}
                            onChange={handleInputChange}
                            className="employee-details-edit-input"
                          >
                            <option value="">Select Backup Supervisor</option>
                            {allEmployees.map(emp => (
                              <option key={emp.Id} value={emp.Id}>{emp.Name}</option>
                            ))}
                          </select>
                        ) : (
                          <span>{employee.BackupSupervisorName || 'N/A'}</span>
                        )}
                      </div>

                      <div className="employee-details-detail-row">
                        <span>Timesheet Required:</span>
                        {isEditing ? (
                          <input
                            type="checkbox"
                            name="TimesheetRequired"
                            checked={editedEmployee.TimesheetRequired}
                            onChange={(e) => setEditedEmployee(prev => ({ ...prev, TimesheetRequired: e.target.checked }))}
                          />
                        ) : (
                          <span>{employee.TimesheetRequired ? 'Yes' : 'No'}</span>
                        )}
                      </div>

                      <div className="employee-details-detail-row">
                        <span>Mailing Address:</span>
                        {isEditing ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <input
                                type="checkbox"
                                id="useMailingAddressDetail"
                                checked={useMailingAddress}
                                onChange={(e) => setUseMailingAddress(e.target.checked)}
                              />
                              <label htmlFor="useMailingAddressDetail" style={{ fontSize: '12px' }}>Different from Home</label>
                            </div>
                            {useMailingAddress && (
                              <>
                                <input
                                  name="MailingStreetAddress"
                                  value={editedEmployee.MailingStreetAddress || ''}
                                  onChange={handleInputChange}
                                  className="employee-details-edit-input"
                                  placeholder="Street"
                                />
                                <input
                                  name="MailingCity"
                                  value={editedEmployee.MailingCity || ''}
                                  onChange={handleInputChange}
                                  className="employee-details-edit-input"
                                  placeholder="City"
                                />
                                <input
                                  name="MailingZipCode"
                                  value={editedEmployee.MailingZipCode || ''}
                                  onChange={handleInputChange}
                                  className="employee-details-edit-input"
                                  placeholder="Zip Code"
                                />
                              </>
                            )}
                          </div>
                        ) : (
                          <span>{employee.MailingStreetAddress ? `${employee.MailingStreetAddress}, ${employee.MailingCity} ${employee.MailingZipCode}` : 'Same as Home'}</span>
                        )}
                      </div>

                      <div className="employee-details-detail-row">
                        <span>Emergency Contact:</span>
                        {isEditing ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
                            <input
                              name="EmergencyContactName"
                              value={editedEmployee.EmergencyContactName || ''}
                              onChange={handleInputChange}
                              className="employee-details-edit-input"
                              placeholder="Name"
                            />
                            <input
                              name="EmergencyContactPhone"
                              value={editedEmployee.EmergencyContactPhone || ''}
                              onChange={handleInputChange}
                              className="employee-details-edit-input"
                              placeholder="Phone"
                            />
                          </div>
                        ) : (
                          <span>{employee.EmergencyContactName ? `${employee.EmergencyContactName} (${employee.EmergencyContactPhone})` : 'N/A'}</span>
                        )}
                      </div>

                      {/* Timesheet Editing Permission Row - Matching first image */}
                      <div className="employee-details-detail-row" style={{ marginTop: '12px', borderTop: '1px solid #f3f4f6', paddingTop: '12px' }}>
                        <span>Timesheet Editing:</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            color: permissionStatus.allowEditing ? '#10b981' : '#ef4444',
                            fontSize: '14px',
                            fontWeight: '500'
                          }}>
                            {permissionStatus.allowEditing ? (
                              <>
                                <CheckCircle2 size={16} />
                                <span>Allowed</span>
                              </>
                            ) : (
                              <>
                                <XCircle size={16} />
                                <span>Locked</span>
                              </>
                            )}
                          </div>

                          <button
                            onClick={() => permissionStatus.allowEditing
                              ? handleRevokeEditingPermission(employee.EmployeeId)
                              : handleGrantEditingPermission(employee.EmployeeId)
                            }
                            style={{
                              backgroundColor: permissionStatus.allowEditing ? '#6b7280' : '#10b981',
                              color: 'white',
                              border: 'none',
                              padding: '4px 12px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: '600',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            {permissionStatus.allowEditing ? 'Revoke' : 'Allow'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN - Payroll Info Panel */}
              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '8px',
                padding: '20px',
                border: '1px solid #e9ecef',
                height: 'fit-content',
                position: 'sticky',
                top: '5px'
              }}>
                {/* Header with Title and Buttons */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    margin: 0,
                    color: '#1f2937'
                  }}>
                    Payroll Info
                  </h3>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    {isEditingPayroll ? (
                      <>
                        <button
                          onClick={handleSavePayrollInfo}
                          style={{
                            backgroundColor: '#188858',
                            color: 'white',
                            border: 'none',
                            padding: '6px 14px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          <Save size={14} />
                          Save
                        </button>
                        <button
                          onClick={handleCancelPayrollEdit}
                          style={{
                            backgroundColor: '#6b7280',
                            color: 'white',
                            border: 'none',
                            padding: '6px 14px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          <X size={14} />
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setIsEditingPayroll(true)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#188858',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '500',
                          padding: '0',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Edit3 size={14} />
                        Edit
                      </button>
                    )}
                  </div>
                </div>

                {/* Pay Info Section */}
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    marginBottom: '12px',
                    color: '#374151'
                  }}>
                    Pay info
                  </h4>

                  {/* Pay Type */}
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{
                      display: 'block',
                      marginBottom: '6px',
                      fontSize: '13px',
                      fontWeight: '500',
                      color: '#1f2937'
                    }}>
                      Pay type<span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <select
                      name="payType"
                      value={payrollInfo.payType}
                      onChange={handlePayrollInputChange}
                      disabled={!isEditingPayroll}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '13px',
                        backgroundColor: isEditingPayroll ? 'white' : '#f9fafb',
                        cursor: isEditingPayroll ? 'pointer' : 'not-allowed',
                        color: '#1f2937'
                      }}
                    >
                      <option value="Hourly">Hourly</option>
                      <option value="Salary">Salary</option>
                      <option value="Contract">Contract</option>
                    </select>
                  </div>

                  {/* Basis of Pay */}
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{
                      display: 'block',
                      marginBottom: '6px',
                      fontSize: '13px',
                      fontWeight: '500',
                      color: '#1f2937'
                    }}>
                      Basis of pay
                    </label>
                    <select
                      name="basisOfPay"
                      value={payrollInfo.basisOfPay}
                      onChange={handlePayrollInputChange}
                      disabled={!isEditingPayroll}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '13px',
                        backgroundColor: isEditingPayroll ? 'white' : '#f9fafb',
                        cursor: isEditingPayroll ? 'pointer' : 'not-allowed',
                        color: '#1f2937'
                      }}
                    >
                      <option value="Same as Pay Type">Same as Pay Type</option>
                      <option value="Custom">Custom</option>
                    </select>
                  </div>

                  {/* Pay Schedule */}
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{
                      display: 'block',
                      marginBottom: '6px',
                      fontSize: '13px',
                      fontWeight: '500',
                      color: '#1f2937'
                    }}>
                      Pay schedule<span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <select
                      name="paySchedule"
                      value={payrollInfo.paySchedule}
                      onChange={handlePayrollInputChange}
                      disabled={!isEditingPayroll}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '13px',
                        backgroundColor: isEditingPayroll ? 'white' : '#f9fafb',
                        cursor: isEditingPayroll ? 'pointer' : 'not-allowed',
                        color: '#1f2937'
                      }}
                    >
                      <option value="Monthly">Monthly</option>
                      <option value="Semi-Monthly">Semi-Monthly</option>
                      <option value="Bi-Weekly">Bi-Weekly</option>
                      <option value="Weekly">Weekly</option>
                    </select>
                  </div>

                  {/* Employment Type */}
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{
                      display: 'block',
                      marginBottom: '6px',
                      fontSize: '13px',
                      fontWeight: '500',
                      color: '#1f2937'
                    }}>
                      Employment type
                    </label>
                    <select
                      name="employmentType"
                      value={payrollInfo.employmentType || 'Full-time'}
                      onChange={handlePayrollInputChange}
                      disabled={!isEditingPayroll}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '13px',
                        backgroundColor: isEditingPayroll ? 'white' : '#f9fafb',
                        cursor: isEditingPayroll ? 'pointer' : 'not-allowed',
                        color: '#1f2937'
                      }}
                    >
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                    </select>
                  </div>

                  {/* Seasonal Employee */}
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{
                      display: 'block',
                      marginBottom: '6px',
                      fontSize: '13px',
                      fontWeight: '500',
                      color: '#1f2937'
                    }}>
                      Seasonal employee
                    </label>
                    <select
                      name="seasonalEmployee"
                      value={payrollInfo.seasonalEmployee}
                      onChange={handlePayrollInputChange}
                      disabled={!isEditingPayroll}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '13px',
                        backgroundColor: isEditingPayroll ? 'white' : '#f9fafb',
                        cursor: isEditingPayroll ? 'pointer' : 'not-allowed',
                        color: '#1f2937'
                      }}
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>

                  {/* Owner Officer */}
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{
                      display: 'block',
                      marginBottom: '6px',
                      fontSize: '13px',
                      fontWeight: '500',
                      color: '#1f2937'
                    }}>
                      Owner Officer
                    </label>
                    <select
                      name="ownerOfficer"
                      value={payrollInfo.ownerOfficer}
                      onChange={handlePayrollInputChange}
                      disabled={!isEditingPayroll}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '13px',
                        backgroundColor: isEditingPayroll ? 'white' : '#f9fafb',
                        cursor: isEditingPayroll ? 'pointer' : 'not-allowed',
                        color: '#1f2937'
                      }}
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>
                </div>

                {/* Divider */}
                <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '16px 0' }} />

                {/* Pay Rate Section */}
                <div>
                  <h4 style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    marginBottom: '12px',
                    color: '#374151'
                  }}>
                    Pay rate
                  </h4>

                  {/* Semi-Monthly Salary */}
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{
                      display: 'block',
                      marginBottom: '6px',
                      fontSize: '13px',
                      fontWeight: '500',
                      color: '#1f2937'
                    }}>
                      Semi-Monthly salary<span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{
                        padding: '8px 10px',
                        backgroundColor: '#f3f4f6',
                        border: '1px solid #d1d5db',
                        borderRight: 'none',
                        borderRadius: '6px 0 0 6px',
                        color: '#6b7280',
                        fontWeight: '500',
                        fontSize: '13px'
                      }}>
                        $
                      </span>
                      <input
                        type="number"
                        name="semiMonthlySalary"
                        placeholder="0.00"
                        value={payrollInfo.semiMonthlySalary}
                        onChange={handlePayrollInputChange}
                        disabled={!isEditingPayroll}
                        step="0.01"
                        style={{
                          flex: 1,
                          padding: '8px 10px',
                          border: '1px solid #d1d5db',
                          borderLeft: 'none',
                          borderRadius: '0 6px 6px 0',
                          fontSize: '13px',
                          backgroundColor: isEditingPayroll ? 'white' : '#f9fafb',
                          cursor: isEditingPayroll ? 'auto' : 'not-allowed',
                          color: '#1f2937'
                        }}
                      />
                    </div>
                  </div>

                  {/* Hourly Rate */}
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '6px',
                      fontSize: '13px',
                      fontWeight: '500',
                      color: '#1f2937'
                    }}>
                      Hourly rate
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{
                        padding: '8px 10px',
                        backgroundColor: '#f3f4f6',
                        border: '1px solid #d1d5db',
                        borderRight: 'none',
                        borderRadius: '6px 0 0 6px',
                        color: '#6b7280',
                        fontWeight: '500',
                        fontSize: '13px'
                      }}>
                        $
                      </span>
                      <input
                        type="number"
                        name="hourlyRate"
                        placeholder="0.00"
                        value={payrollInfo.hourlyRate}
                        onChange={handlePayrollInputChange}
                        disabled={!isEditingPayroll}
                        step="0.01"
                        style={{
                          flex: 1,
                          padding: '8px 10px',
                          border: '1px solid #d1d5db',
                          borderLeft: 'none',
                          borderRadius: '0 6px 6px 0',
                          fontSize: '13px',
                          backgroundColor: isEditingPayroll ? 'white' : '#f9fafb',
                          cursor: isEditingPayroll ? 'auto' : 'not-allowed',
                          color: '#1f2937'
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Internal Timesheets View */}
        {activeView === 'internalTimesheets' && (
          <div className="employee-details-content-section">
            <div className="employee-details-card">
              <h3>Timesheet Overview - {employee.Name}</h3>
              <div className="employee-details-stats-grid">
                <div className="employee-details-stat-card">
                  <span className="employee-details-stat-label">Pending</span>
                  <span className="employee-details-stat-value">{stats.timesheets?.pending || 0}</span>
                </div>
                <div className="employee-details-stat-card">
                  <span className="employee-details-stat-label">Approved</span>
                  <span className="employee-details-stat-value">{stats.timesheets?.approved || 0}</span>
                </div>
                <div className="employee-details-stat-card">
                  <span className="employee-details-stat-label">Rejected</span>
                  <span className="employee-details-stat-value">{stats.timesheets?.rejected || 0}</span>
                </div>
                <div className="employee-details-stat-card">
                  <span className="employee-details-stat-label">Total</span>
                  <span className="employee-details-stat-value">{stats.timesheets?.total || 0}</span>
                </div>
              </div>
            </div>

            <div className="employee-details-card">
              <div className="employee-details-card-header">
                <h3>Timesheets</h3>


                <div className="employee-details-filter-controls">
                  <div className="employee-details-search-container">
                    <Search size={18} />
                    <input
                      type="text"
                      placeholder="Search timesheets..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>

              {filteredTimesheets.length > 0 ? (
                <div className="employee-details-timesheet-list">
                  {filteredTimesheets.map((timesheet) => (
                    <div
                      key={timesheet.Id || timesheet.id}
                      className="employee-details-timesheet-item"
                      onClick={() => handleViewTimesheetTasks(timesheet.Id || timesheet.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="employee-details-timesheet-header">
                        <div>
                          <h4>Period: {new Date(timesheet.PeriodStart).toLocaleDateString()} - {new Date(timesheet.PeriodEnd).toLocaleDateString()}</h4>
                          <p>Submitted: {new Date(timesheet.SubmittedDate || timesheet.CreatedAt).toLocaleDateString()}</p>
                        </div>

                        <div className="employee-details-timesheet-status">
                          <span className={`employee-details-status-badge ${(timesheet.Status || timesheet.status)?.toLowerCase()}`}>
                            {timesheet.Status || timesheet.status}
                          </span>

                          <div className="employee-details-hours-display">
                            <Clock size={16} />
                            {timesheet.totalHours || timesheet.TotalHours || 0} hrs
                          </div>
                        </div>
                      </div>

                      {(timesheet.Notes || timesheet.notes) && (
                        <div className="employee-details-timesheet-notes">
                          <p><strong>Notes:</strong> {timesheet.Notes || timesheet.notes}</p>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="employee-details-timesheet-actions" style={{
                        display: 'flex',
                        gap: '8px',
                        marginTop: '12px',
                        paddingTop: '12px',
                        borderTop: '1px solid #e5e7eb',
                        flexWrap: 'wrap',
                        alignItems: 'center'
                      }}>
                        {/* View Tasks Button - Always Visible */}
                        <button
                          className="employee-details-action-btn primary"
                          onClick={(e) => { e.stopPropagation(); handleViewTimesheetTasks(timesheet.Id || timesheet.id); }}
                          title="View Tasks"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 16px',
                            backgroundColor: '#188858',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#16a34a'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#188858'}
                        >
                          <Eye size={16} />
                          View Tasks
                        </button>

                        {/* Approve Button - Only show for Pending timesheets */}
                        {(['pending', 'submitted'].includes((timesheet.status || timesheet.Status || '').toLowerCase())) && (
                          <button
                            className="employee-details-action-btn success"
                            onClick={(e) => { e.stopPropagation(); handleApproveInternalTimesheet(timesheet.Id || timesheet.id); }}
                            title="Approve"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '8px 16px',
                              backgroundColor: '#10b981',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '14px',
                              fontWeight: '500',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#059669'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#10b981'}
                          >
                            <CheckCircle2 size={16} />
                            Approve
                          </button>
                        )}

                        {/* Reject Button - Only show for Pending timesheets */}
                        {(['pending', 'submitted'].includes((timesheet.status || timesheet.Status || '').toLowerCase())) && (
                          <button
                            className="employee-details-action-btn warning"
                            onClick={(e) => { e.stopPropagation(); handleRejectInternalTimesheet(timesheet.Id || timesheet.id); }}
                            title="Reject"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '8px 16px',
                              backgroundColor: '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '14px',
                              fontWeight: '500',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
                          >
                            <XCircle size={16} />
                            Reject
                          </button>
                        )}

                        {/* Delete Button - Show for all statuses, aligned to the right */}
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteInternalTimesheet(timesheet.Id || timesheet.id); }}
                          className="employee-details-action-btn danger"
                          title="Delete"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 16px',
                            backgroundColor: '#6b7280',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500',
                            marginLeft: 'auto',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4b5563'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#6b7280'}
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="employee-details-empty-state">
                  <FileText size={48} />
                  <p>No timesheets found for this employee.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* External Timesheets View */}
        {/* External Timesheets View */}
        {activeView === 'externalTimesheets' && !shouldHideTabs(company) && (
          <div className="employee-details-content-section">
            <div className="employee-details-card">
              <div className="employee-details-card-header">
                <h3>External Timesheets - {employee.Name}</h3>
              </div>

              {/* Filter and Search Controls */}
              <div className="employee-details-filter-controls" style={{
                display: 'flex',
                gap: '12px',
                marginBottom: '20px',
                padding: '16px',
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                flexWrap: 'wrap',
                alignItems: 'center'
              }}>
                {/* Search Input */}
                <div className="employee-details-search-container" style={{
                  display: 'flex',
                  alignItems: 'center',
                  flex: '1 1 250px',
                  minWidth: '250px',
                  gap: '8px',
                  padding: '8px 12px',
                  backgroundColor: 'white',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px'
                }}>
                  <Search size={18} style={{ color: '#6b7280' }} />
                  <input
                    type="text"
                    placeholder="Search by file name or period..."
                    value={externalSearchTerm}
                    onChange={(e) => setExternalSearchTerm(e.target.value)}
                    style={{
                      border: 'none',
                      outline: 'none',
                      flex: 1,
                      fontSize: '14px',
                      backgroundColor: 'transparent',
                      color: '#1f2937'
                    }}
                  />
                </div>

                {/* Status Filter */}
                <select
                  value={externalFilterStatus}
                  onChange={(e) => setExternalFilterStatus(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    backgroundColor: 'white',
                    fontSize: '14px',
                    cursor: 'pointer',
                    color: '#1f2937',
                    fontWeight: '500',
                    minWidth: '150px'
                  }}
                >
                  <option value="all">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>

                {/* Period Filter */}
                <select
                  value={externalFilterPeriod}
                  onChange={(e) => setExternalFilterPeriod(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    backgroundColor: 'white',
                    fontSize: '14px',
                    cursor: 'pointer',
                    color: '#1f2937',
                    fontWeight: '500',
                    minWidth: '150px'
                  }}
                >
                  <option value="all">All Time</option>
                  <option value="1">Last 1 Month</option>
                  <option value="3">Last 3 Months</option>
                  <option value="6">Last 6 Months</option>
                  <option value="12">Last 12 Months</option>
                </select>

                {/* Clear Filters Button */}
                {(externalSearchTerm || externalFilterStatus !== 'all' || externalFilterPeriod !== 'all') && (
                  <button
                    onClick={() => {
                      setExternalSearchTerm('');
                      setExternalFilterStatus('all');
                      setExternalFilterPeriod('all');
                    }}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      backgroundColor: '#fff3cd',
                      fontSize: '14px',
                      cursor: 'pointer',
                      color: '#856404',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <X size={16} />
                    Clear Filters
                  </button>
                )}
              </div>

              {/* Results Info */}
              <div style={{
                marginBottom: '16px',
                padding: '0 16px',
                fontSize: '14px',
                color: '#6b7280'
              }}>
                Showing <strong>{filteredExternalTimesheets.length}</strong> of <strong>{externalTimesheets.length}</strong> timesheets
              </div>

              {filteredExternalTimesheets && filteredExternalTimesheets.length > 0 ? (
                <div className="employee-details-file-list">
                  <div className="employee-details-file-list-header">
                    <div>File Name</div>
                    <div>Upload Date</div>
                    <div>Period</div>
                    <div>Status</div>
                    <div>Actions</div>
                  </div>

                  {filteredExternalTimesheets.map((timesheet) => {
                    const FileIcon = getFileIcon(timesheet.FileName || 'file.pdf');
                    return (
                      <div key={timesheet.Id} className="employee-details-file-list-item">
                        <div className="employee-details-file-info">
                          <FileIcon size={18} />
                          <span>{timesheet.FileName || 'Unknown File'}</span>
                        </div>
                        <div>{timesheet.UploadDate ? new Date(timesheet.UploadDate).toLocaleDateString() : 'N/A'}</div>
                        <div>{timesheet.Period || 'N/A'}</div>
                        <div>
                          <span className={`employee-details-status-badge ${(timesheet.Status || 'Pending').toLowerCase()}`}>
                            {timesheet.Status || 'Pending'}
                          </span>
                        </div>
                        <div className="employee-details-file-actions">
                          <button
                            className="employee-details-icon-btn"
                            onClick={() => handleDownloadExternalTimesheet(timesheet.Id, timesheet.FileName)}
                            title="Download"
                          >
                            <Download size={16} />
                          </button>

                          {(['pending', 'submitted'].includes((timesheet.Status || '').toLowerCase()) || !timesheet.Status) && (
                            <>
                              <button
                                className="employee-details-icon-btn success"
                                onClick={() => handleApproveExternalTimesheet(timesheet.Id)}
                                title="Approve"
                              >
                                <CheckCircle2 size={16} />
                              </button>
                              <button
                                className="employee-details-icon-btn warning"
                                onClick={() => handleRejectExternalTimesheet(timesheet.Id)}
                                title="Reject"
                              >
                                <XCircle size={16} />
                              </button>
                            </>
                          )}

                          <button
                            onClick={() => deleteExternalTimesheet(timesheet.Id)}
                            className="employee-details-icon-btn danger"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="employee-details-empty-state">
                  <FileSpreadsheet size={48} />
                  <p>
                    {externalTimesheets.length === 0
                      ? 'No external timesheets found for this employee.'
                      : 'No timesheets match your filter criteria.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Statement View */}
        {activeView === 'statement' && !shouldHideTabs(company) && (
          <div className="employee-details-content-section">
            <div className="employee-details-card">
              <div className="employee-details-card-header">
                <h3>Payroll Statement - {employee.Name}</h3>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {/* FILE UPLOAD BUTTON */}
                  <div style={{ position: 'relative' }}>
                    <label
                      htmlFor="statement-file-upload"
                      className="employee-details-btn employee-details-btn-primary"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: statementFileUpload.isUploading ? 'not-allowed' : 'pointer',
                        opacity: statementFileUpload.isUploading ? 0.6 : 1,
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <Upload size={16} />
                      {statementFileUpload.isUploading
                        ? `Uploading... ${statementFileUpload.progress}%`
                        : 'Import from File'}
                    </label>
                    <input
                      type="file"
                      id="statement-file-upload"
                      style={{ display: 'none' }}
                      onChange={handleStatementFileUpload}
                      accept=".csv,.xlsx,.xls"
                      disabled={statementFileUpload.isUploading}
                    />
                  </div>

                  {/* PROGRESS BAR */}
                  {statementFileUpload.isUploading && (
                    <div style={{
                      width: '200px',
                      height: '6px',
                      backgroundColor: '#e5e7eb',
                      borderRadius: '3px',
                      overflow: 'hidden',
                      alignSelf: 'center'
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${statementFileUpload.progress}%`,
                        backgroundColor: '#10b981',
                        transition: 'width 0.3s ease'
                      }}></div>
                    </div>
                  )}

                  {/* PAY STRUCTURE BUTTON */}
                  <button
                    onClick={handleOpenPayStructure}
                    className="employee-details-btn employee-details-btn-primary"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <BarChart3 size={16} />
                    Pay Structure
                  </button>

                  {/* ADD NEW ROW BUTTON */}
                  <button
                    onClick={handleAddNewRow}
                    className={`employee-details-btn ${isAddingNewRow ? 'employee-details-btn-success' : 'employee-details-btn-primary'}`}
                    disabled={statementFileUpload.isUploading}
                  >
                    <Plus size={16} />
                    {isAddingNewRow ? 'Save New Row' : 'Add New Row'}
                  </button>
                </div>
              </div>

              {/* FILE UPLOAD INFO MESSAGE */}
              {!statementFileUpload.isUploading && (
                <div style={{
                  backgroundColor: '#f0f9ff',
                  border: '1px solid #e0f2fe',
                  borderRadius: '6px',
                  padding: '12px 16px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px'
                }}>
                  <AlertCircle size={18} style={{ color: '#0369a1', flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ fontSize: '13px', color: '#0369a1', lineHeight: '1.5' }}>
                    <strong>📄 Import from File:</strong> Upload a CSV or Excel file to automatically populate statement entries.
                    <br />
                    <small>Supported columns: Date, Description, Hours, Pay Rate, Credit, Debit, Balance</small>
                  </div>
                </div>
              )}

              {/* SEARCH & DATE FILTER CONTROLS */}
              <div className="employee-details-filter-controls" style={{
                display: 'flex',
                gap: '12px',
                marginBottom: '20px',
                padding: '16px',
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                flexWrap: 'wrap',
                alignItems: 'center'
              }}>
                {/* Search Input */}
                <div className="employee-details-search-container" style={{
                  display: 'flex',
                  alignItems: 'center',
                  flex: '1 1 250px',
                  minWidth: '250px',
                  gap: '8px',
                  padding: '8px 12px',
                  backgroundColor: 'white',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px'
                }}>
                  <Search size={18} style={{ color: '#6b7280' }} />
                  <input
                    type="text"
                    placeholder="Search by description or period..."
                    value={statementSearchTerm}
                    onChange={(e) => setStatementSearchTerm(e.target.value)}
                    style={{
                      border: 'none',
                      outline: 'none',
                      flex: 1,
                      fontSize: '14px',
                      backgroundColor: 'transparent',
                      color: '#1f2937'
                    }}
                  />
                </div>

                {/* Start Date Filter */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  minWidth: '180px'
                }}>
                  <label style={{
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#6b7280'
                  }}>
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={statementFilterStartDate}
                    onChange={(e) => setStatementFilterStartDate(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      backgroundColor: 'white',
                      fontSize: '14px',
                      cursor: 'pointer',
                      color: '#1f2937'
                    }}
                  />
                </div>

                {/* End Date Filter */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  minWidth: '180px'
                }}>
                  <label style={{
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#6b7280'
                  }}>
                    End Date
                  </label>
                  <input
                    type="date"
                    value={statementFilterEndDate}
                    onChange={(e) => setStatementFilterEndDate(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      backgroundColor: 'white',
                      fontSize: '14px',
                      cursor: 'pointer',
                      color: '#1f2937'
                    }}
                  />
                </div>

                {/* Clear Filters Button */}
                {(statementSearchTerm || statementFilterStartDate || statementFilterEndDate) && (
                  <button
                    onClick={() => {
                      setStatementSearchTerm('');
                      setStatementFilterStartDate('');
                      setStatementFilterEndDate('');
                    }}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      backgroundColor: '#fff3cd',
                      fontSize: '14px',
                      cursor: 'pointer',
                      color: '#856404',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <X size={16} />
                    Clear Filters
                  </button>
                )}
              </div>

              {/* Results Info */}
              <div style={{
                marginBottom: '16px',
                padding: '0 16px',
                fontSize: '14px',
                color: '#6b7280'
              }}>
                Showing <strong>{filteredStatements.length}</strong> of <strong>{statements.length}</strong> statements
              </div>

              <div className="employee-details-statement-info">
                <div>
                  <span className="employee-details-info-label">Pay Frequency:</span>
                  <span>Monthly</span>
                </div>
                <div>
                  <span className="employee-details-info-label">Employee:</span>
                  <span>{employee.Name}</span>
                </div>
              </div>

              <div className="employee-details-table-container">
                <table className="employee-details-statement-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Ref</th>
                      <th>Description</th>
                      <th className="text-right">Hours</th>
                      <th className="text-right">Pay Rate</th>
                      <th className="text-right">Credit</th>
                      <th className="text-right">Debit</th>
                      <th className="text-right">Balance</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isAddingNewRow && (
                      <tr className="employee-details-new-row">
                        <td>
                          <input
                            type="date"
                            name="date"
                            value={newStatementRow.date}
                            onChange={handleNewRowInputChange}
                            placeholder="MM/DD/YYYY"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            name="retention"
                            value={newStatementRow.retention}
                            onChange={handleNewRowInputChange}
                            placeholder="Retention"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            name="description"
                            value={newStatementRow.description}
                            onChange={handleNewRowInputChange}
                            placeholder="Description"
                          />
                        </td>
                        <td className="text-right">
                          <input
                            type="number"
                            name="hours"
                            value={newStatementRow.hours}
                            onChange={handleNewRowInputChange}
                            placeholder="Hours"
                            step="0.01"
                          />
                        </td>
                        <td className="text-right">
                          <input
                            type="number"
                            name="payRate"
                            value={newStatementRow.payRate}
                            onChange={handleNewRowInputChange}
                            placeholder="Rate"
                            step="0.01"
                          />
                        </td>
                        <td className="text-right">
                          <input
                            type="text"
                            name="credit"
                            value={formatCurrency(newStatementRow.credit)}
                            onChange={handleNewRowInputChange}
                            placeholder="Credit"
                            disabled
                          />
                        </td>
                        <td className="text-right">
                          <input
                            type="number"
                            name="debit"
                            value={newStatementRow.debit}
                            onChange={handleNewRowInputChange}
                            placeholder="Debit"
                            step="0.01"
                          />
                        </td>
                        <td className="text-right">
                          <input
                            type="text"
                            name="balance"
                            value={formatCurrency(newStatementRow.balance)}
                            onChange={handleNewRowInputChange}
                            placeholder="Balance"
                            disabled
                          />
                        </td>
                        <td className="text-center">
                          <div className="employee-details-action-buttons">
                            <button
                              onClick={handleAddNewRow}
                              className="employee-details-icon-btn success"
                            >
                              <Save size={16} />
                            </button>
                            <button
                              onClick={handleCancelNewRow}
                              className="employee-details-icon-btn danger"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}

                    {filteredStatements.map((statement) => (
                      <tr key={statement.Id} className={editingStatementId === statement.Id ? 'editing-row' : ''}>
                        <td>
                          {editingStatementId === statement.Id ? (
                            <input
                              type="date"
                              name="CheckDate"
                              value={editingStatement.CheckDate}
                              onChange={handleEditStatementInputChange}
                              style={{ width: '100%', padding: '4px' }}
                            />
                          ) : (
                            new Date(statement.CheckDate).toLocaleDateString()
                          )}
                        </td>
                        <td>
                          {editingStatementId === statement.Id ? (
                            <input
                              type="text"
                              name="Period"
                              value={editingStatement.Period}
                              onChange={handleEditStatementInputChange}
                              style={{ width: '100%', padding: '4px' }}
                            />
                          ) : (
                            statement.Period
                          )}
                        </td>
                        <td>
                          {editingStatementId === statement.Id ? (
                            <input
                              type="text"
                              name="Description"
                              value={editingStatement.Description}
                              onChange={handleEditStatementInputChange}
                              style={{ width: '100%', padding: '4px' }}
                            />
                          ) : (
                            statement.Description
                          )}
                        </td>
                        <td className="text-right">
                          {editingStatementId === statement.Id ? (
                            <input
                              type="number"
                              name="Hours"
                              value={editingStatement.Hours}
                              onChange={handleEditStatementInputChange}
                              step="0.01"
                              style={{ width: '100%', padding: '4px', textAlign: 'right' }}
                            />
                          ) : (
                            statement.Hours || 0
                          )}
                        </td>
                        <td className="text-right">
                          {editingStatementId === statement.Id ? (
                            <input
                              type="number"
                              name="PayRate"
                              value={editingStatement.PayRate}
                              onChange={handleEditStatementInputChange}
                              step="0.01"
                              style={{ width: '100%', padding: '4px', textAlign: 'right' }}
                            />
                          ) : (
                            statement.PayRate || 0
                          )}
                        </td>
                        <td className="text-right credit">
                          {editingStatementId === statement.Id ? (
                            <input
                              type="number"
                              name="Credit"
                              value={editingStatement.Credit}
                              onChange={handleEditStatementInputChange}
                              step="0.01"
                              disabled
                              style={{ width: '100%', padding: '4px', textAlign: 'right' }}
                            />
                          ) : (
                            statement.Credit || ''
                          )}
                        </td>
                        <td className="text-right debit">
                          {editingStatementId === statement.Id ? (
                            <input
                              type="number"
                              name="Debit"
                              value={editingStatement.Debit}
                              onChange={handleEditStatementInputChange}
                              step="0.01"
                              style={{ width: '100%', padding: '4px', textAlign: 'right' }}
                            />
                          ) : (
                            statement.Debit || ''
                          )}
                        </td>
                        <td className="text-right balance">
                          {editingStatementId === statement.Id ? (
                            <input
                              type="number"
                              name="Balance"
                              value={editingStatement.Balance}
                              onChange={handleEditStatementInputChange}
                              step="0.01"
                              disabled
                              style={{ width: '100%', padding: '4px', textAlign: 'right' }}
                            />
                          ) : (
                            statement.Balance || ''
                          )}
                        </td>
                        <td className="text-center">
                          <div className="employee-details-action-buttons" style={{ gap: '4px' }}>
                            {editingStatementId === statement.Id ? (
                              <>
                                <button
                                  onClick={() => handleSaveEditStatement(statement.Id)}
                                  className="employee-details-icon-btn success"
                                  title="Save"
                                >
                                  <Save size={16} />
                                </button>
                                <button
                                  onClick={handleCancelEditStatement}
                                  className="employee-details-icon-btn danger"
                                  title="Cancel"
                                >
                                  <X size={16} />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleEditStatement(statement)}
                                  className="employee-details-icon-btn primary"
                                  title="Edit"
                                >
                                  <Edit3 size={16} />
                                </button>
                                <button
                                  onClick={() => deleteStatement(statement.Id)}
                                  className="employee-details-icon-btn danger"
                                  title="Delete"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Report View */}
        {activeView === 'report' && (
          <div className="employee-details-content-section">
            <div className="employee-details-card">
              <div className="employee-details-card-header">
                <h3>Reports - {employee.Name}</h3>

                <div>
                  <label htmlFor="report-upload" className="employee-details-btn employee-details-btn-primary">
                    <Plus size={16} />
                    Upload Report
                  </label>
                  <input
                    type="file"
                    id="report-upload"
                    style={{ display: 'none' }}
                    onChange={handleReportUpload}
                  />
                </div>
              </div>

              {reports.length > 0 ? (
                <div className="employee-details-file-list">
                  <div className="employee-details-file-list-header">
                    <div>File Name</div>
                    <div>Upload Date</div>
                    <div>Type</div>
                    <div>Description</div>
                    <div>Actions</div>
                  </div>

                  {reports.map((report) => {
                    const FileIcon = getFileIcon(report.FileName);
                    return (
                      <div key={report.Id} className="employee-details-file-list-item">
                        <div className="employee-details-file-info">
                          <FileIcon size={18} />
                          <span>{report.FileName}</span>
                        </div>
                        <div>{new Date(report.UploadDate).toLocaleDateString()}</div>
                        <div>{report.Type}</div>
                        <div>{report.Description}</div>
                        <div className="employee-details-file-actions">
                          <button className="employee-details-icon-btn">
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => deleteReport(report.Id)}
                            className="employee-details-icon-btn danger"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="employee-details-empty-state">
                  <FileText size={48} />
                  <p>No reports found for this employee.</p>
                </div>
              )}
            </div>
          </div>
        )}
        {showPayStructureModal && (
          <div className="pay-structure-modal">
            <div className="pay-structure-modal-content">
              {/* Header */}
              <div className="pay-structure-modal-header">
                <h2 style={{ margin: 0, color: '#1f2937', fontSize: '24px', fontWeight: '600' }}>
                  Pay Structure - {employee?.Name}
                </h2>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  {isEditingPayStructure ? (
                    <>
                      <button
                        onClick={handleSavePayStructure}
                        style={{
                          backgroundColor: '#188858',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '500'
                        }}
                      >
                        <Save size={16} style={{ marginRight: '8px' }} />
                        Save
                      </button>
                      <button
                        onClick={handleCancelEditPayStructure}
                        style={{
                          backgroundColor: '#6b7280',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '500'
                        }}
                      >
                        <X size={16} style={{ marginRight: '8px' }} />
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleEditPayStructure}
                      style={{
                        backgroundColor: '#188858',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    >
                      <Edit3 size={16} style={{ marginRight: '8px' }} />
                      Edit
                    </button>
                  )}
                  <button
                    onClick={handleClosePayStructure}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '24px',
                      cursor: 'pointer',
                      color: '#6b7280',
                      padding: '0',
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Body - Scrollable Content */}
              <div className="pay-structure-modal-body">
                {/* Pay Structure Form */}
                <div style={{ marginBottom: '32px' }}>
                  <h3 style={{ marginBottom: '16px', color: '#374151' }}>Basic Configuration</h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '16px',
                    marginBottom: '24px'
                  }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                        LCA Amount
                      </label>
                      {isEditingPayStructure ? (
                        <input
                          type="number"
                          name="lca"
                          value={payStructureData.lca}
                          onChange={handlePayStructureInputChange}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '14px'
                          }}
                        />
                      ) : (
                        <div style={{
                          padding: '8px 12px',
                          backgroundColor: '#f9fafb',
                          borderRadius: '6px',
                          border: '1px solid #e5e7eb'
                        }}>
                          ${payStructureData.lca.toLocaleString()}
                        </div>
                      )}
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                        As per LCA Rate
                      </label>
                      <div style={{
                        padding: '8px 12px',
                        backgroundColor: '#f0f9ff',
                        borderRadius: '6px',
                        border: '1px solid #e0f2fe',
                        color: '#0369a1',
                        fontWeight: '600'
                      }}>
                        ${calculatePayStructureValues().asPerLCARate}
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                        Vendor Rate
                      </label>
                      {isEditingPayStructure ? (
                        <input
                          type="number"
                          name="vendorRate"
                          value={payStructureData.vendorRate}
                          onChange={handlePayStructureInputChange}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '14px'
                          }}
                        />
                      ) : (
                        <div style={{
                          padding: '8px 12px',
                          backgroundColor: '#f9fafb',
                          borderRadius: '6px',
                          border: '1px solid #e5e7eb'
                        }}>
                          ${payStructureData.vendorRate}
                        </div>
                      )}
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                        Payroll Mode
                      </label>
                      {isEditingPayStructure ? (
                        <select
                          name="payrollMode"
                          value={payStructureData.payrollMode}
                          onChange={handlePayStructureInputChange}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '14px'
                          }}
                        >
                          <option value="Payroll and Perdiem mode">Payroll and Perdiem mode</option>
                          <option value="Hourly Billing">Hourly Billing</option>
                        </select>
                      ) : (
                        <div style={{
                          padding: '8px 12px',
                          backgroundColor: '#f9fafb',
                          borderRadius: '6px',
                          border: '1px solid #e5e7eb'
                        }}>
                          {payStructureData.payrollMode}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Hourly Billing Section */}
                <div style={{ marginBottom: '32px' }}>
                  <h3 style={{ marginBottom: '16px', color: '#374151' }}>Hourly Billing</h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '16px'
                  }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                        Consultant Rate
                      </label>
                      {isEditingPayStructure ? (
                        <input
                          type="number"
                          name="consultantRate"
                          value={payStructureData.consultantRate}
                          onChange={handlePayStructureInputChange}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '14px'
                          }}
                        />
                      ) : (
                        <div style={{
                          padding: '8px 12px',
                          backgroundColor: '#f9fafb',
                          borderRadius: '6px',
                          border: '1px solid #e5e7eb'
                        }}>
                          ${payStructureData.consultantRate}
                        </div>
                      )}
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                        ADP Rate
                      </label>
                      {isEditingPayStructure ? (
                        <input
                          type="number"
                          name="adpRate"
                          value={payStructureData.adpRate}
                          onChange={handlePayStructureInputChange}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '14px'
                          }}
                        />
                      ) : (
                        <div style={{
                          padding: '8px 12px',
                          backgroundColor: '#f9fafb',
                          borderRadius: '6px',
                          border: '1px solid #e5e7eb'
                        }}>
                          ${payStructureData.adpRate}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Biweekly Calculation */}
                <div style={{ marginBottom: '32px' }}>
                  <h3 style={{ marginBottom: '16px', color: '#374151' }}>Biweekly Calculation (80 hours)</h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: '16px',
                    marginBottom: '16px'
                  }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                        Consultant
                      </label>
                      <div style={{
                        padding: '8px 12px',
                        backgroundColor: '#f0f9ff',
                        borderRadius: '6px',
                        border: '1px solid #e0f2fe',
                        color: '#0369a1',
                        fontWeight: '600'
                      }}>
                        ${calculatePayStructureValues().biweeklyConsultant}
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                        ADP Payroll
                      </label>
                      <div style={{
                        padding: '8px 12px',
                        backgroundColor: '#f0f9ff',
                        borderRadius: '6px',
                        border: '1px solid #e0f2fe',
                        color: '#0369a1',
                        fontWeight: '600'
                      }}>
                        ${calculatePayStructureValues().biweeklyAdp}
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                        Perdiem Rate
                      </label>
                      <div style={{
                        padding: '8px 12px',
                        backgroundColor: '#f0f9ff',
                        borderRadius: '6px',
                        border: '1px solid #e0f2fe',
                        color: '#0369a1',
                        fontWeight: '600'
                      }}>
                        ${calculatePayStructureValues().perdiemRate}
                      </div>
                    </div>
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '16px'
                  }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                        Paying Rate
                      </label>
                      <div style={{
                        padding: '8px 12px',
                        backgroundColor: '#d1fae5',
                        borderRadius: '6px',
                        border: '1px solid #a7f3d0',
                        color: '#065f46',
                        fontWeight: '600'
                      }}>
                        ${calculatePayStructureValues().payingRate}
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                        Biweekly Hours
                      </label>
                      {isEditingPayStructure ? (
                        <input
                          type="number"
                          name="biweeklyHours"
                          value={payStructureData.biweeklyHours}
                          onChange={handlePayStructureInputChange}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '14px'
                          }}
                        />
                      ) : (
                        <div style={{
                          padding: '8px 12px',
                          backgroundColor: '#f9fafb',
                          borderRadius: '6px',
                          border: '1px solid #e5e7eb'
                        }}>
                          {payStructureData.biweeklyHours} hours
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Net Pay Calculation */}
                <div>
                  <h3 style={{ marginBottom: '16px', color: '#374151' }}>Net Pay Calculation</h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '16px',
                    marginBottom: '16px'
                  }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                        Consultant Net Pay
                      </label>
                      <div style={{
                        padding: '8px 12px',
                        backgroundColor: '#dcfce7',
                        borderRadius: '6px',
                        border: '1px solid #bbf7d0',
                        color: '#166534',
                        fontWeight: '600'
                      }}>
                        ${calculatePayStructureValues().netPayConsultant}
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                        ADP Net Pay
                      </label>
                      <div style={{
                        padding: '8px 12px',
                        backgroundColor: '#dcfce7',
                        borderRadius: '6px',
                        border: '1px solid #bbf7d0',
                        color: '#166534',
                        fontWeight: '600'
                      }}>
                        ${calculatePayStructureValues().netPayAdp}
                      </div>
                    </div>
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '16px'
                  }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                        Perdiem Amount
                      </label>
                      <div style={{
                        padding: '8px 12px',
                        backgroundColor: '#fef3c7',
                        borderRadius: '6px',
                        border: '1px solid #fde68a',
                        color: '#92400e',
                        fontWeight: '600'
                      }}>
                        ${calculatePayStructureValues().perdiemAmount}
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                        Gross Pay
                      </label>
                      <div style={{
                        padding: '8px 12px',
                        backgroundColor: '#fee2e2',
                        borderRadius: '6px',
                        border: '1px solid #fecaca',
                        color: '#991b1b',
                        fontWeight: '600'
                      }}>
                        Consultant: ${calculatePayStructureValues().grossPayConsultant} | ADP: ${calculatePayStructureValues().grossPayAdp}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Summary */}
                <div style={{
                  marginTop: '32px',
                  padding: '16px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}>
                  <h4 style={{ marginBottom: '12px', color: '#374151' }}>Summary</h4>
                  <p style={{ color: '#6b7280', fontSize: '14px', lineHeight: '1.5', margin: '0 0 8px 0' }}>
                    <strong>Net pay (take home) amount:</strong> ${calculatePayStructureValues().netPayAdp}
                  </p>
                  <p style={{ color: '#6b7280', fontSize: '14px', lineHeight: '1.5', margin: 0 }}>
                    This calculation is based on the formulas from the Excel pay structure sheet,
                    including LCA rate calculations, vendor rates, and perdiem adjustments.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeDetailsPage;