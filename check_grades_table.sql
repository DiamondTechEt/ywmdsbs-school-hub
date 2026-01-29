-- Check grades table structure
-- Run this in Supabase SQL Editor

SELECT 'Checking grades table structure' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'grades' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if we have any existing grades
SELECT COUNT(*) as existing_grades FROM grades;

-- Check assessment table structure to see what fields are available
SELECT 'Checking assessment table for academic_year_id' as info;
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'assessments' AND table_schema = 'public'
AND column_name LIKE '%academic%' OR column_name LIKE '%year%';
