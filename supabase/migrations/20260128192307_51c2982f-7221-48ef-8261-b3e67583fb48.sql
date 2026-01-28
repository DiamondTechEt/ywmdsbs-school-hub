-- Create custom types/enums
CREATE TYPE public.app_role AS ENUM ('super_admin', 'teacher', 'student');
CREATE TYPE public.gender_type AS ENUM ('male', 'female', 'other');
CREATE TYPE public.boarding_status AS ENUM ('boarding', 'day');

-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Create academic_years table
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

-- Create semesters table
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

-- Create teachers table
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

-- Create classes table
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

-- Create subjects table
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

-- Create students table
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

-- Create class_subject_assignments table (links class, subject, teacher)
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

-- Create enrollments table
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

-- Create assessment_types table
CREATE TABLE public.assessment_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  weight_default NUMERIC(5,2) NOT NULL DEFAULT 10.00,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create assessments table
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

-- Create grades table
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

-- Create grading_scales table
CREATE TABLE public.grading_scales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create grading_scale_items table
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

-- Create audit_logs table
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

-- Create security definer function for role checking
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

-- Create function to get user's teacher_id
CREATE OR REPLACE FUNCTION public.get_teacher_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.teachers WHERE user_id = _user_id LIMIT 1
$$;

-- Create function to get user's student_id
CREATE OR REPLACE FUNCTION public.get_student_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.students WHERE user_id = _user_id LIMIT 1
$$;

-- Create function to check if teacher is homeroom teacher for a class
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

-- Create function to check if teacher is assigned to class-subject
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

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add updated_at triggers to all relevant tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_academic_years_updated_at BEFORE UPDATE ON public.academic_years FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_semesters_updated_at BEFORE UPDATE ON public.semesters FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_teachers_updated_at BEFORE UPDATE ON public.teachers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON public.classes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON public.subjects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_class_subject_assignments_updated_at BEFORE UPDATE ON public.class_subject_assignments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_enrollments_updated_at BEFORE UPDATE ON public.enrollments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_assessments_updated_at BEFORE UPDATE ON public.assessments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_grades_updated_at BEFORE UPDATE ON public.grades FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_subject_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grading_scales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grading_scale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Super admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admins can insert profiles" ON public.profiles FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR auth.uid() = id);
CREATE POLICY "Super admins can update profiles" ON public.profiles FOR UPDATE USING (public.has_role(auth.uid(), 'super_admin'));

-- RLS Policies for user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Super admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- RLS Policies for academic_years
CREATE POLICY "All authenticated users can view academic years" ON public.academic_years FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admins can manage academic years" ON public.academic_years FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- RLS Policies for semesters
CREATE POLICY "All authenticated users can view semesters" ON public.semesters FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admins can manage semesters" ON public.semesters FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- RLS Policies for teachers
CREATE POLICY "Teachers can view own record" ON public.teachers FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Super admins can view all teachers" ON public.teachers FOR SELECT USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admins can manage teachers" ON public.teachers FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- RLS Policies for classes
CREATE POLICY "All authenticated users can view classes" ON public.classes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admins can manage classes" ON public.classes FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- RLS Policies for subjects
CREATE POLICY "All authenticated users can view subjects" ON public.subjects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admins can manage subjects" ON public.subjects FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- RLS Policies for students
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

-- RLS Policies for class_subject_assignments
CREATE POLICY "All authenticated can view assignments" ON public.class_subject_assignments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admins can manage assignments" ON public.class_subject_assignments FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- RLS Policies for enrollments
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

-- RLS Policies for assessment_types
CREATE POLICY "All authenticated can view assessment types" ON public.assessment_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admins can manage assessment types" ON public.assessment_types FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- RLS Policies for assessments
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

-- RLS Policies for grades
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

-- RLS Policies for grading_scales
CREATE POLICY "All authenticated can view grading scales" ON public.grading_scales FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admins can manage grading scales" ON public.grading_scales FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- RLS Policies for grading_scale_items
CREATE POLICY "All authenticated can view grading scale items" ON public.grading_scale_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admins can manage grading scale items" ON public.grading_scale_items FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- RLS Policies for audit_logs
CREATE POLICY "Super admins can view audit logs" ON public.audit_logs FOR SELECT USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "System can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_grades_student_id ON public.grades(student_id);
CREATE INDEX idx_grades_assessment_id ON public.grades(assessment_id);
CREATE INDEX idx_grades_teacher_id ON public.grades(teacher_id);
CREATE INDEX idx_grades_class_subject ON public.grades(class_id, subject_id);
CREATE INDEX idx_enrollments_student ON public.enrollments(student_id);
CREATE INDEX idx_enrollments_class ON public.enrollments(class_id);
CREATE INDEX idx_assessments_csa ON public.assessments(class_subject_assignment_id);
CREATE INDEX idx_class_subject_assignments_teacher ON public.class_subject_assignments(teacher_id);
CREATE INDEX idx_audit_logs_timestamp ON public.audit_logs(timestamp DESC);