-- Check the actual structure of class_subject_assignments table
-- Run this in Supabase SQL Editor

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
