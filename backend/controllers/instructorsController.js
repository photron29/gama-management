const pool = require('../db');
const bcrypt = require('bcryptjs');

// Get all instructors (admin only)
const getInstructors = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied: Admin role required' });
        }

        const result = await pool.query(`
      SELECT i.*, b.name as branch_name, u.username, u.email as user_email,
             br.belt_name, br.belt_color, br.stripe_level, br.dan_level
      FROM instructors i
      LEFT JOIN branches b ON i.branch_id = b.id
      LEFT JOIN users u ON i.user_id = u.id
      LEFT JOIN belt_ranks br ON i.belt_level_id = br.id
      WHERE i.is_active = true
      ORDER BY i.last_name, i.first_name
    `);

        res.json({ instructors: result.rows });
    } catch (error) {
        console.error('Get instructors error:', error);
        res.status(500).json({ error: 'Failed to fetch instructors' });
    }
};

// Get inactive instructors (admin only)
const getInactiveInstructors = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied: Admin role required' });
        }

        const result = await pool.query(`
      SELECT i.*, b.name as branch_name, u.username, u.email as user_email,
             br.belt_name, br.belt_color, br.stripe_level, br.dan_level
      FROM instructors i
      LEFT JOIN branches b ON i.branch_id = b.id
      LEFT JOIN users u ON i.user_id = u.id
      LEFT JOIN belt_ranks br ON i.belt_level_id = br.id
      WHERE i.is_active = false
      ORDER BY i.updated_at DESC, i.last_name, i.first_name
    `);

        res.json({ instructors: result.rows });
    } catch (error) {
        console.error('Get inactive instructors error:', error);
        res.status(500).json({ error: 'Failed to fetch inactive instructors' });
    }
};

// Get instructor by ID
const getInstructorById = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied: Admin role required' });
        }

        const { id } = req.params;

        const result = await pool.query(`
      SELECT i.*, b.name as branch_name, u.username, u.email as user_email,
             br.belt_name, br.belt_color, br.stripe_level, br.dan_level
      FROM instructors i
      LEFT JOIN branches b ON i.branch_id = b.id
      LEFT JOIN users u ON i.user_id = u.id
      LEFT JOIN belt_ranks br ON i.belt_level_id = br.id
      WHERE i.id = $1
    `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Instructor not found' });
        }

        res.json({ instructor: result.rows[0] });
    } catch (error) {
        console.error('Get instructor error:', error);
        res.status(500).json({ error: 'Failed to fetch instructor' });
    }
};

// Create new instructor (admin only)
const createInstructor = async (req, res) => {
    const client = await pool.connect();
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied: Admin role required' });
        }

        console.log('🔍 Creating instructor with data:', req.body);

        const {
            username,
            password,
            first_name,
            last_name,
            email,
            phone,
            belt_level_id,
            branch_id,
            specialization,
            certification_date
        } = req.body;

        // Validate required fields
        if (!first_name || !last_name || !username || !password) {
            return res.status(400).json({ error: 'First name, last name, username, and password are required' });
        }

        // Convert belt_level_id to integer if provided, set default if empty
        const beltLevelId = belt_level_id && belt_level_id !== '' ? parseInt(belt_level_id) : 17; // Default to Black Belt - 1st Dan

        // Convert branch_id to integer if provided, set to null if empty
        const branchId = branch_id && branch_id !== '' ? parseInt(branch_id) : null;

        await client.query('BEGIN');

        // Check if username already exists
        const existingUser = await client.query(
            'SELECT id FROM users WHERE username = $1',
            [username]
        );

        if (existingUser.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Username already exists' });
        }

        // Hash the password
        const password_hash = await bcrypt.hash(password, 10);

        // Create user account (no branch assignment initially)
        const userResult = await client.query(
            `INSERT INTO users (username, email, password_hash, role, first_name, last_name, phone, belt_level_id)
             VALUES ($1, $2, $3, 'instructor', $4, $5, $6, $7)
             RETURNING id`,
            [username, email, password_hash, first_name, last_name, phone, beltLevelId]
        );

        const user_id = userResult.rows[0].id;

        // Create instructor record
        const instructorResult = await client.query(
            `INSERT INTO instructors (
        user_id, first_name, last_name, email, phone, belt_level_id, branch_id,
        specialization, certification_date, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true) 
      RETURNING *`,
            [
                user_id, first_name, last_name, email, phone, beltLevelId, branchId,
                specialization, certification_date
            ]
        );

        await client.query('COMMIT');

        res.status(201).json({
            message: 'Instructor created successfully',
            instructor: { ...instructorResult.rows[0], username }
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Create instructor error:', error);
        res.status(500).json({ error: 'Failed to create instructor' });
    } finally {
        client.release();
    }
};

// Update instructor (admin only)
const updateInstructor = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied: Admin role required' });
        }

        const { id } = req.params;
        const {
            first_name,
            last_name,
            email,
            phone,
            belt_level_id,
            branch_id,
            specialization,
            certification_date,
            is_active
        } = req.body;

        // Convert belt_level_id to integer if provided, keep existing if empty
        const beltLevelId = belt_level_id && belt_level_id !== '' ? parseInt(belt_level_id) : null;

        const result = await pool.query(
            `UPDATE instructors SET 
        first_name = COALESCE($1, first_name),
        last_name = COALESCE($2, last_name),
        email = COALESCE($3, email),
        phone = COALESCE($4, phone),
        belt_level_id = COALESCE($5, belt_level_id),
        branch_id = COALESCE($6, branch_id),
        specialization = COALESCE($7, specialization),
        certification_date = COALESCE($8, certification_date),
        is_active = COALESCE($9, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $10 
      RETURNING *`,
            [
                first_name, last_name, email, phone, beltLevelId,
                branch_id, specialization, certification_date, is_active, id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Instructor not found' });
        }

        res.json({
            message: 'Instructor updated successfully',
            instructor: result.rows[0]
        });
    } catch (error) {
        console.error('Update instructor error:', error);
        res.status(500).json({ error: 'Failed to update instructor' });
    }
};

// Delete instructor (soft delete for admins, hard delete for admins with permanent flag)
const deleteInstructor = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied: Admin role required' });
        }

        const { id } = req.params;
        const { permanent } = req.query;

        console.log('Delete instructor request - ID:', id, 'Permanent:', permanent);

        // Check if instructor exists
        const checkResult = await pool.query('SELECT * FROM instructors WHERE id = $1', [id]);
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Instructor not found' });
        }

        if (permanent === 'true') {
            console.log('Performing permanent delete for instructor:', id);

            try {
                // Get the instructor's user_id first
                const instructorResult = await pool.query('SELECT user_id FROM instructors WHERE id = $1', [id]);
                const userId = instructorResult.rows[0]?.user_id;

                // Delete the instructor record first (this should cascade or we handle it manually)
                await pool.query('DELETE FROM instructors WHERE id = $1', [id]);

                // If there's a user_id, try to delete the user account
                if (userId) {
                    try {
                        await pool.query('DELETE FROM users WHERE id = $1', [userId]);
                        console.log('User account also deleted');
                    } catch (userDeleteError) {
                        console.log('Could not delete user account (may have foreign key constraints):', userDeleteError.message);
                        // Continue anyway since the instructor is deleted
                    }
                }

                console.log('Instructor permanently deleted successfully');
                res.json({ message: 'Instructor permanently deleted successfully' });
            } catch (deleteError) {
                console.error('Error during permanent delete:', deleteError);
                res.status(500).json({ error: 'Failed to permanently delete instructor: ' + deleteError.message });
            }
        } else {
            // Soft delete by setting is_active to false
            await pool.query(
                'UPDATE instructors SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
                [id]
            );

            res.json({ message: 'Instructor deactivated successfully' });
        }
    } catch (error) {
        console.error('Delete instructor error:', error);
        res.status(500).json({ error: 'Failed to delete instructor' });
    }
};

// Restore instructor (admin only)
const restoreInstructor = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied: Admin role required' });
        }

        const { id } = req.params;

        // Check if instructor exists and is inactive
        const checkResult = await pool.query(
            'SELECT * FROM instructors WHERE id = $1 AND is_active = false',
            [id]
        );

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Inactive instructor not found' });
        }

        // Restore instructor
        await pool.query(
            'UPDATE instructors SET is_active = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
            [id]
        );

        res.json({ message: 'Instructor restored successfully' });
    } catch (error) {
        console.error('Restore instructor error:', error);
        res.status(500).json({ error: 'Failed to restore instructor' });
    }
};

module.exports = {
    getInstructors,
    getInactiveInstructors,
    getInstructorById,
    createInstructor,
    updateInstructor,
    deleteInstructor,
    restoreInstructor
};
