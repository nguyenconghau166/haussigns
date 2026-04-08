/**
 * Cluster Intelligence System
 * Provides cluster-aware topic discovery, coverage tracking,
 * and pillar-cluster internal linking for SEO topic authority.
 *
 * Topic clusters drive 30% more organic traffic and hold rankings 2.5x longer.
 */

import { supabaseAdmin } from './supabase';

// =============================================
// Types
// =============================================

export interface ClusterCoverage {
  cluster_name: string;
  total_keywords: number;
  covered_keywords: number;
  coverage_percent: number;
  has_pillar: boolean;
  pillar_keyword?: string;
  pillar_post_slug?: string;
  uncovered_keywords: string[];
}

export interface ClusterLink {
  title: string;
  slug: string;
  url: string;
  keyword: string;
  is_pillar: boolean;
}

export interface ClusterGapContext {
  priority_cluster: string;
  coverage_percent: number;
  uncovered_keywords: string[];
  suggestion: string;
}

// =============================================
// Cluster Coverage Analysis
// =============================================

/**
 * Get coverage analysis for all keyword clusters.
 * Returns which clusters have gaps and which are well-covered.
 */
export async function getClusterCoverage(): Promise<ClusterCoverage[]> {
  const { data: keywords, error } = await supabaseAdmin
    .from('keywords')
    .select('id, keyword, cluster_name, status, is_pillar, coverage_status, target_post_id')
    .not('cluster_name', 'is', null)
    .order('cluster_name');

  if (error || !keywords?.length) return [];

  // Group by cluster
  const clusters = new Map<string, typeof keywords>();
  for (const kw of keywords) {
    const name = kw.cluster_name || 'unclustered';
    if (!clusters.has(name)) clusters.set(name, []);
    clusters.get(name)!.push(kw);
  }

  const results: ClusterCoverage[] = [];

  for (const [clusterName, clusterKws] of clusters) {
    const covered = clusterKws.filter(
      (k) => k.status === 'published' || k.coverage_status === 'covered'
    );
    const uncovered = clusterKws.filter(
      (k) => k.status !== 'published' && k.coverage_status !== 'covered'
    );
    const pillarKw = clusterKws.find((k) => k.is_pillar);

    // Get pillar post slug if exists
    let pillarPostSlug: string | undefined;
    if (pillarKw?.target_post_id) {
      const { data: post } = await supabaseAdmin
        .from('posts')
        .select('slug')
        .eq('id', pillarKw.target_post_id)
        .single();
      pillarPostSlug = post?.slug;
    }

    results.push({
      cluster_name: clusterName,
      total_keywords: clusterKws.length,
      covered_keywords: covered.length,
      coverage_percent: Math.round((covered.length / clusterKws.length) * 100),
      has_pillar: Boolean(pillarKw),
      pillar_keyword: pillarKw?.keyword,
      pillar_post_slug: pillarPostSlug,
      uncovered_keywords: uncovered.map((k) => k.keyword),
    });
  }

  // Sort by coverage (lowest first = highest priority)
  return results.sort((a, b) => a.coverage_percent - b.coverage_percent);
}

/**
 * Get the next priority cluster for content creation.
 * Prioritizes clusters with lowest coverage that have at least some keywords.
 */
export async function getNextPriorityCluster(): Promise<ClusterGapContext | null> {
  const coverage = await getClusterCoverage();

  // Find cluster with lowest coverage that still has uncovered keywords
  const priorityCluster = coverage.find(
    (c) => c.uncovered_keywords.length > 0 && c.total_keywords >= 2
  );

  if (!priorityCluster) return null;

  const needsPillar = !priorityCluster.has_pillar && priorityCluster.covered_keywords >= 3;

  return {
    priority_cluster: priorityCluster.cluster_name,
    coverage_percent: priorityCluster.coverage_percent,
    uncovered_keywords: priorityCluster.uncovered_keywords.slice(0, 5),
    suggestion: needsPillar
      ? `Cluster "${priorityCluster.cluster_name}" has ${priorityCluster.covered_keywords} articles but no pillar page. Create a comprehensive pillar article covering: ${priorityCluster.uncovered_keywords.slice(0, 3).join(', ')}`
      : `Cluster "${priorityCluster.cluster_name}" is only ${priorityCluster.coverage_percent}% covered. Priority keywords: ${priorityCluster.uncovered_keywords.slice(0, 3).join(', ')}`,
  };
}

/**
 * Suggest a pillar topic for a cluster that has enough supporting content.
 */
export async function suggestPillarTopic(
  clusterName: string
): Promise<{ keyword: string; relatedArticles: number } | null> {
  const { data: clusterKws } = await supabaseAdmin
    .from('keywords')
    .select('keyword, status, volume, difficulty')
    .eq('cluster_name', clusterName)
    .order('volume', { ascending: false });

  if (!clusterKws || clusterKws.length < 3) return null;

  const publishedCount = clusterKws.filter((k) => k.status === 'published').length;
  if (publishedCount < 3) return null;

  // Best pillar candidate: highest volume, medium difficulty
  const candidate = clusterKws.find(
    (k) => k.status !== 'published' && (k.difficulty || 50) <= 60
  ) || clusterKws[0];

  return {
    keyword: candidate.keyword,
    relatedArticles: publishedCount,
  };
}

// =============================================
// Cluster Internal Linking
// =============================================

/**
 * Get sibling articles in the same cluster for internal linking.
 * Prioritizes pillar article and most recent articles.
 */
export async function getClusterInternalLinks(
  clusterName: string,
  excludeSlug: string,
  limit = 5
): Promise<ClusterLink[]> {
  // Get keywords in this cluster that have published posts
  const { data: clusterKws } = await supabaseAdmin
    .from('keywords')
    .select('keyword, target_post_id, is_pillar')
    .eq('cluster_name', clusterName)
    .eq('status', 'published')
    .not('target_post_id', 'is', null);

  if (!clusterKws?.length) return [];

  const postIds = clusterKws
    .map((k) => k.target_post_id)
    .filter(Boolean) as string[];

  if (!postIds.length) return [];

  const { data: posts } = await supabaseAdmin
    .from('posts')
    .select('id, title, slug')
    .in('id', postIds)
    .eq('status', 'published')
    .neq('slug', excludeSlug)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (!posts?.length) return [];

  return posts.map((post) => {
    const kw = clusterKws.find((k) => k.target_post_id === post.id);
    return {
      title: post.title,
      slug: post.slug,
      url: `/blog/${post.slug}`,
      keyword: kw?.keyword || post.title,
      is_pillar: kw?.is_pillar || false,
    };
  }).sort((a, b) => (b.is_pillar ? 1 : 0) - (a.is_pillar ? 1 : 0)); // Pillar first
}

/**
 * Determine which cluster a keyword belongs to.
 */
export async function getKeywordCluster(keyword: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from('keywords')
    .select('cluster_name')
    .eq('keyword', keyword)
    .not('cluster_name', 'is', null)
    .limit(1)
    .maybeSingle();

  return data?.cluster_name || null;
}

/**
 * Save approved research topics to keywords table.
 */
export async function saveApprovedTopicsToKeywords(
  topics: Array<{
    keyword: string;
    expanded_keywords?: string[];
    score?: number;
    intent?: string;
    news_angle?: string;
  }>,
  pipelineRunId: string
): Promise<number> {
  let saved = 0;

  for (const topic of topics) {
    // Check if keyword already exists
    const { data: existing } = await supabaseAdmin
      .from('keywords')
      .select('id, status')
      .eq('keyword', topic.keyword)
      .maybeSingle();

    if (existing) {
      // Update status to planned if not already published
      if (existing.status !== 'published') {
        await supabaseAdmin
          .from('keywords')
          .update({
            status: 'planned',
            intent: topic.intent || 'informational',
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
        saved++;
      }
    } else {
      // Insert new keyword
      const { error } = await supabaseAdmin.from('keywords').insert({
        keyword: topic.keyword,
        status: 'planned',
        intent: topic.intent || 'informational',
        related_keywords: topic.expanded_keywords || [],
        opportunity_score: topic.score || 0,
        rationale: topic.news_angle || '',
        notes: `Auto-discovered by pipeline run ${pipelineRunId}`,
      });

      if (!error) saved++;
    }
  }

  return saved;
}

/**
 * Mark a keyword as published and link to post.
 */
export async function linkKeywordToPost(
  keyword: string,
  postId: string,
  clusterName?: string
): Promise<void> {
  const updates: Record<string, unknown> = {
    status: 'published',
    target_post_id: postId,
    coverage_status: 'covered',
    updated_at: new Date().toISOString(),
  };

  if (clusterName) {
    updates.cluster_name = clusterName;
  }

  await supabaseAdmin
    .from('keywords')
    .update(updates)
    .eq('keyword', keyword);
}

/**
 * Build cluster gap context string to append to research prompts.
 */
export async function buildClusterGapPrompt(): Promise<string> {
  const gap = await getNextPriorityCluster();
  if (!gap) return '';

  const coverage = await getClusterCoverage();
  const lowCoverage = coverage.filter((c) => c.coverage_percent < 50).slice(0, 3);

  let prompt = '\n\nCLUSTER STRATEGY — PRIORITIZE THESE GAPS:\n';
  prompt += `Priority cluster: "${gap.priority_cluster}" (${gap.coverage_percent}% covered)\n`;
  prompt += `Uncovered keywords: ${gap.uncovered_keywords.join(', ')}\n`;
  prompt += gap.suggestion + '\n';

  if (lowCoverage.length > 1) {
    prompt += '\nOther low-coverage clusters:\n';
    for (const c of lowCoverage.slice(1)) {
      prompt += `- "${c.cluster_name}": ${c.coverage_percent}% covered (${c.uncovered_keywords.slice(0, 3).join(', ')})\n`;
    }
  }

  prompt += '\nTry to select topics from these gap areas to build topical authority.\n';

  return prompt;
}
