-- PowerPod Admin Setup Script
-- Run this after setup.sql to create admin user

-- Create admin user (replace with actual auth.users id after signup)
-- First, user must sign up via the app, then update their role here

-- Example: Make a user with email 'martinezkaponda@gmail.com' an admin
-- UPDATE public.user_roles SET role = 'admin' WHERE user_id = 'their-uuid';

-- Or call this function after user creation:
-- SELECT public.add_admin_role('user-uuid-here');

-- Function to add admin role
CREATE OR REPLACE FUNCTION public.add_admin_role(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

-- Grant execute permission (only admins should be able to call this)
-- Note: This should be secured in production

SELECT 'Admin setup functions created!' as status;