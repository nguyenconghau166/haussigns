-- MIGRATION v24 (Content QA history)

CREATE TABLE IF NOT EXISTS content_qa_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  entity_table TEXT,
  entity_id TEXT,
  content_type TEXT NOT NULL,
  title TEXT,
  score_overall INTEGER NOT NULL,
  score_structure INTEGER NOT NULL,
  score_depth INTEGER NOT NULL,
  score_seo INTEGER NOT NULL,
  score_clarity INTEGER NOT NULL,
  score_trust INTEGER NOT NULL,
  suggestions JSONB DEFAULT '[]'::JSONB,
  source TEXT DEFAULT 'manual'
);

ALTER TABLE content_qa_history ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_catalog.pg_policies
    WHERE policyname = 'Authenticated Read QA History'
  ) THEN
    CREATE POLICY "Authenticated Read QA History"
    ON content_qa_history FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT FROM pg_catalog.pg_policies
    WHERE policyname = 'Authenticated Insert QA History'
  ) THEN
    CREATE POLICY "Authenticated Insert QA History"
    ON content_qa_history FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_content_qa_history_entity ON content_qa_history (entity_table, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_qa_history_type ON content_qa_history (content_type, created_at DESC);
