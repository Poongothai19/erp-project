// routes/candidateRoutes.js - UPDATED WITH NAME SEARCH ROUTE
const express = require('express');
const router = express.Router();
const candidateController = require('../controllers/candidateController');
const { authenticateToken } = require('../../Recruitment/middleWare/authMiddleware');
const { upload, handleUploadError } = require('../middleWare/uploadMiddleware');

// Middleware to log all requests
router.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  console.log('Query params:', req.query);
  console.log('Body:', req.body);
  console.log('Params:', req.params);
  next();
});

// Apply authentication middleware to all routes except test endpoints
router.use((req, res, next) => {
  // Skip auth for test endpoints
  if (req.path === '/test/connection') {
    return next();
  }
  return authenticateToken(req, res, next);
});

// TEST ENDPOINT - Check database connection (no auth required)
router.get('/test/connection', candidateController.testConnection);

// SEARCH ENDPOINTS (MUST be before /:id routes)
// GET /api/candidates/search/name - Search candidates by name
router.get('/search/name', candidateController.searchByName);

// GET /api/candidates/search/skills - Search candidates by skills
router.get('/search/skills', candidateController.searchBySkills);

// FILTER ENDPOINTS (MUST be before /:id routes)
// GET /api/candidates/filter/available - Get available candidates only
router.get('/filter/available', candidateController.getAvailableCandidates);

// GET /api/candidates/priority/:priority - Get candidates by priority (High, Medium, Low)
router.get('/priority/:priority', candidateController.getCandidatesByPriority);

// GET /api/candidates - Get all candidates with optional filters (including name)
router.get('/', candidateController.getAllCandidates);

// GET /api/candidates/:id/resume - Download candidate resume (MUST be before /:id)
router.get('/:id/resume', candidateController.downloadResume);

// GET /api/candidates/:id - Get single candidate by ID
router.get('/:id', candidateController.getCandidateById);

// POST /api/candidates - Create new candidate WITH file upload
router.post('/', upload.single('resume'), handleUploadError, candidateController.createCandidate);

// PUT /api/candidates/:id - Update candidate WITH file upload
router.put('/:id', upload.single('resume'), handleUploadError, candidateController.updateCandidate);


// Add before the /:id route
router.get('/:id/diagnostics', candidateController.getDiagnostics);

// DELETE /api/candidates/:id - Delete candidate (ENHANCED WITH LOGGING)
router.delete('/:id', (req, res, next) => {
  console.log('=== DELETE ROUTE CALLED ===');
  console.log('Request method:', req.method);
  console.log('Request path:', req.path);
  console.log('Request params:', req.params);
  console.log('Request headers:', req.headers);
  console.log('User from auth middleware:', req.user);
  next();
}, candidateController.deleteCandidate);

// Error handling middleware
router.use((error, req, res, next) => {
  console.error('Route error:', error);
  console.error('Route error stack:', error.stack);
  
  // Handle specific error types
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      error: error.message
    });
  }
  
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File too large',
      error: 'Maximum file size is 5MB'
    });
  }
  
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: error.message,
    details: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });
});

module.exports = router;