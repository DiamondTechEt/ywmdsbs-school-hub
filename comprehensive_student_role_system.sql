-- Comprehensive Student Role Assignment System
-- Run this in Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create or update the function with better error handling
CREATE OR REPLACE FUNCTION assign_student_role()
RETURNS TRIGGER AS $$
BEGIN
    -- Validate that user_id is not null
    IF NEW.user_id IS NULL THEN
        RAISE EXCEPTION 'Student user_id cannot be null';
    END IF;
    
    -- Insert or update user role to 'student'
    INSERT INTO public.user_roles (user_id, role, created_at, updated_at)
    VALUES (NEW.user_id, 'student', NOW(), NOW())
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        role = 'student',
        updated_at = NOW();
    
    -- Log the action (optional - you can create an audit table if needed)
    RAISE NOTICE 'Student role assigned to user_id: %', NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Create trigger with proper error handling
DROP TRIGGER IF EXISTS auto_assign_student_role_trigger ON public.students;
CREATE TRIGGER auto_assign_student_role_trigger
    AFTER INSERT ON public.students
    FOR EACH ROW
    EXECUTE FUNCTION assign_student_role();

-- 3. Create function to handle updates (in case user_id changes)
CREATE OR REPLACE FUNCTION update_student_role()
RETURNS TRIGGER AS $$
BEGIN
    -- If user_id changed, update the role assignment
    IF OLD.user_id IS DISTINCT FROM NEW.user_id THEN
        -- Remove old role assignment
        DELETE FROM public.user_roles WHERE user_id = OLD.user_id;
        
        -- Add new role assignment
        INSERT INTO public.user_roles (user_id, role, created_at, updated_at)
        VALUES (NEW.user_id, 'student', NOW(), NOW())
        ON CONFLICT (user_id) 
        DO UPDATE SET 
            role = 'student',
            updated_at = NOW();
            
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

-- 5. Create function to handle student deletion (optional cleanup)
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

-- 7. Create a function to manually fix existing students
CREATE OR REPLACE FUNCTION fix_all_student_roles()
RETURNS TABLE(
    fixed_count INTEGER,
    total_students INTEGER,
    message TEXT
) AS $$
DECLARE
    total_count INTEGER;
    fixed_count INTEGER;
BEGIN
    -- Count total students
    SELECT COUNT(*) INTO total_count FROM students;
    
    -- Fix students without proper roles
    INSERT INTO public.user_roles (user_id, role, created_at, updated_at)
    SELECT s.user_id, 'student', NOW(), NOW()
    FROM students s
    LEFT JOIN user_roles ur ON s.user_id = ur.user_id
    WHERE ur.user_id IS NULL OR ur.role != 'student'
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        role = 'student',
        updated_at = NOW();
    
    GET DIAGNOSTICS fixed_count = ROW_COUNT;
    
    RETURN QUERY SELECT 
        fixed_count, 
        total_count, 
        'Fixed ' || fixed_count || ' out of ' || total_count || ' students'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- 8. Run the fix for existing students
SELECT * FROM fix_all_student_roles();

-- 9. Verify the system is working
SELECT 'System verification' as status;
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
    'Users with Student Role (should match above)' as metric,
    COUNT(*) as count
FROM user_roles 
WHERE role = 'student';

SELECT 'Comprehensive student role system is now active!' as final_status;
SELECT 'New students will automatically get student role' as description;
SELECT 'Existing students have been fixed' as existing_status;
