-- Fix: Ensure products are readable by anon (public)
-- Run this in Supabase SQL Editor

-- 1. Drop old restrictive policies if they exist
DROP POLICY IF EXISTS "Products are viewable by authenticated users" ON products;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON products;

-- 2. Create public read policy
DROP POLICY IF EXISTS "Anyone can view active products" ON products;
CREATE POLICY "Anyone can view active products" ON products 
FOR SELECT TO anon USING (is_active = true);

-- 3. Also enable for authenticated
DROP POLICY IF EXISTS "Authenticated can view all products" ON products;
CREATE POLICY "Authenticated can view all products" ON products 
FOR SELECT TO authenticated USING (is_active = true);

-- 4. Verify products exist
SELECT 'Products count: ' || COUNT(*) FROM products;

-- 5. Test with anon
-- SELECT id, name, price, is_active FROM products LIMIT 5;