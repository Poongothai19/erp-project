// ============================================================
// FILE: companies/routes/timesheetPermissionRoutes.js
// ============================================================
// Full complete code for timesheet permission routes
// Location: companies/routes/timesheetPermissionRoutes.js

const express = require("express");
const router = express.Router();

// Import the permission controller
const timesheetPermissionController = require("../controllers/timesheetPermissionController");

// Import auth middleware
const { authenticateToken } = require("../../Recruitment/middleWare/authMiddleware");

console.log('📋 Initializing timesheet permission routes...');

// ============================================================
// APPLY AUTHENTICATION TO ALL ROUTES
// ============================================================
router.use(authenticateToken);

// ============================================================
// REQUEST LOGGING MIDDLEWARE (for debugging)
// ============================================================
router.use((req, res, next) => {
  console.log(`[PERMISSION-ROUTE] ${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
  if (req.method === 'POST' || req.method === 'PUT') {
    console.log('[PERMISSION-ROUTE] Body:', JSON.stringify(req.body));
  }
  console.log('[PERMISSION-ROUTE] User ID:', req.user?.id);
  next();
});

// ============================================================
// 1. GET /api/timesheets/check-editing-permission
// ============================================================
// Description: Check if current employee can edit submitted timesheets
// Used By: InternalTimesheet component (frontend)
// Response: { success: true, allowEditing: true/false }
router.get("/check-editing-permission", (req, res, next) => {
  console.log('🔍 Route Handler: GET /check-editing-permission');
  console.log('   User ID:', req.user?.id);
  next();
}, timesheetPermissionController.checkEditingPermission);

// ============================================================
// 2. POST /api/timesheets/grant-editing-permission
// ============================================================
// Description: Grant or revoke editing permission for an employee
// Used By: EmployeeDetailsPage component (Manager)
// Body: { employeeId: "DEV3907", allowEditing: true/false }
// Response: { success: true, message: "...", data: {...} }
router.post("/grant-editing-permission", (req, res, next) => {
  console.log('🔓 Route Handler: POST /grant-editing-permission');
  console.log('   Employee ID:', req.body?.employeeId);
  console.log('   Allow Editing:', req.body?.allowEditing);
  console.log('   Manager ID:', req.user?.id);
  next();
}, timesheetPermissionController.grantEditingPermission);

// ============================================================
// 3. GET /api/timesheets/employee-permission/:employeeId
// ============================================================
// Description: Get editing permission status for specific employee (Manager view)
// Used By: EmployeeDetailsPage component (when viewing employee details)
// Params: employeeId (e.g., "DEV3907")
// Response: { success: true, hasPermission: true/false, allowEditing: true/false }
router.get("/employee-permission/:employeeId", (req, res, next) => {
  console.log('🔍 Route Handler: GET /employee-permission/:employeeId');
  console.log('   Employee ID:', req.params.employeeId);
  console.log('   Manager ID:', req.user?.id);
  next();
}, timesheetPermissionController.getEmployeeEditingPermission);

// ============================================================
// ERROR HANDLING MIDDLEWARE
// ============================================================
router.use((error, req, res, next) => {
  console.error('❌ [PERMISSION-ROUTE] Error Handler');
  console.error('   Error Message:', error.message);
  console.error('   Stack:', error.stack);
  console.error('   Path:', req.path);
  console.error('   Method:', req.method);

  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error in permission routes',
    error: error.message,
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

// ============================================================
// LOG ROUTE REGISTRATION
// ============================================================
console.log('✅ Timesheet permission routes loaded successfully');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📌 Registered Routes:');
console.log('   1️⃣  GET  /api/timesheets/check-editing-permission');
console.log('       └─ Check if current user can edit submitted timesheets');
console.log('       └─ Response: { allowEditing: true/false }');
console.log('');
console.log('   2️⃣  POST /api/timesheets/grant-editing-permission');
console.log('       └─ Manager grants/revokes permission for employee');
console.log('       └─ Body: { employeeId, allowEditing }');
console.log('');
console.log('   3️⃣  GET  /api/timesheets/employee-permission/:employeeId');
console.log('       └─ Get permission status for specific employee');
console.log('       └─ Param: employeeId (e.g., DEV3907)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');

// ============================================================
// EXPORTS
// ============================================================
module.exports = router;