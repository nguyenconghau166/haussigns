
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

-- Allow admin to select/update/delete
-- Assuming admin uses service_role key which bypasses RLS, so this might not be strictly needed if only used via admin API
-- But good practice if using client auth later.
