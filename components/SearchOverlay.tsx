'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Search, ArrowRight, Layers, FileText, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchItem {
    title: string;
    description: string;
    href: string;
    category: 'service' | 'page';
    icon?: React.ElementType;
}

const SEARCH_ITEMS: SearchItem[] = [
    { title: 'Acrylic Build-Up', description: 'Sleek 3D letters for malls & offices', href: '/services/types/acrylic-signage', category: 'service' },
    { title: 'Stainless Steel', description: 'Premium durable letters, Gold/Mirror/Hairline', href: '/services/types/stainless-steel', category: 'service' },
    { title: 'LED Neon Lights', description: 'Vibrant neons for cafes & creative spaces', href: '/services/types/neon-lights', category: 'service' },
    { title: 'Panaflex Lightbox', description: 'Illuminated signage for outdoor displays', href: '/services/types/panaflex', category: 'service' },
    { title: 'Building Identity', description: 'Large-scale pylon & building markers', href: '/services/types/building-identity', category: 'service' },
    { title: 'Wall Murals', description: 'Custom wallpapers & vinyl stickers', href: '/services/types/wall-murals', category: 'service' },
    { title: 'About Us', description: 'Learn about SignsHaus story and team', href: '/about', category: 'page' },
    { title: 'Contact / Get Quote', description: 'Request a free quote or ocular inspection', href: '/contact', category: 'page' },
    { title: 'Portfolio', description: 'View our past projects and installations', href: '/portfolio', category: 'page' },
];

export default function SearchOverlay({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const [query, setQuery] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    const filtered = useMemo(() => {
        return query.trim()
            ? SEARCH_ITEMS.filter(
                (item) =>
                    item.title.toLowerCase().includes(query.toLowerCase()) ||
                    item.description.toLowerCase().includes(query.toLowerCase())
            )
            : SEARCH_ITEMS;
    }, [query]);

    const services = useMemo(() => filtered.filter((i) => i.category === 'service'), [filtered]);
    const pages = useMemo(() => filtered.filter((i) => i.category === 'page'), [filtered]);
    const allResults = useMemo(() => [...services, ...pages], [services, pages]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            // We reset state here to ensure fresh search when opening
            // This is acceptable behavior for a modal
            setQuery(''); // eslint-disable-line react-hooks/exhaustive-deps
            setActiveIndex(0);
            // Small timeout to allow animation to start/DOM to be ready
            const timer = setTimeout(() => inputRef.current?.focus(), 100);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    // Keyboard shortcut: Ctrl+K / Cmd+K
    useEffect(() => {
        const handleGlobalKey = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                if (isOpen) {
                    onClose();
                }
            }
        };
        window.addEventListener('keydown', handleGlobalKey);
        return () => window.removeEventListener('keydown', handleGlobalKey);
    }, [isOpen, onClose]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveIndex((i) => Math.min(i + 1, allResults.length - 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveIndex((i) => Math.max(i - 1, 0));
            } else if (e.key === 'Enter' && allResults[activeIndex]) {
                onClose();
                window.location.href = allResults[activeIndex].href;
            } else if (e.key === 'Escape') {
                onClose();
            }
        },
        [allResults, activeIndex, onClose]
    );

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] md:pt-[15vh]"
                    onClick={onClose}
                >
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />

                    {/* Search Panel */}
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                        className="relative z-10 w-[95vw] max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200/80 overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Search Input */}
                        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
                            <Search className="h-5 w-5 text-slate-400 flex-shrink-0" />
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder="Search services, pages..."
                                value={query}
                                onChange={(e) => {
                                    setQuery(e.target.value);
                                    setActiveIndex(0);
                                }}
                                onKeyDown={handleKeyDown}
                                className="flex-1 text-base text-slate-800 placeholder:text-slate-400 outline-none bg-transparent"
                            />
                            <button
                                onClick={onClose}
                                className="flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-200 transition-colors"
                            >
                                ESC
                            </button>
                        </div>

                        {/* Results */}
                        <div className="max-h-[60vh] overflow-y-auto p-2">
                            {allResults.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                    <Sparkles className="h-8 w-8 mb-3 opacity-50" />
                                    <p className="text-sm">No results found for &quot;{query}&quot;</p>
                                </div>
                            )}

                            {services.length > 0 && (
                                <div className="mb-1">
                                    <p className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Services</p>
                                    {services.map((item, i) => {
                                        const globalIdx = i;
                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                onClick={onClose}
                                                className={`flex items-center gap-3 rounded-xl px-3 py-3 transition-colors ${activeIndex === globalIdx
                                                    ? 'bg-amber-50 text-slate-900'
                                                    : 'text-slate-600 hover:bg-slate-50'
                                                    }`}
                                                onMouseEnter={() => setActiveIndex(globalIdx)}
                                            >
                                                <div className={`flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0 ${activeIndex === globalIdx ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'
                                                    }`}>
                                                    <Layers className="h-4 w-4" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">{item.title}</p>
                                                    <p className="text-xs text-slate-400 truncate">{item.description}</p>
                                                </div>
                                                <ArrowRight className={`h-4 w-4 flex-shrink-0 transition-opacity ${activeIndex === globalIdx ? 'opacity-100 text-amber-500' : 'opacity-0'
                                                    }`} />
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}

                            {pages.length > 0 && (
                                <div>
                                    <p className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Pages</p>
                                    {pages.map((item, i) => {
                                        const globalIdx = services.length + i;
                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                onClick={onClose}
                                                className={`flex items-center gap-3 rounded-xl px-3 py-3 transition-colors ${activeIndex === globalIdx
                                                    ? 'bg-amber-50 text-slate-900'
                                                    : 'text-slate-600 hover:bg-slate-50'
                                                    }`}
                                                onMouseEnter={() => setActiveIndex(globalIdx)}
                                            >
                                                <div className={`flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0 ${activeIndex === globalIdx ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'
                                                    }`}>
                                                    <FileText className="h-4 w-4" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">{item.title}</p>
                                                    <p className="text-xs text-slate-400 truncate">{item.description}</p>
                                                </div>
                                                <ArrowRight className={`h-4 w-4 flex-shrink-0 transition-opacity ${activeIndex === globalIdx ? 'opacity-100 text-amber-500' : 'opacity-0'
                                                    }`} />
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs text-slate-400">
                            <div className="flex items-center gap-3">
                                <span className="flex items-center gap-1"><kbd className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px]">↑↓</kbd> navigate</span>
                                <span className="flex items-center gap-1"><kbd className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px]">↵</kbd> open</span>
                            </div>
                            <span className="flex items-center gap-1"><kbd className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd> toggle</span>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
