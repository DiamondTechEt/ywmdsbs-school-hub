-- Emergency database fix for 500 errors
-- Run this in Supabase SQL Editor

-- First, disable RLS temporarily to allow basic queries to work
ALTER TABLE public.students DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_years DISABLE ROW LEVEL SECURITY;

-- Drop the problematic function
DROP FUNCTION IF EXISTS public.create_student_with_user(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, DATE, INTEGER, TEXT, TEXT, UUID);

-- Recreate with correct parameter ordering
CREATE OR REPLACE FUNCTION public.create_student_with_user(
    p_email TEXT,
    p_password TEXT,
    p_student_id_code TEXT,
    p_first_name TEXT,
    p_last_name TEXT,
    p_gender TEXT,
    p_date_of_birth DATE,
    p_enrollment_year INTEGER,
    p_middle_name TEXT DEFAULT NULL,
    p_boarding_status TEXT DEFAULT 'day',
    p_current_class_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_student_id UUID;
BEGIN
    -- Create auth user
    INSERT INTO auth.users (email, email_confirmed_at)
    VALUES (p_email, NOW())
    RETURNING id INTO v_user_id;
    
    -- Set password for the user
    UPDATE auth.users 
    SET encrypted_password = crypt(p_password, gen_salt('bf'))
    WHERE id = v_user_id;
    
    -- Create profile
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (v_user_id, p_email, p_first_name || ' ' || p_last_name);
    
    -- Assign student role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, 'student');
    
    -- Create student record
    INSERT INTO public.students (
        user_id,
        student_id_code,
        first_name,
        middle_name,
        last_name,
        gender,
        date_of_birth,
        enrollment_year,
        boarding_status,
        current_class_id,
        is_active
    ) VALUES (
        v_user_id,
        p_student_id_code,
        p_first_name,
        p_middle_name,
        p_last_name,
        p_gender,
        p_date_of_birth,
        p_enrollment_year,
        p_boarding_status,
        p_current_class_id,
        true
    )
    RETURNING id INTO v_student_id;
    
    RETURN v_student_id;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.create_student_with_user TO authenticated;

-- Test basic queries
SELECT 'Testing students table' as test;
SELECT COUNT(*) as student_count FROM students;

SELECT 'Testing classes table' as test;
SELECT COUNT(*) as class_count FROM classes;

SELECT 'Testing enrollments table' as test;
SELECT COUNT(*) as enrollment_count FROM enrollments;

-- Test the problematic join query
SELECT 'Testing join query' as test;
SELECT 
    s.id,
    s.first_name,
    s.last_name,
    c.name as class_name,
    c.grade_level
FROM students s
LEFT JOIN classes c ON s.current_class_id = c.id
ORDER BY s.last_name ASC
LIMIT 3;

-- Re-enable RLS with simple policies
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;

-- Create simple RLS policies
CREATE POLICY "Enable all for authenticated" ON public.students FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated" ON public.classes FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated" ON public.enrollments FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated" ON public.academic_years FOR ALL USING (auth.role() = 'authenticated');

-- Final test
SELECT 'Database fixes applied successfully' as status;
