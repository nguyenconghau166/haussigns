import {
  runAgentResearcher,
  runAgentEvaluator,
  runAgentWriter,
  runAgentVisualInspector,
  createPipelineRun,
  updatePipelineRun,
  ResearchTopic,
  EvaluatedTopic,
  WriterOutput,
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
  status: 'completed' | 'partial' | 'failed';
  articlesCreated: number;
  imagesGenerated: number;
}

export async function executePipeline(options: ExecutePipelineOptions = {}): Promise<ExecutePipelineResult> {
  const { triggerType = 'manual', onEvent } = options;
  const emit = (event: PipelineEvent) => onEvent?.(event);

  let pipelineRun: { id: string } | null = null;
  let batchId = '';
  let currentStage = 'Khởi tạo';

  const withTimeout = async <T>(promise: Promise<T>, ms: number, label: string): Promise<T> => {
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
  };

  let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

  try {
    pipelineRun = await createPipelineRun(triggerType);
    if (!pipelineRun?.id) {
      throw new Error('Failed to initialize pipeline run record');
    }
    batchId = pipelineRun.id;

    emit({ agent: 'System', step: 'init', status: 'running', message: 'Khởi tạo AI Pipeline...' });

    heartbeatTimer = setInterval(() => {
      emit({ agent: 'System', step: 'heartbeat', status: 'running', message: `Pipeline đang xử lý: ${currentStage}` });
    }, 15000);

    const { data: timeoutConfig } = await supabaseAdmin
      .from('ai_config')
      .select('key, value')
      .in('key', [
        'pipeline_writer_timeout_seconds',
        'pipeline_visual_timeout_seconds',
        'pipeline_research_timeout_seconds',
        'pipeline_evaluator_timeout_seconds'
      ]);

    const timeoutMap = (timeoutConfig || []).reduce((acc, item) => {
      acc[item.key] = item.value;
      return acc;
    }, {} as Record<string, string>);

    const researchTimeoutMs = Math.max(60000, (parseInt(timeoutMap.pipeline_research_timeout_seconds || '180', 10) || 180) * 1000);
    const evaluatorTimeoutMs = Math.max(60000, (parseInt(timeoutMap.pipeline_evaluator_timeout_seconds || '180', 10) || 180) * 1000);
    const writerTimeoutMs = Math.max(120000, (parseInt(timeoutMap.pipeline_writer_timeout_seconds || '420', 10) || 420) * 1000);
    const visualTimeoutMs = Math.max(120000, (parseInt(timeoutMap.pipeline_visual_timeout_seconds || '360', 10) || 360) * 1000);

    currentStage = 'Researcher';
    emit({ agent: 'Researcher', step: 'start', status: 'running', message: 'Đang nghiên cứu từ khóa và xu hướng thị trường...' });
    const research = await withTimeout(runAgentResearcher(batchId), researchTimeoutMs, 'Researcher');
    const researchData = research.data as ResearchTopic[] | undefined;

    if (!research.success || !researchData?.length) {
      emit({ agent: 'Researcher', step: 'complete', status: 'failed', message: research.message || 'Không tìm thấy chủ đề nào' });
      await updatePipelineRun(batchId, {
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_log: 'Researcher returned no results'
      });
      emit({ agent: 'System', step: 'complete', status: 'failed', message: 'Pipeline dừng: Không có dữ liệu nghiên cứu' });
      return { batchId, status: 'failed', articlesCreated: 0, imagesGenerated: 0 };
    }

    emit({
      agent: 'Researcher',
      step: 'complete',
      status: 'success',
      message: research.message,
      data: {
        topics_found: researchData.length,
        topics: researchData.map((t) => ({ keyword: t.keyword, volume: t.search_volume_estimate, intent: t.intent }))
      }
    });

    await updatePipelineRun(batchId, { topics_found: researchData.length });

    currentStage = 'Evaluator';
    emit({ agent: 'Evaluator', step: 'start', status: 'running', message: 'Đang đánh giá và lọc chủ đề...' });
    const evaluation = await withTimeout(runAgentEvaluator(batchId, researchData), evaluatorTimeoutMs, 'Evaluator');
    const evaluationData = evaluation.data as EvaluatedTopic[] | undefined;

    if (!evaluation.success || !evaluationData?.length) {
      emit({ agent: 'Evaluator', step: 'complete', status: 'failed', message: evaluation.message || 'Không có chủ đề nào đạt yêu cầu' });
      await updatePipelineRun(batchId, {
        status: 'partial',
        completed_at: new Date().toISOString(),
        topics_approved: 0,
        error_log: 'No topics passed evaluation'
      });
      emit({ agent: 'System', step: 'complete', status: 'info', message: 'Pipeline dừng: Tất cả chủ đề đã có hoặc không đạt điểm' });
      return { batchId, status: 'partial', articlesCreated: 0, imagesGenerated: 0 };
    }

    emit({
      agent: 'Evaluator',
      step: 'complete',
      status: 'success',
      message: evaluation.message,
      data: {
        approved: evaluationData.length,
        topics: evaluationData.map((t) => ({ keyword: t.keyword, score: t.score, action: t.recommended_action }))
      }
    });

    await updatePipelineRun(batchId, { topics_approved: evaluationData.length });

    const { data: configData } = await supabaseAdmin
      .from('ai_config')
      .select('value')
      .eq('key', 'articles_per_run')
      .single();

    const maxArticles = parseInt(configData?.value || '2', 10) || 2;
    const topicsToProcess = evaluationData.slice(0, maxArticles);

    let articlesCreated = 0;
    let imagesGenerated = 0;

    for (let i = 0; i < topicsToProcess.length; i++) {
      const topic = topicsToProcess[i];

      try {
        currentStage = `Writer ${i + 1}/${topicsToProcess.length}`;
        emit({ agent: 'Writer', step: 'start', status: 'running', message: `Viết bài ${i + 1}/${topicsToProcess.length}: "${topic.keyword}"...` });

        const writer = await withTimeout(runAgentWriter(batchId, topic), writerTimeoutMs, `Writer(${topic.keyword})`);
        const writerData = writer.data as WriterOutput;

        if (!writer.success) {
          emit({ agent: 'Writer', step: 'complete', status: 'failed', message: `Lỗi viết bài: ${writer.message}` });
          continue;
        }

        emit({
          agent: 'Writer',
          step: 'complete',
          status: 'success',
          message: writer.message,
          data: {
            title: writerData.title,
            word_count: writerData.content?.split(/\s+/).length || 0
          }
        });

        currentStage = `Visual Inspector ${i + 1}/${topicsToProcess.length}`;
        emit({ agent: 'Visual Inspector', step: 'start', status: 'running', message: `Tạo ảnh minh họa cho: "${writerData.title}"...` });

        const visualizer = await withTimeout(
          runAgentVisualInspector(batchId, topic, writerData),
          visualTimeoutMs,
          `VisualInspector(${writerData.title})`
        );
        const visualizerData = visualizer.data as VisualizerOutput;

        if (!visualizer.success) {
          emit({ agent: 'Visual Inspector', step: 'complete', status: 'failed', message: `Lỗi tạo ảnh: ${visualizer.message}` });
          continue;
        }

        emit({
          agent: 'Visual Inspector',
          step: 'complete',
          status: 'success',
          message: visualizer.message,
          data: {
            post_id: visualizerData.post_id,
            image_count:
              (visualizerData.generated_images?.length || 0)
              + (visualizerData.featured_image_url ? 1 : 0)
              + (visualizerData.thumbnail_image_url && visualizerData.thumbnail_image_url !== visualizerData.featured_image_url ? 1 : 0)
          }
        });

        articlesCreated++;
        imagesGenerated +=
          (visualizerData.generated_images?.length || 0)
          + (visualizerData.featured_image_url ? 1 : 0)
          + (visualizerData.thumbnail_image_url && visualizerData.thumbnail_image_url !== visualizerData.featured_image_url ? 1 : 0);
      } catch (topicError) {
        const topicErrorMsg = topicError instanceof Error ? topicError.message : String(topicError || 'Unknown topic error');
        emit({ agent: 'Writer', step: 'complete', status: 'failed', message: `Lỗi xử lý chủ đề "${topic.keyword}": ${topicErrorMsg}` });
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
      await updatePipelineRun(batchId, {
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_log: errorMsg
      });
    }

    return { batchId, status: 'failed', articlesCreated: 0, imagesGenerated: 0 };
  } finally {
    if (heartbeatTimer) clearInterval(heartbeatTimer);
  }
}
