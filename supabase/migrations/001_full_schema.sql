-- ============================================================
-- Streetwear Blantyre — Full Database Schema
-- Run this in Supabase SQL Editor to set up the entire DB
-- ============================================================

-- =====================
-- HELPERS
-- =====================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TYPE public.app_role AS ENUM ('admin', 'customer');
CREATE TYPE public.order_status AS ENUM ('new', 'confirmed', 'processing', 'dispatched', 'delivered', 'cancelled');

-- =====================
-- PROFILES & ROLES
-- =====================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), COALESCE(NEW.raw_user_meta_data->>'phone', ''));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Profiles RLS
CREATE POLICY "Users view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admins view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- User roles RLS
CREATE POLICY "Users read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins read all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =====================
-- WEARABLE CATEGORIES
-- =====================

CREATE TABLE IF NOT EXISTS public.wearable_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.wearable_categories ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER wearable_categories_updated_at BEFORE UPDATE ON public.wearable_categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Public read wearable categories" ON public.wearable_categories
  FOR SELECT USING (is_active = true);
CREATE POLICY "Admin manage wearable categories" ON public.wearable_categories
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =====================
-- CULTURE PILLARS
-- =====================

CREATE TABLE IF NOT EXISTS public.culture_pillars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  color TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.culture_pillars ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER culture_pillars_updated_at BEFORE UPDATE ON public.culture_pillars
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Public read culture pillars" ON public.culture_pillars
  FOR SELECT USING (is_active = true);
CREATE POLICY "Admin manage culture pillars" ON public.culture_pillars
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =====================
-- PRODUCTS
-- =====================

CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  benefit TEXT,
  price INTEGER NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'all',
  brand TEXT,
  image TEXT,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  is_best_seller BOOLEAN DEFAULT false,
  is_on_sale BOOLEAN DEFAULT false,
  discount_percent INTEGER DEFAULT 0,
  stock_quantity INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  supplier_id UUID,
  culture_pillar TEXT,
  wearable_category TEXT,
  images JSONB DEFAULT '[]',
  gallery_images JSONB DEFAULT '[]',
  specs JSONB DEFAULT '{}',
  reward_points INTEGER,
  rating NUMERIC(3,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_brand ON public.products(brand);
CREATE INDEX IF NOT EXISTS idx_products_culture ON public.products(culture_pillar);

CREATE POLICY "Products are viewable by everyone" ON public.products FOR SELECT USING (true);
CREATE POLICY "Anyone can insert products" ON public.products FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update products" ON public.products FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete products" ON public.products FOR DELETE USING (true);

-- =====================
-- PRODUCT TYPES
-- =====================

CREATE TABLE IF NOT EXISTS public.product_types (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.product_types ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_product_types_product ON public.product_types(product_id);

CREATE POLICY "Product types viewable by everyone" ON public.product_types FOR SELECT USING (true);
CREATE POLICY "Anyone can manage product types" ON public.product_types FOR ALL USING (true);

-- =====================
-- SUPPLIERS
-- =====================

CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER suppliers_updated_at BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Public read suppliers" ON public.suppliers FOR SELECT USING (true);
CREATE POLICY "Admin manage suppliers" ON public.suppliers
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =====================
-- INVENTORY
-- =====================

CREATE TABLE IF NOT EXISTS public.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT NOT NULL UNIQUE,
  sku TEXT UNIQUE,
  quantity INTEGER NOT NULL DEFAULT 0,
  reserved_quantity INTEGER NOT NULL DEFAULT 0,
  reorder_level INTEGER NOT NULL DEFAULT 5,
  cost_price_mwk INTEGER,
  location TEXT,
  last_restocked DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER inventory_updated_at BEFORE UPDATE ON public.inventory
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_inventory_product ON public.inventory(product_id);

CREATE POLICY "Admins manage inventory" ON public.inventory
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id UUID NOT NULL REFERENCES public.inventory(id) ON DELETE CASCADE,
  quantity_change INTEGER NOT NULL,
  type TEXT NOT NULL,
  reference_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage inventory_transactions" ON public.inventory_transactions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =====================
-- ORDERS
-- =====================

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_location TEXT,
  total_mwk INTEGER NOT NULL CHECK (total_mwk >= 0),
  subtotal_mwk INTEGER,
  delivery_fee_mwk INTEGER DEFAULT 0,
  payment_method TEXT,
  status order_status NOT NULL DEFAULT 'new',
  notes TEXT,
  whatsapp_sent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_key TEXT NOT NULL,
  product_name TEXT NOT NULL,
  unit_price_mwk INTEGER NOT NULL CHECK (unit_price_mwk >= 0),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);

-- Orders RLS
CREATE POLICY "Users read own orders" ON public.orders
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users create own orders" ON public.orders
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins read all orders" ON public.orders
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update orders" ON public.orders
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users read own order items" ON public.order_items
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND o.user_id = auth.uid())
  );
CREATE POLICY "Users create order items" ON public.order_items
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND o.user_id = auth.uid())
  );
CREATE POLICY "Admins read all order items" ON public.order_items
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- =====================
-- DELIVERY
-- =====================

CREATE TABLE IF NOT EXISTS public.delivery_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_same_day BOOLEAN NOT NULL DEFAULT false,
  service_area TEXT[],
  estimated_days INTEGER,
  base_fee_mwk INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.delivery_companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read delivery companies" ON public.delivery_companies
  FOR SELECT USING (is_active = true);
CREATE POLICY "Admin manage delivery companies" ON public.delivery_companies
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed default delivery companies
INSERT INTO public.delivery_companies (name, slug, description, is_active, is_same_day, service_area, estimated_days, base_fee_mwk) VALUES
  ('Same Day Delivery (Blantyre)', 'same-day', 'Delivered same day in Blantyre', true, true, ARRAY['blantyre']::TEXT[], 0, 0),
  ('Free Delivery (Nationwide)', 'free-nationwide', 'Free delivery anywhere in Malawi', true, false, ARRAY['all']::TEXT[], 5, 0),
  ('Express Delivery', 'express', 'Fast 2-3 day delivery', true, false, ARRAY['all']::TEXT[], 3, 0)
ON CONFLICT (slug) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.delivery_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.delivery_companies(id),
  tracking_number TEXT,
  fee_mwk INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  estimated_delivery DATE,
  actual_delivery DATE,
  delivery_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.delivery_options ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER delivery_options_updated_at BEFORE UPDATE ON public.delivery_options
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Users read own delivery" ON public.delivery_options
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = delivery_options.order_id AND o.user_id = auth.uid())
  );
CREATE POLICY "Admins read delivery" ON public.delivery_options
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- =====================
-- PROMOTIONS
-- =====================

CREATE TABLE IF NOT EXISTS public.promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_date TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read promotions" ON public.promotions
  FOR SELECT USING (is_active = true);
CREATE POLICY "Admin manage promotions" ON public.promotions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =====================
-- COMBOS
-- =====================

CREATE TABLE IF NOT EXISTS public.combos (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  tagline TEXT,
  price INTEGER NOT NULL DEFAULT 0,
  image TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.combos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Combos viewable by everyone" ON public.combos FOR SELECT USING (true);
CREATE POLICY "Admin manage combos" ON public.combos
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.combo_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  combo_id TEXT NOT NULL REFERENCES public.combos(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1
);
ALTER TABLE public.combo_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Combo items viewable by everyone" ON public.combo_items FOR SELECT USING (true);
CREATE POLICY "Admin manage combo items" ON public.combo_items
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =====================
-- TESTIMONIALS
-- =====================

CREATE TABLE IF NOT EXISTS public.testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  message TEXT NOT NULL,
  rating INTEGER NOT NULL DEFAULT 5,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read testimonials" ON public.testimonials
  FOR SELECT USING (is_active = true);
CREATE POLICY "Admin manage testimonials" ON public.testimonials
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =====================
-- CUSTOMER SUBSCRIBERS
-- =====================

CREATE TABLE IF NOT EXISTS public.customer_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.customer_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can subscribe" ON public.customer_subscribers
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read subscribers" ON public.customer_subscribers
  FOR SELECT USING (true);

-- =====================
-- BUSINESS ACCOUNTS (B2B)
-- =====================

CREATE TABLE IF NOT EXISTS public.business_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  company_name TEXT NOT NULL,
  business_type TEXT,
  tax_id TEXT,
  credit_limit_mwk INTEGER DEFAULT 0,
  payment_terms TEXT DEFAULT 'prepaid',
  account_manager_id UUID REFERENCES auth.users(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.business_accounts ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER business_accounts_updated_at BEFORE UPDATE ON public.business_accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Users read own business" ON public.business_accounts
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins read business" ON public.business_accounts
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- =====================
-- PAYMENT LINKS
-- =====================

CREATE TABLE IF NOT EXISTS public.payment_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE UNIQUE,
  amount_mwk INTEGER NOT NULL,
  payment_method TEXT,
  phone_number TEXT,
  reference TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  transaction_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payment_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own payment" ON public.payment_links
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = payment_links.order_id AND o.user_id = auth.uid())
  );
CREATE POLICY "Admins read payment" ON public.payment_links
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- =====================
-- SITE SETTINGS
-- =====================

CREATE TABLE IF NOT EXISTS public.site_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admin manage settings" ON public.site_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =====================
-- SEED DATA — WEARABLE CATEGORIES
-- =====================

INSERT INTO public.wearable_categories (name, slug, description, icon, sort_order) VALUES
  ('T-Shirts', 't-shirts', 'Graphic tees and everyday essentials', 'Shirt', 1),
  ('Hoodies', 'hoodies', 'Premium hoodies and pullovers', 'Warehouse', 2),
  ('Caps', 'caps', 'Snapbacks, dad hats, and trucker caps', 'Crown', 3),
  ('Hut Caps', 'hut-caps', 'Traditional-inspired headwear', 'Mountain', 4),
  ('Bracelets', 'bracelets', 'Wrist accessories and bands', 'Link', 5),
  ('Socks', 'socks', 'Premium streetwear socks', 'Footprints', 6),
  ('Stickers', 'stickers', 'Brand stickers and decals', 'Sparkles', 7),
  ('Earbuds', 'earbuds', 'Audio accessories', 'Headphones', 8)
ON CONFLICT (slug) DO NOTHING;

-- =====================
-- SEED DATA — CULTURE PILLARS
-- =====================

INSERT INTO public.culture_pillars (name, slug, description, icon, color, sort_order) VALUES
  ('Music Culture', 'music', 'Express through sound and rhythm', 'Music', '#8B5CF6', 1),
  ('Sports Culture', 'sports', 'Rep your team, rep your city', 'Trophy', '#F59E0B', 2),
  ('Faith Culture', 'faith', 'Wear your beliefs with pride', 'Heart', '#10B981', 3),
  ('Hustle Culture', 'hustle', 'Grind never stops. Dress like it.', 'Zap', '#EF4444', 4)
ON CONFLICT (slug) DO NOTHING;

-- =====================
-- DONE
-- =====================

SELECT '✅ Streetwear Blantyre schema complete!' as status;
