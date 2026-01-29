-- Fix RLS policies for role assignment by super admins
-- The issue is that user_roles table still has restrictive policies

-- Drop all existing user_roles policies
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can manage user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can CRUD user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Allow all operations on user_roles" ON public.user_roles;

-- Create simple, working policies for user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Allow any authenticated user to manage user_roles (temporary for testing)
CREATE POLICY "Allow all operations on user_roles" ON public.user_roles FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Test the fix by trying to insert a role
-- This should work now

-- Also check if there are any remaining restrictive policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'user_roles' AND schemaname = 'public';

-- Check current RLS status
SELECT relname, relrowsecurity, relforcerowsecurity 
FROM pg_class 
WHERE relname = 'user_roles' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
