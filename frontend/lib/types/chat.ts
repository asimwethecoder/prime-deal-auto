// Chat Widget TypeScript Types
// Types for the AI chat widget frontend

/**
 * Message role enum
 */
export type MessageRole = 'user' | 'assistant' | 'system';

/**
 * Message status for optimistic updates and error handling
 */
export type MessageStatus = 'sending' | 'sent' | 'error';

/**
 * Display message type (extends API type with UI state)
 */
export interface ChatMessageDisplay {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: string;
  status?: MessageStatus;
  error?: string;
}

/**
 * Send message request
 */
export interface SendMessageRequest {
  message: string;
  sessionId?: string;
  sessionToken?: string;
}

/**
 * Send message response (from POST /chat)
 */
export interface SendMessageResponse {
  sessionId: string;
  sessionToken?: string;
  message: string;
  createdAt: string;
}

/**
 * Session summary (from GET /chat/sessions)
 */
export interface ChatSessionSummary {
  sessionId: string;
  createdAt: string;
  updatedAt: string;
  lastMessagePreview: string;
}

/**
 * Session detail with messages (from GET /chat/sessions/:id)
 */
export interface ChatSessionDetail {
  sessionId: string;
  createdAt: string;
  updatedAt: string;
  messages: Array<{
    role: MessageRole;
    content: string;
    createdAt: string;
  }>;
}

/**
 * Parsed car reference from message content
 */
export interface CarReference {
  carId: string;
  url: string;
  startIndex: number;
  endIndex: number;
}

/**
 * Message segment for rendering (text or car card)
 */
export interface MessageSegment {
  type: 'text' | 'car';
  content: string;
  carId?: string;
}
