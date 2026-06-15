const express = require("express");
const router = express.Router();
const {
    testAPI,
    getAllResources,
    getResourceById,
    getResourceStats,
    getSyncStatus,
    manualSync,
    testDB,
    updateResourceStatus,
    getFilterOptions
} = require("../controllers/resourceController");

const { authenticateToken } = require("../../Recruitment/middleWare/authMiddleware");

console.log('📋 Loading Resource Management Routes...');

// Test endpoint - no auth required
router.get("/test", testAPI);

// Database test
router.get("/test-db", testDB);

// Apply authentication to all other routes
router.use(authenticateToken);

// Get all resources (with filtering)
router.get("/", getAllResources);

// Get resource statistics
router.get("/stats/dashboard", getResourceStats);

// Get filter options
router.get("/filters", getFilterOptions);

// Get sync status
router.get("/sync/status", getSyncStatus);

// Manual sync
router.post("/sync/manual", manualSync);
router.post("/sync/run", manualSync); // Alternative endpoint

// Update resource status
router.put("/:id/status", updateResourceStatus);

// Get resource by ID
router.get("/:id", getResourceById);


console.log('✅ Resource Management Routes registered');
console.log('  GET    /api/resource-management/test');
console.log('  GET    /api/resource-management/test-db');
console.log('  GET    /api/resource-management');
console.log('  GET    /api/resource-management/stats/dashboard');
console.log('  GET    /api/resource-management/filters');
console.log('  GET    /api/resource-management/sync/status');
console.log('  POST   /api/resource-management/sync/manual');
console.log('  POST   /api/resource-management/sync/run');
console.log('  PUT    /api/resource-management/:id/status');
console.log('  GET    /api/resource-management/:id');

module.exports = router;