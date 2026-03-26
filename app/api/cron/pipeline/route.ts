import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { executePipelinePhase1, executePipelinePhase2, PipelineEvent } from '@/lib/pipeline-runner';

export const maxDuration = 300; // 5 minutes

function isAuthorized(request: Request): boolean {
  const authHeader = request.headers.get('authorization') || '';
  const secret = process.env.CRON_SECRET;

  if (!secret) return false;
  return authHeader === `Bearer ${secret}`;
}

function toDate(value?: string | null): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: cfgRows } = await supabaseAdmin
    .from('ai_config')
    .select('key, value')
    .in('key', ['schedule_enabled', 'schedule_interval', 'pipeline_last_run_at']);

  const config = (cfgRows || []).reduce((acc, row) => {
    acc[row.key] = row.value;
    return acc;
  }, {} as Record<string, string>);

  if ((config.schedule_enabled || 'false') !== 'true') {
    return NextResponse.json({ success: true, skipped: true, reason: 'Schedule is disabled' });
  }

  // Auto-cleanup: mark pipelines stuck in "running" for over 10 minutes as failed
  const stuckThreshold = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { data: stuckRuns } = await supabaseAdmin
    .from('ai_pipeline_runs')
    .select('id, status, started_at')
    .in('status', ['running', 'phase1_done'])
    .lt('started_at', stuckThreshold);

  // Also find phase1_done runs stuck for over 2 hours (likely broken)
  const phase1StuckThreshold = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  const { data: phase1StuckRuns } = await supabaseAdmin
    .from('ai_pipeline_runs')
    .select('id, status, started_at')
    .eq('status', 'phase1_done')
    .lt('started_at', phase1StuckThreshold);

  if (stuckRuns?.length) {
    for (const stuck of stuckRuns) {
      if (stuck.status === 'running') {
        await supabaseAdmin.from('ai_pipeline_runs').update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_log: `Pipeline bị treo - tự động đánh dấu thất bại sau 10 phút (started: ${stuck.started_at})`
        }).eq('id', stuck.id);
      }
    }
  }

  // Cleanup phase1_done runs stuck > 2 hours — likely failed retries
  if (phase1StuckRuns?.length) {
    for (const stuck of phase1StuckRuns) {
      await supabaseAdmin.from('ai_pipeline_runs').update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_log: `Phase 2 không thể hoàn thành sau 2 giờ - tự động đánh dấu thất bại (started: ${stuck.started_at})`
      }).eq('id', stuck.id);
    }
  }

  // Check if another pipeline is genuinely still running (started within last 10 minutes)
  const { data: runningRun } = await supabaseAdmin
    .from('ai_pipeline_runs')
    .select('id, started_at')
    .eq('status', 'running')
    .gte('started_at', stuckThreshold)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (runningRun?.id) {
    return NextResponse.json({
      success: true,
      skipped: true,
      reason: 'Another pipeline run is still active',
      running_batch_id: runningRun.id
    });
  }

  // =============================================
  // Phased Pipeline Logic:
  // 1. Check for phase1_done runs with pending topics → run Phase 2
  // 2. Otherwise, check interval and run Phase 1
  // =============================================

  // Priority: finish pending Phase 2 work first
  const { data: phase1DoneRun } = await supabaseAdmin
    .from('ai_pipeline_runs')
    .select('id, details')
    .eq('status', 'phase1_done')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (phase1DoneRun?.id) {
    // Check if there are still unwritten topics
    const details = phase1DoneRun.details as {
      approved_topics?: Array<{ keyword: string }>;
      topics_written?: string[];
    } | null;

    const approvedTopics = details?.approved_topics || [];
    const writtenKeywords = new Set(details?.topics_written || []);
    const hasUnwritten = approvedTopics.some(t => !writtenKeywords.has(t.keyword));

    if (hasUnwritten) {
      const events: PipelineEvent[] = [];
      const result = await executePipelinePhase2(phase1DoneRun.id, {
        onEvent: (event) => { events.push(event); }
      });

      return NextResponse.json({
        success: true,
        triggered: true,
        phase: 2,
        result,
        summary: events.slice(-6)
      });
    } else {
      // All topics written, mark as completed
      await supabaseAdmin.from('ai_pipeline_runs').update({
        status: 'completed',
        completed_at: new Date().toISOString()
      }).eq('id', phase1DoneRun.id);
    }
  }

  // No pending Phase 2 — check if Phase 1 is due
  const intervalHours = Math.max(1, parseInt(config.schedule_interval || '24', 10) || 24);
  const lastRunAt = toDate(config.pipeline_last_run_at);
  const now = new Date();

  if (lastRunAt) {
    const nextRun = new Date(lastRunAt.getTime() + intervalHours * 60 * 60 * 1000);
    if (nextRun > now) {
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: 'Not due yet',
        next_run_at: nextRun.toISOString()
      });
    }
  }

  await supabaseAdmin.from('ai_config').upsert({ key: 'pipeline_last_run_at', value: now.toISOString() });

  const events: PipelineEvent[] = [];
  const result = await executePipelinePhase1({
    triggerType: 'scheduled',
    onEvent: (event) => { events.push(event); }
  });

  return NextResponse.json({
    success: true,
    triggered: true,
    phase: 1,
    result,
    summary: events.slice(-6)
  });
}
