-- Seed products and combos into database
-- Run via Supabase SQL Editor

-- Helper function to get image URL based on product name
CREATE OR REPLACE FUNCTION public.get_product_image(product_name TEXT)
RETURNS TEXT
LANGUAGE SQL
STABLE
AS $$
  SELECT CASE
    WHEN product_name LIKE '%PowerPod%' THEN 'https://images.unsplash.com/photo-1590658268037-6bf12165a8d0?w=400'
    WHEN product_name LIKE '%Headphone%' THEN 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'
    WHEN product_name LIKE '%Speaker%' THEN 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400'
    WHEN product_name LIKE '%Charger%' THEN 'https://images.unsplash.com/photo-1583863785434-2fe762927aef?w=400'
    WHEN product_name LIKE '%Power Bank%' THEN 'https://images.unsplash.com/photo-1609091839313-d5361db745c5?w=400'
    WHEN product_name LIKE '%Cable%' THEN 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'
    ELSE 'https://images.unsplash.com/photo-1590658268037-6bf12165a8d0?w=400'
  END;
$$;

-- Seed PRODUCTS if none exist
DO $$
DECLARE cnt INTEGER;
BEGIN
  SELECT COUNT(*) INTO cnt FROM public.products;
  IF cnt = 0 THEN
    INSERT INTO public.products (name, benefit, price, category, image, is_active, sort_order) VALUES
    -- POWER - Wired Chargers
    ('USB-C Fast Charger 25W', 'Quick charge any device. Built-in safety.', 12000, 'power-wired', 'https://images.unsplash.com/photo-1583863785434-2fe762927aef?w=400', true, 1),
    ('Dual USB Charger 30W', 'Charge two devices at once.', 15000, 'power-wired', 'https://images.unsplash.com/photo-1583863785434-2fe762927aef?w=400', true, 2),
    -- POWER - Wireless Chargers
    ('Wireless Charging Pad 15W', 'Simply place and charge. No cables needed.', 18000, 'power-wireless', 'https://images.unsplash.com/photo-1583863785434-2fe762927aef?w=400', true, 3),
    ('Wireless Power Stand', 'Charge & watch. Perfect for desk.', 22000, 'power-wireless', 'https://images.unsplash.com/photo-1583863785434-2fe762927aef?w=400', true, 4),
    -- POWER - Adapters
    ('USB-C Hub 7-in-1', 'Connect everything. HDMI, USB, SD card.', 35000, 'power-adapters', 'https://images.unsplash.com/photo-1583863785434-2fe762927aef?w=400', true, 5),
    ('Car Charger 45W', 'Fast charge on the go.', 8500, 'power-adapters', 'https://images.unsplash.com/photo-1583863785434-2fe762927aef?w=400', true, 6),
    -- POWER - Power Banks
    ('Power Bank 10000mAh', 'Your backup power. Slim design.', 22000, 'power-banks', 'https://images.unsplash.com/photo-1609091839313-d5361db745c5?w=400', true, 7),
    ('Power Bank 20000mAh', 'Power that lasts as long as you do.', 28000, 'power-banks', 'https://images.unsplash.com/photo-1609091839313-d5361db745c5?w=400', true, 8),
    ('Power Bank 26800mAh', 'Ultra high capacity. Charge 3 devices.', 45000, 'power-banks', 'https://images.unsplash.com/photo-1609091839313-d5361db745c5?w=400', true, 9),
    -- POWER - Cables
    ('Braided USB-C Cable 1m', 'Built to last. Fast charging.', 6500, 'cables', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', true, 10),
    ('Braided USB-C Cable 2m', 'Extra length. Same durability.', 8500, 'cables', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', true, 11),
    ('USB-C to Lightning Cable', 'Fast charge iPhone. MFi certified.', 12000, 'cables', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', true, 12),
    -- AUDIO - Speakers
    ('Vibe Mini Speaker', 'Big sound. Pocket size.', 15000, 'speakers', 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400', true, 13),
    ('Vibe Speaker', 'Big sound. Take the vibe with you.', 35000, 'speakers', 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400', true, 14),
    ('Vibe Pro Speaker', '360° sound. Party ready.', 55000, 'speakers', 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400', true, 15),
    -- AUDIO - Headphones
    ('Studio Headphones', 'Deep bass. All-day comfort.', 55000, 'headphones', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400', true, 16),
    ('Studio Pro Headphones', 'Active noise cancelling. Premium sound.', 85000, 'headphones', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400', true, 17),
    -- AUDIO - Earbuds
    ('PowerPods Basic', 'True wireless. Crystal clear calls.', 25000, 'earbuds', 'https://images.unsplash.com/photo-1590658268037-6bf12165a8d0?w=400', true, 18),
    ('PowerPods Wireless', 'True wireless freedom. Better battery.', 35000, 'earbuds', 'https://images.unsplash.com/photo-1590658268037-6bf12165a8d0?w=400', true, 19),
    ('PowerPods Pro', 'ANC. Premium sound. Touch controls.', 55000, 'earbuds', 'https://images.unsplash.com/photo-1590658268037-6bf12165a8d0?w=400', true, 20)
    ON CONFLICT DO NOTHING;

    -- Add product types/variants
    INSERT INTO public.product_types (product_id, name, sort_order)
    SELECT p.id, t.name, t.sort_order
    FROM public.products p
    CROSS JOIN LATERAL (
      VALUES
        ('USB-C Fast Charger 25W', ARRAY['USB-C to USB-C', 'USB-C to USB-A'], 1),
        ('Dual USB Charger 30W', ARRAY['2x USB-C', 'USB-C + USB-A'], 2),
        ('Wireless Charging Pad 15W', ARRAY['Black', 'White'], 3),
        ('Wireless Power Stand', ARRAY['Black'], 4),
        ('USB-C Hub 7-in-1', ARRAY['Silver', 'Space Gray'], 5),
        ('Car Charger 45W', ARRAY['Single Port', 'Dual Port'], 6),
        ('Power Bank 10000mAh', ARRAY['Black', 'White'], 7),
        ('Power Bank 20000mAh', ARRAY['Black', 'White'], 8),
        ('Power Bank 26800mAh', ARRAY['Black'], 9),
        ('Braided USB-C Cable 1m', ARRAY['Black', 'White'], 10),
        ('Braided USB-C Cable 2m', ARRAY['Black', 'White'], 11),
        ('USB-C to Lightning Cable', ARRAY['1m', '2m'], 12),
        ('Vibe Mini Speaker', ARRAY['Black', 'Blue'], 13),
        ('Vibe Speaker', ARRAY['Black', 'Blue'], 14),
        ('Vibe Pro Speaker', ARRAY['Black'], 15),
        ('Studio Headphones', ARRAY['Black', 'Matte Black'], 16),
        ('Studio Pro Headphones', ARRAY['Black'], 17),
        ('PowerPods Basic', ARRAY['Black', 'White'], 18),
        ('PowerPods Wireless', ARRAY['Black', 'White'], 19),
        ('PowerPods Pro', ARRAY['Black'], 20)
    ) AS t(name_arr, sort_order)
    JOIN public.products ON public.products.name = t.name_arr
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Seed COMBOS if none exist
DO $$
DECLARE cnt INTEGER;
BEGIN
  SELECT COUNT(*) INTO cnt FROM public.combos;
  IF cnt = 0 THEN
    INSERT INTO public.combos (name, tagline, description, price, saving, vibe, is_active, sort_order) VALUES
    ('Starter Pack', 'Keep going all day.', 'The basics to stay charged and connected.', 18000, 4000, 'Start right.', true, 1),
    ('Daily Vibe', 'Your everyday setup.', 'Power and sound for your daily grind.', 58000, 9000, 'Stay wired.', true, 2),
    ('Weekend Ready', 'For the sessions.', 'Sound sorted for party and study.', 95000, 15000, 'Loud and ready.', true, 3),
    ('Full Setup', 'Everything covered.', 'The complete package for your vibe.', 165000, 28000, 'All in.', true, 4)
    ON CONFLICT DO NOTHING;

    -- Add combo items
    INSERT INTO public.combo_items (combo_id, product_name)
    SELECT c.id, item
    FROM public.combos c
    CROSS JOIN LATERAL (
      VALUES
        ('Starter Pack', ARRAY['USB-C Fast Charger 25W', 'Braided USB-C Cable 1m']),
        ('Daily Vibe', ARRAY['Power Bank 10000mAh', 'PowerPods Wireless', 'Braided USB-C Cable 1m']),
        ('Weekend Ready', ARRAY['Studio Headphones', 'Vibe Speaker', 'USB-C Fast Charger 25W']),
        ('Full Setup', ARRAY['Studio Headphones', 'PowerPods Wireless', 'Vibe Speaker', 'Power Bank 20000mAh', 'USB-C Fast Charger 25W', 'Braided USB-C Cable 2m'])
    ) AS t(name, items)
    JOIN public.combos ON public.combos.name = t.name
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Show results
SELECT 'Products:' as info, COUNT(*) as count FROM public.products
UNION ALL
SELECT 'Combos:' as info, COUNT(*) as count FROM public.combos;