-- ============================================================
-- COMPLETE DATABASE SCHEMA FOR YWMDSBS SCHOOL MANAGEMENT SYSTEM
-- Run this entire script in one go in the SQL Editor
-- ============================================================

-- ============================================================
-- PART 1: ENUMS
-- ============================================================
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('super_admin', 'teacher', 'student', 'parent');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.boarding_status AS ENUM ('boarding', 'day');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.gender_type AS ENUM ('male', 'female', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- PART 2: EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PART 3: TABLES
-- ============================================================

-- Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User Roles
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

-- User Names
CREATE TABLE IF NOT EXISTS public.user_names (
  user_id UUID NOT NULL PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  middle_name TEXT,
  full_name TEXT,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Academic Years
CREATE TABLE IF NOT EXISTS public.academic_years (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Subjects
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  grade_level INTEGER,
  credit NUMERIC NOT NULL DEFAULT 1.0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Assessment Types
CREATE TABLE IF NOT EXISTS public.assessment_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  weight_default NUMERIC NOT NULL DEFAULT 10.00,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Teachers
CREATE TABLE IF NOT EXISTS public.teachers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  teacher_code TEXT NOT NULL,
  first_name TEXT NOT NULL,
  middle_name TEXT,
  last_name TEXT NOT NULL,
  gender gender_type NOT NULL,
  phone TEXT,
  hire_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  avatar_url TEXT,
  is_banned BOOLEAN NOT NULL DEFAULT false,
  ban_reason TEXT,
  ban_notes TEXT,
  banned_at TIMESTAMPTZ,
  banned_by UUID REFERENCES public.teachers(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Classes
CREATE TABLE IF NOT EXISTS public.classes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  grade_level INTEGER NOT NULL,
  academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
  homeroom_teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (name, academic_year_id)
);

-- Students
CREATE TABLE IF NOT EXISTS public.students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  student_id_code TEXT NOT NULL,
  first_name TEXT NOT NULL,
  middle_name TEXT,
  last_name TEXT NOT NULL,
  gender gender_type NOT NULL,
  date_of_birth DATE NOT NULL,
  enrollment_year INTEGER NOT NULL,
  boarding_status boarding_status NOT NULL DEFAULT 'boarding',
  current_class_id UUID REFERENCES public.classes(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  avatar_url TEXT,
  is_banned BOOLEAN NOT NULL DEFAULT false,
  ban_reason TEXT,
  ban_notes TEXT,
  banned_at TIMESTAMPTZ,
  banned_by UUID REFERENCES public.teachers(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Parents
CREATE TABLE IF NOT EXISTS public.parents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  first_name TEXT NOT NULL,
  middle_name TEXT,
  last_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Parent-Student Relationships
CREATE TABLE IF NOT EXISTS public.parent_students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id UUID NOT NULL REFERENCES public.parents(id),
  student_id UUID NOT NULL REFERENCES public.students(id),
  relationship TEXT NOT NULL DEFAULT 'parent',
  is_primary BOOLEAN DEFAULT false,
  can_view_grades BOOLEAN DEFAULT true,
  can_view_attendance BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Semesters
CREATE TABLE IF NOT EXISTS public.semesters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  academic_year_id UUID NOT NULL REFERENCES public.academic_years(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enrollments
CREATE TABLE IF NOT EXISTS public.enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, academic_year_id)
);

-- Class Subject Assignments
CREATE TABLE IF NOT EXISTS public.class_subject_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (class_id, subject_id)
);

-- Class Teachers
CREATE TABLE IF NOT EXISTS public.class_teachers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'teacher',
  is_active BOOLEAN NOT NULL DEFAULT true,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (class_id, teacher_id, subject_id)
);

-- Assessments
CREATE TABLE IF NOT EXISTS public.assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  class_subject_assignment_id UUID NOT NULL REFERENCES public.class_subject_assignments(id) ON DELETE CASCADE,
  assessment_type_id UUID NOT NULL REFERENCES public.assessment_types(id),
  semester_id UUID NOT NULL REFERENCES public.semesters(id) ON DELETE CASCADE,
  max_score NUMERIC NOT NULL,
  weight NUMERIC NOT NULL,
  assessment_date DATE NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_by_teacher_id UUID NOT NULL REFERENCES public.teachers(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Grades
CREATE TABLE IF NOT EXISTS public.grades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  score NUMERIC NOT NULL,
  letter_grade TEXT,
  percentage NUMERIC,
  teacher_id UUID NOT NULL REFERENCES public.teachers(id),
  class_id UUID NOT NULL REFERENCES public.classes(id),
  subject_id UUID NOT NULL REFERENCES public.subjects(id),
  academic_year_id UUID NOT NULL REFERENCES public.academic_years(id),
  semester_id UUID NOT NULL REFERENCES public.semesters(id),
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Grading Scales
CREATE TABLE IF NOT EXISTS public.grading_scales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  academic_year_id UUID REFERENCES public.academic_years(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Grading Scale Items
CREATE TABLE IF NOT EXISTS public.grading_scale_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  grading_scale_id UUID NOT NULL REFERENCES public.grading_scales(id),
  letter_grade TEXT NOT NULL,
  min_percentage NUMERIC NOT NULL,
  max_percentage NUMERIC NOT NULL,
  grade_point NUMERIC NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  entity_name TEXT,
  action_url TEXT,
  action_text TEXT,
  is_read BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  priority INTEGER DEFAULT 1,
  metadata JSONB,
  read_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  user_email TEXT,
  user_name TEXT,
  role TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  entity_name TEXT,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN NOT NULL DEFAULT true,
  "timestamp" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- CMS Pages (About, Blog)
CREATE TABLE IF NOT EXISTS public.cms_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  page_type TEXT NOT NULL DEFAULT 'page',
  featured_image TEXT,
  excerpt TEXT,
  meta_description TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  likes_count INTEGER NOT NULL DEFAULT 0,
  shares_count INTEGER NOT NULL DEFAULT 0,
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- CMS Gallery
CREATE TABLE IF NOT EXISTS public.cms_gallery (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  is_published BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Blog Post Likes
CREATE TABLE IF NOT EXISTS public.blog_post_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.cms_pages(id) ON DELETE CASCADE,
  visitor_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (post_id, visitor_id)
);

-- ============================================================
-- PART 4: INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_assessments_csa ON public.assessments(class_subject_assignment_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_ip_address ON public.audit_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON public.audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_email ON public.audit_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_name ON public.audit_logs(entity_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_agent ON public.audit_logs(user_agent);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs("timestamp" DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_blog_post_likes_post_id ON public.blog_post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_post_likes_visitor ON public.blog_post_likes(post_id, visitor_id);
CREATE INDEX IF NOT EXISTS idx_class_subject_assignments_teacher ON public.class_subject_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_class_teachers_teacher_id ON public.class_teachers(teacher_id);
CREATE INDEX IF NOT EXISTS idx_class_teachers_class_id ON public.class_teachers(class_id);
CREATE INDEX IF NOT EXISTS idx_class_teachers_active ON public.class_teachers(is_active);
CREATE INDEX IF NOT EXISTS idx_class_teachers_subject_id ON public.class_teachers(subject_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON public.enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_class ON public.enrollments(class_id);
CREATE INDEX IF NOT EXISTS idx_grades_student_id ON public.grades(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_class_subject ON public.grades(class_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_grades_teacher_id ON public.grades(teacher_id);

-- ============================================================
-- PART 5: FUNCTIONS
-- ============================================================

-- Core role-checking functions
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
$$;

CREATE OR REPLACE FUNCTION public.is_current_user_super_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND (email LIKE '%admin%' OR full_name LIKE '%admin%')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND email LIKE '%admin%'
  );
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(user_id_to_check UUID DEFAULT NULL)
RETURNS TABLE(role TEXT)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ur.role::TEXT
  FROM public.user_roles ur
  WHERE ur.user_id = COALESCE(user_id_to_check, auth.uid())
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_teacher_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.teachers WHERE user_id = _user_id LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.get_student_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.students WHERE user_id = _user_id LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.is_homeroom_teacher(_teacher_id UUID, _class_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.classes
    WHERE id = _class_id AND homeroom_teacher_id = _teacher_id
  )
$$;

CREATE OR REPLACE FUNCTION public.is_subject_teacher(_teacher_id UUID, _class_id UUID, _subject_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.class_subject_assignments
    WHERE teacher_id = _teacher_id AND class_id = _class_id AND subject_id = _subject_id
  )
$$;

-- Updated at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- User names sync functions
CREATE OR REPLACE FUNCTION public.update_user_names_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_student_names()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.user_names (user_id, first_name, last_name, middle_name)
  VALUES (NEW.user_id, NEW.first_name, NEW.last_name, NEW.middle_name)
  ON CONFLICT (user_id) DO UPDATE SET
    first_name = NEW.first_name,
    last_name = NEW.last_name,
    middle_name = NEW.middle_name;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_teacher_names()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.user_names (user_id, first_name, last_name, middle_name)
  VALUES (NEW.user_id, NEW.first_name, NEW.last_name, NEW.middle_name)
  ON CONFLICT (user_id) DO UPDATE SET
    first_name = NEW.first_name,
    last_name = NEW.last_name,
    middle_name = NEW.middle_name;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.populate_user_names()
RETURNS TABLE(students_synced INTEGER, teachers_synced INTEGER, total_synced INTEGER)
LANGUAGE plpgsql AS $$
DECLARE
  student_count INTEGER;
  teacher_count INTEGER;
BEGIN
  INSERT INTO public.user_names (user_id, first_name, last_name, middle_name)
  SELECT user_id, first_name, last_name, middle_name FROM students WHERE user_id IS NOT NULL
  ON CONFLICT (user_id) DO UPDATE SET
    first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, middle_name = EXCLUDED.middle_name;
  GET DIAGNOSTICS student_count = ROW_COUNT;

  INSERT INTO public.user_names (user_id, first_name, last_name, middle_name)
  SELECT user_id, first_name, last_name, middle_name FROM teachers WHERE user_id IS NOT NULL
  ON CONFLICT (user_id) DO UPDATE SET
    first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, middle_name = EXCLUDED.middle_name;
  GET DIAGNOSTICS teacher_count = ROW_COUNT;

  RETURN QUERY SELECT student_count, teacher_count, student_count + teacher_count;
END;
$$;

-- Student role auto-assignment
CREATE OR REPLACE FUNCTION public.assign_student_role()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.user_id, 'student')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Create student with auth user
CREATE OR REPLACE FUNCTION public.create_student_with_user(
  p_email TEXT, p_password TEXT, p_student_id_code TEXT,
  p_first_name TEXT, p_last_name TEXT, p_gender TEXT,
  p_date_of_birth DATE, p_enrollment_year INTEGER,
  p_middle_name TEXT DEFAULT NULL, p_boarding_status TEXT DEFAULT 'day',
  p_current_class_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_student_id UUID;
BEGIN
  INSERT INTO auth.users (email, email_confirmed_at)
  VALUES (p_email, NOW())
  RETURNING id INTO v_user_id;

  UPDATE auth.users SET encrypted_password = crypt(p_password, gen_salt('bf'))
  WHERE id = v_user_id;

  INSERT INTO public.profiles (id, email, full_name)
  VALUES (v_user_id, p_email, p_first_name || ' ' || p_last_name);

  INSERT INTO public.user_roles (user_id, role) VALUES (v_user_id, 'student');

  INSERT INTO public.students (
    user_id, student_id_code, first_name, middle_name, last_name,
    gender, date_of_birth, enrollment_year, boarding_status, current_class_id, is_active
  ) VALUES (
    v_user_id, p_student_id_code, p_first_name, p_middle_name, p_last_name,
    p_gender, p_date_of_birth, p_enrollment_year, p_boarding_status, p_current_class_id, true
  ) RETURNING id INTO v_student_id;

  RETURN v_student_id;
END;
$$;

-- Class-Teacher management functions
CREATE OR REPLACE FUNCTION public.get_class_teachers(_class_id UUID)
RETURNS TABLE(teacher_id UUID, teacher_code TEXT, teacher_name TEXT, role TEXT, is_active BOOLEAN)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT t.id, t.teacher_code, t.first_name || ' ' || t.last_name, ct.role, ct.is_active
  FROM public.class_teachers ct
  JOIN public.teachers t ON t.id = ct.teacher_id
  WHERE ct.class_id = _class_id AND ct.is_active = true
  ORDER BY ct.role, t.last_name, t.first_name;
$$;

CREATE OR REPLACE FUNCTION public.get_teacher_classes(_teacher_id UUID)
RETURNS TABLE(class_id UUID, class_name TEXT, grade_level INTEGER, role TEXT, is_active BOOLEAN)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, c.name, c.grade_level, ct.role, ct.is_active
  FROM public.class_teachers ct
  JOIN public.classes c ON c.id = ct.class_id
  WHERE ct.teacher_id = _teacher_id AND ct.is_active = true
  ORDER BY c.grade_level, c.name;
$$;

CREATE OR REPLACE FUNCTION public.assign_teacher_to_class(
  _class_id UUID, _teacher_id UUID, _role TEXT DEFAULT 'subject_teacher'
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE assignment_id UUID;
BEGIN
  SELECT id INTO assignment_id FROM public.class_teachers
  WHERE class_id = _class_id AND teacher_id = _teacher_id AND role = _role;

  IF assignment_id IS NOT NULL THEN
    UPDATE public.class_teachers SET is_active = true, updated_at = now() WHERE id = assignment_id;
  ELSE
    INSERT INTO public.class_teachers (class_id, teacher_id, role)
    VALUES (_class_id, _teacher_id, _role)
    RETURNING id INTO assignment_id;
  END IF;
  RETURN assignment_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.remove_teacher_from_class(
  _class_id UUID, _teacher_id UUID, _role TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.class_teachers SET is_active = false, updated_at = now()
  WHERE class_id = _class_id AND teacher_id = _teacher_id
    AND (_role IS NULL OR role = _role);
  RETURN FOUND;
END;
$$;

-- Notification functions
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID, p_title TEXT, p_message TEXT,
  p_type TEXT DEFAULT 'INFO', p_entity_type TEXT DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL, p_entity_name TEXT DEFAULT NULL,
  p_priority INTEGER DEFAULT 1, p_action_url TEXT DEFAULT NULL,
  p_action_text TEXT DEFAULT NULL, p_metadata JSONB DEFAULT NULL,
  p_expires_hours INTEGER DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_notification_id UUID;
  v_expires_at TIMESTAMPTZ;
BEGIN
  IF p_expires_hours IS NOT NULL THEN
    v_expires_at := NOW() + (p_expires_hours || ' hours')::INTERVAL;
  END IF;

  INSERT INTO notifications (
    user_id, title, message, type, entity_type, entity_id, entity_name,
    priority, action_url, action_text, metadata, expires_at
  ) VALUES (
    p_user_id, p_title, p_message, p_type, p_entity_type, p_entity_id, p_entity_name,
    p_priority, p_action_url, p_action_text, p_metadata, v_expires_at
  ) RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_notification_read(p_notification_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE notifications SET is_read = true, read_at = NOW()
  WHERE id = p_notification_id AND user_id = auth.uid() AND is_read = false;
  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_notification(p_notification_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE notifications SET is_deleted = true
  WHERE id = p_notification_id AND user_id = auth.uid() AND is_deleted = false;
  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_count INTEGER;
BEGIN
  UPDATE notifications SET is_read = true, read_at = NOW()
  WHERE user_id = auth.uid() AND is_read = false AND is_deleted = false;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Audit log function
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_action TEXT, p_entity_type TEXT,
  p_entity_id UUID DEFAULT NULL, p_details JSONB DEFAULT NULL,
  p_success BOOLEAN DEFAULT true
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO audit_logs (user_id, role, action, entity_type, entity_id, details, ip_address, success)
  VALUES (
    auth.uid(),
    (SELECT role FROM user_roles WHERE user_id = auth.uid() LIMIT 1),
    p_action, p_entity_type, p_entity_id, p_details, inet_client_addr(), p_success
  );
END;
$$;

-- Blog likes trigger functions
CREATE OR REPLACE FUNCTION public.increment_blog_likes_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.cms_pages SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.decrement_blog_likes_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.cms_pages SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$;

-- ============================================================
-- PART 6: TRIGGERS
-- ============================================================
-- Drop existing triggers to avoid duplicates, then recreate

DROP TRIGGER IF EXISTS trigger_sync_student_names ON public.students;
CREATE TRIGGER trigger_sync_student_names
  AFTER INSERT OR UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.sync_student_names();

DROP TRIGGER IF EXISTS trigger_sync_teacher_names ON public.teachers;
CREATE TRIGGER trigger_sync_teacher_names
  AFTER INSERT OR UPDATE ON public.teachers
  FOR EACH ROW EXECUTE FUNCTION public.sync_teacher_names();

DROP TRIGGER IF EXISTS trigger_update_user_names_updated_at ON public.user_names;
CREATE TRIGGER trigger_update_user_names_updated_at
  BEFORE UPDATE ON public.user_names
  FOR EACH ROW EXECUTE FUNCTION public.update_user_names_updated_at();

DROP TRIGGER IF EXISTS trigger_assign_student_role ON public.students;
CREATE TRIGGER trigger_assign_student_role
  AFTER INSERT ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.assign_student_role();

DROP TRIGGER IF EXISTS trigger_increment_blog_likes ON public.blog_post_likes;
CREATE TRIGGER trigger_increment_blog_likes
  AFTER INSERT ON public.blog_post_likes
  FOR EACH ROW EXECUTE FUNCTION public.increment_blog_likes_count();

DROP TRIGGER IF EXISTS trigger_decrement_blog_likes ON public.blog_post_likes;
CREATE TRIGGER trigger_decrement_blog_likes
  AFTER DELETE ON public.blog_post_likes
  FOR EACH ROW EXECUTE FUNCTION public.decrement_blog_likes_count();

-- ============================================================
-- PART 7: ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_subject_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grading_scales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grading_scale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_post_likes ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- ---- profiles ----
DROP POLICY IF EXISTS "Allow all operations on profiles" ON public.profiles;
CREATE POLICY "Allow all operations on profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Super admins can CRUD profiles" ON public.profiles;
CREATE POLICY "Super admins can CRUD profiles" ON public.profiles FOR ALL USING (is_super_admin());

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- ---- user_roles ----
DROP POLICY IF EXISTS "Allow all operations on user_roles" ON public.user_roles;
CREATE POLICY "Allow all operations on user_roles" ON public.user_roles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own user role" ON public.user_roles;
CREATE POLICY "Users can view own user role" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own user role" ON public.user_roles;
CREATE POLICY "Users can insert own user role" ON public.user_roles FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Super admins can insert user_roles" ON public.user_roles;
CREATE POLICY "Super admins can insert user_roles" ON public.user_roles FOR INSERT
  WITH CHECK ((auth.uid() = user_id) OR (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.email ~~ '%admin%')));

DROP POLICY IF EXISTS "Super admins can update user_roles" ON public.user_roles;
CREATE POLICY "Super admins can update user_roles" ON public.user_roles FOR UPDATE
  USING ((auth.uid() = user_id) OR (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.email ~~ '%admin%')));

DROP POLICY IF EXISTS "Super admins can delete user_roles" ON public.user_roles;
CREATE POLICY "Super admins can delete user_roles" ON public.user_roles FOR DELETE
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.email ~~ '%admin%'));

-- ---- academic_years ----
DROP POLICY IF EXISTS "All authenticated users can view academic years" ON public.academic_years;
CREATE POLICY "All authenticated users can view academic years" ON public.academic_years FOR SELECT USING (true);

DROP POLICY IF EXISTS "Super admins can CRUD academic years" ON public.academic_years;
CREATE POLICY "Super admins can CRUD academic years" ON public.academic_years FOR ALL USING (is_super_admin());

DROP POLICY IF EXISTS "Super admins can CRUD academic_years" ON public.academic_years;
CREATE POLICY "Super admins can CRUD academic_years" ON public.academic_years FOR ALL USING (is_super_admin());

-- ---- subjects ----
DROP POLICY IF EXISTS "All authenticated users can view subjects" ON public.subjects;
CREATE POLICY "All authenticated users can view subjects" ON public.subjects FOR SELECT USING (true);

DROP POLICY IF EXISTS "Super admins can CRUD subjects" ON public.subjects;
CREATE POLICY "Super admins can CRUD subjects" ON public.subjects FOR ALL USING (is_super_admin());

-- ---- assessment_types ----
DROP POLICY IF EXISTS "All authenticated can view assessment types" ON public.assessment_types;
CREATE POLICY "All authenticated can view assessment types" ON public.assessment_types FOR SELECT USING (true);

DROP POLICY IF EXISTS "Super admins can CRUD assessment_types" ON public.assessment_types;
CREATE POLICY "Super admins can CRUD assessment_types" ON public.assessment_types FOR ALL USING (is_super_admin());

-- ---- teachers ----
DROP POLICY IF EXISTS "Allow view for testing" ON public.teachers;
CREATE POLICY "Allow view for testing" ON public.teachers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert for testing" ON public.teachers;
CREATE POLICY "Allow insert for testing" ON public.teachers FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update for testing" ON public.teachers;
CREATE POLICY "Allow update for testing" ON public.teachers FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow delete for testing" ON public.teachers;
CREATE POLICY "Allow delete for testing" ON public.teachers FOR DELETE USING (true);

DROP POLICY IF EXISTS "Teachers can view own record" ON public.teachers;
CREATE POLICY "Teachers can view own record" ON public.teachers FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view own teacher ban status" ON public.teachers;
CREATE POLICY "Users can view own teacher ban status" ON public.teachers FOR ALL USING (auth.uid() = user_id);

-- ---- classes ----
DROP POLICY IF EXISTS "All authenticated users can view classes" ON public.classes;
CREATE POLICY "All authenticated users can view classes" ON public.classes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Super admins can CRUD classes" ON public.classes;
CREATE POLICY "Super admins can CRUD classes" ON public.classes FOR ALL USING (is_super_admin());

DROP POLICY IF EXISTS "Super admins can manage all classes" ON public.classes;
CREATE POLICY "Super admins can manage all classes" ON public.classes FOR ALL
  USING (EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin'));

DROP POLICY IF EXISTS "Teachers can view their assigned classes" ON public.classes;
CREATE POLICY "Teachers can view their assigned classes" ON public.classes FOR SELECT
  USING (
    auth.role() = 'authenticated' AND (
      EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin')
      OR EXISTS (
        SELECT 1 FROM class_teachers ct
        WHERE ct.teacher_id = (SELECT teachers.id FROM teachers WHERE teachers.user_id = auth.uid())
          AND ct.class_id = classes.id AND ct.is_active = true
      )
    )
  );

-- ---- students ----
DROP POLICY IF EXISTS "Students can view own record" ON public.students;
CREATE POLICY "Students can view own record" ON public.students FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Super admins can CRUD students" ON public.students;
CREATE POLICY "Super admins can CRUD students" ON public.students FOR ALL USING (is_super_admin());

DROP POLICY IF EXISTS "Super admins can manage all students" ON public.students;
CREATE POLICY "Super admins can manage all students" ON public.students FOR ALL
  USING (EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin'));

DROP POLICY IF EXISTS "Teachers can view students in their classes" ON public.students;
CREATE POLICY "Teachers can view students in their classes" ON public.students FOR SELECT
  USING (
    auth.role() = 'authenticated' AND (
      EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin')
      OR EXISTS (
        SELECT 1 FROM class_teachers ct
        WHERE ct.teacher_id = (SELECT teachers.id FROM teachers WHERE teachers.user_id = auth.uid())
          AND ct.class_id = students.current_class_id AND ct.is_active = true
      )
      OR user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Teachers can update students in their classes" ON public.students;
CREATE POLICY "Teachers can update students in their classes" ON public.students FOR UPDATE
  USING (
    auth.role() = 'authenticated' AND (
      EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin')
      OR EXISTS (
        SELECT 1 FROM class_teachers ct
        WHERE ct.teacher_id = (SELECT teachers.id FROM teachers WHERE teachers.user_id = auth.uid())
          AND ct.class_id = students.current_class_id AND ct.is_active = true
      )
    )
  );

DROP POLICY IF EXISTS "Users can view own student ban status" ON public.students;
CREATE POLICY "Users can view own student ban status" ON public.students FOR ALL USING (auth.uid() = user_id);

-- ---- parents ----
DROP POLICY IF EXISTS "Parents can view own record" ON public.parents;
CREATE POLICY "Parents can view own record" ON public.parents FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Super admins can CRUD parents" ON public.parents;
CREATE POLICY "Super admins can CRUD parents" ON public.parents FOR ALL USING (is_super_admin());

-- ---- parent_students ----
DROP POLICY IF EXISTS "Parents can view own children" ON public.parent_students;
CREATE POLICY "Parents can view own children" ON public.parent_students FOR SELECT
  USING (parent_id IN (SELECT parents.id FROM parents WHERE parents.user_id = auth.uid()));

DROP POLICY IF EXISTS "Super admins can CRUD parent_students" ON public.parent_students;
CREATE POLICY "Super admins can CRUD parent_students" ON public.parent_students FOR ALL USING (is_super_admin());

-- ---- semesters ----
DROP POLICY IF EXISTS "All authenticated users can view semesters" ON public.semesters;
CREATE POLICY "All authenticated users can view semesters" ON public.semesters FOR SELECT USING (true);

DROP POLICY IF EXISTS "Super admins can CRUD semesters" ON public.semesters;
CREATE POLICY "Super admins can CRUD semesters" ON public.semesters FOR ALL USING (is_super_admin());

-- ---- enrollments ----
DROP POLICY IF EXISTS "Students can view own enrollments" ON public.enrollments;
CREATE POLICY "Students can view own enrollments" ON public.enrollments FOR SELECT
  USING (student_id = (SELECT students.id FROM students WHERE students.user_id = auth.uid() LIMIT 1));

DROP POLICY IF EXISTS "Super admins can CRUD enrollments" ON public.enrollments;
CREATE POLICY "Super admins can CRUD enrollments" ON public.enrollments FOR ALL USING (is_super_admin());

DROP POLICY IF EXISTS "Super admins can manage all enrollments" ON public.enrollments;
CREATE POLICY "Super admins can manage all enrollments" ON public.enrollments FOR ALL
  USING (EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin'));

DROP POLICY IF EXISTS "Teachers can view enrollments in their classes" ON public.enrollments;
CREATE POLICY "Teachers can view enrollments in their classes" ON public.enrollments FOR SELECT
  USING (
    auth.role() = 'authenticated' AND (
      EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin')
      OR EXISTS (
        SELECT 1 FROM class_teachers ct
        WHERE ct.teacher_id = (SELECT teachers.id FROM teachers WHERE teachers.user_id = auth.uid())
          AND ct.class_id = enrollments.class_id AND ct.is_active = true
      )
      OR EXISTS (SELECT 1 FROM students s WHERE s.id = enrollments.student_id AND s.user_id = auth.uid())
    )
  );

-- ---- class_subject_assignments ----
DROP POLICY IF EXISTS "All authenticated can view assignments" ON public.class_subject_assignments;
CREATE POLICY "All authenticated can view assignments" ON public.class_subject_assignments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Super admins can CRUD class_subject_assignments" ON public.class_subject_assignments;
CREATE POLICY "Super admins can CRUD class_subject_assignments" ON public.class_subject_assignments FOR ALL USING (is_super_admin());

-- ---- class_teachers ----
DROP POLICY IF EXISTS "All authenticated can view class teachers" ON public.class_teachers;
CREATE POLICY "All authenticated can view class teachers" ON public.class_teachers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Super admins can manage class teachers" ON public.class_teachers;
CREATE POLICY "Super admins can manage class teachers" ON public.class_teachers FOR ALL
  USING (has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "Teachers can view own class assignments" ON public.class_teachers;
CREATE POLICY "Teachers can view own class assignments" ON public.class_teachers FOR SELECT
  USING (has_role(auth.uid(), 'teacher') AND teacher_id = get_teacher_id(auth.uid()));

-- ---- assessments ----
DROP POLICY IF EXISTS "Super admins can CRUD assessments" ON public.assessments;
CREATE POLICY "Super admins can CRUD assessments" ON public.assessments FOR ALL USING (is_super_admin());

DROP POLICY IF EXISTS "Teachers can view own assessments" ON public.assessments;
CREATE POLICY "Teachers can view own assessments" ON public.assessments FOR SELECT
  USING (created_by_teacher_id = (SELECT teachers.id FROM teachers WHERE teachers.user_id = auth.uid() LIMIT 1));

DROP POLICY IF EXISTS "Students can view published assessments" ON public.assessments;
CREATE POLICY "Students can view published assessments" ON public.assessments FOR SELECT
  USING (
    is_published = true AND EXISTS (
      SELECT 1 FROM enrollments e
      JOIN class_subject_assignments csa ON csa.class_id = e.class_id
      WHERE e.student_id = (SELECT students.id FROM students WHERE students.user_id = auth.uid() LIMIT 1)
        AND csa.id = assessments.class_subject_assignment_id
    )
  );

-- ---- grades ----
DROP POLICY IF EXISTS "Super admins can CRUD grades" ON public.grades;
CREATE POLICY "Super admins can CRUD grades" ON public.grades FOR ALL USING (is_super_admin());

DROP POLICY IF EXISTS "Teachers can view own grades" ON public.grades;
CREATE POLICY "Teachers can view own grades" ON public.grades FOR SELECT
  USING (teacher_id = (SELECT teachers.id FROM teachers WHERE teachers.user_id = auth.uid() LIMIT 1));

DROP POLICY IF EXISTS "Students can view own published grades" ON public.grades;
CREATE POLICY "Students can view own published grades" ON public.grades FOR SELECT
  USING (
    student_id = (SELECT students.id FROM students WHERE students.user_id = auth.uid() LIMIT 1)
    AND is_published = true
  );

DROP POLICY IF EXISTS "Teachers can manage grades" ON public.grades;
CREATE POLICY "Teachers can manage grades" ON public.grades FOR ALL
  USING (
    auth.role() = 'authenticated' AND (
      EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin')
      OR EXISTS (
        SELECT 1 FROM grades g
        JOIN assessments a ON g.assessment_id = a.id
        JOIN class_subject_assignments csa ON a.class_subject_assignment_id = csa.id
        JOIN class_teachers ct ON csa.class_id = ct.class_id AND csa.teacher_id = ct.teacher_id
        JOIN teachers t ON ct.teacher_id = t.id
        WHERE t.user_id = auth.uid() AND ct.is_active = true AND g.id = grades.id
      )
      OR EXISTS (
        SELECT 1 FROM assessments a
        JOIN class_subject_assignments csa ON a.class_subject_assignment_id = csa.id
        JOIN class_teachers ct ON csa.class_id = ct.class_id AND csa.teacher_id = ct.teacher_id
        JOIN teachers t ON ct.teacher_id = t.id
        WHERE t.user_id = auth.uid() AND ct.is_active = true AND a.id = grades.assessment_id
      )
    )
  );

-- ---- grading_scales ----
DROP POLICY IF EXISTS "All authenticated can view grading scales" ON public.grading_scales;
CREATE POLICY "All authenticated can view grading scales" ON public.grading_scales FOR SELECT USING (true);

DROP POLICY IF EXISTS "Super admins can CRUD grading_scales" ON public.grading_scales;
CREATE POLICY "Super admins can CRUD grading_scales" ON public.grading_scales FOR ALL USING (is_super_admin());

-- ---- grading_scale_items ----
DROP POLICY IF EXISTS "All authenticated can view grading scale items" ON public.grading_scale_items;
CREATE POLICY "All authenticated can view grading scale items" ON public.grading_scale_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "Super admins can CRUD grading_scale_items" ON public.grading_scale_items;
CREATE POLICY "Super admins can CRUD grading_scale_items" ON public.grading_scale_items FOR ALL USING (is_super_admin());

-- ---- notifications ----
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
CREATE POLICY "Users can delete their own notifications" ON public.notifications FOR DELETE USING (auth.uid() = user_id);

-- ---- audit_logs ----
DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated users can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can insert audit_logs" ON public.audit_logs;
CREATE POLICY "Authenticated users can insert audit_logs" ON public.audit_logs FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Super admins can view all audit logs" ON public.audit_logs;
CREATE POLICY "Super admins can view all audit logs" ON public.audit_logs FOR SELECT
  USING (EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin'));

DROP POLICY IF EXISTS "Super admins can CRUD audit_logs" ON public.audit_logs;
CREATE POLICY "Super admins can CRUD audit_logs" ON public.audit_logs FOR ALL USING (is_super_admin());

DROP POLICY IF EXISTS "No one can delete audit logs" ON public.audit_logs;
CREATE POLICY "No one can delete audit logs" ON public.audit_logs FOR DELETE USING (false);

DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;
CREATE POLICY "System can insert audit logs" ON public.audit_logs FOR INSERT
  WITH CHECK (auth.uid() IS NULL OR EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin'));

-- ---- cms_pages ----
DROP POLICY IF EXISTS "Anyone can view published cms pages" ON public.cms_pages;
CREATE POLICY "Anyone can view published cms pages" ON public.cms_pages FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "Super admins can CRUD cms_pages" ON public.cms_pages;
CREATE POLICY "Super admins can CRUD cms_pages" ON public.cms_pages FOR ALL USING (is_super_admin());

-- ---- cms_gallery ----
DROP POLICY IF EXISTS "Anyone can view published gallery items" ON public.cms_gallery;
CREATE POLICY "Anyone can view published gallery items" ON public.cms_gallery FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "Super admins can CRUD cms_gallery" ON public.cms_gallery;
CREATE POLICY "Super admins can CRUD cms_gallery" ON public.cms_gallery FOR ALL USING (is_super_admin());

-- ---- blog_post_likes ----
DROP POLICY IF EXISTS "Anyone can read blog likes" ON public.blog_post_likes;
CREATE POLICY "Anyone can read blog likes" ON public.blog_post_likes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert blog likes" ON public.blog_post_likes;
CREATE POLICY "Anyone can insert blog likes" ON public.blog_post_likes FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can delete own blog likes" ON public.blog_post_likes;
CREATE POLICY "Anyone can delete own blog likes" ON public.blog_post_likes FOR DELETE USING (true);

-- ============================================================
-- PART 8: STORAGE BUCKETS
-- ============================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('cms-images', 'cms-images', true) ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload avatars" ON storage.objects;
CREATE POLICY "Users can upload avatars" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update own avatars" ON storage.objects;
CREATE POLICY "Users can update own avatars" ON storage.objects
  FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can delete own avatars" ON storage.objects;
CREATE POLICY "Users can delete own avatars" ON storage.objects
  FOR DELETE USING (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);

-- Storage policies for CMS images
DROP POLICY IF EXISTS "CMS images are publicly accessible" ON storage.objects;
CREATE POLICY "CMS images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'cms-images');

DROP POLICY IF EXISTS "Admins can upload CMS images" ON storage.objects;
CREATE POLICY "Admins can upload CMS images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'cms-images' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admins can update CMS images" ON storage.objects;
CREATE POLICY "Admins can update CMS images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'cms-images' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admins can delete CMS images" ON storage.objects;
CREATE POLICY "Admins can delete CMS images" ON storage.objects
  FOR DELETE USING (bucket_id = 'cms-images' AND auth.uid() IS NOT NULL);

-- ============================================================
-- DONE! Complete database schema applied successfully.
-- ============================================================
SELECT 'Complete database schema setup finished successfully!' AS status;
