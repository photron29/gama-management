const pool = require('../db');

// Get attendance records (with branch filtering for instructors)
const getAttendance = async (req, res) => {
    try {
        const { student_id, start_date, end_date, branch_id } = req.query;

        let query = `
      SELECT a.id, a.student_id, TO_CHAR(a.class_date, 'YYYY-MM-DD') as class_date, a.status, a.notes, a.marked_by, a.created_at,
             s.first_name, s.last_name, br.belt_name, br.belt_color, b.name as branch_name
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      JOIN branches b ON s.branch_id = b.id
      LEFT JOIN belt_ranks br ON s.belt_level_id = br.id
      WHERE s.is_active = true
    `;
        let params = [];
        let paramCount = 0;

        // Filter by branch for instructors
        if (req.user.role === 'instructor') {
            query += ` AND s.branch_id = $${++paramCount}`;
            params.push(req.user.branch_id);
        }

        // Filter by specific student
        if (student_id) {
            query += ` AND a.student_id = $${++paramCount}`;
            params.push(student_id);
        }

        // Filter by date range
        if (start_date) {
            query += ` AND a.class_date >= $${++paramCount}`;
            params.push(start_date);
        }

        if (end_date) {
            query += ` AND a.class_date <= $${++paramCount}`;
            params.push(end_date);
        }

        // Filter by branch (admin only)
        if (req.user.role === 'admin' && branch_id) {
            query += ` AND s.branch_id = $${++paramCount}`;
            params.push(branch_id);
        }

        query += ` ORDER BY a.class_date DESC, s.last_name, s.first_name`;

        const result = await pool.query(query, params);
        res.json({ attendance: result.rows });
    } catch (error) {
        console.error('Get attendance error:', error);
        res.status(500).json({ error: 'Failed to fetch attendance' });
    }
};

// Get attendance by ID
const getAttendanceById = async (req, res) => {
    try {
        const { id } = req.params;

        let query = `
      SELECT a.*, s.first_name, s.last_name, br.belt_name, br.belt_color, b.name as branch_name
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      JOIN branches b ON s.branch_id = b.id
      LEFT JOIN belt_ranks br ON s.belt_level_id = br.id
      WHERE a.id = $1
    `;
        let params = [id];

        // Filter by branch for instructors
        if (req.user.role === 'instructor') {
            query += ` AND s.branch_id = $2`;
            params.push(req.user.branch_id);
        }

        const result = await pool.query(query, params);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Attendance record not found' });
        }

        res.json({ attendance: result.rows[0] });
    } catch (error) {
        console.error('Get attendance error:', error);
        res.status(500).json({ error: 'Failed to fetch attendance record' });
    }
};

// Create attendance record
const createAttendance = async (req, res) => {
    try {
        const { student_id, class_date, status, notes } = req.body;

        console.log('=== CREATE/UPDATE ATTENDANCE ===');
        console.log('Received data:', { student_id, class_date, status, notes });
        console.log('Date type:', typeof class_date);

        // Validate required fields
        if (!student_id || !class_date || !status) {
            return res.status(400).json({ error: 'Student ID, class date, and status are required' });
        }

        // Validate status
        if (!['present', 'absent', 'late'].includes(status)) {
            return res.status(400).json({ error: 'Status must be present, absent, or late' });
        }

        // Check if student exists and user has access
        let studentQuery = 'SELECT * FROM students WHERE id = $1';
        let studentParams = [student_id];

        if (req.user.role === 'instructor') {
            studentQuery += ' AND branch_id = $2';
            studentParams.push(req.user.branch_id);
        }

        const studentResult = await pool.query(studentQuery, studentParams);
        if (studentResult.rows.length === 0) {
            return res.status(404).json({ error: 'Student not found or access denied' });
        }

        // Check if attendance record already exists for this student and date
        const existingRecord = await pool.query(
            `SELECT * FROM attendance WHERE student_id = $1 AND class_date::date = $2::date`,
            [student_id, class_date]
        );

        let result;
        if (existingRecord.rows.length > 0) {
            console.log('Updating existing record...');
            // Update existing record instead of throwing error
            result = await pool.query(
                `UPDATE attendance SET 
                    status = $1,
                    notes = $2,
                    marked_by = $3
                WHERE student_id = $4 AND class_date::date = $5::date
                RETURNING id, student_id, TO_CHAR(class_date, 'YYYY-MM-DD') as class_date, status, notes, marked_by, created_at`,
                [status, notes, req.user.id, student_id, class_date]
            );
            console.log('Updated record:', result.rows[0]);
        } else {
            console.log('Creating new record...');
            // Create new record - cast directly to DATE to avoid timezone conversion
            result = await pool.query(
                `INSERT INTO attendance (student_id, class_date, status, notes, marked_by) 
           VALUES ($1, $2::date, $3, $4, $5) 
           RETURNING id, student_id, TO_CHAR(class_date, 'YYYY-MM-DD') as class_date, status, notes, marked_by, created_at`,
                [student_id, class_date, status, notes, req.user.id]
            );
            console.log('Created record:', result.rows[0]);
        }

        console.log('Final class_date in DB:', result.rows[0].class_date);

        res.status(201).json({
            message: 'Attendance recorded successfully',
            attendance: result.rows[0]
        });
    } catch (error) {
        console.error('Create attendance error:', error);
        res.status(500).json({ error: 'Failed to record attendance' });
    }
};

// Update attendance record
const updateAttendance = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;

        // Check if attendance record exists and user has access
        let checkQuery = `
      SELECT a.*, s.branch_id 
      FROM attendance a 
      JOIN students s ON a.student_id = s.id 
      WHERE a.id = $1
    `;
        let checkParams = [id];

        if (req.user.role === 'instructor') {
            checkQuery += ` AND s.branch_id = $2`;
            checkParams.push(req.user.branch_id);
        }

        const checkResult = await pool.query(checkQuery, checkParams);
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Attendance record not found or access denied' });
        }

        // Validate status
        if (status && !['present', 'absent', 'late'].includes(status)) {
            return res.status(400).json({ error: 'Status must be present, absent, or late' });
        }

        const result = await pool.query(
            `UPDATE attendance SET 
        status = COALESCE($1, status),
        notes = COALESCE($2, notes)
      WHERE id = $3 
      RETURNING *`,
            [status, notes, id]
        );

        res.json({
            message: 'Attendance updated successfully',
            attendance: result.rows[0]
        });
    } catch (error) {
        console.error('Update attendance error:', error);
        res.status(500).json({ error: 'Failed to update attendance' });
    }
};

// Delete attendance record
const deleteAttendance = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if attendance record exists and user has access
        let checkQuery = `
      SELECT a.*, s.branch_id 
      FROM attendance a 
      JOIN students s ON a.student_id = s.id 
      WHERE a.id = $1
    `;
        let checkParams = [id];

        if (req.user.role === 'instructor') {
            checkQuery += ` AND s.branch_id = $2`;
            checkParams.push(req.user.branch_id);
        }

        const checkResult = await pool.query(checkQuery, checkParams);
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Attendance record not found or access denied' });
        }

        await pool.query('DELETE FROM attendance WHERE id = $1', [id]);

        res.json({ message: 'Attendance record deleted successfully' });
    } catch (error) {
        console.error('Delete attendance error:', error);
        res.status(500).json({ error: 'Failed to delete attendance record' });
    }
};

module.exports = {
    getAttendance,
    getAttendanceById,
    createAttendance,
    updateAttendance,
    deleteAttendance
};
