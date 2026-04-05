import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, ClipboardCheck, Paintbrush, Wrench, Truck } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { safeJsonLdStringify } from '@/lib/security';

export const dynamic = 'force-dynamic';

const PROCESS_STEPS = [
  { title: 'Consultation', description: 'Free ocular inspection and site measurement. We understand your brand vision.', icon: ClipboardCheck },
  { title: 'Design', description: 'Custom mockup design with your logo, colors, and preferred materials.', icon: Paintbrush },
  { title: 'Fabrication', description: 'Precision-crafted using CNC routers, laser cutters, and premium materials.', icon: Wrench },
  { title: 'Installation', description: 'Professional on-site installation by our experienced team.', icon: Truck },
];

const FEATURES = [
  'Premium materials — 304 stainless steel, branded acrylics',
  'Weather-resistant and UV-protected',
  'LED illumination available',
  'Custom sizes and designs',
  'Professional installation included',
  '1-year warranty on all work',
];

async function getService(slug: string) {
  const { data, error } = await supabase.from('services').select('*').eq('slug', slug).single();
  if (error || !data) return null;
  return data;
}

async function getOtherServices(currentSlug: string) {
  const { data } = await supabase.from('services').select('title, slug').neq('slug', currentSlug).limit(10);
  return data || [];
}

async function getRelatedMaterials() {
  const { data } = await supabase.from('materials').select('name, slug, image').eq('is_published', true).limit(4);
  return data || [];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const service = await getService(slug);
  const fallbackTitle = slug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  const title = service?.title || fallbackTitle;
  const description = service?.description || `Professional ${fallbackTitle} fabrication and installation services in Metro Manila.`;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://signshaus.com';
  const pageUrl = `${siteUrl}/services/types/${slug}`;

  return {
    title: `${title} Service | SignsHaus`,
    description,
    alternates: { canonical: pageUrl },
    openGraph: {
      title: `${title} Service | SignsHaus`,
      description,
      url: pageUrl,
      type: 'website',
    },
  };
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = await getService(slug);
  const fallbackTitle = slug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  const displayTitle = service?.title || fallbackTitle;
  const displayDescription = service?.description || `Professional ${fallbackTitle.toLowerCase()} fabrication and installation services.`;

  const [otherServices, relatedMaterials] = await Promise.all([
    getOtherServices(slug),
    getRelatedMaterials(),
  ]);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://signshaus.com';
  const pageUrl = `${siteUrl}/services/types/${slug}`;

  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: `${displayTitle} fabrication and installation`,
    provider: { '@type': 'Organization', name: 'SignsHaus', url: siteUrl },
    areaServed: { '@type': 'City', name: 'Metro Manila' },
    description: displayDescription,
    url: pageUrl,
  };
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: 'Services', item: `${siteUrl}/services` },
      { '@type': 'ListItem', position: 3, name: displayTitle, item: pageUrl },
    ],
  };

  return (
    <main className="min-h-screen flex flex-col bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(serviceSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(breadcrumbSchema) }} />
      <Navbar />

      {/* Hero */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 gradient-hero" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        <div className="absolute -top-20 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="container relative z-10">
          <div className="max-w-3xl space-y-5">
            <span className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/20 px-4 py-1.5 text-sm font-medium text-amber-400">Our Services</span>
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl">
              {displayTitle} <span className="gradient-text">Service</span>
            </h1>
            <p className="text-lg text-slate-300/90 max-w-xl leading-relaxed">{displayDescription}</p>
            <Link href={`/contact?service=${slug}`} className="btn-primary text-base !px-8 !py-3.5 group inline-flex">
              Request Quote <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-amber-600 mb-3">Why Choose</span>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl mb-5">Why Choose {displayTitle}?</h2>
              <p className="text-slate-500 leading-relaxed mb-8">
                Our {displayTitle.toLowerCase()} signage is crafted with precision using only premium materials.
                Whether for indoor malls, outdoor storefronts, or corporate offices, we deliver signage that makes your brand stand out.
              </p>
              <ul className="space-y-3">
                {FEATURES.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-600">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl overflow-hidden border border-slate-200/80 shadow-lg">
              <img src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=2670&auto=format&fit=crop" alt={`${displayTitle} signage fabrication process`} className="w-full h-[300px] md:h-[400px] object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-16 md:py-24 bg-slate-50">
        <div className="container">
          <div className="text-center mb-14">
            <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-amber-600 mb-3">How We Work</span>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Our Process</h2>
            <p className="mt-4 max-w-2xl mx-auto text-slate-500">From initial consultation to final installation, we handle everything.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {PROCESS_STEPS.map((step, index) => (
              <div key={step.title} className="relative p-7 rounded-2xl bg-white border border-slate-200/80 text-center hover:shadow-lg transition-all duration-300">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">{index + 1}</div>
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600 mb-4 mt-2"><step.icon className="h-6 w-6" /></div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Related Materials */}
      {relatedMaterials.length > 0 && (
        <section className="py-16">
          <div className="container">
            <h2 className="text-2xl font-extrabold text-slate-900 mb-8">Materials We Use</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
              {relatedMaterials.map((mat: any) => (
                <Link key={mat.slug} href={`/services/materials/${mat.slug}`} className="block rounded-xl border border-slate-200 bg-white p-4 hover:shadow-md hover:border-amber-200 transition-all text-center">
                  {mat.image && <img src={mat.image} alt={`${mat.name} signage material`} className="w-full h-24 object-cover rounded-lg mb-3" />}
                  <p className="text-sm font-semibold text-slate-700">{mat.name}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Other Services */}
      {otherServices.length > 0 && (
        <section className="py-16 bg-slate-50">
          <div className="container">
            <div className="text-center mb-12">
              <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-amber-600 mb-3">Explore More</span>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Other Services</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 max-w-5xl mx-auto">
              {otherServices.map((s: any) => (
                <Link key={s.slug} href={`/services/types/${s.slug}`} className="block rounded-xl border border-slate-200/80 p-4 text-center hover:border-amber-200/60 hover:shadow-md transition-all duration-300 group">
                  <p className="text-sm font-semibold text-slate-700 group-hover:text-amber-700 transition-colors">{s.title}</p>
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
