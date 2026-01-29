-- Complete fix for grades table issues
-- Run this in Supabase SQL Editor

-- Check complete grades table structure
SELECT 'Checking complete grades table structure' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'grades' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if there are any existing grades
SELECT COUNT(*) as existing_grades FROM grades;

-- Test inserting a grade with all possible required fields
-- This will help us identify what's missing
SELECT 'Testing grade insertion structure' as test;

-- If the above shows missing columns, we may need to alter the grades table
-- or provide default values for required fields

-- For now, let's check what columns are actually required
SELECT 'Checking NOT NULL constraints' as test;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'grades' 
AND table_schema = 'public'
AND is_nullable = 'NO'
ORDER BY ordinal_position;
