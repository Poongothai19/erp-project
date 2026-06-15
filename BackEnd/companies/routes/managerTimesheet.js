const express = require('express');
const router = express.Router();
const managerTimesheetController = require('../controllers/managerTimesheetController');
const { authenticateToken } = require('../../Recruitment/middleWare/authMiddleware');
const { poolPromise, sql } = require('../../config/db');

/**
 * FILE: companies/routes/managerTimesheet.js
 * Manager Timesheet Approval Routes
 * Refactored for HRM Centralized Schema [hrm].[Timesheet]
 */

// Middleware to log all requests
router.use((req, res, next) => {
  console.log(`[MANAGER-TIMESHEET] ${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
  next();
});

// Apply authentication middleware
router.use(authenticateToken);

// Bulk operations
router.post('/bulk/approve', managerTimesheetController.bulkApproveTimesheets);
router.post('/bulk/reject', managerTimesheetController.bulkRejectTimesheets);

// All companies routes
router.get('/all/pending', managerTimesheetController.getPendingTimesheetsAllCompanies);

// Company-specific routes
router.get('/company/:companyId', managerTimesheetController.getCompanyTimesheets);
router.get('/company/:companyId/stats', managerTimesheetController.getTimesheetStats);
router.get('/company/:companyId/:timesheetId', managerTimesheetController.getTimesheetDetails);

// Status updates
router.patch('/company/:companyId/:timesheetId/approve', managerTimesheetController.approveTimesheet);
router.patch('/company/:companyId/:timesheetId/reject', managerTimesheetController.rejectTimesheet);

// Helper for legacy/shortcut routes that don't include companyId in URL
const handleStatusUpdate = async (req, res, action) => {
  try {
    const timesheetId = req.params.id;
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, parseInt(timesheetId))
      .query(`SELECT EntityId as CompanyId FROM [hrm].[Timesheet] WHERE TimesheetId = @id`);


    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Timesheet not found' });
    }

    req.params.companyId = result.recordset[0].CompanyId;
    req.params.timesheetId = timesheetId;

    if (action === 'approve') return managerTimesheetController.approveTimesheet(req, res);
    if (action === 'reject') return managerTimesheetController.rejectTimesheet(req, res);

    return res.status(400).json({ success: false, message: 'Invalid action' });
  } catch (error) {
    console.error(`Error in ${action} timesheet:`, error);
    res.status(500).json({ success: false, message: `Error during ${action}`, error: error.message });
  }
};

// Legacy routes for backward compatibility
router.post('/:id/approve', (req, res) => handleStatusUpdate(req, res, 'approve'));
router.post('/:id/reject', (req, res) => handleStatusUpdate(req, res, 'reject'));

router.patch('/:id/status', async (req, res) => {
  const { status } = req.body;
  const action = status === 'Approved' ? 'approve' : (status === 'Rejected' ? 'reject' : null);
  if (!action) return res.status(400).json({ success: false, message: 'Invalid status' });
  return handleStatusUpdate(req, res, action);
});

// Delete routes
router.delete('/company/:companyId/:timesheetId', managerTimesheetController.deleteTimesheet);
router.delete('/:id', async (req, res) => {
  req.params.timesheetId = req.params.id;
  return managerTimesheetController.deleteTimesheet(req, res);
});



module.exports = router;