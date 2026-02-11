-- Create ai_config table if it doesn't exist
CREATE TABLE IF NOT EXISTS ai_config (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT, 
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE ai_config ENABLE ROW LEVEL SECURITY;

-- Policies
-- Only allow service role (server-side) to read/write. 
-- Public should NOT be able to read this table as it contains secrets.
-- However, for the purpose of the admin panel (if it exists client-side), we might need authenticated access using a specific role.
-- For now, strict security: Service Role only.

CREATE POLICY "Service Role Full Access" ON ai_config USING (true) WITH CHECK (true);

-- Insert default placeholder for OpenAI Key if not exists
INSERT INTO ai_config (key, value, description)
VALUES ('openai_api_key', 'sk-placeholder', 'OpenAI API Key')
ON CONFLICT (key) DO NOTHING;
