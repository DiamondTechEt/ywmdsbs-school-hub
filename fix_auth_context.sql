-- Fix for auth.uid() returning null
-- The issue is that you're not authenticated in the SQL editor context

-- Step 1: Check if auth.uid() works
SELECT auth.uid() as current_auth_uid;

-- Step 2: If null, you need to manually specify your user ID
-- Get your user ID from your app or browser localStorage:
-- In browser console: localStorage.getItem('supabase.auth.token')
-- Or from your React app: supabase.auth.getUser()

-- Step 3: Replace YOUR_ACTUAL_USER_ID below with your real UUID
-- Example: INSERT INTO public.user_roles (user_id, role) VALUES ('12345678-1234-1234-1234-123456789012', 'super_admin');

-- For now, let's create a temporary bypass policy that doesn't rely on auth.uid()
DROP POLICY IF EXISTS "Temporary bypass for testing" ON public.teachers;
CREATE POLICY "Temporary bypass for testing" ON public.teachers FOR ALL USING (true) WITH CHECK (true);

-- Test insert without role checking
INSERT INTO public.teachers (user_id, teacher_code, first_name, last_name, gender, hire_date)
VALUES ('91e25017-6440-4ea8-9393-2d7c9f0fa5c9', 'TEST004', 'Test', 'Teacher', 'other', CURRENT_DATE);

-- If this works, the issue is definitely auth context in SQL editor
-- You'll need to get your actual user ID and use it in the policies
