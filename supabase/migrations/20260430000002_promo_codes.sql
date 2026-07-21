-- PowerPod Promo Codes System

-- Promo Codes Table
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  type VARCHAR(20) NOT NULL CHECK (type IN ('percentage', 'fixed')),
  value INTEGER NOT NULL,
  min_order INTEGER DEFAULT 0,
  max_uses INTEGER DEFAULT 100,
  used_count INTEGER DEFAULT 0,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- WhatsApp Campaigns Table
CREATE TABLE IF NOT EXISTS whatsapp_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  sent_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add discount columns to orders if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'discount_mwk') THEN
    ALTER TABLE orders ADD COLUMN discount_mwk INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'promo_code') THEN
    ALTER TABLE orders ADD COLUMN promo_code VARCHAR(20);
  END IF;
END $$;

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);

-- Function to increment promo usage
CREATE OR REPLACE FUNCTION increment_promo_usage(promo_code TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE promo_codes 
  SET used_count = used_count + 1 
  WHERE code = promo_code AND is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Sample Promo Codes (optional - admin can add more)
INSERT INTO promo_codes (code, name, description, type, value, min_order, max_uses, end_date) VALUES
('WELCOME10', 'Welcome Discount', 'First order discount', 'percentage', 10, 0, 50, NOW() + INTERVAL '30 days'),
('POWER25', 'Power Sale', 'Holiday sale', 'percentage', 25, 50000, 200, NOW() + INTERVAL '14 days'),
('FREESHIP', 'Free Delivery', 'Free shipping promo', 'fixed', 5000, 50000, 100, NOW() + INTERVAL '7 days')
ON CONFLICT (code) DO NOTHING;