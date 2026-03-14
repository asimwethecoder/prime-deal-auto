// Chat API Module
// Functions for interacting with the chat endpoints

import { get, post, del } from './client';
import type {
  SendMessageRequest,
  SendMessageResponse,
  ChatSessionSummary,
  ChatSessionDetail,
} from '@/lib/types/chat';

// Re-export types for convenience
export type {
  SendMessageRequest,
  SendMessageResponse,
  ChatSessionSummary,
  ChatSessionDetail,
} from '@/lib/types/chat';

/**
 * Send a chat message
 * POST /chat (no auth required)
 */
export async function sendChatMessage(
  request: SendMessageRequest
): Promise<SendMessageResponse> {
  return post<SendMessageResponse>('/chat', request);
}

/**
 * Get user's chat sessions (authenticated only)
 * GET /chat/sessions
 */
export async function getChatSessions(): Promise<ChatSessionSummary[]> {
  return get<ChatSessionSummary[]>('/chat/sessions');
}

/**
 * Get session detail with message history
 * GET /chat/sessions/:id
 * For anonymous users, sessionToken query param is required
 */
export async function getChatSession(
  sessionId: string,
  sessionToken?: string
): Promise<ChatSessionDetail> {
  const params = sessionToken ? { sessionToken } : undefined;
  return get<ChatSessionDetail>(`/chat/sessions/${sessionId}`, params);
}

/**
 * Delete a chat session (authenticated only)
 * DELETE /chat/sessions/:id
 */
export async function deleteChatSession(sessionId: string): Promise<void> {
  return del<void>(`/chat/sessions/${sessionId}`);
}
