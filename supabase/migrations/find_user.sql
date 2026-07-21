-- Step 1: Run this to find your user
SELECT id, email FROM auth.users ORDER BY created_at DESC LIMIT 10;