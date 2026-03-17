'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

const WHATSAPP_LINK = 'https://wa.link/r12kgt';

export function WhatsAppFloatingButton() {
  return (
    <motion.a
      href={WHATSAPP_LINK}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-6 left-6 w-[60px] h-[60px] rounded-full bg-[#25D366] text-white shadow-lg hidden md:flex items-center justify-center z-50 focus:outline-none focus:ring-2 focus:ring-[#25D366]/50 focus:ring-offset-2"
      animate={{ y: [0, -6, 0] }}
      transition={{ duration: 0.6, ease: 'easeInOut', repeat: Infinity, repeatDelay: 5 }}
      whileHover={{ scale: 1.12 }}
      data-cursor-magnetic
    >
      <Image
        src="/icons/whatsapp-svgrepo-com.svg"
        alt=""
        width={32}
        height={32}
        className="invert"
        aria-hidden
      />
    </motion.a>
  );
}
