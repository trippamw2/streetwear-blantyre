-- Run this in Supabase SQL Editor

-- 1. First create table if not exists (with unique constraint)
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id)
);

-- 2. Then grant admin (replace with your actual user ID from auth.users)
INSERT INTO user_roles (user_id, role) 
VALUES ('REPLACE-WITH-YOUR-USER-ID', 'admin');

-- 3. Verify admin was granted
SELECT * FROM user_roles WHERE role = 'admin';