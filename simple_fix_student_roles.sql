-- Simple fix for existing student roles (no updated_at column)
-- Run this in Supabase SQL Editor

-- Check current state
SELECT 'Current state of user_roles' as info;
SELECT 
    role,
    COUNT(*) as count
FROM user_roles
GROUP BY role
ORDER BY role;

-- Find students without proper student roles
SELECT 'Students without student role' as info;
SELECT 
    s.id,
    s.student_id_code,
    s.first_name,
    s.last_name,
    s.user_id,
    COALESCE(ur.role, 'none') as current_role
FROM students s
LEFT JOIN user_roles ur ON s.user_id = ur.user_id
WHERE ur.user_id IS NULL OR ur.role != 'student'
ORDER BY s.last_name, s.first_name;

-- Fix all students to have student role
SELECT 'Assigning student role to all students' as action;
INSERT INTO public.user_roles (user_id, role)
SELECT s.user_id, 'student'
FROM students s
LEFT JOIN user_roles ur ON s.user_id = ur.user_id
WHERE ur.user_id IS NULL OR ur.role != 'student'
ON CONFLICT (user_id) 
DO UPDATE SET 
    role = 'student';

-- Verify the fix
SELECT 'Verification - All students should now have student role' as verification;
SELECT 
    s.student_id_code,
    s.first_name,
    s.last_name,
    ur.role as assigned_role
FROM students s
JOIN user_roles ur ON s.user_id = ur.user_id
WHERE ur.role = 'student'
ORDER BY s.last_name, s.first_name
LIMIT 10;

-- Final count
SELECT 'Final count by role' as summary;
SELECT 
    role,
    COUNT(*) as count
FROM user_roles
GROUP BY role
ORDER BY role;

SELECT 'Student roles fixed successfully!' as status;
