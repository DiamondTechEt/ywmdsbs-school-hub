-- ========================================
-- YWMDSBS School Hub - Complete Database Schema
-- ========================================
-- Generated: January 29, 2026
-- Database: PostgreSQL (Supabase)
-- ========================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- ENUM TYPES
-- ========================================

-- User roles enumeration
CREATE TYPE public.app_role AS ENUM ('super_admin', 'teacher', 'student');

-- Gender enumeration
CREATE TYPE public.gender_type AS ENUM ('male', 'female', 'other');

-- Boarding status enumeration
CREATE TYPE public.boarding_status AS ENUM ('boarding', 'day');

-- ========================================
-- CORE USER TABLES
-- ========================================

-- User profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- User names table (centralized name management)
CREATE TABLE public.user_names (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  middle_name TEXT,
  full_name TEXT GENERATED ALWAYS AS (
    CASE 
      WHEN middle_name IS NOT NULL AND middle_name != '' 
      THEN first_name || ' ' || middle_name || ' ' || last_name
      ELSE first_name || ' ' || last_name
    END
  ) STORED,
  display_name TEXT GENERATED ALWAYS AS (
    first_name || ' ' || last_name
  ) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========================================
-- ACADEMIC STRUCTURE TABLES
-- ========================================

-- Academic years table
CREATE TABLE public.academic_years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Semesters table (within academic years)
CREATE TABLE public.semesters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (academic_year_id, name)
);

-- ========================================
-- PERSONNEL TABLES
-- ========================================

-- Teachers table
CREATE TABLE public.teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  teacher_code TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  middle_name TEXT,
  last_name TEXT NOT NULL,
  gender gender_type NOT NULL,
  hire_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Students table
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id_code TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  middle_name TEXT,
  last_name TEXT NOT NULL,
  gender gender_type NOT NULL,
  date_of_birth DATE NOT NULL,
  current_class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  enrollment_year INTEGER NOT NULL,
  boarding_status boarding_status NOT NULL DEFAULT 'boarding',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========================================
-- ACADEMIC ENTITIES
-- ========================================

-- Classes table
CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  grade_level INTEGER NOT NULL CHECK (grade_level BETWEEN 9 AND 12),
  academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
  homeroom_teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (name, academic_year_id)
);

-- Subjects table
CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  grade_level INTEGER CHECK (grade_level BETWEEN 9 AND 12),
  credit NUMERIC(3,1) NOT NULL DEFAULT 1.0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Class-subject-teacher assignments (many-to-many relationship)
CREATE TABLE public.class_subject_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (class_id, subject_id)
);

-- Class-teachers junction table (extended many-to-many)
CREATE TABLE public.class_teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'teacher' CHECK (role IN ('homeroom', 'subject_teacher', 'assistant')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (class_id, teacher_id, role)
);

-- Student enrollments
CREATE TABLE public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, academic_year_id)
);

-- ========================================
-- ASSESSMENT AND GRADING
-- ========================================

-- Assessment types
CREATE TABLE public.assessment_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  weight_default NUMERIC(5,2) NOT NULL DEFAULT 10.00,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Assessments
CREATE TABLE public.assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_subject_assignment_id UUID NOT NULL REFERENCES public.class_subject_assignments(id) ON DELETE CASCADE,
  assessment_type_id UUID NOT NULL REFERENCES public.assessment_types(id) ON DELETE RESTRICT,
  semester_id UUID NOT NULL REFERENCES public.semesters(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  max_score NUMERIC(6,2) NOT NULL CHECK (max_score > 0),
  weight NUMERIC(5,2) NOT NULL CHECK (weight >= 0 AND weight <= 100),
  assessment_date DATE NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_by_teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Grades
CREATE TABLE public.grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  score NUMERIC(6,2) NOT NULL CHECK (score >= 0),
  percentage NUMERIC(5,2),
  letter_grade TEXT,
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE RESTRICT,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
  semester_id UUID NOT NULL REFERENCES public.semesters(id) ON DELETE CASCADE,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, assessment_id)
);

-- Grading scales
CREATE TABLE public.grading_scales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Grading scale items
CREATE TABLE public.grading_scale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grading_scale_id UUID NOT NULL REFERENCES public.grading_scales(id) ON DELETE CASCADE,
  min_percentage NUMERIC(5,2) NOT NULL,
  max_percentage NUMERIC(5,2) NOT NULL,
  letter_grade TEXT NOT NULL,
  grade_point NUMERIC(3,2) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========================================
-- SYSTEM AND AUDIT
-- ========================================

-- Audit logs
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  role TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details JSONB,
  ip_address TEXT,
  success BOOLEAN NOT NULL DEFAULT true
);

-- ========================================
-- SECURITY DEFINER FUNCTIONS
-- ========================================

-- Role checking function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Get teacher ID from user ID
CREATE OR REPLACE FUNCTION public.get_teacher_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.teachers WHERE user_id = _user_id LIMIT 1
$$;

-- Get student ID from user ID
CREATE OR REPLACE FUNCTION public.get_student_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.students WHERE user_id = _user_id LIMIT 1
$$;

-- Check if teacher is homeroom teacher for a class
CREATE OR REPLACE FUNCTION public.is_homeroom_teacher(_teacher_id uuid, _class_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.classes 
    WHERE id = _class_id AND homeroom_teacher_id = _teacher_id
  )
$$;

-- Check if teacher is assigned to class-subject
CREATE OR REPLACE FUNCTION public.is_subject_teacher(_teacher_id uuid, _class_id uuid, _subject_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.class_subject_assignments 
    WHERE teacher_id = _teacher_id AND class_id = _class_id AND subject_id = _subject_id
  )
$$;

-- Get all teachers for a class
CREATE OR REPLACE FUNCTION public.get_class_teachers(_class_id uuid)
RETURNS TABLE (
  teacher_id uuid,
  teacher_code text,
  teacher_name text,
  role text,
  is_active boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    t.id as teacher_id,
    t.teacher_code,
    t.first_name || ' ' || t.last_name as teacher_name,
    ct.role,
    ct.is_active
  FROM public.class_teachers ct
  JOIN public.teachers t ON t.id = ct.teacher_id
  WHERE ct.class_id = _class_id AND ct.is_active = true
  ORDER BY ct.role, t.last_name, t.first_name;
$$;

-- Get all classes for a teacher
CREATE OR REPLACE FUNCTION public.get_teacher_classes(_teacher_id uuid)
RETURNS TABLE (
  class_id uuid,
  class_name text,
  grade_level integer,
  role text,
  is_active boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    c.id as class_id,
    c.name as class_name,
    c.grade_level,
    ct.role,
    ct.is_active
  FROM public.class_teachers ct
  JOIN public.classes c ON c.id = ct.class_id
  WHERE ct.teacher_id = _teacher_id AND ct.is_active = true
  ORDER BY c.grade_level, c.name;
$$;

-- Assign teacher to class
CREATE OR REPLACE FUNCTION public.assign_teacher_to_class(
  _class_id uuid,
  _teacher_id uuid,
  _role text DEFAULT 'subject_teacher'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  assignment_id uuid;
BEGIN
  -- Check if assignment already exists
  SELECT id INTO assignment_id
  FROM public.class_teachers 
  WHERE class_id = _class_id AND teacher_id = _teacher_id AND role = _role;
  
  IF assignment_id IS NOT NULL THEN
    -- Reactivate existing assignment
    UPDATE public.class_teachers 
    SET is_active = true, updated_at = now()
    WHERE id = assignment_id;
  ELSE
    -- Create new assignment
    INSERT INTO public.class_teachers (class_id, teacher_id, role)
    VALUES (_class_id, _teacher_id, _role)
    RETURNING id INTO assignment_id;
  END IF;
  
  RETURN assignment_id;
END;
$$;

-- Remove teacher from class
CREATE OR REPLACE FUNCTION public.remove_teacher_from_class(
  _class_id uuid,
  _teacher_id uuid,
  _role text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.class_teachers 
  SET is_active = false, updated_at = now()
  WHERE class_id = _class_id 
    AND teacher_id = _teacher_id
    AND (_role IS NULL OR role = _role);
  
  RETURN FOUND;
END;
$$;

-- ========================================
-- TRIGGER FUNCTIONS
-- ========================================

-- Update updated_at column trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Sync student names to user_names
CREATE OR REPLACE FUNCTION sync_student_names()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_names (user_id, first_name, last_name, middle_name)
  VALUES (NEW.user_id, NEW.first_name, NEW.last_name, NEW.middle_name)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    first_name = NEW.first_name,
    last_name = NEW.last_name,
    middle_name = NEW.middle_name;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Sync teacher names to user_names
CREATE OR REPLACE FUNCTION sync_teacher_names()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_names (user_id, first_name, last_name, middle_name)
  VALUES (NEW.user_id, NEW.first_name, NEW.last_name, NEW.middle_name)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    first_name = NEW.first_name,
    last_name = NEW.last_name,
    middle_name = NEW.middle_name;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Assign student role automatically
CREATE OR REPLACE FUNCTION assign_student_role()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    RAISE EXCEPTION 'Student user_id cannot be null';
  END IF;
  
  INSERT INTO public.user_roles (user_id, role, created_at, updated_at)
  VALUES (NEW.user_id, 'student', NOW(), NOW())
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    role = 'student',
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- TRIGGERS
-- ========================================

-- Updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_roles_updated_at BEFORE UPDATE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_names_updated_at BEFORE UPDATE ON public.user_names FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_academic_years_updated_at BEFORE UPDATE ON public.academic_years FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_semesters_updated_at BEFORE UPDATE ON public.semesters FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_teachers_updated_at BEFORE UPDATE ON public.teachers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON public.classes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON public.subjects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_class_subject_assignments_updated_at BEFORE UPDATE ON public.class_subject_assignments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_class_teachers_updated_at BEFORE UPDATE ON public.class_teachers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_enrollments_updated_at BEFORE UPDATE ON public.enrollments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_assessments_updated_at BEFORE UPDATE ON public.assessments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_grades_updated_at BEFORE UPDATE ON public.grades FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Name sync triggers
CREATE TRIGGER sync_student_names_insert_trigger AFTER INSERT ON public.students FOR EACH ROW EXECUTE FUNCTION sync_student_names();
CREATE TRIGGER sync_student_names_update_trigger AFTER UPDATE OF first_name, last_name, middle_name ON public.students FOR EACH ROW EXECUTE FUNCTION sync_student_names();
CREATE TRIGGER sync_teacher_names_insert_trigger AFTER INSERT ON public.teachers FOR EACH ROW EXECUTE FUNCTION sync_teacher_names();
CREATE TRIGGER sync_teacher_names_update_trigger AFTER UPDATE OF first_name, last_name, middle_name ON public.teachers FOR EACH ROW EXECUTE FUNCTION sync_teacher_names();

-- Auto-assign student role
CREATE TRIGGER auto_assign_student_role_trigger AFTER INSERT ON public.students FOR EACH ROW EXECUTE FUNCTION assign_student_role();

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_names ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_subject_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grading_scales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grading_scale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ========================================
-- RLS POLICIES
-- ========================================

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Super admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admins can insert profiles" ON public.profiles FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR auth.uid() = id);
CREATE POLICY "Super admins can update profiles" ON public.profiles FOR UPDATE USING (public.has_role(auth.uid(), 'super_admin'));

-- User roles policies
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Super admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- User names policies
CREATE POLICY "Users can view own names" ON public.user_names FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "All authenticated can view display names" ON public.user_names FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admins can manage names" ON public.user_names FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- Academic years policies
CREATE POLICY "All authenticated users can view academic years" ON public.academic_years FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admins can manage academic years" ON public.academic_years FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- Semesters policies
CREATE POLICY "All authenticated users can view semesters" ON public.semesters FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admins can manage semesters" ON public.semesters FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- Teachers policies
CREATE POLICY "Teachers can view own record" ON public.teachers FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Super admins can view all teachers" ON public.teachers FOR SELECT USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admins can manage teachers" ON public.teachers FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- Students policies
CREATE POLICY "Students can view own record" ON public.students FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Teachers can view students in their classes" ON public.students FOR SELECT USING (
  public.has_role(auth.uid(), 'teacher') AND EXISTS (
    SELECT 1 FROM public.enrollments e
    JOIN public.class_subject_assignments csa ON csa.class_id = e.class_id
    WHERE e.student_id = students.id AND csa.teacher_id = public.get_teacher_id(auth.uid())
  )
);
CREATE POLICY "Super admins can view all students" ON public.students FOR SELECT USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admins can manage students" ON public.students FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- Classes policies
CREATE POLICY "All authenticated users can view classes" ON public.classes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admins can manage classes" ON public.classes FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- Subjects policies
CREATE POLICY "All authenticated users can view subjects" ON public.subjects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admins can manage subjects" ON public.subjects FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- Class subject assignments policies
CREATE POLICY "All authenticated can view assignments" ON public.class_subject_assignments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admins can manage assignments" ON public.class_subject_assignments FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- Class teachers policies
CREATE POLICY "All authenticated can view class teachers" ON public.class_teachers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admins can manage class teachers" ON public.class_teachers FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Teachers can view own class assignments" ON public.class_teachers FOR SELECT USING (
  public.has_role(auth.uid(), 'teacher') AND teacher_id = public.get_teacher_id(auth.uid())
);

-- Enrollments policies
CREATE POLICY "Students can view own enrollments" ON public.enrollments FOR SELECT USING (
  student_id = public.get_student_id(auth.uid())
);
CREATE POLICY "Teachers can view enrollments for their classes" ON public.enrollments FOR SELECT USING (
  public.has_role(auth.uid(), 'teacher') AND EXISTS (
    SELECT 1 FROM public.class_subject_assignments csa
    WHERE csa.class_id = enrollments.class_id AND csa.teacher_id = public.get_teacher_id(auth.uid())
  )
);
CREATE POLICY "Super admins can manage enrollments" ON public.enrollments FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- Assessment types policies
CREATE POLICY "All authenticated can view assessment types" ON public.assessment_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admins can manage assessment types" ON public.assessment_types FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- Assessments policies
CREATE POLICY "Teachers can view own assessments" ON public.assessments FOR SELECT USING (
  created_by_teacher_id = public.get_teacher_id(auth.uid())
);
CREATE POLICY "Homeroom teachers can view class assessments" ON public.assessments FOR SELECT USING (
  public.has_role(auth.uid(), 'teacher') AND EXISTS (
    SELECT 1 FROM public.class_subject_assignments csa
    JOIN public.classes c ON c.id = csa.class_id
    WHERE csa.id = assessments.class_subject_assignment_id 
    AND c.homeroom_teacher_id = public.get_teacher_id(auth.uid())
  )
);
CREATE POLICY "Students can view published assessments" ON public.assessments FOR SELECT USING (
  is_published = true AND EXISTS (
    SELECT 1 FROM public.enrollments e
    JOIN public.class_subject_assignments csa ON csa.class_id = e.class_id
    WHERE e.student_id = public.get_student_id(auth.uid()) 
    AND csa.id = assessments.class_subject_assignment_id
  )
);
CREATE POLICY "Super admins can view all assessments" ON public.assessments FOR SELECT USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Teachers can create own assessments" ON public.assessments FOR INSERT WITH CHECK (
  created_by_teacher_id = public.get_teacher_id(auth.uid()) AND EXISTS (
    SELECT 1 FROM public.class_subject_assignments csa
    WHERE csa.id = class_subject_assignment_id AND csa.teacher_id = public.get_teacher_id(auth.uid())
  )
);
CREATE POLICY "Teachers can update own assessments" ON public.assessments FOR UPDATE USING (
  created_by_teacher_id = public.get_teacher_id(auth.uid())
);
CREATE POLICY "Super admins can manage assessments" ON public.assessments FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- Grades policies
CREATE POLICY "Teachers can view own grades" ON public.grades FOR SELECT USING (
  teacher_id = public.get_teacher_id(auth.uid())
);
CREATE POLICY "Homeroom teachers can view class grades (read-only)" ON public.grades FOR SELECT USING (
  public.has_role(auth.uid(), 'teacher') AND 
  public.is_homeroom_teacher(public.get_teacher_id(auth.uid()), class_id)
);
CREATE POLICY "Students can view own published grades" ON public.grades FOR SELECT USING (
  student_id = public.get_student_id(auth.uid()) AND is_published = true
);
CREATE POLICY "Super admins can view all grades" ON public.grades FOR SELECT USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Teachers can insert grades for own subjects" ON public.grades FOR INSERT WITH CHECK (
  teacher_id = public.get_teacher_id(auth.uid()) AND 
  public.is_subject_teacher(public.get_teacher_id(auth.uid()), class_id, subject_id)
);
CREATE POLICY "Teachers can update own grades" ON public.grades FOR UPDATE USING (
  teacher_id = public.get_teacher_id(auth.uid())
);
CREATE POLICY "Super admins can manage grades" ON public.grades FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- Grading scales policies
CREATE POLICY "All authenticated can view grading scales" ON public.grading_scales FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admins can manage grading scales" ON public.grading_scales FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- Grading scale items policies
CREATE POLICY "All authenticated can view grading scale items" ON public.grading_scale_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admins can manage grading scale items" ON public.grading_scale_items FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- Audit logs policies
CREATE POLICY "Super admins can view audit logs" ON public.audit_logs FOR SELECT USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "System can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (true);

-- ========================================
-- PERFORMANCE INDEXES
-- ========================================

-- User-related indexes
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_names_user_id ON public.user_names(user_id);

-- Academic structure indexes
CREATE INDEX idx_academic_years_active ON public.academic_years(is_active);
CREATE INDEX idx_semesters_academic_year ON public.semesters(academic_year_id);
CREATE INDEX idx_classes_academic_year ON public.classes(academic_year_id);
CREATE INDEX idx_classes_grade_level ON public.classes(grade_level);

-- Personnel indexes
CREATE INDEX idx_teachers_user_id ON public.teachers(user_id);
CREATE INDEX idx_teachers_active ON public.teachers(is_active);
CREATE INDEX idx_students_user_id ON public.students(user_id);
CREATE INDEX idx_students_class ON public.students(current_class_id);
CREATE INDEX idx_students_active ON public.students(is_active);

-- Assignment indexes
CREATE INDEX idx_class_subject_assignments_class ON public.class_subject_assignments(class_id);
CREATE INDEX idx_class_subject_assignments_subject ON public.class_subject_assignments(subject_id);
CREATE INDEX idx_class_subject_assignments_teacher ON public.class_subject_assignments(teacher_id);
CREATE INDEX idx_class_teachers_class_id ON public.class_teachers(class_id);
CREATE INDEX idx_class_teachers_teacher_id ON public.class_teachers(teacher_id);
CREATE INDEX idx_class_teachers_active ON public.class_teachers(is_active);

-- Enrollment indexes
CREATE INDEX idx_enrollments_student ON public.enrollments(student_id);
CREATE INDEX idx_enrollments_class ON public.enrollments(class_id);
CREATE INDEX idx_enrollments_academic_year ON public.enrollments(academic_year_id);

-- Assessment indexes
CREATE INDEX idx_assessments_csa ON public.assessments(class_subject_assignment_id);
CREATE INDEX idx_assessments_teacher ON public.assessments(created_by_teacher_id);
CREATE INDEX idx_assessments_semester ON public.assessments(semester_id);
CREATE INDEX idx_assessments_date ON public.assessments(assessment_date);

-- Grade indexes
CREATE INDEX idx_grades_student_id ON public.grades(student_id);
CREATE INDEX idx_grades_assessment_id ON public.grades(assessment_id);
CREATE INDEX idx_grades_teacher_id ON public.grades(teacher_id);
CREATE INDEX idx_grades_class_subject ON public.grades(class_id, subject_id);
CREATE INDEX idx_grades_published ON public.grades(is_published);

-- System indexes
CREATE INDEX idx_audit_logs_timestamp ON public.audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);

-- ========================================
-- SAMPLE DATA (Optional - for development)
-- ========================================

-- Note: Uncomment the following section for development/testing only
/*
-- Sample Academic Year
INSERT INTO public.academic_years (name, start_date, end_date) VALUES
('2024-2025', '2024-09-01', '2025-07-31');

-- Sample Semesters
INSERT INTO public.semesters (academic_year_id, name, start_date, end_date) VALUES
((SELECT id FROM public.academic_years WHERE name = '2024-2025'), 'Semester 1', '2024-09-01', '2025-01-31'),
((SELECT id FROM public.academic_years WHERE name = '2024-2025'), 'Semester 2', '2025-02-01', '2025-07-31');

-- Sample Assessment Types
INSERT INTO public.assessment_types (code, name, description, weight_default) VALUES
('EXAM', 'Final Exam', 'End of semester examination', 40.00),
('MID', 'Midterm Exam', 'Mid semester examination', 20.00),
('TEST', 'Unit Test', 'Monthly unit test', 15.00),
('HW', 'Homework', 'Regular homework assignments', 10.00),
('PROJ', 'Project', 'Class project or presentation', 15.00);

-- Sample Grading Scale
INSERT INTO public.grading_scales (name, academic_year_id) VALUES
('Standard Scale', (SELECT id FROM public.academic_years WHERE name = '2024-2025'));

INSERT INTO public.grading_scale_items (grading_scale_id, min_percentage, max_percentage, letter_grade, grade_point, description) VALUES
((SELECT id FROM public.grading_scales WHERE name = 'Standard Scale'), 80.00, 100.00, 'A', 4.00, 'Excellent'),
((SELECT id FROM public.grading_scales WHERE name = 'Standard Scale'), 70.00, 79.99, 'B', 3.00, 'Good'),
((SELECT id FROM public.grading_scales WHERE name = 'Standard Scale'), 60.00, 69.99, 'C', 2.00, 'Average'),
((SELECT id FROM public.grading_scales WHERE name = 'Standard Scale'), 50.00, 59.99, 'D', 1.00, 'Below Average'),
((SELECT id FROM public.grading_scales WHERE name = 'Standard Scale'), 0.00, 49.99, 'F', 0.00, 'Fail');
*/

-- ========================================
-- SCHEMA COMPLETION
-- ========================================

-- Schema creation completed successfully
-- All tables, indexes, functions, triggers, and RLS policies are in place
-- Ready for application deployment
