-- Create table for Categories (Materials, Industry, Sign Types)
CREATE TABLE categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  type TEXT CHECK (type IN ('material', 'industry', 'sign_type')),
  description TEXT,
  parent_id UUID REFERENCES categories(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create table for Posts (Articles)
CREATE TABLE posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT, -- HTML or Markdown
  excerpt TEXT,
  meta_title TEXT,
  meta_description TEXT,
  featured_image TEXT,
  status TEXT CHECK (status IN ('draft', 'published', 'archived')) DEFAULT 'draft',
  category_id UUID REFERENCES categories(id),
  lang TEXT CHECK (lang IN ('en', 'tl')) DEFAULT 'en',
  seo_score INTEGER DEFAULT 0,
  tags TEXT[], -- array of tags
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create table for Keyword Research
CREATE TABLE keywords (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  keyword TEXT UNIQUE NOT NULL,
  volume INTEGER DEFAULT 0,
  difficulty INTEGER DEFAULT 0,
  intent TEXT CHECK (intent IN ('informational', 'transactional', 'navigational')),
  status TEXT CHECK (status IN ('pending', 'planned', 'published')) DEFAULT 'pending',
  target_post_id UUID REFERENCES posts(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create table for Site Settings
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create table for Analytics (Simple Internal Stats)
CREATE TABLE analytics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  date DATE DEFAULT CURRENT_DATE,
  page_views INTEGER DEFAULT 0,
  visitors INTEGER DEFAULT 0,
  source TEXT,
  UNIQUE(date, source)
);

-- Create table for Contact Requests
CREATE TABLE contact_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  message TEXT,
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_requests ENABLE ROW LEVEL SECURITY;

-- Create policies (Allow public read, admin write)
-- For Development: Allow all operations for now, or ensure service role is used for admin writes
CREATE POLICY "Public Read Posts" ON posts FOR SELECT USING (status = 'published');
CREATE POLICY "Public Read Categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public Insert Contact" ON contact_requests FOR INSERT WITH CHECK (true);

-- Admin policies (Assuming using Supabase Auth, or Service Role bypass in API routes)
-- For simplicity in this demo, we'll allow Authenticated users (if using Supabase Auth) full access
-- Or if using our custom auth, we rely on the Service Role key in API routes.
-- However, for client-side fetches in Admin Dashboard to work without Supabase Auth session, 
-- we might need to expose data or proxy through API routes.
-- Given the setup, we will use API routes for Admin actions to keep it secure with the Service Role.

-- Functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
