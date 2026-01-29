-- Get academic year and semester data for grades
-- Run this in Supabase SQL Editor

-- Check if we have academic years and semesters
SELECT 'Checking academic years' as test;
SELECT id, name FROM academic_years ORDER BY created_at DESC LIMIT 3;

SELECT 'Checking semesters' as test;
SELECT id, name FROM semesters ORDER BY created_at DESC LIMIT 3;

-- Get the most recent academic year and semester
SELECT 'Getting most recent academic year and semester' as test;
SELECT 
    ay.id as academic_year_id,
    ay.name as academic_year_name,
    s.id as semester_id,
    s.name as semester_name
FROM (
    SELECT id, name, ROW_NUMBER() OVER (ORDER BY created_at DESC) as rn
    FROM academic_years
) ay
CROSS JOIN (
    SELECT id, name, ROW_NUMBER() OVER (ORDER BY created_at DESC) as rn
    FROM semesters
) s
WHERE ay.rn = 1 AND s.rn = 1;
