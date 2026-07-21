-- ============================================
-- POWERPOD DELIVERY SYSTEM (FIXED VERSION)
-- ============================================

-- Enable UUID extension (IMPORTANT)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- DELIVERY ZONES
-- ============================================
CREATE TABLE IF NOT EXISTS delivery_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) NOT NULL UNIQUE,
  region VARCHAR(50) NOT NULL,
  express_eta VARCHAR(50) NOT NULL,
  standard_eta VARCHAR(50) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert zones (safe due to UNIQUE constraint on code)
INSERT INTO delivery_zones (name, code, region, express_eta, standard_eta)
VALUES
('Blantyre Hub', 'blantyre', 'Southern', 'Same day', '1-2 days'),
('Southern Region', 'southern', 'Southern', 'Next day', '2-3 days'),
('Central Region', 'central', 'Central', '1-2 days', '2-4 days'),
('Northern Region', 'northern', 'Northern', '2-3 days', '4-6 days')
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- DELIVERY METHODS
-- ============================================
CREATE TABLE IF NOT EXISTS delivery_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  code VARCHAR(20) NOT NULL UNIQUE,
  base_fee INTEGER NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO delivery_methods (name, code, base_fee, description)
VALUES
('Standard Delivery', 'standard', 5000, '3-5 business days'),
('Express Delivery', 'express', 8500, '1-2 business days')
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- DELIVERY PRICING RULES
-- ============================================
CREATE TABLE IF NOT EXISTS delivery_pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID REFERENCES delivery_zones(id),
  method_id UUID REFERENCES delivery_methods(id),
  fee INTEGER NOT NULL,
  free_threshold INTEGER DEFAULT 50000,
  min_order_amount INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(zone_id, method_id)
);

-- Safe insert pricing rules
INSERT INTO delivery_pricing_rules (zone_id, method_id, fee)
SELECT 
  z.id,
  m.id,
  CASE 
    WHEN m.code = 'express' THEN 8500
    ELSE 5000
  END
FROM delivery_zones z
CROSS JOIN delivery_methods m
ON CONFLICT DO NOTHING;

-- ============================================
-- ORDERS TABLE EXTENSIONS (SAFE)
-- ============================================

ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_zone VARCHAR(20);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_method VARCHAR(20) DEFAULT 'standard';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_fee INTEGER DEFAULT 5000;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS estimated_delivery DATE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS actual_delivery DATE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_notes TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS courier_name VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(50);

-- FIX: avoid duplicate definition conflict
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_status VARCHAR(30) DEFAULT 'pending';

-- ============================================
-- DISPATCH LOGS
-- ============================================
CREATE TABLE IF NOT EXISTS dispatch_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL,
  notes TEXT,
  location VARCHAR(200),
  assigned_to VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- DELIVERY AGENTS
-- ============================================
CREATE TABLE IF NOT EXISTS delivery_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  zone_id UUID REFERENCES delivery_zones(id),
  vehicle_type VARCHAR(50),
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_orders_delivery_zone ON orders(delivery_zone);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_method ON orders(delivery_method);
CREATE INDEX IF NOT EXISTS idx_orders_estimated_delivery ON orders(estimated_delivery);
CREATE INDEX IF NOT EXISTS idx_dispatch_logs_order ON dispatch_logs(order_id);

-- ============================================
-- FUNCTION: DELIVERY FEE (FIXED SAFETY)
-- ============================================
CREATE OR REPLACE FUNCTION calc_delivery_fee(
  p_zone_code VARCHAR,
  p_method VARCHAR,
  p_subtotal INTEGER
)
RETURNS INTEGER AS $$
DECLARE
  v_fee INTEGER := 5000;
  v_free_threshold INTEGER := 50000;
BEGIN
  IF p_subtotal >= v_free_threshold THEN
    RETURN 0;
  END IF;

  SELECT COALESCE(dpr.fee, 5000)
  INTO v_fee
  FROM delivery_pricing_rules dpr
  JOIN delivery_zones dz ON dpr.zone_id = dz.id
  JOIN delivery_methods dm ON dpr.method_id = dm.id
  WHERE dz.code = p_zone_code
    AND dm.code = p_method
    AND dpr.is_active = true
  LIMIT 1;

  RETURN COALESCE(v_fee, 5000);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: ETA CALC (FIXED NULL SAFETY)
-- ============================================
CREATE OR REPLACE FUNCTION calc_eta(
  p_zone_code VARCHAR,
  p_method VARCHAR
)
RETURNS DATE AS $$
DECLARE
  v_days INTEGER := 2;
BEGIN
  SELECT CASE
    WHEN p_method = 'express' THEN
      CASE dz.code
        WHEN 'blantyre' THEN 0
        WHEN 'southern' THEN 1
        WHEN 'central' THEN 1
        WHEN 'northern' THEN 2
        ELSE 1
      END
    ELSE
      CASE dz.code
        WHEN 'blantyre' THEN 1
        WHEN 'southern' THEN 2
        WHEN 'central' THEN 3
        WHEN 'northern' THEN 4
        ELSE 3
      END
  END
  INTO v_days
  FROM delivery_zones dz
  WHERE dz.code = p_zone_code;

  RETURN CURRENT_DATE + COALESCE(v_days, 2);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VIEW: DELIVERY DASHBOARD
-- ============================================
CREATE OR REPLACE VIEW delivery_dashboard AS
SELECT 
  o.id AS order_id,
  o.customer_name,
  o.customer_phone,
  o.total_mwk,
  o.status,
  o.delivery_status,
  o.delivery_method,
  o.delivery_zone,
  dz.name AS zone_name,
  dz.region,
  o.estimated_delivery,
  o.tracking_number
FROM orders o
LEFT JOIN delivery_zones dz ON o.delivery_zone = dz.code;

-- ============================================
-- VIEW: REVENUE ANALYTICS
-- ============================================
CREATE OR REPLACE VIEW revenue_by_delivery AS
SELECT 
  delivery_method,
  COUNT(*) AS order_count,
  SUM(total_mwk) AS revenue,
  SUM(delivery_fee) AS delivery_revenue,
  AVG(delivery_fee) AS avg_fee
FROM orders
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY delivery_method;