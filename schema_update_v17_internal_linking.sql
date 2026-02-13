-- MIGRATION v17 (Internal Linking)

-- 1. Create table for Internal Linking Rules
CREATE TABLE IF NOT EXISTS internal_linking_rules (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  keyword TEXT NOT NULL,
  target_url TEXT NOT NULL,
  target_type TEXT CHECK (target_type IN ('product', 'project', 'post', 'service')),
  target_id UUID, -- Optional, if we want to trace back to source
  priority INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create index for faster lookup
CREATE INDEX IF NOT EXISTS idx_internal_linking_rules_keyword ON internal_linking_rules(keyword);

-- 3. Enable RLS
ALTER TABLE internal_linking_rules ENABLE ROW LEVEL SECURITY;

-- 4. Policies
-- Public Read (Used by ISR/SSG pages to inject links)
CREATE POLICY "Public Read Internal Links" ON internal_linking_rules
    FOR SELECT TO public USING (true);

-- Authenticated/Admin CRUD
CREATE POLICY "Authenticated Manage Internal Links" ON internal_linking_rules
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 5. Trigger for updated_at
DROP TRIGGER IF EXISTS update_internal_linking_rules_updated_at ON internal_linking_rules;
CREATE TRIGGER update_internal_linking_rules_updated_at BEFORE UPDATE ON internal_linking_rules FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
