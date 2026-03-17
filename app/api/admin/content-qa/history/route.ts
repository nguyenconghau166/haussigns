import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const entityTable = request.nextUrl.searchParams.get('entityTable');
    const entityId = request.nextUrl.searchParams.get('entityId');
    const contentType = request.nextUrl.searchParams.get('contentType');
    const limit = Number(request.nextUrl.searchParams.get('limit') || '10');

    let query = supabaseAdmin
      .from('content_qa_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 50) : 10);

    if (entityTable) query = query.eq('entity_table', entityTable);
    if (entityId) query = query.eq('entity_id', entityId);
    if (contentType) query = query.eq('content_type', contentType);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ history: data || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch QA history' }, { status: 500 });
  }
}
