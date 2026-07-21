-- Products table for admin management
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'products' AND schemaname = 'public') THEN
    CREATE TABLE public.products (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      benefit TEXT,
      price INTEGER NOT NULL DEFAULT 0,
      category TEXT NOT NULL DEFAULT 'audio',
      image TEXT,
      is_active BOOLEAN NOT NULL DEFAULT true,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Product types table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'product_types' AND schemaname = 'public') THEN
    CREATE TABLE public.product_types (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    ALTER TABLE public.product_types ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Combos table for admin management
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'combos' AND schemaname = 'public') THEN
    CREATE TABLE public.combos (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      tagline TEXT,
      description TEXT,
      price INTEGER NOT NULL DEFAULT 0,
      saving INTEGER NOT NULL DEFAULT 0,
      vibe TEXT,
      is_active BOOLEAN NOT NULL DEFAULT true,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    ALTER TABLE public.combos ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Combo items table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'combo_items' AND schemaname = 'public') THEN
    CREATE TABLE public.combo_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      combo_id UUID NOT NULL REFERENCES public.combos(id) ON DELETE CASCADE,
      product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
      product_name TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    ALTER TABLE public.combo_items ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- RLS Policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read active products' AND tablename = 'products') THEN
    CREATE POLICY "Public read active products" ON public.products
      FOR SELECT TO authenticated USING (is_active = true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read product_types' AND tablename = 'product_types') THEN
    CREATE POLICY "Public read product_types" ON public.product_types
      FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins manage products' AND tablename = 'products') THEN
    CREATE POLICY "Admins manage products" ON public.products
      FOR ALL TO authenticated
      USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
      WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins manage product_types' AND tablename = 'product_types') THEN
    CREATE POLICY "Admins manage product_types" ON public.product_types
      FOR ALL TO authenticated
      USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
      WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read active combos' AND tablename = 'combos') THEN
    CREATE POLICY "Public read active combos" ON public.combos
      FOR SELECT TO authenticated USING (is_active = true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read combo_items' AND tablename = 'combo_items') THEN
    CREATE POLICY "Public read combo_items" ON public.combo_items
      FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins manage combos' AND tablename = 'combos') THEN
    CREATE POLICY "Admins manage combos" ON public.combos
      FOR ALL TO authenticated
      USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
      WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins manage combo_items' AND tablename = 'combo_items') THEN
    CREATE POLICY "Admins manage combo_items" ON public.combo_items
      FOR ALL TO authenticated
      USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
      WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
  END IF;
END $$;