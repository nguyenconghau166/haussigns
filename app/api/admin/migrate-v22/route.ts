import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  const sql = `
    INSERT INTO ai_config (key, value, description) VALUES
      ('ai_request_timeout_ms', '120000', 'Timeout moi request AI (milliseconds)'),
      ('ai_request_retry_count', '1', 'So lan retry khi request AI bi timeout/loi tam thoi'),
      ('pipeline_research_timeout_seconds', '180', 'Timeout cho agent Researcher'),
      ('pipeline_evaluator_timeout_seconds', '180', 'Timeout cho agent Evaluator'),
      ('pipeline_writer_timeout_seconds', '420', 'Timeout cho agent Writer'),
      ('pipeline_visual_timeout_seconds', '360', 'Timeout cho agent Visual Inspector'),
      ('pipeline_last_run_at', '', 'Thoi diem chay cron pipeline gan nhat (ISO timestamp)'),
      ('schedule_interval', '24', 'Khoang cach chay cron pipeline (gio)'),
      ('schedule_enabled', 'false', 'Bat/tat auto scheduler pipeline'),
      ('site_url', 'https://signshaus.ph', 'Canonical site URL used for metadata, sitemap, RSS'),
      ('indexnow_key', '', 'IndexNow key for instant URL submission (optional)')
    ON CONFLICT (key) DO NOTHING;
  `;

  try {
    const { error } = await supabaseAdmin.rpc('exec_sql', { sql_query: sql });
    if (error) {
      if (error.message.includes('function exec_sql') || error.code === '42883') {
        return NextResponse.json({
          success: false,
          error: "Hàm 'exec_sql' không tồn tại. Vui lòng chạy các file schema_update_v20/v21/v22 thủ công."
        });
      }
      return NextResponse.json({ success: false, error: error.message });
    }

    return NextResponse.json({
      success: true,
      message: 'Applied scheduler, timeout, and SEO infra configs (v22 bundle).'
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message });
  }
}
