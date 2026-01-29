-- Create class_teachers junction table for many-to-many relationship
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

-- Add indexes for performance
CREATE INDEX idx_class_teachers_class_id ON public.class_teachers(class_id);
CREATE INDEX idx_class_teachers_teacher_id ON public.class_teachers(teacher_id);
CREATE INDEX idx_class_teachers_active ON public.class_teachers(is_active);

-- Enable Row Level Security
ALTER TABLE public.class_teachers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for class_teachers
CREATE POLICY "All authenticated can view class teachers" ON public.class_teachers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admins can manage class teachers" ON public.class_teachers FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Teachers can view own class assignments" ON public.class_teachers FOR SELECT USING (
  public.has_role(auth.uid(), 'teacher') AND teacher_id = public.get_teacher_id(auth.uid())
);

-- Add updated_at trigger
CREATE TRIGGER update_class_teachers_updated_at BEFORE UPDATE ON public.class_teachers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Helper function to get all teachers for a class
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

-- Helper function to get all classes for a teacher
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

-- Function to assign teacher to class
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

-- Function to remove teacher from class
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
