-- ============================================
-- Schema Update V22: SEO infrastructure config keys
-- ============================================

INSERT INTO ai_config (key, value, description) VALUES
  ('site_url', 'https://signshaus.ph', 'Canonical site URL used for metadata, sitemap, RSS')
ON CONFLICT (key) DO NOTHING;

INSERT INTO ai_config (key, value, description) VALUES
  ('indexnow_key', '', 'IndexNow key for instant URL submission (optional)')
ON CONFLICT (key) DO NOTHING;
