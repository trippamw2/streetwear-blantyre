-- Wishlist table for user wishlists
CREATE TABLE IF NOT EXISTS customer_wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  product_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- RLS
ALTER TABLE customer_wishlists ENABLE ROW LEVEL SECURITY;

-- Anyone can read wishlists
CREATE POLICY "Anyone can read wishlists" ON customer_wishlists
  FOR SELECT TO anon USING (true);

-- Authenticated users can insert/update their own wishlists
CREATE POLICY "Users manage own wishlists" ON customer_wishlists
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);