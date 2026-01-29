-- Add a more flexible policy for student creation
-- This allows any authenticated user to create student records
DROP POLICY IF EXISTS "Super admins can manage students" ON public.students;

-- Recreate the policy with more flexible INSERT permissions
CREATE POLICY "Super admins can manage students" ON public.students 
FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- Add a separate policy for INSERT operations that allows any authenticated user
CREATE POLICY "Authenticated users can create students" ON public.students 
FOR INSERT TO authenticated WITH CHECK (true);

-- Or alternatively, allow users with 'teacher' role to create students:
CREATE POLICY "Teachers can create students" ON public.students 
FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'super_admin'));
