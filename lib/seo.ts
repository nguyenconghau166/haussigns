import { supabaseAdmin } from '@/lib/supabase';

function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'https://signshaus.ph').replace(/\/$/, '');
}

async function getConfigValue(key: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from('ai_config')
    .select('value')
    .eq('key', key)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error(`Failed to load config key ${key}:`, error.message);
    return null;
  }

  return data?.value || null;
}

async function getIndexNowKey(): Promise<string | null> {
  const dbKey = await getConfigValue('indexnow_key');
  return dbKey || process.env.INDEXNOW_KEY || null;
}

async function submitIndexNow(urls: string[]): Promise<boolean> {
  const key = await getIndexNowKey();
  if (!key) return false;

  const host = new URL(getSiteUrl()).host;
  const payload = {
    host,
    key,
    keyLocation: `${getSiteUrl()}/indexnow-key.txt`,
    urlList: urls,
  };

  try {
    const response = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload),
    });
    return response.ok;
  } catch (error) {
    console.error('IndexNow submission failed:', error);
    return false;
  }
}

/**
 * Ping search engines and optionally submit IndexNow URLs.
 */
export async function pingSearchEngines(urls: string[] = []): Promise<boolean> {
  const siteUrl = getSiteUrl();
  const sitemapUrl = `${siteUrl}/sitemap.xml`;

  const pingTargets = [
    `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`,
  ];

  try {
    await Promise.allSettled(pingTargets.map((target) => fetch(target)));
    if (urls.length > 0) {
      await submitIndexNow(urls);
    }

    console.log(`Search engines notified for sitemap: ${sitemapUrl}`);
    return true;
  } catch (error) {
    console.error('Failed to ping search engines:', error);
    return false;
  }
}
