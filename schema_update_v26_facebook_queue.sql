-- v26: Facebook Queue for multi-page auto-posting with delay
-- Supports 2 fanpages with AI-adapted captions and 30-minute delay before posting

CREATE TABLE IF NOT EXISTS facebook_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  page_key TEXT NOT NULL,
  page_name TEXT,
  caption TEXT NOT NULL,
  image_url TEXT,
  blog_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'posted', 'failed', 'cancelled')),
  facebook_post_id TEXT,
  error TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  posted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for cron processing: find pending items ready to post
CREATE INDEX IF NOT EXISTS idx_facebook_queue_pending ON facebook_queue (status, scheduled_at)
  WHERE status = 'pending';

-- Index for checking duplicates by post_id
CREATE INDEX IF NOT EXISTS idx_facebook_queue_post_id ON facebook_queue (post_id);
