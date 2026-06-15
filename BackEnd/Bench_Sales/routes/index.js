// routes/index.js
const express = require('express');
const router = express.Router();

// Import route modules
const candidateRoutes = require('./candidateRoutes');
const requirementRoutes = require('./requirementRoutes');
const submissionRoutes = require('./submissionRoutes');
const vendorRoutes = require('./vendorRoutes');
const dashboardRoutes = require('./dashboardRoutes');

// Import validation middleware
const { 
  validateCandidate, 
  validateRequirement, 
  validateSubmission, 
  validateVendor 
} = require('../middleWare/validationMiddleware');

// Apply validation middleware to specific routes
const candidateRoutesWithValidation = express.Router();
candidateRoutesWithValidation.use('/', candidateRoutes);
candidateRoutesWithValidation.post('/', validateCandidate);
candidateRoutesWithValidation.put('/:id', validateCandidate);

const requirementRoutesWithValidation = express.Router();
requirementRoutesWithValidation.use('/', requirementRoutes);
requirementRoutesWithValidation.post('/', validateRequirement);
requirementRoutesWithValidation.put('/:id', validateRequirement);

const submissionRoutesWithValidation = express.Router();
submissionRoutesWithValidation.use('/', submissionRoutes);
submissionRoutesWithValidation.post('/', validateSubmission);

const vendorRoutesWithValidation = express.Router();
vendorRoutesWithValidation.use('/', vendorRoutes);
vendorRoutesWithValidation.post('/', validateVendor);
vendorRoutesWithValidation.put('/:id', validateVendor);

// Mount routes
router.use('/candidates', candidateRoutes);
router.use('/requirements', requirementRoutes);
router.use('/submissions', submissionRoutes);
router.use('/vendors', vendorRoutes);
router.use('/dashboard', dashboardRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Bench Sales API is running',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;