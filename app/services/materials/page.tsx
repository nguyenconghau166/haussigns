'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import StickyContact from '@/components/StickyContact';
import Image from 'next/image';

const MATERIALS = [
  {
    name: 'Acrylic',
    image: 'https://images.unsplash.com/photo-1542382156909-9ae37b3f56fd?q=80&w=2674&auto=format&fit=crop',
    pros: ['Versatile shapes', 'Many color options', 'Lightweight', 'High gloss finish'],
    cons: ['Can scratch easily', 'Pricey for large coverage'],
    bestFor: 'Indoor logos, Lighted letters, Retail stores',
  },
  {
    name: 'Stainless Steel 304',
    image: 'https://images.unsplash.com/photo-1616400619175-5beda3a17896?q=80&w=2574&auto=format&fit=crop',
    pros: ['Rust-proof', 'Premium look (Gold/Mirror)', 'Extremely durable', 'Weather resistant'],
    cons: ['Heavy', 'More expensive', 'Harder to shape complex curves'],
    bestFor: 'Corporate buildings, Outdoor monuments, Luxury brands',
  },
  {
    name: 'Panaflex',
    image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=2670&auto=format&fit=crop',
    pros: ['Very affordable', 'Great for huge sizes', 'Easy to replace face', 'Full color print'],
    cons: ['Less premium look', 'Can fade over time (3-5 years)'],
    bestFor: 'Grocery stores, Roadside signage, Temporary campaigns',
  },
  {
    name: 'Aluminum Composite (ACP)',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2670&auto=format&fit=crop',
    pros: ['Perfect flat surface', 'Lightweight but rigid', 'Modern architectural look'],
    cons: ['Limited texture options', 'Joint lines visible'],
    bestFor: 'Building cladding, Backing for letters, Pylons',
  },
];

export default function MaterialsPage() {
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
          <div className="space-y-12">
            {MATERIALS.map((material, index) => (
              <div key={index} className="flex flex-col md:flex-row gap-8 bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100">
                <div className="w-full md:w-1/3 aspect-video md:aspect-square relative rounded-xl overflow-hidden bg-slate-200">
                  <Image
                    src={material.image}
                    alt={material.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-slate-900 mb-4">{material.name}</h3>
                  
                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h4 className="font-bold text-green-600 mb-2 flex items-center gap-2">
                        Pros
                      </h4>
                      <ul className="space-y-1 text-slate-600 text-sm">
                        {material.pros.map(pro => <li key={pro}>• {pro}</li>)}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-bold text-red-500 mb-2 flex items-center gap-2">
                        Cons
                      </h4>
                      <ul className="space-y-1 text-slate-600 text-sm">
                        {material.cons.map(con => <li key={con}>• {con}</li>)}
                      </ul>
                    </div>
                  </div>

                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                    <span className="font-bold text-yellow-800 text-sm uppercase tracking-wide block mb-1">Best Application</span>
                    <p className="text-slate-700">{material.bestFor}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
      <StickyContact />
    </main>
  );
}
