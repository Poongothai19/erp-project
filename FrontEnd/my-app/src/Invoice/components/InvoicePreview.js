import React from 'react';
import { LuX, LuDownload } from 'react-icons/lu';
import { downloadInvoicePDF } from '../utils/pdfGenerator';
import prophecyLogo from '../../Recruitment/Assets/images/PROPHECY-LOGO-DARK.png';

const InvoicePreview = ({ invoice, onClose }) => {
  const safeNumber = (value) => {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const num = parseFloat(value);
      return isNaN(num) ? 0 : num;
    }
    return 0;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  const getCurrencySymbol = (currency) => {
    if (currency === 'INR') return '';
    if (currency === 'USD') return '$';
    if (currency === 'EUR') return '€';
    return currency || '';
  };

  // Format amount without currency symbol for INR
  const formatAmount = (value, currency) => {
    const num = safeNumber(value);
    if (currency === 'INR') {
      return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    const symbol = getCurrencySymbol(currency);
    return `${symbol} ${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Get header labels based on currency
  const getUnitPriceHeader = (currency) => {
    if (currency === 'INR') return 'UNIT PRICE (INR)';
    return 'UNIT PRICE';
  };

  const getTotalHeader = (currency) => {
    if (currency === 'INR') return 'TOTAL (INR)';
    return 'TOTAL';
  };

  const calculateTotals = () => {
    const items = invoice?.items || [];
    const subtotal = items.reduce((sum, item) => {
      const amount = safeNumber(item.amount);
      return sum + amount;
    }, 0);
    
    const igstRate = safeNumber(invoice?.igstRate ?? 0);
    let igstAmount = invoice?.igstAmount ? safeNumber(invoice.igstAmount) : (invoice?.totals?.igstAmount ? safeNumber(invoice.totals.igstAmount) : 0);
    
    // Auto-calculate if rate is present but amount is 0
    if (igstAmount === 0 && igstRate > 0) {
      igstAmount = (subtotal * igstRate) / 100;
    }

    const total = invoice?.totals?.total ? safeNumber(invoice.totals.total) : subtotal + igstAmount;
    
    return {
      subtotal: subtotal,
      igstRate: igstRate,
      igstAmount: igstAmount,
      total: total
    };
  };

  const totals = calculateTotals();
  const displayInvoice = invoice || {};
  const currency = displayInvoice.currency || 'INR';

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="inv-module-preview-modal-overlay" 
      onClick={handleOverlayClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 2000,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start', // Support tall modals better
        padding: '40px 20px',
        overflowY: 'auto'
      }}
    >
      <div 
        className="inv-module-preview-modal" 
        style={{ 
          width: '900px', 
          maxWidth: '100%',
          backgroundColor: 'white',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 'none', // Allow full height if needed, but we'll use a container limit
          minHeight: '400px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
          margin: '0 auto' 
        }}
      >
        <div className="inv-module-preview-modal-header" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 24px',
          borderBottom: '1px solid #e5e7eb',
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          borderRadius: '16px 16px 0 0',
          flexShrink: 0
        }}>
          <h2 className="inv-module-modal-title" style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>Invoice Preview</h2>
          <button 
            className="inv-module-modal-close" 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <LuX size={24} />
          </button>
        </div>

        <div 
          className="inv-module-preview-modal-body" 
          style={{ 
            padding: '20px 0',
            backgroundColor: '#f5f7f9',
            flex: '1 0 auto'
          }}
        >
          <div className="inv-module-preview-content" style={{ 
            backgroundColor: 'white', 
            padding: '40px', 
            margin: '0 auto',
            boxShadow: '0 0 10px rgba(0,0,0,0.1)',
            color: '#333',
            fontFamily: 'Arial, sans-serif',
            width: '800px',
            maxWidth: 'calc(100% - 40px)',
            minHeight: '1000px',
            boxSizing: 'border-box'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'flex-start', 
              marginBottom: '40px', 
              minHeight: '80px', 
              flexWrap: 'wrap', 
              gap: '20px' 
            }}>
              <div className="inv-module-preview-logo" style={{ maxWidth: '200px' }}>
                <img src={prophecyLogo} alt="Prophecy" style={{ display: 'block', maxHeight: '70px', maxWidth: '100%', width: 'auto', objectFit: 'contain' }} />
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '14px', lineHeight: '1.8' }}>
                  <div><strong>Invoice No:</strong> {displayInvoice.invoiceNo}</div>
                  <div><strong>Date:</strong> {formatDate(displayInvoice.invoiceDate)}</div>
                  <div><strong>Payment terms:</strong> {displayInvoice.terms}</div>
                  <div><strong>Due Date:</strong> {formatDate(displayInvoice.dueDate)}</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px', flexWrap: 'wrap', gap: '30px' }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <h2 style={{ fontSize: '18px', margin: '0 0 12px 0', color: '#000', fontWeight: 'bold' }}>Prophecy Tek (OPC) Private Limited</h2>
                <div style={{ fontSize: '13px', lineHeight: '1.5', color: '#444' }}>
                  <p style={{ margin: '0 0 4px 0' }}>Plot no.13, Bharathi Nagar 7T</p>
                  <p style={{ margin: '0 0 4px 0' }}>Sangiliyandapuram, Tiruchirapalli, TN 620001</p>
                  <p style={{ margin: '0 0 4px 0' }}>accounts@prophecytechs.com</p>
                  <p style={{ margin: '0 0 4px 0' }}>www.prophecytechs.com</p>
                  <p style={{ margin: '10px 0 4px 0' }}><strong>PAN No:</strong> {displayInvoice.companyPan || 'ABCDE1234F'}</p>
                  <p style={{ margin: '0 0 4px 0' }}><strong>GST No:</strong> {displayInvoice.companyGst || '22AAAAA0000A1Z5'}</p>
                </div>
              </div>
              <div style={{ flex: 1, textAlign: 'right', minWidth: '200px' }}>
                <h3 style={{ fontSize: '16px', margin: '0 0 12px 0', color: '#000', fontWeight: 'bold' }}>BILL TO</h3>
                <div style={{ fontSize: '13px', lineHeight: '1.5', color: '#444' }}>
                  <p style={{ margin: '0 0 4px 0', fontWeight: 'bold', fontSize: '15px', color: '#000' }}>{displayInvoice.companyName || 'tcs'}</p>
                  {displayInvoice.billingAddress?.street1 && <p style={{ margin: '0 0 4px 0' }}>{displayInvoice.billingAddress.street1}</p>}
                  <p style={{ margin: '0 0 4px 0' }}>
                    {displayInvoice.billingAddress?.city && `${displayInvoice.billingAddress.city}, `}
                    {displayInvoice.billingAddress?.state} {displayInvoice.billingAddress?.zipCode}
                  </p>
                  <p style={{ margin: '10px 0 4px 0' }}><strong>PAN No:</strong> {displayInvoice.customerPan}</p>
                  <p style={{ margin: '0 0 4px 0' }}><strong>GST No:</strong> {displayInvoice.customerGst}</p>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '30px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '500px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#019d88', color: 'white' }}>
                    <th style={{ padding: '10px', textAlign: 'left', fontSize: '12px', border: '1px solid #018b78' }}>DATE</th>
                    <th style={{ padding: '10px', textAlign: 'left', fontSize: '12px', border: '1px solid #018b78' }}>DESCRIPTION</th>
                    <th style={{ padding: '10px', textAlign: 'center', fontSize: '12px', border: '1px solid #018b78' }}>QTY</th>
                    <th style={{ padding: '10px', textAlign: 'right', fontSize: '12px', border: '1px solid #018b78' }}>{getUnitPriceHeader(currency)}</th>
                    <th style={{ padding: '10px', textAlign: 'right', fontSize: '12px', border: '1px solid #018b78' }}>{getTotalHeader(currency)}</th>
                  </tr>
                </thead>
                <tbody>
                  {(displayInvoice.items || []).map((item, index) => (
                    <tr key={index}>
                      <td style={{ padding: '10px', fontSize: '12px', border: '1px solid #eee' }}>{formatDate(item.serviceDate || displayInvoice.invoiceDate)}</td>
                      <td style={{ padding: '10px', fontSize: '12px', border: '1px solid #eee' }}>
                        <div style={{ fontWeight: 'bold' }}>{item.productService}</div>
                        {item.description && <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>{item.description}</div>}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center', fontSize: '12px', border: '1px solid #eee' }}>{item.qty}</td>
                      <td style={{ padding: '10px', textAlign: 'right', fontSize: '12px', border: '1px solid #eee' }}>{formatAmount(item.rate, currency)}</td>
                      <td style={{ padding: '10px', textAlign: 'right', fontSize: '12px', border: '1px solid #eee' }}>{formatAmount(item.amount, currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '20px', gap: '40px', flexWrap: 'wrap' }}>
               <div style={{ flex: 1.5, minWidth: '250px' }}>
                 <div style={{ border: '1px solid #ddd', padding: '12px', minHeight: '80px', borderRadius: '4px' }}>
                   <div style={{ fontSize: '11px', color: '#666', fontWeight: 'bold', marginBottom: '5px' }}>NOTES:</div>
                   <div style={{ fontSize: '12px' }}>{displayInvoice.noteToCustomer}</div>
                 </div>
                 
                 <div style={{ marginTop: '30px' }}>
                   <h4 style={{ fontSize: '13px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#000', borderBottom: '1px solid #019d88', paddingBottom: '3px', display: 'inline-block' }}>BANK DETAILS</h4>
                   <div style={{ fontSize: '12px', lineHeight: '1.6', color: '#444' }}>
                     <p style={{ margin: '0' }}><strong>Account Name:</strong> {displayInvoice.bankDetails?.accountName}</p>
                     <p style={{ margin: '0' }}><strong>Bank Name:</strong> {displayInvoice.bankDetails?.bankName}</p>
                     <p style={{ margin: '0' }}><strong>Account No:</strong> {displayInvoice.bankDetails?.accountNo}</p>
                     <p style={{ margin: '0' }}><strong>Branch:</strong> {displayInvoice.bankDetails?.branch}</p>
                     <p style={{ margin: '0' }}><strong>IFSC Code:</strong> {displayInvoice.bankDetails?.ifscCode}</p>
                   </div>
                 </div>
               </div>

               <div style={{ width: '250px', minWidth: '200px' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: '13px' }}>
                   <span>SUB TOTAL</span>
                   <span style={{ fontWeight: 'bold' }}>{formatAmount(totals.subtotal, currency)}</span>
                 </div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: '13px' }}>
                   <span>{currency === 'INR' ? `IGST (${totals.igstRate}%)` : `GST (${totals.igstRate}%)`}</span>
                   <span style={{ fontWeight: 'bold' }}>{formatAmount(totals.igstAmount, currency)}</span>
                 </div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: '2px solid #019d88', marginTop: '5px' }}>
                   <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{currency === 'INR' ? 'TOTAL (INR)' : 'TOTAL'}</span>
                   <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{formatAmount(totals.total, currency)}</span>
                 </div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
                   <span style={{ fontWeight: 'bold', color: '#019d88', fontSize: '16px' }}>{currency === 'INR' ? 'GRAND TOTAL (INR)' : 'GRAND TOTAL'}</span>
                   <span style={{ fontWeight: 'bold', color: '#019d88', fontSize: '16px' }}>{formatAmount(totals.total, currency)}</span>
                 </div>
               </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '60px' }}>
              <div style={{ marginBottom: '20px', fontSize: '20px', color: '#019d88', fontWeight: 'bold', fontStyle: 'italic' }}>
                Thankyou
              </div>
            </div>
          </div>
        </div>

        <div className="inv-module-preview-modal-footer" style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
          padding: '16px 24px',
          borderTop: '1px solid #e5e7eb',
          background: '#f9fafb',
          borderRadius: '0 0 16px 16px',
          flexShrink: 0
        }}>
          <button 
            className="inv-module-btn-secondary" 
            onClick={onClose}
            style={{
              padding: '10px 20px',
              background: 'white',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
          <button 
            className="inv-module-btn-primary" 
            onClick={() => downloadInvoicePDF({ ...displayInvoice, totals, logo: prophecyLogo, currency })}
            style={{
              padding: '10px 20px',
              background: '#019d88',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <LuDownload size={18} /> Download PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoicePreview;