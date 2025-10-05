-- GAMA Martial Arts Management System - Updated Schema with Belt System
-- This file contains the complete updated schema with the new belt system

-- =============================================
-- BELT SYSTEM TABLES
-- =============================================

-- Create belt_ranks table to store all belt levels
CREATE TABLE IF NOT EXISTS belt_ranks (
    id SERIAL PRIMARY KEY,
    belt_name VARCHAR(50) NOT NULL UNIQUE,
    belt_color VARCHAR(20) NOT NULL,
    stripe_level INTEGER DEFAULT 0,
    dan_level INTEGER DEFAULT 0,
    sort_order INTEGER NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- EXISTING TABLES (UPDATED)
-- =============================================

-- Users table (admin and instructors)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'instructor')),
    branch_id INTEGER,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    phone VARCHAR(20),
    belt_level_id INTEGER REFERENCES belt_ranks(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Branches table
CREATE TABLE IF NOT EXISTS branches (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(100),
    manager VARCHAR(100),
    manager_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Students table (updated to use belt_ranks)
CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    date_of_birth DATE,
    belt_level_id INTEGER REFERENCES belt_ranks(id) DEFAULT 1, -- Default to White Belt
    branch_id INTEGER NOT NULL REFERENCES branches(id),
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    address TEXT,
    enrollment_date DATE DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Instructors table
CREATE TABLE IF NOT EXISTS instructors (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    belt_level_id INTEGER REFERENCES belt_ranks(id),
    branch_id INTEGER REFERENCES branches(id),
    specialization TEXT,
    certification_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Attendance table
CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id),
    class_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'late')),
    notes TEXT,
    marked_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, class_date)
);

-- Fees table
CREATE TABLE IF NOT EXISTS fees (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id),
    amount DECIMAL(10,2) NOT NULL,
    fee_type VARCHAR(50) NOT NULL,
    due_date DATE NOT NULL,
    paid_date DATE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'paid', 'overdue')),
    payment_method VARCHAR(50),
    notes TEXT,
    recorded_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inventory table
CREATE TABLE IF NOT EXISTS inventory (
    id SERIAL PRIMARY KEY,
    item_name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    quantity INTEGER NOT NULL DEFAULT 0,
    unit_price DECIMAL(10,2),
    branch_id INTEGER REFERENCES branches(id),
    supplier VARCHAR(100),
    last_restocked DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    instructor_id INTEGER NOT NULL REFERENCES users(id),
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'shipped', 'delivered')),
    total DECIMAL(10,2) NOT NULL,
    notes TEXT,
    processed_by INTEGER REFERENCES users(id),
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    inventory_id INTEGER NOT NULL REFERENCES inventory(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Attendance approvals table
CREATE TABLE IF NOT EXISTS attendance_approvals (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id),
    class_date DATE NOT NULL,
    old_status VARCHAR(20) NOT NULL,
    new_status VARCHAR(20) NOT NULL,
    reason TEXT NOT NULL,
    requested_by INTEGER NOT NULL REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
    reviewed_by INTEGER REFERENCES users(id),
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Password reset requests table
CREATE TABLE IF NOT EXISTS password_reset_requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'completed')),
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    processed_by INTEGER REFERENCES users(id),
    admin_notes TEXT,
    new_password VARCHAR(255)
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Belt ranks indexes
CREATE INDEX IF NOT EXISTS idx_belt_ranks_sort_order ON belt_ranks(sort_order);
CREATE INDEX IF NOT EXISTS idx_belt_ranks_belt_color ON belt_ranks(belt_color);
CREATE INDEX IF NOT EXISTS idx_belt_ranks_dan_level ON belt_ranks(dan_level);
CREATE INDEX IF NOT EXISTS idx_belt_ranks_stripe_level ON belt_ranks(stripe_level);

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_branch_id ON users(branch_id);

-- Students indexes
CREATE INDEX IF NOT EXISTS idx_students_branch_id ON students(branch_id);
CREATE INDEX IF NOT EXISTS idx_students_belt_level_id ON students(belt_level_id);
CREATE INDEX IF NOT EXISTS idx_students_is_active ON students(is_active);
CREATE INDEX IF NOT EXISTS idx_students_enrollment_date ON students(enrollment_date);

-- Attendance indexes
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_class_date ON attendance(class_date);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);

-- Fees indexes
CREATE INDEX IF NOT EXISTS idx_fees_student_id ON fees(student_id);
CREATE INDEX IF NOT EXISTS idx_fees_status ON fees(status);
CREATE INDEX IF NOT EXISTS idx_fees_due_date ON fees(due_date);

-- Orders indexes
CREATE INDEX IF NOT EXISTS idx_orders_instructor_id ON orders(instructor_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_date ON orders(order_date);

-- Password reset indexes
CREATE INDEX IF NOT EXISTS idx_password_reset_status ON password_reset_requests(status);
CREATE INDEX IF NOT EXISTS idx_password_reset_user ON password_reset_requests(user_id);

-- =============================================
-- VIEWS FOR EASY QUERIES
-- =============================================

-- Belt progression view
CREATE OR REPLACE VIEW belt_progression AS
SELECT 
    id,
    belt_name,
    belt_color,
    stripe_level,
    dan_level,
    sort_order,
    description,
    CASE 
        WHEN dan_level > 0 THEN 'Dan Level'
        WHEN stripe_level > 0 THEN 'Stripe Level'
        ELSE 'Basic Belt'
    END as belt_type,
    CASE 
        WHEN dan_level > 0 THEN CONCAT('Dan ', dan_level)
        WHEN stripe_level > 0 THEN CONCAT('Stripe ', stripe_level)
        ELSE 'Basic'
    END as level_type
FROM belt_ranks 
WHERE is_active = true 
ORDER BY sort_order;

-- Student details with belt information
CREATE OR REPLACE VIEW student_details AS
SELECT 
    s.id,
    s.first_name,
    s.last_name,
    s.email,
    s.phone,
    s.date_of_birth,
    s.enrollment_date,
    s.is_active,
    b.name as branch_name,
    br.belt_name,
    br.belt_color,
    br.stripe_level,
    br.dan_level,
    br.sort_order as belt_sort_order
FROM students s
LEFT JOIN branches b ON s.branch_id = b.id
LEFT JOIN belt_ranks br ON s.belt_level_id = br.id
ORDER BY s.last_name, s.first_name;

-- Instructor details with belt information
CREATE OR REPLACE VIEW instructor_details AS
SELECT 
    i.id,
    i.first_name,
    i.last_name,
    i.email,
    i.phone,
    i.specialization,
    i.certification_date,
    b.name as branch_name,
    br.belt_name,
    br.belt_color,
    br.stripe_level,
    br.dan_level,
    br.sort_order as belt_sort_order
FROM instructors i
LEFT JOIN branches b ON i.branch_id = b.id
LEFT JOIN belt_ranks br ON i.belt_level_id = br.id
ORDER BY i.last_name, i.first_name;

-- =============================================
-- FUNCTIONS FOR BELT SYSTEM
-- =============================================

-- Function to get next belt in progression
CREATE OR REPLACE FUNCTION get_next_belt(current_belt_id INTEGER)
RETURNS TABLE(
    next_belt_id INTEGER,
    next_belt_name VARCHAR(50),
    next_belt_color VARCHAR(20),
    next_stripe_level INTEGER,
    next_dan_level INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        br.id,
        br.belt_name,
        br.belt_color,
        br.stripe_level,
        br.dan_level
    FROM belt_ranks br
    WHERE br.sort_order = (
        SELECT sort_order + 1 
        FROM belt_ranks 
        WHERE id = current_belt_id
    )
    AND br.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Function to get previous belt in progression
CREATE OR REPLACE FUNCTION get_previous_belt(current_belt_id INTEGER)
RETURNS TABLE(
    prev_belt_id INTEGER,
    prev_belt_name VARCHAR(50),
    prev_belt_color VARCHAR(20),
    prev_stripe_level INTEGER,
    prev_dan_level INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        br.id,
        br.belt_name,
        br.belt_color,
        br.stripe_level,
        br.dan_level
    FROM belt_ranks br
    WHERE br.sort_order = (
        SELECT sort_order - 1 
        FROM belt_ranks 
        WHERE id = current_belt_id
    )
    AND br.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Function to get belt hierarchy (all belts from current to highest)
CREATE OR REPLACE FUNCTION get_belt_hierarchy(current_belt_id INTEGER)
RETURNS TABLE(
    belt_id INTEGER,
    belt_name VARCHAR(50),
    belt_color VARCHAR(20),
    stripe_level INTEGER,
    dan_level INTEGER,
    sort_order INTEGER,
    is_current BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        br.id,
        br.belt_name,
        br.belt_color,
        br.stripe_level,
        br.dan_level,
        br.sort_order,
        (br.id = current_belt_id) as is_current
    FROM belt_ranks br
    WHERE br.sort_order >= (
        SELECT sort_order 
        FROM belt_ranks 
        WHERE id = current_belt_id
    )
    AND br.is_active = true
    ORDER BY br.sort_order;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- INSERT BELT SYSTEM DATA
-- =============================================

-- Insert belt system data
INSERT INTO belt_ranks (belt_name, belt_color, stripe_level, dan_level, sort_order, description) VALUES
-- Basic Belts
('White Belt', 'white', 0, 0, 1, 'Beginner level - starting point for all students'),
('Yellow Belt', 'yellow', 0, 0, 2, 'First advancement - basic techniques learned'),
('Green Belt', 'green', 0, 0, 3, 'Intermediate level - developing skills'),
('Blue Belt', 'blue', 0, 0, 4, 'Intermediate-advanced level - solid foundation'),
('Red Belt', 'red', 0, 0, 5, 'Advanced level - preparing for black belt'),

-- White Belt Stripes
('White Belt - Yellow Stripe', 'white', 1, 0, 6, 'White belt with yellow stripe - first stripe'),
('White Belt - Green Stripe', 'white', 2, 0, 7, 'White belt with green stripe - second stripe'),
('White Belt - Blue Stripe', 'white', 3, 0, 8, 'White belt with blue stripe - third stripe'),
('White Belt - Red Stripe', 'white', 4, 0, 9, 'White belt with red stripe - fourth stripe'),

-- Yellow Belt Stripes
('Yellow Belt - Green Stripe', 'yellow', 1, 0, 10, 'Yellow belt with green stripe - first stripe'),
('Yellow Belt - Blue Stripe', 'yellow', 2, 0, 11, 'Yellow belt with blue stripe - second stripe'),
('Yellow Belt - Red Stripe', 'yellow', 3, 0, 12, 'Yellow belt with red stripe - third stripe'),

-- Green Belt Stripes
('Green Belt - Blue Stripe', 'green', 1, 0, 13, 'Green belt with blue stripe - first stripe'),
('Green Belt - Red Stripe', 'green', 2, 0, 14, 'Green belt with red stripe - second stripe'),

-- Blue Belt Stripes
('Blue Belt - Red Stripe', 'blue', 1, 0, 15, 'Blue belt with red stripe - first stripe'),

-- Red Belt Stripes
('Red Belt - Black Stripe', 'red', 1, 0, 16, 'Red belt with black stripe - preparing for black belt'),

-- Black Belt Dan Levels
('Black Belt - 1st Dan', 'black', 0, 1, 17, 'First degree black belt - mastery achieved'),
('Black Belt - 2nd Dan', 'black', 0, 2, 18, 'Second degree black belt - teaching assistant level'),
('Black Belt - 3rd Dan', 'black', 0, 3, 19, 'Third degree black belt - instructor level'),
('Black Belt - 4th Dan', 'black', 0, 4, 20, 'Fourth degree black belt - senior instructor'),
('Black Belt - 5th Dan', 'black', 0, 5, 21, 'Fifth degree black belt - master instructor'),
('Black Belt - 6th Dan', 'black', 0, 6, 22, 'Sixth degree black belt - senior master'),
('Black Belt - 7th Dan', 'black', 0, 7, 23, 'Seventh degree black belt - grandmaster'),
('Black Belt - 8th Dan', 'black', 0, 8, 24, 'Eighth degree black belt - senior grandmaster'),
('Black Belt - 9th Dan', 'black', 0, 9, 25, 'Ninth degree black belt - supreme grandmaster'),
('Black Belt - 10th Dan', 'black', 0, 10, 26, 'Tenth degree black belt - highest possible rank');

-- =============================================
-- SUCCESS MESSAGE
-- =============================================

SELECT 
    'GAMA Martial Arts Database Schema Updated Successfully!' as status,
    'Belt system integrated with ' || COUNT(*) || ' belt levels' as belt_info,
    'All tables created with proper relationships' as table_info
FROM belt_ranks 
WHERE is_active = true;
