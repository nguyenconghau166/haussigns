'use client';

import Link from 'next/link';
import { Shield, Clock, Eye, Ruler } from 'lucide-react';
import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { useSiteSettings } from '@/lib/useSiteSettings';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Hero from '@/components/Hero';
import ServiceGrid from '@/components/ServiceGrid';
import BlogCard from '@/components/BlogCard';
import ProjectGallery from '@/components/ProjectGallery';
import ProductShowcase from '@/components/ProductShowcase';
import MaterialsPreview from '@/components/MaterialsPreview';
import CTABanner from '@/components/CTABanner';
import Testimonials from '@/components/Testimonials';
import TrustedBrands from '@/components/TrustedBrands';
import OurPromise from '@/components/OurPromise';

const WHY_CHOOSE = [
  {
    key: 'ocular',
    title: 'Free Ocular Inspection',
    description: 'We visit your site anywhere in Metro Manila for precise measurements.',
    icon: Eye,
  },
  {
    key: 'materials',
    title: 'Premium Materials',
    description: 'Branded acrylics (Crocodile/Suntuf) and 304-grade stainless steel only.',
    icon: Shield,
  },
  {
    key: 'turnaround',
    title: 'Fast Turnaround',
    description: 'Signage installed in as fast as 3-5 days for urgent projects.',
    icon: Clock,
  },
  {
    key: 'crafted',
    title: 'Precision Crafted',
    description: 'CNC-cut and laser-finished for perfect edges and letters every time.',
    icon: Ruler,
  },
];

interface HomePageClientProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  products: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  services: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  projects: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  testimonials: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  posts: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  materials: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  trustedBrands?: any[];
}

export default function HomePageClient({
  products,
  services,
  projects,
  testimonials,
  posts,
  materials,
  trustedBrands = [],
}: HomePageClientProps) {
  const { get: getSetting } = useSiteSettings();

  const whyUsLabel = getSetting('whyus_label', 'Why Us');
  const whyUsTitle = getSetting('whyus_title', 'Why Choose Haus Signs?');
  const whyUsSubtitle = getSetting(
    'whyus_subtitle',
    "Metro Manila's trusted partner for high-quality signage fabrication."
  );

  const whyChooseItems = useMemo(() => {
    return WHY_CHOOSE.map((item) => ({
      ...item,
      title: getSetting(`whyus_${item.key}_title`, item.title),
      description: getSetting(`whyus_${item.key}_description`, item.description),
    }));
  }, [getSetting]);

  return (
    <main className="flex min-h-screen flex-col bg-slate-950 text-white">
      <Navbar />
      <Hero />
      <TrustedBrands brands={trustedBrands} />

      <ServiceGrid services={services} />
      <ProjectGallery projects={projects} />
      <OurPromise />
      <MaterialsPreview materials={materials} />
      <ProductShowcase products={products} />
      <Testimonials testimonials={testimonials} />

      <section className="py-20 md:py-28 bg-slate-900">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
            <div className="max-w-2xl">
              <span className="eyebrow mb-3">Our Blog</span>
              <h2 className="font-display text-4xl md:text-5xl leading-[1.1] text-white mt-3">
                Latest <span className="accent-italic">insights.</span>
              </h2>
              <p className="mt-4 text-base md:text-lg text-slate-400 max-w-md leading-relaxed">
                Tips, guides, and industry news for business owners.
              </p>
            </div>
            <Link href="/blog" className="btn-ghost-gold self-start md:self-end">
              View All Articles →
            </Link>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28 bg-slate-950 relative overflow-hidden">
        <div className="container px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5 }}
            className="text-center mb-14"
          >
            <span className="eyebrow mb-3">{whyUsLabel}</span>
            <h2 className="font-display text-4xl md:text-5xl leading-[1.1] text-white mt-3">
              {whyUsTitle}
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-base md:text-lg text-slate-400 leading-relaxed">
              {whyUsSubtitle}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
            {whyChooseItems.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
                className="relative p-7 rounded-xl border border-slate-800/80 bg-slate-900 hover:border-amber-500/30 transition-all duration-300 text-center group"
              >
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 mb-5 group-hover:scale-110 transition-transform duration-300">
                  <item.icon className="h-6 w-6" strokeWidth={1.5} />
                </div>
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <CTABanner />
      <Footer />
    </main>
  );
}
