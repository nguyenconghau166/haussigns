'use client';

import {
  Type,
  Lightbulb,
  Hammer,
  PaintBucket,
  Building,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

// Map icon names to components
const ICON_MAP: Record<string, any> = {
  Type,
  Lightbulb,
  Hammer,
  PaintBucket,
  Building,
  Zap,
};

interface Service {
  title: string;
  description: string;
  icon_name: string;
  slug: string;
  gradient: string;
  bg: string;
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] as const },
  },
};

export default function ServiceGrid({ services = [] }: { services?: Service[] }) {
  if (!services || services.length === 0) return null;

  return (
    <section className="py-20 md:py-28 bg-white relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 pattern-dots opacity-40" />

      <div className="container relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14 md:mb-16"
        >
          <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-amber-600 mb-3">
            What We Do
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
            Our Expertise
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-base md:text-lg text-slate-500">
            We specialize in all types of indoor and outdoor signage fabrication,
            from concept to installation.
          </p>
        </motion.div>

        {/* Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="mx-auto grid max-w-6xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {services.map((service) => {
            const Icon = ICON_MAP[service.icon_name] || Hammer;

            return (
              <motion.div key={service.slug} variants={cardVariants}>
                <Link
                  href={`/services/types/${service.slug}`}
                  className="group relative flex flex-col rounded-2xl border border-slate-200/80 bg-white p-7 transition-all duration-300 hover:shadow-xl hover:border-amber-200/60 hover:-translate-y-1"
                >
                  {/* Gradient hover background */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-50/0 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  <div className="relative z-10">
                    {/* Icon */}
                    <div className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl ${service.bg} transition-transform duration-300 group-hover:scale-110`}>
                      <Icon className={`h-6 w-6 bg-gradient-to-r ${service.gradient} bg-clip-text`} style={{ color: 'inherit' }} />
                    </div>

                    {/* Title */}
                    <h3 className="mb-2 text-lg font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                      {service.title}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-slate-500 leading-relaxed">
                      {service.description}
                    </p>

                    {/* Link indicator */}
                    <div className="mt-5 flex items-center text-sm font-medium text-amber-600 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-0 group-hover:translate-x-1">
                      Learn more →
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
