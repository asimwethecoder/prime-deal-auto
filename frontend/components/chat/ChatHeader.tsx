'use client';

// Chat Header Component
// Header with AI branding, new conversation button, and close button

import Image from 'next/image';
import { X, RefreshCw } from 'lucide-react';

interface ChatHeaderProps {
  onClose: () => void;
  onNewConversation: () => void;
  isLoading?: boolean;
}

export function ChatHeader({
  onClose,
  onNewConversation,
  isLoading,
}: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-[#E1E1E1] bg-white rounded-t-2xl sm:rounded-t-2xl">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-[#405FF2] flex items-center justify-center">
          <Image
            src="/icons/ai-svgrepo-com.svg"
            alt="AI"
            width={18}
            height={18}
            className="invert"
          />
        </div>
        <div>
          <h2
            id="chat-header-title"
            className="text-[16px] leading-[24px] font-medium text-[#050B20]"
          >
            AI Assistant
          </h2>
          <p className="text-[11px] text-gray-500">Prime Deal Auto</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onNewConversation}
          disabled={isLoading}
          aria-label="Start new conversation"
          title="New conversation"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[#050B20]/60 hover:text-[#050B20] hover:bg-[#F9FBFC] transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#405FF2]/50"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
        <button
          onClick={onClose}
          aria-label="Close chat"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[#050B20]/60 hover:text-[#050B20] hover:bg-[#F9FBFC] transition-colors focus:outline-none focus:ring-2 focus:ring-[#405FF2]/50"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
