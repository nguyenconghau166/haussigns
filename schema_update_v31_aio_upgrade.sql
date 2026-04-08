-- =============================================
-- v31: AIO (AI Overview) Optimization Upgrade
-- Adds columns to track AIO-specific content quality metrics
-- =============================================

-- Posts AIO tracking columns
ALTER TABLE posts ADD COLUMN IF NOT EXISTS aio_score integer DEFAULT 0;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS schema_types text[] DEFAULT '{}';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS has_quick_answer boolean DEFAULT false;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS has_key_takeaways boolean DEFAULT false;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS question_heading_count integer DEFAULT 0;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS entity_density_score integer DEFAULT 0;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS last_quality_check_at timestamptz;

-- Content QA history AIO score column
ALTER TABLE content_qa_history ADD COLUMN IF NOT EXISTS score_aio integer DEFAULT 0;

-- AIO config defaults
INSERT INTO ai_config (key, value, description) VALUES
  ('aio_quick_answer_min_words', '50', 'Minimum words for Quick Answer block'),
  ('aio_quick_answer_max_words', '70', 'Maximum words for Quick Answer block'),
  ('aio_key_takeaways_min', '4', 'Minimum bullet points in Key Takeaways'),
  ('aio_key_takeaways_max', '6', 'Maximum bullet points in Key Takeaways'),
  ('aio_entity_density_target', '150', 'Target: 1 data point per N words'),
  ('aio_question_heading_ratio', '0.67', 'Target ratio of question-based H2 headings')
ON CONFLICT (key) DO NOTHING;
