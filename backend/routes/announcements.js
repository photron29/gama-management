const express = require('express');
const router = express.Router();
const {
    getAnnouncements,
    getAnnouncementById,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    getNotifications,
    getOrderNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead
} = require('../controllers/announcementsController');
const { authenticateToken, authorizeRole } = require('../utils/auth');

// Announcements routes (admin only)
router.get('/', authenticateToken, authorizeRole(['admin']), getAnnouncements);
router.get('/:id', authenticateToken, authorizeRole(['admin']), getAnnouncementById);
router.post('/', authenticateToken, authorizeRole(['admin']), createAnnouncement);
router.put('/:id', authenticateToken, authorizeRole(['admin']), updateAnnouncement);
router.delete('/:id', authenticateToken, authorizeRole(['admin']), deleteAnnouncement);

// Notifications routes (all authenticated users)
router.get('/notifications/all', authenticateToken, getNotifications);
router.get('/notifications/orders', authenticateToken, authorizeRole(['admin']), getOrderNotifications);
router.put('/notifications/:id/read', authenticateToken, markNotificationAsRead);
router.put('/notifications/read-all', authenticateToken, markAllNotificationsAsRead);

module.exports = router;
