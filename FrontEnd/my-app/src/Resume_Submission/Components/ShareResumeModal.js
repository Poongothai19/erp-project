import React, { useState, useEffect } from 'react';
import { X, Bold, Italic, Link, List, Image, Layout, FileText, UploadCloud, ChevronDown, CheckSquare, Square, File, Loader2 } from 'lucide-react';
import '../styles/ShareResumeModal.css';
import BASE_URL from '../../url';

const ShareResumeModal = ({ isOpen, onClose, candidates }) => {
  const [template, setTemplate] = useState('Resume Share');
  const [toInput, setToInput] = useState('');
  const [ccList, setCcList] = useState([]);
  const [ccInput, setCcInput] = useState('');
  const [bccInput, setBccInput] = useState('');
  const [subject, setSubject] = useState('Resume Share User Template');
  
  // Dummy content based on the candidate prop
  const [editorContent, setEditorContent] = useState('');
  const [selectedAttachments, setSelectedAttachments] = useState([]);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (candidates && candidates.length > 0) {
      setEditorContent('');
      
      let allSelected = [];
      candidates.forEach(c => {
         if (c.Document) allSelected.push(c.Document.DocumentId);
         else if (c.Documents?.length > 0) allSelected.push(c.Documents[0].DocumentId);
      });
      setSelectedAttachments(allSelected);
    }
  }, [candidates]);

  if (!isOpen) return null;

  const handleCcKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (ccInput.trim()) {
        setCcList([...ccList, ccInput.trim()]);
        setCcInput('');
      }
    } else if (e.key === 'Backspace' && !ccInput && ccList.length > 0) {
      setCcList(ccList.slice(0, -1));
    }
  };

  const removeCc = (idx) => {
    setCcList(ccList.filter((_, i) => i !== idx));
  };

  const placeholderEditorIcons = [
    <Bold size={14} />, <Italic size={14} />, <Layout size={14} />, <List size={14} />, <Link size={14} />, <Image size={14} />
  ];

  const toggleAttachment = (docId) => {
    if (selectedAttachments.includes(docId)) {
      setSelectedAttachments(selectedAttachments.filter(id => id !== docId));
    } else {
      setSelectedAttachments([...selectedAttachments, docId]);
    }
  };

  const handleShare = async () => {
    if (!toInput.trim()) {
      import('sweetalert2').then(mod => mod.default.fire('Error', 'Please enter a recipient email address', 'error'));
      return;
    }
    if (selectedAttachments.length === 0) {
      import('sweetalert2').then(mod => mod.default.fire('Error', 'Please select at least one attachment to share', 'error'));
      return;
    }

    try {
      setIsSending(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${BASE_URL}/api/resumes/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          candidateIds: candidates.map(c => c.CandidateId),
          to: toInput,
          cc: ccList,
          bcc: bccInput,
          subject: subject,
          body: editorContent,
          documentIds: selectedAttachments,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to send resume');

      import('sweetalert2').then((mod) => {
        mod.default.fire('Sent!', 'Resume has been shared successfully.', 'success');
        onClose();
      });
    } catch (error) {
      console.error('Error sharing resume:', error);
      import('sweetalert2').then((mod) => {
        mod.default.fire('Error', error.message || 'Failed to share resume', 'error');
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="share-modal-overlay">
      <div className="share-modal-container">
        {/* Header */}
        <div className="share-modal-header">
          <h2 className="share-modal-title">Share Resume</h2>
          <button className="share-modal-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div className="share-modal-content">
          {/* LEFT PANEL */}
          <div className="share-modal-left">
            
            <div className="share-form-group" style={{ marginTop: '8px' }}>
              <label className="share-label">Template</label>
              <select className="share-select-outline" value={template} onChange={e => setTemplate(e.target.value)}>
                <option>Resume Share</option>
                <option>System Default</option>
              </select>
            </div>

            <div className="share-form-group">
              <input 
                type="text" 
                className="share-input-outline" 
                placeholder="To" 
                value={toInput}
                onChange={e => setToInput(e.target.value)}
              />
            </div>

            <div className="share-form-group">
              <label className="share-label" style={{ background: 'white' }}>CC</label>
              <div className="share-cc-container">
                {ccList.map((cc, i) => (
                  <div key={i} className="share-cc-pill">
                    {cc}
                    <div className="share-cc-close" onClick={() => removeCc(i)}><X size={10} /></div>
                  </div>
                ))}
                <input 
                  type="text" 
                  className="share-cc-input"
                  value={ccInput}
                  onChange={e => setCcInput(e.target.value)}
                  onKeyDown={handleCcKeyDown}
                  placeholder={ccList.length === 0 ? "Add CC..." : ""}
                />
              </div>
            </div>

            <div className="share-form-group">
              <input 
                type="text" 
                className="share-input-outline" 
                placeholder="Bcc" 
                value={bccInput}
                onChange={e => setBccInput(e.target.value)}
              />
            </div>

            <div className="share-form-group">
              <label className="share-label" style={{ background: 'white' }}>Subject *</label>
              <input 
                type="text" 
                className="share-input-outline" 
                value={subject}
                onChange={e => setSubject(e.target.value)}
              />
            </div>

          </div>

          {/* RIGHT PANEL */}
          <div className="share-modal-right">
            
            <div className="share-section-title" style={{ marginTop: '8px' }}>Mail Content</div>
            
            <div className="share-editor-container">
              <div className="share-editor-toolbar">
                <div className="share-toolbar-group">
                  {placeholderEditorIcons.map((icon, idx) => (
                    <button key={idx} className="share-toolbar-btn">{icon}</button>
                  ))}
                </div>
                <div className="share-toolbar-group">
                  <span style={{ fontSize: '13px', padding: '0 8px', color: '#4b5563', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                    Styles <ChevronDown size={14} />
                  </span>
                </div>
                <div className="share-toolbar-group">
                  <span style={{ fontSize: '13px', padding: '0 8px', color: '#4b5563', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                    Format <ChevronDown size={14} />
                  </span>
                </div>
                <div className="share-toolbar-group" style={{ border: 'none' }}>
                  <span style={{ fontSize: '13px', padding: '0 8px', color: '#4b5563', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                    <FileText size={14} /> Source
                  </span>
                </div>
              </div>
              <textarea 
                className="share-editor-textarea"
                value={editorContent}
                onChange={e => setEditorContent(e.target.value)}
              />
            </div>

            <div className="share-attachment-title">Candidate Attachments</div>
            <div className="share-attachment-subtitle">Select the resumes/documents to share</div>
            
            <div className="share-attachments-list">
              {(() => {
                const docList = [];
                const cList = candidates || [];
                cList.forEach(c => {
                   if (c.Documents?.length > 0) {
                      c.Documents.forEach(d => docList.push({ ...d, candidateName: `${c.FirstName || ''} ${c.LastName || ''}`.trim() }));
                   } else if (c.Document) {
                      docList.push({ ...c.Document, candidateName: `${c.FirstName || ''} ${c.LastName || ''}`.trim() });
                   }
                });
                
                if (docList.length > 0) {
                  return docList.map((doc, idx) => (
                    <div 
                      key={`${doc.DocumentId}-${idx}`} 
                      className={`share-attachment-item ${selectedAttachments.includes(doc.DocumentId) ? 'selected' : ''}`}
                      onClick={() => toggleAttachment(doc.DocumentId)}
                      style={{ 
                        display: 'flex', alignItems: 'center', p: 2, padding: '10px', 
                        border: '1px solid #e5e7eb', borderRadius: '6px', marginBottom: '8px', cursor: 'pointer',
                        background: selectedAttachments.includes(doc.DocumentId) ? '#eff6ff' : 'white',
                        borderColor: selectedAttachments.includes(doc.DocumentId) ? '#bfdbfe' : '#e5e7eb'
                      }}
                    >
                      <div style={{ marginRight: '12px', color: selectedAttachments.includes(doc.DocumentId) ? '#3b82f6' : '#d1d5db', display: 'flex' }}>
                        {selectedAttachments.includes(doc.DocumentId) ? <CheckSquare size={18} /> : <Square size={18} />}
                      </div>
                      <File size={20} color="#6b7280" style={{ marginRight: '8px' }} />
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ fontSize: '13px', fontWeight: 500, color: '#374151', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {doc.FileNameOriginal} {doc.candidateName ? `(${doc.candidateName})` : ''}
                        </div>
                        <div style={{ fontSize: '11px', color: '#6b7280' }}>
                          {doc.FileSizeBytes ? (doc.FileSizeBytes / 1024).toFixed(1) + ' KB • ' : ''}
                          {doc.VersionNo ? `v${doc.VersionNo}` : ''}
                          {doc.IsPrimary ? ' (Primary)' : ''}
                        </div>
                      </div>
                    </div>
                  ));
                } else {
                  return (
                    <div style={{ fontSize: '13px', color: '#6b7280', padding: '10px', background: '#f9fafb', borderRadius: '6px', textAlign: 'center' }}>
                      No documents available for selected candidate(s).
                    </div>
                  );
                }
              })()}
            </div>

            <label className="share-profile-checkbox">
              <input type="checkbox" style={{ accentColor: '#3b82f6', width: 16, height: 16 }} />
              Create Additional Profile for this Resume
            </label>

          </div>
        </div>

        {/* Footer */}
        <div className="share-modal-footer">
          <button className="share-btn-cancel" onClick={onClose} disabled={isSending}>Cancel</button>
          <button className="share-btn-submit" onClick={handleShare} disabled={isSending || selectedAttachments.length === 0}>
            {isSending ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                Sending...
              </span>
            ) : 'Submit'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default ShareResumeModal;
