import { getPage, getProjects } from '@/lib/dataService';
import PortfolioClient from './PortfolioClient';
import { Metadata } from 'next';

export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage('portfolio');

  if (!page) {
    return {
      title: 'Our Portfolio | SignsHaus',
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

export default async function PortfolioPage() {
  const [page, projects] = await Promise.all([
    getPage('portfolio'),
    getProjects()
  ]);

  return <PortfolioClient page={page} initialProjects={projects || []} />;
}
