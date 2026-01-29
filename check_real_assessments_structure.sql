-- Check the actual assessments table structure
-- Run this in Supabase SQL Editor

SELECT 'Checking assessments table structure' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'assessments' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Also check class_subject_assignments structure
SELECT 'Checking class_subject_assignments table structure' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'class_subject_assignments' 
AND table_schema = 'public'
ORDER BY ordinal_position;
