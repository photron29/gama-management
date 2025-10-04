const pool = require('../db');

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    console.log('Dashboard stats request for user:', {
      id: req.user.id,
      role: req.user.role,
      branch_id: req.user.branch_id
    });

    // Debug: Check if instructor has students in their branch
    if (req.user.role === 'instructor') {
      try {
        console.log('=== INSTRUCTOR DEBUG INFO ===');
        console.log('Instructor ID:', req.user.id);
        console.log('Instructor Branch ID:', req.user.branch_id);

        // Check if instructor has students in their branch
        const debugQuery = `
                    SELECT COUNT(*) as student_count 
                    FROM students s 
                    WHERE s.branch_id = $1 AND s.is_active = true
                `;
        const debugResult = await pool.query(debugQuery, [req.user.branch_id]);
        console.log('Students in instructor branch:', debugResult.rows[0].student_count);

        // Check if there are any attendance records
        const attendanceDebugQuery = `
                    SELECT COUNT(*) as attendance_count 
                    FROM attendance a
                    JOIN students s ON a.student_id = s.id
                    WHERE s.branch_id = $1
                `;
        const attendanceDebugResult = await pool.query(attendanceDebugQuery, [req.user.branch_id]);
        console.log('Attendance records in instructor branch:', attendanceDebugResult.rows[0].attendance_count);

        // Check recent attendance specifically
        const recentDebugQuery = `
                    SELECT COUNT(*) as recent_count 
                    FROM attendance a
                    JOIN students s ON a.student_id = s.id
                    WHERE s.branch_id = $1 AND a.class_date >= CURRENT_DATE - INTERVAL '7 days'
                `;
        const recentDebugResult = await pool.query(recentDebugQuery, [req.user.branch_id]);
        console.log('Recent attendance (last 7 days):', recentDebugResult.rows[0].recent_count);

        // Show some sample data
        const sampleQuery = `
                    SELECT a.*, s.first_name, s.last_name, s.branch_id
                    FROM attendance a
                    JOIN students s ON a.student_id = s.id
                    WHERE s.branch_id = $1
                    ORDER BY a.class_date DESC
                    LIMIT 3
                `;
        const sampleResult = await pool.query(sampleQuery, [req.user.branch_id]);
        console.log('Sample attendance records:', sampleResult.rows);

        console.log('=== END DEBUG INFO ===');
      } catch (debugError) {
        console.log('Debug query failed:', debugError.message);
      }
    }

    let whereClause = '';
    let params = [];
    let paramCount = 0;

    // Filter by branch for instructors
    if (req.user.role === 'instructor') {
      whereClause = 'WHERE s.branch_id = $1';
      params.push(req.user.branch_id);
      paramCount = 1;
    }

    // Get total students
    const studentsQuery = `
            SELECT COUNT(*) as total_students,
                   COUNT(CASE WHEN is_active = true THEN 1 END) as active_students
            FROM students s
            ${whereClause}
        `;
    console.log('Students query:', studentsQuery, 'Params:', params);
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

    // Get attendance stats (last 30 days) - simplified query
    let attendanceResult = { rows: [{ total_classes: 0, present_count: 0, absent_count: 0, late_count: 0 }] };
    try {
      const attendanceQuery = `
                SELECT 
                    COUNT(*) as total_classes,
                    COUNT(CASE WHEN status = 'present' THEN 1 END) as present_count,
                    COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent_count,
                    COUNT(CASE WHEN status = 'late' THEN 1 END) as late_count
                FROM attendance a
                JOIN students s ON a.student_id = s.id
                WHERE a.class_date >= CURRENT_DATE - INTERVAL '30 days'
                AND s.is_active = true
                ${req.user.role === 'instructor' ? 'AND s.branch_id = $' + (paramCount + 1) : ''}
            `;
      const attendanceParams = req.user.role === 'instructor' ? [...params, req.user.branch_id] : [];
      attendanceResult = await pool.query(attendanceQuery, attendanceParams);
    } catch (attendanceError) {
      console.log('Attendance query failed (table might not exist):', attendanceError.message);
    }

    // Get fees stats - simplified query
    let feesResult = { rows: [{ total_fees: 0, paid_fees: 0, pending_fees: 0, overdue_fees: 0, total_collected: 0, pending_amount: 0 }] };
    try {
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
                WHERE s.is_active = true
                ${whereClause}
            `;
      feesResult = await pool.query(feesQuery, params);
    } catch (feesError) {
      console.log('Fees query failed (table might not exist):', feesError.message);
    }

    // Get recent attendance (last 7 days) - only for admin users
    let recentAttendanceResult = { rows: [] };
    if (req.user.role === 'admin') {
      try {
        const recentAttendanceQuery = `
                  SELECT a.*, s.first_name, s.last_name, b.name as branch_name
                  FROM attendance a
                  JOIN students s ON a.student_id = s.id
                  JOIN branches b ON s.branch_id = b.id
                  WHERE a.class_date >= CURRENT_DATE - INTERVAL '7 days'
                  AND s.is_active = true
                  ORDER BY a.class_date DESC, a.created_at DESC, s.first_name, s.last_name
                  LIMIT 10
              `;
        console.log('Recent attendance query:', recentAttendanceQuery);
        recentAttendanceResult = await pool.query(recentAttendanceQuery);
        console.log('Recent attendance result:', recentAttendanceResult.rows.length, 'records');
      } catch (recentAttendanceError) {
        console.log('Recent attendance query failed:', recentAttendanceError.message);
      }
    }

    // Get recent fees - only for admin users
    let recentFeesResult = { rows: [] };
    if (req.user.role === 'admin') {
      try {
        const recentFeesQuery = `
                  SELECT f.*, s.first_name, s.last_name, b.name as branch_name
                  FROM fees f
                  JOIN students s ON f.student_id = s.id
                  JOIN branches b ON s.branch_id = b.id
                  WHERE s.is_active = true
                  ORDER BY f.created_at DESC, f.updated_at DESC, s.first_name, s.last_name
                  LIMIT 10
              `;
        console.log('Recent fees query:', recentFeesQuery);
        recentFeesResult = await pool.query(recentFeesQuery);
        console.log('Recent fees result:', recentFeesResult.rows.length, 'records');
      } catch (recentFeesError) {
        console.log('Recent fees query failed:', recentFeesError.message);
      }
    }

    const result = {
      students: studentsResult.rows[0],
      instructors: instructorsResult.rows[0],
      branches: branchesResult.rows[0],
      attendance: attendanceResult.rows[0],
      fees: feesResult.rows[0],
      recent_attendance: recentAttendanceResult.rows,
      recent_fees: recentFeesResult.rows
    };

    console.log('Dashboard stats result:', result);
    res.json(result);
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
};

module.exports = {
  getDashboardStats
};
