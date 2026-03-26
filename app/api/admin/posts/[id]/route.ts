import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase';
import { pingSearchEngines } from '@/lib/seo';
import { queueFacebookPosts } from '@/lib/facebook';

function refreshSeoPaths(slug: string) {
  revalidatePath('/blog');
  revalidatePath(`/blog/${slug}`);
  revalidatePath('/sitemap.xml');
  revalidatePath('/rss.xml');
}

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  const { data: post, error } = await supabaseAdmin
    .from('posts')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ post });
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const { data: post, error } = await supabaseAdmin
      .from('posts')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (post?.slug) {
      refreshSeoPaths(post.slug);
    }

    if (body.status === 'published' && post?.slug) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://signshaus.ph';
      const postUrl = `${siteUrl}/blog/${post.slug}`;
      pingSearchEngines([postUrl]).catch((err) => console.error('Ping error:', err));

      // Queue Facebook posts (30-minute delay, 2 fanpages)
      queueFacebookPosts(post).catch(err => console.error('FB queue error:', err));
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error('Server Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
