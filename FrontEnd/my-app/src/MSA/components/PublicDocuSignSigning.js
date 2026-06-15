// src/MSA/components/PublicDocuSignSigning.js
// RECIPIENT SIGNING PAGE - Shows pre-placed fields from admin, recipient fills them

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Loader, Check, X } from 'lucide-react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useParams } from 'react-router-dom';
import BASE_URL from "../../url";
import PdfCanvasViewer from './PdfCanvasViewer';
import { FaPencilAlt, FaKeyboard, FaExclamationTriangle, FaFileAlt, FaCheckCircle, FaSquare } from 'react-icons/fa';

// Signature font styles (Google Fonts)
const SIGNATURE_FONTS = [
  { name: 'Dancing Script', label: 'Elegant' },
  { name: 'Great Vibes', label: 'Formal' },
  { name: 'Pacifico', label: 'Casual' },
  { name: 'Caveat', label: 'Natural' },
  { name: 'Sacramento', label: 'Classic' },
];

// Load Google Fonts for signature styles
let fontsLoaded = false;
function loadSignatureFonts() {
  if (fontsLoaded) return;
  fontsLoaded = true;
  const families = SIGNATURE_FONTS.map(f => f.name.replace(/ /g, '+')).join('&family=');
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${families}&display=swap`;
  document.head.appendChild(link);
}

function SignaturePadModal({ onSave, onClose, title = 'Draw Your Signature' }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [mode, setMode] = useState('draw'); // 'draw' or 'type'
  const [typedName, setTypedName] = useState('');
  const [selectedFont, setSelectedFont] = useState(SIGNATURE_FONTS[0].name);

  useEffect(() => { loadSignatureFonts(); }, []);

  useEffect(() => {
    if (mode !== 'draw') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    // Ensure transparent background by clearing instead of filling white
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [mode]);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height)
    };
  };

  const startDraw = (e) => { e.preventDefault(); setIsDrawing(true); setHasDrawn(true); const ctx = canvasRef.current.getContext('2d'); const pos = getPos(e); ctx.beginPath(); ctx.moveTo(pos.x, pos.y); };
  const draw = (e) => { e.preventDefault(); if (!isDrawing) return; const ctx = canvasRef.current.getContext('2d'); const pos = getPos(e); ctx.lineTo(pos.x, pos.y); ctx.stroke(); };
  const stopDraw = (e) => { e?.preventDefault(); setIsDrawing(false); };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  // Convert typed name to canvas image
  const typeToImage = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 460;
    canvas.height = 160;
    const ctx = canvas.getContext('2d');
    // Ensure transparent background
    ctx.clearRect(0, 0, 460, 160);
    ctx.fillStyle = '#1a1a2e';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // Scale font size based on name length
    const fontSize = Math.min(52, Math.max(28, 380 / Math.max(typedName.length, 1)));
    ctx.font = `${fontSize}px '${selectedFont}', cursive`;
    ctx.fillText(typedName, 230, 85);
    return canvas.toDataURL('image/png');
  };

  const handleSave = () => {
    if (mode === 'draw') {
      if (!hasDrawn) return;
      onSave(canvasRef.current.toDataURL('image/png'));
    } else {
      if (!typedName.trim()) return;
      onSave(typeToImage());
    }
  };

  const canSave = mode === 'draw' ? hasDrawn : typedName.trim().length > 0;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 99999,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }} onClick={onClose}>
      <div style={{
        backgroundColor: 'white', borderRadius: '16px', padding: '28px',
        width: '520px', maxWidth: '95vw', boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }} onClick={e => e.stopPropagation()}>
        <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', color: '#1f2937' }}>{title}</h3>
        <p style={{ margin: '0 0 14px 0', fontSize: '13px', color: '#6b7280' }}>
          Choose how you'd like to sign
        </p>

        {/* Mode tabs */}
        <div style={{ display: 'flex', gap: '0', marginBottom: '16px', borderBottom: '2px solid #e5e7eb' }}>
          {[{ key: 'draw', label: <><FaPencilAlt style={{ marginRight: '5px' }} /> Draw</> }, { key: 'type', label: <><FaKeyboard style={{ marginRight: '5px' }} /> Type</> }].map(tab => (
            <button key={tab.key} onClick={() => { setMode(tab.key); setHasDrawn(false); setTypedName(''); }}
              style={{
                flex: 1, padding: '10px 0', border: 'none', cursor: 'pointer',
                fontSize: '14px', fontWeight: 600, borderRadius: '8px 8px 0 0',
                background: mode === tab.key ? '#f0fdf4' : 'transparent',
                color: mode === tab.key ? '#038a77' : '#6b7280',
                borderBottom: mode === tab.key ? '3px solid #038a77' : '3px solid transparent',
                transition: 'all 0.2s'
              }}
            >{tab.label}</button>
          ))}
        </div>

        {/* DRAW MODE */}
        {mode === 'draw' && (
          <>
            <canvas
              ref={canvasRef}
              width={460} height={160}
              style={{
                border: '2px solid #e5e7eb', borderRadius: '8px',
                cursor: 'crosshair', width: '100%', touchAction: 'none',
                backgroundColor: '#fafafa'
              }}
              onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
              onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw}
            />
            <div style={{ textAlign: 'right', marginTop: '6px' }}>
              <button onClick={clearCanvas} style={{
                padding: '5px 14px', border: '1px solid #d1d5db', borderRadius: '6px',
                background: 'white', cursor: 'pointer', fontSize: '12px', color: '#6b7280'
              }}>Clear</button>
            </div>
          </>
        )}

        {/* TYPE MODE */}
        {mode === 'type' && (
          <>
            <input
              type="text"
              value={typedName}
              onChange={e => setTypedName(e.target.value)}
              placeholder="Type your full name here..."
              autoFocus
              style={{
                width: '100%', padding: '12px 16px', fontSize: '16px',
                border: '2px solid #e5e7eb', borderRadius: '10px',
                outline: 'none', boxSizing: 'border-box',
                marginBottom: '14px', transition: 'border-color 0.2s'
              }}
              onFocus={e => e.target.style.borderColor = '#038a77'}
              onBlur={e => e.target.style.borderColor = '#e5e7eb'}
            />

            {/* Signature preview */}
            {typedName && (
              <div style={{
                background: '#fafafa', border: '2px solid #e5e7eb', borderRadius: '10px',
                padding: '14px', marginBottom: '10px', textAlign: 'center',
                minHeight: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <span style={{
                  fontFamily: `'${selectedFont}', cursive`,
                  fontSize: Math.min(42, Math.max(24, 340 / Math.max(typedName.length, 1))),
                  color: '#1a1a2e', letterSpacing: '1px'
                }}>
                  {typedName}
                </span>
              </div>
            )}

            {/* Font style selection */}
            <p style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Select signature style
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
              {SIGNATURE_FONTS.map(font => (
                <button
                  key={font.name}
                  onClick={() => setSelectedFont(font.name)}
                  style={{
                    padding: '10px 4px', border: selectedFont === font.name ? '2px solid #038a77' : '2px solid #e5e7eb',
                    borderRadius: '8px', cursor: 'pointer', background: selectedFont === font.name ? '#f0fdf4' : 'white',
                    transition: 'all 0.15s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px'
                  }}
                >
                  <span style={{
                    fontFamily: `'${font.name}', cursive`,
                    fontSize: typedName ? Math.min(18, Math.max(12, 100 / Math.max(typedName.length, 1))) : 18,
                    color: '#1a1a2e', whiteSpace: 'nowrap', overflow: 'hidden', maxWidth: '100%'
                  }}>
                    {typedName || 'Signature'}
                  </span>
                  <span style={{ fontSize: '9px', color: '#9ca3af', fontWeight: 500 }}>{font.label}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '16px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{
            padding: '10px 20px', border: '2px solid #e5e7eb', borderRadius: '8px',
            background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '13px'
          }}>Cancel</button>
          <button onClick={handleSave} disabled={!canSave} style={{
            padding: '10px 24px', border: 'none', borderRadius: '8px',
            background: canSave ? '#038a77' : '#d1d5db', color: 'white',
            cursor: canSave ? 'pointer' : 'not-allowed', fontWeight: 700, fontSize: '13px',
            transition: 'background 0.2s'
          }}>Apply Signature</button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function PublicDocuSignSigning() {
  const { signingToken } = useParams();
  
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

  const [step, setStep] = useState('loading');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Document data
  const [documentId, setDocumentId] = useState(null);
  const [documentName, setDocumentName] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');

  // Pre-placed fields from admin (with values to fill)
  const [fields, setFields] = useState([]);
  const [activeFieldId, setActiveFieldId] = useState(null);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [signaturePadFieldId, setSignaturePadFieldId] = useState(null);

  // Signer info
  const [signerData, setSignerData] = useState({ name: '', title: '', email: '' });

  // Share dialog
  const [shareData, setShareData] = useState({
    email: '', subject: 'Here is your signed document',
    message: 'Please find the signed document attached.'
  });

  // Drop zone ref for field positioning
  const dropZoneRef = useRef(null);

  // ============================================
  // LOAD DOCUMENT + PRE-PLACED FIELDS
  // ============================================
  useEffect(() => {
    const loadDocument = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${BASE_URL}/api/msa/documents/signing/${signingToken}`
        );

        const { documentId, fileName, fileUrl, recipientEmail, recipientName, fields: serverFields, envelopeId } = response.data.data;

        setDocumentId(documentId);
        setDocumentName(fileName);
        const directFileUrl = fileUrl.startsWith('http') ? fileUrl : `${BASE_URL}${fileUrl}`;
        
        try {
          const fileRes = await axios.get(directFileUrl, { responseType: 'blob' });
          const blobUrl = URL.createObjectURL(fileRes.data);
          setDocumentUrl(blobUrl);
        } catch (fetchErr) {
          console.error("Failed to fetch blob for iframe. Falling back to direct URL:", fetchErr);
          setDocumentUrl(directFileUrl);
        }

        if (recipientEmail) {
          setSignerData({ name: recipientName || '', title: '', email: recipientEmail });
        }

        // Load pre-placed fields from admin and add 'value' property
        if (serverFields && serverFields.length > 0) {
          const fieldsWithValues = serverFields.map(f => ({ 
            ...f, 
            value: (f.type === 'annotation' || f.isAnnotation) ? (f.value || f.text || '') : '' 
          }));
          setFields(fieldsWithValues);
        }

        // Check if already signed
        const docStatus = response.data.data.status;
        if (docStatus === 'completed') {
          // Load saved field data for completed documents
          setStep('complete');
        } else {
          setStep('signing');
        }
      } catch (err) {
        console.error('❌ Error loading document:', err);
        setLoadError(err.response?.data?.message || 'Failed to load document. The link may be expired.');
        setStep('error');
      } finally {
        setLoading(false);
      }
    };

    if (signingToken) {
      loadDocument();
    } else {
      setLoadError('No signing token provided');
      setStep('error');
      setLoading(false);
    }
  }, [signingToken]);

  // ============================================
  // AUTO-FILL FIELDS
  // ============================================
  const autoFillFields = useCallback(() => {
    setFields(prev => prev.map(f => {
      if (f.type === 'name' && signerData.name && !f.value) return { ...f, value: signerData.name };
      if (f.type === 'email' && signerData.email && !f.value) return { ...f, value: signerData.email };
      if (f.type === 'date' && !f.value) return { ...f, value: new Date().toLocaleDateString() };
      if (f.type === 'title' && signerData.title && !f.value) return { ...f, value: signerData.title };
      return f;
    }));
  }, [signerData]);

  useEffect(() => {
    if (step === 'signing' && fields.length > 0) {
      autoFillFields();
    }
  }, [step, signerData.name, signerData.email, autoFillFields]);

  // ============================================
  // FIELD VALUE HANDLERS
  // ============================================
  const updateFieldValue = (fieldId, value) => {
    setFields(prev => prev.map(f => f.id === fieldId ? { ...f, value } : f));
  };

  const openSignaturePad = (fieldId) => {
    setSignaturePadFieldId(fieldId);
    setShowSignaturePad(true);
  };

  const handleSignatureSave = (dataUrl) => {
    updateFieldValue(signaturePadFieldId, dataUrl);
    setShowSignaturePad(false);
    setSignaturePadFieldId(null);
  };

  // ============================================
  // GENERATE SIGNED PDF CLIENT-SIDE
  // ============================================
  const generateSignedPdfBlob = async () => {
    const { jsPDF } = await import('jspdf');
    const lib = window.pdfjsLib;
    if (!lib) throw new Error('PDF.js not loaded');

    const pdf = await lib.getDocument(documentUrl).promise;
    const numPages = pdf.numPages;
    const renderWidth = 850;

    // Calculate cumulative canvas heights for field positioning
    const pageInfos = [];
    let cumH = 0;
    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const baseVp = page.getViewport({ scale: 1 });
      const scale = renderWidth / baseVp.width;
      const vp = page.getViewport({ scale });
      // Use Math.round to match PdfCanvasViewer.js DOM rendering
      const h = Math.round(vp.height);
      const w = Math.round(vp.width);
      pageInfos.push({ page, vp, width: w, height: h, canvasStart: cumH, canvasEnd: cumH + h });
      cumH += h;
    }

    let jspdf = null;
    for (let i = 0; i < pageInfos.length; i++) {
      const info = pageInfos[i];

      // Render page to offscreen canvas
      const canvas = document.createElement('canvas');
      canvas.width = info.width;
      canvas.height = info.height;
      const ctx = canvas.getContext('2d');
      await info.page.render({ canvasContext: ctx, viewport: info.vp }).promise;

      // Draw fields that belong to this page
      for (const field of fields) {
        if (!field.value) continue;
        if (field.type === 'annotation' || field.isAnnotation) continue; // annotations don't need to be in the signed PDF
        if (field.y < info.canvasStart || field.y >= info.canvasEnd) continue;

        const localY = Math.round(field.y - info.canvasStart);
        const x = Math.round(field.x);
        const w = Math.round(field.width || 180);
        const h = Math.round(field.height || 56);

        if ((field.type === 'signature' || field.type === 'initial') && field.value.startsWith('data:image/')) {
          try {
            const img = new Image();
            await new Promise((resolve, reject) => { 
              img.onload = resolve; 
              img.onerror = reject; 
              img.src = field.value; 
            });
            ctx.drawImage(img, x, localY, w, h);
          } catch (e) { console.warn('Could not draw sig image:', e); }
        } else if (field.value && !field.value.startsWith('data:')) {
          ctx.font = `${Math.min(14, h * 0.5)}px sans-serif`;
          ctx.fillStyle = field.color || '#1f2937';
          ctx.fillText(String(field.value), x + 3, localY + h * 0.6);
        }
      }

      // Draw annotation fields too
      for (const field of fields) {
        if (!field.value) continue;
        if (field.type !== 'annotation' && !field.isAnnotation) continue;
        if (field.y < info.canvasStart || field.y >= info.canvasEnd) continue;
        const localY = Math.round(field.y - info.canvasStart);
        const x = Math.round(field.x);
        ctx.font = `bold ${field.fontSize || 14}px sans-serif`;
        ctx.fillStyle = field.color || '#1f2937';
        ctx.fillText(String(field.value), x + 3, localY + 14);
      }

      // Add signer info on last page
      if (i === pageInfos.length - 1 && signerData.name) {
        ctx.font = '9px sans-serif';
        ctx.fillStyle = '#888';
        ctx.fillText(`Digitally signed by: ${signerData.name} | ${new Date().toLocaleDateString()}`, 50, info.height - 10);
      }

      // Add canvas as page to jsPDF
      const imgData = canvas.toDataURL('image/jpeg', 0.92);
      if (!jspdf) {
        jspdf = new jsPDF({
          orientation: info.width > info.height ? 'landscape' : 'portrait',
          unit: 'px',
          format: [info.width, info.height],
          hotfixes: ['px_scaling']
        });
      } else {
        jspdf.addPage([info.width, info.height], info.width > info.height ? 'landscape' : 'portrait');
      }
      jspdf.addImage(imgData, 'JPEG', 0, 0, info.width, info.height);
    }

    // Return as base64
    return jspdf.output('datauristring').split(',')[1]; // base64 only
  };

  // ============================================
  // FINISH SIGNING
  // ============================================
  const handleFinishSigning = async () => {
    if (!signerData.name || !signerData.email) {
      setError('Please enter your name and email'); return;
    }

    const fillableFields = fields.filter(f => f.type !== 'annotation' && !f.isAnnotation);
    const requiredFields = fillableFields.filter(f => ['signature', 'initial'].includes(f.type));
    const unfilledSigs = requiredFields.filter(f => !f.value);
    if (unfilledSigs.length > 0) {
      setError(`Please complete all signature fields (${unfilledSigs.length} remaining)`);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Generate the signed PDF in the browser
      console.log('🔧 Generating signed PDF in browser...');
      let signedPdfBase64 = null;
      try {
        signedPdfBase64 = await generateSignedPdfBlob();
        console.log('✅ Signed PDF generated, size:', Math.round((signedPdfBase64.length * 3/4) / 1024), 'KB');
      } catch (pdfErr) {
        console.warn('⚠️ Could not generate signed PDF:', pdfErr);
        // Continue without it — backend will use fallback
      }

      await axios.post(`${BASE_URL}/api/msa/docusign/confirm-signature`, {
        signingToken,
        fields,
        signerName: signerData.name,
        signerTitle: signerData.title,
        signerEmail: signerData.email,
        documentId,
        signedPdfBase64
      });

      setSuccess('Document signed successfully!');
      setStep('share');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save signature');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // SHARE DOCUMENT
  // ============================================
  const handleShareDocument = async () => {
    if (!shareData.email) { setError('Please enter an email address'); return; }
    try {
      setLoading(true);
      await axios.post(`${BASE_URL}/api/msa/docusign/share-signed-document`, {
        signingToken, recipientEmail: shareData.email,
        subject: shareData.subject, message: shareData.message, documentId
      });
      Swal.fire({ title: 'Sent!', text: `Document sent to ${shareData.email}`, icon: 'success' })
        .then(() => setStep('complete'));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to share');
    } finally { setLoading(false); }
  };

  // ============================================
  // RENDER: LOADING
  // ============================================
  if (step === 'loading') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#f0f2f5', flexDirection: 'column' }}>
        <Loader size={48} color="#038a77" style={{ animation: 'spin 1.5s linear infinite' }} />
        <h2 style={{ marginTop: '20px', color: '#038a77' }}>Loading Document...</h2>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ============================================
  // RENDER: ERROR
  // ============================================
  if (step === 'error') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#f9fafb' }}>
        <div style={{ textAlign: 'center', padding: '40px', backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', maxWidth: '500px' }}>
          <div style={{ fontSize: '64px', marginBottom: '20px', color: '#dc2626' }}><FaExclamationTriangle /></div>
          <h2 style={{ color: '#dc2626', marginTop: 0 }}>Error Loading Document</h2>
          <p style={{ color: '#6b7280' }}>{loadError}</p>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER: SIGNING INTERFACE
  // ============================================
  if (step === 'signing') {
    const fillableFields = fields.filter(f => f.type !== 'annotation' && !f.isAnnotation);
    const completedCount = fillableFields.filter(f => !!f.value).length;
    const totalRequired = fillableFields.length;
    const allDone = completedCount === totalRequired && signerData.name && signerData.email;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f0f2f5' }}>
        {showSignaturePad && (
          <SignaturePadModal
            title={fields.find(f => f.id === signaturePadFieldId)?.type === 'initial' ? 'Draw Your Initials' : 'Draw Your Signature'}
            onSave={handleSignatureSave}
            onClose={() => setShowSignaturePad(false)}
          />
        )}

        {/* TOP BAR */}
        <div style={{
          background: 'linear-gradient(135deg, #038a77 0%, #026b5e 100%)',
          color: 'white', padding: '12px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: '0 2px 10px rgba(0,0,0,0.15)'
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '16px' }}><FaFileAlt style={{ marginRight: '8px' }} /> {documentName}</div>
            <div style={{ fontSize: '12px', opacity: 0.85 }}>Please review and sign this document</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ fontSize: '13px', opacity: 0.9 }}>
              {completedCount}/{totalRequired} fields completed
            </span>
            <button onClick={handleFinishSigning} disabled={!allDone || loading} style={{
              padding: '10px 28px', border: 'none', borderRadius: '8px',
              background: allDone ? '#ffffff' : 'rgba(255,255,255,0.3)',
              color: allDone ? '#038a77' : 'rgba(255,255,255,0.6)',
              fontWeight: 700, fontSize: '14px',
              cursor: allDone ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', gap: '8px',
              transition: 'all 0.2s'
            }}>
              {loading ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={16} />}
              Finish Signing
            </button>
          </div>
        </div>

        {/* MESSAGES */}
        {error && (
          <div style={{ padding: '10px 24px', background: '#fef2f2', borderBottom: '1px solid #fecaca', color: '#991b1b', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span><FaExclamationTriangle style={{ marginRight: '5px' }} /> {error}</span>
            <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#991b1b' }}><X size={14} /></button>
          </div>
        )}

        {/* MAIN LAYOUT */}
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', flex: 1, overflow: 'hidden' }}>

          {/* LEFT PANEL - SIGNER INFO + FIELD STATUS */}
          <div style={{ backgroundColor: 'white', borderRight: '1px solid #e5e7eb', overflowY: 'auto', padding: '20px' }}>

            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#9ca3af', marginBottom: '12px' }}>
              YOUR INFORMATION
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>Name *</label>
              <input type="text" placeholder="Full Name" value={signerData.name}
                onChange={e => setSignerData({ ...signerData, name: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', border: '2px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>Title</label>
              <input type="text" placeholder="Job Title" value={signerData.title}
                onChange={e => setSignerData({ ...signerData, title: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', border: '2px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>Email *</label>
              <input type="email" placeholder="Email" value={signerData.email}
                onChange={e => setSignerData({ ...signerData, email: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', border: '2px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#9ca3af' }}>
                  REQUIRED FIELDS
                </span>
                <span style={{
                  fontSize: '11px', fontWeight: 700, borderRadius: '10px', padding: '2px 8px',
                  background: allDone ? '#dcfce7' : '#fef3c7', color: allDone ? '#166534' : '#92400e'
                }}>
                  {completedCount}/{totalRequired}
                </span>
              </div>

              {fillableFields.map(field => (
                <div key={field.id} onClick={() => setActiveFieldId(field.id)} style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '8px 10px', marginBottom: '4px', borderRadius: '6px',
                  background: activeFieldId === field.id ? '#f0fdf4' : (field.value ? '#f9fafb' : '#fffbeb'),
                  border: `1px solid ${activeFieldId === field.id ? '#038a77' : (field.value ? '#e5e7eb' : '#fcd34d')}`,
                  cursor: 'pointer', transition: 'all 0.15s'
                }}>
                  <span style={{ fontSize: '14px', display: 'flex', alignItems: 'center' }}>{field.value ? <FaCheckCircle color="green" /> : <FaSquare color="lightgray" />}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#1f2937' }}>{field.label || field.type}</div>
                    <div style={{ fontSize: '10px', color: field.value ? '#059669' : '#d97706' }}>
                      {field.value ? (field.type === 'signature' || field.type === 'initial' ? 'Signed ✓' : 'Filled ✓') : 'Required'}
                    </div>
                  </div>
                </div>
              ))}

              {fields.length === 0 && (
                <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af', fontSize: '13px' }}>
                  No fields were placed on this document. You can finish signing directly.
                </div>
              )}
            </div>
          </div>

          {/* RIGHT PANEL - DOCUMENT WITH FIELDS */}
          <div style={{ backgroundColor: '#525659', overflow: 'auto' }}>
            <div style={{ padding: '24px', display: 'flex', justifyContent: 'center', minHeight: '100%' }}>
              <div ref={dropZoneRef} style={{
                position: 'relative', width: 850,
                background: 'white', boxShadow: '0 4px 24px rgba(0,0,0,0.35)', flexShrink: 0
              }}>
                {/* PDF rendered as canvas - no z-index issues, fields sit ON TOP */}
                {documentName.toLowerCase().endsWith('.pdf')
                  ? <PdfCanvasViewer url={documentUrl} width={850} />
                  : <iframe 
                      src={documentUrl || ''} 
                      style={{ width: '100%', height: 1100, border: 'none', display: 'block' }} 
                      title="Document" 
                        onLoad={(e) => {
                          try {
                            const iframe = e.target;
                            const iframeDoc = iframe.contentWindow.document;
                            
                            iframeDoc.documentElement.style.overflow = 'hidden';
                            if (iframeDoc.body) iframeDoc.body.style.overflow = 'hidden';

                            let lastHeight = 0;
                            const updateHeight = () => {
                              if (!iframeDoc.documentElement && !iframeDoc.body) return;
                              const docEl = iframeDoc.documentElement || {};
                              const body = iframeDoc.body || {};
                              const scrollHeight = Math.max(docEl.scrollHeight || 0, body.scrollHeight || 0);
                              const newHeight = scrollHeight > 1100 ? scrollHeight + 50 : 1100;
                              if (newHeight !== lastHeight) {
                                iframe.style.height = newHeight + 'px';
                                lastHeight = newHeight;
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
                              
                              // Cleanup when iframe is removed
                              const cleanup = () => {
                                try { observer.disconnect(); } catch(e) {}
                              };
                              e.target.addEventListener('unload', cleanup);
                              window.addEventListener('beforeunload', cleanup);
                            }
                          } catch (err) {
                            console.warn("Could not auto-resize iframe: ", err);
                          }
                        }}
                    />
                }

                {/* Field overlays - positioned exactly where admin placed them */}
                {fields.map(field => {
                  // Annotations are read-only text from admin's edit step
                  if (field.type === 'annotation' || field.isAnnotation) {
                    return (
                      <div key={field.id} style={{
                        position: 'absolute', left: field.x, top: field.y, zIndex: 9999,
                        fontSize: field.fontSize || 14, color: field.color || '#1f2937',
                        fontWeight: 600, pointerEvents: 'none',
                        padding: '2px 6px', whiteSpace: 'nowrap'
                      }}>
                        {field.value || field.text}
                      </div>
                    );
                  }

                  const isSigType = field.type === 'signature' || field.type === 'initial';
                  const isFilled = !!field.value;
                  const isActive = activeFieldId === field.id;
                  const fieldColor = field.color || '#6366f1';

                  return (
                    <div key={field.id} onClick={() => {
                      setActiveFieldId(field.id);
                      if (isSigType && !isFilled) openSignaturePad(field.id);
                    }} style={{
                      position: 'absolute',
                      left: field.x, top: field.y,
                      width: field.width || (isSigType ? 180 : 140),
                      height: field.height || (isSigType ? 56 : 36),
                      zIndex: 9999,
                      backgroundColor: isFilled
                        ? 'rgba(16,185,129,0.08)'
                        : isActive ? 'rgba(99,102,241,0.15)' : 'rgba(251,191,36,0.12)',
                      border: `2px ${isFilled ? 'solid' : 'dashed'} ${isFilled ? '#10b981' : (isActive ? fieldColor : '#f59e0b')}`,
                      borderRadius: 6, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: '2px 6px', overflow: 'hidden',
                      boxShadow: isActive ? `0 0 0 3px ${fieldColor}33, 0 2px 8px rgba(0,0,0,0.15)` : '0 1px 4px rgba(0,0,0,0.08)',
                      transition: 'all 0.2s',
                      animation: !isFilled ? 'pulse-border 2s infinite' : 'none'
                    }}>
                      {/* Signature fields */}
                      {isSigType && !isFilled && (
                        <div style={{ textAlign: 'center', color: '#f59e0b', fontWeight: 700, fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <FaPencilAlt style={{ marginRight: '5px' }} /> Click to {field.type === 'initial' ? 'Initial' : 'Sign'}
                        </div>
                      )}
                      {isSigType && isFilled && (
                        <img src={field.value} alt="Signature" style={{
                          maxWidth: '100%', maxHeight: '100%', objectFit: 'contain'
                        }} />
                      )}

                      {/* Text-based fields */}
                      {!isSigType && (
                        <input
                          type="text"
                          value={field.value || ''}
                          onChange={e => updateFieldValue(field.id, e.target.value)}
                          onFocus={() => setActiveFieldId(field.id)}
                          placeholder={field.label || field.type}
                          style={{
                            width: '100%', height: '100%', border: 'none', background: 'transparent',
                            fontSize: '12px', fontWeight: 600, color: '#1f2937',
                            textAlign: 'center', outline: 'none', padding: '0 4px'
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes pulse-border {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
        `}</style>
      </div>
    );
  }

  // ============================================
  // RENDER: SHARE DIALOG
  // ============================================
  if (step === 'share') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, #038a77, #026b5e)' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '40px', maxWidth: '500px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
          <div style={{ textAlign: 'center', marginBottom: '25px' }}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}><FaCheckCircle color="green" /></div>
            <h2 style={{ margin: 0, color: '#038a77', fontSize: '22px' }}>Document Signed Successfully!</h2>
            <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '8px' }}>Would you like to share a copy?</p>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>Send copy to email</label>
            <input type="email" placeholder="recipient@example.com" value={shareData.email}
              onChange={e => setShareData({ ...shareData, email: e.target.value })}
              style={{ width: '100%', padding: '10px 12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
            />
          </div>

          {error && <div style={{ color: '#dc2626', fontSize: '13px', marginBottom: '10px' }}>⚠️ {error}</div>}

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button onClick={() => setStep('complete')} style={{
              flex: 1, padding: '12px', border: '2px solid #e5e7eb', borderRadius: '8px',
              background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '14px'
            }}>Skip</button>
            <button onClick={handleShareDocument} disabled={!shareData.email || loading} style={{
              flex: 1, padding: '12px', border: 'none', borderRadius: '8px',
              background: shareData.email ? '#038a77' : '#d1d5db', color: 'white',
              cursor: shareData.email ? 'pointer' : 'not-allowed', fontWeight: 700, fontSize: '14px'
            }}>
              {loading ? 'Sending...' : 'Send Copy'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER: COMPLETE
  // ============================================
  if (step === 'complete') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#f0fdf4' }}>
        <div style={{ textAlign: 'center', padding: '40px', backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', maxWidth: '500px' }}>
          <div style={{ fontSize: '64px', marginBottom: '15px' }}><FaCheckCircle color="green" /></div>
          <h2 style={{ marginTop: 0, color: '#10b981', fontSize: '26px' }}>Document Signed!</h2>
          <p style={{ color: '#6b7280', lineHeight: 1.6 }}>
            Your document has been successfully signed and recorded.
          </p>
          <div style={{ backgroundColor: '#f0fdf4', padding: '15px', borderRadius: '8px', margin: '20px 0', fontSize: '14px', color: '#065f46', textAlign: 'left' }}>
            <strong>Signer:</strong> {signerData.name}<br />
            <strong>Email:</strong> {signerData.email}<br />
            <strong>Signed on:</strong> {new Date().toLocaleDateString()}
          </div>
          <button onClick={() => window.close()} style={{
            padding: '12px 30px', backgroundColor: '#10b981', color: 'white',
            border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '14px'
          }}>Close</button>
        </div>
      </div>
    );
  }

  return null;
}