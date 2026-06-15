




// ReportConfig.js - Updated with column groups
import React, { useState, useCallback } from 'react';
import axios from 'axios';
import BASE_URL from '../../url';

// Initial report columns configuration with groups
export const initialReportColumns = [
  // Role Information
  { id: 'roleId', label: 'Role ID', visible: true, group: 'role' },
  { id: 'jobId', label: 'Job ID', visible: true, group: 'role' },
  { id: 'systemId', label: 'System ID', visible: true, group: 'role' },
  { id: 'role', label: 'Role Name', visible: true, group: 'role' },
  { id: 'roleType', label: 'Role Type', visible: true, group: 'role' },
  { id: 'client', label: 'Client', visible: true, group: 'role' },
  { id: 'clientPOC', label: 'Client POC', visible: true, group: 'role' },
  { id: 'location', label: 'Location', visible: true, group: 'role' },
  { id: 'roleLocation', label: 'Work Mode', visible: true, group: 'role' },
  { id: 'experience', label: 'Experience', visible: true, group: 'role' },
  { id: 'urgency', label: 'Urgency', visible: true, group: 'role' },
  { id: 'status', label: 'Role Status', visible: true, group: 'role' },
  { id: 'assignTo', label: 'Role Owner', visible: true, group: 'role' },
  { id: 'currency', label: 'Currency', visible: true, group: 'role' },
  { id: 'minRate', label: 'Min Rate', visible: true, group: 'role' },
  { id: 'maxRate', label: 'Max Rate', visible: true, group: 'role' },
  { id: 'startDate', label: 'Start Date', visible: true, group: 'role' },
  { id: 'endDate', label: 'End Date', visible: true, group: 'role' },
  { id: 'profilesNeeded', label: 'Profiles Needed', visible: true, group: 'role' },
  { id: 'createdAt', label: 'Role Created At', visible: true, group: 'role' },
  { id: 'createdBy', label: 'Created By', visible: true, group: 'role' },
  { id: 'visaTypes', label: 'Visa Types', visible: true, group: 'role' },
  { id: 'gbamsId', label: 'GBAMS ID', visible: true, group: 'role' },
  
  // Role Statistics
  { id: 'totalApplications', label: 'Total Applications', visible: true, group: 'statistics' },
  { id: 'appliedCount', label: 'Applied Count', visible: true, group: 'statistics' },
  { id: 'hiredCount', label: 'Hired Count', visible: true, group: 'statistics' },
  { id: 'interviewsCount', label: 'Interviews Count', visible: true, group: 'statistics' },
  { id: 'assignedRecruiters', label: 'Assigned Recruiters', visible: true, group: 'statistics' },
  
  // Application Details (will cause row duplication if selected)
  { id: 'applicationId', label: 'Application ID', visible: false, group: 'application' },
  { id: 'candidateName', label: 'Candidate Name', visible: false, group: 'application' },
  { id: 'candidateEmail', label: 'Candidate Email', visible: false, group: 'application' },
  { id: 'candidatePhone', label: 'Candidate Phone', visible: false, group: 'application' },
  { id: 'candidateExperience', label: 'Candidate Experience', visible: false, group: 'application' },
  { id: 'currentCompany', label: 'Current Company', visible: false, group: 'application' },
  { id: 'expectedSalary', label: 'Expected Salary', visible: false, group: 'application' },
  { id: 'candidateLocation', label: 'Candidate Location', visible: false, group: 'application' },
  { id: 'applicationStatus', label: 'Application Status', visible: false, group: 'application' },
  { id: 'appliedAt', label: 'Applied At', visible: false, group: 'application' },
  { id: 'submittedBy', label: 'Submitted By', visible: false, group: 'application' },
  { id: 'resumeCount', label: 'Resume Count', visible: false, group: 'application' }
];

// Custom hook for report functions
export const useReportFunctions = () => {
  const [showReportColumnModal, setShowReportColumnModal] = useState(false);
  const [selectedReportPeriod, setSelectedReportPeriod] = useState('');
  const [reportColumns, setReportColumns] = useState(initialReportColumns);

  const openReportColumnModal = useCallback((period) => {
    setSelectedReportPeriod(period);
    // Reset to default: role and statistics visible, applications hidden
    setReportColumns(prev => prev.map(col => ({ 
      ...col, 
      visible: col.group !== 'application' 
    })));
    setShowReportColumnModal(true);
  }, []);

  const closeReportColumnModal = useCallback(() => {
    setShowReportColumnModal(false);
    setSelectedReportPeriod('');
  }, []);

  const toggleReportColumn = useCallback((columnId) => {
    setReportColumns(prev =>
      prev.map(col =>
        col.id === columnId ? { ...col, visible: !col.visible } : col
      )
    );
  }, []);

  const selectAllColumns = useCallback(() => {
    setReportColumns(prev => prev.map(col => ({ ...col, visible: true })));
  }, []);

  const deselectAllColumns = useCallback(() => {
    setReportColumns(prev => prev.map(col => ({ ...col, visible: false })));
  }, []);

  const selectGroupColumns = useCallback((group) => {
    setReportColumns(prev => prev.map(col => ({
      ...col,
      visible: col.group === group ? true : col.visible
    })));
  }, []);

  const deselectGroupColumns = useCallback((group) => {
    setReportColumns(prev => prev.map(col => ({
      ...col,
      visible: col.group === group ? false : col.visible
    })));
  }, []);

  const downloadRolesReportWithColumns = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');

      // Get selected column IDs
      const selectedColumnIds = reportColumns
        .filter(col => col.visible)
        .map(col => col.id);

      if (selectedColumnIds.length === 0) {
        return { success: false, message: 'Please select at least one column' };
      }

      // Build URL with query parameters
      const params = new URLSearchParams();
      params.append('period', selectedReportPeriod);
      selectedColumnIds.forEach(colId => params.append('columns', colId));

      const apiUrl = `${BASE_URL}/api/recruitment/roles/export/report?${params.toString()}`;

      const response = await axios.get(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        responseType: 'blob'
      });

      // Create blob link to download
      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = blobUrl;

      // Get filename from response headers or create default
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'recruitment_report.csv';

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);

      // Show success notification and close modal
      closeReportColumnModal();
      
      return { success: true, message: 'Report downloaded successfully!' };

    } catch (error) {
      console.error('Error downloading report:', error);
      let errorMessage = 'Failed to download report';

      if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to download reports';
      } else if (error.response?.status === 404) {
        errorMessage = 'Report endpoint not found. Check your API configuration.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      return { success: false, message: errorMessage };
    }
  }, [reportColumns, selectedReportPeriod, closeReportColumnModal]);

  return {
    showReportColumnModal,
    selectedReportPeriod,
    reportColumns,
    setReportColumns,
    openReportColumnModal,
    closeReportColumnModal,
    toggleReportColumn,
    selectAllColumns,
    deselectAllColumns,
    selectGroupColumns,
    deselectGroupColumns,
    downloadRolesReportWithColumns
  };
};

// Report Column Modal Component with Groups
export const ReportColumnModal = ({
  showModal,
  onClose,
  selectedPeriod,
  reportColumns,
  onToggleColumn,
  onSelectAll,
  onDeselectAll,
  onSelectGroup,
  onDeselectGroup,
  onDownload,
  showNotification
}) => {
  if (!showModal) return null;

  const handleDownload = async () => {
    const result = await onDownload();
    if (showNotification && result.message) {
      showNotification(result.message);
    }
  };

  // Group columns
  const roleColumns = reportColumns.filter(col => col.group === 'role');
  const statisticsColumns = reportColumns.filter(col => col.group === 'statistics');
  const applicationColumns = reportColumns.filter(col => col.group === 'application');

  const hasApplicationColumns = reportColumns.some(col => col.group === 'application' && col.visible);

  return (
    <div
      id="report-column-modal"
      className="recruitment-modal"
      onClick={(e) => {
        if (e.target.id === 'report-column-modal') {
          if (window.confirm('Close without saving?')) {
            onClose();
          }
        }
      }}
    >
      <div className="recruitment-modal-content">
        <div className="recruitment-modal-header">
          <h2>Select Columns for {selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)} Report</h2>
          <span className="recruitment-close" onClick={onClose}>&times;</span>
        </div>
        <div className="recruitment-modal-body">
          {/* Static Header with Select All/Deselect All */}
          {/* <div className="column-controls">
            <div className="column-controls-buttons">
              <button
                type="button"
                className="recruitment-submit-btn"
                onClick={onSelectAll}
              >
                Select All
              </button>
              <button
                type="button"
                className="recruitment-cancel-btn"
                onClick={onDeselectAll}
              >
                Deselect All
              </button>
            </div>
          </div> */}

          {hasApplicationColumns && (
            <div style={{ padding: '10px', backgroundColor: '#fff3cd', border: '1px solid #ffc107', borderRadius: '4px', marginBottom: '15px' }}>
              <strong>⚠️ Note:</strong> Selecting application columns will create one row per application, which may result in duplicate role information.
            </div>
          )}

          {/* Scrollable Columns Grid with Groups */}
          <div className="columns-grid-container">
            {/* Role Information Group */}
            <div className="column-group">
              <div className="column-group-header"style={{marginLeft:'10px'}}>
                <h3>Role Information</h3>
                <div>
                  <button
                    type="button"
                    className="recruitment-submit-btn"
                    style={{ fontSize: '12px', padding: '4px 8px', marginRight: '5px' ,marginLeft: '10px',marginTop:'10px'}}
                    onClick={() => onSelectGroup('role')}
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    className="recruitment-cancel-btn"
                    style={{ fontSize: '12px', padding: '4px 8px' }}
                    onClick={() => onDeselectGroup('role')}
                  >
                    Deselect All
                  </button>
                </div>
              </div>
              <div className="columns-grid">
                {roleColumns.map((column) => (
                  <div key={column.id} className="column-item">
                    <input
                      type="checkbox"
                      id={`column-${column.id}`}
                      checked={column.visible}
                      onChange={() => onToggleColumn(column.id)}
                    />
                    <label htmlFor={`column-${column.id}`}>
                      {column.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Statistics Group */}
            <div className="column-group">
              <div className="column-group-header"style={{marginLeft:'10px'}}>
                <h3>Role Statistics</h3>
                <div>
                  <button
                    type="button"
                    className="recruitment-submit-btn"
                    style={{ fontSize: '12px', padding: '4px 8px', marginRight: '5px',marginLeft: '10px',marginTop:'10px' }}
                    onClick={() => onSelectGroup('statistics')}
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    className="recruitment-cancel-btn"
                    style={{ fontSize: '12px', padding: '4px 8px' }}
                    onClick={() => onDeselectGroup('statistics')}
                  >
                    Deselect All
                  </button>
                </div>
              </div>
              <div className="columns-grid">
                {statisticsColumns.map((column) => (
                  <div key={column.id} className="column-item">
                    <input
                      type="checkbox"
                      id={`column-${column.id}`}
                      checked={column.visible}
                      onChange={() => onToggleColumn(column.id)}
                    />
                    <label htmlFor={`column-${column.id}`}>
                      {column.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Application Details Group */}
            <div className="column-group">
              <div className="column-group-header" style={{marginLeft:'10px'}}>
                <h3>Application Details (Creates Multiple Rows per Role)</h3>
                <div>
                  <button
                    type="button"
                    className="recruitment-submit-btn"
                    style={{ fontSize: '12px', padding: '4px 8px', marginRight: '5px',marginLeft: '10px',marginTop:'10px' }}
                    onClick={() => onSelectGroup('application')}
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    className="recruitment-cancel-btn"
                    style={{ fontSize: '12px', padding: '4px 8px' }}
                    onClick={() => onDeselectGroup('application')}
                  >
                    Deselect All
                  </button>
                </div>
              </div>
              <div className="columns-grid">
                {applicationColumns.map((column) => (
                  <div key={column.id} className="column-item">
                    <input
                      type="checkbox"
                      id={`column-${column.id}`}
                      checked={column.visible}
                      onChange={() => onToggleColumn(column.id)}
                    />
                    <label htmlFor={`column-${column.id}`}>
                      {column.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Static Footer with Download and Cancel */}
          <div className="recruitment-form-actions">
            <button
              type="button"
              className="recruitment-cancel-btn"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="recruitment-submit-btn"
              onClick={handleDownload}
              disabled={!reportColumns.some(col => col.visible)}
            >
              Download Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default {
  useReportFunctions,
  ReportColumnModal,
  initialReportColumns
};