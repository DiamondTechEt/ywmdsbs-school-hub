-- Check assessments table structure
-- Run this in Supabase SQL Editor

SELECT 'Checking assessments table structure' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'assessments' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if we can insert a basic assessment
SELECT 'Testing basic assessment insert' as test;

-- First check if assessment_types has data
SELECT COUNT(*) as assessment_types_count FROM assessment_types WHERE is_active = true;

-- Check if we have teacher and class data
SELECT COUNT(*) as teacher_count FROM teachers;
SELECT COUNT(*) as class_count FROM classes;

-- Try to create a simple assessment to test the table structure
INSERT INTO assessments (
    title,
    assessment_type_id,
    class_id,
    teacher_id,
    max_score,
    weight,
    assessment_date,
    created_by_teacher_id,
    is_published,
    is_active,
    created_at,
    updated_at
) VALUES (
    'Test Assessment',
    (SELECT id FROM assessment_types WHERE is_active = true LIMIT 1),
    (SELECT id FROM classes LIMIT 1),
    (SELECT id FROM teachers LIMIT 1),
    100,
    10,
    CURRENT_DATE,
    (SELECT id FROM teachers LIMIT 1),
    false,
    true,
    NOW(),
    NOW()
);

-- Check if it was created
SELECT 'Assessment created successfully' as result, COUNT(*) as count FROM assessments WHERE title = 'Test Assessment';

-- Clean up the test assessment
DELETE FROM assessments WHERE title = 'Test Assessment';
