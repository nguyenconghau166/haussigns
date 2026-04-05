import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const cluster = searchParams.get('cluster');
    const minScore = Number(searchParams.get('min_score') || 0);

    let query = supabaseAdmin
      .from('keywords')
      .select('keyword, volume, difficulty, intent, trend, cpc, local_opportunity, opportunity_score, status, cluster_name, priority, rationale, related_keywords, created_at')
      .order('opportunity_score', { ascending: false });

    if (status) query = query.eq('status', status);
    if (cluster) query = query.eq('cluster_name', cluster);
    if (minScore > 0) query = query.gte('opportunity_score', minScore);

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows = data || [];
    const headers = ['Keyword', 'Opportunity Score', 'Volume', 'Difficulty', 'Intent', 'Trend', 'CPC', 'Local Opportunity', 'Status', 'Cluster', 'Priority', 'Rationale', 'Related Keywords', 'Created At'];

    const csvLines = [headers.join(',')];
    for (const row of rows) {
      const line = [
        `"${(row.keyword || '').replace(/"/g, '""')}"`,
        row.opportunity_score,
        row.volume,
        row.difficulty,
        row.intent,
        row.trend,
        row.cpc,
        row.local_opportunity,
        row.status,
        `"${(row.cluster_name || '').replace(/"/g, '""')}"`,
        row.priority,
        `"${(row.rationale || '').replace(/"/g, '""')}"`,
        `"${(row.related_keywords || []).join('; ')}"`,
        row.created_at,
      ].join(',');
      csvLines.push(line);
    }

    const csv = csvLines.join('\n');
    const date = new Date().toISOString().slice(0, 10);

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="keywords-${date}.csv"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
