import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { pathname } = await request.json();
    const today = new Date().toISOString().split('T')[0];

    // Try to find record for today
    const { data: existing, error } = await supabaseAdmin
      .from('analytics')
      .select('id, page_views')
      .eq('date', today)
      .maybeSingle(); // Use maybeSingle to avoid error if not found

    if (existing) {
      await supabaseAdmin
        .from('analytics')
        .update({ page_views: (existing.page_views || 0) + 1 })
        .eq('id', existing.id);
    } else {
      // Create new record for today
      await supabaseAdmin
        .from('analytics')
        .insert([{ date: today, page_views: 1, visitors: 1, source: 'direct' }]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics Error', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
