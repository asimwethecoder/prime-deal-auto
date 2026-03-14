'use client';

// Message List Component
// Scrollable container for chat messages with auto-scroll

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { RefreshCw } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { MessageSkeleton } from './MessageSkeleton';
import { TypingIndicator } from './TypingIndicator';
import type { ChatMessageDisplay } from '@/lib/types/chat';

interface MessageListProps {
  messages: ChatMessageDisplay[];
  isLoading: boolean;
  isTyping: boolean;
  error?: Error | null;
  onRetry?: () => void;
  onRetryMessage?: (messageId: string) => void;
}

export function MessageList({
  messages,
  isLoading,
  isTyping,
  error,
  onRetry,
  onRetryMessage,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages or typing indicator
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Loading state - show skeleton
  if (isLoading) {
    return (
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto"
        role="log"
        aria-live="polite"
        aria-label="Chat messages loading"
      >
        <MessageSkeleton />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto flex items-center justify-center p-4"
        role="log"
        aria-live="polite"
      >
        <div className="text-center">
          <p className="text-[14px] text-red-500 mb-2">
            Failed to load messages
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-2 mx-auto text-[14px] text-[#405FF2] hover:underline focus:outline-none focus:ring-2 focus:ring-[#405FF2]/50 rounded px-2 py-1"
            >
              <RefreshCw className="w-4 h-4" />
              Try again
            </button>
          )}
        </div>
      </div>
    );
  }

  // Empty state - welcome message
  if (messages.length === 0 && !isTyping) {
    return (
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto flex items-center justify-center p-4"
        role="log"
        aria-live="polite"
      >
        <div className="text-center max-w-[280px]">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#405FF2] flex items-center justify-center">
            <Image
              src="/icons/ai-svgrepo-com.svg"
              alt="AI Assistant"
              width={32}
              height={32}
              className="invert"
            />
          </div>
          <h3 className="text-[16px] font-medium text-[#050B20] mb-2">
            Hi! I&apos;m your AI Assistant
          </h3>
          <p className="text-[14px] text-gray-500">
            I can help you find the perfect car at Prime Deal Auto. Ask me about makes, models, prices, or features!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto p-4 space-y-3"
      role="log"
      aria-live="polite"
      aria-label="Chat messages"
    >
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          onRetry={
            message.status === 'error' && onRetryMessage
              ? () => onRetryMessage(message.id)
              : undefined
          }
        />
      ))}

      {/* Typing indicator */}
      {isTyping && <TypingIndicator />}

      {/* Scroll anchor */}
      <div ref={bottomRef} />
    </div>
  );
}
