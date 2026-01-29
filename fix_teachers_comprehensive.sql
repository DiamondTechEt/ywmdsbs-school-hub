-- Comprehensive fix for teachers RLS policy
-- This addresses potential issues with has_role function and policy ordering

-- First, check if the has_role function exists and works
-- Run this debug query first:
SELECT auth.uid() as current_user_id;

-- Check if you have any role assigned
SELECT * FROM public.user_roles WHERE user_id = auth.uid();

-- Check if has_role function works
SELECT public.has_role(auth.uid(), 'super_admin') as is_super_admin;

-- Drop all existing teachers policies
DROP POLICY IF EXISTS "Teachers can view own record" ON public.teachers;
DROP POLICY IF EXISTS "Super admins can view all teachers" ON public.teachers;
DROP POLICY IF EXISTS "Super admins can manage teachers" ON public.teachers;
DROP POLICY IF EXISTS "Super admins can insert teachers" ON public.teachers;

-- Create policies with direct role checking (bypassing has_role function)
CREATE POLICY "Teachers can view own record" ON public.teachers FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Super admins can view all teachers" ON public.teachers FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);

-- Create separate policies for each operation
CREATE POLICY "Super admins can insert teachers" ON public.teachers FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);

CREATE POLICY "Super admins can update teachers" ON public.teachers FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);

CREATE POLICY "Super admins can delete teachers" ON public.teachers FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);

-- If you don't have super_admin role, assign it to yourself:
-- INSERT INTO public.user_roles (user_id, role) 
-- VALUES (auth.uid(), 'super_admin')
-- ON CONFLICT (user_id, role) DO NOTHING;
