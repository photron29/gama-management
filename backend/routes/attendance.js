const express = require('express');
const router = express.Router();
const {
    getAttendance,
    getAttendanceById,
    createAttendance,
    updateAttendance,
    deleteAttendance
} = require('../controllers/attendanceController');
const { authenticateToken } = require('../utils/auth');

// All routes require authentication
router.use(authenticateToken);

// Get attendance records
router.get('/', getAttendance);

// Get attendance by ID
router.get('/:id', getAttendanceById);

// Create attendance record
router.post('/', createAttendance);

// Update attendance record
router.put('/:id', updateAttendance);

// Delete attendance record
router.delete('/:id', deleteAttendance);

module.exports = router;
