-- Fix existing students who don't have user roles assigned
-- Run this in Supabase SQL Editor

-- Check for students without user roles
SELECT 'Checking students without user roles' as info;
SELECT 
    s.id,
    s.student_id_code,
    s.first_name,
    s.last_name,
    s.user_id,
    ur.role as current_role
FROM students s
LEFT JOIN user_roles ur ON s.user_id = ur.user_id
WHERE ur.user_id IS NULL OR ur.role != 'student';

-- Assign student role to all existing students who don't have it
SELECT 'Assigning student role to existing students' as action;
INSERT INTO public.user_roles (user_id, role)
SELECT s.user_id, 'student'
FROM students s
LEFT JOIN user_roles ur ON s.user_id = ur.user_id
WHERE ur.user_id IS NULL OR ur.role != 'student'
ON CONFLICT (user_id) DO UPDATE SET 
    role = 'student',
    updated_at = NOW();

-- Verify the fix
SELECT 'Verifying all students now have student role' as verification;
SELECT 
    s.id,
    s.student_id_code,
    s.first_name,
    s.last_name,
    ur.role as assigned_role
FROM students s
JOIN user_roles ur ON s.user_id = ur.user_id
WHERE ur.role = 'student'
ORDER BY s.last_name, s.first_name;

-- Count summary
SELECT 'Summary of user roles by role type' as summary;
SELECT 
    role,
    COUNT(*) as user_count
FROM user_roles
GROUP BY role
ORDER BY role;

SELECT 'Existing student roles fixed!' as status;
