'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, PencilRuler, Gem, Layers, ShieldCheck } from 'lucide-react';
import { useSiteSettings } from '@/lib/useSiteSettings';

const PROMISE_ICONS = [PencilRuler, Gem, Layers, ShieldCheck];

const PROMISE_DEFAULTS = [
  { title: 'Custom Design', description: 'Tailored signage that reflects your brand identity.' },
  { title: 'Premium Quality', description: 'High-end materials and expert craftsmanship.' },
  { title: 'End-to-End Service', description: 'From concept to installation, we handle everything.' },
  { title: 'Built to Last', description: 'Durable, weather-resistant signs made to stand the test of time.' },
];

function renderHeadline(title: string) {
  const trimmed = (title || '').trim();
  const match = trimmed.match(/^(.+?)\s+\*(.+?)\*\s*(.*)$/);
  if (match) {
    const [, before, italic, after] = match;
    return (
      <>
        {before.endsWith('.') ? <>{before}<br /></> : <>{before} </>}
        <span className="accent-italic">{italic}</span>
        {after ? ` ${after}` : ''}
      </>
    );
  }
  return trimmed;
}

export default function OurPromise() {
  const { get: getSetting } = useSiteSettings();

  const eyebrow = getSetting('promise_eyebrow', 'Our Promise');
  const headline = getSetting('promise_headline', 'Timeless quality. *Uncompromising* standards.');
  const ctaLabel = getSetting('promise_cta_label', 'Learn More');
  const ctaLink = getSetting('promise_cta_link', '/about');
  const promiseImage = getSetting('promise_image', '');

  const items = PROMISE_DEFAULTS.map((item, i) => ({
    title: getSetting(`promise_${i + 1}_title`, item.title),
    description: getSetting(`promise_${i + 1}_description`, item.description),
    Icon: PROMISE_ICONS[i],
  }));

  return (
    <section className="bg-slate-950 py-20 md:py-28">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 items-stretch">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-2 gap-4 lg:gap-5"
          >
            {items.map(({ title, description, Icon }, i) => (
              <div
                key={i}
                className="bg-slate-900 border border-slate-800/60 rounded-xl p-6 md:p-7 flex flex-col"
              >
                <div className="h-10 w-10 flex items-center justify-center text-amber-400 mb-5">
                  <Icon strokeWidth={1.4} className="h-8 w-8" />
                </div>
                <h3 className="eyebrow !tracking-[0.22em] !text-slate-100 !text-[11px] mb-2">
                  {title}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
              </div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative rounded-xl overflow-hidden bg-gradient-to-br from-slate-800 via-slate-900 to-black border border-slate-800/60 min-h-[320px] lg:min-h-0"
          >
            {promiseImage ? (
              <Image
                src={promiseImage}
                alt=""
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <svg
                  viewBox="0 0 200 200"
                  className="w-[70%] h-[70%] opacity-90"
                  aria-hidden="true"
                >
                  <defs>
                    <linearGradient id="haus-gold" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#fbbf24" />
                      <stop offset="50%" stopColor="#d4a84b" />
                      <stop offset="100%" stopColor="#78350f" />
                    </linearGradient>
                  </defs>
                  <text
                    x="50%"
                    y="58%"
                    textAnchor="middle"
                    fontFamily="var(--font-playfair), Georgia, serif"
                    fontSize="180"
                    fontWeight="700"
                    fill="url(#haus-gold)"
                  >
                    H
                  </text>
                </svg>
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent pointer-events-none" />

            <div className="relative z-10 flex flex-col justify-end h-full p-8 md:p-10">
              <span className="eyebrow mb-4">{eyebrow}</span>
              <h3 className="font-display text-3xl md:text-4xl text-white leading-[1.15] mb-5">
                {renderHeadline(headline)}
              </h3>
              <Link href={ctaLink} className="btn-ghost-gold self-start">
                {ctaLabel} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
