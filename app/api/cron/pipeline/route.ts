import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { executePipeline, PipelineEvent } from '@/lib/pipeline-runner';

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

  const runningThreshold = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  const { data: runningRun } = await supabaseAdmin
    .from('ai_pipeline_runs')
    .select('id, started_at')
    .eq('status', 'running')
    .gte('started_at', runningThreshold)
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

  await supabaseAdmin.from('ai_config').upsert({ key: 'pipeline_last_run_at', value: now.toISOString() });

  const events: PipelineEvent[] = [];
  const result = await executePipeline({
    triggerType: 'scheduled',
    onEvent: (event) => {
      events.push(event);
    }
  });

  return NextResponse.json({
    success: true,
    triggered: true,
    result,
    summary: events.slice(-8)
  });
}
