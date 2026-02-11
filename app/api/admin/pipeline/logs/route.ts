import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET: Fetch pipeline logs for a specific batch
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batch_id');

    if (!batchId) {
        return NextResponse.json({ error: 'batch_id is required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
        .from('ai_pipeline_logs')
        .select('*')
        .eq('batch_id', batchId)
        .order('created_at', { ascending: true });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ logs: data });
}
