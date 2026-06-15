import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Building,
  Users,
  Search,
  Eye,
  ChevronLeft,
  Clock,
  CheckCircle,
  AlertCircle,
  X,
  User,
  FileText,
  Briefcase,
  Mail,
  Phone,
  ArrowRight,
  Calendar,
  MapPin,
  DollarSign,
  GraduationCap,
  BookOpen,
  Award,
  Hash,
  Download,
  Send,
  Mail as MailIcon,
  Plus,
  Key,
  Building2,
  Edit3,
  Trash2,
  Save,
  Shield,
  ShieldCheck,
  RotateCcw,
  Upload
} from 'lucide-react';
import axios from 'axios';
import * as pdfjsLib from 'pdfjs-dist';
import BASE_URL from "../../url";
import Swal from 'sweetalert2';
import '../styles/OnboardingPage.css';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
const DocumentPreviewOverlay = React.memo(({ previewDoc, onClose }) => {
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pageRendering, setPageRendering] = useState(false);
  const [pdfDoc, setPdfDoc] = useState(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const renderTaskRef = useRef(null);
  const isMountedRef = useRef(true);
  const isRenderingRef = useRef(false);

  const signaturePage = parseInt(previewDoc?.signaturePage) || parseInt(previewDoc?.page) || 1;
  const isImage = (fileType) => fileType?.includes('image');

  // Cancel any ongoing render task
  const cancelRenderTask = useCallback(() => {
    if (renderTaskRef.current) {
      try {
        renderTaskRef.current.cancel();
      } catch (e) {
        // Ignore cancellation errors
      }
      renderTaskRef.current = null;
    }
  }, []);

  // Clean up PDF document
  const cleanupPdf = useCallback(() => {
    cancelRenderTask();
    if (pdfDoc) {
      try {
        pdfDoc.destroy();
      } catch (e) {
        // Ignore destroy errors
      }
      setPdfDoc(null);
    }
  }, [pdfDoc, cancelRenderTask]);

  // Load and render PDF page
  const renderPage = useCallback(async (doc, pageNum) => {
    if (!doc || !canvasRef.current || !isMountedRef.current || isRenderingRef.current) return;
    
    cancelRenderTask();
    isRenderingRef.current = true;
    setPageRendering(true);

    try {
      const page = await doc.getPage(pageNum);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      const viewport = page.getViewport({ scale: 1.5 });
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      // Clear canvas with white background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const renderTask = page.render({
        canvasContext: ctx,
        viewport: viewport
      });
      renderTaskRef.current = renderTask;
      
      await renderTask.promise;
      renderTaskRef.current = null;
    } catch (err) {
      if (err?.name !== 'RenderingCancelledException' && isMountedRef.current) {
        console.error('Error rendering PDF page:', err);
      }
    } finally {
      isRenderingRef.current = false;
      if (isMountedRef.current) {
        setPageRendering(false);
      }
    }
  }, [cancelRenderTask]);

  // Initialize PDF from data
  const initPdf = useCallback(async (dataUrl) => {
    if (!isMountedRef.current) return;
    
    try {
      let pdfData;
      if (dataUrl.startsWith('data:')) {
        const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
        const binaryStr = atob(base64);
        const len = binaryStr.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) bytes[i] = binaryStr.charCodeAt(i);
        pdfData = bytes;
      } else {
        pdfData = dataUrl;
      }
      
      const doc = await pdfjsLib.getDocument({ data: pdfData }).promise;
      if (!isMountedRef.current) {
        doc.destroy();
        return;
      }
      
      setPdfDoc(doc);
      setTotalPages(doc.numPages);
      setError(false);
    } catch (err) {
      console.error('Error initializing PDF:', err);
      if (err?.name !== 'RenderingCancelledException' && isMountedRef.current) {
        setError(true);
      }
    }
  }, []);

  // Main load effect
  useEffect(() => {
    isMountedRef.current = true;
    setCurrentPage(signaturePage);
    
    const loadDocument = async () => {
      setLoading(true);
      setError(false);
      
      try {
        let dataUrl = null;
        
        // Get document data from various possible locations
        if (previewDoc?.data && previewDoc.data.length > 500) {
          dataUrl = previewDoc.data;
          if (!dataUrl.startsWith('data:')) {
            dataUrl = `data:${previewDoc.fileType || 'application/pdf'};base64,${dataUrl}`;
          }
        } else if (previewDoc?.url && previewDoc.url.length > 500) {
          dataUrl = previewDoc.url;
        }
        
        if (dataUrl && previewDoc.fileType?.includes('pdf')) {
          // Ensure PDF data has proper prefix
          let pdfDataToLoad = dataUrl;
          
          if (dataUrl.startsWith('data:')) {
            // Fix PDF data URL if needed
            if (!dataUrl.startsWith('data:application/pdf') && !dataUrl.startsWith('data:application/octet-stream')) {
              const base64Part = dataUrl.split(',')[1];
              if (base64Part && base64Part.length > 100) {
                pdfDataToLoad = `data:application/pdf;base64,${base64Part}`;
              }
            }
          } else if (!dataUrl.includes('base64,')) {
            pdfDataToLoad = `data:application/pdf;base64,${dataUrl}`;
          }
          
          await initPdf(pdfDataToLoad);
        } else if (dataUrl && !previewDoc.fileType?.includes('pdf')) {
          // Handle images
          const res = await fetch(dataUrl);
          const blob = await res.blob();
          if (isMountedRef.current) {
            setBlobUrl(URL.createObjectURL(blob));
          }
        } else if (previewDoc?.url) {
          const token = localStorage.getItem('token');
          const response = await fetch(previewDoc.url, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
          });
          if (!response.ok) throw new Error('Failed to fetch document');
          const blob = await response.blob();
          if (isMountedRef.current) {
            const url = URL.createObjectURL(blob);
            setBlobUrl(url);
            if (previewDoc.fileType?.includes('pdf')) {
              const reader = new FileReader();
              reader.onload = (e) => initPdf(e.target.result);
              reader.readAsDataURL(blob);
            }
          }
        }
      } catch (err) {
        console.error('Error loading document:', err);
        if (isMountedRef.current) setError(true);
      } finally {
        if (isMountedRef.current) setLoading(false);
      }
    };
    
    loadDocument();
    
    return () => {
      isMountedRef.current = false;
    };
  }, [previewDoc, initPdf, signaturePage]);

  // Handle page changes
  useEffect(() => {
    if (!pdfDoc || !isMountedRef.current) return;
    
    renderPage(pdfDoc, currentPage);
  }, [currentPage, pdfDoc, renderPage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      cleanupPdf();
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [cleanupPdf, blobUrl]);

  if (!previewDoc) return null;

  const showSignature = previewDoc.signature && !previewDoc.isEmbedded && signaturePage === currentPage;

  return (
    <>
      <div className="onboarding-modal-backdrop" onClick={onClose} />
      <div className="onboarding-modal-pdf-full">
        <div className="onboarding-modal-header" style={{ background: '#1d8c70', color: 'white', border: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Eye size={18} color="white" />
            <span style={{ fontWeight: '600', fontSize: '15px' }}>{previewDoc.label || 'Document Preview'}</span>
            {previewDoc.fileName && (
              <span style={{ fontSize: '12px', opacity: 0.85, fontWeight: '400' }}>
                — {previewDoc.fileName}
              </span>
            )}
            {previewDoc.signedName && (
              <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '12px' }}>
                ✓ Signed by {previewDoc.signedName}
              </span>
            )}
            {!previewDoc.isEmbedded && previewDoc.signature && (
              <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '12px' }}>
                Signature on Page {signaturePage}
              </span>
            )}
          </div>
          <button 
            onClick={onClose}
            style={{ 
              background: 'rgba(255, 255, 255, 0.15)', 
              color: 'white', 
              border: 'none', 
              padding: '6px', 
              borderRadius: '8px', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'; }}
          >
            <X size={18} />
          </button>
        </div>
        
        <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', background: '#323639', padding: '40px 20px' }} ref={containerRef}>
          <div className="pdf-preview-container" style={{ position: 'relative', margin: '0 auto', background: 'white', boxShadow: '0 10px 30px rgba(0,0,0,0.3)', width: '100%', maxWidth: '900px', minHeight: '600px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {(loading || pageRendering) && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(255,255,255,0.7)', zIndex: 20 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: '40px', height: '40px', border: '3px solid #f3f3f3', borderTop: '3px solid #1d8c70', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
                  <p style={{ marginTop: '10px', color: '#1d8c70', fontWeight: '500' }}>{loading ? 'Loading document...' : `Rendering Page ${currentPage}...`}</p>
                  <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                </div>
              </div>
            )}
            
            {error ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#666' }}>
                <AlertCircle size={48} color="#dc2626" />
                <p>Error loading document preview.</p>
                <p style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>The document may be corrupted or in an unsupported format.</p>
                <button onClick={() => window.location.reload()} style={{ marginTop: '10px', padding: '8px 16px', background: '#1d8c70', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Retry</button>
              </div>
            ) : isImage(previewDoc.fileType) ? (
              <img src={blobUrl || previewDoc.url} alt={previewDoc.fileName} style={{ maxWidth: '100%', display: 'block' }} />
            ) : (
              <div style={{ position: 'relative', width: '100%' }}>
                <canvas ref={canvasRef} style={{ width: '100%', height: 'auto', display: 'block' }} />
                
                {showSignature && (() => {
                  try {
                    const posData = previewDoc.signaturePosition || previewDoc.position;
                    const pos = typeof posData === 'string' ? JSON.parse(posData) : (posData || { x: 50, y: 70 });
                    return (
                      <div
                        style={{
                          position: 'absolute',
                          left: `${pos.x}%`,
                          top: `${pos.y}%`,
                          transform: `translate(-50%, -85%) rotate(${previewDoc.signatureRotation || 0}deg)`,
                          pointerEvents: 'none',
                          zIndex: 25
                        }}
                      >
                        <img 
                          src={previewDoc.signature || previewDoc.signatureData} 
                          alt="signature" 
                          style={{ height: '70px', width: 'auto', mixBlendMode: 'multiply' }} 
                        />
                      </div>
                    );
                  } catch (e) {
                    console.error('Error parsing signature position:', e);
                    return null;
                  }
                })()}
              </div>
            )}
            
            {totalPages > 1 && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '20px', 
                margin: '20px 0', 
                padding: '10px 20px', 
                background: '#f8f9fa', 
                borderRadius: '30px',
                border: '1px solid #ddd',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                <button 
                  onClick={() => {
                    if (currentPage > 1 && !pageRendering) {
                      setCurrentPage(p => Math.max(1, p - 1));
                    }
                  }}
                  disabled={currentPage === 1 || pageRendering}
                  style={{ background: 'white', color: '#1d8c70', border: '1px solid #1d8c70', padding: '6px 16px', borderRadius: '20px', cursor: 'pointer', fontWeight: '500', opacity: currentPage === 1 || pageRendering ? 0.5 : 1 }}
                >
                  Previous
                </button>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>
                  Page {currentPage} of {totalPages}
                  {signaturePage === currentPage && previewDoc.signature && (
                    <span style={{ marginLeft: '10px', fontSize: '11px', color: '#1d8c70', background: '#e6f7f2', padding: '2px 8px', borderRadius: '12px' }}>
                      ✓ Signature on this page
                    </span>
                  )}
                </span>
                <button 
                  onClick={() => {
                    if (currentPage < totalPages && !pageRendering) {
                      setCurrentPage(p => Math.min(totalPages, p + 1));
                    }
                  }}
                  disabled={currentPage === totalPages || pageRendering}
                  style={{ background: '#1d8c70', color: 'white', border: 'none', padding: '6px 16px', borderRadius: '20px', cursor: 'pointer', fontWeight: '500', opacity: currentPage === totalPages || pageRendering ? 0.5 : 1 }}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="onboarding-modal-footer">
          <button className="pdf-close-btn" onClick={onClose}>
            Close
          </button>
          {(previewDoc.url || previewDoc.data || blobUrl) && (
            <a 
              href={previewDoc.data && previewDoc.data.startsWith('data:') ? previewDoc.data : (blobUrl || previewDoc.url)} 
              download={previewDoc.fileName || 'signed_document.pdf'}
              className="pdf-download-btn"
              style={{
                padding: '6px 16px',
                background: '#019d88',
                color: 'white',
                borderRadius: '6px',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: '500',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Download size={14} />
              Download {previewDoc.fileType?.includes('pdf') ? 'Signed PDF' : 'Document'}
            </a>
          )}
        </div>
      </div>
    </>
  );
});

DocumentPreviewOverlay.displayName = 'DocumentPreviewOverlay';





// ============================================================
// CANDIDATE FORM DATA MODAL - WITH ADMIN EDIT FUNCTIONALITY
// ============================================================
const CandidateFormModal = React.memo(({
  isOpen,
  formData,
  documentPaths,
  candidateName,
  companyId,
  employeeId,
  onClose,
  onFormUpdated,
  onDocumentDeleted
}) => {
  const [previewDoc, setPreviewDoc] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedFormData, setEditedFormData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [localDocumentPaths, setLocalDocumentPaths] = useState(documentPaths || {});

  // Update local document paths when prop changes
  useEffect(() => {
    setLocalDocumentPaths(documentPaths || {});
  }, [documentPaths]);

  // Initialize edited form data when entering edit mode
  useEffect(() => {
    if (isEditing && formData) {
      setEditedFormData(JSON.parse(JSON.stringify(formData))); // Deep clone
    }
  }, [isEditing, formData]);

  const handleEditField = (section, field, value) => {
    setEditedFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveChanges = async () => {
    if (!editedFormData) return;

    setSaving(true);
    try {
      const token = localStorage.getItem('token');

      const response = await axios.put(
        `${BASE_URL}/api/onboarding-workflow-employees/company/${companyId}/${employeeId}/admin-update-form`,
        editedFormData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        alert('✅ Candidate form data updated successfully!');
        setIsEditing(false);
        if (onFormUpdated) {
          onFormUpdated(editedFormData);
        }
      }
    } catch (error) {
      console.error('Error saving form data:', error);
      alert('Error saving changes: ' + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedFormData(null);
  };

  const handleDocumentDelete = async (documentType) => {
    if (!window.confirm(`Are you sure you want to delete this document?`)) return;

    try {
      const token = localStorage.getItem('token');

      const response = await axios.delete(
        `${BASE_URL}/api/onboarding-workflow-employees/company/${companyId}/${employeeId}/document/${documentType}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        // Update local document paths
        const newDocumentPaths = { ...localDocumentPaths };
        delete newDocumentPaths[documentType];
        setLocalDocumentPaths(newDocumentPaths);

        alert('✅ Document deleted successfully!');

        // Call the document deleted callback to refresh parent data
        if (onDocumentDeleted) {
          onDocumentDeleted(documentType);
        }
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Error deleting document: ' + (error.response?.data?.message || error.message));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString || dateString === '') return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const getDocumentIcon = (fileType) => {
    if (fileType?.includes('pdf')) return '📄';
    if (fileType?.includes('image')) return '🖼️';
    if (fileType?.includes('word')) return '📝';
    return '📁';
  };

  const isImage = (fileType) => fileType?.includes('image');
  const isPdf = (fileType) => fileType?.includes('pdf');

  const renderDocumentSection = () => (
    <div className="onboarding-form-section">
      <h4 style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={18} /> Uploaded Documents
        </span>
        {isEditing && (
          <span style={{ fontSize: '12px', color: '#666', fontStyle: 'italic' }}>
            Documents can only be added by candidate
          </span>
        )}
      </h4>

      {localDocumentPaths && Object.keys(localDocumentPaths).length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
          {localDocumentPaths.driversLicense && (
            <div className="onboarding-document-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '24px' }}>{getDocumentIcon(localDocumentPaths.driversLicense.fileType)}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600' }}>Driver's License</div>
                  <div style={{ fontSize: '11px', color: '#666' }}>{localDocumentPaths.driversLicense.fileName}</div>
                  <div style={{ fontSize: '10px', color: '#999' }}>
                    {new Date(localDocumentPaths.driversLicense.uploadedAt).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <button
                    className="onboarding-icon-btn onboarding-view"
                    title="Preview"
                    onClick={() => setPreviewDoc({ ...localDocumentPaths.driversLicense, label: "Driver's License" })}
                  >
                    <Eye size={14} />
                  </button>
                  {isEditing && (
                    <button
                      className="onboarding-icon-btn onboarding-delete"
                      title="Delete"
                      onClick={() => handleDocumentDelete('driversLicense')}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {localDocumentPaths.visa && (
            <div className="onboarding-document-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '24px' }}>{getDocumentIcon(localDocumentPaths.visa.fileType)}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600' }}>Visa Copy</div>
                  <div style={{ fontSize: '11px', color: '#666' }}>{localDocumentPaths.visa.fileName}</div>
                  <div style={{ fontSize: '10px', color: '#999' }}>
                    {new Date(localDocumentPaths.visa.uploadedAt).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <button
                    className="onboarding-icon-btn onboarding-view"
                    title="Preview"
                    onClick={() => setPreviewDoc({ ...localDocumentPaths.visa, label: 'Visa Copy' })}
                  >
                    <Eye size={14} />
                  </button>
                  {isEditing && (
                    <button
                      className="onboarding-icon-btn onboarding-delete"
                      title="Delete"
                      onClick={() => handleDocumentDelete('visa')}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {localDocumentPaths.resume && (
            <div className="onboarding-document-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '24px' }}>{getDocumentIcon(localDocumentPaths.resume.fileType)}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600' }}>Updated Resume</div>
                  <div style={{ fontSize: '11px', color: '#666' }}>{localDocumentPaths.resume.fileName}</div>
                  <div style={{ fontSize: '10px', color: '#999' }}>
                    {new Date(localDocumentPaths.resume.uploadedAt).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <button
                    className="onboarding-icon-btn onboarding-view"
                    title="Preview"
                    onClick={() => setPreviewDoc({ ...localDocumentPaths.resume, label: 'Updated Resume' })}
                  >
                    <Eye size={14} />
                  </button>
                  {isEditing && (
                    <button
                      className="onboarding-icon-btn onboarding-delete"
                      title="Delete"
                      onClick={() => handleDocumentDelete('resume')}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {localDocumentPaths.msaSignedDocument && (
            <div className="onboarding-document-card" style={{ borderLeft: '3px solid #019d88', background: '#f0fdfa' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '24px' }}>📄</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', color: '#017a6b' }}>Signed MSA Document</div>
                  <div style={{ fontSize: '11px', color: '#666' }}>{localDocumentPaths.msaSignedDocument.fileName}</div>
                  <div style={{ fontSize: '10px', color: '#999' }}>
                    Source: {localDocumentPaths.msaSignedDocument.source || 'MSA Module'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <button
                    className="onboarding-icon-btn onboarding-view"
                    title="View Signed MSA"
                    style={{ background: '#019d88', color: 'white' }}
                    onClick={() => setPreviewDoc({
                      ...localDocumentPaths.msaSignedDocument,
                      label: 'Signed MSA Document',
                      fileType: 'application/pdf'
                    })}
                  >
                    <Eye size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <p style={{ color: '#6b7280', fontStyle: 'italic' }}>No documents uploaded</p>
      )}
    </div>
  );

  const renderViewMode = () => (
    <>
      {/* Documents Section */}
      {renderDocumentSection()}

      {/* Personal Information */}
      <div className="onboarding-form-section">
        <h4><User size={18} /> Personal Information</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
          <div><strong>First Name:</strong> {formData?.firstName || 'N/A'}</div>
          <div><strong>Last Name:</strong> {formData?.lastName || 'N/A'}</div>
          <div><strong>Email:</strong> {formData?.email || 'N/A'}</div>
          <div><strong>Phone:</strong> {formData?.phone || 'N/A'}</div>
          <div><strong>Current Location:</strong> {formData?.currentLocation || 'N/A'}</div>
          <div><strong>LinkedIn:</strong> {formData?.linkedInUrl || 'N/A'}</div>
          <div><strong>Work Authorization:</strong> {formData?.workAuthorization || 'N/A'}</div>
          <div><strong>Date of Birth:</strong> {formatDate(formData?.dateOfBirth)}</div>
        </div>
      </div>

      {/* Professional Details */}
      <div className="onboarding-form-section">
        <h4><Briefcase size={18} /> Professional Details</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
          <div><strong>Rate:</strong> {formData?.rate || 'N/A'}</div>
          <div><strong>Rate Type:</strong> {formData?.rateType || 'N/A'}</div>
          <div><strong>Availability Date:</strong> {formatDate(formData?.availabilityDate)}</div>
          <div><strong>Total IT Experience:</strong> {formData?.totalITExperience || '0'} years</div>
          <div><strong>Relevant Experience:</strong> {formData?.relevantExperience || '0'} years</div>
        </div>
      </div>

      {/* Education */}
      <div className="onboarding-form-section">
        <h4><GraduationCap size={18} /> Education</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
          <div><strong>Highest Degree:</strong> {formData?.highestDegree || 'N/A'}</div>
          <div><strong>Specialization:</strong> {formData?.specialization || 'N/A'}</div>
          <div><strong>Education Start:</strong> {formatDate(formData?.educationStartDate)}</div>
          <div><strong>Education End:</strong> {formatDate(formData?.educationEndDate)}</div>
        </div>
      </div>

      {/* Employment History */}
      <div className="onboarding-form-section">
        <h4><Building size={18} /> Employment History</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
          <div><strong>Most Recent Company:</strong> {formData?.mostRecentCompany || 'N/A'}</div>
          <div><strong>Company Address:</strong> {formData?.mostRecentCompanyAddress || 'N/A'}</div>
          <div><strong>Employment Start:</strong> {formatDate(formData?.mostRecentEmploymentStart)}</div>
          <div><strong>Employment End:</strong> {formatDate(formData?.mostRecentEmploymentEnd)}</div>
        </div>
      </div>

      {/* TCS Related */}
      <div className="onboarding-form-section">
        <h4><Award size={18} /> TCS Related</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
          <div><strong>Former TCS Employee:</strong> {formData?.formerTCS || 'No'}</div>
          {formData?.formerTCS === 'Yes' && <div><strong>TCS Employee ID:</strong> {formData?.tcsEmployeeId || 'N/A'}</div>}
          <div><strong>Former TCS BA:</strong> {formData?.formerTCSBA || 'No'}</div>
          {formData?.formerTCSBA === 'Yes' && <div><strong>TCS BA ID:</strong> {formData?.tcsBAId || 'N/A'}</div>}
        </div>
      </div>

      {/* Current Employment */}
      <div className="onboarding-form-section">
        <h4><Briefcase size={18} /> Current Employment</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
          <div><strong>Current Employer:</strong> {formData?.currentEmployerName || 'N/A'}</div>
          <div><strong>Employer Address:</strong> {formData?.currentEmployerAddress || 'N/A'}</div>
        </div>
      </div>

      {/* Identification */}
      <div className="onboarding-form-section">
        <h4><Hash size={18} /> Identification</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
          <div><strong>Passport Number:</strong> {formData?.passportNumber || 'N/A'}</div>
          <div><strong>Last Four SSN:</strong> {formData?.lastFourSSN || 'N/A'}</div>
        </div>
      </div>

      {/* Languages */}
      <div className="onboarding-form-section">
        <h4><BookOpen size={18} /> Languages</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
          <div><strong>Speak:</strong> {formData?.languagesSpeak || 'N/A'}</div>
          <div><strong>Read:</strong> {formData?.languagesRead || 'N/A'}</div>
          <div><strong>Write:</strong> {formData?.languagesWrite || 'N/A'}</div>
        </div>
      </div>
    </>
  );

  const renderEditMode = () => (
    <>
      {/* Documents Section - View only in edit mode */}
      {renderDocumentSection()}

      {/* Personal Information - Editable */}
      <div className="onboarding-form-section">
        <h4><User size={18} /> Personal Information</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
          <div className="onboarding-form-group">
            <label>First Name</label>
            <input
              type="text"
              value={editedFormData?.firstName || ''}
              onChange={(e) => handleEditField('personal', 'firstName', e.target.value)}
            />
          </div>
          <div className="onboarding-form-group">
            <label>Last Name</label>
            <input
              type="text"
              value={editedFormData?.lastName || ''}
              onChange={(e) => handleEditField('personal', 'lastName', e.target.value)}
            />
          </div>
          <div className="onboarding-form-group">
            <label>Email</label>
            <input
              type="email"
              value={editedFormData?.email || ''}
              onChange={(e) => handleEditField('personal', 'email', e.target.value)}
            />
          </div>
          <div className="onboarding-form-group">
            <label>Phone</label>
            <input
              type="tel"
              value={editedFormData?.phone || ''}
              onChange={(e) => handleEditField('personal', 'phone', e.target.value)}
            />
          </div>
          <div className="onboarding-form-group">
            <label>Current Location</label>
            <input
              type="text"
              value={editedFormData?.currentLocation || ''}
              onChange={(e) => handleEditField('personal', 'currentLocation', e.target.value)}
            />
          </div>
          <div className="onboarding-form-group">
            <label>LinkedIn URL</label>
            <input
              type="url"
              value={editedFormData?.linkedInUrl || ''}
              onChange={(e) => handleEditField('personal', 'linkedInUrl', e.target.value)}
            />
          </div>
          <div className="onboarding-form-group">
            <label>Work Authorization</label>
            <select
              value={editedFormData?.workAuthorization || ''}
              onChange={(e) => handleEditField('personal', 'workAuthorization', e.target.value)}
            >
              <option value="">Select</option>
              <option value="US Citizen">US Citizen</option>
              <option value="Green Card">Green Card</option>
              <option value="H1B">H1B</option>
              <option value="OPT">OPT</option>
              <option value="CPT">CPT</option>
              <option value="L2">L2</option>
              <option value="TN">TN</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="onboarding-form-group">
            <label>Date of Birth</label>
            <input
              type="date"
              value={editedFormData?.dateOfBirth || ''}
              onChange={(e) => handleEditField('personal', 'dateOfBirth', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Professional Details - Editable */}
      <div className="onboarding-form-section">
        <h4><Briefcase size={18} /> Professional Details</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
          <div className="onboarding-form-group">
            <label>Rate</label>
            <input
              type="text"
              value={editedFormData?.rate || ''}
              onChange={(e) => handleEditField('professional', 'rate', e.target.value)}
              placeholder="e.g., $50/hr"
            />
          </div>
          <div className="onboarding-form-group">
            <label>Rate Type</label>
            <select
              value={editedFormData?.rateType || 'C2C'}
              onChange={(e) => handleEditField('professional', 'rateType', e.target.value)}
            >
              <option value="C2C">C2C</option>
              <option value="W2">W2</option>
              <option value="1099">1099</option>
            </select>
          </div>
          <div className="onboarding-form-group">
            <label>Availability Date</label>
            <input
              type="date"
              value={editedFormData?.availabilityDate || ''}
              onChange={(e) => handleEditField('professional', 'availabilityDate', e.target.value)}
            />
          </div>
          <div className="onboarding-form-group">
            <label>Total IT Experience (Years)</label>
            <input
              type="number"
              step="0.1"
              value={editedFormData?.totalITExperience || ''}
              onChange={(e) => handleEditField('professional', 'totalITExperience', e.target.value)}
              placeholder="e.g., 5.5"
            />
          </div>
          <div className="onboarding-form-group">
            <label>Relevant Experience (Years)</label>
            <input
              type="number"
              step="0.1"
              value={editedFormData?.relevantExperience || ''}
              onChange={(e) => handleEditField('professional', 'relevantExperience', e.target.value)}
              placeholder="e.g., 3.5"
            />
          </div>
        </div>
      </div>

      {/* Education - Editable */}
      <div className="onboarding-form-section">
        <h4><GraduationCap size={18} /> Education</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
          <div className="onboarding-form-group">
            <label>Highest Degree</label>
            <select
              value={editedFormData?.highestDegree || ''}
              onChange={(e) => handleEditField('education', 'highestDegree', e.target.value)}
            >
              <option value="">Select</option>
              <option value="High School">High School</option>
              <option value="Associate">Associate Degree</option>
              <option value="Bachelor">Bachelor's Degree</option>
              <option value="Master">Master's Degree</option>
              <option value="PhD">PhD</option>
            </select>
          </div>
          <div className="onboarding-form-group">
            <label>Specialization</label>
            <input
              type="text"
              value={editedFormData?.specialization || ''}
              onChange={(e) => handleEditField('education', 'specialization', e.target.value)}
              placeholder="e.g., Computer Science"
            />
          </div>
          <div className="onboarding-form-group">
            <label>Education Start Date</label>
            <input
              type="date"
              value={editedFormData?.educationStartDate || ''}
              onChange={(e) => handleEditField('education', 'educationStartDate', e.target.value)}
            />
          </div>
          <div className="onboarding-form-group">
            <label>Education End Date</label>
            <input
              type="date"
              value={editedFormData?.educationEndDate || ''}
              onChange={(e) => handleEditField('education', 'educationEndDate', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Employment History - Editable */}
      <div className="onboarding-form-section">
        <h4><Building size={18} /> Employment History</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
          <div className="onboarding-form-group" style={{ gridColumn: '1 / -1' }}>
            <label>Most Recent Company</label>
            <input
              type="text"
              value={editedFormData?.mostRecentCompany || ''}
              onChange={(e) => handleEditField('employment', 'mostRecentCompany', e.target.value)}
              placeholder="Company name"
            />
          </div>
          <div className="onboarding-form-group" style={{ gridColumn: '1 / -1' }}>
            <label>Company Address</label>
            <input
              type="text"
              value={editedFormData?.mostRecentCompanyAddress || ''}
              onChange={(e) => handleEditField('employment', 'mostRecentCompanyAddress', e.target.value)}
              placeholder="City, State"
            />
          </div>
          <div className="onboarding-form-group">
            <label>Employment Start Date</label>
            <input
              type="date"
              value={editedFormData?.mostRecentEmploymentStart || ''}
              onChange={(e) => handleEditField('employment', 'mostRecentEmploymentStart', e.target.value)}
            />
          </div>
          <div className="onboarding-form-group">
            <label>Employment End Date</label>
            <input
              type="date"
              value={editedFormData?.mostRecentEmploymentEnd || ''}
              onChange={(e) => handleEditField('employment', 'mostRecentEmploymentEnd', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* TCS Related - Editable */}
      <div className="onboarding-form-section">
        <h4><Award size={18} /> TCS Related</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
          <div className="onboarding-form-group">
            <label>Former TCS Employee?</label>
            <select
              value={editedFormData?.formerTCS || 'No'}
              onChange={(e) => handleEditField('tcs', 'formerTCS', e.target.value)}
            >
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </div>
          <div className="onboarding-form-group">
            <label>Former TCS BA?</label>
            <select
              value={editedFormData?.formerTCSBA || 'No'}
              onChange={(e) => handleEditField('tcs', 'formerTCSBA', e.target.value)}
            >
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </div>
          {editedFormData?.formerTCS === 'Yes' && (
            <div className="onboarding-form-group" style={{ gridColumn: '1 / -1' }}>
              <label>TCS Employee ID</label>
              <input
                type="text"
                value={editedFormData?.tcsEmployeeId || ''}
                onChange={(e) => handleEditField('tcs', 'tcsEmployeeId', e.target.value)}
                placeholder="Enter TCS Employee ID"
              />
            </div>
          )}
          {editedFormData?.formerTCSBA === 'Yes' && (
            <div className="onboarding-form-group" style={{ gridColumn: '1 / -1' }}>
              <label>TCS BA ID</label>
              <input
                type="text"
                value={editedFormData?.tcsBAId || ''}
                onChange={(e) => handleEditField('tcs', 'tcsBAId', e.target.value)}
                placeholder="Enter TCS BA ID"
              />
            </div>
          )}
        </div>
      </div>

      {/* Current Employment - Editable */}
      <div className="onboarding-form-section">
        <h4><Briefcase size={18} /> Current Employment</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
          <div className="onboarding-form-group" style={{ gridColumn: '1 / -1' }}>
            <label>Current Employer Name</label>
            <input
              type="text"
              value={editedFormData?.currentEmployerName || ''}
              onChange={(e) => handleEditField('current', 'currentEmployerName', e.target.value)}
              placeholder="Current employer name"
            />
          </div>
          <div className="onboarding-form-group" style={{ gridColumn: '1 / -1' }}>
            <label>Employer Address</label>
            <input
              type="text"
              value={editedFormData?.currentEmployerAddress || ''}
              onChange={(e) => handleEditField('current', 'currentEmployerAddress', e.target.value)}
              placeholder="City, State"
            />
          </div>
        </div>
      </div>

      {/* Identification - Editable */}
      <div className="onboarding-form-section">
        <h4><Hash size={18} /> Identification</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
          <div className="onboarding-form-group">
            <label>Passport Number</label>
            <input
              type="text"
              value={editedFormData?.passportNumber || ''}
              onChange={(e) => handleEditField('id', 'passportNumber', e.target.value)}
              placeholder="Enter passport number"
            />
          </div>
          <div className="onboarding-form-group">
            <label>Last Four SSN</label>
            <input
              type="text"
              maxLength="4"
              value={editedFormData?.lastFourSSN || ''}
              onChange={(e) => handleEditField('id', 'lastFourSSN', e.target.value)}
              placeholder="1234"
            />
          </div>
        </div>
      </div>

      {/* Languages - Editable */}
      <div className="onboarding-form-section">
        <h4><BookOpen size={18} /> Languages</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
          <div className="onboarding-form-group">
            <label>Languages can Speak</label>
            <input
              type="text"
              value={editedFormData?.languagesSpeak || ''}
              onChange={(e) => handleEditField('languages', 'languagesSpeak', e.target.value)}
              placeholder="e.g., English, Spanish"
            />
          </div>
          <div className="onboarding-form-group">
            <label>Languages can Read</label>
            <input
              type="text"
              value={editedFormData?.languagesRead || ''}
              onChange={(e) => handleEditField('languages', 'languagesRead', e.target.value)}
              placeholder="e.g., English, Spanish"
            />
          </div>
          <div className="onboarding-form-group" style={{ gridColumn: '1 / -1' }}>
            <label>Languages can Write</label>
            <input
              type="text"
              value={editedFormData?.languagesWrite || ''}
              onChange={(e) => handleEditField('languages', 'languagesWrite', e.target.value)}
              placeholder="e.g., English, Spanish"
            />
          </div>
        </div>
      </div>
    </>
  );

  if (!isOpen || !formData) return null;

  return (
    <>
      <div className="onboarding-modal-backdrop" onClick={onClose} />
      <div className="onboarding-modal onboarding-modal-wide">

        {/* Header */}
        <div className="onboarding-modal-header">
          <h2>
            <User size={20} />
            {candidateName} – Candidate Form Data
            {isEditing && <span style={{ fontSize: '12px', marginLeft: '10px', background: '#ffc107', color: '#333', padding: '2px 8px', borderRadius: '12px' }}>EDIT MODE</span>}
          </h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            {!isEditing ? (
              <button
                className="admin-header-edit-btn"
                onClick={() => setIsEditing(true)}
              >
                <Edit3 size={16} /> Edit Form Data
              </button>
            ) : (
              <>
                <button
                  className="admin-header-save-btn"
                  onClick={handleSaveChanges}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : <><Save size={16} /> Save Changes</>}
                </button>
                <button
                  className="admin-header-cancel-btn"
                  onClick={handleCancelEdit}
                  disabled={saving}
                >
                  Cancel
                </button>
              </>
            )}
            <button onClick={onClose}><X size={20} /></button>
          </div>
        </div>

        {/* Document Preview Overlay */}
        <DocumentPreviewOverlay previewDoc={previewDoc} onClose={() => setPreviewDoc(null)} />

        <div className="onboarding-modal-body">
          {isEditing ? renderEditMode() : renderViewMode()}
        </div>

        <div className="onboarding-modal-footer">
          <button className="onboarding-btn-secondary" onClick={onClose}>
            Close
          </button>
          {isEditing && (
            <button
              className="onboarding-btn-secondary"
              onClick={handleCancelEdit}
              style={{ marginLeft: '10px' }}
            >
              Cancel Edit
            </button>
          )}
        </div>
      </div>
    </>
  );
});

CandidateFormModal.displayName = 'CandidateFormModal';

// ============================================================
// SEND CREDENTIALS MODAL
// ============================================================
// ============================================================
// SEND CREDENTIALS MODAL - FIXED
// ============================================================
const SendCredentialsModal = React.memo(({  // <-- Use parentheses, not curly braces
  isOpen,
  employee,
  company,
  onClose,
  onSuccess
}) => {
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  const handleSendCredentials = async () => {
    setSending(true);
    setResult(null);

    try {
      const token = localStorage.getItem('token');

      console.log('Sending credentials for employee:', employee.id);

      const response = await axios.post(
        `${BASE_URL}/api/onboarding-workflow-employees/company/${company.id}/${employee.id}/send-credentials`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setResult({
          success: true,
          message: '✅ Credentials sent successfully!',
          data: response.data.data
        });

        alert(`✅ Credentials sent to ${employee.email}\n\nUsername: ${response.data.data.username}\nPassword: ${response.data.data.password}\n\nThese credentials have been emailed to the candidate.\n\n⚠️ Note: The candidate must log in and submit the onboarding form to complete Step 1.`);

        if (onSuccess) onSuccess();
      }
    } catch (error) {
      console.error('Error sending credentials:', error);
      setResult({
        success: false,
        message: '❌ ' + (error.response?.data?.message || 'Failed to send credentials')
      });

      alert('Error: ' + (error.response?.data?.message || error.message));
    } finally {
      setSending(false);
    }
  };

  if (!isOpen || !employee) return null;

  return (
    <>
      <div className="onboarding-modal-backdrop" onClick={onClose} />
      <div className="onboarding-modal">
        <div className="onboarding-modal-header">
          <h2>
            <MailIcon size={20} />
            Send Login Credentials
          </h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>

        <div className="onboarding-modal-body">
          <p style={{ marginBottom: '20px' }}>
            Send login credentials to <strong>{employee.name}</strong> at <strong>{employee.email}</strong>
          </p>
          <p style={{ marginBottom: '20px', fontSize: '14px', color: '#666' }}>
            They will be able to login at <strong>/candidate-onboarding</strong> with these credentials.
          </p>

          {result ? (
            <div style={{
              padding: '15px',
              background: result.success ? '#d4edda' : '#f8d7da',
              border: `1px solid ${result.success ? '#c3e6cb' : '#f5c6cb'}`,
              borderRadius: '8px',
              color: result.success ? '#155724' : '#721c24'
            }}>
              <p style={{ margin: '0 0 10px 0' }}>{result.message}</p>
              {result.success && result.data && (
                <div style={{ marginTop: '10px', background: 'white', padding: '10px', borderRadius: '4px' }}>
                  <p><strong>Username:</strong> {result.data.username}</p>
                  <p><strong>Password:</strong> {result.data.password}</p>
                  <p style={{ fontSize: '12px', marginTop: '5px', color: '#666' }}>
                    These credentials have been sent to the candidate's email.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="onboarding-info-box">
              <AlertCircle size={18} />
              <p style={{ margin: 0 }}>
                This will create a user account for the candidate and send them an email with login credentials.
                They will use these credentials to access the candidate onboarding portal.
              </p>
            </div>
          )}
        </div>

        <div className="onboarding-modal-footer">
          <button className="onboarding-btn-secondary" onClick={onClose}>
            {result ? 'Close' : 'Cancel'}
          </button>
          {!result && (
            <button
              className="onboarding-btn-primary"
              onClick={handleSendCredentials}
              disabled={sending}
            >
              {sending ? 'Sending...' : 'Send Credentials'}
            </button>
          )}
        </div>
      </div>
    </>
  );
});

SendCredentialsModal.displayName = 'SendCredentialsModal';

// ============================================================
// SEND COMPLIANCE DOCUMENTS MODAL (DOCUSIGN) - UPDATED WITH UPLOAD NEW DOCUMENTS
// ============================================================
const ComplianceDocumentsModal = React.memo(({ 
  isOpen,
  employee,
  company,
  step,
  onClose,
  onSuccess
}) => {
  const [files, setFiles] = useState([]);
  const [sending, setSending] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const newFiles = Array.from(e.dataTransfer.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendForSigning = async () => {
    if (files.length === 0) {
      alert("Please upload at least one document");
      return;
    }

    setSending(true);
    const formData = new FormData();
    formData.append('stepId', step.id);
    files.forEach(file => {
      formData.append('documents', file);
    });

    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        `${BASE_URL}/api/onboarding-workflow-employees/company/${company.id}/${employee.id}/send-compliance-docs`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        }
      );

      if (response.data.success) {
        Swal.fire({
          title: 'Success!',
          text: '✅ Compliance documents sent for signing successfully!',
          icon: 'success',
          confirmButtonColor: '#019d88'
        });
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (error) {
      console.error("Error sending documents:", error);
      Swal.fire({
        title: 'Upload Failed',
        text: error.response?.data?.message || error.message,
        icon: 'error'
      });
    } finally {
      setSending(false);
      setUploadProgress(0);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="onboarding-modal-backdrop" onClick={onClose} style={{ zIndex: 4000 }} />
      <div className="onboarding-modal" style={{ zIndex: 4001, maxWidth: '600px', width: '90%' }}>
        <div className="onboarding-modal-header" style={{ background: '#019d88' }}>
          <h2>
            <FileText size={20} />
            Send Compliance Documents
          </h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>

        <div className="onboarding-modal-body">
          <div style={{ marginBottom: '20px' }}>
            <p style={{ margin: '0 0 5px 0' }}><strong>Step:</strong> {step.title}</p>
            <p style={{ color: '#666', fontSize: '13px', margin: 0 }}>Documents will be sent to <strong>{employee.name}</strong> ({employee.email})</p>
          </div>

          <div 
            className={`compliance-upload-zone ${dragActive ? 'active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => document.getElementById('compliance-file-input').click()}
            style={{
              border: '2px dashed #019d88',
              borderRadius: '12px',
              padding: '30px 20px',
              textAlign: 'center',
              background: dragActive ? '#f0fdfa' : '#f8fafc',
              cursor: 'pointer',
              transition: 'background 0.2s ease'
            }}
          >
            <input 
              id="compliance-file-input"
              type="file"
              multiple 
              onChange={handleFileChange} 
              style={{ display: 'none' }}
              accept=".pdf,.doc,.docx,image/*"
            />
            <div style={{ fontSize: '30px', marginBottom: '10px' }}>📁</div>
            <h4 style={{ margin: '0 0 5px 0', color: '#334155', fontSize: '15px' }}>Drag & drop documents here</h4>
            <p style={{ margin: 0, color: '#64748b', fontSize: '12px' }}>or click to browse documents</p>
          </div>

          <div style={{ marginTop: '20px', maxHeight: '200px', overflowY: 'auto' }}>
            {/* New documents section */}
            {files.length > 0 && (
              <div style={{ marginBottom: '15px' }}>
                <h4 style={{ fontSize: '13px', marginBottom: '8px', color: '#019d88' }}>New Documents to Send:</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {files.map((file, idx) => (
                    <div key={idx} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: 'white',
                      border: '1px solid #019d88',
                      borderRadius: '6px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                        <FileText size={16} color="#019d88" style={{ flexShrink: 0 }} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ 
                            fontSize: '13px', 
                            fontWeight: '500', 
                            color: '#334155',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>{file.name}</div>
                          <div style={{ fontSize: '10px', color: '#94a3b8' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                        </div>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                        style={{ 
                          background: '#fee2e2', 
                          color: '#ef4444', 
                          border: 'none', 
                          padding: '4px', 
                          borderRadius: '4px',
                          cursor: 'pointer',
                          flexShrink: 0
                        }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Previously sent documents section */}
            {step.complianceDocuments && step.complianceDocuments.length > 0 && (
              <div>
                <h4 style={{ fontSize: '13px', marginBottom: '8px', color: '#64748b' }}>Previously Sent Documents:</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', opacity: 0.7 }}>
                  {step.complianceDocuments.map((doc, idx) => (
                    <div key={idx} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '10px',
                      padding: '6px 10px',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px'
                    }}>
                      <FileText size={14} color="#94a3b8" />
                      <span style={{ fontSize: '12px', color: '#64748b' }}>{doc.fileName}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {sending && (
            <div style={{ marginTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                <span style={{ color: '#019d88', fontWeight: '600' }}>
                  {uploadProgress < 100 ? `Uploading Documents... ${uploadProgress}%` : 'Finalizing & Sending Email...'}
                </span>
                <span style={{ color: '#64748b' }}>{files.length} {files.length === 1 ? 'file' : 'files'}</span>
              </div>
              <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)' }}>
                <div 
                  style={{ 
                    height: '100%', 
                    background: 'linear-gradient(90deg, #019d88, #01d1b1)', 
                    width: `${uploadProgress}%`,
                    transition: 'width 0.3s ease-out'
                  }} 
                />
              </div>
              <p style={{ fontSize: '11px', color: '#64748b', marginTop: '8px', textAlign: 'center', fontStyle: 'italic' }}>
                Please do not close this window until the process completes.
              </p>
            </div>
          )}
        </div>

        <div className="onboarding-modal-footer">
          <button className="onboarding-btn-secondary" onClick={onClose} disabled={sending}>
            Cancel
          </button>
          <button 
            className="onboarding-btn-primary" 
            onClick={handleSendForSigning}
            disabled={sending || files.length === 0}
            style={{ 
              background: 'linear-gradient(135deg, #019d88, #017a6b)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {sending ? 'Sending...' : <><Send size={16} /> Send for Signing</>}
          </button>
        </div>
      </div>
    </>
  );
});

ComplianceDocumentsModal.displayName = 'ComplianceDocumentsModal';


// ============================================================
// EMPLOYEE WORKFLOW STEPS MODAL
// ============================================================
const EmployeeWorkflowModal = React.memo(({
  isOpen,
  employee,
  company,
  onClose,
  onRefresh,
  onSendCredentials
}) => {
  const [steps, setSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // View modals state
  const [viewingCandidateForm, setViewingCandidateForm] = useState(false);
  const [viewingEmployerData, setViewingEmployerData] = useState(null);
  const [viewingDocumentPaths, setViewingDocumentPaths] = useState(null);
  const [viewingStepDocuments, setViewingStepDocuments] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);

  // Edit modal state
  const [editingStep, setEditingStep] = useState(null);
  const [editFormData, setEditFormData] = useState(null);

  // Check if credentials already sent
  const credentialsSent = employee?.userId ? true : false;

  // Compliance modal state
  const [showComplianceModal, setShowComplianceModal] = useState(false);
  const [activeComplianceStep, setActiveComplianceStep] = useState(null);

  // Company docs popup state
  const [viewingCompanyDocs, setViewingCompanyDocs] = useState(null); // holds the step when viewing company docs popup

// In EmployeeDirectory.js, find the isCompanyDocStep function (around line 138)
const isCompanyDocStep = (step) => {
  const title = step.title?.toLowerCase() || '';
  const description = step.description?.toLowerCase() || '';
  const type = step.type?.toLowerCase() || '';
  
  // Must have "company" AND "upload" keywords
  const hasCompany = title.includes('company') || description.includes('company');
  const hasUpload = title.includes('upload') || description.includes('upload');
  
  // Must NOT have compliance or send keywords
  const hasCompliance = title.includes('compliance') || description.includes('compliance') || type === 'compliance';
  const hasSend = title.includes('send') || description.includes('send');
  
  // Check for exact match
  const isExactMatch = title.includes('upload company') || title.includes('company documents');
  
  return (isExactMatch || (hasCompany && hasUpload)) && !hasCompliance && !hasSend;
};

  useEffect(() => {
    if (isOpen && employee) {
      loadWorkflowSteps();
    }
  }, [isOpen, employee]);

  const loadWorkflowSteps = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');

      const response = await axios.get(
        `${BASE_URL}/api/onboarding-workflow-employees/company/${company.id}/${employee.id}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        const employeeSteps = response.data.data.workflowSteps || [];
        const currentIndex = employeeSteps.findIndex(s => !s.completed);
        setCurrentStep(currentIndex === -1 ? employeeSteps.length - 1 : currentIndex);
        setSteps(employeeSteps);
      }
    } catch (error) {
      console.error('Error loading workflow steps:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewCandidateForm = () => {
    console.log('Employee data:', employee);
    console.log('Onboarding form data:', employee?.onboardingFormData);

    if (employee?.onboardingFormData) {
      setViewingCandidateForm(true);
      setViewingDocumentPaths(employee.documentPaths);
    } else {
      alert('No candidate form data submitted yet');
    }
  };

  const handleViewEmployerData = async () => {
    try {
      const token = localStorage.getItem('token');

      const response = await axios.get(
        `${BASE_URL}/api/onboarding-employers?email=${encodeURIComponent(employee.clientEmail)}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.data.success && response.data.data && response.data.data.length > 0) {
        setViewingEmployerData(response.data.data[0]);
      } else {
        alert('No employer data submitted yet');
      }
    } catch (error) {
      console.error('Error loading employer data:', error);
      alert('Error loading employer data');
    }
  };

  const handleViewStepDocuments = (step) => {
    setViewingStepDocuments(step);
  };

  const handleEditStep = (step) => {
    setEditFormData({
      title: step.title,
      description: step.description,
      type: step.type,
      instructions: step.instructions,
      documents: step.documents ? [...step.documents] : []
    });
    setEditingStep(step);
  };

  const handleAddStepAtPosition = async (position) => {
    const newStepTitle = prompt('Enter title for the new step:', 'New Step');
    if (!newStepTitle) return;

    const newStepDescription = prompt('Enter description for the new step:', 'Step description') || 'Step description';

    const newStep = {
      id: Date.now(),
      title: newStepTitle,
      description: newStepDescription,
      order: position + 1,
      type: 'document',
      isRequired: true,
      completed: false,
      documents: [],
      instructions: ''
    };

    setUpdating(true);
    try {
      const token = localStorage.getItem('token');

      const updatedSteps = [
        ...steps.slice(0, position),
        newStep,
        ...steps.slice(position)
      ];

      const reorderedSteps = updatedSteps.map((step, index) => ({
        ...step,
        order: index + 1
      }));

      const response = await axios.post(
        `${BASE_URL}/api/onboarding-workflow-employees/company/${company.id}/${employee.id}/update-steps`,
        { workflowSteps: reorderedSteps },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setSteps(reorderedSteps);
        alert(`✅ New step added at position ${position + 1}!`);
      }

      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error adding step:', error);
      alert('Error adding step: ' + (error.response?.data?.message || error.message));
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteStep = async (stepId) => {
    if (!window.confirm('Are you sure you want to delete this step? This action cannot be undone.')) {
      return;
    }

    setUpdating(true);
    try {
      const token = localStorage.getItem('token');

      const updatedSteps = steps.filter(step => step.id !== stepId);

      const reorderedSteps = updatedSteps.map((step, index) => ({
        ...step,
        order: index + 1
      }));

      const response = await axios.post(
        `${BASE_URL}/api/onboarding-workflow-employees/company/${company.id}/${employee.id}/update-steps`,
        { workflowSteps: reorderedSteps },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setSteps(reorderedSteps);
        alert('✅ Step deleted successfully!');
      }

      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error deleting step:', error);
      alert('Error deleting step: ' + (error.response?.data?.message || error.message));
    } finally {
      setUpdating(false);
    }
  };

  const closeViewModals = () => {
    setViewingCandidateForm(false);
    setViewingEmployerData(null);
    setViewingStepDocuments(null);
    setViewingDocumentPaths(null);
  };

  const closeEditModal = () => {
    setEditingStep(null);
    setEditFormData(null);
  };

  const handleSendComplianceDocuments = (stepId) => {
    const step = steps.find(s => s.id === stepId);
    if (step) {
      setActiveComplianceStep(step);
      setShowComplianceModal(true);
    }
  };

  const handleResendComplianceDocuments = (stepId) => {
    const step = steps.find(s => s.id === stepId);
    if (step) {
      setActiveComplianceStep(step);
      setShowComplianceModal(true);
    }
  };

  const handleStepComplete = async (stepId) => {
    setUpdating(true);
    try {
      const token = localStorage.getItem('token');

      const stepIndex = steps.findIndex(s => s.id === stepId);

      const response = await axios.post(
        `${BASE_URL}/api/onboarding-workflow-employees/company/${company.id}/${employee.id}/complete-step`,
        { stepIndex },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setSteps(response.data.data.steps);
        setCurrentStep(response.data.data.currentStepIndex);
        
        // Show different message for compliance steps
        const step = steps.find(s => s.id === stepId);
        if (step && step.docusignStatus === 'signed') {
          alert('✅ Compliance step marked as complete! The signed documents are now available.');
        } else {
          alert('✅ Step marked as complete successfully!');
        }
      }

      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error completing step:', error);
      alert('Error completing step: ' + (error.response?.data?.message || error.message));
    } finally {
      setUpdating(false);
    }
  };

  const handleEditFormChange = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddDocument = () => {
    const newDoc = prompt('Enter document name:');
    if (newDoc && newDoc.trim()) {
      setEditFormData(prev => ({
        ...prev,
        documents: [...(prev.documents || []), newDoc.trim()]
      }));
    }
  };

  const handleRemoveDocument = (index) => {
    setEditFormData(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }));
  };

  const handleSaveEdit = async () => {
    if (!editFormData) return;

    setUpdating(true);
    try {
      const token = localStorage.getItem('token');

      const updatedSteps = steps.map(step => {
        if (step.id === editingStep.id) {
          return {
            ...step,
            title: editFormData.title,
            description: editFormData.description,
            type: editFormData.type,
            instructions: editFormData.instructions,
            documents: editFormData.documents
          };
        }
        return step;
      });

      const response = await axios.post(
        `${BASE_URL}/api/onboarding-workflow-employees/company/${company.id}/${employee.id}/update-steps`,
        { workflowSteps: updatedSteps },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setSteps(updatedSteps);
        alert('✅ Step updated successfully!');
        closeEditModal();
      }

      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error updating step:', error);
      alert('Error updating step: ' + (error.response?.data?.message || error.message));
    } finally {
      setUpdating(false);
    }
  };

  const getDocumentIcon = (fileType) => {
    if (fileType?.includes('pdf')) return '📄';
    if (fileType?.includes('image')) return '🖼️';
    if (fileType?.includes('word')) return '📝';
    return '📁';
  };

  const formatDate = (dateString) => {
    if (!dateString || dateString === '') return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const isEmployerStep = (step) =>
    step.type === 'employer' ||
    (step.title && step.title.toLowerCase().includes('employer')) ||
    (step.title && step.title.toLowerCase().includes('company info')) ||
    step.employerSubmitted !== undefined;

  const isCandidateFormStep = (step) =>
    step.type === 'candidate' ||
    step.formData !== undefined ||
    (step.title && step.title.toLowerCase().includes('accept offer')) ||
    (step.title && step.title.toLowerCase().includes('onboarding form')) ||
    (step.title && step.title.toLowerCase().includes('candidate'));

  const isComplianceStep = (step) =>
    step.type === 'compliance' ||
    (step.title && step.title.toLowerCase().includes('compliance')) ||
    (step.description && step.description.toLowerCase().includes('compliance'));

  const isMSAStep = (step) =>
    (step.title && step.title.toLowerCase().includes('msa')) ||
    (step.id && step.id.toString().toLowerCase().includes('msa')) ||
    step.documentPath !== undefined;

  const getStepStatusBadge = (step, index) => {
    if (step.completed) {
      return <span className="onboarding-status-badge onboarding-completed"><CheckCircle size={12} /> COMPLETED</span>;
    } else if (step.docusignStatus === 'signed') {
      return <span className="onboarding-status-badge onboarding-submitted" style={{ background: '#019d88', color: 'white' }}><CheckCircle size={12} /> SIGNED - AWAITING COMPLETION</span>;
    } else if (isEmployerStep(step) && step.employerSubmitted) {
      return <span className="onboarding-status-badge onboarding-submitted"><Clock size={12} /> SUBMITTED BY EMPLOYER</span>;
    } else if (isCandidateFormStep(step) && step.formData) {
      return <span className="onboarding-status-badge onboarding-submitted"><Clock size={12} /> SUBMITTED BY CANDIDATE</span>;
    } else if (isCandidateFormStep(step) && credentialsSent) {
      return <span className="onboarding-status-badge onboarding-pending"><AlertCircle size={12} /> CREDENTIALS SENT</span>;
    } else if (isComplianceStep(step) && step.documentsSent) {
      return (
        <span className="onboarding-status-badge onboarding-submitted">
          <CheckCircle size={12} /> DOCUMENTS SENT {step.sentAt && `(${new Date(step.sentAt).toLocaleDateString()})`}
        </span>
      );
    } else if (isCompanyDocStep(step) && step.uploadedDocuments && Object.keys(step.uploadedDocuments).length > 0) {
      return <span className="onboarding-status-badge onboarding-submitted"><Upload size={12} /> SUBMITTED BY EMPLOYER</span>;
    } else {
      return <span className="onboarding-status-badge onboarding-pending"><AlertCircle size={12} /> PENDING</span>;
    }
  };

  if (!isOpen || !employee) return null;

  return (
    <>
      <div className="onboarding-modal-backdrop" onClick={onClose} />
      <div className="onboarding-modal onboarding-modal-wide">
        <div className="onboarding-modal-header" style={{ background: '#1d8c70' }}>
          <h2>
            <User size={20} />
            {employee.name} - Onboarding Workflow
          </h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>

        <div className="onboarding-modal-body">
          {loading ? (
            <div className="onboarding-loading">
              <div className="onboarding-loading-spinner"></div>
              <p>Loading workflow steps...</p>
            </div>
          ) : steps.length === 0 ? (
            <div className="onboarding-empty">
              <FileText size={48} />
              <h3>No Workflow Steps</h3>
              <p>This employee doesn't have any workflow steps configured.</p>
              <button
                onClick={() => handleAddStepAtPosition(0)}
                disabled={updating}
                className="onboarding-add-step-btn"
              >
                <Plus size={16} />
                Add First Step
              </button>
            </div>
          ) : (
            <div className="onboarding-steps-container">
              <div className="onboarding-steps-progress">
                <div className="onboarding-progress-header">
                  <h3>Progress</h3>
                  <span className="onboarding-progress-percentage">
                    {Math.round((steps.filter(s => s.completed).length / steps.length) * 100)}%
                  </span>
                </div>
                <div className="onboarding-progress-bar">
                  <div
                    className="onboarding-progress-fill"
                    style={{ width: `${(steps.filter(s => s.completed).length / steps.length) * 100}%` }}
                  ></div>
                </div>
                <div className="onboarding-progress-stats">
                  <span>{steps.filter(s => s.completed).length} of {steps.length} steps completed</span>
                  <span className={`onboarding-status-badge ${steps.every(s => s.completed) ? 'onboarding-completed' : 'onboarding-in-progress'}`}>
                    {steps.every(s => s.completed) ? 'Completed' : 'In Progress'}
                  </span>
                </div>
              </div>

              <div className="onboarding-steps-timeline">
                {steps.sort((a, b) => a.order - b.order).map((step, index) => (
                  <div
                    key={step.id}
                    className={`onboarding-timeline-step ${step.completed ? 'onboarding-completed' : ''} ${index === currentStep ? 'onboarding-current' : ''}`}
                  >
                    <div className="onboarding-step-indicator">
                      <div className="onboarding-step-number">{index + 1}</div>
                      {index < steps.length - 1 && <div className="onboarding-step-connector"></div>}
                    </div>

                    <div className="onboarding-step-card">
                      <div className="onboarding-step-header">
                        <div className="onboarding-step-title">
                          <h4>{step.title}</h4>
                          {step.isRequired && <span className="onboarding-required-badge">Required</span>}
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span className="onboarding-step-type">{step.type}</span>

                          <button
                            onClick={() => {
                              if (isCompanyDocStep(step)) {
                                // Open company docs popup instead of showing inline
                                setViewingCompanyDocs(step);
                              } else if (step.documentPath || (isMSAStep(step) && step.completed)) {
                                // If it's an MSA step or has a direct document path, preview it
                                setPreviewDoc({
                                  url: step.documentPath || (employee.documentPaths?.msaSignedDocument?.url),
                                  fileName: step.title + '.pdf',
                                  label: step.title,
                                  fileType: 'application/pdf'
                                });
                              } else if (isCandidateFormStep(step)) {
                                handleViewCandidateForm();
                              } else if (isEmployerStep(step)) {} else if (isComplianceStep(step)) {
  // For compliance steps, if we have signed documents, show them with signature
// For compliance steps with signed documents
// For compliance steps with signed documents
if (step.signedDocuments && step.signedDocuments.length > 0) {
  const doc = step.signedDocuments[0];
  console.log('[Directory] Previewing SIGNED doc:', { 
    name: doc.fileName, 
    hasData: !!doc.data, 
    dataLength: doc.data?.length,
    signedName: doc.signedName
  });
  
  // Ensure the data is properly formatted
  let pdfData = doc.data;
  if (pdfData && !pdfData.startsWith('data:') && doc.fileType?.includes('pdf')) {
    pdfData = `data:${doc.fileType};base64,${pdfData}`;
  }
  
  setPreviewDoc({ 
    ...doc,
    data: pdfData,
    label: "Signed: " + (doc.fileName || 'Document'),
    url: pdfData,
    fileType: doc.fileType || 'application/pdf',
    hasSignature: true,
    signatureData: doc.signature,
    signaturePosition: doc.signaturePosition,
    signedName: doc.signedName,
    signedAt: doc.signedAt
  });
} else if (step.complianceDocuments && step.complianceDocuments.length > 0) {
  const doc = step.complianceDocuments[0];
  console.log('[Directory] Previewing UNSIGNED COMPLIANCE doc:', { 
    name: doc.fileName, 
    hasData: !!doc.data 
  });
  
  let pdfData = doc.data;
  if (pdfData && !pdfData.startsWith('data:') && doc.fileType?.includes('pdf')) {
    pdfData = `data:${doc.fileType};base64,${pdfData}`;
  }
  
  setPreviewDoc({
    ...doc,
    data: pdfData,
    label: doc.fileName || 'Document',
    url: pdfData,
    hasSignature: false
  });
} else {
  handleViewStepDocuments(step);
}
}
                            }}
                            className="onboarding-icon-btn onboarding-view"
                            title={
                              (step.documentPath || (isMSAStep(step) && step.completed)) ? "View Signed Document" :
                              (isComplianceStep(step) && step.docusignStatus === 'signed') ? "View Signed Document with Signature" :
                              isCandidateFormStep(step) ? "View Candidate Form" :
                              isEmployerStep(step) ? "View Employer Data" :
                              "View Step Documents"
                            }
                          >
                            <Eye size={14} />
                          </button>

                          <button
                            onClick={() => handleEditStep(step)}
                            className="onboarding-icon-btn onboarding-edit"
                            title="Edit Step"
                          >
                            <Edit3 size={14} />
                          </button>

                          <button
                            onClick={() => handleAddStepAtPosition(index + 1)}
                            className="onboarding-icon-btn onboarding-primary"
                            title={`Add Step After Step ${index + 1}`}
                          >
                            <Plus size={14} />
                          </button>

                          <button
                            onClick={() => handleDeleteStep(step.id)}
                            className="onboarding-icon-btn onboarding-delete"
                            title="Delete Step"
                            disabled={updating}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 'px', flexWrap: 'wrap' }}>
                        <p className="onboarding-step-description" style={{ margin: 0 }}>{step.description}</p>
                        {getStepStatusBadge(step, index)}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '15px' }}>
                        {isCandidateFormStep(step) && step.formData && !step.completed && (
                          <div className="onboarding-step-instructions" style={{
                            background: '#d4edda',
                            borderColor: '#c3e6cb',
                            margin: 0
                          }}>
                            <strong style={{ color: '#155724', display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <CheckCircle size={16} color="#28a745" />
                              ✓ Candidate Form Submitted:
                            </strong>
                            <p style={{ color: '#155724', fontSize: '12px', margin: '5px 0 0 20px' }}>
                              Submitted on: {step.completedAt ? new Date(step.completedAt).toLocaleString() : 'N/A'}
                            </p>
                          </div>
                        )}

                        {isEmployerStep(step) && step.employerSubmitted && !step.completed && (
                          <div className="onboarding-step-instructions" style={{
                            background: '#d4edda',
                            borderColor: '#c3e6cb',
                            margin: 0
                          }}>
                            <strong style={{ color: '#155724', display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <CheckCircle size={16} color="#28a745" />
                              ✓ Employer Form Submitted:
                            </strong>
                            <p style={{ color: '#155724', fontSize: '12px', margin: '5px 0 0 20px' }}>
                              Submitted on: {(step.employerSubmittedAt || step.completedAt) ? new Date(step.employerSubmittedAt || step.completedAt).toLocaleString() : 'N/A'}
                            </p>
                          </div>
                        )}

                        {step.completed && (
                          <div className="onboarding-completed-info" style={{ margin: 0 }}>
                            <div className="onboarding-completed-by">
                              <User size={14} />
                              <span>
                                <strong>Completed by:</strong> {step.completedBy || 'Admin'}
                                {step.completedById && <span style={{ fontSize: '11px', marginLeft: '5px', color: '#666' }}>(ID: {step.completedById})</span>}
                              </span>
                            </div>
                            {step.completedAt && (
                              <div className="onboarding-completed-time">
                                {new Date(step.completedAt).toLocaleString()}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {step.documents && step.documents.length > 0 && (
                        <div className="onboarding-step-documents">
                          <strong>Required Documents:</strong>
                          <ul>
                            {step.documents.map((doc, idx) => (
                              <li key={idx}>
                                <FileText size={12} style={{ marginRight: '5px' }} />
                                {doc}
                                {isEmployerStep(step) && step.employerSubmitted && (
                                  <span style={{ color: '#28a745', marginLeft: '5px' }}>✓</span>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* For Upload Company Documents step - show compact indicator instead of inline docs */}
                      {isCompanyDocStep(step) && step.uploadedDocuments && Object.keys(step.uploadedDocuments).length > 0 && (
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '8px', 
                          marginTop: '10px',
                          padding: '8px 12px',
                          background: '#f0fdfa',
                          borderRadius: '8px',
                          border: '1px solid #99f6e4'
                        }}>
                          <Upload size={14} color="#019d88" />
                          <span style={{ fontSize: '13px', color: '#017a6b', fontWeight: '500' }}>
                            {Object.keys(step.uploadedDocuments).length} document{Object.keys(step.uploadedDocuments).length !== 1 ? 's' : ''} uploaded by employer
                          </span>
                          {step.documentsUploadedAt && (
                            <span style={{ fontSize: '11px', color: '#6b7280', marginLeft: 'auto' }}>
                              {new Date(step.documentsUploadedAt).toLocaleString()}
                            </span>
                          )}
                        </div>
                      )}

                      {step.instructions && (
                        <div className="onboarding-step-instructions">
                          <strong>Instructions:</strong>
                          <p>{step.instructions}</p>
                        </div>
                      )}

                      {/* Step Actions Section - FIXED: Compliance buttons only show for compliance steps */}
                      <div style={{ display: 'flex', gap: '10px', marginTop: '16px', flexWrap: 'wrap' }}>
                        {/* Compliance step specific buttons - ONLY show for compliance steps */}
                        {isComplianceStep(step) && (
                          <>
                            {!step.documentsSent && !step.completed && (
                              <button
                                className="onboarding-send-compliance-btn"
                                onClick={() => handleSendComplianceDocuments(step.id)}
                                disabled={updating}
                              >
                                <Mail size={14} />
                                {updating ? 'Sending...' : 'Send Compliance Documents'}
                              </button>
                            )}

                            {step.documentsSent && !step.completed && (
                              <div style={{ display: 'flex', gap: '10px', width: '100%', flexWrap: 'wrap' }}>
                                {step.docusignStatus === 'signed' ? (
                                  <button
                                    onClick={() => handleStepComplete(step.id)}
                                    className="onboarding-complete-step-btn"
                                    disabled={updating}
                                    style={{ background: '#059669' }}
                                  >
                                    <CheckCircle size={14} />
                                    {updating ? 'Completing...' : 'Mark as Complete (Signed)'}
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleResendComplianceDocuments(step.id)}
                                    className="onboarding-send-compliance-btn"
                                    disabled={updating}
                                    style={{ background: '#64748b' }}
                                    title="Upload new documents and resend signing link"
                                  >
                                    <RotateCcw size={14} />
                                    {updating ? 'Sending...' : 'Upload & Resend'}
                                  </button>
                                )}
                                
                                <button
                                  onClick={() => {
                                    setActiveComplianceStep(step);
                                    setShowComplianceModal(true);
                                  }}
                                  className="onboarding-send-compliance-btn"
                                  style={{ background: '#019d88', color: 'white' }}
                                  title="Upload additional documents"
                                >
                                  <Upload size={14} />
                                  Upload New Documents
                                </button>
                              </div>
                            )}
                          </>
                        )}

                        {/* Standard Mark as Complete for non-compliance steps */}
                        {!isComplianceStep(step) && !step.completed && (
                          <button
                            onClick={() => handleStepComplete(step.id)}
                            className="onboarding-complete-step-btn"
                            disabled={updating}
                          >
                            <CheckCircle size={14} />
                            {updating ? 'Completing...' : 'Mark as Complete'}
                          </button>
                        )}

                        {/* Show submission info for steps that have data but aren't completed */}
                        {!step.completed && isCandidateFormStep(step) && step.formData && (
                          <div className="onboarding-info-message" style={{
                            background: '#e7f3ff',
                            padding: '8px 12px',
                            borderRadius: '4px',
                            width: '100%',
                            marginTop: '5px'
                          }}>
                            <small>Candidate has submitted the form. Click "Mark as Complete" to complete this step.</small>
                          </div>
                        )}

                        {!step.completed && isEmployerStep(step) && step.employerSubmitted && (
                          <div className="onboarding-info-message" style={{
                            background: '#e7f3ff',
                            padding: '8px 12px',
                            borderRadius: '4px',
                            width: '100%',
                            marginTop: '5px'
                          }}>
                            <small>Employer has submitted the form. Click "Mark as Complete" to complete this step.</small>
                          </div>
                        )}

                        {step.documentsSent && step.sentAt && (
                          <p style={{ fontSize: '12px', color: '#666', marginTop: '5px', width: '100%' }}>
                            Sent on: {new Date(step.sentAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{
                marginTop: '30px',
                paddingTop: '20px',
                borderTop: '2px dashed #019d88',
                textAlign: 'center'
              }}>
                <button
                  onClick={() => handleAddStepAtPosition(steps.length)}
                  disabled={updating}
                  className="onboarding-add-step-btn"
                >
                  <Plus size={16} />
                  Add New Step at End
                </button>
                <p style={{ fontSize: '12px', color: '#6c757d', marginTop: '8px' }}>
                  Click the + button next to any step to add a new step after that position
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* View Candidate Form Modal */}
      {viewingCandidateForm && employee?.onboardingFormData && (
        <>
          <div className="onboarding-modal-backdrop" onClick={closeViewModals} />
          <div className="onboarding-modal onboarding-modal-wide">
            <div className="onboarding-modal-header" style={{ background: '#1d8c70' }}>
              <h2>
                <User size={20} />
                {employee.name} - Candidate Form Data
              </h2>
              <button onClick={closeViewModals}><X size={20} /></button>
            </div>

            <div className="onboarding-modal-body">
              {/* Documents Section */}
              {viewingDocumentPaths && Object.keys(viewingDocumentPaths).length > 0 && (
                <div className="onboarding-form-section">
                  <h4><FileText size={18} /> Uploaded Documents</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
                    {viewingDocumentPaths.driversLicense && (
                      <div className="onboarding-document-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '24px' }}>{getDocumentIcon(viewingDocumentPaths.driversLicense.fileType)}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '600' }}>Driver's License</div>
                            <div style={{ fontSize: '12px', color: '#666' }}>{viewingDocumentPaths.driversLicense.fileName}</div>
                          </div>
                          <button
                            className="onboarding-icon-btn onboarding-view"
                            title="Preview Document"
                            onClick={() => setPreviewDoc({ ...viewingDocumentPaths.driversLicense, label: "Driver's License" })}
                          >
                            <Eye size={16} />
                          </button>
                        </div>
                      </div>
                    )}

                    {viewingDocumentPaths.visa && (
                      <div className="onboarding-document-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '24px' }}>{getDocumentIcon(viewingDocumentPaths.visa.fileType)}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '600' }}>Visa Copy</div>
                            <div style={{ fontSize: '12px', color: '#666' }}>{viewingDocumentPaths.visa.fileName}</div>
                          </div>
                          <button
                            className="onboarding-icon-btn onboarding-view"
                            title="Preview Document"
                            onClick={() => setPreviewDoc({ ...viewingDocumentPaths.visa, label: 'Visa Copy' })}
                          >
                            <Eye size={16} />
                          </button>
                        </div>
                      </div>
                    )}

                    {viewingDocumentPaths.resume && (
                      <div className="onboarding-document-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '24px' }}>{getDocumentIcon(viewingDocumentPaths.resume.fileType)}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '600' }}>Updated Resume</div>
                            <div style={{ fontSize: '12px', color: '#666' }}>{viewingDocumentPaths.resume.fileName}</div>
                          </div>
                          <button
                            className="onboarding-icon-btn onboarding-view"
                            title="Preview Document"
                            onClick={() => setPreviewDoc({ ...viewingDocumentPaths.resume, label: 'Updated Resume' })}
                          >
                            <Eye size={16} />
                          </button>
                        </div>
                      </div>
                    )}

                    {viewingDocumentPaths.msaSignedDocument && (
                      <div className="onboarding-document-card" style={{ borderLeft: '3px solid #019d88', background: '#f0fdfa' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '24px' }}>📄</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '600', color: '#017a6b' }}>Signed MSA Document</div>
                            <div style={{ fontSize: '12px', color: '#666' }}>{viewingDocumentPaths.msaSignedDocument.fileName}</div>
                          </div>
                          <button
                            className="onboarding-icon-btn onboarding-view"
                            title="View Signed MSA"
                            style={{ background: '#019d88', color: 'white' }}
                            onClick={() => setPreviewDoc({
                              ...viewingDocumentPaths.msaSignedDocument,
                              label: 'Signed MSA Document',
                              fileType: 'application/pdf'
                            })}
                          >
                            <Eye size={16} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Personal Information */}
              <div className="onboarding-form-section">
                <h4><User size={18} /> Personal Information</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
                  <div><strong>First Name:</strong> {employee.onboardingFormData.firstName || 'N/A'}</div>
                  <div><strong>Last Name:</strong> {employee.onboardingFormData.lastName || 'N/A'}</div>
                  <div><strong>Email:</strong> {employee.onboardingFormData.email || 'N/A'}</div>
                  <div><strong>Phone:</strong> {employee.onboardingFormData.phone || 'N/A'}</div>
                  <div><strong>Current Location:</strong> {employee.onboardingFormData.currentLocation || 'N/A'}</div>
                  <div><strong>LinkedIn:</strong> {employee.onboardingFormData.linkedInUrl || 'N/A'}</div>
                  <div><strong>Work Authorization:</strong> {employee.onboardingFormData.workAuthorization || 'N/A'}</div>
                  <div><strong>Date of Birth:</strong> {formatDate(employee.onboardingFormData.dateOfBirth)}</div>
                </div>
              </div>

              {/* Professional Details */}
              <div className="onboarding-form-section">
                <h4><Briefcase size={18} /> Professional Details</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
                  <div><strong>Rate:</strong> {employee.onboardingFormData.rate || 'N/A'}</div>
                  <div><strong>Rate Type:</strong> {employee.onboardingFormData.rateType || 'N/A'}</div>
                  <div><strong>Availability Date:</strong> {formatDate(employee.onboardingFormData.availabilityDate)}</div>
                  <div><strong>Total IT Experience:</strong> {employee.onboardingFormData.totalITExperience || '0'} years</div>
                  <div><strong>Relevant Experience:</strong> {employee.onboardingFormData.relevantExperience || '0'} years</div>
                </div>
              </div>

              {/* Education */}
              <div className="onboarding-form-section">
                <h4><GraduationCap size={18} /> Education</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
                  <div><strong>Highest Degree:</strong> {employee.onboardingFormData.highestDegree || 'N/A'}</div>
                  <div><strong>Specialization:</strong> {employee.onboardingFormData.specialization || 'N/A'}</div>
                  <div><strong>Education Start:</strong> {formatDate(employee.onboardingFormData.educationStartDate)}</div>
                  <div><strong>Education End:</strong> {formatDate(employee.onboardingFormData.educationEndDate)}</div>
                </div>
              </div>

              {/* Employment History */}
              <div className="onboarding-form-section">
                <h4><Building size={18} /> Employment History</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
                  <div><strong>Most Recent Company:</strong> {employee.onboardingFormData.mostRecentCompany || 'N/A'}</div>
                  <div><strong>Company Address:</strong> {employee.onboardingFormData.mostRecentCompanyAddress || 'N/A'}</div>
                  <div><strong>Employment Start:</strong> {formatDate(employee.onboardingFormData.mostRecentEmploymentStart)}</div>
                  <div><strong>Employment End:</strong> {formatDate(employee.onboardingFormData.mostRecentEmploymentEnd)}</div>
                </div>
              </div>

              {/* TCS Related */}
              <div className="onboarding-form-section">
                <h4><Award size={18} /> TCS Related</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
                  <div><strong>Former TCS Employee:</strong> {employee.onboardingFormData.formerTCS || 'No'}</div>
                  {employee.onboardingFormData.formerTCS === 'Yes' && <div><strong>TCS Employee ID:</strong> {employee.onboardingFormData.tcsEmployeeId || 'N/A'}</div>}
                  <div><strong>Former TCS BA:</strong> {employee.onboardingFormData.formerTCSBA || 'No'}</div>
                  {employee.onboardingFormData.formerTCSBA === 'Yes' && <div><strong>TCS BA ID:</strong> {employee.onboardingFormData.tcsBAId || 'N/A'}</div>}
                </div>
              </div>

              {/* Current Employment */}
              <div className="onboarding-form-section">
                <h4><Briefcase size={18} /> Current Employment</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
                  <div><strong>Current Employer:</strong> {employee.onboardingFormData.currentEmployerName || 'N/A'}</div>
                  <div><strong>Employer Address:</strong> {employee.onboardingFormData.currentEmployerAddress || 'N/A'}</div>
                </div>
              </div>

              {/* Identification */}
              <div className="onboarding-form-section">
                <h4><Hash size={18} /> Identification</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
                  <div><strong>Passport Number:</strong> {employee.onboardingFormData.passportNumber || 'N/A'}</div>
                  <div><strong>Last Four SSN:</strong> {employee.onboardingFormData.lastFourSSN || 'N/A'}</div>
                </div>
              </div>

              {/* Languages */}
              <div className="onboarding-form-section">
                <h4><BookOpen size={18} /> Languages</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
                  <div><strong>Speak:</strong> {employee.onboardingFormData.languagesSpeak || 'N/A'}</div>
                  <div><strong>Read:</strong> {employee.onboardingFormData.languagesRead || 'N/A'}</div>
                  <div><strong>Write:</strong> {employee.onboardingFormData.languagesWrite || 'N/A'}</div>
                </div>
              </div>
            </div>

            <div className="onboarding-modal-footer">
              <button className="onboarding-btn-secondary" onClick={closeViewModals}>Close</button>
            </div>
          </div>
        </>
      )}

      {/* View Employer Data Modal */}
      {viewingEmployerData && (
        <>
          <div className="onboarding-modal-backdrop" onClick={closeViewModals} />
          <div className="onboarding-modal">
            <div className="onboarding-modal-header" style={{ background: '#1d8c70' }}>
              <h2>
                <Building2 size={20} />
                Employer Information - {viewingEmployerData.companyName}
              </h2>
              <button onClick={closeViewModals}><X size={20} /></button>
            </div>
            <div className="onboarding-modal-body">
              <div className="onboarding-form-section">
                <h3 style={{ color: '#166534', margin: '0 0 15px 0' }}>Company Details</h3>
                <p><strong>Company Name:</strong> {viewingEmployerData.companyName}</p>
                <p><strong>FEIN ID:</strong> {viewingEmployerData.feinId || 'Not provided'}</p>
                <p><strong>Address:</strong> {viewingEmployerData.companyAddress || 'Not provided'}</p>
              </div>

              <div className="onboarding-form-section">
                <h3 style={{ color: '#166534', margin: '0 0 15px 0' }}>Signing Authority</h3>
                <p><strong>Name:</strong> {viewingEmployerData.signingAuthorityName || 'Not provided'}</p>
                <p><strong>Designation:</strong> {viewingEmployerData.signingAuthorityDesignation || 'Not provided'}</p>
              </div>

              <div className="onboarding-form-section">
                <h3 style={{ color: '#166534', margin: '0 0 15px 0' }}>Contact</h3>
                <p><strong>Email:</strong> {viewingEmployerData.emailId}</p>
                <p><strong>Phone:</strong> {viewingEmployerData.contactNo || 'Not provided'}</p>
              </div>

              <p style={{ color: '#666', fontSize: '12px' }}>
                Submitted: {new Date(viewingEmployerData.updatedAt).toLocaleString()}
              </p>
            </div>
            <div className="onboarding-modal-footer">
              <button className="onboarding-btn-secondary" onClick={closeViewModals}>Close</button>
            </div>
          </div>
        </>
      )}

      {/* View Step Documents Modal */}
      {viewingStepDocuments && (
        <>
          <div className="onboarding-modal-backdrop" onClick={closeViewModals} />
          <div className="onboarding-modal">
            <div className="onboarding-modal-header" style={{ background: '#1d8c70' }}>
              <h2>
                <FileText size={20} />
                {viewingStepDocuments.title} - Documents
              </h2>
              <button onClick={closeViewModals}><X size={20} /></button>
            </div>
            <div className="onboarding-modal-body">
              <p><strong>Description:</strong> {viewingStepDocuments.description}</p>

              {viewingStepDocuments.documents && viewingStepDocuments.documents.length > 0 ? (
                <>
                  <h4 style={{ margin: '15px 0 10px 0' }}>Required Documents:</h4>
                  <ul style={{ paddingLeft: '20px' }}>
                    {viewingStepDocuments.documents.map((doc, idx) => (
                      <li key={idx} style={{ marginBottom: '5px' }}>{doc}</li>
                    ))}
                  </ul>
                </>
              ) : !isComplianceStep(viewingStepDocuments) ? (
                <p>No documents required for this step</p>
              ) : null}

              {/* Compliance Documents Section */}
              {isComplianceStep(viewingStepDocuments) && (
                <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                  <h4 style={{ margin: '0 0 12px 0', color: '#019d88', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Shield size={18} />
                    Compliance Signing Status
                  </h4>
                  
                  {!viewingStepDocuments.documentsSent ? (
                    <div style={{ padding: '15px', background: '#f8fafc', borderRadius: '8px', textAlign: 'center' }}>
                      <p style={{ margin: 0, color: '#64748b' }}>No documents have been sent for signing yet.</p>
                      <button 
                        onClick={() => {
                          closeViewModals();
                          handleSendComplianceDocuments(viewingStepDocuments.id);
                        }}
                        style={{
                          marginTop: '10px',
                          background: '#019d88',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        Send Documents Now
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      {/* Sent Documents */}
                      <div>
                        <p style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Sent for Signing:</p>
                        <div style={{ display: 'grid', gap: '8px' }}>
                          {viewingStepDocuments.complianceDocuments?.map((doc, idx) => (
                            <div key={idx} style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'space-between',
                              padding: '8px 12px',
                              background: 'white',
                              border: '1px solid #e2e8f0',
                              borderRadius: '6px'
                            }}>
                              <span style={{ fontSize: '13px' }}>{doc.fileName}</span>
                              <button 
                                onClick={() => setPreviewDoc({ ...doc, label: doc.fileName })}
                                style={{ background: 'none', border: 'none', color: '#019d88', cursor: 'pointer' }}
                              >
                                <Eye size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Signed Documents / Completion Status */}
                      {( (viewingStepDocuments.signedDocuments && viewingStepDocuments.signedDocuments.length > 0) || 
                         (viewingStepDocuments.docusignStatus === 'signed' && viewingStepDocuments.complianceDocuments && viewingStepDocuments.complianceDocuments.length > 0) ) && (
                        <div style={{ marginTop: '10px', padding: '15px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                          <p style={{ fontSize: '13px', fontWeight: 'bold', color: '#166534', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <ShieldCheck size={16} />
                            {viewingStepDocuments.completed ? 'Step Completed & Verified' : 'Compliance Signed by Candidate'}
                          </p>
                          <div style={{ display: 'grid', gap: '8px' }}>
                            {/* Use signedDocuments if available, otherwise fallback to complianceDocuments (if signed) */}
                            {(viewingStepDocuments.signedDocuments && viewingStepDocuments.signedDocuments.length > 0 
                               ? viewingStepDocuments.signedDocuments 
                               : viewingStepDocuments.complianceDocuments
                            ).map((doc, idx) => (
                              <div key={idx} style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'space-between',
                                padding: '8px 12px',
                                background: 'white',
                                border: '1px solid #bbf7d0',
                                borderRadius: '6px'
                              }}>
                                <span style={{ fontSize: '13px', fontWeight: '500' }}>{doc.fileName}</span>
                                <button 
                                  onClick={() => setPreviewDoc({ 
                                    ...doc, 
                                    label: "Signed: " + doc.fileName,
                                    signatureData: viewingStepDocuments.signatureData,
                                    signaturePosition: viewingStepDocuments.signaturePosition,
                                    signedName: viewingStepDocuments.signedName
                                  })}
                                  style={{ background: '#166534', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}
                                >
                                  View Signed
                                </button>
                              </div>
                            ))}
                          </div>
                          {viewingStepDocuments.signedAt && (
                            <p style={{ fontSize: '11px', color: '#166534', marginTop: '10px' }}>
                              Signed on: {new Date(viewingStepDocuments.signedAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {viewingStepDocuments.instructions && !isComplianceStep(viewingStepDocuments) && (
                <>
                  <h4 style={{ margin: '15px 0 10px 0' }}>Instructions:</h4>
                  <p style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>{viewingStepDocuments.instructions}</p>
                </>
              )}
            </div>
            <div className="onboarding-modal-footer">
              <button className="onboarding-btn-secondary" onClick={closeViewModals}>Close</button>
            </div>
          </div>
        </>
      )}

      {/* Edit Step Modal */}
      {editingStep && editFormData && (
        <>
          <div className="onboarding-modal-backdrop" onClick={closeEditModal} />
          <div className="onboarding-modal">
            <div className="onboarding-modal-header" style={{ background: '#1d8c70' }}>
              <h2>
                <Edit3 size={20} />
                Edit Step: {editingStep.title}
              </h2>
              <button onClick={closeEditModal}><X size={20} /></button>
            </div>
            <div className="onboarding-modal-body">
              <div className="onboarding-form-group" style={{ marginBottom: '15px' }}>
                <label>Title</label>
                <input
                  type="text"
                  value={editFormData.title}
                  onChange={(e) => handleEditFormChange('title', e.target.value)}
                />
              </div>

              <div className="onboarding-form-group" style={{ marginBottom: '15px' }}>
                <label>Description</label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) => handleEditFormChange('description', e.target.value)}
                  rows="3"
                />
              </div>

              <div className="onboarding-form-group" style={{ marginBottom: '15px' }}>
                <label>Type</label>
                <select
                  value={editFormData.type}
                  onChange={(e) => handleEditFormChange('type', e.target.value)}
                >
                  <option value="document">Document</option>
                  <option value="email">Email</option>
                  <option value="verification">Verification</option>
                  <option value="payment">Payment</option>
                  <option value="signature">Signature</option>
                  <option value="compliance">Compliance</option>
                </select>
              </div>

              <div className="onboarding-form-group" style={{ marginBottom: '15px' }}>
                <label>Instructions</label>
                <textarea
                  value={editFormData.instructions}
                  onChange={(e) => handleEditFormChange('instructions', e.target.value)}
                  rows="4"
                />
              </div>

              <div className="onboarding-form-group" style={{ marginBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <label>Documents</label>
                  <button onClick={handleAddDocument} className="onboarding-btn-primary" style={{ padding: '4px 8px', fontSize: '12px' }}>
                    + Add
                  </button>
                </div>
                {editFormData.documents.map((doc, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px', background: '#f5f5f5', marginBottom: '5px', borderRadius: '4px' }}>
                    <span>{doc}</span>
                    <button onClick={() => handleRemoveDocument(idx)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}>×</button>
                  </div>
                ))}
              </div>
            </div>
            <div className="onboarding-modal-footer">
              <button className="onboarding-btn-secondary" onClick={closeEditModal}>Cancel</button>
              <button className="onboarding-btn-primary" onClick={handleSaveEdit} disabled={updating}>
                {updating ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Document Preview Overlay */}
      <DocumentPreviewOverlay previewDoc={previewDoc} onClose={() => setPreviewDoc(null)} />

      {/* Compliance Documents Modal */}
      {showComplianceModal && activeComplianceStep && (
        <ComplianceDocumentsModal
          isOpen={showComplianceModal}
          employee={employee}
          company={company}
          step={activeComplianceStep}
          onClose={() => {
            setShowComplianceModal(false);
            setActiveComplianceStep(null);
          }}
          onSuccess={() => {
            loadWorkflowSteps();
            if (onRefresh) onRefresh();
          }}
        />
      )}

      {/* Company Documents Popup */}
      {viewingCompanyDocs && (
        <>
          <div
            className="onboarding-modal-backdrop"
            onClick={() => setViewingCompanyDocs(null)}
            style={{ zIndex: 4000 }}
          />
          <div className="onboarding-modal" style={{ zIndex: 4001, maxWidth: '700px', width: '92%' }}>
            <div className="onboarding-modal-header" style={{ background: '#1d8c70', color: 'white', border: 'none' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'white', margin: 0 }}>
                <FileText size={20} color="white" />
                Uploaded Company Documents
              </h2>
              <button
                onClick={() => setViewingCompanyDocs(null)}
                style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: 'none', padding: '6px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="onboarding-modal-body">
              {/* Required Documents list */}
              {viewingCompanyDocs.documents && viewingCompanyDocs.documents.length > 0 && (
                <div className="onboarding-step-documents" style={{ marginBottom: '20px' }}>
                  <strong>Required Documents:</strong>
                  <ul>
                    {viewingCompanyDocs.documents.map((doc, idx) => (
                      <li key={idx}>
                        <FileText size={12} style={{ marginRight: '5px' }} />
                        {doc}
                        {viewingCompanyDocs.uploadedDocuments && Object.values(viewingCompanyDocs.uploadedDocuments).some(
                          ud => ud.documentType === doc || ud.label === doc
                        ) && <span style={{ color: '#28a745', marginLeft: '5px' }}>✓</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Uploaded documents with preview */}
              {viewingCompanyDocs.uploadedDocuments && Object.keys(viewingCompanyDocs.uploadedDocuments).length > 0 ? (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <strong style={{ color: '#1d8c70', fontSize: '14px' }}>📄 Uploaded Company Documents:</strong>
                    {viewingCompanyDocs.documentsUploadedAt && (
                      <span style={{ fontSize: '11px', color: '#6b7280' }}>
                        Uploaded by employer on: {new Date(viewingCompanyDocs.documentsUploadedAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '12px' }}>
                    {Object.entries(viewingCompanyDocs.uploadedDocuments).map(([docKey, doc]) => {
                      const docLabels = {
                        i9: 'I-9 Form',
                        w4: 'W-4 Form',
                        w9: 'W-9 Form',
                        coi: 'Certificate of Insurance',
                        businessLicense: 'Business License'
                      };
                      const docLabel = docLabels[docKey] || docKey.replace(/_/g, ' ').replace(/\d+/g, '').trim() || 'Document';
                      const isImg = doc.fileType?.includes('image');

                      return (
                        <div key={docKey} className="onboarding-document-card" style={{ borderLeft: '3px solid #019d88', padding: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                              <span style={{ fontSize: '22px', flexShrink: 0 }}>{isImg ? '🖼️' : '📄'}</span>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontWeight: '600', fontSize: '13px', color: '#017a6b' }}>{docLabel}</div>
                                <div style={{ fontSize: '11px', color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '160px' }}>{doc.fileName}</div>
                                {doc.uploadedAt && (
                                  <div style={{ fontSize: '10px', color: '#019d88' }}>
                                    Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => setPreviewDoc({
                                ...doc,
                                label: docLabel,
                                fileType: doc.fileType || 'application/pdf'
                              })}
                              className="onboarding-icon-btn onboarding-view"
                              title={`Preview ${docLabel}`}
                              style={{ background: '#019d88', color: 'white', flexShrink: 0 }}
                            >
                              <Eye size={14} />
                            </button>
                          </div>

                          {/* Inline image thumbnail preview */}
                          {isImg && doc.url && (
                            <div style={{ marginTop: '10px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #e2e8f0', maxHeight: '120px' }}>
                              <img
                                src={doc.url}
                                alt={docLabel}
                                style={{ width: '100%', height: '120px', objectFit: 'cover', cursor: 'pointer' }}
                                onClick={() => setPreviewDoc({ ...doc, label: docLabel, fileType: doc.fileType || 'image/jpeg' })}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '30px', color: '#6b7280' }}>
                  <Upload size={40} style={{ opacity: 0.4, marginBottom: '10px' }} />
                  <p style={{ margin: 0 }}>No documents uploaded yet by the employer.</p>
                </div>
              )}

              {/* Instructions */}
              {viewingCompanyDocs.instructions && (
                <div className="onboarding-step-instructions" style={{ marginTop: '20px' }}>
                  <strong>Instructions:</strong>
                  <p>{viewingCompanyDocs.instructions}</p>
                </div>
              )}
            </div>

            <div className="onboarding-modal-footer">
              <button className="onboarding-btn-secondary" onClick={() => setViewingCompanyDocs(null)}>Close</button>
            </div>
          </div>
        </>
      )}
    </>
  );
});

EmployeeWorkflowModal.displayName = 'EmployeeWorkflowModal';

// ============================================================
// EMPLOYER POPUP COMPONENT - FIXED
// ============================================================
const EmployerPopup = React.memo(({  // <-- This should be parentheses, not curly braces
  isOpen,
  employee,
  company,
  onClose,
  onSuccess
}) => {  // <-- This is correct
  const [isLoading, setIsLoading] = useState(false);
  const [generatedCredentials, setGeneratedCredentials] = useState(null);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [employerExists, setEmployerExists] = useState(false);
  const [credentialsSent, setCredentialsSent] = useState(false);

  const clientName = employee?.clientName || company?.name || 'Client Company';
  const clientEmail = employee?.clientEmail || employee?.email || '';

  useEffect(() => {
    if (isOpen && employee) {
      localStorage.setItem('associatedEmployeeId', employee.id);
      localStorage.setItem('companyId', company.id);
    }

    return () => {
      localStorage.removeItem('associatedEmployeeId');
      localStorage.removeItem('companyId');
    };
  }, [isOpen, employee, company]);

  useEffect(() => {
    const checkEmployerExists = async () => {
      if (!isOpen || !clientEmail) return;

      setCheckingExisting(true);
      try {
        const token = localStorage.getItem('token');

        const response = await axios.get(
          `${BASE_URL}/api/onboarding-employers?email=${encodeURIComponent(clientEmail)}`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );

        if (response.data.success && response.data.data && response.data.data.length > 0) {
          setEmployerExists(true);
          setCredentialsSent(true);
        } else {
          setEmployerExists(false);
          setCredentialsSent(false);
          setGeneratedCredentials(generateCredentials());
        }
      } catch (error) {
        console.error('Error checking employer:', error);
        setEmployerExists(false);
        setCredentialsSent(false);
        setGeneratedCredentials(generateCredentials());
      } finally {
        setCheckingExisting(false);
      }
    };

    checkEmployerExists();
  }, [isOpen, clientEmail]);

  const generateCredentials = () => {
    const baseUsername = clientName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const randomNum = Math.floor(Math.random() * 1000);
    const username = `${baseUsername}_${randomNum}`;

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return { username, password };
  };

// In EmployerPopup.js - find the handleSendCredentials function and update:
const handleSendCredentials = async () => {
  if (!generatedCredentials) return;

  setIsLoading(true);
  try {
    const token = localStorage.getItem('token');

    // ✅ FIXED: Don't pre-fill the address - leave it blank for employer to enter
    // Also use correct field mapping
    const dataToSend = {
      companyName: employee?.client,                    // StartupXYZ (company name)
      feinId: '',                                       // Leave blank
      companyAddress: '',                               // ✅ Leave BLANK - employer will enter their own address
      signingAuthorityName: employee?.clientName,       // Ram (employer name)
      signingAuthorityDesignation: '',                  // Leave blank
      emailId: clientEmail,                             // employer's email
      contactNo: employee?.phone || '',                 // Candidate phone (or leave blank)
      username: generatedCredentials.username,
      password: generatedCredentials.password
    };

    console.log('📤 Sending credentials to employer:', {
      ...dataToSend,
      password: '***'
    });

    const response = await axios.post(
      `${BASE_URL}/api/onboarding-employers`,
      dataToSend,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.success) {
      setCredentialsSent(true);
      setEmployerExists(true);

      alert(`✅ Employer credentials sent successfully!\n\nCompany: ${employee?.client}\nEmployer Name: ${employee?.clientName}\nEmail: ${clientEmail}\nUsername: ${generatedCredentials.username}\nPassword: ${generatedCredentials.password}\n\nCredentials have been sent to ${clientEmail}\n\n⚠️ Note: The employer must log in and submit their own company address and details.`);

      onClose();
      if (onSuccess) onSuccess();
    }

  } catch (error) {
    console.error('❌ Error creating employer:', error);
    
    let errorMessage = error.message;
    if (error.response?.status === 409) {
      errorMessage = error.response.data.message || 'Username or email already exists';
      setCredentialsSent(true);
      setEmployerExists(true);
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    }
    
    alert('Error: ' + errorMessage);
  } finally {
    setIsLoading(false);
  }
};
  if (!isOpen) return null;

  return (
    <>
      <div className="onboarding-modal-backdrop" onClick={onClose} />
      <div className="onboarding-modal">
        <div className="onboarding-modal-header" style={{ background: '#1d8c70' }}>
          <h2>
            <Building2 size={20} />
            Employer Login & Company Info
          </h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>

        <div className="onboarding-modal-body">
          {checkingExisting ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <div className="onboarding-loading-spinner" style={{ width: '30px', height: '30px', margin: '0 auto 10px' }}></div>
              <p>Checking employer status...</p>
            </div>
          ) : credentialsSent ? (
            <div className="onboarding-success-box">
              <CheckCircle size={48} color="#28a745" style={{ marginBottom: '15px' }} />
              <h3>✓ Credentials Already Sent!</h3>
              <p>
                Employer credentials for <strong>{employee?.client || clientName}</strong> ({clientEmail}) have already been sent.
              </p>
              <div className="onboarding-success-details">
                <p style={{ margin: '0 0 10px 0', color: '#155724', fontWeight: '600' }}>
                  Employer Login Details:
                </p>
                <p style={{ margin: '5px 0', color: '#333' }}>
                  <strong>Portal:</strong> /employer-dashboard
                </p>
                <p style={{ margin: '5px 0', color: '#333' }}>
                  <strong>Email:</strong> {clientEmail}
                </p>
                <p style={{ margin: '5px 0', color: '#333', fontSize: '12px', fontStyle: 'italic' }}>
                  The employer should have received their credentials via email.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* ✅ UPDATED: Display company information correctly */}
              <div className="onboarding-form-section">
                <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#4b5563', margin: '0 0 12px 0' }}>
                  Company Information
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Building size={16} color="#6b7280" />
                    <span style={{ fontWeight: '500', color: '#1f2937' }}>
                      Company: <strong>{employee?.client || 'N/A'}</strong>
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <User size={16} color="#6b7280" />
                    <span style={{ fontWeight: '500', color: '#1f2937' }}>
                      Employer Name: <strong>{employee?.clientName || 'N/A'}</strong>
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Mail size={16} color="#6b7280" />
                    <span style={{ color: '#1f2937' }}>{clientEmail}</span>
                  </div>
                </div>
              </div>

              {/* ✅ NEW: Info box explaining what employer needs to enter */}
              <div className="onboarding-info-box" style={{ marginBottom: '20px' }}>
                <AlertCircle size={18} />
                <p style={{ margin: 0, fontSize: '13px' }}>
                  The employer will need to enter their own:<br/>
                  • Company Address<br/>
                  • FEIN ID<br/>
                  • Contact Number<br/>
                  • Designation
                </p>
              </div>

              {/* Generated Credentials Section */}
              {generatedCredentials && (
                <div className="onboarding-credentials-box">
                  <h3 className="onboarding-credentials-title">
                    <Key size={16} />
                    Generated Login Credentials
                  </h3>

                  <div className="onboarding-credentials-row">
                    <span className="onboarding-credentials-label">Username:</span>
                    <code className="onboarding-credentials-value">
                      {generatedCredentials.username}
                    </code>
                  </div>
                  <div className="onboarding-credentials-row">
                    <span className="onboarding-credentials-label">Password:</span>
                    <code className="onboarding-credentials-value">
                      {generatedCredentials.password}
                    </code>
                  </div>

                  <p style={{ margin: '12px 0 0 0', color: '#166534', fontSize: '13px', fontStyle: 'italic' }}>
                    These credentials will be sent to the client email above.
                  </p>
                </div>
              )}

              {/* Associated Employee Info (optional) */}
              {employee && (
                <div className="onboarding-form-section">
                  <h4 style={{ margin: '0 0 10px 0', color: '#333', fontSize: '14px', fontWeight: '600' }}>
                    Associated Employee
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <p style={{ margin: 0, fontSize: '13px' }}><strong>Name:</strong> {employee.name}</p>
                    <p style={{ margin: 0, fontSize: '13px' }}><strong>Email:</strong> {employee.email}</p>
                    <p style={{ margin: 0, fontSize: '13px' }}><strong>ID:</strong> {employee.employeeId}</p>
                    <p style={{ margin: 0, fontSize: '13px' }}><strong>Department:</strong> {employee.department}</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="onboarding-modal-footer">
          <button className="onboarding-btn-secondary" onClick={onClose}>
            {credentialsSent ? 'Close' : 'Cancel'}
          </button>
          {!credentialsSent && !employerExists && (
            <button
              className="onboarding-btn-primary"
              onClick={handleSendCredentials}
              disabled={isLoading || !generatedCredentials}
              style={{ background: '#019d88' }}
            >
              {isLoading ? 'Sending...' : 'Send Credentials to Employer'}
            </button>
          )}
        </div>
      </div>
    </>
  );
});

EmployerPopup.displayName = 'EmployerPopup';

// ============================================================
// MAIN EMPLOYEE DIRECTORY COMPONENT
// ============================================================
const EmployeeDirectory = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const selectedCompany = location.state?.company || null;

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [employeeWorkflowModal, setEmployeeWorkflowModal] = useState({
    isOpen: false,
    employee: null
  });
  const [sendCredentialsModal, setSendCredentialsModal] = useState({
    isOpen: false,
    employee: null
  });
  const [candidateFormModal, setCandidateFormModal] = useState({
    isOpen: false,
    formData: null,
    documentPaths: null,
    candidateName: '',
    companyId: null,
    employeeId: null,
    employee: null
  });

  const [employerPopup, setEmployerPopup] = useState({
    isOpen: false,
    employee: null
  });

  const [previewDoc, setPreviewDoc] = useState(null);

  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    formsSubmitted: 0,
    credentialsSent: 0
  });

  const fetchEmployees = useCallback(async () => {
    if (!selectedCompany?.id) {
      navigate('/onboarding-company');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(
        `${BASE_URL}/api/onboarding-workflow-employees/company/${selectedCompany.id}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      const employeesData = response.data.data || [];
      setEmployees(employeesData);

      const completedCount = employeesData.filter(e => e.workflowStatus === 'Completed').length;
      const inProgressCount = employeesData.filter(e => e.workflowStatus === 'In Progress').length;
      const formsSubmittedCount = employeesData.filter(e => e.onboardingFormData).length;
      const credentialsSentCount = employeesData.filter(e => e.userId).length;

      setStats({
        total: employeesData.length,
        completed: completedCount,
        inProgress: inProgressCount,
        formsSubmitted: formsSubmittedCount,
        credentialsSent: credentialsSentCount
      });

    } catch (error) {
      console.error("Fetch employees error:", error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        setError('Failed to load onboarded employees. Please try again.');
      }
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCompany, navigate]);

  useEffect(() => {
    if (selectedCompany?.id) {
      fetchEmployees();
    }
  }, [selectedCompany, fetchEmployees]);

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const searchLower = searchTerm.toLowerCase();
      return (
        emp.name.toLowerCase().includes(searchLower) ||
        emp.email.toLowerCase().includes(searchLower) ||
        emp.employeeId.toLowerCase().includes(searchLower)
      );
    });
  }, [employees, searchTerm]);

  const handleRefresh = () => {
    fetchEmployees();
  };

  const openEditEmployeeModal = (employee) => {
    alert('Edit functionality - please implement your edit modal');
    console.log('Edit employee:', employee);
  };

  const handleDeleteEmployee = async (employeeId) => {
    const confirm = window.confirm('Are you sure you want to delete this employee? This action cannot be undone.');

    if (confirm) {
      try {
        const token = localStorage.getItem('token');

        await axios.delete(
          `${BASE_URL}/api/onboarding-workflow-employees/company/${selectedCompany.id}/${employeeId}`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );

        alert('Employee deleted successfully');
        fetchEmployees();

      } catch (error) {
        console.error('Error deleting employee:', error);
        alert('Error deleting employee: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const openEmployeeWorkflowModal = (employee) => {
    setEmployeeWorkflowModal({
      isOpen: true,
      employee: employee
    });
  };

  const closeEmployeeWorkflowModal = () => {
    setEmployeeWorkflowModal({
      isOpen: false,
      employee: null
    });
  };

  const openSendCredentialsModal = (employee) => {
    setSendCredentialsModal({
      isOpen: true,
      employee: employee
    });
  };

  const closeSendCredentialsModal = () => {
    setSendCredentialsModal({
      isOpen: false,
      employee: null
    });
  };

  const openCandidateFormModal = (employee) => {
    setCandidateFormModal({
      isOpen: true,
      formData: employee.onboardingFormData,
      documentPaths: employee.documentPaths,
      candidateName: employee.name,
      companyId: selectedCompany?.id,
      employeeId: employee.id,
      employee: employee
    });
  };

  const closeCandidateFormModal = () => {
    setCandidateFormModal({
      isOpen: false,
      formData: null,
      documentPaths: null,
      candidateName: '',
      companyId: null,
      employeeId: null,
      employee: null
    });
  };

  const handleFormUpdated = (updatedData) => {
    // Update the local employees list so the modal reflects new data immediately
    setEmployees(prev => prev.map(emp =>
      emp.id === candidateFormModal.employeeId
        ? { ...emp, onboardingFormData: updatedData }
        : emp
    ));

    // Also update the modal's form data
    setCandidateFormModal(prev => ({
      ...prev,
      formData: updatedData
    }));
  };

  const handleDocumentDeleted = (documentType) => {
    // Refresh the specific employee's data from server
    const employee = candidateFormModal.employee;
    if (employee && employee.id) {
      // Refresh the employee data
      fetchEmployees();

      // Update modal's document paths by removing the deleted document
      setCandidateFormModal(prev => {
        const newDocumentPaths = { ...prev.documentPaths };
        delete newDocumentPaths[documentType];
        return {
          ...prev,
          documentPaths: newDocumentPaths
        };
      });
    }
  };

  const openEmployerPopup = (employee) => {
    setEmployerPopup({
      isOpen: true,
      employee: employee
    });
  };

  const closeEmployerPopup = () => {
    setEmployerPopup({
      isOpen: false,
      employee: null
    });
  };

  const getWorkflowBadge = (status) => {
    const statusMap = {
      'Completed': { class: 'onboarding-completed', icon: CheckCircle },
      'In Progress': { class: 'onboarding-in-progress', icon: Clock },
      'Not Started': { class: 'onboarding-pending', icon: AlertCircle }
    };

    const statusInfo = statusMap[status] || statusMap['Not Started'];
    const Icon = statusInfo.icon;

    return (
      <span className={`onboarding-status-badge ${statusInfo.class}`}>
        <Icon size={12} />
        {status}
      </span>
    );
  };

  if (!selectedCompany) {
    return (
      <div className="onboarding-error-state">
        <AlertCircle size={48} />
        <p>No company selected</p>
        <button onClick={() => navigate('/onboarding-company')} className="onboarding-retry-btn">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="onboarding-page-container">
      {/* Header */}
      <div className="onboarding-header">
        <button
          className="onboarding-back-button"
          onClick={() => navigate('/onboarding-company')}
        >
          <ChevronLeft size={20} />
          Back to Companies
        </button>
        <div className="onboarding-header-content">
          <h1 className="onboarding-title">
            <Building size={24} />
            {selectedCompany.name} - Onboarded Employees
          </h1>
          <p className="onboarding-subtitle">
            View and manage employees who have been onboarded
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="onboarding-stats-grid">
        <div className="onboarding-stat-card">
          <Users size={24} color="#019d88" />
          <div className="onboarding-stat-content">
            <span className="onboarding-stat-value">{stats.total}</span>
            <span className="onboarding-stat-label">Total Onboarded</span>
          </div>
        </div>

        <div className="onboarding-stat-card">
          <CheckCircle size={24} color="#019d88" />
          <div className="onboarding-stat-content">
            <span className="onboarding-stat-value">{stats.completed}</span>
            <span className="onboarding-stat-label">Completed</span>
          </div>
        </div>

        <div className="onboarding-stat-card">
          <Clock size={24} color="#019d88" />
          <div className="onboarding-stat-content">
            <span className="onboarding-stat-value">{stats.inProgress}</span>
            <span className="onboarding-stat-label">In Progress</span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="onboarding-controls">
        <div className="onboarding-search-container">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search onboarded employees by name, email, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="onboarding-search-input"
          />
        </div>
      </div>

      {/* Employees Table */}
      <div className="onboarding-table-container">
        {loading ? (
          <div className="onboarding-loading" style={{ padding: '40px' }}>
            <div className="onboarding-loading-spinner"></div>
            <p>Loading onboarded employees...</p>
          </div>
        ) : error ? (
          <div className="onboarding-error" style={{ padding: '40px' }}>
            <AlertCircle size={48} />
            <p>{error}</p>
            <button onClick={fetchEmployees} className="onboarding-retry-btn">
              Retry
            </button>
          </div>
        ) : filteredEmployees.length > 0 ? (
          <table className="onboarding-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Position</th>
                <th>Onboarding</th>
                <th>Credentials</th>
                <th>Form Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map(emp => (
                <tr key={emp.id}>
                  <td>
                    <div className="onboarding-employee-info">{emp.name}</div>
                    <div className="onboarding-employee-email">{emp.email}</div>
                    <div className="onboarding-employee-id">ID: {emp.employeeId}</div>
                    <div className="onboarding-employee-id">Client: {emp.client || emp.clientName}</div>
                  </td>
                  <td>{emp.department}</td>
                  <td>{emp.position || 'N/A'}</td>
                  <td>
                    {getWorkflowBadge(emp.workflowStatus)}
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                      {emp.workflowProgress || 0}% complete
                    </div>
                  </td>
                  <td>
                    {emp.userId ? (
                      <span className="onboarding-status-badge onboarding-completed">
                        <CheckCircle size={12} />
                        Sent
                      </span>
                    ) : (
                      <span className="onboarding-status-badge onboarding-pending">
                        <AlertCircle size={12} />
                        Not Sent
                      </span>
                    )}
                  </td>
                  <td>
                    {emp.onboardingFormData ? (
                      <span className="onboarding-status-badge onboarding-completed">
                        <CheckCircle size={12} />
                        Submitted
                      </span>
                    ) : (
                      <span className="onboarding-status-badge onboarding-pending">
                        <AlertCircle size={12} />
                        Pending
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="onboarding-action-buttons">
                      {/* View Onboarding Steps */}
                      <button
                        onClick={() => openEmployeeWorkflowModal(emp)}
                        className="onboarding-icon-btn onboarding-success"
                        title="View Onboarding Steps"
                      >
                        <FileText size={16} />
                      </button>

                      {/* Edit Button */}
                      {/* <button 
                        onClick={() => openEditEmployeeModal(emp)} 
                        className="onboarding-icon-btn onboarding-edit"
                        title="Edit Employee"
                      >
                        <Edit3 size={16} />
                      </button> */}

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDeleteEmployee(emp.id)}
                        className="onboarding-icon-btn onboarding-delete"
                        title="Delete Employee"
                      >
                        <Trash2 size={16} />
                      </button>

                      {/* Send Candidate Credentials */}
                      {!emp.userId && (
                        <button
                          onClick={() => openSendCredentialsModal(emp)}
                          className="onboarding-icon-btn onboarding-primary"
                          title="Send Login Credentials"
                        >
                          <MailIcon size={16} />
                        </button>
                      )}

                      {/* View Form Data */}
                      {emp.onboardingFormData && (
                        <button
                          onClick={() => openCandidateFormModal(emp)}
                          className="onboarding-icon-btn onboarding-view"
                          title="View Form Data"
                        >
                          <Eye size={16} />
                        </button>
                      )}

                      {/* View Signed MSA Direct Button */}
                      {emp.documentPaths?.msaSignedDocument && (
                        <button
                          onClick={() => setPreviewDoc({
                            ...emp.documentPaths.msaSignedDocument,
                            label: 'Signed MSA Document',
                            fileType: 'application/pdf'
                          })}
                          className="onboarding-icon-btn onboarding-success"
                          title="View Signed MSA"
                          style={{ background: '#059669', color: 'white' }}
                        >
                          <Eye size={16} />
                        </button>
                      )}

                      {/* Send Employer Credentials */}
                      <button
                        onClick={() => openEmployerPopup(emp)}
                        className="onboarding-icon-btn onboarding-primary"
                        title="Send Employer Login Credentials"
                      >
                        <Building2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="onboarding-empty" style={{ padding: '40px' }}>
            <Users size={48} />
            <h3>No Onboarded Employees Found</h3>
            <p>
              {searchTerm
                ? 'No onboarded employees match your search criteria.'
                : 'No employees have been onboarded yet. Click "Add New Onboarding" in the companies page to get started.'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => navigate('/onboarding-company')}
                className="onboarding-add-btn"
                style={{ marginTop: '16px' }}
              >
                Go to Companies
              </button>
            )}
          </div>
        )}
      </div>

      {/* Employee Workflow Steps Modal */}
      <EmployeeWorkflowModal
        isOpen={employeeWorkflowModal.isOpen}
        employee={employeeWorkflowModal.employee}
        company={selectedCompany}
        onClose={closeEmployeeWorkflowModal}
        onRefresh={handleRefresh}
        onSendCredentials={openSendCredentialsModal}
      />

      {/* Send Credentials Modal */}
      <SendCredentialsModal
        isOpen={sendCredentialsModal.isOpen}
        employee={sendCredentialsModal.employee}
        company={selectedCompany}
        onClose={closeSendCredentialsModal}
        onSuccess={handleRefresh}
      />

      {/* Candidate Form Data Modal */}
      <CandidateFormModal
        isOpen={candidateFormModal.isOpen}
        formData={candidateFormModal.formData}
        documentPaths={candidateFormModal.documentPaths}
        candidateName={candidateFormModal.candidateName}
        companyId={candidateFormModal.companyId}
        employeeId={candidateFormModal.employeeId}
        onClose={closeCandidateFormModal}
        onFormUpdated={handleFormUpdated}
        onDocumentDeleted={handleDocumentDeleted}
      />

      {/* Employer Popup Modal */}
      <EmployerPopup
        isOpen={employerPopup.isOpen}
        employee={employerPopup.employee}
        company={selectedCompany}
        onClose={closeEmployerPopup}
        onSuccess={handleRefresh}
      />

      {/* Document Preview Overlay */}
      <DocumentPreviewOverlay previewDoc={previewDoc} onClose={() => setPreviewDoc(null)} />
    </div>
  );
};

export default EmployeeDirectory;