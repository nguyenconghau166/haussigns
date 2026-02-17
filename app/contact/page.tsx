import { getPage } from '@/lib/dataService';
import ContactClient from './ContactClient';
import { Metadata } from 'next';

export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage('contact');

  if (!page) {
    return {
      title: 'Contact Us | SignsHaus',
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

export default async function ContactPage() {
  const page = await getPage('contact');
  return <ContactClient page={page} />;
}
