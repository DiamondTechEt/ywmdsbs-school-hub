-- Minimal fix - disable RLS completely to isolate the issue
-- Run this in Supabase SQL Editor

-- Disable RLS on all tables
ALTER TABLE public.students DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_years DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- Drop all RLS policies that might be causing issues
DROP POLICY IF EXISTS "Enable all for authenticated" ON public.students;
DROP POLICY IF EXISTS "Enable all for authenticated" ON public.classes;
DROP POLICY IF EXISTS "Enable all for authenticated" ON public.enrollments;
DROP POLICY IF EXISTS "Enable all for authenticated" ON public.academic_years;
DROP POLICY IF EXISTS "Enable all for authenticated" ON public.profiles;
DROP POLICY IF EXISTS "Enable all for authenticated" ON public.user_roles;

-- Test the queries that are failing
SELECT 'Testing students query without RLS' as test;
SELECT 
    s.*,
    c.name as class_name,
    c.grade_level
FROM students s
LEFT JOIN classes c ON s.current_class_id = c.id
ORDER BY s.last_name ASC
LIMIT 3;

SELECT 'Testing enrollments query without RLS' as test;
SELECT 
    e.*,
    st.first_name,
    st.last_name,
    c.name as class_name,
    ay.name as academic_year_name
FROM enrollments e
LEFT JOIN students st ON e.student_id = st.id
LEFT JOIN classes c ON e.class_id = c.id
LEFT JOIN academic_years ay ON e.academic_year_id = ay.id
ORDER BY e.created_at DESC
LIMIT 3;

-- If these work, the issue was with RLS policies
SELECT 'RLS has been disabled. If queries work above, the issue was RLS policies.' as status;
