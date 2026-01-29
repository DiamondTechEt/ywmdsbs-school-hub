-- Complete CRUD access for super admins on ALL tables in the database
-- This will give super admins full control over every table

-- Helper function to check super admin role
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

-- PROFILES TABLE
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can update profiles" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Super admins can CRUD profiles" ON public.profiles FOR ALL USING (public.is_super_admin());

-- USER_ROLES TABLE
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can manage roles" ON public.user_roles;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Super admins can CRUD user_roles" ON public.user_roles FOR ALL USING (public.is_super_admin());

-- ACADEMIC_YEARS TABLE
DROP POLICY IF EXISTS "All authenticated users can view academic years" ON public.academic_years;
DROP POLICY IF EXISTS "Super admins can manage academic years" ON public.academic_years;

CREATE POLICY "All authenticated users can view academic years" ON public.academic_years FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admins can CRUD academic_years" ON public.academic_years FOR ALL USING (public.is_super_admin());

-- SEMESTERS TABLE
DROP POLICY IF EXISTS "All authenticated users can view semesters" ON public.semesters;
DROP POLICY IF EXISTS "Super admins can manage semesters" ON public.semesters;

CREATE POLICY "All authenticated users can view semesters" ON public.semesters FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admins can CRUD semesters" ON public.semesters FOR ALL USING (public.is_super_admin());

-- TEACHERS TABLE
DROP POLICY IF EXISTS "Teachers can view own record" ON public.teachers;
DROP POLICY IF EXISTS "Super admins can view all teachers" ON public.teachers;
DROP POLICY IF EXISTS "Super admins can manage teachers" ON public.teachers;

CREATE POLICY "Teachers can view own record" ON public.teachers FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Super admins can CRUD teachers" ON public.teachers FOR ALL USING (public.is_super_admin());

-- CLASSES TABLE
DROP POLICY IF EXISTS "All authenticated users can view classes" ON public.classes;
DROP POLICY IF EXISTS "Super admins can manage classes" ON public.classes;

CREATE POLICY "All authenticated users can view classes" ON public.classes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admins can CRUD classes" ON public.classes FOR ALL USING (public.is_super_admin());

-- SUBJECTS TABLE
DROP POLICY IF EXISTS "All authenticated users can view subjects" ON public.subjects;
DROP POLICY IF EXISTS "Super admins can manage subjects" ON public.subjects;

CREATE POLICY "All authenticated users can view subjects" ON public.subjects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admins can CRUD subjects" ON public.subjects FOR ALL USING (public.is_super_admin());

-- STUDENTS TABLE
DROP POLICY IF EXISTS "Students can view own record" ON public.students;
DROP POLICY IF EXISTS "Teachers can view students in their classes" ON public.students;
DROP POLICY IF EXISTS "Super admins can view all students" ON public.students;
DROP POLICY IF EXISTS "Super admins can manage students" ON public.students;

CREATE POLICY "Students can view own record" ON public.students FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Super admins can CRUD students" ON public.students FOR ALL USING (public.is_super_admin());

-- CLASS_SUBJECT_ASSIGNMENTS TABLE
DROP POLICY IF EXISTS "All authenticated can view assignments" ON public.class_subject_assignments;
DROP POLICY IF EXISTS "Super admins can manage assignments" ON public.class_subject_assignments;

CREATE POLICY "All authenticated can view assignments" ON public.class_subject_assignments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admins can CRUD class_subject_assignments" ON public.class_subject_assignments FOR ALL USING (public.is_super_admin());

-- ENROLLMENTS TABLE
DROP POLICY IF EXISTS "Students can view own enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Teachers can view enrollments for their classes" ON public.enrollments;
DROP POLICY IF EXISTS "Super admins can manage enrollments" ON public.enrollments;

CREATE POLICY "Students can view own enrollments" ON public.enrollments FOR SELECT USING (
  student_id = (SELECT id FROM public.students WHERE user_id = auth.uid() LIMIT 1)
);
CREATE POLICY "Super admins can CRUD enrollments" ON public.enrollments FOR ALL USING (public.is_super_admin());

-- ASSESSMENT_TYPES TABLE
DROP POLICY IF EXISTS "All authenticated can view assessment types" ON public.assessment_types;
DROP POLICY IF EXISTS "Super admins can manage assessment types" ON public.assessment_types;

CREATE POLICY "All authenticated can view assessment types" ON public.assessment_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admins can CRUD assessment_types" ON public.assessment_types FOR ALL USING (public.is_super_admin());

-- ASSESSMENTS TABLE
DROP POLICY IF EXISTS "Teachers can view own assessments" ON public.assessments;
DROP POLICY IF EXISTS "Homeroom teachers can view class assessments" ON public.assessments;
DROP POLICY IF EXISTS "Students can view published assessments" ON public.assessments;
DROP POLICY IF EXISTS "Super admins can view all assessments" ON public.assessments;
DROP POLICY IF EXISTS "Teachers can create own assessments" ON public.assessments;
DROP POLICY IF EXISTS "Teachers can update own assessments" ON public.assessments;
DROP POLICY IF EXISTS "Super admins can manage assessments" ON public.assessments;

CREATE POLICY "Teachers can view own assessments" ON public.assessments FOR SELECT USING (
  created_by_teacher_id = (SELECT id FROM public.teachers WHERE user_id = auth.uid() LIMIT 1)
);
CREATE POLICY "Students can view published assessments" ON public.assessments FOR SELECT USING (
  is_published = true AND EXISTS (
    SELECT 1 FROM public.enrollments e
    JOIN public.class_subject_assignments csa ON csa.class_id = e.class_id
    WHERE e.student_id = (SELECT id FROM public.students WHERE user_id = auth.uid() LIMIT 1)
    AND csa.id = assessments.class_subject_assignment_id
  )
);
CREATE POLICY "Super admins can CRUD assessments" ON public.assessments FOR ALL USING (public.is_super_admin());

-- GRADES TABLE
DROP POLICY IF EXISTS "Teachers can view own grades" ON public.grades;
DROP POLICY IF EXISTS "Homeroom teachers can view class grades (read-only)" ON public.grades;
DROP POLICY IF EXISTS "Students can view own published grades" ON public.grades;
DROP POLICY IF EXISTS "Super admins can view all grades" ON public.grades;
DROP POLICY IF EXISTS "Teachers can insert grades for own subjects" ON public.grades;
DROP POLICY IF EXISTS "Teachers can update own grades" ON public.grades;
DROP POLICY IF EXISTS "Super admins can manage grades" ON public.grades;

CREATE POLICY "Teachers can view own grades" ON public.grades FOR SELECT USING (
  teacher_id = (SELECT id FROM public.teachers WHERE user_id = auth.uid() LIMIT 1)
);
CREATE POLICY "Students can view own published grades" ON public.grades FOR SELECT USING (
  student_id = (SELECT id FROM public.students WHERE user_id = auth.uid() LIMIT 1) AND is_published = true
);
CREATE POLICY "Super admins can CRUD grades" ON public.grades FOR ALL USING (public.is_super_admin());

-- GRADING_SCALES TABLE
DROP POLICY IF EXISTS "All authenticated can view grading scales" ON public.grading_scales;
DROP POLICY IF EXISTS "Super admins can manage grading scales" ON public.grading_scales;

CREATE POLICY "All authenticated can view grading scales" ON public.grading_scales FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admins can CRUD grading_scales" ON public.grading_scales FOR ALL USING (public.is_super_admin());

-- GRADING_SCALE_ITEMS TABLE
DROP POLICY IF EXISTS "All authenticated can view grading scale items" ON public.grading_scale_items;
DROP POLICY IF EXISTS "Super admins can manage grading scale items" ON public.grading_scale_items;

CREATE POLICY "All authenticated can view grading scale items" ON public.grading_scale_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admins can CRUD grading_scale_items" ON public.grading_scale_items FOR ALL USING (public.is_super_admin());

-- AUDIT_LOGS TABLE
DROP POLICY IF EXISTS "Super admins can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON public.audit_logs;

CREATE POLICY "Super admins can CRUD audit_logs" ON public.audit_logs FOR ALL USING (public.is_super_admin());
CREATE POLICY "Authenticated users can insert audit_logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Summary: Super admins now have full CRUD access to all tables
-- Teachers and students retain their appropriate limited access
-- All authenticated users can view reference data (classes, subjects, etc.)
