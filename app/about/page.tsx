'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CTABanner from '@/components/CTABanner';
import { motion } from 'framer-motion';
import { Target, Heart, Lightbulb, Users, Award, Clock } from 'lucide-react';

const VALUES = [
  {
    title: 'Quality First',
    description: 'We use only premium materials — branded acrylics, 304-grade stainless steel, and certified LEDs.',
    icon: Award,
  },
  {
    title: 'Customer Focus',
    description: 'Free ocular inspections, transparent pricing, and dedicated project managers for every client.',
    icon: Heart,
  },
  {
    title: 'Innovation',
    description: 'We invest in CNC routers, laser cutters, and modern fabrication tools for precision work.',
    icon: Lightbulb,
  },
  {
    title: 'Reliability',
    description: 'On-time delivery guaranteed. We commit to timelines and deliver on our promises.',
    icon: Clock,
  },
];

const MILESTONES = [
  { year: '2018', title: 'Founded', description: 'Started as a small signage shop in Makati City.' },
  { year: '2019', title: 'First Major Client', description: 'Secured contract with a major commercial mall.' },
  { year: '2021', title: 'Expanded Workshop', description: 'Moved to a larger 200 sqm fabrication facility.' },
  { year: '2023', title: '500+ Projects', description: 'Reached 500 completed signage installations.' },
  { year: '2024', title: 'Metro Manila Coverage', description: 'Now serving all cities across Metro Manila.' },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen flex flex-col bg-white">
      <Navbar />

      {/* Hero */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 gradient-hero" />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-amber-400 mb-3">
              Our Story
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl">
              About <span className="gradient-text">SignsHaus</span>
            </h1>
            <p className="mt-5 text-lg text-slate-300/90 max-w-xl leading-relaxed">
              Metro Manila&apos;s leading signage fabrication company. With years of experience,
              we bring your brand vision to life through precision-crafted signage.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-amber-600 mb-3">
                Our Mission
              </span>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl mb-5">
                Making businesses visible, one sign at a time.
              </h2>
              <p className="text-slate-500 leading-relaxed mb-4">
                At SignsHaus, we believe every business deserves exceptional signage that reflects its brand identity.
                We specialize in all types of indoor and outdoor signage — from acrylic build-ups and stainless steel
                letters to LED neon signs and large-scale building markers.
              </p>
              <p className="text-slate-500 leading-relaxed">
                Our team of expert fabricators and installers ensures that every project meets the highest standards
                of quality and durability. We handle everything from design consultation to final installation.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="grid grid-cols-2 gap-4"
            >
              {[
                { value: '500+', label: 'Projects Completed' },
                { value: '7+', label: 'Years Experience' },
                { value: '50+', label: 'Partner Businesses' },
                { value: '98%', label: 'Client Retention' },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl bg-slate-50 border border-slate-200/80 p-6 text-center">
                  <div className="text-2xl md:text-3xl font-extrabold gradient-text">{stat.value}</div>
                  <div className="mt-1 text-xs text-slate-500">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 md:py-24 bg-slate-50">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-amber-600 mb-3">
              Our Values
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              What Drives Us
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {VALUES.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-7 rounded-2xl bg-white border border-slate-200/80 text-center hover:shadow-lg hover:border-amber-200/60 transition-all duration-300"
              >
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600 mb-4">
                  <value.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{value.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-amber-600 mb-3">
              Our Journey
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Company Milestones
            </h2>
          </motion.div>

          <div className="max-w-3xl mx-auto relative">
            {/* Timeline line */}
            <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px bg-slate-200 md:-translate-x-px" />

            {MILESTONES.map((milestone, index) => (
              <motion.div
                key={milestone.year}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className={`relative flex items-start gap-6 mb-8 md:mb-10 ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                  }`}
              >
                {/* Dot */}
                <div className="absolute left-6 md:left-1/2 w-3 h-3 bg-amber-500 rounded-full -translate-x-1/2 mt-1.5 ring-4 ring-white z-10" />

                {/* Content */}
                <div className={`ml-12 md:ml-0 md:w-[calc(50%-2rem)] ${index % 2 === 0 ? 'md:pr-8 md:text-right' : 'md:pl-8'
                  }`}>
                  <span className="text-sm font-bold text-amber-600">{milestone.year}</span>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">{milestone.title}</h3>
                  <p className="text-sm text-slate-500 mt-1">{milestone.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <CTABanner />
      <Footer />
    </main>
  );
}
