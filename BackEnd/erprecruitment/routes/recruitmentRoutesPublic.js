// File: ./erprecruitment/routes/recruitmentRoutesPublic.js

const express = require("express");
const router = express.Router();

// ✅ IMPORT ONLY PUBLIC FUNCTIONS
const { getPublicRoles, getPublicRoleById } = require("../controllers/recruitmentController");

// ✅ VERIFY FUNCTION IS IMPORTED
console.log('🔍 Checking public recruitment functions:');
console.log('  ✓ getPublicRoles:', typeof getPublicRoles === 'function' ? '✅' : '❌');
console.log('  ✓ getPublicRoleById:', typeof getPublicRoleById === 'function' ? '✅' : '❌');

// ✅ PUBLIC ROUTES - NO AUTHENTICATION REQUIRED
// Used by job portal at /api/recruitment

// Route: GET /api/recruitment/public/roles
router.get("/public/roles", (req, res, next) => {
  console.log('📍 Public roles route hit:', req.method, req.path);
  next();
}, getPublicRoles);

// Route: GET /api/recruitment/public/roles/:id
router.get("/public/roles/:id", (req, res, next) => {
  console.log('📍 Public role by id route hit:', req.method, req.path);
  next();
}, getPublicRoleById);

console.log('✅ Public recruitment routes configured');

module.exports = router;
