const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken, authorizeRole } = require('../utils/auth');

// Get all pending attendance approvals (admin only)
router.get('/', authenticateToken, authorizeRole(['admin']), async (req, res) => {
    try {
        const query = `
            SELECT 
                aa.*,
                s.first_name,
                s.last_name,
                s.belt_level,
                b.name as branch_name,
                u.first_name as changed_by_name,
                u.last_name as changed_by_last_name
            FROM attendance_approvals aa
            LEFT JOIN students s ON aa.student_id = s.id
            LEFT JOIN branches b ON s.branch_id = b.id
            LEFT JOIN users u ON aa.changed_by = u.username
            WHERE aa.status = 'pending'
            ORDER BY aa.created_at DESC
        `;

        const result = await pool.query(query);
        res.json({ approvals: result.rows });
    } catch (error) {
        console.error('Get attendance approvals error:', error);
        res.status(500).json({ error: 'Failed to fetch attendance approvals' });
    }
});

// Create attendance approval request
router.post('/', authenticateToken, async (req, res) => {
    try {
        const {
            original_attendance_id,
            student_id,
            class_date,
            new_status,
            new_notes,
            changed_by,
            change_reason
        } = req.body;

        const query = `
            INSERT INTO attendance_approvals (
                original_attendance_id,
                student_id,
                class_date,
                new_status,
                new_notes,
                changed_by,
                change_reason
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;

        const values = [
            original_attendance_id,
            student_id,
            class_date,
            new_status,
            new_notes,
            changed_by,
            change_reason
        ];

        const result = await pool.query(query, values);
        res.status(201).json({ approval: result.rows[0] });
    } catch (error) {
        console.error('Create attendance approval error:', error);
        res.status(500).json({ error: 'Failed to create attendance approval' });
    }
});

// Update attendance approval status (approve/deny)
router.put('/:id', authenticateToken, authorizeRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['approved', 'denied'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status. Must be approved or denied.' });
        }

        // Get the approval record
        const approvalQuery = 'SELECT * FROM attendance_approvals WHERE id = $1';
        const approvalResult = await pool.query(approvalQuery, [id]);

        if (approvalResult.rows.length === 0) {
            return res.status(404).json({ error: 'Attendance approval not found' });
        }

        const approval = approvalResult.rows[0];

        // Update the approval status
        const updateQuery = `
            UPDATE attendance_approvals 
            SET status = $1, reviewed_by = $2, reviewed_at = CURRENT_TIMESTAMP
            WHERE id = $3
            RETURNING *
        `;

        const updateResult = await pool.query(updateQuery, [status, req.user.id, id]);

        // If approved, apply the changes to the attendance record
        if (status === 'approved') {
            if (approval.original_attendance_id) {
                // Update existing attendance record
                const updateAttendanceQuery = `
                    UPDATE attendance 
                    SET status = $1, notes = $2, updated_at = CURRENT_TIMESTAMP
                    WHERE id = $3
                `;
                await pool.query(updateAttendanceQuery, [
                    approval.new_status,
                    approval.new_notes,
                    approval.original_attendance_id
                ]);
            } else {
                // Create new attendance record
                const createAttendanceQuery = `
                    INSERT INTO attendance (student_id, class_date, status, notes, marked_by)
                    VALUES ($1, $2, $3, $4, $5)
                `;
                await pool.query(createAttendanceQuery, [
                    approval.student_id,
                    approval.class_date,
                    approval.new_status,
                    approval.new_notes,
                    req.user.id
                ]);
            }
        }

        res.json({ approval: updateResult.rows[0] });
    } catch (error) {
        console.error('Update attendance approval error:', error);
        res.status(500).json({ error: 'Failed to update attendance approval' });
    }
});

// Get approval history (admin only)
router.get('/history', authenticateToken, authorizeRole(['admin']), async (req, res) => {
    try {
        const query = `
            SELECT 
                aa.*,
                s.first_name,
                s.last_name,
                s.belt_level,
                b.name as branch_name,
                u.first_name as changed_by_name,
                u.last_name as changed_by_last_name,
                reviewer.first_name as reviewer_name,
                reviewer.last_name as reviewer_last_name
            FROM attendance_approvals aa
            LEFT JOIN students s ON aa.student_id = s.id
            LEFT JOIN branches b ON s.branch_id = b.id
            LEFT JOIN users u ON aa.changed_by = u.username
            LEFT JOIN users reviewer ON aa.reviewed_by = reviewer.id
            ORDER BY aa.created_at DESC
        `;

        const result = await pool.query(query);
        res.json({ approvals: result.rows });
    } catch (error) {
        console.error('Get approval history error:', error);
        res.status(500).json({ error: 'Failed to fetch approval history' });
    }
});

module.exports = router;
