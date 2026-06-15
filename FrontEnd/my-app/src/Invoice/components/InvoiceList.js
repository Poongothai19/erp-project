import React, { useState, useEffect } from 'react';
import { 
  LuFilePlus, 
  LuDownload, 
  LuEye, 
  LuPen,
  LuTrash2,
  LuSearch,
  LuMail,
} from "react-icons/lu";
import InvoiceForm from './InvoiceForm';
import InvoicePreview from './InvoicePreview';
import invoiceService from '../utils/invoiceService';
import { generateInvoicePDF } from '../utils/pdfGenerator';
import prophecyLogo from '../../Recruitment/Assets/images/PROPHECY-LOGO-DARK.png';
import '../styles/Invoice.css';

const InvoiceList = () => {
  const [invoices, setInvoices] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const response = await invoiceService.getInvoices();
      if (response.success) {
        // Map backend SQL naming to frontend naming if necessary
        const mappedData = response.data.map(inv => ({
          id: inv.Id,
          invoiceNo: inv.InvoiceNo,
          date: inv.InvoiceDate ? new Date(inv.InvoiceDate).toISOString().split('T')[0] : '',
          dueDate: inv.DueDate ? new Date(inv.DueDate).toISOString().split('T')[0] : '',
          companyName: inv.CompanyName,
          email: inv.Email,
          amount: `${inv.Currency || 'INR'} ${parseFloat(inv.TotalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
          status: inv.Status,
          // Store full object for edit/preview
          raw: inv
        }));
        setInvoices(mappedData);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
      alert('Failed to load invoices from server');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvoice = () => {
    setSelectedInvoice(null);
    setShowForm(true);
  };

  const handleEdit = async (invoice) => {
    try {
      setLoading(true);
      const response = await invoiceService.getInvoiceById(invoice.id);
      if (response.success) {
        setSelectedInvoice(normalizeInvoiceData(response.data));
        setShowForm(true);
      }
    } catch (error) {
      alert('Error fetching invoice details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (invoiceId, newStatus) => {
    try {
      const response = await invoiceService.updateInvoiceStatus(invoiceId, newStatus);
      if (response.success) {
        setInvoices(invoices.map(inv => inv.id === invoiceId ? { ...inv, status: newStatus } : inv));
      }
    } catch (error) {
      alert('Error updating status');
    }
  };

  const handleSendEmail = async (invoiceId) => {
    try {
      setLoading(true);
      
      // 1. Get full invoice details (to ensure we have all items, addresses for the PDF)
      const fetchResponse = await invoiceService.getInvoiceById(invoiceId);
      if (!fetchResponse.success) throw new Error('Could not fetch invoice details');
      const invoiceData = fetchResponse.data;

      // 2. Generate PDF in the browser (pass logo so it appears in the emailed PDF)
      const doc = generateInvoicePDF({ ...invoiceData, logo: prophecyLogo });
      const pdfBase64 = doc.output('datauristring').split(',')[1]; // Get raw base64 string
      
      // 3. Send email via backend with PDF attachment
      // Backend will AUTOMATICALLY fetch and attach all timesheet files from database
      const response = await invoiceService.sendInvoiceEmail(invoiceId, {
        base64: pdfBase64,
        filename: `Invoice-${invoiceData.invoiceNo}.pdf`
      });

      if (response.success) {
        alert('Invoice PDF and all attachments sent to client successfully!');
        setInvoices(invoices.map(inv => inv.id === invoiceId ? { ...inv, status: 'Sent' } : inv));
      }
    } catch (error) {
      console.error('Error sending email:', error);
      const errorMsg = error.response?.data?.message || error.message;
      const details = error.response?.data?.details ? `\nDetails: ${JSON.stringify(error.response.data.details)}` : '';
      alert('Error sending email: ' + errorMsg + details);
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async (invoice) => {
    try {
      setLoading(true);
      const response = await invoiceService.getInvoiceById(invoice.id);
      if (response.success) {
        setSelectedInvoice(normalizeInvoiceData(response.data));
        setShowPreview(true);
      }
    } catch (error) {
      alert('Error fetching invoice for preview');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (invoiceId) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        const response = await invoiceService.deleteInvoice(invoiceId);
        if (response.success) {
          setInvoices(invoices.filter(inv => inv.id !== invoiceId));
          alert('Invoice deleted successfully');
        }
      } catch (error) {
        alert('Error deleting invoice');
      }
    }
  };

  const normalizeInvoiceData = (inv) => {
    return {
      ...inv,
      id: inv.Id || inv.id,
      invoiceNo: inv.InvoiceNo || inv.invoiceNo,
      invoiceDate: inv.InvoiceDate || inv.invoiceDate,
      dueDate: inv.DueDate || inv.dueDate,
      companyName: inv.CompanyName || inv.companyName,
      email: inv.Email || inv.email,
      totalAmount: inv.TotalAmount || inv.totalAmount,
      currency: inv.Currency || inv.currency,
      status: inv.Status || inv.status,
      billingAddress: inv.billingAddress || (inv.Street1 ? {
        street1: inv.Street1,
        city: inv.City,
        state: inv.State,
        zipCode: inv.ZipCode
      } : {}),
      bankDetails: inv.bankDetails || (inv.AccountName ? {
        accountName: inv.AccountName,
        bankName: inv.BankName,
        accountNo: inv.AccountNo,
        branch: inv.Branch,
        ifscCode: inv.IfscCode
      } : {}),
      items: inv.items || []
    };
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.invoiceNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || invoice.status?.toLowerCase() === statusFilter.toLowerCase();
    
    const matchesDate = (!fromDate || invoice.date >= fromDate) && 
                       (!toDate || invoice.date <= toDate);
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredInvoices.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, fromDate, toDate]);

  return (
    <div className="inv-module-container">
      <div className="inv-module-header">
        <div>
          <h1 className="inv-module-title">Invoices</h1>
          <p className="inv-module-subtitle">Manage and send invoices to clients</p>
        </div>
        <button className="inv-module-btn-primary" onClick={handleCreateInvoice}>
          <LuFilePlus size={20} /> Create Invoice
        </button>
      </div>

      <div className="inv-module-stats-grid">
        <div className="inv-module-stat-card">
          <h3 className="inv-module-stat-title">Total Invoices</h3>
          <p className="inv-module-stat-value">{invoices.length}</p>
        </div>
        <div className="inv-module-stat-card">
          <h3 className="inv-module-stat-title">Pending</h3>
          <p className="inv-module-stat-value pending">
            {invoices.filter(inv => inv.status === 'Pending').length}
          </p>
        </div>
        <div className="inv-module-stat-card">
          <h3 className="inv-module-stat-title">Paid</h3>
          <p className="inv-module-stat-value paid">
            {invoices.filter(inv => inv.status === 'Paid').length}
          </p>
        </div>
        <div className="inv-module-stat-card">
          <h3 className="inv-module-stat-title">Overdue</h3>
          <p className="inv-module-stat-value overdue">
            {invoices.filter(inv => inv.status === 'Overdue').length}
          </p>
        </div>
      </div>

      <div className="inv-module-filters">
        <div style={{ position: 'relative', flex: '2', minWidth: '300px' }}>
          <LuSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} size={20} />
          <input 
            type="text" 
            className="inv-module-filter-input"
            style={{ paddingLeft: '40px', width: '100%' }}
            placeholder="Search by invoice number, company name, or email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          className="inv-module-filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="sent">Sent</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="overdue">Overdue</option>
          <option value="draft">Draft</option>
        </select>
        <input 
          type="date" 
          className="inv-module-filter-input"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
        />
        <input 
          type="date" 
          className="inv-module-filter-input"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
        />
      </div>

      <div className="inv-module-table-container">
        <table className="inv-module-table">
          <thead>
            <tr>
              <th>Invoice No.</th>
              <th>Date</th>
              <th>Company Name</th>
              <th>Email</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Due Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && !invoices.length ? (
              <tr>
                <td colSpan="8" className="inv-module-loading">
                  Loading invoices...
                </td>
              </tr>
            ) : filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan="8" className="inv-module-empty-state">
                  <div className="inv-module-empty-icon">📄</div>
                  <div className="inv-module-empty-title">No invoices found</div>
                </td>
              </tr>
            ) : (
              currentItems.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="inv-module-invoice-number">{invoice.invoiceNo}</td>
                  <td>{invoice.date}</td>
                  <td className="inv-module-customer-name">{invoice.companyName}</td>
                  <td className="inv-module-customer-email">
                    {invoice.email && invoice.email.includes(',') ? (
                      <span title={invoice.email.split(',').map(e => e.trim()).join('\n')}>
                        {invoice.email.split(',')[0].trim()}...
                      </span>
                    ) : (
                      invoice.email
                    )}
                  </td>
                  <td className="inv-module-amount">{invoice.amount}</td>
                  <td>
                    <select 
                      className={`inv-module-status-select ${invoice.status?.toLowerCase()}`}
                      value={invoice.status || 'Draft'}
                      onChange={(e) => handleStatusChange(invoice.id, e.target.value)}
                    >
                      <option value="Draft">Draft</option>
                      <option value="Pending">Pending</option>
                      <option value="Sent">Sent</option>
                      <option value="Paid">Paid</option>
                      <option value="Overdue">Overdue</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td>{invoice.dueDate}</td>
                  <td className="inv-module-actions-cell">
                    <div className="inv-module-actions">
                      <button 
                        onClick={() => handleSendEmail(invoice.id)} 
                        className="inv-module-action-btn email" 
                        title="Send Email to Client"
                      >
                        <LuMail size={16} />
                      </button>
                      <button 
                        onClick={() => handlePreview(invoice)} 
                        className="inv-module-action-btn view" 
                        title="Preview"
                      >
                        <LuEye size={16} />
                      </button>
                      <button 
                        onClick={() => handleEdit(invoice)} 
                        className="inv-module-action-btn edit" 
                        title="Edit"
                      >
                        <LuPen size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(invoice.id)} 
                        className="inv-module-action-btn delete" 
                        title="Delete"
                      >
                        <LuTrash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="inv-module-modal-overlay">
          <InvoiceForm
            invoice={selectedInvoice}
            onClose={() => {
              setShowForm(false);
              fetchInvoices();
            }}
            onSave={async (data) => {
              try {
                let result;
                if (selectedInvoice && selectedInvoice.id) {
                  await invoiceService.updateInvoice(selectedInvoice.id, data);
                  result = { id: selectedInvoice.id };
                } else {
                  const createResult = await invoiceService.createInvoice(data);
                  result = { id: createResult?.data?.id };
                }
                return result;
              } catch (error) {
                alert('Error saving invoice');
                throw error;
              }
            }}
          />
        </div>
      )}

      {showPreview && (
        <div className="inv-module-modal-overlay">
          <InvoicePreview
            invoice={selectedInvoice}
            onClose={() => setShowPreview(false)}
          />
        </div>
      )}

      {/* Pagination UI */}
      {totalPages > 1 && (
        <div className="inv-module-pagination">
          <button 
            onClick={() => paginate(currentPage - 1)} 
            disabled={currentPage === 1}
            className="inv-module-page-btn"
          >
            &laquo; Previous
          </button>
          
          <div className="inv-module-page-numbers">
            {(() => { const pages = []; if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) pages.push(i); } else { pages.push(1); if (currentPage > 4) pages.push("..."); let start = Math.max(2, currentPage - 1); let end = Math.min(totalPages - 1, currentPage + 1); if (currentPage <= 4) { start = 2; end = 5; } else if (currentPage >= totalPages - 3) { start = totalPages - 4; end = totalPages - 1; } for (let i = start; i <= end; i++) pages.push(i); if (currentPage < totalPages - 3) pages.push("..."); pages.push(totalPages); } return pages.map((page, index) => ( <button key={index} onClick={() => typeof page === "number" && paginate(page)} className={`inv-module-page-number ${currentPage === page ? "active" : ""} ${typeof page !== "number" ? "ellipsis" : ""}`} disabled={typeof page !== "number"} > {page} </button> )); })()}
          </div>

          <button 
            onClick={() => paginate(currentPage + 1)} 
            disabled={currentPage === totalPages}
            className="inv-module-page-btn"
          >
            Next &raquo;
          </button>
        </div>
      )}
    </div>
  );
};

export default InvoiceList;
