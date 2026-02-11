'use client';

import Image from 'next/image';
import { ArrowRight, Star } from 'lucide-react';
import Link from 'next/link';

interface Product {
  id: number | string;
  name: string;
  description: string;
  price: string;
  rating: number;
  image: string;
  tag: string;
}

export default function ProductShowcase({ products = [] }: { products?: Product[] }) {
  if (!products || products.length === 0) return null;

  return (
    <section className="py-20 bg-slate-50">
      <div className="container px-4">
        <div className="text-center mb-16">
          <span className="text-yellow-600 font-bold uppercase tracking-wider text-sm">Our Specialties</span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mt-2 mb-4">
            Signage Solutions
          </h2>
          <p className="text-slate-500 max-w-2xl mx-auto text-lg">
            Choose the perfect material for your brand. We fabricate everything in-house.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.map((product) => (
            <div key={product.id} className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-slate-100">
              <div className="relative h-64 w-full bg-slate-200">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-slate-900 shadow-sm">
                  {product.tag}
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-1 mb-2">
                  <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-sm font-medium text-slate-700">{product.rating}</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{product.name}</h3>
                <p className="text-slate-500 text-sm mb-4 line-clamp-2">
                  {product.description}
                </p>
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-lg font-bold text-slate-900">{product.price}</span>
                  <Link href={`/services/types/${product.name.toLowerCase().replace(/ /g, '-')}`} className="p-2 rounded-full bg-slate-100 hover:bg-yellow-500 hover:text-white transition-colors group-hover:rotate-45">
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link href="/services/types" className="inline-flex items-center text-slate-900 font-semibold hover:text-yellow-600 transition-colors">
            View Full Catalog <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
