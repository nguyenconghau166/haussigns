'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useSiteSettings } from '@/lib/useSiteSettings';

function renderHeadline(title: string) {
  // Try to split "Sentence A. Sentence B." — wrap the last sentence (without trailing punctuation) in accent-italic.
  const trimmed = (title || '').trim();
  const match = trimmed.match(/^(.*[.!?])\s+(.+)$/);
  if (match) {
    const [, first, second] = match;
    return (
      <>
        {first}
        <br />
        <span className="accent-italic">{second}</span>
      </>
    );
  }
  return trimmed;
}

export default function Hero() {
  const { heroTitle, heroSubtitle, heroImage } = useSiteSettings();

  return (
    <section className="relative min-h-[90vh] flex items-center pt-20 overflow-hidden bg-slate-900">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-amber-500/[0.05] rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-amber-500/[0.03] rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="hidden lg:block absolute inset-y-0 right-0 w-1/2 z-0">
        {heroImage && (
          <div className="relative w-full h-full">
            <Image
              src={heroImage}
              alt="Hero"
              fill
              priority
              sizes="(max-width: 1024px) 0px, 50vw"
              className="object-cover"
            />
            <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-slate-900 via-slate-900/60 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-900 to-transparent" />
          </div>
        )}
      </div>

      <div className="container relative z-10 py-12 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="max-w-3xl space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center"
            >
              <span className="gold-divider" />
              <span className="eyebrow">Premium Signage, Timeless Impact</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-display font-semibold tracking-tight text-white text-5xl sm:text-6xl md:text-7xl leading-[1.08]"
            >
              {renderHeadline(heroTitle)}
            </motion.h1>

            <div className="grid grid-cols-12 gap-4 items-center lg:block">
              <motion.div
                className="col-span-7"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <p className="max-w-xl text-base md:text-lg text-slate-300/90 leading-relaxed">
                  {heroSubtitle}
                </p>
              </motion.div>

              <div className="col-span-5 lg:hidden relative rounded-xl overflow-hidden aspect-[4/3] shadow-lg border border-slate-800/50">
                {heroImage && (
                  <div className="w-full h-full relative">
                    <Image
                      src={heroImage}
                      alt="Hero"
                      fill
                      sizes="(max-width: 1024px) 41vw, 0px"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-900/50 to-transparent" />
                  </div>
                )}
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8 pt-2"
            >
              <Link href="/projects" className="btn-primary text-base !px-8 !py-3.5 group">
                View Our Work
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link href="/services/types" className="btn-ghost-gold">
                Our Services <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
