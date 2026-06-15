// Accounts/routes/accountsRoutes.js
const express = require('express');
const router = express.Router();
const accountsController = require('../controllers/accountsController');
const { authenticateToken } = require('../../Recruitment/middleWare/authMiddleware');

// Apply authentication to all routes
router.use(authenticateToken);

// Request logging middleware
router.use((req, res, next) => {
  console.log(`[ACCOUNTS-ROUTE] ${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
  console.log('User ID:', req.user?.id);
  next();
});

// ============================================
// ACCOUNTS ENDPOINTS
// ============================================

// Employee Details
router.get('/my-details', accountsController.getMyEmployeeDetails);

// Statements
router.get('/my-statements', accountsController.getMyStatements);

// Reports
router.get('/my-reports', accountsController.getMyReports);
router.get('/download-report/:id', accountsController.downloadReport);
router.get('/report-url/:id', accountsController.getReportDownloadUrl);
router.get('/debug-report/:id', accountsController.getReportDebug);
router.delete('/delete-report/:id', accountsController.deleteReport);

// Benefits & Immigration
router.get('/my-benefits', accountsController.getMyBenefits);
router.get('/my-immigration', accountsController.getMyImmigration);

// Account Summary
router.get('/summary', accountsController.getAccountSummary);

// Error handling middleware
router.use((error, req, res, next) => {
  console.error('❌ Accounts route error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error in accounts routes',
    error: error.message
  });
});

console.log('✅ Accounts routes registered successfully');
console.log('Registered routes:');
console.log('  GET    /api/accounts/my-details');
console.log('  GET    /api/accounts/my-statements');
console.log('  GET    /api/accounts/my-reports');
console.log('  GET    /api/accounts/download-report/:id');
console.log('  GET    /api/accounts/report-url/:id');
console.log('  GET    /api/accounts/debug-report/:id');
console.log('  DELETE /api/accounts/delete-report/:id');
console.log('  GET    /api/accounts/my-benefits');
console.log('  GET    /api/accounts/my-immigration');
console.log('  GET    /api/accounts/summary');

module.exports = router;