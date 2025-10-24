const express = require('express');
const router = express.Router();
const { login, getProfile, updateUser, logout } = require('../controllers/authController');
const { authenticateToken } = require('../utils/auth');

// Public routes
router.post('/login', login);

// Protected routes
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateUser);
router.post('/logout', authenticateToken, logout);

module.exports = router;
