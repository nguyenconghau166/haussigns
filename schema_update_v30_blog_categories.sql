-- MIGRATION v30: Blog Categories Overhaul + Posts columns + AI Config
-- Adds 10 professional blog categories, new posts columns, watermark config

-- 1. Add new columns to posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS search_intent TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS author_name TEXT DEFAULT 'SignsHaus Team';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS author_bio TEXT;

-- Add check constraint for search_intent
DO $$
BEGIN
  ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_search_intent_check;
  ALTER TABLE posts ADD CONSTRAINT posts_search_intent_check
    CHECK (search_intent IS NULL OR search_intent IN ('informational', 'commercial', 'transactional', 'comparison'));
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 2. Rename old blog categories to new professional slugs
UPDATE categories SET slug = 'signage-materials', name = 'Signage Materials',
  description = 'In-depth guides on acrylic, stainless steel, aluminum, LED modules, vinyl, and tarpaulin for signage'
  WHERE slug = 'materials' AND type = 'blog';

UPDATE categories SET slug = 'maintenance-care', name = 'Maintenance & Care',
  description = 'Cleaning, repair, weatherproofing, and UV protection tips for outdoor and indoor signs'
  WHERE slug = 'maintenance' AND type = 'blog';

UPDATE categories SET slug = 'design-inspiration', name = 'Design & Inspiration',
  description = 'Modern signage trends, color psychology, typography, and brand identity ideas'
  WHERE slug = 'design-trends' AND type = 'blog';

-- 3. Insert new blog categories (skip if slug already exists)
INSERT INTO categories (slug, name, type, description) VALUES
  ('installation-guides', 'Installation & How-To', 'blog', 'Step-by-step installation techniques, tools, safety protocols, and mounting methods for signage contractors'),
  ('pricing-cost-guides', 'Pricing & Cost Guides', 'blog', 'Material comparisons, labor costs, ROI calculations, and budgeting guides for signage projects'),
  ('permits-regulations', 'Permits & Regulations', 'blog', 'DPWH rules, LGU ordinances, building codes, and fire safety requirements for signage in the Philippines'),
  ('industry-spotlight', 'Industry Spotlight', 'blog', 'Sector-specific signage solutions for retail, F&B, real estate, healthcare, and corporate businesses'),
  ('project-showcases', 'Project Showcases', 'blog', 'Before/after case studies, client testimonials, and process walkthroughs of completed signage projects'),
  ('business-tips', 'Business Tips', 'blog', 'Marketing with signage, storefront branding strategies, and foot traffic conversion tips for shop owners'),
  ('technology-innovation', 'Technology & Innovation', 'blog', 'LED advancements, digital signage, solar-powered signs, and smart signage technology updates')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  description = EXCLUDED.description;

-- 4. Seed AI config keys for watermark logo and category rotation
INSERT INTO ai_config (key, value, description) VALUES
  ('watermark_mode', 'logo', 'Watermark mode: text or logo'),
  ('watermark_logo_path', '/logo-web.png', 'Path to logo file in public/ for watermark overlay'),
  ('blog_category_rotation', 'balanced', 'Category rotation strategy: balanced, random, or weighted'),
  ('content_format_version', 'seo2026', 'Content format version for pipeline prompts')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, description = EXCLUDED.description;
