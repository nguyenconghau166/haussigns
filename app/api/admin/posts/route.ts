import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { pingSearchEngines } from '@/lib/seo';

// GET: Fetch all posts
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ posts: data });
}

// POST: Create a new post
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, slug, content, excerpt, featured_image, status, lang, meta_title, meta_description } = body;

    const { data, error } = await supabaseAdmin
      .from('posts')
      .insert([
        {
          title,
          slug,
          content,
          excerpt,
          featured_image,
          status: status || 'draft',
          lang: lang || 'en',
          meta_title: meta_title || title,
          meta_description: meta_description || excerpt,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Ping search engines if published immediately
    if (status === 'published') {
      // Fire and forget - don't await strictly to slow down response
      pingSearchEngines().catch(err => console.error('Ping error:', err));
    }

    return NextResponse.json({ post: data });
  } catch (error) {
    console.error('Server Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH: Update a post (e.g., publish a draft)
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('posts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Ping search engines if status changed to published
    if (updates.status === 'published') {
      // Fire and forget
      pingSearchEngines().catch(err => console.error('Ping error:', err));
    }

    return NextResponse.json({ post: data });
  } catch (error) {
    console.error('Server Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE: Delete a post
export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('posts')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Server Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
