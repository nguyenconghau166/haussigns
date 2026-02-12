'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { getProjects } from '@/lib/dataService';

export default function PortfolioPage() {
  const [filter, setFilter] = useState('All');
  const [projects, setProjects] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);

  useEffect(() => {
    async function loadProjects() {
      const data = await getProjects();
      setProjects(data);

      // Extract unique categories
      const uniqueCats = Array.from(new Set(data.map((p: any) => p.category))).filter(Boolean) as string[];
      setCategories(['All', ...uniqueCats]);
    }
    loadProjects();
  }, []);

  const filteredProjects = filter === 'All' 
    ? projects 
    : projects.filter(project => project.category === filter);

  return (
    <main className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <section className="bg-slate-900 py-20 text-center text-white">
        <div className="container px-4">
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight md:text-6xl">
            Our <span className="text-yellow-500">Portfolio</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-300 md:text-xl">
            See how we help brands stand out across Metro Manila. From sketch to installation.
          </p>
        </div>
      </section>

      <section className="py-16 bg-slate-50">
        <div className="container px-4">
          {/* Filters */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setFilter(category)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  filter === category
                    ? 'bg-slate-900 text-white shadow-lg scale-105'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Grid */}
          <motion.div 
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredProjects.map((project) => (
              <motion.div
                layout
                key={project.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-200"
              >
                <Image
                  src={project.image}
                  alt={project.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-0 left-0 p-6 text-white w-full">
                    <p className="text-xs font-bold text-yellow-400 uppercase tracking-wider mb-1">{project.category}</p>
                    <h3 className="text-xl font-bold mb-1">{project.title}</h3>
                    <div className="flex justify-between items-center text-sm text-slate-300">
                      <span>{project.location}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-20 bg-white text-center">
        <div className="container px-4">
          <h2 className="text-3xl font-bold mb-4">Ready to start your project?</h2>
          <p className="text-slate-500 mb-8 max-w-xl mx-auto">
            Contact us today for a free ocular inspection and quote.
          </p>
          <Link href="/contact" className="btn-primary text-base px-8 py-3 rounded-full">
            Get Free Quote
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
