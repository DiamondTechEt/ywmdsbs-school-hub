-- Check what columns actually exist in assessments table
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
