const express = require('express');
const router = express.Router();
const onboardingTrackingController = require('../controllers/onboardingTrackingController');
const { authenticateToken } = require('../../Recruitment/middleWare/authMiddleware');

// Apply authentication to all routes
router.use(authenticateToken);

// Get all employees with onboarding status for a company
router.get('/company/:companyId', onboardingTrackingController.getAllWithOnboarding);

// Get onboarding for a specific employee
router.get('/company/:companyId/employee/:employeeId', onboardingTrackingController.getEmployeeOnboarding);

// Create or update onboarding for an employee
router.post('/company/:companyId/employee/:employeeId', onboardingTrackingController.saveEmployeeOnboarding);

// Complete a step
router.post('/company/:companyId/employee/:employeeId/complete-step', onboardingTrackingController.completeStep);

module.exports = router;