-- ============================================================
-- Culture Storytelling Layer — Global Street Culture
-- Streetwear Blantyre — Supabase Migration
-- ============================================================

-- 1. Culture Stories — editorial/blog posts about global street culture
CREATE TABLE IF NOT EXISTS culture_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  hero_image TEXT,
  culture_pillar TEXT NOT NULL CHECK (culture_pillar IN ('music', 'sports', 'faith', 'hustle')),
  tags TEXT[] DEFAULT '{}',
  is_published BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  author_name TEXT DEFAULT 'Streetwear Blantyre',
  read_time_minutes INTEGER DEFAULT 5,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Lookbooks — curated visual collections
CREATE TABLE IF NOT EXISTS lookbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  hero_image TEXT,
  season TEXT,
  culture_pillar TEXT CHECK (culture_pillar IN ('music', 'sports', 'faith', 'hustle')),
  is_published BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Lookbook Items — products in a lookbook with editorial context
CREATE TABLE IF NOT EXISTS lookbook_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lookbook_id UUID NOT NULL REFERENCES lookbooks(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  editorial_note TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Add culture_story column to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS culture_story TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS culture_context TEXT;

-- ─── Indexes ─────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_culture_stories_pillar ON culture_stories(culture_pillar);
CREATE INDEX IF NOT EXISTS idx_culture_stories_published ON culture_stories(is_published);
CREATE INDEX IF NOT EXISTS idx_culture_stories_featured ON culture_stories(is_featured);
CREATE INDEX IF NOT EXISTS idx_culture_stories_slug ON culture_stories(slug);
CREATE INDEX IF NOT EXISTS idx_lookbooks_pillar ON lookbooks(culture_pillar);
CREATE INDEX IF NOT EXISTS idx_lookbooks_published ON lookbooks(is_published);
CREATE INDEX IF NOT EXISTS idx_lookbooks_slug ON lookbooks(slug);
CREATE INDEX IF NOT EXISTS idx_lookbook_items_lookbook ON lookbook_items(lookbook_id);
CREATE INDEX IF NOT EXISTS idx_lookbook_items_product ON lookbook_items(product_id);

-- ─── RLS Policies ────────────────────────────────────────────────
ALTER TABLE culture_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE lookbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE lookbook_items ENABLE ROW LEVEL SECURITY;

-- culture_stories: public read published, admin manage all
CREATE POLICY "Published stories readable" ON culture_stories
  FOR SELECT USING (is_published = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin manage culture stories" ON culture_stories
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- lookbooks: public read published, admin manage all
CREATE POLICY "Published lookbooks readable" ON lookbooks
  FOR SELECT USING (is_published = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin manage lookbooks" ON lookbooks
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- lookbook_items: public read (when lookbook is published), admin manage all
CREATE POLICY "Lookbook items readable" ON lookbook_items
  FOR SELECT USING (true);

CREATE POLICY "Admin manage lookbook items" ON lookbook_items
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ─── Helper Functions ────────────────────────────────────────────

-- Generate URL-safe slug from title
CREATE OR REPLACE FUNCTION generate_slug(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(regexp_replace(
    regexp_replace(
      regexp_replace(input_text, '[^a-zA-Z0-9\s-]', '', 'g'),
      '\s+', '-', 'g'
    ),
    '-+', '-', 'g'
  ));
END;
$$ LANGUAGE plpgsql;

-- Auto-set slug on culture_stories insert
CREATE OR REPLACE FUNCTION set_culture_story_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_slug(NEW.title);
    -- Ensure uniqueness
    WHILE EXISTS (SELECT 1 FROM culture_stories WHERE slug = NEW.slug AND id != NEW.id) LOOP
      NEW.slug := NEW.slug || '-' || substr(md5(random()::text), 1, 4);
    END LOOP;
  END IF;
  IF NEW.published_at IS NULL AND NEW.is_published = true THEN
    NEW.published_at := NOW();
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_culture_story_slug
  BEFORE INSERT OR UPDATE ON culture_stories
  FOR EACH ROW EXECUTE FUNCTION set_culture_story_slug();

-- Auto-set slug on lookbooks insert
CREATE OR REPLACE FUNCTION set_lookbook_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_slug(NEW.title);
    WHILE EXISTS (SELECT 1 FROM lookbooks WHERE slug = NEW.slug AND id != NEW.id) LOOP
      NEW.slug := NEW.slug || '-' || substr(md5(random()::text), 1, 4);
    END LOOP;
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_lookbook_slug
  BEFORE INSERT OR UPDATE ON lookbooks
  FOR EACH ROW EXECUTE FUNCTION set_lookbook_slug();
