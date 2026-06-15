// routes/employeeRoutes.js - PRODUCTION FIXED VERSION
// ⚠️ CRITICAL: Route order matters! Specific routes MUST come before generic :id routes

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { authenticateToken } = require('../../Recruitment/middleWare/authMiddleware');

// ============================================
// MULTER CONFIGURATION
// ============================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/reports');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'report-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      '.pdf', '.xlsx', '.xls', '.csv', '.doc', '.docx', 
      '.txt', '.jpg', '.jpeg', '.png', '.gif', '.zip', '.rar'
    ];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, Excel, CSV, Word, Images, ZIP files are allowed.'));
    }
  }
});

// ============================================
// MIDDLEWARE
// ============================================

// Request logging middleware
router.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] Employee Route: ${req.method} ${req.originalUrl}`);
  if (process.env.NODE_ENV !== 'production') {
    console.log('Query params:', req.query);
    console.log('Route params:', req.params);
    if (req.method !== 'GET') {
      console.log('Body:', req.body);
    }
  }
  next();
});

// ============================================
// HEALTH CHECK & CONNECTION TEST
// ============================================
router.get('/test/connection', employeeController.testConnection);

// ============================================
// LOCATION LOOKUP ENDPOINTS
// ============================================
router.get('/locations/countries', employeeController.getCountries);
router.get('/locations/states', employeeController.getStates);
router.get('/locations/cities', employeeController.getCities);

// ✅ Apply authentication to ALL OTHER employee routes
router.use(authenticateToken);

// ============================================
// COMPANY-LEVEL ENDPOINTS (NO :employeeId)
// ============================================
// Must come BEFORE any :employeeId routes
router.get('/company/:companyId/search', employeeController.searchEmployees);
router.get('/company/:companyId/stats', employeeController.getEmployeeStats);
router.get('/company/:companyId/department/:department', employeeController.getEmployeesByDepartment);

// GET all employees & POST new employee
router.get('/company/:companyId', employeeController.getAllEmployees);
router.post('/company/:companyId', employeeController.createEmployee);

// ============================================
// IMPORTANT: SPECIFIC ROUTES BEFORE :employeeId
// ============================================
// These MUST come before router.get('/company/:companyId/:employeeId', ...)
// Otherwise the catch-all :employeeId route will intercept them!

// --- DETAIL ROUTES ---
router.get('/company/:companyId/:employeeId/details', employeeController.getEmployeeDetails);

// --- TIMESHEET ROUTES ---
router.get('/company/:companyId/:employeeId/timesheets', employeeController.getEmployeeTimesheets);

// --- EXTERNAL TIMESHEET ROUTES ---
router.get('/company/:companyId/:employeeId/external-timesheets', 
  employeeController.getEmployeeExternalTimesheets);
router.post('/company/:companyId/:employeeId/external-timesheets/:timesheetId/approve',
  employeeController.approveExternalTimesheet);
router.post('/company/:companyId/:employeeId/external-timesheets/:timesheetId/reject',
  employeeController.rejectExternalTimesheet);
router.get('/company/:companyId/:employeeId/external-timesheets/:timesheetId/download',
  employeeController.downloadExternalTimesheet);
router.delete('/company/:companyId/:employeeId/external-timesheets/:timesheetId', 
  employeeController.deleteExternalTimesheet);

// --- PAYROLL INFO ROUTES ---
router.get('/company/:companyId/:employeeId/payroll-info', 
  employeeController.getEmployeePayrollInfo);
router.put('/company/:companyId/:employeeId/payroll-info', 
  employeeController.updateEmployeePayrollInfo);
router.get('/company/:companyId/:employeeId/pay-structure-data', 
  employeeController.getEmployeePayStructureData);

// --- STATEMENT/PAYROLL ROUTES ---
router.get('/company/:companyId/:employeeId/statements', employeeController.getEmployeeStatements);
router.post('/company/:companyId/:employeeId/statements', employeeController.createStatement);
router.post('/company/:companyId/:employeeId/statements/upload-file',
  upload.single('file'),
  employeeController.uploadPayrollStatementFile);
router.put('/company/:companyId/:employeeId/statements/:statementId', employeeController.updateStatement);
router.delete('/company/:companyId/:employeeId/statements/:statementId', 
  employeeController.deleteStatement);

// --- REPORT ROUTES ---
router.get('/company/:companyId/:employeeId/reports', employeeController.getEmployeeReports);
router.post('/company/:companyId/:employeeId/reports', upload.single('file'), employeeController.uploadReport);
router.delete('/company/:companyId/:employeeId/reports/:reportId', 
  employeeController.deleteReport);

// ============================================
// GENERIC EMPLOYEE CRUD ROUTES
// ============================================
// IMPORTANT: These MUST come LAST, after all specific routes!
// Otherwise they will intercept specific routes like /details, /timesheets, etc.

router.get('/company/:companyId/:employeeId', employeeController.getEmployeeById);
router.put('/company/:companyId/:employeeId', employeeController.updateEmployee);
router.patch('/company/:companyId/:employeeId/status', 
  employeeController.updateEmployeeStatus);
router.delete('/company/:companyId/:employeeId', employeeController.deleteEmployee);

// ============================================
// ERROR HANDLING MIDDLEWARE
// ============================================

// Multer-specific error handling
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    console.error('❌ Multer error:', error.code, error.message);
    
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 50MB.'
      });
    }
    
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected file field. Please check the upload form.'
      });
    }
  }
  
  if (error.message && error.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  // File system errors
  if (error.code === 'ENOENT') {
    console.error('❌ File system error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Upload directory error. Please contact administrator.'
    });
  }
  
  if (error.code === 'EACCES') {
    console.error('❌ Permission error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'File permission error. Please contact administrator.'
    });
  }
  
  console.error('❌ Employee route error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error in employee routes',
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
  });
});

// 404 handler for employee routes
router.use('*', (req, res) => {
  console.warn(`❌ Employee route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: 'Employee API endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

// ============================================
// ROUTE REGISTRATION LOG
// ============================================

if (process.env.NODE_ENV !== 'production') {
  console.log('✅ Employee routes registered successfully');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('REGISTERED EMPLOYEE ROUTES:');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  console.log('HEALTH:');
  console.log('  GET    /api/employees/test/connection');
  console.log('');
  console.log('SEARCH & STATS (Company Level):');
  console.log('  GET    /api/employees/company/:companyId');
  console.log('  POST   /api/employees/company/:companyId');
  console.log('  GET    /api/employees/company/:companyId/search');
  console.log('  GET    /api/employees/company/:companyId/stats');
  console.log('  GET    /api/employees/company/:companyId/department/:department');
  console.log('');
  console.log('EMPLOYEE DETAILS (Specific Routes - must come before generic :employeeId):');
  console.log('  GET    /api/employees/company/:companyId/:employeeId/details');
  console.log('');
  console.log('TIMESHEETS:');
  console.log('  GET    /api/employees/company/:companyId/:employeeId/timesheets');
  console.log('');
  console.log('EXTERNAL TIMESHEETS:');
  console.log('  GET    /api/employees/company/:companyId/:employeeId/external-timesheets');
  console.log('  POST   /api/employees/company/:companyId/:employeeId/external-timesheets/:timesheetId/approve');
  console.log('  POST   /api/employees/company/:companyId/:employeeId/external-timesheets/:timesheetId/reject');
  console.log('  GET    /api/employees/company/:companyId/:employeeId/external-timesheets/:timesheetId/download');
  console.log('  DELETE /api/employees/company/:companyId/:employeeId/external-timesheets/:timesheetId');
  console.log('');
  console.log('PAYROLL:');
  console.log('  GET    /api/employees/company/:companyId/:employeeId/payroll-info');
  console.log('  PUT    /api/employees/company/:companyId/:employeeId/payroll-info');
  console.log('  GET    /api/employees/company/:companyId/:employeeId/pay-structure-data');
  console.log('');
  console.log('STATEMENTS:');
  console.log('  GET    /api/employees/company/:companyId/:employeeId/statements');
  console.log('  POST   /api/employees/company/:companyId/:employeeId/statements');
  console.log('  POST   /api/employees/company/:companyId/:employeeId/statements/upload-file');
  console.log('  PUT    /api/employees/company/:companyId/:employeeId/statements/:statementId');
  console.log('  DELETE /api/employees/company/:companyId/:employeeId/statements/:statementId');
  console.log('');
  console.log('REPORTS:');
  console.log('  GET    /api/employees/company/:companyId/:employeeId/reports');
  console.log('  POST   /api/employees/company/:companyId/:employeeId/reports');
  console.log('  DELETE /api/employees/company/:companyId/:employeeId/reports/:reportId');
  console.log('');
  console.log('GENERIC CRUD (must come AFTER specific routes):');
  console.log('  GET    /api/employees/company/:companyId/:employeeId');
  console.log('  PUT    /api/employees/company/:companyId/:employeeId');
  console.log('  PATCH  /api/employees/company/:companyId/:employeeId/status');
  console.log('  DELETE /api/employees/company/:companyId/:employeeId');
  console.log('═══════════════════════════════════════════════════════════════');
}

module.exports = router;