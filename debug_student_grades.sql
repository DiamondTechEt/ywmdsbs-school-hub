-- Debug script to check why students can't see their grades
-- Run this in Supabase SQL Editor

-- Check if the current user exists in students table
SELECT 'Checking current user in students table' as debug_step;
SELECT 
    user_id,
    student_id_code,
    first_name,
    last_name,
    is_active,
    current_class_id
FROM students 
WHERE user_id = 'YOUR_USER_ID_HERE'; -- Replace with actual user_id

-- Check if there are any grades for this student
SELECT 'Checking grades for student' as debug_step;
SELECT 
    g.id,
    g.student_id,
    g.score,
    g.percentage,
    g.letter_grade,
    g.is_published,
    g.created_at,
    a.title as assessment_title,
    a.is_published as assessment_published,
    cs.subject_name
FROM grades g
JOIN assessments a ON g.assessment_id = a.id
JOIN class_subject_assignments cs ON a.class_subject_assignment_id = cs.id
JOIN subjects s ON cs.subject_id = s.id
WHERE g.student_id = 'YOUR_STUDENT_ID_HERE' -- Replace with actual student_id
ORDER BY g.created_at DESC;

-- Check all published assessments
SELECT 'Checking all published assessments' as debug_step;
SELECT 
    a.id,
    a.title,
    a.is_published,
    a.assessment_date,
    COUNT(g.id) as grade_count
FROM assessments a
LEFT JOIN grades g ON a.id = g.assessment_id
WHERE a.is_published = true
GROUP BY a.id, a.title, a.is_published, a.assessment_date
ORDER BY a.assessment_date DESC;

-- Check user_roles to confirm student role
SELECT 'Checking user_roles for student' as debug_step;
SELECT 
    ur.user_id,
    ur.role,
    s.student_id_code,
    s.first_name,
    s.last_name
FROM user_roles ur
JOIN students s ON ur.user_id = s.user_id
WHERE ur.role = 'student';

-- Check if there are any RLS policies that might be blocking
SELECT 'Checking RLS policies on grades table' as debug_step;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'grades'
ORDER BY policyname;

-- Check if there are any RLS policies on assessments table
SELECT 'Checking RLS policies on assessments table' as debug_step;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'assessments'
ORDER BY policyname;
