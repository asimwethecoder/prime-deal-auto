'use client';

// Chat Window Component
// Main chat panel composing header, message list, and input

import { useEffect, useRef, useCallback } from 'react';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { useChatStore } from '@/lib/stores/chat-store';
import { useSendMessage, useChatHistory } from '@/hooks/use-chat';
import {
  getStoredSessionId,
  getStoredSessionToken,
  storeSessionCredentials,
  clearSessionCredentials,
} from '@/lib/utils/chat-session';
import type { ChatMessageDisplay } from '@/lib/types/chat';

interface ChatWindowProps {
  onClose: () => void;
}

export function ChatWindow({ onClose }: ChatWindowProps) {
  const inputRef = useRef<HTMLDivElement>(null);
  const { sessionId, setSessionId } = useChatStore();

  // Get stored session credentials for anonymous users
  const storedSessionId = getStoredSessionId();
  const storedSessionToken = getStoredSessionToken();

  // Use stored session if available
  const activeSessionId = sessionId || storedSessionId;
  const activeSessionToken = storedSessionToken;

  // Fetch chat history
  const {
    data: historyMessages = [],
    isLoading: isLoadingHistory,
    error: historyError,
    refetch: refetchHistory,
  } = useChatHistory(activeSessionId, activeSessionToken, !!activeSessionId);

  // Send message mutation
  const sendMessage = useSendMessage();

  // Focus input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      const input = inputRef.current?.querySelector('textarea');
      input?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Handle sending a message
  const handleSend = useCallback(
    (message: string) => {
      sendMessage.mutate(
        {
          message,
          sessionId: activeSessionId || undefined,
          sessionToken: activeSessionToken || undefined,
        },
        {
          onSuccess: (data) => {
            // Store session credentials for anonymous users
            if (data.sessionToken) {
              storeSessionCredentials(data.sessionId, data.sessionToken);
            }
            // Update session ID in store
            if (!sessionId) {
              setSessionId(data.sessionId);
            }
          },
        }
      );
    },
    [activeSessionId, activeSessionToken, sendMessage, sessionId, setSessionId]
  );

  // Handle new conversation
  const handleNewConversation = useCallback(() => {
    clearSessionCredentials();
    setSessionId(null);
  }, [setSessionId]);

  // Combine history messages with optimistic messages
  const messages: ChatMessageDisplay[] = historyMessages;

  // Determine if typing indicator should show
  const isTyping = sendMessage.isPending;

  return (
    <div
      role="dialog"
      aria-labelledby="chat-header-title"
      aria-modal="true"
      className="fixed bottom-24 right-6 z-50 flex flex-col bg-white shadow-xl animate-chat-slide-up
        w-[calc(100vw-48px)] max-w-[400px] h-[calc(100vh-120px)] max-h-[600px]
        rounded-2xl overflow-hidden
        sm:w-[400px] sm:h-[600px] sm:max-h-[600px]
        max-sm:fixed max-sm:inset-0 max-sm:w-full max-sm:h-full max-sm:max-w-none max-sm:max-h-none max-sm:rounded-none max-sm:bottom-0 max-sm:right-0"
    >
      {/* Header */}
      <ChatHeader
        onClose={onClose}
        onNewConversation={handleNewConversation}
        isLoading={isLoadingHistory || sendMessage.isPending}
      />

      {/* Message List */}
      <MessageList
        messages={messages}
        isLoading={isLoadingHistory}
        isTyping={isTyping}
        error={historyError}
        onRetry={() => refetchHistory()}
      />

      {/* Input */}
      <div ref={inputRef}>
        <MessageInput
          onSend={handleSend}
          isLoading={sendMessage.isPending}
          disabled={isLoadingHistory}
        />
      </div>
    </div>
  );
}
