import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const keywords = Array.isArray(body?.keywords) ? body.keywords : [];
    const sourceScanId = body?.source_scan_id || null;

    if (!keywords.length) {
      return NextResponse.json({ error: 'No keywords to save' }, { status: 400 });
    }

    let saved = 0;
    let updated = 0;

    for (const kw of keywords) {
      const keyword = String(kw.keyword || '').trim();
      if (!keyword) continue;

      const row = {
        keyword,
        volume: Number(kw.volume || 0),
        difficulty: Number(kw.difficulty || 0),
        intent: kw.intent || 'informational',
        trend: Number(kw.trend || 0),
        cpc: Number(kw.cpc || 0),
        local_opportunity: Number(kw.local_opportunity || 0),
        opportunity_score: Number(kw.opportunity_score || 0),
        rationale: kw.rationale || null,
        related_keywords: Array.isArray(kw.related_keywords) ? kw.related_keywords : [],
        source_scan_id: sourceScanId,
        updated_at: new Date().toISOString(),
      };

      // Check if keyword exists
      const { data: existing } = await supabaseAdmin
        .from('keywords')
        .select('id')
        .eq('keyword', keyword)
        .single();

      if (existing) {
        await supabaseAdmin.from('keywords').update(row).eq('id', existing.id);
        updated++;
      } else {
        await supabaseAdmin.from('keywords').insert({ ...row, status: 'discovered' });
        saved++;
      }
    }

    return NextResponse.json({ success: true, saved, updated, total: saved + updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
