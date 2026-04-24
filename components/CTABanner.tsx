'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useSiteSettings } from '@/lib/useSiteSettings';

function renderHeadline(title: string) {
  const trimmed = (title || '').trim();
  const match = trimmed.match(/^(.+?)\s+\*(.+?)\*\s*(.*)$/);
  if (match) {
    const [, before, italic, after] = match;
    return (
      <>
        {before}{' '}
        <span className="accent-italic !text-amber-800">{italic}</span>
        {after ? ` ${after}` : ''}
      </>
    );
  }
  return trimmed;
}

export default function CTABanner() {
  const { get: getSetting } = useSiteSettings();

  const headline = getSetting('cta_headline', "Let's create something *iconic* together.");
  const buttonLabel = getSetting('cta_button_label', 'Start a Project');
  const buttonLink = getSetting('cta_button_link', '/contact');

  return (
    <section className="relative py-16 md:py-20 bg-[#c9b690]">
      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-8"
        >
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl leading-[1.1] text-slate-900 max-w-3xl">
            {renderHeadline(headline)}
          </h2>

          <Link
            href={buttonLink}
            className="group inline-flex items-center gap-3 self-start md:self-auto bg-amber-500 hover:bg-amber-600 text-slate-900 px-7 py-3.5 rounded-md text-[11px] font-semibold uppercase tracking-[0.22em] transition-colors shadow-md"
          >
            {buttonLabel}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
