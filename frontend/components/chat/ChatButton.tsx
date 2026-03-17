'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

interface ChatButtonProps {
  isOpen: boolean;
  onClick: () => void;
  nudgeActive?: boolean;
}

export function ChatButton({ isOpen, onClick, nudgeActive }: ChatButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      aria-label={isOpen ? 'Close AI Assistant' : 'Open AI Assistant'}
      className={`fixed bottom-24 right-6 md:bottom-6 w-[60px] h-[60px] rounded-full bg-[#405FF2] text-white shadow-lg flex items-center justify-center z-50 focus:outline-none focus:ring-2 focus:ring-[#405FF2]/50 focus:ring-offset-2 ${isOpen ? 'max-sm:hidden' : ''}`}
      animate={
        isOpen
          ? {}
          : nudgeActive
            ? { boxShadow: ['0px 0px 0px rgba(64, 95, 242, 0)', '0px 0px 15px rgba(64, 95, 242, 0.4)', '0px 0px 0px rgba(64, 95, 242, 0)'] }
            : { scale: [1, 1.05, 1], boxShadow: ['0 0 0 0 rgba(64,95,242,0)', '0 0 20px 4px rgba(64,95,242,0.35)', '0 0 0 0 rgba(64,95,242,0)'] }
      }
      transition={isOpen ? {} : { duration: nudgeActive ? 2 : 2.5, repeat: Infinity, ease: 'easeInOut' }}
      whileHover={{ scale: 1.12 }}
      data-cursor-magnetic
    >
      {isOpen ? (
        <X className="w-6 h-6" />
      ) : (
        <Image
          src="/icons/ai-svgrepo-com.svg"
          alt="AI Assistant"
          width={28}
          height={28}
          className="invert"
        />
      )}
    </motion.button>
  );
}
