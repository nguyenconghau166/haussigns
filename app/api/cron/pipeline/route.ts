import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { runPipeline } from '@/lib/pipeline';

export const maxDuration = 300;

function isAuthorized(request: Request): boolean {
  const authHeader = request.headers.get('authorization') || '';
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return authHeader === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Check if scheduling is enabled
    const { data: configData } = await supabaseAdmin
      .from('ai_config').select('key, value')
      .in('key', ['schedule_enabled', 'daily_publish_target']);

    const config = (configData || []).reduce((acc, r) => {
      acc[r.key] = r.value; return acc;
    }, {} as Record<string, string>);

    if (config.schedule_enabled !== 'true') {
      return NextResponse.json({ status: 'skipped', reason: 'Pipeline scheduling disabled' });
    }

    // Cleanup stuck pipelines (running > 10 min)
    const tenMinAgo = new Date(Date.now() - 10 * 60000).toISOString();
    await supabaseAdmin.from('ai_pipeline_runs')
      .update({ status: 'failed', error_log: 'Timed out (stuck > 10min)', completed_at: new Date().toISOString() })
      .eq('status', 'running')
      .lt('started_at', tenMinAgo);

    // Check if daily target already met
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { count } = await supabaseAdmin
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', todayStart.toISOString());

    const target = parseInt(config.daily_publish_target || '2', 10);
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
      return NextResponse.json({ status: 'skipped', reason: 'Another pipeline is running' });
    }

    // Run pipeline
    const result = await runPipeline({
      triggerType: 'scheduled',
      onEvent: () => {} // No SSE for cron
    });

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
    return NextResponse.json({ status: 'failed', error: msg }, { status: 500 });
  }
}
