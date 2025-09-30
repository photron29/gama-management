const pool = require('../db');

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
    try {
        let whereClause = '';
        let params = [];
        let paramCount = 0;

        // Filter by branch for instructors
        if (req.user.role === 'instructor') {
            whereClause = 'WHERE s.branch_id = $1';
            params.push(req.user.branch_id);
        }

        // Get total students
        const studentsQuery = `
      SELECT COUNT(*) as total_students,
             COUNT(CASE WHEN is_active = true THEN 1 END) as active_students
      FROM students s
      ${whereClause}
    `;
        const studentsResult = await pool.query(studentsQuery, params);

        // Get total instructors (admin only)
        let instructorsResult = { rows: [{ total_instructors: 0, active_instructors: 0 }] };
        if (req.user.role === 'admin') {
            const instructorsQuery = `
        SELECT COUNT(*) as total_instructors,
               COUNT(CASE WHEN is_active = true THEN 1 END) as active_instructors
        FROM instructors
      `;
            instructorsResult = await pool.query(instructorsQuery);
        }

        // Get total branches (admin only)
        let branchesResult = { rows: [{ total_branches: 0 }] };
        if (req.user.role === 'admin') {
            const branchesQuery = 'SELECT COUNT(*) as total_branches FROM branches';
            branchesResult = await pool.query(branchesQuery);
        }

        // Get attendance stats (last 30 days)
        const attendanceQuery = `
      SELECT 
        COUNT(*) as total_classes,
        COUNT(CASE WHEN status = 'present' THEN 1 END) as present_count,
        COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent_count,
        COUNT(CASE WHEN status = 'late' THEN 1 END) as late_count
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      WHERE a.class_date >= CURRENT_DATE - INTERVAL '30 days'
      ${req.user.role === 'instructor' ? 'AND s.branch_id = $' + (paramCount + 1) : ''}
    `;
        if (req.user.role === 'instructor') {
            params.push(req.user.branch_id);
        }
        const attendanceResult = await pool.query(attendanceQuery, params);

        // Get fees stats
        const feesQuery = `
      SELECT 
        COUNT(*) as total_fees,
        COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_fees,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_fees,
        COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_fees,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as total_collected,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) as pending_amount
      FROM fees f
      JOIN students s ON f.student_id = s.id
      ${whereClause}
    `;
        const feesResult = await pool.query(feesQuery, params);

        // Get recent attendance (last 7 days)
        const recentAttendanceQuery = `
      SELECT a.*, s.first_name, s.last_name, b.name as branch_name
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      JOIN branches b ON s.branch_id = b.id
      WHERE a.class_date >= CURRENT_DATE - INTERVAL '7 days'
      ${req.user.role === 'instructor' ? 'AND s.branch_id = $' + (paramCount + 1) : ''}
      ORDER BY a.class_date DESC, s.last_name
      LIMIT 10
    `;
        const recentAttendanceResult = await pool.query(recentAttendanceQuery, params);

        // Get recent fees
        const recentFeesQuery = `
      SELECT f.*, s.first_name, s.last_name, b.name as branch_name
      FROM fees f
      JOIN students s ON f.student_id = s.id
      JOIN branches b ON s.branch_id = b.id
      ${whereClause}
      ORDER BY f.created_at DESC
      LIMIT 10
    `;
        const recentFeesResult = await pool.query(recentFeesQuery, params);

        res.json({
            students: studentsResult.rows[0],
            instructors: instructorsResult.rows[0],
            branches: branchesResult.rows[0],
            attendance: attendanceResult.rows[0],
            fees: feesResult.rows[0],
            recent_attendance: recentAttendanceResult.rows,
            recent_fees: recentFeesResult.rows
        });
    } catch (error) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
    }
};

module.exports = {
    getDashboardStats
};
