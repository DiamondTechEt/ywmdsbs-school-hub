-- Assign super_admin role to your user (replace with your actual user ID)
-- First, check your current user ID by running:
-- SELECT auth.uid();

-- Then insert the super_admin role (replace YOUR_USER_ID with the actual UUID):
INSERT INTO public.user_roles (user_id, role) 
VALUES ('YOUR_USER_ID', 'super_admin')
ON CONFLICT (user_id, role) DO NOTHING;
