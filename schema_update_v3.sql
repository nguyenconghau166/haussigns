-- ============================================
-- Schema Update V3: AI Pipeline Enhancement
-- ============================================

-- NEW: Pipeline Runs table - tracks each full pipeline execution
CREATE TABLE IF NOT EXISTS ai_pipeline_runs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  status TEXT CHECK (status IN ('running', 'completed', 'failed', 'partial')) DEFAULT 'running',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  topics_found INTEGER DEFAULT 0,
  topics_approved INTEGER DEFAULT 0,
  articles_created INTEGER DEFAULT 0,
  images_generated INTEGER DEFAULT 0,
  error_log TEXT,
  trigger_type TEXT CHECK (trigger_type IN ('manual', 'scheduled')) DEFAULT 'manual',
  details JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE ai_pipeline_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin All Pipeline Runs" ON ai_pipeline_runs FOR ALL USING (true);

-- Add new config keys (upsert to avoid duplicates)
INSERT INTO ai_config (key, value, description) VALUES
  ('business_description', 'Chuyên thiết kế, sản xuất và thi công biển hiệu quảng cáo, chữ nổi, hộp đèn, bảng hiệu cho doanh nghiệp tại Metro Manila', 'Mô tả doanh nghiệp')
ON CONFLICT (key) DO NOTHING;

INSERT INTO ai_config (key, value, description) VALUES
  ('business_services', 'Biển hiệu quảng cáo, Chữ nổi inox, Chữ nổi mica, Hộp đèn, Bảng hiệu LED, Signboard, Panaflex, ACP Cladding', 'Danh sách dịch vụ')
ON CONFLICT (key) DO NOTHING;

INSERT INTO ai_config (key, value, description) VALUES
  ('business_phone', '+63 917 123 4567', 'Số điện thoại tư vấn')
ON CONFLICT (key) DO NOTHING;

INSERT INTO ai_config (key, value, description) VALUES
  ('business_address', 'Makati, Metro Manila, Philippines', 'Địa chỉ workshop')
ON CONFLICT (key) DO NOTHING;

INSERT INTO ai_config (key, value, description) VALUES
  ('target_keywords_seed', 'signage maker, sign shop, business signs, acrylic signs, stainless steel letters, LED signage, channel letters', 'Từ khóa gốc cho ngành nghề')
ON CONFLICT (key) DO NOTHING;

INSERT INTO ai_config (key, value, description) VALUES
  ('content_language', 'en', 'Ngôn ngữ viết bài (en/tl/mix)')
ON CONFLICT (key) DO NOTHING;

INSERT INTO ai_config (key, value, description) VALUES
  ('articles_per_run', '2', 'Số bài viết mỗi lần chạy pipeline')
ON CONFLICT (key) DO NOTHING;

INSERT INTO ai_config (key, value, description) VALUES
  ('min_word_count', '800', 'Số từ tối thiểu cho mỗi bài')
ON CONFLICT (key) DO NOTHING;

INSERT INTO ai_config (key, value, description) VALUES
  ('seo_focus_areas', 'Makati, BGC, Quezon City, Pasig, Mandaluyong, Taguig', 'Khu vực SEO tập trung')
ON CONFLICT (key) DO NOTHING;

INSERT INTO ai_config (key, value, description) VALUES
  ('schedule_enabled', 'false', 'Bật/tắt auto-schedule')
ON CONFLICT (key) DO NOTHING;

INSERT INTO ai_config (key, value, description) VALUES
  ('writer_model', 'gpt-4o', 'Model AI cho Writer')
ON CONFLICT (key) DO NOTHING;

INSERT INTO ai_config (key, value, description) VALUES
  ('researcher_model', 'gpt-4o-mini', 'Model AI cho Researcher')
ON CONFLICT (key) DO NOTHING;

INSERT INTO ai_config (key, value, description) VALUES
  ('image_style', 'professional photography, modern urban setting, high resolution', 'Phong cách ảnh minh họa')
ON CONFLICT (key) DO NOTHING;

INSERT INTO ai_config (key, value, description) VALUES
  ('evaluator_min_score', '60', 'Điểm tối thiểu để duyệt topic (0-100)')
ON CONFLICT (key) DO NOTHING;

INSERT INTO ai_config (key, value, description) VALUES
  ('writer_tone', 'Professional, Trustworthy, Helpful, Slightly Persuasive', 'Giọng văn viết bài')
ON CONFLICT (key) DO NOTHING;
