// const express = require("express");
// const router = express.Router();
// const {
//   createApplication,
//   updateApplicationStatus,
//   updateApplicationStatusWithNotes, // Add this
//   getApplicationHiringSteps,
//   uploadResume,
//   serveResumeFromDB,
//   serveResumeFromFile,
//   getApplicationsWithResumes,
//   editApplication,
//   deleteApplication,
//   updateApplication,
//   deleteApplicationResume,
//   getApplicationResumes,
//   saveStepNotes, // Add this
//   getApplicationStepNotes, // Add this
//   getStepNotes // Add this
// } = require("../controllers/applicationController");
// const { authenticateToken } = require("../../Recruitment/middleWare/authMiddleware");

// // Application CRUD operations
// router.post("/", authenticateToken, uploadResume, createApplication);
// router.put("/:id/status", authenticateToken, updateApplicationStatusWithNotes); // Updated
// router.get("/hiring-steps", authenticateToken, getApplicationHiringSteps);

// // Step notes routes
// router.post("/step-notes", authenticateToken, saveStepNotes);
// router.get("/:applicationId/step-notes", authenticateToken, getApplicationStepNotes);
// router.get("/:applicationId/step-notes/:stepIndex", authenticateToken, getStepNotes);

// // Serve resume routes
// router.get("/:applicationId/resume/:resumeId", authenticateToken, serveResumeFromDB);
// router.get("/resumes/:filename", authenticateToken, serveResumeFromFile);

// // Get applications with resume information
// router.get("/role/:roleId/with-resumes", authenticateToken, getApplicationsWithResumes);

// // Get all resumes for an application
// router.get("/:applicationId/resumes", authenticateToken, getApplicationResumes);

// // Delete a specific resume
// router.delete("/resumes/:resumeId", authenticateToken, deleteApplicationResume);

// // Edit and delete application routes
// router.put("/:id", authenticateToken, uploadResume, updateApplication);
// router.delete("/:id", authenticateToken, deleteApplication);

// module.exports = router;



const express = require("express");
const router = express.Router();
const {
  createApplication,
  updateApplicationStatus,
  updateApplicationStatusWithNotes,
  getApplicationHiringSteps,
  uploadResume,
  serveResumeFromDB,
  serveResumeFromFile,
  getApplicationsWithResumes,
  editApplication,
  deleteApplication,
  updateApplication,
  deleteApplicationResume,
  getApplicationResumes,
  saveStepNotes,
  getApplicationStepNotes,
  getStepNotes,
  // Add the new functions
  getAvailableUsers,
  assignScreeningTask,
  getScreeningAssignments,
  completeScreening
} = require("../controllers/applicationController");
const { authenticateToken } = require("../../Recruitment/middleWare/authMiddleware");

// Application CRUD operations
router.post("/", authenticateToken, uploadResume, createApplication);
router.put("/:id/status", authenticateToken, updateApplicationStatusWithNotes);
router.get("/hiring-steps", authenticateToken, getApplicationHiringSteps);

// Step notes routes
router.post("/step-notes", authenticateToken, saveStepNotes);
router.get("/:applicationId/step-notes", authenticateToken, getApplicationStepNotes);
router.get("/:applicationId/step-notes/:stepIndex", authenticateToken, getStepNotes);

// Screening assignment routes
router.get("/users/available", authenticateToken, getAvailableUsers);
router.post("/assign-screening", authenticateToken, assignScreeningTask);
router.get("/screening-assignments", authenticateToken, getScreeningAssignments);
router.post("/complete-screening", authenticateToken, completeScreening);

// Serve resume routes
router.get("/:applicationId/resume/:resumeId", authenticateToken, serveResumeFromDB);
router.get("/resumes/:filename", authenticateToken, serveResumeFromFile);

// Get applications with resume information
router.get("/role/:roleId/with-resumes", authenticateToken, getApplicationsWithResumes);

// Get all resumes for an application
router.get("/:applicationId/resumes", authenticateToken, getApplicationResumes);

// Delete a specific resume
router.delete("/resumes/:resumeId", authenticateToken, deleteApplicationResume);

// Edit and delete application routes
router.put("/:id", authenticateToken, uploadResume, updateApplication);
router.delete("/:id", authenticateToken, deleteApplication);

module.exports = router;