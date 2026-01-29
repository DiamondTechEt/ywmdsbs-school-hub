-- Debug script to check student dashboard data
-- Run this in Supabase SQL Editor

-- Step 1: Check if the current user exists and has student role
SELECT 'Step 1: Check user authentication and role' as info;
SELECT 
    u.id as user_id,
    u.email,
    u.created_at,
    ur.role as user_role,
    s.id as student_id,
    s.student_id_code,
    s.first_name,
    s.last_name,
    s.is_active
FROM auth.users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN students s ON u.id = s.user_id
WHERE u.id = '790609b9-965a-4b80-bc00-f4a559d8132a';

-- Step 2: Check all grades for this student
SELECT 'Step 2: All grades for this student' as info;
SELECT 
    g.id,
    g.student_id,
    g.score,
    g.percentage,
    g.letter_grade,
    g.is_published,
    g.created_at,
    g.assessment_id,
    a.title as assessment_title,
    a.is_published as assessment_published,
    a.assessment_date,
    cs.subject_id,
    sub.name as subject_name,
    sub.code as subject_code,
    sub.credit as subject_credit
FROM grades g
JOIN assessments a ON g.assessment_id = a.id
LEFT JOIN class_subject_assignments cs ON a.class_subject_assignment_id = cs.id
LEFT JOIN subjects sub ON cs.subject_id = sub.id
WHERE g.student_id = (SELECT id FROM students WHERE user_id = '790609b9-965a-4b80-bc00-f4a559d8132a')
ORDER BY g.created_at DESC;

-- Step 3: Check if there are any published assessments
SELECT 'Step 3: Published assessments count' as info;
SELECT 
    COUNT(*) as published_assessments
FROM assessments a
WHERE a.is_published = true;

-- Step 4: Check if there are any grades at all
SELECT 'Step 4: Total grades count' as info;
SELECT 
    COUNT(*) as total_grades
FROM grades;

-- Step 5: Check if student has any grades (published or unpublished)
SELECT 'Step 5: Student grades count' as info;
SELECT 
    COUNT(*) as student_grades
FROM grades g
WHERE g.student_id = (SELECT id FROM students WHERE user_id = '790609b9-965a-4b80-bc00-f4a559d8132a');

-- Step 6: Check if there are any grades with subject information
SELECT 'Step 6: Grades with subject info' as info;
SELECT 
    COUNT(*) as grades_with_subjects
FROM grades g
JOIN assessments a ON g.assessment_id = a.id
JOIN class_subject_assignments cs ON a.class_subject_assignment_id = cs.id
JOIN subjects s ON cs.subject_id = s.id
WHERE g.student_id = (SELECT id FROM students WHERE user_id = '790609b9-965a-4b80-bc00-f4a559d8132a');
