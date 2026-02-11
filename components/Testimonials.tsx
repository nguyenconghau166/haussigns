'use client';

import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

interface Testimonial {
    name: string;
    role: string;
    content: string;
    rating: number;
}

export default function Testimonials({ testimonials = [] }: { testimonials?: Testimonial[] }) {
    if (!testimonials || testimonials.length === 0) return null;

    return (
        <section className="py-20 md:py-28 bg-slate-50 relative overflow-hidden">
            {/* Background accents */}
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-amber-100/50 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-blue-100/30 rounded-full blur-3xl" />

            <div className="container relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-80px' }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-14"
                >
                    <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-amber-600 mb-3">
                        Testimonials
                    </span>
                    <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
                        What Our Clients Say
                    </h2>
                    <p className="mt-4 max-w-2xl mx-auto text-base md:text-lg text-slate-500">
                        Trusted by hundreds of businesses across Metro Manila.
                    </p>
                </motion.div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                    {testimonials.map((testimonial, index) => (
                        <motion.div
                            key={testimonial.name}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-60px' }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="relative rounded-2xl bg-white border border-slate-200/80 p-7 md:p-8 shadow-sm hover:shadow-lg transition-shadow duration-300"
                        >
                            {/* Quote icon */}
                            <Quote className="h-8 w-8 text-amber-200 mb-4" />

                            {/* Stars */}
                            <div className="flex gap-0.5 mb-4">
                                {Array.from({ length: testimonial.rating }).map((_, i) => (
                                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                                ))}
                            </div>

                            {/* Content */}
                            <p className="text-sm md:text-base text-slate-600 leading-relaxed mb-6">
                                &ldquo;{testimonial.content}&rdquo;
                            </p>

                            {/* Author */}
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm">
                                    {testimonial.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">{testimonial.name}</p>
                                    <p className="text-xs text-slate-400">{testimonial.role}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
