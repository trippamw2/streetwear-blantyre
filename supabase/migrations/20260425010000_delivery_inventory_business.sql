-- Delivery Companies
CREATE TABLE public.delivery_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  website TEXT,
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_same_day BOOLEAN NOT NULL DEFAULT false,
  service_area TEXT[], -- ['blantyre', 'lilongwe', 'mzuzu', 'all']
  estimated_days INTEGER,
  base_fee_mwk INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.delivery_companies ENABLE ROW LEVEL SECURITY;

-- Default delivery companies
INSERT INTO public.delivery_companies (name, slug, description, is_active, is_same_day, service_area, estimated_days, base_fee_mwk) VALUES
  ('Same Day Delivery (Blantyre)', 'same-day', 'Delivery within Blantyre on the same day', true, true, ARRAY['blantyre'], 0, 500),
  ('CTS Courier', 'cts', 'CTS Courier Services - Nationwide delivery', true, false, ARRAY['all'], 3, 1500),
  ('Speed Courier', 'speed', 'Speed Courier - Fast nationwide', true, false, ARRAY['all'], 2, 2000),
  ('Ankolo Logistics', 'ankolo', 'Ankolo Logistics - Reliable delivery', true, false, ARRAY['all'], 4, 1200),
  ('VIP Transport', 'vip', 'VIP Transport - Premium delivery', true, false, ARRAY['all'], 3, 1800),
  ('Malawi Post Office', 'post-office', 'Malawi Post Office - Traditional postal', true, false, ARRAY['all'], 7, 800);

-- Delivery Options per order
CREATE TABLE public.delivery_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.delivery_companies(id),
  tracking_number TEXT,
  fee_mwk INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, picked_up, in_transit, out_for_delivery, delivered, failed
  estimated_delivery DATE,
  actual_delivery DATE,
  delivery_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.delivery_options ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER delivery_options_updated_at BEFORE UPDATE ON public.delivery_options
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Business Accounts (B2B customers)
CREATE TABLE public.business_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  company_name TEXT NOT NULL,
  business_type TEXT, -- retailer, wholesaler, corporate, hospital, school, hotel
  tax_id TEXT,
  credit_limit_mwk INTEGER DEFAULT 0,
  payment_terms TEXT DEFAULT 'prepaid', -- prepaid, net15, net30, net60
  account_manager_id UUID REFERENCES auth.users(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.business_accounts ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER business_accounts_updated_at BEFORE UPDATE ON public.business_accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Inventory management
CREATE TABLE public.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT NOT NULL, -- Matches product.id from frontend
  sku TEXT UNIQUE,
  quantity INTEGER NOT NULL DEFAULT 0,
  reserved_quantity INTEGER NOT NULL DEFAULT 0,
  reorder_level INTEGER NOT NULL DEFAULT 5,
  cost_price_mwk INTEGER,
  location TEXT, -- Warehouse location
  last_restocked DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- Inventory transactions
CREATE TABLE public.inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id UUID NOT NULL REFERENCES public.inventory(id) ON DELETE CASCADE,
  quantity_change INTEGER NOT NULL, -- positive for additions, negative for deductions
  type TEXT NOT NULL, -- restock, sale, adjustment, return, damaged
  reference_id UUID, -- order_id if sale
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;

-- Sales analytics view
CREATE TABLE public.daily_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  total_orders INTEGER NOT NULL DEFAULT 0,
  total_revenue_mwk INTEGER NOT NULL DEFAULT 0,
  total_items INTEGER NOT NULL DEFAULT 0,
  unique_customers INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (date)
);

-- Payment links (for MoMo/Airtel Money)
CREATE TABLE public.payment_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE UNIQUE,
  amount_mwk INTEGER NOT NULL,
  payment_method TEXT, -- momo, airtel, bank
  phone_number TEXT,
  reference TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, sent, paid, failed, expired
  expires_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  transaction_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payment_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies for new tables
-- Delivery companies: public read, admin write
CREATE POLICY "Public read delivery companies" ON public.delivery_companies
  FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Admin manage delivery companies" ON public.delivery_companies
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Delivery options: user read own, admin read all
CREATE POLICY "Users read own delivery" ON public.delivery_options
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = delivery_options.order_id AND o.user_id = auth.uid())
  );
CREATE POLICY "Admins read delivery" ON public.delivery_options
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Business accounts: user read own, admin read all
CREATE POLICY "Users read own business" ON public.business_accounts
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins read business" ON public.business_accounts
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Inventory: admin only
CREATE POLICY "Admins manage inventory" ON public.inventory
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins manage inventory_transactions" ON public.inventory_transactions
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Payment links: user read own, admin all
CREATE POLICY "Users read own payment" ON public.payment_links
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = payment_links.order_id AND o.user_id = auth.uid())
  );
CREATE POLICY "Admins read payment" ON public.payment_links
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );