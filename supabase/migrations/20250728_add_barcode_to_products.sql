-- Add barcode column to products table
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/qhpemjwrnnuqhfgifxnh/sql

-- Add barcode column
ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode TEXT;

-- Create unique index on barcode (allow nulls for existing products)
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_barcode ON products (barcode) WHERE barcode IS NOT NULL;

-- Generate barcodes for existing products that don't have one
UPDATE products 
SET barcode = 'SB-' || EXTRACT(YEAR FROM NOW()) || '-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 8))
WHERE barcode IS NULL;

-- Verify
SELECT id, name, barcode FROM products ORDER BY name;
