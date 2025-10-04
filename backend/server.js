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
const attendanceApprovalsRoutes = require('./routes/attendanceApprovals');
const productsRoutes = require('./routes/products');
const ordersRoutes = require('./routes/orders');
const feesRoutes = require('./routes/fees');
const dashboardRoutes = require('./routes/dashboard');
const inventoryRoutes = require('./routes/inventory');

// Import error handlers
const { errorHandler, notFound } = require('./utils/errorHandler');

// Import middleware (rate limiting removed)

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

// Database test endpoint
app.get('/api/test-db', async (req, res) => {
    try {
        const pool = require('./db');
        const result = await pool.query('SELECT NOW() as current_time, version() as postgres_version');
        res.json({
            status: 'Database connected',
            current_time: result.rows[0].current_time,
            postgres_version: result.rows[0].postgres_version
        });
    } catch (error) {
        console.error('Database test error:', error);
        res.status(500).json({ error: 'Database connection failed', details: error.message });
    }
});

// Database schema test endpoint
app.get('/api/test-schema', async (req, res) => {
    try {
        const pool = require('./db');

        // Check if tables exist
        const tablesQuery = `
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('users', 'students', 'branches', 'attendance', 'fees')
            ORDER BY table_name
        `;
        const tablesResult = await pool.query(tablesQuery);

        // Check attendance table structure
        const attendanceQuery = `
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'attendance' 
            ORDER BY ordinal_position
        `;
        const attendanceResult = await pool.query(attendanceQuery);

        // Count records in each table
        const counts = {};
        for (const table of tablesResult.rows) {
            try {
                const countResult = await pool.query(`SELECT COUNT(*) as count FROM ${table.table_name}`);
                counts[table.table_name] = countResult.rows[0].count;
            } catch (err) {
                counts[table.table_name] = 'Error: ' + err.message;
            }
        }

        res.json({
            status: 'Schema check complete',
            tables_found: tablesResult.rows.map(r => r.table_name),
            table_counts: counts,
            attendance_columns: attendanceResult.rows
        });
    } catch (error) {
        console.error('Schema test error:', error);
        res.status(500).json({ error: 'Schema check failed', details: error.message });
    }
});

// Create test attendance data endpoint
app.post('/api/create-test-attendance', async (req, res) => {
    try {
        const pool = require('./db');

        // Get students from branch 1 (for instructor1)
        const studentsQuery = `
            SELECT id, first_name, last_name 
            FROM students 
            WHERE branch_id = 1 AND is_active = true
            LIMIT 5
        `;
        const studentsResult = await pool.query(studentsQuery);

        if (studentsResult.rows.length === 0) {
            return res.json({ message: 'No students found in branch 1' });
        }

        // Create attendance records for the last 7 days
        const attendanceRecords = [];
        for (let i = 0; i < 7; i++) {
            const classDate = new Date();
            classDate.setDate(classDate.getDate() - i);

            for (const student of studentsResult.rows) {
                attendanceRecords.push({
                    student_id: student.id,
                    class_date: classDate.toISOString().split('T')[0],
                    status: Math.random() > 0.2 ? 'present' : 'absent', // 80% present rate
                    notes: i === 0 ? 'Test data created' : ''
                });
            }
        }

        // Insert attendance records
        for (const record of attendanceRecords) {
            await pool.query(
                'INSERT INTO attendance (student_id, class_date, status, notes, created_at) VALUES ($1, $2, $3, $4, NOW())',
                [record.student_id, record.class_date, record.status, record.notes]
            );
        }

        res.json({
            message: `Created ${attendanceRecords.length} test attendance records`,
            students_used: studentsResult.rows.length,
            records_created: attendanceRecords.length
        });
    } catch (error) {
        console.error('Test attendance creation error:', error);
        res.status(500).json({ error: 'Failed to create test data', details: error.message });
    }
});

// Check database data endpoint
app.get('/api/check-data', async (req, res) => {
    try {
        const pool = require('./db');

        // Check if we have any data
        const checks = {};

        // Check users
        const usersResult = await pool.query('SELECT COUNT(*) as count FROM users');
        checks.users = usersResult.rows[0].count;

        // Check students
        const studentsResult = await pool.query('SELECT COUNT(*) as count FROM students');
        checks.students = studentsResult.rows[0].count;

        // Check branches
        const branchesResult = await pool.query('SELECT COUNT(*) as count FROM branches');
        checks.branches = branchesResult.rows[0].count;

        // Check attendance
        const attendanceResult = await pool.query('SELECT COUNT(*) as count FROM attendance');
        checks.attendance = attendanceResult.rows[0].count;

        // Check instructor users
        const instructorResult = await pool.query("SELECT id, username, branch_id FROM users WHERE role = 'instructor'");
        checks.instructors = instructorResult.rows;

        // Check students by branch
        const studentsByBranchResult = await pool.query(`
            SELECT branch_id, COUNT(*) as count 
            FROM students 
            GROUP BY branch_id 
            ORDER BY branch_id
        `);
        checks.students_by_branch = studentsByBranchResult.rows;

        // Check attendance by branch
        const attendanceByBranchResult = await pool.query(`
            SELECT s.branch_id, COUNT(*) as count 
            FROM attendance a
            JOIN students s ON a.student_id = s.id
            GROUP BY s.branch_id 
            ORDER BY s.branch_id
        `);
        checks.attendance_by_branch = attendanceByBranchResult.rows;

        res.json({
            status: 'Data check complete',
            ...checks
        });
    } catch (error) {
        console.error('Data check error:', error);
        res.status(500).json({ error: 'Data check failed', details: error.message });
    }
});

// API routes (rate limiting removed)
app.use('/api/auth', authRoutes);
app.use('/api/branches', branchesRoutes);
app.use('/api/students', studentsRoutes);
app.use('/api/instructors', instructorsRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/attendance/approval', attendanceApprovalsRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);
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
