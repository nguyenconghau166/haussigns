/**
 * Pipeline Runner — 5-Step SEO 2026 Content Pipeline Orchestrator
 * Generates 1 article per run. Called by cron (daily) or admin (manual).
 */

import type { PipelineEvent, PipelineResult } from './types';
import { createPipelineRun, updatePipelineRun, logAgent, withTimeout } from './utils';
import { selectTopic, createBrief, writeArticle, checkQuality, generateImagesAndPublish } from './steps';

export type { PipelineEvent } from './types';

export interface RunPipelineOptions {
  triggerType?: 'manual' | 'scheduled';
  onEvent?: (event: PipelineEvent) => void;
}

export async function runPipeline(options: RunPipelineOptions = {}): Promise<PipelineResult> {
  const { triggerType = 'manual', onEvent } = options;
  const emit = onEvent || (() => {});
  const startTime = Date.now();
  let batchId = '';

  try {
    const run = await createPipelineRun(triggerType);
    batchId = run.id;

    emit({ step: 'system', status: 'running', message: `Pipeline started (${triggerType})`, data: { batch_id: batchId } });

    // Step 1: Topic Selection (Perplexity) — 120s timeout
    const topic = await withTimeout(selectTopic(batchId, emit), 120000, 'Topic Selection');
    if (!topic) {
      await updatePipelineRun(batchId, { status: 'failed', completed_at: new Date().toISOString(), error_log: 'No valid topic found' });
      return { batch_id: batchId, status: 'failed', article: null, duration_ms: Date.now() - startTime };
    }

    // Step 2: Content Brief (Gemini) — 120s timeout
    const brief = await withTimeout(createBrief(batchId, topic, emit), 120000, 'Content Brief');
    if (!brief) {
      await updatePipelineRun(batchId, { status: 'failed', completed_at: new Date().toISOString(), error_log: 'Brief generation failed' });
      return { batch_id: batchId, status: 'failed', article: null, duration_ms: Date.now() - startTime };
    }

    // Step 3: Write Article (Gemini) — 300s timeout
    const article = await withTimeout(writeArticle(batchId, topic, brief, emit), 300000, 'Write Article');
    if (!article) {
      await updatePipelineRun(batchId, { status: 'failed', completed_at: new Date().toISOString(), error_log: 'Article writing failed' });
      return { batch_id: batchId, status: 'failed', article: null, duration_ms: Date.now() - startTime };
    }

    // Step 4: Quality Check + SEO (Gemini) — 120s timeout
    const quality = await withTimeout(checkQuality(batchId, article, topic, emit), 120000, 'Quality Check');

    // Step 5: Generate Images + Publish — 300s timeout
    const published = await withTimeout(
      generateImagesAndPublish(batchId, topic, article, quality!, emit),
      300000, 'Image + Publish'
    );

    // Update pipeline run
    const durationMs = Date.now() - startTime;
    await updatePipelineRun(batchId, {
      status: published ? 'completed' : 'failed',
      completed_at: new Date().toISOString(),
      articles_created: published ? 1 : 0,
      images_generated: published ? (published.inline_images_count + (published.featured_image_url ? 1 : 0)) : 0,
      details: {
        topic: topic.keyword,
        category: topic.suggested_category,
        intent: topic.search_intent,
        title: article.title,
        slug: published?.slug,
        quality_score: quality?.overall,
        auto_published: published?.auto_published,
        duration_ms: durationMs
      }
    });

    emit({
      step: 'system', status: 'success',
      message: `Pipeline completed in ${Math.round(durationMs / 1000)}s — "${article.title}"`,
      data: published
    });

    return {
      batch_id: batchId,
      status: published ? 'completed' : 'failed',
      article: published,
      duration_ms: durationMs
    };

  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    emit({ step: 'system', status: 'failed', message: `Pipeline error: ${msg}` });

    if (batchId) {
      try {
        await logAgent(batchId, 'System', `Pipeline failed: ${msg}`, 'failed');
        await updatePipelineRun(batchId, {
          status: 'failed', completed_at: new Date().toISOString(), error_log: msg
        });
      } catch { /* best effort */ }
    }

    return {
      batch_id: batchId,
      status: 'failed',
      article: null,
      duration_ms: Date.now() - startTime
    };
  }
}
