-- ============================================
-- FIX EXISTING RLS POLICIES FOR POWERPOD
-- Run this if policies already exist
-- ============================================

-- Just give anon full access to all tables - no drops needed
-- Using ALTER to give permissions instead

-- Grant anon role full access by recreating policies that allow anon
DO $$
BEGIN
  -- Products - ensure full anon access
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anon products all' AND tablename = 'products') THEN
    CREATE POLICY "Anon products all" ON products FOR ALL TO anon USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  -- Product_types
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anon product_types all' AND tablename = 'product_types') THEN
    CREATE POLICY "Anon product_types all" ON product_types FOR ALL TO anon USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  -- Combos
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anon combos all' AND tablename = 'combos') THEN
    CREATE POLICY "Anon combos all" ON combos FOR ALL TO anon USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  -- Combo_items
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anon combo_items all' AND tablename = 'combo_items') THEN
    CREATE POLICY "Anon combo_items all" ON combo_items FOR ALL TO anon USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  -- Suppliers
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anon suppliers all' AND tablename = 'suppliers') THEN
    CREATE POLICY "Anon suppliers all" ON suppliers FOR ALL TO anon USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  -- Promo_codes
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anon promo_codes all' AND tablename = 'promo_codes') THEN
    CREATE POLICY "Anon promo_codes all" ON promo_codes FOR ALL TO anon USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  -- Testimonials
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anon testimonials all' AND tablename = 'testimonials') THEN
    CREATE POLICY "Anon testimonials all" ON testimonials FOR ALL TO anon USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  -- Site_settings
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anon site_settings all' AND tablename = 'site_settings') THEN
    CREATE POLICY "Anon site_settings all" ON site_settings FOR ALL TO anon USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  -- Orders
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anon orders all' AND tablename = 'orders') THEN
    CREATE POLICY "Anon orders all" ON orders FOR ALL TO anon USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  -- Order_items
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anon order_items all' AND tablename = 'order_items') THEN
    CREATE POLICY "Anon order_items all" ON order_items FOR ALL TO anon USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  -- Profiles
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anon profiles all' AND tablename = 'profiles') THEN
    CREATE POLICY "Anon profiles all" ON profiles FOR ALL TO anon USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  -- Promotions
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anon promotions all' AND tablename = 'promotions') THEN
    CREATE POLICY "Anon promotions all" ON promotions FOR ALL TO anon USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  -- Delivery_companies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anon delivery_companies all' AND tablename = 'delivery_companies') THEN
    CREATE POLICY "Anon delivery_companies all" ON delivery_companies FOR ALL TO anon USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  -- Delivery_options
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anon delivery_options all' AND tablename = 'delivery_options') THEN
    CREATE POLICY "Anon delivery_options all" ON delivery_options FOR ALL TO anon USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  -- Inventory
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anon inventory all' AND tablename = 'inventory') THEN
    CREATE POLICY "Anon inventory all" ON inventory FOR ALL TO anon USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  -- Business_accounts
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anon business_accounts all' AND tablename = 'business_accounts') THEN
    CREATE POLICY "Anon business_accounts all" ON business_accounts FOR ALL TO anon USING (true) WITH CHECK (true);
  END IF;
END $$;

SELECT 'RLS policies added for anon access!' as status;