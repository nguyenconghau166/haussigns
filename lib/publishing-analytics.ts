/**
 * Publishing Analytics
 * Aggregates metrics: articles/day, auto vs manual ratio,
 * quality score trends, cluster coverage progress.
 */

import { supabaseAdmin } from './supabase';
import { getFreshnessStats } from './freshness-manager';
import { getClusterCoverage } from './cluster-intelligence';

// =============================================
// Types
// =============================================

export interface PublishingMetrics {
  period: string;
  articles_published: number;
  articles_drafted: number;
  auto_published: number;
  manual_published: number;
  avg_quality_score: number;
  avg_seo_score: number;
  avg_aio_score: number;
  fb_posts_sent: number;
  fb_posts_failed: number;
}

export interface DashboardAnalytics {
  today: PublishingMetrics;
  last_7_days: PublishingMetrics;
  last_30_days: PublishingMetrics;
  freshness: {
    total_published: number;
    fresh_percent: number;
    stale_count: number;
    critical_count: number;
  };
  clusters: {
    total_clusters: number;
    avg_coverage: number;
    fully_covered: number;
    needs_attention: number;
  };
  pipeline: {
    total_runs: number;
    success_rate: number;
    avg_articles_per_run: number;
  };
}

// =============================================
// Metric Calculations
// =============================================

async function getPublishingMetrics(sinceDays: number): Promise<PublishingMetrics> {
  const sinceDate = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000).toISOString();
  const period = sinceDays === 0 ? 'today' : `last_${sinceDays}_days`;

  // For "today", use start of day
  const startDate = sinceDays === 0
    ? new Date(new Date().setHours(0, 0, 0, 0)).toISOString()
    : sinceDate;

  // Published articles
  const { data: published } = await supabaseAdmin
    .from('posts')
    .select('id, seo_score, aio_score, auto_published')
    .eq('status', 'published')
    .gte('created_at', startDate);

  const articles = published || [];
  const autoPublished = articles.filter((a) => a.auto_published).length;
  const seoScores = articles.map((a) => a.seo_score || 0).filter((s) => s > 0);
  const aioScores = articles.map((a) => a.aio_score || 0).filter((s) => s > 0);

  // Draft articles
  const { data: drafted } = await supabaseAdmin
    .from('posts')
    .select('id')
    .eq('status', 'draft')
    .gte('created_at', startDate);

  // Facebook stats
  const { data: fbSent } = await supabaseAdmin
    .from('facebook_queue')
    .select('id')
    .eq('status', 'posted')
    .gte('posted_at', startDate);

  const { data: fbFailed } = await supabaseAdmin
    .from('facebook_queue')
    .select('id')
    .eq('status', 'failed')
    .gte('created_at', startDate);

  const avgScore = seoScores.length
    ? Math.round(seoScores.reduce((a, b) => a + b, 0) / seoScores.length)
    : 0;
  const avgAio = aioScores.length
    ? Math.round(aioScores.reduce((a, b) => a + b, 0) / aioScores.length)
    : 0;

  return {
    period,
    articles_published: articles.length,
    articles_drafted: drafted?.length || 0,
    auto_published: autoPublished,
    manual_published: articles.length - autoPublished,
    avg_quality_score: avgScore,
    avg_seo_score: avgScore,
    avg_aio_score: avgAio,
    fb_posts_sent: fbSent?.length || 0,
    fb_posts_failed: fbFailed?.length || 0,
  };
}

// =============================================
// Dashboard Analytics
// =============================================

export async function getDashboardAnalytics(): Promise<DashboardAnalytics> {
  const [today, week, month, freshness, clusters] = await Promise.all([
    getPublishingMetrics(0),
    getPublishingMetrics(7),
    getPublishingMetrics(30),
    getFreshnessStats(),
    getClusterCoverage(),
  ]);

  // Pipeline success rate
  const { data: pipelineRuns } = await supabaseAdmin
    .from('ai_pipeline_runs')
    .select('status, articles_created')
    .gte('started_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  const runs = pipelineRuns || [];
  const successRuns = runs.filter((r) => r.status === 'completed' || r.status === 'success');
  const totalArticlesFromPipeline = runs.reduce((acc, r) => acc + (r.articles_created || 0), 0);

  const fullyCovered = clusters.filter((c) => c.coverage_percent >= 80).length;
  const needsAttention = clusters.filter((c) => c.coverage_percent < 30).length;
  const avgCoverage = clusters.length
    ? Math.round(clusters.reduce((acc, c) => acc + c.coverage_percent, 0) / clusters.length)
    : 0;

  return {
    today,
    last_7_days: week,
    last_30_days: month,
    freshness: {
      total_published: freshness.total_published,
      fresh_percent: freshness.freshness_percent,
      stale_count: freshness.stale_count,
      critical_count: freshness.critical_count,
    },
    clusters: {
      total_clusters: clusters.length,
      avg_coverage: avgCoverage,
      fully_covered: fullyCovered,
      needs_attention: needsAttention,
    },
    pipeline: {
      total_runs: runs.length,
      success_rate: runs.length ? Math.round((successRuns.length / runs.length) * 100) : 0,
      avg_articles_per_run: runs.length ? Math.round((totalArticlesFromPipeline / runs.length) * 10) / 10 : 0,
    },
  };
}

/**
 * Track Facebook queue stats in daily_publish_stats
 */
export async function trackFacebookStats(queued: number, sent: number): Promise<void> {
  const today = new Date().toISOString().split('T')[0];

  const { data: existing } = await supabaseAdmin
    .from('daily_publish_stats')
    .select('id, fb_posts_queued, fb_posts_sent')
    .eq('publish_date', today)
    .maybeSingle();

  if (existing) {
    await supabaseAdmin
      .from('daily_publish_stats')
      .update({
        fb_posts_queued: (existing.fb_posts_queued || 0) + queued,
        fb_posts_sent: (existing.fb_posts_sent || 0) + sent,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
  } else {
    await supabaseAdmin
      .from('daily_publish_stats')
      .insert({
        publish_date: today,
        fb_posts_queued: queued,
        fb_posts_sent: sent,
      });
  }
}
