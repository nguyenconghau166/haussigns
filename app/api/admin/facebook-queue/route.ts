import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cancelFacebookQueue } from '@/lib/facebook';

// GET: Fetch recent facebook queue items
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('facebook_queue')
    .select('id, post_id, page_key, page_name, caption, status, facebook_post_id, scheduled_at')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ items: data || [] });
}

// DELETE: Cancel pending queue items for a post
export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { post_id } = body;

    if (!post_id) {
      return NextResponse.json({ error: 'post_id is required' }, { status: 400 });
    }

    const cancelled = await cancelFacebookQueue(post_id);
    return NextResponse.json({ success: true, cancelled });
  } catch (error) {
    console.error('Cancel FB queue error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
