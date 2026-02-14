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

  if (provider === 'gemini') {
    const apiKey = config.GEMINI_API_KEY;
    // If configModel is provided, use it. Otherwise, let generateContentGemini use its default from DB/Env
    let model = configModel;
    if (model?.includes('gpt')) model = undefined; // Clear OpenAI model if switching to Gemini

    return await generateContentGemini(systemPrompt, userPrompt, model, apiKey);
  } else {
    // Default OpenAI
    return await generateContentOpenAI(systemPrompt, userPrompt, configModel);
  }
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
}

export interface VisualizerOutput {
  featured_image_url: string | null;
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
  const existingSlugs = existingPosts?.map(p => p.slug) || [];

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
  const cta = config.contact_cta || `Call ${phone} for a free consultation`;
  const focusAreas = config.seo_focus_areas || 'Metro Manila';
  const model = config.writer_model || 'gpt-4o';
  const competitors = config.competitors || '';

  // Get existing posts for context (avoid repetition)
  const { data: recentPosts } = await supabaseAdmin
    .from('posts')
    .select('title, excerpt')
    .order('created_at', { ascending: false })
    .limit(10);

  const langMap: Record<string, string> = {
    'en': 'English - Professional business tone',
    'tl': 'Tagalog - Conversational and friendly',
    'mix': 'Taglish - English-Tagalog mix, relatable local vibe'
  };

  const htmlFormatGuide = [
    'KHÔNG DÙNG Markdown (##, **, *, -, ```, >). TUYỆT ĐỐI KHÔNG.',
    'Dùng thẻ h2 và h3 cho tiêu đề phần',
    'Dùng thẻ p cho mỗi đoạn văn',
    'Dùng thẻ ul/li hoặc ol/li cho danh sách',
    'Dùng thẻ strong và em cho nhấn mạnh',
    'Dùng thẻ blockquote cho trích dẫn',
    'Dùng thẻ table/thead/tbody/tr/th/td cho bảng giá',
    'Dùng thẻ figure/figcaption nếu cần chú thích',
    'Viết mượt mà, tự nhiên, đọc như bài báo, KHÔNG liệt kê khô khan',
  ].map(line => `- ${line}`).join('\n');

  const systemPrompt = `Bạn là Senior Content Writer cho ${companyName}.

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

YÊU CẦU BÀI VIẾT:
1. Tối thiểu ${minWords} từ
2. Ngôn ngữ: ${langMap[language] || langMap['en']}
3. Giọng văn: ${tone}
4. CẤU TRÚC:
   - Phần mở đầu hook (2-3 câu thu hút)
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
   - Từ khóa chính "${topic.keyword}" xuất hiện 3-5 lần
   - Từ khóa phụ: ${topic.expanded_keywords?.join(', ')}
   - Sử dụng tên địa phương tự nhiên

8. ẢNH MINH HỌA TỰ ĐỘNG:
   - Chèn đúng 3 placeholder ảnh vào các vị trí chiến lược trong bài viết
   - Dùng cú pháp: ${'<!-- IMAGE: mô tả chi tiết bằng tiếng Anh cho AI tạo ảnh -->'}
   - Ví dụ: ${'<!-- IMAGE: modern LED channel letter signage installed on a glass storefront in Manila -->'}
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

  try {
    const result = await generateContentResolved(
      systemPrompt,
      `Viết bài cho từ khóa: "${topic.keyword}" - Lý do được chọn: ${topic.reason}`,
      model
    );

    const cleaned = result?.replace(/```json/g, '').replace(/```/g, '').trim() || '{}';
    const article: WriterOutput = JSON.parse(cleaned);

    await logAgent(batchId, 'Writer', `Hoàn thành: "${article.title}"`, 'success', {
      title: article.title,
      word_count: article.content?.split(/\s+/).length || 0,
      tags: article.suggested_tags
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
  const companyName = config.company_name || 'SignsHaus';

  try {
    // 1. Generate featured image
    const imgPrompt = `${imageStyle}, ${topic.keyword} signage in a modern Manila commercial building, professional quality, no text overlays, clean composition, cinematic lighting`;
    const featuredImageUrl = await generateProjectImage(imgPrompt);

    // 2. Find IMAGE placeholders and generate images for them
    let finalContent = article.content;
    const generatedImages: { location: string; url: string; alt: string }[] = [];

    // Extract all <!-- IMAGE: description --> placeholders from the HTML content
    const imagePlaceholderRegex = /<!-- IMAGE: (.+?) -->/g;
    const placeholders: { fullMatch: string; description: string }[] = [];
    let match;
    while ((match = imagePlaceholderRegex.exec(finalContent)) !== null) {
      placeholders.push({ fullMatch: match[0], description: match[1] });
    }

    if (placeholders.length > 0) {
      await logAgent(batchId, 'Visual Inspector', `Tìm thấy ${placeholders.length} vị trí chèn ảnh`, 'running');

      for (const placeholder of placeholders) {
        try {
          const imgPrompt = `${imageStyle}, ${placeholder.description}, professional quality, no text overlays, clean composition, cinematic lighting`;
          await logAgent(batchId, 'Visual Inspector', `Đang tạo ảnh: ${placeholder.description.substring(0, 50)}...`, 'running');
          const imgUrl = await generateProjectImage(imgPrompt);

          if (imgUrl) {
            generatedImages.push({
              location: placeholder.description,
              url: imgUrl,
              alt: placeholder.description
            });

            // Replace placeholder with <figure> HTML tag
            finalContent = finalContent.replace(
              placeholder.fullMatch,
              `<figure style="margin: 2em 0; text-align: center;"><img src="${imgUrl}" alt="${placeholder.description}" style="max-width: 100%; height: auto; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);" /><figcaption style="margin-top: 0.75em; font-size: 0.9em; color: #64748b; font-style: italic;">${placeholder.description}</figcaption></figure>`
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
    } else if (article.content && article.content.length > 1500) {
      // Fallback: If Writer didn't include placeholders, use AI analysis
      await logAgent(batchId, 'Visual Inspector', 'Không có placeholder, phân tích vị trí chèn ảnh...', 'running');

      const analysisPrompt = `Analyze this HTML article and suggest 2-3 image prompts.
        Article Title: "${article.title}"
        Content Snippet: ${article.content.substring(0, 3000)}...

        Return JSON ONLY:
        [
          {
            "insert_after_text": "a short unique sentence from the article to insert image after",
            "image_prompt": "${imageStyle}, specific realistic signage photo...",
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
          const imgUrl = await generateProjectImage(item.image_prompt);

          if (imgUrl) {
            generatedImages.push({ location: item.insert_after_text, url: imgUrl, alt: item.alt_text });
            const figureHtml = `<figure style="margin: 2em 0; text-align: center;"><img src="${imgUrl}" alt="${item.alt_text}" style="max-width: 100%; height: auto; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);" /><figcaption style="margin-top: 0.75em; font-size: 0.9em; color: #64748b; font-style: italic;">${item.alt_text}</figcaption></figure>`;

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

    // 3. Clean up: ensure all images have proper styling
    finalContent = finalContent.replace(/<img(?![^>]*style=)/g, '<img style="max-width: 100%; height: auto; border-radius: 8px;"');

    // 5. Save to DB as draft
    const slug = article.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const { data: post, error } = await supabaseAdmin.from('posts').upsert({
      title: article.title,
      slug: slug,
      content: finalContent, // Now HTML
      excerpt: article.excerpt,
      meta_title: article.meta_title,
      meta_description: article.meta_description,
      featured_image: featuredImageUrl,
      status: 'draft',
      seo_score: 85,
      tags: article.suggested_tags,
      lang: (await getConfig('content_language', 'en')) as 'en' | 'tl',
      created_at: new Date().toISOString()
    }, { onConflict: 'slug' }).select().single();

    if (error) throw error;

    await logAgent(batchId, 'Visual Inspector', `Lưu bản nháp thành công: "${article.title}"`, 'success', {
      post_id: post?.id,
      featured_image: featuredImageUrl,
      inline_images_count: generatedImages.length
    });

    return {
      success: true,
      data: {
        featured_image_url: featuredImageUrl,
        image_suggestions: [],
        generated_images: generatedImages,
        post_id: post?.id
      } as VisualizerOutput,
      message: `Lưu bản nháp thành công. Ảnh cover + ${generatedImages.length} ảnh minh họa.`
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
  
  Tone: Professional, confident, architectural, focusing on quality and craftsmanship.
  Structure:
  1. The Challenge/Objective
  2. The Solution (Materials, Technique)
  3. The Result (Visual impact)
  
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
