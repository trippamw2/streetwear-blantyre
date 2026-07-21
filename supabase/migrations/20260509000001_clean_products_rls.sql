-- Clean fix: Remove ALL existing products policies and create single public read policy
-- Run in Supabase SQL Editor

-- 1. First, see what policies exist
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'products';

-- 2. Drop ALL products policies
DROP POLICY IF EXISTS "Anyone can view active products" ON products;
DROP POLICY IF EXISTS "Authenticated can view all products" ON products;
DROP POLICY IF EXISTS "Products are viewable by everyone" ON products;
DROP POLICY IF EXISTS "Products are viewable by authenticated users" ON products;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON products;
DROP POLICY IF EXISTS "anon can read products" ON products;
DROP POLICY IF EXISTS "anon can read active products" ON products;
DROP POLICY IF EXISTS "Public read active products" ON products;
DROP POLICY IF EXISTS "Authenticated read products" ON products;

-- 3. Create single simple policy for public read
CREATE POLICY "products_public_read" ON products
FOR SELECT USING (true);

-- 4. Verify
SELECT id, name, is_active FROM products LIMIT 3;