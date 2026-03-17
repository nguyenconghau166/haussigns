'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Hero from '@/components/Hero';
import ServiceGrid from '@/components/ServiceGrid';
import BlogCard from '@/components/BlogCard';
import ProjectGallery from '@/components/ProjectGallery';
import ProductShowcase from '@/components/ProductShowcase';
import MaterialsPreview from '@/components/MaterialsPreview';
import CTABanner from '@/components/CTABanner';
import Link from 'next/link';
import { ArrowRight, Shield, Clock, Eye, Ruler } from 'lucide-react';
import { motion } from 'framer-motion';
import { getProducts, getServices, getProjects, getTestimonials, getPosts } from '@/lib/dataService';
import { useEffect, useMemo, useState } from 'react';
import { useSiteSettings } from '@/lib/useSiteSettings';

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

import Testimonials from '@/components/Testimonials';

export default function Home() {
  const { get: getSetting } = useSiteSettings();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [products, setProducts] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [services, setServices] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [projects, setProjects] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [testimonials, setTestimonials] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [posts, setPosts] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [materials, setMaterials] = useState<any[]>([]);

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

  useEffect(() => {
    async function loadData() {
      const [prodData, servData, projData, testData, postData] = await Promise.all([
        getProducts(8),
        getServices(),
        getProjects(8),
        getTestimonials(4),
        getPosts(3)
      ]);
      setProducts(prodData);
      setServices(servData);
      setProjects(projData);
      setTestimonials(testData);
      setPosts(postData || []);
    }
    loadData();

    // Fetch materials separately (from API route)
    fetch('/api/admin/materials')
      .then(res => res.json())
      .then(data => {
        if (data.materials) setMaterials(data.materials);
      })
      .catch(() => {});
  }, []);

  return (
    <main className="flex min-h-screen flex-col bg-white dark:bg-slate-950">
      <Navbar />
      <Hero />

      {/* Services / Sign Types */}
      <ServiceGrid services={services} />

      {/* Projects Gallery */}
      <ProjectGallery projects={projects} />

      {/* Materials */}
      <MaterialsPreview materials={materials} />

      {/* Products */}
      <ProductShowcase products={products} />

      {/* Testimonials */}
      <Testimonials testimonials={testimonials} />

      {/* Latest Insights / Blog Section */}
      <section className="py-16 md:py-24 bg-slate-50 dark:bg-slate-900">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-4">
            <div>
              <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400 mb-2">
                Our Blog
              </span>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">Latest Insights</h2>
              <p className="mt-2 text-slate-500 dark:text-slate-400">Tips, guides, and industry news for business owners.</p>
            </div>
            <Link
              href="/blog"
              className="group flex items-center font-semibold text-slate-900 dark:text-white hover:text-yellow-600 dark:hover:text-amber-400 transition-colors"
            >
              View All Articles <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 md:py-28 bg-white dark:bg-slate-950 relative overflow-hidden">
        <div className="container px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5 }}
            className="text-center mb-14"
          >
            <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-yellow-600 dark:text-amber-400 mb-3">
              {whyUsLabel}
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl md:text-5xl">
              {whyUsTitle}
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-base md:text-lg text-slate-500 dark:text-slate-400">
              {whyUsSubtitle}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {whyChooseItems.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative p-7 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-white dark:bg-slate-800/50 hover:border-yellow-200/60 dark:hover:border-amber-500/30 hover:shadow-lg transition-all duration-300 text-center group"
              >
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-50 dark:bg-amber-500/10 text-yellow-600 dark:text-amber-400 mb-5 group-hover:scale-110 transition-transform duration-300">
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <CTABanner />

      <Footer />
    </main>
  );
}
