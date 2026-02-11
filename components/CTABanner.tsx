'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Phone } from 'lucide-react';

export default function CTABanner() {
    return (
        <section className="relative py-20 md:py-28 overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 gradient-hero" />
            <div className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                }}
            />
            {/* Gradient orbs */}
            <div className="absolute -top-20 -right-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl" />

            <div className="container relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-80px' }}
                    transition={{ duration: 0.6 }}
                    className="max-w-3xl mx-auto text-center"
                >
                    <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-amber-400 mb-4">
                        Ready to Get Started?
                    </span>
                    <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl leading-tight">
                        Elevate Your Business with{' '}
                        <span className="gradient-text">Premium Signage</span>
                    </h2>
                    <p className="mt-5 text-base md:text-lg text-slate-300/90 max-w-xl mx-auto leading-relaxed">
                        Get a free ocular inspection and quotation. We serve all of Metro Manila
                        with fast turnaround and competitive pricing.
                    </p>

                    <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link href="/contact" className="btn-primary text-base !px-8 !py-3.5 group">
                            Get Free Quote
                            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                        <a
                            href="tel:+639171234567"
                            className="btn-secondary text-base !px-8 !py-3.5 group"
                        >
                            <Phone className="mr-2 h-4 w-4" />
                            Call Us Now
                        </a>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
