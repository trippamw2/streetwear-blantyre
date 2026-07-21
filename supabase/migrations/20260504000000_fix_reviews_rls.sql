-- Fix RLS for product_reviews to allow public read/insert
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow public insert reviews" ON product_reviews;
DROP POLICY IF EXISTS "Allow public read reviews" ON product_reviews;
DROP POLICY IF EXISTS "Anon can insert product_reviews" ON product_reviews;
DROP POLICY IF EXISTS "Anon can select product_reviews" ON product_reviews;

-- Create permissive policies for anon users
CREATE POLICY "Anyone can insert reviews" ON product_reviews
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "Anyone can read reviews" ON product_reviews
  FOR SELECT TO anon
  USING (is_active = true);

-- Also allow authenticated users full access
CREATE POLICY "Authenticated full reviews" ON product_reviews
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- And service role
CREATE POLICY "Service role reviews" ON product_reviews
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);