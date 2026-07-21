-- ============================================
-- COMPLETE RLS POLICY FIX FOR POWERPOD
-- Run this entire script in Supabase SQL Editor
-- ============================================

-- 1. PRODUCTS - Full anon access
DROP POLICY IF EXISTS "Public read active products" ON products;
DROP POLICY IF EXISTS "Public read products" ON products;
DROP POLICY IF EXISTS "Admins insert products" ON products;
DROP POLICY IF EXISTS "Admins update products" ON products;
DROP POLICY IF EXISTS "Admins manage products" ON products;

CREATE POLICY "Anon full access products" ON products
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- 2. PRODUCT_TYPES
DROP POLICY IF EXISTS "Public read product_types" ON product_types;
DROP POLICY IF EXISTS "Admins insert product_types" ON product_types;
DROP POLICY IF EXISTS "Admins manage product_types" ON product_types;

CREATE POLICY "Anon full access product_types" ON product_types
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- 3. COMBOS
DROP POLICY IF EXISTS "Public read active combos" ON combos;
DROP POLICY IF EXISTS "Public read combos" ON combos;
DROP POLICY IF EXISTS "Admins insert combos" ON combos;
DROP POLICY IF EXISTS "Admins manage combos" ON combos;

CREATE POLICY "Anon full access combos" ON combos
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- 4. COMBO_ITEMS
DROP POLICY IF EXISTS "Public read combo_items" ON combo_items;
DROP POLICY IF EXISTS "Admins insert combo_items" ON combo_items;
DROP POLICY IF EXISTS "Admins manage combo_items" ON combo_items;

CREATE POLICY "Anon full access combo_items" ON combo_items
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- 5. SUPPLIERS
DROP POLICY IF EXISTS "Public read suppliers" ON suppliers;
DROP POLICY IF EXISTS "Admins manage suppliers" ON suppliers;

CREATE POLICY "Anon full access suppliers" ON suppliers
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- 6. PROMO_CODES
DROP POLICY IF EXISTS "Public read promo_codes" ON promo_codes;
DROP POLICY IF EXISTS "Admins manage promo_codes" ON promo_codes;

CREATE POLICY "Anon full access promo_codes" ON promo_codes
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- 7. TESTIMONIALS
DROP POLICY IF EXISTS "Public read testimonials" ON testimonials;
DROP POLICY IF EXISTS "Admins manage testimonials" ON testimonials;

CREATE POLICY "Anon full access testimonials" ON testimonials
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- 8. SITE_SETTINGS
DROP POLICY IF EXISTS "Public read site_settings" ON site_settings;
DROP POLICY IF EXISTS "Admins manage site_settings" ON site_settings;

CREATE POLICY "Anon full access site_settings" ON site_settings
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- 9. ORDERS
DROP POLICY IF EXISTS "Users read own orders" ON orders;
DROP POLICY IF EXISTS "Users create own orders" ON orders;
DROP POLICY IF EXISTS "Admins read all orders" ON orders;
DROP POLICY IF EXISTS "Admins update orders" ON orders;

CREATE POLICY "Anon orders" ON orders
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- 10. ORDER_ITEMS
DROP POLICY IF EXISTS "Users read own order items" ON order_items;
DROP POLICY IF EXISTS "Users create order items" ON order_items;
DROP POLICY IF EXISTS "Admins read all order items" ON order_items;

CREATE POLICY "Anon order_items" ON order_items
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- 11. PROFILES
DROP POLICY IF EXISTS "Users view own profile" ON profiles;
DROP POLICY IF EXISTS "Users update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins view all profiles" ON profiles;

CREATE POLICY "Anon profiles" ON profiles
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- 12. PROMOTIONS
DROP POLICY IF EXISTS "Public read promotions" ON promotions;
DROP POLICY IF EXISTS "Admins manage promotions" ON promotions;

CREATE POLICY "Anon full access promotions" ON promotions
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- 13. DELIVERY_COMPANIES
DROP POLICY IF EXISTS "Public read delivery companies" ON delivery_companies;
DROP POLICY IF EXISTS "Admin manage delivery companies" ON delivery_companies;

CREATE POLICY "Anon full access delivery_companies" ON delivery_companies
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- 14. DELIVERY_OPTIONS
DROP POLICY IF EXISTS "Users read own delivery" ON delivery_options;
DROP POLICY IF EXISTS "Admins read delivery" ON delivery_options;

CREATE POLICY "Anon full access delivery_options" ON delivery_options
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- 15. USER_ROLES
DROP POLICY IF EXISTS "Users read own roles" ON user_roles;
DROP POLICY IF EXISTS "Admins read all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins manage roles" ON user_roles;

CREATE POLICY "Anon user_roles" ON user_roles
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- 16. INVENTORY
DROP POLICY IF EXISTS "Admins manage inventory" ON inventory;

CREATE POLICY "Anon full access inventory" ON inventory
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- 17. BUSINESS_ACCOUNTS
DROP POLICY IF EXISTS "Users read own business" ON business_accounts;
DROP POLICY IF EXISTS "Admins read business" ON business_accounts;

CREATE POLICY "Anon full access business_accounts" ON business_accounts
  FOR ALL TO anon USING (true) WITH CHECK (true);

SELECT 'All RLS policies fixed for anon access!' as status;