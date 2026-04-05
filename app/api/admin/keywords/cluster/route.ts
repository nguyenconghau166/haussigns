import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generateSmartContent } from '@/lib/ai/service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const mode = body?.mode || 'auto'; // 'auto' | 'manual'

    if (mode === 'manual') {
      const clusterName = String(body?.cluster_name || '').trim();
      const ids = Array.isArray(body?.ids) ? body.ids : [];

      if (!clusterName || !ids.length) {
        return NextResponse.json({ error: 'Missing cluster_name or ids' }, { status: 400 });
      }

      await supabaseAdmin
        .from('keywords')
        .update({ cluster_name: clusterName, updated_at: new Date().toISOString() })
        .in('id', ids);

      return NextResponse.json({ success: true, cluster: clusterName, count: ids.length });
    }

    // Auto-cluster mode
    const { data: keywords, error } = await supabaseAdmin
      .from('keywords')
      .select('id, keyword, intent, opportunity_score')
      .is('cluster_name', null)
      .order('opportunity_score', { ascending: false })
      .limit(100);

    if (error || !keywords?.length) {
      return NextResponse.json({ error: 'No unclustered keywords found' }, { status: 400 });
    }

    const keywordList = keywords.map((k) => `${k.keyword} (${k.intent}, score:${k.opportunity_score})`).join('\n');

    const systemPrompt = `You are a content strategist for a signage business. Group keywords into topic clusters for content planning.

Rules:
- Create 3-8 clusters based on semantic similarity
- Each cluster should have a clear topic theme
- Cluster names should be short (2-4 words), e.g. "LED Signage", "Restaurant Signs", "Installation Services"
- Return JSON only, no explanation

JSON format:
{
  "clusters": [
    { "name": "Cluster Name", "keywords": ["keyword 1", "keyword 2"] }
  ]
}`;

    const userPrompt = `Group these keywords into topic clusters:\n\n${keywordList}`;
    const content = await generateSmartContent(systemPrompt, userPrompt);

    // Parse response
    const cleaned = content
      ?.replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim() || '{}';

    let parsed: { clusters?: Array<{ name: string; keywords: string[] }> };
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      const match = cleaned.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : {};
    }

    if (!parsed.clusters?.length) {
      return NextResponse.json({ error: 'AI could not cluster keywords' }, { status: 502 });
    }

    // Map keyword text to ids
    const keywordMap = new Map(keywords.map((k) => [k.keyword.toLowerCase(), k.id]));
    let totalUpdated = 0;

    for (const cluster of parsed.clusters) {
      const matchedIds: string[] = [];
      for (const kw of cluster.keywords) {
        const id = keywordMap.get(kw.toLowerCase());
        if (id) matchedIds.push(id);
      }

      if (matchedIds.length > 0) {
        await supabaseAdmin
          .from('keywords')
          .update({ cluster_name: cluster.name, updated_at: new Date().toISOString() })
          .in('id', matchedIds);
        totalUpdated += matchedIds.length;
      }
    }

    return NextResponse.json({
      success: true,
      clusters: parsed.clusters.map((c) => ({ name: c.name, count: c.keywords.length })),
      totalUpdated,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
