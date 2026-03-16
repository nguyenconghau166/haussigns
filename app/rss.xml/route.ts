import { supabaseAdmin } from '@/lib/supabase';

export const revalidate = 3600;

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://signshaus.ph';

  const { data: posts } = await supabaseAdmin
    .from('posts')
    .select('title, slug, excerpt, content, created_at, updated_at')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(50);

  const items = (posts || []).map((post) => {
    const description = post.excerpt || stripHtml(post.content || '').slice(0, 220);
    const link = `${siteUrl}/blog/${post.slug}`;
    const pubDate = new Date(post.updated_at || post.created_at).toUTCString();

    return `
      <item>
        <title>${escapeXml(post.title)}</title>
        <link>${link}</link>
        <guid>${link}</guid>
        <pubDate>${pubDate}</pubDate>
        <description>${escapeXml(description)}</description>
      </item>`;
  }).join('');

  const rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
  <channel>
    <title>SignsHaus Blog</title>
    <link>${siteUrl}/blog</link>
    <description>Latest signage insights, guides, and case studies from SignsHaus</description>
    <language>en-ph</language>
    ${items}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
