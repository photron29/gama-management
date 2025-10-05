-- Fix Login Credentials - Generate Proper Password Hashes
-- This script updates the user credentials with properly hashed passwords

-- Update admin user with correct password hash for 'gamajk16'
UPDATE users 
SET password_hash = '$2b$10$lC7KVVWnLaoN3/dD8FC3wuftyxYp8YpkWYRZTc5Ji5ODiEla08AsW'  -- This is the hash for 'gamajk16'
WHERE username = 'admin';

-- Update instructor user with correct password hash for '000000'
UPDATE users 
SET password_hash = '$2b$10$2X.bJ.FFSSixgJjXt6yPtulTWTEE1LhBE6sKUEatsA2RyZ8maA/92'  -- This is the hash for '000000'
WHERE username = 'instructor';

-- Verify the updates
SELECT 
    username, 
    role, 
    first_name, 
    last_name,
    CASE 
        WHEN password_hash IS NOT NULL THEN 'Password hash set' 
        ELSE 'No password hash' 
    END as password_status
FROM users 
WHERE username IN ('admin', 'instructor');

-- Display login credentials
SELECT 
    'LOGIN CREDENTIALS UPDATED:' as status,
    'Admin: username=admin, password=gamajk16' as admin_credentials,
    'Instructor: username=instructor, password=000000' as instructor_credentials;
