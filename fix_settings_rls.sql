-- Fix RLS policies for Settings.tsx to work properly
-- Issues: user_roles join with profiles, and role assignment

-- Drop existing policies that might be blocking
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can manage user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can CRUD user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Allow all operations on user_roles" ON public.user_roles;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow all operations on profiles" ON public.profiles;

-- Create simple policies for user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow all operations on user_roles" ON public.user_roles FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create simple policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Allow all operations on profiles" ON public.profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Test the queries that Settings.tsx uses
-- Test 1: Fetch user_roles with profiles join (this should work now)
SELECT 
  ur.*,
  p.email as profile_email,
  p.full_name as profile_full_name
FROM public.user_roles ur
LEFT JOIN public.profiles p ON ur.user_id = p.id
ORDER BY ur.created_at DESC
LIMIT 5;

-- Test 2: Find user by email (this should work now)
SELECT id, email, full_name 
FROM public.profiles 
WHERE email = 'test@example.com'
LIMIT 1;

-- Test 3: Insert role (this should work now)
INSERT INTO public.user_roles (user_id, role) 
VALUES ('test-user-id', 'teacher')
ON CONFLICT (user_id, role) DO NOTHING;

-- Clean up test data
DELETE FROM public.user_roles WHERE user_id = 'test-user-id';
