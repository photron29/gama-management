const pool = require('../db');

// Get inventory items (admin only)
const getInventory = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied: Admin role required' });
        }

        const { branch_id } = req.query;

        // ✅ FIX: Query defined to start immediately after the backtick
        let query = `SELECT i.*, b.name as branch_name, i.supplier as category
FROM inventory i
LEFT JOIN branches b ON i.branch_id = b.id 
WHERE 1=1`;
        let params = [];
        let paramCount = 0;

        // Filter by branch
        if (branch_id && branch_id.trim()) { 
            query += ` AND i.branch_id = $${++paramCount}`;
            params.push(branch_id.trim()); 
        }

        query += ` ORDER BY i.item_name`;

        // ✅ FIX: Using .trim() on the final query string
        const result = await pool.query(query.trim(), params);
        res.json({ inventory: result.rows });
    } catch (error) {
        console.error('Get inventory error:', error);
        res.status(500).json({ error: 'Failed to fetch inventory' });
    }
};

// Get inventory item by ID
const getInventoryById = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied: Admin role required' });
        }

        const { id } = req.params;

        const result = await pool.query(`
      SELECT i.*, b.name as branch_name, i.supplier as category
      FROM inventory i
      LEFT JOIN branches b ON i.branch_id = b.id
      WHERE i.id = $1
    `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Inventory item not found' });
        }

        res.json({ item: result.rows[0] });
    } catch (error) {
        console.error('Get inventory item error:', error);
        res.status(500).json({ error: 'Failed to fetch inventory item' });
    }
};

// Create inventory item
const createInventoryItem = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied: Admin role required' });
        }

        const {
            item_name,
            quantity,
            price,
            branch_id, // Now optional
            supplier,
        } = req.body;

        // ✅ FIX: Removed !branch_id from the required fields validation
        if (!item_name || quantity === undefined || price === undefined) { 
            return res.status(400).json({ error: 'Item name, quantity, and price are required' });
        }

        const result = await pool.query(
            `INSERT INTO inventory (
        item_name, quantity, price, branch_id, supplier
      ) VALUES ($1, $2, $3, $4, $5) 
      RETURNING *`,
            [item_name, quantity, price, branch_id, supplier]
        );

        res.status(201).json({
            message: 'Inventory item created successfully',
            item: result.rows[0]
        });
    } catch (error) {
        console.error('Create inventory item error:', error);
        res.status(500).json({ error: 'Failed to create inventory item' });
    }
};

// Update inventory item
const updateInventoryItem = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied: Admin role required' });
        }

        const { id } = req.params;
        const {
            item_name,
            quantity,
            price,
            branch_id,
            supplier,
        } = req.body;

        const result = await pool.query(
            `UPDATE inventory SET 
        item_name = COALESCE($1, item_name),
        quantity = COALESCE($2, quantity),
        price = COALESCE($3, price),
        branch_id = COALESCE($4, branch_id), // branch_id is still nullable and can be updated
        supplier = COALESCE($5, supplier),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $6 
      RETURNING *`,
            [item_name, quantity, price, branch_id, supplier, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Inventory item not found' });
        }

        res.json({
            message: 'Inventory item updated successfully',
            item: result.rows[0]
        });
    } catch (error) {
        console.error('Update inventory item error:', error);
        res.status(500).json({ error: 'Failed to update inventory item' });
    }
};

// Delete inventory item
const deleteInventoryItem = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied: Admin role required' });
        }

        const { id } = req.params;

        // Check if item exists
        const checkResult = await pool.query('SELECT * FROM inventory WHERE id = $1', [id]);
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Inventory item not found' });
        }

        await pool.query('DELETE FROM inventory WHERE id = $1', [id]);

        res.json({ message: 'Inventory item deleted successfully' });
    } catch (error) {
        console.error('Delete inventory item error:', error);
        res.status(500).json({ error: 'Failed to delete inventory item' });
    }
};

module.exports = {
    getInventory,
    getInventoryById,
    createInventoryItem,
    updateInventoryItem,
    deleteInventoryItem
};