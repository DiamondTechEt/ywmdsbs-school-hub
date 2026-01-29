-- Fix database functions and ensure proper parameter ordering
-- Drop and recreate the function with correct parameter order

DROP FUNCTION IF EXISTS public.create_student_with_user(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, DATE, INTEGER, TEXT, TEXT, UUID);

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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_student_with_user TO authenticated;

-- Also ensure RLS is properly enabled on all tables
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;
