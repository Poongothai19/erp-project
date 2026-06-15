// ManagerTimesheet.js - Complete Updated Version with Sidebar Filter
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import '../styles/ManagerDashboard.css';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Clock,
  Edit3,
  Plus,
  Eye,
  EyeOff,
  Trash2,
  X,
  Building,
  ChevronLeft,
  User,
  Building as C2CIcon,
  Shield,
  Heart,
  ClipboardList,
  CheckCircle,
  Clock as PendingIcon,
  AlertCircle,
  Check,
  Save,
  Lock,
  UserCheck,
  Filter,
  Bell,
  ChevronDown,
  FileText,
  AlertTriangle,
  Calendar,
  DollarSign,
  Users,
  FileSpreadsheet
} from 'lucide-react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import BASE_URL from "../../url";
import Swal from 'sweetalert2';

// Import extracted components and utilities
import { handleAuthError } from './MTS_Utils';
import useNotificationService from './useNotificationService';
import NotificationSystem from './NotificationSystem';
import NotificationBell from './NotificationBell';
import SidebarFilter from './SidebarFilter';
import EmployeeModal from './EmployeeModal';
import EmployeeDetailsModal from './EmployeeDetailsModal';
import C2CModal from './C2CModal';
import C2CDetailsModal from './C2CDetailsModal';
import InvoiceModal from './InvoiceModal';
import InvoiceDetailsModal from './InvoiceDetailsModal';

// Import extracted View components
import EmployeeView from './EmployeeView';
import TimesheetView from './TimesheetView';
import C2CView from './C2CView';
import InvoiceView from './InvoiceView';
import BenefitsView from './BenefitsView';






// MAIN PARENT COMPONENT
const ManagerTimesheetDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [viewState, setViewState] = useState({
    activeView: 'employee',
    selectedCompany: location.state?.company || null,
    filterSidebarOpen: false
  });

  const [notificationState, setNotificationState] = useState({
    isNotificationPanelOpen: false
  });

  const { notifications, loading: notificationsLoading } = useNotificationService(
    viewState.selectedCompany?.id
  );
  const [benefitsModalState, setBenefitsModalState] = useState({
    isOpen: false,
    benefitType: null
  });


  const [filterState, setFilterState] = useState({
    statuses: [],
    states: []
  });

  const [timeState, setTimeState] = useState({
    currentTime: new Date()
  });

  const [modalState, setModalState] = useState({
    isOpen: false,
    mode: null,
    employeeData: null,
    detailsModalOpen: false,
    selectedEmployee: null,
    c2cModalOpen: false,
    c2cMode: null,
    c2cFormData: null,
    c2cDetailsModalOpen: false,
    selectedC2C: null,
    invoiceModalOpen: false,
    invoiceMode: null,
    invoiceFormData: null,
    invoiceDetailsModalOpen: false,
    selectedInvoice: null
  });

  // Notification handlers
  const handleNotificationBellClick = useCallback(() => {
    setNotificationState(prev => ({
      ...prev,
      isNotificationPanelOpen: !prev.isNotificationPanelOpen
    }));
  }, []);

  const handleCloseNotificationPanel = useCallback(() => {
    setNotificationState(prev => ({
      ...prev,
      isNotificationPanelOpen: false
    }));
  }, []);

  // Calculate total notification count
  const totalNotificationCount = useMemo(() => {
    return notifications.reduce((total, notification) => total + (notification.count || 1), 0);
  }, [notifications]);

  const [employees, setEmployees] = useState([]);
  const [timesheets, setTimesheets] = useState([]);
  const [loading, setLoading] = useState({
    employees: true,
    timesheets: true
  });

  const [c2cData, setC2CData] = useState([]);
  const [c2cLoading, setC2CLoading] = useState(true);
  const [invoiceData, setInvoiceData] = useState([]);
  const [invoiceLoading, setInvoiceLoading] = useState(true);


  // Filter employees based on active filters
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const statusMatch = filterState.statuses.length === 0 || filterState.statuses.includes(emp.status);
      const stateMatch = filterState.states.length === 0 || filterState.states.includes(emp.state);
      return statusMatch && stateMatch;
    });
  }, [employees, filterState]);

  const modalHandlers = useMemo(() => ({
    openAddModal: () => {
      setModalState(prev => ({
        ...prev,
        isOpen: true,
        mode: 'add',
        employeeData: null
      }));
    },

    openEditModal: (employee) => {
      setModalState(prev => ({
        ...prev,
        isOpen: true,
        mode: 'edit',
        employeeData: { ...employee }
      }));
    },

    openDetailsModal: (employee) => {
      setModalState(prev => ({
        ...prev,
        detailsModalOpen: true,
        selectedEmployee: employee
      }));
    },

    closeModal: () => {
      setModalState(prev => ({
        ...prev,
        isOpen: false,
        mode: null,
        employeeData: null
      }));
    },

    closeDetailsModal: () => {
      setModalState(prev => ({
        ...prev,
        detailsModalOpen: false,
        selectedEmployee: null
      }));
    },

    toggleFilterSidebar: () => {
      setViewState(prev => ({
        ...prev,
        filterSidebarOpen: !prev.filterSidebarOpen
      }));
    },
    openAddC2CModal: () => {
      setModalState(prev => ({
        ...prev,
        c2cModalOpen: true,
        c2cMode: 'add',
        c2cFormData: null
      }));
    },

    openEditC2CModal: (c2c) => {
      setModalState(prev => ({
        ...prev,
        c2cModalOpen: true,
        c2cMode: 'edit',
        c2cFormData: { ...c2c }
      }));
    },

    openC2CDetailsModal: (c2c) => {
      setModalState(prev => ({
        ...prev,
        c2cDetailsModalOpen: true,
        selectedC2C: c2c
      }));
    },

    closeC2CModal: () => {
      setModalState(prev => ({
        ...prev,
        c2cModalOpen: false,
        c2cMode: null,
        c2cFormData: null
      }));
    },

    closeC2CDetailsModal: () => {
      setModalState(prev => ({
        ...prev,
        c2cDetailsModalOpen: false,
        selectedC2C: null
      }));
    },
    openAddInvoiceModal: () => {
      setModalState(prev => ({
        ...prev,
        invoiceModalOpen: true,
        invoiceMode: 'add',
        invoiceFormData: null
      }));
    },

    openEditInvoiceModal: (invoice) => {
      setModalState(prev => ({
        ...prev,
        invoiceModalOpen: true,
        invoiceMode: 'edit',
        invoiceFormData: { ...invoice }
      }));
    },

    openInvoiceDetailsModal: (invoice) => {
      setModalState(prev => ({
        ...prev,
        invoiceDetailsModalOpen: true,
        selectedInvoice: invoice
      }));
    },

    closeInvoiceModal: () => {
      setModalState(prev => ({
        ...prev,
        invoiceModalOpen: false,
        invoiceMode: null,
        invoiceFormData: null
      }));
    },

    closeInvoiceDetailsModal: () => {
      setModalState(prev => ({
        ...prev,
        invoiceDetailsModalOpen: false,
        selectedInvoice: null
      }));
    }

  }), []);

  const parseContacts = useCallback((contacts) => {
    try {
      if (!contacts) {
        return [];
      }

      // If it's already a string (JSON), parse it
      if (typeof contacts === 'string') {
        if (contacts.trim() === '' || contacts.trim() === 'null') {
          return [];
        }
        return JSON.parse(contacts);
      }

      // If it's already an array, return as-is
      if (Array.isArray(contacts)) {
        return contacts;
      }

      // If it's an object, wrap in array
      if (typeof contacts === 'object') {
        return [contacts];
      }

      // Default: return empty array
      return [];
    } catch (error) {
      console.warn('⚠️ Error parsing contacts:', error.message);
      return [];
    }
  }, []);


  const c2cFetchAbortController = useRef(null);


  const fetchC2CData = useCallback(async () => {
    // ✅ Step 1: Validate company selection
    if (!viewState.selectedCompany?.id) {
      console.warn('⚠️ No company selected for C2C fetch');
      console.log('Current viewState:', viewState);
      setC2CData([]);
      return;
    }

    try {
      // ✅ Step 2: Set loading state
      setC2CLoading(true);
      console.log('🔄 Starting C2C data fetch for company:', viewState.selectedCompany.id);

      // ✅ Step 3: Get and validate token
      let token = localStorage.getItem('token');

      if (!token || token.trim() === '') {
        console.error('❌ No authentication token found in localStorage');
        console.error('Available localStorage keys:', Object.keys(localStorage));

        handleAuthError({ response: { status: 401 } }, navigate);
        setC2CData([]);

        Swal.fire({
          title: 'Session Expired',
          text: 'Your session has expired. Please login again.',
          icon: 'warning',
          confirmButtonText: 'Go to Login'
        }).then(() => {
          navigate('/login', { replace: true });
        });

        return;
      }

      // ✅ Step 4: Remove 'Bearer ' prefix if already present
      if (token.startsWith('Bearer ')) {
        token = token.replace('Bearer ', '');
      }

      console.log('🔑 Token length:', token.length);
      console.log('🌐 API Base URL:', BASE_URL);

      // ✅ Step 5: Build the full URL
      const fullUrl = `${BASE_URL}/api/c2c/company/${viewState.selectedCompany.id}`;
      console.log('📡 Fetching from URL:', fullUrl);

      // ✅ Step 6: Make the API request with axios
      const response = await axios.get(fullUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 10000, // 10 second timeout
        validateStatus: function (status) {
          // Don't throw on any status code - handle manually
          return status < 500;
        }
      });

      console.log('✅ Response received');
      console.log('   Status Code:', response.status);
      console.log('   Status Text:', response.statusText);
      console.log('   Data Type:', typeof response.data);
      console.log('   Data (first 200 chars):',
        JSON.stringify(response.data).substring(0, 200)
      );

      // ✅ Step 7: Check if response is HTML (error page)
      if (typeof response.data === 'string') {
        if (response.data.includes('<!DOCTYPE') || response.data.includes('<html')) {
          console.error('❌ CRITICAL: Received HTML instead of JSON');
          console.error('This usually means one of these issues:');
          console.error('  1️⃣ Authentication failed (401)');
          console.error('  2️⃣ Route not found (404)');
          console.error('  3️⃣ Server error (500)');
          console.error('  4️⃣ CORS issue');
          console.error('\nResponse preview:');
          console.error(response.data.substring(0, 500));

          setC2CData([]);

          Swal.fire({
            title: 'API Error',
            text: `Received HTML instead of JSON. Status: ${response.status}. Check server logs.`,
            icon: 'error'
          });

          return;
        }
      }

      // ✅ Step 8: Handle 401 - Unauthorized
      if (response.status === 401) {
        console.error('❌ 401 Unauthorized - Token is invalid or expired');
        console.error('Token details:', {
          length: token.length,
          prefix: token.substring(0, 20)
        });

        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.clear();

        setC2CData([]);

        Swal.fire({
          title: 'Session Expired',
          text: 'Your session has expired. Please login again.',
          icon: 'warning'
        }).then(() => {
          navigate('/login', { replace: true });
        });

        return;
      }

      // ✅ Step 9: Handle 404 - Not Found
      if (response.status === 404) {
        console.warn('⚠️ 404 Not Found - C2C API endpoint does not exist');
        console.warn('Check if route is registered in server.js');
        console.warn('Expected endpoint:', fullUrl);

        setC2CData([]);

        Swal.fire({
          title: 'API Not Found',
          text: 'C2C API endpoint not found. Check server configuration.',
          icon: 'warning'
        });

        return;
      }

      // ✅ Step 10: Handle other error statuses
      if (response.status >= 400 && response.status < 500) {
        console.warn(`⚠️ Client Error: ${response.status}`);
        console.warn('Response data:', response.data);

        setC2CData([]);

        Swal.fire({
          title: 'Client Error',
          text: `API returned status ${response.status}. ${response.data?.message || ''}`,
          icon: 'warning'
        });

        return;
      }

      // ✅ Step 11: Handle 200 success response
      if (response.status === 200) {
        console.log('✅ SUCCESS: Status 200 OK');

        // ✅ Step 12: Parse response data safely
        let c2cList = [];

        // Try different response formats
        if (Array.isArray(response.data)) {
          console.log('📊 Response is direct array');
          c2cList = response.data;
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          console.log('📊 Response has .data property (array)');
          c2cList = response.data.data;
        } else if (response.data?.success === true && Array.isArray(response.data.data)) {
          console.log('📊 Response has .success property with .data array');
          c2cList = response.data.data;
        } else if (response.data?.contractors && Array.isArray(response.data.contractors)) {
          console.log('📊 Response has .contractors property (array)');
          c2cList = response.data.contractors;
        } else {
          console.warn('⚠️ Response format not recognized');
          console.warn('Response structure:', Object.keys(response.data));
          c2cList = [];
        }

        console.log(`✅ Parsed ${c2cList.length} C2C contractors`);

        // ✅ Step 13: Process each contractor record
        const processedC2C = c2cList.map((c2c, index) => {
          try {
            return {
              // ID fields
              id: c2c.Id || c2c.id || `c2c-${index}`,

              // Basic Info
              contractorName: c2c.ContractorName || c2c.contractorName || 'Unknown',
              companyName: c2c.CompanyName || c2c.companyName || '',
              email: c2c.Email || c2c.email || '',
              phone: c2c.Phone || c2c.phone || '',

              // New C2C Fields
              jobTitle: c2c.jobTitle || c2c.jobtitle || c2c.PlacedJobTitle || '',
              workAuthorization: c2c.workAuthorization || c2c.WorkAuthorization || '',
              linkedInUrl: c2c.linkedInUrl || c2c.LinkedInUrl || '',
              vendorWebsite: c2c.vendorWebsite || c2c.vendorwebsite || '',
              vendorIndustry: c2c.vendorIndustry || c2c.vendorindustry || '',
              hireDate: c2c.hireDate || c2c.HireDate || '',

              // Address
              streetAddress: c2c.StreetAddress || c2c.streetAddress || '',
              apartmentSuite: c2c.ApartmentSuite || c2c.apartmentSuite || '',
              city: c2c.City || c2c.city || '',
              state: c2c.State || c2c.state || '',
              zipCode: c2c.ZipCode || c2c.zipCode || '',

              // Tax & Banking
              ein: c2c.EIN || c2c.ein || '',
              stateOfIncorporation: c2c.StateOfIncorporation || c2c.stateOfIncorporation || '',
              bankAccountHolder: c2c.BankAccountHolder || c2c.bankAccountHolder || '',
              bankAccountNumber: c2c.BankAccountNumber || c2c.bankAccountNumber || '',
              bankRoutingNumber: c2c.BankRoutingNumber || c2c.bankRoutingNumber || '',
              bankName: c2c.BankName || c2c.bankName || '',

              // Payment
              paymentMode: c2c.PaymentMode || c2c.paymentMode || 'Bank Transfer',
              paymentTerms: c2c.PaymentTerms || c2c.paymentTerms || '',

              // Contract Details
              clientName: c2c.ClientName || c2c.clientName || '',
              implementationPartner: c2c.ImplementationPartner || c2c.implementationPartner || '',
              billRate: parseFloat(c2c.BillRate || c2c.billRate || 0),
              c2cBillRate: c2c.C2CBillRate || c2c.c2cBillRate || null,

              // PO Details
              poStartDate: c2c.POStartDate || c2c.poStartDate || '',
              poEndDate: c2c.POEndDate || c2c.poEndDate || '',

              // Status
              status: c2c.Status || c2c.status || 'Active',
              notes: c2c.Notes || c2c.notes || '',

              // Department Contacts (parse JSON if needed)
              hrContacts: parseContacts(c2c.HRContacts || c2c.hrContacts),
              onboardingContacts: parseContacts(c2c.OnboardingContacts || c2c.onboardingContacts),
              accountsContacts: parseContacts(c2c.AccountsContacts || c2c.accountsContacts),

              // Timestamps
              createdAt: c2c.CreatedAt || c2c.createdAt,
              updatedAt: c2c.UpdatedAt || c2c.updatedAt
            };
          } catch (processError) {
            console.error(`⚠️ Error processing contractor at index ${index}:`, processError);
            return null;
          }
        }).filter(c => c !== null);

        console.log(`✅ Successfully processed ${processedC2C.length} contractors`);

        // ✅ Step 14: Update state
        setC2CData(processedC2C);

        // ✅ Step 15: Show success message if data loaded
        if (processedC2C.length === 0) {
          console.info('ℹ️ No C2C contractors found for this company');
        } else {
          console.log('🎉 C2C data loaded successfully');
        }

        return;
      }

      // ✅ Step 16: Handle other status codes
      console.warn(`⚠️ Unexpected status code: ${response.status}`);
      setC2CData([]);

    } catch (error) {
      // ✅ Step 17: Comprehensive error handling
      console.error('❌ C2C FETCH ERROR');
      console.error('═══════════════════════════════════════');
      console.error('Error Type:', error.name);
      console.error('Error Message:', error.message);

      if (error.config) {
        console.error('Request Config:', {
          url: error.config.url,
          method: error.config.method,
          headers: {
            ...error.config.headers,
            Authorization: error.config.headers?.Authorization ?
              error.config.headers.Authorization.substring(0, 20) + '...' :
              'None'
          }
        });
      }

      if (error.response) {
        console.error('Response Status:', error.response.status);
        console.error('Response Headers:', error.response.headers);
        console.error('Response Data (first 500 chars):',
          JSON.stringify(error.response.data).substring(0, 500)
        );
      } else if (error.request) {
        console.error('No Response - Request was sent but no response received');
        console.error('Error:', error.request);
      } else {
        console.error('Error Details:', error);
      }

      console.error('═══════════════════════════════════════');

      setC2CData([]);

      // Show user-friendly error
      Swal.fire({
        title: 'Failed to Load C2C Data',
        text: error.message || 'An error occurred while fetching C2C contractors',
        icon: 'error',
        confirmButtonText: 'OK'
      });

    } finally {
      // ✅ Step 18: Always stop loading
      setC2CLoading(false);
      console.log('✅ C2C fetch attempt completed');
    }
  }, [viewState.selectedCompany?.id, navigate]);


  // Update fetchInvoiceData function
  const fetchInvoiceData = useCallback(async () => {
    if (!viewState.selectedCompany?.id) {
      setInvoiceData([]);
      return;
    }

    try {
      setInvoiceLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get(
        `${BASE_URL}/api/invoices/company/${viewState.selectedCompany.id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      let invoicesData = [];
      if (Array.isArray(response.data)) {
        invoicesData = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        invoicesData = response.data.data;
      } else if (response.data?.success && Array.isArray(response.data.data)) {
        invoicesData = response.data.data;
      }

      const processedInvoices = invoicesData.map(inv => ({
        ...inv,
        id: inv.Id || inv.id,
        invoiceNumber: inv.InvoiceNumber || inv.invoiceNumber,
        contractorId: inv.ContractorId || inv.contractorId,
        contractorName: inv.ContractorName || inv.contractorName,
        companyName: inv.CompanyName || inv.companyName,
        email: inv.Email || inv.email,
        amount: inv.Amount || inv.amount,
        issueDate: inv.IssueDate || inv.issueDate,
        dueDate: inv.DueDate || inv.dueDate,
        description: inv.Description || inv.description,
        paymentTerms: inv.PaymentTerms || inv.paymentTerms || 'Net 30',
        status: inv.Status || inv.status || 'Draft',
        notes: inv.Notes || inv.notes || ''
      }));

      setInvoiceData(processedInvoices);

    } catch (error) {
      console.error('Error fetching invoices:', error.message);
      if (error.response?.status === 401) {
        navigate('/login');
      } else if (error.response?.status !== 404) {
        Swal.fire({
          title: 'Error',
          text: error.response?.data?.message || error.message,
          icon: 'error'
        });
      }
      setInvoiceData([]);
    } finally {
      setInvoiceLoading(false);
    }
  }, [viewState.selectedCompany?.id, navigate]);

  // ✅ STEP 5: Update c2cHandlers
  const c2cHandlers = useMemo(() => ({
    handleAddC2C: modalHandlers.openAddC2CModal,

    handleSaveC2C: async (formData) => {
      try {
        const token = localStorage.getItem('token');
        const companyId = viewState.selectedCompany?.id;

        if (!companyId) throw new Error('No company selected');

        const apiData = {
          contractorName: formData.contractorName,
          companyName: formData.companyName,
          email: formData.email,
          phone: formData.phone,
          streetAddress: formData.streetAddress,
          apartmentSuite: formData.apartmentSuite,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          ein: formData.ein,
          stateOfIncorporation: formData.stateOfIncorporation || '',
          bankAccountHolder: formData.bankAccountHolder,
          bankAccountNumber: formData.bankAccountNumber,
          bankRoutingNumber: formData.bankRoutingNumber,
          bankName: formData.bankName,
          paymentMode: formData.paymentMode,
          paymentTerms: formData.paymentTerms,
          poStartDate: formData.poStartDate,
          poEndDate: formData.poEndDate,
          billRate: formData.billRate,
          c2cBillRate: formData.c2cBillRate || null,
          clientName: formData.clientName || '',
          implementationPartner: formData.implementationPartner || '',
          status: formData.status,
          notes: formData.notes,
          jobTitle: formData.jobTitle || '',
          workAuthorization: formData.workAuthorization || '',
          linkedInUrl: formData.linkedInUrl || '',
          vendorWebsite: formData.vendorWebsite || '',
          vendorIndustry: formData.vendorIndustry || '',
          hireDate: formData.hireDate || '',
          hrContacts: formData.hrContacts || [],
          onboardingContacts: formData.onboardingContacts || [],
          accountsContacts: formData.accountsContacts || []
        };

        if (modalState.c2cMode === 'add') {
          const response = await axios.post(
            `${BASE_URL}/api/c2c/company/${companyId}`,
            apiData,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );

          if (response.data.success) {
            modalHandlers.closeC2CModal();
            // ✅ Refresh after modal closes
            setTimeout(() => fetchC2CData(), 300);
            Swal.fire({
              title: 'Success!',
              text: 'C2C contractor added successfully',
              icon: 'success',
              timer: 2000,
              showConfirmButton: false
            });
          }
        } else if (modalState.c2cMode === 'edit') {
          const response = await axios.put(
            `${BASE_URL}/api/c2c/company/${companyId}/${formData.id}`,
            apiData,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );

          if (response.data.success) {
            modalHandlers.closeC2CModal();
            // ✅ Refresh after modal closes
            setTimeout(() => fetchC2CData(), 300);
            Swal.fire({
              title: 'Success!',
              text: 'C2C contractor updated successfully',
              icon: 'success',
              timer: 2000,
              showConfirmButton: false
            });
          }
        }
      } catch (error) {
        console.error('Error saving C2C:', error);
        Swal.fire({
          title: 'Error',
          text: error.response?.data?.message || error.message,
          icon: 'error'
        });
      }
    },

    handleEditC2C: modalHandlers.openEditC2CModal,
    handleViewC2C: modalHandlers.openC2CDetailsModal,

    handleDeleteC2C: async (c2cId) => {
      const confirm = await Swal.fire({
        title: 'Delete C2C Contractor?',
        text: 'Are you sure? This cannot be undone.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel'
      });

      if (confirm.isConfirmed) {
        try {
          const token = localStorage.getItem('token');
          const companyId = viewState.selectedCompany?.id;

          if (!companyId) throw new Error('No company');

          await axios.delete(
            `${BASE_URL}/api/c2c/company/${companyId}/${c2cId}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }
          );

          setC2CData(prev => prev.filter(c => c.id !== c2cId));

          Swal.fire({
            title: 'Deleted!',
            text: 'C2C contractor deleted successfully',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          });
        } catch (error) {
          Swal.fire({
            title: 'Error',
            text: error.response?.data?.message || error.message,
            icon: 'error'
          });
        }
      }
    }
  }), [
    modalHandlers.openAddC2CModal,
    modalHandlers.openEditC2CModal,
    modalHandlers.openC2CDetailsModal,
    modalHandlers.closeC2CModal,
    modalState.c2cMode,
    viewState.selectedCompany?.id,
    fetchC2CData
  ]);

  const invoiceHandlers = useMemo(() => ({
    handleAddInvoice: modalHandlers.openAddInvoiceModal,

    handleSaveInvoice: async (formData) => {
      try {
        const token = localStorage.getItem('token');
        const companyId = viewState.selectedCompany?.id;

        if (!companyId) {
          throw new Error('No company selected');
        }

        const apiData = {
          invoiceNumber: formData.invoiceNumber,
          contractorId: formData.contractorId,
          contractorName: formData.contractorName,
          companyName: formData.companyName,
          email: formData.email,
          amount: formData.amount,
          issueDate: formData.issueDate,
          dueDate: formData.dueDate,
          description: formData.description,
          paymentTerms: formData.paymentTerms,
          status: formData.status,
          notes: formData.notes
        };

        if (modalState.invoiceMode === 'add') {
          const response = await axios.post(
            `${BASE_URL}/api/invoices/company/${companyId}`,
            apiData,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );

          if (response.data.success) {
            await fetchInvoiceData();
            Swal.fire({
              title: 'Success!',
              text: 'Invoice created successfully',
              icon: 'success',
              timer: 2000,
              showConfirmButton: false
            });
          }
        } else if (modalState.invoiceMode === 'edit') {
          const response = await axios.put(
            `${BASE_URL}/api/invoices/company/${companyId}/${formData.id}`,
            apiData,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );

          if (response.data.success) {
            await fetchInvoiceData();
            Swal.fire({
              title: 'Success!',
              text: 'Invoice updated successfully',
              icon: 'success',
              timer: 2000,
              showConfirmButton: false
            });
          }
        }
      } catch (error) {
        console.error('Error saving invoice:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Failed to save invoice';

        Swal.fire({
          title: 'Error',
          text: errorMessage,
          icon: 'error'
        });

        throw new Error(errorMessage);
      }
    },

    handleEditInvoice: modalHandlers.openEditInvoiceModal,
    handleViewInvoice: modalHandlers.openInvoiceDetailsModal,

    handleDeleteInvoice: async (invoiceId) => {
      const confirm = await Swal.fire({
        title: 'Delete Invoice?',
        text: 'Are you sure you want to delete this invoice? This action cannot be undone.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel',
        reverseButtons: true
      });

      if (confirm.isConfirmed) {
        try {
          const token = localStorage.getItem('token');
          const companyId = viewState.selectedCompany?.id;
          const invoice = invoiceData.find(inv => inv.id === invoiceId);

          if (!companyId || !invoice) {
            throw new Error('Invalid company or invoice');
          }

          const response = await axios.delete(
            `${BASE_URL}/api/invoices/company/${companyId}/${invoiceId}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );

          if (response.data.success) {
            setInvoiceData(prev => prev.filter(inv => inv.id !== invoiceId));

            Swal.fire({
              title: 'Deleted!',
              text: 'Invoice has been deleted successfully.',
              icon: 'success',
              timer: 2000,
              showConfirmButton: false
            });
          }
        } catch (error) {
          console.error('Error deleting invoice:', error);
          const errorMessage = error.response?.data?.message || error.message || 'Failed to delete invoice';

          Swal.fire({
            title: 'Delete Failed',
            text: errorMessage,
            icon: 'error',
            confirmButtonColor: '#dc3545'
          });
        }
      }
    }
  }), [modalState.invoiceMode, viewState.selectedCompany, invoiceData, modalHandlers]);





  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const dateStr = String(dateString).split('T')[0];
      const [y, m, d] = dateStr.split('-').map(Number);
      return new Date(y, m - 1, d).toLocaleDateString();
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const fetchEmployees = useCallback(async () => {
    if (!viewState.selectedCompany?.id) {
      console.log('⚠️ No company selected, skipping fetch');
      return;
    }

    try {
      console.log('🔄 FETCHING EMPLOYEES...');
      setLoading(prev => ({ ...prev, employees: true }));

      // ✅ FIX: Get and validate token
      let token = localStorage.getItem('token');

      if (!token) {
        console.error('❌ No authentication token found');
        handleAuthError({ response: { status: 401 } }, navigate);
        setEmployees([]);
        return;
      }

      // ✅ FIX: Remove "Bearer" if already present
      if (token.startsWith('Bearer ')) {
        token = token.replace('Bearer ', '');
      }

      // ✅ FIX: For Admin users in the Directory tab, show ALL employees
      const isMasterDirectory = localStorage.getItem('userRole') === 'admin';
      const fetchId = isMasterDirectory ? 'all' : viewState.selectedCompany.id;

      const response = await axios.get(
        `${BASE_URL}/api/employees/company/${fetchId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        const processedEmployees = response.data.data.map(employee => ({
          ...employee,
          id: employee.EmployeeId || employee.Id || employee.id,
          employeeCode: employee.EmployeeCode || employee.employeeCode || '',
          employeeId: employee.EmployeeCode || employee.employeeCode || employee.EmployeeId || employee.Id || employee.id,
          name: employee.Name || employee.name,
          email: employee.Email || employee.email,
          phone: employee.Phone || employee.phone,
          department: employee.Department || employee.department,
          position: employee.Position || employee.position || employee.JobTitle || '',
          employmentType: employee.EmploymentType || employee.employmentType || 'Full-time',
          status: employee.Status || employee.status || 'Active',
          hireDate: employee.HireDate || employee.hireDate,
          streetAddress: employee.StreetAddress || employee.streetAddress || '',
          apartmentSuite: employee.ApartmentSuite || employee.apartmentSuite || '',
          city: employee.City || employee.city || '',
          state: employee.State || employee.state || '',
          Retirement401kEnrolled: employee.Retirement401kEnrolled || employee.retirement401kEnrolled || false,
          retirement401kEnrolled: employee.Retirement401kEnrolled || employee.retirement401kEnrolled || false,
          MedicalInsuranceEnrolled: employee.MedicalInsuranceEnrolled || employee.medicalInsuranceEnrolled || false,
          medicalInsuranceEnrolled: employee.MedicalInsuranceEnrolled || employee.medicalInsuranceEnrolled || false,
          visaStatus: employee.VisaStatus || employee.visaStatus || 'US Citizen',
          visaExpiryDate: employee.VisaExpiryDate || employee.visaExpiryDate,
          projectName: employee.ProjectName || employee.projectName,
          projectStatus: employee.ProjectStatus || employee.projectStatus,
          billRate: employee.BillRate || employee.billRate
        }));

        setEmployees(processedEmployees);
      }
    } catch (error) {
      console.error('❌ Error fetching employees:', error);

      // ✅ FIX: Handle 401 error
      if (error.response?.status === 401) {
        handleAuthError(error, navigate);
      } else {
        Swal.fire({
          title: 'Error',
          text: `Failed to load employees: ${error.response?.data?.message || error.message}`,
          icon: 'error'
        });
      }
    } finally {
      setLoading(prev => ({ ...prev, employees: false }));
    }
  }, [viewState.selectedCompany, navigate]);


  const fetchTimesheets = useCallback(async () => {
    if (!viewState.selectedCompany?.id) return;

    try {
      setLoading(prev => ({ ...prev, timesheets: true }));
      const token = localStorage.getItem('token');

      const response = await axios.get(
        `${BASE_URL}/api/timesheets/company/${viewState.selectedCompany.id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      let rawData = [];

      if (response.data) {
        if (Array.isArray(response.data)) {
          rawData = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          rawData = response.data.data;
        } else if (response.data.timesheets && Array.isArray(response.data.timesheets)) {
          rawData = response.data.timesheets;
        } else if (response.data.success === true && response.data.data) {
          rawData = Array.isArray(response.data.data) ? response.data.data : [];
        }
      }

      if (!Array.isArray(rawData) || rawData.length === 0) {
        setTimesheets([]);
        return;
      }

      const processedTimesheets = rawData.map((timesheet) => {
        const id = timesheet.Id || timesheet.id || timesheet.TimesheetId || timesheet.timesheetId ||
          timesheet.timesheet_id || timesheet._id || `temp-${Date.now()}`;

        const employeeId = timesheet.EmployeeCode || timesheet.employeeCode ||
          timesheet.EmployeeId || timesheet.employeeId || timesheet.employee_id ||
          timesheet.EmployeeID || timesheet.employeeID;

        const employeeName = timesheet.EmployeeName || timesheet.employeeName || timesheet.employee_name ||
          timesheet.Name || timesheet.name || timesheet.FullName || timesheet.fullName ||
          timesheet.full_name || 'Unknown Employee';

        const employeeEmail = timesheet.EmployeeEmail || timesheet.employeeEmail || timesheet.employee_email ||
          timesheet.Email || timesheet.email || 'No email';

        let periodStart = timesheet.PeriodStart || timesheet.periodStart || timesheet.period_start ||
          timesheet.StartDate || timesheet.startDate || timesheet.start_date ||
          timesheet.start || timesheet.from || timesheet.From;

        let periodEnd = timesheet.PeriodEnd || timesheet.periodEnd || timesheet.period_end ||
          timesheet.EndDate || timesheet.endDate || timesheet.end_date ||
          timesheet.end || timesheet.to || timesheet.To;

        const periodString = timesheet.PeriodDates || timesheet.periodDates || timesheet.period_dates ||
          timesheet.Period || timesheet.period || timesheet.DateRange || timesheet.dateRange;

        if (periodString && typeof periodString === 'string') {
          const parts = periodString.split(/\s*-\s*|\s*to\s*/i);
          if (parts.length === 2) {
            periodStart = parts[0].trim();
            periodEnd = parts[1].trim();
          }
        }

        const totalHours = Number(
          timesheet.TotalHours || timesheet.totalHours || timesheet.total_hours ||
          timesheet.Hours || timesheet.hours || timesheet.TotalHrs || timesheet.totalHrs ||
          timesheet.WorkedHours || timesheet.workedHours || 0
        );

        const overtimeHours = Number(
          timesheet.OvertimeHours || timesheet.overtimeHours || timesheet.overtime_hours ||
          timesheet.Overtime || timesheet.overtime || timesheet.OT || timesheet.ot || 0
        );

        let status = timesheet.Status || timesheet.status || timesheet.ApprovalStatus ||
          timesheet.approvalStatus || timesheet.approval_status || 'Pending';

        status = String(status).trim();
        if (status.toLowerCase().includes('approve')) {
          status = 'Approved';
        } else if (status.toLowerCase().includes('reject')) {
          status = 'Rejected';
        } else {
          status = 'Pending';
        }

        return {
          ...timesheet,
          id,
          employeeId: timesheet.EmployeeId || timesheet.employeeId || timesheet.employee_id || timesheet.EmployeeID || timesheet.employeeID || id,
          EmployeeCode: timesheet.EmployeeCode || timesheet.employeeCode || '',
          employeeName,
          employeeEmail,
          periodStart,
          periodEnd,
          totalHours,
          overtimeHours,
          status,
          ApproverName: timesheet.Approver || timesheet.ApproverName || 'N/A',
          selected: false,
          submittedDate: timesheet.SubmittedDate || timesheet.submittedDate || timesheet.submitted_date ||
            timesheet.CreatedAt || timesheet.createdAt || timesheet.created_at ||
            timesheet.Date || timesheet.date || new Date().toISOString()
        };
      });

      setTimesheets(processedTimesheets);

    } catch (error) {
      console.error('Error fetching timesheets:', error);
      setTimesheets([]);

      if (error.response?.status !== 404) {
        Swal.fire({
          title: 'Error Loading Timesheets',
          text: error.response?.data?.message || error.message,
          icon: 'error'
        });
      }
    } finally {
      setLoading(prev => ({ ...prev, timesheets: false }));
    }
  }, [viewState.selectedCompany]);

  const navigationHandlers = useMemo(() => ({
    setActiveView: (view) => setViewState(prev => ({ ...prev, activeView: view })),
    handleBackToCompanies: () => navigate('/companies'),
    handleEmployeeClick: (employee) => {
      navigate(`/user-details/${employee.id}`, {
        state: {
          employee,
          company: viewState.selectedCompany
        }
      });
    }
  }), [navigate, viewState.selectedCompany]);

  const timesheetHandlers = useMemo(() => ({
    handleSelectTimesheet: (id) => {
      setTimesheets(prev => prev.map(timesheet =>
        timesheet.id === id ? { ...timesheet, selected: !timesheet.selected } : timesheet
      ));
    },

    handleSelectAllTimesheets: () => {
      const pendingTimesheets = timesheets.filter(t => t.status === 'Pending');
      const allPendingSelected = pendingTimesheets.every(timesheet => timesheet.selected);

      setTimesheets(prev => prev.map(timesheet =>
        timesheet.status === 'Pending'
          ? { ...timesheet, selected: !allPendingSelected }
          : timesheet
      ));
    },

    handleApproveTimesheet: async (id) => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.post(
          `${BASE_URL}/api/timesheets/${id}/approve`,
          {},
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.data.success) {
          await fetchTimesheets();
          Swal.fire({
            title: 'Approved!',
            text: 'Timesheet approved successfully',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          });
        }
      } catch (error) {
        Swal.fire({
          title: 'Error',
          text: error.response?.data?.message || 'Failed to approve timesheet',
          icon: 'error'
        });
      }
    },

    handleRejectTimesheet: async (id) => {
      const { value: reason } = await Swal.fire({
        title: 'Reject Timesheet',
        input: 'textarea',
        inputLabel: 'Reason for rejection',
        inputPlaceholder: 'Type your reason here...',
        inputAttributes: {
          'aria-label': 'Type your reason here'
        },
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Reject',
        cancelButtonText: 'Cancel'
      });

      if (reason) {
        try {
          const token = localStorage.getItem('token');
          const response = await axios.post(
            `${BASE_URL}/api/timesheets/${id}/reject`,
            { reason },
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );

          if (response.data.success) {
            await fetchTimesheets();
            Swal.fire({
              title: 'Rejected!',
              text: 'Timesheet rejected successfully',
              icon: 'success',
              timer: 2000,
              showConfirmButton: false
            });
          }
        } catch (error) {
          Swal.fire({
            title: 'Error',
            text: error.response?.data?.message || 'Failed to reject timesheet',
            icon: 'error'
          });
        }
      }
    },

    handleBulkApprove: async () => {
      const selectedIds = timesheets
        .filter(timesheet => timesheet.selected && timesheet.status === 'Pending')
        .map(timesheet => timesheet.id);

      if (selectedIds.length === 0) {
        Swal.fire({
          title: 'No Selection',
          text: 'Please select pending timesheets to approve.',
          icon: 'warning'
        });
        return;
      }

      const confirm = await Swal.fire({
        title: 'Approve Timesheets?',
        text: `Are you sure you want to approve ${selectedIds.length} timesheet(s)?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#10b981',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, approve them!',
        cancelButtonText: 'Cancel'
      });

      if (confirm.isConfirmed) {
        try {
          const token = localStorage.getItem('token');

          Swal.fire({
            title: 'Processing...',
            text: 'Approving timesheets...',
            allowOutsideClick: false,
            didOpen: () => {
              Swal.showLoading();
            }
          });

          const approvePromises = selectedIds.map(id =>
            axios.post(
              `${BASE_URL}/api/timesheets/${id}/approve`,
              {},
              {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              }
            )
          );

          await Promise.all(approvePromises);
          await fetchTimesheets();

          Swal.fire({
            title: 'Approved!',
            text: `Successfully approved ${selectedIds.length} timesheet(s)`,
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          });
        } catch (error) {
          Swal.fire({
            title: 'Error',
            text: error.response?.data?.message || 'Failed to approve some timesheets',
            icon: 'error'
          });
        }
      }
    },

    handleBulkReject: async () => {
      const selectedIds = timesheets
        .filter(timesheet => timesheet.selected && timesheet.status === 'Pending')
        .map(timesheet => timesheet.id);

      if (selectedIds.length === 0) {
        Swal.fire({
          title: 'No Selection',
          text: 'Please select pending timesheets to reject.',
          icon: 'warning'
        });
        return;
      }

      const { value: reason } = await Swal.fire({
        title: 'Reject Timesheets',
        text: `You are about to reject ${selectedIds.length} timesheet(s).`,
        input: 'textarea',
        inputLabel: 'Reason for rejection',
        inputPlaceholder: 'Type your reason here...',
        inputAttributes: {
          'aria-label': 'Type your reason here'
        },
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Reject All',
        cancelButtonText: 'Cancel'
      });

      if (reason) {
        try {
          const token = localStorage.getItem('token');
          const companyId = viewState.selectedCompany?.id;

          const response = await axios.post(
            `${BASE_URL}/api/timesheets/bulk/reject`,
            {
              timesheetIds: selectedIds,
              companyId: companyId,
              reason: reason
            },
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );

          if (response.data.success) {
            await fetchTimesheets();
            Swal.fire({
              title: 'Rejected!',
              text: response.data.message,
              icon: 'success',
              timer: 2000,
              showConfirmButton: false
            });
          }
        } catch (error) {
          Swal.fire({
            title: 'Error',
            text: 'Failed to reject timesheets',
            icon: 'error'
          });
        }
      }
    },

    handleDeleteTimesheet: async (id) => {
      const confirm = await Swal.fire({
        title: 'Delete Timesheet?',
        text: 'Are you sure you want to delete this timesheet? This action cannot be undone.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel',
        reverseButtons: true
      });

      if (confirm.isConfirmed) {
        try {
          const token = localStorage.getItem('token');
          const companyId = viewState.selectedCompany?.id;

          const response = await axios.delete(
            `${BASE_URL}/api/timesheets/company/${companyId}/${id}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );

          if (response.data.success) {
            await fetchTimesheets();
            Swal.fire({
              title: 'Deleted!',
              text: 'Timesheet deleted successfully',
              icon: 'success',
              timer: 2000,
              showConfirmButton: false
            });
          }
        } catch (error) {
          console.error('Error deleting timesheet:', error);
          Swal.fire({
            title: 'Error',
            text: error.response?.data?.message || 'Failed to delete timesheet',
            icon: 'error'
          });
        }
      }
    },

    handleViewTasks: async (ts) => {
      try {
        const token = localStorage.getItem('token');
        const timesheetId = ts.id; // Corrected from ts.Id to ts.id for ManagerTimesheet context

        // Fetch the entries for this timesheet
        const entriesResponse = await axios.get(
          `${BASE_URL}/api/timesheets/${timesheetId}/entries`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

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
            const dateStr = String(entry.Date).split('T')[0];
            const [y, m, d] = dateStr.split('-').map(Number);
            const entryDate = new Date(y, m - 1, d);
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const dayName = dayNames[entryDate.getDay()];

            const rawType = entry.HourType || entry.DayType || 'Regular';
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
              `${BASE_URL}/api/timesheets/company/${ts.CompanyId || ts.EntityId || viewState.selectedCompany?.id}/${ts.id}/entries`,
              { entries: updatedEntries },
              { headers: { 'Authorization': `Bearer ${token}` } }
            );

            if (response.data.success) {
              // Update local state
              setTimesheets(prev => prev.map(item =>
                item.id === ts.id ? {
                  ...item,
                  totalHours: response.data.totalHours,
                  OvertimeHours: response.data.overtimeHours
                } : item
              ));

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
          title: `Timesheet Tasks - ${ts.employeeName || 'Unknown'}`,
          html: `
            <div style="text-align: left; margin-bottom: 20px;">
              <p><strong>Period:</strong> ${(() => {
              const startStr = formatDate(ts.periodStart);
              const endObj = new Date(ts.periodEnd);
              const today = new Date();
              today.setHours(0, 0, 0, 0);

              if (ts.status === 'Pending' && endObj > today) {
                return `${startStr} - ${formatDate(today)}`;
              }
              return `${startStr} - ${formatDate(ts.periodEnd)}`;
            })()}</p>
              <p><strong>Total Hours:</strong> <span id="mts-modal-total-hours">${ts.totalHours || 0}</span> hours</p>
              <p><strong>Status:</strong> <span style="padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; background: #fff3cd; color: #856404;">${ts.status}</span></p>
              ${ts.Notes ? `<p><strong>Notes:</strong> ${ts.Notes}</p>` : ''}
            </div>
            <div id="mts-table-container" style="max-height: 400px; overflow-y: auto; padding-bottom: 20px;">
              ${getTableHtml(false)}
            </div>
          `,
          width: '900px',
          showConfirmButton: ts.status !== 'Approved',
          showDenyButton: ts.status !== 'Approved',
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
            if (ts.status !== 'Approved') {
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
                    const success = await handleSaveEntries(ts, updatedEntries);
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
              let tooltip = document.getElementById('mts-floating-tooltip');
              if (!tooltip) {
                tooltip = document.createElement('div');
                tooltip.id = 'mts-floating-tooltip';
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
            const tooltip = document.getElementById('mts-floating-tooltip');
            if (tooltip) tooltip.remove();
          }
        }).then((result) => {
          if (result.isConfirmed) {
            timesheetHandlers.handleApproveTimesheet(ts.id);
          } else if (result.isDenied) {
            timesheetHandlers.handleRejectTimesheet(ts.id);
          }
        });
      } catch (error) {
        console.error('Error fetching timesheet tasks:', error);
        Swal.fire('Error', 'Failed to load timesheet tasks', 'error');
      }
    }
  }), [timesheets, viewState.selectedCompany, fetchTimesheets, formatDate]);



  const employeeHandlers = useMemo(() => ({
    handleDeleteEmployee: async (employeeId) => {
      const confirm = await Swal.fire({
        title: 'Delete Employee?',
        text: 'Are you sure you want to delete this employee? This action cannot be undone.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel',
        reverseButtons: true
      });

      if (confirm.isConfirmed) {
        try {
          const token = localStorage.getItem('token');
          const companyId = viewState.selectedCompany?.id;
          const employee = employees.find(emp => emp.id === employeeId);

          if (!companyId || !employee) {
            throw new Error('Invalid company or employee');
          }

          const response = await axios.delete(
            `${BASE_URL}/api/employees/company/${companyId}/${employee.id}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );

          if (response.data.success) {
            setEmployees(prev => prev.filter(emp => emp.id !== employeeId));

            Swal.fire({
              title: 'Deleted!',
              text: 'Employee has been deleted successfully.',
              icon: 'success',
              timer: 2000,
              showConfirmButton: false
            });
          }
        } catch (error) {
          console.error('Error deleting employee:', error);
          const errorMessage = error.response?.data?.message || error.message || 'Failed to delete employee';

          if (error.response?.data?.hasTimesheets) {
            Swal.fire({
              title: 'Cannot Delete Employee',
              text: `This employee has ${error.response.data.timesheetCount} timesheet(s) associated and cannot be deleted.`,
              icon: 'error',
              confirmButtonColor: '#dc3545'
            });
          } else {
            Swal.fire({
              title: 'Delete Failed',
              text: errorMessage,
              icon: 'error',
              confirmButtonColor: '#dc3545'
            });
          }
        }
      }
    },

    // ✅ FIXED: This function should NOT make API calls anymore
    // EmployeeModal will handle its own API calls
    handleSaveEmployee: async (employeeData) => {
      console.log('📝 handleSaveEmployee called');
      console.log('⚠️ WARNING: This function should not make API calls');
      console.log('EmployeeModal handles its own API calls to prevent duplicates');

      // This function is now just a placeholder
      // EmployeeModal will handle the actual API call
      // This prevents duplicate API calls that cause 409 errors

      return { success: true, message: 'Employee saved (handled by EmployeeModal)' };
    },

    handleAddEmployee: modalHandlers.openAddModal,

    handleEditEmployee: modalHandlers.openEditModal,

    handleViewEmployee: modalHandlers.openDetailsModal

  }), [
    modalHandlers,
    modalState.mode,
    viewState.selectedCompany,
    employees,
    fetchEmployees,
    // Add any other dependencies that are used in the functions above
  ]);
  const computedValues = useMemo(() => {
    const pendingTimesheets = timesheets.filter(t => t.status === 'Pending');
    const hasSelectedTimesheets = pendingTimesheets.some(t => t.selected);
    const allPendingTimesheetsSelected = pendingTimesheets.length > 0 && pendingTimesheets.every(t => t.selected);

    return {
      hasSelectedTimesheets,
      allPendingTimesheetsSelected,
      pendingCount: pendingTimesheets.length,
      selectedCount: pendingTimesheets.filter(t => t.selected).length
    };
  }, [timesheets]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeState({ currentTime: new Date() });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    console.log('🔍 useEffect triggered - Checking company selection');
    console.log('Current dependencies:', {
      selectedCompanyId: viewState.selectedCompany?.id,
      hasFunctions: {
        fetchEmployees: !!fetchEmployees,
        fetchTimesheets: !!fetchTimesheets,
        fetchC2CData: !!fetchC2CData,
        fetchInvoiceData: !!fetchInvoiceData
      }
    });

    // ✅ CRITICAL: Check if company is actually selected
    if (!viewState.selectedCompany?.id) {
      console.warn('⚠️ No company selected, skipping all fetches');
      setEmployees([]);
      setTimesheets([]);
      setC2CData([]);
      setInvoiceData([]);
      return;
    }

    const companyId = viewState.selectedCompany.id;
    console.log('📡 Company selected:', companyId);

    // ✅ Check if token exists BEFORE making requests
    const token = localStorage.getItem('token');
    if (!token || token.trim() === '') {
      console.error('❌ No authentication token found');
      Swal.fire({
        title: 'Session Expired',
        text: 'Your session has expired. Please login again.',
        icon: 'warning',
        confirmButtonText: 'Go to Login'
      }).then(() => {
        navigate('/login', { replace: true });
      });
      return;
    }

    // ✅ Verify all fetch functions are defined
    if (!fetchEmployees || !fetchTimesheets || !fetchC2CData || !fetchInvoiceData) {
      console.error('❌ One or more fetch functions are not defined');
      console.error('Functions:', {
        fetchEmployees: typeof fetchEmployees,
        fetchTimesheets: typeof fetchTimesheets,
        fetchC2CData: typeof fetchC2CData,
        fetchInvoiceData: typeof fetchInvoiceData
      });
      return;
    }

    // ✅ Run all fetches in parallel with proper error handling
    const runFetches = async () => {
      try {
        console.log('🔄 Starting all data fetches...');
        console.log('Fetch functions status:', {
          fetchEmployees: 'queued',
          fetchTimesheets: 'queued',
          fetchC2CData: 'queued',
          fetchInvoiceData: 'queued'
        });

        // Fetch all data in parallel
        const [empResult, tsResult, c2cResult, invResult] = await Promise.allSettled([
          fetchEmployees(),
          fetchTimesheets(),
          fetchC2CData(),
          fetchInvoiceData()
        ]);

        // ✅ Handle individual fetch results with detailed logging
        console.log('\n📊 FETCH RESULTS SUMMARY:');
        console.log('═══════════════════════════════════════');

        if (empResult.status === 'fulfilled') {
          console.log('✅ Employee fetch: SUCCESS');
        } else {
          console.error('❌ Employee fetch: FAILED');
          console.error('   Reason:', empResult.reason?.message || empResult.reason);
        }

        if (tsResult.status === 'fulfilled') {
          console.log('✅ Timesheet fetch: SUCCESS');
        } else {
          console.error('❌ Timesheet fetch: FAILED');
          console.error('   Reason:', tsResult.reason?.message || tsResult.reason);
        }

        if (c2cResult.status === 'fulfilled') {
          console.log('✅ C2C fetch: SUCCESS');
        } else {
          console.error('❌ C2C fetch: FAILED');
          console.error('   Reason:', c2cResult.reason?.message || c2cResult.reason);
        }

        if (invResult.status === 'fulfilled') {
          console.log('✅ Invoice fetch: SUCCESS');
        } else {
          console.error('❌ Invoice fetch: FAILED');
          console.error('   Reason:', invResult.reason?.message || invResult.reason);
        }

        console.log('═══════════════════════════════════════\n');

        // ✅ Count successes
        const successCount = [empResult, tsResult, c2cResult, invResult].filter(
          r => r.status === 'fulfilled'
        ).length;

        console.log(`✅ All data fetch attempts completed (${successCount}/4 succeeded)`);

      } catch (error) {
        console.error('❌ Critical error in fetch sequence:');
        console.error('   Message:', error.message);
        console.error('   Stack:', error.stack);

        Swal.fire({
          title: 'Error Loading Data',
          text: 'Failed to load some data. Please refresh the page.',
          icon: 'error',
          confirmButtonText: 'Refresh',
          didClose: () => {
            window.location.reload();
          }
        });
      }
    };

    runFetches();

    // ✅ COMPLETE AND CORRECT: Include ALL dependencies
    // These functions must be included or useEffect will use stale versions
  }, [
    viewState.selectedCompany?.id,
    navigate,
    fetchEmployees,
    fetchTimesheets,
    fetchC2CData,
    fetchInvoiceData
  ]);// ✅ ONLY this dependency!





  const HeaderSection = React.memo(() => (
    <div className="mts-header">
      <div className="mts-header-content">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
            <button
              onClick={() => navigate('/companies')}
              className="mts-back-btn"
            >
              <ChevronLeft size={16} />
              Back to Companies
            </button>
          </div>
          <h1 className="mts-header-title">Manager Dashboard</h1>
          <p className="mts-header-subtitle">
            {viewState.selectedCompany ? `${viewState.selectedCompany.name} - ` : ''}Employee Management
          </p>
          {/* {viewState.selectedCompany && (
          <div className="company-info-banner">
            <Building size={16} />
            <span>Client ID: {viewState.selectedCompany.clientId}</span>
            <span> | </span>
            <span>Payroll Due: {viewState.selectedCompany.payrollDueDate ? new Date(viewState.selectedCompany.payrollDueDate).toLocaleDateString() : 'Not set'}</span>
            <span> | </span>
            <span>Next Check: {viewState.selectedCompany.nextCheckDate ? new Date(viewState.selectedCompany.nextCheckDate).toLocaleDateString() : 'Not set'}</span>
          </div>
        )} */}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* NOTIFICATION BELL */}
          <NotificationBell
            notificationCount={totalNotificationCount}
            onClick={handleNotificationBellClick}
          />
          <div className="mts-header-time">
            <Clock size={16} />
            {timeState.currentTime.toLocaleDateString()} {timeState.currentTime.toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  ));
  const NavigationTabs = React.memo(() => (
    <div className="mts-navigation-tabs">
      <button
        className={`mts-nav-tab ${viewState.activeView === 'employee' ? 'active' : ''}`}
        onClick={() => navigationHandlers.setActiveView('employee')}
      >
        <User size={18} />
        Employee Directory
      </button>
      <button
        className={`mts-nav-tab ${viewState.activeView === 'timesheet' ? 'active' : ''}`}
        onClick={() => navigationHandlers.setActiveView('timesheet')}
      >
        <ClipboardList size={18} />
        Timesheet Approval
        {computedValues.pendingCount > 0 && (
          <span style={{
            backgroundColor: '#ef4444',
            color: 'white',
            borderRadius: '50%',
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 'bold'
          }}>
            {computedValues.pendingCount}
          </span>
        )}
      </button>
      <button
        className={`mts-nav-tab ${viewState.activeView === 'c2c' ? 'active' : ''}`}
        onClick={() => navigationHandlers.setActiveView('c2c')}
      >
        <C2CIcon size={18} />
        C2C Management
      </button>
      <button
        className={`mts-nav-tab ${viewState.activeView === 'invoice' ? 'active' : ''}`}
        onClick={() => navigationHandlers.setActiveView('invoice')}
      >
        <FileText size={18} />
        Invoice Management
      </button>
      <button
        className={`mts-nav-tab ${viewState.activeView === 'benefits' ? 'active' : ''}`}
        onClick={() => navigationHandlers.setActiveView('benefits')}
      >
        <Heart size={18} />
        Benefits
      </button>
      <button
        className={`mts-nav-tab ${viewState.activeView === 'compliance' ? 'active' : ''}`}
        onClick={() => navigationHandlers.setActiveView('compliance')}
      >
        <Shield size={18} />
        Compliance
      </button>

    </div>
  ));


  const OtherViews = React.memo(({ view }) => (
    <div className="mts-other-views">
      <h2 className="mts-employee-table-title">
        {view === 'compliance' && 'Compliance Management'}
      </h2>
      <div className="coming-soon">
        <div className="coming-soon-content">
          <Clock size={48} />
          <h3>Coming Soon</h3>
          <p>This feature is currently under development and will be available soon.</p>
        </div>
      </div>
    </div>
  ));

  OtherViews.displayName = 'OtherViews';

  return (
    <div className="mts-container">
      <HeaderSection />
      <NavigationTabs />

      {/* Sidebar Filter */}
      <SidebarFilter
        isOpen={viewState.filterSidebarOpen}
        onClose={modalHandlers.toggleFilterSidebar}
        employees={employees}
        onStatusFilter={(statuses) => setFilterState(prev => ({ ...prev, statuses }))}
        onStateFilter={(states) => setFilterState(prev => ({ ...prev, states }))}
        activeFilters={filterState}
      />

      <main className="mts-main-content">
        {viewState.activeView === 'employee' && (
          <EmployeeView
            filteredEmployees={filteredEmployees}
            loading={loading.employees}
            viewState={viewState}
            filterState={filterState}
            modalHandlers={modalHandlers}
            employeeHandlers={employeeHandlers}
            navigationHandlers={navigationHandlers}
            formatDate={formatDate}
          />
        )}
        {viewState.activeView === 'timesheet' && (
          <TimesheetView
            timesheets={timesheets}
            loading={loading.timesheets}
            computedValues={computedValues}
            timesheetHandlers={timesheetHandlers}
            formatDate={formatDate}
          />
        )}
        {viewState.activeView === 'c2c' && (
          <C2CView
            c2cData={c2cData}
            c2cLoading={c2cLoading}
            onAddC2C={c2cHandlers.handleAddC2C}
            onViewC2C={c2cHandlers.handleViewC2C}
            onEditC2C={c2cHandlers.handleEditC2C}
            onDeleteC2C={c2cHandlers.handleDeleteC2C}
          />
        )}
        {viewState.activeView === 'invoice' && (
          <InvoiceView
            invoiceData={invoiceData}
            invoiceLoading={invoiceLoading}
            invoiceHandlers={invoiceHandlers}
          />
        )}
        {viewState.activeView === 'benefits' && (
          <BenefitsView
            employees={employees}
            benefitsModalState={benefitsModalState}
            setBenefitsModalState={setBenefitsModalState}
          />
        )}
        {viewState.activeView === 'compliance' && <OtherViews view="compliance" />}
      </main>

      {/* Notification System */}
      <NotificationSystem
        isOpen={notificationState.isNotificationPanelOpen}
        onClose={handleCloseNotificationPanel}
        notifications={notifications}
        navigate={navigate}
        companyId={viewState.selectedCompany?.id}
      />

      <EmployeeModal
        isOpen={modalState.isOpen}
        mode={modalState.mode}
        employeeData={modalState.employeeData}
        onClose={() => {
          modalHandlers.closeModal();
          // Refresh employee list after modal closes
          setTimeout(() => {
            console.log('🔄 Refreshing employee list after modal close');
            fetchEmployees();
          }, 500);
        }}
        // ✅ No onSave prop - EmployeeModal handles its own API calls
        selectedCompany={viewState.selectedCompany}
      />

      <EmployeeDetailsModal
        isOpen={modalState.detailsModalOpen}
        employee={modalState.selectedEmployee}
        onClose={modalHandlers.closeDetailsModal}
      />
      <C2CModal
        isOpen={modalState.c2cModalOpen}
        mode={modalState.c2cMode}
        c2cData={modalState.c2cFormData}
        onClose={modalHandlers.closeC2CModal}
        onSave={c2cHandlers.handleSaveC2C}
      />

      <C2CDetailsModal
        isOpen={modalState.c2cDetailsModalOpen}
        c2c={modalState.selectedC2C}
        onClose={modalHandlers.closeC2CDetailsModal}
      />

      {/* INVOICE MODALS - ADD THESE */}
      <InvoiceModal
        isOpen={modalState.invoiceModalOpen}
        mode={modalState.invoiceMode}
        invoiceData={modalState.invoiceFormData}
        c2cContractors={Array.isArray(c2cData) ? c2cData : []}
        onClose={modalHandlers.closeInvoiceModal}
        onSave={invoiceHandlers.handleSaveInvoice}
      />

      <InvoiceDetailsModal
        isOpen={modalState.invoiceDetailsModalOpen}
        invoice={modalState.selectedInvoice}
        onClose={modalHandlers.closeInvoiceDetailsModal}
      />

    </div>
  );
};

export default ManagerTimesheetDashboard;