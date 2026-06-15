const express = require("express");
const router = express.Router();
const {
  getClients, 
  createClient,
  assignClientToCompany,
  getCompanyClients,
  getTemplates, 
  getTemplateById, 
  saveTemplate,
  deleteTemplate
} = require("../controllers/onboardingController");
const { authenticateToken } = require("../../Recruitment/middleWare/authMiddleware");

// Apply authentication to all routes
router.use(authenticateToken);

// Request logging
router.use((req, res, next) => {
  console.log(`[ONBOARDING] ${req.method} ${req.url}`);
  next();
});

// Client routes
router.get("/clients", getClients);
router.post("/clients", createClient);

// Assignment routes
router.post("/assignments", assignClientToCompany);
router.get("/companies/:companyId/clients", getCompanyClients);

// Template routes
router.get("/templates", getTemplates);
router.get("/templates/:id", getTemplateById);
router.post("/templates", saveTemplate);
router.delete("/templates/:id", deleteTemplate);

module.exports = router;