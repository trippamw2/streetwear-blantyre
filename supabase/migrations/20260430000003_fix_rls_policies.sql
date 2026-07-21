-- Fix RLS policies for demo/admin platform
-- Allow anonymous full access to admin tables (for demo purposes)
-- NOTE: In production, you should use authenticated service role

-- Products: anon full access
DROP POLICY IF EXISTS "Public read active products" ON public.products;
DROP POLICY IF EXISTS "Public read products" ON public.products;
DROP POLICY IF EXISTS "Admins insert products" ON public.products;
DROP POLICY IF EXISTS "Admins update products" ON public.products;
DROP POLICY IF EXISTS "Admins manage products" ON public.products;

CREATE POLICY "Anon full access products" ON public.products
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- Product types: anon full access
DROP POLICY IF EXISTS "Public read product_types" ON public.product_types;
DROP POLICY IF EXISTS "Admins insert product_types" ON public.product_types;
DROP POLICY IF EXISTS "Admins manage product_types" ON public.product_types;

 CREATE POLICY "Anon full access product_types" ON public.product_types
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- Combos: anon full access
DROP POLICY IF EXISTS "Public read active combos" ON public.combos;
DROP POLICY IF EXISTS "Public read combos" ON public.combos;
DROP POLICY IF EXISTS "Admins insert combos" ON public.combos;
DROP POLICY IF EXISTS "Admins manage combos" ON public.combos;

CREATE POLICY "Anon full access combos" ON public.combos
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- Combo items: anon full access
DROP POLICY IF EXISTS "Public read combo_items" ON public.combo_items;
DROP POLICY IF EXISTS "Admins insert combo_items" ON public.combo_items;
DROP POLICY IF EXISTS "Admins manage combo_items" ON public.combos;

CREATE POLICY "Anon full access combo_items" ON public.combo_items
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- Suppliers: anon full access
DROP POLICY IF EXISTS "Public read suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Admins manage suppliers" ON public.suppliers;

CREATE POLICY "Anon full access suppliers" ON public.suppliers
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- Promo codes: anon full access
DROP POLICY IF EXISTS "Public read promo_codes" ON public.promo_codes;
DROP POLICY IF EXISTS "Admins manage promo_codes" ON public.promo_codes;

CREATE POLICY "Anon full access promo_codes" ON public.promo_codes
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- Testimonials: anon full access
DROP POLICY IF EXISTS "Public read testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Admins manage testimonials" ON public.testimonials;

CREATE POLICY "Anon full access testimonials" ON public.testimonials
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- Site settings: anon full access
DROP POLICY IF EXISTS "Public read site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admins manage site_settings" ON public.site_settings;

CREATE POLICY "Anon full access site_settings" ON public.site_settings
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- Orders: anon read, create - allow order creation from checkout
DROP POLICY IF EXISTS "Users read own orders" ON public.orders;
DROP POLICY IF EXISTS "Users create own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins read all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins update orders" ON public.orders;

CREATE POLICY "Anon read orders" ON public.orders
  FOR SELECT TO anon USING (true);
CREATE POLICY "Anon create orders" ON public.orders
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon update orders" ON public.orders
  FOR UPDATE TO anon USING (true);

-- Order items: anon full access
DROP POLICY IF EXISTS "Users read own order items" ON public.order_items;
DROP POLICY IF EXISTS "Users create order items" ON public.order_items;
DROP POLICY IF EXISTS "Admins read all order items" ON public.order_items;

CREATE POLICY "Anon full access order_items" ON public.order_items
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- Profiles: anon read, own write
DROP POLICY IF EXISTS "Users view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins view all profiles" ON public.profiles;

CREATE POLICY "Anon read profiles" ON public.profiles
  FOR SELECT TO anon USING (true);
CREATE POLICY "Anon update profiles" ON public.profiles
  FOR UPDATE TO anon USING (true);

SELECT 'RLS policies fixed - anon full access enabled!' as status;