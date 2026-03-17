'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface Material {
  id: string | number;
  name: string;
  slug: string;
  image?: string;
  best_for?: string;
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
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

export default function MaterialsPreview({ materials = [] }: { materials?: Material[] }) {
  if (!materials || materials.length === 0) return null;

  return (
    <section className="py-20 md:py-28 bg-slate-900 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -right-20 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
      </div>

      <div className="container relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14 md:mb-16"
        >
          <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-amber-400 mb-3">
            Premium Materials
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl">
            Built to Last
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-base md:text-lg text-slate-400">
            We use only the highest quality materials for every project.
            Each material is chosen for durability, aesthetics, and performance.
          </p>
        </motion.div>

        {/* Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto"
        >
          {materials.slice(0, 8).map((material) => (
            <motion.div key={material.id} variants={cardVariants}>
              <Link
                href={`/services/materials/${material.slug}`}
                className="group relative flex flex-col rounded-2xl border border-slate-700/60 bg-slate-800/50 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/10 hover:border-amber-500/30 hover:-translate-y-1"
              >
                {/* Image */}
                <div className="relative h-48 w-full bg-slate-800 overflow-hidden">
                  {material.image ? (
                    <Image
                      src={material.image}
                      alt={material.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600 text-sm">
                      No Image
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="text-lg font-bold text-white mb-1 group-hover:text-amber-400 transition-colors">
                    {material.name}
                  </h3>
                  {material.best_for && (
                    <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">
                      {material.best_for}
                    </p>
                  )}
                  <div className="mt-3 flex items-center text-sm font-medium text-amber-400 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    Learn more <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* View All Link */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-12 text-center"
        >
          <Link
            href="/services/materials"
            className="inline-flex items-center text-amber-400 font-semibold hover:text-amber-300 transition-colors group"
          >
            View All Materials
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
