'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import StickyContact from '@/components/StickyContact';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Paintbrush, Wrench, Truck, ClipboardCheck } from 'lucide-react';
import { use, useEffect, useState } from 'react';
import { getServiceBySlug, getServices } from '@/lib/dataService';

const PROCESS_STEPS = [
  {
    title: 'Consultation',
    description: 'Free ocular inspection and site measurement. We understand your brand vision.',
    icon: ClipboardCheck,
  },
  {
    title: 'Design',
    description: 'Custom mockup design with your logo, colors, and preferred materials.',
    icon: Paintbrush,
  },
  {
    title: 'Fabrication',
    description: 'Precision-crafted using CNC routers, laser cutters, and premium materials.',
    icon: Wrench,
  },
  {
    title: 'Installation',
    description: 'Professional on-site installation by our experienced team.',
    icon: Truck,
  },
];

const FEATURES = [
  'Premium materials — 304 stainless steel, branded acrylics',
  'Weather-resistant and UV-protected',
  'LED illumination available',
  'Custom sizes and designs',
  'Professional installation included',
  '1-year warranty on all work',
];

export default function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const [service, setService] = useState<any>(null);
  const [otherServices, setOtherServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [serviceData, allServices] = await Promise.all([
          getServiceBySlug(resolvedParams.slug),
          getServices()
        ]);
        
        setService(serviceData);
        if (allServices && serviceData) {
            setOtherServices(allServices.filter((s: any) => s.slug !== resolvedParams.slug));
        } else if (allServices) {
             setOtherServices(allServices.filter((s: any) => s.slug !== resolvedParams.slug));
        }
      } catch (e) {
        console.error("Failed to load service data", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [resolvedParams.slug]);

  // Fallback title if service not found yet (loading or error)
  const fallbackTitle = resolvedParams.slug.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
  const displayTitle = service ? service.title : fallbackTitle;
  const displayDescription = service ? service.description : `Professional ${fallbackTitle} fabrication and installation services.`;

  return (
    <main className="min-h-screen flex flex-col bg-white">
      <Navbar />

      {/* Hero */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 gradient-hero" />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
        <div className="absolute -top-20 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl" />

        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl space-y-5"
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/20 px-4 py-1.5 text-sm font-medium text-amber-400">
              Our Services
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl">
              {displayTitle} <span className="gradient-text">Service</span>
            </h1>
            <p className="text-lg text-slate-300/90 max-w-xl leading-relaxed">
              {displayDescription}
            </p>
            <Link href="/contact" className="btn-primary text-base !px-8 !py-3.5 group inline-flex">
              Request Quote
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-start">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-amber-600 mb-3">
                Why Choose
              </span>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl mb-5">
                Why Choose {displayTitle}?
              </h2>
              <p className="text-slate-500 leading-relaxed mb-8">
                Our {displayTitle.toLowerCase()} signage is crafted with precision using only premium materials.
                Whether for indoor malls, outdoor storefronts, or corporate offices, we deliver
                signage that makes your brand stand out.
              </p>

              <ul className="space-y-3">
                {FEATURES.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-600">{feature}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="rounded-2xl overflow-hidden border border-slate-200/80 shadow-lg"
            >
              <img
                src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=2670&auto=format&fit=crop"
                alt={`${displayTitle} fabrication`}
                className="w-full h-[300px] md:h-[400px] object-cover"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-16 md:py-24 bg-slate-50">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-14"
          >
            <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-amber-600 mb-3">
              How We Work
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Our Process
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-slate-500">
              From initial consultation to final installation, we handle everything.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {PROCESS_STEPS.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative p-7 rounded-2xl bg-white border border-slate-200/80 text-center hover:shadow-lg transition-all duration-300"
              >
                {/* Step number */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">
                  {index + 1}
                </div>
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600 mb-4 mt-2">
                  <step.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Related Services */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-amber-600 mb-3">
              Explore More
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Other Services
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 max-w-5xl mx-auto">
            {otherServices.map((service, index) => (
              <motion.div
                key={service.slug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <Link
                  href={`/services/types/${service.slug}`}
                  className="block rounded-xl border border-slate-200/80 p-4 text-center hover:border-amber-200/60 hover:shadow-md transition-all duration-300 group"
                >
                  <p className="text-sm font-semibold text-slate-700 group-hover:text-amber-700 transition-colors">
                    {service.title}
                  </p>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
      <StickyContact />
    </main>
  );
}
