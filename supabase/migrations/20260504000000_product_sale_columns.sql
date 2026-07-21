-- Add sale/discount columns to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_on_sale boolean DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS discount_percent integer DEFAULT 0;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_products_is_best_seller ON products(is_best_seller) WHERE is_best_seller = true;
CREATE INDEX IF NOT EXISTS idx_products_is_on_sale ON products(is_on_sale) WHERE is_on_sale = true;

-- RLS policies for new columns
DROP POLICY IF EXISTS "Anon can read products sale" ON public.products;
CREATE POLICY "Anon can read products sale" ON public.products FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Authenticated can update products sale" ON public.products;
CREATE POLICY "Authenticated can update products sale" ON public.products FOR UPDATE TO authenticated USING (true) WITH CHECK (true);