'use client';

import { use, useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Loader2, ArrowRight, CheckCircle, Layers } from 'lucide-react';
import Link from 'next/link';
import { ShoppingBag, Building2, Utensils, Stethoscope, Hotel, GraduationCap } from 'lucide-react';
import { safeJsonLdStringify, sanitizeHtml } from '@/lib/security';

function slugifyHeading(value: string): string {
  return value
    .toLowerCase()
    .replace(/<[^>]*>/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
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
    while (used.has(id)) {
      count += 1;
      id = `${base}-${count}`;
    }
    used.add(id);
    toc.push({ id, text });
    return `<h2${attrs} id="${id}">${inner}</h2>`;
  });

  return { html: result, toc };
}

const ICON_MAP: Record<string, any> = {
  ShoppingBag, Building2, Utensils, Stethoscope, Hotel, GraduationCap
};

export default function IndustryDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // We don't have a direct slug fetcher yet, so we list all and find
    // Optimization: Add a getBySlug endpoint later
    fetch('/api/admin/industries')
      .then(res => res.json())
      .then(data => {
        const found = data.industries?.find((i: any) => i.slug === slug);
        if (found) setItem(found);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="animate-spin h-8 w-8 text-amber-500" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!item) {
    return (
        <div className="min-h-screen bg-white flex flex-col">
          <Navbar />
          <div className="flex-1 flex flex-col items-center justify-center">
            <h1 className="text-2xl font-bold">Industry Not Found</h1>
            <Link href="/services/industries" className="mt-4 text-amber-600 hover:underline">Back to Industries</Link>
          </div>
          <Footer />
        </div>
    );
  }

  const IconComponent = ICON_MAP[item.icon] || Layers;
  const enriched = addHeadingIds(sanitizeHtml(item.content || '<p>Detailed content coming soon.</p>'));
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://signshaus.com';
  const pageUrl = `${siteUrl}/services/industries/${item.slug}`;
  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: `Signage solutions for ${item.title}`,
    provider: {
      '@type': 'Organization',
      name: 'SignsHaus',
      url: siteUrl
    },
    areaServed: 'Metro Manila',
    description: item.description || '',
    image: item.image ? [item.image] : [],
    offers: {
      '@type': 'Offer',
      availability: 'https://schema.org/InStock'
    },
    url: pageUrl
  };
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: 'Industries', item: `${siteUrl}/services/industries` },
      { '@type': 'ListItem', position: 3, name: item.title, item: pageUrl }
    ]
  };

  return (
    <main className="min-h-screen flex flex-col bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(serviceSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(breadcrumbSchema) }} />
      <Navbar />

      {/* Hero */}
      <section className="relative py-24 bg-slate-900 overflow-hidden">
        {item.image && (
            <div 
                className="absolute inset-0 opacity-20 bg-cover bg-center" 
                style={{ backgroundImage: `url(${item.image})` }}
            />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
        
        <div className="container relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider mb-6">
                <IconComponent className="h-4 w-4" /> Industry Solution
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6 leading-tight">
              {item.title}
            </h1>
            <p className="text-xl text-slate-300 max-w-2xl leading-relaxed">
              {item.description}
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-20">
        <div className="container grid lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
                <div 
                    className="prose-blog max-w-none"
                    dangerouslySetInnerHTML={{ __html: enriched.html }}
                />
            </div>
            
            <div className="space-y-8">
                {enriched.toc.length > 0 && (
                    <div className="bg-white p-6 rounded-2xl border border-slate-200">
                        <h3 className="font-bold text-slate-900 mb-3 text-sm uppercase tracking-wide">On this page</h3>
                        <ul className="space-y-2 text-sm">
                            {enriched.toc.map((section) => (
                                <li key={section.id}>
                                    <a href={`#${section.id}`} className="text-slate-600 hover:text-amber-700 transition-colors">
                                        {section.text}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Recommended Widget */}
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-amber-500" /> Recommended Signage
                    </h3>
                    <ul className="space-y-3">
                        {item.recommended && item.recommended.map((rec: string, idx: number) => (
                            <li key={idx} className="flex items-center justify-between text-sm p-3 bg-white rounded-lg border border-slate-100 shadow-sm">
                                <span className="font-medium text-slate-700">{rec}</span>
                                <ArrowRight className="h-4 w-4 text-slate-300" />
                            </li>
                        ))}
                    </ul>
                    <Link href="/contact" className="mt-6 block w-full text-center py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors">
                        Request Quote
                    </Link>
                </div>
            </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
