/**
 * Content Freshness Manager
 * Tracks content age, flags stale articles for refresh,
 * and prioritizes which content to update first.
 *
 * Freshness is now the 6th biggest ranking factor at 6%.
 * Pages updating yearly gain +4.6 SERP positions.
 * 76% of AI-cited content was updated within last 30 days.
 */

import { supabaseAdmin } from './supabase';

// =============================================
// Types
// =============================================

export interface StaleContent {
  id: string;
  title: string;
  slug: string;
  seo_score: number;
  aio_score: number;
  updated_at: string;
  age_days: number;
  refresh_priority: number;
  reason: string;
}

export interface FreshnessStats {
  total_published: number;
  fresh_count: number;     // < threshold days
  stale_count: number;     // >= threshold days
  critical_count: number;  // >= 2x threshold days
  avg_age_days: number;
  freshness_percent: number;
}

export type FreshnessStatus = 'fresh' | 'aging' | 'stale' | 'critical';

// =============================================
// Configuration
// =============================================

async function getFreshnessConfig(): Promise<{
  thresholdDays: number;
  criticalMultiplier: number;
  maxRefreshPerWeek: number;
  enabled: boolean;
}> {
  const { data: configs } = await supabaseAdmin
    .from('ai_config')
    .select('key, value')
    .in('key', [
      'freshness_threshold_days',
      'freshness_critical_multiplier',
      'content_refresh_max_per_week',
      'freshness_scan_enabled',
    ]);

  const cfg = (configs || []).reduce(
    (acc, row) => {
      acc[row.key] = row.value;
      return acc;
    },
    {} as Record<string, string>
  );

  return {
    thresholdDays: parseInt(cfg.freshness_threshold_days || '120', 10) || 120,
    criticalMultiplier: parseFloat(cfg.freshness_critical_multiplier || '2') || 2,
    maxRefreshPerWeek: parseInt(cfg.content_refresh_max_per_week || '2', 10) || 2,
    enabled: cfg.freshness_scan_enabled !== 'false',
  };
}

// =============================================
// Core Functions
// =============================================

/**
 * Calculate freshness status for a given age in days
 */
export function calculateFreshnessStatus(
  ageDays: number,
  thresholdDays: number,
  criticalMultiplier = 2
): FreshnessStatus {
  if (ageDays < thresholdDays * 0.5) return 'fresh';
  if (ageDays < thresholdDays) return 'aging';
  if (ageDays < thresholdDays * criticalMultiplier) return 'stale';
  return 'critical';
}

/**
 * Calculate refresh priority score (higher = more urgent to refresh)
 * Factors: age, SEO score (high-value content), traffic potential
 */
function calculateRefreshPriority(
  ageDays: number,
  seoScore: number,
  thresholdDays: number
): number {
  // Age factor: exponential increase past threshold
  const ageFactor = Math.max(0, (ageDays - thresholdDays) / thresholdDays) * 40;

  // Value factor: high-SEO-score content is more valuable to keep fresh
  const valueFactor = (seoScore / 100) * 30;

  // Staleness factor: how far past threshold
  const stalenessFactor = Math.min(30, (ageDays / thresholdDays) * 15);

  return Math.round(ageFactor + valueFactor + stalenessFactor);
}

/**
 * Scan published content and identify stale articles.
 * Returns list of articles that need refreshing, sorted by priority.
 */
export async function scanStaleContent(): Promise<StaleContent[]> {
  const config = await getFreshnessConfig();
  if (!config.enabled) return [];

  const thresholdDate = new Date(
    Date.now() - config.thresholdDays * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data: stalePosts, error } = await supabaseAdmin
    .from('posts')
    .select('id, title, slug, seo_score, aio_score, updated_at, created_at')
    .eq('status', 'published')
    .lt('updated_at', thresholdDate)
    .order('updated_at', { ascending: true })
    .limit(50);

  if (error || !stalePosts?.length) return [];

  const now = Date.now();

  return stalePosts.map((post) => {
    const updatedAt = new Date(post.updated_at || post.created_at).getTime();
    const ageDays = Math.round((now - updatedAt) / (24 * 60 * 60 * 1000));
    const seoScore = post.seo_score || 0;
    const aioScore = post.aio_score || 0;
    const priority = calculateRefreshPriority(ageDays, seoScore, config.thresholdDays);
    const status = calculateFreshnessStatus(ageDays, config.thresholdDays, config.criticalMultiplier);

    return {
      id: post.id,
      title: post.title,
      slug: post.slug,
      seo_score: seoScore,
      aio_score: aioScore,
      updated_at: post.updated_at || post.created_at,
      age_days: ageDays,
      refresh_priority: priority,
      reason: status === 'critical'
        ? `CRITICAL: ${ageDays} days since last update (${config.thresholdDays * config.criticalMultiplier}+ threshold)`
        : `STALE: ${ageDays} days since last update (${config.thresholdDays} day threshold)`,
    };
  }).sort((a, b) => b.refresh_priority - a.refresh_priority);
}

/**
 * Flag specific posts for refresh in the database.
 */
export async function flagForRefresh(postIds: string[]): Promise<number> {
  if (!postIds.length) return 0;

  const now = new Date().toISOString();
  let flagged = 0;

  for (const id of postIds) {
    const { error } = await supabaseAdmin
      .from('posts')
      .update({
        freshness_status: 'stale',
        freshness_flagged_at: now,
      })
      .eq('id', id);

    if (!error) flagged++;
  }

  return flagged;
}

/**
 * Get the refresh queue — posts flagged as stale, sorted by priority.
 */
export async function getRefreshQueue(limit = 5): Promise<StaleContent[]> {
  const { data: flaggedPosts, error } = await supabaseAdmin
    .from('posts')
    .select('id, title, slug, seo_score, aio_score, updated_at, created_at, refresh_priority')
    .eq('status', 'published')
    .eq('freshness_status', 'stale')
    .order('refresh_priority', { ascending: false })
    .limit(limit);

  if (error || !flaggedPosts?.length) return [];

  const now = Date.now();

  return flaggedPosts.map((post) => {
    const updatedAt = new Date(post.updated_at || post.created_at).getTime();
    const ageDays = Math.round((now - updatedAt) / (24 * 60 * 60 * 1000));

    return {
      id: post.id,
      title: post.title,
      slug: post.slug,
      seo_score: post.seo_score || 0,
      aio_score: post.aio_score || 0,
      updated_at: post.updated_at || post.created_at,
      age_days: ageDays,
      refresh_priority: post.refresh_priority || 0,
      reason: `Flagged for refresh (${ageDays} days old)`,
    };
  });
}

/**
 * Mark a post as refreshed after content update.
 */
export async function markAsRefreshed(postId: string): Promise<void> {
  const now = new Date().toISOString();

  await supabaseAdmin
    .from('posts')
    .update({
      freshness_status: 'fresh',
      freshness_flagged_at: null,
      last_refreshed_at: now,
      updated_at: now,
    })
    .eq('id', postId);
}

/**
 * Get freshness statistics for the entire published content library.
 */
export async function getFreshnessStats(): Promise<FreshnessStats> {
  const config = await getFreshnessConfig();

  const { data: posts, error } = await supabaseAdmin
    .from('posts')
    .select('updated_at, created_at')
    .eq('status', 'published');

  if (error || !posts?.length) {
    return {
      total_published: 0,
      fresh_count: 0,
      stale_count: 0,
      critical_count: 0,
      avg_age_days: 0,
      freshness_percent: 100,
    };
  }

  const now = Date.now();
  let totalAgeDays = 0;
  let freshCount = 0;
  let staleCount = 0;
  let criticalCount = 0;

  for (const post of posts) {
    const updatedAt = new Date(post.updated_at || post.created_at).getTime();
    const ageDays = Math.round((now - updatedAt) / (24 * 60 * 60 * 1000));
    totalAgeDays += ageDays;

    const status = calculateFreshnessStatus(
      ageDays,
      config.thresholdDays,
      config.criticalMultiplier
    );

    if (status === 'fresh' || status === 'aging') freshCount++;
    else if (status === 'stale') staleCount++;
    else criticalCount++;
  }

  return {
    total_published: posts.length,
    fresh_count: freshCount,
    stale_count: staleCount,
    critical_count: criticalCount,
    avg_age_days: Math.round(totalAgeDays / posts.length),
    freshness_percent: Math.round((freshCount / posts.length) * 100),
  };
}

/**
 * Run the full freshness scan:
 * 1. Find stale content
 * 2. Flag top candidates for refresh
 * 3. Return stats
 */
export async function runFreshnessScan(): Promise<{
  stats: FreshnessStats;
  flagged: number;
  staleArticles: StaleContent[];
}> {
  const config = await getFreshnessConfig();
  if (!config.enabled) {
    return {
      stats: await getFreshnessStats(),
      flagged: 0,
      staleArticles: [],
    };
  }

  const staleArticles = await scanStaleContent();
  const stats = await getFreshnessStats();

  // Flag top priority articles (up to maxRefreshPerWeek)
  const toFlag = staleArticles
    .filter((a) => a.refresh_priority > 0)
    .slice(0, config.maxRefreshPerWeek);

  const flagged = toFlag.length > 0
    ? await flagForRefresh(toFlag.map((a) => a.id))
    : 0;

  // Update refresh_priority in DB
  for (const article of staleArticles.slice(0, 20)) {
    await supabaseAdmin
      .from('posts')
      .update({ refresh_priority: article.refresh_priority })
      .eq('id', article.id);
  }

  return { stats, flagged, staleArticles: staleArticles.slice(0, 10) };
}
