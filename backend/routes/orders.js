const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../utils/auth');
const {
    createOrder,
    getMyOrders,
    getOrderById,
    getAllOrders,
    updateOrderStatus,
    getOrderStats
} = require('../controllers/orderController');

// Create new order (instructors only)
router.post('/', authenticateToken, createOrder);

// Get orders for instructor
router.get('/my-orders', authenticateToken, getMyOrders);

// Get order details
router.get('/:id', authenticateToken, getOrderById);

// Get all orders (admin only)
router.get('/', authenticateToken, authorizeRole(['admin']), getAllOrders);

// Update order status (admin only)
router.put('/:id/status', authenticateToken, authorizeRole(['admin']), updateOrderStatus);

// Get order statistics (admin only)
router.get('/stats/overview', authenticateToken, authorizeRole(['admin']), getOrderStats);

module.exports = router;