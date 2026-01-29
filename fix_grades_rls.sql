-- Fix RLS policies for grades table
-- Run this in Supabase SQL Editor

-- Disable RLS temporarily to allow teachers to save grades
ALTER TABLE public.grades DISABLE ROW LEVEL SECURITY;

-- Test if we can now insert a grade
SELECT 'Testing grade insertion without RLS' as test;

-- Re-enable RLS with simple policies that allow teachers to manage grades for their classes
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;

-- Drop existing policies that might be blocking
DROP POLICY IF EXISTS "Enable all for authenticated" ON public.grades;

-- Create simple policy that allows teachers to manage grades
CREATE POLICY "Teachers can manage grades" ON public.grades
    FOR ALL USING (
        auth.role() = 'authenticated' AND (
            -- Super admins can do everything
            EXISTS (
                SELECT 1 FROM public.user_roles ur
                WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin'
            )
            OR
            -- Teachers can manage grades for their assigned classes
            EXISTS (
                SELECT 1 FROM public.grades g
                JOIN public.assessments a ON g.assessment_id = a.id
                JOIN public.class_subject_assignments csa ON a.class_subject_assignment_id = csa.id
                JOIN public.class_teachers ct ON csa.class_id = ct.class_id AND csa.teacher_id = ct.teacher_id
                JOIN public.teachers t ON ct.teacher_id = t.id
                WHERE t.user_id = auth.uid() 
                AND ct.is_active = true
                AND g.id = grades.id
            )
            OR
            -- Teachers can insert grades for their class assessments
            EXISTS (
                SELECT 1 FROM public.assessments a
                JOIN public.class_subject_assignments csa ON a.class_subject_assignment_id = csa.id
                JOIN public.class_teachers ct ON csa.class_id = ct.class_id AND csa.teacher_id = ct.teacher_id
                JOIN public.teachers t ON ct.teacher_id = t.id
                WHERE t.user_id = auth.uid()
                AND ct.is_active = true
                AND a.id = grades.assessment_id
            )
        )
    );

-- Test the policy
SELECT 'RLS policies updated - test grade saving now' as status;
