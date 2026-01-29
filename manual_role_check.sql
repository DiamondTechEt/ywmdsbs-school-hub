-- Manual check and fix for the specific user ID
-- User ID: 9ea87907-1650-4457-a557-87da398a0735

-- First, let's see what's in the user_roles table for this user
SELECT * FROM public.user_roles WHERE user_id = '9ea87907-1650-4457-a557-87da398a0735';

-- Check if this user exists in auth.users (run this in Supabase dashboard)
-- SELECT id, email FROM auth.users WHERE id = '9ea87907-1650-4457-a557-87da398a0735';

-- Check if this user has a profile
SELECT * FROM public.profiles WHERE id = '9ea87907-1650-4457-a557-87da398a0735';

-- If the role doesn't exist, insert it
INSERT INTO public.user_roles (user_id, role) 
VALUES ('9ea87907-1650-4457-a557-87da398a0735', 'super_admin')
ON CONFLICT (user_id, role) DO UPDATE SET role = 'super_admin';

-- Verify the role was inserted
SELECT * FROM public.user_roles WHERE user_id = '9ea87907-1650-4457-a557-87da398a0735';

-- Test if the user can now read their own role (this should work after applying the RLS fix)
SELECT role FROM public.user_roles WHERE user_id = '9ea87907-1650-4457-a557-87da398a0735';
