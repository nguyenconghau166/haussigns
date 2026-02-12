'use client';

import { use, useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Loader2, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

export default function MaterialDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/materials')
      .then(res => res.json())
      .then(data => {
        const found = data.materials?.find((i: any) => i.slug === slug);
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
            <h1 className="text-2xl font-bold">Material Not Found</h1>
            <Link href="/services/materials" className="mt-4 text-amber-600 hover:underline">Back to Materials</Link>
          </div>
          <Footer />
        </div>
    );
  }

  return (
    <main className="min-h-screen flex flex-col bg-white">
      <Navbar />

      {/* Hero */}
      <section className="relative py-24 bg-slate-900 overflow-hidden">
        {item.image && (
            <div 
                className="absolute inset-0 opacity-30 bg-cover bg-center" 
                style={{ backgroundImage: `url(${item.image})` }}
            />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
        
        <div className="container relative z-10">
          <div className="max-w-3xl">
            <Link href="/services/materials" className="inline-flex items-center text-slate-300 hover:text-white mb-6 text-sm font-medium transition-colors">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Materials
            </Link>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6 leading-tight">
              {item.name}
            </h1>
            <p className="text-xl text-slate-300 max-w-2xl leading-relaxed">
              {item.description || item.best_for}
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-20">
        <div className="container grid lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
                <div 
                    className="prose prose-lg prose-slate max-w-none mb-12"
                    dangerouslySetInnerHTML={{ __html: item.content || '<p>Detailed specification coming soon.</p>' }}
                />
            </div>
            
            <div className="space-y-8">
                {/* Pros/Cons Widget */}
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-6">
                    <div>
                        <h3 className="font-bold text-green-700 mb-3 flex items-center gap-2">
                            <CheckCircle className="h-5 w-5" /> Advantages
                        </h3>
                        <ul className="space-y-2">
                            {Array.isArray(item.pros) && item.pros.map((pro: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                                    {pro}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="pt-6 border-t border-slate-200">
                        <h3 className="font-bold text-red-600 mb-3 flex items-center gap-2">
                            <XCircle className="h-5 w-5" /> Considerations
                        </h3>
                        <ul className="space-y-2">
                            {Array.isArray(item.cons) && item.cons.map((con: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                                    {con}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100">
                    <h3 className="font-bold text-amber-800 mb-2 text-sm uppercase tracking-wide">Best Used For</h3>
                    <p className="text-slate-800 font-medium">{item.best_for}</p>
                    <Link href="/contact" className="mt-6 block w-full text-center py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors">
                        Get a Quote for {item.name}
                    </Link>
                </div>
            </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
