-- 1. Create loyalty tables (if not exist)
CREATE TABLE IF NOT EXISTS loyalty_programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    points_per_mwk NUMERIC NOT NULL DEFAULT 1000,
    points_to_redeem INTEGER NOT NULL DEFAULT 100,
    reward_value_mwk NUMERIC NOT NULL DEFAULT 1000,
    min_order_mwk INTEGER DEFAULT 0,
    max_redeem_percent INTEGER DEFAULT 50,
    is_active BOOLEAN DEFAULT true,
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customer_loyalty (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    total_points INTEGER DEFAULT 0,
    available_points INTEGER DEFAULT 0,
    redeemed_points INTEGER DEFAULT 0,
    lifetime_spent_mwk NUMERIC DEFAULT 0,
    tier TEXT DEFAULT 'bronze',
    last_activity_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS loyalty_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    order_id UUID,
    points INTEGER NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS loyalty_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    min_lifetime_points INTEGER NOT NULL,
    points_multiplier NUMERIC DEFAULT 1,
    discount_percent NUMERIC DEFAULT 0,
    free_delivery BOOLEAN DEFAULT false,
    priority_support BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create referral tables (if not exist)
CREATE TABLE IF NOT EXISTS user_referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  code VARCHAR(12) UNIQUE NOT NULL,
  rewards_points INTEGER DEFAULT 500,
  rewards_redeemed INTEGER DEFAULT 0,
  max_referrals INTEGER DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS referral_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  referee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  referral_code VARCHAR(12) NOT NULL,
  order_id UUID,
  referee_reward INTEGER DEFAULT 200,
  referrer_reward INTEGER DEFAULT 500,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS referral_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  transaction_id UUID,
  reward_type TEXT NOT NULL,
  reward_points INTEGER NOT NULL,
  order_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE loyalty_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_loyalty ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;

-- 4. RLS policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view loyalty_programs') THEN
    CREATE POLICY "Anyone can view loyalty_programs" ON loyalty_programs FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view loyalty_tiers') THEN
    CREATE POLICY "Anyone can view loyalty_tiers" ON loyalty_tiers FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own loyalty') THEN
    CREATE POLICY "Users can view own loyalty" ON customer_loyalty FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own transactions') THEN
    CREATE POLICY "Users can view own transactions" ON loyalty_transactions FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own referral code') THEN
    CREATE POLICY "Users can view own referral code" ON user_referral_codes FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own referral code') THEN
    CREATE POLICY "Users can insert own referral code" ON user_referral_codes FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own referral code') THEN
    CREATE POLICY "Users can update own referral code" ON user_referral_codes FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own referrals') THEN
    CREATE POLICY "Users can view own referrals" ON referral_transactions FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referee_id);
  END IF;
END $$;

-- 5. Seed loyalty program
INSERT INTO loyalty_programs (name, description, points_per_mwk, points_to_redeem, reward_value_mwk, is_active)
VALUES ('Default', 'Earn 1 point per K1,000 spent. Redeem 100 points for K1,000 off!', 1000, 100, 1000, true)
ON CONFLICT DO NOTHING;

-- 6. Seed loyalty tiers
INSERT INTO loyalty_tiers (name, min_lifetime_points, points_multiplier, discount_percent, free_delivery)
VALUES 
    ('bronze', 0, 1, 0, false),
    ('silver', 5000, 1.25, 2, false),
    ('gold', 15000, 1.5, 5, true),
    ('platinum', 50000, 2, 10, true)
ON CONFLICT DO NOTHING;

-- 7. Assign admin role (handle both constraint variants)
DO $$ BEGIN
  INSERT INTO user_roles (user_id, role)
  VALUES ('21c83be0-e624-4959-9f76-176b092a251f', 'admin')
  ON CONFLICT DO NOTHING;
EXCEPTION WHEN OTHERS THEN
  UPDATE user_roles SET role = 'admin' WHERE user_id = '21c83be0-e624-4959-9f76-176b092a251f';
END $$;

-- 8. Store PayChangu + Brevo settings (apply via run-sql.cjs with real keys, not committed)
-- Skipped: contains API keys. Apply manually or via run-sql.cjs.

-- 9. Seed products
INSERT INTO products (id, name, benefit, category, culture_pillar, price, image, is_active, brand, wearable_category)
VALUES
  ('prod-ts-001', 'Culture Tee', 'Premium cotton tee with SB branding', 't-shirts', 'music', 25000, '/placeholder.svg', true, 'Streetwear Blantyre', 'T-Shirts'),
  ('prod-ts-002', 'Faith Tee', 'Faith-inspired streetwear tee', 't-shirts', 'faith', 25000, '/placeholder.svg', true, 'Streetwear Blantyre', 'T-Shirts'),
  ('prod-ts-003', 'Hustle Tee', 'Grind mode activated', 't-shirts', 'hustle', 25000, '/placeholder.svg', true, 'Streetwear Blantyre', 'T-Shirts'),
  ('prod-ts-004', 'Sports Tee', 'Game day fit', 't-shirts', 'sports', 25000, '/placeholder.svg', true, 'Streetwear Blantyre', 'T-Shirts'),
  ('prod-hd-001', 'Culture Hoodie', 'Premium heavyweight hoodie', 'hoodies', 'music', 55000, '/placeholder.svg', true, 'Streetwear Blantyre', 'Hoodies'),
  ('prod-hd-002', 'Faith Hoodie', 'Walk by faith hoodie', 'hoodies', 'faith', 55000, '/placeholder.svg', true, 'Streetwear Blantyre', 'Hoodies'),
  ('prod-hd-003', 'Hustle Hoodie', 'Never stop hoodie', 'hoodies', 'hustle', 55000, '/placeholder.svg', true, 'Streetwear Blantyre', 'Hoodies'),
  ('prod-cp-001', 'SB Snapback', 'Classic snapback cap', 'caps', 'music', 15000, '/placeholder.svg', true, 'Streetwear Blantyre', 'Caps'),
  ('prod-cp-002', 'Faith Cap', 'Faith over fear cap', 'caps', 'faith', 15000, '/placeholder.svg', true, 'Streetwear Blantyre', 'Caps'),
  ('prod-cp-003', 'Hustle Cap', 'Grind time cap', 'caps', 'hustle', 15000, '/placeholder.svg', true, 'Streetwear Blantyre', 'Caps'),
  ('prod-hc-001', 'SB Hut Cap', 'Wool hut cap', 'hut-caps', 'music', 12000, '/placeholder.svg', true, 'Streetwear Blantyre', 'Hut Caps'),
  ('prod-hc-002', 'Winter Hut Cap', 'Warm winter hut cap', 'hut-caps', 'sports', 12000, '/placeholder.svg', true, 'Streetwear Blantyre', 'Hut Caps'),
  ('prod-br-001', 'Culture Bracelet', 'Handcrafted beaded bracelet', 'bracelets', 'music', 5000, '/placeholder.svg', true, 'Streetwear Blantyre', 'Bracelets'),
  ('prod-br-002', 'Faith Bracelet', 'Faith-themed bracelet', 'bracelets', 'faith', 5000, '/placeholder.svg', true, 'Streetwear Blantyre', 'Bracelets'),
  ('prod-br-003', 'Hustle Bracelet', 'Grind mode bracelet', 'bracelets', 'hustle', 5000, '/placeholder.svg', true, 'Streetwear Blantyre', 'Bracelets'),
  ('prod-sk-001', 'SB Crew Socks', 'Premium cotton crew socks', 'socks', 'music', 8000, '/placeholder.svg', true, 'Streetwear Blantyre', 'Socks'),
  ('prod-sk-002', 'Culture Socks', 'Streetwear pattern socks', 'socks', 'sports', 8000, '/placeholder.svg', true, 'Streetwear Blantyre', 'Socks'),
  ('prod-st-001', 'SB Logo Sticker', 'Die-cut vinyl sticker', 'stickers', 'music', 2000, '/placeholder.svg', true, 'Streetwear Blantyre', 'Stickers'),
  ('prod-st-002', 'Culture Pack Stickers', 'Set of 5 culture stickers', 'stickers', 'hustle', 5000, '/placeholder.svg', true, 'Streetwear Blantyre', 'Stickers'),
  ('prod-eb-001', 'SB Wireless Earbuds', 'Bluetooth wireless earbuds', 'earbuds', 'music', 35000, '/placeholder.svg', true, 'Streetwear Blantyre', 'Earbuds'),
  ('prod-eb-002', 'Sports Earbuds', 'Sports edition earbuds', 'earbuds', 'sports', 35000, '/placeholder.svg', true, 'Streetwear Blantyre', 'Earbuds')
ON CONFLICT (id) DO NOTHING;
