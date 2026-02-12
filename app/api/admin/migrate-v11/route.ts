import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  const sql = `
CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  type TEXT,
  message TEXT,
  file_url TEXT,
  status TEXT DEFAULT 'new',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_catalog.pg_policies 
        WHERE policyname = 'Public Insert Leads'
    ) THEN
        CREATE POLICY "Public Insert Leads" ON leads FOR INSERT WITH CHECK (true);
    END IF;
END
$$;
`;

  try {
      const { error } = await supabaseAdmin.rpc('exec_sql', { sql_query: sql });
      if (error) {
          if (error.message.includes('function exec_sql') || error.code === '42883') {
             return NextResponse.json({ 
                 success: false, 
                 error: "Hàm 'exec_sql' không tồn tại. Vui lòng chạy SQL thủ công." 
             });
          }
          return NextResponse.json({ success: false, error: error.message });
      }
      return NextResponse.json({ success: true });
  } catch (e: any) {
      return NextResponse.json({ success: false, error: e.message });
  }
}
