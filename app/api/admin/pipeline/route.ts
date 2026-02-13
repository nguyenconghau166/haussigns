import { NextResponse } from 'next/server';
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
  VisualizerOutput
} from '@/lib/ai-agents';
import { supabaseAdmin } from '@/lib/supabase';

export const maxDuration = 120; // Allow longer execution for pipeline

export async function POST() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const send = (agent: string, step: string, status: string, message: string, data?: any) => {
        const event = JSON.stringify({ agent, step, status, message, data, timestamp: new Date().toISOString() });
        controller.enqueue(encoder.encode(`data: ${event}\n\n`));
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let pipelineRun: any;
      let batchId: string;

      try {
        // Create pipeline run record
        pipelineRun = await createPipelineRun('manual');
        batchId = pipelineRun.id;

        send('System', 'init', 'running', 'Khởi tạo AI Pipeline...');

        // ===== AGENT 1: RESEARCHER =====
        send('Researcher', 'start', 'running', 'Đang nghiên cứu từ khóa và xu hướng thị trường...');

        const research = await runAgentResearcher(batchId);
        const researchData = research.data as ResearchTopic[] | undefined;

        if (!research.success || !researchData?.length) {
          send('Researcher', 'complete', 'failed', research.message || 'Không tìm thấy chủ đề nào');
          await updatePipelineRun(batchId, {
            status: 'failed',
            completed_at: new Date().toISOString(),
            error_log: 'Researcher returned no results'
          });
          send('System', 'complete', 'failed', 'Pipeline dừng: Không có dữ liệu nghiên cứu');
          controller.close();
          return;
        }

        send('Researcher', 'complete', 'success', research.message, {
          topics_found: researchData.length,
          topics: researchData.map((t) => ({
            keyword: t.keyword,
            volume: t.search_volume_estimate,
            intent: t.intent
          }))
        });

        await updatePipelineRun(batchId, { topics_found: researchData.length });

        // ===== AGENT 2: EVALUATOR =====
        send('Evaluator', 'start', 'running', 'Đang đánh giá và lọc chủ đề...');

        const evaluation = await runAgentEvaluator(batchId, researchData);
        const evaluationData = evaluation.data as EvaluatedTopic[] | undefined;

        if (!evaluation.success || !evaluationData?.length) {
          send('Evaluator', 'complete', 'failed', evaluation.message || 'Không có chủ đề nào đạt yêu cầu');
          await updatePipelineRun(batchId, {
            status: 'partial',
            completed_at: new Date().toISOString(),
            topics_approved: 0,
            error_log: 'No topics passed evaluation'
          });
          send('System', 'complete', 'info', 'Pipeline dừng: Tất cả chủ đề đã có hoặc không đạt điểm');
          controller.close();
          return;
        }

        send('Evaluator', 'complete', 'success', evaluation.message, {
          approved: evaluationData.length,
          topics: evaluationData.map((t) => ({
            keyword: t.keyword,
            score: t.score,
            action: t.recommended_action
          }))
        });

        await updatePipelineRun(batchId, { topics_approved: evaluationData.length });

        // Get the config for max articles
        const { data: configData } = await supabaseAdmin
          .from('ai_config')
          .select('value')
          .eq('key', 'articles_per_run')
          .single();

        const maxArticles = parseInt(configData?.value || '2');
        const topicsToProcess = evaluationData.slice(0, maxArticles);

        let articlesCreated = 0;
        let imagesGenerated = 0;

        for (let i = 0; i < topicsToProcess.length; i++) {
          const topic = topicsToProcess[i];

          // ===== AGENT 3: WRITER =====
          send('Writer', 'start', 'running', `Viết bài ${i + 1}/${topicsToProcess.length}: "${topic.keyword}"...`);

          const writer = await runAgentWriter(batchId, topic);
          const writerData = writer.data as WriterOutput;

          if (!writer.success) {
            send('Writer', 'complete', 'failed', `Lỗi viết bài: ${writer.message}`);
            continue;
          }

          send('Writer', 'complete', 'success', writer.message, {
            title: writerData.title,
            word_count: writerData.content?.split(/\s+/).length || 0
          });

          // ===== AGENT 4: VISUAL INSPECTOR =====
          send('Visual Inspector', 'start', 'running', `Tạo ảnh minh họa cho: "${writerData.title}"...`);

          const visualizer = await runAgentVisualInspector(batchId, topic, writerData);
          const visualizerData = visualizer.data as VisualizerOutput;

          if (!visualizer.success) {
            send('Visual Inspector', 'complete', 'failed', `Lỗi tạo ảnh: ${visualizer.message}`);
            continue;
          }

          send('Visual Inspector', 'complete', 'success', visualizer.message, {
            post_id: visualizerData.post_id,
            image_count: (visualizerData.generated_images?.length || 0) + 1 // +1 for featured image
          });

          articlesCreated++;
          imagesGenerated += (visualizerData.generated_images?.length || 0) + 1;
        }

        // Update pipeline run as completed
        await updatePipelineRun(batchId, {
          status: articlesCreated > 0 ? 'completed' : 'partial',
          completed_at: new Date().toISOString(),
          articles_created: articlesCreated,
          images_generated: imagesGenerated,
          details: {
            topics_processed: topicsToProcess.map((t) => t.keyword)
          }
        });

        send('System', 'complete', 'success',
          `Pipeline hoàn thành! Tạo ${articlesCreated} bài nháp. Vui lòng kiểm tra và đăng bài.`,
          { articles_created: articlesCreated, images_generated: imagesGenerated }
        );

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        const errorMsg = error.message || 'Unknown error';
        send('System', 'complete', 'failed', `Pipeline lỗi: ${errorMsg}`);

        if (pipelineRun) {
          await updatePipelineRun(batchId!, {
            status: 'failed',
            completed_at: new Date().toISOString(),
            error_log: errorMsg
          });
        }
      }

      controller.close();
    }
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
