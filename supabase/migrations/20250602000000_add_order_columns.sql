-- Add missing columns to orders table for checkout
-- Run this in Supabase SQL Editor

-- Add columns if they don't exist
ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal_mwk INTEGER DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_fee_mwk INTEGER DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_mwk INTEGER DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'paychangu';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_method TEXT DEFAULT 'standard';

-- Add user_id column if it doesn't exist (rename from customer_id)
-- First check if customer_id exists, if so rename it
-- ALTER TABLE orders RENAME COLUMN customer_id TO user_id;

-- Or add user_id if it's missing (table uses user_id already)
-- This is handled in the main migration

-- Verify the columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name IN ('user_id', 'subtotal_mwk', 'delivery_fee_mwk', 'discount_mwk', 'payment_method', 'delivery_method', 'customer_name', 'customer_phone', 'customer_location', 'total_mwk', 'status');