// routes/c2cRoutes.js - Properly Configured C2C Routes
const express = require('express');
const router = express.Router();
const c2cController = require('../controllers/c2cController');
const { authenticateToken } = require('../../Recruitment/middleWare/authMiddleware');

// Middleware to log all requests
router.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] C2C Management Route: ${req.method} ${req.originalUrl}`);
  console.log('Query params:', req.query);
  if (req.method !== 'GET') {
    console.log('Body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// Apply authentication middleware to all routes
router.use(authenticateToken);

// IMPORTANT: More specific routes MUST come BEFORE generic routes with parameters

// GET /api/c2c/company/:companyId/stats - Get C2C statistics
router.get('/company/:companyId/stats', async (req, res) => {
  try {
    console.log('📊 Getting C2C stats for company:', req.params.companyId);
    await c2cController.getC2CStats(req, res);
  } catch (error) {
    console.error('Error in stats route:', error);
    res.status(500).json({ success: false, message: 'Error fetching stats', error: error.message });
  }
});

// POST /api/c2c/company/:companyId - Create new C2C contractor
router.post('/company/:companyId', async (req, res) => {
  try {
    console.log('➕ Creating C2C contractor for company:', req.params.companyId);
    await c2cController.createC2CContractor(req, res);
  } catch (error) {
    console.error('Error in create route:', error);
    res.status(500).json({ success: false, message: 'Error creating contractor', error: error.message });
  }
});

// GET /api/c2c/company/:companyId - Get all C2C contractors
router.get('/company/:companyId', async (req, res) => {
  try {
    console.log('📋 Getting all C2C contractors for company:', req.params.companyId);
    await c2cController.getCompanyC2Cs(req, res);
  } catch (error) {
    console.error('Error in getAll route:', error);
    res.status(500).json({ success: false, message: 'Error fetching contractors', error: error.message });
  }
});

// GET /api/c2c/company/:companyId/:contractorId - Get specific C2C contractor
router.get('/company/:companyId/:contractorId', async (req, res) => {
  try {
    console.log('👤 Getting C2C contractor details:', req.params);
    await c2cController.getC2CDetails(req, res);
  } catch (error) {
    console.error('Error in details route:', error);
    res.status(500).json({ success: false, message: 'Error fetching contractor details', error: error.message });
  }
});

// PUT /api/c2c/company/:companyId/:contractorId - Update C2C contractor
router.put('/company/:companyId/:contractorId', async (req, res) => {
  try {
    console.log('✏️ Updating C2C contractor:', req.params);
    await c2cController.updateC2CContractor(req, res);
  } catch (error) {
    console.error('Error in update route:', error);
    res.status(500).json({ success: false, message: 'Error updating contractor', error: error.message });
  }
});

// DELETE /api/c2c/company/:companyId/:contractorId - Delete C2C contractor
router.delete('/company/:companyId/:contractorId', async (req, res) => {
  try {
    console.log('🗑️ Deleting C2C contractor:', req.params);
    await c2cController.deleteC2CContractor(req, res);
  } catch (error) {
    console.error('Error in delete route:', error);
    res.status(500).json({ success: false, message: 'Error deleting contractor', error: error.message });
  }
});

// Error handling middleware
router.use((error, req, res, next) => {
  console.error('❌ C2C management route error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error in C2C management routes',
    error: error.message
  });
});

console.log('✅ C2C management routes registered successfully');

module.exports = router;