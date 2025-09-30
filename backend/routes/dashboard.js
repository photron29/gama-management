const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/dashboardController');
const { authenticateToken } = require('../utils/auth');

// All routes require authentication
router.use(authenticateToken);

// Get dashboard statistics
router.get('/stats', getDashboardStats);

module.exports = router;
