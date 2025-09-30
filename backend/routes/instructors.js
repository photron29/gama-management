const express = require('express');
const router = express.Router();
const {
    getInstructors,
    getInactiveInstructors,
    getInstructorById,
    createInstructor,
    updateInstructor,
    deleteInstructor,
    restoreInstructor
} = require('../controllers/instructorsController');
const { authenticateToken, authorizeRole } = require('../utils/auth');

// All routes require authentication and admin role
router.use(authenticateToken);
router.use(authorizeRole(['admin']));

// Get all instructors
router.get('/', getInstructors);

// Get inactive instructors
router.get('/inactive', getInactiveInstructors);

// Get instructor by ID
router.get('/:id', getInstructorById);

// Create new instructor
router.post('/', createInstructor);

// Update instructor
router.put('/:id', updateInstructor);

// Delete instructor
router.delete('/:id', deleteInstructor);

// Restore instructor
router.post('/:id/restore', restoreInstructor);

module.exports = router;
