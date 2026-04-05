import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

interface HistoryItem {
  id: string;
  created_at: string;
  seed_input: string | null;
  auto_discovery: boolean;
  seeds_used: string[];
  focus_areas: string;
  result_count: number;
  avg_difficulty: number;
  avg_opportunity: number;
  transactional_count: number;
  payload?: unknown;
}

function parseJsonArray(raw: string | null): unknown[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeFallbackItem(item: unknown, index: number): HistoryItem | null {
  if (!item || typeof item !== 'object') return null;
  const row = item as Record<string, unknown>;
  return {
    id: `fallback-${index}`,
    created_at: String(row.created_at || new Date().toISOString()),
    seed_input: row.seed_input ? String(row.seed_input) : null,
    auto_discovery: Boolean(row.auto_discovery),
    seeds_used: Array.isArray(row.seeds_used) ? row.seeds_used.map((x) => String(x || '')).filter(Boolean) : [],
    focus_areas: String(row.focus_areas || 'Metro Manila'),
    result_count: Number(row.result_count || 0),
    avg_difficulty: Number(row.avg_difficulty || 0),
    avg_opportunity: Number(row.avg_opportunity || 0),
    transactional_count: Number(row.transactional_count || 0),
    payload: row.payload || undefined,
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || 12)));

    // Single record with full payload
    if (id) {
      const { data, error } = await supabaseAdmin
        .from('keyword_research_history')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        // Try fallback
        const { data: fallbackConfig } = await supabaseAdmin
          .from('ai_config')
          .select('value')
          .eq('key', 'keyword_research_history_fallback')
          .single();

        const rawItems = parseJsonArray(fallbackConfig?.value || null);
        const match = rawItems
          .map((item, index) => normalizeFallbackItem(item, index))
          .find((item) => item?.id === id);

        if (match) return NextResponse.json({ entry: match, source: 'fallback' });
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }

      return NextResponse.json({ entry: data, source: 'table' });
    }

    // List view (summary without payload)
    const { data, error } = await supabaseAdmin
      .from('keyword_research_history')
      .select('id, created_at, seed_input, auto_discovery, seeds_used, focus_areas, result_count, avg_difficulty, avg_opportunity, transactional_count')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (!error && data) {
      return NextResponse.json({ history: data, source: 'table' });
    }

    const { data: fallbackConfig } = await supabaseAdmin
      .from('ai_config')
      .select('value')
      .eq('key', 'keyword_research_history_fallback')
      .single();

    const rawItems = parseJsonArray(fallbackConfig?.value || null);
    const history = rawItems
      .map((item, index) => normalizeFallbackItem(item, index))
      .filter((item): item is HistoryItem => Boolean(item))
      .slice(0, limit);

    return NextResponse.json({ history, source: 'fallback' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
