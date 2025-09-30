const express = require('express');
const router = express.Router();
const {
    getInventory,
    getInventoryById,
    createInventoryItem,
    updateInventoryItem,
    deleteInventoryItem
} = require('../controllers/inventoryController');
const { authenticateToken, authorizeRole } = require('../utils/auth');

// All routes require authentication and admin role
router.use(authenticateToken);
router.use(authorizeRole(['admin']));

// Get inventory items
router.get('/', getInventory);

// Get inventory item by ID
router.get('/:id', getInventoryById);

// Create inventory item
router.post('/', createInventoryItem);

// Update inventory item
router.put('/:id', updateInventoryItem);

// Delete inventory item
router.delete('/:id', deleteInventoryItem);

module.exports = router;
