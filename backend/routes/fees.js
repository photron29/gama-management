const express = require('express');
const router = express.Router();
const {
    getFees,
    getFeeById,
    createFee,
    updateFee,
    deleteFee
} = require('../controllers/feesController');
const { authenticateToken } = require('../utils/auth');

// All routes require authentication
router.use(authenticateToken);

// Get fees records
router.get('/', getFees);

// Get fee by ID
router.get('/:id', getFeeById);

// Create fee record
router.post('/', createFee);

// Update fee record
router.put('/:id', updateFee);

// Delete fee record
router.delete('/:id', deleteFee);

module.exports = router;
