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

export interface CreateCarData {
  make: string;
  model: string;
  variant?: string;
  year: number;
  price: number;
  mileage: number;
  condition: string;
  body_type?: string;
  transmission: string;
  fuel_type: string;
  color?: string;
  description?: string;
  features?: string[];
  status: string;
  video_url?: string;
}

export class CarRepository {
  async create(data: CreateCarData): Promise<Car> {
    const pool = await getPool();
    const featuresJson = JSON.stringify(data.features ?? []);
    try {
      const result = await pool.query(
        `INSERT INTO cars (
          make, model, variant, year, price, mileage, condition,
          body_type, transmission, fuel_type, color, description, features, status, video_url
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb, $14, $15)
        RETURNING *`,
        [
          data.make,
          data.model,
          data.variant ?? null,
          data.year,
          data.price,
          data.mileage,
          data.condition,
          data.body_type ?? null,
          data.transmission,
          data.fuel_type,
          data.color ?? null,
          data.description ?? null,
          featuresJson,
          data.status,
          data.video_url ?? null,
        ]
      );
      return result.rows[0] as Car;
    } catch (err) {
      console.error('CarRepository.create error:', {
        error: err instanceof Error ? err.message : 'Unknown error',
        code: (err as { code?: string }).code,
        detail: (err as { detail?: string }).detail,
        data: { make: data.make, model: data.model, year: data.year },
      });
      throw err;
    }
  }

  async findAll(filters: CarFilters): Promise<{ cars: Car[]; total: number }> {
    const pool = await getPool();

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    // Status filter: if provided, filter by it; if undefined, show all non-deleted (for admin "All" view)
    if (filters.status) {
      conditions.push(`c.status = $${paramIndex}`);
      params.push(filters.status);
      paramIndex++;
    } else {
      // When no status filter, show all except deleted (for admin "All" view)
      conditions.push(`c.status != 'deleted'`);
    }

    if (filters.make) {
      conditions.push(`c.make ILIKE $${paramIndex}`);
      params.push(`%${filters.make}%`);
      paramIndex++;
    }
    if (filters.model) {
      conditions.push(`c.model ILIKE $${paramIndex}`);
      params.push(`%${filters.model}%`);
      paramIndex++;
    }
    if (filters.minYear) {
      conditions.push(`c.year >= $${paramIndex}`);
      params.push(filters.minYear);
      paramIndex++;
    }
    if (filters.maxYear) {
      conditions.push(`c.year <= $${paramIndex}`);
      params.push(filters.maxYear);
      paramIndex++;
    }
    if (filters.minPrice) {
      conditions.push(`c.price >= $${paramIndex}`);
      params.push(filters.minPrice);
      paramIndex++;
    }
    if (filters.maxPrice) {
      conditions.push(`c.price <= $${paramIndex}`);
      params.push(filters.maxPrice);
      paramIndex++;
    }
    if (filters.condition) {
      conditions.push(`c.condition = $${paramIndex}`);
      params.push(filters.condition);
      paramIndex++;
    }
    if (filters.transmission) {
      conditions.push(`c.transmission = $${paramIndex}`);
      params.push(filters.transmission);
      paramIndex++;
    }
    if (filters.fuelType) {
      conditions.push(`c.fuel_type = $${paramIndex}`);
      params.push(filters.fuelType);
      paramIndex++;
    }
    if (filters.bodyType) {
      conditions.push(`c.body_type ILIKE $${paramIndex}`);
      params.push(`%${filters.bodyType}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? conditions.join(' AND ') : '1=1';

    // Whitelist sort column to prevent SQL injection
    const sortColumn = ALLOWED_SORT_COLUMNS.includes(filters.sortBy)
      ? filters.sortBy
      : 'created_at';
    const sortOrder = filters.sortOrder === 'asc' ? 'ASC' : 'DESC';

    // Count query
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM cars c WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    // Data query with pagination and LEFT JOIN for primary image
    const dataParams = [...params, filters.limit, filters.offset];
    const dataResult = await pool.query(
      `SELECT c.*, ci.cloudfront_url as primary_image_url
       FROM cars c
       LEFT JOIN car_images ci ON c.id = ci.car_id AND ci.is_primary = true
       WHERE ${whereClause} 
       ORDER BY c.${sortColumn} ${sortOrder}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      dataParams
    );

    return { cars: dataResult.rows, total };
  }

  async findById(id: string): Promise<Car | null> {
    const pool = await getPool();
    
    // Fetch car with all images ordered by order_index
    const carResult = await pool.query('SELECT * FROM cars WHERE id = $1', [id]);
    if (carResult.rows.length === 0) {
      return null;
    }
    
    const car = carResult.rows[0];
    
    // Fetch images for this car, ordered by order_index with primary first
    const imagesResult = await pool.query(
      `SELECT id, car_id, s3_key, cloudfront_url, thumbnail_url, is_primary, order_index, created_at
       FROM car_images 
       WHERE car_id = $1 
       ORDER BY is_primary DESC, order_index ASC`,
      [id]
    );
    
    // Attach images to car object
    car.images = imagesResult.rows;
    car.primary_image_url = imagesResult.rows.find((img: { is_primary: boolean }) => img.is_primary)?.cloudfront_url || null;
    
    return car;
  }

  async update(id: string, data: Partial<CreateCarData>): Promise<Car | null> {
    const pool = await getPool();
    
    const updates: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (data.make !== undefined) {
      updates.push(`make = $${paramIndex++}`);
      params.push(data.make);
    }
    if (data.model !== undefined) {
      updates.push(`model = $${paramIndex++}`);
      params.push(data.model);
    }
    if (data.variant !== undefined) {
      updates.push(`variant = $${paramIndex++}`);
      params.push(data.variant || null);
    }
    if (data.year !== undefined) {
      updates.push(`year = $${paramIndex++}`);
      params.push(data.year);
    }
    if (data.price !== undefined) {
      updates.push(`price = $${paramIndex++}`);
      params.push(data.price);
    }
    if (data.mileage !== undefined) {
      updates.push(`mileage = $${paramIndex++}`);
      params.push(data.mileage);
    }
    if (data.condition !== undefined) {
      updates.push(`condition = $${paramIndex++}`);
      params.push(data.condition);
    }
    if (data.body_type !== undefined) {
      updates.push(`body_type = $${paramIndex++}`);
      params.push(data.body_type || null);
    }
    if (data.transmission !== undefined) {
      updates.push(`transmission = $${paramIndex++}`);
      params.push(data.transmission);
    }
    if (data.fuel_type !== undefined) {
      updates.push(`fuel_type = $${paramIndex++}`);
      params.push(data.fuel_type);
    }
    if (data.color !== undefined) {
      updates.push(`color = $${paramIndex++}`);
      params.push(data.color || null);
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      params.push(data.description || null);
    }
    if (data.features !== undefined) {
      updates.push(`features = $${paramIndex++}::jsonb`);
      params.push(JSON.stringify(data.features ?? []));
    }
    if (data.status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      params.push(data.status);
    }
    if (data.video_url !== undefined) {
      updates.push(`video_url = $${paramIndex++}`);
      params.push(data.video_url || null);
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    updates.push(`updated_at = NOW()`);
    params.push(id);

    const result = await pool.query(
      `UPDATE cars SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0] as Car;
  }

  async softDelete(id: string): Promise<boolean> {
    const pool = await getPool();
    const result = await pool.query(
      `UPDATE cars SET status = 'deleted', updated_at = NOW() WHERE id = $1 AND status != 'deleted' RETURNING id`,
      [id]
    );
    return result.rowCount !== null && result.rowCount > 0;
  }


  /**
   * Full-text search using PostgreSQL as fallback when OpenSearch is unavailable
   * Uses tsvector column with GIN index for performance
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
      const sortColumn = options.sortBy;
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

  /**
   * Get facet counts from PostgreSQL (fallback when OpenSearch unavailable)
   * Returns counts for make, model, variant, body_type, fuel_type, transmission, condition
   */
  async getFacets(filters?: {
    make?: string;
    model?: string;
    variant?: string;
    bodyType?: string;
    fuelType?: string;
    transmission?: string;
    condition?: string;
    minPrice?: number;
    maxPrice?: number;
    minYear?: number;
    maxYear?: number;
  }): Promise<Record<string, Array<{ value: string; count: number }>>> {
    const pool = await getPool();
    
    // Build WHERE clause for filters
    const conditions: string[] = ["status = 'active'"];
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.make) {
      conditions.push(`make = $${paramIndex++}`);
      params.push(filters.make);
    }
    if (filters?.model) {
      conditions.push(`model = $${paramIndex++}`);
      params.push(filters.model);
    }
    if (filters?.variant) {
      conditions.push(`variant = $${paramIndex++}`);
      params.push(filters.variant);
    }
    if (filters?.bodyType) {
      conditions.push(`body_type = $${paramIndex++}`);
      params.push(filters.bodyType);
    }
    if (filters?.fuelType) {
      conditions.push(`fuel_type = $${paramIndex++}`);
      params.push(filters.fuelType);
    }
    if (filters?.transmission) {
      conditions.push(`transmission = $${paramIndex++}`);
      params.push(filters.transmission);
    }
    if (filters?.condition) {
      conditions.push(`condition = $${paramIndex++}`);
      params.push(filters.condition);
    }
    if (filters?.minPrice !== undefined) {
      conditions.push(`price >= $${paramIndex++}`);
      params.push(filters.minPrice);
    }
    if (filters?.maxPrice !== undefined) {
      conditions.push(`price <= $${paramIndex++}`);
      params.push(filters.maxPrice);
    }
    if (filters?.minYear !== undefined) {
      conditions.push(`year >= $${paramIndex++}`);
      params.push(filters.minYear);
    }
    if (filters?.maxYear !== undefined) {
      conditions.push(`year <= $${paramIndex++}`);
      params.push(filters.maxYear);
    }

    const whereClause = conditions.join(' AND ');

    // Run all facet queries in parallel
    const facetFields = [
      { key: 'make', column: 'make' },
      { key: 'model', column: 'model' },
      { key: 'variant', column: 'variant' },
      { key: 'body_type', column: 'body_type' },
      { key: 'fuel_type', column: 'fuel_type' },
      { key: 'transmission', column: 'transmission' },
      { key: 'condition', column: 'condition' }
    ];

    const facetQueries = facetFields.map(({ column }) => {
      return pool.query(
        `SELECT ${column} as value, COUNT(*) as count 
         FROM cars 
         WHERE ${whereClause} AND ${column} IS NOT NULL AND ${column} != ''
         GROUP BY ${column} 
         ORDER BY count DESC, ${column} ASC
         LIMIT 50`,
        params
      );
    });

    const results = await Promise.all(facetQueries);

    const facets: Record<string, Array<{ value: string; count: number }>> = {};
    facetFields.forEach(({ key }, index) => {
      facets[key] = results[index].rows.map(row => ({
        value: row.value,
        count: parseInt(row.count, 10)
      }));
    });

    return facets;
  }
}
