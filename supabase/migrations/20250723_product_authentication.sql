-- ============================================================
-- Product Authentication & Digital Product Passport
-- Streetwear Blantyre — Supabase Migration
-- ============================================================

-- 1. Product Authentication table
-- Each authenticated product has a unique serial + QR token
CREATE TABLE IF NOT EXISTS product_auth (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  -- Unique identifiers
  serial_number TEXT NOT NULL UNIQUE,
  qr_token TEXT NOT NULL UNIQUE,
  
  -- Product details at time of authentication
  product_name TEXT NOT NULL,
  product_image TEXT,
  collection TEXT,
  category TEXT,
  color TEXT,
  size TEXT,
  material TEXT,
  print_technique TEXT,
  fabric_weight TEXT,
  
  -- Edition info
  edition_number INTEGER,
  quantity_produced INTEGER,
  
  -- Manufacturing
  country_of_manufacture TEXT DEFAULT 'Malawi',
  manufacturing_date TEXT,
  
  -- Product story & care
  product_story TEXT,
  care_instructions TEXT,
  
  -- Status
  authentication_status TEXT NOT NULL DEFAULT 'active' CHECK (authentication_status IN ('active', 'retired', 'archived')),
  
  -- Scan tracking
  first_scan_date TIMESTAMPTZ,
  last_scan_date TIMESTAMPTZ,
  total_scans INTEGER DEFAULT 0,
  
  -- Ownership
  registered_owner_name TEXT,
  registered_owner_phone TEXT,
  registered_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Scan Logs table
-- Every QR scan is logged for security & analytics
CREATE TABLE IF NOT EXISTS scan_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_auth_id UUID NOT NULL REFERENCES product_auth(id) ON DELETE CASCADE,
  qr_token TEXT NOT NULL,
  
  -- Scan details
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  scan_result TEXT NOT NULL CHECK (scan_result IN ('authentic', 'failed', 'mismatch', 'retired', 'flagged')),
  
  -- Device/browser info
  device_type TEXT,
  browser TEXT,
  os TEXT,
  
  -- Location (optional, privacy-conscious)
  approximate_location TEXT,
  ip_hash TEXT,
  
  -- Security
  is_suspicious BOOLEAN DEFAULT false,
  suspicious_reason TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Product Ownership History
-- Track ownership transfers (optional)
CREATE TABLE IF NOT EXISTS product_ownership (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_auth_id UUID NOT NULL REFERENCES product_auth(id) ON DELETE CASCADE,
  
  owner_name TEXT NOT NULL,
  owner_phone TEXT,
  owner_email TEXT,
  
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_current_owner BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Admin Audit Log
-- Track admin actions on authentication system
CREATE TABLE IF NOT EXISTS auth_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL,
  
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  
  details JSONB,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Indexes ─────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_product_auth_token ON product_auth(qr_token);
CREATE INDEX IF NOT EXISTS idx_product_auth_serial ON product_auth(serial_number);
CREATE INDEX IF NOT EXISTS idx_product_auth_product_id ON product_auth(product_id);
CREATE INDEX IF NOT EXISTS idx_product_auth_collection ON product_auth(collection);
CREATE INDEX IF NOT EXISTS idx_product_auth_status ON product_auth(authentication_status);

CREATE INDEX IF NOT EXISTS idx_scan_logs_auth_id ON scan_logs(product_auth_id);
CREATE INDEX IF NOT EXISTS idx_scan_logs_token ON scan_logs(qr_token);
CREATE INDEX IF NOT EXISTS idx_scan_logs_scanned_at ON scan_logs(scanned_at);
CREATE INDEX IF NOT EXISTS idx_scan_logs_suspicious ON scan_logs(is_suspicious) WHERE is_suspicious = true;

CREATE INDEX IF NOT EXISTS idx_product_ownership_auth_id ON product_ownership(product_auth_id);

-- ─── RLS Policies ────────────────────────────────────────────────────

-- Enable RLS
ALTER TABLE product_auth ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_ownership ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_audit_log ENABLE ROW LEVEL SECURITY;

-- product_auth: Public read for verification, admin write
CREATE POLICY "Anyone can read product_auth for verification"
  ON product_auth FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage product_auth"
  ON product_auth FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- scan_logs: Public insert (anyone scanning), admin read
CREATE POLICY "Anyone can insert scan_logs"
  ON scan_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can read scan_logs"
  ON scan_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- product_ownership: Public insert, admin read
CREATE POLICY "Anyone can register ownership"
  ON product_ownership FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can read ownership"
  ON product_ownership FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- auth_audit_log: Admin only
CREATE POLICY "Admins can manage audit log"
  ON auth_audit_log FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- ─── Functions ───────────────────────────────────────────────────────

-- Generate unique serial number: SB-{YEAR}-{RANDOM}
CREATE OR REPLACE FUNCTION generate_serial_number()
RETURNS TEXT AS $$
DECLARE
  year_part TEXT;
  random_part TEXT;
  result TEXT;
  exists_count INTEGER;
BEGIN
  year_part := EXTRACT(YEAR FROM now())::TEXT;
  
  LOOP
    random_part := upper(substring(md5(random()::text) from 1 for 8));
    result := 'SB-' || year_part || '-' || random_part;
    
    SELECT COUNT(*) INTO exists_count
    FROM product_auth
    WHERE serial_number = result;
    
    EXIT WHEN exists_count = 0;
  END LOOP;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Generate unique QR token: cryptographically random, URL-safe
CREATE OR REPLACE FUNCTION generate_qr_token()
RETURNS TEXT AS $$
DECLARE
  token TEXT;
  exists_count INTEGER;
BEGIN
  LOOP
    -- Generate 32 random bytes, encode as hex (64 chars)
    token := encode(gen_random_bytes(32), 'hex');
    
    SELECT COUNT(*) INTO exists_count
    FROM product_auth
    WHERE qr_token = token;
    
    EXIT WHEN exists_count = 0;
  END LOOP;
  
  RETURN token;
END;
$$ LANGUAGE plpgsql;

-- Record a scan and detect suspicious activity
CREATE OR REPLACE FUNCTION record_scan(
  p_product_auth_id UUID,
  p_qr_token TEXT,
  p_scan_result TEXT,
  p_device_type TEXT DEFAULT NULL,
  p_browser TEXT DEFAULT NULL,
  p_os TEXT DEFAULT NULL,
  p_approximate_location TEXT DEFAULT NULL,
  p_ip_hash TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  scan_id UUID;
  recent_scans_from_other_locations INTEGER;
  suspicious BOOLEAN := false;
  suspicious_reason TEXT := NULL;
BEGIN
  -- Check for suspicious pattern: 3+ scans from different locations in last hour
  IF p_approximate_location IS NOT NULL THEN
    SELECT COUNT(DISTINCT approximate_location) INTO recent_scans_from_other_locations
    FROM scan_logs
    WHERE product_auth_id = p_product_auth_id
      AND scanned_at > now() - INTERVAL '1 hour'
      AND approximate_location IS NOT NULL
      AND approximate_location != p_approximate_location;
    
    IF recent_scans_from_other_locations >= 2 THEN
      suspicious := true;
      suspicious_reason := 'Multiple scans from different locations within 1 hour (' || (recent_scans_from_other_locations + 1) || ' locations)';
    END IF;
  END IF;
  
  -- Check for excessive scans: 10+ in last 24 hours
  IF NOT suspicious THEN
    SELECT COUNT(*) INTO recent_scans_from_other_locations
    FROM scan_logs
    WHERE product_auth_id = p_product_auth_id
      AND scanned_at > now() - INTERVAL '24 hours';
    
    IF recent_scans_from_other_locations >= 10 THEN
      suspicious := true;
      suspicious_reason := 'Excessive scans: ' || (recent_scans_from_other_locations + 1) || ' scans in 24 hours';
    END IF;
  END IF;
  
  -- Insert scan log
  INSERT INTO scan_logs (product_auth_id, qr_token, scan_result, device_type, browser, os, approximate_location, ip_hash, is_suspicious, suspicious_reason)
  VALUES (p_product_auth_id, p_qr_token, p_scan_result, p_device_type, p_browser, p_os, p_approximate_location, p_ip_hash, suspicious, suspicious_reason)
  RETURNING id INTO scan_id;
  
  -- Update product_auth scan counts
  UPDATE product_auth
  SET 
    total_scans = total_scans + 1,
    last_scan_date = now(),
    first_scan_date = COALESCE(first_scan_date, now()),
    updated_at = now()
  WHERE id = p_product_auth_id;
  
  RETURN scan_id;
END;
$$ LANGUAGE plpgsql;
