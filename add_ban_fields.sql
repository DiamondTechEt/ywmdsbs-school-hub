-- Add ban fields to students and teachers tables
-- Run this in Supabase SQL Editor

-- Add ban fields to students table
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS is_banned BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS banned_by UUID REFERENCES public.teachers(id),
ADD COLUMN IF NOT EXISTS ban_reason TEXT,
ADD COLUMN IF NOT EXISTS ban_notes TEXT;

-- Add ban fields to teachers table  
ALTER TABLE public.teachers
ADD COLUMN IF NOT EXISTS is_banned BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS banned_by UUID REFERENCES public.teachers(id),
ADD COLUMN IF NOT EXISTS ban_reason TEXT,
ADD COLUMN IF NOT EXISTS ban_notes TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_students_is_banned ON public.students(is_banned);
CREATE INDEX IF NOT EXISTS idx_teachers_is_banned ON public.teachers(is_banned);

-- Create RLS policies for ban fields (only if RLS is enabled)
-- These policies allow users to see their own ban status
-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view own student ban status" ON public.students;
DROP POLICY IF EXISTS "Users can view own teacher ban status" ON public.teachers;

-- Create new policies
CREATE POLICY "Users can view own student ban status" ON public.students
USING (auth.uid() = user_id);

CREATE POLICY "Users can view own teacher ban status" ON public.teachers  
USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT ALL ON public.students TO authenticated;
GRANT ALL ON public.teachers TO authenticated;
