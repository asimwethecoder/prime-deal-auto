import { Pool } from 'pg';
import { getPool } from '../lib/database';
import { ChatSession } from '../types/chat.types';

export class ChatSessionRepository {
  private pool: Pool | null = null;

  private async getPool(): Promise<Pool> {
    if (!this.pool) {
      this.pool = await getPool();
    }
    return this.pool;
  }

  /**
   * Create a new chat session
   */
  async create(sessionToken: string, userId?: string): Promise<ChatSession> {
    const pool = await this.getPool();
    
    const result = await pool.query<ChatSession>(
      `INSERT INTO chat_sessions (session_token, user_id)
       VALUES ($1, $2)
       RETURNING id, user_id, session_token, 
                 created_at::text, updated_at::text`,
      [sessionToken, userId || null]
    );

    return result.rows[0];
  }

  /**
   * Find session by ID
   */
  async findById(sessionId: string): Promise<ChatSession | null> {
    const pool = await this.getPool();
    
    const result = await pool.query<ChatSession>(
      `SELECT id, user_id, session_token, 
              created_at::text, updated_at::text
       FROM chat_sessions
       WHERE id = $1`,
      [sessionId]
    );

    return result.rows[0] || null;
  }

  /**
   * Find session by token
   */
  async findByToken(sessionToken: string): Promise<ChatSession | null> {
    const pool = await this.getPool();
    
    const result = await pool.query<ChatSession>(
      `SELECT id, user_id, session_token, 
              created_at::text, updated_at::text
       FROM chat_sessions
       WHERE session_token = $1`,
      [sessionToken]
    );

    return result.rows[0] || null;
  }

  /**
   * Find all sessions for a user
   */
  async findByUserId(userId: string): Promise<ChatSession[]> {
    const pool = await this.getPool();
    
    const result = await pool.query<ChatSession>(
      `SELECT id, user_id, session_token, 
              created_at::text, updated_at::text
       FROM chat_sessions
       WHERE user_id = $1
       ORDER BY updated_at DESC`,
      [userId]
    );

    return result.rows;
  }

  /**
   * Link anonymous session to authenticated user
   */
  async linkToUser(sessionId: string, userId: string): Promise<void> {
    const pool = await this.getPool();
    
    await pool.query(
      `UPDATE chat_sessions
       SET user_id = $1, updated_at = NOW()
       WHERE id = $2`,
      [userId, sessionId]
    );
  }

  /**
   * Delete a session
   */
  async delete(sessionId: string): Promise<void> {
    const pool = await this.getPool();
    
    await pool.query(
      `DELETE FROM chat_sessions WHERE id = $1`,
      [sessionId]
    );
  }

  /**
   * Update session timestamp (touch)
   */
  async touch(sessionId: string): Promise<void> {
    const pool = await this.getPool();
    
    await pool.query(
      `UPDATE chat_sessions
       SET updated_at = NOW()
       WHERE id = $1`,
      [sessionId]
    );
  }
}

// Singleton instance
let sessionRepositoryInstance: ChatSessionRepository | null = null;

export function getChatSessionRepository(): ChatSessionRepository {
  if (!sessionRepositoryInstance) {
    sessionRepositoryInstance = new ChatSessionRepository();
  }
  return sessionRepositoryInstance;
}
