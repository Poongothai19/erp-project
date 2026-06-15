import React from 'react';
import ModalOverlay from './ModalOverlay';
import ModalHeader from './ModalHeader';
import FormFieldGroup from './FormFieldGroup';
import InputField from './InputField';

const InvoiceDetailsModal = React.memo(({ 
  isOpen, 
  invoice,
  onClose 
}) => {
  if (!isOpen || !invoice) return null;

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
      case 'Paid':
        return '#10b981';
      case 'Sent':
        return '#3b82f6';
      case 'Overdue':
        return '#ef4444';
      case 'Draft':
        return '#6b7280';
      case 'Cancelled':
        return '#9ca3af';
      default:
        return '#6b7280';
    }
  };

  return (
    <ModalOverlay isOpen={isOpen} onClose={onClose}>
      <div className="mts-emp-modal-content" style={{ maxWidth: '700px' }}>
        <ModalHeader title="Invoice Details" onClose={onClose} />
        
        <div className="mts-emp-modal-body">
          <div className="mts-emp-form-grid">
            {/* Invoice Header */}
            <div style={{ gridColumn: '1 / -1', marginBottom: '1.5rem' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                paddingBottom: '1rem',
                borderBottom: '2px solid #e5e7eb'
              }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>
                    {invoice.invoiceNumber}
                  </h3>
                  <p style={{ margin: '4px 0 0 0', color: '#6b7280' }}>
                    {invoice.contractorName}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    color: '#10b981',
                    marginBottom: '0.5rem'
                  }}>
                    {formatCurrency(invoice.amount)}
                  </div>
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
              </div>
            </div>

            {/* Invoice Number and Dates */}
            <div className="mts-emp-form-row">
              <FormFieldGroup label="Invoice Number">
                <InputField value={invoice.invoiceNumber} disabled={true} />
              </FormFieldGroup>
              <FormFieldGroup label="Issue Date">
                <InputField value={formatDate(invoice.issueDate)} disabled={true} />
              </FormFieldGroup>
            </div>

            {/* Due Date and Payment Terms */}
            <div className="mts-emp-form-row">
              <FormFieldGroup label="Due Date">
                <InputField value={formatDate(invoice.dueDate)} disabled={true} />
              </FormFieldGroup>
              <FormFieldGroup label="Payment Terms">
                <InputField value={invoice.paymentTerms} disabled={true} />
              </FormFieldGroup>
            </div>

            {/* Contractor Details */}
            <div style={{
              gridColumn: '1 / -1',
              paddingTop: '1rem',
              borderTop: '2px solid #e5e7eb'
            }}>
              <h4 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#1f2937',
                margin: '0 0 1rem 0'
              }}>
                Contractor Information
              </h4>
            </div>

            <div className="mts-emp-form-row">
              <FormFieldGroup label="Contractor Name">
                <InputField value={invoice.contractorName} disabled={true} />
              </FormFieldGroup>
              <FormFieldGroup label="Company">
                <InputField value={invoice.companyName} disabled={true} />
              </FormFieldGroup>
            </div>

            <div className="mts-emp-form-row">
              <FormFieldGroup label="Email">
                <InputField type="email" value={invoice.email} disabled={true} />
              </FormFieldGroup>
            </div>

            {/* Description and Notes */}
            <div style={{
              gridColumn: '1 / -1',
              paddingTop: '1rem',
              borderTop: '2px solid #e5e7eb'
            }}>
              <h4 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#1f2937',
                margin: '0 0 1rem 0'
              }}>
                Details
              </h4>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <FormFieldGroup label="Description">
                <textarea
                  value={invoice.description}
                  disabled={true}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontFamily: 'inherit',
                    lineHeight: '1.5',
                    minHeight: '80px',
                    backgroundColor: '#f9fafb',
                    color: '#6b7280'
                  }}
                />
              </FormFieldGroup>
            </div>

            {invoice.notes && (
              <div style={{ gridColumn: '1 / -1' }}>
                <FormFieldGroup label="Notes">
                  <textarea
                    value={invoice.notes}
                    disabled={true}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      fontFamily: 'inherit',
                      lineHeight: '1.5',
                      minHeight: '60px',
                      backgroundColor: '#f9fafb',
                      color: '#6b7280'
                    }}
                  />
                </FormFieldGroup>
              </div>
            )}
          </div>
        </div>
        
        <div className="mts-emp-modal-actions">
          <button 
            onClick={onClose}
            className="mts-emp-modal-btn mts-emp-modal-btn-cancel"
            type="button"
          >
            Close
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
});

InvoiceDetailsModal.displayName = 'InvoiceDetailsModal';

export default InvoiceDetailsModal;
