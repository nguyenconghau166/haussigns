import { generateContent as generateContentOpenAI } from './openai';
import { generateContentGemini } from './ai/gemini';
import { generateProjectImage } from './image-gen';
import { supabaseAdmin } from './supabase';

// =============================================
// Helper: AI Provider Router
// =============================================
async function generateContentResolved(
  systemPrompt: string,
  userPrompt: string,
  configModel?: string
): Promise<string | null> {
  const config = await getAllConfig();
  const provider = config.ai_provider || 'openai'; // 'openai' | 'gemini'
  const timeoutMs = Math.max(30000, parseInt(config.ai_request_timeout_ms || '120000', 10) || 120000);
  const retryCount = Math.max(0, parseInt(config.ai_request_retry_count || '1', 10) || 1);

  const runOnce = async (): Promise<string | null> => {
    if (provider === 'gemini') {
      const apiKey = config.GEMINI_API_KEY;
      // If configModel is provided, use it. Otherwise, let generateContentGemini use its default from DB/Env
      let model = configModel;
      if (model?.includes('gpt')) model = undefined; // Clear OpenAI model if switching to Gemini

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

function escapeHtmlAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
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
  await supabaseAdmin.from('ai_pipeline_runs').update(updates).eq('id', id);
}

// =============================================
// AGENT 1: RESEARCHER (Nghiên cứu từ khóa & tin tức)
// =============================================
export async function runAgentResearcher(batchId: string): Promise<AgentResult> {
  await logAgent(batchId, 'Researcher', 'Bắt đầu nghiên cứu thị trường', 'running');

  const config = await getAllConfig();
  const seedKeywords = config.target_keywords_seed || 'signage, business signs, LED signage';
  const focusAreas = config.seo_focus_areas || 'Metro Manila';
  const services = config.business_services || 'signage, acrylic signs';
  const model = config.researcher_model || 'gpt-4o-mini';

  const systemPrompt = `Bạn là Chuyên gia Nghiên cứu Thị trường cho ngành Biển hiệu Quảng cáo tại Philippines.

NHIỆM VỤ:
1. Tìm 5 chủ đề/từ khóa có giá trị cao liên quan đến ngành biển hiệu quảng cáo
2. Với mỗi từ khóa, mở rộng thêm 3-5 từ khóa phụ (long-tail keywords)
3. Tìm góc độ tin tức/xu hướng hiện tại có thể khai thác

NGỮ CẢNH NGÀNH:
- Dịch vụ: ${services}
- Khu vực tập trung: ${focusAreas}
- Từ khóa gốc: ${seedKeywords}

YÊU CẦU OUTPUT (JSON only, no markdown):
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

CHÚ Ý:
- Ưu tiên từ khóa transactional (người dùng muốn mua/thuê dịch vụ)
- Kết hợp tên địa phương (Makati, BGC, Quezon City...)
- Tìm cơ hội từ tin tức: khai trương cửa hàng, quy định mới, xu hướng thiết kế...`;

  try {
    const result = await generateContentResolved(
      systemPrompt,
      `Hãy nghiên cứu và tìm 5 cơ hội nội dung cho ngày hôm nay. Tập trung vào: ${seedKeywords}`,
      model
    );

    const cleaned = result?.replace(/```json/g, '').replace(/```/g, '').trim() || '[]';
    const topics: ResearchTopic[] = JSON.parse(cleaned);

    await logAgent(batchId, 'Researcher', `Tìm thấy ${topics.length} chủ đề`, 'success', {
      topics_count: topics.length,
      topics: topics.map(t => t.keyword)
    });

    return { success: true, data: topics, message: `Tìm thấy ${topics.length} chủ đề tiềm năng` };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    await logAgent(batchId, 'Researcher', 'Lỗi nghiên cứu', 'failed', { error: message });
    return { success: false, message: message };
  }
}

// =============================================
// AGENT 2: EVALUATOR (Đánh giá & Lọc chủ đề)
// =============================================
export async function runAgentEvaluator(batchId: string, topics: ResearchTopic[]): Promise<AgentResult> {
  await logAgent(batchId, 'Evaluator', 'Đánh giá và so sánh chủ đề', 'running', {
    topics_received: topics.length
  });

  const config = await getAllConfig();
  const minScore = parseInt(config.evaluator_min_score || '60');
  const companyName = config.company_name || 'SignsHaus';

  // Fetch existing posts for duplicate check
  const { data: existingPosts } = await supabaseAdmin
    .from('posts')
    .select('id, title, slug, seo_score, status, created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  const existingTitles = existingPosts?.map(p => p.title.toLowerCase()) || [];
  const systemPrompt = `Bạn là Chuyên gia Đánh giá Nội dung SEO cho ${companyName}.

NHIỆM VỤ:
Đánh giá danh sách chủ đề nghiên cứu và cho điểm từ 0-100 dựa trên:
- Độ phù hợp với ngành biển hiệu quảng cáo (30%)
- Tiềm năng thu hút khách hàng (25%)
- Độ khó cạnh tranh (thấp = tốt) (20%)
- Tính thời sự/xu hướng (15%)
- Khả năng lồng ghép doanh nghiệp tự nhiên (10%)

BÀI VIẾT ĐÃ CÓ TRÊN WEBSITE:
${existingTitles.slice(0, 20).map((t, i) => `${i + 1}. ${t}`).join('\n') || 'Chưa có bài viết nào'}

YÊU CẦU OUTPUT (JSON only, no markdown):
[
  {
    "keyword": "original keyword",
    "score": 85,
    "reason": "Why this topic is good/bad",
    "existing_post_check": "No duplicate found" or "Similar to: [existing title]",
    "recommended_action": "create|update|skip",
    "news_angle": "preserved from research",
    "expanded_keywords": ["preserved from research"]
  }
]

QUY TẮC:
- Nếu chủ đề trùng lặp với bài đã có và bài đó có seo_score >= 85 → "skip"
- Nếu bài đã có nhưng seo_score < 85 → "update"
- Nếu chủ đề mới hoàn toàn → "create"
- Chỉ giữ lại chủ đề có score >= ${minScore}
- Sắp xếp theo score giảm dần`;

  try {
    const result = await generateContentResolved(
      systemPrompt,
      `Đánh giá các chủ đề sau:\n${JSON.stringify(topics, null, 2)}`,
      'gpt-4o-mini' // Will be mapped to equivalent if using Gemini
    );

    const cleaned = result?.replace(/```json/g, '').replace(/```/g, '').trim() || '[]';
    let evaluated: EvaluatedTopic[] = JSON.parse(cleaned);

    // Filter by minimum score
    evaluated = evaluated.filter(t => t.score >= minScore && t.recommended_action !== 'skip');

    // Sort by score descending
    evaluated.sort((a, b) => b.score - a.score);

    await logAgent(batchId, 'Evaluator', `Duyệt ${evaluated.length}/${topics.length} chủ đề`, 'success', {
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
    await logAgent(batchId, 'Evaluator', 'Lỗi đánh giá', 'failed', { error: message });
    return { success: false, message: message };
  }
}

// =============================================
// AGENT 3: WRITER (Viết bài SEO)
// =============================================
export async function runAgentWriter(batchId: string, topic: EvaluatedTopic): Promise<AgentResult> {
  await logAgent(batchId, 'Writer', `Viết bài: ${topic.keyword}`, 'running');

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
  const model = config.writer_model || 'gpt-4o';
  const competitors = config.competitors || '';
  const writerQualityThreshold = parseInt(config.writer_quality_threshold || '82', 10) || 82;
  const supportingModel = config.researcher_model || 'gpt-4o-mini';
  const promptVariantMode = config.writer_prompt_variant || 'expert';

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
    'Thêm mục lục ngắn gần đầu bài bằng <nav><ol><li>',
    'Dùng id cho mỗi h2 để tăng khả năng điều hướng (ví dụ: <h2 id="material-options">...)',
    'Dùng thẻ h2 và h3 cho tiêu đề phần',
    'Dùng thẻ p cho mỗi đoạn văn',
    'Dùng thẻ ul/li hoặc ol/li cho danh sách',
    'Dùng thẻ strong và em cho nhấn mạnh',
    'Dùng thẻ blockquote cho trích dẫn',
    'Dùng thẻ table/thead/tbody/tr/th/td cho bảng giá',
    'Dùng đúng 1 khối FAQ với 3-5 câu hỏi bằng <section data-faq="true"> và mỗi câu hỏi là <h3>',
    'Chèn tối thiểu 2 internal links bằng thẻ <a href="/blog/...">anchor tự nhiên</a>',
    'Có 1 khối checklist ngắn cuối bài bằng <ul>',
    'Dùng thẻ figure/figcaption nếu cần chú thích',
    'Viết mượt mà, tự nhiên, đọc như bài báo, KHÔNG liệt kê khô khan',
  ].map(line => `- ${line}`).join('\n');

  const variantInstructionMap: Record<string, string> = {
    control: [
      'Tập trung mạch bài dễ đọc và giàu thông tin thực dụng.',
      'Ưu tiên clarity, cấu trúc đơn giản, tránh over-creative copy.',
      'Nội dung hướng tới chuyển đổi nhẹ nhàng, đáng tin cậy.',
    ].join('\n'),
    expert: [
      'Tập trung bài chuyên sâu dạng tư vấn kỹ thuật + chiến lược triển khai.',
      'Mỗi section nên có insight khác biệt thay vì thông tin phổ thông.',
      'Làm rõ các trade-off thực tế (chi phí, độ bền, tốc độ thi công, bảo trì).',
    ].join('\n')
  };

  const briefSystemPrompt = `Bạn là SEO Strategist + AIO Strategist cho ${companyName}.

NHIỆM VỤ:
Tạo một content brief thực chiến cho chủ đề "${topic.keyword}" để writer viết bài dễ rank và dễ được AI systems trích dẫn.

YÊU CẦU BRIEF:
1. Primary keyword + nhóm secondary keyword có search intent rõ ràng
2. Tách user intent (informational/commercial/transactional)
3. Liệt kê pain points chính của khách hàng trước khi mua dịch vụ
4. Tạo entity map (vật liệu, quy trình, địa điểm, thuật ngữ kỹ thuật)
5. Outline 6-8 phần theo thứ tự hợp lý funnel
6. Gợi ý 4-6 People Also Ask câu hỏi gần với chủ đề
7. Gợi ý offer/CTA phù hợp

OUTPUT JSON ONLY:
{
  "primary_keyword": "...",
  "secondary_keywords": ["..."],
  "user_intent": "...",
  "audience_persona": "...",
  "pain_points": ["..."],
  "entity_map": ["..."],
  "outline": [
    { "heading": "...", "intent": "...", "key_points": ["..."] }
  ],
  "people_also_ask": ["..."],
  "conversion_offer": "..."
}`;

  const briefResult = await generateContentResolved(
    briefSystemPrompt,
    `Create a deep brief for keyword: "${topic.keyword}". News angle: "${topic.news_angle}". Expanded keywords: ${topic.expanded_keywords?.join(', ')}.`,
    supportingModel
  );

  const briefFallback: ContentBrief = {
    primary_keyword: topic.keyword,
    secondary_keywords: topic.expanded_keywords || [],
    user_intent: 'transactional + informational',
    audience_persona: 'Business owners and marketing managers in Metro Manila',
    pain_points: ['Low storefront visibility', 'Unclear pricing', 'Durability concerns in outdoor conditions'],
    entity_map: ['acrylic signage', 'stainless steel signage', 'LED modules', 'installation permits', 'Metro Manila retail zones'],
    outline: [
      {
        heading: `What ${topic.keyword} means for local businesses`,
        intent: 'clarify topic and context',
        key_points: ['Business relevance', 'Common buyer problems', 'Expected outcomes']
      }
    ],
    people_also_ask: [
      `How much does ${topic.keyword} cost in Metro Manila?`,
      `How long does ${topic.keyword} installation take?`,
      `What materials are best for ${topic.keyword}?`
    ],
    conversion_offer: cta
  };

  const brief = parseJsonFromModel<ContentBrief>(briefResult, briefFallback);

  const buildSystemPrompt = (variant: 'control' | 'expert') => `Bạn là Senior Content Writer cho ${companyName}.

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

PROMPT VARIANT: ${variant.toUpperCase()}
${variantInstructionMap[variant]}

CONTENT BRIEF (PHẢI TUÂN THỦ):
${JSON.stringify(brief, null, 2)}

INTERNAL LINKS CÓ THỂ DÙNG:
${internalLinkCandidates.length ? JSON.stringify(internalLinkCandidates, null, 2) : 'Không có dữ liệu'}

YÊU CẦU BÀI VIẾT:
1. Tối thiểu ${minWordsNumber} từ
2. Ngôn ngữ: ${langMap[language] || langMap['en']}
3. Giọng văn: ${tone}
4. CẤU TRÚC:
   - Phần mở đầu hook (2-3 câu thu hút)
   - Khối "Quick answer" ngắn (2-4 câu) ở đầu bài
   - Mục lục mini với anchor link
   - Nội dung chính chia thành nhiều phần rõ ràng
   - Chi tiết kỹ thuật (vật liệu, quy trình, độ bền)
   - So sánh ưu nhược điểm nếu phù hợp
   - Bảng giá tham khảo (PHP)
   - FAQ Section (3-5 câu hỏi)
   - KẾT LUẬN + CTA mạnh mẽ

5. LỒNG GHÉP DOANH NGHIỆP:
   - Đề cập ${companyName} tự nhiên (2-3 lần trong bài)
   - Kể kinh nghiệm/case study giả định nhưng thực tế
   - KHÔNG quảng cáo lộ liễu, phải mang lại giá trị cho người đọc
   
6. CTA - KÊU GỌI HÀNH ĐỘNG:
   - Cuối bài: "${cta}"
   - Trong bài: 1-2 CTA nhẹ nhàng tự nhiên

7. SEO:
   - Từ khóa chính "${brief.primary_keyword || topic.keyword}" xuất hiện 4-6 lần tự nhiên
   - Từ khóa phụ: ${topic.expanded_keywords?.join(', ')}
   - Dùng entities từ brief.entity_map xuyên suốt bài
   - Sử dụng tên địa phương tự nhiên
   - Chỉ có 1 thẻ h1 trong toàn bài

8. AIO (Artificial Intelligence Optimization):
   - Viết câu mở mỗi section dạng "định nghĩa + ngữ cảnh" rõ chủ thể
   - Tạo các đoạn trả lời trực tiếp, ngắn gọn cho câu hỏi truy vấn
   - Có ít nhất 1 bảng so sánh và 1 checklist ra quyết định
   - FAQ phải trả lời rõ ràng, câu đầu đi thẳng vào ý chính

9. ẢNH MINH HỌA TỰ ĐỘNG:
   - Chèn đúng 3 placeholder ảnh vào các vị trí chiến lược trong bài viết
   - Cú pháp: ${'<!-- IMAGE: chi tiết bằng tiếng Anh mô tả cảnh cụ thể cho AI tạo ảnh | Chú thích ngắn gọn hiển thị cho người đọc -->'}
   - Ví dụ: ${'<!-- IMAGE: close-up photo of illuminated 3D acrylic channel letters mounted on modern glass storefront in Makati CBD at night | Bảng hiệu chữ nổi Acrylic có đèn LED tại cửa hàng ở Makati -->'}
   - QUAN TRỌNG: Phần trước dấu | là prompt chi tiết tiếng Anh để AI tạo ảnh thực tế, PHẢI mô tả cảnh cụ thể liên quan đến nội dung đoạn văn phía trên (loại biển, vật liệu, địa điểm cụ thể). Phần sau dấu | là chú thích ngắn gọn (tiếng Việt hoặc tiếng Anh theo ngôn ngữ bài viết)
   - Đặt placeholder sau các đoạn văn mô tả hình ảnh, vật liệu hoặc quy trình

BÀI VIẾT GẦN ĐÂY (TRÁNH TRÙNG):
${recentPosts?.map(p => `- ${p.title}`).join('\n') || 'Chưa có bài nào'}

ĐỊNH DẠNG NỘI DUNG - RẤT QUAN TRỌNG:
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

  const evaluateArticleQuality = async (article: WriterOutput): Promise<ContentQualityReport> => {
    const articleText = (article.content || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const qaSystemPrompt = `You are an SEO + AIO Quality Auditor.
Evaluate article quality and return JSON only:
{
  "seo_score": 0,
  "aio_score": 0,
  "strengths": ["..."],
  "issues": ["..."],
  "revision_actions": ["..."]
}

Scoring focus:
- SEO structure and keyword coverage
- AIO answerability and entity clarity
- Readability and conversion value
- Technical formatting in HTML`;

    const qaResultRaw = await generateContentResolved(
      qaSystemPrompt,
      `Primary keyword: ${brief.primary_keyword || topic.keyword}
Secondary keywords: ${(brief.secondary_keywords || topic.expanded_keywords || []).join(', ')}
Article title: ${article.title}
Article HTML:
${article.content}`,
      supportingModel
    );

    const qaFallback: ContentQualityReport = {
      seo_score: 75,
      aio_score: 72,
      strengths: ['Structured HTML article', 'Includes CTA'],
      issues: ['Unable to run full QA analysis'],
      revision_actions: []
    };

    let qaReport = parseJsonFromModel<ContentQualityReport>(qaResultRaw, qaFallback);
    const primaryHits = countKeywordHits(articleText.toLowerCase(), (brief.primary_keyword || topic.keyword).toLowerCase());
    if (primaryHits < 3) {
      qaReport = {
        ...qaReport,
        seo_score: Math.max(0, qaReport.seo_score - 8),
        issues: [...(qaReport.issues || []), 'Primary keyword usage is too low'],
        revision_actions: [...(qaReport.revision_actions || []), 'Increase natural mentions of primary keyword to 4-6 occurrences']
      };
    }

    return qaReport;
  };

  const generateCandidate = async (variant: 'control' | 'expert') => {
    const systemPrompt = buildSystemPrompt(variant);
    const draftResult = await generateContentResolved(
      systemPrompt,
      `Viết bài chuyên sâu cho từ khóa: "${topic.keyword}" - Lý do được chọn: ${topic.reason}`,
      model
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

    if (estimateWordCount(article.content) < minWordsNumber) {
      const expansionPrompt = `Expand this HTML article so total is at least ${minWordsNumber} words while keeping structure and no markdown.
Return JSON only in the same WriterOutput format.

Current JSON:
${JSON.stringify(article)}`;

      const expandedResult = await generateContentResolved(systemPrompt, expansionPrompt, model);
      const expandedArticle = parseJsonFromModel<WriterOutput>(expandedResult, article);
      expandedArticle.content = normalizeArticleHtml(expandedArticle.content || article.content);
      article = expandedArticle;
    }

    let qaReport = await evaluateArticleQuality(article);
    if ((qaReport.seo_score + qaReport.aio_score) / 2 < writerQualityThreshold && qaReport.revision_actions.length > 0) {
      const revisionPrompt = `Revise the article HTML to improve SEO and AIO quality.
Keep claims realistic, keep the same topic, and keep JSON-only output (WriterOutput format).

Required actions:
${qaReport.revision_actions.map((x) => `- ${x}`).join('\n')}

Current article JSON:
${JSON.stringify(article)}`;

      const revisedResult = await generateContentResolved(systemPrompt, revisionPrompt, model);
      const revisedArticle = parseJsonFromModel<WriterOutput>(revisedResult, article);
      revisedArticle.content = normalizeArticleHtml(revisedArticle.content || article.content);
      article = revisedArticle;
      qaReport = await evaluateArticleQuality(article);
    }

    const finalScore = Math.round((qaReport.seo_score + qaReport.aio_score) / 2);
    article.quality_score = finalScore;
    article.quality_notes = [`Prompt variant: ${variant}`, ...(qaReport.strengths || []), ...(qaReport.issues || []).slice(0, 3)];

    return { article, qaReport, finalScore, variant };
  };

  try {
    const variants: Array<'control' | 'expert'> =
      promptVariantMode === 'ab_test'
        ? ['control', 'expert']
        : [promptVariantMode === 'control' ? 'control' : 'expert'];

    const candidates = [];
    for (const variant of variants) {
      candidates.push(await generateCandidate(variant));
    }

    const best = candidates.sort((a, b) => b.finalScore - a.finalScore)[0];
    const article = best.article;

    await logAgent(batchId, 'Writer', `Hoàn thành: "${article.title}"`, 'success', {
      title: article.title,
      word_count: article.content?.split(/\s+/).length || 0,
      tags: article.suggested_tags,
      quality_score: article.quality_score,
      quality_notes: article.quality_notes,
      prompt_variant_used: best.variant,
      ab_test_mode: promptVariantMode === 'ab_test',
      tested_variants: candidates.map((candidate) => ({
        variant: candidate.variant,
        final_score: candidate.finalScore,
        seo_score: candidate.qaReport.seo_score,
        aio_score: candidate.qaReport.aio_score
      }))
    });

    return { success: true, data: article, message: `Viết xong: "${article.title}"` };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    await logAgent(batchId, 'Writer', 'Lỗi viết bài', 'failed', { error: message });
    return { success: false, message: message };
  }
}

// =============================================
// AGENT 4: VISUAL INSPECTOR (Kiểm tra & Bổ sung ảnh)
// =============================================
export async function runAgentVisualInspector(
  batchId: string,
  topic: EvaluatedTopic,
  article: WriterOutput
): Promise<AgentResult> {
  await logAgent(batchId, 'Visual Inspector', `Tạo ảnh cho: "${article.title}"`, 'running');

  const config = await getAllConfig();
  const imageStyle = config.image_style || 'professional photography, modern urban setting';
  const enableFaqSchema = (config.enable_faq_schema || 'true') === 'true';
  const autoInternalLinking = (config.auto_internal_linking || 'true') === 'true';
  const maxInternalLinks = parseInt(config.internal_links_per_article || '3', 10) || 3;
  const minInlineImages = Math.max(1, parseInt(config.pipeline_min_inline_images || '2', 10) || 2);
  const baseImageContext = `${imageStyle}, topic: ${topic.keyword}, article: ${article.title}, location: Metro Manila`;

  const generateImageWithRetries = async (prompts: string[]): Promise<string | null> => {
    const uniquePrompts = Array.from(new Set(prompts.map((prompt) => prompt.trim()).filter(Boolean)));

    for (const prompt of uniquePrompts) {
      try {
        const imageUrl = await generateProjectImage(prompt);
        if (imageUrl) return imageUrl;
      } catch (err) {
        await logAgent(batchId, 'Visual Inspector', 'Loi tao anh, thu prompt du phong', 'failed', {
          error: err instanceof Error ? err.message : String(err)
        });
      }
    }

    return null;
  };

  try {
    // 1. Generate featured image + thumbnail image (must be realistic and relevant)
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

    // 2. Find IMAGE placeholders and generate images for them
    let finalContent = article.content;
    const generatedImages: { location: string; url: string; alt: string }[] = [];

    // Extract all <!-- IMAGE: description --> placeholders from the HTML content
    const imagePlaceholderRegex = /<!-- IMAGE: (.+?) -->/g;
    const placeholders: { fullMatch: string; prompt: string; caption: string }[] = [];
    let match;
    while ((match = imagePlaceholderRegex.exec(finalContent)) !== null) {
      const raw = match[1];
      // Support format: "prompt | caption" or just "prompt"
      const parts = raw.split('|').map(s => s.trim());
      const prompt = parts[0];
      const caption = parts[1] || '';
      placeholders.push({ fullMatch: match[0], prompt, caption });
    }

    if (placeholders.length > 0) {
      await logAgent(batchId, 'Visual Inspector', `Tìm thấy ${placeholders.length} vị trí chèn ảnh`, 'running');

      for (const placeholder of placeholders) {
        try {
          const imgPrompt = buildPhotorealisticPrompt(baseImageContext, placeholder.prompt);
          await logAgent(batchId, 'Visual Inspector', `Đang tạo ảnh: ${placeholder.prompt.substring(0, 50)}...`, 'running');
          const imgUrl = await generateImageWithRetries([
            imgPrompt,
            buildPhotorealisticPrompt(baseImageContext, `real installation photo related to ${topic.keyword}`)
          ]);

          if (imgUrl) {
            const altText = placeholder.caption || placeholder.prompt;
            generatedImages.push({
              location: placeholder.prompt,
              url: imgUrl,
              alt: altText
            });

            // Replace placeholder with <figure> HTML tag — caption for display, NOT the raw prompt
            const figcaptionHtml = placeholder.caption
              ? `<figcaption class="article-figcaption">${placeholder.caption}</figcaption>`
              : '';
            finalContent = finalContent.replace(
              placeholder.fullMatch,
              `<figure class="article-figure"><img src="${imgUrl}" alt="${escapeHtmlAttribute(altText)}" loading="lazy" decoding="async" class="article-image" />${figcaptionHtml}</figure>`
            );
          } else if (featuredImageUrl) {
            const altText = placeholder.caption || placeholder.prompt;
            generatedImages.push({
              location: placeholder.prompt,
              url: featuredImageUrl,
              alt: altText
            });

            const figcaptionHtml = placeholder.caption
              ? `<figcaption class="article-figcaption">${placeholder.caption}</figcaption>`
              : '';
            finalContent = finalContent.replace(
              placeholder.fullMatch,
              `<figure class="article-figure"><img src="${featuredImageUrl}" alt="${escapeHtmlAttribute(altText)}" loading="lazy" decoding="async" class="article-image" />${figcaptionHtml}</figure>`
            );
          } else {
            // Remove placeholder if image generation failed
            finalContent = finalContent.replace(placeholder.fullMatch, '');
          }
        } catch (err) {
          console.error('Error generating image for placeholder:', err);
          finalContent = finalContent.replace(placeholder.fullMatch, '');
        }
      }
    } else {
      // Fallback: If Writer didn't include placeholders, use AI analysis
      await logAgent(batchId, 'Visual Inspector', 'Không có placeholder, phân tích vị trí chèn ảnh...', 'running');

      const analysisPrompt = `Analyze this HTML article and suggest 2-3 image prompts.
        Article Title: "${article.title}"
        Content Snippet: ${article.content.substring(0, 3000)}...

        Return JSON ONLY:
        [
          {
            "insert_after_text": "a short unique sentence from the article to insert image after",
            "image_prompt": "specific photorealistic signage photo relevant to the nearby paragraph",
            "alt_text": "description for seo"
          }
        ]`;

      try {
        const analysisResult = await generateContentResolved(analysisPrompt, 'Suggest inline images', 'gpt-4o');
        const cleaned = analysisResult?.replace(/```json/g, '').replace(/```/g, '').trim() || '[]';
        const suggestions: { insert_after_text: string; image_prompt: string; alt_text: string }[] = JSON.parse(cleaned);

        for (const item of suggestions) {
          if (!item.insert_after_text || !item.image_prompt) continue;
          await logAgent(batchId, 'Visual Inspector', `Đang tạo ảnh: ${item.alt_text}`, 'running');
          const imgUrl = await generateImageWithRetries([
            buildPhotorealisticPrompt(baseImageContext, item.image_prompt),
            buildPhotorealisticPrompt(baseImageContext, `real signage photo for ${topic.keyword}`)
          ]);

          if (imgUrl) {
            generatedImages.push({ location: item.insert_after_text, url: imgUrl, alt: item.alt_text });
            const figureHtml = `<figure class="article-figure"><img src="${imgUrl}" alt="${escapeHtmlAttribute(item.alt_text)}" loading="lazy" decoding="async" class="article-image" /><figcaption class="article-figcaption">${item.alt_text}</figcaption></figure>`;

            // Try to insert after the matching text
            const escapedText = item.insert_after_text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const textRegex = new RegExp(`(${escapedText})`, 'i');
            if (textRegex.test(finalContent)) {
              finalContent = finalContent.replace(textRegex, `$1${figureHtml}`);
            } else {
              // Append at end of content if text not found
              finalContent += figureHtml;
            }
          }
        }
      } catch (err) {
        console.error('Error generating inline images:', err);
        await logAgent(batchId, 'Visual Inspector', 'Lỗi tạo ảnh nội dung (bỏ qua)', 'failed', { error: String(err) });
      }
    }

    while (generatedImages.length < minInlineImages) {
      const fallbackAlt = `Minh hoa thuc te cho ${topic.keyword} (${generatedImages.length + 1})`;
      const fallbackInlineImage = await generateImageWithRetries([
        buildPhotorealisticPrompt(baseImageContext, `real signage project photo focused on ${topic.keyword}`),
        buildPhotorealisticPrompt(baseImageContext, 'modern signage installation in Metro Manila')
      ]);

      if (!fallbackInlineImage) break;

      generatedImages.push({ location: `fallback-${generatedImages.length + 1}`, url: fallbackInlineImage, alt: fallbackAlt });
      finalContent += `<figure class="article-figure"><img src="${fallbackInlineImage}" alt="${escapeHtmlAttribute(fallbackAlt)}" loading="lazy" decoding="async" class="article-image" /><figcaption class="article-figcaption">${fallbackAlt}</figcaption></figure>`;
    }

    if (!featuredImageUrl) {
      featuredImageUrl = generatedImages[0]?.url || null;
    }

    if (!thumbnailImageUrl) {
      thumbnailImageUrl = featuredImageUrl;
    }

    if (!featuredImageUrl) {
      throw new Error('Khong tao duoc anh thumb/featured cho bai viet. Pipeline dung de tranh bai khong co anh.');
    }

    if (generatedImages.length < minInlineImages) {
      throw new Error(`Khong tao du ${minInlineImages} anh minh hoa noi dung. Pipeline dung de dam bao chat luong hinh anh.`);
    }

    const resolvedFeaturedImage = featuredImageUrl;
    const resolvedThumbnailImage = thumbnailImageUrl;

    // 3. Clean up: ensure all images are responsive and FAQ schema exists if enabled
    finalContent = finalContent
      .replace(/<img(?![^>]*class=)(?![^>]*article-image)/g, '<img class="article-image"')
      .replace(/<img(?![^>]*loading=)/g, '<img loading="lazy" decoding="async"');

    const faqSchema = enableFaqSchema ? buildFaqSchemaFromHtml(finalContent) : null;
    if (faqSchema && !/application\/ld\+json/i.test(finalContent)) {
      finalContent += `<script type="application/ld+json">${faqSchema}</script>`;
    }

    // 5. Save to DB as draft
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
      content: finalContent, // Now HTML
      excerpt: article.excerpt,
      meta_title: article.meta_title,
      meta_description: article.meta_description,
      featured_image: resolvedFeaturedImage,
      cover_image: resolvedThumbnailImage,
      status: 'draft',
      seo_score: article.quality_score || 86,
      tags: article.suggested_tags,
      lang: (await getConfig('content_language', 'en')) as 'en' | 'tl',
      created_at: new Date().toISOString()
    }, { onConflict: 'slug' }).select().single();

    if (error) throw error;

    await logAgent(batchId, 'Visual Inspector', `Lưu bản nháp thành công: "${article.title}"`, 'success', {
      post_id: post?.id,
      featured_image: resolvedFeaturedImage,
      thumbnail_image: resolvedThumbnailImage,
      inline_images_count: generatedImages.length,
      internal_links_inserted: internalLinksInserted,
      faq_schema_attached: Boolean(faqSchema)
    });

    return {
      success: true,
      data: {
        featured_image_url: resolvedFeaturedImage,
        thumbnail_image_url: resolvedThumbnailImage,
        image_suggestions: [],
        generated_images: generatedImages,
        post_id: post?.id
      } as VisualizerOutput,
      message: `Lưu bản nháp thành công. Ảnh thumb + ${generatedImages.length} ảnh minh họa.`
    };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    await logAgent(batchId, 'Visual Inspector', 'Lỗi tạo ảnh/lưu bài', 'failed', { error: message });
    return { success: false, message: message };
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
  const model = config.writer_model || 'gpt-4o';

  const systemPrompt = `You are a professional copywriter for a premium signage company called "SignsHaus".
  Write a compelling project case study description (approx 200-300 words).
  
  CONTEXT: This is a Portfolio Case Study for a specific signage project we completed.
  Tone: Professional, confident, architectural, focusing on quality and craftsmanship.
  Structure:
  1. The Challenge/Objective: What did the client need and what were the requirements?
  2. The Solution: Detail the materials used, the specific fabrication techniques, and installation approach.
  3. The Result: Describe the visual impact, durability, and how it enhances the client's brand.
  
  Do NOT use markdown headers (like ##). Use paragraph breaks.
  Do NOT include "Title:" or "Client:" labels, just the narrative text.`;

  const userPrompt = `Write a project description for:
  Project Name: ${params.title}
  Client: ${params.client}
  Location: ${params.location}
  Signage Type: ${params.type}
  Special Challenges/Notes: ${params.challenges || 'N/A'}
  
  Focus on how this project enhances the client's brand visibility in ${params.location}.`;

  return await generateContentResolved(systemPrompt, userPrompt, model);
}

// =============================================
// AGENT 5: INTERNAL LINKING EXPERT (Trích xuất từ khóa)
// =============================================
export async function extractKeywordsForLinking(
  title: string,
  description: string,
  content: string
): Promise<string[]> {
  const config = await getAllConfig();
  const model = config.researcher_model || 'gpt-4o-mini';

  const systemPrompt = `You are an SEO Internal Linking Specialist.
  Analyze the provided content and extract 3-5 distinct, high-value keywords or phrases that naturally represent this content.
  These keywords will be used as "anchor text" to link FROM other pages TO this page.

  RULES:
  1. Keywords must be natural phrases (2-4 words usually).
  2. Avoid generic terms like "product", "signage" (too broad).
  3. Use specific material names, product types, or service names found in the content.
  4. Return ONLY a JSON array of strings. No markdown.

  Example:
  Input: "Acrylic LED signage for outdoor use..."
  Output: ["acrylic LED signage", "outdoor lighted signs", "custom acrylic signs"]`;

  const userPrompt = `Page Title: ${title}
  Description: ${description}
  Content Snippet: ${content.substring(0, 1000)}...

  Extract 3-5 keywords:`;

  try {
    const result = await generateContentResolved(systemPrompt, userPrompt, model);
    const cleaned = result?.replace(/```json/g, '').replace(/```/g, '').trim() || '[]';
    const keywords: string[] = JSON.parse(cleaned);
    return Array.isArray(keywords) ? keywords.slice(0, 5) : [];
  } catch (e) {
    console.error('Error extracting keywords:', e);
    return [];
  }
}
