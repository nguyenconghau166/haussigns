import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { runPipeline } from '@/lib/pipeline';

export const maxDuration = 300;

function isAuthorized(request: Request): boolean {
  const authHeader = request.headers.get('authorization') || '';
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error('[cron/pipeline] CRON_SECRET not set');
    return false;
  }
  return authHeader === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    console.error('[cron/pipeline] Unauthorized request');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Check if scheduling is enabled
    const { data: configData, error: configError } = await supabaseAdmin
      .from('ai_config').select('key, value')
      .in('key', ['schedule_enabled', 'daily_publish_target']);

    if (configError) {
      console.error('[cron/pipeline] Config query failed:', configError.message);
      return NextResponse.json({ status: 'error', reason: `Config query failed: ${configError.message}` }, { status: 500 });
    }

    const config = (configData || []).reduce((acc, r) => {
      acc[r.key] = r.value; return acc;
    }, {} as Record<string, string>);

    console.log('[cron/pipeline] Config:', JSON.stringify(config));

    if (config.schedule_enabled !== 'true') {
      console.log('[cron/pipeline] Skipped: scheduling disabled');
      return NextResponse.json({ status: 'skipped', reason: 'Pipeline scheduling disabled' });
    }

    // Cleanup stuck pipelines (running > 10 min)
    const tenMinAgo = new Date(Date.now() - 10 * 60000).toISOString();
    const { data: stuckData } = await supabaseAdmin.from('ai_pipeline_runs')
      .update({ status: 'failed', error_log: 'Timed out (stuck > 10min)', completed_at: new Date().toISOString() })
      .eq('status', 'running')
      .lt('started_at', tenMinAgo)
      .select('id');

    if (stuckData?.length) {
      console.log(`[cron/pipeline] Cleaned ${stuckData.length} stuck pipelines`);
    }

    // Check if daily target already met
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const { count, error: countError } = await supabaseAdmin
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', todayStart.toISOString());

    if (countError) {
      console.error('[cron/pipeline] Posts count query failed:', countError.message);
      return NextResponse.json({ status: 'error', reason: `Posts count failed: ${countError.message}` }, { status: 500 });
    }

    const target = parseInt(config.daily_publish_target || '2', 10);
    console.log(`[cron/pipeline] Posts today: ${count}/${target}`);

    if ((count || 0) >= target) {
      return NextResponse.json({ status: 'skipped', reason: `Daily target met: ${count}/${target} articles` });
    }

    // Check no other pipeline is running
    const { data: running } = await supabaseAdmin
      .from('ai_pipeline_runs')
      .select('id')
      .eq('status', 'running')
      .limit(1);

    if (running?.length) {
      console.log('[cron/pipeline] Skipped: another pipeline running', running[0].id);
      return NextResponse.json({ status: 'skipped', reason: 'Another pipeline is running' });
    }

    // Run pipeline
    console.log('[cron/pipeline] Starting pipeline run...');
    const result = await runPipeline({
      triggerType: 'scheduled',
      onEvent: () => {} // No SSE for cron
    });

    console.log(`[cron/pipeline] Pipeline finished: ${result.status}, batch: ${result.batch_id}, duration: ${result.duration_ms}ms`);

    return NextResponse.json({
      status: result.status,
      batch_id: result.batch_id,
      article: result.article ? {
        slug: result.article.slug,
        auto_published: result.article.auto_published,
        quality_score: result.article.quality_score
      } : null,
      duration_ms: result.duration_ms
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[cron/pipeline] Unhandled error:', msg);
    return NextResponse.json({ status: 'failed', error: msg }, { status: 500 });
  }
}
