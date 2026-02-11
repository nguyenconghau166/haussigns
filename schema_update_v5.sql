-- Create table for Products
CREATE TABLE products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price TEXT,
  rating NUMERIC(2, 1),
  image TEXT,
  tag TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create table for Testimonials
CREATE TABLE testimonials (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT,
  content TEXT,
  rating INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create table for Projects
CREATE TABLE projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT,
  image TEXT,
  size TEXT, -- e.g. 'col-span-1 row-span-1'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create table for Services
CREATE TABLE services (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  icon_name TEXT, -- e.g. 'Type', 'Hammer'
  slug TEXT UNIQUE NOT NULL,
  gradient TEXT,
  bg TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Public Read Products" ON products FOR SELECT USING (true);
CREATE POLICY "Public Read Testimonials" ON testimonials FOR SELECT USING (true);
CREATE POLICY "Public Read Projects" ON projects FOR SELECT USING (true);
CREATE POLICY "Public Read Services" ON services FOR SELECT USING (true);

-- Admin write policies (assuming service role or auth)
-- For simplicity, we'll allow Authenticated/Service Role to write
-- Note: 'service_role' key bypasses RLS, so these are mostly for explicit auth users if any
CREATE POLICY "Admin Insert Products" ON products FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admin Update Products" ON products FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admin Delete Products" ON products FOR DELETE TO authenticated USING (true);

-- Repeat for others if needed, but for now we focus on reading. 
-- Seed script will use service role key to bypass RLS.
