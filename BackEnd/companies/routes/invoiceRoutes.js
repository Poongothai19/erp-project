// routes/invoiceRoutes.js - Invoice Management Routes
const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const { authenticateToken } = require('../../Recruitment/middleWare/authMiddleware');

// Middleware to log all requests
router.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] Invoice Management Route: ${req.method} ${req.originalUrl}`);
  console.log('Query params:', req.query);
  if (req.method !== 'GET') {
    console.log('Body:', req.body);
  }
  next();
});

// Apply authentication middleware to all routes
router.use(authenticateToken);

// IMPORTANT: More specific routes MUST come BEFORE generic routes with parameters

// GET /api/invoices/company/:companyId/stats - Get invoice statistics for a company
router.get('/company/:companyId/stats', invoiceController.getInvoiceStats);

// POST /api/invoices/company/:companyId - Create new invoice
router.post('/company/:companyId', invoiceController.createInvoice);

// GET /api/invoices/company/:companyId - Get all invoices for a company
router.get('/company/:companyId', invoiceController.getCompanyInvoices);

// GET /api/invoices/company/:companyId/:invoiceId - Get specific invoice details
router.get('/company/:companyId/:invoiceId', invoiceController.getInvoiceDetails);

// PUT /api/invoices/company/:companyId/:invoiceId - Update invoice
router.put('/company/:companyId/:invoiceId', invoiceController.updateInvoice);

// PATCH /api/invoices/company/:companyId/:invoiceId/status - Update invoice status
router.patch('/company/:companyId/:invoiceId/status', invoiceController.updateInvoiceStatus);

// DELETE /api/invoices/company/:companyId/:invoiceId - Delete invoice
router.delete('/company/:companyId/:invoiceId', invoiceController.deleteInvoice);

// Error handling middleware
router.use((error, req, res, next) => {
  console.error('Invoice management route error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error in invoice management routes',
    error: error.message
  });
});

console.log('✅ Invoice management routes registered successfully');

module.exports = router;