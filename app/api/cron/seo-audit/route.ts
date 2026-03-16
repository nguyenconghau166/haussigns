import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { bulkAnalyzeFromSitemapAction, rescanOutdatedPagesAction } from '@/app/actions/seo';

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

function toPositiveInt(value: string | undefined, fallbackValue: number, maxValue: number): number {
  const parsed = parseInt(value || '', 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallbackValue;
  return Math.min(parsed, maxValue);
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: cfgRows } = await supabaseAdmin
    .from('ai_config')
    .select('key, value')
    .in('key', [
      'seo_schedule_enabled',
      'seo_schedule_interval',
      'seo_last_run_at',
      'seo_bulk_scan_limit',
      'seo_stale_days',
      'seo_rescan_limit',
    ]);

  const config = (cfgRows || []).reduce((acc, row) => {
    acc[row.key] = row.value;
    return acc;
  }, {} as Record<string, string>);

  if ((config.seo_schedule_enabled || 'false') !== 'true') {
    return NextResponse.json({ success: true, skipped: true, reason: 'SEO schedule is disabled' });
  }

  const intervalHours = toPositiveInt(config.seo_schedule_interval, 24, 720);
  const lastRunAt = toDate(config.seo_last_run_at);
  const now = new Date();

  if (lastRunAt) {
    const nextRun = new Date(lastRunAt.getTime() + intervalHours * 60 * 60 * 1000);
    if (nextRun > now) {
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: 'Not due yet',
        next_run_at: nextRun.toISOString(),
      });
    }
  }

  const bulkLimit = toPositiveInt(config.seo_bulk_scan_limit, 25, 100);
  const staleDays = toPositiveInt(config.seo_stale_days, 7, 365);
  const rescanLimit = toPositiveInt(config.seo_rescan_limit, 20, 100);

  const bulkResult = await bulkAnalyzeFromSitemapAction(bulkLimit);
  const rescanResult = await rescanOutdatedPagesAction(staleDays, rescanLimit);

  await supabaseAdmin.from('ai_config').upsert({ key: 'seo_last_run_at', value: now.toISOString() });

  return NextResponse.json({
    success: true,
    triggered: true,
    at: now.toISOString(),
    config: {
      interval_hours: intervalHours,
      bulk_limit: bulkLimit,
      stale_days: staleDays,
      rescan_limit: rescanLimit,
    },
    bulk: bulkResult,
    rescan: rescanResult,
  });
}
