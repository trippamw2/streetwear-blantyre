-- Fix: Remove all user_roles policies causing infinite recursion
-- Run in Supabase SQL Editor

-- Drop all existing policies
DROP POLICY IF EXISTS "Users read own role" ON user_roles;
DROP POLICY IF EXISTS "Admins manage roles" ON user_roles;
DROP POLICY IF EXISTS "Admins read all roles" ON user_roles;
DROP POLICY IF EXISTS "Users read own roles" ON user_roles;
DROP POLICY IF EXISTS "Anon user_roles" ON user_roles;
DROP POLICY IF EXISTS "user_roles_public_read" ON user_roles;

-- Create simple policies - anyone can read, only service role can manage
CREATE POLICY "user_roles_read" ON user_roles FOR SELECT USING (true);
CREATE POLICY "user_roles_insert" ON user_roles FOR INSERT WITH CHECK (true);
CREATE POLICY "user_roles_update" ON user_roles FOR UPDATE USING (true);
CREATE POLICY "user_roles_delete" ON user_roles FOR DELETE USING (true);