-- Run this SQL in Supabase SQL Editor to fix all issues
-- =====================

-- 1. Add missing order columns
ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal_mwk INTEGER DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_fee_mwk INTEGER DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_mwk INTEGER DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'paychangu';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_method TEXT DEFAULT 'standard';

-- 2. Create triggers if missing (for created_at/updated_at auto-fill)

-- Function to set timestamps
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Orders trigger
DROP TRIGGER IF EXISTS orders_updated_at ON orders;
CREATE TRIGGER orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Order items trigger
DROP TRIGGER IF EXISTS order_items_updated_at ON order_items;
CREATE TRIGGER order_items_updated_at
BEFORE UPDATE ON order_items
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. Ensure RLS policies exist for orders
-- (Should already exist from previous migrations)

-- 4. Enable anon key access if needed
-- ALTER DATABASE postgres SET jwt.anonymous TO "enabled";

-- 5. Test queries
-- SELECT * FROM orders ORDER BY created_at DESC LIMIT 5;
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'orders';