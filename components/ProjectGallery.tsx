'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

const PROJECTS: {
  id: number;
  title: string;
  category: string;
  image: string;
  size: string;
}[] = [];

export default function ProjectGallery() {
  if (PROJECTS.length === 0) return null;
  if (PROJECTS.length === 0) return null;

  return (
    <section className="py-20 bg-white">
      <div className="container px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <span className="text-yellow-600 font-bold tracking-wider text-sm uppercase">Our Portfolio</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mt-2">Recent Masterpieces</h2>
            <p className="text-slate-500 mt-2 max-w-xl">
              See how we help brands stand out across Metro Manila. From sketch to installation.
            </p>
          </div>
          <button className="px-6 py-2 border border-slate-200 rounded-full font-medium hover:bg-slate-50 transition-colors text-slate-900">
            View All Projects
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-4 h-[800px] md:h-[600px]">
          {PROJECTS.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`relative group overflow-hidden rounded-2xl ${project.size}`}
            >
              <Image
                src={project.image}
                alt={project.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-0 left-0 p-6 text-white">
                  <p className="text-sm font-medium text-yellow-400 mb-1">{project.category}</p>
                  <h3 className="text-xl font-bold">{project.title}</h3>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
