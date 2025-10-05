-- GAMA Martial Arts Management System - Minimal Dummy Data
-- This file contains minimal data for initial setup

-- =============================================
-- INSERT SINGLE BRANCH
-- =============================================
INSERT INTO branches (name, address, phone, email, manager) VALUES
('GAMA HQ', '123 Martial Arts Street, Main City', '555-0101', 'hq@gama.com', 'Master Admin');

-- =============================================
-- INSERT ADMIN USER
-- =============================================
-- Admin user (Black Belt 5th Dan)
INSERT INTO users (username, email, password_hash, role, first_name, last_name, phone, belt_level_id, branch_id) VALUES
('admin', 'admin@gama.com', '$2b$10$lC7KVVWnLaoN3/dD8FC3wuftyxYp8YpkWYRZTc5Ji5ODiEla08AsW', 'admin', 'Admin', 'User', '555-0001', 21, 1);

-- =============================================
-- INSERT INSTRUCTOR USER
-- =============================================
-- Instructor user (Black Belt 3rd Dan)
INSERT INTO users (username, email, password_hash, role, first_name, last_name, phone, belt_level_id, branch_id) VALUES
('instructor', 'instructor@gama.com', '$2b$10$2X.bJ.FFSSixgJjXt6yPtulTWTEE1LhBE6sKUEatsA2RyZ8maA/92', 'instructor', 'Instructor', 'User', '555-0002', 19, 1);

-- =============================================
-- INSERT INSTRUCTOR DETAILS
-- =============================================
INSERT INTO instructors (user_id, first_name, last_name, email, phone, belt_level_id, branch_id, specialization, certification_date) VALUES
(2, 'Instructor', 'User', 'instructor@gama.com', '555-0002', 19, 1, 'Karate, Self Defense, Basic Techniques', '2020-01-15');

-- =============================================
-- INSERT BASIC INVENTORY ITEMS
-- =============================================
INSERT INTO inventory (item_name, category, quantity, unit_price, branch_id, supplier, last_restocked) VALUES
-- Uniforms
('Karate Gi (White)', 'Uniforms', 20, 45.00, 1, 'Martial Arts Supply Co', CURRENT_DATE - INTERVAL '30 days'),
('Karate Gi (Black)', 'Uniforms', 10, 50.00, 1, 'Martial Arts Supply Co', CURRENT_DATE - INTERVAL '30 days'),

-- Belts
('White Belt', 'Belts', 30, 8.00, 1, 'Belt Masters', CURRENT_DATE - INTERVAL '15 days'),
('Yellow Belt', 'Belts', 20, 8.00, 1, 'Belt Masters', CURRENT_DATE - INTERVAL '15 days'),
('Green Belt', 'Belts', 15, 8.00, 1, 'Belt Masters', CURRENT_DATE - INTERVAL '15 days'),
('Blue Belt', 'Belts', 10, 8.00, 1, 'Belt Masters', CURRENT_DATE - INTERVAL '15 days'),
('Red Belt', 'Belts', 8, 8.00, 1, 'Belt Masters', CURRENT_DATE - INTERVAL '15 days'),
('Black Belt', 'Belts', 5, 12.00, 1, 'Belt Masters', CURRENT_DATE - INTERVAL '15 days'),

-- Equipment
('Focus Pads', 'Equipment', 5, 25.00, 1, 'Training Gear Inc', CURRENT_DATE - INTERVAL '45 days'),
('Sparring Gloves', 'Equipment', 8, 35.00, 1, 'Training Gear Inc', CURRENT_DATE - INTERVAL '45 days'),
('Shin Guards', 'Equipment', 6, 28.00, 1, 'Training Gear Inc', CURRENT_DATE - INTERVAL '45 days'),
('Mouth Guard', 'Equipment', 15, 15.00, 1, 'Training Gear Inc', CURRENT_DATE - INTERVAL '45 days'),

-- Accessories
('Karate Bag', 'Accessories', 10, 20.00, 1, 'Martial Arts Supply Co', CURRENT_DATE - INTERVAL '20 days'),
('Water Bottle', 'Accessories', 15, 12.00, 1, 'Martial Arts Supply Co', CURRENT_DATE - INTERVAL '20 days'),
('Towel', 'Accessories', 20, 8.00, 1, 'Martial Arts Supply Co', CURRENT_DATE - INTERVAL '20 days');

-- =============================================
-- SUCCESS MESSAGE
-- =============================================
SELECT 
    'GAMA Martial Arts Minimal Data Inserted Successfully!' as status,
    'Branch: ' || COUNT(DISTINCT b.id) as branches,
    'Users: ' || COUNT(DISTINCT u.id) as users,
    'Instructors: ' || COUNT(DISTINCT i.id) as instructors,
    'Inventory Items: ' || COUNT(DISTINCT inv.id) as inventory_items
FROM branches b
CROSS JOIN users u
CROSS JOIN instructors i
CROSS JOIN inventory inv;

-- =============================================
-- LOGIN CREDENTIALS
-- =============================================
SELECT 
    'LOGIN CREDENTIALS:' as info,
    'Admin: username=admin, password=gamajk16' as admin_credentials,
    'Instructor: username=instructor, password=000000' as instructor_credentials;
