'use client';

import { useState, useEffect } from 'react';
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
    const { viber, messenger, phone, facebookPageId } = useSiteSettings();
    const [isDesktop, setIsDesktop] = useState(false);

    // Initial screen check
    useEffect(() => {
        const checkScreen = () => setIsDesktop(window.innerWidth > 768);
        checkScreen();
        window.addEventListener('resize', checkScreen);
        return () => window.removeEventListener('resize', checkScreen);
    }, []);

    // Inject Facebook SDK Logic
    useEffect(() => {
        if (!isDesktop || !facebookPageId) return;

        // Set attributes for the chat plugin
        const chatbox = document.getElementById('fb-customer-chat');
        if (chatbox) {
            chatbox.setAttribute("page_id", facebookPageId);
            chatbox.setAttribute("attribution", "biz_inbox");
        }

        // Initialize SDK
        window.fbAsyncInit = function () {
            window.FB.init({
                xfbml: true,
                version: 'v18.0'
            });
        };

        // Load SDK Script
        (function (d, s, id) {
            let js;
            const fjs = d.getElementsByTagName(s)[0] as HTMLElement;
            if (d.getElementById(id)) return;
            js = d.createElement(s) as HTMLScriptElement;
            js.id = id;
            js.src = 'https://connect.facebook.net/en_US/sdk/xfbml.customerchat.js';
            fjs.parentNode?.insertBefore(js, fjs);
        }(document, 'script', 'facebook-jssdk'));

    }, [isDesktop, facebookPageId]);

    // Show if we have any contact info OR we have the FB Page ID (for desktop popup)
    if (!viber && !messenger && !phone && !facebookPageId) return null;

    const toggleOpen = () => setIsOpen(!isOpen);

    // Determine if we should show the manual Messenger button
    // We hide it on Desktop IF we have the FB Plugin active (to avoid redundancy)
    const showMessengerButton = messenger && (!isDesktop || !facebookPageId);

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

    // Calculate position: If desktop + FB Plugin, shift up to avoid overlap
    const positionClass = (isDesktop && facebookPageId) ? "bottom-24" : "bottom-6";

    return (
        <>
            {/* Facebook Chat Plugin Roots */}
            {isDesktop && facebookPageId && (
                <>
                    <div id="fb-root"></div>
                    <div id="fb-customer-chat" className="fb-customerchat"></div>
                </>
            )}

            <div className={cn("fixed right-6 z-50 flex flex-col items-end gap-4 transition-all duration-300", positionClass)}>
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="flex flex-col items-end gap-3 mb-2"
                        >
                            {showMessengerButton && (
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
                    onClick={toggleOpen}
                    className={cn(
                        "h-14 w-14 rounded-full shadow-xl flex items-center justify-center text-white transition-colors duration-300",
                        isOpen ? "bg-slate-800 rotate-90" : "bg-amber-500 hover:bg-amber-600"
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
        </>
    );
}
