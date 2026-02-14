'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, MessageSquare, Phone } from 'lucide-react';
import { useSiteSettings } from '@/lib/useSiteSettings';
import { cn } from '@/lib/utils';

declare global {
    interface Window {
        fbAsyncInit: () => void;
        FB: {
            init: (options: { xfbml: boolean; version: string }) => void;
        };
    }
}

export default function FloatingChat() {
    const [isOpen, setIsOpen] = useState(false);
    const [shouldShake, setShouldShake] = useState(false);
    const hasAutoOpened = useRef(false);
    const { viber, messenger, phone } = useSiteSettings();

    // Auto-shake after 5 seconds then auto-expand
    useEffect(() => {
        if (hasAutoOpened.current) return;

        const timer = setTimeout(() => {
            if (!hasAutoOpened.current) {
                setShouldShake(true);
                // After the shake animation (1s), auto-expand the menu
                setTimeout(() => {
                    setShouldShake(false);
                    setIsOpen(true);
                    hasAutoOpened.current = true;
                }, 1000);
            }
        }, 5000);

        return () => clearTimeout(timer);
    }, []);

    // Show if we have any contact info
    if (!viber && !messenger && !phone) return null;

    const toggleOpen = () => {
        hasAutoOpened.current = true;
        setIsOpen(!isOpen);
    };

    const containerVariants = {
        hidden: { opacity: 0, y: 20, scale: 0.8 },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                duration: 0.2,
                staggerChildren: 0.05,
                delayChildren: 0.05
            }
        },
        exit: {
            opacity: 0,
            y: 20,
            scale: 0.8,
            transition: { duration: 0.15 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, x: 20 },
        visible: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: 20 }
    };

    // Shake / wiggle keyframes for the FAB button
    const shakeAnimation = shouldShake
        ? {
            rotate: [0, -12, 10, -10, 8, -6, 4, -2, 0],
            scale: [1, 1.15, 1.1, 1.12, 1.08, 1.05, 1.02, 1],
            transition: {
                duration: 0.8,
                ease: [0.42, 0, 0.58, 1] as const,
            },
        }
        : {};

    return (
        <div className="fixed right-6 bottom-6 z-50 flex flex-col items-end gap-4 transition-all duration-300">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="flex flex-col items-end gap-3 mb-2"
                    >
                        {messenger && (
                            <motion.a
                                variants={itemVariants}
                                href={messenger}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 pl-4 pr-3 py-2.5 bg-white rounded-full shadow-lg border border-slate-100 hover:bg-blue-50 transition-colors group"
                            >
                                <span className="text-sm font-medium text-slate-700 group-hover:text-blue-600">Messenger</span>
                                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-sm">
                                    <MessageCircle className="h-5 w-5" />
                                </div>
                            </motion.a>
                        )}

                        {viber && (
                            <motion.a
                                variants={itemVariants}
                                href={viber}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 pl-4 pr-3 py-2.5 bg-white rounded-full shadow-lg border border-slate-100 hover:bg-purple-50 transition-colors group"
                            >
                                <span className="text-sm font-medium text-slate-700 group-hover:text-purple-600">Viber</span>
                                <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white shadow-sm">
                                    <MessageSquare className="h-5 w-5" />
                                </div>
                            </motion.a>
                        )}

                        {phone && (
                            <motion.a
                                variants={itemVariants}
                                href={`tel:${phone}`}
                                className="flex items-center gap-3 pl-4 pr-3 py-2.5 bg-white rounded-full shadow-lg border border-slate-100 hover:bg-amber-50 transition-colors group"
                            >
                                <span className="text-sm font-medium text-slate-700 group-hover:text-amber-600">Call Now</span>
                                <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-white shadow-sm">
                                    <Phone className="h-5 w-5" />
                                </div>
                            </motion.a>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                animate={shakeAnimation}
                onClick={toggleOpen}
                className={cn(
                    "h-14 w-14 rounded-full shadow-xl flex items-center justify-center text-white transition-colors duration-300",
                    isOpen ? "bg-slate-800 rotate-90" : "bg-amber-500 hover:bg-amber-600",
                    shouldShake && "ring-4 ring-amber-300/50 ring-offset-2"
                )}
            >
                <AnimatePresence mode='wait'>
                    {isOpen ? (
                        <motion.div
                            key="close"
                            initial={{ opacity: 0, rotate: -90 }}
                            animate={{ opacity: 1, rotate: 0 }}
                            exit={{ opacity: 0, rotate: 90 }}
                        >
                            <X className="h-6 w-6" />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="chat"
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                        >
                            <MessageCircle className="h-7 w-7" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.button>
        </div>
    );
}
