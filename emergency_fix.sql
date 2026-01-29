-- Emergency fix: Temporarily disable RLS for teachers table or create bypass policy
-- ONLY USE THIS FOR TESTING - NOT RECOMMENDED FOR PRODUCTION

-- Option 1: Completely disable RLS (QUICK TEST ONLY)
-- ALTER TABLE public.teachers DISABLE ROW LEVEL SECURITY;

-- Option 2: Create a bypass policy that allows any authenticated user (SAFER)
DROP POLICY IF EXISTS "Emergency bypass" ON public.teachers;
CREATE POLICY "Emergency bypass" ON public.teachers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Option 3: Create a policy that specifically allows the current user (REPLACE YOUR_USER_ID)
-- First get your user ID: SELECT auth.uid();
-- Then run:
-- DROP POLICY IF EXISTS "Current user bypass" ON public.teachers;
-- CREATE POLICY "Current user bypass" ON public.teachers FOR ALL USING (auth.uid() = 'YOUR_USER_ID_HERE') WITH CHECK (auth.uid() = 'YOUR_USER_ID_HERE');

-- Test insert after applying one of the above options:
INSERT INTO public.teachers (user_id, teacher_code, first_name, last_name, gender, hire_date)
VALUES (auth.uid(), 'TEST002', 'Test', 'Teacher', 'other', CURRENT_DATE);

-- If this works, the issue is definitely with the role-based policies
-- You can then remove the emergency policy and fix the proper ones
