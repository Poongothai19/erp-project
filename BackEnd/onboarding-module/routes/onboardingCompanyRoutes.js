const express = require('express');
const router = express.Router();
const onboardingCompanyController = require('../controllers/onboardingCompanyController');
const { authenticateToken } = require('../../Recruitment/middleWare/authMiddleware');

// Get all companies
router.get('/', authenticateToken, onboardingCompanyController.getAllCompanies);

// Get company by ID
router.get('/:id', authenticateToken, onboardingCompanyController.getCompanyById);

// Get company logo (public)
router.get('/:id/logo', onboardingCompanyController.getCompanyLogo);

module.exports = router;