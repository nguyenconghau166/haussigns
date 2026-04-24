'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Menu, X, Phone, ShoppingBag, LayoutGrid, Hammer, FileText, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

const SearchOverlay = dynamic(() => import('./SearchOverlay'), {
  ssr: false,
});

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
  const pathname = usePathname();

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-slate-900/60">
        <div className="container flex h-14 sm:h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="relative h-10 w-36 sm:h-12 sm:w-48">
              <Image
                src="/logo-web.png"
                alt="HAUS SIGNS"
                fill
                className="object-contain object-left"
                priority
                sizes="(max-width: 768px) 144px, 192px"
              />
            </div>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex md:items-center md:space-x-7">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'text-[11px] font-semibold uppercase tracking-[0.22em] transition-colors hover:text-slate-900 dark:hover:text-amber-400',
                  pathname === item.href
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-slate-700 dark:text-slate-300'
                )}
              >
                {item.label}
              </Link>
            ))}

            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-amber-400 transition-colors"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </button>
            <Link
              href="/contact"
              className="inline-flex h-10 items-center justify-center rounded-md border border-amber-500 bg-transparent px-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-500 transition-colors hover:bg-amber-500 hover:text-slate-900"
            >
              Get a Quote
            </Link>
            <button
              onClick={() => setIsOpen(true)}
              className="hidden md:inline-flex items-center justify-center h-10 w-10 rounded-full border border-slate-700 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-amber-500 hover:text-amber-400 transition-colors"
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex items-center gap-1 md:hidden">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2.5 text-slate-700 dark:text-slate-200 rounded-lg active:bg-slate-100 dark:active:bg-slate-800"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </button>
            <button
              className="p-2.5 text-slate-700 dark:text-slate-200 rounded-lg active:bg-slate-100 dark:active:bg-slate-800"
              onClick={() => setIsOpen(!isOpen)}
              aria-label={isOpen ? 'Close menu' : 'Open menu'}
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Menu Content — slide down (also triggered by desktop hamburger badge) */}
        <div
          className={cn(
            'overflow-hidden transition-all duration-300 ease-in-out border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900',
            isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0 border-t-0'
          )}
        >
          <div className="container py-3 pb-4">
            <div className="flex flex-col space-y-1">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'text-base font-medium rounded-xl px-4 py-3 flex items-center gap-3 transition-colors active:bg-slate-100 dark:active:bg-slate-800',
                    pathname === item.href
                      ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  {item.icon && <item.icon className="h-5 w-5 flex-shrink-0" />}
                  {item.label}
                </Link>
              ))}
              <div className="pt-2 px-1">
                <Link
                  href="/contact"
                  className="inline-flex h-12 items-center justify-center rounded-xl bg-slate-900 dark:bg-amber-500 px-4 text-sm font-semibold text-white dark:text-slate-900 shadow w-full active:scale-[0.98] transition-transform"
                  onClick={() => setIsOpen(false)}
                >
                  Get Free Quote
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <SearchOverlay
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  );
}
