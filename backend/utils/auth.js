const jwt = require('jsonwebtoken');
const pool = require('../db');
const config = require('../config');

const JWT_SECRET = config.jwt.secret || 'your-secret-key-change-in-production';

// Generate JWT token
const generateToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            username: user.username,
            role: user.role,
            branch_id: user.branch_id
        },
        JWT_SECRET,
        { expiresIn: '24h' }
    );
};

// Verify JWT token
const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch {
        return null;
    }
};

// Authentication middleware
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Access token required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }

    try {
        const result = await pool.query(
            'SELECT id, username, role, branch_id FROM users WHERE id = $1',
            [decoded.id]
        );

        if (!result.rows || result.rows.length === 0) {
            return res.status(403).json({ error: 'User not found' });
        }

        req.user = result.rows[0];
        next();
    } catch (error) {
        console.error('Authentication error:', error.message);
        return res.status(500).json({ error: 'Internal server error during authentication' });
    }
};

// Role-based authorization
const authorizeRole = (roles) => (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    if (!roles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
};

// Branch access control
const authorizeBranchAccess = (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    if (req.user.role === 'admin') return next();

    if (req.user.role === 'instructor') {
        const branchId = req.params.branchId || req.body.branch_id || req.query.branch_id;
        const branchIdInt = parseInt(branchId, 10);

        if (branchId && !isNaN(branchIdInt) && branchIdInt !== req.user.branch_id) {
            return res.status(403).json({ error: 'Access denied: Branch access not allowed' });
        }
    }

    next();
};

module.exports = {
    generateToken,
    verifyToken,
    authenticateToken,
    authorizeRole,
    authorizeBranchAccess
};
