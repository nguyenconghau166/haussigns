'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { useSiteSettings } from '@/lib/useSiteSettings';

const STATS: { value: string; label: string }[] = [
  // { value: '500+', label: 'Projects Completed' },
  // { value: '7+', label: 'Years Experience' },
  // { value: '100%', label: 'Client Satisfaction' },
  // { value: '24hr', label: 'Quote Response' },
];

export default function Hero() {
  const { heroTitle, heroSubtitle, heroImage } = useSiteSettings();

  return (
    <section className="relative min-h-[90vh] flex items-center pt-20 overflow-hidden bg-slate-900">
      {/* Background Elements (Orbs) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/2 right-0 w-[600px] h-[600px] bg-slate-700/10 rounded-full blur-3xl" />

        {/* Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Right Side Image (Desktop) */}
      <div className="hidden lg:block absolute inset-y-0 right-0 w-1/2 z-0">
        {heroImage && (
          <div className="relative w-full h-full">
            <img src={heroImage} alt="Hero" className="w-full h-full object-cover" />
            {/* Gradient Blend: Dark on left (from text), transparent on right */}
            <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-slate-900 via-slate-900/60 to-transparent" />
            {/* Bottom blend */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-900 to-transparent" />
          </div>
        )}
      </div>

      <div className="container relative z-10 py-12 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column: Text Content */}
          <div className="max-w-3xl space-y-8">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/20 px-4 py-1.5 text-sm font-medium text-amber-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Trusted Signage Maker in Metro Manila
              </span>
            </motion.div>

            {/* Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl leading-[1.1]"
            >
              {heroTitle}
            </motion.h1>

            {/* Subheading & Mobile Image Split */}
            <div className="grid grid-cols-12 gap-4 items-center lg:block">
              <motion.div
                className="col-span-7"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <p className="max-w-xl text-lg text-slate-300/90 md:text-xl leading-relaxed">
                  {heroSubtitle}
                </p>
              </motion.div>

              {/* Mobile Image - Beside Subheading */}
              <div className="col-span-5 lg:hidden relative rounded-xl overflow-hidden aspect-[4/3] shadow-lg border border-slate-800/50">
                {heroImage && (
                  <div className="w-full h-full relative">
                    <img src={heroImage} alt="Hero" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-900/50 to-transparent" />
                  </div>
                )}
              </div>
            </div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col gap-3 sm:flex-row sm:gap-4"
            >
              <Link href="/contact" className="btn-primary text-base !px-8 !py-3.5 group">
                Get Free Quote
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link href="/services/types/acrylic-signage" className="btn-secondary text-base !px-8 !py-3.5">
                Explore Services
              </Link>
            </motion.div>

            {/* Stats */}
            {STATS.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.5 }}
                className="pt-8 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"
              >
                {STATS.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                    className="text-left"
                  >
                    <div className="text-2xl md:text-3xl font-extrabold gradient-text">{stat.value}</div>
                    <div className="mt-1 text-xs md:text-sm text-slate-500 font-medium uppercase tracking-wide">{stat.label}</div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>


        </div>
      </div>
    </section>
  );
}
