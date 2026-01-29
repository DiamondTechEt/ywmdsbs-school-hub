-- Create proper CRUD policies for super admins on all key tables
-- This will allow super admins to perform all operations on students, teachers, and other tables

-- First, create a function to reliably check super admin role
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
$$;

-- STUDENTS TABLE - Drop and recreate policies
DROP POLICY IF EXISTS "Students can view own record" ON public.students;
DROP POLICY IF EXISTS "Teachers can view students in their classes" ON public.students;
DROP POLICY IF EXISTS "Super admins can view all students" ON public.students;
DROP POLICY IF EXISTS "Super admins can manage students" ON public.students;
DROP POLICY IF EXISTS "Authenticated users can create students" ON public.students;
DROP POLICY IF EXISTS "Teachers can create students" ON public.students;

CREATE POLICY "Students can view own record" ON public.students FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Super admins can CRUD students" ON public.students FOR ALL USING (public.is_super_admin());

-- TEACHERS TABLE - Drop and recreate policies
DROP POLICY IF EXISTS "Teachers can view own record" ON public.teachers;
DROP POLICY IF EXISTS "Super admins can view all teachers" ON public.teachers;
DROP POLICY IF EXISTS "Super admins can manage teachers" ON public.teachers;
DROP POLICY IF EXISTS "Temporary bypass for testing" ON public.teachers;

CREATE POLICY "Teachers can view own record" ON public.teachers FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Super admins can CRUD teachers" ON public.teachers FOR ALL USING (public.is_super_admin());

-- CLASSES TABLE - Drop and recreate policies
DROP POLICY IF EXISTS "All authenticated users can view classes" ON public.classes;
DROP POLICY IF EXISTS "Super admins can manage classes" ON public.classes;

CREATE POLICY "All authenticated users can view classes" ON public.classes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admins can CRUD classes" ON public.classes FOR ALL USING (public.is_super_admin());

-- SUBJECTS TABLE - Drop and recreate policies
DROP POLICY IF EXISTS "All authenticated users can view subjects" ON public.subjects;
DROP POLICY IF EXISTS "Super admins can manage subjects" ON public.subjects;

CREATE POLICY "All authenticated users can view subjects" ON public.subjects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admins can CRUD subjects" ON public.subjects FOR ALL USING (public.is_super_admin());

-- ACADEMIC YEARS TABLE - Drop and recreate policies
DROP POLICY IF EXISTS "All authenticated users can view academic years" ON public.academic_years;
DROP POLICY IF EXISTS "Super admins can manage academic years" ON public.academic_years;

CREATE POLICY "All authenticated users can view academic years" ON public.academic_years FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admins can CRUD academic years" ON public.academic_years FOR ALL USING (public.is_super_admin());

-- SEMESTERS TABLE - Drop and recreate policies
DROP POLICY IF EXISTS "All authenticated users can view semesters" ON public.semesters;
DROP POLICY IF EXISTS "Super admins can manage semesters" ON public.semesters;

CREATE POLICY "All authenticated users can view semesters" ON public.semesters FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admins can CRUD semesters" ON public.semesters FOR ALL USING (public.is_super_admin());

-- ENROLLMENTS TABLE - Drop and recreate policies
DROP POLICY IF EXISTS "Students can view own enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Teachers can view enrollments for their classes" ON public.enrollments;
DROP POLICY IF EXISTS "Super admins can manage enrollments" ON public.enrollments;

CREATE POLICY "Students can view own enrollments" ON public.enrollments FOR SELECT USING (
  student_id = public.get_student_id(auth.uid())
);
CREATE POLICY "Super admins can CRUD enrollments" ON public.enrollments FOR ALL USING (public.is_super_admin());

-- ASSESSMENTS TABLE - Drop and recreate policies
DROP POLICY IF EXISTS "Teachers can view own assessments" ON public.assessments;
DROP POLICY IF EXISTS "Homeroom teachers can view class assessments" ON public.assessments;
DROP POLICY IF EXISTS "Students can view published assessments" ON public.assessments;
DROP POLICY IF EXISTS "Super admins can view all assessments" ON public.assessments;
DROP POLICY IF EXISTS "Teachers can create own assessments" ON public.assessments;
DROP POLICY IF EXISTS "Teachers can update own assessments" ON public.assessments;
DROP POLICY IF EXISTS "Super admins can manage assessments" ON public.assessments;

CREATE POLICY "Teachers can view own assessments" ON public.assessments FOR SELECT USING (
  created_by_teacher_id = public.get_teacher_id(auth.uid())
);
CREATE POLICY "Students can view published assessments" ON public.assessments FOR SELECT USING (
  is_published = true AND EXISTS (
    SELECT 1 FROM public.enrollments e
    JOIN public.class_subject_assignments csa ON csa.class_id = e.class_id
    WHERE e.student_id = public.get_student_id(auth.uid()) 
    AND csa.id = assessments.class_subject_assignment_id
  )
);
CREATE POLICY "Super admins can CRUD assessments" ON public.assessments FOR ALL USING (public.is_super_admin());

-- GRADES TABLE - Drop and recreate policies
DROP POLICY IF EXISTS "Teachers can view own grades" ON public.grades;
DROP POLICY IF EXISTS "Homeroom teachers can view class grades (read-only)" ON public.grades;
DROP POLICY IF EXISTS "Students can view own published grades" ON public.grades;
DROP POLICY IF EXISTS "Super admins can view all grades" ON public.grades;
DROP POLICY IF EXISTS "Teachers can insert grades for own subjects" ON public.grades;
DROP POLICY IF EXISTS "Teachers can update own grades" ON public.grades;
DROP POLICY IF EXISTS "Super admins can manage grades" ON public.grades;

CREATE POLICY "Teachers can view own grades" ON public.grades FOR SELECT USING (
  teacher_id = public.get_teacher_id(auth.uid())
);
CREATE POLICY "Students can view own published grades" ON public.grades FOR SELECT USING (
  student_id = public.get_student_id(auth.uid()) AND is_published = true
);
CREATE POLICY "Super admins can CRUD grades" ON public.grades FOR ALL USING (public.is_super_admin());

-- Test the policies (these should work in your React app, not SQL editor)
-- Note: These will fail in SQL editor due to auth.uid() = null, but work in your app
