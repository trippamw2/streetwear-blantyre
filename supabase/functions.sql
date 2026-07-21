-- PowerPod Database Functions
-- Run these in Supabase SQL Editor

-- ============================================
-- INVENTORY FUNCTIONS
-- ============================================

-- Function to reserve inventory (when order placed)
CREATE OR REPLACE FUNCTION reserve_inventory(p_product_id TEXT, p_quantity INTEGER)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE inventory
  SET reserved_quantity = COALESCE(reserved_quantity, 0) + p_quantity
  WHERE product_id = p_product_id;
END;
$$;

-- Function to confirm inventory sale (when payment received)
CREATE OR REPLACE FUNCTION confirm_inventory_sale(p_product_id TEXT, p_quantity INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  current_qty INTEGER;
BEGIN
  SELECT quantity INTO current_qty
  FROM inventory
  WHERE product_id = p_product_id;

  IF current_qty IS NULL THEN
    RETURN FALSE;
  END IF;

  IF current_qty < p_quantity THEN
    RETURN FALSE;
  END IF;

  UPDATE inventory
  SET quantity = quantity - p_quantity,
      reserved_quantity = GREATEST(0, COALESCE(reserved_quantity, 0) - p_quantity)
  WHERE product_id = p_product_id;

  RETURN TRUE;
END;
$$;

-- Function to release reserved inventory (when order cancelled)
CREATE OR REPLACE FUNCTION release_inventory(p_product_id TEXT, p_quantity INTEGER)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE inventory
  SET reserved_quantity = GREATEST(0, COALESCE(reserved_quantity, 0) - p_quantity)
  WHERE product_id = p_product_id;
END;
$$;

-- Function to restock inventory
CREATE OR REPLACE FUNCTION restock_inventory(p_product_id TEXT, p_quantity INTEGER)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE inventory
  SET quantity = quantity + p_quantity,
      last_restocked = NOW()
  WHERE product_id = p_product_id;
END;
$$;

-- ============================================
-- PROMO CODE FUNCTIONS
-- ============================================

-- Function to increment promo code usage
CREATE OR REPLACE FUNCTION increment_promo_usage(promo_code TEXT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE promo_codes
  SET used_count = COALESCE(used_count, 0) + 1
  WHERE code = promo_code;
END;
$$;

-- ============================================
-- PRODUCTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'all',
  brand TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Products Policies
DROP POLICY IF EXISTS "Products are viewable by everyone" ON products;
CREATE POLICY "Products are viewable by everyone" ON products FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can insert products" ON products;
CREATE POLICY "Anyone can insert products" ON products FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can update products" ON products;
CREATE POLICY "Anyone can update products" ON products FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Anyone can delete products" ON products;
CREATE POLICY "Anyone can delete products" ON products FOR DELETE USING (true);

-- ============================================
-- INVENTORY TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS inventory (
  id SERIAL PRIMARY KEY,
  product_id TEXT NOT NULL UNIQUE,
  quantity INTEGER NOT NULL DEFAULT 0,
  reserved_quantity INTEGER NOT NULL DEFAULT 0,
  reorder_level INTEGER NOT NULL DEFAULT 5,
  cost_price_mwk INTEGER DEFAULT 0,
  location TEXT,
  last_restocked TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

-- Inventory Policies
DROP POLICY IF EXISTS "Inventory is viewable by everyone" ON inventory;
CREATE POLICY "Inventory is viewable by everyone" ON inventory FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can insert inventory" ON inventory;
CREATE POLICY "Anyone can insert inventory" ON inventory FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can update inventory" ON inventory;
CREATE POLICY "Anyone can update inventory" ON inventory FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Anyone can delete inventory" ON inventory;
CREATE POLICY "Anyone can delete inventory" ON inventory FOR DELETE USING (true);

-- Create indexes
DROP INDEX IF EXISTS idx_products_category;
CREATE INDEX idx_products_category ON products(category);

DROP INDEX IF EXISTS idx_products_brand;
CREATE INDEX idx_products_brand ON products(brand);

DROP INDEX IF EXISTS idx_inventory_product_id;
CREATE INDEX idx_inventory_product_id ON inventory(product_id);