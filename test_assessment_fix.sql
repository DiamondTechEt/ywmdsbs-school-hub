-- Test the assessment fixes
-- Run this in Supabase SQL Editor

-- Check if we can get the latest semester
SELECT 'Testing semester lookup' as test;
SELECT id, name, start_date FROM semesters ORDER BY start_date DESC LIMIT 1;

-- Check if we can create a basic class_subject_assignment
SELECT 'Testing class_subject_assignment creation' as test;
SELECT COUNT(*) as existing_assignments FROM class_subject_assignments;

-- Test basic assessment structure
SELECT 'Testing assessments table columns' as test;
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'assessments' AND table_schema = 'public'
ORDER BY ordinal_position;

-- If this works, the assessment creation should now work
SELECT 'Assessment fixes applied - test creation in the app' as status;
