-- Site Settings table for promo banner
-- Run this in Supabase SQL Editor

CREATE TABLE public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read site settings" ON public.site_settings
  FOR SELECT TO public USING (true);

INSERT INTO public.site_settings (key, value, description) VALUES
  ('promo_banner_text', '🔥 Free delivery on orders over MWK 50,000 • New deals added daily!', 'Text shown in promotion banner')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.site_settings (key, value, description) VALUES
  ('free_delivery_threshold', '50000', 'Minimum order amount for free delivery')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.site_settings (key, value, description) VALUES
  ('delivery_fee', '2000', 'Standard delivery fee')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.site_settings (key, value, description) VALUES
  ('whatsapp_number', '+265XXXXXXXXX', 'WhatsApp contact number')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.site_settings (key, value, description) VALUES
  ('whatsapp_default_message', 'Hi! I would like to place an order.', 'Default WhatsApp message')
ON CONFLICT (key) DO NOTHING;