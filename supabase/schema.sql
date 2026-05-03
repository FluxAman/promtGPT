-- =============================================
-- PromptGPT — Full Database Schema
-- Run this in the Supabase SQL Editor
-- =============================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- ============================================
-- TABLES
-- ============================================

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prompts
CREATE TABLE IF NOT EXISTS prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  prompt_text TEXT NOT NULL,
  image_url TEXT NOT NULL,
  category_id UUID REFERENCES categories(id),
  tags TEXT[] DEFAULT '{}',
  copy_count INT DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  is_featured BOOLEAN DEFAULT FALSE,
  is_approved BOOLEAN DEFAULT FALSE,
  search_vector TSVECTOR,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Saved Prompts (user bookmarks)
CREATE TABLE IF NOT EXISTS saved_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, prompt_id)
);

-- ============================================
-- SEARCH VECTOR TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION update_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.prompt_text, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.tags, ' '), '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prompts_search_vector_update ON prompts;
CREATE TRIGGER prompts_search_vector_update
  BEFORE INSERT OR UPDATE ON prompts
  FOR EACH ROW EXECUTE FUNCTION update_search_vector();

-- ============================================
-- COPY COUNT RPC (used by /api/prompts/[id]/copy)
-- ============================================

CREATE OR REPLACE FUNCTION increment_copy_count(prompt_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE prompts SET copy_count = copy_count + 1 WHERE id = prompt_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS prompts_search_idx ON prompts USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS prompts_trgm_idx ON prompts USING GIN(title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS prompts_category_idx ON prompts(category_id);
CREATE INDEX IF NOT EXISTS prompts_featured_idx ON prompts(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS saved_prompts_user_idx ON saved_prompts(user_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can read prompts"
  ON prompts FOR SELECT USING (TRUE);

CREATE POLICY "Anyone can read categories"
  ON categories FOR SELECT USING (TRUE);

-- Users manage their own saves
CREATE POLICY "Users manage their saves"
  ON saved_prompts FOR ALL USING (auth.uid() = user_id);

-- Any logged-in user can insert prompts (tighten this for production)
CREATE POLICY "Authenticated users can insert prompts"
  ON prompts FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Users can update copy_count (needed for increment_copy_count RPC)
CREATE POLICY "Anyone can update copy_count"
  ON prompts FOR UPDATE USING (TRUE)
  WITH CHECK (TRUE);

-- ============================================
-- SEED DATA — DEFAULT CATEGORIES
-- ============================================

INSERT INTO categories (name, slug, icon, description) VALUES
  ('UI Design',       'ui-design',      '🖥️',  'User interface and web design prompts'),
  ('Advertising',     'advertising',    '📢',  'Marketing and ad creative prompts'),
  ('Photography',     'photography',    '📷',  'Realistic photo-style prompts'),
  ('Architecture',    'architecture',   '🏛️',  'Buildings and interior design prompts'),
  ('3D Art',          '3d-art',         '🎨',  '3D renders and abstract art prompts'),
  ('Portraits',       'portraits',      '👤',  'Character and portrait prompts'),
  ('Nature',          'nature',         '🌿',  'Landscapes and nature prompts'),
  ('Product Design',  'product-design', '📦',  'Product and packaging prompts')
ON CONFLICT (slug) DO NOTHING;
