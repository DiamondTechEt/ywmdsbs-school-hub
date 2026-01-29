-- Check the actual structure of the user_roles table
-- Run this in Supabase SQL Editor

SELECT 'Checking user_roles table structure' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_roles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if there are any constraints
SELECT 'Checking constraints on user_roles table' as info;
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'user_roles' 
AND tc.table_schema = 'public';

-- Check existing data
SELECT 'Checking existing user_roles data' as info;
SELECT * FROM user_roles LIMIT 5;
