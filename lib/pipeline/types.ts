/**
 * Pipeline Types — 5-Step SEO 2026 Content Pipeline
 */

export type PipelineStatus = 'running' | 'success' | 'failed' | 'info';
export type SearchIntent = 'informational' | 'commercial' | 'transactional' | 'comparison';

export interface PipelineEvent {
  step: string;
  status: PipelineStatus;
  message: string;
  data?: unknown;
}

// Step 1 output
export interface SelectedTopic {
  keyword: string;
  expanded_keywords: string[];
  news_angle: string;
  search_intent: SearchIntent;
  suggested_category: string;
  score: number;
  reason: string;
}

// Step 2 output
export interface ContentBrief {
  primary_keyword: string;
  secondary_keywords: string[];
  search_intent: SearchIntent;
  audience: string;
  pain_points: string[];
  outline: Array<{
    h2: string;
    answer_first: string;
    key_points: string[];
  }>;
  faq_questions: string[];
  comparison_table_topic: string;
  cta: string;
  internal_link_candidates: Array<{ title: string; url: string }>;
}

// Step 3 output
export interface WrittenArticle {
  title: string;
  content: string;
  meta_title: string;
  meta_description: string;
  excerpt: string;
  suggested_tags: string[];
  search_intent: SearchIntent;
  suggested_category: string;
}

// Step 4 output
export interface QualityReport {
  seo_score: number;
  aio_score: number;
  overall: number;
  has_answer_blocks: boolean;
  has_faq: boolean;
  has_comparison_table: boolean;
  has_author_block: boolean;
  meta_title_ok: boolean;
  meta_description_ok: boolean;
  optimized_meta_title: string;
  optimized_meta_description: string;
  optimized_tags: string[];
  issues: string[];
}

// Step 5 output
export interface PublishedArticle {
  post_id: string;
  slug: string;
  featured_image_url: string | null;
  inline_images_count: number;
  auto_published: boolean;
  quality_score: number;
}

// Pipeline result
export interface PipelineResult {
  batch_id: string;
  status: 'completed' | 'failed';
  article: PublishedArticle | null;
  duration_ms: number;
}

// Internal link rule (for injection)
export interface InternalLinkRule {
  keyword: string;
  target_url: string;
  priority?: number;
}
