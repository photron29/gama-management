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
    const client = await pool.connect();
    try {
        const { name, address, email, manager_id } = req.body;

        await client.query('BEGIN');

        // Get manager details from instructor if manager_id is provided
        let manager = null;
        let phone = null;
        if (manager_id) {
            const managerResult = await client.query(
                'SELECT first_name, last_name, phone FROM instructors WHERE id = $1',
                [manager_id]
            );
            if (managerResult.rows.length > 0) {
                const m = managerResult.rows[0];
                manager = `${m.first_name} ${m.last_name}`;
                phone = m.phone;
            }
        }

        const result = await client.query(`
      INSERT INTO branches (name, address, phone, email, manager, manager_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [name, address, phone, email, manager, manager_id]);

        // Update instructor's branch_id if manager is assigned
        if (manager_id) {
            await client.query(
                'UPDATE instructors SET branch_id = $1 WHERE id = $2',
                [result.rows[0].id, manager_id]
            );
            await client.query(
                'UPDATE users SET branch_id = $1 WHERE id = (SELECT user_id FROM instructors WHERE id = $2)',
                [result.rows[0].id, manager_id]
            );
        }

        await client.query('COMMIT');

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
        await client.query('ROLLBACK');
        console.error('Error creating branch:', error);
        res.status(500).json({ error: 'Failed to create branch' });
    } finally {
        client.release();
    }
};

// Update branch
const updateBranch = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { name, address, email, manager_id } = req.body;

        await client.query('BEGIN');

        // Get current manager_id
        const currentBranch = await client.query(
            'SELECT manager_id FROM branches WHERE id = $1',
            [id]
        );
        const oldManagerId = currentBranch.rows[0]?.manager_id;

        // Remove branch from old manager if changed
        if (oldManagerId && oldManagerId !== manager_id) {
            await client.query(
                'UPDATE instructors SET branch_id = NULL WHERE id = $1',
                [oldManagerId]
            );
            await client.query(
                'UPDATE users SET branch_id = NULL WHERE id = (SELECT user_id FROM instructors WHERE id = $1)',
                [oldManagerId]
            );
        }

        // Get manager details from instructor if manager_id is provided
        let manager = null;
        let phone = null;
        if (manager_id) {
            const managerResult = await client.query(
                'SELECT first_name, last_name, phone FROM instructors WHERE id = $1',
                [manager_id]
            );
            if (managerResult.rows.length > 0) {
                const m = managerResult.rows[0];
                manager = `${m.first_name} ${m.last_name}`;
                phone = m.phone;

                // Update new manager's branch_id
                await client.query(
                    'UPDATE instructors SET branch_id = $1 WHERE id = $2',
                    [id, manager_id]
                );
                await client.query(
                    'UPDATE users SET branch_id = $1 WHERE id = (SELECT user_id FROM instructors WHERE id = $2)',
                    [id, manager_id]
                );
            }
        }

        const result = await client.query(`
      UPDATE branches 
      SET name = $1, address = $2, phone = $3, email = $4, manager = $5, manager_id = $6
      WHERE id = $7
      RETURNING *
    `, [name, address, phone, email, manager, manager_id, id]);

        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Branch not found' });
        }

        await client.query('COMMIT');

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
        await client.query('ROLLBACK');
        console.error('Error updating branch:', error);
        res.status(500).json({ error: 'Failed to update branch' });
    } finally {
        client.release();
    }
};

// Delete branch
const deleteBranch = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if branch has students or instructors
        const studentsCheck = await pool.query(
            'SELECT COUNT(*) as count FROM students WHERE branch_id = $1',
            [id]
        );
        const instructorsCheck = await pool.query(
            'SELECT COUNT(*) as count FROM instructors WHERE branch_id = $1',
            [id]
        );

        const studentCount = parseInt(studentsCheck.rows[0].count);
        const instructorCount = parseInt(instructorsCheck.rows[0].count);

        if (studentCount > 0 || instructorCount > 0) {
            return res.status(400).json({
                error: `Cannot delete branch. It has ${studentCount} student(s) and ${instructorCount} instructor(s). Please reassign them to another branch first.`
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
