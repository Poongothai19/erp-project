// src/Bench_Sales/Components/VendorManagement.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import BASE_URL from "../../url";
import "../Styles/BenchSalesStyles.css";
import { 
  Plus, Search, Edit, Trash2, Eye, 
  Users, Building, Mail, Phone, 
  UserCheck, Filter, Upload, Download,
  FileSpreadsheet, AlertCircle, CheckCircle
} from 'lucide-react';

const VendorManagement = () => {
  const [vendors, setVendors] = useState([]);
  const [filteredVendors, setFilteredVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [editingVendor, setEditingVendor] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Import states
  const [importFile, setImportFile] = useState(null);
  const [importData, setImportData] = useState([]);
  const [importPreview, setImportPreview] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    contactPerson: "",
    status: "Active"
  });

  // Fetch vendors from API
  const fetchVendors = async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      Swal.fire({
        title: 'Authentication Required',
        text: 'Please login to access vendors',
        icon: 'warning'
      }).then(() => {
        window.location.href = '/login';
      });
      return;
    }

    try {
      setLoading(true);
      console.log('Fetching vendors from:', `${BASE_URL}/api/vendors`);
      
      const response = await axios.get(`${BASE_URL}/api/vendors`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      console.log('Vendors API Response:', response.data);

      let vendorsData = [];
      if (response.data.success && response.data.data) {
        vendorsData = response.data.data.map(vendor => ({
          ...vendor,
          Name: sanitizeText(vendor.Name),
          Email: sanitizeText(vendor.Email),
          Phone: sanitizeText(vendor.Phone),
          ContactPerson: sanitizeText(vendor.ContactPerson),
          Status: sanitizeText(vendor.Status)
        }));
      } else if (Array.isArray(response.data)) {
        vendorsData = response.data.map(vendor => ({
          ...vendor,
          Name: sanitizeText(vendor.Name),
          Email: sanitizeText(vendor.Email),
          Phone: sanitizeText(vendor.Phone),
          ContactPerson: sanitizeText(vendor.ContactPerson),
          Status: sanitizeText(vendor.Status)
        }));
      }

      setVendors(vendorsData);
      setFilteredVendors(vendorsData);
      
    } catch (error) {
      console.error("Fetch vendors error:", error);
      
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        Swal.fire({
          title: 'Session Expired',
          text: 'Please login again',
          icon: 'warning'
        }).then(() => {
          window.location.href = '/login';
        });
      } else {
        Swal.fire({
          title: 'Error',
          text: error.response?.data?.message || 'Failed to load vendors',
          icon: 'error'
        });
      }
      
      setVendors([]);
      setFilteredVendors([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchVendors();
  }, []);

  // Filter vendors based on search and status
  useEffect(() => {
    let result = [...vendors];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(vendor => 
        (vendor.Name || '').toLowerCase().includes(term) ||
        (vendor.Email || '').toLowerCase().includes(term) ||
        (vendor.Phone || '').toLowerCase().includes(term) ||
        (vendor.ContactPerson || '').toLowerCase().includes(term)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(vendor => 
        (vendor.Status || '').toLowerCase() === statusFilter.toLowerCase()
      );
    }

    setFilteredVendors(result);
    setCurrentPage(1);
  }, [searchTerm, statusFilter, vendors]);

  const sanitizeText = (text) => {
    if (!text) return '';
    return String(text)
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
      .replace(/[\u2000-\u200D\u200F\u2028\u2029]/g, '')
      .replace(/[\uFEFF\uFFFE]/g, '')
      .replace(/[◆♦●■▪▫]/g, '')
      .replace(/[^\w\s\-./,@()&:%$#!?*+="'ñáéíóúàèìòùäëïöü]/gi, '')
      .trim();
  };

  // Parse CSV without papaparse
  const parseCSV = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];

    // Parse header
    const headers = parseCSVLine(lines[0]).map(h => h.trim());
    
    // Parse rows
    const data = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const row = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      
      if (Object.values(row).some(val => val.trim())) {
        data.push(row);
      }
    }
    
    return data;
  };

  // Helper function to parse CSV line
  const parseCSVLine = (line) => {
    const result = [];
    let current = '';
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (insideQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current);
    return result;
  };

  // Handle file upload and parsing
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setImportFile(file);
    const fileType = file.name.split('.').pop().toLowerCase();
    
    try {
      let data = [];
      
      if (fileType === 'csv') {
        // Parse CSV without papaparse
        const text = await file.text();
        data = parseCSV(text);
      } else if (fileType === 'xlsx' || fileType === 'xls') {
        // Parse Excel
        const XLSX = await import('xlsx');
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        data = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1,
          defval: "",
          raw: false
        });
        
        // Convert array format to object format
        if (data.length > 0) {
          const headers = data[0].map(h => h.trim());
          data = data.slice(1).map(row => {
            const obj = {};
            headers.forEach((header, index) => {
              obj[header] = row[index] || "";
            });
            return obj;
          });
        }
      } else {
        throw new Error('Unsupported file format. Please use CSV or Excel files.');
      }

      // Process and validate data
      const processedData = data
        .filter(row => row.Name || row.name || row.Company || row.company)
        .map(row => ({
          name: sanitizeText(row.Name || row.name || row.Company || row.company || ""),
          email: sanitizeText(row.Email || row.email || row.Emails || row.emails || ""),
          phone: sanitizeText(row.Phone || row.phone || row.Mobile || row.mobile || row.Contact || row.contact || ""),
          contactPerson: sanitizeText(row.ContactPerson || row['Contact Person'] || row.contactPerson || row.Representative || row.representative || ""),
          status: sanitizeText(row.Status || row.status || "Active")
        }))
        .filter(row => row.name.trim() !== "");

      if (processedData.length === 0) {
        throw new Error('No valid vendor data found in the file. Please check the format.');
      }

      setImportData(processedData);
      setImportPreview(processedData.slice(0, 5));
      
      Swal.fire({
        title: 'File Parsed Successfully!',
        text: `Found ${processedData.length} vendor records. Review and import.`,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });

    } catch (error) {
      console.error('File parsing error:', error);
      Swal.fire({
        title: 'File Parse Error',
        text: error.message || 'Failed to parse the file. Please check the format.',
        icon: 'error'
      });
      setImportFile(null);
      setImportData([]);
      setImportPreview([]);
    }
  };

  // Import vendors to database
  const importVendors = async () => {
    if (importData.length === 0) {
      Swal.fire({
        title: 'No Data',
        text: 'Please upload a file first',
        icon: 'warning'
      });
      return;
    }

    const token = localStorage.getItem('token');
    setImporting(true);
    
    try {
      const results = {
        total: importData.length,
        success: 0,
        failed: 0,
        errors: []
      };

      // Import vendors one by one
      for (let i = 0; i < importData.length; i++) {
        const vendor = importData[i];
        
        try {
          const response = await axios.post(`${BASE_URL}/api/vendors`, vendor, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.data.success) {
            results.success++;
          } else {
            results.failed++;
            results.errors.push(`Row ${i + 1}: ${response.data.message || 'Unknown error'}`);
          }
        } catch (error) {
          results.failed++;
          results.errors.push(`Row ${i + 1} (${vendor.name}): ${error.response?.data?.message || error.message}`);
        }
      }

      setImportResults(results);

      // Show results
      const resultText = `Successfully imported: ${results.success}\nFailed: ${results.failed}`;
      
      if (results.success > 0) {
        Swal.fire({
          title: 'Import Complete!',
          text: resultText,
          icon: results.failed === 0 ? 'success' : 'warning',
          confirmButtonText: 'OK'
        });
        
        await fetchVendors();
        setShowImportModal(false);
        resetImportData();
      } else {
        Swal.fire({
          title: 'Import Failed',
          text: 'No vendors were imported successfully.',
          icon: 'error'
        });
      }

    } catch (error) {
      console.error('Import error:', error);
      Swal.fire({
        title: 'Import Error',
        text: 'Failed to import vendors',
        icon: 'error'
      });
    } finally {
      setImporting(false);
    }
  };

  // Reset import data
  const resetImportData = () => {
    setImportFile(null);
    setImportData([]);
    setImportPreview([]);
    setImportResults(null);
  };

  // Download sample CSV template
  const downloadTemplate = () => {
    const sampleData = [
      {
        'Name': 'Tech Solutions Inc',
        'Email': 'contact@techsolutions.com, info@techsolutions.com',
        'Phone': '+1-234-567-8900',
        'ContactPerson': 'John Smith',
        'Status': 'Active'
      },
      {
        'Name': 'Global Services Ltd',
        'Email': 'support@globalservices.com',
        'Phone': '+1-234-567-8901',
        'ContactPerson': 'Jane Doe',
        'Status': 'Active'
      }
    ];

    const csvContent = [
      'Name,Email,Phone,ContactPerson,Status',
      ...sampleData.map(row => 
        `"${row.Name}","${row.Email}","${row.Phone}","${row.ContactPerson}","${row.Status}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'vendor_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      contactPerson: "",
      status: "Active"
    });
    setEditingVendor(null);
  };

  // Create vendor
  const createVendor = async () => {
    const token = localStorage.getItem('token');
    
    try {
      const response = await axios.post(`${BASE_URL}/api/vendors`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        Swal.fire({
          title: 'Success!',
          text: 'Vendor created successfully',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
        
        await fetchVendors();
        setShowAddModal(false);
        resetForm();
      }
    } catch (error) {
      console.error('Create vendor error:', error);
      Swal.fire({
        title: 'Error',
        text: error.response?.data?.message || 'Failed to create vendor',
        icon: 'error'
      });
    }
  };

  // Update vendor
  const updateVendor = async () => {
    const token = localStorage.getItem('token');
    
    try {
      const response = await axios.put(`${BASE_URL}/api/vendors/${editingVendor.Id}`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        Swal.fire({
          title: 'Success!',
          text: 'Vendor updated successfully',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
        
        await fetchVendors();
        setShowAddModal(false);
        resetForm();
      }
    } catch (error) {
      console.error('Update vendor error:', error);
      Swal.fire({
        title: 'Error',
        text: error.response?.data?.message || 'Failed to update vendor',
        icon: 'error'
      });
    }
  };

  // Delete vendor
  const deleteVendor = async (vendorId) => {
    const vendor = vendors.find(v => v.Id === vendorId);
    const vendorName = vendor ? vendor.Name : 'Unknown';

    const confirm = await Swal.fire({
      title: 'Are you sure?',
      text: `This will deactivate ${vendorName}. You won't be able to revert this!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    });

    if (confirm.isConfirmed) {
      const token = localStorage.getItem('token');
      
      try {
        const response = await axios.delete(`${BASE_URL}/api/vendors/${vendorId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.data.success) {
          setVendors(prevVendors => 
            prevVendors.map(v => 
              v.Id === vendorId ? { ...v, Status: 'Inactive' } : v
            )
          );

          await Swal.fire({
            title: 'Deleted!',
            text: `${vendorName} has been deactivated successfully.`,
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          });
          
          await fetchVendors();
        } else {
          throw new Error(response.data.message || 'Delete operation failed');
        }
      } catch (error) {
        console.error('Delete vendor error:', error);
        
        Swal.fire({
          title: 'Error',
          text: error.response?.data?.message || error.message || 'Failed to delete vendor',
          icon: 'error'
        });
      }
    }
  };

  // Handle form submit
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email) {
      Swal.fire({
        title: 'Validation Error',
        text: 'Name and Email are required fields',
        icon: 'warning'
      });
      return;
    }

    if (editingVendor) {
      updateVendor();
    } else {
      createVendor();
    }
  };

  // Open add modal
  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  // Open edit modal
  const openEditModal = (vendor) => {
    setEditingVendor(vendor);
    setFormData({
      name: vendor.Name || "",
      email: vendor.Email || "",
      phone: vendor.Phone || "",
      contactPerson: vendor.ContactPerson || "",
      status: vendor.Status || "Active"
    });
    setShowAddModal(true);
  };

  // View vendor details
  const viewVendor = (vendor) => {
    setSelectedVendor(vendor);
    setShowViewModal(true);
  };

  // Reset filters
  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
  };

  // Open import modal
  const openImportModal = () => {
    resetImportData();
    setShowImportModal(true);
  };

  // Format multiple emails for display
  const formatEmails = (emailString) => {
    if (!emailString) return '-';
    
    const cleanEmail = sanitizeText(emailString);
    const emails = cleanEmail.split(',').map(email => email.trim()).filter(email => email);
    
    if (emails.length === 0) return '-';
    
    return (
      <div className="vendor-portal-email-list">
        {emails.map((email, index) => (
          <div key={index} className="vendor-portal-email-item">
            <a href={`mailto:${email}`} className="vendor-portal-email-link">
              {email}
            </a>
            {index < emails.length - 1 && <span>, </span>}
          </div>
        ))}
      </div>
    );
  };

  // Single email as link
  const formatSingleEmail = (email) => {
    if (!email) return '-';
    
    const cleanEmail = sanitizeText(email);
    
    return (
      <a href={`mailto:${cleanEmail}`} className="vendor-portal-email-link">
        {cleanEmail}
      </a>
    );
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredVendors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedVendors = filteredVendors.slice(startIndex, startIndex + itemsPerPage);

  // Statistics
  const stats = {
    total: vendors.length,
    active: vendors.filter(v => v.Status === 'Active').length,
    inactive: vendors.filter(v => v.Status === 'Inactive').length
  };

  return (
    <div className="vendor-portal-container">
      {/* Header */}
      <div className="vendor-portal-header">
        <div className="vendor-portal-header-content">
          <h1><Building className="vendor-portal-icon" /> Vendor Management</h1>
          <div className="vendor-portal-header-actions">
            <button 
              className="vendor-portal-btn vendor-portal-btn-secondary" 
              onClick={openImportModal}
            >
              <Upload className="vendor-portal-icon" /> Import Vendors
            </button>
            <button className="vendor-portal-btn vendor-portal-btn-primary" onClick={openAddModal}>
              <Plus className="vendor-portal-icon" /> Add Vendor
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="vendor-portal-stats-container">
        <div className="vendor-portal-stats-card">
          <div className="vendor-portal-stats-card-content">
            <div className="vendor-portal-stats-number">{stats.total}</div>
            <div className="vendor-portal-stats-label">Total Vendors</div>
          </div>
          <Users className="vendor-portal-stats-icon" />
        </div>
        <div className="vendor-portal-stats-card vendor-portal-stats-card-active">
          <div className="vendor-portal-stats-card-content">
            <div className="vendor-portal-stats-number">{stats.active}</div>
            <div className="vendor-portal-stats-label">Active Vendors</div>
          </div>
          <UserCheck className="vendor-portal-stats-icon" />
        </div>
        <div className="vendor-portal-stats-card vendor-portal-stats-card-inactive">
          <div className="vendor-portal-stats-card-content">
            <div className="vendor-portal-stats-number">{stats.inactive}</div>
            <div className="vendor-portal-stats-label">Inactive Vendors</div>
          </div>
          <Building className="vendor-portal-stats-icon" />
        </div>
      </div>

      {/* Controls */}
      <div className="vendor-portal-controls-section">
        <div className="vendor-portal-search-box">
          <Search className="vendor-portal-search-icon" />
          <input
            type="text"
            placeholder="Search vendors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="vendor-portal-filter-controls">
          <div className="vendor-portal-filter-group">
            <label>Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          
          <button className="vendor-portal-btn vendor-portal-btn-link" onClick={resetFilters}>
            <Filter className="vendor-portal-icon" /> Reset
          </button>
        </div>
      </div>

      {/* Vendors Table */}
      {loading ? (
        <div className="vendor-portal-loading-container">
          <div className="vendor-portal-loading-spinner"></div>
          <p>Loading vendors...</p>
        </div>
      ) : (
        <div className="vendor-portal-table-container">
          <table className="vendor-portal-table">
            <thead>
              <tr>
                <th>Company Name</th>
                <th>Contact Person</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedVendors.length > 0 ? (
                paginatedVendors.map((vendor) => (
                  <tr key={vendor.Id}>
                    <td className="vendor-portal-name">{vendor.Name}</td>
                    <td>{vendor.ContactPerson || '-'}</td>
                    <td className="vendor-portal-email-cell">
                      {formatEmails(vendor.Email)}
                    </td>
                    <td>{vendor.Phone || '-'}</td>
                    <td>
                      <span className={`vendor-portal-status-badge ${vendor.Status?.toLowerCase()}`}>
                        {vendor.Status}
                      </span>
                    </td>
                    <td>
                      {vendor.CreatedAt ? 
                        new Date(vendor.CreatedAt).toLocaleDateString() : '-'
                      }
                    </td>
                    <td className="vendor-portal-actions-cell">
                      <button 
                        className="vendor-portal-btn-icon vendor-portal-btn-view" 
                        onClick={() => viewVendor(vendor)}
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        className="vendor-portal-btn-icon vendor-portal-btn-edit" 
                        onClick={() => openEditModal(vendor)}
                        title="Edit Vendor"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        className="vendor-portal-btn-icon vendor-portal-btn-delete" 
                        onClick={() => deleteVendor(vendor.Id)}
                        title="Delete Vendor"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="vendor-portal-no-data">
                    No vendors found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="vendor-portal-pagination-controls">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="vendor-portal-btn vendor-portal-btn-secondary"
          >
            Previous
          </button>
          <span className="vendor-portal-pagination-info">
            Page {currentPage} of {totalPages} 
            ({filteredVendors.length} vendor{filteredVendors.length !== 1 ? 's' : ''})
          </span>
          <button
            onClick={() => setCurrentPage(prev => 
              prev < totalPages ? prev + 1 : prev
            )}
            disabled={currentPage >= totalPages}
            className="vendor-portal-btn vendor-portal-btn-secondary"
          >
            Next
          </button>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="vendor-portal-modal-overlay" onClick={() => setShowImportModal(false)}>
          <div className="vendor-portal-modal-content vendor-portal-import-modal" onClick={(e) => e.stopPropagation()}>
            <div className="vendor-portal-modal-header">
              <h2>Import Vendors</h2>
              <button 
                className="vendor-portal-modal-close"
                onClick={() => setShowImportModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="vendor-portal-import-content">
              {/* File Upload Section */}
              <div className="vendor-portal-import-section">
                <h3>1. Choose File</h3>
                <p>Upload a CSV or Excel file containing vendor information.</p>
                
                <div className="vendor-portal-file-upload">
                  <input
                    type="file"
                    id="vendor-file-upload"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="vendor-file-upload" className="vendor-portal-file-upload-btn">
                    <FileSpreadsheet className="vendor-portal-icon" />
                    Choose File
                  </label>
                  {importFile && (
                    <span className="vendor-portal-file-name">{importFile.name}</span>
                  )}
                </div>

                <div className="vendor-portal-template-section">
                  <p>Don't have a file? Download our template:</p>
                  <button 
                    className="vendor-portal-btn vendor-portal-btn-link"
                    onClick={downloadTemplate}
                  >
                    <Download className="vendor-portal-icon" /> Download CSV Template
                  </button>
                </div>
              </div>

              {/* Preview Section */}
              {importPreview.length > 0 && (
                <div className="vendor-portal-import-section">
                  <h3>2. Preview Data ({importData.length} records found)</h3>
                  <div className="vendor-portal-preview-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Phone</th>
                          <th>Contact Person</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importPreview.map((row, index) => (
                          <tr key={index}>
                            <td>{row.name}</td>
                            <td>{formatSingleEmail(row.email)}</td>
                            <td>{row.phone}</td>
                            <td>{row.contactPerson}</td>
                            <td>{row.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {importData.length > 5 && (
                      <p className="vendor-portal-preview-note">
                        Showing first 5 records. Total: {importData.length}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Results Section */}
              {importResults && (
                <div className="vendor-portal-import-section">
                  <h3>Import Results</h3>
                  <div className="vendor-portal-import-results">
                    <div className="vendor-portal-result-stats">
                      <div className="vendor-portal-result-stat success">
                        <CheckCircle className="vendor-portal-icon" />
                        Success: {importResults.success}
                      </div>
                      <div className="vendor-portal-result-stat error">
                        <AlertCircle className="vendor-portal-icon" />
                        Failed: {importResults.failed}
                      </div>
                    </div>
                    {importResults.errors.length > 0 && (
                      <div className="vendor-portal-error-details">
                        <h4>Error Details:</h4>
                        <ul>
                          {importResults.errors.slice(0, 10).map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                          {importResults.errors.length > 10 && (
                            <li>... and {importResults.errors.length - 10} more errors</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="vendor-portal-modal-actions">
              <button 
                className="vendor-portal-btn vendor-portal-btn-secondary"
                onClick={() => setShowImportModal(false)}
              >
                Close
              </button>
              {importData.length > 0 && !importResults && (
                <button 
                  className="vendor-portal-btn vendor-portal-btn-primary"
                  onClick={importVendors}
                  disabled={importing}
                >
                  {importing ? 'Importing...' : `Import ${importData.length} Vendors`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="vendor-portal-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="vendor-portal-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="vendor-portal-modal-header">
              <h2>{editingVendor ? 'Edit Vendor' : 'Add New Vendor'}</h2>
              <button 
                className="vendor-portal-modal-close"
                onClick={() => setShowAddModal(false)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="vendor-portal-form-grid">
                <div className="vendor-portal-form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="vendor-portal-form-group">
                  <label>Email *</label>
                  <input
                    type="text"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="email1@example.com, email2@example.com"
                    required
                  />
                  <small className="vendor-portal-form-help">
                    You can enter multiple emails separated by commas
                  </small>
                </div>
                
                <div className="vendor-portal-form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="vendor-portal-form-group">
                  <label>Contact Person</label>
                  <input
                    type="text"
                    name="contactPerson"
                    value={formData.contactPerson}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="vendor-portal-form-group">
                  <label>Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
              
              <div className="vendor-portal-modal-actions">
                <button 
                  type="button" 
                  className="vendor-portal-btn vendor-portal-btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="vendor-portal-btn vendor-portal-btn-primary">
                  {editingVendor ? 'Update' : 'Create'} Vendor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedVendor && (
        <div className="vendor-portal-modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="vendor-portal-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="vendor-portal-modal-header">
              <h2>Vendor Details</h2>
              <button 
                className="vendor-portal-modal-close"
                onClick={() => setShowViewModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="vendor-portal-details">
              <div className="vendor-portal-detail-group">
                <label>Name:</label>
                <span>{selectedVendor.Name}</span>
              </div>
              <div className="vendor-portal-detail-group">
                <label>Email:</label>
                <div>
                  {formatEmails(selectedVendor.Email)}
                </div>
              </div>
              <div className="vendor-portal-detail-group">
                <label>Phone:</label>
                <span>{selectedVendor.Phone || '-'}</span>
              </div>
              <div className="vendor-portal-detail-group">
                <label>Contact Person:</label>
                <span>{selectedVendor.ContactPerson || '-'}</span>
              </div>
              <div className="vendor-portal-detail-group">
                <label>Status:</label>
                <span className={`vendor-portal-status-badge ${selectedVendor.Status?.toLowerCase()}`}>
                  {selectedVendor.Status}
                </span>
              </div>
              <div className="vendor-portal-detail-group">
                <label>Created:</label>
                <span>
                  {selectedVendor.CreatedAt ? 
                    new Date(selectedVendor.CreatedAt).toLocaleString() : '-'
                  }
                </span>
              </div>
              <div className="vendor-portal-detail-group">
                <label>Updated:</label>
                <span>
                  {selectedVendor.UpdatedAt ? 
                    new Date(selectedVendor.UpdatedAt).toLocaleString() : '-'
                  }
                </span>
              </div>
            </div>
            
            <div className="vendor-portal-modal-actions">
              <button 
                className="vendor-portal-btn vendor-portal-btn-secondary"
                onClick={() => setShowViewModal(false)}
              >
                Close
              </button>
              <button 
                className="vendor-portal-btn vendor-portal-btn-primary"
                onClick={() => {
                  setShowViewModal(false);
                  openEditModal(selectedVendor);
                }}
              >
                Edit Vendor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorManagement;