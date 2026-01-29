-- Quick test to disable RLS and test assessment creation
-- Run this in Supabase SQL Editor

-- Disable RLS temporarily
ALTER TABLE public.students DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_teachers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_subject_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_types DISABLE ROW LEVEL SECURITY;

-- Test if assessment_types table exists and has data
SELECT 'Testing assessment_types' as test;
SELECT COUNT(*) as count FROM assessment_types WHERE is_active = true;

-- Test if we can create a basic class_subject_assignment
SELECT 'Testing class_subject_assignments' as test;
SELECT COUNT(*) as count FROM class_subject_assignments;

-- Check if there are any teacher class assignments
SELECT 'Testing teacher assignments' as test;
SELECT 
    ct.*,
    c.name as class_name,
    t.first_name as teacher_first_name
FROM class_teachers ct
LEFT JOIN classes c ON ct.class_id = c.id
LEFT JOIN teachers t ON ct.teacher_id = t.id
WHERE ct.is_active = true
LIMIT 3;

-- If this works, the issue was with RLS policies
SELECT 'RLS disabled - test assessment creation now' as status;
