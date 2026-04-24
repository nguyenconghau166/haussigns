-- Trusted Brands (logo wall on homepage)
-- Managed via /admin/trusted-brands

CREATE TABLE IF NOT EXISTS trusted_brands (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT NOT NULL,
  website_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trusted_brands_active_order
  ON trusted_brands(is_active, display_order);

-- updated_at trigger (reuses existing function if present, otherwise skip)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at') THEN
    DROP TRIGGER IF EXISTS trg_trusted_brands_updated_at ON trusted_brands;
    CREATE TRIGGER trg_trusted_brands_updated_at
      BEFORE UPDATE ON trusted_brands
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;
