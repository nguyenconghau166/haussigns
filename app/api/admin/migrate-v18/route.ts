import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
    const sql = `
  ALTER TABLE posts ADD COLUMN IF NOT EXISTS facebook_post_id TEXT;
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
        return NextResponse.json({ success: true, message: 'Updated posts table with facebook_post_id' });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message });
    }
}
