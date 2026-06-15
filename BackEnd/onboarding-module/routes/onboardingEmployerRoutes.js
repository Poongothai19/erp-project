const express = require('express');
const router = express.Router();
const multer = require('multer');
const onboardingEmployerController = require('../controllers/onboardingEmployerController');
const { authenticateToken } = require('../../Recruitment/middleWare/authMiddleware');

// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPEG, and PNG files are allowed.'));
    }
  }
});

// Middleware to log all requests
router.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] [ONBOARDING-EMPLOYER-MODULE] ${req.method} ${req.originalUrl}`);
  next();
});

// ============================================================
// ONBOARDING EMPLOYER ROUTES
// ============================================================

// TEST ENDPOINT
router.get('/test/connection', onboardingEmployerController.testConnection);

// GET all employers
router.get('/', authenticateToken, onboardingEmployerController.getAllEmployers);

// GET employer statistics
router.get('/stats', authenticateToken, onboardingEmployerController.getEmployerStats);

// GET employer by user ID (for dashboard after login)
router.get('/user/:userId', authenticateToken, onboardingEmployerController.getEmployerByUserId);

// GET employer with documents
router.get('/:id/with-documents', authenticateToken, onboardingEmployerController.getEmployerWithDocuments);

// POST create new employer
router.post('/', authenticateToken, onboardingEmployerController.createEmployer);

// GET single employer
router.get('/:id', authenticateToken, onboardingEmployerController.getEmployerById);

// PUT update employer
router.put('/:id', authenticateToken, onboardingEmployerController.updateEmployer);

// POST resend credentials email
router.post('/:id/resend-credentials', authenticateToken, onboardingEmployerController.resendEmployerCredentials);

// DELETE orphaned email record (cleanup failed employer creation)
router.delete('/cleanup/email/:email', authenticateToken, onboardingEmployerController.cleanupOrphanedEmail);

// DELETE employer
router.delete('/:id', authenticateToken, onboardingEmployerController.deleteEmployer);

// ============================================================
// DOCUMENT MANAGEMENT ROUTES
// ============================================================

// Upload document for employer
router.post(
  '/:id/upload-document',
  authenticateToken,
  upload.single('document'),
  onboardingEmployerController.uploadDocument
);

// Delete document
router.delete(
  '/:id/document/:documentType',
  authenticateToken,
  onboardingEmployerController.deleteDocument
);

// ============================================================
// ERROR HANDLING MIDDLEWARE
// ============================================================
router.use((error, req, res, next) => {
  console.error('❌ Onboarding employer route error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error in onboarding employer routes',
    error: process.env.NODE_ENV === 'production' ? 'Server error' : error.message,
    module: 'onboarding'
  });
});

// 404 handler
router.use('*', (req, res) => {
  console.log(`❌ Onboarding employer route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: 'Onboarding employer API endpoint not found',
    module: 'onboarding'
  });
});

console.log('✅ Onboarding Employer routes registered at /api/onboarding-employers');
console.log('   ✓ GET  /');
console.log('   ✓ GET  /stats');
console.log('   ✓ GET  /user/:userId');
console.log('   ✓ GET  /:id/with-documents');
console.log('   ✓ POST /');
console.log('   ✓ GET  /:id');
console.log('   ✓ PUT  /:id');
console.log('   ✓ DELETE /:id');
console.log('   ✓ POST /:id/upload-document');
console.log('   ✓ DELETE /:id/document/:documentType');
console.log('   ✓ GET  /test/connection\n');

module.exports = router;