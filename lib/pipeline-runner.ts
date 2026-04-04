import {
  runAgentAutoResearch,
  runAgentSeoResearch,
  runAgentContentStrategist,
  runAgentContentWriter,
  runAgentSeoOptimizer,
  runAgentQualityReviewer,
  runAgentImageGenerator,
  createPipelineRun,
  updatePipelineRun,
  ResearchTopic,
  EvaluatedTopic,
  WriterOutput,
  SeoOptimizerOutput,
  VisualizerOutput,
} from '@/lib/ai-agents';
import { supabaseAdmin } from '@/lib/supabase';

type PipelineStatus = 'running' | 'success' | 'failed' | 'info';

export interface PipelineEvent {
  agent: string;
  step: string;
  status: PipelineStatus;
  message: string;
  data?: unknown;
}

interface ExecutePipelineOptions {
  triggerType?: 'manual' | 'scheduled';
  onEvent?: (event: PipelineEvent) => void;
}

interface ExecutePipelineResult {
  batchId: string;
  status: 'completed' | 'partial' | 'failed' | 'phase1_done';
  articlesCreated: number;
  imagesGenerated: number;
}

// =============================================
// Shared timeout helper
// =============================================
async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(`${label} timeout after ${ms / 1000}s`)), ms);
      })
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

async function getTimeoutConfig() {
  const { data: timeoutConfig } = await supabaseAdmin
    .from('ai_config')
    .select('key, value')
    .in('key', [
      'pipeline_auto_research_timeout_seconds',
      'pipeline_seo_research_timeout_seconds',
      'pipeline_strategist_timeout_seconds',
      'pipeline_content_writer_timeout_seconds',
      'pipeline_seo_optimizer_timeout_seconds',
      'pipeline_quality_reviewer_timeout_seconds',
      'pipeline_image_generator_timeout_seconds',
      // Legacy keys for backward compat
      'pipeline_research_timeout_seconds',
      'pipeline_evaluator_timeout_seconds',
      'pipeline_writer_timeout_seconds',
      'pipeline_visual_timeout_seconds'
    ]);

  const tm = (timeoutConfig || []).reduce((acc, item) => {
    acc[item.key] = item.value;
    return acc;
  }, {} as Record<string, string>);

  return {
    autoResearchTimeoutMs: Math.max(60000, (parseInt(tm.pipeline_auto_research_timeout_seconds || tm.pipeline_research_timeout_seconds || '180', 10) || 180) * 1000),
    seoResearchTimeoutMs: Math.max(60000, (parseInt(tm.pipeline_seo_research_timeout_seconds || tm.pipeline_evaluator_timeout_seconds || '180', 10) || 180) * 1000),
    strategistTimeoutMs: Math.max(60000, (parseInt(tm.pipeline_strategist_timeout_seconds || '180', 10) || 180) * 1000),
    contentWriterTimeoutMs: Math.max(120000, (parseInt(tm.pipeline_content_writer_timeout_seconds || tm.pipeline_writer_timeout_seconds || '420', 10) || 420) * 1000),
    seoOptimizerTimeoutMs: Math.max(60000, (parseInt(tm.pipeline_seo_optimizer_timeout_seconds || '180', 10) || 180) * 1000),
    qualityReviewerTimeoutMs: Math.max(60000, (parseInt(tm.pipeline_quality_reviewer_timeout_seconds || '180', 10) || 180) * 1000),
    imageGeneratorTimeoutMs: Math.max(120000, (parseInt(tm.pipeline_image_generator_timeout_seconds || tm.pipeline_visual_timeout_seconds || '360', 10) || 360) * 1000),
  };
}

// =============================================
// Phase 1: Auto-Research + SEO Research (~30-60s)
// =============================================
export async function executePipelinePhase1(options: ExecutePipelineOptions = {}): Promise<ExecutePipelineResult> {
  const { triggerType = 'scheduled', onEvent } = options;
  const emit = (event: PipelineEvent) => onEvent?.(event);

  let pipelineRun: { id: string } | null = null;
  let batchId = '';

  try {
    pipelineRun = await createPipelineRun(triggerType);
    if (!pipelineRun?.id) throw new Error('Failed to initialize pipeline run record');
    batchId = pipelineRun.id;

    emit({ agent: 'System', step: 'init', status: 'running', message: 'Phase 1: Nghiên cứu & Đánh giá...' });

    const timeouts = await getTimeoutConfig();

    // --- Auto-Research Analyst ---
    emit({ agent: 'Auto-Research Analyst', step: 'start', status: 'running', message: 'Đang nghiên cứu từ khóa và xu hướng thị trường (Perplexity)...' });
    const research = await withTimeout(runAgentAutoResearch(batchId), timeouts.autoResearchTimeoutMs, 'Auto-Research Analyst');
    const researchData = research.data as ResearchTopic[] | undefined;

    if (!research.success || !researchData?.length) {
      emit({ agent: 'Auto-Research Analyst', step: 'complete', status: 'failed', message: research.message || 'Không tìm thấy chủ đề nào' });
      await updatePipelineRun(batchId, { status: 'failed', completed_at: new Date().toISOString(), error_log: 'Auto-Research returned no results' });
      return { batchId, status: 'failed', articlesCreated: 0, imagesGenerated: 0 };
    }

    emit({ agent: 'Auto-Research Analyst', step: 'complete', status: 'success', message: research.message, data: { topics_found: researchData.length } });
    await updatePipelineRun(batchId, { topics_found: researchData.length });

    // --- SEO Research Expert ---
    emit({ agent: 'SEO Research Expert', step: 'start', status: 'running', message: 'Đang đánh giá và lọc chủ đề (Perplexity)...' });
    const evaluation = await withTimeout(runAgentSeoResearch(batchId, researchData), timeouts.seoResearchTimeoutMs, 'SEO Research Expert');
    const evaluationData = evaluation.data as EvaluatedTopic[] | undefined;

    if (!evaluation.success || !evaluationData?.length) {
      emit({ agent: 'SEO Research Expert', step: 'complete', status: 'failed', message: evaluation.message || 'Không có chủ đề nào đạt yêu cầu' });
      await updatePipelineRun(batchId, { status: 'partial', completed_at: new Date().toISOString(), topics_approved: 0, error_log: 'No topics passed evaluation' });
      return { batchId, status: 'partial', articlesCreated: 0, imagesGenerated: 0 };
    }

    emit({ agent: 'SEO Research Expert', step: 'complete', status: 'success', message: evaluation.message, data: { approved: evaluationData.length } });

    await updatePipelineRun(batchId, {
      status: 'phase1_done',
      topics_approved: evaluationData.length,
      details: {
        approved_topics: evaluationData,
        topics_written: [],
      }
    });

    emit({ agent: 'System', step: 'complete', status: 'success', message: `Phase 1 hoàn thành! ${evaluationData.length} chủ đề đã duyệt, chờ Phase 2 viết bài.` });
    return { batchId, status: 'phase1_done', articlesCreated: 0, imagesGenerated: 0 };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    emit({ agent: 'System', step: 'complete', status: 'failed', message: `Phase 1 lỗi: ${errorMsg}` });
    if (batchId) {
      await updatePipelineRun(batchId, { status: 'failed', completed_at: new Date().toISOString(), error_log: errorMsg });
    }
    return { batchId, status: 'failed', articlesCreated: 0, imagesGenerated: 0 };
  }
}

// =============================================
// Phase 2: Strategy + Write + SEO + QA + Image for ONE topic
// =============================================
export async function executePipelinePhase2(
  runId: string,
  options: ExecutePipelineOptions = {}
): Promise<ExecutePipelineResult> {
  const { onEvent } = options;
  const emit = (event: PipelineEvent) => onEvent?.(event);
  const batchId = runId;

  let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  let currentStage = 'Phase 2 Init';

  try {
    const { data: run } = await supabaseAdmin
      .from('ai_pipeline_runs')
      .select('details, articles_created, images_generated, error_log')
      .eq('id', runId)
      .single();

    if (!run?.details) throw new Error('Pipeline run not found or missing details');

    const details = run.details as {
      approved_topics: EvaluatedTopic[];
      topics_written: string[];
      phase2_retries?: number;
    };

    const phase2Retries = details.phase2_retries || 0;
    const MAX_PHASE2_RETRIES = 3;
    if (phase2Retries >= MAX_PHASE2_RETRIES) {
      await updatePipelineRun(batchId, {
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_log: `Phase 2 thất bại sau ${MAX_PHASE2_RETRIES} lần thử lại`
      });
      emit({ agent: 'System', step: 'complete', status: 'failed', message: `Phase 2 đã thử ${MAX_PHASE2_RETRIES} lần nhưng vẫn lỗi.` });
      return { batchId, status: 'failed', articlesCreated: 0, imagesGenerated: 0 };
    }

    const approvedTopics = details.approved_topics || [];
    const writtenKeywords = new Set(details.topics_written || []);

    const nextTopic = approvedTopics.find(t => !writtenKeywords.has(t.keyword));
    if (!nextTopic) {
      await updatePipelineRun(batchId, { status: 'completed', completed_at: new Date().toISOString() });
      emit({ agent: 'System', step: 'complete', status: 'success', message: 'Tất cả chủ đề đã được viết xong!' });
      return { batchId, status: 'completed', articlesCreated: 0, imagesGenerated: 0 };
    }

    await updatePipelineRun(batchId, {
      status: 'running',
      details: { ...details, phase2_retries: phase2Retries + 1 }
    });

    emit({ agent: 'System', step: 'init', status: 'running', message: `Phase 2: Viết bài "${nextTopic.keyword}" (lần ${phase2Retries + 1})...` });

    heartbeatTimer = setInterval(() => {
      emit({ agent: 'System', step: 'heartbeat', status: 'running', message: `Phase 2 đang xử lý: ${currentStage}` });
    }, 15000);

    const timeouts = await getTimeoutConfig();
    let articlesCreated = run.articles_created || 0;
    let imagesGenerated = run.images_generated || 0;

    // --- Step 1: Content Strategist ---
    currentStage = 'Content Strategist';
    emit({ agent: 'Content Strategist', step: 'start', status: 'running', message: `Tạo content brief cho: "${nextTopic.keyword}"...` });
    const strategist = await withTimeout(runAgentContentStrategist(batchId, nextTopic), timeouts.strategistTimeoutMs, `ContentStrategist(${nextTopic.keyword})`);

    if (!strategist.success) {
      emit({ agent: 'Content Strategist', step: 'complete', status: 'failed', message: `Lỗi tạo brief: ${strategist.message}` });
      // Skip topic on strategist failure
      writtenKeywords.add(nextTopic.keyword);
      const hasMore = approvedTopics.some(t => !writtenKeywords.has(t.keyword));
      await updatePipelineRun(batchId, {
        status: hasMore ? 'phase1_done' : 'partial',
        completed_at: hasMore ? undefined : new Date().toISOString(),
        details: { ...details, topics_written: Array.from(writtenKeywords), phase2_retries: 0 }
      });
      return { batchId, status: hasMore ? 'phase1_done' : 'partial', articlesCreated, imagesGenerated };
    }
    emit({ agent: 'Content Strategist', step: 'complete', status: 'success', message: strategist.message });

    // --- Step 2: Content Writer ---
    currentStage = 'Content Writer';
    emit({ agent: 'Content Writer', step: 'start', status: 'running', message: `Viết bài: "${nextTopic.keyword}"...` });
    const writer = await withTimeout(
      runAgentContentWriter(batchId, nextTopic, strategist.data as any),
      timeouts.contentWriterTimeoutMs,
      `ContentWriter(${nextTopic.keyword})`
    );
    const writerData = writer.data as WriterOutput;

    if (!writer.success) {
      emit({ agent: 'Content Writer', step: 'complete', status: 'failed', message: `Lỗi viết bài: ${writer.message}` });
      writtenKeywords.add(nextTopic.keyword);
      const hasMore = approvedTopics.some(t => !writtenKeywords.has(t.keyword));
      await updatePipelineRun(batchId, {
        status: hasMore ? 'phase1_done' : 'partial',
        completed_at: hasMore ? undefined : new Date().toISOString(),
        details: { ...details, topics_written: Array.from(writtenKeywords), phase2_retries: 0 }
      });
      return { batchId, status: hasMore ? 'phase1_done' : 'partial', articlesCreated, imagesGenerated };
    }
    emit({ agent: 'Content Writer', step: 'complete', status: 'success', message: writer.message, data: { title: writerData.title } });

    // --- Step 3: SEO Optimizer ---
    currentStage = 'SEO Optimizer';
    emit({ agent: 'SEO Optimizer', step: 'start', status: 'running', message: `Tối ưu SEO cho: "${writerData.title}"...` });
    const seoResult = await withTimeout(
      runAgentSeoOptimizer(batchId, writerData, nextTopic),
      timeouts.seoOptimizerTimeoutMs,
      `SeoOptimizer(${writerData.title})`
    );
    const seoData = seoResult.success ? seoResult.data as SeoOptimizerOutput : undefined;
    emit({ agent: 'SEO Optimizer', step: 'complete', status: seoResult.success ? 'success' : 'failed', message: seoResult.message });

    // Apply SEO data to article
    if (seoData) {
      writerData.meta_title = seoData.meta_title || writerData.meta_title;
      writerData.meta_description = seoData.meta_description || writerData.meta_description;
      writerData.suggested_tags = seoData.suggested_tags?.length ? seoData.suggested_tags : writerData.suggested_tags;
    }

    // --- Step 4: Quality Reviewer ---
    currentStage = 'Quality Reviewer';
    emit({ agent: 'Quality Reviewer', step: 'start', status: 'running', message: `Đánh giá chất lượng: "${writerData.title}"...` });
    const qaResult = await withTimeout(
      runAgentQualityReviewer(batchId, writerData, nextTopic),
      timeouts.qualityReviewerTimeoutMs,
      `QualityReviewer(${writerData.title})`
    );

    if (qaResult.success) {
      const qaReport = qaResult.data as { seo_score: number; aio_score: number; strengths: string[]; issues: string[] };
      const avgScore = Math.round((qaReport.seo_score + qaReport.aio_score) / 2);
      writerData.quality_score = avgScore;
      writerData.quality_notes = [...(qaReport.strengths || []).slice(0, 3), ...(qaReport.issues || []).slice(0, 3)];
    }
    emit({ agent: 'Quality Reviewer', step: 'complete', status: qaResult.success ? 'success' : 'failed', message: qaResult.message });

    // --- Step 5: Image Generator ---
    currentStage = 'Image Generator';
    emit({ agent: 'Image Generator', step: 'start', status: 'running', message: `Tạo ảnh cho: "${writerData.title}"...` });
    const imageResult = await withTimeout(
      runAgentImageGenerator(batchId, nextTopic, writerData, seoData),
      timeouts.imageGeneratorTimeoutMs,
      `ImageGenerator(${writerData.title})`
    );
    const imageData = imageResult.data as VisualizerOutput;

    if (imageResult.success) {
      emit({ agent: 'Image Generator', step: 'complete', status: 'success', message: imageResult.message });
      articlesCreated++;
      imagesGenerated +=
        (imageData.generated_images?.length || 0)
        + (imageData.featured_image_url ? 1 : 0)
        + (imageData.thumbnail_image_url && imageData.thumbnail_image_url !== imageData.featured_image_url ? 1 : 0);
    } else {
      emit({ agent: 'Image Generator', step: 'complete', status: 'failed', message: `Lỗi tạo ảnh: ${imageResult.message}` });
    }

    // Update written topics
    writtenKeywords.add(nextTopic.keyword);
    const hasMoreTopics = approvedTopics.some(t => !writtenKeywords.has(t.keyword));
    const finalStatus = hasMoreTopics ? 'phase1_done' : (articlesCreated > 0 ? 'completed' : 'partial');

    await updatePipelineRun(batchId, {
      status: finalStatus,
      completed_at: hasMoreTopics ? undefined : new Date().toISOString(),
      articles_created: articlesCreated,
      images_generated: imagesGenerated,
      details: { ...details, topics_written: Array.from(writtenKeywords), phase2_retries: 0 }
    });

    const statusMsg = hasMoreTopics
      ? `Phase 2 xong 1 bài. Còn ${approvedTopics.length - writtenKeywords.size} chủ đề chờ viết.`
      : `Pipeline hoàn thành! Tạo ${articlesCreated} bài nháp.`;

    emit({ agent: 'System', step: 'complete', status: 'success', message: statusMsg });
    return { batchId, status: finalStatus as 'completed' | 'partial' | 'failed' | 'phase1_done', articlesCreated, imagesGenerated };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    emit({ agent: 'System', step: 'complete', status: 'failed', message: `Phase 2 lỗi: ${errorMsg}` });
    try {
      await updatePipelineRun(batchId, { status: 'phase1_done', error_log: `Phase 2 error: ${errorMsg}` });
    } catch { /* best effort */ }
    return { batchId, status: 'failed', articlesCreated: 0, imagesGenerated: 0 };
  } finally {
    if (heartbeatTimer) clearInterval(heartbeatTimer);

    try {
      const { data: run } = await supabaseAdmin
        .from('ai_pipeline_runs')
        .select('status')
        .eq('id', batchId)
        .single();

      if (run?.status === 'running') {
        await supabaseAdmin.from('ai_pipeline_runs').update({
          status: 'phase1_done',
          error_log: 'Phase 2 kết thúc bất thường - status vẫn "running"'
        }).eq('id', batchId);
      }
    } catch { /* best effort */ }
  }
}

// =============================================
// Full pipeline (manual trigger)
// =============================================
export async function executePipeline(options: ExecutePipelineOptions = {}): Promise<ExecutePipelineResult> {
  const { triggerType = 'manual', onEvent } = options;
  const emit = (event: PipelineEvent) => onEvent?.(event);

  let pipelineRun: { id: string } | null = null;
  let batchId = '';
  let currentStage = 'Khởi tạo';
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

  try {
    pipelineRun = await createPipelineRun(triggerType);
    if (!pipelineRun?.id) throw new Error('Failed to initialize pipeline run record');
    batchId = pipelineRun.id;

    emit({ agent: 'System', step: 'init', status: 'running', message: 'Khởi tạo AI Pipeline (7 Agents)...' });

    heartbeatTimer = setInterval(() => {
      emit({ agent: 'System', step: 'heartbeat', status: 'running', message: `Pipeline đang xử lý: ${currentStage}` });
    }, 15000);

    const timeouts = await getTimeoutConfig();

    // --- Agent 1: Auto-Research Analyst ---
    currentStage = 'Auto-Research Analyst';
    emit({ agent: 'Auto-Research Analyst', step: 'start', status: 'running', message: 'Đang nghiên cứu từ khóa và xu hướng (Perplexity)...' });
    const research = await withTimeout(runAgentAutoResearch(batchId), timeouts.autoResearchTimeoutMs, 'Auto-Research Analyst');
    const researchData = research.data as ResearchTopic[] | undefined;

    if (!research.success || !researchData?.length) {
      emit({ agent: 'Auto-Research Analyst', step: 'complete', status: 'failed', message: research.message || 'Không tìm thấy chủ đề nào' });
      await updatePipelineRun(batchId, { status: 'failed', completed_at: new Date().toISOString(), error_log: 'Auto-Research returned no results' });
      return { batchId, status: 'failed', articlesCreated: 0, imagesGenerated: 0 };
    }

    emit({ agent: 'Auto-Research Analyst', step: 'complete', status: 'success', message: research.message, data: { topics_found: researchData.length } });
    await updatePipelineRun(batchId, { topics_found: researchData.length });

    // --- Agent 2: SEO Research Expert ---
    currentStage = 'SEO Research Expert';
    emit({ agent: 'SEO Research Expert', step: 'start', status: 'running', message: 'Đang đánh giá và lọc chủ đề (Perplexity)...' });
    const evaluation = await withTimeout(runAgentSeoResearch(batchId, researchData), timeouts.seoResearchTimeoutMs, 'SEO Research Expert');
    const evaluationData = evaluation.data as EvaluatedTopic[] | undefined;

    if (!evaluation.success || !evaluationData?.length) {
      emit({ agent: 'SEO Research Expert', step: 'complete', status: 'failed', message: evaluation.message || 'Không có chủ đề nào đạt yêu cầu' });
      await updatePipelineRun(batchId, { status: 'partial', completed_at: new Date().toISOString(), topics_approved: 0, error_log: 'No topics passed evaluation' });
      return { batchId, status: 'partial', articlesCreated: 0, imagesGenerated: 0 };
    }

    emit({ agent: 'SEO Research Expert', step: 'complete', status: 'success', message: evaluation.message, data: { approved: evaluationData.length } });
    await updatePipelineRun(batchId, { topics_approved: evaluationData.length });

    const { data: configData } = await supabaseAdmin.from('ai_config').select('value').eq('key', 'articles_per_run').single();
    const maxArticles = parseInt(configData?.value || '2', 10) || 2;
    const topicsToProcess = evaluationData.slice(0, maxArticles);

    let articlesCreated = 0;
    let imagesGenerated = 0;

    for (let i = 0; i < topicsToProcess.length; i++) {
      const topic = topicsToProcess[i];

      try {
        // --- Agent 3: Content Strategist ---
        currentStage = `Content Strategist ${i + 1}/${topicsToProcess.length}`;
        emit({ agent: 'Content Strategist', step: 'start', status: 'running', message: `Tạo brief ${i + 1}/${topicsToProcess.length}: "${topic.keyword}"...` });
        const strategist = await withTimeout(runAgentContentStrategist(batchId, topic), timeouts.strategistTimeoutMs, `ContentStrategist(${topic.keyword})`);

        if (!strategist.success) {
          emit({ agent: 'Content Strategist', step: 'complete', status: 'failed', message: `Lỗi tạo brief: ${strategist.message}` });
          continue;
        }
        emit({ agent: 'Content Strategist', step: 'complete', status: 'success', message: strategist.message });

        // --- Agent 4: Content Writer ---
        currentStage = `Content Writer ${i + 1}/${topicsToProcess.length}`;
        emit({ agent: 'Content Writer', step: 'start', status: 'running', message: `Viết bài ${i + 1}/${topicsToProcess.length}: "${topic.keyword}"...` });
        const writer = await withTimeout(
          runAgentContentWriter(batchId, topic, strategist.data as any),
          timeouts.contentWriterTimeoutMs,
          `ContentWriter(${topic.keyword})`
        );
        const writerData = writer.data as WriterOutput;

        if (!writer.success) {
          emit({ agent: 'Content Writer', step: 'complete', status: 'failed', message: `Lỗi viết bài: ${writer.message}` });
          continue;
        }
        emit({ agent: 'Content Writer', step: 'complete', status: 'success', message: writer.message, data: { title: writerData.title } });

        // --- Agent 5: SEO Optimizer ---
        currentStage = `SEO Optimizer ${i + 1}/${topicsToProcess.length}`;
        emit({ agent: 'SEO Optimizer', step: 'start', status: 'running', message: `Tối ưu SEO: "${writerData.title}"...` });
        const seoResult = await withTimeout(
          runAgentSeoOptimizer(batchId, writerData, topic),
          timeouts.seoOptimizerTimeoutMs,
          `SeoOptimizer(${writerData.title})`
        );
        const seoData = seoResult.success ? seoResult.data as SeoOptimizerOutput : undefined;
        emit({ agent: 'SEO Optimizer', step: 'complete', status: seoResult.success ? 'success' : 'failed', message: seoResult.message });

        if (seoData) {
          writerData.meta_title = seoData.meta_title || writerData.meta_title;
          writerData.meta_description = seoData.meta_description || writerData.meta_description;
          writerData.suggested_tags = seoData.suggested_tags?.length ? seoData.suggested_tags : writerData.suggested_tags;
        }

        // --- Agent 6: Quality Reviewer ---
        currentStage = `Quality Reviewer ${i + 1}/${topicsToProcess.length}`;
        emit({ agent: 'Quality Reviewer', step: 'start', status: 'running', message: `Đánh giá chất lượng: "${writerData.title}"...` });
        const qaResult = await withTimeout(
          runAgentQualityReviewer(batchId, writerData, topic),
          timeouts.qualityReviewerTimeoutMs,
          `QualityReviewer(${writerData.title})`
        );

        if (qaResult.success) {
          const qaReport = qaResult.data as { seo_score: number; aio_score: number; strengths: string[]; issues: string[] };
          const avgScore = Math.round((qaReport.seo_score + qaReport.aio_score) / 2);
          writerData.quality_score = avgScore;
          writerData.quality_notes = [...(qaReport.strengths || []).slice(0, 3), ...(qaReport.issues || []).slice(0, 3)];
        }
        emit({ agent: 'Quality Reviewer', step: 'complete', status: qaResult.success ? 'success' : 'failed', message: qaResult.message });

        // --- Agent 7: Image Generator ---
        currentStage = `Image Generator ${i + 1}/${topicsToProcess.length}`;
        emit({ agent: 'Image Generator', step: 'start', status: 'running', message: `Tạo ảnh minh họa cho: "${writerData.title}"...` });
        const imageResult = await withTimeout(
          runAgentImageGenerator(batchId, topic, writerData, seoData),
          timeouts.imageGeneratorTimeoutMs,
          `ImageGenerator(${writerData.title})`
        );
        const imageData = imageResult.data as VisualizerOutput;

        if (!imageResult.success) {
          emit({ agent: 'Image Generator', step: 'complete', status: 'failed', message: `Lỗi tạo ảnh: ${imageResult.message}` });
          continue;
        }

        emit({ agent: 'Image Generator', step: 'complete', status: 'success', message: imageResult.message, data: { post_id: imageData.post_id } });

        articlesCreated++;
        imagesGenerated +=
          (imageData.generated_images?.length || 0)
          + (imageData.featured_image_url ? 1 : 0)
          + (imageData.thumbnail_image_url && imageData.thumbnail_image_url !== imageData.featured_image_url ? 1 : 0);
      } catch (topicError) {
        const topicErrorMsg = topicError instanceof Error ? topicError.message : String(topicError || 'Unknown topic error');
        emit({ agent: 'System', step: 'complete', status: 'failed', message: `Lỗi xử lý chủ đề "${topic.keyword}": ${topicErrorMsg}` });
        await supabaseAdmin.from('ai_pipeline_logs').insert({
          batch_id: batchId,
          agent_name: 'System',
          action: `Topic failed: ${topic.keyword}`,
          status: 'failed',
          details: { error: topicErrorMsg }
        });
      }
    }

    const finalStatus = articlesCreated > 0 ? 'completed' : 'partial';

    await updatePipelineRun(batchId, {
      status: finalStatus,
      completed_at: new Date().toISOString(),
      articles_created: articlesCreated,
      images_generated: imagesGenerated,
      details: { topics_processed: topicsToProcess.map((t) => t.keyword) }
    });

    emit({
      agent: 'System',
      step: 'complete',
      status: 'success',
      message: `Pipeline hoàn thành! Tạo ${articlesCreated} bài nháp. Vui lòng kiểm tra và đăng bài.`,
      data: { articles_created: articlesCreated, images_generated: imagesGenerated }
    });

    return { batchId, status: finalStatus, articlesCreated, imagesGenerated };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    emit({ agent: 'System', step: 'complete', status: 'failed', message: `Pipeline lỗi: ${errorMsg}` });

    if (pipelineRun && batchId) {
      await updatePipelineRun(batchId, { status: 'failed', completed_at: new Date().toISOString(), error_log: errorMsg });
    }

    return { batchId, status: 'failed', articlesCreated: 0, imagesGenerated: 0 };
  } finally {
    if (heartbeatTimer) clearInterval(heartbeatTimer);

    if (batchId) {
      try {
        const { data: run } = await supabaseAdmin
          .from('ai_pipeline_runs')
          .select('status')
          .eq('id', batchId)
          .single();

        if (run?.status === 'running') {
          await supabaseAdmin.from('ai_pipeline_runs').update({
            status: 'failed',
            completed_at: new Date().toISOString(),
            error_log: 'Pipeline kết thúc bất thường - status vẫn "running"'
          }).eq('id', batchId);
        }
      } catch { /* best effort */ }
    }
  }
}
