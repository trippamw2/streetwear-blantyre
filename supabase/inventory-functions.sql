-- Run this in Supabase SQL Editor - run each statement separately

-- 1. Create reserve_inventory function
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

-- 2. Create confirm_inventory_sale function
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

-- 3. Create release_inventory function
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

-- 4. Create restock_inventory function
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