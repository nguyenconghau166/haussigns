import { supabaseAdmin } from '@/lib/supabase';

export const revalidate = 3600;

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://signshaus.ph';

  const { data: posts } = await supabaseAdmin
    .from('posts')
    .select('title, slug')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(20);

  const recentArticles = (posts || [])
    .map((post) => `- ${post.title}: ${siteUrl}/blog/${post.slug}`)
    .join('\n');

  const body = [
    '# SignsHaus',
    '',
    '> SignsHaus provides signage design, fabrication, and installation services in Metro Manila.',
    '',
    '## Core Pages',
    `- Home: ${siteUrl}/`,
    `- Services: ${siteUrl}/services`,
    `- Materials: ${siteUrl}/services/materials`,
    `- Industries: ${siteUrl}/services/industries`,
    `- Contact: ${siteUrl}/contact`,
    `- Blog: ${siteUrl}/blog`,
    '',
    '## Latest Articles',
    recentArticles || '- No published articles yet',
    '',
    '## Sitemaps',
    `- XML Sitemap: ${siteUrl}/sitemap.xml`,
    `- RSS Feed: ${siteUrl}/rss.xml`,
  ].join('\n');

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
