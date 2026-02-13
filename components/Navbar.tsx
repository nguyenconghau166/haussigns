'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, Phone, ShoppingBag, LayoutGrid, Hammer, FileText, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import SearchOverlay from './SearchOverlay';

const NAV_ITEMS = [
  { label: 'Home', href: '/' },
  { label: 'Sign Types', href: '/services/types', icon: LayoutGrid },
  { label: 'Industries', href: '/services/industries', icon: ShoppingBag },
  { label: 'Materials', href: '/services/materials', icon: Hammer },
  { label: 'Projects', href: '/projects', icon: LayoutGrid },
  { label: 'Blog', href: '/blog', icon: FileText },
  { label: 'Contact', href: '/contact', icon: Phone },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="relative h-12 w-48">
              <Image
                src="/logo-web.png"
                alt="HAUS SIGNS"
                fill
                className="object-contain object-left"
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex md:items-center md:space-x-6">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-slate-700 transition-colors hover:text-slate-900"
              >
                {item.label}
              </Link>
            ))}

            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2 text-slate-700 hover:text-slate-900 transition-colors"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </button>
            <Link
              href="/contact"
              className={cn(
                "inline-flex h-9 items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow transition-colors hover:bg-slate-900/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50"
              )}
            >
              Get a Quote
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          < div className="flex items-center gap-2 md:hidden" >
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2 text-slate-700"
              aria-label="Search"
            >
              <Search className="h-6 w-6" />
            </button>
            <button
              className="p-2 text-slate-700"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Content */}
        {isOpen && (
          <div className="container md:hidden py-4 border-t bg-white">
            <div className="flex flex-col space-y-4">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-base font-medium text-slate-700 hover:text-slate-900 flex items-center gap-2"
                  onClick={() => setIsOpen(false)}
                >
                  {item.icon && <item.icon className="h-4 w-4" />}
                  {item.label}
                </Link>
              ))}
              <Link
                href="/contact"
                className="inline-flex h-10 items-center justify-center rounded-md bg-slate-900 px-4 text-sm font-medium text-white shadow w-full"
                onClick={() => setIsOpen(false)}
              >
                Get Free Quote
              </Link>
            </div>
          </div>
        )}
      </nav>

      <SearchOverlay
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  );
}
