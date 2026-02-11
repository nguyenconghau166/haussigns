'use client';

import Link from 'next/link';
import { Facebook, Instagram, Mail, MapPin, Phone, MessageCircle, MessageSquare } from 'lucide-react';
import { useSiteSettings } from '@/lib/useSiteSettings';


const SERVICES_LINKS = [
  { label: 'Acrylic Signage', href: '/services/types/acrylic-signage' },
  { label: 'Stainless Steel', href: '/services/types/stainless-steel' },
  { label: 'LED Neon Lights', href: '/services/types/neon-lights' },
  { label: 'Panaflex Lightbox', href: '/services/types/panaflex' },
  { label: 'Building Identity', href: '/services/types/building-identity' },
  { label: 'Wall Murals', href: '/services/types/wall-murals' },
];

const COMPANY_LINKS = [
  { label: 'About Us', href: '/about' },
  { label: 'Portfolio', href: '/portfolio' },
  { label: 'Contact Us', href: '/contact' },
];

export default function Footer() {
  const {
    phone,
    email,
    address,
    facebook,
    instagram,
    viber,
    messenger
  } = useSiteSettings();

  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
      {/* Subtle top gradient line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />

      {/* Main Footer */}
      <div className="container py-14 md:py-20">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="inline-block">
              <span className="text-2xl font-extrabold tracking-tight">
                Signs<span className="gradient-text">Haus</span>
              </span>
            </Link>
            <p className="mt-4 text-sm text-slate-400 leading-relaxed max-w-xs">
              Professional signage fabrication & installation in Metro Manila.
              Trusted by 500+ businesses since 2018.
            </p>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-amber-500 mb-5">
              Services
            </h3>
            <ul className="space-y-3">
              {SERVICES_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-amber-500 mb-5">
              Company
            </h3>
            <ul className="space-y-3">
              {COMPANY_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-amber-500 mb-5">
              Contact
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <span className="text-sm text-slate-300">{address}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-amber-500 shrink-0" />
                <a href={`tel:${phone}`} className="hover:text-amber-500 transition-colors">
                  {phone}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-amber-500 shrink-0" />
                <a href={`mailto:${email}`} className="hover:text-amber-500 transition-colors">
                  {email}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="container pt-8 mt-12 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-slate-500 text-sm">
          © {new Date().getFullYear()} SignsHaus. All rights reserved.
        </p>

        {/* Social Links */}
        <div className="flex items-center gap-4">
          {facebook && (
            <a
              href={facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full bg-slate-800 hover:bg-amber-500 hover:text-slate-900 transition-all"
              aria-label="Facebook"
            >
              <Facebook className="h-5 w-5" />
            </a>
          )}
          {instagram && (
            <a
              href={instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full bg-slate-800 hover:bg-amber-500 hover:text-slate-900 transition-all"
              aria-label="Instagram"
            >
              <Instagram className="h-5 w-5" />
            </a>
          )}
          {messenger && (
            <a
              href={messenger}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full bg-slate-800 hover:bg-amber-500 hover:text-slate-900 transition-all"
              aria-label="Messenger"
            >
              <MessageCircle className="h-5 w-5" />
            </a>
          )}
          {viber && (
            <a
              href={viber}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full bg-slate-800 hover:bg-amber-500 hover:text-slate-900 transition-all"
              aria-label="Viber"
            >
              <MessageSquare className="h-5 w-5" />
            </a>
          )}
        </div>
      </div>
    </footer>
  );
}
