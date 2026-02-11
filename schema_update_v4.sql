-- Create enum for content types
CREATE TYPE content_category AS ENUM ('sign_type', 'industry', 'material', 'blog', 'contact');

-- Create content_blocks table
CREATE TABLE IF NOT EXISTS content_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  content TEXT, -- Markdown or HTML content
  type content_category NOT NULL,
  image_url TEXT,
  meta_title TEXT,
  meta_description TEXT,
  order_index INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(slug, type)
);

-- RLS Policies
ALTER TABLE content_blocks ENABLE ROW LEVEL SECURITY;

-- Allow read access to everyone for published content
CREATE POLICY "Allow public read access" ON content_blocks
  FOR SELECT USING (is_published = true);

-- Allow authenticated users (admin) to do everything
CREATE POLICY "Allow authenticated full access" ON content_blocks
  FOR ALL USING (auth.role() = 'authenticated');

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_content_blocks_updated_at
    BEFORE UPDATE ON content_blocks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
