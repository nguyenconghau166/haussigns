'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CTABanner from '@/components/CTABanner';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AboutPage() {
  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPage() {
      try {
        const { data } = await supabase
          .from('site_pages')
          .select('*')
          .eq('slug', 'about')
          .single();
        
        if (data) setPage(data);
      } catch (error) {
        console.error('Error fetching about page:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchPage();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        </div>
        <Footer />
      </div>
    );
  }

  // Fallback if no content found in DB (shouldn't happen if migration ran)
  if (!page) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Navbar />
        <div className="flex-1 container py-20">
          <h1 className="text-4xl font-bold">About Us</h1>
          <p className="mt-4 text-slate-500">Content not found. Please configure the "about" page in Admin Panel.</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <main className="min-h-screen flex flex-col bg-white">
      <Navbar />

      {/* Hero */}
      <section className="relative py-20 md:py-28 overflow-hidden bg-slate-900">
        {page.featured_image && (
          <div 
            className="absolute inset-0 z-0 opacity-30 bg-cover bg-center"
            style={{ backgroundImage: `url(${page.featured_image})` }}
          />
        )}
        <div className="absolute inset-0 gradient-hero z-1" />
        
        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-amber-400 mb-3">
              Our Story
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl">
              {page.title}
            </h1>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container max-w-4xl">
           <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="prose prose-lg prose-slate max-w-none"
              dangerouslySetInnerHTML={{ __html: page.content || '' }}
            />
        </div>
      </section>

      <CTABanner />
      <Footer />
    </main>
  );
}
