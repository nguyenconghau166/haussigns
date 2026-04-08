import { supabaseAdmin } from './supabase';

export type QAContentType = 'material' | 'industry' | 'project' | 'page' | 'product' | 'post';

export interface QAPayload {
  title: string;
  description?: string;
  content: string;
  metaTitle?: string;
  metaDescription?: string;
  contentType: QAContentType;
  entityId?: string;
  entityTable?: string;
}

export interface QAResult {
  overall: number;
  breakdown: {
    structure: number;
    depth: number;
    seo: number;
    clarity: number;
    trust: number;
    aio: number;
  };
  suggestions: string[];
  metrics: {
    wordCount: number;
    paragraphCount: number;
    h2Count: number;
    h3Count: number;
  };
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

export function scoreContent(payload: QAPayload): QAResult {
  const plain = stripHtml(payload.content);
  const wordCount = plain ? plain.split(' ').length : 0;
  const paragraphCount = (payload.content.match(/<p\b/gi) || []).length;
  const h2Count = (payload.content.match(/<h2\b/gi) || []).length;
  const h3Count = (payload.content.match(/<h3\b/gi) || []).length;
  const listCount = (payload.content.match(/<(ul|ol)\b/gi) || []).length;
  const tableCount = (payload.content.match(/<table\b/gi) || []).length;
  const sentenceCount = Math.max(1, plain.split(/[.!?]+/).filter(Boolean).length);
  const avgSentenceWords = wordCount / sentenceCount;

  const targetWords: Record<QAContentType, number> = {
    material: 650,
    industry: 700,
    project: 450,
    page: 550,
    product: 350,
    post: 800
  };

  const depth = clamp((wordCount / targetWords[payload.contentType]) * 100);

  const structureRaw =
    (h2Count >= 2 ? 35 : h2Count > 0 ? 20 : 0) +
    (paragraphCount >= 6 ? 20 : paragraphCount >= 3 ? 10 : 0) +
    (listCount > 0 ? 20 : 0) +
    (h3Count > 0 ? 15 : 0) +
    (tableCount > 0 ? 10 : 0);
  const structure = clamp(structureRaw);

  const metaTitle = (payload.metaTitle || '').trim();
  const metaDescription = (payload.metaDescription || '').trim();
  const hasMeta = Boolean(metaTitle) && Boolean(metaDescription);
  const metaTitleLen = metaTitle.length;
  const metaDescLen = metaDescription.length;
  const seoRaw =
    (hasMeta ? 40 : 10) +
    (metaTitleLen >= 35 && metaTitleLen <= 65 ? 30 : metaTitleLen > 0 ? 15 : 0) +
    (metaDescLen >= 80 && metaDescLen <= 170 ? 30 : metaDescLen > 0 ? 15 : 0);
  const seo = clamp(seoRaw);

  const clarityRaw = 100 - Math.max(0, (avgSentenceWords - 22) * 3);
  const clarity = clamp(clarityRaw);

  const trustSignals =
    (/(Makati|BGC|Quezon City|Metro Manila)/i.test(payload.content) ? 20 : 0) +
    (/\d/.test(payload.content) ? 20 : 0) +
    (/(warranty|maintenance|lead time|installation|durability|material)/i.test(payload.content) ? 30 : 0) +
    (/(pros|cons|considerations|limitations)/i.test(payload.content) ? 30 : 0);
  const trust = clamp(trustSignals);

  // AIO dimension
  const hasQuickAnswer = /<div[^>]*class="[^"]*quick-answer[^"]*"/i.test(payload.content);
  const hasKeyTakeaways = /<div[^>]*class="[^"]*key-takeaways[^"]*"/i.test(payload.content);
  const hasSpeakable = /data-speakable/i.test(payload.content);
  const questionH2s = (payload.content.match(/<h2[^>]*>[^<]*\?<\/h2>/gi) || []).length;
  const questionH2Ratio = h2Count > 0 ? questionH2s / h2Count : 0;

  // Count data points (numbers with units: PHP, %, days, sqm, hours, etc.)
  const dataPointMatches = plain.match(/\d[\d,]*\.?\d*\s*(%|PHP|php|₱|days?|hours?|sqm|meters?|feet|inches|minutes?|weeks?|months?|years?|pesos?)/gi) || [];
  const dataPointCount = dataPointMatches.length;

  const aioRaw =
    (hasQuickAnswer ? 20 : 0) +
    (hasKeyTakeaways ? 20 : 0) +
    (hasSpeakable ? 10 : 0) +
    (questionH2Ratio >= 0.6 ? 20 : questionH2Ratio >= 0.4 ? 12 : questionH2Ratio > 0 ? 5 : 0) +
    (dataPointCount >= 10 ? 30 : dataPointCount >= 6 ? 20 : dataPointCount >= 3 ? 10 : 0);
  const aio = clamp(aioRaw);

  const overall = clamp(
    structure * 0.20 +
    depth * 0.20 +
    seo * 0.18 +
    clarity * 0.14 +
    trust * 0.14 +
    aio * 0.14
  );

  const suggestions: string[] = [];
  if (h2Count < 2) suggestions.push('Add at least 2 H2 sections so users can scan the page quickly.');
  if (wordCount < targetWords[payload.contentType] * 0.75) suggestions.push(`Expand depth: target around ${targetWords[payload.contentType]} words for this content type.`);
  if (!hasMeta) suggestions.push('Add both meta title and meta description before publishing.');
  if (metaTitle && (metaTitleLen < 35 || metaTitleLen > 65)) suggestions.push('Keep meta title around 35-65 characters for stronger title-link quality.');
  if (metaDescription && (metaDescLen < 80 || metaDescLen > 170)) suggestions.push('Keep meta description around 80-170 characters with a clear value proposition.');
  if (avgSentenceWords > 24) suggestions.push('Shorten long sentences to improve readability and conversion clarity.');
  if (trust < 60) suggestions.push('Add concrete details: constraints, location context, numbers, and practical tradeoffs.');

  if (!hasQuickAnswer) suggestions.push('Add a Quick Answer block (<div class="quick-answer">) with a 50-70 word self-contained answer.');
  if (!hasKeyTakeaways) suggestions.push('Add a Key Takeaways box (<div class="key-takeaways">) with 4-6 bullets containing specific numbers.');
  if (questionH2Ratio < 0.5) suggestions.push('Convert more H2 headings to question format (ending with ?) for better AIO citation potential.');
  if (dataPointCount < 6) suggestions.push('Increase entity density: add more specific data points (PHP costs, timelines, measurements) throughout the article.');
  if (!hasSpeakable) suggestions.push('Add data-speakable="true" attributes to key-takeaways and quick-answer divs.');

  return {
    overall,
    breakdown: { structure, depth, seo, clarity, trust, aio },
    suggestions,
    metrics: {
      wordCount,
      paragraphCount,
      h2Count,
      h3Count
    }
  };
}

export async function saveQAHistory(payload: QAPayload, result: QAResult, source: 'manual' | 'publish_check' | 'autofix') {
  try {
    await supabaseAdmin.from('content_qa_history').insert({
      entity_table: payload.entityTable || null,
      entity_id: payload.entityId || null,
      content_type: payload.contentType,
      title: payload.title,
      score_overall: result.overall,
      score_structure: result.breakdown.structure,
      score_depth: result.breakdown.depth,
      score_seo: result.breakdown.seo,
      score_clarity: result.breakdown.clarity,
      score_trust: result.breakdown.trust,
      score_aio: result.breakdown.aio,
      suggestions: result.suggestions,
      source
    });
  } catch {
    // ignore if table not migrated yet
  }
}
