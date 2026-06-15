// Bench_Sales/routes/externalSubmissionRoutes.js
const express = require('express');
const router = express.Router();
const externalSubmissionController = require('../controllers/externalSubmissionController');

// Apply authentication middleware if it exists
try {
  const { authenticateToken } = require('../../Recruitment/middleWare/authMiddleware');
  router.use(authenticateToken);
} catch (error) {
  console.log('Authentication middleware not found, continuing without auth');
}

// POST /api/external-submissions/import - Import CSV/Excel (MUST be before /:id route)
router.post('/import', externalSubmissionController.importExternalSubmissions);

// GET /api/external-submissions - Get all external submissions
router.get('/', externalSubmissionController.getAllExternalSubmissions);

// GET /api/external-submissions/search - Search external submissions
router.get('/search', externalSubmissionController.searchExternalSubmissions);

// GET /api/external-submissions/summary - Get external submissions summary/statistics
router.get('/summary', externalSubmissionController.getExternalSubmissionsSummary);

// GET /api/external-submissions/status/:status - Get external submissions by status
router.get('/status/:status', externalSubmissionController.getExternalSubmissionsByStatus);

// GET /api/external-submissions/:id - Get single external submission by ID
router.get('/:id', externalSubmissionController.getExternalSubmissionById);

// POST /api/external-submissions - Create new external submission
router.post('/', externalSubmissionController.createExternalSubmission);

// PUT /api/external-submissions/:id - Update external submission
router.put('/:id', externalSubmissionController.updateExternalSubmission);

// PUT /api/external-submissions/:id/status - Update external submission status
router.put('/:id/status', externalSubmissionController.updateExternalSubmissionStatus);

// DELETE /api/external-submissions/:id - Delete external submission
router.delete('/:id', externalSubmissionController.deleteExternalSubmission);

module.exports = router;