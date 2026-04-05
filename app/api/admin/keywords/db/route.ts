import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const intent = searchParams.get('intent');
    const cluster = searchParams.get('cluster');
    const minScore = Number(searchParams.get('min_score') || 0);
    const search = searchParams.get('search') || '';
    const limit = Math.min(500, Math.max(1, Number(searchParams.get('limit') || 200)));

    let query = supabaseAdmin
      .from('keywords')
      .select('*')
      .order('opportunity_score', { ascending: false })
      .limit(limit);

    if (status) query = query.eq('status', status);
    if (intent) query = query.eq('intent', intent);
    if (cluster) query = query.eq('cluster_name', cluster);
    if (minScore > 0) query = query.gte('opportunity_score', minScore);
    if (search) query = query.ilike('keyword', `%${search}%`);

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get distinct clusters
    const clusters = [...new Set((data || []).map((k) => k.cluster_name).filter(Boolean))];

    // Get stats
    const all = data || [];
    const stats = {
      total: all.length,
      discovered: all.filter((k) => k.status === 'discovered').length,
      planned: all.filter((k) => k.status === 'planned').length,
      in_progress: all.filter((k) => k.status === 'in_progress').length,
      published: all.filter((k) => k.status === 'published').length,
      skipped: all.filter((k) => k.status === 'skipped').length,
      avgOpportunity: all.length > 0 ? Math.round(all.reduce((s, k) => s + (k.opportunity_score || 0), 0) / all.length) : 0,
    };

    return NextResponse.json({ keywords: data || [], clusters, stats });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const ids = Array.isArray(body?.ids) ? body.ids : [body?.id].filter(Boolean);
    const updates: Record<string, unknown> = {};

    if (body.status !== undefined) updates.status = body.status;
    if (body.priority !== undefined) updates.priority = Number(body.priority);
    if (body.cluster_name !== undefined) updates.cluster_name = body.cluster_name || null;
    if (body.notes !== undefined) updates.notes = body.notes || null;
    if (body.target_post_id !== undefined) updates.target_post_id = body.target_post_id || null;
    updates.updated_at = new Date().toISOString();

    if (!ids.length || Object.keys(updates).length <= 1) {
      return NextResponse.json({ error: 'Missing ids or updates' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('keywords')
      .update(updates)
      .in('id', ids);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, updated: ids.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const ids = Array.isArray(body?.ids) ? body.ids : [body?.id].filter(Boolean);

    if (!ids.length) {
      return NextResponse.json({ error: 'Missing ids' }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from('keywords').delete().in('id', ids);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, deleted: ids.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
