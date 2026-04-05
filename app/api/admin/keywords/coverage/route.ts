import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    // Get all keywords
    const { data: keywords, error: kwError } = await supabaseAdmin
      .from('keywords')
      .select('id, keyword, opportunity_score, intent, status, cluster_name')
      .order('opportunity_score', { ascending: false });

    if (kwError) {
      return NextResponse.json({ error: kwError.message }, { status: 500 });
    }

    // Get published posts
    const { data: posts, error: postError } = await supabaseAdmin
      .from('posts')
      .select('id, title, slug, meta_title, tags, status')
      .eq('status', 'published');

    if (postError) {
      return NextResponse.json({ error: postError.message }, { status: 500 });
    }

    const allKeywords = keywords || [];
    const allPosts = posts || [];

    // Check coverage: keyword appears in post title, meta_title, or tags
    const coverage = allKeywords.map((kw) => {
      const kwLower = kw.keyword.toLowerCase();
      const matchingPost = allPosts.find((post) => {
        const titleMatch = (post.title || '').toLowerCase().includes(kwLower);
        const metaMatch = (post.meta_title || '').toLowerCase().includes(kwLower);
        const tagMatch = Array.isArray(post.tags) && post.tags.some((t: string) => t.toLowerCase().includes(kwLower));
        return titleMatch || metaMatch || tagMatch;
      });

      return {
        id: kw.id,
        keyword: kw.keyword,
        opportunity_score: kw.opportunity_score,
        intent: kw.intent,
        status: kw.status,
        cluster_name: kw.cluster_name,
        covered: Boolean(matchingPost),
        post_title: matchingPost?.title || null,
        post_slug: matchingPost?.slug || null,
        post_id: matchingPost?.id || null,
      };
    });

    const covered = coverage.filter((c) => c.covered);
    const uncovered = coverage.filter((c) => !c.covered);

    // Stats by intent
    const intentStats = ['transactional', 'commercial', 'informational', 'navigational'].map((intent) => ({
      intent,
      covered: covered.filter((c) => c.intent === intent).length,
      uncovered: uncovered.filter((c) => c.intent === intent).length,
    }));

    return NextResponse.json({
      coverage,
      stats: {
        total: allKeywords.length,
        covered: covered.length,
        uncovered: uncovered.length,
        coverageRate: allKeywords.length > 0 ? Math.round((covered.length / allKeywords.length) * 100) : 0,
        intentStats,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
