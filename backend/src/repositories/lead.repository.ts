import { Pool } from 'pg';
import { getPool } from '../lib/database';
import { Lead } from '../types';

export interface CreateLeadInput {
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  country?: string;
  enquiry?: string;
  carId?: string;
  source: string;
}

export class LeadRepository {
  /**
   * Create a new lead
   * Implements idempotency: returns existing lead if duplicate within 24h
   */
  async create(input: CreateLeadInput): Promise<string> {
    const pool = await getPool();

    // Check for duplicate lead within 24h (email + car_id)
    const checkQuery = `
      SELECT id FROM leads
      WHERE email = $1
        AND ($2::uuid IS NULL OR car_id = $2)
        AND created_at > NOW() - INTERVAL '24 hours'
      LIMIT 1
    `;

    const existingLead = await pool.query(checkQuery, [
      input.email,
      input.carId || null,
    ]);

    if (existingLead.rows.length > 0) {
      // Return existing lead ID (idempotent)
      return existingLead.rows[0].id;
    }

    // Create new lead
    const insertQuery = `
      INSERT INTO leads (
        first_name,
        last_name,
        email,
        phone,
        country,
        enquiry,
        car_id,
        source,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'new')
      RETURNING id
    `;

    const result = await pool.query(insertQuery, [
      input.firstName || null,
      input.lastName || null,
      input.email,
      input.phone || null,
      input.country || null,
      input.enquiry || null,
      input.carId || null,
      input.source,
    ]);

    return result.rows[0].id;
  }

  /**
   * Find lead by ID
   */
  async findById(id: string): Promise<Lead | null> {
    const pool = await getPool();

    const query = `
      SELECT * FROM leads WHERE id = $1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToLead(result.rows[0]);
  }

  /**
   * Find all leads with filters
   */
  async findAll(filters: {
    status?: string;
    carId?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ leads: Lead[]; total: number }> {
    const pool = await getPool();

    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (filters.status) {
      conditions.push(`status = $${paramIndex++}`);
      params.push(filters.status);
    }

    if (filters.carId) {
      conditions.push(`car_id = $${paramIndex++}`);
      params.push(filters.carId);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count query
    const countQuery = `SELECT COUNT(*) FROM leads ${whereClause}`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count, 10);

    // Data query
    const limit = filters.limit || 20;
    const offset = filters.offset || 0;

    const dataQuery = `
      SELECT * FROM leads
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    const dataResult = await pool.query(dataQuery, [...params, limit, offset]);

    return {
      leads: dataResult.rows.map(this.mapRowToLead),
      total,
    };
  }

  /**
   * Update lead status
   */
  async updateStatus(id: string, status: string): Promise<void> {
    const pool = await getPool();

    const query = `
      UPDATE leads
      SET status = $1, updated_at = NOW()
      WHERE id = $2
    `;

    await pool.query(query, [status, id]);
  }

  /**
   * Map database row to Lead object
   */
  private mapRowToLead(row: any): Lead {
    return {
      id: row.id,
      first_name: row.first_name,
      last_name: row.last_name,
      email: row.email,
      phone: row.phone,
      country: row.country,
      enquiry: row.enquiry,
      car_id: row.car_id,
      source: row.source,
      status: row.status,
      assigned_to: row.assigned_to,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}

// Singleton instance
let leadRepositoryInstance: LeadRepository | null = null;

export function getLeadRepository(): LeadRepository {
  if (!leadRepositoryInstance) {
    leadRepositoryInstance = new LeadRepository();
  }
  return leadRepositoryInstance;
}
