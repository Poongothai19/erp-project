import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import '../styles/ParseFlowModals.css';
import { formatDate } from '../utils/mockData';

export const ConfirmParseModal = ({ isOpen, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="pf-overlay">
      <div className="pf-modal pf-confirm-modal">
        <div className="pf-icon-container">
          <div className="pf-orange-circle">!</div>
        </div>
        <h2 className="pf-title">Are you sure?</h2>
        <p className="pf-desc">Do you want to parse this document ?</p>
        <div className="pf-actions">
          <button className="pf-btn pf-btn-no" onClick={onCancel}>No</button>
          <button className="pf-btn pf-btn-yes" onClick={onConfirm}>Yes</button>
        </div>
      </div>
    </div>
  );
};

export const ParsingLoadingModal = ({ isOpen }) => {
  if (!isOpen) return null;

  return (
    <div className="pf-overlay">
      <div className="pf-modal pf-loading-modal">
        <h2 className="pf-loading-title">Parsing the details.</h2>
        <div className="pf-spinner-container">
          <div className="pf-spinner"></div>
          <div className="pf-doc-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" fill="#3b82f6"/>
              <path d="M14 2V8H20" fill="#bfdbfe"/>
              <rect x="8" y="13" width="8" height="2" rx="1" fill="white"/>
              <rect x="8" y="17" width="6" height="2" rx="1" fill="white"/>
              <circle cx="9.5" cy="8.5" r="1.5" fill="#f472b6"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export const DuplicateResumeModal = ({ isOpen, duplicateCandidate, onProceed, onCancel }) => {
  const [selectedAction, setSelectedAction] = useState('overwrite');

  if (!isOpen || !duplicateCandidate) return null;

  const candidateName = `${duplicateCandidate.FirstName || ''} ${duplicateCandidate.LastName || ''}`.trim();

  return (
    <div className="pf-overlay">
      <div className="pf-modal pf-duplicate-modal">
        <div className="pf-dup-header">
          <h2 className="pf-dup-title">Duplicate Resume</h2>
          <button className="pf-close-icon" onClick={onCancel}><X size={18} /></button>
        </div>

        <div className="pf-dup-body">
          <div className="pf-warning-bar">
            <AlertCircle size={16} color="#eab308" />
            <span>Candidate already exists with this email or LinkedIn URL</span>
          </div>

          <div className="pf-dup-details">
            <div className="pf-detail-row">
              <span className="pf-detail-label">Candidate Name:</span>
              <span className="pf-detail-value pf-blue-link">{candidateName}</span>
            </div>
            <div className="pf-detail-row">
              <span className="pf-detail-label">Created Date:</span>
              <span className="pf-detail-value">{formatDate(duplicateCandidate.CreatedDt)}</span>
            </div>
            <div className="pf-detail-row">
              <span className="pf-detail-label">Status:</span>
              <span className="pf-detail-value">{duplicateCandidate.CandidateStatus}</span>
            </div>
          </div>

          <div className="pf-dup-options">
            <label className="pf-radio-label">
              <input type="radio" name="dupAction" value="overwrite" 
                     checked={selectedAction === 'overwrite'} 
                     onChange={() => setSelectedAction('overwrite')} />
              <span>Overwrite the candidate profile</span>
            </label>
            <label className="pf-radio-label">
              <input type="radio" name="dupAction" value="append" 
                     checked={selectedAction === 'append'} 
                     onChange={() => setSelectedAction('append')} />
              <span>Append the candidate profile</span>
            </label>
            <label className="pf-radio-label">
              <input type="radio" name="dupAction" value="add_resume" 
                     checked={selectedAction === 'add_resume'} 
                     onChange={() => setSelectedAction('add_resume')} />
              <span>Add resume and don't update candidate</span>
            </label>
          </div>
        </div>

        <div className="pf-dup-footer">
          <button className="pf-btn pf-btn-no" onClick={onCancel}>Cancel</button>
          <button className="pf-btn pf-btn-yes" onClick={() => onProceed(selectedAction)}>Proceed</button>
        </div>
      </div>
    </div>
  );
};
