-- Production-safe RLS policies
-- Run this in Supabase SQL Editor

-- Products: anyone can read active, only admins can write
DROP POLICY IF EXISTS "Anon full access products" ON products;
DROP POLICY IF EXISTS "Public read products" ON products;
DROP POLICY IF EXISTS "Public read active products" ON products;
DROP POLICY IF EXISTS "Public read active products anon" ON products;
DROP POLICY IF EXISTS "Admin manage products" ON products;
CREATE POLICY "Public read active products" ON products
  FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Public read active products anon" ON products
  FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "Admin manage products" ON products
  FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Orders: users can read own, anon can create, admins can read all
DROP POLICY IF EXISTS "Anon full read orders" ON orders;
DROP POLICY IF EXISTS "Users read own orders" ON orders;
DROP POLICY IF EXISTS "Users read own orders" ON orders;
DROP POLICY IF EXISTS "Admins read all orders" ON orders;
DROP POLICY IF EXISTS "Anon create orders" ON orders;
CREATE POLICY "Users read own orders" ON orders
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins read all orders" ON orders
  FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Anon create orders" ON orders
  FOR INSERT TO anon WITH CHECK (true);

-- Order items: users can read own orders' items
DROP POLICY IF EXISTS "Users read own order items" ON order_items;
CREATE POLICY "Users read own order items" ON order_items
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM orders WHERE id = order_items.order_id AND user_id = auth.uid())
  );

-- Promo codes: public read active, admin write
DROP POLICY IF EXISTS "Anon full access promo_codes" ON promo_codes;
DROP POLICY IF EXISTS "Public read active promos" ON promo_codes;
DROP POLICY IF EXISTS "Public read active promos anon" ON promo_codes;
DROP POLICY IF EXISTS "Admin manage promo_codes" ON promo_codes;
CREATE POLICY "Public read active promos" ON promo_codes
  FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Public read active promos anon" ON promo_codes
  FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "Admin manage promo_codes" ON promo_codes
  FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Inventory: public read, admin write
DROP POLICY IF EXISTS "Anon full access inventory" ON inventory;
DROP POLICY IF EXISTS "Public read inventory" ON inventory;
DROP POLICY IF EXISTS "Public read inventory anon" ON inventory;
DROP POLICY IF EXISTS "Admin manage inventory" ON inventory;
CREATE POLICY "Public read inventory" ON inventory
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public read inventory anon" ON inventory
  FOR SELECT TO anon USING (true);
CREATE POLICY "Admin manage inventory" ON inventory
  FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Customer loyalty: users read own, admin write
DROP POLICY IF EXISTS "Users manage own loyalty" ON customer_loyalty;
DROP POLICY IF EXISTS "Users read own loyalty" ON customer_loyalty;
DROP POLICY IF EXISTS "Users update own loyalty" ON customer_loyalty;
CREATE POLICY "Users read own loyalty" ON customer_loyalty
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users update own loyalty" ON customer_loyalty
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- User referral codes: users manage own
DROP POLICY IF EXISTS "Users manage own referral codes" ON user_referral_codes;
DROP POLICY IF EXISTS "Users read own referral codes" ON user_referral_codes;
DROP POLICY IF EXISTS "Users insert own referral codes" ON user_referral_codes;
CREATE POLICY "Users read own referral codes" ON user_referral_codes
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own referral codes" ON user_referral_codes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);