'use client';

import { useState } from 'react';
import { Phone, MessageCircle, Send, X, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useSiteSettings } from '@/lib/useSiteSettings';

export default function StickyContact() {
  const [isExpanded, setIsExpanded] = useState(false);
  const { phone, viber, messenger } = useSiteSettings();

  const contactMethods = [
    {
      label: 'Call',
      icon: Phone,
      href: phone ? `tel:${phone}` : undefined,
      bg: 'bg-green-500',
      show: !!phone,
    },
    {
      label: 'Viber',
      icon: MessageCircle,
      href: viber,
      bg: 'bg-purple-500',
      show: !!viber && viber !== '#',
    },
    {
      label: 'Messenger',
      icon: Send,
      href: messenger,
      bg: 'bg-blue-500',
      show: !!messenger && messenger !== '#',
    },
  ];

  // If no contact methods are available, don't render anything
  if (!contactMethods.some(m => m.show)) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {/* Expanded contact options */}
      <AnimatePresence>
        {isExpanded && (
          <>
            {contactMethods.filter(m => m.show).map((method, index) => (
              <motion.a
                key={method.label}
                href={method.href}
                target={method.label === 'Call' ? undefined : '_blank'}
                rel="noopener noreferrer"
                initial={{ opacity: 0, scale: 0.5, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.5, y: 10 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className={cn(
                  'flex items-center gap-2 rounded-full px-4 py-2.5 shadow-lg transition-transform active:scale-95 text-white',
                  method.bg
                )}
              >
                <method.icon className="h-4 w-4" />
                <span className="text-sm font-medium">{method.label}</span>
              </motion.a>
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'flex h-14 w-14 items-center justify-center rounded-full shadow-xl transition-all duration-300',
          isExpanded
            ? 'bg-slate-800 rotate-0'
            : 'bg-amber-500 animate-pulse-glow'
        )}
        whileTap={{ scale: 0.9 }}
      >
        {isExpanded ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <MessageSquare className="h-6 w-6 text-white" />
        )}
      </motion.button>
    </div>
  );
}
