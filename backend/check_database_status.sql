-- Check Database Status
-- This script shows what's currently in your database

-- Check if tables exist
SELECT 
    'TABLES:' as info,
    table_name,
    'EXISTS' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check users
SELECT 
    'USERS:' as info,
    id,
    username, 
    role, 
    first_name, 
    last_name,
    email,
    CASE 
        WHEN password_hash IS NOT NULL THEN 'Has password hash' 
        ELSE 'No password hash' 
    END as password_status
FROM users 
ORDER BY id;

-- Check branches
SELECT 
    'BRANCHES:' as info,
    id,
    name,
    address,
    phone,
    email
FROM branches 
ORDER BY id;

-- Check belt ranks
SELECT 
    'BELT RANKS:' as info,
    COUNT(*) as total_belts,
    COUNT(CASE WHEN dan_level > 0 THEN 1 END) as dan_belts,
    COUNT(CASE WHEN stripe_level > 0 THEN 1 END) as stripe_belts,
    COUNT(CASE WHEN stripe_level = 0 AND dan_level = 0 THEN 1 END) as basic_belts
FROM belt_ranks 
WHERE is_active = true;

-- Check instructors
SELECT 
    'INSTRUCTORS:' as info,
    i.id,
    i.first_name,
    i.last_name,
    i.email,
    u.username
FROM instructors i
LEFT JOIN users u ON i.user_id = u.id
ORDER BY i.id;
