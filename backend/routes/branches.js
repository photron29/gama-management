const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../utils/auth');
const {
    getBranches,
    getBranch,
    createBranch,
    updateBranch,
    deleteBranch
} = require('../controllers/branchesController');

// Get all branches (Admin only)
router.get('/', authenticateToken, authorizeRole(['admin']), getBranches);

// Get single branch
router.get('/:id', authenticateToken, authorizeRole(['admin']), getBranch);

// Create new branch
router.post('/', authenticateToken, authorizeRole(['admin']), createBranch);

// Update branch
router.put('/:id', authenticateToken, authorizeRole(['admin']), updateBranch);

// Delete branch
router.delete('/:id', authenticateToken, authorizeRole(['admin']), deleteBranch);

module.exports = router;
