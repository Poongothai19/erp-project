// src/MSA/components/DocuSignSigningPage.js
// DRAG & DROP SIGNATURE FIELDS ON DOCUMENT - FIXED ALIGNMENT

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ChevronLeft, Plus, X, Send, Loader, Trash2, Move } from 'lucide-react';
import axios from 'axios';
import Swal from 'sweetalert2';
import BASE_URL from "../../url";
import '../styles/MSA.css';
import PdfCanvasViewer from './PdfCanvasViewer';

import { FaSignature, FaFont, FaCalendarAlt, FaUser, FaEnvelope, FaICursor, FaFileAlt, FaUpload, FaCheckCircle, FaEdit, FaCheck, FaExclamationTriangle } from 'react-icons/fa';

// ============================================
// FIELD TYPE DEFINITIONS
// ============================================
const FIELD_TYPES = [
  { id: 'signature',  label: 'Signature',   icon: <FaSignature />, color: '#6366f1', bgColor: 'rgba(99,102,241,0.12)' },
  { id: 'initial',    label: 'Initial',     icon: <FaFont />, color: '#0891b2', bgColor: 'rgba(8,145,178,0.12)'  },
  { id: 'date',       label: 'Date Signed', icon: <FaCalendarAlt />, color: '#7c3aed', bgColor: 'rgba(124,58,237,0.12)' },
  { id: 'name',       label: 'Full Name',   icon: <FaUser />, color: '#059669', bgColor: 'rgba(5,150,105,0.12)'  },
  { id: 'email',      label: 'Email',       icon: <FaEnvelope />, color: '#dc2626', bgColor: 'rgba(220,38,38,0.12)'  },
  { id: 'text',       label: 'Text',        icon: <FaICursor />,  color: '#d97706', bgColor: 'rgba(217,119,6,0.12)'  },
];

const FIELD_SIZES = {
  signature: { width: 180, height: 56 },
  initial:   { width: 80,  height: 40 },
  date:      { width: 130, height: 36 },
  name:      { width: 150, height: 36 },
  email:     { width: 170, height: 36 },
  text:      { width: 150, height: 36 },
};

export default function DocuSignSigningPage({ onBack, preloadedDocument }) {
  const [documentId, setDocumentId]   = useState(null);
  const [documentName, setDocumentName] = useState('');
  
  // Suppress "ResizeObserver loop completed with undelivered notifications" error
  useEffect(() => {
    const handleResizeError = (e) => {
      if (e.message && (
        e.message.includes('ResizeObserver loop completed with undelivered notifications') || 
        e.message.includes('ResizeObserver loop limit exceeded')
      )) {
        e.stopImmediatePropagation();
        e.preventDefault();
        const overlay = document.getElementById('webpack-dev-server-client-overlay');
        if (overlay) overlay.style.display = 'none';
      }
    };
    window.addEventListener('error', handleResizeError);
    return () => window.removeEventListener('error', handleResizeError);
  }, []);

  const [step, setStep]               = useState('upload');
  const [localBlobUrl, setLocalBlobUrl] = useState(null);

  const [uploadedFile, setUploadedFile]   = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading]           = useState(false);
  const fileInputRef                    = useRef(null);

  // Fields placed on the document
  const [fields, setFields]             = useState([]);
  const [selectedFieldId, setSelectedFieldId] = useState(null);
  const [draggingType, setDraggingType] = useState(null);   // type being dragged from sidebar
  const [draggingFieldId, setDraggingFieldId] = useState(null); // existing field being moved
  const dragOffset                      = useRef({ x: 0, y: 0 });

  const [fieldType, setFieldType]       = useState('signature');
  const [recipients, setRecipients]     = useState([
    { id: 1, name: '', email: '', role: 'signer', order: 1 }
  ]);
  const [selectedRecipient, setSelectedRecipient] = useState(1);

  const [error, setError]   = useState(null);
  const [success, setSuccess] = useState(null);

  // Preloaded Document Initialization
  useEffect(() => {
    if (preloadedDocument) {
      if (preloadedDocument.content) {
        const blob = new Blob([preloadedDocument.content], { type: 'text/html' });
        setLocalBlobUrl(URL.createObjectURL(blob));
      }
      setDocumentName(preloadedDocument.name || 'document.html');
      setDocumentId(preloadedDocument.id || null);
      if (preloadedDocument.party) {
        setRecipients([{ 
          id: 1, 
          name: preloadedDocument.party.contactPerson || preloadedDocument.party.companyName || '', 
          email: preloadedDocument.party.email || '', 
          role: 'signer', 
          order: 1 
        }]);
      }
      setStep('addFields'); // Skip upload and preview steps
      setUploadedFile({ documentId: preloadedDocument.id });
    }
  }, [preloadedDocument]);

  // Text annotations on the document
  const [annotations, setAnnotations] = useState([]);
  const [isAddingAnnotation, setIsAddingAnnotation] = useState(false);
  const [editingAnnotationId, setEditingAnnotationId] = useState(null);
  const [draggingAnnotationId, setDraggingAnnotationId] = useState(null);
  const annotationZoneRef = useRef(null);
  
  // Ref for the drop zone container
  const dropZoneRef = useRef(null);

  // ============================================
  // UPLOAD
  // ============================================
  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setLoading(true);
      setError(null);
      const validTypes = [
        'application/pdf','text/html','text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      if (!validTypes.includes(file.type)) {
        setError('Please upload a valid document (PDF, HTML, TXT, DOC, DOCX)');
        return;
      }
      if (file.size > 10 * 1024 * 1024) { setError('File size must be less than 10MB'); return; }

      if (localBlobUrl) URL.revokeObjectURL(localBlobUrl);
      const blobUrl = URL.createObjectURL(file);
      setLocalBlobUrl(blobUrl);
      setDocumentName(file.name);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', file.name);

      const response = await axios.post(`${BASE_URL}/api/msa/documents/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${localStorage.getItem('token')}` },
        onUploadProgress: (e) => setUploadProgress(Math.round((e.loaded * 100) / e.total))
      });

      setUploadedFile(response.data.data);
      setDocumentId(response.data.data.documentId);
      
      setUploadProgress(0);
      setSuccess('Document uploaded!');
      setStep('preview');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload document');
      setUploadProgress(0);
    } finally {
      setLoading(false);
    }
  };

  const handleClearUpload = () => {
    if (localBlobUrl) { URL.revokeObjectURL(localBlobUrl); setLocalBlobUrl(null); }
    setUploadedFile(null); setDocumentId(null); setDocumentName('');
    setFields([]); setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ============================================
  // DRAG FROM SIDEBAR → DROP ON DOCUMENT
  // ============================================
  const handleSidebarDragStart = (e, type) => {
    setDraggingType(type);
    e.dataTransfer.effectAllowed = 'copy';
    // Transparent drag image
    const ghost = document.createElement('div');
    ghost.style.cssText = 'position:fixed;top:-200px;left:-200px;width:1px;height:1px';
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 0, 0);
    setTimeout(() => document.body.removeChild(ghost), 0);
  };

  const handleDropZoneDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = draggingFieldId ? 'move' : 'copy';
  }, [draggingFieldId]);

  const handleDropZoneDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dropZoneRef.current) return;

    const rect = dropZoneRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const fullWidth = dropZoneRef.current.scrollWidth || rect.width;
    const fullHeight = dropZoneRef.current.scrollHeight || rect.height;

    if (draggingFieldId) {
      // Moving an existing field
      setFields(prev => prev.map(f =>
        f.id === draggingFieldId
          ? { ...f, x: Math.max(0, Math.min(x - dragOffset.current.x, fullWidth - f.width)),
                    y: Math.max(0, Math.min(y - dragOffset.current.y, fullHeight - f.height)) }
          : f
      ));
      setDraggingFieldId(null);
    } else if (draggingType) {
      // Dropping a new field
      const typeDef = FIELD_TYPES.find(ft => ft.id === draggingType);
      const size = FIELD_SIZES[draggingType];
      const newField = {
        id: Date.now(),
        type: draggingType,
        label: typeDef.label,
        color: typeDef.color,
        bgColor: typeDef.bgColor,
        icon: typeDef.icon,
        recipientId: selectedRecipient,
        x: Math.max(0, Math.min(x - size.width / 2, fullWidth - size.width)),
        y: Math.max(0, Math.min(y - size.height / 2, fullHeight - size.height)),
        width: size.width,
        height: size.height,
      };
      setFields(prev => [...prev, newField]);
      setSelectedFieldId(newField.id);
      setSuccess(`${typeDef.label} field placed`);
      setTimeout(() => setSuccess(null), 1500);
      setDraggingType(null);
    }
  }, [draggingType, draggingFieldId, selectedRecipient]);

  const handleFieldDragStart = (e, field) => {
    e.stopPropagation();
    setDraggingFieldId(field.id);
    const rect = e.currentTarget.getBoundingClientRect();
    dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    e.dataTransfer.effectAllowed = 'move';
    const ghost = document.createElement('div');
    ghost.style.cssText = 'position:fixed;top:-200px;left:-200px;';
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 0, 0);
    setTimeout(() => document.body.removeChild(ghost), 0);
  };

  // ============================================
  // SHARED DOCUMENT PREVIEW
  // ============================================
  const DocumentPreview = ({ height = '100%', showOverlay = false }) => (
    <div style={{ position: 'relative', width: '100%', height, minHeight: showOverlay ? 700 : 500 }}>
      {/* The actual document */}
      <iframe
        src={localBlobUrl || ''}
        style={{ width: '100%', height: '100%', minHeight: 700, border: 'none', display: 'block', borderRadius: showOverlay ? 0 : '8px' }}
        title="Document Preview"
        onLoad={(e) => {
          try {
            const iframe = e.target;
            const iframeDoc = iframe.contentWindow.document;
            
            // Disable inner scrolling to force parent container to handle scrolling.
            // This ensures drag/drop coordinates perfectly match the HTML document's top.
            iframeDoc.documentElement.style.overflow = 'hidden';
            if (iframeDoc.body) iframeDoc.body.style.overflow = 'hidden';

            const updateHeight = () => {
              if (!iframeDoc.documentElement && !iframeDoc.body) return;
              const docEl = iframeDoc.documentElement || {};
              const body = iframeDoc.body || {};
              const scrollHeight = Math.max(docEl.scrollHeight || 0, body.scrollHeight || 0);
              if (scrollHeight > 700) {
                iframe.style.height = (scrollHeight + 50) + 'px';
              }
            };
            
            updateHeight();
            setTimeout(updateHeight, 500);
            setTimeout(updateHeight, 2000);
            
            if (window.ResizeObserver && iframeDoc.body) {
                let updateScheduled = false;
                const observer = new ResizeObserver(() => {
                  if (updateScheduled) return;
                  updateScheduled = true;
                  window.requestAnimationFrame(() => {
                    updateHeight();
                    updateScheduled = false;
                  });
                });
                observer.observe(iframeDoc.body);
            }
          } catch (err) {
            console.warn("Could not auto-resize iframe: ", err);
          }
        }}
      />
      {/* Transparent drop overlay - captures drag/drop without blocking iframe pointer events when not dragging */}
      {showOverlay && (
        <div
          ref={dropZoneRef}
          onDragOver={handleDropZoneDragOver}
          onDrop={handleDropZoneDrop}
          onDragLeave={() => {}}
          style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            // Only intercept pointer events when a drag is in progress
            pointerEvents: (draggingType || draggingFieldId) ? 'all' : 'none',
            zIndex: 10,
          }}
        >
          {/* Placed fields */}
          {fields.map(field => (
            <div
              key={field.id}
              draggable
              onDragStart={(e) => handleFieldDragStart(e, field)}
              onClick={(e) => { e.stopPropagation(); setSelectedFieldId(field.id); }}
              style={{
                position: 'absolute',
                left: field.x,
                top: field.y,
                width: field.width,
                height: field.height,
                backgroundColor: selectedFieldId === field.id ? field.bgColor.replace('0.12', '0.25') : field.bgColor,
                border: `2px ${selectedFieldId === field.id ? 'solid' : 'dashed'} ${field.color}`,
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'grab',
                padding: '0 8px',
                userSelect: 'none',
                pointerEvents: 'all',
                boxShadow: selectedFieldId === field.id ? `0 0 0 3px ${field.color}33` : 'none',
                transition: 'box-shadow 0.15s',
                gap: 4,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0 }}>
                <span style={{ fontSize: 13 }}>{field.icon}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: field.color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {field.label}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                <Move size={10} color={field.color} style={{ opacity: 0.6 }} />
                <button
                  onClick={(e) => { e.stopPropagation(); setFields(prev => prev.filter(f => f.id !== field.id)); setSelectedFieldId(null); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 1, lineHeight: 1, color: '#dc2626', display: 'flex' }}
                >
                  <X size={10} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ============================================
  // STEP 1: UPLOAD
  // ============================================
  const UploadStep = () => (
    <div className="docusign-container">
      <div className="docusign-header">
        {onBack ? (
          <button onClick={onBack} className="docusign-back-btn">
            <ChevronLeft size={20} /> Back
          </button>
        ) : <div style={{ width: '85px' }} /> /* Balance flexbox */}
        
        <div style={{ textAlign: 'center', flex: 1 }}>
          <h2 style={{ margin: '0' }}><FaFileAlt style={{ marginRight: '8px' }} /> Document Signature Setup</h2>
          <p style={{ margin: '8px 0 0 0' }}>Upload your document, add signature fields, and send for signing</p>
        </div>

        <div style={{ width: '85px' }} /> {/* Balance flexbox */}
      </div>
      <div className="docusign-content">
        <div className="docusign-upload-container">
          {error   && <div className="docusign-error">{error}</div>}
          {success && <div className="docusign-success">{success}</div>}
          {!uploadedFile ? (
            <div className="docusign-upload-area">
              <input ref={fileInputRef} type="file" onChange={handleFileUpload}
                style={{ display: 'none' }} accept=".pdf,.html,.txt,.doc,.docx" disabled={loading} />
              <div className="docusign-upload-icon"><FaUpload /></div>
              <h3>Upload Document</h3>
              <p>PDF, HTML, TXT, DOC, or DOCX (max 10MB)</p>
              <button onClick={() => fileInputRef.current?.click()} disabled={loading} className="docusign-btn-primary">
                {loading ? <><Loader className="spin" size={18} />{uploadProgress}%</> : 'Select Document'}
              </button>
            </div>
          ) : (
            <div className="docusign-file-info">
              <div className="docusign-upload-icon"><FaCheckCircle color="green" /></div>
              <h3>Document Ready</h3>
              <p>{documentName}</p>
              <button onClick={() => setStep('preview')} className="docusign-btn-primary">Preview &amp; Continue →</button>
              <button onClick={handleClearUpload} style={{ marginTop: 10, padding: '10px 20px', border: '2px solid #e5e7eb', borderRadius: 6, background: 'white', cursor: 'pointer', fontWeight: 600, display: 'block', width: '100%' }}>
                Upload Different File
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ============================================
  // STEP 2: PREVIEW
  // ============================================
  const PreviewStep = () => (
    <div className="docusign-container">
      <div className="docusign-header">
        <button onClick={() => setStep('upload')} className="docusign-back-btn"><ChevronLeft size={20} /> Back</button>
        <h2>Preview Document</h2>
        <button onClick={() => setStep('edit')} className="docusign-btn-primary" disabled={!localBlobUrl}>
          Next: Add Fields →
        </button>
      </div>
      <div className="docusign-content" style={{ padding: 0, overflow: 'hidden', borderRadius: 12 }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
          <strong style={{ color: '#1f2937' }}><FaFileAlt /> {documentName}</strong>
        </div>
        <div style={{ height: '75vh' }}>
          <DocumentPreview height="100%" showOverlay={false} />
        </div>
      </div>
    </div>
  );

  // ============================================
  // STEP 2.5: EDIT DOCUMENT (ADD TEXT ANNOTATIONS)
  // ============================================
  const EditStep = () => (
    <div className="docusign-container" style={{ padding: 0, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* HEADER */}
      <div style={{
        background: 'linear-gradient(135deg, #038a77 0%, #026b5e 100%)',
        color: 'white', padding: '14px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
        boxShadow: '0 2px 8px rgba(37,99,235,0.3)'
      }}>
        <button onClick={() => setStep('preview')} className="docusign-back-btn"><ChevronLeft size={20} /> Back</button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: 18 }}><FaEdit /> Edit Document</div>
          <div style={{ fontSize: 12, opacity: 0.85 }}>Add text notes or annotations to the document</div>
        </div>
        <button onClick={() => setStep('addFields')} className="docusign-btn-primary" style={{ background: 'white', color: '#2563eb' }}>
          Next: Add Signature Fields →
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', flex: 1, overflow: 'hidden' }}>
        {/* Edit toolbar */}
        <div style={{ background: 'white', borderRight: '1px solid #e5e7eb', padding: '20px 16px', overflowY: 'auto' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#9ca3af', marginBottom: 12 }}>
            EDIT TOOLS
          </div>

          <button onClick={() => setIsAddingAnnotation(!isAddingAnnotation)} style={{
            width: '100%', padding: '12px', borderRadius: 8, border: `2px solid ${isAddingAnnotation ? '#2563eb' : '#e5e7eb'}`,
            background: isAddingAnnotation ? 'rgba(37,99,235,0.08)' : '#f8fafc',
            cursor: 'pointer', fontWeight: 600, fontSize: 13, color: isAddingAnnotation ? '#2563eb' : '#374151',
            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10
          }}>
            <span style={{ fontSize: 16 }}>{isAddingAnnotation ? <FaCheckCircle /> : <FaEdit />}</span>
            {isAddingAnnotation ? 'Click on document to place text' : 'Add Text Annotation'}
          </button>

          {/* Annotations list */}
          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 12, marginTop: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#9ca3af', marginBottom: 8 }}>
              ANNOTATIONS ({annotations.length})
            </div>
            {annotations.map(ann => (
              <div key={ann.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '6px 8px', marginBottom: 4, borderRadius: 6,
                background: editingAnnotationId === ann.id ? '#eff6ff' : '#f9fafb',
                border: `1px solid ${editingAnnotationId === ann.id ? '#2563eb' : '#e5e7eb'}`,
                fontSize: 12
              }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160, color: '#374151' }}>
                  <FaEdit /> {ann.text || '(empty)'}
                </span>
                <button onClick={() => setAnnotations(prev => prev.filter(a => a.id !== ann.id))}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: 2 }}>
                  <X size={12} />
                </button>
              </div>
            ))}
            {annotations.length === 0 && (
              <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: 12, padding: '15px 0' }}>
                No annotations yet
              </div>
            )}
          </div>
          {success && <div className="docusign-success" style={{ padding: '8px 12px', fontSize: 12, marginTop: 10 }}>{success}</div>}
        </div>

        {/* Document area */}
        <div style={{ background: '#525659', overflow: 'auto' }}>
          <div style={{ padding: '24px', display: 'flex', justifyContent: 'center', minHeight: '100%' }}>
            <div ref={annotationZoneRef} onClick={(e) => {
              if (!isAddingAnnotation || !annotationZoneRef.current) return;
              const rect = annotationZoneRef.current.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const y = e.clientY - rect.top;
              const newAnno = { id: Date.now(), x, y, text: '', fontSize: 14, color: '#1f2937' };
              setAnnotations(prev => [...prev, newAnno]);
              setEditingAnnotationId(newAnno.id);
              setIsAddingAnnotation(false);
              setSuccess('Click on the text to edit it');
              setTimeout(() => setSuccess(null), 2000);
            }} 
            onDragOver={(e) => {
              if (draggingAnnotationId) {
                e.preventDefault();
                e.stopPropagation();
                e.dataTransfer.dropEffect = 'move';
              }
            }}
            onDrop={(e) => {
              if (draggingAnnotationId && annotationZoneRef.current) {
                e.preventDefault();
                e.stopPropagation();
                const rect = annotationZoneRef.current.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const fullWidth = annotationZoneRef.current.scrollWidth || rect.width;
                const fullHeight = annotationZoneRef.current.scrollHeight || rect.height;
                setAnnotations(prev => prev.map(a => 
                  a.id === draggingAnnotationId
                    ? { ...a, x: Math.max(0, Math.min(x - dragOffset.current.x, fullWidth - 100)),
                              y: Math.max(0, Math.min(y - dragOffset.current.y, fullHeight - 24)) }
                    : a
                ));
                setDraggingAnnotationId(null);
              }
            }}
            style={{
              position: 'relative', width: 850,
              background: 'white', boxShadow: '0 4px 24px rgba(0,0,0,0.35)', flexShrink: 0,
              cursor: isAddingAnnotation ? 'crosshair' : 'default'
            }}>
              {/* Render PDF as canvas elements - no z-index issues */}
              {documentName.toLowerCase().endsWith('.pdf')
                ? <PdfCanvasViewer url={localBlobUrl} width={850} />
                : <iframe src={localBlobUrl || ''} style={{ width: '100%', height: 1100, border: 'none', display: 'block' }} title="Document" />
              }

              {isAddingAnnotation && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 5 }} />
              )}

              {/* Annotation overlays */}
              {annotations.map(ann => (
                <div key={ann.id} 
                  draggable={editingAnnotationId !== ann.id}
                  onDragStart={(e) => {
                    e.stopPropagation();
                    setDraggingAnnotationId(ann.id);
                    const rect = e.currentTarget.getBoundingClientRect();
                    dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
                    e.dataTransfer.effectAllowed = 'move';
                    const ghost = document.createElement('div');
                    ghost.style.cssText = 'position:fixed;top:-200px;left:-200px;';
                    document.body.appendChild(ghost);
                    e.dataTransfer.setDragImage(ghost, 0, 0);
                    setTimeout(() => document.body.removeChild(ghost), 0);
                  }}
                  onDragEnd={() => setDraggingAnnotationId(null)}
                  style={{
                    position: 'absolute', left: ann.x, top: ann.y, zIndex: 15,
                    minWidth: 100, padding: '2px', cursor: editingAnnotationId !== ann.id ? 'grab' : 'default',
                  }} onClick={e => { e.stopPropagation(); setEditingAnnotationId(ann.id); }}>
                  <input
                    type="text"
                    autoFocus={editingAnnotationId === ann.id}
                    value={ann.text}
                    onChange={e => {
                      const val = e.target.value;
                      setAnnotations(prev => prev.map(a => a.id === ann.id ? { ...a, text: val } : a));
                    }}
                    onBlur={() => setEditingAnnotationId(null)}
                    placeholder="Type here..."
                    style={{
                      border: editingAnnotationId === ann.id ? '2px solid #2563eb' : '1px dashed #93c5fd',
                      background: editingAnnotationId === ann.id ? 'rgba(37,99,235,0.05)' : 'transparent',
                      borderRadius: 4, padding: '4px 8px',
                      fontSize: ann.fontSize || 14, color: ann.color || '#1f2937',
                      fontWeight: 600, outline: 'none', minWidth: 120,
                      cursor: 'text'
                    }}
                  />
                  <button onClick={(e) => { e.stopPropagation(); setAnnotations(prev => prev.filter(a => a.id !== ann.id)); }}
                    style={{
                      position: 'absolute', top: -8, right: -8,
                      background: '#dc2626', color: 'white', border: 'none',
                      borderRadius: '50%', width: 18, height: 18, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, fontWeight: 700, lineHeight: 1
                    }}>×</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ============================================
  // STEP 3: ADD FIELDS (DRAG & DROP)
  // ============================================
  const AddFieldsStep = () => (
    <div className="docusign-container" style={{ padding: 0, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{
        background: 'linear-gradient(135deg, #038a77 0%, #026b5e 100%)',
        color: 'white', padding: '14px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
        boxShadow: '0 2px 8px rgba(3,138,119,0.3)'
      }}>
        <button onClick={() => setStep('preview')} className="docusign-back-btn"><ChevronLeft size={20} /> Back</button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: 18 }}>Add Signature Fields</div>
          <div style={{ fontSize: 12, opacity: 0.85 }}>Drag fields from the left panel onto your document</div>
        </div>
        <button onClick={() => setStep('recipients')} className="docusign-btn-primary">
          Next: Recipients →
        </button>
      </div>

      {/* Main 2-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', flex: 1, overflow: 'hidden' }}>

        {/* ── LEFT PANEL ── */}
        <div style={{
          background: 'white', borderRight: '1px solid #e5e7eb',
          overflowY: 'auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16
        }}>
          {/* Field type palette */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#9ca3af', marginBottom: 10 }}>
              DRAG TO ADD FIELDS
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {FIELD_TYPES.map(ft => (
                <div
                  key={ft.id}
                  draggable
                  onDragStart={(e) => handleSidebarDragStart(e, ft.id)}
                  onDragEnd={() => setDraggingType(null)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px',
                    background: draggingType === ft.id ? ft.bgColor : '#f8fafc',
                    border: `2px solid ${draggingType === ft.id ? ft.color : '#e5e7eb'}`,
                    borderLeft: `4px solid ${ft.color}`,
                    borderRadius: 8, cursor: 'grab',
                    transition: 'all 0.15s', userSelect: 'none',
                    transform: draggingType === ft.id ? 'scale(0.97)' : 'scale(1)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = ft.bgColor; e.currentTarget.style.borderColor = ft.color; }}
                  onMouseLeave={e => { if (draggingType !== ft.id) { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.borderLeftColor = ft.color; }}}
                >
                  <span style={{ fontSize: 16, width: 22, textAlign: 'center' }}>{ft.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{ft.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recipient picker */}
          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#9ca3af', marginBottom: 8 }}>
              ASSIGN TO
            </div>
            <select
              value={selectedRecipient}
              onChange={(e) => setSelectedRecipient(parseInt(e.target.value))}
              style={{ width: '100%', padding: '8px 10px', border: '2px solid #e5e7eb', borderRadius: 6, fontSize: 13, fontFamily: 'inherit', cursor: 'pointer' }}
            >
              {recipients.map(r => (
                <option key={r.id} value={r.id}>{r.name || `Recipient ${r.id}`}</option>
              ))}
            </select>
          </div>

          {/* Placed fields list */}
          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 16, flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#9ca3af' }}>
                PLACED FIELDS
              </div>
              <span style={{ fontSize: 11, background: '#038a77', color: 'white', borderRadius: 10, padding: '1px 7px', fontWeight: 700 }}>
                {fields.length}
              </span>
            </div>
            {fields.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: '#9ca3af', fontSize: 12 }}>
                Drag fields onto the document →
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {fields.map(field => (
                  <div
                    key={field.id}
                    onClick={() => setSelectedFieldId(field.id)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '8px 10px',
                      background: selectedFieldId === field.id ? field.bgColor : '#f9fafb',
                      border: `1px solid ${selectedFieldId === field.id ? field.color : '#e5e7eb'}`,
                      borderLeft: `3px solid ${field.color}`,
                      borderRadius: 6, cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                      <span style={{ fontSize: 12 }}>{field.icon}</span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#1f2937' }}>{field.label}</div>
                        <div style={{ fontSize: 10, color: '#9ca3af', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {recipients.find(r => r.id === field.recipientId)?.name || `Recipient ${field.recipientId}`}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setFields(prev => prev.filter(f => f.id !== field.id)); if (selectedFieldId === field.id) setSelectedFieldId(null); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: 3, borderRadius: 4, display: 'flex', flexShrink: 0 }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {success && <div className="docusign-success" style={{ padding: '8px 12px', fontSize: 12 }}>{success}</div>}
        </div>

        {/* ── RIGHT PANEL: DOCUMENT + DROP OVERLAY ── */}
        <div
          style={{ background: '#525659', overflow: 'auto', position: 'relative' }}
          onDragOver={handleDropZoneDragOver}
          onDrop={handleDropZoneDrop}
          onClick={() => setSelectedFieldId(null)}
        >
          {/* Drop hint banner */}
          {draggingType && (
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100,
              background: 'rgba(3,138,119,0.9)', color: 'white',
              textAlign: 'center', padding: '10px', fontWeight: 600, fontSize: 13,
              pointerEvents: 'none'
            }}>
              ↓ Drop field anywhere on the document below
            </div>
          )}

          {/* Scrollable page wrapper */}
          <div style={{ padding: '24px', display: 'flex', justifyContent: 'center', minHeight: '100%' }}>
            <div
              ref={dropZoneRef}
              style={{
                position: 'relative',
                width: 850,
                background: 'white',
                boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
                flexShrink: 0,
              }}
            >
              {/* PDF rendered as canvas elements - fields overlay ON TOP properly */}
              {documentName.toLowerCase().endsWith('.pdf')
                ? <PdfCanvasViewer url={localBlobUrl} width={850} />
                : <iframe 
                    src={localBlobUrl || ''} 
                    style={{ width: '100%', height: 1100, border: 'none', display: 'block' }} 
                    title="Document" 
                    onLoad={(e) => {
                      try {
                        const iframeDoc = e.target.contentWindow.document;
                        const scrollHeight = Math.max(iframeDoc.documentElement.scrollHeight, iframeDoc.body.scrollHeight);
                        if (scrollHeight > 1100) {
                          e.target.style.height = (scrollHeight + 50) + 'px';
                        }
                      } catch (err) {
                        console.warn("Could not auto-resize iframe: ", err);
                      }
                    }}
                  />
              }

              {/* Transparent capture layer for drag and drop */}
              <div
                onDragOver={handleDropZoneDragOver}
                onDrop={handleDropZoneDrop}
                style={{
                  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                  pointerEvents: (draggingType || draggingFieldId) ? 'all' : 'none',
                  zIndex: 10,
                }}
              />

              {/* Field overlays - always on top */}
              {fields.map(field => (
                <div
                  key={field.id}
                  draggable
                  onDragStart={(e) => handleFieldDragStart(e, field)}
                  onDragEnd={() => setDraggingFieldId(null)}
                  onClick={(e) => { e.stopPropagation(); setSelectedFieldId(field.id); }}
                  style={{
                    position: 'absolute',
                    left: field.x,
                    top: field.y,
                    width: field.width,
                    height: field.height,
                    zIndex: 9999, /* High z-index to stay above iframe */
                    backgroundColor: selectedFieldId === field.id
                      ? field.bgColor.replace('0.12', '0.3')
                      : field.bgColor,
                    border: `2px ${selectedFieldId === field.id ? 'solid' : 'dashed'} ${field.color}`,
                    borderRadius: 6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'grab',
                    padding: '0 8px',
                    userSelect: 'none',
                    boxShadow: selectedFieldId === field.id
                      ? `0 0 0 3px ${field.color}44, 0 2px 8px rgba(0,0,0,0.2)`
                      : '0 1px 4px rgba(0,0,0,0.1)',
                    transition: 'box-shadow 0.15s',
                    pointerEvents: 'all',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0, overflow: 'hidden' }}>
                    <span style={{ fontSize: 14, flexShrink: 0 }}>{field.icon}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: field.color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {field.label}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                    <Move size={10} color={field.color} />
                    <button
                      onClick={(e) => { e.stopPropagation(); setFields(prev => prev.filter(f => f.id !== field.id)); setSelectedFieldId(null); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '1px', color: '#dc2626', display: 'flex', alignItems: 'center' }}
                    >
                      <X size={11} />
                    </button>
                  </div>
                </div>
              ))}

              {/* Annotations from Edit step - shown as read-only text */}
              {annotations.map(ann => (
                <div key={`ann-${ann.id}`} style={{
                  position: 'absolute', left: ann.x, top: ann.y, zIndex: 15,
                  fontSize: ann.fontSize || 14, color: ann.color || '#1f2937',
                  fontWeight: 600, pointerEvents: 'none',
                  padding: '2px 6px', background: 'rgba(37,99,235,0.06)',
                  borderRadius: 3, border: '1px dashed rgba(37,99,235,0.3)',
                }}>
                  {ann.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ============================================
  // STEP 4: RECIPIENTS
  // ============================================
  const RecipientsStep = () => (
    <div className="docusign-container">
      <div className="docusign-header">
        <button onClick={() => setStep('addFields')} className="docusign-back-btn"><ChevronLeft size={20} /> Back</button>
        <h2>Add Recipients</h2>
        <button onClick={() => setStep('review')} className="docusign-btn-primary">Review & Send →</button>
      </div>
      <div className="docusign-content">
        <div className="docusign-recipients-container">
          <h3>Recipients</h3>
          {recipients.map((recipient, index) => (
            <div key={recipient.id} className="docusign-recipient-card">
              <h4>Recipient {index + 1}</h4>
              <div className="docusign-recipient-grid">
                <div className="docusign-recipient-field">
                  <label>Name *</label>
                  <input type="text" placeholder="Full Name" value={recipient.name}
                    onChange={(e) => { const u=[...recipients]; u[index].name=e.target.value; setRecipients(u); }} />
                </div>
                <div className="docusign-recipient-field">
                  <label>Email *</label>
                  <input type="email" placeholder="recipient@example.com" value={recipient.email}
                    onChange={(e) => { const u=[...recipients]; u[index].email=e.target.value; setRecipients(u); }} />
                </div>
              </div>
              <div className="docusign-recipient-field">
                <label>Role:</label>
                <select value={recipient.role} onChange={(e) => { const u=[...recipients]; u[index].role=e.target.value; setRecipients(u); }}>
                  <option value="signer">Signer</option>
                  <option value="reviewer">Reviewer</option>
                  <option value="cc">CC (Copy)</option>
                </select>
              </div>
              {recipients.length > 1 && (
                <button onClick={() => setRecipients(recipients.filter((_,i)=>i!==index))} className="docusign-remove-recipient">
                  Remove Recipient
                </button>
              )}
            </div>
          ))}
          <button
            onClick={() => setRecipients([...recipients, { id: Math.max(...recipients.map(r=>r.id))+1, name:'', email:'', role:'signer', order:recipients.length+1 }])}
            className="docusign-add-recipient"
          >+ Add Another Recipient</button>
        </div>
      </div>
    </div>
  );

  // ============================================
  // STEP 5: REVIEW & SEND
  // ============================================
  const handleSendForSigning = async () => {
    try {
      const validRecipients = recipients.filter(r => r.email && r.name);
      if (validRecipients.length === 0) { setError('Please add at least one valid recipient'); return; }
      if (fields.length === 0) { setError('Please add at least one signature field'); return; }
      setLoading(true); setError(null);

      // Convert annotations to field-like objects (safe - won't block send if it fails)
      let annotationFields = [];
      try {
        if (annotations && annotations.length > 0) {
          annotationFields = annotations
            .filter(a => a && a.text && a.text.trim())
            .map(a => ({
              id: a.id || Date.now(),
              type: 'annotation',
              label: 'Text Note',
              x: a.x || 0,
              y: a.y || 0,
              width: Math.max(120, (a.text || '').length * 8),
              height: 24,
              value: a.text || '',
              fontSize: a.fontSize || 14,
              color: a.color || '#1f2937',
              isAnnotation: true
            }));
        }
        console.log('Annotations to include:', annotationFields.length);
      } catch (annErr) {
        console.warn('⚠️ Could not process annotations, sending without them:', annErr);
        annotationFields = [];
      }

      for (let recipient of validRecipients) {
        const recipientFields = fields.filter(f => f.recipientId === recipient.id);
        const sigFields = recipientFields.length > 0 ? recipientFields : fields;
        // Strip non-serializable properties (like React elements from icon)
        const cleanFields = [...sigFields, ...annotationFields].map(f => ({
          id: f.id,
          type: f.type,
          label: f.label,
          x: f.x,
          y: f.y,
          width: f.width,
          height: f.height,
          recipientId: f.recipientId,
          value: f.value || '',
          fontSize: f.fontSize,
          color: f.color,
          bgColor: f.bgColor,
          isAnnotation: f.isAnnotation || false
        }));

        console.log('Sending', cleanFields.length, 'fields for', recipient.email);

        await axios.post(`${BASE_URL}/api/msa/documents/upload/send-docusign`,
          { 
            uploadedDocumentId: documentId, 
            fileName: documentName, 
            recipientEmail: recipient.email, 
            recipientName: recipient.name, 
            recipientTitle: recipient.role,
            fields: cleanFields
          },
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
      }
      Swal.fire({ title:'Success!', text:`Document sent to ${validRecipients.length} recipient(s) for signing.`, icon:'success', confirmButtonText:'Done' })
        .then(() => { handleClearUpload(); setStep('upload'); setFields([]); setAnnotations([]); setRecipients([{id:1,name:'',email:'',role:'signer',order:1}]); });
    } catch (err) {
      console.error('❌ Send error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to send document');
    } finally { setLoading(false); }
  };

  const ReviewStep = () => (
    <div className="docusign-container">
      <div className="docusign-header">
        <button onClick={() => setStep('recipients')} className="docusign-back-btn"><ChevronLeft size={20} /> Back</button>
        <h2>Review & Send</h2>
        <button onClick={handleSendForSigning} disabled={loading} className="docusign-btn-primary">
          {loading ? <Loader className="spin" size={18} /> : <Send size={18} />}
          {loading ? 'Sending...' : 'Send Document'}
        </button>
      </div>
      <div className="docusign-content">
        <div className="docusign-review-container">
          <div className="docusign-review-card">
            <h3>Document Summary</h3>
            <p><strong>Document:</strong> {documentName}</p>
            <p><strong>Fields Added:</strong> {fields.length}</p>
            <p><strong>Recipients:</strong> {recipients.filter(r=>r.email).length}</p>
          </div>
          <div className="docusign-review-section">
            <h3>Recipients</h3>
            {recipients.filter(r=>r.email).length > 0 ? (
              <ul className="docusign-review-list">
                {recipients.filter(r=>r.email).map(r => (
                  <li key={r.id}><strong>{r.name}</strong> ({r.email}) — {r.role}</li>
                ))}
              </ul>
            ) : <p style={{color:'#dc2626'}}><FaExclamationTriangle /> No valid recipients added</p>}
          </div>
          <div className="docusign-review-section">
            <h3>Signature Fields ({fields.length})</h3>
            {fields.length > 0 ? (
              <ul className="docusign-review-list">
                {fields.map(f => (
                  <li key={f.id}>
                    <span style={{ marginRight: 6 }}>{f.icon}</span>
                    <strong>{f.label}</strong> — {recipients.find(r=>r.id===f.recipientId)?.name || `Recipient ${f.recipientId}`}
                  </li>
                ))}
              </ul>
            ) : <p style={{color:'#9ca3af'}}>No fields added</p>}
          </div>
          {error && <div className="docusign-error">{error}</div>}
        </div>
      </div>
    </div>
  );

  // ============================================
  // RENDER
  // ============================================
  return (
    <>
      {step === 'upload'     && UploadStep()}
      {step === 'preview'    && PreviewStep()}
      {step === 'edit'       && EditStep()}
      {step === 'addFields'  && AddFieldsStep()}
      {step === 'recipients' && RecipientsStep()}
      {step === 'review'     && ReviewStep()}
    </>
  );
}