import React, { useState } from 'react';
import { Plus, Filter, Eye, Edit3, Trash2, User, ChevronLeft, ChevronRight } from 'lucide-react';

const EmployeeView = React.memo(({ 
  filteredEmployees, 
  loading, 
  viewState, 
  filterState, 
  modalHandlers, 
  employeeHandlers, 
  navigationHandlers,
  formatDate 
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;

  // Pagination logic
  const totalPages = Math.ceil(filteredEmployees.length / rowsPerPage);
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredEmployees.slice(indexOfFirstRow, indexOfLastRow);

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  // Reset to page 1 if filtered results change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filteredEmployees.length]);

  return (
    <div className="mts-employee-table">
      <div className="mts-employee-table-header-container">
        <h2 className="mts-employee-table-title">Employee Directory ({filteredEmployees.length})</h2>
        <div style={{ display: 'inline-flex', gap: '12px', alignItems: 'center' }}>
          <button 
            onClick={modalHandlers.toggleFilterSidebar}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '0.75rem 1rem',
              backgroundColor: viewState.filterSidebarOpen ? '#10b981' : '#f3f4f6',
              color: viewState.filterSidebarOpen ? 'white' : '#6b7280',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '600',
              transition: 'all 0.2s'
            }}
          >
            <Filter size={16} />
            Filters
            {(filterState.statuses.length + filterState.states.length > 0) && (
              <span style={{
                backgroundColor: '#ef4444',
                color: 'white',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 'bold',
                marginLeft: '4px'
              }}>
                {filterState.statuses.length + filterState.states.length}
              </span>
            )}
          </button>
          <button 
            onClick={employeeHandlers.handleAddEmployee}
            className="mts-add-employee-btn"
          >
            <Plus size={16} />
            Add Employee
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading employees...</p>
        </div>
      ) : filteredEmployees.length > 0 ? (
        <>
          <div className="mts-employee-table-table-header">
            <div>Name</div>
            <div>Email</div>
            <div>Mobile Number</div>
            {/* <div>Department</div> */}
            <div>Position</div>
            <div>Employment Details</div>
            <div style={{ textAlign: 'center' }}>Status</div>
            <div style={{ textAlign: 'center' }}>Actions</div>
          </div>
          
          <div className="mts-employee-table-table-rows">
            {currentRows.map(employee => (
              <div key={employee.id} className="mts-employee-table-table-row">
                <div>
                  <button
                    onClick={() => navigationHandlers.handleEmployeeClick(employee)}
                    className="mts-employee-name-btn"
                  >
                    {employee.name}
                  </button>
                </div>
                <div className="mts-contact-email">{employee.email}</div>
                <div className="mts-contact-phone">{employee.phone || 'N/A'}</div>
                {/* <div>{employee.department}</div> */}
                <div>{employee.position || employee.Position || 'N/A'}</div>
                <div>
                  <div className="mts-employment-type">{employee.employmentType}</div>
                  <div className="mts-employment-details">
                    Code: {employee.EmployeeCode || employee.employeeCode || 'N/A'} | Hired: {formatDate(employee.hireDate)}
                  </div>
                  {/* <div className="mts-timesheet-required-badge" style={{ 
                    fontSize: '11px', 
                    fontWeight: '600',
                    color: employee.TimesheetRequired ? '#059669' : '#dc2626',
                    marginTop: '4px'
                  }}>
                    Timesheet: {employee.TimesheetRequired ? 'Required' : 'Not Required'}
                  </div> */}
                </div>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <span className={`mts-status-badge ${
                      employee.status === 'Active' ? 'mts-status-registered' : 'mts-status-pending'
                    }`}
                    style={{
                      display: 'inline-flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '2px',
                      width: 'fit-content', padding: '4px 12px'
                    }}>
                      <span style={{ fontWeight: '600', fontSize: '14px' }}>
                        {employee.status}
                      </span>
                      {employee.StatusChangedAt && (
                        <span style={{
                          fontSize: '11px',
                          opacity: 0.85,
                          fontWeight: '500'
                        }}>
                          {new Date(employee.StatusChangedAt).toLocaleDateString()}
                        </span>
                      )}
                    </span>
                </div>
                <div className="mts-actions" style={{ justifyContent: 'center' }}>
                  {/* <button 
                    className="mts-action-btn view"
                    onClick={() => employeeHandlers.handleViewEmployee(employee)}
                    title="View Employee Details"
                  >
                    <Eye size={14} />
                  </button> */}
                  <button 
                    className="mts-action-btn"
                    onClick={() => employeeHandlers.handleEditEmployee(employee)}
                    title="Edit Employee"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button 
                    className="mts-action-btn delete"
                    onClick={() => employeeHandlers.handleDeleteEmployee(employee.id)}
                    title="Delete Employee"
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
          <User size={48} />
          <p>{filterState.statuses.length > 0 || filterState.states.length > 0 ? 'No employees match the selected filters' : 'No employees found'}</p>
          <button 
            onClick={employeeHandlers.handleAddEmployee}
            className="mts-add-employee-btn"
          >
            <Plus size={16} />
            Add Employee
          </button>
        </div>
      )}
    </div>
  );
});

EmployeeView.displayName = 'EmployeeView';

export default EmployeeView;
