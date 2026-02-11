'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import StickyContact from '@/components/StickyContact';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

const PROJECTS = [
  {
    id: 1,
    title: 'High-Rise Building Logo',
    category: 'Corporate',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2670&auto=format&fit=crop',
    location: 'BGC, Taguig',
  },
  {
    id: 2,
    title: 'Neon Cafe Signage',
    category: 'Retail',
    image: 'https://images.unsplash.com/photo-1563291074-2bf8677ac0e5?q=80&w=2548&auto=format&fit=crop',
    location: 'Quezon City',
  },
  {
    id: 3,
    title: 'Luxury Spa Branding',
    category: 'Health',
    image: 'https://images.unsplash.com/photo-1542382156909-9ae37b3f56fd?q=80&w=2674&auto=format&fit=crop',
    location: 'Makati City',
  },
  {
    id: 4,
    title: 'Mall Wayfinding',
    category: 'Public',
    image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=2670&auto=format&fit=crop',
    location: 'Pasay City',
  },
  {
    id: 5,
    title: 'Office Reception Logo',
    category: 'Interior',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2301&auto=format&fit=crop',
    location: 'Ortigas Center',
  },
  {
    id: 6,
    title: 'Restaurant Facade',
    category: 'Retail',
    image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=2670&auto=format&fit=crop',
    location: 'Greenhills',
  },
];

const CATEGORIES = ['All', 'Corporate', 'Retail', 'Health', 'Public', 'Interior'];

export default function PortfolioPage() {
  const [filter, setFilter] = useState('All');

  const filteredProjects = filter === 'All' 
    ? PROJECTS 
    : PROJECTS.filter(project => project.category === filter);

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
            {CATEGORIES.map((category) => (
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
      <StickyContact />
    </main>
  );
}
