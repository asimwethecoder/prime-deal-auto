import { Pool } from 'pg';
import { getPool } from '../lib/database';
import { ChatMessage } from '../types/chat.types';

export interface CreateMessageParams {
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: Record<string, any>;
}

export class ChatMessageRepository {
  private pool: Pool | null = null;

  private async getPool(): Promise<Pool> {
    if (!this.pool) {
      this.pool = await getPool();
    }
    return this.pool;
  }

  /**
   * Create a new chat message
   */
  async create(params: CreateMessageParams): Promise<ChatMessage> {
    const pool = await this.getPool();
    
    const result = await pool.query<ChatMessage>(
      `INSERT INTO chat_messages (session_id, role, content, metadata)
       VALUES ($1, $2, $3, $4)
       RETURNING id, session_id, role, content, metadata, created_at::text`,
      [
        params.sessionId,
        params.role,
        params.content,
        JSON.stringify(params.metadata || {}),
      ]
    );

    return result.rows[0];
  }

  /**
   * Get messages for a session with optional limit
   * Returns messages ordered by created_at ASC (chronological)
   */
  async findBySessionId(sessionId: string, limit?: number): Promise<ChatMessage[]> {
    const pool = await this.getPool();
    
    let query = `
      SELECT id, session_id, role, content, metadata, created_at::text
      FROM chat_messages
      WHERE session_id = $1
      ORDER BY created_at ASC
    `;
    
    const params: any[] = [sessionId];
    
    if (limit) {
      // Get last N messages by using a subquery
      query = `
        SELECT id, session_id, role, content, metadata, created_at::text
        FROM (
          SELECT id, session_id, role, content, metadata, created_at
          FROM chat_messages
          WHERE session_id = $1
          ORDER BY created_at DESC
          LIMIT $2
        ) AS recent_messages
        ORDER BY created_at ASC
      `;
      params.push(limit);
    }
    
    const result = await pool.query<ChatMessage>(query, params);
    return result.rows;
  }

  /**
   * Get the last message for a session (for preview)
   */
  async findLastBySessionId(sessionId: string): Promise<ChatMessage | null> {
    const pool = await this.getPool();
    
    const result = await pool.query<ChatMessage>(
      `SELECT id, session_id, role, content, metadata, created_at::text
       FROM chat_messages
       WHERE session_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [sessionId]
    );

    return result.rows[0] || null;
  }
}

// Singleton instance
let messageRepositoryInstance: ChatMessageRepository | null = null;

export function getChatMessageRepository(): ChatMessageRepository {
  if (!messageRepositoryInstance) {
    messageRepositoryInstance = new ChatMessageRepository();
  }
  return messageRepositoryInstance;
}
