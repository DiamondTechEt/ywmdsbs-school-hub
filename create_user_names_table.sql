-- Create a centralized user_names table to maintain name consistency
-- Run this in Supabase SQL Editor

-- Create user_names table to store canonical user information
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

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_names_user_id ON public.user_names(user_id);

-- Create trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_user_names_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_names_updated_at_trigger
    BEFORE UPDATE ON public.user_names
    FOR EACH ROW
    EXECUTE FUNCTION update_user_names_updated_at();

-- Create function to sync names from students table to user_names
CREATE OR REPLACE FUNCTION sync_student_names()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert or update user_names when student is created or updated
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

-- Create trigger for student inserts
DROP TRIGGER IF EXISTS sync_student_names_insert_trigger ON public.students;
CREATE TRIGGER sync_student_names_insert_trigger
    AFTER INSERT ON public.students
    FOR EACH ROW
    EXECUTE FUNCTION sync_student_names();

-- Create trigger for student updates
DROP TRIGGER IF EXISTS sync_student_names_update_trigger ON public.students;
CREATE TRIGGER sync_student_names_update_trigger
    AFTER UPDATE OF first_name, last_name, middle_name ON public.students
    FOR EACH ROW
    EXECUTE FUNCTION sync_student_names();

-- Create function to sync names from teachers table to user_names
CREATE OR REPLACE FUNCTION sync_teacher_names()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert or update user_names when teacher is created or updated
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

-- Create triggers for teachers
DROP TRIGGER IF EXISTS sync_teacher_names_insert_trigger ON public.teachers;
CREATE TRIGGER sync_teacher_names_insert_trigger
    AFTER INSERT ON public.teachers
    FOR EACH ROW
    EXECUTE FUNCTION sync_teacher_names();

DROP TRIGGER IF EXISTS sync_teacher_names_update_trigger ON public.teachers;
CREATE TRIGGER sync_teacher_names_update_trigger
    AFTER UPDATE OF first_name, last_name, middle_name ON public.teachers
    FOR EACH ROW
    EXECUTE FUNCTION sync_teacher_names();

-- Function to populate user_names with existing data
CREATE OR REPLACE FUNCTION populate_user_names()
RETURNS TABLE(
    students_synced INTEGER,
    teachers_synced INTEGER,
    total_synced INTEGER
) AS $$
DECLARE
    student_count INTEGER;
    teacher_count INTEGER;
BEGIN
    -- Sync existing students
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
    
    -- Sync existing teachers
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

-- Populate with existing data
SELECT * FROM populate_user_names();

-- Verify the results
SELECT 'User names table populated' as status;
SELECT 
    'Total user_names records' as metric,
    COUNT(*) as count
FROM public.user_names;

SELECT 'Sample user_names data' as info;
SELECT 
    user_id,
    first_name,
    last_name,
    middle_name,
    full_name,
    display_name
FROM public.user_names
LIMIT 5;

SELECT 'User names table and triggers created successfully!' as final_status;
