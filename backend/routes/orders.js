const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken, authorizeRole } = require('../utils/auth');

// Get instructor's orders
router.get('/my-orders', authenticateToken, async (req, res) => {
    try {
        const query = `
            SELECT 
                o.*,
                u.first_name,
                u.last_name,
                b.name as branch_name
            FROM orders o
            JOIN users u ON o.instructor_id = u.id
            LEFT JOIN branches b ON u.branch_id = b.id
            WHERE o.instructor_id = $1
            ORDER BY o.created_at DESC
        `;

        const result = await pool.query(query, [req.user.id]);

        // Get order items for each order
        const ordersWithItems = await Promise.all(
            result.rows.map(async (order) => {
                const itemsQuery = `
                    SELECT 
                        oi.*,
                        p.item_name as product_name,
                        p.category,
                        'No description available' as description
                    FROM order_items oi
                    LEFT JOIN inventory p ON oi.product_id = p.id
                    WHERE oi.order_id = $1
                `;

                const itemsResult = await pool.query(itemsQuery, [order.id]);

                return {
                    ...order,
                    instructor_name: `${order.first_name} ${order.last_name}`,
                    branch_name: order.branch_name || 'N/A',
                    item_count: itemsResult.rows.length,
                    items: itemsResult.rows
                };
            })
        );

        res.json({ orders: ordersWithItems });
    } catch (error) {
        console.error('Get my orders error:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// Get all orders (admin only)
router.get('/', authenticateToken, authorizeRole(['admin']), async (req, res) => {
    try {
        const query = `
            SELECT 
                o.*,
                u.first_name,
                u.last_name,
                b.name as branch_name
            FROM orders o
            JOIN users u ON o.instructor_id = u.id
            LEFT JOIN branches b ON u.branch_id = b.id
            ORDER BY o.created_at DESC
        `;

        const result = await pool.query(query);

        // Get order items for each order
        const ordersWithItems = await Promise.all(
            result.rows.map(async (order) => {
                const itemsQuery = `
                    SELECT 
                        oi.*,
                        p.item_name as product_name,
                        p.category,
                        'No description available' as description
                    FROM order_items oi
                    LEFT JOIN inventory p ON oi.product_id = p.id
                    WHERE oi.order_id = $1
                `;

                const itemsResult = await pool.query(itemsQuery, [order.id]);

                return {
                    ...order,
                    instructor_name: `${order.first_name} ${order.last_name}`,
                    branch_name: order.branch_name || 'N/A',
                    item_count: itemsResult.rows.length,
                    items: itemsResult.rows
                };
            })
        );

        res.json({ orders: ordersWithItems });
    } catch (error) {
        console.error('Get all orders error:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// Generate unique order number
const generateOrderNumber = () => {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ORD-${timestamp.slice(-6)}-${random}`;
};

// Create new order (instructors only)
router.post('/', authenticateToken, async (req, res) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { items, notes } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'Order must contain at least one item' });
        }

        // Generate unique order number
        const orderNumber = generateOrderNumber();

        // Get instructor name
        const userQuery = 'SELECT first_name, last_name FROM users WHERE id = $1';
        const userResult = await client.query(userQuery, [req.user.id]);
        const instructorName = `${userResult.rows[0].first_name} ${userResult.rows[0].last_name}`;

        // Calculate total amount
        let subtotal = 0;
        for (const item of items) {
            const productQuery = 'SELECT unit_price as price FROM inventory WHERE id = $1 AND quantity > 0';
            const productResult = await client.query(productQuery, [item.product_id]);

            if (productResult.rows.length === 0) {
                throw new Error(`Product with ID ${item.product_id} not found`);
            }

            const unitPrice = parseFloat(productResult.rows[0].price);
            const itemTotal = unitPrice * item.quantity;
            subtotal += itemTotal;
        }

        const tax = 0; // No tax for now
        const total = subtotal + tax;

        // Create order
        const orderQuery = `
            INSERT INTO orders (order_number, instructor_id, instructor_name, status, subtotal, tax, total, notes)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `;

        const orderResult = await client.query(orderQuery, [
            orderNumber,
            req.user.id,
            instructorName,
            'pending',
            subtotal,
            tax,
            total,
            notes || null
        ]);

        const order = orderResult.rows[0];

        // Create order items
        for (const item of items) {
            const productQuery = 'SELECT item_name as name, category, \'No description available\' as description, unit_price as price FROM inventory WHERE id = $1';
            const productResult = await client.query(productQuery, [item.product_id]);
            const product = productResult.rows[0];

            const itemQuery = `
                INSERT INTO order_items (order_id, product_id, product_name, category, description, price, quantity)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `;

            await client.query(itemQuery, [
                order.id,
                item.product_id,
                product.name,
                product.category,
                product.description,
                product.price,
                item.quantity
            ]);
        }

        await client.query('COMMIT');

        res.status(201).json({
            message: 'Order created successfully',
            order: order
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Create order error:', error);
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
        res.status(500).json({ error: 'Failed to create order', details: error.message });
    } finally {
        client.release();
    }
});

// Get orders for instructor
router.get('/my-orders', authenticateToken, async (req, res) => {
    try {
        const query = `
            SELECT 
                o.*,
                b.name as branch_name,
                COUNT(oi.id) as item_count
            FROM orders o
            JOIN branches b ON o.branch_id = b.id
            LEFT JOIN order_items oi ON o.id = oi.order_id
            WHERE o.instructor_id = $1
            GROUP BY o.id, b.name
            ORDER BY o.created_at DESC
        `;

        const result = await pool.query(query, [req.user.id]);
        res.json({ orders: result.rows });
    } catch (error) {
        console.error('Get my orders error:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// Get order details
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Get order info
        const orderQuery = `
            SELECT 
                o.*,
                b.name as branch_name,
                u.first_name as instructor_first_name,
                u.last_name as instructor_last_name
            FROM orders o
            JOIN users u ON o.instructor_id = u.id
            LEFT JOIN branches b ON u.branch_id = b.id
            WHERE o.id = $1
        `;

        const orderResult = await pool.query(orderQuery, [id]);

        if (orderResult.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Get order items
        const itemsQuery = `
            SELECT 
                oi.*,
                p.item_name as product_name,
                'No description available' as product_description,
                p.category as product_category
            FROM order_items oi
            JOIN inventory p ON oi.product_id = p.id
            WHERE oi.order_id = $1
        `;

        const itemsResult = await pool.query(itemsQuery, [id]);

        res.json({
            order: orderResult.rows[0],
            items: itemsResult.rows
        });

    } catch (error) {
        console.error('Get order details error:', error);
        res.status(500).json({ error: 'Failed to fetch order details' });
    }
});

// Get all orders (admin only)
router.get('/', authenticateToken, authorizeRole(['admin']), async (req, res) => {
    try {
        const query = `
            SELECT 
                o.*,
                b.name as branch_name,
                u.first_name as instructor_first_name,
                u.last_name as instructor_last_name,
                COUNT(oi.id) as item_count
            FROM orders o
            JOIN branches b ON o.branch_id = b.id
            JOIN users u ON o.instructor_id = u.id
            LEFT JOIN order_items oi ON o.id = oi.order_id
            GROUP BY o.id, b.name, u.first_name, u.last_name
            ORDER BY o.created_at DESC
        `;

        const result = await pool.query(query);
        res.json({ orders: result.rows });
    } catch (error) {
        console.error('Get all orders error:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// Update order status (admin only)
router.put('/:id/status', authenticateToken, authorizeRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['pending', 'approved', 'processing', 'shipped', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const query = `
            UPDATE orders 
            SET status = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING *
        `;

        const result = await pool.query(query, [status, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.json({ order: result.rows[0] });

    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({ error: 'Failed to update order status' });
    }
});

// Get order statistics (admin only)
router.get('/stats/overview', authenticateToken, authorizeRole(['admin']), async (req, res) => {
    try {
        const statsQuery = `
            SELECT 
                COUNT(*) as total_orders,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
                COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_orders,
                COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing_orders,
                COUNT(CASE WHEN status = 'shipped' THEN 1 END) as shipped_orders,
                COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_orders,
                SUM(total_amount) as total_revenue
            FROM orders
        `;

        const result = await pool.query(statsQuery);
        res.json({ stats: result.rows[0] });

    } catch (error) {
        console.error('Get order stats error:', error);
        res.status(500).json({ error: 'Failed to fetch order statistics' });
    }
});

// Update order status (admin only)
router.put('/:id/status', authenticateToken, authorizeRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        console.log('Update status request:', { id, status, body: req.body });

        const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            console.log('Invalid status received:', status);
            return res.status(400).json({ error: 'Invalid status', received: status });
        }

        const query = `
            UPDATE orders 
            SET status = $1, updated_at = CURRENT_TIMESTAMP 
            WHERE id = $2 
            RETURNING *
        `;

        const result = await pool.query(query, [status, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.json({ order: result.rows[0] });
    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({ error: 'Failed to update order status' });
    }
});

module.exports = router;
