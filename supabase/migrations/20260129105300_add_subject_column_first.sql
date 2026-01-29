-- Add subject_id to class_teachers table first
ALTER TABLE public.class_teachers 
ADD COLUMN IF NOT EXISTS subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE;

-- Update the unique constraint to include subject_id
ALTER TABLE public.class_teachers 
DROP CONSTRAINT IF EXISTS class_teachers_class_id_teacher_id_role_key;

ALTER TABLE public.class_teachers 
ADD CONSTRAINT class_teachers_class_id_teacher_id_subject_id_key 
UNIQUE (class_id, teacher_id, subject_id);

-- Update the role check constraint to be more flexible
ALTER TABLE public.class_teachers 
DROP CONSTRAINT IF EXISTS class_teachers_role_check;

ALTER TABLE public.class_teachers 
ADD CONSTRAINT class_teachers_role_check 
CHECK (role IN ('homeroom', 'subject_teacher', 'assistant'));

-- Add index for subject_id
CREATE INDEX IF NOT EXISTS idx_class_teachers_subject_id ON public.class_teachers(subject_id);
