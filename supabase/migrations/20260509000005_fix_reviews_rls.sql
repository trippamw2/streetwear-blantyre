-- Fix product_reviews RLS completely
-- Run in Supabase SQL Editor

-- Drop ALL existing policies
DROP POLICY IF EXISTS "public_read_reviews" ON product_reviews;
DROP POLICY IF EXISTS "public_insert_reviews" ON product_reviews;
DROP POLICY IF EXISTS "Allow public insert reviews" ON product_reviews;
DROP POLICY IF EXISTS "Allow public read reviews" ON product_reviews;
DROP POLICY IF EXISTS "Anon can insert product_reviews" ON product_reviews;
DROP POLICY IF EXISTS "Anon can select product_reviews" ON product_reviews;
DROP POLICY IF EXISTS "Anyone can insert reviews" ON product_reviews;
DROP POLICY IF EXISTS "Anyone can read reviews" ON product_reviews;
DROP POLICY IF EXISTS "Authenticated full reviews" ON product_reviews;
DROP POLICY IF EXISTS "Service role reviews" ON product_reviews;

-- Create simple public policies
CREATE POLICY "reviews_public_read" ON product_reviews FOR SELECT USING (true);
CREATE POLICY "reviews_public_insert" ON product_reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "reviews_public_update" ON product_reviews FOR UPDATE USING (true);
CREATE POLICY "reviews_public_delete" ON product_reviews FOR DELETE USING (true);