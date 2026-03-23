import { getPool } from '../lib/database';
import { Lead, LeadWithCar, LeadStatusHistory, LeadStats } from '../types';

export interface CreateLeadInput {
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  whatsappNumber?: string;
  country?: string;
  subject?: string;
  enquiry?: string;
  carId?: string;
  source: string;
  enquiryType?: 'general' | 'test_drive' | 'car_enquiry';
}

export interface LeadFilters {
  status?: string;
  enquiryType?: string;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  carId?: string;
  limit?: number;
  offset?: number;
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
      return existingLead.rows[0].id;
    }

    const insertQuery = `
      INSERT INTO leads (
        first_name, last_name, email, phone, whatsapp_number,
        country, subject, enquiry, car_id, source, enquiry_type, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'new')
      RETURNING id
    `;

    const result = await pool.query(insertQuery, [
      input.firstName || null,
      input.lastName || null,
      input.email,
      input.phone || null,
      input.whatsappNumber || null,
      input.country || null,
      input.subject || null,
      input.enquiry || null,
      input.carId || null,
      input.source,
      input.enquiryType || 'general',
    ]);

    return result.rows[0].id;
  }


  /**
   * Find lead by ID
   */
  async findById(id: string): Promise<Lead | null> {
    const pool = await getPool();
    const result = await pool.query('SELECT * FROM leads WHERE id = $1', [id]);
    if (result.rows.length === 0) return null;
    return this.mapRowToLead(result.rows[0]);
  }

  /**
   * Find lead by ID with car details
   */
  async findByIdWithCar(id: string): Promise<LeadWithCar | null> {
    const pool = await getPool();
    const query = `
      SELECT 
        l.*,
        c.id as car_id_ref, c.make as car_make, c.model as car_model,
        c.variant as car_variant, c.year as car_year, c.price as car_price,
        (SELECT cloudfront_url FROM car_images WHERE car_id = c.id AND is_primary = true LIMIT 1) as car_primary_image
      FROM leads l
      LEFT JOIN cars c ON l.car_id = c.id
      WHERE l.id = $1
    `;
    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) return null;
    return this.mapRowToLeadWithCar(result.rows[0]);
  }

  /**
   * Find all leads with filters (for admin)
   */
  async findAllWithFilters(filters: LeadFilters): Promise<{ leads: LeadWithCar[]; total: number }> {
    const pool = await getPool();
    const conditions: string[] = [];
    const params: (string | number | Date)[] = [];
    let paramIndex = 1;

    if (filters.status) {
      conditions.push(`l.status = $${paramIndex++}`);
      params.push(filters.status);
    }
    if (filters.enquiryType) {
      conditions.push(`l.enquiry_type = $${paramIndex++}`);
      params.push(filters.enquiryType);
    }
    if (filters.carId) {
      conditions.push(`l.car_id = $${paramIndex++}`);
      params.push(filters.carId);
    }
    if (filters.search) {
      conditions.push(`(l.first_name ILIKE $${paramIndex} OR l.last_name ILIKE $${paramIndex} OR l.email ILIKE $${paramIndex} OR l.phone ILIKE $${paramIndex})`);
      params.push(`%${filters.search}%`);
      paramIndex++;
    }
    if (filters.dateFrom) {
      conditions.push(`l.created_at >= $${paramIndex++}`);
      params.push(filters.dateFrom);
    }
    if (filters.dateTo) {
      conditions.push(`l.created_at <= $${paramIndex++}`);
      params.push(filters.dateTo);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const countResult = await pool.query(`SELECT COUNT(*) FROM leads l ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count, 10);

    const limit = Math.min(filters.limit || 20, 100);
    const offset = filters.offset || 0;

    const dataQuery = `
      SELECT l.*, c.id as car_id_ref, c.make as car_make, c.model as car_model,
        c.variant as car_variant, c.year as car_year, c.price as car_price,
        (SELECT cloudfront_url FROM car_images WHERE car_id = c.id AND is_primary = true LIMIT 1) as car_primary_image
      FROM leads l LEFT JOIN cars c ON l.car_id = c.id
      ${whereClause} ORDER BY l.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    const dataResult = await pool.query(dataQuery, [...params, limit, offset]);

    return { leads: dataResult.rows.map((row) => this.mapRowToLeadWithCar(row)), total };
  }


  /**
   * Update lead status with history tracking
   */
  async updateStatus(id: string, newStatus: string, changedBy?: string): Promise<void> {
    const pool = await getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get current status
      const currentResult = await client.query('SELECT status FROM leads WHERE id = $1', [id]);
      const oldStatus = currentResult.rows[0]?.status;

      // Update lead status
      await client.query('UPDATE leads SET status = $1, updated_at = NOW() WHERE id = $2', [newStatus, id]);

      // Create history record
      await client.query(
        'INSERT INTO lead_status_history (lead_id, old_status, new_status, changed_by) VALUES ($1, $2, $3, $4)',
        [id, oldStatus, newStatus, changedBy || null]
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get status history for a lead
   */
  async getStatusHistory(leadId: string): Promise<LeadStatusHistory[]> {
    const pool = await getPool();
    const query = `
      SELECT h.*, u.full_name as changed_by_name
      FROM lead_status_history h
      LEFT JOIN users u ON h.changed_by = u.id
      WHERE h.lead_id = $1
      ORDER BY h.changed_at DESC
    `;
    const result = await pool.query(query, [leadId]);
    return result.rows.map(row => ({
      id: row.id,
      lead_id: row.lead_id,
      old_status: row.old_status,
      new_status: row.new_status,
      changed_by: row.changed_by,
      changed_by_name: row.changed_by_name,
      changed_at: row.changed_at,
    }));
  }

  /**
   * Get lead statistics for dashboard
   */
  async getStats(): Promise<LeadStats> {
    const pool = await getPool();
    const query = `
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'new') as new,
        COUNT(*) FILTER (WHERE status = 'contacted') as contacted,
        COUNT(*) FILTER (WHERE status = 'qualified') as qualified,
        COUNT(*) FILTER (WHERE status = 'converted') as converted,
        COUNT(*) FILTER (WHERE status = 'closed') as closed
      FROM leads
    `;
    const result = await pool.query(query);
    const row = result.rows[0];
    return {
      total: parseInt(row.total, 10),
      new: parseInt(row.new, 10),
      contacted: parseInt(row.contacted, 10),
      qualified: parseInt(row.qualified, 10),
      converted: parseInt(row.converted, 10),
      closed: parseInt(row.closed, 10),
    };
  }

  /**
   * Delete a lead
   */
  async delete(id: string): Promise<void> {
    const pool = await getPool();
    await pool.query('DELETE FROM leads WHERE id = $1', [id]);
  }


  private mapRowToLead(row: Record<string, unknown>): Lead {
    return {
      id: row.id as string,
      first_name: row.first_name as string | undefined,
      last_name: row.last_name as string | undefined,
      email: row.email as string,
      phone: row.phone as string | undefined,
      whatsapp_number: row.whatsapp_number as string | undefined,
      country: row.country as string | undefined,
      subject: row.subject as string | undefined,
      enquiry: row.enquiry as string | undefined,
      car_id: row.car_id as string | undefined,
      source: row.source as string,
      enquiry_type: (row.enquiry_type as Lead['enquiry_type']) || 'general',
      status: row.status as Lead['status'],
      assigned_to: row.assigned_to as string | undefined,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
    };
  }

  private mapRowToLeadWithCar(row: Record<string, unknown>): LeadWithCar {
    const lead = this.mapRowToLead(row);
    const car = row.car_make ? {
      id: row.car_id_ref as string,
      make: row.car_make as string,
      model: row.car_model as string,
      variant: row.car_variant as string | undefined,
      year: row.car_year as number,
      price: parseFloat(row.car_price as string),
      primary_image_url: row.car_primary_image as string | undefined,
    } : undefined;
    return { ...lead, car };
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
