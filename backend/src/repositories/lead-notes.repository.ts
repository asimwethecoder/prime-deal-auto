import { getPool } from '../lib/database';
import { LeadNote } from '../types';

export interface CreateNoteInput {
  leadId: string;
  noteText: string;
  createdBy?: string;
}

export class LeadNotesRepository {
  /**
   * Create a new note for a lead
   */
  async create(input: CreateNoteInput): Promise<string> {
    const pool = await getPool();
    const query = `
      INSERT INTO lead_notes (lead_id, note_text, created_by)
      VALUES ($1, $2, $3)
      RETURNING id
    `;
    const result = await pool.query(query, [
      input.leadId,
      input.noteText,
      input.createdBy || null,
    ]);
    return result.rows[0].id;
  }

  /**
   * Find all notes for a lead
   */
  async findByLeadId(leadId: string): Promise<LeadNote[]> {
    const pool = await getPool();
    const query = `
      SELECT n.*, u.full_name as created_by_name
      FROM lead_notes n
      LEFT JOIN users u ON n.created_by = u.id
      WHERE n.lead_id = $1
      ORDER BY n.created_at DESC
    `;
    const result = await pool.query(query, [leadId]);
    return result.rows.map(row => ({
      id: row.id,
      lead_id: row.lead_id,
      note_text: row.note_text,
      created_by: row.created_by,
      created_by_name: row.created_by_name,
      created_at: row.created_at,
    }));
  }

  /**
   * Delete a note
   */
  async delete(noteId: string): Promise<void> {
    const pool = await getPool();
    await pool.query('DELETE FROM lead_notes WHERE id = $1', [noteId]);
  }
}


// Singleton instance
let leadNotesRepositoryInstance: LeadNotesRepository | null = null;

export function getLeadNotesRepository(): LeadNotesRepository {
  if (!leadNotesRepositoryInstance) {
    leadNotesRepositoryInstance = new LeadNotesRepository();
  }
  return leadNotesRepositoryInstance;
}
