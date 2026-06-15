const express = require("express");
const router = express.Router();
const multer = require("multer");
const { authenticateToken } = require("../../Recruitment/middleWare/authMiddleware");
const employeeDocumentController = require("../controllers/employeeDocumentController");

// Use memory storage to handle file buffers for S3 upload
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

/**
 * @route   POST /api/employee-documents/upload
 * @desc    Upload an employee document to S3 and save metadata
 * @access  Private
 */
router.post(
  "/upload", 
  authenticateToken, 
  upload.single("file"), 
  employeeDocumentController.uploadEmployeeDocument
);

/**
 * @route   GET /api/employee-documents/:employeeId
 * @desc    Get all documents for a specific employee
 * @access  Private
 */
router.get(
  "/:employeeId", 
  authenticateToken, 
  employeeDocumentController.getEmployeeDocuments
);

/**
 * @route   DELETE /api/employee-documents/:id
 * @desc    Soft delete an employee document
 * @access  Private
 */
router.delete(
  "/:id", 
  authenticateToken, 
  employeeDocumentController.deleteEmployeeDocument
);

module.exports = router;
