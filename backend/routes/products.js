const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../utils/auth');

// Get all products (instructors can view) - using inventory table
router.get('/', authenticateToken, async (req, res) => {
    try {
        // ✅ FIX: Query starts immediately after the backtick
        const query = `SELECT 
id,
item_name as name,
supplier as category, 
price,
quantity as stock_quantity,
'No description available' as description,
NULL as image_url,
true as is_active,
created_at,
updated_at
FROM inventory
WHERE quantity > 0
ORDER BY supplier, item_name`;

        // ✅ FIX: Using .trim() on the final query string
        const result = await pool.query(query.trim());
        res.json({ products: result.rows });
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// Get product by ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        // ✅ FIX: Query starts immediately after the backtick
        const query = `SELECT 
id,
item_name as name,
supplier as category,
price,
quantity as stock_quantity,
'No description available' as description,
NULL as image_url,
true as is_active,
created_at,
updated_at
FROM inventory 
WHERE id = $1 AND quantity > 0`;

        // ✅ FIX: Using .trim() on the final query string
        const result = await pool.query(query.trim(), [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json({ product: result.rows[0] });
    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({ error: 'Failed to fetch product' });
    }
});

// Get products by category
router.get('/category/:category', authenticateToken, async (req, res) => {
    try {
        const { category } = req.params;
        // ✅ FIX: Query starts immediately after the backtick
        const query = `SELECT 
id,
item_name as name,
supplier as category,
price,
quantity as stock_quantity,
'No description available' as description,
NULL as image_url,
true as is_active,
created_at,
updated_at
FROM inventory 
WHERE supplier = $1 AND quantity > 0 
ORDER BY item_name`;

        // ✅ FIX: Using .trim() on the final query string
        const result = await pool.query(query.trim(), [category]);
        res.json({ products: result.rows });
    } catch (error) {
        console.error('Get products by category error:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// Get product categories
router.get('/categories/list', authenticateToken, async (req, res) => {
    try {
        // ✅ FIX: Query starts immediately after the backtick
        const query = `SELECT DISTINCT supplier as category 
FROM inventory 
WHERE quantity > 0 
ORDER BY supplier`;

        // ✅ FIX: Using .trim() on the final query string
        const result = await pool.query(query.trim());
        const categories = result.rows.map(row => row.category);
        res.json({ categories });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

module.exports = router;