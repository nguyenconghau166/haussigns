'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ShoppingBag, Building2, Utensils, Stethoscope, Hotel, GraduationCap, ArrowRight, Layers } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

const ICON_MAP: Record<string, any> = {
  ShoppingBag, Building2, Utensils, Stethoscope, Hotel, GraduationCap
};

export default function IndustriesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/industries')
      .then(res => res.json())
      .then(data => {
        if (data.industries) setItems(data.industries);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <section className="bg-slate-900 py-20 text-center text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 z-0" />
        <div className="container px-4 relative z-10">
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight md:text-6xl">
            Industries We <span className="text-yellow-500">Serve</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-300 md:text-xl">
            Tailored signage solutions for every business sector in the Philippines.
          </p>
        </div>
      </section>

      <section className="py-20 bg-slate-50">
        <div className="container px-4">
          {loading ? (
             <div className="flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-amber-500" /></div>
          ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {items.map((item) => {
              const IconComponent = ICON_MAP[item.icon] || Layers;
              return (
                <Link 
                  href={`/services/industries/${item.slug}`} 
                  key={item.id} 
                  className="group block h-full"
                >
                  <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg transition-all h-full flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
                    
                    <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-6 relative z-10 group-hover:bg-amber-500 group-hover:text-white transition-colors shadow-lg shadow-amber-500/10">
                      <IconComponent className="h-7 w-7" />
                    </div>
                    
                    <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-amber-600 transition-colors">{item.title}</h3>
                    <p className="text-slate-500 mb-6 flex-grow text-sm leading-relaxed">{item.description}</p>
                    
                    <div className="mt-auto pt-6 border-t border-slate-100">
                      {item.recommended && item.recommended.length > 0 ? (
                        <>
                           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-3">Recommended:</span>
                           <div className="flex flex-wrap gap-2">
                             {item.recommended.slice(0, 3).map((rec: string, i: number) => (
                               <span key={i} className="px-2.5 py-1 bg-slate-50 text-slate-600 text-[10px] font-semibold rounded-md border border-slate-100 group-hover:border-amber-100 group-hover:bg-amber-50 transition-colors">
                                 {rec}
                               </span>
                             ))}
                           </div>
                        </>
                      ) : (
                        <span className="text-sm font-medium text-amber-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                            View Solutions <ArrowRight className="h-4 w-4" />
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
