-- MIGRATION v14
-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  client TEXT,
  year TEXT,
  location TEXT,
  featured_image TEXT,
  gallery_images TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create project_categories junction table
CREATE TABLE IF NOT EXISTS project_categories (
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (project_id, category_id)
);

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_categories ENABLE ROW LEVEL SECURITY;

-- Public read policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_catalog.pg_policies
        WHERE policyname = 'Public Read Projects'
    ) THEN
        CREATE POLICY "Public Read Projects" ON projects FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (
        SELECT FROM pg_catalog.pg_policies
        WHERE policyname = 'Public Read Project Categories'
    ) THEN
        CREATE POLICY "Public Read Project Categories" ON project_categories FOR SELECT USING (true);
    END IF;
END
$$;

-- Trigger for updated_at
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Seed some project categories if they don't exist
INSERT INTO categories (slug, name, type, description)
VALUES
('retail', 'Retail', 'industry', 'Retail stores and shops'),
('corporate', 'Corporate', 'industry', 'Offices and business centers'),
('hospitality', 'Hospitality', 'industry', 'Hotels, resorts, and restaurants'),
('outdoor', 'Outdoor', 'sign_type', 'Outdoor signage'),
('indoor', 'Indoor', 'sign_type', 'Indoor signage')
ON CONFLICT (slug) DO NOTHING;

-- Seed Sample Project
INSERT INTO projects (title, slug, description, client, year, location, featured_image, gallery_images)
VALUES
(
  'SM Mall of Asia Globe Refurbishment',
  'moa-globe-refurbishment',
  'Complete restoration and LED upgrade of the iconic MOA Globe.',
  'SM Prime Holdings',
  '2023',
  'Pasay City',
  'https://images.unsplash.com/photo-1565514020125-998ac5049b49?q=80&w=2670&auto=format&fit=crop',
  ARRAY['https://images.unsplash.com/photo-1542382156909-9ae37b3f56fd?q=80&w=2674&auto=format&fit=crop']
)
ON CONFLICT (slug) DO NOTHING;

-- Link sample project to categories (assuming IDs exist)
INSERT INTO project_categories (project_id, category_id)
SELECT p.id, c.id
FROM projects p, categories c
WHERE p.slug = 'moa-globe-refurbishment' AND c.slug IN ('retail', 'outdoor', 'maintenance')
ON CONFLICT DO NOTHING;
