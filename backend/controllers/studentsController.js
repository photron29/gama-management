const pool = require('../db');

// Get all students (with branch filtering for instructors)
const getStudents = async (req, res) => {
    try {
        const { include_inactive } = req.query;

        let query = `
      SELECT s.*, b.name as branch_name, br.name as belt_name, br.color as belt_color
      FROM students s 
      JOIN branches b ON s.branch_id = b.id
      LEFT JOIN belt_ranks br ON s.belt_id = br.id /* ✅ FIX: Changed s.belt_rank_id to s.belt_id */
      WHERE s.is_active = true
    `;
        let params = [];
        let paramCount = 0;

        // Filter by branch for instructors
        if (req.user.role === 'instructor') {
            query += ` AND s.branch_id = $${++paramCount}`;
            params.push(req.user.branch_id);
        }
        
        // Include inactive students only if the admin requests it (and if not already filtered by the WHERE clause)
        if (req.user.role === 'admin' && include_inactive === 'true') {
            query = query.replace('WHERE s.is_active = true', 'WHERE 1=1'); // Remove the default active filter
        }


        query += ` ORDER BY s.name`;

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
      SELECT s.*, b.name as branch_name, br.name as belt_name, br.color as belt_color /* ✅ FIX: Added belt info */
      FROM students s 
      JOIN branches b ON s.branch_id = b.id
      LEFT JOIN belt_ranks br ON s.belt_id = br.id /* ✅ FIX: Added join on s.belt_id */
      WHERE s.is_active = false
      ORDER BY s.updated_at DESC, s.name
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
      SELECT s.*, b.name as branch_name, br.name as belt_name, br.color as belt_color /* ✅ FIX: Added belt info */
      FROM students s 
      JOIN branches b ON s.branch_id = b.id 
      LEFT JOIN belt_ranks br ON s.belt_id = br.id /* ✅ FIX: Added join on s.belt_id */
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
            name,
            gender,
            date_of_birth,
            age,
            contact_number,
            email,
            aadhar_card_number,
            address,
            father_contact_number,
            father_name,
            father_occupation,
            mother_name,
            mother_contact_number,
            mother_occupation,
            whatsapp_number,
            fee_payment_preference,
            belt_rank_id, // Keep for request body destructuring
            branch_id,
            notes
        } = req.body;

        // Validate required fields
        if (!name || !gender || !date_of_birth || !age || !contact_number || !whatsapp_number || !fee_payment_preference || !branch_id) {
            return res.status(400).json({ 
                error: 'Name, gender, date of birth, age, contact number, WhatsApp number, fee payment preference, and branch are required' 
            });
        }

        // Convert belt_rank_id from body to beltId for DB, set default if empty
        const beltId = belt_rank_id && belt_rank_id !== '' ? parseInt(belt_rank_id) : 1; // Default to White Belt (ID 1)

        // For instructors, ensure they can only create students in their branch
        if (req.user.role === 'instructor' && branch_id !== req.user.branch_id) {
            return res.status(403).json({ error: 'Cannot create student in different branch' });
        }

        const result = await pool.query(
            `INSERT INTO students (
        name, gender, date_of_birth, age, contact_number, email, aadhar_card_number, 
        address, father_contact_number, father_name, father_occupation, 
        mother_name, mother_contact_number, mother_occupation, whatsapp_number, 
        fee_payment_preference, belt_id, branch_id, notes /* ✅ FIX: Changed belt_rank_id to belt_id */
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19) 
      RETURNING *`,
            [
                name, gender, date_of_birth, age, contact_number, email, aadhar_card_number,
                address, father_contact_number, father_name, father_occupation,
                mother_name, mother_contact_number, mother_occupation, whatsapp_number,
                fee_payment_preference, beltId, branch_id, notes /* ✅ FIX: Used beltId variable */
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
            name,
            gender,
            date_of_birth,
            age,
            contact_number,
            email,
            aadhar_card_number,
            address,
            father_contact_number,
            father_name,
            father_occupation,
            mother_name,
            mother_contact_number,
            mother_occupation,
            whatsapp_number,
            fee_payment_preference,
            belt_rank_id, // Keep for request body destructuring
            branch_id,
            notes,
            is_active
        } = req.body;

        // Convert belt_rank_id from body to beltId for DB
        const beltId = belt_rank_id && belt_rank_id !== '' ? parseInt(belt_rank_id) : null;

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
        name = COALESCE($1, name),
        gender = COALESCE($2, gender),
        date_of_birth = COALESCE($3, date_of_birth),
        age = COALESCE($4, age),
        contact_number = COALESCE($5, contact_number),
        email = COALESCE($6, email),
        aadhar_card_number = COALESCE($7, aadhar_card_number),
        address = COALESCE($8, address),
        father_contact_number = COALESCE($9, father_contact_number),
        father_name = COALESCE($10, father_name),
        father_occupation = COALESCE($11, father_occupation),
        mother_name = COALESCE($12, mother_name),
        mother_contact_number = COALESCE($13, mother_contact_number),
        mother_occupation = COALESCE($14, mother_occupation),
        whatsapp_number = COALESCE($15, whatsapp_number),
        fee_payment_preference = COALESCE($16, fee_payment_preference),
        belt_id = COALESCE($17, belt_id), /* ✅ FIX: Changed belt_rank_id to belt_id */
        branch_id = COALESCE($18, branch_id),
        notes = COALESCE($19, notes),
        is_active = COALESCE($20, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $21 
      RETURNING *`,
            [
                name, gender, date_of_birth, age, contact_number, email, aadhar_card_number,
                address, father_contact_number, father_name, father_occupation,
                mother_name, mother_contact_number, mother_occupation, whatsapp_number,
                fee_payment_preference, beltId, branch_id, notes, is_active, id /* ✅ FIX: Used beltId variable */
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