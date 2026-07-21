-- Testimonials table for customer reviews
-- Run via Supabase SQL Editor

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'testimonials' AND schemaname = 'public') THEN
    CREATE TABLE public.testimonials (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      role TEXT,
      message TEXT NOT NULL,
      rating INTEGER NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
      image TEXT,
      is_active BOOLEAN NOT NULL DEFAULT true,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

    -- Default testimonials
    INSERT INTO public.testimonials (name, role, message, rating, is_active, sort_order) VALUES
    ('Chimwemwe Phiri', 'Student, Lilongwe', 'PowerPods saved my campus life! Best sound quality for studying and the delivery was super fast.', 5, true, 1),
    ('Grace Banda', 'Business Owner, Blantyre', 'Best accessories in Malawi. My hotel guests love the speakers. Fast delivery across Malawi!', 5, true, 2),
    ('Davies Mkandawire', 'Tech Enthusiast, Mzuzu', 'Genuine products at great prices. The wireless charger is a game changer for my desk setup.', 4, true, 3);
  END IF;
END $$;

-- Add columns to products if not exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'is_featured'
  ) THEN
    ALTER TABLE public.products ADD COLUMN is_featured BOOLEAN DEFAULT false;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'is_best_seller'
  ) THEN
    ALTER TABLE public.products ADD COLUMN is_best_seller BOOLEAN DEFAULT false;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'images'
  ) THEN
    ALTER TABLE public.products ADD COLUMN images TEXT[];
  END IF;
END $$;