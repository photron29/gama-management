# GAMA Martial Arts Database Setup Sequence

## 🚀 Complete Database Setup Instructions

### **Step 1: Clean Database (Optional - Only if you want to start fresh)**
```sql
-- ⚠️ WARNING: This will delete ALL existing data and tables
-- Only run this if you want to start completely fresh
\i backend/cleanup_database.sql
```

### **Step 2: Create Complete Schema**
```sql
-- This creates all tables, indexes, constraints, and belt system
\i backend/complete_schema.sql
```

### **Step 3: Add Minimal Data (Recommended for initial setup)**
```sql
-- This adds minimal data: 1 branch, 1 admin, 1 instructor
\i backend/minimal_dummy_data.sql
```

### **Step 3 Alternative: Add Full Dummy Data (Optional - for testing)**
```sql
-- This adds comprehensive test data with realistic scenarios
\i backend/dummy_data.sql
```

---

## 📋 Alternative: Manual Step-by-Step Execution

If you prefer to run queries manually in your SQL editor:

### **1. Clean Database (if needed):**
```sql
-- Copy and paste the entire content of: backend/cleanup_database.sql
```

### **2. Create Schema:**
```sql
-- Copy and paste the entire content of: backend/complete_schema.sql
```

### **3. Add Dummy Data:**
```sql
-- Copy and paste the entire content of: backend/dummy_data.sql
```

---

## 🔍 Verification Queries

After running the setup, verify everything is working:

### **Check Tables:**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

### **Check Belt System:**
```sql
SELECT belt_name, belt_color, stripe_level, dan_level, sort_order 
FROM belt_ranks 
ORDER BY sort_order;
```

### **Check Data Count:**
```sql
SELECT 
    'Branches' as table_name, COUNT(*) as count FROM branches
UNION ALL
SELECT 'Users', COUNT(*) FROM users
UNION ALL
SELECT 'Students', COUNT(*) FROM students
UNION ALL
SELECT 'Instructors', COUNT(*) FROM instructors
UNION ALL
SELECT 'Belt Ranks', COUNT(*) FROM belt_ranks;
```

---

## ⚡ Quick Setup (Recommended)

**For a fresh start:**
1. Run `backend/cleanup_database.sql` (if you want to start fresh)
2. Run `backend/complete_schema.sql` (creates everything)
3. Run `backend/minimal_dummy_data.sql` (adds minimal data)

**For existing database:**
1. Run `backend/complete_schema.sql` (creates missing tables)
2. Run `backend/minimal_dummy_data.sql` (adds minimal data)

---

## 🎯 Expected Results

After successful setup, you should have:
- ✅ 12 tables created
- ✅ 26 belt levels in belt_ranks table
- ✅ 1 branch (GAMA HQ)
- ✅ 2 users (1 admin + 1 instructor)
- ✅ 1 instructor
- ✅ Basic inventory items
- ✅ All indexes and constraints in place

**Login Credentials:**
- **Admin**: username=`admin`, password=`gamajk16`
- **Instructor**: username=`instructor`, password=`000000`

---

## 🚨 Troubleshooting

### **If you get foreign key errors:**
- Make sure to run the files in the correct order
- Check that all referenced tables exist before creating foreign keys

### **If you get permission errors:**
- Ensure your database user has CREATE, DROP, and INSERT permissions
- Run as a database administrator if needed

### **If you get duplicate key errors:**
- Run the cleanup script first to remove existing data
- Or modify the INSERT statements to use ON CONFLICT DO NOTHING

---

## 📞 Support

If you encounter any issues:
1. Check the error messages carefully
2. Ensure you're running the files in the correct order
3. Verify your database connection and permissions
4. Check that all required tables exist before running foreign key constraints
