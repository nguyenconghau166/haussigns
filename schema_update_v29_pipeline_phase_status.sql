-- V29: Add 'phase1_done' to ai_pipeline_runs status CHECK constraint
-- Root cause: pipeline code sets status='phase1_done' between Phase 1 (research/evaluate)
-- and Phase 2 (write/visual), but the CHECK constraint silently rejects it.
-- This causes Phase 2 to never run, leaving all pipelines stuck as 'running'.

-- Step 1: Drop old constraint and add new one with 'phase1_done'
ALTER TABLE ai_pipeline_runs DROP CONSTRAINT IF EXISTS ai_pipeline_runs_status_check;
ALTER TABLE ai_pipeline_runs ADD CONSTRAINT ai_pipeline_runs_status_check
  CHECK (status IN ('running', 'completed', 'failed', 'partial', 'phase1_done'));

-- Step 2: Fix all currently stuck 'running' pipelines that will never complete
UPDATE ai_pipeline_runs
SET status = 'failed',
    completed_at = NOW(),
    error_log = 'Auto-fixed: pipeline stuck as running due to missing phase1_done constraint (v29 migration)'
WHERE status = 'running'
  AND started_at < NOW() - INTERVAL '15 minutes';
