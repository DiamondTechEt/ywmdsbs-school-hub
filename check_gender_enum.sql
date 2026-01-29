-- Check the gender_type enum values
-- Run this in Supabase SQL Editor

SELECT 'Checking gender_type enum values' as info;
SELECT unnest(enum_range(NULL::gender_type)) as gender_values;

-- Also check what values are currently in the students table
SELECT 'Checking existing gender values in students table' as info;
SELECT DISTINCT gender FROM students WHERE gender IS NOT NULL;
