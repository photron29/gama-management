const pool = require('../db');

// Generate unique order number
const generateOrderNumber = () => {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ORD-${timestamp.slice(-6)}-${random}`;
};

// Create new order (instructors only)
const createOrder = async (req, res) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { items, notes, branch_id } = req.body;

        // Validate request body
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Order must contain at least one item' });
        }

        // Validate each item
        for (const item of items) {
            if (!item.product_id || !item.quantity) {
                return res.status(400).json({ error: 'Each item must have product_id and quantity' });
            }
            if (item.quantity <= 0) {
                return res.status(400).json({ error: 'Quantity must be greater than 0' });
            }
        }

        // Get instructor ID (PK) and name from the 'instructors' table using the User ID
        // This query correctly retrieves the instructors.id (primary key)
        const instructorQuery = 'SELECT id, first_name, last_name FROM instructors WHERE user_id = $1';
        const instructorResult = await client.query(instructorQuery, [req.user.id]);
        
        if (instructorResult.rows.length === 0) {
            throw new Error('Instructor profile not found for the authenticated user.');
        }
        
        const instructorProfile = instructorResult.rows[0];
        const instructorId = instructorProfile.id; // CORRECT ID (instructors PK) for orders.instructor_id
        const instructorName = `${instructorProfile.first_name} ${instructorProfile.last_name}`;

        // Generate unique order number
        const orderNumber = generateOrderNumber();

        // Calculate total amount and validate inventory
        let subtotal = 0;
        for (const item of items) {
            // Check inventory for price and available quantity
            const productQuery = 'SELECT price, quantity FROM inventory WHERE id = $1';
            const productResult = await client.query(productQuery, [item.product_id]);

            if (productResult.rows.length === 0) {
                throw new Error(`Product with ID ${item.product_id} not found`);
            }

            const product = productResult.rows[0];
            const availableQuantity = parseInt(product.quantity);
            const requestedQuantity = parseInt(item.quantity);

            if (availableQuantity < requestedQuantity) {
                throw new Error(`Insufficient stock for product ID ${item.product_id}. Available: ${availableQuantity}, Requested: ${requestedQuantity}`);
            }

            const unitPrice = parseFloat(product.price);
            const itemTotal = unitPrice * requestedQuantity;
            subtotal += itemTotal;
        }

        const tax = 0; // No tax for now
        const total = subtotal + tax;

        // Create order with all required fields
        const orderQuery = `
            INSERT INTO orders (instructor_id, branch_id, order_date, total_amount, order_number, instructor_name, status, notes)
            VALUES ($1, $2, CURRENT_DATE, $3, $4, $5, $6, $7)
            RETURNING *
        `;

        // Use the correct instructorId (instructors PK) for insertion
        const orderResult = await client.query(orderQuery, [
            instructorId, 
            branch_id || null, 
            total,
            orderNumber,
            instructorName,
            'pending',
            notes || null
        ]);

        const order = orderResult.rows[0];

        // Create order items and update inventory quantities
        for (const item of items) {
            const productQuery = 'SELECT price FROM inventory WHERE id = $1';
            const productResult = await client.query(productQuery, [item.product_id]);
            const product = productResult.rows[0];

            const itemQuery = `
                INSERT INTO order_items (order_id, inventory_id, quantity, price)
                VALUES ($1, $2, $3, $4)
            `;

            await client.query(itemQuery, [
                order.id,
                item.product_id,
                item.quantity,
                product.price
            ]);

            // Update inventory quantity
            const updateInventoryQuery = `
                UPDATE inventory 
                SET quantity = quantity - $1, updated_at = CURRENT_TIMESTAMP
                WHERE id = $2
            `;
            
            await client.query(updateInventoryQuery, [item.quantity, item.product_id]);
        }

        // Create notification for admins about the new order
        try {
            // Get all admin users
            const adminQuery = `
                SELECT u.id, u.username 
                FROM users u 
                WHERE u.role = 'admin'
            `;
            const adminResult = await client.query(adminQuery);
            
            if (adminResult.rows.length > 0) {
                // Create notifications for all admins
                const notificationValues = [];
                const notificationParams = [];
                let paramIndex = 1;
                
                for (const admin of adminResult.rows) {
                    notificationValues.push(`($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4})`);
                    notificationParams.push(
                        admin.id,
                        null, // announcement_id (null for order notifications)
                        `New Order: ${orderNumber}`,
                        `Instructor ${instructorName} has placed a new order for ₹${total.toFixed(2)}. Order ID: ${orderNumber}`,
                        'order'
                    );
                    paramIndex += 5;
                }
                
                const notificationQuery = `
                    INSERT INTO notifications (user_id, announcement_id, title, message, type)
                    VALUES ${notificationValues.join(', ')}
                `;
                
                await client.query(notificationQuery, notificationParams);
            }
        } catch (notificationError) {
            console.error('Error creating order notifications:', notificationError);
            // Don't fail the order creation if notification creation fails
        }

        await client.query('COMMIT');

        res.status(201).json({
            message: 'Order created successfully',
            order: order
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Create order error:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ 
            error: 'Failed to create order', 
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    } finally {
        client.release();
    }
};

// Get orders for instructor
const getMyOrders = async (req, res) => {
    try {
        // You still need to find the instructor ID (PK) to filter orders
        const instructorCheck = await pool.query(
            'SELECT id FROM instructors WHERE user_id = $1', 
            [req.user.id]
        );
        
        if (instructorCheck.rows.length === 0) {
             // If user exists but is not registered as an instructor
            return res.status(404).json({ error: 'Instructor profile not found.' });
        }
        
        const instructorId = instructorCheck.rows[0].id;
        
        const query = `
            SELECT 
                o.*,
                b.name as branch_name,
                COUNT(oi.id) as item_count
            FROM orders o
            LEFT JOIN branches b ON o.branch_id = b.id
            LEFT JOIN order_items oi ON o.id = oi.order_id
            WHERE o.instructor_id = $1
            GROUP BY o.id, b.name
            ORDER BY o.created_at DESC
        `;

        const result = await pool.query(query, [instructorId]);
        res.json({ orders: result.rows });
    } catch (error) {
        console.error('Get my orders error:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
};

// Get order details
const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;

        // Get order info
        const orderQuery = `
            SELECT 
                o.*,
                b.name as branch_name,
                i.first_name as instructor_first_name, 
                i.last_name as instructor_last_name
            FROM orders o
            -- 👇 FIX: Join orders.instructor_id (which is instructors.id) to instructors.id
            JOIN instructors i ON o.instructor_id = i.id 
            LEFT JOIN branches b ON o.branch_id = b.id
            WHERE o.id = $1
        `;

        const orderResult = await pool.query(orderQuery, [id]);

        if (orderResult.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        // Authorization check (optional, but good practice): 
        // If the user is not Admin AND the order instructor_id is not their instructor_id (PK), deny access.
        const order = orderResult.rows[0];
        const isUserAdmin = req.user.role === 'admin';
        
        if (!isUserAdmin) {
            const userInstructorCheck = await pool.query('SELECT id FROM instructors WHERE user_id = $1', [req.user.id]);
            const userInstructorId = userInstructorCheck.rows.length > 0 ? userInstructorCheck.rows[0].id : null;

            if (userInstructorId !== order.instructor_id) {
                 return res.status(403).json({ error: 'Access denied: You are not authorized to view this order.' });
            }
        }


        // Get order items
        const itemsQuery = `
            SELECT 
                oi.*,
                p.item_name as product_name,
                'No description available' as product_description,
                p.supplier as product_category
            FROM order_items oi
            JOIN inventory p ON oi.inventory_id = p.id
            WHERE oi.order_id = $1
        `;

        const itemsResult = await pool.query(itemsQuery, [id]);

        res.json({
            order: order,
            items: itemsResult.rows
        });

    } catch (error) {
        console.error('Get order details error:', error);
        res.status(500).json({ error: 'Failed to fetch order details' });
    }
};

// Get all orders (admin only)
const getAllOrders = async (req, res) => {
    try {
        const query = `
            SELECT 
                o.*,
                b.name as branch_name,
                i.first_name as instructor_first_name, 
                i.last_name as instructor_last_name,
                COUNT(oi.id) as item_count
            FROM orders o
            LEFT JOIN branches b ON o.branch_id = b.id
            -- 👇 FIX: Join orders.instructor_id (which is instructors.id) to instructors.id
            JOIN instructors i ON o.instructor_id = i.id 
            LEFT JOIN order_items oi ON o.id = oi.order_id
            GROUP BY o.id, b.name, i.first_name, i.last_name
            ORDER BY o.created_at DESC
        `;

        const result = await pool.query(query);
        res.json({ orders: result.rows });
    } catch (error) {
        console.error('Get all orders error:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
};

// Update order status (admin only)
const updateOrderStatus = async (req, res) => {
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

        const order = result.rows[0];

        // Create notification for the instructor about the status update
        try {
            // Get instructor user ID from the order
            const instructorQuery = `
                SELECT u.id as user_id, u.username, i.first_name, i.last_name
                FROM instructors i
                JOIN users u ON i.user_id = u.id
                WHERE i.id = $1
            `;
            const instructorResult = await pool.query(instructorQuery, [order.instructor_id]);
            
            if (instructorResult.rows.length > 0) {
                const instructor = instructorResult.rows[0];
                const instructorName = `${instructor.first_name} ${instructor.last_name}`;
                
                // Create status-specific notification messages
                let notificationTitle, notificationMessage;
                
                switch (status) {
                    case 'approved':
                        notificationTitle = 'Order Approved';
                        notificationMessage = `Your order #${order.order_number} has been approved and is being processed.`;
                        break;
                    case 'processing':
                        notificationTitle = 'Order Processing';
                        notificationMessage = `Your order #${order.order_number} is now being processed.`;
                        break;
                    case 'shipped':
                        notificationTitle = 'Order Shipped';
                        notificationMessage = `Your order #${order.order_number} has been shipped and is on its way.`;
                        break;
                    case 'delivered':
                        notificationTitle = 'Order Delivered';
                        notificationMessage = `Your order #${order.order_number} has been delivered successfully.`;
                        break;
                    case 'cancelled':
                        notificationTitle = 'Order Cancelled';
                        notificationMessage = `Your order #${order.order_number} has been cancelled. Please contact admin for more details.`;
                        break;
                    default:
                        notificationTitle = 'Order Status Updated';
                        notificationMessage = `Your order #${order.order_number} status has been updated to ${status}.`;
                }
                
                // Create notification for the instructor
                const notificationQuery = `
                    INSERT INTO notifications (user_id, announcement_id, title, message, type)
                    VALUES ($1, $2, $3, $4, $5)
                `;
                
                await pool.query(notificationQuery, [
                    instructor.user_id,
                    null, // announcement_id (null for order notifications)
                    notificationTitle,
                    notificationMessage,
                    'order_status'
                ]);
                
            }
        } catch (notificationError) {
            console.error('Error creating status notification:', notificationError);
            // Don't fail the status update if notification creation fails
        }

        res.json({ order: result.rows[0] });

    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({ error: 'Failed to update order status' });
    }
};

// Get order statistics (admin only)
const getOrderStats = async (req, res) => {
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
};

module.exports = {
    createOrder,
    getMyOrders,
    getOrderById,
    getAllOrders,
    updateOrderStatus,
    getOrderStats
};