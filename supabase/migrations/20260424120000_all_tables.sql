-- PowerPod Database Migrations
-- Run via Supabase SQL Editor

-- =====================
-- ROLES & PROFILES (if not exists)
-- =====================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'customer');
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'profiles' AND schemaname = 'public') THEN
    CREATE TABLE public.profiles (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      full_name TEXT,
      phone TEXT,
      location TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_roles' AND schemaname = 'public') THEN
    CREATE TABLE public.user_roles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      role public.app_role NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (user_id, role)
    );
    ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Helper function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- =====================
-- ORDERS (if not exists)
-- =====================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
    CREATE TYPE public.order_status AS ENUM ('new', 'confirmed', 'processing', 'dispatched', 'delivered', 'cancelled');
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'orders' AND schemaname = 'public') THEN
    CREATE TABLE public.orders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      customer_location TEXT,
      total_mwk INTEGER NOT NULL CHECK (total_mwk >= 0),
      status public.order_status NOT NULL DEFAULT 'new',
      notes TEXT,
      whatsapp_sent BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'order_items' AND schemaname = 'public') THEN
    CREATE TABLE public.order_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
      product_key TEXT NOT NULL,
      product_name TEXT NOT NULL,
      unit_price_mwk INTEGER NOT NULL CHECK (unit_price_mwk >= 0),
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- =====================
-- DELIVERY COMPANIES (if not exists)
-- =====================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'delivery_companies' AND schemaname = 'public') THEN
    CREATE TABLE public.delivery_companies (
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
    
    -- Default delivery companies
    INSERT INTO public.delivery_companies (name, slug, description, is_active, is_same_day, service_area, estimated_days, base_fee_mwk) VALUES
      ('Same Day Delivery (Blantyre)', 'same-day', 'Delivered same day in Blantyre', true, true, ARRAY['blantyre'], 0, 0),
      ('Free Delivery (Nationwide)', 'free-nationwide', 'Free delivery anywhere in Malawi', true, false, ARRAY['all'], 5, 0),
      ('Express Delivery', 'express', 'Fast 2-3 day delivery', true, false, ARRAY['all'], 3, 0);
  END IF;
END $$;

-- =====================
-- DELIVERY OPTIONS (if not exists)
-- =====================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'delivery_options' AND schemaname = 'public') THEN
    CREATE TABLE public.delivery_options (
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
  END IF;
END $$;

-- =====================
-- BUSINESS ACCOUNTS (if not exists)
-- =====================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'business_accounts' AND schemaname = 'public') THEN
    CREATE TABLE public.business_accounts (
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
  END IF;
END $$;

-- =====================
-- INVENTORY (if not exists)
-- =====================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'inventory' AND schemaname = 'public') THEN
    CREATE TABLE public.inventory (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      product_id TEXT NOT NULL,
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
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'inventory_transactions' AND schemaname = 'public') THEN
    CREATE TABLE public.inventory_transactions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      inventory_id UUID NOT NULL REFERENCES public.inventory(id) ON DELETE CASCADE,
      quantity_change INTEGER NOT NULL,
      type TEXT NOT NULL,
      reference_id UUID,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- =====================
-- PAYMENT LINKS (if not exists)
-- =====================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'payment_links' AND schemaname = 'public') THEN
    CREATE TABLE public.payment_links (
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
  END IF;
END $$;

-- =====================
-- TRIGGERS & POLICIES
-- =====================

-- Updated_at helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- Triggers (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'profiles_updated_at') THEN
    CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'orders_updated_at') THEN
    CREATE TRIGGER orders_updated_at BEFORE UPDATE ON public.orders
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'delivery_options_updated_at') THEN
    CREATE TRIGGER delivery_options_updated_at BEFORE UPDATE ON public.delivery_options
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'business_accounts_updated_at') THEN
    CREATE TRIGGER business_accounts_updated_at BEFORE UPDATE ON public.business_accounts
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'inventory_updated_at') THEN
    CREATE TRIGGER inventory_updated_at BEFORE UPDATE ON public.inventory
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- Auto-create profile + customer role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  )
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

-- RLS Policies (skip if already exists)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users view own profile' AND tablename = 'profiles') THEN
    CREATE POLICY "Users view own profile" ON public.profiles
      FOR SELECT TO authenticated USING (auth.uid() = id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users update own profile' AND tablename = 'profiles') THEN
    CREATE POLICY "Users update own profile" ON public.profiles
      FOR UPDATE TO authenticated USING (auth.uid() = id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins view all profiles' AND tablename = 'profiles') THEN
    CREATE POLICY "Admins view all profiles" ON public.profiles
      FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users read own roles' AND tablename = 'user_roles') THEN
    CREATE POLICY "Users read own roles" ON public.user_roles
      FOR SELECT TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins read all roles' AND tablename = 'user_roles') THEN
    CREATE POLICY "Admins read all roles" ON public.user_roles
      FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins manage roles' AND tablename = 'user_roles') THEN
    CREATE POLICY "Admins manage roles" ON public.user_roles
      FOR ALL TO authenticated
      USING (public.has_role(auth.uid(), 'admin'))
      WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users read own orders' AND tablename = 'orders') THEN
    CREATE POLICY "Users read own orders" ON public.orders
      FOR SELECT TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users create own orders' AND tablename = 'orders') THEN
    CREATE POLICY "Users create own orders" ON public.orders
      FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins read all orders' AND tablename = 'orders') THEN
    CREATE POLICY "Admins read all orders" ON public.orders
      FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins update orders' AND tablename = 'orders') THEN
    CREATE POLICY "Admins update orders" ON public.orders
      FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users read own order items' AND tablename = 'order_items') THEN
    CREATE POLICY "Users read own order items" ON public.order_items
      FOR SELECT TO authenticated USING (
        EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND o.user_id = auth.uid())
      );
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users create order items' AND tablename = 'order_items') THEN
    CREATE POLICY "Users create order items" ON public.order_items
      FOR INSERT TO authenticated WITH CHECK (
        EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND o.user_id = auth.uid())
      );
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins read all order items' AND tablename = 'order_items') THEN
    CREATE POLICY "Admins read all order items" ON public.order_items
      FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read delivery companies' AND tablename = 'delivery_companies') THEN
    CREATE POLICY "Public read delivery companies" ON public.delivery_companies
      FOR SELECT TO authenticated USING (is_active = true);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin manage delivery companies' AND tablename = 'delivery_companies') THEN
    CREATE POLICY "Admin manage delivery companies" ON public.delivery_companies
      FOR ALL TO authenticated
      USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
      WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users read own delivery' AND tablename = 'delivery_options') THEN
    CREATE POLICY "Users read own delivery" ON public.delivery_options
      FOR SELECT TO authenticated USING (
        EXISTS (SELECT 1 FROM public.orders o WHERE o.id = delivery_options.order_id AND o.user_id = auth.uid())
      );
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins read delivery' AND tablename = 'delivery_options') THEN
    CREATE POLICY "Admins read delivery" ON public.delivery_options
      FOR SELECT TO authenticated USING (
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
      );
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users read own business' AND tablename = 'business_accounts') THEN
    CREATE POLICY "Users read own business" ON public.business_accounts
      FOR SELECT TO authenticated USING (user_id = auth.uid());
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins read business' AND tablename = 'business_accounts') THEN
    CREATE POLICY "Admins read business" ON public.business_accounts
      FOR SELECT TO authenticated USING (
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
      );
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins manage inventory' AND tablename = 'inventory') THEN
    CREATE POLICY "Admins manage inventory" ON public.inventory
      FOR ALL TO authenticated
      USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
      WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins manage inventory_transactions' AND tablename = 'inventory_transactions') THEN
    CREATE POLICY "Admins manage inventory_transactions" ON public.inventory_transactions
      FOR ALL TO authenticated
      USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
      WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users read own payment' AND tablename = 'payment_links') THEN
    CREATE POLICY "Users read own payment" ON public.payment_links
      FOR SELECT TO authenticated USING (
        EXISTS (SELECT 1 FROM public.orders o WHERE o.id = payment_links.order_id AND o.user_id = auth.uid())
      );
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins read payment' AND tablename = 'payment_links') THEN
    CREATE POLICY "Admins read payment" ON public.payment_links
      FOR SELECT TO authenticated USING (
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
      );
  END IF;
END $$;

SELECT 'Migrations complete!' as status;