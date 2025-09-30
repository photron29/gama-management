const pool = require('../db');

// Get inventory items (admin only)
const getInventory = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied: Admin role required' });
        }

        const { category, branch_id } = req.query;

        let query = `
      SELECT i.*, b.name as branch_name
      FROM inventory i
      JOIN branches b ON i.branch_id = b.id
      WHERE 1=1
    `;
        let params = [];
        let paramCount = 0;

        // Filter by category
        if (category) {
            query += ` AND i.category = $${++paramCount}`;
            params.push(category);
        }

        // Filter by branch
        if (branch_id) {
            query += ` AND i.branch_id = $${++paramCount}`;
            params.push(branch_id);
        }

        query += ` ORDER BY i.item_name`;

        const result = await pool.query(query, params);
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
      SELECT i.*, b.name as branch_name
      FROM inventory i
      JOIN branches b ON i.branch_id = b.id
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
            category,
            quantity,
            unit_price,
            branch_id,
            supplier,
            last_restocked
        } = req.body;

        // Validate required fields
        if (!item_name || !branch_id) {
            return res.status(400).json({ error: 'Item name and branch are required' });
        }

        const result = await pool.query(
            `INSERT INTO inventory (
        item_name, category, quantity, unit_price, branch_id, supplier, last_restocked
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING *`,
            [item_name, category, quantity, unit_price, branch_id, supplier, last_restocked]
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
            category,
            quantity,
            unit_price,
            branch_id,
            supplier,
            last_restocked
        } = req.body;

        const result = await pool.query(
            `UPDATE inventory SET 
        item_name = COALESCE($1, item_name),
        category = COALESCE($2, category),
        quantity = COALESCE($3, quantity),
        unit_price = COALESCE($4, unit_price),
        branch_id = COALESCE($5, branch_id),
        supplier = COALESCE($6, supplier),
        last_restocked = COALESCE($7, last_restocked),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $8 
      RETURNING *`,
            [item_name, category, quantity, unit_price, branch_id, supplier, last_restocked, id]
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
