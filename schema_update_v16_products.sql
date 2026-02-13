-- MIGRATION v16 (Products & Content Enhancements)

-- 1. Create Products table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT, -- Short description
    content TEXT, -- Rich text content
    cover_image TEXT,
    gallery_images TEXT[],
    features JSONB DEFAULT '[]'::JSONB, -- Key features list
    price_range TEXT, -- Optional
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- 2. Add columns to existing tables if missing

-- Projects: Ensure content (rich text) and cover_image exist
DO $$
BEGIN
    ALTER TABLE projects ADD COLUMN IF NOT EXISTS content TEXT;
    ALTER TABLE projects ADD COLUMN IF NOT EXISTS cover_image TEXT;
    -- Use cover_image as fallback/alias for featured_image if preferred, or distinct
    -- For now we keep both or treat featured_image as the cover. 
    -- Let's stick to 'featured_image' for existing code compatibility, 
    -- but 'cover_image' is the new standard we might migrate to.
    -- To avoid confusion, let's just make sure 'featured_image' is used consistently or alias it.
    -- We will add 'cover_image' to standardize across all types for the new UI components.
END
$$;

-- Materials: Ensure cover_image exists
DO $$
BEGIN
    ALTER TABLE materials ADD COLUMN IF NOT EXISTS cover_image TEXT;
    ALTER TABLE materials ADD COLUMN IF NOT EXISTS gallery_images TEXT[];
    ALTER TABLE materials ADD COLUMN IF NOT EXISTS content TEXT; -- Rich text
END
$$;

-- Posts: Ensure cover_image exists (featured_image is already there, but let's standardize)
DO $$
BEGIN
    ALTER TABLE posts ADD COLUMN IF NOT EXISTS cover_image TEXT;
    -- Posts already have 'content'
END
$$;

-- 3. RLS Policies for Products

-- Public Read
CREATE POLICY "Public Read Products" ON products
    FOR SELECT TO public USING (is_published = true);

-- Authenticated/Admin CRUD
CREATE POLICY "Authenticated Insert Products" ON products
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated Update Products" ON products
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated Delete Products" ON products
    FOR DELETE TO authenticated USING (true);

-- 4. Create trigger for updated_at on products
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
