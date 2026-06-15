// ============================================================
// FILE: Accounts/routes/timesheetRoutes.js
// ============================================================

const express = require("express");
const router = express.Router();
const {
  getUserTimesheets,
  getTimesheetById,
  saveInternalTimesheet,
  submitTimesheet,
  uploadExternalTimesheet,
  getUploadHistory,
  downloadExternalTimesheet,
  uploadMiddleware,
  deleteExternalTimesheet,
  getTimesheetEntries,
  deleteTimesheet,
  getSubmittedWeeks,
  markWeekSubmitted,
} = require("../controllers/timesheetController");

const {
  checkEditingPermission
} = require("../../companies/controllers/timesheetPermissionController");

const { authenticateToken } = require("../../Recruitment/middleWare/authMiddleware");

console.log('📋 Loading USER timesheet routes...');

// Apply authentication to all routes
router.use(authenticateToken);

// Request logging middleware
router.use((req, res, next) => {
  console.log(`[USER-TIMESHEET] ${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
  next();
});

// ========================================
// IMPORTANT: Specific routes BEFORE generic parameterized routes
// ========================================

// GET /api/timesheets/check-editing-permission
router.get("/check-editing-permission", checkEditingPermission);

// GET /api/timesheets/history - Get external upload history
router.get("/history", getUploadHistory);

// POST /api/timesheets/internal - Save internal timesheet
router.post("/internal", saveInternalTimesheet);

// POST /api/timesheets/external - Upload external timesheet file
router.post("/external", uploadMiddleware, uploadExternalTimesheet);

// ========================================
// Parameterized routes
// ========================================

// GET /api/timesheets/:id/entries
router.get("/:id/entries", getTimesheetEntries);

// GET /api/timesheets/:id/submitted-weeks
router.get("/:id/submitted-weeks", getSubmittedWeeks);

// POST /api/timesheets/:id/mark-week-submitted
router.post("/:id/mark-week-submitted", markWeekSubmitted);

// GET /api/timesheets/:id/download - Download external file
router.get("/:id/download", downloadExternalTimesheet);

// PUT /api/timesheets/:id/submit - Submit for approval
router.put("/:id/submit", submitTimesheet);

// DELETE /api/timesheets/:id
router.delete("/:id", deleteTimesheet);

// GET /api/timesheets/:id (MUST BE LAST parameterized)
router.get("/:id", getTimesheetById);

// GET /api/timesheets/ (MUST BE LAST)
router.get("/", getUserTimesheets);

// Error handling
router.use((error, req, res, next) => {
  console.error('❌ Timesheet route error:', error);
  res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
});

console.log('✅ User timesheet routes registered successfully');

module.exports = router;