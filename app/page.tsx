'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Hero from '@/components/Hero';
import ServiceGrid from '@/components/ServiceGrid';
import StickyContact from '@/components/StickyContact';
import BlogCard from '@/components/BlogCard';
import ProjectGallery from '@/components/ProjectGallery';
import ProductShowcase from '@/components/ProductShowcase';
import Link from 'next/link';
import { ArrowRight, Shield, Clock, Eye, Ruler } from 'lucide-react';
import { motion } from 'framer-motion';
import { getProducts, getServices, getProjects, getTestimonials } from '@/lib/dataService';
import { use, useEffect, useState } from 'react';

const LATEST_POSTS = [
  {
    slug: 'acrylic-signage-guide-2024',
    title: 'The Ultimate Guide to Acrylic Build-Up Signage in Metro Manila',
    excerpt: 'Discover why acrylic signage is the top choice for retail stores in BGC and Makati. Learn about durability, price, and visual impact.',
    date: '2024-02-15',
    category: 'Materials',
    image: 'https://images.unsplash.com/photo-1542382156909-9ae37b3f56fd?q=80&w=2674&auto=format&fit=crop',
  },
  {
    slug: 'neon-lights-trend',
    title: '5 Creative Ways to Use LED Neon Lights for Your Cafe',
    excerpt: 'Transform your coffee shop into an Instagram-worthy spot with custom neon designs. See our latest projects in Quezon City.',
    date: '2024-02-05',
    category: 'Design Trends',
    image: 'https://images.unsplash.com/photo-1563291074-2bf8677ac0e5?q=80&w=2548&auto=format&fit=crop',
  },
  {
    slug: 'signage-permit-process',
    title: 'Understanding the Signage Permit Process in Pasig City',
    excerpt: 'A step-by-step guide to getting your signage permit approved quickly. Avoid penalties and delays with our checklist.',
    date: '2024-01-20',
    category: 'Legal & Permits',
    image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=2670&auto=format&fit=crop',
  },
  {
    slug: 'stainless-steel-maintenance',
    title: 'How to Clean and Maintain Your Stainless Steel Signage',
    excerpt: 'Keep your outdoor signage looking brand new with these simple cleaning tips. Avoid rust and corrosion with proper care.',
    date: '2024-02-10',
    category: 'Maintenance',
    image: 'https://images.unsplash.com/photo-1616400619175-5beda3a17896?q=80&w=2574&auto=format&fit=crop',
  },
  {
    slug: 'building-markers-importance',
    title: 'Why Building Markers are Crucial for Corporate Branding',
    excerpt: 'Make a statement with large-scale building identification. See how top companies use pylons and markers to dominate the skyline.',
    date: '2024-01-15',
    category: 'Corporate',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2670&auto=format&fit=crop',
  },
  {
    slug: 'panaflex-vs-acrylic',
    title: 'Panaflex vs. Acrylic: Which is Better for Your Budget?',
    excerpt: 'Comparing the pros and cons of Panaflex lightboxes versus premium acrylic signs. Find the best option for your startup.',
    date: '2024-01-28',
    category: 'Comparisons',
    image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=2670&auto=format&fit=crop',
  },
];

const WHY_CHOOSE = [
  {
    title: 'Free Ocular Inspection',
    description: 'We visit your site anywhere in Metro Manila for precise measurements.',
    icon: Eye,
  },
  {
    title: 'Premium Materials',
    description: 'Branded acrylics (Crocodile/Suntuf) and 304-grade stainless steel only.',
    icon: Shield,
  },
  {
    title: 'Fast Turnaround',
    description: 'Signage installed in as fast as 3-5 days for urgent projects.',
    icon: Clock,
  },
  {
    title: 'Precision Crafted',
    description: 'CNC-cut and laser-finished for perfect edges and letters every time.',
    icon: Ruler,
  },
];

import Testimonials from '@/components/Testimonials';

export default function Home() {
  const [products, setProducts] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [testimonials, setTestimonials] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      const [prodData, servData, projData, testData] = await Promise.all([
        getProducts(),
        getServices(),
        getProjects(),
        getTestimonials()
      ]);
      setProducts(prodData);
      setServices(servData);
      setProjects(projData);
      setTestimonials(testData);
    }
    loadData();
  }, []);

  return (
    <main className="flex min-h-screen flex-col bg-white">
      <Navbar />
      <Hero />
      <ServiceGrid services={services} />
      <ProjectGallery projects={projects} />
      <ProductShowcase products={products} />
      <Testimonials testimonials={testimonials} />


      {/* Why Choose Us */}
      <section className="py-20 md:py-28 bg-white relative overflow-hidden">
        <div className="container px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5 }}
            className="text-center mb-14"
          >
            <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-yellow-600 mb-3">
              Why Us
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
              Why Choose SignsHaus?
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-base md:text-lg text-slate-500">
              Metro Manila&apos;s trusted partner for high-quality signage fabrication.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {WHY_CHOOSE.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative p-7 rounded-2xl border border-slate-200/80 bg-white hover:border-yellow-200/60 hover:shadow-lg transition-all duration-300 text-center group"
              >
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-50 text-yellow-600 mb-5 group-hover:scale-110 transition-transform duration-300">
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Insights Section */}
      <section className="py-16 md:py-24 bg-slate-50">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Latest Insights</h2>
              <p className="mt-2 text-slate-500">Tips and guides for business owners.</p>
            </div>
            <Link
              href="/blog"
              className="group flex items-center font-semibold text-slate-900 hover:text-yellow-600"
            >
              View All Articles <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {LATEST_POSTS.map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
        </div>
      </section>

      <Footer />
      <StickyContact />
    </main>
  );
}
