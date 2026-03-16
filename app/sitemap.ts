import type { MetadataRoute } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

function getBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'https://signshaus.ph').replace(/\/$/, '');
}

type SlugRow = { slug: string; updated_at?: string; created_at?: string };

async function getRows(
  table: string,
  options?: { publishedOnly?: boolean; withUpdatedAt?: boolean }
): Promise<SlugRow[]> {
  const { publishedOnly = false, withUpdatedAt = false } = options || {};

  try {
    const baseQuery = withUpdatedAt
      ? supabaseAdmin.from(table).select('slug, created_at, updated_at')
      : supabaseAdmin.from(table).select('slug, created_at');

    let query = baseQuery.not('slug', 'is', null);
    if (publishedOnly) query = query.eq('status', 'published');

    const { data, error } = await query.limit(5000);
    if (error || !data) {
      console.error(`Failed to fetch sitemap data from ${table}:`, error?.message || 'Unknown error');
      return [];
    }
    return data as SlugRow[];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/projects`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/portfolio`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/services`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/services/types`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/services/materials`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/services/industries`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
  ];

  const [posts, services, materials, industries, projects] = await Promise.all([
    getRows('posts', { publishedOnly: true, withUpdatedAt: true }),
    getRows('services'),
    getRows('materials'),
    getRows('industries'),
    getRows('projects'),
  ]);

  const buildEntries = (rows: SlugRow[], basePath: string, changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'], priority: number) =>
    rows.map((row) => ({
      url: `${baseUrl}${basePath}/${row.slug}`,
      lastModified: row.updated_at ? new Date(row.updated_at) : row.created_at ? new Date(row.created_at) : new Date(),
      changeFrequency,
      priority,
    }));

  return [
    ...staticRoutes,
    ...buildEntries(posts, '/blog', 'daily', 0.8),
    ...buildEntries(services, '/services/types', 'monthly', 0.8),
    ...buildEntries(materials, '/services/materials', 'monthly', 0.7),
    ...buildEntries(industries, '/services/industries', 'monthly', 0.7),
    ...buildEntries(projects, '/projects', 'monthly', 0.7),
  ];
}
