const express = require('express');
const router = express.Router();
const onboardingEmployeeController = require('../controllers/onboardingEmployeeController');
const { authenticateToken } = require('../../Recruitment/middleWare/authMiddleware');

// Apply authentication to all routes
router.use(authenticateToken);

// Get all employees for a company
router.get('/company/:companyId', onboardingEmployeeController.getAllEmployees);

// Get single employee
router.get('/company/:companyId/:employeeId', onboardingEmployeeController.getEmployeeById);

// Create new employee
router.post('/company/:companyId', onboardingEmployeeController.createEmployee);

// Update employee onboarding
router.patch('/company/:companyId/:employeeId/onboarding', onboardingEmployeeController.updateEmployeeOnboarding);

// Update employee
router.put('/company/:companyId/:employeeId', onboardingEmployeeController.updateEmployee);

// Delete employee
router.delete('/company/:companyId/:employeeId', onboardingEmployeeController.deleteEmployee);

module.exports = router;