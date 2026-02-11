-- Keep existing tables...
-- (Previous tables for categories, posts, keywords, analytics, contact_requests remain)

-- ... [Existing Schema Content] ...

-- NEW: AI Knowledge Base & Configuration
CREATE TABLE ai_config (
  key TEXT PRIMARY KEY,
  value TEXT, 
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Initial Config Data (Seed)
INSERT INTO ai_config (key, value, description) VALUES
('company_name', 'SignsHaus', 'Tên thương hiệu'),
('target_audience', 'SME Owners, Corporate Purchasing Managers in Metro Manila', 'Khách hàng mục tiêu'),
('tone_of_voice', 'Professional, Trustworthy, Helpful, Slightly Persuasive', 'Giọng văn'),
('contact_cta', 'Call +63 917 123 4567 or visit our workshop in Makati for a free quote.', 'Câu kêu gọi hành động'),
('competitors', 'Skylite, M&G, G-Signs', 'Đối thủ để phân tích'),
('schedule_interval', '12', 'Khoảng cách chạy tự động (giờ)');

-- NEW: AI Operation Logs (To track the 4 Agents)
CREATE TABLE ai_pipeline_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  batch_id TEXT, -- Group related actions
  agent_name TEXT, -- 'Researcher', 'Auditor', 'Writer', 'Visualizer'
  action TEXT,
  status TEXT CHECK (status IN ('running', 'success', 'failed', 'skipped')),
  details JSONB, -- Input/Output data
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for new tables
ALTER TABLE ai_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_pipeline_logs ENABLE ROW LEVEL SECURITY;

-- Policies (Admin only essentially)
CREATE POLICY "Admin All Config" ON ai_config FOR ALL USING (true);
CREATE POLICY "Admin All Logs" ON ai_pipeline_logs FOR ALL USING (true);
