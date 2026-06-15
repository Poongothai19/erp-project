// routes/dashboardRoutes.js
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// Simple auth middleware check - you can replace this with your actual auth middleware
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }
  // For now, we'll just pass through - replace with actual token verification
  next();
};

// Apply authentication middleware to all routes
router.use(authMiddleware);

// ===== CORE DASHBOARD STATS =====

// GET /api/dashboard/stats - Get dashboard statistics
// Returns: benchStrength, activeRequirements, weeklySubmissions, interviewsScheduled
router.get('/stats', dashboardController.getDashboardStats);

// GET /api/dashboard/utilization - Get candidate utilization data
// Returns: utilized percentage, bench percentage
router.get('/utilization', dashboardController.getUtilizationData);

// ===== ANALYTICS DATA =====

// GET /api/dashboard/analytics - Get analytics data
// Returns: benchStrengthData, successRatioData for charts
router.get('/analytics', dashboardController.getAnalyticsData);

// ===== PERFORMANCE DATA - NEW DYNAMIC ENDPOINTS =====

// GET /api/dashboard/top-performers - Get top performing candidates (REAL DATA)
// Returns: Top 5 candidates with placements, experience, skills, trends
router.get('/top-performers', dashboardController.getTopPerformers);

// GET /api/dashboard/performance-metrics - Get detailed performance metrics (DYNAMIC)
// Returns: conversionRate, avgTimeToHire, submissionAccuracy, clientSatisfaction
router.get('/performance-metrics', dashboardController.getPerformanceMetrics);

// ===== REVENUE & FORECAST DATA =====

// GET /api/dashboard/revenue-forecast - Get revenue forecast data (DYNAMIC)
// Returns: lastMonth, thisMonth, nextMonth, trend, placements
router.get('/revenue-forecast', dashboardController.getRevenueForecast);

module.exports = router;