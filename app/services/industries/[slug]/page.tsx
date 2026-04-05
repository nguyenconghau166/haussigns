import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CheckCircle, Layers } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { safeJsonLdStringify, sanitizeHtml } from '@/lib/security';
import { extractFaqFromContent, buildFaqSchema } from '@/lib/faq-schema';

export const dynamic = 'force-dynamic';

function slugifyHeading(value: string): string {
  return value.toLowerCase().replace(/<[^>]*>/g, '').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
}

function addHeadingIds(html: string): { html: string; toc: { id: string; text: string }[] } {
  const toc: { id: string; text: string }[] = [];
  const used = new Set<string>();
  const result = html.replace(/<h2([^>]*)>([\s\S]*?)<\/h2>/gi, (match, attrs, inner) => {
    const text = inner.replace(/<[^>]*>/g, '').trim();
    if (!text) return match;
    const base = slugifyHeading(text) || 'section';
    let id = base;
    let count = 1;
    while (used.has(id)) { count += 1; id = `${base}-${count}`; }
    used.add(id);
    toc.push({ id, text });
    return `<h2${attrs} id="${id}">${inner}</h2>`;
  });
  return { html: result, toc };
}

async function getIndustry(slug: string) {
  const { data, error } = await supabase
    .from('industries')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single();
  if (error || !data) return null;
  return data;
}

async function getRelatedContent(title: string) {
  const keywords = title.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
  const { data: materials } = await supabase
    .from('materials')
    .select('name, slug, description, image')
    .eq('is_published', true)
    .limit(4);
  const { data: projects } = await supabase
    .from('projects')
    .select('title, slug, description, featured_image')
    .limit(4);
  return { materials: materials || [], projects: projects || [] };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const item = await getIndustry(slug);
  if (!item) return { title: 'Industry Not Found' };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://signshaus.com';
  const pageUrl = `${siteUrl}/services/industries/${item.slug}`;

  return {
    title: item.meta_title || `${item.title} Signage Solutions | SignsHaus`,
    description: item.meta_description || item.description,
    alternates: { canonical: pageUrl },
    openGraph: {
      title: item.meta_title || `${item.title} Signage Solutions`,
      description: item.meta_description || item.description,
      url: pageUrl,
      images: item.image ? [{ url: item.image }] : [],
      type: 'website',
    },
  };
}

export default async function IndustryDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await getIndustry(slug);
  if (!item) notFound();

  const enriched = addHeadingIds(sanitizeHtml(item.content || '<p>Detailed content coming soon.</p>'));
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://signshaus.com';
  const pageUrl = `${siteUrl}/services/industries/${item.slug}`;
  const related = await getRelatedContent(item.title);

  // Extract FAQ from content
  const faqs = extractFaqFromContent(item.content || '');
  const faqSchema = buildFaqSchema(faqs);

  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: `Signage solutions for ${item.title}`,
    provider: { '@type': 'Organization', name: 'SignsHaus', url: siteUrl },
    areaServed: { '@type': 'City', name: 'Metro Manila' },
    description: item.description || '',
    image: item.image ? [item.image] : [],
    offers: { '@type': 'Offer', availability: 'https://schema.org/InStock' },
    url: pageUrl,
  };
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: 'Industries', item: `${siteUrl}/services/industries` },
      { '@type': 'ListItem', position: 3, name: item.title, item: pageUrl },
    ],
  };

  return (
    <main className="min-h-screen flex flex-col bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(serviceSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(breadcrumbSchema) }} />
      {faqSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(faqSchema) }} />}
      <Navbar />

      {/* Hero */}
      <section className="relative py-24 bg-slate-900 overflow-hidden">
        {item.image && (
          <div className="absolute inset-0 opacity-20 bg-cover bg-center" style={{ backgroundImage: `url(${item.image})` }} role="img" aria-label={`${item.title} signage solutions`} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
        <div className="container relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider mb-6">
              <Layers className="h-4 w-4" /> Industry Solution
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6 leading-tight">{item.title}</h1>
            <p className="text-xl text-slate-300 max-w-2xl leading-relaxed">{item.description}</p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-20">
        <div className="container grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            <div className="prose-blog max-w-none" dangerouslySetInnerHTML={{ __html: enriched.html }} />
          </div>
          <div className="space-y-8">
            {enriched.toc.length > 0 && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200">
                <h3 className="font-bold text-slate-900 mb-3 text-sm uppercase tracking-wide">On this page</h3>
                <ul className="space-y-2 text-sm">
                  {enriched.toc.map((section) => (
                    <li key={section.id}><a href={`#${section.id}`} className="text-slate-600 hover:text-amber-700 transition-colors">{section.text}</a></li>
                  ))}
                </ul>
              </div>
            )}
            {item.recommended && item.recommended.length > 0 && (
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-amber-500" /> Recommended Signage
                </h3>
                <ul className="space-y-3">
                  {item.recommended.map((rec: string, idx: number) => (
                    <li key={idx} className="flex items-center justify-between text-sm p-3 bg-white rounded-lg border border-slate-100 shadow-sm">
                      <span className="font-medium text-slate-700">{rec}</span>
                      <ArrowRight className="h-4 w-4 text-slate-300" />
                    </li>
                  ))}
                </ul>
                <Link href={`/contact?service=${item.slug}`} className="mt-6 block w-full text-center py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors">
                  Request Quote
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Related Materials */}
      {related.materials.length > 0 && (
        <section className="py-16 bg-slate-50">
          <div className="container">
            <h2 className="text-2xl font-extrabold text-slate-900 mb-8">Related Materials</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {related.materials.map((mat: any) => (
                <Link key={mat.slug} href={`/services/materials/${mat.slug}`} className="block rounded-xl border border-slate-200 bg-white p-4 hover:shadow-md hover:border-amber-200 transition-all">
                  {mat.image && <img src={mat.image} alt={`${mat.name} signage material`} className="w-full h-24 object-cover rounded-lg mb-3" />}
                  <p className="text-sm font-semibold text-slate-800">{mat.name}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Related Projects */}
      {related.projects.length > 0 && (
        <section className="py-16">
          <div className="container">
            <h2 className="text-2xl font-extrabold text-slate-900 mb-8">Related Projects</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {related.projects.map((proj: any) => (
                <Link key={proj.slug} href={`/projects/${proj.slug}`} className="block rounded-xl border border-slate-200 bg-white overflow-hidden hover:shadow-md hover:border-amber-200 transition-all">
                  {proj.featured_image && <img src={proj.featured_image} alt={`${proj.title} signage project`} className="w-full h-32 object-cover" />}
                  <div className="p-4">
                    <p className="text-sm font-semibold text-slate-800">{proj.title}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </main>
  );
}
