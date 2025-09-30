const bcrypt = require('bcryptjs');
const pool = require('./db');

async function setupDatabase() {
    try {
        console.log('🔧 Setting up GAMA Martial Arts Database...');

        // Test database connection
        await pool.query('SELECT NOW()');
        console.log('✅ Database connection successful');

        // Generate proper password hashes
        const adminPassword = await bcrypt.hash('password', 10);
        const instructorPassword = await bcrypt.hash('password', 10);

        console.log('🔐 Generated password hashes');
        console.log('Admin password hash:', adminPassword);
        console.log('Instructor password hash:', instructorPassword);

        // Check if data already exists
        const userCount = await pool.query('SELECT COUNT(*) FROM users');
        if (userCount.rows[0].count > 0) {
            console.log('⚠️  Database already has data. Skipping seed data insertion.');
            return;
        }

        // Insert branches
        await pool.query(`
      INSERT INTO branches (name, address, phone) VALUES
      ('Main Branch', '123 Martial Arts St, City Center', '555-0101'),
      ('North Branch', '456 Fighting Ave, North District', '555-0102'),
      ('South Branch', '789 Karate Blvd, South District', '555-0103')
    `);
        console.log('✅ Branches inserted');

        // Insert admin user
        await pool.query(`
      INSERT INTO users (username, email, password_hash, role, first_name, last_name, phone, belt_level) VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8)
    `, ['admin', 'admin@gama.com', adminPassword, 'admin', 'John', 'Admin', '555-0001', 'Black Belt 5th Dan']);
        console.log('✅ Admin user created');

        // Insert instructor users
        await pool.query(`
      INSERT INTO users (username, email, password_hash, role, branch_id, first_name, last_name, phone, belt_level) VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, $9),
      ($10, $11, $12, $13, $14, $15, $16, $17, $18)
    `, [
            'instructor1', 'instructor1@gama.com', instructorPassword, 'instructor', 1, 'Mike', 'Sensei', '555-0002', 'Black Belt 3rd Dan',
            'instructor2', 'instructor2@gama.com', instructorPassword, 'instructor', 2, 'Sarah', 'Master', '555-0003', 'Black Belt 4th Dan'
        ]);
        console.log('✅ Instructor users created');

        // Insert instructors
        await pool.query(`
      INSERT INTO instructors (user_id, first_name, last_name, email, phone, belt_level, branch_id, specialization, certification_date) VALUES
      (2, 'Mike', 'Sensei', 'instructor1@gama.com', '555-0002', 'Black Belt 3rd Dan', 1, 'Karate, Self Defense', '2020-01-15'),
      (3, 'Sarah', 'Master', 'instructor2@gama.com', '555-0003', 'Black Belt 4th Dan', 2, 'Taekwondo, Sparring', '2019-06-20')
    `);
        console.log('✅ Instructors inserted');

        // Insert sample students
        await pool.query(`
      INSERT INTO students (first_name, last_name, email, phone, date_of_birth, belt_level, branch_id, emergency_contact_name, emergency_contact_phone, address) VALUES
      ('Alex', 'Johnson', 'alex.johnson@email.com', '555-1001', '2010-03-15', 'Yellow Belt', 1, 'Jane Johnson', '555-2001', '123 Student St'),
      ('Emma', 'Smith', 'emma.smith@email.com', '555-1002', '2008-07-22', 'Orange Belt', 1, 'Bob Smith', '555-2002', '456 Learning Ave'),
      ('David', 'Brown', 'david.brown@email.com', '555-1003', '2012-11-08', 'White Belt', 1, 'Lisa Brown', '555-2003', '789 Training Rd'),
      ('Sophia', 'Davis', 'sophia.davis@email.com', '555-1004', '2009-05-30', 'Green Belt', 1, 'Tom Davis', '555-2004', '321 Practice Ln'),
      ('Lucas', 'Wilson', 'lucas.wilson@email.com', '555-1005', '2011-09-12', 'Blue Belt', 1, 'Mary Wilson', '555-2005', '654 Discipline St'),
      ('Olivia', 'Martinez', 'olivia.martinez@email.com', '555-1006', '2007-12-03', 'Purple Belt', 2, 'Carlos Martinez', '555-2006', '987 Focus Ave'),
      ('James', 'Taylor', 'james.taylor@email.com', '555-1007', '2013-02-18', 'White Belt', 2, 'Susan Taylor', '555-2007', '147 Balance St'),
      ('Isabella', 'Anderson', 'isabella.anderson@email.com', '555-1008', '2010-08-25', 'Yellow Belt', 2, 'Robert Anderson', '555-2008', '258 Harmony Rd'),
      ('William', 'Thomas', 'william.thomas@email.com', '555-1009', '2009-04-14', 'Orange Belt', 2, 'Jennifer Thomas', '555-2009', '369 Strength Ln'),
      ('Ava', 'Jackson', 'ava.jackson@email.com', '555-1010', '2011-10-07', 'Green Belt', 2, 'Michael Jackson', '555-2010', '741 Respect St')
    `);
        console.log('✅ Sample students inserted');

        // Insert sample attendance
        await pool.query(`
      INSERT INTO attendance (student_id, class_date, status, notes, marked_by) VALUES
      (1, CURRENT_DATE - INTERVAL '1 day', 'present', 'Good form today', 2),
      (1, CURRENT_DATE - INTERVAL '3 days', 'present', '', 2),
      (2, CURRENT_DATE - INTERVAL '1 day', 'present', 'Excellent progress', 2),
      (2, CURRENT_DATE - INTERVAL '3 days', 'present', '', 2),
      (3, CURRENT_DATE - INTERVAL '1 day', 'absent', 'Sick', 2),
      (4, CURRENT_DATE - INTERVAL '1 day', 'present', 'Great technique', 2),
      (5, CURRENT_DATE - INTERVAL '1 day', 'present', '', 2),
      (6, CURRENT_DATE - INTERVAL '1 day', 'present', 'Strong performance', 3),
      (7, CURRENT_DATE - INTERVAL '1 day', 'present', '', 3),
      (8, CURRENT_DATE - INTERVAL '1 day', 'present', 'Good attitude', 3)
    `);
        console.log('✅ Sample attendance inserted');

        // Insert sample fees
        await pool.query(`
      INSERT INTO fees (student_id, amount, fee_type, due_date, paid_date, status, payment_method, recorded_by) VALUES
      (1, 80.00, 'monthly', CURRENT_DATE + INTERVAL '15 days', NULL, 'pending', NULL, 2),
      (2, 80.00, 'monthly', CURRENT_DATE + INTERVAL '15 days', NULL, 'pending', NULL, 2),
      (3, 80.00, 'monthly', CURRENT_DATE + INTERVAL '15 days', NULL, 'pending', NULL, 2),
      (4, 80.00, 'monthly', CURRENT_DATE + INTERVAL '15 days', NULL, 'pending', NULL, 2),
      (5, 80.00, 'monthly', CURRENT_DATE + INTERVAL '15 days', NULL, 'pending', NULL, 2),
      (1, 80.00, 'monthly', CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE - INTERVAL '10 days', 'paid', 'Cash', 2),
      (2, 80.00, 'monthly', CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE - INTERVAL '8 days', 'paid', 'Credit Card', 2),
      (2, 25.00, 'belt_test', CURRENT_DATE + INTERVAL '7 days', NULL, 'pending', NULL, 2),
      (4, 25.00, 'belt_test', CURRENT_DATE + INTERVAL '7 days', NULL, 'pending', NULL, 2)
    `);
        console.log('✅ Sample fees inserted');

        // Insert sample inventory
        await pool.query(`
      INSERT INTO inventory (item_name, category, quantity, unit_price, branch_id, supplier, last_restocked) VALUES
      ('Karate Gi (White)', 'Uniforms', 25, 45.00, 1, 'Martial Arts Supply Co', CURRENT_DATE - INTERVAL '30 days'),
      ('Karate Gi (Black)', 'Uniforms', 15, 50.00, 1, 'Martial Arts Supply Co', CURRENT_DATE - INTERVAL '30 days'),
      ('Belt (White)', 'Belts', 50, 8.00, 1, 'Belt Masters', CURRENT_DATE - INTERVAL '15 days'),
      ('Belt (Yellow)', 'Belts', 30, 8.00, 1, 'Belt Masters', CURRENT_DATE - INTERVAL '15 days'),
      ('Focus Pads', 'Equipment', 10, 25.00, 1, 'Training Gear Inc', CURRENT_DATE - INTERVAL '45 days'),
      ('Sparring Gloves', 'Equipment', 15, 35.00, 1, 'Training Gear Inc', CURRENT_DATE - INTERVAL '45 days')
    `);
        console.log('✅ Sample inventory inserted');

        console.log('🎉 Database setup completed successfully!');
        console.log('\n📋 Demo Credentials:');
        console.log('Admin: username=admin, password=password');
        console.log('Instructor: username=instructor1, password=password');

    } catch (error) {
        console.error('❌ Database setup failed:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

setupDatabase();
