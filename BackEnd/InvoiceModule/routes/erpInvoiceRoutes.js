const express = require('express');
const router = express.Router();
const erpInvoiceController = require('../controllers/erpInvoiceController');
const { authenticateToken } = require('../../Recruitment/middleWare/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for invoice attachments
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/invoice-attachments');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'invoice-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB limit
});

// Middleware to log all requests
router.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ERP Invoice Module Route: ${req.method} ${req.originalUrl}`);
  next();
});

// Apply authentication
router.use(authenticateToken);

// All endpoints relative to /api/erp-invoices
router.get('/', erpInvoiceController.getInvoices);
router.get('/next-number', erpInvoiceController.getNextInvoiceNumber);
router.get('/metadata', erpInvoiceController.getInvoiceMetadata);
router.get('/:id', erpInvoiceController.getInvoiceById);
router.post('/', upload.array('timesheets', 10), erpInvoiceController.createInvoice);
router.put('/:id', upload.array('timesheets', 10), erpInvoiceController.updateInvoice);
router.patch('/status/:id', erpInvoiceController.updateInvoiceStatus);
router.post('/send/:id', erpInvoiceController.sendInvoiceEmail);
router.delete('/:id', erpInvoiceController.deleteInvoice);
router.delete('/:id/attachments/:attachmentId', erpInvoiceController.deleteInvoiceAttachment);

// Error handling
router.use((error, req, res, next) => {
  console.error('ERP Invoice module route error:', error);
  res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
});

module.exports = router;