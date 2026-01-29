-- Ultra-simple student role fix (avoids enum issues)
-- Run this in Supabase SQL Editor

-- Step 1: Check current roles
SELECT 'Current user_roles by role' as info;
SELECT 
    role,
    COUNT(*) as count
FROM user_roles
GROUP BY role
ORDER BY role;

-- Step 2: Find students without student role (simple version)
SELECT 'Students that need student role assigned' as info;
SELECT 
    s.student_id_code,
    s.first_name,
    s.last_name,
    CASE 
        WHEN ur.user_id IS NULL THEN 'missing_role'
        ELSE ur.role
    END as current_status
FROM students s
LEFT JOIN user_roles ur ON s.user_id = ur.user_id
WHERE ur.user_id IS NULL OR ur.role != 'student'
ORDER BY s.last_name, s.first_name;

-- Step 3: Count how many need fixing
SELECT 'Count of students needing role assignment' as info;
SELECT 
    COUNT(*) as students_needing_role
FROM students s
LEFT JOIN user_roles ur ON s.user_id = ur.user_id
WHERE ur.user_id IS NULL OR ur.role != 'student';

-- Step 4: Fix the roles (the main fix)
SELECT 'Assigning student role to all students' as action;
INSERT INTO public.user_roles (user_id, role)
SELECT s.user_id, 'student'
FROM students s
LEFT JOIN user_roles ur ON s.user_id = ur.user_id
WHERE ur.user_id IS NULL OR ur.role != 'student'
ON CONFLICT (user_id) 
DO UPDATE SET 
    role = 'student';

-- Step 5: Verify the fix worked
SELECT 'Verification - All students should now have student role' as verification;
SELECT 
    'Total Students' as metric,
    COUNT(*) as count
FROM students
UNION ALL
SELECT 
    'Students with Student Role' as metric,
    COUNT(*) as count
FROM user_roles ur
JOIN students s ON ur.user_id = s.user_id
WHERE ur.role = 'student';

-- Step 6: Final summary
SELECT 'Final role distribution' as final_summary;
SELECT 
    role,
    COUNT(*) as user_count
FROM user_roles
GROUP BY role
ORDER BY role;

SELECT 'Student role assignment completed!' as status;
