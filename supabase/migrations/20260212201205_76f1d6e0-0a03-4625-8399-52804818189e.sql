
-- Fix the assign_student_role trigger function
CREATE OR REPLACE FUNCTION public.assign_student_role()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, 'student')
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$;
