import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

type KeywordPlanAction = 'append_plan' | 'clear_plan' | 'push_to_pipeline';

function uniqueKeywords(values: string[]): string[] {
  const seen = new Set<string>();
  const output: string[] = [];

  values
    .map((value) => value.trim())
    .filter(Boolean)
    .forEach((value) => {
      const key = value.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      output.push(value);
    });

  return output;
}

function parsePlan(raw: string | null): string[] {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => String(item || '').trim()).filter(Boolean);
  } catch {
    return [];
  }
}

async function getConfigByKeys(keys: string[]): Promise<Record<string, string>> {
  const { data } = await supabaseAdmin
    .from('ai_config')
    .select('key, value')
    .in('key', keys);

  const config: Record<string, string> = {};
  (data || []).forEach((row) => {
    config[row.key] = row.value;
  });
  return config;
}

export async function GET() {
  try {
    const config = await getConfigByKeys(['keyword_content_plan', 'target_keywords_seed']);
    return NextResponse.json({
      plan: parsePlan(config.keyword_content_plan || null),
      pipelineSeeds: String(config.target_keywords_seed || ''),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = String(body?.action || '') as KeywordPlanAction;
    const incomingKeywords = Array.isArray(body?.keywords)
      ? body.keywords.map((item: unknown) => String(item || '').trim()).filter(Boolean)
      : [];

    const keywords = uniqueKeywords(incomingKeywords).slice(0, 50);
    const config = await getConfigByKeys(['keyword_content_plan', 'target_keywords_seed']);

    const existingPlan = parsePlan(config.keyword_content_plan || null);
    const updates: Array<{ key: string; value: string }> = [];
    let nextPlan = existingPlan;

    if (action === 'append_plan') {
      nextPlan = uniqueKeywords([...existingPlan, ...keywords]).slice(0, 120);
      updates.push({ key: 'keyword_content_plan', value: JSON.stringify(nextPlan) });
    } else if (action === 'clear_plan') {
      nextPlan = [];
      updates.push({ key: 'keyword_content_plan', value: JSON.stringify(nextPlan) });
    } else if (action === 'push_to_pipeline') {
      if (!keywords.length) {
        return NextResponse.json({ error: 'Khong co keyword de day sang pipeline.' }, { status: 400 });
      }
      updates.push({ key: 'target_keywords_seed', value: keywords.join(', ') });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    for (const item of updates) {
      await supabaseAdmin.from('ai_config').upsert(item);
    }

    const pipelineSeeds = action === 'push_to_pipeline'
      ? keywords.join(', ')
      : String(config.target_keywords_seed || '');

    return NextResponse.json({
      success: true,
      action,
      plan: nextPlan,
      pipelineSeeds,
      affectedKeywords: keywords,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
