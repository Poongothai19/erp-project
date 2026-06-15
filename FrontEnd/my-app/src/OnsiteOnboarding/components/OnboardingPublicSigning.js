import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Loader, CheckCircle, FileText, X, Shield, Send, AlertTriangle, Edit3, Trash2, ChevronLeft, ChevronRight, ShieldCheck } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import { motion } from 'framer-motion';
import BASE_URL from "../../url";
import Swal from 'sweetalert2';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

export default function OnboardingPublicSigning() {
  const { signingToken } = useParams();
  const query = new URLSearchParams(useLocation().search);
  const companyId = query.get('cid');
  const employeeId = query.get('eid');
  const stepId = query.get('sid');

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [error, setError] = useState(null);
  const [signing, setSigning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [sigPad, setSigPad] = useState(null);
  const [signatureImage, setSignatureImage] = useState(null);
  const [signaturePosition, setSignaturePosition] = useState({ x: 50, y: 70 });
  const [signatureRotation, setSignatureRotation] = useState(0);
  const [isPlacing, setIsPlacing] = useState(false);
  const [activeDocIndex, setActiveDocIndex] = useState(0);
  const [typedName, setTypedName] = useState('');

  // PDF page-by-page rendering state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pdfDocRef, setPdfDocRef] = useState(null);
  const [pageRendering, setPageRendering] = useState(false);
  const [signaturePlacedOnPage, setSignaturePlacedOnPage] = useState(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (session?.candidateName && !typedName) {
      setTypedName(session.candidateName);
    }
  }, [session]);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${BASE_URL}/api/onboarding-workflow-employees/company/${companyId}/${employeeId}/signing-session/${stepId}?token=${signingToken}`
        );

        if (response.data.success) {
          setSession(response.data.data);
          if (response.data.data.status === 'completed') {
            setCompleted(true);
          }
        }
      } catch (err) {
        console.error('Error fetching signing session:', err);
        setError(err.response?.data?.message || 'Invalid or expired signing link.');
      } finally {
        setLoading(false);
      }
    };

    if (signingToken && companyId && employeeId && stepId) {
      fetchSession();
    } else {
      setError('Missing session parameters.');
      setLoading(false);
    }
  }, [signingToken, companyId, employeeId, stepId]);

  // Load PDF and render the current page as a canvas image
  const loadAndRenderPdf = useCallback(async (dataUrl, pageNum) => {
    if (!dataUrl || !canvasRef.current) return;
    try {
      setPageRendering(true);
      
      let pdfDoc = pdfDocRef;
      // Only reload the PDF document if it's a new document
      if (!pdfDoc) {
        // Convert data URL to ArrayBuffer
        const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
        const binaryStr = atob(base64);
        const len = binaryStr.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) bytes[i] = binaryStr.charCodeAt(i);
        
        pdfDoc = await pdfjsLib.getDocument({ data: bytes }).promise;
        setPdfDocRef(pdfDoc);
        setTotalPages(pdfDoc.numPages);
      }
      
      const page = await pdfDoc.getPage(pageNum);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      // Scale to fit container width
      const containerWidth = containerRef.current?.clientWidth || 800;
      const unscaledViewport = page.getViewport({ scale: 1 });
      const scale = containerWidth / unscaledViewport.width;
      const viewport = page.getViewport({ scale });
      
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      await page.render({ canvasContext: ctx, viewport }).promise;
      setPageRendering(false);
    } catch (err) {
      console.error('Error rendering PDF page:', err);
      setPageRendering(false);
    }
  }, [pdfDocRef]);

  // Re-render when document or page changes
  useEffect(() => {
    if (!session?.documents?.[activeDocIndex]) return;
    const doc = session.documents[activeDocIndex];
    
    if (doc.fileType && doc.fileType.includes('pdf')) {
      // Reset PDF doc ref when switching documents
      setPdfDocRef(null);
      setCurrentPage(1);
      setTotalPages(0);
    }
  }, [activeDocIndex, session]);

  useEffect(() => {
    if (!session?.documents?.[activeDocIndex]) return;
    const doc = session.documents[activeDocIndex];
    
    if (doc.fileType && doc.fileType.includes('pdf') && doc.data) {
      // Small delay to ensure canvas is mounted
      const timer = setTimeout(() => {
        if (currentPage === 1 && !pdfDocRef) {
          // First load - need to load the PDF
          loadAndRenderPdf(doc.data, 1);
        } else if (pdfDocRef) {
          // Already loaded - just render the page
          loadAndRenderPdf(doc.data, currentPage);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [currentPage, pdfDocRef, session, activeDocIndex, loadAndRenderPdf]);

  const isPdf = session?.documents?.[activeDocIndex]?.fileType?.includes('pdf');

  const handleClearSignature = () => {
    sigPad.clear();
    setSignatureImage(null);
    setIsPlacing(false);
    setSignaturePlacedOnPage(null);
  };

  const handleSaveSignature = () => {
    if (sigPad.isEmpty()) {
      Swal.fire({ title: 'Empty Signature', text: 'Please draw your signature first.', icon: 'warning', confirmButtonColor: '#019d88' });
      return;
    }
    const dataUrl = sigPad.getCanvas().toDataURL('image/png');
    setSignatureImage(dataUrl);
    setIsPlacing(true);
    Swal.fire({ title: 'Now Place Signature', text: 'Navigate to the correct page, then click exactly where you want to place the signature.', icon: 'info', confirmButtonColor: '#019d88' });
  };

  const handleDocumentClick = (e) => {
    if (!isPlacing || !signatureImage) return;
    
    // Calculate coordinates relative to the canvas (PDF page)
    const canvas = canvasRef.current;
    
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Only allow placement if it's within the canvas area
    if (x >= 0 && x <= 100 && y >= 0 && y <= 100) {
      setSignaturePosition({ x, y });
      setSignaturePlacedOnPage(currentPage);
      setIsPlacing(false);
      
      Swal.fire({ 
        title: 'Signature Placed!', 
        text: `Signature placed on page ${currentPage}. You can drag to reposition or adjust rotation.`, 
        icon: 'success', 
        confirmButtonColor: '#019d88', 
        timer: 1500 
      });
    }
  };

  const handleConfirmSigning = async () => {
    if (!signatureImage) {
      Swal.fire({ title: 'Signature Required', text: 'Please draw and place your signature on the document first.', icon: 'warning', confirmButtonColor: '#019d88' });
      return;
    }

    try {
      setSigning(true);

      console.log('Finalizing signing with data:', {
        companyId, employeeId, stepId, 
        page: signaturePlacedOnPage || currentPage,
        hasSignature: !!signatureImage,
        position: signaturePosition
      });

      const response = await axios.post(`${BASE_URL}/api/onboarding-workflow-employees/docusign-webhook`, {
        event: 'envelope-completed',
        data: {
          envelopeId: signingToken, 
          companyId,
          employeeId,
          stepId,
          signature: signatureImage,
          signaturePosition: JSON.stringify(signaturePosition),
          signatureRotation: signatureRotation,
          signaturePage: signaturePlacedOnPage || currentPage,
          signedName: typedName
        }
      });

      if (response.data.success || response.status === 200) {
        setCompleted(true);
        Swal.fire({ title: 'Successfully Signed!', text: 'The compliance documents have been signed and returned to the administrator.', icon: 'success', confirmButtonColor: '#019d88' });
      }
    } catch (err) {
      console.error('Error completing signing:', err);
      Swal.fire({ title: 'Error', text: 'Failed to complete the signing process. Please try again.', icon: 'error' });
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f8fafc' }}>
        <Loader className="animate-spin" size={48} color="#019d88" />
        <p style={{ marginTop: '20px', color: '#64748b', fontSize: '18px', fontWeight: '500' }}>Loading your signing session...</p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f8fafc' }}>
        <AlertTriangle size={48} color="#dc2626" />
        <p style={{ marginTop: '20px', color: '#dc2626', fontSize: '18px', fontWeight: '500' }}>{error || 'Session not found'}</p>
      </div>
    );
  }

  if (completed) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f0fdf4' }}>
        <CheckCircle size={64} color="#16a34a" />
        <h2 style={{ marginTop: '20px', color: '#166534', fontSize: '24px', fontWeight: '700' }}>Documents Signed Successfully!</h2>
        <p style={{ marginTop: '10px', color: '#4b5563', fontSize: '16px' }}>Your signed documents have been submitted to the administrator.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#f8fafc' }}>
      {/* Header */}
      <header style={{ background: '#019d88', color: 'white', padding: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700' }}>Document Signing Portal</h1>
        <p style={{ margin: '5px 0 0 0', fontSize: '14px', opacity: 0.9 }}>Please review and sign all required compliance documents</p>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '30px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '30px' }}>
          {/* Document Area */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Document Tabs */}
            {session?.documents && session.documents.length > 1 && (
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px', overflowX: 'auto' }}>
                {session.documents.map((doc, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveDocIndex(idx)}
                    style={{
                      padding: '10px 20px',
                      background: activeDocIndex === idx ? '#019d88' : '#f1f5f9',
                      color: activeDocIndex === idx ? 'white' : '#64748b',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.3s'
                    }}
                  >
                    {doc.fileName || `Document ${idx + 1}`}
                  </button>
                ))}
              </div>
            )}

            {/* PDF/Image Display Container */}
            <div 
              ref={containerRef}
              style={{ position: 'relative', background: '#525659', minHeight: '700px', display: 'flex', justifyContent: 'center', overflow: 'auto', borderRadius: '12px' }}
              onClick={handleDocumentClick}
            >
              {isPdf ? (
                <>
                  <canvas 
                    ref={canvasRef} 
                    style={{ display: 'block', maxWidth: '100%' }}
                  />
                  {pageRendering && (
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                      <Loader className="animate-spin" size={32} />
                      <span>Loading page {currentPage}...</span>
                    </div>
                  )}
                </>
              ) : (
                /* Non-PDF documents (images) */
                session.documents?.[activeDocIndex] && (
                  <img 
                    src={session.documents[activeDocIndex].data} 
                    alt={session.documents[activeDocIndex].fileName}
                    style={{ maxWidth: '100%', objectFit: 'contain' }}
                  />
                )
              )}
              
              {/* FIXED: Signature overlay - positioned relative to canvas with proper coordinate system */}
              {signatureImage && !isPlacing && signaturePlacedOnPage === currentPage && (
                <motion.div 
                  drag
                  dragMomentum={false}
                  dragElastic={0}
                  onDrag={(event, info) => {
                    const canvas = canvasRef.current;
                    if (!canvas) return;
                    
                    const rect = canvas.getBoundingClientRect();
                    const x = ((event.clientX - rect.left) / rect.width) * 100;
                    const y = ((event.clientY - rect.top) / rect.height) * 100;
                    
                    // Constrain within bounds
                    const constrainedX = Math.max(0, Math.min(100, x));
                    const constrainedY = Math.max(0, Math.min(100, y));
                    
                    setSignaturePosition({ x: constrainedX, y: constrainedY });
                  }}
                  style={{
                    position: 'absolute',
                    top: `${signaturePosition.y}%`,
                    left: `${signaturePosition.x}%`,
                    transform: `translate(-50%, -85%) rotate(${signatureRotation}deg)`,
                    zIndex: 100,
                    cursor: 'grab',
                  }}
                >
                  <img 
                    src={signatureImage} 
                    alt="signature" 
                    style={{ height: '70px', width: 'auto', mixBlendMode: 'multiply', pointerEvents: 'none' }} 
                  />
                </motion.div>
              )}

              {/* Placement Overlay */}
              {isPlacing && (
                <div style={{ 
                  position: 'absolute', 
                  top: 0, left: 0, right: 0, bottom: 0, 
                  background: 'rgba(1, 157, 136, 0.1)', 
                  zIndex: 200,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'crosshair'
                }}>
                  <div style={{ background: 'white', padding: '15px 30px', borderRadius: '30px', boxShadow: '0 8px 25px rgba(0,0,0,0.15)', color: '#019d88', fontWeight: '800', fontSize: '15px' }}>
                     📍 Click to place Signature on Page {currentPage}
                  </div>
                </div>
              )}
            </div>

            {/* Signature placement info */}
            {signaturePlacedOnPage && signaturePlacedOnPage !== currentPage && signatureImage && (
              <div style={{ background: '#fffbeb', padding: '10px 20px', borderTop: '1px solid #fef3c7', textAlign: 'center', fontSize: '13px', color: '#92400e', fontWeight: '600' }}>
                ⚠️ Your signature is placed on Page {signaturePlacedOnPage}. Navigate there to see/adjust it.
              </div>
            )}

            {/* Page Navigation for PDFs */}
            {isPdf && totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', marginTop: '20px' }}>
                <button 
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  style={{ background: '#f1f5f9', color: '#64748b', border: 'none', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px', fontWeight: '600' }}
                >
                  <ChevronLeft size={16} /> Previous
                </button>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#64748b' }}>Page {currentPage} of {totalPages}</span>
                <button 
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  style={{ background: '#f1f5f9', color: '#64748b', border: 'none', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px', fontWeight: '600' }}
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Sidebar / Signature Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', padding: '24px', border: '1px solid #e2e8f0' }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Typed Full Name</label>
                <input 
                  type="text"
                  value={typedName}
                  onChange={(e) => setTypedName(e.target.value)}
                  placeholder="Enter your full name"
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', background: '#f8fafc' }}
                />
              </div>

              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#334155', marginBottom: '16px' }}>Draw or Upload Signature</h3>
              
              <div style={{ border: '2px dashed #e2e8f0', borderRadius: '12px', background: '#f8fafc', overflow: 'hidden', marginBottom: '15px' }}>
                <SignatureCanvas 
                  penColor="#011f4b"
                  canvasProps={{ width: 300, height: 180, className: 'sigCanvas' }}
                  ref={(ref) => setSigPad(ref)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <button 
                  onClick={handleClearSignature}
                  style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '10px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                >
                  <Trash2 size={16} /> Clear
                </button>
                <button 
                  onClick={() => document.getElementById('signatureUpload').click()}
                  style={{ background: '#f8fafc', color: '#019d88', border: '1px solid #019d88', padding: '10px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                >
                  <FileText size={16} /> Upload Image
                </button>
                <input 
                  type="file" 
                  id="signatureUpload" 
                  style={{ display: 'none' }} 
                  accept="image/*" 
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        setSignatureImage(event.target.result);
                        setIsPlacing(true);
                        Swal.fire({ title: 'Signature Loaded', text: 'Navigate to the correct page and click to place it.', icon: 'success', confirmButtonColor: '#019d88' });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </div>

              <button 
                onClick={handleSaveSignature}
                style={{ width: '100%', background: '#019d88', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '20px' }}
              >
                <Edit3 size={18} /> Confirm Signature
              </button>

              {signatureImage && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>
                    Rotate Signature ({signatureRotation}°)
                  </label>
                  <input 
                    type="range" 
                    min="-45" 
                    max="45" 
                    value={signatureRotation} 
                    onChange={(e) => setSignatureRotation(parseInt(e.target.value))}
                    style={{ width: '100%', accentColor: '#019d88' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8', marginTop: '5px' }}>
                    <span>-45°</span>
                    <button 
                      onClick={() => setSignatureRotation(0)}
                      style={{ background: 'none', border: 'none', color: '#019d88', cursor: 'pointer', fontSize: '10px', fontWeight: '700' }}
                    >
                      Reset
                    </button>
                    <span>45°</span>
                  </div>
                </div>
              )}

              {/* Signature status */}
              {signaturePlacedOnPage && (
                <div style={{ background: '#f0fdf4', padding: '12px', borderRadius: '10px', border: '1px solid #bbf7d0', marginBottom: '15px', fontSize: '13px', color: '#166534', fontWeight: '600' }}>
                  ✅ Signature placed on Page {signaturePlacedOnPage}
                </div>
              )}

              <div style={{ height: '1px', background: '#e2e8f0', margin: '20px 0' }} />

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'flex', gap: '10px', cursor: 'pointer', alignItems: 'flex-start' }}>
                  <input type="checkbox" id="agreeCheckbox" style={{ marginTop: '3px' }} defaultChecked={true} />
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    I agree to electronically sign these documents.
                  </span>
                </label>
              </div>

              <button 
                onClick={handleConfirmSigning}
                disabled={signing || !signatureImage}
                style={{ 
                  width: '100%', 
                  background: 'linear-gradient(135deg, #019d88, #017a6b)', 
                  color: 'white', 
                  border: 'none', 
                  padding: '16px', 
                  borderRadius: '12px', 
                  fontWeight: '700', 
                  fontSize: '16px', 
                  cursor: !signatureImage ? 'not-allowed' : 'pointer',
                  opacity: !signatureImage ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  boxShadow: '0 4px 15px rgba(1, 157, 136, 0.3)',
                }}
              >
                {signing ? 'Processing...' : <><Send size={20} /> Sign & Complete</>}
              </button>
            </div>

            <div style={{ background: '#fffbeb', borderRadius: '16px', padding: '20px', border: '1px solid #fef3c7', marginTop: '20px' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <Shield size={20} color="#d97706" />
                <div>
                  <h4 style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#92400e', fontWeight: '700' }}>Security Notice</h4>
                  <p style={{ margin: 0, fontSize: '12px', color: '#b45309', lineHeight: '1.4' }}>
                    This session is secured with end-to-end encryption. Your signature is permanently embedded into the PDF with an IP-tracked audit trail.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
        &copy; {new Date().getFullYear()} Prophecy ERP Compliance System. All documents are stored securely.
      </footer>
    </div>
  );
}