-- GAMA Martial Arts Management System - Complete Database Cleanup
-- WARNING: This will delete ALL data and tables. Use with caution!

-- =============================================
-- DISABLE FOREIGN KEY CHECKS (PostgreSQL)
-- =============================================
SET session_replication_role = replica;

-- =============================================
-- DROP ALL TABLES IN CORRECT ORDER
-- =============================================

-- Drop tables that reference other tables first
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS fees CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS attendance_approvals CASCADE;
DROP TABLE IF EXISTS password_reset_requests CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS instructors CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS branches CASCADE;
DROP TABLE IF EXISTS belt_ranks CASCADE;

-- =============================================
-- DROP ALL FUNCTIONS AND VIEWS
-- =============================================
DROP FUNCTION IF EXISTS get_next_belt(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS get_previous_belt(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS get_belt_hierarchy(INTEGER) CASCADE;

DROP VIEW IF EXISTS belt_progression CASCADE;
DROP VIEW IF EXISTS student_details CASCADE;
DROP VIEW IF EXISTS instructor_details CASCADE;

-- =============================================
-- DROP ALL SEQUENCES
-- =============================================
DROP SEQUENCE IF EXISTS belt_ranks_id_seq CASCADE;
DROP SEQUENCE IF EXISTS users_id_seq CASCADE;
DROP SEQUENCE IF EXISTS branches_id_seq CASCADE;
DROP SEQUENCE IF EXISTS students_id_seq CASCADE;
DROP SEQUENCE IF EXISTS instructors_id_seq CASCADE;
DROP SEQUENCE IF EXISTS attendance_id_seq CASCADE;
DROP SEQUENCE IF EXISTS fees_id_seq CASCADE;
DROP SEQUENCE IF EXISTS inventory_id_seq CASCADE;
DROP SEQUENCE IF EXISTS orders_id_seq CASCADE;
DROP SEQUENCE IF EXISTS order_items_id_seq CASCADE;
DROP SEQUENCE IF EXISTS attendance_approvals_id_seq CASCADE;
DROP SEQUENCE IF EXISTS password_reset_requests_id_seq CASCADE;

-- =============================================
-- DROP ALL INDEXES
-- =============================================
-- Note: Indexes are automatically dropped when tables are dropped
-- This section is for reference only

-- =============================================
-- RE-ENABLE FOREIGN KEY CHECKS
-- =============================================
SET session_replication_role = DEFAULT;

-- =============================================
-- VERIFICATION QUERY
-- =============================================
SELECT 
    'Database cleanup completed successfully!' as status,
    'All tables, functions, views, and sequences have been removed.' as message;

-- =============================================
-- OPTIONAL: RESET DATABASE CONNECTIONS
-- =============================================
-- If you encounter connection issues, you may need to:
-- 1. Restart your database server
-- 2. Or run: SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'your_database_name';
