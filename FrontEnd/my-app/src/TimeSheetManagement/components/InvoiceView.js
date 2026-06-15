import React from 'react';
import { Plus, FileText, Eye, Edit3, Trash2 } from 'lucide-react';

const InvoiceView = React.memo(({ 
  invoiceData, 
  invoiceLoading, 
  invoiceHandlers 
}) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Paid': return '#10b981';
      case 'Sent': return '#3b82f6';
      case 'Overdue': return '#ef4444';
      case 'Draft': return '#6b7280';
      case 'Cancelled': return '#9ca3af';
      default: return '#6b7280';
    }
  };

  return (
    <div className="mts-employee-table mts-invoice-view">
      <div className="mts-employee-table-header-container">
        <h2 className="mts-employee-table-title">Invoice Management ({invoiceData.length})</h2>
        <button 
          onClick={invoiceHandlers.handleAddInvoice}
          className="mts-add-employee-btn"
        >
          <Plus size={16} />
          Create Invoice
        </button>
      </div>
      
      {invoiceLoading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading invoices...</p>
        </div>
      ) : invoiceData.length > 0 ? (
        <>
          <div className="mts-employee-table-table-header">
            <div>Invoice Number</div>
            <div>Description</div>
            <div>Contractor Name</div>
            <div>Email</div>
            <div>Amount</div>
            <div>Due Date</div>
            <div>Status</div>
            <div style={{ textAlign: 'center' }}>Actions</div>
          </div>
          
          <div className="mts-employee-table-table-rows">
            {invoiceData.map(invoice => (
              <div key={invoice.id} className="mts-employee-table-table-row">
                <div>
                  <button
                    onClick={() => invoiceHandlers.handleViewInvoice(invoice)}
                    className="mts-employee-name-btn"
                  >
                    {invoice.invoiceNumber}
                  </button>
                </div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>
                  {invoice.description}
                </div>
                <div style={{ fontSize: '14px', fontWeight: '500' }}>
                  {invoice.contractorName}
                </div>
                <div className="mts-contact-email" style={{ fontSize: '14px', wordBreak: 'break-all' }}>
                  {invoice.email || 'N/A'}
                </div>
                <div>
                  <div style={{ fontWeight: '600', color: '#10b981', fontSize: '1.1rem' }}>
                    {formatCurrency(invoice.amount)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem' }}>
                    {formatDate(invoice.dueDate)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                    Issued: {formatDate(invoice.issueDate)}
                  </div>
                </div>
                <div>
                  <span style={{
                    display: 'inline-block',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '0.5rem',
                    fontSize: '12px',
                    fontWeight: '600',
                    backgroundColor: `${getStatusColor(invoice.status)}20`,
                    color: getStatusColor(invoice.status),
                    border: `1px solid ${getStatusColor(invoice.status)}`
                  }}>
                    {invoice.status}
                  </span>
                </div>
                <div className="mts-actions">
                  <button 
                    className="mts-action-btn view"
                    onClick={() => invoiceHandlers.handleViewInvoice(invoice)}
                    title="View Invoice Details"
                  >
                    <Eye size={14} />
                  </button>
                  <button 
                    className="mts-action-btn"
                    onClick={() => invoiceHandlers.handleEditInvoice(invoice)}
                    title="Edit Invoice"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button 
                    className="mts-action-btn delete"
                    onClick={() => invoiceHandlers.handleDeleteInvoice(invoice.id)}
                    title="Delete Invoice"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="no-data">
          <FileText size={48} />
          <p>No invoices found</p>
          <button 
            onClick={invoiceHandlers.handleAddInvoice}
            className="mts-add-employee-btn"
          >
            <Plus size={16} />
            Create Invoice
          </button>
        </div>
      )}
    </div>
  );
});

InvoiceView.displayName = 'InvoiceView';

export default InvoiceView;
