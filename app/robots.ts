import type { MetadataRoute } from 'next';

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://signshaus.ph';
}

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/blog', '/projects', '/services'],
        disallow: ['/admin/', '/api/'],
      },
    ],
    sitemap: [`${baseUrl}/sitemap.xml`, `${baseUrl}/rss.xml`],
    host: baseUrl,
  };
}
