const express = require('express');
const router = express.Router();
const { updateOwnProfile } = require('../controllers/instructorsController');
const { authenticateToken, authorizeRole } = require('../utils/auth');

// All routes require authentication
router.use(authenticateToken);

// Update instructor's own profile (personal details only)
router.put('/profile', authorizeRole(['instructor']), updateOwnProfile);

module.exports = router;
