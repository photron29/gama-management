const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../utils/auth');

// Get all products (instructors can view) - using inventory table
router.get('/', authenticateToken, async (req, res) => {
    try {
        const query = `
            SELECT 
                id,
                item_name as name,
                category,
                unit_price as price,
                quantity as stock_quantity,
                'No description available' as description,
                NULL as image_url,
                true as is_active,
                created_at,
                updated_at
            FROM inventory
            WHERE quantity > 0
            ORDER BY category, item_name
        `;

        const result = await pool.query(query);
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
        const query = `
            SELECT 
                id,
                item_name as name,
                category,
                unit_price as price,
                quantity as stock_quantity,
                'No description available' as description,
                NULL as image_url,
                true as is_active,
                created_at,
                updated_at
            FROM inventory 
            WHERE id = $1 AND quantity > 0
        `;
        const result = await pool.query(query, [id]);

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
        const query = `
            SELECT 
                id,
                item_name as name,
                category,
                unit_price as price,
                quantity as stock_quantity,
                'No description available' as description,
                NULL as image_url,
                true as is_active,
                created_at,
                updated_at
            FROM inventory 
            WHERE category = $1 AND quantity > 0 
            ORDER BY item_name
        `;

        const result = await pool.query(query, [category]);
        res.json({ products: result.rows });
    } catch (error) {
        console.error('Get products by category error:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// Get product categories
router.get('/categories/list', authenticateToken, async (req, res) => {
    try {
        const query = `
            SELECT DISTINCT category 
            FROM inventory 
            WHERE quantity > 0 
            ORDER BY category
        `;

        const result = await pool.query(query);
        const categories = result.rows.map(row => row.category);
        res.json({ categories });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

module.exports = router;
