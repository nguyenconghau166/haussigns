
-- Create industries table
CREATE TABLE IF NOT EXISTS industries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  content TEXT, -- Rich text content for detail page
  icon TEXT, -- Lucide icon name or image URL
  image TEXT, -- Cover image for detail page
  recommended JSONB DEFAULT '[]'::JSONB, -- List of recommended signage types
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed initial data
INSERT INTO industries (slug, title, description, icon, recommended, is_published)
VALUES 
('retail-shops', 'Retail & Shops', 'Attract foot traffic with eye-catching storefront signage.', 'ShoppingBag', '["Acrylic Build-Up", "Lightboxes", "Window Decals"]', true),
('corporate-offices', 'Corporate Offices', 'Professional reception logos and wayfinding systems.', 'Building2', '["Stainless Steel", "Frosted Glass Stickers", "Room ID"]', true),
('restaurants-cafes', 'Restaurants & Cafes', 'Create a vibe with neon lights and menu boards.', 'Utensils', '["LED Neon", "Menu Lightbox", "Wooden Signs"]', true),
('hospitals-clinics', 'Hospitals & Clinics', 'Clear, compliant directional signage for patients.', 'Stethoscope', '["Wayfinding", "Pylon Signs", "Safety Signs"]', true),
('hotels-resorts', 'Hotels & Resorts', 'Luxury branding and large-scale building identification.', 'Hotel', '["Brass/Gold Finish", "Monument Signs", "Pool Rules"]', true),
('schools-universities', 'Schools & Universities', 'Durable campus maps and building markers.', 'GraduationCap', '["Panaflex", "Metal Plaques", "Directional Posts"]', true)
ON CONFLICT (slug) DO NOTHING;

-- Enable RLS
ALTER TABLE industries ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_catalog.pg_policies 
        WHERE policyname = 'Public Read Industries'
    ) THEN
        CREATE POLICY "Public Read Industries" ON industries FOR SELECT USING (true);
    END IF;
END
$$;
