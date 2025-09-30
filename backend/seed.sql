-- Seed data for GAMA Martial Arts Management System

-- Insert branches
INSERT INTO branches (name, address, phone) VALUES
('Main Branch', '123 Martial Arts St, City Center', '555-0101'),
('North Branch', '456 Fighting Ave, North District', '555-0102'),
('South Branch', '789 Karate Blvd, South District', '555-0103');

-- Insert admin user
INSERT INTO users (username, email, password_hash, role, first_name, last_name, phone, belt_level) VALUES
('admin', 'admin@gama.com', '$2b$10$rQZ8K9mN2pL3qR4sT5uV6wX7yZ8A9B0C1D2E3F4G5H6I7J8K9L0M1N2O3P4Q5R6S7T8U9V0W1X2Y3Z4', 'admin', 'John', 'Admin', '555-0001', 'Black Belt 5th Dan');

-- Insert instructor users
INSERT INTO users (username, email, password_hash, role, branch_id, first_name, last_name, phone, belt_level) VALUES
('instructor1', 'instructor1@gama.com', '$2b$10$rQZ8K9mN2pL3qR4sT5uV6wX7yZ8A9B0C1D2E3F4G5H6I7J8K9L0M1N2O3P4Q5R6S7T8U9V0W1X2Y3Z4', 'instructor', 1, 'Mike', 'Sensei', '555-0002', 'Black Belt 3rd Dan'),
('instructor2', 'instructor2@gama.com', '$2b$10$rQZ8K9mN2pL3qR4sT5uV6wX7yZ8A9B0C1D2E3F4G5H6I7J8K9L0M1N2O3P4Q5R6S7T8U9V0W1X2Y3Z4', 'instructor', 2, 'Sarah', 'Master', '555-0003', 'Black Belt 4th Dan');

-- Insert instructors
INSERT INTO instructors (user_id, first_name, last_name, email, phone, belt_level, branch_id, specialization, certification_date) VALUES
(2, 'Mike', 'Sensei', 'instructor1@gama.com', '555-0002', 'Black Belt 3rd Dan', 1, 'Karate, Self Defense', '2020-01-15'),
(3, 'Sarah', 'Master', 'instructor2@gama.com', '555-0003', 'Black Belt 4th Dan', 2, 'Taekwondo, Sparring', '2019-06-20');

-- Insert students for Main Branch (branch_id = 1)
INSERT INTO students (first_name, last_name, email, phone, date_of_birth, belt_level, branch_id, emergency_contact_name, emergency_contact_phone, address) VALUES
('Alex', 'Johnson', 'alex.johnson@email.com', '555-1001', '2010-03-15', 'Yellow Belt', 1, 'Jane Johnson', '555-2001', '123 Student St'),
('Emma', 'Smith', 'emma.smith@email.com', '555-1002', '2008-07-22', 'Orange Belt', 1, 'Bob Smith', '555-2002', '456 Learning Ave'),
('David', 'Brown', 'david.brown@email.com', '555-1003', '2012-11-08', 'White Belt', 1, 'Lisa Brown', '555-2003', '789 Training Rd'),
('Sophia', 'Davis', 'sophia.davis@email.com', '555-1004', '2009-05-30', 'Green Belt', 1, 'Tom Davis', '555-2004', '321 Practice Ln'),
('Lucas', 'Wilson', 'lucas.wilson@email.com', '555-1005', '2011-09-12', 'Blue Belt', 1, 'Mary Wilson', '555-2005', '654 Discipline St');

-- Insert students for North Branch (branch_id = 2)
INSERT INTO students (first_name, last_name, email, phone, date_of_birth, belt_level, branch_id, emergency_contact_name, emergency_contact_phone, address) VALUES
('Olivia', 'Martinez', 'olivia.martinez@email.com', '555-1006', '2007-12-03', 'Purple Belt', 2, 'Carlos Martinez', '555-2006', '987 Focus Ave'),
('James', 'Taylor', 'james.taylor@email.com', '555-1007', '2013-02-18', 'White Belt', 2, 'Susan Taylor', '555-2007', '147 Balance St'),
('Isabella', 'Anderson', 'isabella.anderson@email.com', '555-1008', '2010-08-25', 'Yellow Belt', 2, 'Robert Anderson', '555-2008', '258 Harmony Rd'),
('William', 'Thomas', 'william.thomas@email.com', '555-1009', '2009-04-14', 'Orange Belt', 2, 'Jennifer Thomas', '555-2009', '369 Strength Ln'),
('Ava', 'Jackson', 'ava.jackson@email.com', '555-1010', '2011-10-07', 'Green Belt', 2, 'Michael Jackson', '555-2010', '741 Respect St');

-- Insert students for South Branch (branch_id = 3)
INSERT INTO students (first_name, last_name, email, phone, date_of_birth, belt_level, branch_id, emergency_contact_name, emergency_contact_phone, address) VALUES
('Noah', 'White', 'noah.white@email.com', '555-1011', '2008-06-20', 'Blue Belt', 3, 'Patricia White', '555-2011', '852 Honor Ave'),
('Mia', 'Harris', 'mia.harris@email.com', '555-1012', '2012-01-11', 'White Belt', 3, 'Daniel Harris', '555-2012', '963 Courage St'),
('Ethan', 'Martin', 'ethan.martin@email.com', '555-1013', '2010-09-16', 'Yellow Belt', 3, 'Linda Martin', '555-2013', '174 Perseverance Rd'),
('Charlotte', 'Garcia', 'charlotte.garcia@email.com', '555-1014', '2009-12-28', 'Orange Belt', 3, 'Jose Garcia', '555-2014', '285 Dedication Ln'),
('Liam', 'Lee', 'liam.lee@email.com', '555-1015', '2011-03-05', 'Green Belt', 3, 'Kim Lee', '555-2015', '396 Commitment St');

-- Insert attendance records (last 30 days)
INSERT INTO attendance (student_id, class_date, status, notes, marked_by) VALUES
-- Main Branch students
(1, CURRENT_DATE - INTERVAL '1 day', 'present', 'Good form today', 2),
(1, CURRENT_DATE - INTERVAL '3 days', 'present', '', 2),
(1, CURRENT_DATE - INTERVAL '5 days', 'late', 'Traffic delay', 2),
(2, CURRENT_DATE - INTERVAL '1 day', 'present', 'Excellent progress', 2),
(2, CURRENT_DATE - INTERVAL '3 days', 'present', '', 2),
(2, CURRENT_DATE - INTERVAL '5 days', 'present', '', 2),
(3, CURRENT_DATE - INTERVAL '1 day', 'absent', 'Sick', 2),
(3, CURRENT_DATE - INTERVAL '3 days', 'present', '', 2),
(4, CURRENT_DATE - INTERVAL '1 day', 'present', 'Great technique', 2),
(4, CURRENT_DATE - INTERVAL '3 days', 'present', '', 2),
(5, CURRENT_DATE - INTERVAL '1 day', 'present', '', 2),
(5, CURRENT_DATE - INTERVAL '3 days', 'present', 'Improved focus', 2),

-- North Branch students
(6, CURRENT_DATE - INTERVAL '1 day', 'present', 'Strong performance', 3),
(6, CURRENT_DATE - INTERVAL '3 days', 'present', '', 3),
(7, CURRENT_DATE - INTERVAL '1 day', 'present', '', 3),
(7, CURRENT_DATE - INTERVAL '3 days', 'late', 'Parent drop-off delay', 3),
(8, CURRENT_DATE - INTERVAL '1 day', 'present', 'Good attitude', 3),
(8, CURRENT_DATE - INTERVAL '3 days', 'present', '', 3),
(9, CURRENT_DATE - INTERVAL '1 day', 'present', '', 3),
(9, CURRENT_DATE - INTERVAL '3 days', 'present', 'Showing improvement', 3),
(10, CURRENT_DATE - INTERVAL '1 day', 'present', '', 3),
(10, CURRENT_DATE - INTERVAL '3 days', 'present', '', 3);

-- Insert fees records
INSERT INTO fees (student_id, amount, fee_type, due_date, paid_date, status, payment_method, recorded_by) VALUES
-- Monthly fees
(1, 80.00, 'monthly', CURRENT_DATE + INTERVAL '15 days', NULL, 'pending', NULL, 2),
(2, 80.00, 'monthly', CURRENT_DATE + INTERVAL '15 days', NULL, 'pending', NULL, 2),
(3, 80.00, 'monthly', CURRENT_DATE + INTERVAL '15 days', NULL, 'pending', NULL, 2),
(4, 80.00, 'monthly', CURRENT_DATE + INTERVAL '15 days', NULL, 'pending', NULL, 2),
(5, 80.00, 'monthly', CURRENT_DATE + INTERVAL '15 days', NULL, 'pending', NULL, 2),
(6, 80.00, 'monthly', CURRENT_DATE + INTERVAL '15 days', NULL, 'pending', NULL, 3),
(7, 80.00, 'monthly', CURRENT_DATE + INTERVAL '15 days', NULL, 'pending', NULL, 3),
(8, 80.00, 'monthly', CURRENT_DATE + INTERVAL '15 days', NULL, 'pending', NULL, 3),
(9, 80.00, 'monthly', CURRENT_DATE + INTERVAL '15 days', NULL, 'pending', NULL, 3),
(10, 80.00, 'monthly', CURRENT_DATE + INTERVAL '15 days', NULL, 'pending', NULL, 3),

-- Some paid fees
(1, 80.00, 'monthly', CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE - INTERVAL '10 days', 'paid', 'Cash', 2),
(2, 80.00, 'monthly', CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE - INTERVAL '8 days', 'paid', 'Credit Card', 2),
(6, 80.00, 'monthly', CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE - INTERVAL '12 days', 'paid', 'Bank Transfer', 3),
(7, 80.00, 'monthly', CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE - INTERVAL '5 days', 'paid', 'Cash', 3),

-- Belt test fees
(2, 25.00, 'belt_test', CURRENT_DATE + INTERVAL '7 days', NULL, 'pending', NULL, 2),
(4, 25.00, 'belt_test', CURRENT_DATE + INTERVAL '7 days', NULL, 'pending', NULL, 2),
(8, 25.00, 'belt_test', CURRENT_DATE + INTERVAL '7 days', NULL, 'pending', NULL, 3),
(10, 25.00, 'belt_test', CURRENT_DATE + INTERVAL '7 days', NULL, 'pending', NULL, 3),

-- Uniform fees
(1, 45.00, 'uniform', CURRENT_DATE + INTERVAL '10 days', NULL, 'pending', NULL, 2),
(3, 45.00, 'uniform', CURRENT_DATE + INTERVAL '10 days', NULL, 'pending', NULL, 2),
(6, 45.00, 'uniform', CURRENT_DATE + INTERVAL '10 days', NULL, 'pending', NULL, 3),
(9, 45.00, 'uniform', CURRENT_DATE + INTERVAL '10 days', NULL, 'pending', NULL, 3);

-- Insert inventory items
INSERT INTO inventory (item_name, category, quantity, unit_price, branch_id, supplier, last_restocked) VALUES
('Karate Gi (White)', 'Uniforms', 25, 45.00, 1, 'Martial Arts Supply Co', CURRENT_DATE - INTERVAL '30 days'),
('Karate Gi (Black)', 'Uniforms', 15, 50.00, 1, 'Martial Arts Supply Co', CURRENT_DATE - INTERVAL '30 days'),
('Belt (White)', 'Belts', 50, 8.00, 1, 'Belt Masters', CURRENT_DATE - INTERVAL '15 days'),
('Belt (Yellow)', 'Belts', 30, 8.00, 1, 'Belt Masters', CURRENT_DATE - INTERVAL '15 days'),
('Belt (Orange)', 'Belts', 20, 8.00, 1, 'Belt Masters', CURRENT_DATE - INTERVAL '15 days'),
('Focus Pads', 'Equipment', 10, 25.00, 1, 'Training Gear Inc', CURRENT_DATE - INTERVAL '45 days'),
('Sparring Gloves', 'Equipment', 15, 35.00, 1, 'Training Gear Inc', CURRENT_DATE - INTERVAL '45 days'),
('Karate Gi (White)', 'Uniforms', 20, 45.00, 2, 'Martial Arts Supply Co', CURRENT_DATE - INTERVAL '25 days'),
('Karate Gi (Black)', 'Uniforms', 12, 50.00, 2, 'Martial Arts Supply Co', CURRENT_DATE - INTERVAL '25 days'),
('Belt (White)', 'Belts', 40, 8.00, 2, 'Belt Masters', CURRENT_DATE - INTERVAL '10 days'),
('Focus Pads', 'Equipment', 8, 25.00, 2, 'Training Gear Inc', CURRENT_DATE - INTERVAL '40 days'),
('Karate Gi (White)', 'Uniforms', 18, 45.00, 3, 'Martial Arts Supply Co', CURRENT_DATE - INTERVAL '20 days'),
('Belt (White)', 'Belts', 35, 8.00, 3, 'Belt Masters', CURRENT_DATE - INTERVAL '5 days'),
('Sparring Gloves', 'Equipment', 12, 35.00, 3, 'Training Gear Inc', CURRENT_DATE - INTERVAL '35 days');
