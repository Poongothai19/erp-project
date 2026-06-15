const express = require('express');
const router = express.Router();
const socialMediaController = require('../controllers/socialMediaController');
const { authenticateToken } = require('../../Recruitment/middleWare/authMiddleware'); 

// Route to get all configurations for the logged-in user
router.get('/configs', authenticateToken, socialMediaController.getConfigurations);

// Route to save or update a configuration
router.post('/config', authenticateToken, socialMediaController.saveConfiguration);

// Route to post a job to social media
router.post('/post', authenticateToken, socialMediaController.postJob);

// Route to toggle platform active status
router.patch('/config/:platformName/toggle', authenticateToken, socialMediaController.togglePlatformStatus);

module.exports = router;
