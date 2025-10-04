const pool = require('../db');

// Get fees records (with branch filtering for instructors)
const getFees = async (req, res) => {
    try {
        const { student_id, status, fee_type, branch_id } = req.query;

        let query = `
      SELECT f.*, s.first_name, s.last_name, b.name as branch_name
      FROM fees f
      JOIN students s ON f.student_id = s.id
      JOIN branches b ON s.branch_id = b.id
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
            query += ` AND f.student_id = $${++paramCount}`;
            params.push(student_id);
        }

        // Filter by status
        if (status) {
            query += ` AND f.status = $${++paramCount}`;
            params.push(status);
        }

        // Filter by fee type
        if (fee_type) {
            query += ` AND f.fee_type = $${++paramCount}`;
            params.push(fee_type);
        }

        // Filter by branch (admin only)
        if (req.user.role === 'admin' && branch_id) {
            query += ` AND s.branch_id = $${++paramCount}`;
            params.push(branch_id);
        }

        query += ` ORDER BY f.created_at DESC, s.last_name, s.first_name`;

        const result = await pool.query(query, params);
        res.json({ fees: result.rows });
    } catch (error) {
        console.error('Get fees error:', error);
        res.status(500).json({ error: 'Failed to fetch fees' });
    }
};

// Get fee by ID
const getFeeById = async (req, res) => {
    try {
        const { id } = req.params;

        let query = `
      SELECT f.*, s.first_name, s.last_name, b.name as branch_name
      FROM fees f
      JOIN students s ON f.student_id = s.id
      JOIN branches b ON s.branch_id = b.id
      WHERE f.id = $1
    `;
        let params = [id];

        // Filter by branch for instructors
        if (req.user.role === 'instructor') {
            query += ` AND s.branch_id = $2`;
            params.push(req.user.branch_id);
        }

        const result = await pool.query(query, params);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Fee record not found' });
        }

        res.json({ fee: result.rows[0] });
    } catch (error) {
        console.error('Get fee error:', error);
        res.status(500).json({ error: 'Failed to fetch fee record' });
    }
};

// Create fee record (with upsert logic)
const createFee = async (req, res) => {
    try {
        console.log('=== Create Fee Request ===');
        console.log('Body:', JSON.stringify(req.body, null, 2));
        console.log('User:', req.user);

        const {
            student_id,
            amount,
            fee_type,
            due_date,
            status,
            payment_method,
            notes
        } = req.body;

        // Validate required fields
        if (!student_id || !amount || !fee_type || !due_date) {
            console.log('Validation failed:', { student_id, amount, fee_type, due_date });
            return res.status(400).json({
                error: 'Student ID, amount, fee type, and due date are required',
                received: { student_id, amount, fee_type, due_date }
            });
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

        // Check if fee record already exists for this student and month
        // Ensure due_date is properly formatted
        let dueDateStr = due_date;
        if (typeof due_date === 'string' && !due_date.includes('T')) {
            dueDateStr = due_date; // Already in YYYY-MM-DD format
        }
        
        const dueDate = new Date(dueDateStr + 'T12:00:00'); // Add time to avoid timezone issues
        const year = dueDate.getFullYear();
        const month = dueDate.getMonth() + 1;
        
        console.log('Fee date processing:', { 
            original_due_date: due_date, 
            processed_date: dueDateStr,
            parsed_date: dueDate,
            year, 
            month, 
            student_id, 
            fee_type 
        });
        
        const existingRecord = await pool.query(
            `SELECT * FROM fees 
             WHERE student_id = $1 
             AND EXTRACT(YEAR FROM due_date) = $2 
             AND EXTRACT(MONTH FROM due_date) = $3
             AND fee_type = $4`,
            [student_id, year, month, fee_type]
        );

        let result;
        if (existingRecord.rows.length > 0) {
            // Update existing record
            const paid_date = status === 'paid' ? new Date().toISOString().split('T')[0] : null;
            result = await pool.query(
                `UPDATE fees SET 
                    amount = $1,
                    status = $2,
                    payment_method = $3,
                    paid_date = $4,
                    notes = $5,
                    recorded_by = $6
                 WHERE id = $7
                 RETURNING *`,
                [amount, status, payment_method, paid_date, notes, req.user.id, existingRecord.rows[0].id]
            );
        } else {
            // Create new record
            const paid_date = status === 'paid' ? new Date().toISOString().split('T')[0] : null;
            result = await pool.query(
                `INSERT INTO fees (
            student_id, amount, fee_type, due_date, status, payment_method, paid_date, notes, recorded_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
          RETURNING *`,
                [student_id, amount, fee_type, due_date, status, payment_method, paid_date, notes, req.user.id]
            );
        }

        res.status(201).json({
            message: 'Fee record saved successfully',
            fee: result.rows[0]
        });
    } catch (error) {
        console.error('Create fee error:', error);
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
        res.status(500).json({ error: 'Failed to create fee record', details: error.message });
    }
};

// Update fee record
const updateFee = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            amount,
            fee_type,
            due_date,
            paid_date,
            status,
            payment_method,
            notes
        } = req.body;

        // Check if fee record exists and user has access
        let checkQuery = `
      SELECT f.*, s.branch_id 
      FROM fees f 
      JOIN students s ON f.student_id = s.id 
      WHERE f.id = $1
    `;
        let checkParams = [id];

        if (req.user.role === 'instructor') {
            checkQuery += ` AND s.branch_id = $2`;
            checkParams.push(req.user.branch_id);
        }

        const checkResult = await pool.query(checkQuery, checkParams);
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Fee record not found or access denied' });
        }

        // Validate status
        if (status && !['pending', 'paid', 'overdue'].includes(status)) {
            return res.status(400).json({ error: 'Status must be pending, paid, or overdue' });
        }

        const result = await pool.query(
            `UPDATE fees SET 
        amount = COALESCE($1, amount),
        fee_type = COALESCE($2, fee_type),
        due_date = COALESCE($3, due_date),
        paid_date = COALESCE($4, paid_date),
        status = COALESCE($5, status),
        payment_method = COALESCE($6, payment_method),
        notes = COALESCE($7, notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $8 
      RETURNING *`,
            [amount, fee_type, due_date, paid_date, status, payment_method, notes, id]
        );

        res.json({
            message: 'Fee record updated successfully',
            fee: result.rows[0]
        });
    } catch (error) {
        console.error('Update fee error:', error);
        res.status(500).json({ error: 'Failed to update fee record' });
    }
};

// Delete fee record
const deleteFee = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if fee record exists and user has access
        let checkQuery = `
      SELECT f.*, s.branch_id 
      FROM fees f 
      JOIN students s ON f.student_id = s.id 
      WHERE f.id = $1
    `;
        let checkParams = [id];

        if (req.user.role === 'instructor') {
            checkQuery += ` AND s.branch_id = $2`;
            checkParams.push(req.user.branch_id);
        }

        const checkResult = await pool.query(checkQuery, checkParams);
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Fee record not found or access denied' });
        }

        await pool.query('DELETE FROM fees WHERE id = $1', [id]);

        res.json({ message: 'Fee record deleted successfully' });
    } catch (error) {
        console.error('Delete fee error:', error);
        res.status(500).json({ error: 'Failed to delete fee record' });
    }
};

module.exports = {
    getFees,
    getFeeById,
    createFee,
    updateFee,
    deleteFee
};
