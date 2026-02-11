import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/'], // Block AI/Search from Admin and API
    },
    sitemap: 'https://signshaus.ph/sitemap.xml', // Replace with actual domain
  };
}
