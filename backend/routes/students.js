const express = require('express');
const router = express.Router();
const {
    getStudents,
    getInactiveStudents,
    getStudentById,
    createStudent,
    updateStudent,
    deleteStudent,
    restoreStudent
} = require('../controllers/studentsController');
const { authenticateToken, authorizeRole } = require('../utils/auth');

// All routes require authentication
router.use(authenticateToken);

// Get all students
router.get('/', getStudents);

// Get inactive students (admin only)
router.get('/inactive', authorizeRole(['admin']), getInactiveStudents);

// Get student by ID
router.get('/:id', getStudentById);

// Create new student (admin and instructor)
router.post('/', createStudent);

// Update student (admin and instructor)
router.put('/:id', updateStudent);

// Delete student (admin and instructor)
router.delete('/:id', deleteStudent);

// Restore student (admin only)
router.post('/:id/restore', authorizeRole(['admin']), restoreStudent);

module.exports = router;
