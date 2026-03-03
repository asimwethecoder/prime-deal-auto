import { getPool } from '../lib/database';
import { Car } from '../types';
import { SearchFilters, SearchOptions, SearchResult } from './search.repository';

export interface CarFilters {
  make?: string;
  model?: string;
  minYear?: number;
  maxYear?: number;
  minPrice?: number;
  maxPrice?: number;
  condition?: string;
  transmission?: string;
  fuelType?: string;
  bodyType?: string;
  status?: string;
  limit: number;
  offset: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

const ALLOWED_SORT_COLUMNS = ['price', 'year', 'mileage', 'created_at'];

export class CarRepository {
  async findAll(filters: CarFilters): Promise<{ cars: Car[]; total: number }> {
    const pool = await getPool();

    const conditions: string[] = ['status = $1'];
    const params: unknown[] = [filters.status || 'active'];
    let paramIndex = 2;

    if (filters.make) {
      conditions.push(`make ILIKE $${paramIndex}`);
      params.push(`%${filters.make}%`);
      paramIndex++;
    }
    if (filters.model) {
      conditions.push(`model ILIKE $${paramIndex}`);
      params.push(`%${filters.model}%`);
      paramIndex++;
    }
    if (filters.minYear) {
      conditions.push(`year >= $${paramIndex}`);
      params.push(filters.minYear);
      paramIndex++;
    }
    if (filters.maxYear) {
      conditions.push(`year <= $${paramIndex}`);
      params.push(filters.maxYear);
      paramIndex++;
    }
    if (filters.minPrice) {
      conditions.push(`price >= $${paramIndex}`);
      params.push(filters.minPrice);
      paramIndex++;
    }
    if (filters.maxPrice) {
      conditions.push(`price <= $${paramIndex}`);
      params.push(filters.maxPrice);
      paramIndex++;
    }
    if (filters.condition) {
      conditions.push(`condition = $${paramIndex}`);
      params.push(filters.condition);
      paramIndex++;
    }
    if (filters.transmission) {
      conditions.push(`transmission = $${paramIndex}`);
      params.push(filters.transmission);
      paramIndex++;
    }
    if (filters.fuelType) {
      conditions.push(`fuel_type = $${paramIndex}`);
      params.push(filters.fuelType);
      paramIndex++;
    }
    if (filters.bodyType) {
      conditions.push(`body_type ILIKE $${paramIndex}`);
      params.push(`%${filters.bodyType}%`);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    // Whitelist sort column to prevent SQL injection
    const sortColumn = ALLOWED_SORT_COLUMNS.includes(filters.sortBy)
      ? filters.sortBy
      : 'created_at';
    const sortOrder = filters.sortOrder === 'asc' ? 'ASC' : 'DESC';

    // Count query
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM cars WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    // Data query with pagination
    const dataParams = [...params, filters.limit, filters.offset];
    const dataResult = await pool.query(
      `SELECT * FROM cars 
       WHERE ${whereClause} 
       ORDER BY ${sortColumn} ${sortOrder}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      dataParams
    );

    return { cars: dataResult.rows, total };
  }

  async findById(id: string): Promise<Car | null> {
    const pool = await getPool();
    const result = await pool.query('SELECT * FROM cars WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  /**
   * Full-text search using PostgreSQL as fallback when OpenSearch is unavailable
   * Uses tsvector column with GIN index for performance
   * 
   * @param query - Search query string (null for browse/filter-only)
   * @param filters - Filter criteria (make, model, price range, etc.)
   * @param options - Pagination and sorting options
   * @returns Search results with hits and total count in same format as SearchRepository
   */
  async fullTextSearch(
      query: string | null,
      filters: SearchFilters,
      options: SearchOptions
    ): Promise<SearchResult> {
      const pool = await getPool();

      const params: unknown[] = [];
      let paramIndex = 1;

      const whereClauses: string[] = ["c.status = 'active'"];

      // Full-text search using GIN index
      if (query) {
        whereClauses.push(`c.search_vector @@ plainto_tsquery('english', $${paramIndex})`);
        params.push(query);
        paramIndex++;
      }

      // Apply filters
      if (filters.make) {
        whereClauses.push(`c.make = $${paramIndex}`);
        params.push(filters.make);
        paramIndex++;
      }

      if (filters.model) {
        whereClauses.push(`c.model = $${paramIndex}`);
        params.push(filters.model);
        paramIndex++;
      }

      if (filters.variant) {
        whereClauses.push(`c.variant = $${paramIndex}`);
        params.push(filters.variant);
        paramIndex++;
      }

      if (filters.bodyType) {
        whereClauses.push(`c.body_type = $${paramIndex}`);
        params.push(filters.bodyType);
        paramIndex++;
      }

      if (filters.fuelType) {
        whereClauses.push(`c.fuel_type = $${paramIndex}`);
        params.push(filters.fuelType);
        paramIndex++;
      }

      if (filters.transmission) {
        whereClauses.push(`c.transmission = $${paramIndex}`);
        params.push(filters.transmission);
        paramIndex++;
      }

      if (filters.condition) {
        whereClauses.push(`c.condition = $${paramIndex}`);
        params.push(filters.condition);
        paramIndex++;
      }

      if (filters.minPrice !== undefined) {
        whereClauses.push(`c.price >= $${paramIndex}`);
        params.push(filters.minPrice);
        paramIndex++;
      }

      if (filters.maxPrice !== undefined) {
        whereClauses.push(`c.price <= $${paramIndex}`);
        params.push(filters.maxPrice);
        paramIndex++;
      }

      if (filters.minYear !== undefined) {
        whereClauses.push(`c.year >= $${paramIndex}`);
        params.push(filters.minYear);
        paramIndex++;
      }

      if (filters.maxYear !== undefined) {
        whereClauses.push(`c.year <= $${paramIndex}`);
        params.push(filters.maxYear);
        paramIndex++;
      }

      const whereClause = whereClauses.join(' AND ');

      // Build ORDER BY (whitelist to prevent injection)
      let orderBy = 'c.created_at DESC';
      if (options.sortBy && options.sortBy !== 'relevance') {
        const sortColumn = options.sortBy; // already validated by service
        const sortDirection = options.sortOrder === 'desc' ? 'DESC' : 'ASC';
        orderBy = `c.${sortColumn} ${sortDirection}`;
      } else if (query) {
        // Sort by relevance when query is present
        orderBy = `ts_rank(c.search_vector, plainto_tsquery('english', $1)) DESC`;
      }

      // Count query
      const countQuery = `SELECT COUNT(*) FROM cars c WHERE ${whereClause}`;
      const countResult = await pool.query(countQuery, params);
      const total = parseInt(countResult.rows[0].count, 10);

      // Data query with LEFT JOIN to get primary image
      const dataQuery = `
        SELECT 
          c.id, c.make, c.model, c.variant, c.year, c.price, c.mileage,
          c.body_type, c.fuel_type, c.transmission, c.condition, c.color,
          c.description, c.features, c.status, c.created_at,
          ci.cloudfront_url as primary_image_url
        FROM cars c
        LEFT JOIN car_images ci ON c.id = ci.car_id AND ci.is_primary = true
        WHERE ${whereClause}
        ORDER BY ${orderBy}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      params.push(options.limit, options.offset);

      const dataResult = await pool.query(dataQuery, params);

      return {
        hits: dataResult.rows,
        total
      };
    }


  /**
   * Find all active cars for reindexing
   * Returns all required fields for search document transformation
   * 
   * @returns Array of all active car records
   */
  async findAllActive(): Promise<Car[]> {
    const pool = await getPool();
    
    const query = `
      SELECT 
        c.id, c.make, c.model, c.variant, c.year, c.price, c.mileage,
        c.body_type, c.fuel_type, c.transmission, c.condition, c.color,
        c.description, c.features, c.status, c.created_at,
        ci.cloudfront_url as primary_image_url
      FROM cars c
      LEFT JOIN car_images ci ON c.id = ci.car_id AND ci.is_primary = true
      WHERE c.status = 'active'
      ORDER BY c.created_at DESC
    `;
    
    const result = await pool.query(query);
    return result.rows;
  }
}
