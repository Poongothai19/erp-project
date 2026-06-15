import React, { useState } from 'react';
import { LuUpload, LuFile, LuX, LuImage, LuFileText, LuFileSpreadsheet } from 'react-icons/lu';

const TimesheetAttachment = ({ timesheets, onUpload, onRemove }) => {
  const [dragging, setDragging] = useState(false);

  const handleFileUpload = (files) => {
    // Allow all file types including images
    const validFiles = Array.from(files);
    
    if (validFiles.length > 0) {
      onUpload(validFiles);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const files = e.dataTransfer.files;
    handleFileUpload(files);
  };

  const getFileIcon = (filename) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    // All image formats including jpg, jpeg, png, gif, bmp, webp, svg, ico, tiff, heic
    const imageFormats = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico', 'tiff', 'tif', 'heic', 'heif', 'jfif', 'pjpeg', 'pjp'];
    // Document formats
    const documentFormats = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'];
    // Spreadsheet formats
    const spreadsheetFormats = ['xlsx', 'xls', 'csv', 'xlsm', 'xlsb', 'ods'];
    
    if (imageFormats.includes(ext)) {
      return <LuImage size={16} />;
    }
    if (documentFormats.includes(ext)) {
      return <LuFileText size={16} />;
    }
    if (spreadsheetFormats.includes(ext)) {
      return <LuFileSpreadsheet size={16} />;
    }
    return <LuFile size={16} />;
  };

  // Safely format file size
  const formatFileSize = (size) => {
    if (!size) return '0 KB';
    if (typeof size === 'string') {
      const numSize = parseFloat(size);
      return isNaN(numSize) ? '0 KB' : `${(numSize / 1024).toFixed(2)} KB`;
    }
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Helper to check if file is an image (for preview maybe)
  const isImageFile = (filename) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const imageFormats = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico', 'tiff', 'tif'];
    return imageFormats.includes(ext);
  };

  return (
    <div className="inv-module-timesheet-attachment">
      <h4 className="inv-module-section-header">Attach Timesheets</h4>
      <p className="inv-module-help-text">
        Upload timesheets to include with the invoice. These will be sent to the client along with the invoice.
      </p>
      
      <div 
        className={`inv-module-upload-area ${dragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="timesheet-upload"
          multiple
          accept="*/*"  // Accept all file types
          onChange={(e) => handleFileUpload(e.target.files)}
          style={{ display: 'none' }}
        />
        <label htmlFor="timesheet-upload" className="inv-module-upload-btn">
          <LuUpload size={24} />
          <span>Drag & drop files here or click to browse</span>
          <small>Supports all file types (Images, PDF, Excel, Word, CSV, etc.)</small>
          <small>Maximum file size: 20MB per file</small>
        </label>
      </div>

      {timesheets && timesheets.length > 0 && (
        <div className="inv-module-timesheets-list">
          <h5>Attached Files ({timesheets.length}):</h5>
          <ul>
            {timesheets.map((ts, index) => (
              <li key={ts.id || ts._id || `timesheet-${index}`}>
                {getFileIcon(ts.name)}
                <div className="inv-module-file-info">
                  <span className="inv-module-file-name">{ts.name}</span>
                  <span className="inv-module-file-size">{formatFileSize(ts.size)}</span>
                </div>
                {isImageFile(ts.name) && ts.url && (
                  <span className="inv-module-file-type image">Image</span>
                )}
                <span className="inv-module-file-type">
                  {ts.type === 'existing' || ts.isExisting ? 'Saved' : 'New'}
                </span>
                {onRemove && (
                  <button 
                    type="button"
                    className="inv-module-remove-attachment"
                    onClick={() => onRemove(index)}
                    title="Remove file"
                  >
                    <LuX size={14} />
                  </button>
                )}
              </li>
            ))}
          </ul>
          <p className="inv-module-note">
            These files will be automatically attached to the email sent to the client.
          </p>
        </div>
      )}
    </div>
  );
};

export default TimesheetAttachment;