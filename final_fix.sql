-- Final fix for teachers RLS issue
-- Based on diagnostics, RLS is enabled and blocking inserts

-- Step 1: Get your user ID (run this first)
SELECT auth.uid() as your_user_id;

-- Step 2: Check if you actually have super_admin role
SELECT * FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin';

-- Step 3: If no role found, assign super_admin role to your user
INSERT INTO public.user_roles (user_id, role) 
VALUES (auth.uid(), 'super_admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Step 4: Drop all existing teachers policies
DROP POLICY IF EXISTS "Teachers can view own record" ON public.teachers;
DROP POLICY IF EXISTS "Super admins can view all teachers" ON public.teachers;
DROP POLICY IF EXISTS "Super admins can manage teachers" ON public.teachers;
DROP POLICY IF EXISTS "Emergency bypass" ON public.teachers;
DROP POLICY IF EXISTS "Current user bypass" ON public.teachers;

-- Step 5: Create simple, working policies
CREATE POLICY "Allow all operations for super admins" ON public.teachers 
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin')
);

CREATE POLICY "Allow teachers to view own record" ON public.teachers 
FOR SELECT USING (user_id = auth.uid());

-- Step 6: Test the fix
INSERT INTO public.teachers (user_id, teacher_code, first_name, last_name, gender, hire_date)
VALUES (auth.uid(), 'TEST003', 'Test', 'Teacher', 'other', CURRENT_DATE);

-- Step 7: Verify the insert worked
SELECT * FROM public.teachers WHERE teacher_code = 'TEST003';
