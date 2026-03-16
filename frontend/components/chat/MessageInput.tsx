'use client';

// Message Input Component
// Text input with send button for composing chat messages

import { useState, useRef, KeyboardEvent } from 'react';
import { Send, Loader2 } from 'lucide-react';

interface MessageInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

const MAX_CHARS = 2000;
const CHAR_WARNING_THRESHOLD = 1800;

export function MessageInput({ onSend, isLoading, disabled }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const trimmedMessage = message.trim();
  const canSend = trimmedMessage.length > 0 && !isLoading && !disabled;
  const showCharCount = message.length > CHAR_WARNING_THRESHOLD;
  const isOverLimit = message.length > MAX_CHARS;

  const handleSend = () => {
    if (!canSend || isOverLimit) return;
    onSend(trimmedMessage);
    setMessage('');
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= MAX_CHARS) {
      setMessage(value);
    }
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  return (
    <div
      className="border-t border-[#E1E1E1] p-3 bg-white"
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0.75rem))' }}
    >
      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            disabled={disabled || isLoading}
            rows={1}
            className="w-full resize-none rounded-xl border border-[#E1E1E1] px-4 py-3 pr-12 text-[15px] leading-[26px] text-[#050B20] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#405FF2]/20 focus:border-[#405FF2] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ minHeight: '48px', maxHeight: '120px' }}
          />
          {showCharCount && (
            <span
              className={`absolute bottom-2 right-14 text-xs ${
                isOverLimit ? 'text-red-500' : 'text-gray-400'
              }`}
            >
              {message.length}/{MAX_CHARS}
            </span>
          )}
        </div>
        <button
          onClick={handleSend}
          disabled={!canSend || isOverLimit}
          aria-label="Send message"
          className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#405FF2] text-white flex items-center justify-center transition-all hover:bg-[#3451d1] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#405FF2] focus:outline-none focus:ring-2 focus:ring-[#405FF2]/50 focus:ring-offset-2"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
}
