/**
 * Pipeline Utilities — extracted from ai-agents.ts
 * Config, AI routing, JSON parsing, logging, HTML helpers, category selection
 */

import { generateContent as generateContentOpenAI } from '../openai';
import { generateContentGemini } from '../ai/gemini';
import { generateContentPerplexity } from '../ai/perplexity';
import { generateContentClaude } from '../ai/claude';
import { inferProvider } from '../ai/provider-utils';
import { supabaseAdmin } from '../supabase';
import type { InternalLinkRule } from './types';

// =============================================
// Config Helpers
// =============================================
export async function getConfig(key: string, defaultValue: string = ''): Promise<string> {
  const { data } = await supabaseAdmin
    .from('ai_config')
    .select('value')
    .eq('key', key)
    .single();
  return data?.value || defaultValue;
}

export async function getAllConfig(): Promise<Record<string, string>> {
  const { data } = await supabaseAdmin.from('ai_config').select('*');
  const config: Record<string, string> = {};
  data?.forEach((row: { key: string; value: string }) => { config[row.key] = row.value; });
  return config;
}

// =============================================
// AI Provider Router
// =============================================
export async function generateContentResolved(
  systemPrompt: string,
  userPrompt: string,
  configModel?: string,
  providerOverride?: 'openai' | 'gemini' | 'perplexity'
): Promise<string | null> {
  const config = await getAllConfig();
  const provider = providerOverride || (configModel
    ? inferProvider(configModel, (config.ai_provider as 'openai' | 'gemini' | 'anthropic') || 'gemini')
    : (config.ai_provider || 'gemini'));
  const timeoutMs = Math.max(30000, parseInt(config.ai_request_timeout_ms || '120000', 10) || 120000);
  const retryCount = Math.max(0, parseInt(config.ai_request_retry_count || '1', 10) || 1);

  const runOnce = async (): Promise<string | null> => {
    if (provider === 'perplexity') {
      return await generateContentPerplexity(systemPrompt, userPrompt, configModel, config.PERPLEXITY_API_KEY);
    }
    if (provider === 'anthropic') {
      return await generateContentClaude(systemPrompt, userPrompt, configModel, config.ANTHROPIC_API_KEY);
    }
    if (provider === 'gemini') {
      let model = configModel;
      if (model?.includes('gpt')) model = undefined;
      return await generateContentGemini(systemPrompt, userPrompt, model, config.GEMINI_API_KEY);
    }
    return await generateContentOpenAI(systemPrompt, userPrompt, configModel);
  };

  const withTimeoutFn = async (): Promise<string | null> => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    try {
      return await Promise.race([
        runOnce(),
        new Promise<null>((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error(`AI request timeout after ${timeoutMs}ms (${provider})`)), timeoutMs);
        })
      ]);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  };

  let lastError: unknown = null;
  for (let attempt = 0; attempt <= retryCount; attempt++) {
    try {
      return await withTimeoutFn();
    } catch (error) {
      lastError = error;
      if (attempt === retryCount) break;
      await new Promise((resolve) => setTimeout(resolve, Math.min(1500 * (attempt + 1), 4000)));
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Unknown AI provider error');
}

// =============================================
// JSON Parsing
// =============================================
export function parseJsonFromModel<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
  const candidates: string[] = [cleaned];
  const objectMatch = cleaned.match(/\{[\s\S]*\}/);
  if (objectMatch) candidates.push(objectMatch[0]);
  const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
  if (arrayMatch) candidates.push(arrayMatch[0]);
  for (const candidate of candidates) {
    try { return JSON.parse(candidate) as T; } catch { continue; }
  }
  return fallback;
}

// =============================================
// Pipeline Logging & Tracking
// =============================================
export async function logAgent(
  batchId: string,
  agent: string,
  action: string,
  status: 'running' | 'success' | 'failed' | 'skipped',
  details: Record<string, unknown> = {}
) {
  await supabaseAdmin.from('ai_pipeline_logs').insert({
    batch_id: batchId,
    agent_name: agent,
    action,
    status,
    details
  });
}

export async function createPipelineRun(triggerType: 'manual' | 'scheduled' = 'manual') {
  const { data, error } = await supabaseAdmin
    .from('ai_pipeline_runs')
    .insert({ trigger_type: triggerType, status: 'running' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updatePipelineRun(id: string, updates: Record<string, unknown>) {
  const { error } = await supabaseAdmin.from('ai_pipeline_runs').update(updates).eq('id', id);
  if (error) {
    console.error(`[updatePipelineRun] Failed:`, error.message);
    throw new Error(`Pipeline run update failed: ${error.message}`);
  }
}

// =============================================
// HTML Helpers
// =============================================
export function estimateWordCount(html: string): number {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean).length;
}

export function normalizeArticleHtml(html: string): string {
  return html
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function escapeHtmlAttribute(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function buildSeoAltText(keyword: string, description: string): string {
  const cleaned = description.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  const combined = cleaned.toLowerCase().startsWith(keyword.toLowerCase())
    ? cleaned : `${keyword} - ${cleaned}`;
  return combined.substring(0, 125);
}

export function buildPhotorealisticPrompt(baseContext: string, shotIntent: string): string {
  return [
    'Photorealistic commercial photography',
    baseContext,
    shotIntent,
    'real camera, natural light behavior, realistic materials and textures',
    'no illustration, no CGI, no 3D render, no anime, no painting style',
    'no text overlay, no watermark, no logo distortion, no blur'
  ].join(', ');
}

// =============================================
// FAQ Schema from HTML
// =============================================
export function buildFaqSchemaFromHtml(content: string): string | null {
  const faqSectionMatch = content.match(/<section[^>]*data-faq="true"[^>]*>([\s\S]*?)<\/section>/i);
  if (!faqSectionMatch) return null;
  const sectionHtml = faqSectionMatch[1];
  const qRegex = /<h3[^>]*>(.*?)<\/h3>[\s\S]*?<p[^>]*>(.*?)<\/p>/gi;
  const items: Array<{ question: string; answer: string }> = [];
  let match: RegExpExecArray | null;
  while ((match = qRegex.exec(sectionHtml)) !== null) {
    const question = match[1].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    const answer = match[2].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    if (question && answer) items.push({ question, answer });
  }
  if (!items.length) return null;
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.slice(0, 5).map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  });
}

// =============================================
// Internal Link Injection
// =============================================
export function injectInternalLinksIntoHtml(
  html: string,
  rules: InternalLinkRule[],
  maxLinks = 3
): { content: string; inserted: number } {
  if (!html || !rules.length) return { content: html, inserted: 0 };

  const placeholders: string[] = [];
  const protectedHtml = html.replace(
    /(<a\b[^>]*>.*?<\/a>)|(<script\b[^>]*>[\s\S]*?<\/script>)|(<style\b[^>]*>[\s\S]*?<\/style>)|(<[^>]+>)/gi,
    (match) => { placeholders.push(match); return `###PL${placeholders.length - 1}###`; }
  );

  let current = protectedHtml;
  let inserted = 0;
  const sorted = [...rules].filter(r => r.keyword?.trim() && r.target_url?.trim())
    .sort((a, b) => b.keyword.length - a.keyword.length);

  for (const rule of sorted) {
    if (inserted >= maxLinks) break;
    const escaped = rule.keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b(${escaped})\\b`, 'i');
    if (!regex.test(current)) continue;
    let replaced = false;
    current = current.replace(regex, (match) => {
      if (replaced || inserted >= maxLinks) return match;
      replaced = true;
      inserted += 1;
      return `<a href="${rule.target_url}" class="internal-link" title="${escapeHtmlAttribute(match)}">${match}</a>`;
    });
  }

  const restored = current.replace(/###PL(\d+)###/g, (_, index) => placeholders[parseInt(index, 10)]);
  return { content: restored, inserted };
}

// =============================================
// Category Selection (balanced rotation)
// =============================================
const CATEGORY_KEYWORD_MAP: Record<string, string[]> = {
  'signage-materials': ['acrylic', 'stainless', 'aluminum', 'vinyl', 'tarpaulin', 'led module', 'material', 'foam board', 'pvc', 'polycarbonate'],
  'installation-guides': ['install', 'mount', 'how to', 'step by step', 'setup', 'wiring', 'anchor', 'drill'],
  'maintenance-care': ['clean', 'maintain', 'repair', 'weatherproof', 'rust', 'uv protection', 'restore'],
  'design-inspiration': ['design', 'trend', 'creative', 'style', 'color', 'typography', 'brand identity', 'aesthetic'],
  'pricing-cost-guides': ['price', 'cost', 'budget', 'roi', 'compare', 'cheap', 'expensive', 'quote', 'php'],
  'permits-regulations': ['permit', 'regulation', 'dpwh', 'lgu', 'building code', 'fire safety', 'ordinance', 'legal'],
  'industry-spotlight': ['retail', 'restaurant', 'cafe', 'hospital', 'real estate', 'corporate', 'sector', 'industry'],
  'project-showcases': ['project', 'case study', 'showcase', 'before after', 'client', 'portfolio', 'testimonial'],
  'business-tips': ['marketing', 'storefront', 'foot traffic', 'branding', 'customer', 'sales', 'business'],
  'technology-innovation': ['led', 'digital signage', 'solar', 'smart', 'technology', 'innovation', 'neon', 'programmable'],
};

export async function selectCategoryId(suggestedSlug?: string, keyword?: string): Promise<string | null> {
  try {
    const { data: categories } = await supabaseAdmin
      .from('categories').select('id, slug').eq('type', 'blog');
    if (!categories?.length) return null;
    const slugToId = new Map(categories.map(c => [c.slug, c.id]));

    // 1. AI suggestion
    if (suggestedSlug && slugToId.has(suggestedSlug)) return slugToId.get(suggestedSlug)!;

    // 2. Keyword matching
    if (keyword) {
      const text = keyword.toLowerCase();
      let bestSlug: string | null = null;
      let bestScore = 0;
      for (const [slug, kws] of Object.entries(CATEGORY_KEYWORD_MAP)) {
        if (!slugToId.has(slug)) continue;
        const score = kws.reduce((a, kw) => a + (text.includes(kw) ? 1 : 0), 0);
        if (score > bestScore) { bestScore = score; bestSlug = slug; }
      }
      if (bestSlug && bestScore >= 2) return slugToId.get(bestSlug)!;
    }

    // 3. Balanced rotation
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
    const { data: posts } = await supabaseAdmin
      .from('posts').select('category_id').gte('created_at', thirtyDaysAgo).not('category_id', 'is', null);
    const counts = new Map<string, number>();
    categories.forEach(c => counts.set(c.id, 0));
    (posts || []).forEach(p => {
      if (p.category_id && counts.has(p.category_id))
        counts.set(p.category_id, (counts.get(p.category_id) || 0) + 1);
    });
    let minCount = Infinity, minId: string | null = null;
    for (const [id, count] of counts) {
      if (count < minCount) { minCount = count; minId = id; }
    }
    return minId;
  } catch { return null; }
}

// =============================================
// Keyword Extraction for Internal Linking
// =============================================
export async function extractKeywordsForLinking(
  title: string, description: string, content: string
): Promise<string[]> {
  const config = await getAllConfig();
  const model = config.agent_seo_research_model || 'gemini-2.0-flash';
  const systemPrompt = `You are an SEO Internal Linking Specialist.
Extract 3-5 distinct, high-value keyword phrases (2-4 words) from this content.
These will be used as anchor text for internal links TO this page.
Avoid generic terms like "product" or "signage".
Return ONLY a JSON array of strings.`;
  const userPrompt = `Title: ${title}\nDescription: ${description}\nContent: ${content.substring(0, 1000)}`;
  try {
    const result = await generateContentResolved(systemPrompt, userPrompt, model);
    const keywords = parseJsonFromModel<string[]>(result, []);
    return Array.isArray(keywords) ? keywords.slice(0, 5) : [];
  } catch { return []; }
}

// =============================================
// Project Description (used by admin API, not pipeline)
// =============================================
export async function generateProjectDescription(params: {
  title: string; client: string; location: string; type: string; challenges?: string;
}): Promise<string | null> {
  const config = await getAllConfig();
  const model = config.writer_model || 'gemini-2.0-flash';
  const systemPrompt = `You are a professional copywriter for a premium signage company called "Haus Signs".
Write a compelling project case study description (200-300 words).
Structure: 1. The Challenge/Objective 2. The Solution 3. The Result
Do NOT use markdown headers. Use paragraph breaks.`;
  const userPrompt = `Project: ${params.title}\nClient: ${params.client}\nLocation: ${params.location}\nType: ${params.type}\nChallenges: ${params.challenges || 'N/A'}`;
  return await generateContentResolved(systemPrompt, userPrompt, model);
}

// =============================================
// Timeout wrapper
// =============================================
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  label: string
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(`Timeout: ${label} (${timeoutMs}ms)`)), timeoutMs);
      })
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

// =============================================
// Get category post counts for balanced rotation context
// =============================================
export async function getCategoryPostCounts(): Promise<string> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
  const { data: categories } = await supabaseAdmin
    .from('categories').select('id, slug, name').eq('type', 'blog');
  const { data: posts } = await supabaseAdmin
    .from('posts').select('category_id').gte('created_at', thirtyDaysAgo).not('category_id', 'is', null);

  if (!categories?.length) return 'No categories found';
  const counts = new Map<string, number>();
  categories.forEach(c => counts.set(c.id, 0));
  (posts || []).forEach(p => {
    if (p.category_id && counts.has(p.category_id))
      counts.set(p.category_id, (counts.get(p.category_id) || 0) + 1);
  });

  return categories
    .map(c => `${c.name} (${c.slug}): ${counts.get(c.id) || 0} articles`)
    .join('\n');
}
