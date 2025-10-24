const bcrypt = require('bcryptjs');
const pool = require('../db');
const { generateToken } = require('../utils/auth');

// Login user
const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validate input
        if (!username || !password) {
            return res.status(400).json({ 
                error: 'Username and password are required',
                code: 'MISSING_CREDENTIALS'
            });
        }

        // Database authentication with complete user data
        let result;
        try {
            result = await pool.query(`
                SELECT 
                    u.id, u.username, u.name, u.email, u.password_hash, u.role, u.branch_id, u.is_active, u.created_at,
                    i.first_name, i.last_name, i.phone, i.address, i.date_of_birth,
                    i.belt_level, i.specialization, i.certification_date,
                    i.emergency_contact_name, i.emergency_contact_phone,
                    b.name as branch_name
                FROM users u
                LEFT JOIN instructors i ON u.id = i.user_id
                LEFT JOIN branches b ON u.branch_id = b.id
                WHERE u.username = $1
            `, [username]);
        } catch (dbError) {
            console.error('Database query error:', dbError);
            return res.status(500).json({ 
                error: 'Database connection failed',
                code: 'DATABASE_ERROR'
            });
        }

        if (result.rows.length === 0) {
            return res.status(401).json({ 
                error: 'Invalid username or password',
                code: 'INVALID_CREDENTIALS'
            });
        }

        const user = result.rows[0];

        // Verify password
        let isValidPassword;
        try {
            isValidPassword = await bcrypt.compare(password, user.password_hash);
        } catch (bcryptError) {
            console.error('Password comparison error:', bcryptError);
            return res.status(500).json({ 
                error: 'Authentication service error',
                code: 'AUTH_SERVICE_ERROR'
            });
        }

        if (!isValidPassword) {
            return res.status(401).json({ 
                error: 'Invalid username or password',
                code: 'INVALID_CREDENTIALS'
            });
        }

        // Generate JWT token
        let token;
        try {
            token = generateToken(user);
        } catch (tokenError) {
            console.error('Token generation error:', tokenError);
            return res.status(500).json({ 
                error: 'Token generation failed',
                code: 'TOKEN_ERROR'
            });
        }

        // Return complete user data without password
        const { password_hash, ...userData } = user;

        // Format the response to include all fields
        const formattedUser = {
            id: userData.id,
            username: userData.username,
            name: userData.name,
            email: userData.email,
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
            message: 'Login successful',
            token,
            user: formattedUser
        });

    } catch (error) {
        console.error('Unexpected login error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            code: 'INTERNAL_ERROR'
        });
    }
};

// Get current user profile
const getProfile = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ 
                error: 'User not authenticated',
                code: 'NOT_AUTHENTICATED'
            });
        }

        // Fetch complete user data from database
        const result = await pool.query(`
            SELECT 
                u.id, u.username, u.name, u.email, u.role, u.branch_id, u.is_active, u.created_at,
                i.first_name, i.last_name, i.phone, i.address, i.date_of_birth,
                i.belt_level, i.specialization, i.certification_date,
                i.emergency_contact_name, i.emergency_contact_phone,
                b.name as branch_name
            FROM users u
            LEFT JOIN instructors i ON u.id = i.user_id
            LEFT JOIN branches b ON u.branch_id = b.id
            WHERE u.id = $1
        `, [req.user.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ 
                error: 'User not found',
                code: 'USER_NOT_FOUND'
            });
        }

        const userData = result.rows[0];
        
        // Format the response to include all fields
        const formattedUser = {
            id: userData.id,
            username: userData.username,
            name: userData.name,
            email: userData.email,
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

        res.json({ user: formattedUser });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ 
            error: 'Failed to retrieve user profile',
            code: 'PROFILE_ERROR'
        });
    }
};

// Logout (client-side token removal)
const logout = (req, res) => {
    res.json({ message: 'Logout successful' });
};

// Update user profile
const updateUser = async (req, res) => {
    try {
        const { username, name, email, branch_id } = req.body;
        const userId = req.user.id;

        // Validate input
        if (!username && !name && !email && branch_id === undefined) {
            return res.status(400).json({ error: 'At least one field must be provided for update' });
        }

        // Build dynamic update query
        const updateFields = [];
        const updateValues = [];
        let paramIndex = 1;

        if (username !== undefined) {
            updateFields.push(`username = $${paramIndex}`);
            updateValues.push(username);
            paramIndex++;
        }

        if (name !== undefined) {
            updateFields.push(`name = $${paramIndex}`);
            updateValues.push(name);
            paramIndex++;
        }

        if (email !== undefined) {
            updateFields.push(`email = $${paramIndex}`);
            updateValues.push(email);
            paramIndex++;
        }

        if (branch_id !== undefined) {
            updateFields.push(`branch_id = $${paramIndex}`);
            updateValues.push(branch_id);
            paramIndex++;
        }

        updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
        updateValues.push(userId);

        const query = `
            UPDATE users 
            SET ${updateFields.join(', ')}
            WHERE id = $${paramIndex}
            RETURNING id, username, name, email, role, branch_id, is_active, created_at, updated_at
        `;

        const result = await pool.query(query, updateValues);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ 
            message: 'User updated successfully',
            user: result.rows[0]
        });

    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
};

module.exports = {
    login,
    getProfile,
    updateUser,
    logout
};
