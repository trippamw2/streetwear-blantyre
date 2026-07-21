-- Fix infinite recursion in user_roles policies
-- Run in Supabase SQL Editor

-- Drop all user_roles policies (order matters - drop depending first)
DROP POLICY IF EXISTS "Users read own role" ON user_roles;
DROP POLICY IF EXISTS "Admins manage roles" ON user_roles;
DROP POLICY IF EXISTS "Admins read all roles" ON user_roles;
DROP POLICY IF EXISTS "Users read own roles" ON user_roles;
DROP POLICY IF EXISTS "Anon user_roles" ON user_roles;
DROP POLICY IF EXISTS "Users read own role" ON user_roles;

-- Create simple public read policy (admins only need SELECT for now)
CREATE POLICY "user_roles_public_read" ON user_roles
FOR SELECT USING (true);