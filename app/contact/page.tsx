'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import { Phone, Mail, MapPin, Clock, Send, MessageCircle, Loader2 } from 'lucide-react';

const CONTACT_INFO = [
  {
    icon: Phone,
    title: 'Phone',
    value: '+63 917 123 4567',
    href: 'tel:+639171234567',
    description: 'Call us for immediate assistance',
  },
  {
    icon: Mail,
    title: 'Email',
    value: 'inquiry@signshaus.ph',
    href: 'mailto:inquiry@signshaus.ph',
    description: 'We reply within 24 hours',
  },
  {
    icon: MapPin,
    title: 'Office',
    value: 'Unit 123, Sample Building',
    href: '#',
    description: 'Makati City, Metro Manila',
  },
  {
    icon: Clock,
    title: 'Hours',
    value: 'Mon–Sat: 8AM – 6PM',
    href: '#',
    description: 'Sunday by appointment',
  },
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    type: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setSuccess(true);
        setFormData({ name: '', phone: '', email: '', type: '', message: '' });
      } else {
        alert('Something went wrong. Please try again.');
      }
    } catch (error) {
      console.error(error);
      alert('Error sending message');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

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
              Get in Touch
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl">
              Contact <span className="gradient-text">Us</span>
            </h1>
            <p className="mt-5 text-lg text-slate-300/90 max-w-xl leading-relaxed">
              Get a free quote for your signage project today! We serve all of Metro Manila.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Cards + Form */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="max-w-6xl mx-auto">
            {/* Contact Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
              {CONTACT_INFO.map((info, index) => (
                <motion.a
                  key={info.title}
                  href={info.href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="flex items-start gap-4 p-5 rounded-2xl border border-slate-200/80 bg-white hover:border-amber-200/60 hover:shadow-lg transition-all duration-300 group"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600 flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <info.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{info.title}</p>
                    <p className="text-sm font-semibold text-slate-900 mt-0.5">{info.value}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{info.description}</p>
                  </div>
                </motion.a>
              ))}
            </div>

            {/* Main Grid: Form + Map */}
            <div className="grid lg:grid-cols-5 gap-8">
              {/* Form */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="lg:col-span-3"
              >
                <div className="rounded-2xl border border-slate-200/80 bg-white p-7 md:p-10 shadow-sm">
                  <h2 className="text-2xl font-extrabold text-slate-900 mb-1">Send us a Message</h2>
                  <p className="text-sm text-slate-500 mb-8">Fill out the form below and we&apos;ll get back to you within 24 hours.</p>

                  {success ? (
                    <div className="bg-green-50 text-green-700 p-4 rounded-lg text-center">
                      <p className="font-bold">Message Sent!</p>
                      <p className="text-sm">We will contact you shortly.</p>
                      <button onClick={() => setSuccess(false)} className="mt-4 text-sm underline">Send another</button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Name</label>
                          <input
                            required
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            type="text"
                            placeholder="Juan Dela Cruz"
                            className="input-premium"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Phone</label>
                          <input
                            required
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            type="tel"
                            placeholder="+63 917 XXX XXXX"
                            className="input-premium"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Email</label>
                        <input
                          required
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          type="email"
                          placeholder="juan@email.com"
                          className="input-premium"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Signage Type</label>
                        <select
                          name="type"
                          value={formData.type}
                          onChange={handleChange}
                          className="input-premium text-slate-600"
                        >
                          <option value="">Select a signage type...</option>
                          <option value="acrylic">Acrylic Build-Up</option>
                          <option value="stainless">Stainless Steel</option>
                          <option value="neon">LED Neon Lights</option>
                          <option value="panaflex">Panaflex Lightbox</option>
                          <option value="building">Building Identity</option>
                          <option value="wall-mural">Wall Murals</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Message</label>
                        <textarea
                          required
                          name="message"
                          value={formData.message}
                          onChange={handleChange}
                          placeholder="Tell us about your project — dimensions, location, budget, etc."
                          className="input-premium min-h-[140px] resize-y"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full !py-3.5 text-base group disabled:opacity-70"
                      >
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                        Send Inquiry
                      </button>
                    </form>
                  )}
                </div>
              </motion.div>

              {/* Sidebar */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="lg:col-span-2 space-y-6"
              >
                {/* Quick Contact */}
                <div className="rounded-2xl gradient-hero p-7 text-white">
                  <h3 className="text-lg font-bold mb-4">Need Faster Response?</h3>
                  <p className="text-sm text-slate-300 mb-6 leading-relaxed">
                    For urgent inquiries, contact us directly through these channels:
                  </p>
                  <div className="space-y-3">
                    <a
                      href="tel:+639171234567"
                      className="flex items-center gap-3 rounded-xl bg-white/10 p-3 text-sm font-medium text-white hover:bg-white/20 transition-colors border border-white/10"
                    >
                      <Phone className="h-4 w-4 text-green-400" />
                      Call: +63 917 123 4567
                    </a>
                    <a
                      href="viber://chat?number=+639171234567"
                      className="flex items-center gap-3 rounded-xl bg-white/10 p-3 text-sm font-medium text-white hover:bg-white/20 transition-colors border border-white/10"
                    >
                      <MessageCircle className="h-4 w-4 text-purple-400" />
                      Chat on Viber
                    </a>
                    <a
                      href="https://m.me/signshaus"
                      className="flex items-center gap-3 rounded-xl bg-white/10 p-3 text-sm font-medium text-white hover:bg-white/20 transition-colors border border-white/10"
                    >
                      <Send className="h-4 w-4 text-blue-400" />
                      Facebook Messenger
                    </a>
                  </div>
                </div>

                {/* Map placeholder */}
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-7 text-center">
                  <MapPin className="h-8 w-8 text-amber-500 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-slate-900 mb-1">Visit Our Workshop</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Unit 123, Sample Building<br />
                    Makati City, Metro Manila<br />
                    <span className="text-amber-600 font-medium">Open Mon–Sat, 8AM – 6PM</span>
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
