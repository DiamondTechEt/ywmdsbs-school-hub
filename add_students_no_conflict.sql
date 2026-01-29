-- Add all current students to user_roles table with student role (no conflict clause)
-- Run this in Supabase SQL Editor

-- First, see how many students we have
SELECT 'Total students in students table' as info;
SELECT COUNT(*) as total_students FROM students;

-- Remove any existing student roles first (to avoid duplicates)
DELETE FROM public.user_roles 
WHERE user_id IN (SELECT user_id FROM students);

-- Now add all students to user_roles table with 'student' role
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'student'
FROM students;

-- Verify the result
SELECT 'Verification - students added to user_roles' as info;
SELECT 
    'Total Students' as metric,
    COUNT(*) as count
FROM students
UNION ALL
SELECT 
    'Students with Student Role' as metric,
    COUNT(*) as count
FROM user_roles 
WHERE role = 'student';

-- Show final user_roles distribution
SELECT 'Final user_roles distribution' as final;
SELECT 
    role,
    COUNT(*) as user_count
FROM user_roles
GROUP BY role
ORDER BY role;

SELECT 'All students have been added to user_roles with student role!' as success;
