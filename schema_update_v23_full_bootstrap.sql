-- ============================================
-- Schema Update V23: Full bootstrap (v19 + v20 + v21 + v22)
-- Safe to run multiple times (idempotent)
-- ============================================

BEGIN;

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

INSERT INTO ai_config (key, value, description) VALUES
  ('pipeline_last_run_at', '', 'Thoi diem chay cron pipeline gan nhat (ISO timestamp)')
ON CONFLICT (key) DO NOTHING;

INSERT INTO ai_config (key, value, description) VALUES
  ('schedule_interval', '24', 'Khoang cach chay cron pipeline (gio)')
ON CONFLICT (key) DO NOTHING;

INSERT INTO ai_config (key, value, description) VALUES
  ('schedule_enabled', 'false', 'Bat/tat auto scheduler pipeline')
ON CONFLICT (key) DO NOTHING;

INSERT INTO ai_config (key, value, description) VALUES
  ('seo_schedule_enabled', 'false', 'Bat/tat auto scheduler SEO audit')
ON CONFLICT (key) DO NOTHING;

INSERT INTO ai_config (key, value, description) VALUES
  ('seo_schedule_interval', '24', 'Khoang cach chay cron SEO audit (gio)')
ON CONFLICT (key) DO NOTHING;

INSERT INTO ai_config (key, value, description) VALUES
  ('seo_last_run_at', '', 'Thoi diem chay cron SEO audit gan nhat (ISO timestamp)')
ON CONFLICT (key) DO NOTHING;

INSERT INTO ai_config (key, value, description) VALUES
  ('seo_bulk_scan_limit', '25', 'So URL toi da se scan tu sitemap moi lan cron')
ON CONFLICT (key) DO NOTHING;

INSERT INTO ai_config (key, value, description) VALUES
  ('seo_stale_days', '7', 'So ngay de xac dinh trang SEO can re-scan')
ON CONFLICT (key) DO NOTHING;

INSERT INTO ai_config (key, value, description) VALUES
  ('seo_rescan_limit', '20', 'So trang SEO toi da re-scan moi lan cron')
ON CONFLICT (key) DO NOTHING;

INSERT INTO ai_config (key, value, description) VALUES
  ('site_url', 'https://signs.haus', 'Canonical site URL used for metadata, sitemap, RSS')
ON CONFLICT (key) DO NOTHING;

INSERT INTO ai_config (key, value, description) VALUES
  ('indexnow_key', '', 'IndexNow key for instant URL submission (optional)')
ON CONFLICT (key) DO NOTHING;

COMMIT;
