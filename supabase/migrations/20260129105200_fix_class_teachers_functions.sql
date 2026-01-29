-- Drop existing functions first to avoid return type conflicts
DROP FUNCTION IF EXISTS public.get_class_teachers(uuid);
DROP FUNCTION IF EXISTS public.get_teacher_classes(uuid);
DROP FUNCTION IF EXISTS public.assign_teacher_to_class(uuid, uuid, uuid, text);
DROP FUNCTION IF EXISTS public.remove_teacher_from_class(uuid, uuid, uuid, text);

-- Recreate the get_class_teachers function with subject information
CREATE OR REPLACE FUNCTION public.get_class_teachers(_class_id uuid)
RETURNS TABLE (
  teacher_id uuid,
  teacher_code text,
  teacher_name text,
  subject_id uuid,
  subject_name text,
  subject_code text,
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
    s.id as subject_id,
    s.name as subject_name,
    s.code as subject_code,
    ct.role,
    ct.is_active
  FROM public.class_teachers ct
  JOIN public.teachers t ON t.id = ct.teacher_id
  LEFT JOIN public.subjects s ON s.id = ct.subject_id
  WHERE ct.class_id = _class_id AND ct.is_active = true
  ORDER BY ct.role, s.name, t.last_name, t.first_name;
$$;

-- Recreate the get_teacher_classes function with subject information
CREATE OR REPLACE FUNCTION public.get_teacher_classes(_teacher_id uuid)
RETURNS TABLE (
  class_id uuid,
  class_name text,
  grade_level integer,
  subject_id uuid,
  subject_name text,
  subject_code text,
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
    s.id as subject_id,
    s.name as subject_name,
    s.code as subject_code,
    ct.role,
    ct.is_active
  FROM public.class_teachers ct
  JOIN public.classes c ON c.id = ct.class_id
  LEFT JOIN public.subjects s ON s.id = ct.subject_id
  WHERE ct.teacher_id = _teacher_id AND ct.is_active = true
  ORDER BY c.grade_level, c.name, s.name;
$$;

-- Recreate the assign_teacher_to_class function with subject parameter
CREATE OR REPLACE FUNCTION public.assign_teacher_to_class(
  _class_id uuid,
  _teacher_id uuid,
  _subject_id uuid DEFAULT NULL,
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
  WHERE class_id = _class_id 
    AND teacher_id = _teacher_id 
    AND (subject_id = _subject_id OR (subject_id IS NULL AND _subject_id IS NULL));
  
  IF assignment_id IS NOT NULL THEN
    -- Reactivate existing assignment
    UPDATE public.class_teachers 
    SET is_active = true, 
        subject_id = _subject_id,
        updated_at = now()
    WHERE id = assignment_id;
  ELSE
    -- Create new assignment
    INSERT INTO public.class_teachers (class_id, teacher_id, subject_id, role)
    VALUES (_class_id, _teacher_id, _subject_id, _role)
    RETURNING id INTO assignment_id;
  END IF;
  
  RETURN assignment_id;
END;
$$;

-- Recreate the remove_teacher_from_class function with subject parameter
CREATE OR REPLACE FUNCTION public.remove_teacher_from_class(
  _class_id uuid,
  _teacher_id uuid,
  _subject_id uuid DEFAULT NULL,
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
    AND (subject_id = _subject_id OR (subject_id IS NULL AND _subject_id IS NULL))
    AND (_role IS NULL OR role = _role);
  
  RETURN FOUND;
END;
$$;
