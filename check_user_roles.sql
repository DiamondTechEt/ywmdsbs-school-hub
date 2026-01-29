-- Check current state of user_roles table and fix role assignment

-- 1. Check current data in user_roles table
SELECT * FROM public.user_roles ORDER BY created_at DESC;

-- 2. Check current RLS policies on user_roles
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'user_roles' AND schemaname = 'public';

-- 3. Check RLS status
SELECT relname, relrowsecurity, relforcerowsecurity 
FROM pg_class 
WHERE relname = 'user_roles' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 4. Check your current user and role
SELECT auth.uid() as current_user_id;

-- 5. Check if your current user has super_admin role
SELECT * FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin';

-- 6. Test inserting a role (this will show if RLS is blocking)
-- Replace 'test-user-id' with an actual user ID from your auth.users table
INSERT INTO public.user_roles (user_id, role) 
VALUES ('test-user-id', 'teacher')
ON CONFLICT (user_id, role) DO NOTHING;

-- 7. If the above fails, disable RLS temporarily
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- 8. Test role assignment again
INSERT INTO public.user_roles (user_id, role) 
VALUES ('test-user-id', 'teacher')
ON CONFLICT (user_id, role) DO NOTHING;

-- 9. Re-enable RLS with permissive policies
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can manage user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can CRUD user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Allow all operations on user_roles" ON public.user_roles;

-- Create simple policies
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow all operations on user_roles" ON public.user_roles FOR ALL TO authenticated USING (true) WITH CHECK (true);
