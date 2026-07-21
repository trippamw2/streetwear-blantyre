-- ============================================
-- Add combo management columns for admin
-- Seed starter combos (Daily Essential, Power Pro, Sound Vibe, Complete Studio)
-- ============================================

-- Add columns to combos table for the new dynamic pricing + lifestyle model
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'combos' AND column_name = 'hook') THEN
    ALTER TABLE public.combos ADD COLUMN hook TEXT DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'combos' AND column_name = 'lifestyle') THEN
    ALTER TABLE public.combos ADD COLUMN lifestyle TEXT DEFAULT 'student';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'combos' AND column_name = 'badge') THEN
    ALTER TABLE public.combos ADD COLUMN badge TEXT DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'combos' AND column_name = 'stock') THEN
    ALTER TABLE public.combos ADD COLUMN stock INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'combos' AND column_name = 'discount_percent') THEN
    ALTER TABLE public.combos ADD COLUMN discount_percent INTEGER DEFAULT 15;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'combos' AND column_name = 'image') THEN
    ALTER TABLE public.combos ADD COLUMN image TEXT DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'combos' AND column_name = 'images') THEN
    ALTER TABLE public.combos ADD COLUMN images TEXT[] DEFAULT '{}';
  END IF;
END $$;

-- Seed the 4 starter combos (only if combos table is empty)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.combos LIMIT 1) THEN
    INSERT INTO public.combos (id, name, hook, lifestyle, tagline, description, discount_percent, vibe, badge, stock, image, sort_order, is_active, price, saving)
    VALUES
      ('a0000000-0000-0000-0000-000000000001', 'Daily Essential Kit', 'Power and sound. Day one.', 'student', 'Power bank and earbuds. Everyday carry.', 'Compact power bank with built-in cables plus wireless earbuds. Your phone stays charged. Your music plays.', 15, 'Never run out of power.', 'Best for Students', 12, 'https://oalemobile.com/wp-content/uploads/2026/02/Nano2%E9%BB%91%E8%89%B2.png', 1, true, 0, 0),
      ('a0000000-0000-0000-0000-000000000002', 'Power Pro Kit', 'Power bank, earbuds, car charger. Go.', 'work', 'Power and sound for your day.', 'High capacity power bank, ENC earbuds for calls, and a car charger. For work, travel and meetings.', 15, 'Professional. Powered. Ready.', 'Most Popular', 8, 'https://oalemobile.com/wp-content/uploads/2026/02/U20000%E9%BB%91%E8%89%B2.png', 2, true, 0, 0),
      ('a0000000-0000-0000-0000-000000000003', 'Sound Vibe Kit', 'Sound that moves with you.', 'audio', 'Headphones and speaker. Your audio.', 'ANC headphones and a waterproof speaker. Deep bass anywhere you go.', 15, 'Listen louder. Live better.', 'Best Value', 6, 'https://oalemobile.com/wp-content/uploads/2026/02/Hug-3-ANC%E9%BB%91%E8%89%B2-%E5%8E%8B%E7%BC%A9.png', 3, true, 0, 0),
      ('a0000000-0000-0000-0000-000000000004', 'Complete Studio Kit', 'Power and sound. Everything.', 'premium', 'Full setup. No compromises.', 'Power bank, earbuds, ANC headphones and a speaker. All you need for power and sound.', 15, 'The full lifestyle upgrade.', 'Premium', 3, 'https://oalemobile.com/wp-content/uploads/2026/02/Hug-3-ANC%E9%BB%91%E8%89%B2-%E5%8E%8B%E7%BC%A9.png', 4, true, 0, 0);

    -- Link combo items (product_id references to the existing products)
    INSERT INTO public.combo_items (combo_id, product_id)
    VALUES
      -- Daily Essential Kit: iPower Nano2 + iFree 9
      ('a0000000-0000-0000-0000-000000000001', '7a1a35d4-d07b-43e3-b20d-130bb8567f1d'),
      ('a0000000-0000-0000-0000-000000000001', 'c664496e-7782-4843-a7b5-692e72c448a7'),
      -- Power Pro Kit: iPower U2000 + iFree 14 + 3A Car Charger
      ('a0000000-0000-0000-0000-000000000002', 'dcdeb960-53b0-4df5-9ba0-44d0da255fca'),
      ('a0000000-0000-0000-0000-000000000002', 'f02a9d0c-d708-4981-81e7-eebfec3243dd'),
      ('a0000000-0000-0000-0000-000000000002', '1119152f-1231-478d-9e20-ddd61c8321e3'),
      -- Sound Vibe Kit: Hug 3 ANC + iBuzz 80
      ('a0000000-0000-0000-0000-000000000003', 'b87e6dcc-9763-490f-89bf-63634c8f8287'),
      ('a0000000-0000-0000-0000-000000000003', '1401136d-77d6-4a48-8383-08e8936d0940'),
      -- Complete Studio Kit: iPower 300 + iFree 14 + Hug 3 ANC + iBuzz 80
      ('a0000000-0000-0000-0000-000000000004', 'adfdf2f1-7b98-44f8-9404-789e561f2e07'),
      ('a0000000-0000-0000-0000-000000000004', 'f02a9d0c-d708-4981-81e7-eebfec3243dd'),
      ('a0000000-0000-0000-0000-000000000004', 'b87e6dcc-9763-490f-89bf-63634c8f8287'),
      ('a0000000-0000-0000-0000-000000000004', '1401136d-77d6-4a48-8383-08e8936d0940');

    -- Update combo_items with product_name fallback (for FK safety)
    UPDATE public.combo_items SET product_name = p.name
    FROM public.products p
    WHERE combo_items.product_id = p.id AND combo_items.product_name IS NULL;
  END IF;
END $$;

SELECT 'Combos schema migrated and seeded' as status;
