-- Simpler version - run each separately in Supabase

-- reserve_inventory function
CREATE FUNCTION reserve_inventory(TEXT, INTEGER) RETURNS VOID LANGUAGE plpgsql AS 'BEGIN UPDATE inventory SET reserved_quantity = COALESCE(reserved_quantity, 0) + $2 WHERE product_id = $1; END;';

-- confirm_inventory_sale function  
CREATE FUNCTION confirm_inventory_sale(TEXT, INTEGER) RETURNS BOOLEAN LANGUAGE plpgsql AS 'DECLARE qty INTEGER; BEGIN SELECT quantity INTO qty FROM inventory WHERE product_id = $1; IF qty IS NULL OR qty < $2 THEN RETURN FALSE; END IF; UPDATE inventory SET quantity = quantity - $2, reserved_quantity = GREATEST(0, COALESCE(reserved_quantity, 0) - $2) WHERE product_id = $1; RETURN TRUE; END;';

-- release_inventory function
CREATE FUNCTION release_inventory(TEXT, INTEGER) RETURNS VOID LANGUAGE plpgsql AS 'BEGIN UPDATE inventory SET reserved_quantity = GREATEST(0, COALESCE(reserved_quantity, 0) - $2) WHERE product_id = $1; END;';

-- restock_inventory function
CREATE FUNCTION restock_inventory(TEXT, INTEGER) RETURNS VOID LANGUAGE plpgsql AS 'BEGIN UPDATE inventory SET quantity = quantity + $2, last_restocked = NOW() WHERE product_id = $1; END;';