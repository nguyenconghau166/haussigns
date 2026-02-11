'use client';

import { useState } from 'react';
import { Phone, MessageCircle, Send, X, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function StickyContact() {
  const [isExpanded, setIsExpanded] = useState(false);

  const contactMethods = [
    {
      label: 'Call',
      icon: Phone,
      href: 'tel:+639171234567',
      bg: 'bg-green-500',
    },
    {
      label: 'Viber',
      icon: MessageCircle,
      href: 'viber://chat?number=+639171234567',
      bg: 'bg-purple-500',
    },
    {
      label: 'Messenger',
      icon: Send,
      href: 'https://m.me/signshaus',
      bg: 'bg-blue-500',
    },
  ];

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {/* Expanded contact options */}
      <AnimatePresence>
        {isExpanded && (
          <>
            {contactMethods.map((method, index) => (
              <motion.a
                key={method.label}
                href={method.href}
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
