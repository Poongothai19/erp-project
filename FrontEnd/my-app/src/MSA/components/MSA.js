// src/MSA/components/MSA.js
// COMPLETE UPDATED FRONTEND - Upload Button Redirects to DocuSignSigningPage
// NO UPLOAD FUNCTIONALITY ON THIS PAGE - Upload happens on DocuSignSigningPage
// COPY THIS ENTIRE FILE AND REPLACE YOUR EXISTING MSA.js

import React, { useState, useEffect, useRef } from 'react';
import {
  Search, FileText, Send, CheckCircle, AlertCircle,
  ChevronLeft, ChevronRight, Download, Eye, Loader,
  Shield, Zap, Save, RotateCcw, Printer, FileDown,
  Upload, X, Clock, CheckCheck, 
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify, 
  List, ListOrdered, Type, Strikethrough, ChevronDown, Eraser, Baseline
} from 'lucide-react';
import axios from 'axios';
import Swal from 'sweetalert2';
import BASE_URL from "../../url";
import '../styles/MSA.css';
import DocuSignSigningPage from './DocuSignSigningPage';
import { FaFileAlt, FaPencilAlt, FaSave, FaTimes, FaExclamationTriangle, FaInfoCircle, FaClipboardList, FaSearch, FaUpload } from 'react-icons/fa';

// ============================================
// START DOCUMENT VIEWER COMPONENT (UNCHANGED)
// ============================================
export function StartDocumentViewer({ onBack }) {
  const [document, setDocument] = useState(null);
  const [editedContent, setEditedContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [savedDocumentId, setSavedDocumentId] = useState(null);
  const editableRef = useRef(null);

  useEffect(() => {
    fetchStartDocument();
  }, []);

  const fetchStartDocument = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BASE_URL}/api/msa/documents/start`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setDocument(response.data.data);
      setEditedContent(response.data.data.content);
      setOriginalContent(response.data.data.content);
    } catch (error) {
      console.error('❌ Error fetching start document:', error);
      setError('Failed to load START document');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleDocumentChange = (e) => {
    const newContent = editableRef.current?.innerHTML || '';
    setEditedContent(newContent);
    setHasChanges(newContent !== originalContent);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const newContent = editableRef.current?.innerHTML || editedContent;
      
      const response = await axios.post(
        `${BASE_URL}/api/msa/documents/start/save`,
        {
          content: newContent,
          title: 'MSA Workflow Document'
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      setSavedDocumentId(response.data.data.documentId);
      setEditedContent(newContent);
      setOriginalContent(newContent);
      setHasChanges(false);
      setIsEditing(false);
      setSuccess('Document saved successfully!');
      
      Swal.fire({
        title: 'Success!',
        text: 'Document has been saved successfully',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('❌ Error saving:', error);
      setError('Failed to save document');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditedContent(originalContent);
    if (editableRef.current) {
      editableRef.current.innerHTML = originalContent;
    }
    setIsEditing(false);
    setHasChanges(false);
  };

  const handleDownloadHTML = () => {
    const content = isEditing ? editableRef.current?.innerHTML : editedContent;
    const blob = new Blob([content], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `MSA-Workflow-${new Date().toISOString().split('T')[0]}.html`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    setSuccess('HTML downloaded successfully!');
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleDownloadPDF = async () => {
    try {
      setLoading(true);
      
      if (savedDocumentId) {
        const response = await axios.get(
          `${BASE_URL}/api/msa/documents/${savedDocumentId}/pdf`,
          {
            responseType: 'blob',
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          }
        );
        
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `MSA-Workflow-${new Date().toISOString().split('T')[0]}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        Swal.fire({
          title: 'PDF Generation',
          text: 'Please save the document first to generate PDF',
          icon: 'info',
          confirmButtonText: 'OK'
        });
      }
      
      setSuccess('Download started!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('❌ Error downloading PDF:', error);
      setError('Failed to download PDF');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>MSA Workflow Document</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          ${isEditing ? editableRef.current?.innerHTML : editedContent}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  if (loading && !document) {
    return (
      <div className="msa-container">
        <div className="msa-loading">
          <Loader className="spin" size={48} />
          <p>Loading START document...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="msa-container">
      <div className="msa-header">
        <button onClick={onBack} className="msa-back-btn">
          <ChevronLeft /> Back to MSA
        </button>
        <div style={{ flex: 1 }}>
          <h1><FaFileAlt style={{ marginRight: '8px' }} /> MSA Workflow Document</h1>
          <p>View and edit the complete MSA workflow process</p>
        </div>
      </div>

      {error && <div className="msa-error">{error}</div>}
      {success && <div className="msa-success">{success}</div>}

      <div className="msa-edit-toolbar">
        <div className="msa-toolbar-left">
          {!isEditing ? (
            <button onClick={handleEdit} className="msa-toolbar-btn">
              <FaPencilAlt style={{ marginRight: '5px' }} /> Edit Document
            </button>
          ) : (
            <>
              <button 
                onClick={handleSave} 
                className="msa-toolbar-btn msa-btn-save"
                disabled={!hasChanges || loading}
              >
                {loading ? <Loader className="spin" size={16} /> : <><FaSave style={{ marginRight: '5px' }} /> Save Changes</>}
              </button>
              <button onClick={handleCancel} className="msa-toolbar-btn">
                <FaTimes style={{ marginRight: '5px' }} /> Cancel
              </button>
            </>
          )}
        </div>
        
        <div className="msa-toolbar-right">
          <button onClick={handleDownloadHTML} className="msa-toolbar-btn" title="Download as HTML">
            <FileDown size={16} /> HTML
          </button>
          <button onClick={handleDownloadPDF} className="msa-toolbar-btn" title="Download as PDF" disabled={loading}>
            {loading ? <Loader className="spin" size={16} /> : <Printer size={16} />} PDF
          </button>
          <button onClick={handlePrint} className="msa-toolbar-btn" title="Print">
            <Printer size={16} /> Print
          </button>
        </div>
      </div>

      <div className="msa-document-wrapper">
        {isEditing ? (
          <div
            ref={editableRef}
            className="msa-document-editable"
            contentEditable={true}
            suppressContentEditableWarning={true}
            onInput={handleDocumentChange}
            dangerouslySetInnerHTML={{ __html: editedContent }}
          />
        ) : (
          <div
            className="msa-html-preview"
            dangerouslySetInnerHTML={{ __html: editedContent }}
          />
        )}
      </div>

      {hasChanges && (
        <div className="msa-warning" style={{ marginTop: '20px' }}>
          <FaExclamationTriangle style={{ marginRight: '5px' }} /> You have unsaved changes. Click "Save Changes" to save your edits.
        </div>
      )}

      <div className="msa-info-box">
        <strong><FaInfoCircle style={{ marginRight: '5px' }} /> Document Information:</strong>
        <ul>
          <li>This document represents the complete MSA workflow process</li>
          <li>Click "Edit Document" to make changes to the content</li>
          <li>Save your changes before downloading as PDF</li>
          <li>You can also download as HTML or print directly</li>
        </ul>
      </div>
    </div>
  );
}

// ============================================
// MAIN MSA COMPONENT WITH DOCUSIGN
// ============================================
export default function MSA() {
  const [view, setView] = useState('main');
  const [currentMode, setCurrentMode] = useState(null);
  const [currentStep, setCurrentStep] = useState('modeSelect');
  
  const [yourCompany, setYourCompany] = useState(null);
  const [allParties, setAllParties] = useState([]);
  const [filteredParties, setFilteredParties] = useState([]);
  const [selectedParty, setSelectedParty] = useState(null);
  const [partySearch, setPartySearch] = useState('');
  const [loadingParties, setLoadingParties] = useState(false);
  
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  
  const [generatedDocument, setGeneratedDocument] = useState(null);
  const [documentContent, setDocumentContent] = useState(null);
  const [originalDocument, setOriginalDocument] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const editableRef = useRef(null);
  const [loadingGenerate, setLoadingGenerate] = useState(false);
  
  // ✅ NEW STATE TO SHOW DOCUSIGN PAGE
  const [showDocuSignPage, setShowDocuSignPage] = useState(false);
  
  const [signatureMethod, setSignatureMethod] = useState('DOCUSIGN');
  const [canvasRef, setCanvasRef] = useState(useRef(null));
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureCanvas, setSignatureCanvas] = useState(null);
  const [signerData, setSignerData] = useState({
    name: '',
    title: '',
    email: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (view === 'main') {
      fetchYourCompany();
    }
  }, [view]);

  const fetchYourCompany = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/msa/company/me`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setYourCompany(response.data.data);
    } catch (error) {
      console.error('❌ Error fetching company:', error);
      setError('Failed to fetch company details');
    }
  };

  useEffect(() => {
    if (currentMode && currentStep === 'partyLookup') {
      fetchAllParties();
      fetchTemplates();
    }
  }, [currentMode, currentStep]);

  const fetchAllParties = async () => {
    try {
      setLoadingParties(true);
      const response = await axios.get(`${BASE_URL}/api/msa/parties/all`, {
        params: { mode: currentMode },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setAllParties(response.data.data || []);
      setFilteredParties(response.data.data || []);
    } catch (error) {
      console.error('❌ Error fetching parties:', error);
      setError('Failed to load parties');
    } finally {
      setLoadingParties(false);
    }
  };

  const searchParty = (query) => {
    setPartySearch(query);
    if (query.length === 0) {
      setFilteredParties(allParties);
    } else {
      const filtered = allParties.filter(party =>
        (party.companyName || party.name || '').toLowerCase().includes(query.toLowerCase()) ||
        (party.email || '').toLowerCase().includes(query.toLowerCase()) ||
        (party.id || '').toString().includes(query)
      );
      setFilteredParties(filtered);
    }
  };

  const selectParty = (party) => {
    setSelectedParty(party);
    setPartySearch('');
  };

  const fetchTemplates = async () => {
    try {
      setLoadingTemplates(true);
      setError(null);
      
      // 1. Fetch templates for the current mode (SUPPLIER or CLIENT)
      const response = await axios.get(`${BASE_URL}/api/msa/templates`, {
        params: { mode: currentMode },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      let fetchedTemplates = response.data.data || [];

      // 2. ✅ DYNAMIC FALLBACK: If no templates exist for the current mode (often true for SUPPLIER),
      // search for ANY 'Generic' template across all modes to use as a functional base.
      // This ensures SUPPLIER mode has the same "Generic MSA" functionality as CLIENT mode.
      if (fetchedTemplates.length === 0 || !fetchedTemplates.some(t => t.TemplateName.includes('Generic'))) {
        const allRes = await axios.get(`${BASE_URL}/api/msa/templates`, {
          params: { mode: 'all' },
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        
        const allTemplates = allRes.data.data || [];
        // Find a template with 'Generic' in the name (usually 'Generic Client MSA' with ID 1)
        const genericBase = allTemplates.find(t => t.TemplateName.includes('Generic'));
        
        if (genericBase && !fetchedTemplates.some(t => t.Id === genericBase.Id)) {
          fetchedTemplates.push({
            ...genericBase,
            TemplateName: `Generic ${currentMode} MSA`, // Display as 'Generic SUPPLIER MSA'
            ServiceType: genericBase.ServiceType || 'General',
            Version: genericBase.Version || '1.0'
          });
        }
      }
      
      setTemplates(fetchedTemplates);
    } catch (error) {
      console.error('❌ Error fetching templates:', error);
      setError('Failed to fetch templates');
    } finally {
      setLoadingTemplates(false);
    }
  };

  const generateMSA = async () => {
    if (!selectedTemplate || !selectedParty) {
      setError('Please select template and party');
      return;
    }

    try {
      setLoadingGenerate(true);
      setError(null);
      
      const response = await axios.post(
        `${BASE_URL}/api/msa/documents/generate`,
        {
          templateId: selectedTemplate.Id,
          mode: currentMode,
          partyId: selectedParty.id,
          effectiveDate: new Date().toISOString().split('T')[0],
          termLength: '3',
          renewalTerm: '1'
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      setGeneratedDocument(response.data.data);
      setDocumentContent(response.data.data.content);
      setOriginalDocument(response.data.data.content);
      setHasChanges(false);
      setSuccess('MSA generated successfully! You can now edit the document.');
      setCurrentStep('preview');
    } catch (error) {
      console.error('❌ Error generating document:', error);
      setError(error.response?.data?.message || 'Failed to generate document');
    } finally {
      setLoadingGenerate(false);
    }
  };

  const handleDocumentChange = (e) => {
    const newContent = editableRef.current?.innerHTML || '';
    // Intentionally NOT setting documentContent here to prevent cursor jumping!
    setHasChanges(newContent !== originalDocument);
  };

  const formatDoc = (cmd, val) => {
    document.execCommand(cmd, false, val);
    handleDocumentChange();
  };

  const saveDocumentChanges = async () => {
    try {
      setLoading(true);
      
      const editedContent = editableRef.current?.innerHTML || documentContent;

      const response = await axios.post(
        `${BASE_URL}/api/msa/documents/update-content`,
        {
          documentId: generatedDocument.documentId,
          content: editedContent
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      setGeneratedDocument(response.data.data);
      setDocumentContent(editedContent);
      setOriginalDocument(editedContent);
      setHasChanges(false);
      setSuccess('Document changes saved successfully!');
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('❌ Error saving changes:', error);
      setError('Failed to save document changes');
    } finally {
      setLoading(false);
    }
  };

  const resetDocument = () => {
    setDocumentContent(originalDocument);
    if (editableRef.current) {
      editableRef.current.innerHTML = originalDocument;
    }
    setHasChanges(false);
    setSuccess('Document reset to original');
  };

  const downloadDocument = async () => {
    try {
      setLoading(true);
      
      const response = await axios.get(
        `${BASE_URL}/api/msa/documents/${generatedDocument.documentId}/pdf`,
        {
          responseType: 'blob',
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      
      const contentType = response.headers['content-type'] || 'text/html';
      const ext = contentType.includes('html') ? 'html' : 'pdf';
      const url = window.URL.createObjectURL(new Blob([response.data], { type: contentType }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `MSA-${selectedParty?.companyName || 'Document'}-${new Date().toISOString().split('T')[0]}.${ext}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      setSuccess('Document downloaded successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('❌ Error downloading:', error);
      setError('Failed to download document');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCurrentMode(null);
    setCurrentStep('modeSelect');
    setSelectedParty(null);
    setSelectedTemplate(null);
    setGeneratedDocument(null);
    setDocumentContent(null);
    setOriginalDocument(null);
    setSignatureCanvas(null);
    setSignerData({ name: '', title: '', email: '' });
    setError(null);
    setSuccess(null);
    setHasChanges(false);
    setShowDocuSignPage(false);
  };

  const [resetDocumentContent, setResetDocumentContent] = useState(null);
  const [preloadedDocument, setPreloadedDocument] = useState(null);

  // ============================================
  // ✅ REDIRECT TO DOCUSIGNPAGE
  // ============================================
  if (showDocuSignPage) {
    return <DocuSignSigningPage onBack={() => { setShowDocuSignPage(false); setPreloadedDocument(null); }} preloadedDocument={preloadedDocument} />;
  }

  if (view === 'start') {
    return <StartDocumentViewer onBack={() => setView('main')} />;
  }

  if (currentStep === 'modeSelect') {
    return (
      <div className="msa-container">
        <div className="msa-header">
          <h1><FaClipboardList style={{ marginRight: '8px' }} /> MSA Management System</h1>
          <p>Manage Master Services Agreements with Suppliers and Clients</p>
        </div>

        <div className="msa-mode-select">
          <div
            className="msa-mode-card msa-mode-supplier"
            onClick={() => {
              setCurrentMode('SUPPLIER');
              setCurrentStep('partyLookup');
            }}
          >
            <Shield size={48} />
            <h3>SUPPLIER</h3>
            <p>You're buying services/products from a supplier company</p>
            <span className="msa-badge">Prophecy Consulting INC DBA Prophecy Technologies = Supplier</span>
          </div>

          <div
            className="msa-mode-card msa-mode-client"
            onClick={() => {
              setCurrentMode('CLIENT');
              setCurrentStep('partyLookup');
            }}
          >
            <Zap size={48} />
            <h3>CLIENT</h3>
            <p>You're selling services/products to a client company</p>
            <span className="msa-badge">Prophecy Consulting INC DBA Prophecy Technologies = Client</span>
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === 'partyLookup') {
    return (
      <div className="msa-container">
        <div className="msa-header">
          <button onClick={() => setCurrentStep('modeSelect')} className="msa-back-btn">
            <ChevronLeft /> Back
          </button>
          <h1><FaSearch style={{ marginRight: '8px' }} /> Find {currentMode === 'SUPPLIER' ? 'Supplier' : 'Client'}</h1>
        </div>

        {error && <div className="msa-error">{error}</div>}
        {success && <div className="msa-success">{success}</div>}

        <div className="msa-section">
          <h2>Select {currentMode === 'SUPPLIER' ? 'Suppliers' : 'Clients'}</h2>
          
          <div className="msa-search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder={`Search by name, email, or ID...`}
              value={partySearch}
              onChange={(e) => searchParty(e.target.value)}
            />
          </div>

          {selectedParty && (
            <div className="msa-selected-party">
              <CheckCircle size={20} color="green" />
              <div>
                <strong>{selectedParty.companyName || selectedParty.name}</strong>
                <p>{selectedParty.email}</p>
              </div>
              <button onClick={() => setSelectedParty(null)} className="msa-btn-remove">
                Change
              </button>
            </div>
          )}

          {!selectedParty && (
            <>
              {loadingParties ? (
                <div className="msa-loading">
                  <Loader className="spin" size={32} /> Loading parties...
                </div>
              ) : filteredParties.length === 0 ? (
                <div className="msa-empty">
                  <AlertCircle size={48} />
                  <p>No {currentMode === 'SUPPLIER' ? 'suppliers' : 'clients'} found</p>
                </div>
              ) : (
                <div className="msa-search-results">
                  {filteredParties.map((party) => (
                    <div
                      key={party.id}
                      className="msa-search-result"
                      onClick={() => selectParty(party)}
                    >
                      <div>
                        <strong>{party.companyName || party.name}</strong>
                        <p>{party.email}</p>
                        <p style={{ fontSize: '12px', color: '#999' }}>
                          {party.address}, {party.city}, {party.state}
                        </p>
                      </div>
                      <ChevronRight size={18} />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div className="msa-button-group">
          <button onClick={() => setCurrentStep('modeSelect')} className="msa-btn-secondary">
            Back
          </button>
          <button
            onClick={() => setCurrentStep('templateSelect')}
            disabled={!selectedParty}
            className="msa-btn-primary"
          >
            Next <ChevronRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  // ============================================
  // ✅ TEMPLATE SELECT - NO UPLOAD CARD HERE
  // ============================================
  if (currentStep === 'templateSelect') {
    return (
      <div className="msa-container">
        <div className="msa-header">
          <button onClick={() => setCurrentStep('partyLookup')} className="msa-back-btn">
            <ChevronLeft /> Back
          </button>
          <h1><FaFileAlt style={{ marginRight: '8px' }} /> Select Template or Upload Document</h1>
        </div>

        {error && <div className="msa-error">{error}</div>}
        {success && <div className="msa-success">{success}</div>}

        <div className="msa-section">
          <h2>Choose One Option:</h2>
          
          <div className="msa-template-grid" style={{ marginBottom: '40px' }}>
            
            {/* ✅ UPLOAD BUTTON - REDIRECTS TO DOCUSIGNPAGE */}
            <div className="msa-template-card" style={{
              border: '2px dashed #11a56d',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '240px',
              padding: '30px',
              backgroundColor: '#f0fdf4'
            }}>
              <Upload size={48} color="#11a56d" style={{ marginBottom: '20px' }} />
              <h3 style={{ textAlign: 'center', marginBottom: '15px', color: '#11a56d' }}>
                Upload & Sign Document
              </h3>
              <p style={{ textAlign: 'center', marginBottom: '20px', color: '#6b7280', fontSize: '14px' }}>
                Upload your own document<br/>
                PDF, HTML, TXT, DOC, or DOCX
              </p>
              <button
                onClick={() => setShowDocuSignPage(true)}
                className="msa-btn-primary"
                style={{ padding: '10px 20px' }}
              >
                <Upload size={16} color="#fff" /> Click to Upload
              </button>
            </div>

            {/* TEMPLATE CARDS */}
            {loadingTemplates ? (
              <div className="msa-loading" style={{ gridColumn: '1 / -1' }}>
                <Loader className="spin" size={32} /> Loading templates...
              </div>
            ) : templates.length === 0 ? (
              <div className="msa-empty" style={{ gridColumn: '1 / -1' }}>
                <FileText size={48} />
                <p>No templates available for {currentMode} mode</p>
              </div>
            ) : (
              templates.map((template) => (
                <div
                  key={template.Id}
                  className={`msa-template-card ${selectedTemplate?.Id === template.Id ? 'selected' : ''}`}
                  onClick={() => setSelectedTemplate(template)}
                  style={{
                    border: selectedTemplate?.Id === template.Id ? '2px solid #2563eb' : '2px solid #e5e7eb'
                  }}
                >
                  <FileText size={32} />
                  <h3>{template.TemplateName}</h3>
                  <p>{template.ServiceType}</p>
                  <p style={{ fontSize: '12px', color: '#666' }}>v{template.Version}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="msa-button-group">
          <button onClick={() => setCurrentStep('partyLookup')} className="msa-btn-secondary">
            Back
          </button>
          
          <button
            onClick={generateMSA}
            disabled={!selectedTemplate || loadingGenerate}
            className="msa-btn-primary"
          >
            {loadingGenerate ? <Loader className="spin" /> : 'Generate MSA'}
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  if (currentStep === 'preview') {
    return (
      <div className="msa-container msa-edit-container">
        <div className="msa-header">
          <button onClick={() => setCurrentStep('templateSelect')} className="msa-back-btn">
            <ChevronLeft /> Back
          </button>
          <h1><FaPencilAlt style={{ marginRight: '8px' }} /> Edit Document</h1>
          <p>Make any changes you need, then save and send</p>
        </div>

        {error && <div className="msa-error">{error}</div>}
        {success && <div className="msa-success">{success}</div>}

        <div className="msa-edit-toolbar-new">
          <div className="msa-toolbar-section">
            <div className="msa-toolbar-group font-group">
              <select onChange={(e) => formatDoc('fontName', e.target.value)} defaultValue="Calibri" className="msa-font-select">
                <option value="Calibri">Calibri (Body)</option>
                <option value="Arial">Arial</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Georgia">Georgia</option>
                <option value="Verdana">Verdana</option>
              </select>
              <select onChange={(e) => formatDoc('fontSize', e.target.value)} defaultValue="3" className="msa-size-select">
                <option value="1">8</option>
                <option value="2">10</option>
                <option value="3">11</option>
                <option value="4">12</option>
                <option value="5">14</option>
                <option value="6">18</option>
                <option value="7">24</option>
              </select>
            </div>

            <div className="msa-toolbar-group style-group">
              <button onClick={() => formatDoc('bold')} className="toolbar-icon-btn" title="Bold (Ctrl+B)"><Bold size={16} /></button>
              <button onClick={() => formatDoc('italic')} className="toolbar-icon-btn" title="Italic (Ctrl+I)"><Italic size={16} /></button>
              <button onClick={() => formatDoc('underline')} className="toolbar-icon-btn" title="Underline (Ctrl+U)"><Underline size={16} /></button>
              <button onClick={() => formatDoc('strikeThrough')} className="toolbar-icon-btn" title="Strikethrough"><Strikethrough size={16} /></button>
              <div className="toolbar-divider"></div>
              <button onClick={() => formatDoc('removeFormat')} className="toolbar-icon-btn" title="Clear Formatting"><Eraser size={16} /></button>
            </div>

            <div className="msa-toolbar-group paragraph-group">
              <button onClick={() => formatDoc('justifyLeft')} className="toolbar-icon-btn" title="Align Left"><AlignLeft size={16} /></button>
              <button onClick={() => formatDoc('justifyCenter')} className="toolbar-icon-btn" title="Align Center"><AlignCenter size={16} /></button>
              <button onClick={() => formatDoc('justifyRight')} className="toolbar-icon-btn" title="Align Right"><AlignRight size={16} /></button>
              <button onClick={() => formatDoc('justifyFull')} className="toolbar-icon-btn" title="Justify"><AlignJustify size={16} /></button>
              <div className="toolbar-divider"></div>
              <button onClick={() => formatDoc('insertUnorderedList')} className="toolbar-icon-btn" title="Bullets"><List size={16} /></button>
              <button onClick={() => formatDoc('insertOrderedList')} className="toolbar-icon-btn" title="Numbering"><ListOrdered size={16} /></button>
            </div>
          </div>
          
          <div className="msa-toolbar-right-actions">
            {hasChanges && <span className="msa-unsaved-badge">Unsaved Changes</span>}
            <button
              onClick={saveDocumentChanges}
              disabled={!hasChanges || loading}
              className="msa-btn-save-modern"
            >
              <Save size={18} /> {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        <div className="msa-document-wrapper">
          <div
            ref={editableRef}
            className="msa-document-editable"
            contentEditable={true}
            suppressContentEditableWarning={true}
            onInput={handleDocumentChange}
            dangerouslySetInnerHTML={{ __html: documentContent }}
          />
        </div>

        <div className="msa-button-group">
          <button
            onClick={() => setCurrentStep('templateSelect')}
            className="msa-btn-secondary"
          >
            Back
          </button>
          <button
            onClick={async () => {
              try {
                setLoading(true);
                // First save content as an uploaded document so DocuSignSigningPage has an ID
                const finalContent = editableRef.current?.innerHTML || documentContent;
                const contentBlob = new Blob([finalContent], { type: 'text/html' });
                const formData = new FormData();
                const fileName = `MSA-${selectedParty?.companyName || 'Document'}.html`;
                formData.append('file', contentBlob, fileName);
                formData.append('fileName', fileName);

                const uploadRes = await axios.post(
                  `${BASE_URL}/api/msa/documents/upload`,
                  formData,
                  {
                    headers: {
                      'Content-Type': 'multipart/form-data',
                      Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                  }
                );

                const uploadedDocId = uploadRes.data.data.documentId;
                
                // Set the preloaded document for DocuSignSigningPage
                setPreloadedDocument({
                  id: uploadedDocId,
                  name: fileName,
                  content: finalContent,
                  party: selectedParty
                });
                
                setShowDocuSignPage(true);
              } catch (err) {
                console.error('Error preparing document for signing:', err);
                setError('Failed to prepare document for signing');
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            className="msa-btn-primary"
            title="Proceed to sign the document"
          >
            {loading ? <Loader className="spin" /> : 'Continue to Sign'} <ChevronRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  if (currentStep === 'signature') {
    return (
      <div className="msa-container">
        <div className="msa-header">
          <button onClick={() => setCurrentStep('preview')} className="msa-back-btn">
            <ChevronLeft /> Back
          </button>
          <h1>✍️ Sign Document</h1>
        </div>

        {error && <div className="msa-error">{error}</div>}
        {success && <div className="msa-success">{success}</div>}

        <div className="msa-signature-section">
          <div className="msa-signature-methods">
            <h2>Choose Signature Method</h2>
            
            <label className="msa-radio-option">
              <input
                type="radio"
                value="DOCUSIGN"
                checked={signatureMethod === 'DOCUSIGN'}
                onChange={(e) => setSignatureMethod(e.target.value)}
              />
              <span>📤 DocuSign (Professional)</span>
              <p>Send signing link via DocuSign - Industry standard</p>
            </label>

            <label className="msa-radio-option">
              <input
                type="radio"
                value="IN_SYSTEM"
                checked={signatureMethod === 'IN_SYSTEM'}
                onChange={(e) => setSignatureMethod(e.target.value)}
              />
              <span>✍️ Draw Signature</span>
              <p>Draw signature directly in system</p>
            </label>

            <label className="msa-radio-option">
              <input
                type="radio"
                value="SELF_SERVICE"
                checked={signatureMethod === 'SELF_SERVICE'}
                onChange={(e) => setSignatureMethod(e.target.value)}
              />
              <span>🔗 Self-Service Link</span>
              <p>Send link to recipient for self-service signing</p>
            </label>
          </div>

          <div className="msa-signer-info">
            <h2>Signer Information</h2>
            
            <input
              type="text"
              placeholder="Full Name"
              value={signerData.name}
              onChange={(e) => setSignerData({ ...signerData, name: e.target.value })}
            />
            
            <input
              type="text"
              placeholder="Job Title"
              value={signerData.title}
              onChange={(e) => setSignerData({ ...signerData, title: e.target.value })}
            />
            
            <input
              type="email"
              placeholder="Email Address"
              value={signerData.email}
              onChange={(e) => setSignerData({ ...signerData, email: e.target.value })}
            />
          </div>

          {signatureMethod === 'IN_SYSTEM' && (
            <div className="msa-signature-canvas-section">
              <h2>Draw Your Signature</h2>
              <p style={{ color: '#666', fontSize: '14px' }}>Use your mouse or touchpad to sign below</p>
              <canvas
                ref={canvasRef}
                width={400}
                height={150}
                className="msa-signature-canvas"
              />
              <button onClick={() => {
                if (canvasRef.current) {
                  const ctx = canvasRef.current.getContext('2d');
                  ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                  setSignatureCanvas(null);
                }
              }} className="msa-btn-secondary">
                Clear Signature
              </button>
            </div>
          )}

          <div className="msa-button-group">
            <button
              onClick={() => setCurrentStep('preview')}
              className="msa-btn-secondary"
            >
              Back
            </button>
            <button
              onClick={async () => {
                if (!signerData.email || !signerData.name) {
                  setError('Please enter signer name and email');
                  return;
                }
                try {
                  setLoading(true);
                  setError(null);

                  if (signatureMethod === 'DOCUSIGN' || signatureMethod === 'SELF_SERVICE') {
                    // First save content as an uploaded document
                    const contentBlob = new Blob([documentContent], { type: 'text/html' });
                    const formData = new FormData();
                    formData.append('file', contentBlob, `MSA-${selectedParty?.companyName || 'Document'}.html`);
                    formData.append('fileName', `MSA-${selectedParty?.companyName || 'Document'}.html`);

                    const uploadRes = await axios.post(
                      `${BASE_URL}/api/msa/documents/upload`,
                      formData,
                      {
                        headers: {
                          'Content-Type': 'multipart/form-data',
                          Authorization: `Bearer ${localStorage.getItem('token')}`
                        }
                      }
                    );

                    const uploadedDocId = uploadRes.data.data.documentId;

                    // Then send for DocuSign signing
                    await axios.post(
                      `${BASE_URL}/api/msa/documents/upload/send-docusign`,
                      {
                        uploadedDocumentId: uploadedDocId,
                        fileName: `MSA-${selectedParty?.companyName || 'Document'}.html`,
                        recipientEmail: signerData.email,
                        recipientName: signerData.name,
                        recipientTitle: signerData.title
                      },
                      { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
                    );

                    Swal.fire({
                      title: 'Success!',
                      text: `Signing request sent to ${signerData.email}`,
                      icon: 'success',
                      confirmButtonText: 'Done'
                    }).then(() => resetForm());

                  } else if (signatureMethod === 'IN_SYSTEM') {
                    // Submit signature directly
                    const signatureData = canvasRef.current
                      ? canvasRef.current.toDataURL('image/png')
                      : 'typed-signature';

                    await axios.post(
                      `${BASE_URL}/api/msa/documents/submit-signature`,
                      {
                        documentId: generatedDocument.documentId,
                        signatureData: signatureData,
                        signerName: signerData.name,
                        signerTitle: signerData.title,
                        signerEmail: signerData.email
                      },
                      { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
                    );

                    Swal.fire({
                      title: 'Signed!',
                      text: 'Document has been signed successfully',
                      icon: 'success',
                      confirmButtonText: 'Done'
                    }).then(() => resetForm());
                  }

                } catch (err) {
                  console.error('Error:', err);
                  setError(err.response?.data?.message || 'Failed to send document');
                } finally {
                  setLoading(false);
                }
              }}
              disabled={!signerData.email || !signerData.name || loading}
              className="msa-btn-primary"
            >
              {loading ? <Loader className="spin" /> : '✍️ Sign & Send'}
              <CheckCircle size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}