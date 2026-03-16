-- ============================================
-- Schema Update V20: Pipeline timeout and retry controls
-- ============================================

INSERT INTO ai_config (key, value, description) VALUES
  ('ai_request_timeout_ms', '120000', 'Timeout moi request AI (milliseconds)')
ON CONFLICT (key) DO NOTHING;

INSERT INTO ai_config (key, value, description) VALUES
  ('ai_request_retry_count', '1', 'So lan retry khi request AI bi timeout/loi tam thoi')
ON CONFLICT (key) DO NOTHING;

INSERT INTO ai_config (key, value, description) VALUES
  ('pipeline_research_timeout_seconds', '180', 'Timeout cho agent Researcher')
ON CONFLICT (key) DO NOTHING;

INSERT INTO ai_config (key, value, description) VALUES
  ('pipeline_evaluator_timeout_seconds', '180', 'Timeout cho agent Evaluator')
ON CONFLICT (key) DO NOTHING;

INSERT INTO ai_config (key, value, description) VALUES
  ('pipeline_writer_timeout_seconds', '420', 'Timeout cho agent Writer')
ON CONFLICT (key) DO NOTHING;

INSERT INTO ai_config (key, value, description) VALUES
  ('pipeline_visual_timeout_seconds', '360', 'Timeout cho agent Visual Inspector')
ON CONFLICT (key) DO NOTHING;
