/**
 * Pipeline Steps — 5-Step SEO 2026 Content Pipeline
 */

import { supabaseAdmin } from '../supabase';
import { generateProjectImage } from '../image-gen';
import { enforcePublishGate } from '../publish-gate';
import { queueFacebookPosts } from '../facebook';
import { pingSearchEngines } from '../seo';
import { buildClusterGapPrompt, linkKeywordToPost } from '../cluster-intelligence';
import type { PipelineEvent, SelectedTopic, ContentBrief, WrittenArticle, QualityReport, PublishedArticle } from './types';
import {
  getAllConfig, getConfig, generateContentResolved, parseJsonFromModel,
  logAgent, estimateWordCount, normalizeArticleHtml, selectCategoryId,
  injectInternalLinksIntoHtml, buildPhotorealisticPrompt,
  buildSeoAltText, getCategoryPostCounts, withTimeout
} from './utils';
import { buildTopicSelectionPrompt, buildContentBriefPrompt, buildWriteArticlePrompt, buildQualityCheckPrompt } from './prompts';
import { pickRandomAuthor } from './authors';

type Emit = (e: PipelineEvent) => void;

// =============================================
// STEP 1: Topic Selection (Perplexity)
// =============================================
export async function selectTopic(batchId: string, emit: Emit): Promise<SelectedTopic | null> {
  emit({ step: 'topic-selection', status: 'running', message: 'Researching trending topics...' });
  await logAgent(batchId, 'Topic Selection', 'Starting topic research', 'running');

  const config = await getAllConfig();
  const model = config.agent_auto_research_model || 'sonar-pro';

  // Gather context
  const seedKeywords = config.target_keywords_seed || 'signage, business signs, LED signage, channel letters';
  const focusAreas = config.seo_focus_areas || 'Metro Manila, Philippines';
  const services = config.business_services || 'acrylic signs, stainless steel letters, LED channel letters, lightboxes';

  // Get existing titles for dedup
  const { data: existingPosts } = await supabaseAdmin
    .from('posts').select('title').order('created_at', { ascending: false }).limit(50);
  const existingTitles = (existingPosts || []).map(p => p.title).join('\n');

  // Get category post counts for balanced rotation
  const categoryPostCounts = await getCategoryPostCounts();

  // Get cluster gap context
  let clusterGapContext = '';
  try { clusterGapContext = await buildClusterGapPrompt(); } catch { /* optional */ }

  const { system, user } = buildTopicSelectionPrompt({
    services, focusAreas, seedKeywords, categoryPostCounts, existingTitles, clusterGapContext
  });

  try {
    const result = await generateContentResolved(system, user, model, 'perplexity');
    const topic = parseJsonFromModel<SelectedTopic | null>(result, null);

    if (!topic?.keyword) {
      await logAgent(batchId, 'Topic Selection', 'No valid topic found', 'failed');
      emit({ step: 'topic-selection', status: 'failed', message: 'No valid topic found' });
      return null;
    }

    await logAgent(batchId, 'Topic Selection', `Selected: "${topic.keyword}" (${topic.suggested_category})`, 'success', {
      keyword: topic.keyword, category: topic.suggested_category, intent: topic.search_intent, score: topic.score
    });
    emit({ step: 'topic-selection', status: 'success', message: `Topic: "${topic.keyword}" → ${topic.suggested_category}`, data: topic });
    return topic;
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    await logAgent(batchId, 'Topic Selection', `Error: ${msg}`, 'failed');
    emit({ step: 'topic-selection', status: 'failed', message: msg });
    return null;
  }
}

// =============================================
// STEP 2: Content Brief (Gemini)
// =============================================
export async function createBrief(batchId: string, topic: SelectedTopic, emit: Emit): Promise<ContentBrief | null> {
  emit({ step: 'content-brief', status: 'running', message: `Creating brief for "${topic.keyword}"...` });
  await logAgent(batchId, 'Content Brief', `Creating brief for "${topic.keyword}"`, 'running');

  const config = await getAllConfig();
  const model = config.agent_content_strategist_model || 'gemini-2.0-flash';
  const companyName = config.company_name || 'Haus Signs';

  // Get recent posts for internal linking
  const { data: recentPosts } = await supabaseAdmin
    .from('posts').select('title, slug').eq('status', 'published').order('created_at', { ascending: false }).limit(10);

  const { system, user } = buildContentBriefPrompt({
    topic: { keyword: topic.keyword, search_intent: topic.search_intent, news_angle: topic.news_angle, suggested_category: topic.suggested_category },
    companyName,
    recentPosts: recentPosts || []
  });

  try {
    const result = await generateContentResolved(system, user, model);
    const brief = parseJsonFromModel<ContentBrief | null>(result, null);

    if (!brief?.outline?.length) {
      await logAgent(batchId, 'Content Brief', 'Invalid brief generated', 'failed');
      emit({ step: 'content-brief', status: 'failed', message: 'Failed to generate valid brief' });
      return null;
    }

    await logAgent(batchId, 'Content Brief', `Brief created: ${brief.outline.length} sections, ${brief.faq_questions?.length || 0} FAQs`, 'success');
    emit({ step: 'content-brief', status: 'success', message: `Brief: ${brief.outline.length} sections, intent: ${brief.search_intent}` });
    return brief;
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    await logAgent(batchId, 'Content Brief', `Error: ${msg}`, 'failed');
    emit({ step: 'content-brief', status: 'failed', message: msg });
    return null;
  }
}

// =============================================
// STEP 3: Write Article (Gemini)
// =============================================
export async function writeArticle(batchId: string, topic: SelectedTopic, brief: ContentBrief, emit: Emit): Promise<WrittenArticle | null> {
  emit({ step: 'write-article', status: 'running', message: `Writing article about "${topic.keyword}"...` });
  await logAgent(batchId, 'Write Article', `Writing "${topic.keyword}"`, 'running');

  const config = await getAllConfig();
  const model = config.agent_content_writer_model || config.writer_model || 'gemini-2.0-flash';
  const companyName = config.company_name || 'Haus Signs';

  // Get recent post titles for dedup
  const { data: recentPosts } = await supabaseAdmin
    .from('posts').select('title').order('created_at', { ascending: false }).limit(20);

  // Pick author for this article (biased by category)
  const articleAuthor = pickRandomAuthor(topic.suggested_category);

  const { system, user } = buildWriteArticlePrompt({
    topic: { keyword: topic.keyword, search_intent: topic.search_intent, news_angle: topic.news_angle },
    brief,
    companyName,
    description: config.company_description || 'Premium signage manufacturer in the Philippines',
    services: config.business_services || 'acrylic signs, stainless steel letters, LED channel letters, lightboxes',
    phone: config.business_phone || '+63 917 123 4567',
    address: config.business_address || 'Valenzuela, Metro Manila',
    focusAreas: config.seo_focus_areas || 'Metro Manila, Philippines',
    recentPostTitles: (recentPosts || []).map(p => p.title),
    authorName: articleAuthor.name,
    authorBio: `${articleAuthor.bio} — ${companyName}, Valenzuela, Metro Manila.`
  });

  try {
    const result = await generateContentResolved(system, user, model);
    const fallback: WrittenArticle = {
      title: `${topic.keyword} Guide`,
      content: `<h1>${topic.keyword}</h1><p>${topic.news_angle}</p>`,
      meta_title: `${topic.keyword} | ${companyName}`,
      meta_description: `Guide to ${topic.keyword} for businesses in Metro Manila.`,
      excerpt: `${topic.keyword} practical guide.`,
      suggested_tags: [topic.keyword],
      search_intent: topic.search_intent,
      suggested_category: topic.suggested_category
    };

    let article = parseJsonFromModel<WrittenArticle>(result, fallback);
    article.content = normalizeArticleHtml(article.content || '');
    article.search_intent = article.search_intent || topic.search_intent;
    article.suggested_category = article.suggested_category || topic.suggested_category;

    // Expand if too short
    const wordCount = estimateWordCount(article.content);
    if (wordCount < 1200) {
      emit({ step: 'write-article', status: 'running', message: `Expanding article (${wordCount} words → 1500+)...` });
      const expandPrompt = `Expand this HTML article to at least 1500 words while keeping the exact same structure (answer blocks, FAQ, comparison table, author block). Add more specific data points, examples, and details. Return JSON in the same format.\n\nCurrent:\n${JSON.stringify(article)}`;
      const expanded = await generateContentResolved(system, expandPrompt, model);
      const expandedArticle = parseJsonFromModel<WrittenArticle>(expanded, article);
      expandedArticle.content = normalizeArticleHtml(expandedArticle.content || article.content);
      article = expandedArticle;
    }

    const finalWordCount = estimateWordCount(article.content);
    await logAgent(batchId, 'Write Article', `Written: "${article.title}" (${finalWordCount} words)`, 'success', {
      title: article.title, word_count: finalWordCount, tags: article.suggested_tags
    });
    emit({ step: 'write-article', status: 'success', message: `"${article.title}" — ${finalWordCount} words` });
    return article;
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    await logAgent(batchId, 'Write Article', `Error: ${msg}`, 'failed');
    emit({ step: 'write-article', status: 'failed', message: msg });
    return null;
  }
}

// =============================================
// STEP 4: Quality Check + SEO (Gemini)
// =============================================
export async function checkQuality(batchId: string, article: WrittenArticle, topic: SelectedTopic, emit: Emit): Promise<QualityReport | null> {
  emit({ step: 'quality-check', status: 'running', message: 'Scoring quality + optimizing SEO...' });
  await logAgent(batchId, 'Quality Check', 'Scoring and optimizing', 'running');

  const config = await getAllConfig();
  const model = config.agent_quality_reviewer_model || 'gemini-2.0-flash';

  const { system, user } = buildQualityCheckPrompt({
    title: article.title,
    content: article.content,
    meta_title: article.meta_title,
    meta_description: article.meta_description,
    keyword: topic.keyword
  });

  const defaultReport: QualityReport = {
    seo_score: 70, aio_score: 70, overall: 70,
    has_answer_blocks: false, has_faq: false, has_comparison_table: false, has_author_block: false,
    meta_title_ok: true, meta_description_ok: true,
    optimized_meta_title: article.meta_title,
    optimized_meta_description: article.meta_description,
    optimized_tags: article.suggested_tags,
    issues: []
  };

  try {
    const result = await generateContentResolved(system, user, model);
    const report = parseJsonFromModel<QualityReport>(result, defaultReport);
    report.overall = Math.round((report.seo_score + report.aio_score) / 2);

    await logAgent(batchId, 'Quality Check', `SEO: ${report.seo_score}, AIO: ${report.aio_score}, Overall: ${report.overall}`, 'success', {
      seo_score: report.seo_score, aio_score: report.aio_score, issues: report.issues
    });
    emit({ step: 'quality-check', status: 'success', message: `Quality: SEO ${report.seo_score}/100, AIO ${report.aio_score}/100`, data: report });
    return report;
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    await logAgent(batchId, 'Quality Check', `Error: ${msg}`, 'failed');
    emit({ step: 'quality-check', status: 'failed', message: msg });
    return defaultReport; // Return default so pipeline continues
  }
}

// =============================================
// STEP 5: Generate Images + Publish
// =============================================
export async function generateImagesAndPublish(
  batchId: string,
  topic: SelectedTopic,
  article: WrittenArticle,
  quality: QualityReport,
  emit: Emit
): Promise<PublishedArticle | null> {
  emit({ step: 'image-publish', status: 'running', message: 'Generating images and publishing...' });
  await logAgent(batchId, 'Image + Publish', 'Starting image generation', 'running');

  const config = await getAllConfig();
  const companyName = config.company_name || 'Haus Signs';
  let finalContent = article.content;

  // --- Generate featured image ---
  let featuredImageUrl: string | null = null;
  let thumbnailImageUrl: string | null = null;
  const imageStyle = config.image_style || 'professional photography, modern urban setting';
  const baseCtx = `${imageStyle}, topic: ${topic.keyword}, article: ${article.title}, location: Metro Manila Philippines`;

  try {
    const featuredPrompt = buildPhotorealisticPrompt(baseCtx, 'hero wide-angle exterior shot, dramatic lighting, sign visible from street level');
    featuredImageUrl = await generateProjectImage(featuredPrompt, { contentType: 'post', keyword: topic.keyword });

    const thumbPrompt = buildPhotorealisticPrompt(baseCtx, 'close-up detail shot of sign materials, shallow depth of field');
    thumbnailImageUrl = await generateProjectImage(thumbPrompt, { contentType: 'post', keyword: topic.keyword });
  } catch (e) {
    console.error('Featured image generation failed:', e);
  }

  // --- Generate inline images from placeholders ---
  let inlineImagesCount = 0;
  const imageRegex = /<!-- IMAGE:\s*(.*?)\s*\|\s*(.*?)\s*-->/g;
  const matches = [...finalContent.matchAll(imageRegex)];

  for (const match of matches.slice(0, 4)) {
    const [fullMatch, prompt, caption] = match;
    try {
      emit({ step: 'image-publish', status: 'running', message: `Generating image: ${caption.substring(0, 50)}...` });
      const enhancedPrompt = buildPhotorealisticPrompt(prompt, '');
      const imageUrl = await generateProjectImage(enhancedPrompt, { contentType: 'post', keyword: topic.keyword });
      if (imageUrl) {
        const altText = buildSeoAltText(topic.keyword, caption);
        const imgHtml = `<figure class="article-image"><img src="${imageUrl}" alt="${altText}" loading="lazy" decoding="async" class="article-image" /><figcaption>${caption}</figcaption></figure>`;
        finalContent = finalContent.replace(fullMatch, imgHtml);
        inlineImagesCount++;
      }
    } catch { /* skip failed images */ }
  }
  // Remove any remaining unprocessed IMAGE placeholders
  finalContent = finalContent.replace(/<!-- IMAGE:.*?-->/g, '');

  // --- Add responsive image classes ---
  finalContent = finalContent
    .replace(/<img(?![^>]*class=)(?![^>]*article-image)/g, '<img class="article-image"')
    .replace(/<img(?![^>]*loading=)/g, '<img loading="lazy" decoding="async"');

  // --- Clean up any JSON-LD / schema markup from content ---
  // The blog page (app/blog/[slug]/page.tsx) generates schema via schema-builder.ts
  // and sanitizeHtml strips <script> tags, so any schema in content becomes visible raw JSON.
  // Remove: raw JSON-LD objects, <script> FAQ blocks, standalone schema text
  finalContent = finalContent
    .replace(/<script\s+type="application\/ld\+json">[^]*?<\/script>/gi, '')
    .replace(/\s*\{"@context"\s*:\s*"https?:\/\/schema\.org"[\s\S]*?\}\s*$/g, '')
    .replace(/\{"@context"\s*:\s*"https?:\/\/schema\.org"[^}]*"@type"\s*:\s*"FAQPage"[\s\S]*?\}\s*/g, '');

  // --- Internal links ---
  const { data: linkRules } = await supabaseAdmin
    .from('internal_linking_rules')
    .select('keyword, target_url, priority')
    .order('priority', { ascending: false }).limit(100);

  const slug = article.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const eligibleRules = (linkRules || []).filter(r => r.target_url && !r.target_url.endsWith(`/${slug}`));
  const linked = injectInternalLinksIntoHtml(finalContent, eligibleRules, 3);
  finalContent = linked.content;

  // --- Select category ---
  const categoryId = await selectCategoryId(article.suggested_category || topic.suggested_category, topic.keyword);

  // --- Use optimized meta from quality check ---
  const finalMetaTitle = quality.optimized_meta_title || article.meta_title;
  const finalMetaDescription = quality.optimized_meta_description || article.meta_description;
  const finalTags = quality.optimized_tags?.length ? quality.optimized_tags : article.suggested_tags;

  // --- Pick random author (biased by category) ---
  const author = pickRandomAuthor(article.suggested_category || topic.suggested_category);
  const authorName = config.author_name || author.name;
  const authorBio = config.author_bio || `${author.bio} — ${companyName}, Valenzuela, Metro Manila.`;

  const { data: post, error } = await supabaseAdmin.from('posts').upsert({
    title: article.title,
    slug,
    content: finalContent,
    excerpt: article.excerpt,
    meta_title: finalMetaTitle,
    meta_description: finalMetaDescription,
    featured_image: featuredImageUrl,
    cover_image: thumbnailImageUrl,
    status: 'draft',
    seo_score: quality.overall || 80,
    tags: finalTags,
    lang: (await getConfig('content_language', 'en')) as 'en' | 'tl',
    category_id: categoryId,
    search_intent: article.search_intent || topic.search_intent,
    author_name: authorName,
    author_bio: authorBio,
    created_at: new Date().toISOString()
  }, { onConflict: 'slug' }).select().single();

  if (error) {
    const msg = error.message || 'Database save failed';
    await logAgent(batchId, 'Image + Publish', `Error: ${msg}`, 'failed');
    emit({ step: 'image-publish', status: 'failed', message: msg });
    return null;
  }

  // --- Auto-publish if quality gate passes ---
  let autoPublished = false;
  const autoPublishEnabled = (await getConfig('auto_publish_enabled', 'false')) === 'true';

  if (autoPublishEnabled && post?.id) {
    try {
      const gateResult = await enforcePublishGate({
        title: article.title,
        content: finalContent,
        contentType: 'post' as const,
        metaTitle: finalMetaTitle,
        metaDescription: finalMetaDescription,
        featuredImage: featuredImageUrl || undefined,
      });

      if (gateResult.allowed) {
        await supabaseAdmin.from('posts').update({
          status: 'published',
          auto_published: true,
          published_at: new Date().toISOString(),
          publish_gate_result: gateResult
        }).eq('id', post.id);
        autoPublished = true;

        // Ping search engines + queue Facebook
        try { await pingSearchEngines([`https://signs.haus/blog/${slug}`]); } catch { /* optional */ }
        try { await queueFacebookPosts({ id: post.id, title: article.title, slug, excerpt: article.excerpt, featured_image: featuredImageUrl, tags: article.suggested_tags }); } catch { /* optional */ }
      }
    } catch { /* publish gate error, keep as draft */ }
  }

  // --- Link keyword to post for cluster tracking ---
  try { await linkKeywordToPost(topic.keyword, post.id, slug); } catch { /* optional */ }

  await logAgent(batchId, 'Image + Publish', `Saved: "${article.title}" (${autoPublished ? 'published' : 'draft'})`, 'success', {
    post_id: post.id, slug, featured_image: featuredImageUrl, inline_images: inlineImagesCount,
    internal_links: linked.inserted, auto_published: autoPublished, quality_score: quality.overall
  });

  emit({
    step: 'image-publish', status: 'success',
    message: `"${article.title}" — ${autoPublished ? 'Auto-published' : 'Saved as draft'} (score: ${quality.overall})`,
    data: { post_id: post.id, slug }
  });

  return {
    post_id: post.id,
    slug,
    featured_image_url: featuredImageUrl,
    inline_images_count: inlineImagesCount,
    auto_published: autoPublished,
    quality_score: quality.overall
  };
}
