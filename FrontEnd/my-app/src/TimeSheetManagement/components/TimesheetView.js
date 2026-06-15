import React, { useState } from 'react';
import { ClipboardList, Check, X, ChevronLeft, ChevronRight, Trash2, FileSpreadsheet } from 'lucide-react';

const TimesheetView = React.memo(({ 
  timesheets, 
  loading, 
  computedValues, 
  timesheetHandlers, 
  formatDate 
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // Pagination logic
  const totalPages = Math.ceil(timesheets.length / rowsPerPage);
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = timesheets.slice(indexOfFirstRow, indexOfLastRow);

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  // Reset to page 1 if data changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [timesheets.length]);

  return (
    <div className="mts-employee-table">
      <div className="mts-employee-table-header-container">
        <h2 className="mts-employee-table-title">Timesheet Approval</h2>
        <div className="mts-bulk-actions">
          <button 
            onClick={timesheetHandlers.handleBulkApprove}
            disabled={!computedValues.hasSelectedTimesheets}
            className="mts-bulk-approve-btn"
          >
            <Check size={16} />
            Approve Selected ({computedValues.selectedCount})
          </button>
          <button 
            onClick={timesheetHandlers.handleBulkReject}
            disabled={!computedValues.hasSelectedTimesheets}
            className="mts-bulk-reject-btn"
          >
            <X size={16} />
            Reject Selected ({computedValues.selectedCount})
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading timesheets...</p>
        </div>
      ) : timesheets.length > 0 ? (
        <>
          <div className="mts-employee-table-table-header" style={{ display: 'grid', gridTemplateColumns: '40px 1fr 1.5fr 0.8fr 0.8fr 1fr 1.2fr 0.8fr', gap: '0.5rem', padding: '0.75rem 1.5rem', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
            <div>
              <input
                type="checkbox"
                checked={computedValues.allPendingTimesheetsSelected}
                onChange={timesheetHandlers.handleSelectAllTimesheets}
                disabled={computedValues.pendingCount === 0}
              />
            </div>
            <div>Employee</div>
            <div>Period</div>
            <div>Hours</div>
            <div>Overtime</div>
            <div style={{ textAlign: 'center' }}>Status</div>
            <div>Approver</div>
            <div style={{ textAlign: 'center' }}>Actions</div>
          </div>
          
          <div className="mts-employee-table-table-rows">
            {currentRows.map(timesheet => (
              <div 
                key={timesheet.id} 
                className="mts-employee-table-table-row" 
                onClick={() => timesheetHandlers.handleViewTasks(timesheet)}
                style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '40px 1fr 1.5fr 0.8fr 0.8fr 1fr 1.2fr 0.8fr', 
                  gap: '0.5rem', 
                  padding: '6px 1.5rem', 
                  alignItems: 'center',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    checked={timesheet.selected || false}
                    onChange={() => timesheetHandlers.handleSelectTimesheet(timesheet.id)}
                    disabled={timesheet.status !== 'Pending'}
                  />
                </div>
                
                <div>
                  <div 
                    className="mts-employee-name"
                    style={{ 
                      color: '#10b981',
                      fontWeight: '600'
                    }}
                  >
                    {timesheet.employeeName}
                  </div>
                  <div className="mts-contact-email">{timesheet.EmployeeCode || timesheet.employeeCode || 'No Code'}</div>
                </div>

                <div>
                  <div className="mts-period">
                    {(() => {
                      const startStr = formatDate(timesheet.periodStart);
                      const dateStr = String(timesheet.periodEnd).split('T')[0];
                      const [y, m, d] = dateStr.split('-').map(Number);
                      const endObj = new Date(y, m - 1, d);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      
                      // If pending and period ends in the future, show up to today
                      if (timesheet.status === 'Pending' && endObj > today) {
                        return `${startStr} - ${formatDate(today)}`;
                      }
                      return `${startStr} - ${formatDate(timesheet.periodEnd)}`;
                    })()}
                  </div>
                </div>
                <div>
                  <div className="mts-hours">{timesheet.totalHours} hours</div>
                </div>
                <div>
                  <div className="mts-overtime">{timesheet.overtimeHours || 0} hours</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <div className="mts-timesheet-status">
                    <span className={`mts-status-badge ${
                      timesheet.status === 'Approved' ? 'mts-status-registered' :
                      timesheet.status === 'Rejected' ? 'mts-status-pending' : 'mts-status-pending'
                    }`}
                    style={{
                      display: 'inline-flex',
                      width: 'fit-content',
                      padding: '4px 12px',
                      justifyContent: 'center'
                    }}>
                      {timesheet.status}
                    </span>
                  </div>
                </div>
                  <div style={{ fontSize: '13px', fontWeight: '500', color: timesheet.status === 'Approved' ? '#059669' : timesheet.status === 'Rejected' ? '#ef4444' : '#6b7280' }}>
                    {(timesheet.status === 'Approved' || timesheet.status === 'Rejected') ? (timesheet.ApproverName && timesheet.ApproverName !== 'N/A' ? timesheet.ApproverName : '—') : '—'}
                  </div>
                <div className="mts-actions" onClick={(e) => e.stopPropagation()} style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                  {timesheet.status === 'Pending' && (
                    <>
                      <button 
                        className="mts-action-btn approve"
                        onClick={(e) => { e.stopPropagation(); timesheetHandlers.handleApproveTimesheet(timesheet.id); }}
                        title="Approve Timesheet"
                      >
                        <Check size={14} />
                      </button>
                      <button 
                        className="mts-action-btn reject"
                        onClick={(e) => { e.stopPropagation(); timesheetHandlers.handleRejectTimesheet(timesheet.id); }}
                        title="Reject Timesheet"
                      >
                        <X size={14} />
                      </button>
                    </>
                  )}
                  <button 
                    className="mts-action-btn delete"
                    onClick={(e) => { e.stopPropagation(); timesheetHandlers.handleDeleteTimesheet(timesheet.id); }}
                    title="Delete Timesheet"
                    style={{ color: '#ef4444' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mts-pagination">
              <button 
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className="mts-pagination-btn"
              >
                <ChevronLeft size={16} />
                Previous
              </button>
              
              <div className="mts-pagination-info">
                Page {currentPage} of {totalPages}
              </div>

              <button 
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="mts-pagination-btn"
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="no-data">
          <ClipboardList size={48} />
          <p>No timesheets found</p>
        </div>
      )}
    </div>
  );
});

TimesheetView.displayName = 'TimesheetView';

export default TimesheetView;