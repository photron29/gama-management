const jwt = require('jsonwebtoken');
const pool = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET;

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
    } catch (error) {
        return null;
    }
};

// Verify Supabase JWT token
const verifySupabaseToken = (token) => {
    try {
        if (!SUPABASE_JWT_SECRET) {
            console.warn('SUPABASE_JWT_SECRET not set, using fallback verification');
            return jwt.decode(token);
        }
        return jwt.verify(token, SUPABASE_JWT_SECRET);
    } catch (error) {
        console.error('Supabase token verification error:', error);
        return null;
    }
};

// Authentication middleware
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }

    try {
        // Get user from database to ensure they still exist and are active
        const result = await pool.query(
            'SELECT id, username, role, branch_id, first_name, last_name FROM users WHERE id = $1',
            [decoded.id]
        );

        if (result.rows.length === 0) {
            return res.status(403).json({ error: 'User not found' });
        }

        req.user = result.rows[0];
        console.log('Authenticated user:', { id: req.user.id, username: req.user.username, role: req.user.role, branch_id: req.user.branch_id });
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
};

// Role-based authorization middleware
const authorizeRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        console.log('Role check:', { userRole: req.user.role, allowedRoles: roles, path: req.path });

        if (!roles.includes(req.user.role)) {
            console.log('Access denied:', { userRole: req.user.role, allowedRoles: roles });
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        next();
    };
};

// Branch access control for instructors
const authorizeBranchAccess = async (req, res, next) => {
    if (req.user.role === 'admin') {
        return next(); // Admin has access to all branches
    }

    if (req.user.role === 'instructor') {
        const branchId = req.params.branchId || req.body.branch_id || req.query.branch_id;

        if (branchId && parseInt(branchId) !== req.user.branch_id) {
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
