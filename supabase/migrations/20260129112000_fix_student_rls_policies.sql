-- Fix RLS policies for student creation
-- Drop existing policies that might be causing issues
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own user role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert own user role" ON public.user_roles;

-- Create proper RLS policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Create proper RLS policies for user_roles
CREATE POLICY "Users can view own user role" ON public.user_roles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own user role" ON public.user_roles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create proper RLS policies for students
DROP POLICY IF EXISTS "Students can view own data" ON public.students;
DROP POLICY IF EXISTS "Teachers can view student data" ON public.students;
DROP POLICY IF EXISTS "Super admins can manage students" ON public.students;

CREATE POLICY "Students can view own data" ON public.students
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Teachers can view student data" ON public.students
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.class_teachers ct
            JOIN public.enrollments e ON e.class_id = ct.class_id
            WHERE ct.teacher_id = (
                SELECT id FROM public.teachers WHERE user_id = auth.uid()
            )
            AND e.student_id = students.id
            AND ct.is_active = true
            AND e.is_active = true
        )
    );

CREATE POLICY "Super admins can manage students" ON public.students
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin'
        )
    );

-- Create function to handle student creation properly
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
