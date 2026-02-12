'use client';

import { use, useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Loader2, ArrowRight, CheckCircle, Layers } from 'lucide-react';
import Link from 'next/link';
import { ShoppingBag, Building2, Utensils, Stethoscope, Hotel, GraduationCap } from 'lucide-react';

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

  return (
    <main className="min-h-screen flex flex-col bg-white">
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
                    className="prose prose-lg prose-slate max-w-none"
                    dangerouslySetInnerHTML={{ __html: item.content || '<p>Detailed content coming soon.</p>' }}
                />
            </div>
            
            <div className="space-y-8">
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
