INSERT INTO branches (name, address, phone, email, manager) VALUES
('Main Branch', '123 Martial Arts Street, Downtown', '555-0101', 'main@gama.com', 'Master John Smith'),
('North Branch', '456 Fighting Avenue, North District', '555-0102', 'north@gama.com', 'Sensei Sarah Johnson'),
('South Branch', '789 Karate Boulevard, South District', '555-0103', 'south@gama.com', 'Master Mike Wilson'),
('East Branch', '321 Discipline Road, East Side', '555-0104', 'east@gama.com', 'Sensei Lisa Brown'),
('West Branch', '654 Focus Lane, West End', '555-0105', 'west@gama.com', 'Master David Davis');

-- =============================================
-- INSERT USERS (ADMIN AND INSTRUCTORS)
-- =============================================
-- Admin user (Black Belt 5th Dan)
INSERT INTO users (username, email, password_hash, role, first_name, last_name, phone, belt_level_id, branch_id) VALUES
('admin', 'admin@gama.com', '$2a$10$rQZ8K9mN2pL3sT4uV5wX6yZ7aB8cD9eF0gH1iJ2kL3mN4oP5qR6sT7uV8wX9yZ', 'admin', 'John', 'Smith', '555-0001', 21, 1);

-- Senior Instructors (Black Belt 3rd-5th Dan)
INSERT INTO users (username, email, password_hash, role, first_name, last_name, phone, belt_level_id, branch_id) VALUES
('master_sarah', 'sarah.johnson@gama.com', '$2a$10$rQZ8K9mN2pL3sT4uV5wX6yZ7aB8cD9eF0gH1iJ2kL3mN4oP5qR6sT7uV8wX9yZ', 'instructor', 'Sarah', 'Johnson', '555-0002', 19, 2),
('master_mike', 'mike.wilson@gama.com', '$2a$10$rQZ8K9mN2pL3sT4uV5wX6yZ7aB8cD9eF0gH1iJ2kL3mN4oP5qR6sT7uV8wX9yZ', 'instructor', 'Mike', 'Wilson', '555-0003', 20, 3),
('master_lisa', 'lisa.brown@gama.com', '$2a$10$rQZ8K9mN2pL3sT4uV5wX6yZ7aB8cD9eF0gH1iJ2kL3mN4oP5qR6sT7uV8wX9yZ', 'instructor', 'Lisa', 'Brown', '555-0004', 18, 4),
('master_david', 'david.davis@gama.com', '$2a$10$rQZ8K9mN2pL3sT4uV5wX6yZ7aB8cD9eF0gH1iJ2kL3mN4oP5qR6sT7uV8wX9yZ', 'instructor', 'David', 'Davis', '555-0005', 17, 5);

-- Junior Instructors (Black Belt 1st-2nd Dan)
INSERT INTO users (username, email, password_hash, role, first_name, last_name, phone, belt_level_id, branch_id) VALUES
('sensei_emma', 'emma.taylor@gama.com', '$2a$10$rQZ8K9mN2pL3sT4uV5wX6yZ7aB8cD9eF0gH1iJ2kL3mN4oP5qR6sT7uV8wX9yZ', 'instructor', 'Emma', 'Taylor', '555-0006', 17, 1),
('sensei_james', 'james.martinez@gama.com', '$2a$10$rQZ8K9mN2pL3sT4uV5wX6yZ7aB8cD9eF0gH1iJ2kL3mN4oP5qR6sT7uV8wX9yZ', 'instructor', 'James', 'Martinez', '555-0007', 18, 2),
('sensei_olivia', 'olivia.anderson@gama.com', '$2a$10$rQZ8K9mN2pL3sT4uV5wX6yZ7aB8cD9eF0gH1iJ2kL3mN4oP5qR6sT7uV8wX9yZ', 'instructor', 'Olivia', 'Anderson', '555-0008', 17, 3);

-- =============================================
-- INSERT INSTRUCTORS
-- =============================================
INSERT INTO instructors (user_id, first_name, last_name, email, phone, belt_level_id, branch_id, specialization, certification_date) VALUES
(2, 'Sarah', 'Johnson', 'sarah.johnson@gama.com', '555-0002', 19, 2, 'Karate, Self Defense, Sparring', '2018-03-15'),
(3, 'Mike', 'Wilson', 'mike.wilson@gama.com', '555-0003', 20, 3, 'Taekwondo, Forms, Competition', '2017-06-20'),
(4, 'Lisa', 'Brown', 'lisa.brown@gama.com', '555-0004', 18, 4, 'Karate, Weapons, Self Defense', '2019-01-10'),
(5, 'David', 'Davis', 'david.davis@gama.com', '555-0005', 17, 5, 'Karate, Meditation, Philosophy', '2020-09-05'),
(6, 'Emma', 'Taylor', 'emma.taylor@gama.com', '555-0006', 17, 1, 'Karate, Kids Classes, Basic Techniques', '2021-04-12'),
(7, 'James', 'Martinez', 'james.martinez@gama.com', '555-0007', 18, 2, 'Karate, Fitness, Conditioning', '2020-11-18'),
(8, 'Olivia', 'Anderson', 'olivia.anderson@gama.com', '555-0008', 17, 3, 'Karate, Women Self Defense, Flexibility', '2021-07-22');

-- =============================================
-- INSERT STUDENTS WITH VARIOUS BELT LEVELS
-- =============================================

-- White Belt Students (Beginners)
INSERT INTO students (first_name, last_name, email, phone, date_of_birth, belt_level_id, branch_id, emergency_contact_name, emergency_contact_phone, address, enrollment_date) VALUES
('Alex', 'Johnson', 'alex.johnson@email.com', '555-1001', '2010-03-15', 1, 1, 'Jane Johnson', '555-2001', '123 Student Street, Downtown', '2024-01-15'),
('Emma', 'Smith', 'emma.smith@email.com', '555-1002', '2008-07-22', 1, 1, 'Bob Smith', '555-2002', '456 Learning Avenue, Downtown', '2024-02-01'),
('David', 'Brown', 'david.brown@email.com', '555-1003', '2012-11-08', 1, 2, 'Lisa Brown', '555-2003', '789 Training Road, North District', '2024-01-20'),
('Sophia', 'Davis', 'sophia.davis@email.com', '555-1004', '2009-05-30', 1, 2, 'Tom Davis', '555-2004', '321 Practice Lane, North District', '2024-02-10'),
('Lucas', 'Wilson', 'lucas.wilson@email.com', '555-1005', '2011-09-12', 1, 3, 'Mary Wilson', '555-2005', '654 Discipline Street, South District', '2024-01-25');

-- White Belt with Stripes (Progressing Beginners)
INSERT INTO students (first_name, last_name, email, phone, date_of_birth, belt_level_id, branch_id, emergency_contact_name, emergency_contact_phone, address, enrollment_date) VALUES
('Olivia', 'Martinez', 'olivia.martinez@email.com', '555-1006', '2007-12-03', 6, 1, 'Carlos Martinez', '555-2006', '987 Focus Avenue, Downtown', '2023-11-15'),
('James', 'Taylor', 'james.taylor@email.com', '555-1007', '2013-02-18', 7, 2, 'Susan Taylor', '555-2007', '147 Balance Street, North District', '2023-12-01'),
('Isabella', 'Anderson', 'isabella.anderson@email.com', '555-1008', '2010-08-25', 8, 3, 'Robert Anderson', '555-2008', '258 Harmony Road, South District', '2023-10-20'),
('William', 'Thomas', 'william.thomas@email.com', '555-1009', '2009-04-14', 9, 4, 'Jennifer Thomas', '555-2009', '369 Strength Lane, East Side', '2023-09-10');

-- Yellow Belt Students
INSERT INTO students (first_name, last_name, email, phone, date_of_birth, belt_level_id, branch_id, emergency_contact_name, emergency_contact_phone, address, enrollment_date) VALUES
('Ava', 'Jackson', 'ava.jackson@email.com', '555-1010', '2011-10-07', 2, 1, 'Michael Jackson', '555-2010', '741 Respect Street, Downtown', '2023-08-15'),
('Noah', 'White', 'noah.white@email.com', '555-1011', '2010-06-20', 2, 2, 'Sarah White', '555-2011', '852 Honor Avenue, North District', '2023-07-01'),
('Mia', 'Harris', 'mia.harris@email.com', '555-1012', '2012-01-12', 2, 3, 'John Harris', '555-2012', '963 Courage Road, South District', '2023-06-15');

-- Yellow Belt with Stripes
INSERT INTO students (first_name, last_name, email, phone, date_of_birth, belt_level_id, branch_id, emergency_contact_name, emergency_contact_phone, address, enrollment_date) VALUES
('Ethan', 'Martin', 'ethan.martin@email.com', '555-1013', '2009-03-25', 10, 1, 'Lisa Martin', '555-2013', '174 Patience Street, Downtown', '2023-05-20'),
('Charlotte', 'Garcia', 'charlotte.garcia@email.com', '555-1014', '2011-11-08', 11, 2, 'Carlos Garcia', '555-2014', '285 Perseverance Lane, North District', '2023-04-10'),
('Liam', 'Lee', 'liam.lee@email.com', '555-1015', '2010-09-14', 12, 3, 'Kim Lee', '555-2015', '396 Dedication Avenue, South District', '2023-03-01');

-- Green Belt Students
INSERT INTO students (first_name, last_name, email, phone, date_of_birth, belt_level_id, branch_id, emergency_contact_name, emergency_contact_phone, address, enrollment_date) VALUES
('Amelia', 'Clark', 'amelia.clark@email.com', '555-1016', '2008-12-30', 3, 1, 'Robert Clark', '555-2016', '507 Wisdom Street, Downtown', '2023-02-15'),
('Benjamin', 'Rodriguez', 'benjamin.rodriguez@email.com', '555-1017', '2009-07-18', 3, 2, 'Maria Rodriguez', '555-2017', '618 Focus Road, North District', '2023-01-20'),
('Harper', 'Lewis', 'harper.lewis@email.com', '555-1018', '2010-04-05', 3, 3, 'David Lewis', '555-2018', '729 Concentration Lane, South District', '2022-12-01');

-- Green Belt with Stripes
INSERT INTO students (first_name, last_name, email, phone, date_of_birth, belt_level_id, branch_id, emergency_contact_name, emergency_contact_phone, address, enrollment_date) VALUES
('Mason', 'Walker', 'mason.walker@email.com', '555-1019', '2008-01-22', 13, 1, 'Jennifer Walker', '555-2019', '830 Discipline Street, Downtown', '2022-11-10'),
('Evelyn', 'Hall', 'evelyn.hall@email.com', '555-1020', '2009-08-16', 14, 2, 'Mark Hall', '555-2020', '941 Control Avenue, North District', '2022-10-15');

-- Blue Belt Students
INSERT INTO students (first_name, last_name, email, phone, date_of_birth, belt_level_id, branch_id, emergency_contact_name, emergency_contact_phone, address, enrollment_date) VALUES
('Logan', 'Allen', 'logan.allen@email.com', '555-1021', '2007-05-12', 4, 1, 'Susan Allen', '555-2021', '152 Mastery Street, Downtown', '2022-09-01'),
('Abigail', 'Young', 'abigail.young@email.com', '555-1022', '2008-10-28', 4, 2, 'Michael Young', '555-2022', '263 Excellence Road, North District', '2022-08-20'),
('Caleb', 'King', 'caleb.king@email.com', '555-1023', '2007-12-03', 4, 3, 'Sarah King', '555-2023', '374 Achievement Lane, South District', '2022-07-10');

-- Blue Belt with Stripe
INSERT INTO students (first_name, last_name, email, phone, date_of_birth, belt_level_id, branch_id, emergency_contact_name, emergency_contact_phone, address, enrollment_date) VALUES
('Sofia', 'Wright', 'sofia.wright@email.com', '555-1024', '2007-02-17', 15, 1, 'Robert Wright', '555-2024', '485 Perfection Street, Downtown', '2022-06-15');

-- Red Belt Students
INSERT INTO students (first_name, last_name, email, phone, date_of_birth, belt_level_id, branch_id, emergency_contact_name, emergency_contact_phone, address, enrollment_date) VALUES
('Jackson', 'Lopez', 'jackson.lopez@email.com', '555-1025', '2006-09-25', 5, 1, 'Maria Lopez', '555-2025', '596 Mastery Avenue, Downtown', '2022-05-01'),
('Madison', 'Hill', 'madison.hill@email.com', '555-1026', '2006-11-14', 5, 2, 'John Hill', '555-2026', '707 Excellence Road, North District', '2022-04-10');

-- Red Belt with Stripe (Advanced)
INSERT INTO students (first_name, last_name, email, phone, date_of_birth, belt_level_id, branch_id, emergency_contact_name, emergency_contact_phone, address, enrollment_date) VALUES
('Aiden', 'Scott', 'aiden.scott@email.com', '555-1027', '2006-03-08', 16, 1, 'Lisa Scott', '555-2027', '818 Black Belt Lane, Downtown', '2022-03-20');

-- =============================================
-- INSERT ATTENDANCE RECORDS
-- =============================================
-- Recent attendance for various students
INSERT INTO attendance (student_id, class_date, status, notes, marked_by) VALUES
-- White Belt students
(1, CURRENT_DATE - INTERVAL '1 day', 'present', 'Good form today', 6),
(1, CURRENT_DATE - INTERVAL '3 days', 'present', 'Excellent progress', 6),
(2, CURRENT_DATE - INTERVAL '1 day', 'present', 'Great technique', 6),
(2, CURRENT_DATE - INTERVAL '3 days', 'present', '', 6),
(3, CURRENT_DATE - INTERVAL '1 day', 'absent', 'Sick', 7),
(4, CURRENT_DATE - INTERVAL '1 day', 'present', 'Strong performance', 7),
(5, CURRENT_DATE - INTERVAL '1 day', 'present', '', 8),

-- Yellow Belt students
(11, CURRENT_DATE - INTERVAL '1 day', 'present', 'Good sparring', 6),
(12, CURRENT_DATE - INTERVAL '1 day', 'present', 'Excellent kata', 7),
(13, CURRENT_DATE - INTERVAL '1 day', 'present', '', 8),

-- Green Belt students
(16, CURRENT_DATE - INTERVAL '1 day', 'present', 'Advanced techniques', 6),
(17, CURRENT_DATE - INTERVAL '1 day', 'present', 7),
(18, CURRENT_DATE - INTERVAL '1 day', 'present', 'Teaching others well', 8),

-- Blue Belt students
(19, CURRENT_DATE - INTERVAL '1 day', 'present', 'Master level techniques', 6),
(20, CURRENT_DATE - INTERVAL '1 day', 'present', '', 7),
(21, CURRENT_DATE - INTERVAL '1 day', 'present', 'Ready for red belt', 8),

-- Red Belt students
(22, CURRENT_DATE - INTERVAL '1 day', 'present', 'Black belt candidate', 6),
(23, CURRENT_DATE - INTERVAL '1 day', 'present', 'Excellent leadership', 7),
(24, CURRENT_DATE - INTERVAL '1 day', 'present', 'Ready for black belt test', 6);

-- =============================================
-- INSERT FEES RECORDS
-- =============================================
-- Monthly fees for all students
INSERT INTO fees (student_id, amount, fee_type, due_date, paid_date, status, payment_method, recorded_by) VALUES
-- Current month fees (pending)
(1, 80.00, 'monthly', CURRENT_DATE + INTERVAL '15 days', NULL, 'pending', NULL, 6),
(2, 80.00, 'monthly', CURRENT_DATE + INTERVAL '15 days', NULL, 'pending', NULL, 6),
(3, 80.00, 'monthly', CURRENT_DATE + INTERVAL '15 days', NULL, 'pending', NULL, 7),
(4, 80.00, 'monthly', CURRENT_DATE + INTERVAL '15 days', NULL, 'pending', NULL, 7),
(5, 80.00, 'monthly', CURRENT_DATE + INTERVAL '15 days', NULL, 'pending', NULL, 8),
(6, 80.00, 'monthly', CURRENT_DATE + INTERVAL '15 days', NULL, 'pending', NULL, 6),
(7, 80.00, 'monthly', CURRENT_DATE + INTERVAL '15 days', NULL, 'pending', NULL, 7),
(8, 80.00, 'monthly', CURRENT_DATE + INTERVAL '15 days', NULL, 'pending', NULL, 8),
(9, 80.00, 'monthly', CURRENT_DATE + INTERVAL '15 days', NULL, 'pending', NULL, 6),
(10, 80.00, 'monthly', CURRENT_DATE + INTERVAL '15 days', NULL, 'pending', NULL, 6),
(11, 80.00, 'monthly', CURRENT_DATE + INTERVAL '15 days', NULL, 'pending', NULL, 7),
(12, 80.00, 'monthly', CURRENT_DATE + INTERVAL '15 days', NULL, 'pending', NULL, 8),
(13, 80.00, 'monthly', CURRENT_DATE + INTERVAL '15 days', NULL, 'pending', NULL, 6),
(14, 80.00, 'monthly', CURRENT_DATE + INTERVAL '15 days', NULL, 'pending', NULL, 7),
(15, 80.00, 'monthly', CURRENT_DATE + INTERVAL '15 days', NULL, 'pending', NULL, 8),
(16, 80.00, 'monthly', CURRENT_DATE + INTERVAL '15 days', NULL, 'pending', NULL, 6),
(17, 80.00, 'monthly', CURRENT_DATE + INTERVAL '15 days', NULL, 'pending', NULL, 7),
(18, 80.00, 'monthly', CURRENT_DATE + INTERVAL '15 days', NULL, 'pending', NULL, 8),
(19, 80.00, 'monthly', CURRENT_DATE + INTERVAL '15 days', NULL, 'pending', NULL, 6),
(20, 80.00, 'monthly', CURRENT_DATE + INTERVAL '15 days', NULL, 'pending', NULL, 7),
(21, 80.00, 'monthly', CURRENT_DATE + INTERVAL '15 days', NULL, 'pending', NULL, 8),
(22, 80.00, 'monthly', CURRENT_DATE + INTERVAL '15 days', NULL, 'pending', NULL, 6),
(23, 80.00, 'monthly', CURRENT_DATE + INTERVAL '15 days', NULL, 'pending', NULL, 7),
(24, 80.00, 'monthly', CURRENT_DATE + INTERVAL '15 days', NULL, 'pending', NULL, 6),

-- Previous month fees (paid)
(1, 80.00, 'monthly', CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE - INTERVAL '10 days', 'paid', 'Cash', 6),
(2, 80.00, 'monthly', CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE - INTERVAL '8 days', 'paid', 'Credit Card', 6),
(3, 80.00, 'monthly', CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE - INTERVAL '12 days', 'paid', 'Bank Transfer', 7),
(4, 80.00, 'monthly', CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE - INTERVAL '5 days', 'paid', 'Cash', 7),
(5, 80.00, 'monthly', CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE - INTERVAL '7 days', 'paid', 'Credit Card', 8),

-- Belt test fees
(6, 25.00, 'belt_test', CURRENT_DATE + INTERVAL '7 days', NULL, 'pending', NULL, 6),
(7, 25.00, 'belt_test', CURRENT_DATE + INTERVAL '7 days', NULL, 'pending', NULL, 7),
(8, 25.00, 'belt_test', CURRENT_DATE + INTERVAL '7 days', NULL, 'pending', NULL, 8),
(9, 25.00, 'belt_test', CURRENT_DATE + INTERVAL '7 days', NULL, 'pending', NULL, 6),
(10, 25.00, 'belt_test', CURRENT_DATE + INTERVAL '7 days', NULL, 'pending', NULL, 7);

-- =============================================
-- INSERT INVENTORY ITEMS
-- =============================================
INSERT INTO inventory (item_name, category, quantity, unit_price, branch_id, supplier, last_restocked) VALUES
-- Uniforms
('Karate Gi (White)', 'Uniforms', 25, 45.00, 1, 'Martial Arts Supply Co', CURRENT_DATE - INTERVAL '30 days'),
('Karate Gi (Black)', 'Uniforms', 15, 50.00, 1, 'Martial Arts Supply Co', CURRENT_DATE - INTERVAL '30 days'),
('Karate Gi (White)', 'Uniforms', 20, 45.00, 2, 'Martial Arts Supply Co', CURRENT_DATE - INTERVAL '25 days'),
('Karate Gi (Black)', 'Uniforms', 12, 50.00, 2, 'Martial Arts Supply Co', CURRENT_DATE - INTERVAL '25 days'),

-- Belts
('White Belt', 'Belts', 50, 8.00, 1, 'Belt Masters', CURRENT_DATE - INTERVAL '15 days'),
('Yellow Belt', 'Belts', 30, 8.00, 1, 'Belt Masters', CURRENT_DATE - INTERVAL '15 days'),
('Green Belt', 'Belts', 25, 8.00, 1, 'Belt Masters', CURRENT_DATE - INTERVAL '15 days'),
('Blue Belt', 'Belts', 20, 8.00, 1, 'Belt Masters', CURRENT_DATE - INTERVAL '15 days'),
('Red Belt', 'Belts', 15, 8.00, 1, 'Belt Masters', CURRENT_DATE - INTERVAL '15 days'),
('Black Belt', 'Belts', 10, 12.00, 1, 'Belt Masters', CURRENT_DATE - INTERVAL '15 days'),

-- Equipment
('Focus Pads', 'Equipment', 10, 25.00, 1, 'Training Gear Inc', CURRENT_DATE - INTERVAL '45 days'),
('Sparring Gloves', 'Equipment', 15, 35.00, 1, 'Training Gear Inc', CURRENT_DATE - INTERVAL '45 days'),
('Shin Guards', 'Equipment', 12, 28.00, 1, 'Training Gear Inc', CURRENT_DATE - INTERVAL '45 days'),
('Mouth Guard', 'Equipment', 25, 15.00, 1, 'Training Gear Inc', CURRENT_DATE - INTERVAL '45 days'),
('Training Dummy', 'Equipment', 3, 80.00, 1, 'Training Gear Inc', CURRENT_DATE - INTERVAL '60 days'),

-- Accessories
('Karate Bag', 'Accessories', 20, 20.00, 1, 'Martial Arts Supply Co', CURRENT_DATE - INTERVAL '20 days'),
('Water Bottle', 'Accessories', 30, 12.00, 1, 'Martial Arts Supply Co', CURRENT_DATE - INTERVAL '20 days'),
('Towel', 'Accessories', 40, 8.00, 1, 'Martial Arts Supply Co', CURRENT_DATE - INTERVAL '20 days'),
('Headband', 'Accessories', 50, 5.00, 1, 'Martial Arts Supply Co', CURRENT_DATE - INTERVAL '20 days'),

-- Books and Media
('Karate Basics Book', 'Books', 15, 15.00, 1, 'Educational Media', CURRENT_DATE - INTERVAL '10 days'),
('Advanced Techniques DVD', 'Books', 8, 25.00, 1, 'Educational Media', CURRENT_DATE - INTERVAL '10 days'),
('Training Manual', 'Books', 12, 18.00, 1, 'Educational Media', CURRENT_DATE - INTERVAL '10 days');

-- =============================================
-- INSERT SAMPLE ORDERS
-- =============================================
INSERT INTO orders (instructor_id, branch_id, total_amount, status, notes) VALUES
(6, 1, 150.00, 'pending', 'Need new uniforms for beginners'),
(7, 2, 200.00, 'approved', 'Equipment for advanced students'),
(8, 3, 120.00, 'delivered', 'Belts for upcoming belt test');

-- Insert order items
INSERT INTO order_items (order_id, inventory_id, quantity, unit_price, total_price) VALUES
(1, 1, 2, 45.00, 90.00),
(1, 5, 5, 8.00, 40.00),
(1, 12, 2, 20.00, 40.00),
(2, 2, 2, 50.00, 100.00),
(2, 10, 3, 25.00, 75.00),
(2, 11, 2, 35.00, 70.00),
(3, 6, 10, 8.00, 80.00),
(3, 7, 5, 8.00, 40.00);

-- =============================================
-- SUCCESS MESSAGE
-- =============================================
SELECT 
    'GAMA Martial Arts Dummy Data Inserted Successfully!' as status,
    'Branches: ' || COUNT(DISTINCT b.id) as branches,
    'Users: ' || COUNT(DISTINCT u.id) as users,
    'Instructors: ' || COUNT(DISTINCT i.id) as instructors,
    'Students: ' || COUNT(DISTINCT s.id) as students,
    'Belt Levels: ' || COUNT(DISTINCT br.id) as belt_levels,
    'Inventory Items: ' || COUNT(DISTINCT inv.id) as inventory_items
FROM branches b
CROSS JOIN users u
CROSS JOIN instructors i
CROSS JOIN students s
CROSS JOIN belt_ranks br
CROSS JOIN inventory inv;
