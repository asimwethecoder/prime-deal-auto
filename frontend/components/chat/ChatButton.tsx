'use client';

// Chat Button Component
// Floating action button that toggles the chat window

import Image from 'next/image';
import { X } from 'lucide-react';

interface ChatButtonProps {
  isOpen: boolean;
  onClick: () => void;
}

export function ChatButton({ isOpen, onClick }: ChatButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label={isOpen ? 'Close AI Assistant' : 'Open AI Assistant'}
      className="fixed bottom-24 right-6 md:bottom-6 w-[60px] h-[60px] rounded-full bg-[#405FF2] text-white shadow-lg flex items-center justify-center z-50 transition-transform duration-150 ease-out hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#405FF2]/50 focus:ring-offset-2"
    >
      {isOpen ? (
        <X className="w-6 h-6 transition-transform duration-150" />
      ) : (
        <Image
          src="/icons/ai-svgrepo-com.svg"
          alt="AI Assistant"
          width={28}
          height={28}
          className="invert transition-transform duration-150"
        />
      )}
    </button>
  );
}
