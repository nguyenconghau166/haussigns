'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';

interface Project {
  id: number | string;
  title: string;
  category: string;
  image: string;
  slug?: string;
}

export default function ProjectGallery({ projects = [] }: { projects?: Project[] }) {
  if (!projects || projects.length === 0) return null;

  const list = projects.slice(0, 5);

  return (
    <section className="py-20 md:py-28 bg-slate-950">
      <div className="container">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <span className="eyebrow mb-3">Our Work</span>
            <h2 className="font-display text-4xl md:text-5xl leading-[1.08] text-white mt-3">
              Signage that speaks <span className="accent-italic">for the brand.</span>
            </h2>
          </div>
          <Link href="/projects" className="btn-ghost-gold self-start md:self-end">
            View All Projects →
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {list.map((project, index) => {
            const href = project.slug ? `/projects/${project.slug}` : '/projects';
            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08, duration: 0.45 }}
                className="group"
              >
                <Link href={href} className="block">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-slate-900">
                    <Image
                      src={project.image}
                      alt={project.title}
                      fill
                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <div className="mt-4 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-white font-semibold text-base md:text-lg truncate">
                        {project.title}
                      </h3>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400 mt-1">
                        {project.category}
                      </p>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-amber-400 flex-shrink-0 mt-1 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
