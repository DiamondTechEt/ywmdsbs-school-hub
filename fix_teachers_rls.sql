-- Fix RLS policy for teachers table to allow super_admins to create teachers
-- The issue might be that the policy is not correctly recognizing the super_admin role

-- Drop and recreate the teachers policies with clearer logic
DROP POLICY IF EXISTS "Teachers can view own record" ON public.teachers;
DROP POLICY IF EXISTS "Super admins can view all teachers" ON public.teachers;
DROP POLICY IF EXISTS "Super admins can manage teachers" ON public.teachers;

-- Recreate policies with more explicit checks
CREATE POLICY "Teachers can view own record" ON public.teachers FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Super admins can view all teachers" ON public.teachers FOR SELECT USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admins can manage teachers" ON public.teachers FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- Also add a broader policy for INSERT operations specifically
CREATE POLICY "Super admins can insert teachers" ON public.teachers 
FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Debug query to check your current role (run this in Supabase SQL editor)
-- SELECT auth.uid(), public.has_role(auth.uid(), 'super_admin') as is_super_admin;
