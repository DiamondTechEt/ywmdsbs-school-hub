-- Check detailed student grades information
-- Run this in Supabase SQL Editor

-- Step 1: Get the student ID for the user
SELECT 'Step 1: Get student ID for user' as info;
SELECT 
    id as student_id,
    user_id,
    student_id_code,
    first_name,
    last_name,
    is_active
FROM students 
WHERE user_id = '790609b9-965a-4b80-bc00-f4a559d8132a';

-- Step 2: Check all grades for this student (published and unpublished)
SELECT 'Step 2: All grades for student' as info;
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
    a.is_published as assessment_published
FROM grades g
JOIN assessments a ON g.assessment_id = a.id
WHERE g.student_id = (SELECT id FROM students WHERE user_id = '790609b9-965a-4b80-bc00-f4a559d8132a')
ORDER BY g.created_at DESC;

-- Step 3: Check only published grades (what the frontend queries)
SELECT 'Step 3: Published grades only (frontend query)' as info;
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
    a.is_published as assessment_published
FROM grades g
JOIN assessments a ON g.assessment_id = a.id
WHERE g.student_id = (SELECT id FROM students WHERE user_id = '790609b9-965a-4b80-bc00-f4a559d8132a')
AND g.is_published = true
ORDER BY g.created_at DESC;

-- Step 4: Check if assessments are published
SELECT 'Step 4: Check assessment publish status' as info;
SELECT 
    a.id,
    a.title,
    a.is_published,
    a.assessment_date,
    COUNT(g.id) as grade_count
FROM assessments a
LEFT JOIN grades g ON a.id = g.assessment_id
WHERE a.id IN (
    SELECT DISTINCT assessment_id 
    FROM grades 
    WHERE student_id = (SELECT id FROM students WHERE user_id = '790609b9-965a-4b80-bc00-f4a559d8132a')
)
GROUP BY a.id, a.title, a.is_published, a.assessment_date
ORDER BY a.assessment_date DESC;
