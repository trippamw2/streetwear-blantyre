-- Product reviews table
CREATE TABLE IF NOT EXISTS product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  rating INTEGER NOT NULL,
  review_text TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

-- Public insert
CREATE POLICY "Allow public insert reviews" ON product_reviews
  FOR INSERT TO anon
  WITH CHECK (true);

-- Public read
CREATE POLICY "Allow public read reviews" ON product_reviews
  FOR SELECT TO anon
  USING (is_active = true);

-- Service role full access
CREATE POLICY "Allow service role reviews" ON product_reviews
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Index
CREATE INDEX IF NOT EXISTS idx_reviews_product ON product_reviews(product_id);