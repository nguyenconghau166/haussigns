import { NextResponse } from 'next/server';
import { runFreshnessScan } from '@/lib/freshness-manager';

export const maxDuration = 60; // 1 minute max

function isAuthorized(request: Request): boolean {
  const authHeader = request.headers.get('authorization') || '';
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return authHeader === `Bearer ${secret}`;
}

/**
 * Freshness Scanner Cron
 * Runs weekly to identify stale content that needs refreshing.
 * Schedule: Monday at 3 AM (configured in vercel.json)
 */
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runFreshnessScan();

    return NextResponse.json({
      success: true,
      stats: result.stats,
      flagged: result.flagged,
      stale_articles: result.staleArticles.map((a) => ({
        title: a.title,
        slug: a.slug,
        age_days: a.age_days,
        refresh_priority: a.refresh_priority,
        reason: a.reason,
      })),
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Freshness scan failed:', errMsg);
    return NextResponse.json({ success: false, error: errMsg }, { status: 500 });
  }
}
