-- Add extra columns to products table
-- Run this in Supabase SQL Editor

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS images TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_best_seller BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS description TEXT;