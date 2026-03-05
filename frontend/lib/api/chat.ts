// Chat API Module
// Functions for interacting with the chat endpoints

import { get, post, del } from './client';
import { ChatMessage, ChatSession } from './types';

/**
 * Send message request
 */
export interface SendMessageRequest {
  message: string;
  sessionToken?: string; // Optional for continuing existing session
}

/**
 * Send message response
 */
export interface SendMessageResponse {
  message: string; // AI assistant response
  sessionToken: string; // Session token for subsequent messages
  conversationId: string; // Session ID
}

/**
 * Send a message to the AI chat assistant
 * 
 * @param request - Message and optional session token
 * @returns AI response with session token
 */
export async function sendChatMessage(
  request: SendMessageRequest
): Promise<SendMessageResponse> {
  return post<SendMessageResponse>('/chat', request);
}

/**
 * Get all chat sessions for the current user
 * Requires authentication
 * 
 * @returns List of chat sessions
 */
export async function getChatSessions(): Promise<ChatSession[]> {
  return get<ChatSession[]>('/chat/sessions');
}

/**
 * Get a specific chat session with messages
 * Requires authentication
 * 
 * @param sessionId - Session UUID
 * @returns Session with messages
 */
export async function getChatSession(sessionId: string): Promise<{
  session: ChatSession;
  messages: ChatMessage[];
}> {
  return get<{ session: ChatSession; messages: ChatMessage[] }>(
    `/chat/sessions/${sessionId}`
  );
}

/**
 * Delete a chat session
 * Requires authentication
 * 
 * @param sessionId - Session UUID
 */
export async function deleteChatSession(sessionId: string): Promise<void> {
  return del<void>(`/chat/sessions/${sessionId}`);
}

/**
 * Get messages for a session
 * Requires authentication
 * 
 * @param sessionId - Session UUID
 * @returns List of messages
 */
export async function getChatMessages(sessionId: string): Promise<ChatMessage[]> {
  const response = await getChatSession(sessionId);
  return response.messages;
}
