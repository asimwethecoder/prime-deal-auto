import { z } from 'zod';

// ============================================
// Database Types
// ============================================

export interface ChatSession {
  id: string;
  user_id: string | null;
  session_token: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata: Record<string, any>;
  created_at: string;
}

// ============================================
// Request/Response Types
// ============================================

export interface SendMessageParams {
  message: string;
  sessionId?: string;
  sessionToken?: string;
  userId?: string;
}

export interface ChatResponse {
  sessionId: string;
  sessionToken?: string;
  message: string;
  createdAt: string;
}

export interface SessionSummary {
  sessionId: string;
  createdAt: string;
  updatedAt: string;
  lastMessagePreview: string;
}

export interface SessionDetail {
  sessionId: string;
  createdAt: string;
  updatedAt: string;
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    createdAt: string;
  }>;
}

// ============================================
// Bedrock Types
// ============================================

export interface BedrockMessage {
  role: 'user' | 'assistant';
  content: MessageContent[];
}

export type MessageContent =
  | { text: string }
  | { toolUse: ToolUseBlock }
  | { toolResult: ToolResultBlock };

export interface ToolUseBlock {
  toolUseId: string;
  name: string;
  input: Record<string, any>;
}

export interface ToolResultBlock {
  toolUseId: string;
  content: Array<{ json: any }>;
  status?: 'success' | 'error';
}

export interface ConverseResponse {
  stopReason: 'end_turn' | 'tool_use' | 'max_tokens';
  message: BedrockMessage;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}

// ============================================
// Zod Validation Schemas
// ============================================

export const PostChatSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(2000, 'Message too long'),
  sessionId: z.string().uuid().optional(),
  sessionToken: z.string().uuid().optional(),
});

export type PostChatRequest = z.infer<typeof PostChatSchema>;

export const GetSessionSchema = z.object({
  sessionId: z.string().uuid(),
  sessionToken: z.string().uuid().optional(),
});

export type GetSessionRequest = z.infer<typeof GetSessionSchema>;

export const DeleteSessionSchema = z.object({
  sessionId: z.string().uuid(),
});

export type DeleteSessionRequest = z.infer<typeof DeleteSessionSchema>;
