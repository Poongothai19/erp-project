// routes/companyRoutes.js - Fixed Error Handling for Logo Upload

const multer = require('multer');
const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');
const { authenticateToken } = require('../../Recruitment/middleWare/authMiddleware');

// Configure multer with MEMORY STORAGE
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Check if file is an image
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// ============================================================
// CUSTOM MIDDLEWARE FOR MULTER ERROR HANDLING
// ============================================================
const uploadMiddleware = (req, res, next) => {
  upload.single('logo')(req, res, function(err) {
    // Handle multer errors
    if (err instanceof multer.MulterError) {
      console.error('❌ Multer Error:', err.message);
      
      if (err.code === 'FILE_TOO_LARGE') {
        return res.status(400).json({
          success: false,
          message: 'File too large. Maximum size is 5MB'
        });
      }
      
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          success: false,
          message: 'Only one file can be uploaded'
        });
      }
      
      return res.status(400).json({
        success: false,
        message: `File upload error: ${err.message}`
      });
    }
    
    // Handle other errors (e.g., file filter errors)
    if (err) {
      console.error('❌ Upload Error:', err.message);
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload failed'
      });
    }
    
    // Check if file exists
    if (!req.file) {
      console.warn('⚠️  No file provided in upload');
      return res.status(400).json({
        success: false,
        message: 'No file was uploaded. Please select an image file.'
      });
    }
    
    console.log('✅ File uploaded successfully:', {
      originalname: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
    
    // Everything is fine, move to next middleware
    next();
  });
};

// Middleware to log all requests
router.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Apply authentication middleware to all routes except test endpoints
router.use((req, res, next) => {
  // Skip auth for test endpoints and logo retrieval (GET)
  if (req.path === '/test/connection' || (req.path.includes('/logo') && req.method === 'GET')) {
    return next();
  }
  return authenticateToken(req, res, next);
});

// ============================================================
// LOGO ROUTES - WITH PROPER ERROR HANDLING
// ============================================================

// POST /api/companies/:id/upload-logo - Upload company logo with error handling
router.post('/:id/upload-logo', uploadMiddleware, async (req, res, next) => {
  try {
    await companyController.uploadCompanyLogo(req, res);
  } catch (error) {
    console.error('❌ Upload controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading logo',
      error: error.message
    });
  }
});

// GET /api/companies/:id/logo - Retrieve logo image from database
router.get('/:id/logo', async (req, res, next) => {
  try {
    await companyController.getCompanyLogo(req, res);
  } catch (error) {
    console.error('❌ Get logo error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving logo',
      error: error.message
    });
  }
});

// DELETE /api/companies/:id/logo - Delete company logo from database
router.delete('/:id/logo', async (req, res, next) => {
  try {
    await companyController.deleteCompanyLogo(req, res);
  } catch (error) {
    console.error('❌ Delete logo error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting logo',
      error: error.message
    });
  }
});

// ============================================================
// COMPANY CRUD ROUTES
// ============================================================

// TEST ENDPOINT - Check database connection (no auth required)
router.get('/test/connection', companyController.testConnection);

// GET /api/companies - Get all companies
router.get('/', companyController.getAllCompanies);

// GET /api/companies/:id - Get single company by ID
router.get('/:id', companyController.getCompanyById);

// POST /api/companies - Create new company
router.post('/', companyController.createCompany);

// PUT /api/companies/:id - Update company
router.put('/:id', companyController.updateCompany);

// PATCH /api/companies/:id/status - Update company status only
router.patch('/:id/status', companyController.updateCompanyStatus);

// DELETE /api/companies/:id - Delete company
router.delete('/:id', companyController.deleteCompany);

// ============================================================
// UTILITY ROUTES
// ============================================================

// GET /api/companies/filter/status/:status - Get companies by status
router.get('/filter/status/:status', companyController.getCompaniesByStatus);

// GET /api/companies/manager/:managerId - Get companies by account manager
router.get('/manager/:managerId', companyController.getCompaniesByManager);

// GET /api/companies/search - Search companies
router.get('/search', companyController.searchCompanies);

// GET /api/companies/stats - Get company statistics
router.get('/stats', companyController.getCompanyStats);

// GET /api/companies/payroll/due - Get companies with payroll due soon
router.get('/payroll/due', companyController.getCompaniesWithPayrollDue);

// POST /api/companies/:id/send-reminder - Send payroll reminder
router.post('/:id/send-reminder', companyController.sendPayrollReminder);

// GET /api/companies/:id/export - Export company data
router.get('/:id/export', companyController.exportCompanyData);

// ============================================================
// ERROR HANDLING MIDDLEWARE
// ============================================================
router.use((error, req, res, next) => {
  console.error('❌ Route error:', error);
  console.error('Error message:', error.message);
  console.error('Stack:', error.stack);
  
  // Multer errors
  if (error instanceof multer.MulterError) {
    if (error.code === 'FILE_TOO_LARGE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB'
      });
    }
    return res.status(400).json({
      success: false,
      message: 'File upload error: ' + error.message
    });
  }
  
  if (error.message === 'Only image files are allowed') {
    return res.status(400).json({
      success: false,
      message: 'Only image files (PNG, JPG, GIF, WebP) are allowed'
    });
  }
  
  // Generic error
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
  });
});

module.exports = router;