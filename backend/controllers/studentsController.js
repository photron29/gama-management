const pool = require('../db');

// Get all students (with branch filtering for instructors)
const getStudents = async (req, res) => {
    try {
        const { include_inactive } = req.query;

        let query = `
      SELECT s.*, b.name as branch_name, br.belt_name, br.belt_color, br.stripe_level, br.dan_level
      FROM students s 
      JOIN branches b ON s.branch_id = b.id
      LEFT JOIN belt_ranks br ON s.belt_level_id = br.id
      WHERE s.is_active = true
    `;
        let params = [];
        let paramCount = 0;

        // Filter by branch for instructors
        if (req.user.role === 'instructor') {
            query += ` AND s.branch_id = $${++paramCount}`;
            params.push(req.user.branch_id);
        }

        query += ` ORDER BY s.last_name, s.first_name`;

        const result = await pool.query(query, params);
        res.json({ students: result.rows });
    } catch (error) {
        console.error('Get students error:', error);
        res.status(500).json({ error: 'Failed to fetch students' });
    }
};

// Get inactive students (admin only)
const getInactiveStudents = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied: Admin role required' });
        }

        const result = await pool.query(`
      SELECT s.*, b.name as branch_name 
      FROM students s 
      JOIN branches b ON s.branch_id = b.id
      WHERE s.is_active = false
      ORDER BY s.updated_at DESC, s.last_name, s.first_name
    `);

        res.json({ students: result.rows });
    } catch (error) {
        console.error('Get inactive students error:', error);
        res.status(500).json({ error: 'Failed to fetch inactive students' });
    }
};

// Get student by ID
const getStudentById = async (req, res) => {
    try {
        const { id } = req.params;

        let query = `
      SELECT s.*, b.name as branch_name 
      FROM students s 
      JOIN branches b ON s.branch_id = b.id 
      WHERE s.id = $1
    `;
        let params = [id];

        // Filter by branch for instructors
        if (req.user.role === 'instructor') {
            query += ` AND s.branch_id = $2`;
            params.push(req.user.branch_id);
        }

        const result = await pool.query(query, params);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Student not found' });
        }

        res.json({ student: result.rows[0] });
    } catch (error) {
        console.error('Get student error:', error);
        res.status(500).json({ error: 'Failed to fetch student' });
    }
};

// Create new student
const createStudent = async (req, res) => {
    try {
        const {
            first_name,
            last_name,
            email,
            phone,
            date_of_birth,
            belt_level_id,
            branch_id,
            emergency_contact_name,
            emergency_contact_phone,
            address
        } = req.body;

        // Validate required fields
        if (!first_name || !last_name || !branch_id) {
            return res.status(400).json({ error: 'First name, last name, and branch are required' });
        }

        // Convert belt_level_id to integer if provided
        const beltLevelId = belt_level_id ? parseInt(belt_level_id) : null;

        // For instructors, ensure they can only create students in their branch
        if (req.user.role === 'instructor' && branch_id !== req.user.branch_id) {
            return res.status(403).json({ error: 'Cannot create student in different branch' });
        }

        const result = await pool.query(
            `INSERT INTO students (
        first_name, last_name, email, phone, date_of_birth, belt_level_id, 
        branch_id, emergency_contact_name, emergency_contact_phone, address
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
      RETURNING *`,
            [
                first_name, last_name, email, phone, date_of_birth, beltLevelId,
                branch_id, emergency_contact_name, emergency_contact_phone, address
            ]
        );

        res.status(201).json({
            message: 'Student created successfully',
            student: result.rows[0]
        });
    } catch (error) {
        console.error('Create student error:', error);
        res.status(500).json({ error: 'Failed to create student' });
    }
};

// Update student
const updateStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            first_name,
            last_name,
            email,
            phone,
            date_of_birth,
            belt_level_id,
            branch_id,
            emergency_contact_name,
            emergency_contact_phone,
            address,
            is_active
        } = req.body;

        // Convert belt_level_id to integer if provided
        const beltLevelId = belt_level_id ? parseInt(belt_level_id) : null;

        // Check if student exists and user has access
        let checkQuery = 'SELECT * FROM students WHERE id = $1';
        let checkParams = [id];

        if (req.user.role === 'instructor') {
            checkQuery += ' AND branch_id = $2';
            checkParams.push(req.user.branch_id);
        }

        const checkResult = await pool.query(checkQuery, checkParams);
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Student not found' });
        }

        // For instructors, prevent changing branch
        if (req.user.role === 'instructor' && branch_id && branch_id !== req.user.branch_id) {
            return res.status(403).json({ error: 'Cannot change student branch' });
        }

        const result = await pool.query(
            `UPDATE students SET 
        first_name = COALESCE($1, first_name),
        last_name = COALESCE($2, last_name),
        email = COALESCE($3, email),
        phone = COALESCE($4, phone),
        date_of_birth = COALESCE($5, date_of_birth),
        belt_level_id = COALESCE($6, belt_level_id),
        branch_id = COALESCE($7, branch_id),
        emergency_contact_name = COALESCE($8, emergency_contact_name),
        emergency_contact_phone = COALESCE($9, emergency_contact_phone),
        address = COALESCE($10, address),
        is_active = COALESCE($11, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $12 
      RETURNING *`,
            [
                first_name, last_name, email, phone, date_of_birth, beltLevelId,
                branch_id, emergency_contact_name, emergency_contact_phone, address,
                is_active, id
            ]
        );

        res.json({
            message: 'Student updated successfully',
            student: result.rows[0]
        });
    } catch (error) {
        console.error('Update student error:', error);
        res.status(500).json({ error: 'Failed to update student' });
    }
};

// Delete student (soft delete for instructors, hard delete for admins)
const deleteStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const { permanent } = req.query;

        // Check if student exists and user has access
        let checkQuery = 'SELECT * FROM students WHERE id = $1';
        let checkParams = [id];

        if (req.user.role === 'instructor') {
            checkQuery += ' AND branch_id = $2';
            checkParams.push(req.user.branch_id);
        }

        const checkResult = await pool.query(checkQuery, checkParams);
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Student not found' });
        }

        if (permanent === 'true' && req.user.role === 'admin') {
            // Permanent delete - remove all related records first
            await pool.query('DELETE FROM attendance WHERE student_id = $1', [id]);
            await pool.query('DELETE FROM fees WHERE student_id = $1', [id]);
            await pool.query('DELETE FROM students WHERE id = $1', [id]);

            res.json({ message: 'Student permanently deleted successfully' });
        } else {
            // Soft delete by setting is_active to false
            await pool.query(
                'UPDATE students SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
                [id]
            );

            res.json({ message: 'Student deactivated successfully' });
        }
    } catch (error) {
        console.error('Delete student error:', error);
        res.status(500).json({ error: 'Failed to delete student' });
    }
};

// Restore student (admin only)
const restoreStudent = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied: Admin role required' });
        }

        const { id } = req.params;

        // Check if student exists and is inactive
        const checkResult = await pool.query(
            'SELECT * FROM students WHERE id = $1 AND is_active = false',
            [id]
        );

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Inactive student not found' });
        }

        // Restore student
        await pool.query(
            'UPDATE students SET is_active = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
            [id]
        );

        res.json({ message: 'Student restored successfully' });
    } catch (error) {
        console.error('Restore student error:', error);
        res.status(500).json({ error: 'Failed to restore student' });
    }
};

module.exports = {
    getStudents,
    getInactiveStudents,
    getStudentById,
    createStudent,
    updateStudent,
    deleteStudent,
    restoreStudent
};
