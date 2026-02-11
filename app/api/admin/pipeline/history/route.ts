import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET: Fetch pipeline run history
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');

    let query = supabaseAdmin
        .from('ai_pipeline_runs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(limit);

    if (status) {
        query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ runs: data });
}
