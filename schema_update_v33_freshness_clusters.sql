-- =============================================
-- v33: Content Freshness + Cluster Intelligence
-- Tracks content age for freshness signals
-- and enables topic cluster strategy
-- =============================================

-- Posts freshness tracking
ALTER TABLE posts ADD COLUMN IF NOT EXISTS freshness_status text DEFAULT 'fresh';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS freshness_flagged_at timestamptz;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS last_refreshed_at timestamptz;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS refresh_priority integer DEFAULT 0;

-- Keywords cluster intelligence
ALTER TABLE keywords ADD COLUMN IF NOT EXISTS is_pillar boolean DEFAULT false;
ALTER TABLE keywords ADD COLUMN IF NOT EXISTS pillar_keyword_id uuid;
ALTER TABLE keywords ADD COLUMN IF NOT EXISTS content_post_id uuid;
ALTER TABLE keywords ADD COLUMN IF NOT EXISTS coverage_status text DEFAULT 'uncovered';

-- Add foreign key constraints (with IF NOT EXISTS pattern)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_keywords_pillar'
    AND table_name = 'keywords'
  ) THEN
    ALTER TABLE keywords ADD CONSTRAINT fk_keywords_pillar
      FOREIGN KEY (pillar_keyword_id) REFERENCES keywords(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_keywords_post'
    AND table_name = 'keywords'
  ) THEN
    ALTER TABLE keywords ADD CONSTRAINT fk_keywords_post
      FOREIGN KEY (content_post_id) REFERENCES posts(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Freshness audit log
CREATE TABLE IF NOT EXISTS freshness_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_date date NOT NULL DEFAULT CURRENT_DATE,
  total_published integer DEFAULT 0,
  fresh_count integer DEFAULT 0,
  stale_count integer DEFAULT 0,
  critical_count integer DEFAULT 0,
  avg_age_days integer DEFAULT 0,
  freshness_percent integer DEFAULT 0,
  flagged_for_refresh integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Cluster coverage view
CREATE OR REPLACE VIEW cluster_coverage AS
SELECT
  cluster_name,
  COUNT(*) AS total_keywords,
  COUNT(*) FILTER (WHERE status = 'published' OR coverage_status = 'covered') AS covered_keywords,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'published' OR coverage_status = 'covered')::numeric /
    NULLIF(COUNT(*), 0) * 100
  ) AS coverage_percent,
  BOOL_OR(COALESCE(is_pillar, false)) AS has_pillar
FROM keywords
WHERE cluster_name IS NOT NULL
GROUP BY cluster_name
ORDER BY coverage_percent ASC;

-- Freshness + cluster config defaults
INSERT INTO ai_config (key, value, description) VALUES
  ('freshness_threshold_days', '120', 'Days before content is considered stale'),
  ('freshness_critical_multiplier', '2', 'Multiplier for critical staleness (threshold * this)'),
  ('freshness_scan_enabled', 'true', 'Enable weekly freshness scanning'),
  ('content_refresh_enabled', 'false', 'Enable automatic content refresh in pipeline'),
  ('content_refresh_max_per_week', '2', 'Max articles to refresh per week'),
  ('cluster_aware_research', 'true', 'Enable cluster-aware topic research'),
  ('cluster_min_articles', '3', 'Minimum cluster articles before suggesting pillar'),
  ('cluster_max_articles', '8', 'Maximum articles per cluster')
ON CONFLICT (key) DO NOTHING;
