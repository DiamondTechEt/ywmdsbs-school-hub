-- Quick fix for teacher RLS issues
-- Run this in Supabase SQL Editor to temporarily disable RLS for testing

-- Disable RLS temporarily to test basic functionality
ALTER TABLE public.students DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_teachers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments DISABLE ROW LEVEL SECURITY;

-- Test basic queries
SELECT 'Testing students table' as test;
SELECT COUNT(*) as student_count FROM students;

SELECT 'Testing classes table' as test;
SELECT COUNT(*) as class_count FROM classes;

SELECT 'Testing class_teachers table' as test;
SELECT COUNT(*) as assignment_count FROM class_teachers;

-- Test the specific query used in TeacherStudentManagement
SELECT 'Testing teacher student query' as test;
SELECT 
    s.*,
    c.name as class_name,
    c.grade_level
FROM students s
LEFT JOIN classes c ON s.current_class_id = c.id
WHERE s.current_class_id IS NOT NULL
ORDER BY s.last_name ASC
LIMIT 5;

-- Test teacher class assignment query
SELECT 'Testing teacher class query' as test;
SELECT 
    ct.*,
    cl.name as class_name,
    cl.grade_level,
    sub.name as subject_name
FROM class_teachers ct
LEFT JOIN classes cl ON ct.class_id = cl.id
LEFT JOIN subjects sub ON ct.subject_id = sub.id
WHERE ct.is_active = true
LIMIT 5;

-- If these queries work, the issue was with RLS policies
SELECT 'Basic queries work - issue was with RLS policies' as status;
