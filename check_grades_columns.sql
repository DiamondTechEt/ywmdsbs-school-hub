-- Check grades table structure to see what columns are required
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
