-- ============================================
-- Schema Update V21: Scheduler runtime keys
-- ============================================

INSERT INTO ai_config (key, value, description) VALUES
  ('pipeline_last_run_at', '', 'Thoi diem chay cron pipeline gan nhat (ISO timestamp)')
ON CONFLICT (key) DO NOTHING;

INSERT INTO ai_config (key, value, description) VALUES
  ('schedule_interval', '24', 'Khoang cach chay cron pipeline (gio)')
ON CONFLICT (key) DO NOTHING;

INSERT INTO ai_config (key, value, description) VALUES
  ('schedule_enabled', 'false', 'Bat/tat auto scheduler pipeline')
ON CONFLICT (key) DO NOTHING;
