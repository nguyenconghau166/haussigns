import { MetadataRoute } from 'next';

const baseUrl = 'https://signshaus.ph'; // Replace with your actual domain

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    '',
    '/about',
    '/contact',
    '/services/types',
    '/blog',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // In a real app, you would fetch these from Supabase
  const blogPosts = [
    'acrylic-signage-guide-2024',
    'neon-lights-trend',
    'signage-permit-process',
  ].map((slug) => ({
    url: `${baseUrl}/blog/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  const services = [
    'acrylic-signage',
    'stainless-steel',
    'neon-lights',
    'panaflex',
  ].map((slug) => ({
    url: `${baseUrl}/services/types/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.9, // High priority for product pages
  }));

  return [...routes, ...blogPosts, ...services];
}
