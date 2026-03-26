import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  const sql = `
    CREATE TABLE IF NOT EXISTS keyword_research_history (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      seed_input TEXT,
      auto_discovery BOOLEAN NOT NULL DEFAULT false,
      seeds_used TEXT[] NOT NULL DEFAULT '{}',
      focus_areas TEXT NOT NULL DEFAULT 'Metro Manila',
      result_count INTEGER NOT NULL DEFAULT 0,
      avg_difficulty INTEGER NOT NULL DEFAULT 0,
      avg_opportunity INTEGER NOT NULL DEFAULT 0,
      transactional_count INTEGER NOT NULL DEFAULT 0,
      payload JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_keyword_research_history_created_at
      ON keyword_research_history(created_at DESC);

    ALTER TABLE keyword_research_history ENABLE ROW LEVEL SECURITY;

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'keyword_research_history'
          AND policyname = 'Admin All Keyword Research History'
      ) THEN
        CREATE POLICY "Admin All Keyword Research History"
        ON keyword_research_history
        FOR ALL
        USING (true);
      END IF;
    END$$;

    INSERT INTO ai_config (key, value, description) VALUES
      ('keyword_content_plan', '[]', 'Danh sach keyword da chon cho content plan')
    ON CONFLICT (key) DO NOTHING;
  `;

  try {
    const { error } = await supabaseAdmin.rpc('exec_sql', { sql_query: sql });
    if (error) {
      if (error.message.includes('function exec_sql') || error.code === '42883') {
        return NextResponse.json({
          success: false,
          error: "Ham 'exec_sql' khong ton tai. Vui long chay schema_update_v24_keyword_research.sql thu cong."
        });
      }
      return NextResponse.json({ success: false, error: error.message });
    }

    return NextResponse.json({
      success: true,
      message: 'Applied keyword research history + keyword plan schema (v23).'
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message });
  }
}
