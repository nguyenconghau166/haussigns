'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
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
    transition: { staggerChildren: 0.08 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1] as const },
  },
};

export default function MaterialsPreview({ materials = [] }: { materials?: Material[] }) {
  if (!materials || materials.length === 0) return null;

  const list = materials.slice(0, 5);

  return (
    <section className="py-20 md:py-28 bg-slate-900">
      <div className="container">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <span className="eyebrow mb-3">Materials</span>
            <h2 className="font-display text-4xl md:text-5xl leading-[1.08] text-white mt-3">
              Quality is <span className="accent-italic">in the details.</span>
            </h2>
            <p className="mt-4 text-base md:text-lg text-slate-400 leading-relaxed max-w-md">
              We use the finest materials to create signage that not only looks exceptional but lasts.
            </p>
          </div>
          <Link href="/services/materials" className="btn-ghost-gold self-start md:self-end">
            Explore Materials →
          </Link>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4"
        >
          {list.map((material) => (
            <motion.div key={material.id} variants={cardVariants}>
              <Link
                href={`/services/materials/${material.slug}`}
                className="group block"
              >
                <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-slate-800">
                  {material.image ? (
                    <Image
                      src={material.image}
                      alt={material.name}
                      fill
                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600 text-sm">
                      No Image
                    </div>
                  )}
                </div>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white group-hover:text-amber-400 transition-colors truncate">
                    {material.name}
                  </h3>
                  <ArrowUpRight className="h-4 w-4 text-amber-400 flex-shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
