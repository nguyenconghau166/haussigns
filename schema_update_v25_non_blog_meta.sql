-- MIGRATION v25
-- Add SEO metadata fields for non-blog entity tables

DO $$
BEGIN
    ALTER TABLE materials ADD COLUMN IF NOT EXISTS meta_title TEXT;
    ALTER TABLE materials ADD COLUMN IF NOT EXISTS meta_description TEXT;

    ALTER TABLE industries ADD COLUMN IF NOT EXISTS meta_title TEXT;
    ALTER TABLE industries ADD COLUMN IF NOT EXISTS meta_description TEXT;

    ALTER TABLE projects ADD COLUMN IF NOT EXISTS meta_title TEXT;
    ALTER TABLE projects ADD COLUMN IF NOT EXISTS meta_description TEXT;

    ALTER TABLE products ADD COLUMN IF NOT EXISTS meta_title TEXT;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS meta_description TEXT;
END
$$;
