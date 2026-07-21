-- Promotions table for admin management
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'promotions' AND schemaname = 'public') THEN
    CREATE TABLE public.promotions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      subtitle TEXT,
      description TEXT,
      image TEXT,
      link TEXT NOT NULL DEFAULT '/',
      link_text TEXT DEFAULT 'Shop Now',
      background_color TEXT DEFAULT 'from-orange-500 to-pink-500',
      text_color TEXT DEFAULT 'text-white',
      is_active BOOLEAN NOT NULL DEFAULT true,
      is_featured BOOLEAN NOT NULL DEFAULT false,
      sort_order INTEGER NOT NULL DEFAULT 0,
      pages TEXT[] NOT NULL DEFAULT ARRAY['home'],
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- RLS Policies for promotions
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read active promotions' AND tablename = 'promotions') THEN
    CREATE POLICY "Public read active promotions" ON public.promotions
      FOR SELECT TO authenticated USING (is_active = true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins manage promotions' AND tablename = 'promotions') THEN
    CREATE POLICY "Admins manage promotions" ON public.promotions
      FOR ALL TO authenticated
      USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
      WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

-- Insert default promotions
INSERT INTO public.promotions (title, subtitle, description, image, link, link_text, background_color, text_color, is_active, is_featured, sort_order, pages)
SELECT 'Free Delivery', 'On all orders', 'No matter where you are in Malawi', 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200', '/shop', 'Shop Now', 'from-orange-500 to-pink-500', 'text-white', true, true, 1, ARRAY['home', 'shop']
WHERE NOT EXISTS (SELECT 1 FROM public.promotions WHERE title = 'Free Delivery');

INSERT INTO public.promotions (title, subtitle, description, image, link, link_text, background_color, text_color, is_active, is_featured, sort_order, pages)
SELECT 'New Arrivals', 'PowerPods Pro', 'Premium earbuds with ANC', 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=1200', '/shop?cat=earbuds', 'View Collection', 'from-purple-500 to-indigo-500', 'text-white', true, true, 2, ARRAY['home']
WHERE NOT EXISTS (SELECT 1 FROM public.promotions WHERE title = 'New Arrivals');

INSERT INTO public.promotions (title, subtitle, description, image, link, link_text, background_color, text_color, is_active, is_featured, sort_order, pages)
SELECT 'Bundle & Save', 'Starter Pack', 'Charger + Cable bundle', 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=1200', '/combos', 'View Bundles', 'from-green-500 to-teal-500', 'text-white', true, true, 3, ARRAY['combos', 'home']
WHERE NOT EXISTS (SELECT 1 FROM public.promotions WHERE title = 'Bundle & Save');