'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

function getBaseMessage(pathname: string): string {
  if (pathname === '/') return "Hi! I'm your Prime Deal Assistant. How can I help?";
  if (pathname === '/cars') return 'Looking for something specific? Ask me about any car!';
  if (pathname.match(/^\/cars\/[^/]+$/)) return '';
  if (pathname === '/search') return "Tell me your budget or model and I'll filter these for you!";
  return "Hi! I'm your Prime Deal Assistant. How can I help?";
}

interface AINudgeBubbleProps {
  onDismiss: () => void;
}

export function AINudgeBubble({ onDismiss }: AINudgeBubbleProps) {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState(() => getBaseMessage(pathname));

  // Resolve car detail message client-side
  useEffect(() => {
    if (!pathname.match(/^\/cars\/[^/]+$/)) return;
    const heading = document.querySelector('h1, h2');
    const model = heading?.textContent?.trim();
    setMessage(
      model
        ? `Want to check availability or book a test drive for this ${model}?`
        : 'Want to check availability or book a test drive for this car?'
    );
  }, [pathname]);

  useEffect(() => {
    // Delay appearance by 3 seconds
    const showTimer = setTimeout(() => setVisible(true), 3000);
    return () => clearTimeout(showTimer);
  }, []);

  useEffect(() => {
    if (!visible) return;

    // Auto-dismiss after 15 seconds
    const autoTimer = setTimeout(() => onDismiss(), 15000);

    // Dismiss on scroll > 300px
    let scrollStart = window.scrollY;
    const handleScroll = () => {
      if (Math.abs(window.scrollY - scrollStart) > 300) onDismiss();
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      clearTimeout(autoTimer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [visible, onDismiss]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, x: 20, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1, y: [0, -4, 0] }}
          exit={{ opacity: 0, x: 20, scale: 0.9 }}
          transition={{
            // Entry: spring
            opacity: { type: 'spring', stiffness: 300, damping: 24 },
            x: { type: 'spring', stiffness: 300, damping: 24 },
            scale: { type: 'spring', stiffness: 300, damping: 24 },
            // Idle float
            y: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
          }}
          onClick={onDismiss}
          className="
            fixed z-50 cursor-pointer
            right-[80px] bottom-24 md:bottom-6
            max-sm:right-4 max-sm:bottom-[140px]
            bg-white/90 backdrop-blur-md border border-white/20
            shadow-xl rounded-2xl p-3
            text-sm font-medium text-[#405FF2] max-w-[200px]
          "
          role="status"
          aria-live="polite"
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
