-- Diagnose the exact database issue
-- Run this in Supabase SQL Editor to identify the problem

-- Check if tables exist and their structure
SELECT 'Checking students table structure' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'students' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'Checking classes table structure' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'classes' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if RLS is enabled
SELECT 'Checking RLS status' as info;
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('students', 'classes', 'enrollments');

-- Check existing RLS policies
SELECT 'Checking RLS policies' as info;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('students', 'classes', 'enrollments');

-- Test basic table access
SELECT 'Testing basic students query' as info;
SELECT COUNT(*) as count FROM students;

SELECT 'Testing basic classes query' as info;
SELECT COUNT(*) as count FROM classes;

-- Test the specific query that's failing
SELECT 'Testing the problematic join query' as info;
SELECT 
    s.*,
    c.name as class_name,
    c.grade_level
FROM students s
LEFT JOIN classes c ON s.current_class_id = c.id
ORDER BY s.last_name ASC
LIMIT 1;

-- Check if there are any broken functions
SELECT 'Checking for broken functions' as info;
SELECT 
    proname,
    prosrc
FROM pg_proc 
WHERE proname LIKE '%student%' 
AND prosrc LIKE '%DEFAULT%';

-- Check current_class_id column specifically
SELECT 'Checking current_class_id column' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'students' 
AND column_name = 'current_class_id';
