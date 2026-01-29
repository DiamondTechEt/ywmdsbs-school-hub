-- Check RLS policies that might be causing 500 errors
-- Run this in Supabase SQL Editor to diagnose issues

-- Check existing RLS policies on students table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'students';

-- Check if there are any problematic function calls in RLS policies
SELECT 
    proname,
    prosrc
FROM pg_proc 
WHERE proname LIKE '%student%' 
AND prosrc LIKE '%create_student_with_user%';

-- Test the students table query directly
-- This should help identify the exact issue
SELECT 
    s.*,
    c.name as class_name,
    c.grade_level
FROM students s
LEFT JOIN classes c ON s.current_class_id = c.id
ORDER BY s.last_name ASC
LIMIT 5;

-- Check if the classes table exists and has the right structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'classes' 
AND table_schema = 'public'
ORDER BY ordinal_position;
