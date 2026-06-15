// Bench_Sales/routes/requirementRoutes.js
const express = require('express');
const router = express.Router();
const requirementController = require('../controllers/requirementController');
const { authenticateToken } = require('../../Recruitment/middleWare/authMiddleware');
// Check if you have an auth middleware, if not, comment out this line
// const authMiddleware = require('../../Recruitment/middleWare/authMiddleware');

// If you have auth middleware, uncomment this line
router.use(authenticateToken);

// GET /api/requirements/stats - Get requirements with stats (MOVE BEFORE /:id)
router.get('/stats', requirementController.getRequirementsWithStats);

// GET /api/requirements/search - Search requirements (MOVE BEFORE /:id)
router.get('/search', requirementController.searchRequirements);

// GET /api/requirements/summary/clients - Get requirements summary by client (MOVE BEFORE /:id)
router.get('/summary/clients', requirementController.getRequirementsSummaryByClient);

// GET /api/requirements/status/:status - Get requirements by status (MOVE BEFORE /:id)
router.get('/status/:status', requirementController.getRequirementsByStatus);

// GET /api/requirements - Get all requirements
router.get('/', requirementController.getAllRequirements);

// GET /api/requirements/:id - Get single requirement by ID
router.get('/:id', requirementController.getRequirementById);

// POST /api/requirements - Create new requirement
router.post('/', requirementController.createRequirement);

// PUT /api/requirements/:id - Update requirement
router.put('/:id', requirementController.updateRequirement);

// DELETE /api/requirements/:id - Delete requirement
router.delete('/:id', requirementController.deleteRequirement);

// POST /api/requirements/:id/match-candidates - Find matching candidates for a requirement
router.post('/:id/match-candidates', requirementController.findMatchingCandidates);

// PATCH /api/requirements/:id/status - Update requirement status only
router.patch('/:id/status', requirementController.updateRequirementStatus);

module.exports = router;