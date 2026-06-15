// Bench_Sales/routes/submissionRoutes.js
const express = require('express');
const router = express.Router();
const submissionController = require('../controllers/submissionController');
const { authenticateToken } = require('../../Recruitment/middleWare/authMiddleware');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// GET /api/submissions - Get all submissions
router.get('/', submissionController.getAllSubmissions);

// GET /api/submissions/tracking/kanban - Get submissions data for Kanban board (moved up to avoid conflict)
router.get('/tracking/kanban', submissionController.getKanbanData);

// GET /api/submissions/status/:status - Get submissions by status (moved up to avoid conflict)
router.get('/status/:status', submissionController.getSubmissionsByStatus);

// GET /api/submissions/:id - Get single submission by ID
router.get('/:id', submissionController.getSubmissionById);

// POST /api/submissions - Create new submission
router.post('/', submissionController.createSubmission);

// POST /api/submissions/bulk-submit - Bulk submit candidates to vendor
router.post('/bulk-submit', submissionController.bulkSubmitCandidates);

// PUT /api/submissions/:id - Update submission
router.put('/:id', submissionController.updateSubmission);

// PUT /api/submissions/:id/status - Update submission status
router.put('/:id/status', submissionController.updateSubmissionStatus);

// DELETE /api/submissions/:id - Delete submission
router.delete('/:id', submissionController.deleteSubmission);

module.exports = router;