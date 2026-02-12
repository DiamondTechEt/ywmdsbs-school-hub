
-- Add unique constraint on user_roles (user_id) so ON CONFLICT works
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_unique UNIQUE (user_id);

-- Fix the trigger function
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
