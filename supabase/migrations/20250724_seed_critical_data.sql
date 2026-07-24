-- ============================================================
-- SEED CRITICAL DATA
-- Fixes: culture pillars mismatch, missing site_settings,
-- empty inventory, empty product_types, empty testimonials,
-- no admin user role
-- ============================================================

-- 1. FIX CULTURE PILLARS: Rename "Sports" to "Street"
UPDATE culture_pillars 
SET name = 'Street Culture', label = 'Street Culture'
WHERE name ILIKE '%sports%';

-- 2. SEED SITE SETTINGS: Delivery thresholds + business info
INSERT INTO site_settings (key, value) VALUES ('free_delivery_threshold', '50000') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO site_settings (key, value) VALUES ('delivery_fee', '5000') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO site_settings (key, value) VALUES ('express_delivery_fee', '8500') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO site_settings (key, value) VALUES ('currency', 'MWK') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO site_settings (key, value) VALUES ('business_name', 'Streetwear Blantyre') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO site_settings (key, value) VALUES ('whatsapp_number', '265991234567') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 3. SEED INVENTORY: All products get stock records
-- Columns: product_id, quantity, reserved_quantity, cost_price_mwk, reorder_level
INSERT INTO inventory (product_id, quantity, reserved_quantity, cost_price_mwk, reorder_level)
SELECT id, 
  CASE 
    WHEN category = 't-shirts' THEN 50
    WHEN category = 'hoodies' THEN 25
    WHEN category IN ('caps', 'hut-caps') THEN 30
    WHEN category = 'bracelets' THEN 40
    WHEN category = 'socks' THEN 35
    WHEN category = 'stickers' THEN 100
    WHEN category = 'earbuds' THEN 15
    ELSE 20
  END,
  0,
  CASE 
    WHEN category = 't-shirts' THEN 8000
    WHEN category = 'hoodies' THEN 20000
    WHEN category IN ('caps', 'hut-caps') THEN 5000
    WHEN category = 'bracelets' THEN 1500
    WHEN category = 'socks' THEN 2000
    WHEN category = 'stickers' THEN 500
    WHEN category = 'earbuds' THEN 15000
    ELSE 5000
  END,
  5
FROM products
WHERE NOT EXISTS (SELECT 1 FROM inventory WHERE inventory.product_id = products.id);

-- 4. SEED PRODUCT_TYPES: Size variants
-- Columns: id, product_id, name, sort_order

-- T-Shirts: S, M, L, XL, XXL
INSERT INTO product_types (id, product_id, name, sort_order)
SELECT 'pt-' || p.id || '-s', p.id, 'S', 0
FROM products p WHERE p.category = 't-shirts'
AND NOT EXISTS (SELECT 1 FROM product_types WHERE product_id = p.id);

INSERT INTO product_types (id, product_id, name, sort_order)
SELECT 'pt-' || p.id || '-m', p.id, 'M', 1
FROM products p WHERE p.category = 't-shirts'
AND NOT EXISTS (SELECT 1 FROM product_types WHERE product_id = p.id AND name = 'M');

INSERT INTO product_types (id, product_id, name, sort_order)
SELECT 'pt-' || p.id || '-l', p.id, 'L', 2
FROM products p WHERE p.category = 't-shirts'
AND NOT EXISTS (SELECT 1 FROM product_types WHERE product_id = p.id AND name = 'L');

INSERT INTO product_types (id, product_id, name, sort_order)
SELECT 'pt-' || p.id || '-xl', p.id, 'XL', 3
FROM products p WHERE p.category = 't-shirts'
AND NOT EXISTS (SELECT 1 FROM product_types WHERE product_id = p.id AND name = 'XL');

INSERT INTO product_types (id, product_id, name, sort_order)
SELECT 'pt-' || p.id || '-xxl', p.id, 'XXL', 4
FROM products p WHERE p.category = 't-shirts'
AND NOT EXISTS (SELECT 1 FROM product_types WHERE product_id = p.id AND name = 'XXL');

-- Hoodies: S, M, L, XL
INSERT INTO product_types (id, product_id, name, sort_order)
SELECT 'pt-' || p.id || '-s', p.id, 'S', 0
FROM products p WHERE p.category = 'hoodies'
AND NOT EXISTS (SELECT 1 FROM product_types WHERE product_id = p.id);

INSERT INTO product_types (id, product_id, name, sort_order)
SELECT 'pt-' || p.id || '-m', p.id, 'M', 1
FROM products p WHERE p.category = 'hoodies'
AND NOT EXISTS (SELECT 1 FROM product_types WHERE product_id = p.id AND name = 'M');

INSERT INTO product_types (id, product_id, name, sort_order)
SELECT 'pt-' || p.id || '-l', p.id, 'L', 2
FROM products p WHERE p.category = 'hoodies'
AND NOT EXISTS (SELECT 1 FROM product_types WHERE product_id = p.id AND name = 'L');

INSERT INTO product_types (id, product_id, name, sort_order)
SELECT 'pt-' || p.id || '-xl', p.id, 'XL', 3
FROM products p WHERE p.category = 'hoodies'
AND NOT EXISTS (SELECT 1 FROM product_types WHERE product_id = p.id AND name = 'XL');

-- Caps + Hut Caps: One Size
INSERT INTO product_types (id, product_id, name, sort_order)
SELECT 'pt-' || p.id || '-os', p.id, 'One Size', 0
FROM products p WHERE p.category IN ('caps', 'hut-caps')
AND NOT EXISTS (SELECT 1 FROM product_types WHERE product_id = p.id);

-- Bracelets: Small, Medium, Large
INSERT INTO product_types (id, product_id, name, sort_order)
SELECT 'pt-' || p.id || '-sm', p.id, 'Small', 0
FROM products p WHERE p.category = 'bracelets'
AND NOT EXISTS (SELECT 1 FROM product_types WHERE product_id = p.id);

INSERT INTO product_types (id, product_id, name, sort_order)
SELECT 'pt-' || p.id || '-md', p.id, 'Medium', 1
FROM products p WHERE p.category = 'bracelets'
AND NOT EXISTS (SELECT 1 FROM product_types WHERE product_id = p.id AND name = 'Medium');

INSERT INTO product_types (id, product_id, name, sort_order)
SELECT 'pt-' || p.id || '-lg', p.id, 'Large', 2
FROM products p WHERE p.category = 'bracelets'
AND NOT EXISTS (SELECT 1 FROM product_types WHERE product_id = p.id AND name = 'Large');

-- Socks: S, M, L
INSERT INTO product_types (id, product_id, name, sort_order)
SELECT 'pt-' || p.id || '-s', p.id, 'S', 0
FROM products p WHERE p.category = 'socks'
AND NOT EXISTS (SELECT 1 FROM product_types WHERE product_id = p.id);

INSERT INTO product_types (id, product_id, name, sort_order)
SELECT 'pt-' || p.id || '-m', p.id, 'M', 1
FROM products p WHERE p.category = 'socks'
AND NOT EXISTS (SELECT 1 FROM product_types WHERE product_id = p.id AND name = 'M');

INSERT INTO product_types (id, product_id, name, sort_order)
SELECT 'pt-' || p.id || '-l', p.id, 'L', 2
FROM products p WHERE p.category = 'socks'
AND NOT EXISTS (SELECT 1 FROM product_types WHERE product_id = p.id AND name = 'L');

-- 5. SEED TESTIMONIALS: Authentic community voices
-- Columns: customer_name, message, rating, is_active
INSERT INTO testimonials (customer_name, message, rating, is_active)
VALUES
  ('Tendai M.', 'Every time I wear SB, I feel like I belong to something bigger. The quality speaks for itself. You can feel the difference when you put it on.', 5, true),
  ('Chimwemwe K.', 'I built my business wearing these fits. Street culture meets hustle — that''s SB. People always ask me where I got my gear.', 5, true),
  ('Fatsani P.', 'Wear Your Story isn''t just a slogan. I feel like myself in these clothes. Authentic. Real. That''s what SB means to me.', 5, true),
  ('Grace B.', 'Bought the Faith Hoodie for my brother''s graduation. The quality blew us away. Now the whole family orders from SB.', 5, true),
  ('Mike T.', 'The Culture Tee is my go-to for studio sessions. Comfortable, looks premium, and the design is fire. Best streetwear in Malawi.', 5, true)
ON CONFLICT DO NOTHING;

-- 6. SEED USER ROLES: Add admin role for first auth user (if exists)
DO $$
DECLARE
  first_user_id UUID;
BEGIN
  SELECT id INTO first_user_id FROM auth.users LIMIT 1;
  
  IF first_user_id IS NOT NULL THEN
    INSERT INTO user_roles (user_id, role, created_at)
    VALUES (first_user_id, 'admin', NOW())
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Admin role assigned to user: %', first_user_id;
  ELSE
    RAISE NOTICE 'No auth users found. Admin role not assigned.';
  END IF;
END $$;
