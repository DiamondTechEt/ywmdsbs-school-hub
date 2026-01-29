-- Simple name synchronization without UNION issues
-- Run this in Supabase SQL Editor

-- Step 1: Create user_names table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_names (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    middle_name TEXT,
    full_name TEXT GENERATED ALWAYS AS (
        CASE 
            WHEN middle_name IS NOT NULL AND middle_name != '' 
            THEN first_name || ' ' || middle_name || ' ' || last_name
            ELSE first_name || ' ' || last_name
        END
    ) STORED,
    display_name TEXT GENERATED ALWAYS AS (
        first_name || ' ' || last_name
    ) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Sync existing students to user_names
SELECT 'Syncing students to user_names...' as step;
INSERT INTO public.user_names (user_id, first_name, last_name, middle_name)
SELECT user_id, first_name, last_name, middle_name
FROM students
WHERE user_id IS NOT NULL
ON CONFLICT (user_id) 
DO UPDATE SET 
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    middle_name = EXCLUDED.middle_name;

-- Step 3: Sync existing teachers to user_names
SELECT 'Syncing teachers to user_names...' as step;
INSERT INTO public.user_names (user_id, first_name, last_name, middle_name)
SELECT user_id, first_name, last_name, middle_name
FROM teachers
WHERE user_id IS NOT NULL
ON CONFLICT (user_id) 
DO UPDATE SET 
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    middle_name = EXCLUDED.middle_name;

-- Step 4: Create trigger to sync student name changes
CREATE OR REPLACE FUNCTION sync_student_names()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_names (user_id, first_name, last_name, middle_name)
    VALUES (NEW.user_id, NEW.first_name, NEW.last_name, NEW.middle_name)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        first_name = NEW.first_name,
        last_name = NEW.last_name,
        middle_name = NEW.middle_name;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_student_names_trigger ON public.students;
CREATE TRIGGER sync_student_names_trigger
    AFTER INSERT OR UPDATE OF first_name, last_name, middle_name ON public.students
    FOR EACH ROW
    EXECUTE FUNCTION sync_student_names();

-- Step 5: Create trigger to sync teacher name changes
CREATE OR REPLACE FUNCTION sync_teacher_names()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_names (user_id, first_name, last_name, middle_name)
    VALUES (NEW.user_id, NEW.first_name, NEW.last_name, NEW.middle_name)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        first_name = NEW.first_name,
        last_name = NEW.last_name,
        middle_name = NEW.middle_name;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_teacher_names_trigger ON public.teachers;
CREATE TRIGGER sync_teacher_names_trigger
    AFTER INSERT OR UPDATE OF first_name, last_name, middle_name ON public.teachers
    FOR EACH ROW
    EXECUTE FUNCTION sync_teacher_names();

-- Step 6: Verification - Check counts
SELECT 'Verification - Record counts' as verification;
SELECT 'user_names' as table_name, COUNT(*) as count FROM public.user_names;
SELECT 'students' as table_name, COUNT(*) as count FROM public.students;
SELECT 'teachers' as table_name, COUNT(*) as count FROM public.teachers;

-- Step 7: Sample data check
SELECT 'Sample user_names data' as sample;
SELECT user_id, first_name, last_name, full_name FROM public.user_names LIMIT 3;

SELECT 'Sample students data' as sample;
SELECT user_id, first_name, last_name FROM public.students LIMIT 3;

SELECT 'Sample teachers data' as sample;
SELECT user_id, first_name, last_name FROM public.teachers LIMIT 3;

SELECT 'Name synchronization completed successfully!' as status;
