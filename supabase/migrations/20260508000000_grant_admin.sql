-- Find your user ID by email and grant admin
-- Replace 'your@email.com' with your actual email

-- Get user ID
SELECT id, email FROM auth.users WHERE email = 'your@email.com';

-- Or list all users to find yours
SELECT id, email FROM auth.users ORDER BY created_at DESC LIMIT 10;

-- Then grant admin using the ID (format: '550e84f0-xxxx-xxxx-xxxx-xxxxxxxxxxxx')
INSERT INTO user_roles (user_id, role) 
VALUES ('REPLACE-WITH-YOUR-ACTUAL-USER-ID', 'admin')
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- If user_roles table doesn't exist, create it first:
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW()
);