-- MIGRATION v7
-- Create pages table for dynamic content
CREATE TABLE IF NOT EXISTS site_pages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  meta_title TEXT,
  meta_description TEXT,
  featured_image TEXT,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed some initial pages if they don't exist
INSERT INTO site_pages (slug, title, content, is_published)
VALUES 
('about', 'About Us', 'Welcome to SignsHaus. We are the leading signage maker in Metro Manila...', true),
('services', 'Our Services', 'We offer a wide range of signage services including...', true),
('portfolio', 'Our Portfolio', 'Check out our latest works...', true),
('contact', 'Contact Us', 'Get in touch with us...', true)
ON CONFLICT (slug) DO NOTHING;

-- MIGRATION v8
-- Create tables for additional content types
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  image TEXT,
  category TEXT,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS services (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  image TEXT,
  features JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS testimonials (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT,
  company TEXT,
  content TEXT,
  avatar TEXT,
  rating INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Allow public read access
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_catalog.pg_policies 
        WHERE policyname = 'Public Read Projects'
    ) THEN
        CREATE POLICY "Public Read Projects" ON projects FOR SELECT USING (true);
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_catalog.pg_policies 
        WHERE policyname = 'Public Read Services'
    ) THEN
        CREATE POLICY "Public Read Services" ON services FOR SELECT USING (true);
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_catalog.pg_policies 
        WHERE policyname = 'Public Read Testimonials'
    ) THEN
        CREATE POLICY "Public Read Testimonials" ON testimonials FOR SELECT USING (true);
    END IF;
END
$$;

-- MIGRATION v9
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

-- MIGRATION v10
-- Create materials table
CREATE TABLE IF NOT EXISTS materials (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  image TEXT,
  pros JSONB DEFAULT '[]'::JSONB,
  cons JSONB DEFAULT '[]'::JSONB,
  best_for TEXT,
  description TEXT, -- Short description if needed
  content TEXT, -- Rich text content for detail page
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed initial data
INSERT INTO materials (slug, name, image, pros, cons, best_for, is_published)
VALUES 
('acrylic', 'Acrylic', 'https://images.unsplash.com/photo-1542382156909-9ae37b3f56fd?q=80&w=2674&auto=format&fit=crop', 
 '["Versatile shapes", "Many color options", "Lightweight", "High gloss finish"]', 
 '["Can scratch easily", "Pricey for large coverage"]', 
 'Indoor logos, Lighted letters, Retail stores', true),

('stainless-steel', 'Stainless Steel 304', 'https://images.unsplash.com/photo-1616400619175-5beda3a17896?q=80&w=2574&auto=format&fit=crop', 
 '["Rust-proof", "Premium look (Gold/Mirror)", "Extremely durable", "Weather resistant"]', 
 '["Heavy", "More expensive", "Harder to shape complex curves"]', 
 'Corporate buildings, Outdoor monuments, Luxury brands', true),

('panaflex', 'Panaflex', 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=2670&auto=format&fit=crop', 
 '["Very affordable", "Great for huge sizes", "Easy to replace face", "Full color print"]', 
 '["Less premium look", "Can fade over time (3-5 years)"]', 
 'Grocery stores, Roadside signage, Temporary campaigns', true),

('acp', 'Aluminum Composite (ACP)', 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2670&auto=format&fit=crop', 
 '["Perfect flat surface", "Lightweight but rigid", "Modern architectural look"]', 
 '["Limited texture options", "Joint lines visible"]', 
 'Building cladding, Backing for letters, Pylons', true)
ON CONFLICT (slug) DO NOTHING;

-- Enable RLS
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_catalog.pg_policies 
        WHERE policyname = 'Public Read Materials'
    ) THEN
        CREATE POLICY "Public Read Materials" ON materials FOR SELECT USING (true);
    END IF;
END
$$;

-- MIGRATION v11
-- Create leads / contact_requests table if not exists (or update it)
CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  type TEXT, -- Signage type
  message TEXT,
  file_url TEXT, -- Uploaded file
  status TEXT DEFAULT 'new', -- new, contacted, closed
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Allow insert from public (anon)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_catalog.pg_policies 
        WHERE policyname = 'Public Insert Leads'
    ) THEN
        CREATE POLICY "Public Insert Leads" ON leads FOR INSERT WITH CHECK (true);
    END IF;
END
$$;
