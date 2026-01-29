-- Emergency fix for RLS policies causing 500 errors
-- Run this in Supabase SQL Editor if students table queries are failing

-- Drop all existing RLS policies on students table that might be causing issues
DROP POLICY IF EXISTS "Students can view own data" ON public.students;
DROP POLICY IF EXISTS "Teachers can view student data" ON public.students;
DROP POLICY IF EXISTS "Super admins can manage students" ON public.students;
DROP POLICY IF EXISTS "Users can insert students" ON public.students;
DROP POLICY IF EXISTS "Users can update students" ON public.students;
DROP POLICY IF EXISTS "Users can delete students" ON public.students;

-- Create simple, working RLS policies for students
CREATE POLICY "Enable read access for all authenticated users" ON public.students
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON public.students
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON public.students
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON public.students
    FOR DELETE USING (auth.role() = 'authenticated');

-- Also fix classes table RLS if needed
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.classes;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.classes;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.classes;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.classes;

CREATE POLICY "Enable read access for all authenticated users" ON public.classes
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON public.classes
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON public.classes
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON public.classes
    FOR DELETE USING (auth.role() = 'authenticated');

-- Ensure RLS is enabled
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- Test the query that was failing
SELECT 
    s.*,
    c.name as class_name,
    c.grade_level
FROM students s
LEFT JOIN classes c ON s.current_class_id = c.id
ORDER BY s.last_name ASC
LIMIT 1;
