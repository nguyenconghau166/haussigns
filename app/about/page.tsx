import { getPage } from '@/lib/dataService';
import AboutClient from './AboutClient';
import { Metadata } from 'next';

export const revalidate = 0; // Disable cache for now to see updates

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage('about');

  if (!page) {
    return {
      title: 'About Us | SignsHaus',
    };
  }

  return {
    title: page.meta_title || `${page.title} | SignsHaus`,
    description: page.meta_description,
    openGraph: {
      images: page.featured_image ? [page.featured_image] : [],
    },
  };
}

export default async function AboutPage() {
  const page = await getPage('about');
  return <AboutClient page={page} />;
}
