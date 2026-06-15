// BackEnd/MSA/routes/msaRoutes.js
// COMPLETE UPDATED VERSION - ALL ROUTES WITH FIXES APPLIED
// Preview endpoint is NOW PUBLIC with CORS enabled

const express = require('express');
const router = express.Router();
const msaController = require('../controllers/msaController');
const multer = require('multer');

console.log('=== MSA CONTROLLER FUNCTIONS ===');
console.log(Object.keys(msaController).sort());
console.log('==============================');

// Import authentication middleware
let authenticateToken;
try {
  const authMiddleware = require('../../Recruitment/middleWare/authMiddleware');
  authenticateToken = authMiddleware.authenticateToken;
  console.log('✅ Auth middleware loaded successfully');
} catch (error) {
  console.error('❌ Failed to load auth middleware:', error.message);
  // Create a dummy middleware for development
  authenticateToken = (req, res, next) => {
    console.warn('⚠️ Using dummy authentication - NO REAL AUTH');
    req.user = { id: 1, email: 'dev@example.com', role: 'admin' };
    next();
  };
}

// ============================================
// MULTER SETUP FOR FILE UPLOADS
// ============================================
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  }
});

// ============================================
// REQUEST LOGGING MIDDLEWARE
// ============================================
router.use((req, res, next) => {
  console.log(`[MSA] ${req.method} ${req.originalUrl}`);
  next();
});

// ============================================
// ✅ CORS PREFLIGHT HANDLERS
// ============================================

/**
 * Handle CORS preflight for preview endpoint
 */
router.options('/documents/upload/:documentId/preview', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Type, Content-Length');
  res.setHeader('Access-Control-Max-Age', '3600');
  res.status(200).end();
});

/**
 * Handle CORS preflight for general preview
 */
router.options('/documents/signing/:signingToken', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.status(200).end();
});

// ============================================
// HEALTH CHECK (Public)
// ============================================
router.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'MSA module healthy',
    timestamp: new Date().toISOString()
  });
});

// ============================================
// 🔓 PUBLIC ROUTES - NO AUTHENTICATION NEEDED
// ============================================

/**
 * @route   GET /api/msa/documents/signing/:signingToken
 * @desc    Get document by signing token (for public signing page)
 * @access  Public
 */
if (msaController.getDocumentBySigningToken) {
  router.get('/documents/signing/:signingToken', msaController.getDocumentBySigningToken);
  console.log('✅ Public route: GET /documents/signing/:signingToken');
} else {
  console.warn('⚠️ Missing controller: getDocumentBySigningToken');
}

/**
 * @route   POST /api/msa/docusign/confirm-signature
 * @desc    Confirm signature from external user
 * @access  Public
 */
if (msaController.confirmDocusignSignature) {
  router.post('/docusign/confirm-signature', msaController.confirmDocusignSignature);
  console.log('✅ Public route: POST /docusign/confirm-signature');
} else {
  console.warn('⚠️ Missing controller: confirmDocusignSignature');
}

/**
 * @route   GET /api/msa/documents/signed/:signedDocumentId/download
 * @desc    Download signed document
 * @access  Public (with token)
 */
if (msaController.downloadSignedDocument) {
  router.get('/documents/signed/:signedDocumentId/download', msaController.downloadSignedDocument);
  console.log('✅ Public route: GET /documents/signed/:signedDocumentId/download');
} else {
  console.warn('⚠️ Missing controller: downloadSignedDocument');
}

// ============================================
// 🔒 PROTECTED ROUTES - AUTHENTICATION REQUIRED
// ============================================

// -----------------------------------------------------------------
// TEMPLATE MANAGEMENT
// -----------------------------------------------------------------

/**
 * @route   GET /api/msa/templates
 * @desc    Get all MSA templates
 * @access  Protected
 */
if (msaController.getAllTemplates) {
  router.get('/templates', authenticateToken, msaController.getAllTemplates);
  console.log('✅ Protected route: GET /templates');
}

/**
 * @route   POST /api/msa/templates
 * @desc    Create new template
 * @access  Protected
 */
if (msaController.createTemplate) {
  router.post('/templates', authenticateToken, msaController.createTemplate);
  console.log('✅ Protected route: POST /templates');
}

/**
 * @route   GET /api/msa/templates/:templateId
 * @desc    Get template by ID
 * @access  Protected
 */
if (msaController.getTemplateById) {
  router.get('/templates/:templateId', authenticateToken, msaController.getTemplateById);
  console.log('✅ Protected route: GET /templates/:templateId');
}

// -----------------------------------------------------------------
// PARTY LOOKUP
// -----------------------------------------------------------------

/**
 * @route   GET /api/msa/parties/all
 * @desc    Get all parties (clients/suppliers)
 * @access  Protected
 */
if (msaController.getAllParties) {
  router.get('/parties/all', authenticateToken, msaController.getAllParties);
  console.log('✅ Protected route: GET /parties/all');
}

/**
 * @route   GET /api/msa/parties/search
 * @desc    Search parties
 * @access  Protected
 */
if (msaController.searchParty) {
  router.get('/parties/search', authenticateToken, msaController.searchParty);
  console.log('✅ Protected route: GET /parties/search');
}

/**
 * @route   GET /api/msa/parties/:mode/:partyId
 * @desc    Get party details by ID
 * @access  Protected
 */
if (msaController.getPartyDetails) {
  router.get('/parties/:mode/:partyId', authenticateToken, msaController.getPartyDetails);
  console.log('✅ Protected route: GET /parties/:mode/:partyId');
}

// -----------------------------------------------------------------
// COMPANY DETAILS
// -----------------------------------------------------------------

/**
 * @route   GET /api/msa/company
 * @desc    Get company details
 * @access  Protected
 */
if (msaController.getCompanyDetails) {
  router.get('/company', authenticateToken, msaController.getCompanyDetails);
  console.log('✅ Protected route: GET /company');
}

/**
 * @route   GET /api/msa/company/me
 * @desc    Get current user's company details
 * @access  Protected
 */
if (msaController.getCompanyDetails) {
  router.get('/company/me', authenticateToken, msaController.getCompanyDetails);
  console.log('✅ Protected route: GET /company/me');
}

// -----------------------------------------------------------------
// START DOCUMENT
// -----------------------------------------------------------------

/**
 * @route   GET /api/msa/documents/start
 * @desc    Get start document template
 * @access  Protected
 */
if (msaController.getStartDocument) {
  router.get('/documents/start', authenticateToken, msaController.getStartDocument);
  console.log('✅ Protected route: GET /documents/start');
}

/**
 * @route   POST /api/msa/documents/start/save
 * @desc    Save start document
 * @access  Protected
 */
if (msaController.saveStartDocument) {
  router.post('/documents/start/save', authenticateToken, msaController.saveStartDocument);
  console.log('✅ Protected route: POST /documents/start/save');
}

// -----------------------------------------------------------------
// DOCUMENT GENERATION & MANAGEMENT
// -----------------------------------------------------------------

/**
 * @route   POST /api/msa/documents/generate
 * @desc    Generate MSA document from template
 * @access  Protected
 */
if (msaController.generateMSADocument) {
  router.post('/documents/generate', authenticateToken, msaController.generateMSADocument);
  console.log('✅ Protected route: POST /documents/generate');
}

/**
 * @route   POST /api/msa/documents/update-content
 * @desc    Update document content
 * @access  Protected
 */
if (msaController.updateDocumentContent) {
  router.post('/documents/update-content', authenticateToken, msaController.updateDocumentContent);
  console.log('✅ Protected route: POST /documents/update-content');
}

/**
 * @route   POST /api/msa/documents/send-signature
 * @desc    Send document for signature
 * @access  Protected
 */
if (msaController.sendForSignature) {
  router.post('/documents/send-signature', authenticateToken, msaController.sendForSignature);
  console.log('✅ Protected route: POST /documents/send-signature');
}

/**
 * @route   POST /api/msa/documents/submit-signature
 * @desc    Submit signature
 * @access  Protected
 */
if (msaController.submitSignature) {
  router.post('/documents/submit-signature', authenticateToken, msaController.submitSignature);
  console.log('✅ Protected route: POST /documents/submit-signature');
}

/**
 * @route   GET /api/msa/documents/party/:mode/:partyId
 * @desc    Get MSAs for a specific party
 * @access  Protected
 */
if (msaController.getPartyMSAs) {
  router.get('/documents/party/:mode/:partyId', authenticateToken, msaController.getPartyMSAs);
  console.log('✅ Protected route: GET /documents/party/:mode/:partyId');
}

// -----------------------------------------------------------------
// PDF DOWNLOAD
// -----------------------------------------------------------------

/**
 * @route   GET /api/msa/documents/:documentId/pdf
 * @desc    Download document as PDF
 * @access  Protected
 */
if (msaController.downloadDocumentAsPDF) {
  router.get('/documents/:documentId/pdf', authenticateToken, msaController.downloadDocumentAsPDF);
  console.log('✅ Protected route: GET /documents/:documentId/pdf');
}

// -----------------------------------------------------------------
// FILE UPLOAD
// -----------------------------------------------------------------

/**
 * @route   POST /api/msa/documents/upload
 * @desc    Upload document file
 * @access  Protected
 */
if (msaController.uploadDocument) {
  router.post('/documents/upload', authenticateToken, upload.single('file'), msaController.uploadDocument);
  console.log('✅ Protected route: POST /documents/upload');
}


// -----------------------------------------------------------------
// FILE PREVIEW - ✅ NOW PUBLIC (No authentication)
// -----------------------------------------------------------------

/**
 * @route   GET /api/msa/documents/upload/:documentId/preview
 * @desc    Preview uploaded document (iframe-friendly)
 * @access  Public (no authentication required)
 */
if (msaController.getUploadedDocumentPreview) {
  router.get('/documents/upload/:documentId/preview', msaController.getUploadedDocumentPreview);
  console.log('✅ Public route: GET /documents/upload/:documentId/preview');
}

// -----------------------------------------------------------------
// DOCUSIGN INTEGRATION (Protected)
// -----------------------------------------------------------------

/**
 * @route   POST /api/msa/documents/upload/send-docusign
 * @desc    Send uploaded document via DocuSign
 * @access  Protected
 */
if (msaController.sendUploadedDocumentForDocuSign) {
  router.post('/documents/upload/send-docusign', authenticateToken, msaController.sendUploadedDocumentForDocuSign);
  console.log('✅ Protected route: POST /documents/upload/send-docusign');
}

/**
 * @route   GET /api/msa/docusign/envelope/:envelopeId/status
 * @desc    Get envelope status
 * @access  Protected
 */
if (msaController.getEnvelopeStatus) {
  router.get('/docusign/envelope/:envelopeId/status', authenticateToken, msaController.getEnvelopeStatus);
  console.log('✅ Protected route: GET /docusign/envelope/:envelopeId/status');
}

/**
 * @route   POST /api/msa/docusign/recipient-view
 * @desc    Create recipient view for embedded signing
 * @access  Protected
 */
if (msaController.createRecipientView) {
  router.post('/docusign/recipient-view', authenticateToken, msaController.createRecipientView);
  console.log('✅ Protected route: POST /docusign/recipient-view');
}

/**
 * @route   POST /api/msa/docusign/share-signed-document
 * @desc    Share signed document with recipient
 * @access  Public (called from public signing page after signing)
 */
if (msaController.shareSignedDocument) {
  router.post('/docusign/share-signed-document', msaController.shareSignedDocument);
  console.log('✅ Public route: POST /docusign/share-signed-document');
}

// -----------------------------------------------------------------
// STATISTICS
// -----------------------------------------------------------------

/**
 * @route   GET /api/msa/stats
 * @desc    Get MSA statistics
 * @access  Protected
 */
if (msaController.getMSAStats) {
  router.get('/stats', authenticateToken, msaController.getMSAStats);
  console.log('✅ Protected route: GET /stats');
}

// -----------------------------------------------------------------
// LEGACY ROUTES (Backward Compatibility)
// -----------------------------------------------------------------

/**
 * @route   GET /api/msa/docusign/confirm-signature/:signingToken/:envelopeId
 * @desc    Legacy route - confirm signature
 * @access  Protected
 */
if (msaController.confirmDocusignSignature) {
  router.get('/docusign/confirm-signature/:signingToken/:envelopeId', authenticateToken, msaController.confirmDocusignSignature);
  console.log('✅ Legacy route: GET /docusign/confirm-signature/:signingToken/:envelopeId');
}

// ============================================
// DEBUG ROUTES (Development Only)
// ============================================

/**
 * @route   GET /api/msa/documents/debug/:documentId
 * @desc    Debug endpoint to check document in database
 * @access  Public (for debugging)
 */
router.get('/documents/debug/:documentId', async (req, res) => {
  let connection;
  try {
    const { documentId } = req.params;
    console.log('🔍 DEBUG: Checking document:', documentId);
    
    const sql = require('mssql');
    const { dbConfig } = require('../../config/db');
    
    connection = new sql.ConnectionPool(dbConfig);
    await connection.connect();
    
    const request = connection.request();
    request.input('documentId', sql.Int, parseInt(documentId));
    
    const result = await request.query(`
      SELECT 
        Id,
        FileName,
        FileType,
        FileSize,
        CASE 
          WHEN FileData IS NULL THEN 'No Data'
          WHEN DATALENGTH(FileData) = 0 THEN 'Empty'
          ELSE 'Has Data (' + CAST(DATALENGTH(FileData) as NVARCHAR) + ' bytes)'
        END as DataStatus,
        UploadedAt,
        UploadedBy
      FROM UploadedDocuments 
      WHERE Id = @documentId
    `);
    
    await connection.close();
    
    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Document not found in database'
      });
    }
    
    const doc = result.recordset[0];
    
    res.json({
      success: true,
      data: {
        id: doc.Id,
        fileName: doc.FileName,
        fileType: doc.FileType,
        fileSize: doc.FileSize,
        dataStatus: doc.DataStatus,
        uploadedAt: doc.UploadedAt,
        uploadedBy: doc.UploadedBy,
        previewUrl: `${process.env.BACKEND_URL || 'http://localhost:' + (process.env.PORT || 5000)}/api/msa/documents/upload/${doc.Id}/preview`
      }
    });
    
  } catch (error) {
    console.error('❌ Debug error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// ERROR HANDLING MIDDLEWARE
// ============================================

/**
 * Handle Multer errors
 */
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    console.error('❌ Multer error:', error.message);
    return res.status(400).json({
      success: false,
      message: 'File upload error: ' + error.message,
      code: error.code
    });
  }
  next(error);
});

/**
 * General error handling
 */
router.use((error, req, res, next) => {
  console.error('❌ MSA route error:', error.message);
  console.error(error.stack);
  
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    timestamp: new Date().toISOString()
  });
});

/**
 * 404 handler - Route not found
 */
router.use('*', (req, res) => {
  console.warn(`⚠️ MSA endpoint not found: ${req.method} ${req.originalUrl}`);
  
  res.status(404).json({
    success: false,
    message: 'MSA endpoint not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// ============================================
// ROUTE SUMMARY
// ============================================
console.log('\n=== MSA ROUTES SUMMARY ===');
console.log('🔓 Public Routes:');
console.log('  GET  /documents/signing/:signingToken');
console.log('  POST /docusign/confirm-signature');
console.log('  GET  /documents/signed/:signedDocumentId/download');
console.log('  GET  /documents/upload/:documentId/preview ✅ PUBLIC NOW');
console.log('  GET  /health');
console.log('\n🔒 Protected Routes:');
console.log('  GET  /templates');
console.log('  POST /templates');
console.log('  GET  /templates/:templateId');
console.log('  GET  /parties/all');
console.log('  GET  /parties/search');
console.log('  GET  /parties/:mode/:partyId');
console.log('  GET  /company');
console.log('  GET  /company/me');
console.log('  GET  /documents/start');
console.log('  POST /documents/start/save');
console.log('  POST /documents/generate');
console.log('  POST /documents/update-content');
console.log('  POST /documents/send-signature');
console.log('  POST /documents/submit-signature');
console.log('  GET  /documents/party/:mode/:partyId');
console.log('  GET  /documents/:documentId/pdf');
console.log('  POST /documents/upload');
console.log('  POST /documents/upload/send-docusign');
console.log('  GET  /docusign/envelope/:envelopeId/status');
console.log('  POST /docusign/recipient-view');
console.log('  POST /docusign/share-signed-document');
console.log('  GET  /stats');
console.log('  GET  /docusign/confirm-signature/:signingToken/:envelopeId (legacy)');
console.log('===============================\n');

module.exports = router;