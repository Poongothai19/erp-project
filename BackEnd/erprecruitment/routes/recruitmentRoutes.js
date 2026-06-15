

// // const express = require("express");
// // const router = express.Router();
// // const {
// //   getAllRoles,
// //   getRoleById,
// //   createRole,
// //   updateRole,
// //   deleteRole,
// //   assignMultipleRecruiters,
// //   getRoleRecruiters,
// //   downloadRolesReport
// // } = require("../controllers/recruitmentController");
// // const { authenticateToken } = require("../../Recruitment/middleWare/authMiddleware");

// // // Add logging to verify the function exists
// // console.log('downloadRolesReport function exists:', typeof downloadRolesReport === 'function');

// // // Export route - MUST be first to avoid conflicts
// // router.get("/export/report", (req, res, next) => {
// //   console.log('Export route hit:', req.method, req.path);
// //   console.log('User:', req.user ? req.user.username : 'No user');
// //   next();
// // }, authenticateToken, downloadRolesReport);

// // // Add a test route to verify the path works
// // router.get("/test-export", authenticateToken, (req, res) => {
// //   res.json({ 
// //     message: "Test export route works", 
// //     user: req.user.username,
// //     role: req.user.role 
// //   });
// // });

// // // Add this to recruitmentRoutes.js - after the existing export route
// // router.get("/export/recruiter-performance", authenticateToken, (req, res, next) => {
// //   console.log('Recruiter performance export route hit:', req.method, req.path);
// //   console.log('User:', req.user ? req.user.username : 'No user');
// //   next();
// // }, (req, res) => {
// //   // Use the function directly from the controller
// //   const controller = require("../controllers/recruitmentController");
// //   controller.downloadRecruiterPerformanceReport(req, res);
// // });
// // // Other routes
// // router.get("/", authenticateToken, getAllRoles);
// // router.post("/", authenticateToken, createRole);
// // router.get("/:id", authenticateToken, getRoleById);
// // router.put("/:id", authenticateToken, updateRole);
// // router.delete("/:id", authenticateToken, deleteRole);
// // router.post("/:id/assign-multiple-recruiters", authenticateToken, assignMultipleRecruiters);
// // router.get("/:id/recruiters", authenticateToken, getRoleRecruiters);
// // // Add notification routes
// // router.get("/notifications/all", authenticateToken, getNotifications);
// // router.put("/notifications/:id/read", authenticateToken, markNotificationAsRead);
// // router.put("/notifications/mark-all-read", authenticateToken, markAllNotificationsAsRead);
// // router.get("/notifications/unread-count", authenticateToken, getUnreadCount);
// // module.exports = router;



// const express = require("express");
// const router = express.Router();
// const {
//   getAllRoles,
//   getRoleById,
//   createRole,
//   updateRole,
//   deleteRole,
//   assignMultipleRecruiters,
//   getRoleRecruiters,
//   downloadRolesReport,
//   downloadRecruiterPerformanceReport,
//   // ✅ ADD THESE NOTIFICATION FUNCTIONS:
//   getNotifications,
//   markNotificationAsRead,
//   markAllNotificationsAsRead,
//   getUnreadCount
// } = require("../controllers/recruitmentController");
// const { authenticateToken } = require("../../Recruitment/middleWare/authMiddleware");

// // Add logging to verify the function exists
// console.log('downloadRolesReport function exists:', typeof downloadRolesReport === 'function');

// // ✅ NOTIFICATION ROUTES - MUST BE ADDED BEFORE OTHER ROUTES
// router.get("/notifications/all", authenticateToken, getNotifications);
// router.put("/notifications/:id/read", authenticateToken, markNotificationAsRead);
// router.put("/notifications/mark-all-read", authenticateToken, markAllNotificationsAsRead);
// router.get("/notifications/unread-count", authenticateToken, getUnreadCount);

// // Export route - MUST be first to avoid conflicts
// router.get("/export/report", (req, res, next) => {
//   console.log('Export route hit:', req.method, req.path);
//   console.log('User:', req.user ? req.user.username : 'No user');
//   next();
// }, authenticateToken, downloadRolesReport);

// // Add a test route to verify the path works
// router.get("/test-export", authenticateToken, (req, res) => {
//   res.json({ 
//     message: "Test export route works", 
//     user: req.user.username,
//     role: req.user.role 
//   });
// });

// // Add this to recruitmentRoutes.js - after the existing export route
// router.get("/export/recruiter-performance", authenticateToken, (req, res, next) => {
//   console.log('Recruiter performance export route hit:', req.method, req.path);
//   console.log('User:', req.user ? req.user.username : 'No user');
//   next();
// }, (req, res) => {
//   // Use the function directly from the controller
//   const controller = require("../controllers/recruitmentController");
//   controller.downloadRecruiterPerformanceReport(req, res);
// });

// // Other routes
// router.get("/", authenticateToken, getAllRoles);
// router.post("/", authenticateToken, createRole);
// router.get("/:id", authenticateToken, getRoleById);
// router.put("/:id", authenticateToken, updateRole);
// router.delete("/:id", authenticateToken, deleteRole);
// router.post("/:id/assign-multiple-recruiters", authenticateToken, assignMultipleRecruiters);
// router.get("/:id/recruiters", authenticateToken, getRoleRecruiters);

// module.exports = router;



const express = require("express");
const router = express.Router();
const {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  assignMultipleRecruiters,
  getRoleRecruiters,
  downloadRolesReport,
  downloadRecruiterPerformanceReport,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadCount,
 
} = require("../controllers/recruitmentController");
const { authenticateToken } = require("../../Recruitment/middleWare/authMiddleware");

// Add logging to verify the function exists
console.log('downloadRolesReport function exists:', typeof downloadRolesReport === 'function');

// ✅ NOTIFICATION ROUTES - MUST BE ADDED BEFORE OTHER ROUTES
router.get("/notifications/all", authenticateToken, getNotifications);
router.put("/notifications/:id/read", authenticateToken, markNotificationAsRead);
router.put("/notifications/mark-all-read", authenticateToken, markAllNotificationsAsRead);
router.get("/notifications/unread-count", authenticateToken, getUnreadCount);

// Export route - MUST be first to avoid conflicts
router.get("/export/report", (req, res, next) => {
  console.log('Export route hit:', req.method, req.path);
  console.log('User:', req.user ? req.user.username : 'No user');
  next();
}, authenticateToken, downloadRolesReport);

// Add a test route to verify the path works
router.get("/test-export", authenticateToken, (req, res) => {
  res.json({ 
    message: "Test export route works", 
    user: req.user.username,
    role: req.user.role 
  });
});

// Add this to recruitmentRoutes.js - after the existing export route
router.get("/export/recruiter-performance", authenticateToken, (req, res, next) => {
  console.log('Recruiter performance export route hit:', req.method, req.path);
  console.log('User:', req.user ? req.user.username : 'No user');
  next();
}, (req, res) => {
  // Use the function directly from the controller
  const controller = require("../controllers/recruitmentController");
  controller.downloadRecruiterPerformanceReport(req, res);
});

// Other routes
router.get("/", authenticateToken, getAllRoles);
router.post("/", authenticateToken, createRole);
router.get("/:id", authenticateToken, getRoleById);
router.put("/:id", authenticateToken, updateRole);
router.delete("/:id", authenticateToken, deleteRole);
router.post("/:id/assign-multiple-recruiters", authenticateToken, assignMultipleRecruiters);
router.get("/:id/recruiters", authenticateToken, getRoleRecruiters);

// ✅ ADD COPY ROLE ROUTE


module.exports = router;