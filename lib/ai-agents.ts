import { generateContent as generateContentOpenAI } from './openai';
import { generateContentGemini } from './ai/gemini';
import { generateContentPerplexity } from './ai/perplexity';
import { generateContentClaude } from './ai/claude';
import { inferProvider } from './ai/provider-utils';
import { DEFAULT_RESEARCHER_PROMPT, DEFAULT_EVALUATOR_PROMPT, interpolatePrompt } from './ai/defaults';
import { generateProjectImage } from './image-gen';
import { supabaseAdmin } from './supabase';
import { enforcePublishGate } from './publish-gate';
import { queueFacebookPosts } from './facebook';
import { pingSearchEngines } from './seo';
import { buildClusterGapPrompt, saveApprovedTopicsToKeywords, linkKeywordToPost } from './cluster-intelligence';

// =============================================
// Helper: AI Provider Router
// =============================================
async function generateContentResolved(
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
      const apiKey = config.PERPLEXITY_API_KEY;
      return await generateContentPerplexity(systemPrompt, userPrompt, configModel, apiKey);
    }

    if (provider === 'anthropic') {
      return await generateContentClaude(systemPrompt, userPrompt, configModel, config.ANTHROPIC_API_KEY);
    }

    if (provider === 'gemini') {
      const apiKey = config.GEMINI_API_KEY;
      let model = configModel;
      if (model?.includes('gpt')) model = undefined;
      return await generateContentGemini(systemPrompt, userPrompt, model, apiKey);
    }

    // Default OpenAI
    return await generateContentOpenAI(systemPrompt, userPrompt, configModel);
  };

  const withTimeout = async (): Promise<string | null> => {
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
      return await withTimeout();
    } catch (error) {
      lastError = error;
      const isLastAttempt = attempt === retryCount;
      if (isLastAttempt) break;
      const backoffMs = Math.min(1500 * (attempt + 1), 4000);
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Unknown AI provider error');
}

// =============================================
// Types
// =============================================
export interface AgentResult {
  success: boolean;
  data?: unknown;
  message: string;
}

export interface ResearchTopic {
  keyword: string;
  expanded_keywords: string[];
  news_angle: string;
  search_volume_estimate: number;
  difficulty_estimate: number;
  intent: string;
}

export interface EvaluatedTopic {
  keyword: string;
  score: number;
  reason: string;
  existing_post_check: string;
  recommended_action: 'create' | 'update' | 'skip';
  news_angle: string;
  expanded_keywords: string[];
}

export interface WriterOutput {
  title: string;
  content: string;
  meta_title: string;
  meta_description: string;
  excerpt: string;
  suggested_tags: string[];
  quality_score?: number;
  quality_notes?: string[];
}

export interface SeoOptimizerOutput {
  meta_title: string;
  meta_description: string;
  suggested_tags: string[];
  structured_data: Record<string, unknown> | null;
  keyword_density_report: Record<string, number>;
  improvements_applied: string[];
}

interface ContentBrief {
  primary_keyword: string;
  secondary_keywords: string[];
  user_intent: string;
  audience_persona: string;
  pain_points: string[];
  entity_map: string[];
  outline: Array<{
    heading: string;
    intent: string;
    key_points: string[];
  }>;
  people_also_ask: string[];
  conversion_offer: string;
}

interface ContentQualityReport {
  seo_score: number;
  aio_score: number;
  strengths: string[];
  issues: string[];
  revision_actions: string[];
}

interface InternalLinkRuleRecord {
  keyword: string;
  target_url: string;
  priority?: number;
}

export interface VisualizerOutput {
  featured_image_url: string | null;
  thumbnail_image_url?: string | null;
  image_suggestions: string[];
  post_id: string;
  generated_images?: {
    location: string;
    url: string;
    alt: string;
  }[];
}

// =============================================
// Config Helper
// =============================================
async function getConfig(key: string, defaultValue: string = ''): Promise<string> {
  const { data } = await supabaseAdmin
    .from('ai_config')
    .select('value')
    .eq('key', key)
    .single();
  return data?.value || defaultValue;
}

async function getAllConfig(): Promise<Record<string, string>> {
  const { data } = await supabaseAdmin.from('ai_config').select('*');
  const config: Record<string, string> = {};
  data?.forEach((row: { key: string; value: string }) => { config[row.key] = row.value; });
  return config;
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

function estimateWordCount(html: string): number {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean).length;
}

function normalizeArticleHtml(html: string): string {
  return html
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function countKeywordHits(text: string, keyword: string): number {
  if (!keyword) return 0;
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
  const matches = text.match(regex);
  return matches ? matches.length : 0;
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function countWordsFromHtml(html: string): number {
  if (!html) return 0;
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return text ? text.split(' ').length : 0;
}

function estimateInlineImageTarget(params: {
  html: string;
  min: number;
  max: number;
}): number {
  const words = countWordsFromHtml(params.html);
  const headingCount = (params.html.match(/<h2\b|<h3\b/gi) || []).length;

  const byLength = Math.ceil(words / 700);
  const byStructure = Math.floor(headingCount / 3);
  const rawTarget = Math.max(1, byLength + byStructure);

  return clampNumber(rawTarget, params.min, params.max);
}

function escapeHtmlAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function buildSeoAltText(keyword: string, description: string): string {
  const cleaned = description.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  const keywordLower = keyword.toLowerCase();
  const descLower = cleaned.toLowerCase();

  if (descLower.startsWith(keywordLower)) {
    return cleaned.substring(0, 125);
  }

  const combined = `${keyword} - ${cleaned}`;
  return combined.substring(0, 125);
}

function buildPhotorealisticPrompt(baseContext: string, shotIntent: string): string {
  return [
    'Photorealistic commercial photography',
    baseContext,
    shotIntent,
    'real camera, natural light behavior, realistic materials and textures',
    'no illustration, no CGI, no 3D render, no anime, no painting style',
    'no text overlay, no watermark, no logo distortion, no blur'
  ].join(', ');
}

function buildFaqSchemaFromHtml(content: string): string | null {
  const faqSectionMatch = content.match(/<section[^>]*data-faq="true"[^>]*>([\s\S]*?)<\/section>/i);
  if (!faqSectionMatch) return null;

  const sectionHtml = faqSectionMatch[1];
  const qRegex = /<h3[^>]*>(.*?)<\/h3>[\s\S]*?<p[^>]*>(.*?)<\/p>/gi;
  const items: Array<{ question: string; answer: string }> = [];
  let match: RegExpExecArray | null;

  while ((match = qRegex.exec(sectionHtml)) !== null) {
    const question = match[1].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    const answer = match[2].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    if (question && answer) {
      items.push({ question, answer });
    }
  }

  if (!items.length) return null;

  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.slice(0, 5).map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  });
}

function injectInternalLinksIntoHtml(
  html: string,
  rules: InternalLinkRuleRecord[],
  maxLinks = 3
): { content: string; inserted: number } {
  if (!html || !rules.length) return { content: html, inserted: 0 };

  const placeholders: string[] = [];
  const protectedHtml = html.replace(/(<a\b[^>]*>.*?<\/a>)|(<script\b[^>]*>[\s\S]*?<\/script>)|(<style\b[^>]*>[\s\S]*?<\/style>)|(<[^>]+>)/gi, (match) => {
    placeholders.push(match);
    return `###PL${placeholders.length - 1}###`;
  });

  let current = protectedHtml;
  let inserted = 0;
  const sorted = [...rules]
    .filter((rule) => rule.keyword?.trim() && rule.target_url?.trim())
    .sort((a, b) => (b.keyword.length || 0) - (a.keyword.length || 0));

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
// Logger
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

// =============================================
// Pipeline Run Tracker
// =============================================
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
    console.error(`[updatePipelineRun] Failed to update run ${id}:`, error.message, { updates });
    throw new Error(`Pipeline run update failed: ${error.message}`);
  }
}

// =============================================
// Default System Instructions
// =============================================
const DEFAULT_SYSTEM_INSTRUCTIONS = {
  auto_research: `You are an advanced content research analyst for Haus Signs Philippines — a premium architectural signage company in the Philippines. You specialize in identifying high-value content opportunities through automated topic discovery and competitive analysis.

TASK:
1. Find 5 high-value topics/keywords related to the signage industry
2. For each keyword, expand with 3-5 long-tail keywords
3. Find current news angles or trends to exploit
4. Analyze competitive gaps and content opportunities

OUTPUT (JSON only, no markdown):
[
  {
    "keyword": "main keyword in English",
    "expanded_keywords": ["long-tail keyword 1", "long-tail keyword 2", "long-tail keyword 3"],
    "news_angle": "Current trend or news angle that makes this topic timely",
    "search_volume_estimate": 500,
    "difficulty_estimate": 35,
    "intent": "transactional|informational|navigational"
  }
]

RULES:
- Prioritize transactional keywords (users wanting to buy/hire services)
- Combine local area names (Makati, BGC, Quezon City...)
- Look for opportunities from news: store openings, new regulations, design trends
- Focus on Philippines market, especially Metro Manila
- Include both English and Taglish search patterns`,

  seo_research: `You are an SEO research expert specializing in the Philippine signage industry. You work for "Haus Signs Philippines" — a premium architectural signage company based in the Philippines.

TASK:
Evaluate research topics and score them from 0-100 based on:
- Business fit with signage industry (30%)
- Customer acquisition potential (25%)
- Competition difficulty (lower = better) (20%)
- Timeliness/trends (15%)
- Natural business integration potential (10%)

OUTPUT (JSON only, no markdown):
[
  {
    "keyword": "original keyword",
    "score": 85,
    "reason": "Why this topic is good/bad",
    "existing_post_check": "No duplicate found",
    "recommended_action": "create|update|skip",
    "news_angle": "preserved from research",
    "expanded_keywords": ["preserved from research"]
  }
]

RULES:
- If topic duplicates existing post with seo_score >= 85 → "skip"
- If existing post has seo_score < 85 → "update"
- If completely new topic → "create"
- Sort by score descending`,

  content_strategist: `You are a content strategist creating article outlines for Haus Signs Philippines — a premium architectural signage company in the Philippines. Your outlines are structured for maximum SEO and AIO (AI Overview) performance.

TASK:
Create a comprehensive content brief for the given topic that will guide the content writer to produce content that ranks in Google AND gets cited by AI systems (ChatGPT, Perplexity, Google AI Overviews).

OUTPUT (JSON only):
{
  "primary_keyword": "...",
  "secondary_keywords": ["..."],
  "user_intent": "transactional|informational|commercial",
  "audience_persona": "...",
  "pain_points": ["..."],
  "entity_map": ["materials", "processes", "locations", "technical terms"],
  "aio_quick_answer": "Draft a 50-70 word self-contained answer that directly answers the main query without needing any context. Include 1-2 specific data points.",
  "key_stats": ["PHP 15,000-45,000 per sqm", "3-5 day lead time", "85% of businesses see ROI within 6 months"],
  "outline": [
    { "heading": "Question-based H2 heading ending with ?", "intent": "what this section answers", "key_points": ["..."] }
  ],
  "people_also_ask": ["question 1", "question 2", "..."],
  "conversion_offer": "CTA suggestion"
}

RULES:
- Create 6-8 section outline with mostly question-based headings
- AT LEAST 4 out of 6-8 headings MUST end with "?" (question format for AIO extraction)
- Include comparison table section
- Include pricing/cost section with SPECIFIC PHP amounts (not "contact for quote")
- Include decision checklist section
- Include case study/social proof section
- Include FAQ section (3-5 questions)
- Entity map should include specific materials, processes, locations, standards
- aio_quick_answer MUST be exactly 50-70 words, self-contained, with at least 1 number
- key_stats MUST have 4-6 specific data points with real numbers (PHP costs, timelines, percentages, measurements)`,

  content_writer: '', // Will be built dynamically with business context

  seo_optimizer: `You are an SEO optimization specialist for Haus Signs Philippines — a premium architectural signage company in the Philippines. You optimize content for search engines while maintaining readability and AIO citation potential.

TASK:
Analyze the article and optimize SEO elements. Return improved meta data and optimization report.

OUTPUT (JSON only):
{
  "meta_title": "Optimized title (max 60 chars, keyword at start)",
  "meta_description": "Optimized description (120-155 chars, starts with action word)",
  "suggested_tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "structured_data": null,
  "keyword_density_report": { "primary_keyword": 5, "secondary_1": 3 },
  "improvements_applied": ["description of each improvement"]
}

RULES:
- Meta title: keyword at START, max 60 chars, compelling
- Meta description: 120-155 chars, starts with action word (Discover, Learn, Get, Find)
- Tags: 4-6 relevant tags mixing broad and specific
- Check keyword density: primary keyword should appear 4-6 times naturally
- Ensure structured data opportunities are captured (FAQ, HowTo, etc.)`,

  quality_reviewer: `You are a content quality reviewer for Haus Signs Philippines — a premium architectural signage company in the Philippines. You evaluate articles for SEO ranking potential AND AI citation potential (Google AI Overviews, ChatGPT, Perplexity).

TASK:
Evaluate the article quality on two dimensions and provide actionable feedback.

OUTPUT (JSON only):
{
  "seo_score": 0,
  "aio_score": 0,
  "strengths": ["..."],
  "issues": ["..."],
  "revision_actions": ["specific action to fix each issue"]
}

SEO Scoring (0-100):
- Primary keyword in title, H1, intro, one H2, conclusion (15pts)
- Meta title 50-60 chars with keyword at start (10pts)
- Meta description 120-155 chars with action word (10pts)
- 6+ H2/H3 sections with anchor IDs, mostly question-based (10pts)
- Table, list, comparison, and decision checklist elements (10pts)
- Internal links present (3-5 links) (10pts)
- E-E-A-T signals: case study, specific data points, expert credentials (15pts)
- Short paragraphs (2-4 sentences), readable flow (10pts)
- Pricing table with specific amounts (not "contact for quote") (10pts)

AIO Scoring (0-100) — STRICT ENFORCEMENT:
- Key Takeaways box with 4-6 bullets, EACH with at least 1 number (15pts)
  → Missing or bullets without numbers: 0pts
- Quick Answer block 50-70 words, self-contained, with data points (15pts)
  → Missing: 0pts. Outside 50-70 words: 8pts. No data points: 5pts
- At least 4/6 H2 headings are question-based ending with "?" (10pts)
  → Count questions: 4+/6 = 10pts, 3/6 = 6pts, 2/6 = 3pts, <2 = 0pts
- Each section is self-contained answer block 120-180 words (10pts)
  → First 1-2 sentences MUST directly answer the heading question
- Inverted pyramid: first sentences are the direct answer, then details (10pts)
- Definite language: specific numbers, PHP costs, timelines, measurements (15pts)
  → Count data points: 10+ = 15pts, 7-9 = 10pts, 4-6 = 6pts, <4 = 0pts
- FAQ answers self-contained 60-80 words each (10pts)
- High entity density: technical terms, brand names, locations, specifications (10pts)
- data-speakable attributes on key-takeaways and quick-answer (5pts)

CRITICAL: Be STRICT. Do not give free points. If Quick Answer is missing, AIO score CANNOT exceed 70. If Key Takeaways lacks numbers, deduct fully.`,

  image_generator: `You are an image generation specialist for Haus Signs Philippines. You create photorealistic commercial photography of signage installations, materials, and business environments.

RULES:
- All images must look like real photographs taken with professional cameras
- Use natural lighting, real materials, and realistic textures
- NO illustration, CGI, 3D render, anime, or painting style
- NO text overlay, watermark, or logo distortion
- Focus on Metro Manila business environments
- Show real storefronts, offices, restaurants, and commercial spaces
- Include realistic details: weathering, reflections, shadows, depth of field`
};

// =============================================
// AGENT 1: AUTO-RESEARCH ANALYST (Perplexity)
// =============================================
export async function runAgentAutoResearch(batchId: string): Promise<AgentResult> {
  await logAgent(batchId, 'Auto-Research Analyst', 'Bắt đầu nghiên cứu thị trường', 'running');

  const config = await getAllConfig();
  const seedKeywords = config.target_keywords_seed || 'signage, business signs, LED signage';
  const focusAreas = config.seo_focus_areas || 'Metro Manila';
  const services = config.business_services || 'signage, acrylic signs';
  const model = config.agent_auto_research_model || 'sonar-pro';
  const customInstruction = config.agent_auto_research_system_instruction;

  const researcherPromptTemplate = config.researcher_system_prompt || DEFAULT_RESEARCHER_PROMPT;
  const systemPrompt = customInstruction || interpolatePrompt(researcherPromptTemplate, {
    services,
    focusAreas,
    seedKeywords,
  }) || DEFAULT_SYSTEM_INSTRUCTIONS.auto_research;

  // Build cluster gap context if enabled
  let clusterContext = '';
  if ((config.cluster_aware_research || 'true') === 'true') {
    try {
      clusterContext = await buildClusterGapPrompt();
    } catch {
      clusterContext = '';
    }
  }

  const contextPrompt = `
BUSINESS CONTEXT:
- Services: ${services}
- Focus areas: ${focusAreas}
- Seed keywords: ${seedKeywords}
- Company: ${config.company_name || 'SignsHaus'}
${clusterContext}
Find 5 high-value content opportunities for today. Focus on: ${seedKeywords}`;

  try {
    const result = await generateContentResolved(
      systemPrompt,
      contextPrompt,
      model,
      'perplexity'
    );

    const topics: ResearchTopic[] = parseJsonFromModel(result, []);

    await logAgent(batchId, 'Auto-Research Analyst', `Tìm thấy ${topics.length} chủ đề`, 'success', {
      topics_count: topics.length,
      topics: topics.map(t => t.keyword)
    });

    return { success: true, data: topics, message: `Tìm thấy ${topics.length} chủ đề tiềm năng` };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    await logAgent(batchId, 'Auto-Research Analyst', 'Lỗi nghiên cứu', 'failed', { error: message });
    return { success: false, message };
  }
}

// =============================================
// AGENT 2: SEO RESEARCH EXPERT (Perplexity)
// =============================================
export async function runAgentSeoResearch(batchId: string, topics: ResearchTopic[]): Promise<AgentResult> {
  await logAgent(batchId, 'SEO Research Expert', 'Đánh giá và phân tích từ khóa', 'running', {
    topics_received: topics.length
  });

  const config = await getAllConfig();
  const minScore = parseInt(config.evaluator_min_score || '60');
  const companyName = config.company_name || 'SignsHaus';
  const model = config.agent_seo_research_model || 'sonar-pro';
  const customInstruction = config.agent_seo_research_system_instruction;

  // Fetch existing posts for duplicate check
  const { data: existingPosts } = await supabaseAdmin
    .from('posts')
    .select('id, title, slug, seo_score, status, created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  const existingTitles = existingPosts?.map(p => p.title.toLowerCase()) || [];
  const evaluatorModel = config.evaluator_model || model;
  const existingTitlesStr = existingTitles.slice(0, 20).map((t, i) => `${i + 1}. ${t}`).join('\n') || 'No posts yet';

  const promptTemplate = config.evaluator_system_prompt || DEFAULT_EVALUATOR_PROMPT;
  const systemPrompt = customInstruction || interpolatePrompt(promptTemplate, {
    companyName,
    minScore: String(minScore),
    existingTitles: existingTitlesStr,
  }) || DEFAULT_SYSTEM_INSTRUCTIONS.seo_research;

  const contextPrompt = `Company: ${companyName}
Minimum score to approve: ${minScore}

EXISTING POSTS ON WEBSITE:
${existingTitlesStr}

TOPICS TO EVALUATE:
${JSON.stringify(topics, null, 2)}`;

  try {
    const result = await generateContentResolved(
      systemPrompt,
      contextPrompt,
      evaluatorModel
    );

    let evaluated: EvaluatedTopic[] = parseJsonFromModel(result, []);

    // Filter by minimum score
    evaluated = evaluated.filter(t => t.score >= minScore && t.recommended_action !== 'skip');
    evaluated.sort((a, b) => b.score - a.score);

    // Save approved topics to keywords DB for cluster tracking
    try {
      const savedCount = await saveApprovedTopicsToKeywords(
        evaluated.map(t => ({
          keyword: t.keyword,
          expanded_keywords: t.expanded_keywords,
          score: t.score,
          intent: 'informational',
          news_angle: t.news_angle,
        })),
        batchId
      );
      if (savedCount > 0) {
        await logAgent(batchId, 'SEO Research Expert', `Lưu ${savedCount} keywords vào DB`, 'success');
      }
    } catch (saveErr) {
      console.warn('Failed to save topics to keywords DB:', saveErr);
    }

    await logAgent(batchId, 'SEO Research Expert', `Duyệt ${evaluated.length}/${topics.length} chủ đề`, 'success', {
      approved: evaluated.length,
      rejected: topics.length - evaluated.length,
      approved_topics: evaluated.map(t => ({ keyword: t.keyword, score: t.score, action: t.recommended_action }))
    });

    return {
      success: true,
      data: evaluated,
      message: `Duyệt ${evaluated.length}/${topics.length} chủ đề (điểm >= ${minScore})`
    };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    await logAgent(batchId, 'SEO Research Expert', 'Lỗi đánh giá', 'failed', { error: message });
    return { success: false, message };
  }
}

// =============================================
// AGENT 3: CONTENT STRATEGIST (Gemini)
// =============================================
export async function runAgentContentStrategist(batchId: string, topic: EvaluatedTopic): Promise<AgentResult> {
  await logAgent(batchId, 'Content Strategist', `Tạo brief cho: ${topic.keyword}`, 'running');

  const config = await getAllConfig();
  const model = config.agent_content_strategist_model || 'gemini-2.0-flash';
  const customInstruction = config.agent_content_strategist_system_instruction;
  const companyName = config.company_name || 'SignsHaus';
  const services = config.business_services || 'signage, signs';
  const focusAreas = config.seo_focus_areas || 'Metro Manila';
  const cta = config.contact_cta || `Call for a free consultation`;

  const systemPrompt = customInstruction || DEFAULT_SYSTEM_INSTRUCTIONS.content_strategist;

  const contextPrompt = `Company: ${companyName}
Services: ${services}
Focus Areas: ${focusAreas}
Default CTA: ${cta}

Create a deep content brief for:
- Keyword: "${topic.keyword}"
- News angle: "${topic.news_angle}"
- Expanded keywords: ${topic.expanded_keywords?.join(', ')}
- Score: ${topic.score}
- Reason selected: ${topic.reason}`;

  try {
    const result = await generateContentResolved(
      systemPrompt,
      contextPrompt,
      model,
      'gemini'
    );

    const briefFallback: ContentBrief = {
      primary_keyword: topic.keyword,
      secondary_keywords: topic.expanded_keywords || [],
      user_intent: 'transactional + informational',
      audience_persona: 'Business owners and marketing managers in Metro Manila',
      pain_points: ['Low storefront visibility', 'Unclear pricing', 'Durability concerns'],
      entity_map: ['acrylic signage', 'stainless steel signage', 'LED modules', 'Metro Manila'],
      outline: [
        { heading: `What ${topic.keyword} means for local businesses`, intent: 'clarify topic', key_points: ['Business relevance', 'Common problems', 'Expected outcomes'] }
      ],
      people_also_ask: [
        `How much does ${topic.keyword} cost in Metro Manila?`,
        `How long does ${topic.keyword} installation take?`,
        `What materials are best for ${topic.keyword}?`
      ],
      conversion_offer: cta
    };

    const brief = parseJsonFromModel<ContentBrief>(result, briefFallback);

    await logAgent(batchId, 'Content Strategist', `Brief hoàn thành: ${brief.outline?.length || 0} sections`, 'success', {
      primary_keyword: brief.primary_keyword,
      sections: brief.outline?.length || 0,
      paa_count: brief.people_also_ask?.length || 0
    });

    return { success: true, data: brief, message: `Brief hoàn thành với ${brief.outline?.length || 0} sections` };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    await logAgent(batchId, 'Content Strategist', 'Lỗi tạo brief', 'failed', { error: message });
    return { success: false, message };
  }
}

// =============================================
// AGENT 4: CONTENT WRITER (Gemini)
// =============================================
export async function runAgentContentWriter(batchId: string, topic: EvaluatedTopic, brief: ContentBrief): Promise<AgentResult> {
  await logAgent(batchId, 'Content Writer', `Viết bài: ${topic.keyword}`, 'running');

  const config = await getAllConfig();
  const companyName = config.company_name || 'SignsHaus';
  const phone = config.business_phone || '+63 917 123 4567';
  const address = config.business_address || 'Makati, Metro Manila';
  const services = config.business_services || 'signage, signs';
  const description = config.business_description || '';
  const tone = config.writer_tone || 'Professional, Trustworthy';
  const language = config.content_language || 'en';
  const minWords = config.min_word_count || '800';
  const minWordsNumber = parseInt(minWords, 10) || 800;
  const cta = config.contact_cta || `Call ${phone} for a free consultation`;
  const focusAreas = config.seo_focus_areas || 'Metro Manila';
  const model = config.agent_content_writer_model || 'gemini-2.0-flash';
  const competitors = config.competitors || '';
  const customInstruction = config.agent_content_writer_system_instruction;

  const { data: recentPosts } = await supabaseAdmin
    .from('posts')
    .select('title, slug, excerpt')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(12);

  const langMap: Record<string, string> = {
    'en': 'English - Professional business tone',
    'tl': 'Tagalog - Conversational and friendly',
    'mix': 'Taglish - English-Tagalog mix, relatable local vibe'
  };

  const internalLinkCandidates = (recentPosts || [])
    .filter((p) => p.slug && p.title)
    .slice(0, 6)
    .map((p) => ({
      title: p.title,
      url: `/blog/${p.slug}`,
      anchor_hint: p.title.toLowerCase().split(' ').slice(0, 4).join(' ')
    }));

  const htmlFormatGuide = [
    'KHÔNG DÙNG Markdown (##, **, *, -, ```, >). TUYỆT ĐỐI KHÔNG.',
    '',
    '=== CẤU TRÚC AIO CITATION-FIRST (BẮT BUỘC THEO THỨ TỰ) ===',
    '  1. H1 title (duy nhất 1 cái)',
    '  2. Hook intro 2-3 câu (đoạn p đầu tiên, data-speakable="true")',
    '  3. KEY TAKEAWAYS BOX: <div class="key-takeaways" data-speakable="true"><h2>Key Takeaways</h2><ul><li>...</li></ul></div>',
    '     → CHÍNH XÁC 4-6 bullets, MỖI bullet PHẢI có ít nhất 1 CON SỐ CỤ THỂ (PHP, ngày, %, kích thước, số lượng)',
    '     → Ví dụ tốt: "LED channel letters cost PHP 8,000-15,000 per letter and last 50,000+ hours"',
    '     → Ví dụ XẤU: "LED signs are a good investment" (KHÔNG CÓ SỐ)',
    '  4. QUICK ANSWER: <div class="quick-answer" data-speakable="true"><p>...</p></div>',
    '     → CHÍNH XÁC 50-70 từ, TỰ TRẢ LỜI ĐƯỢC không cần context',
    '     → Phải trả lời trực tiếp câu hỏi chính của bài viết',
    '     → Phải chứa ít nhất 2 data points cụ thể (giá, thời gian, kích thước...)',
    '  5. MỤC LỤC: <nav class="toc"><h2>Table of Contents</h2><ol><li><a href="#anchor">...</a></li></ol></nav>',
    '  6. NỘI DUNG CHÍNH: 6-8 sections, mỗi section có <h2 id="anchor-id">',
    '  7. COMPARISON TABLE: ít nhất 1 bảng so sánh <table> với thead/tbody',
    '  8. DECISION CHECKLIST: <div class="decision-checklist"><h2 id="...">How to Choose...</h2><ol><li>...</li></ol></div>',
    '  9. CASE STUDY: <section class="case-study"><h2 id="...">Our Experience / Case Study</h2>...</section>',
    '  10. FAQ: <section data-faq="true"><h2 id="faq">Frequently Asked Questions</h2> mỗi Q&A là <h3> + <p>',
    '  11. KẾT LUẬN + CTA',
    '',
    '=== QUY TẮC AIO — RẤT QUAN TRỌNG ===',
    'ÍT NHẤT 4/6 HEADING H2 PHẢI LÀ CÂU HỎI (kết thúc bằng ?)',
    '  → Ví dụ tốt: "How Much Does Acrylic Signage Cost in Metro Manila?"',
    '  → Ví dụ XẤU: "Acrylic Signage Pricing" (KHÔNG PHẢI CÂU HỎI)',
    'MỖI SECTION dưới H2 là một ANSWER BLOCK 120-180 từ:',
    '  → 1-2 câu ĐẦU TIÊN phải trả lời TRỰC TIẾP heading (inverted pyramid)',
    '  → Sau đó mới giải thích chi tiết, ví dụ, data',
    'ENTITY DENSITY: Mỗi 150-200 từ PHẢI có ít nhất 1 data point cụ thể:',
    '  → Giá PHP, thời gian, kích thước, %, số lượng, khoảng cách',
    '  → Ví dụ: "Installation typically takes 3-5 business days for signs under 2 sqm"',
    'DEFINITE LANGUAGE: Tránh hedging words (may, might, could, some, various)',
    '  → Dùng: "costs PHP 12,000" thay vì "may cost around PHP 12,000"',
    '',
    '=== QUY TẮC HTML ===',
    'Dùng id cho MỌI h2 (ví dụ: <h2 id="cost-breakdown">)',
    'Dùng thẻ p cho mỗi đoạn văn — MỖI ĐOẠN TỐI ĐA 2-4 CÂU',
    'Dùng thẻ ul/li hoặc ol/li cho danh sách',
    'Dùng thẻ strong và em cho nhấn mạnh',
    'Dùng thẻ blockquote cho trích dẫn',
    'Dùng thẻ table/thead/tbody/tr/th/td cho bảng giá và so sánh',
    'Chèn tối thiểu 3 internal links bằng thẻ <a href="/blog/...">anchor tự nhiên</a>',
    'Dùng data-speakable="true" cho key-takeaways, quick-answer, và intro paragraph',
  ].map(line => `- ${line}`).join('\n');

  const plannedInlineImages = clampNumber(
    Math.ceil(minWordsNumber / 700) + Math.floor((brief.outline?.length || 0) / 4),
    2, 5
  );
  const plannedInlineImageRange = `${Math.max(1, plannedInlineImages - 1)}-${plannedInlineImages + 1}`;

  const systemPrompt = customInstruction || `Bạn là Senior Content Writer cho ${companyName}.

VỀ DOANH NGHIỆP:
- Tên: ${companyName}
- Mô tả: ${description}
- Dịch vụ: ${services}
- Điện thoại: ${phone}
- Địa chỉ: ${address}
- Khu vực phục vụ: ${focusAreas}
${competitors ? `- Đối thủ: ${competitors}` : ''}

NHIỆM VỤ:
Viết bài SEO chuyên nghiệp về "${topic.keyword}" với góc nhìn: "${topic.news_angle}"

CONTENT BRIEF (PHẢI TUÂN THỦ):
${JSON.stringify(brief, null, 2)}

INTERNAL LINKS CÓ THỂ DÙNG:
${internalLinkCandidates.length ? JSON.stringify(internalLinkCandidates, null, 2) : 'Không có dữ liệu'}

YÊU CẦU BÀI VIẾT:
1. Tối thiểu ${minWordsNumber} từ
2. Ngôn ngữ: ${langMap[language] || langMap['en']}
3. Giọng văn: ${tone}
4. CẤU TRÚC AIO-Optimized (Citation-First Architecture)
5. E-E-A-T SIGNALS quan trọng
6. CTA: "${cta}"
7. Từ khóa chính "${brief.primary_keyword || topic.keyword}" xuất hiện 4-6 lần tự nhiên

8. ẢNH MINH HỌA — RẤT QUAN TRỌNG:
   - Chèn ${plannedInlineImageRange} placeholder ảnh
   - Cú pháp: <!-- IMAGE: detailed English description for AI image generation, include camera angle, lighting, specific scene details, Canon EOS R5, 35mm lens | Short caption for readers -->
   - Ví dụ: <!-- IMAGE: wide-angle photo of a modern LED channel letter sign installed on a glass storefront facade in BGC Taguig, shot during golden hour with warm natural lighting, Canon EOS R5, 35mm lens, shallow depth of field, photorealistic commercial photography | LED channel letter signage installation in BGC -->
   - PHẢI mô tả chi tiết: góc chụp, ánh sáng, vật liệu, địa điểm cụ thể, loại camera
   - Phần trước | là prompt tiếng Anh chi tiết cho AI tạo ảnh giống thật nhất
   - Phần sau | là chú thích ngắn gọn hiển thị cho người đọc

BÀI VIẾT GẦN ĐÂY (TRÁNH TRÙNG):
${recentPosts?.map(p => `- ${p.title}`).join('\n') || 'Chưa có bài nào'}

ĐỊNH DẠNG NỘI DUNG:
Viết nội dung dạng HTML sạch, giống một bài báo xuất bản chuyên nghiệp.
${htmlFormatGuide}

OUTPUT FORMAT (JSON only, no markdown wrapping):
{
  "title": "Tiêu đề bài viết",
  "content": "Nội dung bài viết đầy đủ bằng HTML sạch (KHÔNG markdown)",
  "meta_title": "SEO title (max 60 chars)",
  "meta_description": "SEO description (max 155 chars)",
  "excerpt": "Tóm tắt bài viết (max 200 chars)",
  "suggested_tags": ["tag1", "tag2", "tag3"]
}`;

  try {
    const draftResult = await generateContentResolved(
      systemPrompt,
      `Viết bài chuyên sâu cho từ khóa: "${topic.keyword}" - Lý do được chọn: ${topic.reason}`,
      model,
      'gemini'
    );

    const fallbackArticle: WriterOutput = {
      title: `${topic.keyword} Guide`,
      content: `<h2 id="overview">Overview</h2><p>${topic.reason}</p><p>${cta}</p>`,
      meta_title: `${topic.keyword} | ${companyName}`,
      meta_description: `${topic.keyword} guide for businesses in ${focusAreas}.`,
      excerpt: `${topic.keyword} practical guide for business owners.`,
      suggested_tags: [topic.keyword]
    };

    let article = parseJsonFromModel<WriterOutput>(draftResult, fallbackArticle);
    article.content = normalizeArticleHtml(article.content || '');

    // Expand if too short
    if (estimateWordCount(article.content) < minWordsNumber) {
      const expansionPrompt = `Expand this HTML article so total is at least ${minWordsNumber} words while keeping structure and no markdown.
Return JSON only in the same WriterOutput format.

Current JSON:
${JSON.stringify(article)}`;

      const expandedResult = await generateContentResolved(systemPrompt, expansionPrompt, model, 'gemini');
      const expandedArticle = parseJsonFromModel<WriterOutput>(expandedResult, article);
      expandedArticle.content = normalizeArticleHtml(expandedArticle.content || article.content);
      article = expandedArticle;
    }

    await logAgent(batchId, 'Content Writer', `Hoàn thành: "${article.title}"`, 'success', {
      title: article.title,
      word_count: article.content?.split(/\s+/).length || 0,
      tags: article.suggested_tags
    });

    return { success: true, data: article, message: `Viết xong: "${article.title}"` };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    await logAgent(batchId, 'Content Writer', 'Lỗi viết bài', 'failed', { error: message });
    return { success: false, message };
  }
}

// =============================================
// AGENT 5: SEO OPTIMIZER (Gemini)
// =============================================
export async function runAgentSeoOptimizer(batchId: string, article: WriterOutput, topic: EvaluatedTopic): Promise<AgentResult> {
  await logAgent(batchId, 'SEO Optimizer', `Tối ưu SEO cho: "${article.title}"`, 'running');

  const config = await getAllConfig();
  const model = config.agent_seo_optimizer_model || 'gemini-2.0-flash';
  const customInstruction = config.agent_seo_optimizer_system_instruction;

  const systemPrompt = customInstruction || DEFAULT_SYSTEM_INSTRUCTIONS.seo_optimizer;

  const userPrompt = `Optimize SEO for this article:

Primary keyword: ${topic.keyword}
Secondary keywords: ${topic.expanded_keywords?.join(', ')}
Current meta_title: ${article.meta_title}
Current meta_description: ${article.meta_description}
Current tags: ${article.suggested_tags?.join(', ')}

Article title: ${article.title}
Article HTML (first 4000 chars):
${(article.content || '').substring(0, 4000)}`;

  try {
    const result = await generateContentResolved(systemPrompt, userPrompt, model, 'gemini');

    const fallback: SeoOptimizerOutput = {
      meta_title: article.meta_title,
      meta_description: article.meta_description,
      suggested_tags: article.suggested_tags || [],
      structured_data: null,
      keyword_density_report: {},
      improvements_applied: []
    };

    const seoData = parseJsonFromModel<SeoOptimizerOutput>(result, fallback);

    await logAgent(batchId, 'SEO Optimizer', `SEO optimized: ${seoData.improvements_applied?.length || 0} improvements`, 'success', {
      improvements: seoData.improvements_applied
    });

    return { success: true, data: seoData, message: `SEO optimized: ${seoData.improvements_applied?.length || 0} improvements` };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    await logAgent(batchId, 'SEO Optimizer', 'Lỗi tối ưu SEO', 'failed', { error: message });
    return { success: false, message };
  }
}

// =============================================
// AGENT 6: QUALITY REVIEWER (Gemini)
// =============================================
export async function runAgentQualityReviewer(batchId: string, article: WriterOutput, topic: EvaluatedTopic): Promise<AgentResult> {
  await logAgent(batchId, 'Quality Reviewer', `Đánh giá chất lượng: "${article.title}"`, 'running');

  const config = await getAllConfig();
  const model = config.agent_quality_reviewer_model || 'gemini-2.0-flash';
  const customInstruction = config.agent_quality_reviewer_system_instruction;

  const systemPrompt = customInstruction || DEFAULT_SYSTEM_INSTRUCTIONS.quality_reviewer;

  const userPrompt = `Primary keyword: ${topic.keyword}
Secondary keywords: ${(topic.expanded_keywords || []).join(', ')}
Article title: ${article.title}
Meta title: ${article.meta_title}
Meta description: ${article.meta_description}

Article HTML:
${article.content}`;

  try {
    const result = await generateContentResolved(systemPrompt, userPrompt, model, 'gemini');

    const fallback: ContentQualityReport = {
      seo_score: 75,
      aio_score: 72,
      strengths: ['Structured HTML article', 'Includes CTA'],
      issues: ['Unable to run full QA analysis'],
      revision_actions: []
    };

    let qaReport = parseJsonFromModel<ContentQualityReport>(result, fallback);

    // Additional keyword check
    const articleText = (article.content || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const primaryHits = countKeywordHits(articleText.toLowerCase(), topic.keyword.toLowerCase());
    if (primaryHits < 3) {
      qaReport = {
        ...qaReport,
        seo_score: Math.max(0, qaReport.seo_score - 8),
        issues: [...(qaReport.issues || []), 'Primary keyword usage is too low'],
        revision_actions: [...(qaReport.revision_actions || []), 'Increase natural mentions of primary keyword to 4-6 occurrences']
      };
    }

    const avgScore = Math.round((qaReport.seo_score + qaReport.aio_score) / 2);

    await logAgent(batchId, 'Quality Reviewer', `QA Score: SEO ${qaReport.seo_score}, AIO ${qaReport.aio_score} (avg ${avgScore})`, 'success', {
      seo_score: qaReport.seo_score,
      aio_score: qaReport.aio_score,
      avg_score: avgScore,
      strengths: qaReport.strengths,
      issues: qaReport.issues
    });

    return { success: true, data: qaReport, message: `QA: SEO ${qaReport.seo_score}, AIO ${qaReport.aio_score} (avg ${avgScore})` };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    await logAgent(batchId, 'Quality Reviewer', 'Lỗi đánh giá chất lượng', 'failed', { error: message });
    return { success: false, message };
  }
}

// =============================================
// AGENT 7: IMAGE GENERATOR (DALL-E / Gemini)
// =============================================
export async function runAgentImageGenerator(
  batchId: string,
  topic: EvaluatedTopic,
  article: WriterOutput,
  seoData?: SeoOptimizerOutput
): Promise<AgentResult> {
  await logAgent(batchId, 'Image Generator', `Tạo ảnh cho: "${article.title}"`, 'running');

  const config = await getAllConfig();
  const imageStyle = config.image_style || 'professional photography, modern urban setting';
  const enableFaqSchema = (config.enable_faq_schema || 'true') === 'true';
  const autoInternalLinking = (config.auto_internal_linking || 'true') === 'true';
  const maxInternalLinks = parseInt(config.internal_links_per_article || '5', 10) || 5;
  const minInlineImages = Math.max(1, parseInt(config.pipeline_min_inline_images || '2', 10) || 2);
  const maxInlineImages = Math.max(minInlineImages, parseInt(config.pipeline_max_inline_images || '5', 10) || 5);
  const targetInlineImages = estimateInlineImageTarget({
    html: article.content || '',
    min: minInlineImages,
    max: maxInlineImages
  });
  const baseImageContext = `${imageStyle}, topic: ${topic.keyword}, article: ${article.title}, location: Metro Manila`;

  const generateImageWithRetries = async (prompts: string[]): Promise<string | null> => {
    const uniquePrompts = Array.from(new Set(prompts.map((prompt) => prompt.trim()).filter(Boolean)));

    for (const prompt of uniquePrompts) {
      try {
        const imageUrl = await generateProjectImage(prompt, {
          contentType: 'post',
          keyword: topic.keyword,
          preferLibrary: true,
          enableRealismRetry: true
        });
        if (imageUrl) return imageUrl;
      } catch (err) {
        await logAgent(batchId, 'Image Generator', 'Lỗi tạo ảnh, thử prompt dự phòng', 'failed', {
          error: err instanceof Error ? err.message : String(err)
        });
      }
    }

    return null;
  };

  try {
    // 1. Generate featured image + thumbnail
    const featuredPrompts = [
      buildPhotorealisticPrompt(baseImageContext, `${topic.keyword} signage on a real storefront facade, medium-wide shot, strong composition`),
      buildPhotorealisticPrompt(baseImageContext, `completed signage installation for ${topic.keyword}, daylight exterior shot`)
    ];
    let featuredImageUrl = await generateImageWithRetries(featuredPrompts);

    const thumbnailPrompts = [
      buildPhotorealisticPrompt(baseImageContext, `tight framing hero thumbnail of the same signage concept, subject centered, high contrast`),
      buildPhotorealisticPrompt(baseImageContext, `clean close-up crop-friendly thumbnail of signage details and lighting`)
    ];
    let thumbnailImageUrl = await generateImageWithRetries(thumbnailPrompts);

    // 2. Process IMAGE placeholders from Content Writer
    let finalContent = article.content;
    const generatedImages: { location: string; url: string; alt: string }[] = [];

    const imagePlaceholderRegex = /<!-- IMAGE: (.+?) -->/g;
    const placeholders: { fullMatch: string; prompt: string; caption: string }[] = [];
    let contextualInlineAttempted = false;
    let match;
    while ((match = imagePlaceholderRegex.exec(finalContent)) !== null) {
      const raw = match[1];
      const parts = raw.split('|').map(s => s.trim());
      const prompt = parts[0];
      const caption = parts[1] || '';
      placeholders.push({ fullMatch: match[0], prompt, caption });
    }

    if (placeholders.length > 0) {
      await logAgent(batchId, 'Image Generator', `Tìm thấy ${placeholders.length} placeholder, mục tiêu ${targetInlineImages} ảnh`, 'running');

      const placeholdersToUse = placeholders.slice(0, targetInlineImages);
      const placeholdersToRemove = placeholders.slice(targetInlineImages);

      for (const placeholder of placeholdersToUse) {
        try {
          const imgPrompt = buildPhotorealisticPrompt(baseImageContext, placeholder.prompt);
          await logAgent(batchId, 'Image Generator', `Đang tạo ảnh: ${placeholder.prompt.substring(0, 50)}...`, 'running');
          const imgUrl = await generateImageWithRetries([
            imgPrompt,
            buildPhotorealisticPrompt(baseImageContext, `real installation photo related to ${topic.keyword}`)
          ]);

          if (imgUrl) {
            const altText = buildSeoAltText(topic.keyword, placeholder.caption || placeholder.prompt);
            generatedImages.push({ location: placeholder.prompt, url: imgUrl, alt: altText });

            const figcaptionHtml = placeholder.caption
              ? `<figcaption class="article-figcaption">${placeholder.caption}</figcaption>`
              : '';
            finalContent = finalContent.replace(
              placeholder.fullMatch,
              `<figure class="article-figure"><img src="${imgUrl}" alt="${escapeHtmlAttribute(altText)}" loading="lazy" decoding="async" width="1024" height="1024" class="article-image" />${figcaptionHtml}</figure>`
            );
          } else if (featuredImageUrl) {
            const altText = buildSeoAltText(topic.keyword, placeholder.caption || placeholder.prompt);
            generatedImages.push({ location: placeholder.prompt, url: featuredImageUrl, alt: altText });

            const figcaptionHtml = placeholder.caption
              ? `<figcaption class="article-figcaption">${placeholder.caption}</figcaption>`
              : '';
            finalContent = finalContent.replace(
              placeholder.fullMatch,
              `<figure class="article-figure"><img src="${featuredImageUrl}" alt="${escapeHtmlAttribute(altText)}" loading="lazy" decoding="async" width="1024" height="1024" class="article-image" />${figcaptionHtml}</figure>`
            );
          } else {
            finalContent = finalContent.replace(placeholder.fullMatch, '');
          }
        } catch (err) {
          console.error('Error generating image for placeholder:', err);
          finalContent = finalContent.replace(placeholder.fullMatch, '');
        }
      }

      for (const extraPlaceholder of placeholdersToRemove) {
        finalContent = finalContent.replace(extraPlaceholder.fullMatch, '');
      }
    } else {
      // Fallback: AI analysis for image placement
      await logAgent(batchId, 'Image Generator', 'Không có placeholder, phân tích vị trí chèn ảnh...', 'running');
      contextualInlineAttempted = true;

      const remainingNeeded = Math.max(1, targetInlineImages - generatedImages.length);
      const analysisPrompt = `Analyze this HTML article and suggest ${remainingNeeded} contextual image prompts.
        Article Title: "${article.title}"
        Content Snippet: ${article.content.substring(0, 3000)}...

        Return JSON ONLY:
        [
          {
            "insert_after_text": "a short unique sentence from the article",
            "image_prompt": "specific photorealistic signage photo prompt",
            "alt_text": "description for seo"
          }
        ]`;

      try {
        const analysisResult = await generateContentResolved(analysisPrompt, 'Suggest inline images', 'gemini-2.0-flash', 'gemini');
        const suggestions: { insert_after_text: string; image_prompt: string; alt_text: string }[] = parseJsonFromModel(analysisResult, []);

        for (const item of suggestions.slice(0, remainingNeeded)) {
          if (!item.insert_after_text || !item.image_prompt) continue;
          const imgUrl = await generateImageWithRetries([
            buildPhotorealisticPrompt(baseImageContext, item.image_prompt),
            buildPhotorealisticPrompt(baseImageContext, `real signage photo for ${topic.keyword}`)
          ]);

          if (imgUrl) {
            generatedImages.push({ location: item.insert_after_text, url: imgUrl, alt: item.alt_text });
            const figureHtml = `<figure class="article-figure"><img src="${imgUrl}" alt="${escapeHtmlAttribute(item.alt_text)}" loading="lazy" decoding="async" class="article-image" /><figcaption class="article-figcaption">${item.alt_text}</figcaption></figure>`;

            const escapedText = item.insert_after_text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const textRegex = new RegExp(`(${escapedText})`, 'i');
            if (textRegex.test(finalContent)) {
              finalContent = finalContent.replace(textRegex, `$1${figureHtml}`);
            } else {
              finalContent += figureHtml;
            }
          }

          if (generatedImages.length >= targetInlineImages) break;
        }
      } catch (err) {
        console.error('Error generating inline images:', err);
        await logAgent(batchId, 'Image Generator', 'Lỗi tạo ảnh nội dung (bỏ qua)', 'failed', { error: String(err) });
      }
    }

    // Fallback: generate extra images if needed
    if (!contextualInlineAttempted && generatedImages.length < targetInlineImages) {
      const remainingNeeded = targetInlineImages - generatedImages.length;
      await logAgent(batchId, 'Image Generator', `Bổ sung ${remainingNeeded} ảnh theo ngữ cảnh`, 'running');

      const analysisPrompt = `Analyze this HTML article and suggest ${remainingNeeded} contextual image prompts.
        Article Title: "${article.title}"
        Content Snippet: ${article.content.substring(0, 3000)}...

        Return JSON ONLY:
        [{ "insert_after_text": "...", "image_prompt": "...", "alt_text": "..." }]`;

      try {
        const analysisResult = await generateContentResolved(analysisPrompt, 'Suggest additional inline images', 'gemini-2.0-flash', 'gemini');
        const suggestions: { insert_after_text: string; image_prompt: string; alt_text: string }[] = parseJsonFromModel(analysisResult, []);

        for (const item of suggestions.slice(0, remainingNeeded)) {
          if (!item.insert_after_text || !item.image_prompt) continue;
          const imgUrl = await generateImageWithRetries([
            buildPhotorealisticPrompt(baseImageContext, item.image_prompt),
            buildPhotorealisticPrompt(baseImageContext, `real signage photo for ${topic.keyword}`)
          ]);

          if (!imgUrl) continue;
          generatedImages.push({ location: item.insert_after_text, url: imgUrl, alt: item.alt_text || item.image_prompt });
          const figureHtml = `<figure class="article-figure"><img src="${imgUrl}" alt="${escapeHtmlAttribute(item.alt_text || item.image_prompt)}" loading="lazy" decoding="async" class="article-image" /><figcaption class="article-figcaption">${item.alt_text || item.image_prompt}</figcaption></figure>`;
          const escapedText = item.insert_after_text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const textRegex = new RegExp(`(${escapedText})`, 'i');

          if (textRegex.test(finalContent)) {
            finalContent = finalContent.replace(textRegex, `$1${figureHtml}`);
          } else {
            finalContent += figureHtml;
          }

          if (generatedImages.length >= targetInlineImages) break;
        }
      } catch (err) {
        await logAgent(batchId, 'Image Generator', 'Lỗi bổ sung ảnh', 'failed', { error: String(err) });
      }
    }

    // Absolute fallback loop
    const maxFallbackAttempts = Math.min(2, targetInlineImages - generatedImages.length);
    for (let fi = 0; fi < maxFallbackAttempts && generatedImages.length < targetInlineImages; fi++) {
      const fallbackAlt = `Minh hoa thuc te cho ${topic.keyword} (${generatedImages.length + 1})`;
      const fallbackInlineImage = await generateImageWithRetries([
        buildPhotorealisticPrompt(baseImageContext, `real signage project photo focused on ${topic.keyword}`),
        buildPhotorealisticPrompt(baseImageContext, 'modern signage installation in Metro Manila')
      ]);

      if (!fallbackInlineImage) break;

      generatedImages.push({ location: `fallback-${generatedImages.length + 1}`, url: fallbackInlineImage, alt: fallbackAlt });
      finalContent += `<figure class="article-figure"><img src="${fallbackInlineImage}" alt="${escapeHtmlAttribute(fallbackAlt)}" loading="lazy" decoding="async" class="article-image" /><figcaption class="article-figcaption">${fallbackAlt}</figcaption></figure>`;
    }

    if (!featuredImageUrl) featuredImageUrl = generatedImages[0]?.url || null;
    if (!thumbnailImageUrl) thumbnailImageUrl = featuredImageUrl;

    if (!featuredImageUrl) {
      throw new Error('Không tạo được ảnh featured cho bài viết.');
    }

    if (generatedImages.length === 0 && minInlineImages > 0) {
      throw new Error('Không tạo được ảnh minh họa nào.');
    }

    // Apply SEO optimizer data
    const finalMetaTitle = seoData?.meta_title || article.meta_title;
    const finalMetaDescription = seoData?.meta_description || article.meta_description;
    const finalTags = seoData?.suggested_tags || article.suggested_tags;

    // Clean up responsive images and FAQ schema
    finalContent = finalContent
      .replace(/<img(?![^>]*class=)(?![^>]*article-image)/g, '<img class="article-image"')
      .replace(/<img(?![^>]*loading=)/g, '<img loading="lazy" decoding="async"');

    const faqSchema = enableFaqSchema ? buildFaqSchemaFromHtml(finalContent) : null;
    if (faqSchema && !/application\/ld\+json/i.test(finalContent)) {
      finalContent += `<script type="application/ld+json">${faqSchema}</script>`;
    }

    // Save to DB
    const slug = article.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    let internalLinksInserted = 0;
    if (autoInternalLinking) {
      const { data: linkRules } = await supabaseAdmin
        .from('internal_linking_rules')
        .select('keyword, target_url, priority')
        .order('priority', { ascending: false })
        .limit(100);

      const eligibleRules = (linkRules || []).filter((rule) => {
        if (!rule.target_url) return false;
        return !rule.target_url.endsWith(`/${slug}`);
      }) as InternalLinkRuleRecord[];

      const linked = injectInternalLinksIntoHtml(finalContent, eligibleRules, maxInternalLinks);
      finalContent = linked.content;
      internalLinksInserted = linked.inserted;
    }

    const { data: post, error } = await supabaseAdmin.from('posts').upsert({
      title: article.title,
      slug: slug,
      content: finalContent,
      excerpt: article.excerpt,
      meta_title: finalMetaTitle,
      meta_description: finalMetaDescription,
      featured_image: featuredImageUrl,
      cover_image: thumbnailImageUrl,
      status: 'draft',
      seo_score: article.quality_score || 86,
      tags: finalTags,
      lang: (await getConfig('content_language', 'en')) as 'en' | 'tl',
      created_at: new Date().toISOString()
    }, { onConflict: 'slug' }).select().single();

    if (error) throw error;

    await logAgent(batchId, 'Image Generator', `Lưu bản nháp thành công: "${article.title}"`, 'success', {
      post_id: post?.id,
      featured_image: featuredImageUrl,
      thumbnail_image: thumbnailImageUrl,
      inline_images_count: generatedImages.length,
      internal_links_inserted: internalLinksInserted,
      faq_schema_attached: Boolean(faqSchema)
    });

    // =============================================
    // AUTO-PUBLISH: Check quality gate and publish if passes
    // =============================================
    let autoPublished = false;
    const autoPublishEnabled = (await getConfig('auto_publish_enabled', 'false')) === 'true';

    if (autoPublishEnabled && post?.id) {
      const autoPublishMinScore = parseInt(await getConfig('auto_publish_min_score', '75'), 10) || 75;

      try {
        const gateResult = await enforcePublishGate(
          {
            title: article.title,
            content: finalContent,
            contentType: 'post',
            metaTitle: finalMetaTitle,
            metaDescription: finalMetaDescription,
            featuredImage: featuredImageUrl,
            entityId: post.id,
            entityTable: 'posts',
          },
          autoPublishMinScore
        );

        // Store gate result
        await supabaseAdmin.from('posts').update({
          publish_gate_result: gateResult,
          aio_score: article.quality_score || 0,
          has_quick_answer: /<div[^>]*class="[^"]*quick-answer/i.test(finalContent),
          has_key_takeaways: /<div[^>]*class="[^"]*key-takeaways/i.test(finalContent),
          question_heading_count: (finalContent.match(/<h2[^>]*>[^<]*\?<\/h2>/gi) || []).length,
          last_quality_check_at: new Date().toISOString(),
        }).eq('id', post.id);

        if (gateResult.allowed) {
          // AUTO-PUBLISH!
          const publishedAt = new Date().toISOString();
          await supabaseAdmin.from('posts').update({
            status: 'published',
            auto_published: true,
            published_at: publishedAt,
          }).eq('id', post.id);

          autoPublished = true;

          await logAgent(batchId, 'Auto-Publish', `Tự động xuất bản: "${article.title}" (score: ${gateResult.score})`, 'success', {
            score: gateResult.score,
            checks: gateResult.checks,
          });

          // Ping search engines for indexing
          try {
            await pingSearchEngines();
          } catch (pingErr) {
            console.warn('Search engine ping failed:', pingErr);
          }

          // Queue Facebook posts
          try {
            const fbResult = await queueFacebookPosts({
              id: post.id,
              title: article.title,
              slug: slug,
              excerpt: article.excerpt,
              featured_image: featuredImageUrl,
              content: finalContent,
              tags: finalTags,
            });
            await logAgent(batchId, 'Auto-Publish', `Queued ${fbResult.queued} Facebook posts`, 'success', {
              pages: fbResult.pages,
            });
          } catch (fbErr) {
            console.warn('Facebook queue failed:', fbErr);
          }

          // Link keyword to post for cluster tracking
          try {
            await linkKeywordToPost(topic.keyword, post.id);
          } catch { /* ignore */ }
        } else {
          await logAgent(batchId, 'Auto-Publish', `Không đạt quality gate (score: ${gateResult.score}, cần: ${autoPublishMinScore})`, 'info', {
            score: gateResult.score,
            failReasons: gateResult.failReasons,
          });
        }
      } catch (gateErr) {
        console.error('Auto-publish gate error:', gateErr);
        await logAgent(batchId, 'Auto-Publish', `Lỗi kiểm tra quality gate: ${gateErr instanceof Error ? gateErr.message : 'Unknown'}`, 'failed');
      }
    }

    return {
      success: true,
      data: {
        featured_image_url: featuredImageUrl,
        thumbnail_image_url: thumbnailImageUrl,
        image_suggestions: [],
        generated_images: generatedImages,
        post_id: post?.id
      } as VisualizerOutput,
      message: autoPublished
        ? `Xuất bản tự động thành công! Ảnh thumb + ${generatedImages.length} ảnh minh họa.`
        : `Lưu bản nháp thành công. Ảnh thumb + ${generatedImages.length} ảnh minh họa.`
    };
  } catch (e: unknown) {
    const message = e instanceof Error
      ? e.message
      : (typeof e === 'object' && e !== null && 'message' in e)
        ? String((e as { message: unknown }).message)
        : JSON.stringify(e) || 'Unknown error';
    await logAgent(batchId, 'Image Generator', 'Lỗi tạo ảnh/lưu bài', 'failed', { error: message });
    return { success: false, message };
  }
}

// =============================================
// HELPER: Project Description Generator
// =============================================
export async function generateProjectDescription(params: {
  title: string;
  client: string;
  location: string;
  type: string;
  challenges?: string;
}): Promise<string | null> {
  const config = await getAllConfig();
  const model = config.writer_model || config.agent_content_writer_model || 'gemini-2.0-flash';

  const systemPrompt = `You are a professional copywriter for a premium signage company called "SignsHaus".
  Write a compelling project case study description (approx 200-300 words).

  CONTEXT: This is a Portfolio Case Study for a specific signage project we completed.
  Tone: Professional, confident, architectural, focusing on quality and craftsmanship.
  Structure:
  1. The Challenge/Objective
  2. The Solution
  3. The Result

  Do NOT use markdown headers. Use paragraph breaks.
  Do NOT include "Title:" or "Client:" labels.`;

  const userPrompt = `Write a project description for:
  Project Name: ${params.title}
  Client: ${params.client}
  Location: ${params.location}
  Signage Type: ${params.type}
  Special Challenges/Notes: ${params.challenges || 'N/A'}`;

  return await generateContentResolved(systemPrompt, userPrompt, model);
}

// =============================================
// HELPER: Internal Linking Keywords Extractor
// =============================================
export async function extractKeywordsForLinking(
  title: string,
  description: string,
  content: string
): Promise<string[]> {
  const config = await getAllConfig();
  const model = config.agent_seo_research_model || config.researcher_model || 'gemini-2.0-flash';

  const systemPrompt = `You are an SEO Internal Linking Specialist.
  Analyze the provided content and extract 3-5 distinct, high-value keywords or phrases.
  These keywords will be used as "anchor text" to link FROM other pages TO this page.

  RULES:
  1. Keywords must be natural phrases (2-4 words usually).
  2. Avoid generic terms like "product", "signage" (too broad).
  3. Use specific material names, product types, or service names found in the content.
  4. Return ONLY a JSON array of strings. No markdown.`;

  const userPrompt = `Page Title: ${title}
  Description: ${description}
  Content Snippet: ${content.substring(0, 1000)}...

  Extract 3-5 keywords:`;

  try {
    const result = await generateContentResolved(systemPrompt, userPrompt, model);
    const keywords: string[] = parseJsonFromModel(result, []);
    return Array.isArray(keywords) ? keywords.slice(0, 5) : [];
  } catch (e) {
    console.error('Error extracting keywords:', e);
    return [];
  }
}

// =============================================
// Export default system instructions for settings UI
// =============================================
export { DEFAULT_SYSTEM_INSTRUCTIONS };
