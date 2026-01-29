-- Corrected Student Role Assignment System (without updated_at column)
-- Run this in Supabase SQL Editor

-- 1. Create function to assign student role (corrected version)
CREATE OR REPLACE FUNCTION assign_student_role()
RETURNS TRIGGER AS $$
BEGIN
    -- Validate that user_id is not null
    IF NEW.user_id IS NULL THEN
        RAISE EXCEPTION 'Student user_id cannot be null';
    END IF;
    
    -- Insert or update user role to 'student' (without updated_at)
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, 'student')
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        role = 'student';
    
    -- Log the action
    RAISE NOTICE 'Student role assigned to user_id: %', NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Create trigger for new students
DROP TRIGGER IF EXISTS auto_assign_student_role_trigger ON public.students;
CREATE TRIGGER auto_assign_student_role_trigger
    AFTER INSERT ON public.students
    FOR EACH ROW
    EXECUTE FUNCTION assign_student_role();

-- 3. Create function to handle user_id updates
CREATE OR REPLACE FUNCTION update_student_role()
RETURNS TRIGGER AS $$
BEGIN
    -- If user_id changed, update the role assignment
    IF OLD.user_id IS DISTINCT FROM NEW.user_id THEN
        -- Remove old role assignment
        DELETE FROM public.user_roles WHERE user_id = OLD.user_id;
        
        -- Add new role assignment
        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.user_id, 'student')
        ON CONFLICT (user_id) 
        DO UPDATE SET 
            role = 'student';
            
        RAISE NOTICE 'Student role updated from user_id: % to user_id: %', OLD.user_id, NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create trigger for updates
DROP TRIGGER IF EXISTS update_student_role_trigger ON public.students;
CREATE TRIGGER update_student_role_trigger
    AFTER UPDATE OF user_id ON public.students
    FOR EACH ROW
    EXECUTE FUNCTION update_student_role();

-- 5. Create function to handle student deletion
CREATE OR REPLACE FUNCTION cleanup_student_role()
RETURNS TRIGGER AS $$
BEGIN
    -- Remove role assignment when student is deleted
    DELETE FROM public.user_roles WHERE user_id = OLD.user_id;
    
    RAISE NOTICE 'Student role removed for deleted user_id: %', OLD.user_id;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 6. Create trigger for deletion
DROP TRIGGER IF EXISTS cleanup_student_role_trigger ON public.students;
CREATE TRIGGER cleanup_student_role_trigger
    AFTER DELETE ON public.students
    FOR EACH ROW
    EXECUTE FUNCTION cleanup_student_role();

-- 7. Fix existing students (corrected version)
SELECT 'Fixing existing students without student roles' as action;

-- First, let's see how many students need fixing
SELECT 'Students needing role assignment' as status;
SELECT 
    COUNT(*) as students_needing_role
FROM students s
LEFT JOIN user_roles ur ON s.user_id = ur.user_id
WHERE ur.user_id IS NULL OR ur.role != 'student';

-- Now fix them
INSERT INTO public.user_roles (user_id, role)
SELECT s.user_id, 'student'
FROM students s
LEFT JOIN user_roles ur ON s.user_id = ur.user_id
WHERE ur.user_id IS NULL OR ur.role != 'student'
ON CONFLICT (user_id) 
DO UPDATE SET 
    role = 'student';

-- 8. Verify the fix
SELECT 'Verification - All students should now have student role' as verification;
SELECT 
    'Total Students' as metric,
    COUNT(*) as count
FROM students
UNION ALL
SELECT 
    'Students with Student Role' as metric,
    COUNT(*) as count
FROM user_roles ur
JOIN students s ON ur.user_id = s.user_id
WHERE ur.role = 'student'
UNION ALL
SELECT 
    'Users with Student Role (total)' as metric,
    COUNT(*) as count
FROM user_roles 
WHERE role = 'student';

SELECT 'Corrected student role system is now active!' as final_status;
SELECT 'New students will automatically get student role' as description;
SELECT 'Existing students have been fixed' as existing_status;
