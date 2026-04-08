-- =============================================
-- v32: Auto-Publish Pipeline + Enhanced Facebook
-- Enables automatic publishing with quality gates
-- and enhanced Facebook posting with hashtags/engagement
-- =============================================

-- Posts auto-publish tracking
ALTER TABLE posts ADD COLUMN IF NOT EXISTS auto_published boolean DEFAULT false;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS publish_gate_result jsonb;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS published_at timestamptz;

-- Facebook queue enhancements
ALTER TABLE facebook_queue ADD COLUMN IF NOT EXISTS post_format text DEFAULT 'link';
ALTER TABLE facebook_queue ADD COLUMN IF NOT EXISTS hashtags text[] DEFAULT '{}';
ALTER TABLE facebook_queue ADD COLUMN IF NOT EXISTS engagement_prompt text;
ALTER TABLE facebook_queue ADD COLUMN IF NOT EXISTS comment_post_id text;

-- Daily publishing statistics
CREATE TABLE IF NOT EXISTS daily_publish_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  publish_date date UNIQUE NOT NULL DEFAULT CURRENT_DATE,
  articles_published integer DEFAULT 0,
  articles_drafted integer DEFAULT 0,
  fb_posts_queued integer DEFAULT 0,
  fb_posts_sent integer DEFAULT 0,
  avg_quality_score integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Auto-publish config defaults
INSERT INTO ai_config (key, value, description) VALUES
  ('auto_publish_enabled', 'false', 'Enable automatic publishing when quality gate passes'),
  ('auto_publish_min_score', '75', 'Minimum quality score for auto-publish'),
  ('daily_publish_target', '1', 'Target number of articles to publish per day'),
  ('daily_publish_guarantee', 'true', 'Force pipeline if no article published today'),
  ('optimal_publish_hour', '9', 'Hour (0-23) to target for daily publishing (PHT)'),
  ('fb_caption_max_chars_professional', '500', 'Max caption length for professional page'),
  ('fb_caption_max_chars_casual', '400', 'Max caption length for casual page'),
  ('fb_enable_engagement_comments', 'true', 'Post engagement question as first comment'),
  ('fb_default_hashtags', 'signage,signs,MetroManila,business', 'Default hashtags for FB posts')
ON CONFLICT (key) DO NOTHING;
