const express = require('express');
const router = express.Router();
const multer = require('multer');
const onboardingWorkflowEmployeeController = require('../controllers/onboardingWorkflowEmployeeController');
const { authenticateToken } = require('../../Recruitment/middleWare/authMiddleware');

// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPEG, PNG, and DOC/DOCX files are allowed.'));
    }
  }
});

// ✅ PUBLIC ROUTES - No authentication required for candidate signing
// Get signing session (for the public sign page)
router.get(
  '/company/:companyId/:employeeId/signing-session/:stepId',
  onboardingWorkflowEmployeeController.getSigningSession
);

// DocuSign Webhook (for status updates)
router.post(
  '/docusign-webhook',
  onboardingWorkflowEmployeeController.docusignWebhook
);

// Apply authentication to all following routes
router.use(authenticateToken);

// ✅ Get workflow employee by username (for candidate dashboard - PRIMARY LOOKUP)
// MUST be before /company/:companyId routes to avoid param conflicts
router.get('/username/:username', onboardingWorkflowEmployeeController.getWorkflowEmployeeByUsername);

// Get workflow employee by email (legacy - kept for compatibility)
router.get('/email/:email', onboardingWorkflowEmployeeController.getWorkflowEmployeeByEmail);

// Get workflow employee by client email (employer's email)
router.get('/client-email/:email', onboardingWorkflowEmployeeController.getWorkflowEmployeeByClientEmail);

// Get all workflow employees for a company
router.get('/company/:companyId', onboardingWorkflowEmployeeController.getAllWorkflowEmployees);

// Get single workflow employee by ID
router.get('/company/:companyId/:employeeId', onboardingWorkflowEmployeeController.getWorkflowEmployeeById);

// Create new workflow employee
router.post('/company/:companyId', onboardingWorkflowEmployeeController.createWorkflowEmployee);

// Send login credentials to candidate
router.post('/company/:companyId/:employeeId/send-credentials', onboardingWorkflowEmployeeController.sendLoginCredentials);

// Upload document
router.post(
  '/company/:companyId/:employeeId/upload-document',
  upload.single('document'),
  onboardingWorkflowEmployeeController.uploadDocument
);

// Delete document
router.delete(
  '/company/:companyId/:employeeId/document/:documentType',
  onboardingWorkflowEmployeeController.deleteDocument
);

// Save onboarding form data
router.post('/company/:companyId/:employeeId/onboarding-form', onboardingWorkflowEmployeeController.saveOnboardingForm);

// Complete a step
router.post('/company/:companyId/:employeeId/complete-step', onboardingWorkflowEmployeeController.completeWorkflowStep);

// 🔥 Send compliance documents (Multiple files)
router.post(
  '/company/:companyId/:employeeId/send-compliance-docs',
  upload.array('documents', 10),
  onboardingWorkflowEmployeeController.sendComplianceDocuments
);

// Update employer submission status
router.post('/company/:companyId/:employeeId/employer-submission', onboardingWorkflowEmployeeController.updateEmployerSubmissionStatus);

// Update workflow steps (for editing steps)
router.post('/company/:companyId/:employeeId/update-steps', onboardingWorkflowEmployeeController.updateWorkflowSteps);

// Admin update candidate form data (without touching steps/progress)
router.put('/company/:companyId/:employeeId/admin-update-form', onboardingWorkflowEmployeeController.adminUpdateOnboardingForm);

// ✅ NEW: Sync document from employer to workflow employee
router.post(
  '/company/:companyId/:employeeId/sync-document',
  onboardingWorkflowEmployeeController.syncDocumentToWorkflow
);

// Delete workflow employee
router.delete('/company/:companyId/:employeeId', onboardingWorkflowEmployeeController.deleteWorkflowEmployee);

module.exports = router;