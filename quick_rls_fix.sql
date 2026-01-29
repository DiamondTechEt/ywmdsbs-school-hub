-- Quick fix for 403/406 errors on user_roles and teachers tables
-- The issue is that the RLS policies are too restrictive

-- Fix user_roles table first
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can manage roles" ON public.user_roles;

-- Create simple user_roles policies
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Super admins can manage user_roles" ON public.user_roles FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);

-- Fix teachers table
DROP POLICY IF EXISTS "Teachers can view own record" ON public.teachers;
DROP POLICY IF EXISTS "Super admins can view all teachers" ON public.teachers;
DROP POLICY IF EXISTS "Super admins can manage teachers" ON public.teachers;
DROP POLICY IF EXISTS "Super admins can CRUD teachers" ON public.teachers;

-- Create simple teachers policies
CREATE POLICY "Teachers can view own record" ON public.teachers FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Super admins can CRUD teachers" ON public.teachers FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);

-- Also fix students table for consistency
DROP POLICY IF EXISTS "Students can view own record" ON public.students;
DROP POLICY IF EXISTS "Teachers can view students in their classes" ON public.students;
DROP POLICY IF EXISTS "Super admins can view all students" ON public.students;
DROP POLICY IF EXISTS "Super admins can manage students" ON public.students;
DROP POLICY IF EXISTS "Super admins can CRUD students" ON public.students;

CREATE POLICY "Students can view own record" ON public.students FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Super admins can CRUD students" ON public.students FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);

-- Test query to check if current user has super_admin role
-- Run this in your app's context, not SQL editor:
-- SELECT * FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin';
