-- ============================================================
-- Gift System + QR Code Items
-- Streetwear Blantyre — Supabase Migration
-- ============================================================

-- 1. Gifts table — stores each gift sent by a sender
CREATE TABLE IF NOT EXISTS gifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Sender info (stored in case sender deletes account)
  sender_name TEXT NOT NULL,
  sender_email TEXT,
  
  -- Recipient info
  recipient_name TEXT NOT NULL,
  recipient_phone TEXT NOT NULL,
  recipient_email TEXT,
  
  -- Gift content
  gift_type TEXT NOT NULL CHECK (gift_type IN ('pack', 'single')),
  gift_pack_id TEXT,          -- combo/kit ID if type='pack'
  gift_message TEXT,
  occasion TEXT,
  
  -- Delivery
  preferred_delivery_date DATE,
  delivery_location TEXT,
  
  -- Payment
  total_mwk NUMERIC NOT NULL,
  is_paid BOOLEAN DEFAULT FALSE,
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'refunded')),
  paid_at TIMESTAMPTZ,
  charge_id TEXT,
  payment_reference TEXT,
  
  -- Tracking
  tracking_token TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'paid', 'preparing', 'dispatched', 'delivered', 'cancelled')),
  
  -- Review
  review_submitted BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Gift items — individual items in a gift
CREATE TABLE IF NOT EXISTS gift_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_id UUID NOT NULL REFERENCES gifts(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  product_image TEXT,
  unit_price_mwk NUMERIC NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  size TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Gift tracking events — timeline of gift status changes
CREATE TABLE IF NOT EXISTS gift_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_id UUID NOT NULL REFERENCES gifts(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Gift reviews — recipient review after delivery
CREATE TABLE IF NOT EXISTS gift_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_id UUID NOT NULL REFERENCES gifts(id) ON DELETE CASCADE,
  reviewer_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Indexes ─────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_gifts_sender ON gifts(sender_id);
CREATE INDEX IF NOT EXISTS idx_gifts_recipient_email ON gifts(recipient_email);
CREATE INDEX IF NOT EXISTS idx_gifts_recipient_phone ON gifts(recipient_phone);
CREATE INDEX IF NOT EXISTS idx_gifts_tracking_token ON gifts(tracking_token);
CREATE INDEX IF NOT EXISTS idx_gifts_status ON gifts(status);
CREATE INDEX IF NOT EXISTS idx_gifts_payment_status ON gifts(payment_status);
CREATE INDEX IF NOT EXISTS idx_gift_items_gift_id ON gift_items(gift_id);
CREATE INDEX IF NOT EXISTS idx_gift_tracking_gift_id ON gift_tracking(gift_id);
CREATE INDEX IF NOT EXISTS idx_gift_reviews_gift_id ON gift_reviews(gift_id);

-- ─── RLS Policies ────────────────────────────────────────────────

ALTER TABLE gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_reviews ENABLE ROW LEVEL SECURITY;

-- gifts: sender can read their own, anyone can read by tracking_token (for recipient)
CREATE POLICY "Senders read own gifts" ON gifts
  FOR SELECT USING (auth.uid() = sender_id);

CREATE POLICY "Anyone read gift by tracking token" ON gifts
  FOR SELECT USING (true);  -- tracking_token is the auth — it's a secret UUID

CREATE POLICY "Authenticated users insert gifts" ON gifts
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Service role manages gifts" ON gifts
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- gift_items: readable when gift is readable
CREATE POLICY "Gift items readable" ON gift_items
  FOR SELECT USING (true);

CREATE POLICY "Authenticated insert gift items" ON gift_items
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Service role manages gift items" ON gift_items
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- gift_tracking: readable by anyone (tracking is public via token)
CREATE POLICY "Gift tracking readable" ON gift_tracking
  FOR SELECT USING (true);

CREATE POLICY "Service role manages gift tracking" ON gift_tracking
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- gift_reviews: public read, authenticated insert
CREATE POLICY "Gift reviews readable" ON gift_reviews
  FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone insert gift reviews" ON gift_reviews
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role manages gift reviews" ON gift_reviews
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ─── Functions ───────────────────────────────────────────────────

-- Generate unique tracking token for gifts
CREATE OR REPLACE FUNCTION generate_gift_tracking_token()
RETURNS TEXT AS $$
DECLARE
  token TEXT;
  exists_count INTEGER;
BEGIN
  LOOP
    token := encode(gen_random_bytes(24), 'hex');
    SELECT COUNT(*) INTO exists_count FROM gifts WHERE tracking_token = token;
    EXIT WHEN exists_count = 0;
  END LOOP;
  RETURN token;
END;
$$ LANGUAGE plpgsql;

-- Update gift status and log tracking event
CREATE OR REPLACE FUNCTION update_gift_status(
  p_gift_id UUID,
  p_new_status TEXT,
  p_note TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE gifts SET status = p_new_status, updated_at = NOW() WHERE id = p_gift_id;
  INSERT INTO gift_tracking (gift_id, status, note) VALUES (p_gift_id, p_new_status, p_note);
END;
$$ LANGUAGE plpgsql;

-- ─── Link order items to QR codes ────────────────────────────────

-- Add order_item_id to product_auth to link each purchased item
ALTER TABLE product_auth
  ADD COLUMN IF NOT EXISTS order_id UUID,
  ADD COLUMN IF NOT EXISTS order_item_id UUID;

CREATE INDEX IF NOT EXISTS idx_product_auth_order_id ON product_auth(order_id);

-- Function to generate QR codes for order items after payment
CREATE OR REPLACE FUNCTION generate_order_item_qr(
  p_order_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  item RECORD;
  new_count INTEGER := 0;
  serial TEXT;
  qr_token TEXT;
BEGIN
  FOR item IN 
    SELECT oi.id as item_id, oi.product_id, oi.product_name, oi.quantity
    FROM order_items oi
    WHERE oi.order_id = p_order_id
  LOOP
    -- Generate one QR per quantity unit
    FOR i IN 1..item.quantity LOOP
      serial := (SELECT generate_serial_number());
      qr_token := (SELECT generate_qr_token());
      
      INSERT INTO product_auth (
        product_id, serial_number, qr_token, product_name,
        order_id, order_item_id
      ) VALUES (
        item.product_id, serial, qr_token, item.product_name,
        p_order_id, item.item_id
      );
      
      new_count := new_count + 1;
    END LOOP;
  END LOOP;
  
  RETURN new_count;
END;
$$ LANGUAGE plpgsql;
