-- Update names across all tables to maintain consistency
-- Run this in Supabase SQL Editor

-- First, let's see what tables might have name columns
SELECT 'Checking tables with name columns' as info;
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public'
AND (column_name LIKE '%name%' OR column_name LIKE '%first%' OR column_name LIKE '%last%')
AND table_name NOT IN ('user_names')
ORDER BY table_name, column_name;

-- Function to update names when user_names changes
CREATE OR REPLACE FUNCTION propagate_name_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Update students table when user_names changes
    UPDATE public.students 
    SET 
        first_name = NEW.first_name,
        last_name = NEW.last_name,
        middle_name = NEW.middle_name
    WHERE user_id = NEW.user_id;
    
    -- Update teachers table when user_names changes
    UPDATE public.teachers 
    SET 
        first_name = NEW.first_name,
        last_name = NEW.last_name,
        middle_name = NEW.middle_name
    WHERE user_id = NEW.user_id;
    
    -- Update auth.users metadata (if you have access)
    -- This would typically be done through Supabase Auth API
    -- UPDATE auth.users 
    -- SET raw_user_meta_data = jsonb_set(
    --     COALESCE(raw_user_meta_data, '{}'),
    --     '{full_name}',
    --     NEW.full_name
    -- )
    -- WHERE id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to propagate changes from user_names
DROP TRIGGER IF EXISTS propagate_name_changes_trigger ON public.user_names;
CREATE TRIGGER propagate_name_changes_trigger
    AFTER UPDATE OF first_name, last_name, middle_name ON public.user_names
    FOR EACH ROW
    EXECUTE FUNCTION propagate_name_changes();

-- Function to sync all existing names from students/teachers to user_names
CREATE OR REPLACE FUNCTION sync_all_names_to_user_names()
RETURNS TABLE(
    students_synced INTEGER,
    teachers_synced INTEGER,
    total_synced INTEGER
) AS $$
DECLARE
    student_count INTEGER;
    teacher_count INTEGER;
BEGIN
    -- Sync students to user_names
    INSERT INTO public.user_names (user_id, first_name, last_name, middle_name)
    SELECT user_id, first_name, last_name, middle_name
    FROM students
    WHERE user_id IS NOT NULL
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        middle_name = EXCLUDED.middle_name;
    
    GET DIAGNOSTICS student_count = ROW_COUNT;
    
    -- Sync teachers to user_names
    INSERT INTO public.user_names (user_id, first_name, last_name, middle_name)
    SELECT user_id, first_name, last_name, middle_name
    FROM teachers
    WHERE user_id IS NOT NULL
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        middle_name = EXCLUDED.middle_name;
    
    GET DIAGNOSTICS teacher_count = ROW_COUNT;
    
    RETURN QUERY SELECT 
        student_count, 
        teacher_count, 
        student_count + teacher_count;
END;
$$ LANGUAGE plpgsql;

-- Run the sync
SELECT * FROM sync_all_names_to_user_names();

-- Function to update all names from user_names to other tables
CREATE OR REPLACE FUNCTION update_names_from_user_names()
RETURNS TABLE(
    students_updated INTEGER,
    teachers_updated INTEGER,
    total_updated INTEGER
) AS $$
DECLARE
    student_count INTEGER;
    teacher_count INTEGER;
BEGIN
    -- Update students from user_names
    UPDATE public.students 
    SET 
        first_name = un.first_name,
        last_name = un.last_name,
        middle_name = un.middle_name
    FROM public.user_names un
    WHERE students.user_id = un.user_id;
    
    GET DIAGNOSTICS student_count = ROW_COUNT;
    
    -- Update teachers from user_names
    UPDATE public.teachers 
    SET 
        first_name = un.first_name,
        last_name = un.last_name,
        middle_name = un.middle_name
    FROM public.user_names un
    WHERE teachers.user_id = un.user_id;
    
    GET DIAGNOSTICS teacher_count = ROW_COUNT;
    
    RETURN QUERY SELECT 
        student_count, 
        teacher_count, 
        student_count + teacher_count;
END;
$$ LANGUAGE plpgsql;

-- Run the update
SELECT * FROM update_names_from_user_names();

-- Verify the results
SELECT 'Verification - Check name consistency' as verification;

SELECT 'user_names records' as table_name, COUNT(*) as count FROM public.user_names
UNION ALL
SELECT 'students records' as table_name, COUNT(*) as count FROM public.students
UNION ALL
SELECT 'teachers records' as table_name, COUNT(*) as count FROM public.teachers;

-- Sample data check
SELECT 'Sample name consistency check' as sample_check;

SELECT 'user_names' as source, un.first_name, un.last_name, un.full_name
FROM public.user_names un
LIMIT 3
UNION ALL
SELECT 'students' as source, s.first_name, s.last_name, s.first_name || ' ' || s.last_name as full_name
FROM public.students s
LIMIT 3
UNION ALL
SELECT 'teachers' as source, t.first_name, t.last_name, t.first_name || ' ' || t.last_name as full_name
FROM public.teachers t
LIMIT 3;

SELECT 'Name consistency system is now active!' as final_status;
SELECT 'Changes to user_names will propagate to students and teachers tables' as description;
SELECT 'All existing names have been synchronized' as sync_status;
