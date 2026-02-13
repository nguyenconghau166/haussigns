-- MIGRATION v12
-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  type TEXT,
  description TEXT,
  parent_id UUID REFERENCES categories(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safely update/set constraint for categories type
DO $$
BEGIN
    ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_type_check;
    ALTER TABLE categories ADD CONSTRAINT categories_type_check CHECK (type IN ('material', 'industry', 'sign_type', 'blog'));
EXCEPTION
    WHEN OTHERS THEN
        NULL; -- Ignore errors if table doesn't exist or other issues, though CREATE TABLE above should handle existence
END
$$;

-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
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

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Public read policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_catalog.pg_policies
        WHERE policyname = 'Public Read Categories'
    ) THEN
        CREATE POLICY "Public Read Categories" ON categories FOR SELECT USING (true);
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_catalog.pg_policies
        WHERE policyname = 'Public Read Posts'
    ) THEN
        CREATE POLICY "Public Read Posts" ON posts FOR SELECT USING (status = 'published');
    END IF;
END
$$;

-- Seed Categories
INSERT INTO categories (slug, name, type, description)
VALUES
('materials', 'Materials', 'blog', 'Updates and guides about signage materials'),
('maintenance', 'Maintenance', 'blog', 'Tips for maintaining your signage'),
('design-trends', 'Design Trends', 'blog', 'Latest trends in signage design')
ON CONFLICT (slug) DO UPDATE SET type = 'blog';

-- Seed Posts
INSERT INTO posts (slug, title, excerpt, content, status, category_id, featured_image, created_at)
VALUES
(
  'acrylic-signage-guide-2024',
  'The Ultimate Guide to Acrylic Build-Up Signage in Metro Manila',
  'Discover why acrylic signage is the top choice for retail stores in BGC and Makati. Learn about durability, price, and visual impact.',
  '<h2>Introduction</h2>
   <p>Acrylic signage has become the gold standard for modern businesses in Metro Manila. Its versatility, durability, and premium finish make it an ideal choice for both indoor and outdoor applications.</p>
   
   <h3>Why Choose Acrylic?</h3>
   <p>Compared to traditional panaflex, acrylic offers a much more sophisticated look. It can be laser-cut into precise shapes, making it perfect for intricate logos and lettering.</p>
   
   <ul>
     <li><strong>High Durability:</strong> Resistant to UV rays and harsh weather conditions.</li>
     <li><strong>Versatile Finishes:</strong> Available in glossy, matte, or frosted textures.</li>
     <li><strong>Illumination:</strong> Works perfectly with LED modules for face-lit or halo-lit effects.</li>
   </ul>

   <h3>Cost Considerations</h3>
   <p>While acrylic is more expensive upfront than tarpaulin or panaflex, its longevity means you save money in the long run. A well-maintained acrylic sign can last 5-10 years without significant fading.</p>

   <h2>Installation Process</h2>
   <p>Our team at SignsHaus handles the entire process from design to installation. We use high-grade stainless steel spacers or industrial adhesives depending on the wall surface.</p>

   <blockquote>
     &quot;A quality sign is the first handshake with your customer.&quot;
   </blockquote>

   <h3>Contact Us Today</h3>
   <p>Ready to upgrade your storefront? Contact us for a free ocular inspection and quote.</p>',
  'published',
  (SELECT id FROM categories WHERE slug = 'materials'),
  'https://images.unsplash.com/photo-1542382156909-9ae37b3f56fd?q=80&w=2674&auto=format&fit=crop',
  '2024-02-15 10:00:00+00'
),
(
  'stainless-steel-maintenance',
  'How to Clean and Maintain Your Stainless Steel Signage',
  'Keep your outdoor signage looking brand new with these simple cleaning tips. Avoid rust and corrosion with proper care.',
  '<h2>Maintenance 101</h2>
   <p>Stainless steel is durable but needs care. Use a soft cloth and mild detergent. Avoid abrasive scrubbers that can scratch the finish.</p>
   <h3>Regular Cleaning Schedule</h3>
   <p>We recommend cleaning your outdoor signage at least once a month to prevent buildup of dust and pollutants.</p>',
  'published',
  (SELECT id FROM categories WHERE slug = 'maintenance'),
  'https://images.unsplash.com/photo-1616400619175-5beda3a17896?q=80&w=2574&auto=format&fit=crop',
  '2024-02-10 10:00:00+00'
),
(
  'neon-lights-trend',
  '5 Creative Ways to Use LED Neon Lights for Your Cafe',
  'Transform your coffee shop into an Instagram-worthy spot with custom neon designs. See our latest projects in Quezon City.',
  '<h2>Neon Trends</h2>
   <p>Neon lights are back in style! But this time, they are safer, more energy-efficient, and more affordable thanks to LED technology.</p>
   <h3>1. Quote Walls</h3>
   <p>Create a dedicated selfie spot with a catchy phrase.</p>
   <h3>2. Window Displays</h3>
   <p>Attract passersby with a glowing open sign or logo.</p>',
  'published',
  (SELECT id FROM categories WHERE slug = 'design-trends'),
  'https://images.unsplash.com/photo-1563291074-2bf8677ac0e5?q=80&w=2548&auto=format&fit=crop',
  '2024-02-05 10:00:00+00'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  excerpt = EXCLUDED.excerpt,
  category_id = EXCLUDED.category_id,
  featured_image = EXCLUDED.featured_image;
