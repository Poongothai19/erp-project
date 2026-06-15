




// SubmissionsList.js - Fixed version
import React, { useState } from 'react';
import '../styles/Onboarding.css'
import { LuDownload, LuEye, LuTrash2, LuFile, LuPen } from 'react-icons/lu';
import axios from 'axios';
import BASE_URL from '../../url';

const SubmissionsList = ({ employees, onView, onDelete, onEdit, loading }) => {
  const [deletingId, setDeletingId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  const getEmployeeName = (employee) => {
    if (employee.firstName && employee.lastName) {
      return `${employee.firstName} ${employee.lastName}`;
    } else if (employee.firstName) {
      return employee.firstName;
    } else if (employee.lastName) {
      return employee.lastName;
    } else {
      return 'Unnamed Submission';
    }
  };

  const getEmployeeEmail = (employee) => {
    return employee.personalEmail || employee.email || 'No email provided';
  };

  const getEmployeePhone = (employee) => {
    return employee.mobileNumber || 'No phone provided';
  };

  const getSubmissionDate = (employee) => {
    if (employee.submittedDate) {
      return new Date(employee.submittedDate).toLocaleDateString();
    } else {
      return 'Unknown';
    }
  };

  const getStatusBadgeClass = (status) => {
    switch(status?.toLowerCase()) {
      case 'pending': return 'ob-status-badge-pending';
      case 'in-progress': return 'ob-status-badge-in-progress';
      case 'approved': return 'ob-status-badge-approved';
      case 'rejected': return 'ob-status-badge-rejected';
      default: return 'ob-status-badge-pending';
    }
  };

  const getStatusText = (status) => {
    switch(status?.toLowerCase()) {
      case 'pending': return 'Pending Review';
      case 'in-progress': return 'In Progress';
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      default: return 'Pending';
    }
  };

  const handleDownloadSubmission = async (employee) => {
    try {
      setDownloadingId(employee.id);
      const token = localStorage.getItem('token');
      
      // In a real implementation, you would call an API to generate a PDF
      // For now, we'll create a simple JSON download
      const dataStr = JSON.stringify(employee, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `submission-${employee.id}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      // Simulate API call delay
      setTimeout(() => {
        setDownloadingId(null);
      }, 1000);
      
    } catch (error) {
      console.error("Error downloading submission:", error);
      alert("Failed to download submission");
      setDownloadingId(null);
    }
  };

  const handleDeleteClick = async (id) => {
    if (window.confirm('Are you sure you want to delete this submission?')) {
      try {
        setDeletingId(id);
        await onDelete(id);
      } finally {
        setDeletingId(null);
      }
    }
  };

  if (loading) {
    return (
      <div className="ob-list-loading">
        <div className="ob-loader"></div>
        <p>Loading submissions...</p>
      </div>
    );
  }

  return (
    <div className="ob-submissions-list">
      <div className="ob-list-header">
        <h2>My Submissions ({employees.length})</h2>
      </div>

      {employees.length === 0 ? (
        <div className="ob-empty-state">
          <div className="ob-empty-icon">📋</div>
          <h3>No Submissions Yet</h3>
          <p>Submit your first onboarding form to see it here!</p>
          <p className="ob-hint">
            Go back to the form to create your first submission.
          </p>
        </div>
      ) : (
        <div className="ob-submissions-grid">
          {employees.map((employee) => (
            <div key={employee.id} className="ob-submission-card">
              <div className="ob-submission-header">
                <div className="ob-submission-avatar">
                  {getEmployeeName(employee).charAt(0).toUpperCase()}
                </div>
                <div className="ob-submission-info">
                  <h3>{getEmployeeName(employee)}</h3>
                  <p className="ob-submission-id">
                    <LuFile size={12} /> ID: SUB{employee.id.toString().slice(-6)}
                  </p>
                  <span className={`ob-status-badge ${getStatusBadgeClass(employee.status)}`}>
                    {getStatusText(employee.status)}
                  </span>
                </div>
              </div>
              
              <div className="ob-submission-details">
                <div className="ob-detail-item">
                  <strong>Email:</strong>
                  <span>{getEmployeeEmail(employee)}</span>
                </div>
                <div className="ob-detail-item">
                  <strong>Phone:</strong>
                  <span>{getEmployeePhone(employee)}</span>
                </div>
                <div className="ob-detail-item">
                  <strong>Submitted:</strong>
                  <span>{getSubmissionDate(employee)}</span>
                </div>
                
                {employee.designation && (
                  <div className="ob-detail-item">
                    <strong>Position:</strong>
                    <span>{employee.designation}</span>
                  </div>
                )}

                {/* Document Status Summary */}
                <div className="ob-detail-item">
                  <strong>Documents:</strong>
                  <span>
                    {employee.documents ? Object.keys(employee.documents).length : 0} uploaded
                  </span>
                </div>
              </div>
              
              <div className="ob-submission-actions">
                <button
                  className="ob-btn-view-full"
                  onClick={() => onView(employee)}
                  title="View full details"
                >
                  <LuEye size={16} /> View
                </button>
                
                {/* <button
                  className="ob-btn-download"
                  onClick={() => handleDownloadSubmission(employee)}
                  disabled={downloadingId === employee.id}
                  title="Download submission"
                >
                  {downloadingId === employee.id ? (
                    <span className="ob-loader-spinner-small"></span>
                  ) : (
                    <LuDownload size={16} />
                  )} Download
                </button>
                 */}
                <button
                  className="ob-btn-edit"
                  onClick={() => onEdit && onEdit(employee)}
                  title="Edit submission"
                >
                   <LuPen size={16} /> Edit
                </button>
                
                <button
                  className="ob-btn-delete"
                  onClick={() => handleDeleteClick(employee.id)}
                  disabled={deletingId === employee.id}
                  title="Delete submission"
                >
                  {deletingId === employee.id ? (
                    <span className="ob-loader-spinner-small"></span>
                  ) : (
                    <LuTrash2 size={16} />
                  )} Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SubmissionsList;