-- Add brand column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand TEXT DEFAULT 'generic';

-- Update existing products with default brand
UPDATE products SET brand = 'generic' WHERE brand IS NULL;