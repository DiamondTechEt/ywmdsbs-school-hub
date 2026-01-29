-- Fix infinite recursion by using auth.users instead of profiles for admin check
-- This avoids circular dependencies in RLS policies

-- Drop all existing policies that cause recursion
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can update profiles" ON public.profiles;

-- Drop teachers policies too and recreate
DROP POLICY IF EXISTS "Teachers can view own record" ON public.teachers;
DROP POLICY IF EXISTS "Super admins can view all teachers" ON public.teachers;
DROP POLICY IF EXISTS "Super admins can insert teachers" ON public.teachers;
DROP POLICY IF EXISTS "Super admins can update teachers" ON public.teachers;
DROP POLICY IF EXISTS "Super admins can delete teachers" ON public.teachers;

-- Create a function that checks admin status using auth.users (no circular dependency)
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Check if user's email contains 'admin' in auth.users table
  SELECT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND email LIKE '%admin%'
  );
$$;

-- Profiles policies using the new function (no recursion)
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Super admins can insert profiles" ON public.profiles FOR INSERT WITH CHECK (
  public.is_current_user_admin() OR auth.uid() = id -- Allow self-insert during signup
);

CREATE POLICY "Super admins can view all profiles" ON public.profiles FOR SELECT USING (
  public.is_current_user_admin()
);

CREATE POLICY "Super admins can update profiles" ON public.profiles FOR UPDATE USING (
  public.is_current_user_admin() OR auth.uid() = id
);

-- Teachers policies using the new function
CREATE POLICY "Teachers can view own record" ON public.teachers FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Super admins can insert teachers" ON public.teachers FOR INSERT WITH CHECK (
  public.is_current_user_admin()
);

CREATE POLICY "Super admins can view all teachers" ON public.teachers FOR SELECT USING (
  public.is_current_user_admin()
);

CREATE POLICY "Super admins can update teachers" ON public.teachers FOR UPDATE USING (
  public.is_current_user_admin()
);

CREATE POLICY "Super admins can delete teachers" ON public.teachers FOR DELETE USING (
  public.is_current_user_admin()
);

-- Test the function
-- SELECT public.is_current_user_admin();

-- Check if your current user has admin email
-- SELECT email FROM auth.users WHERE id = auth.uid();
