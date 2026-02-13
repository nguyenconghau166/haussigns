-- Add facebook_post_id to posts table to track auto-posting
ALTER TABLE posts ADD COLUMN IF NOT EXISTS facebook_post_id TEXT;
