'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import StickyContact from '@/components/StickyContact';
import { ShoppingBag, Building2, Utensils, Stethoscope, Hotel, GraduationCap } from 'lucide-react';
import Link from 'next/link';

const INDUSTRIES = [
  {
    icon: ShoppingBag,
    title: 'Retail & Shops',
    description: 'Attract foot traffic with eye-catching storefront signage.',
    recommended: ['Acrylic Build-Up', 'Lightboxes', 'Window Decals'],
  },
  {
    icon: Building2,
    title: 'Corporate Offices',
    description: 'Professional reception logos and wayfinding systems.',
    recommended: ['Stainless Steel', 'Frosted Glass Stickers', 'Room ID'],
  },
  {
    icon: Utensils,
    title: 'Restaurants & Cafes',
    description: 'Create a vibe with neon lights and menu boards.',
    recommended: ['LED Neon', 'Menu Lightbox', 'Wooden Signs'],
  },
  {
    icon: Stethoscope,
    title: 'Hospitals & Clinics',
    description: 'Clear, compliant directional signage for patients.',
    recommended: ['Wayfinding', 'Pylon Signs', 'Safety Signs'],
  },
  {
    icon: Hotel,
    title: 'Hotels & Resorts',
    description: 'Luxury branding and large-scale building identification.',
    recommended: ['Brass/Gold Finish', 'Monument Signs', 'Pool Rules'],
  },
  {
    icon: GraduationCap,
    title: 'Schools & Universities',
    description: 'Durable campus maps and building markers.',
    recommended: ['Panaflex', 'Metal Plaques', 'Directional Posts'],
  },
];

export default function IndustriesPage() {
  return (
    <main className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <section className="bg-slate-900 py-20 text-center text-white">
        <div className="container px-4">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {INDUSTRIES.map((item, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-xl flex items-center justify-center mb-6">
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                <p className="text-slate-500 mb-6">{item.description}</p>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recommended:</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {item.recommended.map((rec) => (
                      <span key={rec} className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">
                        {rec}
                      </span>
                    ))}
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
