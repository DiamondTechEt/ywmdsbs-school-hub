-- Fix RLS policies to allow users to read their own roles
-- The issue is that users can't read their own roles due to restrictive policies

-- Drop existing user_roles policies
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can manage user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can CRUD user_roles" ON public.user_roles;

-- Create simple, working policies for user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Super admins can CRUD user_roles" ON public.user_roles FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);

-- Also create a simple RPC function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id_to_check UUID DEFAULT NULL)
RETURNS TABLE(role TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ur.role 
  FROM public.user_roles ur 
  WHERE ur.user_id = COALESCE(user_id_to_check, auth.uid())
  LIMIT 1;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_role TO authenticated;

-- Test the function (run this in SQL editor with your actual user ID)
-- SELECT public.get_user_role('YOUR_USER_ID_HERE');
