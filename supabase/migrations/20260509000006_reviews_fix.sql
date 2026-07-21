-- Clean fix - just recreate
DROP POLICY IF EXISTS "reviews_public_read" ON product_reviews;
DROP POLICY IF EXISTS "reviews_public_insert" ON product_reviews;
DROP POLICY IF EXISTS "reviews_public_update" ON product_reviews;
DROP POLICY IF EXISTS "reviews_public_delete" ON product_reviews;

CREATE POLICY "reviews_read" ON product_reviews FOR SELECT USING (true);
CREATE POLICY "reviews_insert" ON product_reviews FOR INSERT WITH CHECK (true);