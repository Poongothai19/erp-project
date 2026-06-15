import React, { useState, useEffect } from "react";
import "../styles/ExternalTimesheet.css";
import axios from 'axios';
import BASE_URL from '../../url';
import { 
  LuCloudUpload, 
  LuFileText, 
  LuFileSpreadsheet, 
  LuFile, 
  LuImage, 
  LuArchive,
  LuX,
  LuDownload,
  LuCircleCheck,
  LuLoader,
  LuClock,
  LuCalendar,
  LuUser,
  LuBriefcase,
  LuUpload
} from 'react-icons/lu';

// Replace with your actual BASE_URL
// const BASE_URL = 'http://localhost:5000'; 

const ExternalTimesheet = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [uploadHistory, setUploadHistory] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [clientName, setClientName] = useState("");
  const [projectName, setProjectName] = useState("");

  useEffect(() => {
    loadUploadHistory();
  }, []);

  const loadUploadHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BASE_URL}/api/timesheets/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Upload history response:', response.data);
      setUploadHistory(response.data);
    } catch (error) {
      console.error("Error loading upload history:", error);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file) => {
    const validTypes = [
      ".pdf", ".xlsx", ".xls", ".csv", ".doc", ".docx", 
      ".txt", ".jpg", ".jpeg", ".png", ".zip", ".rar"
    ];
    const fileExtension = file.name.split('.').pop().toLowerCase();
    
    if (!validTypes.includes(`.${fileExtension}`)) {
      setUploadStatus("error");
      alert("Please upload a valid file type");
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadStatus("error");
      alert("File size should not exceed 10MB");
      return;
    }
    
    setSelectedFile(file);
    setUploadStatus("selected");
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Please select a file first");
      return;
    }

    setUploadStatus("uploading");
    
    try {
      const formData = new FormData();
      formData.append("timesheetFile", selectedFile);
      formData.append("clientName", clientName);
      formData.append("projectName", projectName);
      formData.append("periodStart", new Date().toISOString().split('T')[0]);
      formData.append("periodEnd", new Date().toISOString().split('T')[0]);

      const token = localStorage.getItem('token');
      
      await axios.post(`${BASE_URL}/api/timesheets/external`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Reload history to show updated status
      await loadUploadHistory();
      
      setUploadStatus("success");
      alert("Timesheet uploaded successfully!");
      setSelectedFile(null);
      setClientName("");
      setProjectName("");
      
      const fileInput = document.getElementById("ts-file-input");
      if (fileInput) fileInput.value = "";
      
      setTimeout(() => setUploadStatus(""), 3000);
      
    } catch (error) {
      setUploadStatus("error");
      console.error("Upload error:", error);
      alert(error.response?.data?.message || "Upload failed. Please try again.");
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      validateAndSetFile(files[0]);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setUploadStatus("");
    const fileInput = document.getElementById("ts-file-input");
    if (fileInput) fileInput.value = "";
  };

  const getFileIcon = (fileName) => {
    if (!fileName || typeof fileName !== 'string') {
      return <LuFile size={20} color="#6c757d" />;
    }

    const ext = fileName.split('.').pop().toLowerCase();
    const iconSize = 20;
    
    const iconMap = {
      pdf: <LuFileText size={iconSize} color="#dc3545" />,
      xlsx: <LuFileSpreadsheet size={iconSize} color="#0eb381" />,
      xls: <LuFileSpreadsheet size={iconSize} color="#0eb381" />,
      csv: <LuFileSpreadsheet size={iconSize} color="#17a2b8" />,
      doc: <LuFileText size={iconSize} color="#0a8080" />,
      docx: <LuFileText size={iconSize} color="#0a8080" />,
      txt: <LuFileText size={iconSize} color="#6c757d" />,
      jpg: <LuImage size={iconSize} color="#ff6b6b" />,
      jpeg: <LuImage size={iconSize} color="#ff6b6b" />,
      png: <LuImage size={iconSize} color="#ff6b6b" />,
      zip: <LuArchive size={iconSize} color="#ffc107" />,
      rar: <LuArchive size={iconSize} color="#ffc107" />
    };
    
    return iconMap[ext] || <LuFile size={iconSize} color="#6c757d" />;
  };

  const handleDelete = async (timesheetId, fileName) => {
    if (!window.confirm(`Are you sure you want to delete "${fileName || 'this file'}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${BASE_URL}/api/timesheets/${timesheetId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Reload history after deletion
      await loadUploadHistory();
      alert("Timesheet deleted successfully!");
    } catch (error) {
      console.error("Error deleting timesheet:", error);
      alert(error.response?.data?.message || "Failed to delete timesheet.");
    }
  };

  const handleDownload = async (timesheetId, fileName) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BASE_URL}/api/timesheets/${timesheetId}/download`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName || 'timesheet-file');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading file:", error);
      alert("Failed to download file.");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString();
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // ⭐ NEW: Function to get status badge style and text
  const getStatusBadge = (status) => {
    const normalizedStatus = (status || 'pending').toLowerCase();
    
    const styles = {
      approved: {
        backgroundColor: '#d1fae5',
        width: '90px',
        color: '#065f46',
        border: '1px solid #a7f3d0',
        text: 'Approved'
      },
      rejected: {
        backgroundColor: '#fee2e2',
        width: '90px',
        color: '#991b1b',
        border: '1px solid #fecaca',
        text: 'Rejected'
      },
      pending: {
        backgroundColor: '#fff3cd',
        width: '90px',
        color: '#856404',
        border: '1px solid #ffeaa7',
        text: 'Pending'
      }
    };

    return styles[normalizedStatus] || styles.pending;
  };

  // ⭐ NEW: Auto-refresh on window focus (when returning from EmployeeDetailsPage)
  useEffect(() => {
    const handleFocus = () => {
      console.log('Window focused - refreshing upload history');
      loadUploadHistory();
    };

    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  return (
    <div className="ts-external-container">
      <div className="ts-upload-wrapper">
        <div className="ts-header-section">
          <h2 className="ts-main-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LuClock size={28} style={{ marginRight: '10px', color: '#0eb381' }} />
            Upload External Timesheet
          </h2>
          <p className="ts-subtitle">Upload your timesheet from external clients or projects</p>
        </div>

        <div 
          className={`ts-dropzone ${isDragging ? 'ts-dropzone-active' : ''} ${uploadStatus ? `ts-status-${uploadStatus}` : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="ts-dropzone-content">
            <div className="ts-upload-icon">
              <LuCloudUpload size={64} color="#0eb381" />
            </div>
            <h3 className="ts-dropzone-title">Drag & Drop your timesheet file</h3>
            <p className="ts-or-text">or</p>
            <label htmlFor="ts-file-input" className="ts-browse-btn">
              Browse Files
            </label>
            <input
              id="ts-file-input"
              type="file"
              accept=".pdf,.xlsx,.xls,.csv,.doc,.docx,.txt,.jpg,.jpeg,.png,.zip,.rar"
              onChange={handleFileSelect}
              className="ts-file-input-hidden"
            />
            <p className="ts-supported-formats">
              Supported: PDF, Excel, CSV, Word, Images, ZIP (Max 10MB)
            </p>
          </div>
        </div>

        {selectedFile && (
          <div className="ts-file-preview">
            <h4 className="ts-preview-title">Selected File:</h4>
            <div className="ts-file-card">
              <div className="ts-file-icon" style={{ display: 'flex', alignItems: 'center' }}>
                {getFileIcon(selectedFile.name)}
              </div>
              <div className="ts-file-info">
                <span className="ts-file-name">{selectedFile.name}</span>
                <span className="ts-file-size">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
              <button 
                className="ts-remove-btn"
                onClick={handleRemoveFile}
                title="Remove file"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <LuX size={20} />
              </button>
            </div>
          </div>
        )}

        <div className="ts-action-buttons">
          <button 
            className="ts-btn ts-btn-primary" 
            onClick={handleUpload}
            disabled={!selectedFile || uploadStatus === "uploading"}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            {uploadStatus === "uploading" ? (
              <>
                <LuLoader size={18} className="ts-spinner" /> Uploading...
              </>
            ) : (
              <>
                <LuUpload size={18} /> Upload Timesheet
              </>
            )}
          </button>
        </div>

        {uploadHistory.length > 0 && (
          <div className="ts-history-section">
            <h3 className="ts-history-title" style={{ display: 'flex', alignItems: 'center' }}>
              <LuCalendar size={20} style={{ marginRight: '8px' }} />
              Recent Uploads
            </h3>
            <div className="ts-history-list">
              {uploadHistory.map((upload) => {
                const uploadId = upload.Id || upload.id;
                const fileName = upload.FileName || upload.fileName || 'Unknown File';
                const uploadDate = upload.UploadDate || upload.uploadedAt || upload.createdAt;
                const clientName = upload.ClientName || upload.clientName;
                const projectName = upload.ProjectName || upload.projectName;
                const status = upload.Status || upload.status || 'pending';

                // ⭐ FIXED: Get dynamic status badge
                const statusBadge = getStatusBadge(status);

                return (
                  <div key={uploadId} className="ts-history-item">
                    <div className="ts-history-icon" style={{ display: 'flex', alignItems: 'center' }}>
                      {getFileIcon(fileName)}
                    </div>
                    <div className="ts-history-info">
                      <span className="ts-history-name">{fileName}</span>
                      <span className="ts-history-date" style={{ display: 'flex', alignItems: 'center' }}>
                        <LuClock size={12} style={{ marginRight: '4px' }} />
                        {formatDate(uploadDate)}
                      </span>
                      {clientName && (
                        <span className="ts-history-client" style={{ display: 'flex', alignItems: 'center' }}>
                          <LuUser size={12} style={{ marginRight: '4px' }} />
                          {clientName}
                        </span>
                      )}
                      {projectName && (
                        <span className="ts-history-project" style={{ display: 'flex', alignItems: 'center' }}>
                          <LuBriefcase size={12} style={{ marginRight: '4px' }} />
                          {projectName}
                        </span>
                      )}
                      {/* ⭐ FIXED: Dynamic Status Badge with real-time updates */}
                      <div 
                        className={`ts-status-badge ts-status-${status.toLowerCase()}`}
                        style={{
                          display: 'inline-block',
                          width: '90px',
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          marginTop: '8px',
                          backgroundColor: statusBadge.backgroundColor,
                          color: statusBadge.color,
                          border: statusBadge.border,
                          transition: 'all 0.3s ease'
                        }}
                      >
                        {statusBadge.text}
                      </div>
                    </div>
                    <div className="ts-history-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button 
                        className="ts-download-btn"
                        onClick={() => handleDownload(uploadId, fileName)}
                        title="Download file"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <LuDownload size={18} />
                      </button>
                      <button 
                        className="ts-delete-btn"
                        onClick={() => handleDelete(uploadId, fileName)}
                        title="Delete file"
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          background: 'none',
                          border: '2px solid #dc3545',
                          cursor: 'pointer',
                          color: '#dc3545',
                          padding: '6px',
                          borderRadius: '50%',
                          width: '32px',
                          height: '32px',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#dc3545';
                          e.currentTarget.style.color = 'white';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'none';
                          e.currentTarget.style.color = '#dc3545';
                        }}
                      >
                        <LuX size={18} />
                      </button>
                      <span className="ts-history-status" style={{ display: 'flex', alignItems: 'center' }}>
                        <LuCircleCheck 
                          size={18} 
                          color={status.toLowerCase() === 'approved' ? '#0eb381' : '#999'} 
                        />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExternalTimesheet;