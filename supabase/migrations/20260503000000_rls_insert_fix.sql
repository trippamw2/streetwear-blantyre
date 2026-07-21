-- Fix RLS policies for product reviews and combos (allow inserts from frontend)
-- Run this in Supabase SQL Editor

-- Product reviews insert policy for anon users
DROP POLICY IF EXISTS "Anon can insert product_reviews" ON public.product_reviews;
CREATE POLICY "Anon can insert product_reviews" ON public.product_reviews
  FOR INSERT TO anon
  WITH CHECK (true);

-- Product reviews select policy
DROP POLICY IF EXISTS "Anon can select product_reviews" ON public.product_reviews;
CREATE POLICY "Anon can select product_reviews" ON public.product_reviews
  FOR SELECT TO anon
  USING (true);

-- Combos insert policy for authenticated users (admin only)
DROP POLICY IF EXISTS "Authenticated can insert combos" ON public.combos;
CREATE POLICY "Authenticated can insert combos" ON public.combos
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Combos update policy for authenticated users
DROP POLICY IF EXISTS "Authenticated can update combos" ON public.combos;
CREATE POLICY "Authenticated can update combos" ON public.combos
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- Combos delete policy for authenticated users
DROP POLICY IF EXISTS "Authenticated can delete combos" ON public.combos;
CREATE POLICY "Authenticated can delete combos" ON public.combos
  FOR DELETE TO authenticated
  USING (true);

-- Combo items insert policy
DROP POLICY IF EXISTS "Authenticated can insert combo_items" ON public.combo_items;
CREATE POLICY "Authenticated can insert combo_items" ON public.combo_items
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Combo items delete policy
DROP POLICY IF EXISTS "Authenticated can delete combo_items" ON public.combo_items;
CREATE POLICY "Authenticated can delete combo_items" ON public.combo_items
  FOR DELETE TO authenticated
  USING (true);