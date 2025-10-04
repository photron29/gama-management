const { Pool } = require('pg');
const config = require('./config');

const pool = new Pool({
    ...config.database,
    // Set client timezone to Asia/Kolkata to match database
    options: '-c timezone=Asia/Kolkata'
});

// Test database connection
pool.on('connect', () => {
    console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
    console.error('Database connection error:', err);
});

module.exports = pool;
