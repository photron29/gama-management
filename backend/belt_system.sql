-- Belt System Schema for GAMA Martial Arts
-- This file contains the complete belt system with stripes and Dan levels

-- Create belt_ranks table to store all belt levels
CREATE TABLE IF NOT EXISTS belt_ranks (
    id SERIAL PRIMARY KEY,
    belt_name VARCHAR(50) NOT NULL UNIQUE,
    belt_color VARCHAR(20) NOT NULL,
    stripe_level INTEGER DEFAULT 0,
    dan_level INTEGER DEFAULT 0,
    sort_order INTEGER NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true
);

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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_belt_ranks_sort_order ON belt_ranks(sort_order);
CREATE INDEX IF NOT EXISTS idx_belt_ranks_belt_color ON belt_ranks(belt_color);
CREATE INDEX IF NOT EXISTS idx_belt_ranks_dan_level ON belt_ranks(dan_level);
CREATE INDEX IF NOT EXISTS idx_belt_ranks_stripe_level ON belt_ranks(stripe_level);

-- Create a view for easy belt progression queries
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

-- Create a function to get next belt in progression
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

-- Create a function to get previous belt in progression
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

-- Create a function to get belt hierarchy (all belts from current to highest)
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

-- Insert some sample belt progression data for testing
INSERT INTO belt_ranks (belt_name, belt_color, stripe_level, dan_level, sort_order, description, is_active) VALUES
-- Additional test belts if needed
('Test Belt', 'purple', 0, 0, 999, 'Test belt for development', false);

-- Display the complete belt system
SELECT 
    'Belt System Created Successfully!' as status,
    COUNT(*) as total_belts,
    COUNT(CASE WHEN dan_level > 0 THEN 1 END) as dan_belts,
    COUNT(CASE WHEN stripe_level > 0 THEN 1 END) as stripe_belts,
    COUNT(CASE WHEN stripe_level = 0 AND dan_level = 0 THEN 1 END) as basic_belts
FROM belt_ranks 
WHERE is_active = true;
