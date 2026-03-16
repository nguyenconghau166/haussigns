-- ============================================
-- Schema Update V19: Writer A/B + Auto Linking Controls
-- ============================================

INSERT INTO ai_config (key, value, description) VALUES
  ('writer_prompt_variant', 'expert', 'Che do prompt cho Writer: control|expert|ab_test')
ON CONFLICT (key) DO NOTHING;

INSERT INTO ai_config (key, value, description) VALUES
  ('writer_quality_threshold', '82', 'Nguong diem trung binh SEO+AIO de kich hoat revision')
ON CONFLICT (key) DO NOTHING;

INSERT INTO ai_config (key, value, description) VALUES
  ('enable_faq_schema', 'true', 'Bat/tat tu dong chen FAQ JSON-LD')
ON CONFLICT (key) DO NOTHING;

INSERT INTO ai_config (key, value, description) VALUES
  ('auto_internal_linking', 'true', 'Bat/tat tu dong chen internal links cho bai nhap moi')
ON CONFLICT (key) DO NOTHING;

INSERT INTO ai_config (key, value, description) VALUES
  ('internal_links_per_article', '3', 'So internal links toi da se chen vao moi bai')
ON CONFLICT (key) DO NOTHING;
