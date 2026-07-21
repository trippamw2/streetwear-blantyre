-- Add missing order columns for checkout flow
-- Run via Supabase SQL Editor

-- Add payment_method column if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN payment_method TEXT;
  END IF;
END $$;

-- Add subtotal_mwk column if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'subtotal_mwk'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN subtotal_mwk INTEGER;
  END IF;
END $$;

-- Add delivery_fee_mwk column if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'delivery_fee_mwk'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN delivery_fee_mwk INTEGER;
  END IF;
END $$;

-- Add delivery_method column if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'delivery_method'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN delivery_method TEXT DEFAULT 'standard';
  END IF;
END $$;

-- Drop payment_status enum if exists and recreate with more options
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
    DROP TYPE public.payment_status;
  END IF;
END $$;

DO $$ 
BEGIN
  CREATE TYPE public.payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
  ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status public.payment_status DEFAULT 'pending';
END $$;