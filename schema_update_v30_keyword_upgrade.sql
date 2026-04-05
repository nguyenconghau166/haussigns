-- v30: Upgrade keywords table for full keyword research hub

-- Add missing columns to keywords table
ALTER TABLE keywords ADD COLUMN IF NOT EXISTS opportunity_score INTEGER DEFAULT 0;
ALTER TABLE keywords ADD COLUMN IF NOT EXISTS trend INTEGER DEFAULT 0;
ALTER TABLE keywords ADD COLUMN IF NOT EXISTS cpc NUMERIC(8,2) DEFAULT 0;
ALTER TABLE keywords ADD COLUMN IF NOT EXISTS local_opportunity INTEGER DEFAULT 0;
ALTER TABLE keywords ADD COLUMN IF NOT EXISTS rationale TEXT;
ALTER TABLE keywords ADD COLUMN IF NOT EXISTS related_keywords TEXT[] DEFAULT '{}';
ALTER TABLE keywords ADD COLUMN IF NOT EXISTS cluster_name TEXT;
ALTER TABLE keywords ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0;
ALTER TABLE keywords ADD COLUMN IF NOT EXISTS source_scan_id UUID;
ALTER TABLE keywords ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE keywords ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Update intent constraint to include 'commercial'
ALTER TABLE keywords DROP CONSTRAINT IF EXISTS keywords_intent_check;
ALTER TABLE keywords ADD CONSTRAINT keywords_intent_check
  CHECK (intent IN ('informational', 'transactional', 'navigational', 'commercial'));

-- Update status constraint with more states
ALTER TABLE keywords DROP CONSTRAINT IF EXISTS keywords_status_check;
ALTER TABLE keywords ADD CONSTRAINT keywords_status_check
  CHECK (status IN ('discovered', 'planned', 'in_progress', 'published', 'skipped'));

-- Update existing rows to new status
UPDATE keywords SET status = 'discovered' WHERE status = 'pending';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_keywords_status ON keywords(status);
CREATE INDEX IF NOT EXISTS idx_keywords_opportunity ON keywords(opportunity_score DESC);
CREATE INDEX IF NOT EXISTS idx_keywords_cluster ON keywords(cluster_name);
CREATE INDEX IF NOT EXISTS idx_keywords_intent ON keywords(intent);
