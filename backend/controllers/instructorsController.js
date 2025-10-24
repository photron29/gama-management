const pool = require('../db');
const bcrypt = require('bcryptjs');

// Update instructor's own profile (personal details only)
const updateOwnProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const {
            first_name,
            last_name,
            email,
            phone,
            address,
            date_of_birth,
            emergency_contact_name,
            emergency_contact_phone
        } = req.body;

        // Get instructor ID from user_id
        const instructorQuery = 'SELECT id FROM instructors WHERE user_id = $1';
        const instructorResult = await pool.query(instructorQuery, [userId]);
        
        if (instructorResult.rows.length === 0) {
            return res.status(404).json({ error: 'Instructor profile not found' });
        }

        const instructorId = instructorResult.rows[0].id;

        // Update only personal details (instructors cannot change belt_level, branch_id, specialization, etc.)
        const result = await pool.query(
            `UPDATE instructors SET 
                first_name = COALESCE($1, first_name),
                last_name = COALESCE($2, last_name),
                email = COALESCE($3, email),
                phone = COALESCE($4, phone),
                address = COALESCE($5, address),
                date_of_birth = COALESCE($6, date_of_birth),
                emergency_contact_name = COALESCE($7, emergency_contact_name),
                emergency_contact_phone = COALESCE($8, emergency_contact_phone),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $9
            RETURNING *`,
            [
                first_name, last_name, email, phone, address, date_of_birth,
                emergency_contact_name, emergency_contact_phone, instructorId
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Instructor not found' });
        }

        // Get complete user data with all related information
        const completeUserQuery = `
            SELECT 
                u.id, u.username, u.email as user_email, u.role, u.branch_id, u.is_active, u.created_at,
                i.first_name, i.last_name, i.email, i.phone, i.address, i.date_of_birth,
                i.belt_level, i.specialization, i.certification_date,
                i.emergency_contact_name, i.emergency_contact_phone,
                b.name as branch_name
            FROM users u
            LEFT JOIN instructors i ON u.id = i.user_id
            LEFT JOIN branches b ON u.branch_id = b.id
            WHERE u.id = $1
        `;
        
        const completeUserResult = await pool.query(completeUserQuery, [userId]);
        
        if (completeUserResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userData = completeUserResult.rows[0];
        
        // Format the response to match frontend expectations
        const formattedUser = {
            id: userData.id,
            username: userData.username,
            email: userData.email || userData.user_email,
            role: userData.role,
            branch_id: userData.branch_id,
            is_active: userData.is_active,
            created_at: userData.created_at,
            first_name: userData.first_name,
            last_name: userData.last_name,
            phone: userData.phone,
            address: userData.address,
            date_of_birth: userData.date_of_birth,
            belt_level: userData.belt_level,
            specialization: userData.specialization,
            certification_date: userData.certification_date,
            emergency_contact_name: userData.emergency_contact_name,
            emergency_contact_phone: userData.emergency_contact_phone,
            branch_name: userData.branch_name
        };

        res.json({
            message: 'Profile updated successfully',
            user: formattedUser
        });
    } catch (error) {
        console.error('Update own profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
};

// Get all instructors (admin only)
const getInstructors = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied: Admin role required' });
        }

        const result = await pool.query(`
      SELECT 
        i.*, /* Selects all columns from the instructors table, including belt_level */
        b.name as branch_name, 
        u.username, u.email as user_email, 
        br.name as belt_name, br.color as belt_color, br.stripe_count
      FROM instructors i
      LEFT JOIN branches b ON i.branch_id = b.id
      LEFT JOIN users u ON i.user_id = u.id
      /* Join belt_ranks (br) using the i.belt_level column which is a descriptive string */
      LEFT JOIN belt_ranks br ON i.belt_level = br.name
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
      SELECT 
        i.*, 
        b.name as branch_name, 
        u.username, u.email as user_email, 
        br.name as belt_name, br.color as belt_color, br.stripe_count
      FROM instructors i
      LEFT JOIN branches b ON i.branch_id = b.id
      LEFT JOIN users u ON i.user_id = u.id
      /* Join belt_ranks (br) using the i.belt_level column which is a descriptive string */
      LEFT JOIN belt_ranks br ON i.belt_level = br.name
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
      SELECT 
        i.*, 
        b.name as branch_name, 
        u.username, u.email as user_email, 
        br.name as belt_name, br.color as belt_color, br.stripe_count
      FROM instructors i
      LEFT JOIN branches b ON i.branch_id = b.id
      LEFT JOIN users u ON i.user_id = u.id
      /* Join belt_ranks (br) using the i.belt_level column which is a descriptive string */
      LEFT JOIN belt_ranks br ON i.belt_level = br.name
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
            date_of_birth, 
            belt_level,
            branch_id,
            specialization,
            certification_date,
            emergency_contact_name, 
            emergency_contact_phone, 
            address 
        } = req.body;

        // Validate required fields
        if (!first_name || !last_name || !username || !password || !email || !phone || !date_of_birth || !belt_level) {
            return res.status(400).json({ error: 'Username, password, first name, last name, email, phone, date of birth, and belt level are required' });
        }

        // belt_level is a string, no need to parseInt
        const beltLevel = belt_level; 
        const branchId = branch_id && branch_id !== '' ? parseInt(branch_id) : null;
        
        // Handle potentially null optional fields and empty strings for date
        const certDate = certification_date === '' ? null : (certification_date || null); // ✅ FIX: Convert empty string to null
        const spec = specialization || null;
        const emerName = emergency_contact_name || null;
        const emerPhone = emergency_contact_phone || null;
        const addr = address || null;

        await client.query('BEGIN');

        // Check if username already exists
        const existingUser = await client.query('SELECT id FROM users WHERE username = $1', [username]);
        if (existingUser.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Username already exists' });
        }
        
        // Check if email already exists in users or instructors
        const existingEmail = await client.query('SELECT id FROM users WHERE email = $1 UNION SELECT id FROM instructors WHERE email = $1', [email]);
        if (existingEmail.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Email already exists' });
        }

        // Hash the password
        const password_hash = await bcrypt.hash(password, 10);

        // Insert ONLY user-specific columns into users table
        const userResult = await client.query(
            `INSERT INTO users (username, email, password_hash, role)
             VALUES ($1, $2, $3, 'instructor')
             RETURNING id`,
            [username, email, password_hash]
        );

        const user_id = userResult.rows[0].id;

        // Insert ALL instructor fields using belt_level column
        const instructorResult = await client.query(
            `INSERT INTO instructors (
                user_id, first_name, last_name, email, phone, date_of_birth, 
                belt_level, branch_id, specialization, certification_date, 
                emergency_contact_name, emergency_contact_phone, address, is_active
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, true) 
            RETURNING *`,
            [
                user_id, first_name, last_name, email, phone, date_of_birth,
                beltLevel, branchId, spec, certDate, emerName, emerPhone, addr
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
            date_of_birth, 
            belt_level,
            branch_id,
            specialization,
            certification_date,
            emergency_contact_name, 
            emergency_contact_phone, 
            address, 
            is_active
        } = req.body;

        // belt_level is a string
        const beltLevel = belt_level || null;

        // Convert branch_id to integer if provided, allow null
        const branchId = branch_id === null ? null : (branch_id ? parseInt(branch_id) : undefined);

        // 🎯 FIX: Convert empty string for date fields to null before passing to COALESCE
        const certDate = certification_date === '' ? null : (certification_date || undefined);


        console.log('Update instructor data:', {
            id, first_name, last_name, email, phone, date_of_birth,
            beltLevel, branchId, specialization, certDate, // Using certDate here
            emergency_contact_name, emergency_contact_phone, address, is_active
        });

        // Updated query to use belt_level column
        const result = await pool.query(
            `UPDATE instructors SET 
                first_name = COALESCE($1, first_name),
                last_name = COALESCE($2, last_name),
                email = COALESCE($3, email),
                phone = COALESCE($4, phone),
                date_of_birth = COALESCE($5, date_of_birth),
                belt_level = COALESCE($6, belt_level),
                branch_id = COALESCE($7, branch_id),
                specialization = COALESCE($8, specialization),
                certification_date = COALESCE($9, certification_date), /* Now $9 will be a date string or NULL */
                emergency_contact_name = COALESCE($10, emergency_contact_name),
                emergency_contact_phone = COALESCE($11, emergency_contact_phone),
                address = COALESCE($12, address),
                is_active = COALESCE($13, is_active),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $14
            RETURNING *`,
            [
                first_name, last_name, email, phone, date_of_birth, 
                beltLevel, branchId, specialization, certDate, // Using the fixed certDate
                emergency_contact_name, emergency_contact_phone, address,
                is_active, id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Instructor not found' });
        }

        // Get the user_id from the instructor record
        const instructorData = result.rows[0];
        
        // Get complete user data with all related information
        const completeUserQuery = `
            SELECT 
                u.id, u.username, u.email as user_email, u.role, u.branch_id, u.is_active, u.created_at,
                i.first_name, i.last_name, i.email, i.phone, i.address, i.date_of_birth,
                i.belt_level, i.specialization, i.certification_date,
                i.emergency_contact_name, i.emergency_contact_phone,
                b.name as branch_name
            FROM users u
            LEFT JOIN instructors i ON u.id = i.user_id
            LEFT JOIN branches b ON u.branch_id = b.id
            WHERE i.id = $1
        `;
        
        const completeUserResult = await pool.query(completeUserQuery, [id]);
        
        if (completeUserResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userData = completeUserResult.rows[0];
        
        // Format the response to match frontend expectations
        const formattedUser = {
            id: userData.id,
            username: userData.username,
            email: userData.email || userData.user_email,
            role: userData.role,
            branch_id: userData.branch_id,
            is_active: userData.is_active,
            created_at: userData.created_at,
            first_name: userData.first_name,
            last_name: userData.last_name,
            phone: userData.phone,
            address: userData.address,
            date_of_birth: userData.date_of_birth,
            belt_level: userData.belt_level,
            specialization: userData.specialization,
            certification_date: userData.certification_date,
            emergency_contact_name: userData.emergency_contact_name,
            emergency_contact_phone: userData.emergency_contact_phone,
            branch_name: userData.branch_name
        };

        res.json({
            message: 'Instructor updated successfully',
            instructor: formattedUser
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

                // Delete the instructor record first
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
    updateOwnProfile,
    deleteInstructor,
    restoreInstructor
};