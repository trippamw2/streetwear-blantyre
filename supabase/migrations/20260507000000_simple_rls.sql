-- Simple RLS fix - Run this in Supabase SQL Editor
-- Idempotent - safe to run multiple times

-- 1. Fix orders - allow guest checkout
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "guest_checkout_orders" ON orders;
CREATE POLICY "guest_checkout_orders" ON orders
  FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "public_read_orders" ON orders;
CREATE POLICY "public_read_orders" ON orders
  FOR SELECT TO anon USING (true);

-- 2. Fix product_reviews
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_reviews" ON product_reviews;
CREATE POLICY "public_read_reviews" ON product_reviews
  FOR SELECT TO anon USING (is_active = true);

DROP POLICY IF EXISTS "public_insert_reviews" ON product_reviews;
CREATE POLICY "public_insert_reviews" ON product_reviews
  FOR INSERT TO anon WITH CHECK (true);

-- 3. Fix user_referral_codes
ALTER TABLE user_referral_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_referral_codes" ON user_referral_codes;
CREATE POLICY "public_read_referral_codes" ON user_referral_codes
  FOR SELECT TO anon USING (true);

-- 4. Fix referral_transactions
ALTER TABLE referral_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_insert_referral" ON referral_transactions;
CREATE POLICY "public_insert_referral" ON referral_transactions
  FOR INSERT TO anon WITH CHECK (true);

-- 5. Make user_id optional in orders (for guest checkout)
ALTER TABLE orders ALTER COLUMN user_id DROP NOT NULL;