// routes/hotlistRoutes.js - FIXED VERSION WITHOUT MIDDLEWARE BLOCKING
const express = require('express');
const router = express.Router();
const hotlistController = require('../controllers/hotlistController');
const { authenticateToken } = require('../../Recruitment/middleWare/authMiddleware');

// Middleware to log all requests for debugging
router.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Increase timeout for bulk operations
router.use('/bulk', (req, res, next) => {
  req.setTimeout(60000);
  res.setTimeout(60000);
  next();
});

// Apply authentication middleware to all routes except test endpoints
router.use((req, res, next) => {
  if (req.path === '/test/connection') {
    return next();
  }
  return authenticateToken(req, res, next);
});

// TEST ENDPOINT
router.get('/test/connection', hotlistController.testConnection);

// GET ENDPOINTS
router.get('/search/role', hotlistController.searchByRole);
router.get('/visa/:visa', hotlistController.getCandidatesByVisa);
router.get('/state/:state', hotlistController.getCandidatesByState);
router.get('/', hotlistController.getAllHotlistCandidates);
router.get('/:id', hotlistController.getHotlistCandidateById);

// POST - Create single candidate (NO VALIDATION MIDDLEWARE - let controller handle it)
router.post('/', hotlistController.createHotlistCandidate);

// POST - Bulk create candidates (NO VALIDATION MIDDLEWARE - let controller handle it)
router.post('/bulk', hotlistController.bulkCreateCandidates);

// PUT - Update candidate (NO VALIDATION MIDDLEWARE - let controller handle it)
router.put('/:id', hotlistController.updateHotlistCandidate);

// DELETE ENDPOINTS
router.delete('/:id', hotlistController.deleteHotlistCandidate);
router.delete('/:id/permanent', hotlistController.permanentDeleteHotlistCandidate);

// Error handling
router.use((error, req, res, next) => {
  console.error('Hotlist route error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: error.message
  });
});

module.exports = router;