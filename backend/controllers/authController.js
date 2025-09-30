const bcrypt = require('bcryptjs');
const pool = require('../db');
const { generateToken } = require('../utils/auth');

// Login user
const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        // Find user by username
        const result = await pool.query(
            'SELECT id, username, email, password_hash, role, branch_id, first_name, last_name FROM users WHERE username = $1',
            [username]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = generateToken(user);

        // Return user data without password
        const { password_hash, ...userData } = user;

        res.json({
            message: 'Login successful',
            token,
            user: userData
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
};

// Get current user profile
const getProfile = async (req, res) => {
    try {
        const { password_hash, ...userData } = req.user;
        res.json({ user: userData });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Failed to get profile' });
    }
};

// Logout (client-side token removal)
const logout = (req, res) => {
    res.json({ message: 'Logout successful' });
};

module.exports = {
    login,
    getProfile,
    logout
};
