// // routes/vendorRoutes.js
// const express = require('express');
// const router = express.Router();
// const vendorController = require('../controllers/vendorController');
// const authMiddleware = require('../../Recruitment/middleWare/authMiddleware');

// // Apply authentication middleware to all routes
// router.use(authMiddleware);

// // GET /api/vendors - Get all vendors
// router.get('/', vendorController.getAllVendors);

// // GET /api/vendors/:id - Get single vendor by ID
// router.get('/:id', vendorController.getVendorById);

// // POST /api/vendors - Create new vendor
// router.post('/', vendorController.createVendor);

// // PUT /api/vendors/:id - Update vendor
// router.put('/:id', vendorController.updateVendor);

// // DELETE /api/vendors/:id - Delete vendor
// router.delete('/:id', vendorController.deleteVendor);

// module.exports = router;







// // routes/vendorRoutes.js
// const express = require('express');
// const router = express.Router();
// const vendorController = require('../controllers/vendorController');

// // Try these common paths for authMiddleware:
// // const authMiddleware = require('../../middleware/authMiddleware');
// // const authMiddleware = require('../../Recruitment/middleware/authMiddleware');
// // const authMiddleware = require('../../common/authMiddleware');

// // Load authMiddleware with proper error handling
// let authMiddleware;
// try {
//   const authModule = require('../../Recruitment/middleWare/authMiddleware');
//   console.log('✅ AuthMiddleware loaded, type:', typeof authModule);
//   console.log('📋 AuthMiddleware keys:', Object.keys(authModule || {}));
  
//   // Check if it's a function directly or if we need to extract it
//   if (typeof authModule === 'function') {
//     authMiddleware = authModule;
//   } else if (authModule && typeof authModule.authMiddleware === 'function') {
//     authMiddleware = authModule.authMiddleware;
//   } else if (authModule && typeof authModule.authenticate === 'function') {
//     authMiddleware = authModule.authenticate;
//   } else if (authModule && typeof authModule.verifyToken === 'function') {
//     authMiddleware = authModule.verifyToken;
//   } else {
//     throw new Error('No valid middleware function found in authMiddleware module');
//   }
  
//   router.use(authMiddleware);
//   console.log('🔐 Authentication middleware applied successfully');
// } catch (error) {
//   console.error('❌ Failed to apply authMiddleware:', error.message);
//   console.log('📝 Continuing without authentication...');
// }

// // GET /api/vendors - Get all vendors
// router.get('/', vendorController.getAllVendors);

// // GET /api/vendors/:id - Get single vendor by ID
// router.get('/:id', vendorController.getVendorById);

// // POST /api/vendors - Create new vendor
// router.post('/', vendorController.createVendor);

// // PUT /api/vendors/:id - Update vendor
// router.put('/:id', vendorController.updateVendor);

// // DELETE /api/vendors/:id - Delete vendor
// router.delete('/:id', vendorController.deleteVendor);

// module.exports = router;








// routes/vendorRoutes.js
const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendorController');

// Load authMiddleware with proper error handling
let authMiddleware;
try {
  const authModule = require('../../Recruitment/middleWare/authMiddleware');
  console.log('✅ AuthMiddleware loaded, type:', typeof authModule);
  console.log('📋 AuthMiddleware keys:', Object.keys(authModule || {}));
 
  // Check if it's a function directly or if we need to extract it
  if (typeof authModule === 'function') {
    authMiddleware = authModule;
  } else if (authModule && typeof authModule.authMiddleware === 'function') {
    authMiddleware = authModule.authMiddleware;
  } else if (authModule && typeof authModule.authenticate === 'function') {
    authMiddleware = authModule.authenticate;
  } else if (authModule && typeof authModule.verifyToken === 'function') {
    authMiddleware = authModule.verifyToken;
  } else {
    throw new Error('No valid middleware function found in authMiddleware module');
  }
 
  router.use(authMiddleware);
  console.log('🔐 Authentication middleware applied successfully');
} catch (error) {
  console.error('❌ Failed to apply authMiddleware:', error.message);
  console.log('📝 Continuing without authentication...');
}

// GET /api/vendors/stats - Get vendor statistics (MUST come before /:id route)
router.get('/stats', vendorController.getVendorStats);

// GET /api/vendors - Get all vendors
router.get('/', vendorController.getAllVendors);

// GET /api/vendors/:id - Get single vendor by ID
router.get('/:id', vendorController.getVendorById);

// POST /api/vendors - Create new vendor
router.post('/', vendorController.createVendor);

// POST /api/vendors/bulk-import - Bulk import vendors
router.post('/bulk-import', vendorController.bulkImportVendors);

// PUT /api/vendors/:id - Update vendor
router.put('/:id', vendorController.updateVendor);

// DELETE /api/vendors/:id - Delete vendor
router.delete('/:id', vendorController.deleteVendor);

module.exports = router;