import { NextResponse } from 'next/server';
import { generateSmartContent } from '@/lib/ai/service';
import { supabaseAdmin } from '@/lib/supabase';

type KeywordIntent = 'transactional' | 'commercial' | 'informational' | 'navigational';

interface KeywordResearchRow {
  keyword: string;
  volume: number;
  difficulty: number;
  intent: KeywordIntent;
  trend: number;
  cpc: number;
  local_opportunity: number;
  rationale: string;
  related_keywords: string[];
  opportunity_score: number;
}

interface KeywordResearchHistoryRecord {
  id?: string;
  seed_input: string | null;
  auto_discovery: boolean;
  seeds_used: string[];
  focus_areas: string;
  result_count: number;
  avg_difficulty: number;
  avg_opportunity: number;
  transactional_count: number;
  payload: {
    keywords: KeywordResearchRow[];
  };
}

function parseJsonFromModel<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;

  const cleaned = raw
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  const candidates: string[] = [cleaned];

  const objectMatch = cleaned.match(/\{[\s\S]*\}/);
  if (objectMatch) candidates.push(objectMatch[0]);

  const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
  if (arrayMatch) candidates.push(arrayMatch[0]);

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate) as T;
    } catch {
      continue;
    }
  }

  return fallback;
}

async function getAllConfig(): Promise<Record<string, string>> {
  const { data } = await supabaseAdmin.from('ai_config').select('key, value');
  const config: Record<string, string> = {};
  (data || []).forEach((row) => {
    config[row.key] = row.value;
  });
  return config;
}

function toNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeIntent(intent: unknown): KeywordIntent {
  const raw = String(intent || '').toLowerCase();
  if (raw.includes('transaction')) return 'transactional';
  if (raw.includes('commercial')) return 'commercial';
  if (raw.includes('navig')) return 'navigational';
  return 'informational';
}

function calcOpportunityScore(row: Omit<KeywordResearchRow, 'opportunity_score'>): number {
  const volumeScore = clamp((Math.log10(Math.max(row.volume, 1)) / 4) * 100, 0, 100);
  const difficultyScore = clamp(100 - row.difficulty, 0, 100);
  const trendScore = clamp(row.trend, 0, 100);
  const localScore = clamp(row.local_opportunity, 0, 100);
  const intentBoost = row.intent === 'transactional' ? 18 : row.intent === 'commercial' ? 12 : 4;

  const weighted =
    volumeScore * 0.34 +
    difficultyScore * 0.28 +
    trendScore * 0.16 +
    localScore * 0.16 +
    intentBoost;

  return clamp(Math.round(weighted), 0, 100);
}

function normalizeRows(input: unknown): KeywordResearchRow[] {
  if (!Array.isArray(input)) return [];

  const seen = new Set<string>();
  const normalized: KeywordResearchRow[] = [];

  for (const item of input) {
    if (!item || typeof item !== 'object') continue;

    const rawKeyword = String((item as { keyword?: unknown }).keyword || '').trim();
    if (!rawKeyword) continue;
    const key = rawKeyword.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    const relatedRaw = (item as { related_keywords?: unknown }).related_keywords;
    const relatedKeywords = Array.isArray(relatedRaw)
      ? relatedRaw
          .map((x) => String(x || '').trim())
          .filter(Boolean)
          .slice(0, 6)
      : [];

    const base: Omit<KeywordResearchRow, 'opportunity_score'> = {
      keyword: rawKeyword,
      volume: clamp(Math.round(toNumber((item as { volume?: unknown }).volume, 120)), 0, 500000),
      difficulty: clamp(Math.round(toNumber((item as { difficulty?: unknown }).difficulty, 50)), 0, 100),
      intent: normalizeIntent((item as { intent?: unknown }).intent),
      trend: clamp(Math.round(toNumber((item as { trend?: unknown }).trend, 55)), 0, 100),
      cpc: clamp(Number(toNumber((item as { cpc?: unknown }).cpc, 0.5).toFixed(2)), 0, 999),
      local_opportunity: clamp(Math.round(toNumber((item as { local_opportunity?: unknown }).local_opportunity, 65)), 0, 100),
      rationale: String((item as { rationale?: unknown }).rationale || 'Relevant keyword for local signage demand.').trim(),
      related_keywords: relatedKeywords,
    };

    normalized.push({
      ...base,
      opportunity_score: calcOpportunityScore(base),
    });
  }

  return normalized.sort((a, b) => b.opportunity_score - a.opportunity_score).slice(0, 24);
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

async function appendFallbackHistory(record: KeywordResearchHistoryRecord): Promise<void> {
  const key = 'keyword_research_history_fallback';
  const { data } = await supabaseAdmin
    .from('ai_config')
    .select('value')
    .eq('key', key)
    .single();

  const existing = parseJsonArray(data?.value || null);
  const compactRecord = {
    created_at: new Date().toISOString(),
    seed_input: record.seed_input,
    auto_discovery: record.auto_discovery,
    seeds_used: record.seeds_used,
    focus_areas: record.focus_areas,
    result_count: record.result_count,
    avg_difficulty: record.avg_difficulty,
    avg_opportunity: record.avg_opportunity,
    transactional_count: record.transactional_count,
    payload: record.payload,
  };

  const next = [compactRecord, ...existing].slice(0, 50);
  await supabaseAdmin.from('ai_config').upsert({ key, value: JSON.stringify(next) });
}

async function persistHistory(record: KeywordResearchHistoryRecord): Promise<void> {
  try {
    const { error } = await supabaseAdmin.from('keyword_research_history').insert(record);
    if (error) {
      await appendFallbackHistory(record);
    }
  } catch {
    await appendFallbackHistory(record);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawSeed = String(body?.seed || '').trim();
    const autoDiscovery = Boolean(body?.autoDiscovery);

    const config = await getAllConfig();
    const focusAreas = config.seo_focus_areas || 'Metro Manila';
    const services = config.business_services || 'signage, acrylic signs, LED signage';
    const configuredSeed = config.target_keywords_seed || 'signage maker, acrylic signage, LED signs';
    const companyName = config.company_name || 'SignsHaus';
    const seedPool = [rawSeed, configuredSeed]
      .flatMap((segment) => segment.split(','))
      .map((x) => x.trim())
      .filter(Boolean);

    if (!seedPool.length) {
      return NextResponse.json({ error: 'Vui long nhap seed keyword.' }, { status: 400 });
    }

    const selectedSeeds = autoDiscovery ? seedPool.slice(0, 4) : [seedPool[0]];
    const targetCount = autoDiscovery ? 20 : 12;

    const systemPrompt = `You are a senior local SEO strategist for ${companyName}, a signage business in the Philippines.

Task:
- Build a keyword opportunity list focused on purchase intent and local demand.
- Prioritize search terms that can convert into leads for signage products/services.

Business context:
- Core services: ${services}
- Focus area: ${focusAreas}
- Seed pool: ${selectedSeeds.join(', ')}

Output rules:
- Return JSON array only (no markdown, no explanation).
- Return exactly ${targetCount} unique keywords.
- Mix intent: transactional/commercial/informational.
- Localize naturally (Makati, BGC, Quezon City, Pasig, Manila) when relevant.

JSON schema:
[
  {
    "keyword": "led signage installation makati",
    "volume": 320,
    "difficulty": 42,
    "intent": "transactional",
    "trend": 71,
    "cpc": 1.25,
    "local_opportunity": 85,
    "rationale": "Short reason why this keyword can convert",
    "related_keywords": ["...", "...", "..."]
  }
]`;

    const userPrompt = autoDiscovery
      ? `Generate the best ${targetCount} keyword opportunities from these seeds: ${selectedSeeds.join(', ')}.`
      : `Generate ${targetCount} keyword opportunities for this seed: "${selectedSeeds[0]}".`;

    const content = await generateSmartContent(systemPrompt, userPrompt);
    const parsed = parseJsonFromModel<unknown>(content, []);
    const keywords = normalizeRows(parsed);

    if (!keywords.length) {
      return NextResponse.json({ error: 'Khong the phan tich keyword luc nay. Thu lai sau.' }, { status: 502 });
    }

    const avgDifficulty = Math.round(keywords.reduce((sum, item) => sum + item.difficulty, 0) / keywords.length);
    const avgOpportunity = Math.round(keywords.reduce((sum, item) => sum + item.opportunity_score, 0) / keywords.length);
    const transactionalCount = keywords.filter((item) => item.intent === 'transactional').length;

    const historyRecord: KeywordResearchHistoryRecord = {
      seed_input: rawSeed || null,
      auto_discovery: autoDiscovery,
      seeds_used: selectedSeeds,
      focus_areas: focusAreas,
      result_count: keywords.length,
      avg_difficulty: avgDifficulty,
      avg_opportunity: avgOpportunity,
      transactional_count: transactionalCount,
      payload: { keywords },
    };

    await persistHistory(historyRecord);

    return NextResponse.json({
      keywords,
      meta: {
        autoDiscovery,
        seedsUsed: selectedSeeds,
        focusAreas,
        count: keywords.length,
        avgDifficulty,
        avgOpportunity,
        transactionalCount,
      },
    });
  } catch (error) {
    console.error('AI Research Error:', error);
    return NextResponse.json({ error: 'Failed to research keywords' }, { status: 500 });
  }
}
