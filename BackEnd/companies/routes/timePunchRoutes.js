const express = require('express');
const router = express.Router();
const timePunchController = require('../controllers/timePunchController');
const { authenticateToken } = require('../../Recruitment/middleWare/authMiddleware'); // Fixed path

// All routes require authentication
router.use(authenticateToken);

/**
 * @route POST /api/hrm/time-punch/punch
 * @desc Record a clock-in or clock-out
 */
router.post('/punch', timePunchController.punch);

/**
 * @route GET /api/hrm/time-punch/status/:employeeId
 * @desc Get today's punch status for an employee
 */
router.get('/status/:employeeId', timePunchController.getTodayStatus);

/**
 * @route GET /api/hrm/time-punch/history/:employeeId
 * @desc Get punch history for an employee
 */
router.get('/history/:employeeId', timePunchController.getHistory);

module.exports = router;
