-- RLS policies for teacher student management
-- Teachers can only view and update students in their assigned classes

-- Drop existing student policies that might conflict
DROP POLICY IF EXISTS "Students can view own data" ON public.students;
DROP POLICY IF EXISTS "Teachers can view student data" ON public.students;
DROP POLICY IF EXISTS "Super admins can manage students" ON public.students;
DROP POLICY IF EXISTS "Enable all for authenticated" ON public.students;

-- Create comprehensive RLS policies for students
CREATE POLICY "Super admins can manage all students" ON public.students
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin'
        )
    );

CREATE POLICY "Teachers can view students in their classes" ON public.students
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            -- Super admins can see all
            EXISTS (
                SELECT 1 FROM public.user_roles ur
                WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin'
            )
            OR
            -- Teachers can see students in their assigned classes
            EXISTS (
                SELECT 1 FROM public.class_teachers ct
                WHERE ct.teacher_id = (
                    SELECT id FROM public.teachers WHERE user_id = auth.uid()
                )
                AND ct.class_id = students.current_class_id
                AND ct.is_active = true
            )
            OR
            -- Students can view their own data
            students.user_id = auth.uid()
        )
    );

CREATE POLICY "Teachers can update students in their classes" ON public.students
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND (
            -- Super admins can update all
            EXISTS (
                SELECT 1 FROM public.user_roles ur
                WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin'
            )
            OR
            -- Teachers can update students in their assigned classes
            EXISTS (
                SELECT 1 FROM public.class_teachers ct
                WHERE ct.teacher_id = (
                    SELECT id FROM public.teachers WHERE user_id = auth.uid()
                )
                AND ct.class_id = students.current_class_id
                AND ct.is_active = true
            )
        )
    );

-- Ensure RLS is enabled
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Also create policies for enrollments to ensure teachers can see enrollment data
DROP POLICY IF EXISTS "Enable all for authenticated" ON public.enrollments;

CREATE POLICY "Super admins can manage all enrollments" ON public.enrollments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin'
        )
    );

CREATE POLICY "Teachers can view enrollments in their classes" ON public.enrollments
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            -- Super admins can see all
            EXISTS (
                SELECT 1 FROM public.user_roles ur
                WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin'
            )
            OR
            -- Teachers can see enrollments in their assigned classes
            EXISTS (
                SELECT 1 FROM public.class_teachers ct
                WHERE ct.teacher_id = (
                    SELECT id FROM public.teachers WHERE user_id = auth.uid()
                )
                AND ct.class_id = enrollments.class_id
                AND ct.is_active = true
            )
            OR
            -- Students can view their own enrollments
            EXISTS (
                SELECT 1 FROM public.students s
                WHERE s.id = enrollments.student_id AND s.user_id = auth.uid()
            )
        )
    );

-- Ensure RLS is enabled for enrollments
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- Create policies for classes to ensure teachers can see class information
DROP POLICY IF EXISTS "Enable all for authenticated" ON public.classes;

CREATE POLICY "Super admins can manage all classes" ON public.classes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin'
        )
    );

CREATE POLICY "Teachers can view their assigned classes" ON public.classes
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            -- Super admins can see all
            EXISTS (
                SELECT 1 FROM public.user_roles ur
                WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin'
            )
            OR
            -- Teachers can see their assigned classes
            EXISTS (
                SELECT 1 FROM public.class_teachers ct
                WHERE ct.teacher_id = (
                    SELECT id FROM public.teachers WHERE user_id = auth.uid()
                )
                AND ct.class_id = classes.id
                AND ct.is_active = true
            )
        )
    );

-- Ensure RLS is enabled for classes
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
