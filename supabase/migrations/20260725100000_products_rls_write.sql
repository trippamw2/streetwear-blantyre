-- Add INSERT, UPDATE, DELETE policies for authenticated users on products
-- This allows admin panel CRUD operations

-- Allow authenticated users to insert products
CREATE POLICY "Authenticated can insert products" ON products
FOR INSERT TO authenticated WITH CHECK (true);

-- Allow authenticated users to update products
CREATE POLICY "Authenticated can update products" ON products
FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Allow authenticated users to delete products
CREATE POLICY "Authenticated can delete products" ON products
FOR DELETE TO authenticated USING (true);
