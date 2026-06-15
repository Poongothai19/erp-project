import React from 'react';
import { Plus, Building as C2CIcon, Eye, Edit3, Trash2 } from 'lucide-react';

const C2CRow = React.memo(({ contractor, onView, onEdit, onDelete }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return 'Invalid Date';
    }
  };

  return (
    <div className="mts-employee-table-table-row">
      <div>
        <button
          onClick={() => onView(contractor)}
          className="mts-employee-name-btn"
        >
          {contractor.contractorName || 'Unknown Contractor'}
        </button>
      </div>
      <div>
        <div style={{ fontSize: '14px', fontWeight: '500' }}>{contractor.companyName || 'N/A'}</div>
      </div>
      <div className="mts-contact-email" style={{ fontSize: '14px', wordBreak: 'break-all' }}>
        {contractor.email || 'N/A'}
      </div>
      <div className="mts-contact-phone" style={{ fontSize: '14px' }}>
        {contractor.phone || 'N/A'}
      </div>
      <div>
        <div style={{ fontWeight: '600', color: '#10b981' }}>
          {contractor.billRate && contractor.billRate > 0 
            ? `$${parseFloat(contractor.billRate).toFixed(2)}/hr`
            : 'N/A'
          }
        </div>
      </div>
      <div>
        <div style={{ fontSize: '0.875rem' }}>
          {formatDate(contractor.poStartDate)} - {formatDate(contractor.poEndDate)}
        </div>
      </div>
      <div>
        <span className={`mts-status-badge ${
          contractor.status === 'Active' ? 'mts-status-registered' : 'mts-status-pending'
        }`}>
          {contractor.status || 'Active'}
        </span>
      </div>
      <div className="mts-actions">
        <button 
          className="mts-action-btn view"
          onClick={() => onView(contractor)}
          title="View Contractor Details"
        >
          <Eye size={14} />
        </button>
        <button 
          className="mts-action-btn"
          onClick={() => onEdit(contractor)}
          title="Edit Contractor"
        >
          <Edit3 size={14} />
        </button>
        <button 
          className="mts-action-btn delete"
          onClick={() => onDelete(contractor.id)}
          title="Delete Contractor"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.contractor.id === nextProps.contractor.id &&
    prevProps.contractor.contractorName === nextProps.contractor.contractorName &&
    prevProps.contractor.companyName === nextProps.contractor.companyName &&
    prevProps.contractor.email === nextProps.contractor.email &&
    prevProps.contractor.phone === nextProps.contractor.phone &&
    prevProps.contractor.billRate === nextProps.contractor.billRate &&
    prevProps.contractor.status === nextProps.contractor.status &&
    prevProps.onView === nextProps.onView &&
    prevProps.onEdit === nextProps.onEdit &&
    prevProps.onDelete === nextProps.onDelete
  );
});

C2CRow.displayName = 'C2CRow';

const C2CView = React.memo(({ 
  c2cData, 
  c2cLoading, 
  onAddC2C, 
  onViewC2C, 
  onEditC2C, 
  onDeleteC2C 
}) => {
  return (
    <div className="mts-employee-table mts-c2c-view">
      <div className="mts-employee-table-header-container">
        <h2 className="mts-employee-table-title">C2C Management ({c2cData?.length || 0})</h2>
        <button 
          onClick={onAddC2C}
          className="mts-add-employee-btn"
        >
          <Plus size={16} />
          Add Contractor
        </button>
      </div>
      
      {c2cLoading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading C2C contractors...</p>
        </div>
      ) : c2cData && c2cData.length > 0 ? (
        <>
          <div className="mts-employee-table-table-header">
            <div>Contractor Name</div>
            <div>Company Name</div>
            <div>Email</div>
            <div>Phone</div>
            <div>Bill Rate</div>
            <div>Contract Period</div>
            <div>Status</div>
            <div style={{ textAlign: 'center' }}>Actions</div>
          </div>
          
          <div className="mts-employee-table-table-rows">
            {c2cData.map(contractor => (
              <C2CRow
                key={contractor.id}
                contractor={contractor}
                onView={onViewC2C}
                onEdit={onEditC2C}
                onDelete={onDeleteC2C}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="no-data">
          <C2CIcon size={48} />
          <p>No C2C contractors found</p>
          <button 
            onClick={onAddC2C}
            className="mts-add-employee-btn"
          >
            <Plus size={16} />
            Add Contractor
          </button>
        </div>
      )}
    </div>
  );
});

C2CView.displayName = 'C2CView';

export default C2CView;
