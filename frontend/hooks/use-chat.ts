'use client';

// Chat TanStack Query Hooks
// Handles API state management for chat widget

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  sendChatMessage,
  getChatSessions,
  getChatSession,
} from '@/lib/api/chat';
import type {
  SendMessageRequest,
  SendMessageResponse,
  ChatMessageDisplay,
  ChatSessionSummary,
} from '@/lib/types/chat';

/**
 * Query keys for chat-related queries
 */
export const chatKeys = {
  all: ['chat'] as const,
  sessions: () => [...chatKeys.all, 'sessions'] as const,
  session: (id: string) => [...chatKeys.all, 'session', id] as const,
  history: (id: string, token?: string) =>
    [...chatKeys.all, 'history', id, token] as const,
};

/**
 * Hook for sending chat messages with optimistic updates
 */
export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: SendMessageRequest) => sendChatMessage(request),
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      const queryKey = chatKeys.history(
        variables.sessionId || 'new',
        variables.sessionToken
      );
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous value
      const previousMessages =
        queryClient.getQueryData<ChatMessageDisplay[]>(queryKey);

      // Optimistically add user message
      const optimisticMessage: ChatMessageDisplay = {
        id: `temp-${Date.now()}`,
        role: 'user',
        content: variables.message,
        createdAt: new Date().toISOString(),
        status: 'sending',
      };

      queryClient.setQueryData<ChatMessageDisplay[]>(queryKey, (old) => [
        ...(old || []),
        optimisticMessage,
      ]);

      return { previousMessages, queryKey, optimisticMessage };
    },
    onSuccess: (data, variables, context) => {
      if (!context) return;

      // Update with real message and add assistant response
      queryClient.setQueryData<ChatMessageDisplay[]>(
        context.queryKey,
        (old) => {
          if (!old) return old;

          // Replace optimistic message with confirmed user message
          const updated = old.map((msg) =>
            msg.id === context.optimisticMessage.id
              ? { ...msg, status: 'sent' as const }
              : msg
          );

          // Add assistant response
          updated.push({
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: data.message,
            createdAt: data.createdAt,
            status: 'sent',
          });

          return updated;
        }
      );
    },
    onError: (error, variables, context) => {
      if (!context) return;

      // Mark message as failed
      queryClient.setQueryData<ChatMessageDisplay[]>(
        context.queryKey,
        (old) => {
          if (!old) return old;
          return old.map((msg) =>
            msg.id === context.optimisticMessage.id
              ? {
                  ...msg,
                  status: 'error' as const,
                  error:
                    error instanceof Error
                      ? error.message
                      : 'Failed to send message',
                }
              : msg
          );
        }
      );
    },
  });
}

/**
 * Hook for fetching chat history
 */
export function useChatHistory(
  sessionId: string | null,
  sessionToken: string | null,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: chatKeys.history(sessionId || '', sessionToken || undefined),
    queryFn: async (): Promise<ChatMessageDisplay[]> => {
      if (!sessionId) return [];
      const session = await getChatSession(
        sessionId,
        sessionToken || undefined
      );
      return session.messages.map((msg, index) => ({
        id: `${sessionId}-${index}`,
        role: msg.role,
        content: msg.content,
        createdAt: msg.createdAt,
        status: 'sent' as const,
      }));
    },
    enabled: enabled && !!sessionId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook for fetching user's chat sessions (authenticated only)
 */
export function useChatSessions(enabled: boolean = true) {
  return useQuery<ChatSessionSummary[]>({
    queryKey: chatKeys.sessions(),
    queryFn: getChatSessions,
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
