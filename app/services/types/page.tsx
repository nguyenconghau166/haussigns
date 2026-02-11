'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import StickyContact from '@/components/StickyContact';
import ServiceGrid from '@/components/ServiceGrid';
import { motion } from 'framer-motion';

export default function SignTypesPage() {
  return (
    <main className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <section className="bg-slate-900 py-20 text-center text-white">
        <div className="container px-4">
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight md:text-6xl">
            Sign <span className="text-yellow-500">Types</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-300 md:text-xl">
            From classic Panaflex to modern LED Neons. We fabricate everything in-house.
          </p>
        </div>
      </section>

      <ServiceGrid />

      <section className="py-20 bg-slate-50">
        <div className="container px-4">
          <div className="max-w-4xl mx-auto prose prose-lg prose-slate">
            <h2>Choosing the Right Signage</h2>
            <p>
              Your signage is the face of your business. It's the first thing customers see when they walk by or drive past your establishment.
              Choosing the right type depends on several factors:
            </p>
            <ul>
              <li><strong>Visibility:</strong> Do you need it to be seen from afar (Pylon) or up close (Acrylic)?</li>
              <li><strong>Durability:</strong> Is it for indoor use (Neon) or outdoor (Stainless)?</li>
              <li><strong>Budget:</strong> Panaflex is cost-effective, while Build-Up letters offer a premium look.</li>
              <li><strong>Brand Identity:</strong> Does your brand require specific colors or lighting effects?</li>
            </ul>
            <p>
              Not sure what to choose? Contact us for a free consultation. We can recommend the best material and design for your budget.
            </p>
          </div>
        </div>
      </section>

      <Footer />
      <StickyContact />
    </main>
  );
}
