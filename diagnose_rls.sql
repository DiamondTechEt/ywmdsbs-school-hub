-- Diagnostic script to identify RLS issues
-- Run each query step by step to identify the problem

-- 1. Check current user
SELECT auth.uid() as current_user_id;

-- 2. Check if user_roles table has any data for current user
SELECT * FROM public.user_roles WHERE user_id = auth.uid();

-- 3. Check if has_role function exists and works
SELECT routine_name, routine_type FROM information_schema.routines 
WHERE routine_name = 'has_role' AND routine_schema = 'public';

-- 4. Test has_role function directly
SELECT public.has_role(auth.uid(), 'super_admin') as has_super_admin_role;

-- 5. Check all RLS policies on teachers table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'teachers' AND schemaname = 'public';

-- 6. Test direct query to user_roles (bypassing has_role)
SELECT EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = auth.uid() AND role = 'super_admin'
) as direct_role_check;

-- 7. Check if RLS is enabled on teachers table
SELECT relname, relrowsecurity, relforcerowsecurity 
FROM pg_class 
WHERE relname = 'teachers' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 8. Try a simple insert with detailed error
DO $$
BEGIN
  INSERT INTO public.teachers (user_id, teacher_code, first_name, last_name, gender, hire_date)
  VALUES (auth.uid(), 'TEST001', 'Test', 'Teacher', 'other', CURRENT_DATE);
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error: %', SQLERRM;
  RAISE NOTICE 'Detail: %', SQLSTATE;
END $$;
