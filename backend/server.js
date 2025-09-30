const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const branchesRoutes = require('./routes/branches');
const studentsRoutes = require('./routes/students');
const instructorsRoutes = require('./routes/instructors');
const attendanceRoutes = require('./routes/attendance');
const feesRoutes = require('./routes/fees');
const dashboardRoutes = require('./routes/dashboard');
const inventoryRoutes = require('./routes/inventory');

// Import error handlers
const { errorHandler, notFound } = require('./utils/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://192.168.1.242:5173',
        'http://192.168.1.242:3000',
        'http://192.168.1.242:8080',
        'https://gama-management.vercel.app',
        'https://gama-management-git-main.vercel.app',
        'https://gama-management-git-develop.vercel.app',
        'https://ganeshaacademy.vercel.app',
        'https://ganeshaacademy-git-main.vercel.app',
        'https://ganeshaacademy-git-develop.vercel.app',
        process.env.FRONTEND_URL
    ].filter(Boolean),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'GAMA Martial Arts Management System API',
        version: '1.0.0',
        status: 'running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        endpoints: {
            health: '/health',
            auth: '/api/auth',
            branches: '/api/branches',
            students: '/api/students',
            instructors: '/api/instructors',
            attendance: '/api/attendance',
            fees: '/api/fees',
            dashboard: '/api/dashboard',
            inventory: '/api/inventory'
        }
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// API health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/branches', branchesRoutes);
app.use('/api/students', studentsRoutes);
app.use('/api/instructors', instructorsRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/fees', feesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/inventory', inventoryRoutes);

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
