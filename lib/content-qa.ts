import { supabaseAdmin } from './supabase';

export type QAContentType = 'material' | 'industry' | 'project' | 'page' | 'product';

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
    product: 350
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

  const overall = clamp(
    structure * 0.24 +
    depth * 0.24 +
    seo * 0.2 +
    clarity * 0.16 +
    trust * 0.16
  );

  const suggestions: string[] = [];
  if (h2Count < 2) suggestions.push('Add at least 2 H2 sections so users can scan the page quickly.');
  if (wordCount < targetWords[payload.contentType] * 0.75) suggestions.push(`Expand depth: target around ${targetWords[payload.contentType]} words for this content type.`);
  if (!hasMeta) suggestions.push('Add both meta title and meta description before publishing.');
  if (metaTitle && (metaTitleLen < 35 || metaTitleLen > 65)) suggestions.push('Keep meta title around 35-65 characters for stronger title-link quality.');
  if (metaDescription && (metaDescLen < 80 || metaDescLen > 170)) suggestions.push('Keep meta description around 80-170 characters with a clear value proposition.');
  if (avgSentenceWords > 24) suggestions.push('Shorten long sentences to improve readability and conversion clarity.');
  if (trust < 60) suggestions.push('Add concrete details: constraints, location context, numbers, and practical tradeoffs.');

  return {
    overall,
    breakdown: { structure, depth, seo, clarity, trust },
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
      suggestions: result.suggestions,
      source
    });
  } catch {
    // ignore if table not migrated yet
  }
}
