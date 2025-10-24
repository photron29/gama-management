const db = require('../db');
// NOTE: If you are integrating Socket.IO, uncomment the line below
// const { io } = require('../server'); 


// Get all announcements
const getAnnouncements = async (req, res) => {
    try {
        const query = `
            SELECT *
            FROM announcements
            ORDER BY created_at DESC
        `;
        
        const result = await db.query(query);
        res.json({ announcements: result.rows });
    } catch (error) {
        console.error('Error fetching announcements:', error);
        res.status(500).json({ error: 'Failed to fetch announcements' });
    }
};

// Get announcement by ID
const getAnnouncementById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const query = `
            SELECT *
            FROM announcements
            WHERE id = $1
        `;
        
        const result = await db.query(query, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Announcement not found' });
        }
        
        res.json({ announcement: result.rows[0] });
    } catch (error) {
        console.error('Error fetching announcement:', error);
        res.status(500).json({ error: 'Failed to fetch announcement' });
    }
};

// Create new announcement
const createAnnouncement = async (req, res) => {
    // Note: Switched db.getClient() to db.connect() as per your original code
    const client = await db.connect(); 
    
    try {
        await client.query('BEGIN');
        
        const { title, message, priority = 'normal', target_audience = 'all' } = req.body;
        const created_by = req.user.id;
        const created_by_name = `${req.user.first_name || ''} ${req.user.last_name || ''}`.trim() || req.user.username || 'Admin';
        
        // Validate required fields
        if (!title || !message) {
            return res.status(400).json({ error: 'Title and message are required' });
        }
        
        // Insert announcement
        const announcementQuery = `
            INSERT INTO announcements (title, message, priority, target_audience, created_by, created_by_name, status)
            VALUES ($1, $2, $3, $4, $5, $6, 'active')
            RETURNING *
        `;
        
        const announcementResult = await client.query(announcementQuery, [
            title, message, priority, target_audience, created_by, created_by_name
        ]);
        
        const announcement = announcementResult.rows[0];
        
        // Find all instructors (users with role 'instructor')
        const instructorsQuery = `
            SELECT id FROM users 
            WHERE role = 'instructor'
        `;
        
        const instructorsResult = await client.query(instructorsQuery);
        
        if (instructorsResult.rows.length > 0) {
            const numColumns = 5; 
            
            // Build the VALUES string with 5 placeholders per row
            const notificationValues = instructorsResult.rows.map((instructor, index) => 
                `($${index * numColumns + 1}, $${index * numColumns + 2}, $${index * numColumns + 3}, $${index * numColumns + 4}, $${index * numColumns + 5})`
            ).join(', ');
            
            // Ensure the target column list matches the 5 values we are inserting
            const notificationQuery = `
                INSERT INTO notifications (user_id, title, message, type, is_read)
                VALUES ${notificationValues}
            `;
            
            // Ensure the notificationParams array provides 5 values per row
            const notificationParams = instructorsResult.rows.flatMap(instructor => [
                instructor.id,
                title,
                message,
                'announcement',
                false
            ]);
            
            await client.query(notificationQuery, notificationParams);
            
            // NOTE: Add Socket.IO emit logic here if you've set it up
            /*
            instructorsResult.rows.forEach(instructor => {
                io.to(instructor.id.toString()).emit('newNotification', { 
                    title: announcement.title, 
                    message: announcement.message 
                });
            });
            */
        }
        
        await client.query('COMMIT');
        
        res.status(201).json({ 
            message: 'Announcement created and notifications sent',
            announcement 
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating announcement:', error);
        res.status(500).json({ error: 'Failed to create announcement' });
    } finally {
        client.release();
    }
};

// Update announcement
const updateAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, message, priority, target_audience } = req.body;
        
        const query = `
            UPDATE announcements 
            SET title = $1, message = $2, priority = $3, target_audience = $4, updated_at = NOW()
            WHERE id = $5
            RETURNING *
        `;
        
        const result = await db.query(query, [title, message, priority, target_audience, id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Announcement not found' });
        }
        
        res.json({ 
            message: 'Announcement updated successfully',
            announcement: result.rows[0] 
        });
    } catch (error) {
        console.error('Error updating announcement:', error);
        res.status(500).json({ error: 'Failed to update announcement' });
    }
};

// Delete announcement
const deleteAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        
        const query = 'DELETE FROM announcements WHERE id = $1 RETURNING *';
        const result = await db.query(query, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Announcement not found' });
        }
        
        res.json({ message: 'Announcement deleted successfully' });
    } catch (error) {
        console.error('Error deleting announcement:', error);
        res.status(500).json({ error: 'Failed to delete announcement' });
    }
};

// Get notifications for a user
const getNotifications = async (req, res) => {
    try {
        // Note: Using req.user.id is generally safer than req.params.user_id
        const userId = req.user.id; 
        
        const query = `
            SELECT * FROM notifications 
            WHERE user_id = $1 
            ORDER BY created_at DESC
            LIMIT 50
        `;
        
        const result = await db.query(query, [userId]);
        
        res.json({ notifications: result.rows });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
};

// Get order notifications for admin
const getOrderNotifications = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied: Admin role required' });
        }
        
        const userId = req.user.id;
        
        const query = `
            SELECT n.*, 'order' as notification_type
            FROM notifications n
            WHERE n.user_id = $1 AND n.type = 'order'
            ORDER BY n.created_at DESC
        `;
        
        const result = await db.query(query, [userId]);
        res.json({ notifications: result.rows });
    } catch (error) {
        console.error('Error fetching order notifications:', error);
        res.status(500).json({ error: 'Failed to fetch order notifications' });
    }
};

// Mark notification as read
const markNotificationAsRead = async (req, res) => {
    try {
        // FIX: Use 'id' (or confirm your router uses ':notification_id') 
        // Based on the URL structure, the router likely uses ':id'.
        // We'll assume your router uses `:id`
        const { id } = req.params; 
        const userId = req.user.id;
        
        const query = `
            UPDATE notifications 
            SET is_read = true, read_at = NOW()
            WHERE id = $1 AND user_id = $2
            RETURNING *
        `;
        
        // Use the extracted 'id' in the query parameters
        const result = await db.query(query, [id, userId]);
        
        if (result.rows.length === 0) {
            // This 404 is correct if the ID doesn't exist OR (more likely) 
            // the notification exists but doesn't belong to the logged-in user.
            return res.status(404).json({ error: 'Notification not found' });
        }
        
        res.json({ message: 'Notification marked as read' });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
};

// Mark all notifications as read
const markAllNotificationsAsRead = async (req, res) => {
    try {
        // Note: Using req.user.id is generally safer than req.params.user_id
        const userId = req.user.id;
        
        const query = `
            UPDATE notifications 
            SET is_read = true, read_at = NOW()
            WHERE user_id = $1 AND is_read = false
        `;
        
        await db.query(query, [userId]);
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ error: 'Failed to mark all notifications as read' });
    }
};

module.exports = {
    getAnnouncements,
    getAnnouncementById,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    getNotifications,
    getOrderNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
};