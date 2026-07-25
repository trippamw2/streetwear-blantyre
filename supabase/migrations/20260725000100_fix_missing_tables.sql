-- Fix missing tables that were defined in old migrations but may not have deployed
-- Combos table
CREATE TABLE IF NOT EXISTS public.combos (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  hook TEXT NOT NULL DEFAULT '',
  lifestyle TEXT NOT NULL DEFAULT 'student',
  tagline TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  discount_percent INTEGER NOT NULL DEFAULT 15,
  vibe TEXT NOT NULL DEFAULT '',
  badge TEXT NOT NULL DEFAULT '',
  stock INTEGER NOT NULL DEFAULT 0,
  image TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_combos_active ON public.combos(is_active);
CREATE INDEX IF NOT EXISTS idx_combos_sort ON public.combos(sort_order);

-- Combo items table
CREATE TABLE IF NOT EXISTS public.combo_items (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  combo_id TEXT NOT NULL REFERENCES public.combos(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_combo_items_combo ON public.combo_items(combo_id);
CREATE INDEX IF NOT EXISTS idx_combo_items_product ON public.combo_items(product_id);

-- Promotions table
CREATE TABLE IF NOT EXISTS public.promotions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL DEFAULT '',
  image TEXT NOT NULL DEFAULT '',
  link TEXT NOT NULL DEFAULT '',
  link_text TEXT NOT NULL DEFAULT '',
  background_color TEXT NOT NULL DEFAULT '#0f172a',
  text_color TEXT NOT NULL DEFAULT '#ffffff',
  pages TEXT NOT NULL DEFAULT '["home"]',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_promotions_active ON public.promotions(is_active);

-- Product reviews table
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT NOT NULL,
  customer_name TEXT NOT NULL DEFAULT '',
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_reviews_product ON public.product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_active ON public.product_reviews(is_active);

-- RLS: combos
ALTER TABLE public.combos ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'combos' AND policyname = 'Anyone can view active combos') THEN
    CREATE POLICY "Anyone can view active combos" ON public.combos FOR SELECT USING (is_active = true);
  END IF;
END $$;

-- RLS: combo_items
ALTER TABLE public.combo_items ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'combo_items' AND policyname = 'Anyone can view combo items') THEN
    CREATE POLICY "Anyone can view combo items" ON public.combo_items FOR SELECT USING (true);
  END IF;
END $$;

-- RLS: promotions
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'promotions' AND policyname = 'Anyone can view active promotions') THEN
    CREATE POLICY "Anyone can view active promotions" ON public.promotions FOR SELECT USING (is_active = true);
  END IF;
END $$;

-- RLS: product_reviews
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'product_reviews' AND policyname = 'Anyone can view active reviews') THEN
    CREATE POLICY "Anyone can view active reviews" ON public.product_reviews FOR SELECT USING (is_active = true);
  END IF;
END $$;

-- Insert default combos if empty
INSERT INTO public.combos (id, name, hook, lifestyle, tagline, description, discount_percent, vibe, badge, stock, image, is_active, sort_order)
SELECT 'combo-001', 'The Culture Pack', 'Dress the part. Live the culture.', 'student', '3 essential pieces. One identity.', 'The perfect starter pack for anyone building their streetwear identity.', 20, 'urban', 'NEW', 50, '', true, 1
WHERE NOT EXISTS (SELECT 1 FROM public.combos WHERE id = 'combo-001');

INSERT INTO public.combos (id, name, hook, lifestyle, tagline, description, discount_percent, vibe, badge, stock, image, is_active, sort_order)
SELECT 'combo-002', 'Hustle Bundle', 'Built for the grind. Ready for the win.', 'work', '3 power pieces. Maximum impact.', 'A curated set for those who lead with ambition.', 15, 'premium', 'BEST', 30, '', true, 2
WHERE NOT EXISTS (SELECT 1 FROM public.combos WHERE id = 'combo-002');

-- Insert default promotion if empty
INSERT INTO public.promotions (id, title, subtitle, image, link, link_text, background_color, text_color, pages, is_active, sort_order)
SELECT 'promo-001', 'Wear the Culture', 'Premium streetwear from Blantyre. Every piece tells a story.', '', '', 'Shop Now', '#0f172a', '#ffffff', '["home"]', true, 1
WHERE NOT EXISTS (SELECT 1 FROM public.promotions WHERE id = 'promo-001');
