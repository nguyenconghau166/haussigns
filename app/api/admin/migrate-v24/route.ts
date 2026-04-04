import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  const results: string[] = [];

  try {
    // Seed default values for new pipeline v2 config keys
    const newConfigs = [
      // Agent models
      { key: 'agent_auto_research_model', value: 'sonar-pro', description: 'Model cho Auto-Research Analyst (Perplexity)' },
      { key: 'agent_seo_research_model', value: 'sonar-pro', description: 'Model cho SEO Research Expert (Perplexity)' },
      { key: 'agent_content_strategist_model', value: 'gemini-2.0-flash', description: 'Model cho Content Strategist (Gemini)' },
      { key: 'agent_content_writer_model', value: 'gemini-2.0-flash', description: 'Model cho Content Writer (Gemini)' },
      { key: 'agent_seo_optimizer_model', value: 'gemini-2.0-flash', description: 'Model cho SEO Optimizer (Gemini)' },
      { key: 'agent_quality_reviewer_model', value: 'gemini-2.0-flash', description: 'Model cho Quality Reviewer (Gemini)' },

      // Timeouts
      { key: 'pipeline_auto_research_timeout_seconds', value: '180', description: 'Timeout Auto-Research Analyst (giây)' },
      { key: 'pipeline_seo_research_timeout_seconds', value: '180', description: 'Timeout SEO Research Expert (giây)' },
      { key: 'pipeline_strategist_timeout_seconds', value: '180', description: 'Timeout Content Strategist (giây)' },
      { key: 'pipeline_content_writer_timeout_seconds', value: '420', description: 'Timeout Content Writer (giây)' },
      { key: 'pipeline_seo_optimizer_timeout_seconds', value: '180', description: 'Timeout SEO Optimizer (giây)' },
      { key: 'pipeline_quality_reviewer_timeout_seconds', value: '180', description: 'Timeout Quality Reviewer (giây)' },
      { key: 'pipeline_image_generator_timeout_seconds', value: '360', description: 'Timeout Image Generator (giây)' },

      // Watermark settings
      { key: 'watermark_enabled', value: 'true', description: 'Bật/tắt watermark tự động cho ảnh' },
      { key: 'watermark_text', value: 'SignsHaus', description: 'Chữ watermark gắn lên ảnh' },
      { key: 'watermark_opacity', value: '0.3', description: 'Độ mờ watermark (0.1-1.0)' },
      { key: 'watermark_position', value: 'bottom-right', description: 'Vị trí watermark (bottom-right, bottom-left, center)' },

      // Image gen settings
      { key: 'pipeline_min_inline_images', value: '2', description: 'Số ảnh minh họa tối thiểu trong bài' },
      { key: 'pipeline_max_inline_images', value: '5', description: 'Số ảnh minh họa tối đa trong bài' },
    ];

    for (const config of newConfigs) {
      const { error } = await supabaseAdmin
        .from('ai_config')
        .upsert(
          { key: config.key, value: config.value, description: config.description },
          { onConflict: 'key', ignoreDuplicates: true }
        );

      if (error) {
        results.push(`SKIP ${config.key}: ${error.message}`);
      } else {
        results.push(`OK ${config.key}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Migration v24 completed: Pipeline v2 config seeded',
      results
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: msg, results }, { status: 500 });
  }
}
