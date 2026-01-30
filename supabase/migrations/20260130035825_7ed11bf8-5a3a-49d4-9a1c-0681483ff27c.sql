-- Add avatar_url, phone columns to tables that need them for profile system
ALTER TABLE public.teachers 
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS avatar_url text;

ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS avatar_url text;

-- Create a storage bucket for profile avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for avatars bucket
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add parent role to app_role enum
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'parent' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'app_role')
  ) THEN
    ALTER TYPE app_role ADD VALUE 'parent';
  END IF;
END$$;

-- Create parents table
CREATE TABLE IF NOT EXISTS public.parents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  middle_name TEXT,
  last_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create parent_student relationship table
CREATE TABLE IF NOT EXISTS public.parent_students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id UUID REFERENCES public.parents(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  relationship TEXT NOT NULL DEFAULT 'parent',
  is_primary BOOLEAN DEFAULT FALSE,
  can_view_grades BOOLEAN DEFAULT TRUE,
  can_view_attendance BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(parent_id, student_id)
);

-- Enable RLS on new tables
ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_students ENABLE ROW LEVEL SECURITY;

-- RLS for parents table
CREATE POLICY "Parents can view own record"
ON public.parents FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Super admins can CRUD parents"
ON public.parents FOR ALL
USING (is_super_admin());

-- RLS for parent_students table  
CREATE POLICY "Parents can view own children"
ON public.parent_students FOR SELECT
USING (parent_id IN (SELECT id FROM parents WHERE user_id = auth.uid()));

CREATE POLICY "Super admins can CRUD parent_students"
ON public.parent_students FOR ALL
USING (is_super_admin());