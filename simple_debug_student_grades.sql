-- Simple debug script to check student grades without complex joins
-- Run this in Supabase SQL Editor

-- Step 1: Check if the student exists
SELECT 'Step 1: Checking student record' as info;
SELECT 
    user_id,
    student_id_code,
    first_name,
    last_name,
    is_active
FROM students 
WHERE user_id = '790609b9-965a-4b80-bc00-f4a559d8132a';

-- Step 2: Check if there are any grades for this student
SELECT 'Step 2: Checking grades for student' as info;
SELECT 
    g.id,
    g.student_id,
    g.score,
    g.percentage,
    g.letter_grade,
    g.is_published,
    g.created_at,
    a.title as assessment_title,
    a.is_published as assessment_published
FROM grades g
JOIN assessments a ON g.assessment_id = a.id
WHERE g.student_id = (SELECT id FROM students WHERE user_id = '790609b9-965a-4b80-bc00-f4a559d8132a')
ORDER BY g.created_at DESC;

-- Step 3: Check if there are any published assessments at all
SELECT 'Step 3: Checking published assessments' as info;
SELECT 
    COUNT(*) as published_assessments
FROM assessments 
WHERE is_published = true;

-- Step 4: Check total grades (published and unpublished)
SELECT 'Step 4: Checking all grades' as info;
SELECT 
    COUNT(*) as total_grades,
    COUNT(*) FILTER (WHERE is_published = true) as published_grades
FROM grades;

-- Step 5: Check user_roles
SELECT 'Step 5: Checking user_roles' as info;
SELECT 
    ur.user_id,
    ur.role,
    s.student_id_code,
    s.first_name,
    s.last_name
FROM user_roles ur
JOIN students s ON ur.user_id = s.user_id
WHERE ur.role = 'student';
