'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/materials')
      .then(res => res.json())
      .then(data => {
        if (data.materials) setMaterials(data.materials);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <section className="bg-slate-900 py-20 text-center text-white">
        <div className="container px-4">
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight md:text-6xl">
            Material <span className="text-yellow-500">Guide</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-300 md:text-xl">
            Understand the pros and cons of each material to make the best choice for your budget and needs.
          </p>
        </div>
      </section>

      <section className="py-20 bg-slate-50">
        <div className="container px-4">
          {loading ? (
             <div className="flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-amber-500" /></div>
          ) : (
             <div className="space-y-12">
            {materials.map((material, index) => (
              <Link href={`/services/materials/${material.slug}`} key={material.id} className="block group">
                  <div className="flex flex-col md:flex-row gap-8 bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg transition-all">
                    <div className="w-full md:w-1/3 aspect-video md:aspect-square relative rounded-xl overflow-hidden bg-slate-200">
                      {material.image ? (
                          <img
                            src={material.image}
                            alt={material.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                      ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">No Image</div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-slate-900 mb-4 group-hover:text-amber-600 transition-colors">{material.name}</h3>
                      
                      <div className="grid md:grid-cols-2 gap-6 mb-6">
                        <div>
                          <h4 className="font-bold text-green-600 mb-2 flex items-center gap-2 text-sm uppercase tracking-wide">
                            Pros
                          </h4>
                          <ul className="space-y-1 text-slate-600 text-sm">
                            {Array.isArray(material.pros) && material.pros.map((pro: string) => <li key={pro}>• {pro}</li>)}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-bold text-red-500 mb-2 flex items-center gap-2 text-sm uppercase tracking-wide">
                            Cons
                          </h4>
                          <ul className="space-y-1 text-slate-600 text-sm">
                            {Array.isArray(material.cons) && material.cons.map((con: string) => <li key={con}>• {con}</li>)}
                          </ul>
                        </div>
                      </div>

                      {material.best_for && (
                          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                            <span className="font-bold text-yellow-800 text-xs uppercase tracking-wide block mb-1">Best Application</span>
                            <p className="text-slate-700 text-sm font-medium">{material.best_for}</p>
                          </div>
                      )}
                    </div>
                  </div>
              </Link>
            ))}
          </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
