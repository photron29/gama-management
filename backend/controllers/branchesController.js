const pool = require('../db');

// Get all branches
const getBranches = async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT 
        b.*,
        COUNT(DISTINCT s.id) as students,
        COUNT(DISTINCT i.id) as instructors
      FROM branches b
      LEFT JOIN students s ON b.id = s.branch_id
      LEFT JOIN instructors i ON b.id = i.branch_id
      GROUP BY b.id
      ORDER BY b.name
    `);

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching branches:', error);
        res.status(500).json({ error: 'Failed to fetch branches' });
    }
};

// Get single branch
const getBranch = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`
      SELECT 
        b.*,
        COUNT(DISTINCT s.id) as students,
        COUNT(DISTINCT i.id) as instructors
      FROM branches b
      LEFT JOIN students s ON b.id = s.branch_id
      LEFT JOIN instructors i ON b.id = i.branch_id
      WHERE b.id = $1
      GROUP BY b.id
    `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Branch not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching branch:', error);
        res.status(500).json({ error: 'Failed to fetch branch' });
    }
};

// Create new branch
const createBranch = async (req, res) => {
    try {
        const { name, address, phone, email, manager } = req.body;

        const result = await pool.query(`
      INSERT INTO branches (name, address, phone, email, manager)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [name, address, phone, email, manager]);

        // Get the branch with stats
        const branchResult = await pool.query(`
      SELECT 
        b.*,
        COUNT(DISTINCT s.id) as students,
        COUNT(DISTINCT i.id) as instructors
      FROM branches b
      LEFT JOIN students s ON b.id = s.branch_id
      LEFT JOIN instructors i ON b.id = i.branch_id
      WHERE b.id = $1
      GROUP BY b.id
    `, [result.rows[0].id]);

        res.status(201).json(branchResult.rows[0]);
    } catch (error) {
        console.error('Error creating branch:', error);
        res.status(500).json({ error: 'Failed to create branch' });
    }
};

// Update branch
const updateBranch = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, address, phone, email, manager } = req.body;

        const result = await pool.query(`
      UPDATE branches 
      SET name = $1, address = $2, phone = $3, email = $4, manager = $5
      WHERE id = $6
      RETURNING *
    `, [name, address, phone, email, manager, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Branch not found' });
        }

        // Get the branch with stats
        const branchResult = await pool.query(`
      SELECT 
        b.*,
        COUNT(DISTINCT s.id) as students,
        COUNT(DISTINCT i.id) as instructors
      FROM branches b
      LEFT JOIN students s ON b.id = s.branch_id
      LEFT JOIN instructors i ON b.id = i.branch_id
      WHERE b.id = $1
      GROUP BY b.id
    `, [id]);

        res.json(branchResult.rows[0]);
    } catch (error) {
        console.error('Error updating branch:', error);
        res.status(500).json({ error: 'Failed to update branch' });
    }
};

// Delete branch
const deleteBranch = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if branch has students or instructors
        const checkResult = await pool.query(`
      SELECT COUNT(*) as count FROM (
        SELECT id FROM students WHERE branch_id = $1
        UNION
        SELECT id FROM instructors WHERE branch_id = $1
      ) as related
    `, [id]);

        if (parseInt(checkResult.rows[0].count) > 0) {
            return res.status(400).json({
                error: 'Cannot delete branch with existing students or instructors'
            });
        }

        const result = await pool.query('DELETE FROM branches WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Branch not found' });
        }

        res.json({ message: 'Branch deleted successfully' });
    } catch (error) {
        console.error('Error deleting branch:', error);
        res.status(500).json({ error: 'Failed to delete branch' });
    }
};

module.exports = {
    getBranches,
    getBranch,
    createBranch,
    updateBranch,
    deleteBranch
};
