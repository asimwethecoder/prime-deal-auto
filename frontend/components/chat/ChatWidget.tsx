'use client';

// Chat Widget Root Component
// Manages visibility, state, and renders button + window

import { useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ChatButton } from './ChatButton';
import { useChatStore } from '@/lib/stores/chat-store';
import { isChatVisibleOnRoute } from '@/lib/utils/chat-visibility';
import { getStoredSessionId } from '@/lib/utils/chat-session';

// Lazy load ChatWindow to reduce initial bundle size
const ChatWindow = dynamic(
  () => import('./ChatWindow').then((mod) => ({ default: mod.ChatWindow })),
  {
    ssr: false,
    loading: () => null,
  }
);

export function ChatWidget() {
  const pathname = usePathname();
  const { isOpen, toggle, close, sessionId, setSessionId } = useChatStore();

  // Check if chat should be visible on current route
  const isVisible = isChatVisibleOnRoute(pathname);

  // Load stored session on mount
  useEffect(() => {
    if (!sessionId) {
      const storedId = getStoredSessionId();
      if (storedId) {
        setSessionId(storedId);
      }
    }
  }, [sessionId, setSessionId]);

  // Handle toggle with focus management
  const handleToggle = useCallback(() => {
    toggle();
  }, [toggle]);

  // Handle close with focus return to button
  const handleClose = useCallback(() => {
    close();
    // Return focus to chat button after close
    setTimeout(() => {
      const button = document.querySelector('[aria-label="Open chat"]');
      if (button instanceof HTMLElement) {
        button.focus();
      }
    }, 100);
  }, [close]);

  // Don't render on excluded routes
  if (!isVisible) {
    return null;
  }

  return (
    <>
      {/* Chat Window (conditionally rendered) */}
      {isOpen && <ChatWindow onClose={handleClose} />}

      {/* Floating Action Button */}
      <ChatButton isOpen={isOpen} onClick={handleToggle} />
    </>
  );
}
