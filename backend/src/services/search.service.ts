import { CarRepository } from '../repositories/cars.repository';

/**
 * Search filter criteria matching the existing SearchFilters interface shape
 * (previously imported from search.repository — now defined locally)
 */
export interface SearchFilters {
  make?: string;
  model?: string;
  variant?: string;
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
  bodyType?: string;
  fuelType?: 'petrol' | 'diesel' | 'electric' | 'hybrid';
  transmission?: 'automatic' | 'manual' | 'cvt';
  condition?: 'excellent' | 'good' | 'fair' | 'poor';
}

/**
 * Car document shape returned by search results
 */
export interface CarDocument {
  id: string;
  make: string;
  model: string;
  variant: string;
  year: number;
  price: number;
  mileage: number;
  body_type: string;
  fuel_type: string;
  transmission: string;
  condition: string;
  color: string;
  description: string;
  features: string[];
  primary_image_url?: string;
  status: string;
  created_at: string;
}

/**
 * Facet result with value-count pairs per category
 */
export interface FacetResult {
  [key: string]: Array<{ value: string; count: number }>;
}

/**
 * Paginated response format for API endpoints
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Validation error for invalid input parameters
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * SearchService — PostgreSQL full-text search only
 *
 * OpenSearch Serverless was removed to cut ~$250/mo in costs.
 * PostgreSQL tsvector-based search handles all search, facets, and suggestions.
 */
export class SearchService {
  constructor(private carRepository: CarRepository) {}

  /**
   * Execute search with filters, pagination, and sorting via PostgreSQL full-text search
   */
  async search(params: {
    query?: string;
    filters: SearchFilters;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<PaginatedResponse<CarDocument>> {
    const limit = Math.min(params.limit || 20, 100);
    const offset = Math.max(params.offset || 0, 0);

    if (offset < 0 || limit < 1) {
      throw new ValidationError('Invalid pagination parameters');
    }

    const sortBy = this.validateSortBy(params.sortBy);
    const sortOrder = params.sortOrder === 'desc' ? 'desc' : 'asc';

    this.validateFilters(params.filters);

    const query = params.query?.trim() || null;

    const result = await this.carRepository.fullTextSearch(
      query,
      params.filters,
      { limit, offset, sortBy, sortOrder }
    );

    return this.formatResponse(result, limit, offset);
  }

  /**
   * Get facet counts for all filter categories via PostgreSQL
   */
  async getFacets(filters: SearchFilters): Promise<FacetResult> {
    this.validateFilters(filters);
    return this.carRepository.getFacets({
      make: filters.make,
      model: filters.model,
      variant: filters.variant,
      bodyType: filters.bodyType,
      fuelType: filters.fuelType,
      transmission: filters.transmission,
      condition: filters.condition,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      minYear: filters.minYear,
      maxYear: filters.maxYear,
    });
  }

  /**
   * Get autocomplete suggestions for a field via PostgreSQL
   */
  async getSuggestions(
    field: string,
    prefix: string,
    filters?: { make?: string; model?: string }
  ): Promise<string[]> {
    if (!['make', 'model', 'variant'].includes(field)) {
      throw new ValidationError('Invalid field parameter. Must be make, model, or variant');
    }

    if (prefix.length > 0 && prefix.length < 2) {
      throw new ValidationError('Prefix must be at least 2 characters or empty');
    }

    return this.carRepository.getSuggestions(
      field as 'make' | 'model' | 'variant',
      prefix,
      filters
    );
  }

  /**
   * No-op — OpenSearch removed. PostgreSQL is the source of truth.
   */
  async removeCarFromIndex(_carId: string): Promise<void> {
    // No-op: PostgreSQL is the source of truth, no separate index to maintain
  }

  /**
   * No-op — OpenSearch removed. PostgreSQL is the source of truth.
   */
  async indexCar(_car: Record<string, unknown>): Promise<void> {
    // No-op: PostgreSQL is the source of truth, no separate index to maintain
  }

  /**
   * Normalize make/model casing in the database (previously part of reindex flow)
   */
  async reindex(): Promise<{ message: string }> {
    await this.carRepository.normalizeMakeCasing();
    return { message: 'PostgreSQL is the search engine — no reindex needed. Make/model casing normalized.' };
  }

  private validateSortBy(sortBy?: string): 'price' | 'year' | 'mileage' | 'relevance' {
    const allowed = ['price', 'year', 'mileage', 'relevance'];
    if (!sortBy || !allowed.includes(sortBy)) {
      return 'relevance';
    }
    return sortBy as 'price' | 'year' | 'mileage' | 'relevance';
  }

  private validateFilters(filters: SearchFilters): void {
    const fuelTypes = ['petrol', 'diesel', 'electric', 'hybrid'];
    const transmissions = ['automatic', 'manual', 'cvt'];
    const conditions = ['excellent', 'good', 'fair', 'poor'];

    if (filters.fuelType && !fuelTypes.includes(filters.fuelType)) {
      throw new ValidationError(`Invalid fuel type: ${filters.fuelType}`);
    }
    if (filters.transmission && !transmissions.includes(filters.transmission)) {
      throw new ValidationError(`Invalid transmission: ${filters.transmission}`);
    }
    if (filters.condition && !conditions.includes(filters.condition)) {
      throw new ValidationError(`Invalid condition: ${filters.condition}`);
    }
    if (filters.minPrice !== undefined && filters.minPrice < 0) {
      throw new ValidationError('minPrice must be non-negative');
    }
    if (filters.maxPrice !== undefined && filters.maxPrice < 0) {
      throw new ValidationError('maxPrice must be non-negative');
    }
    if (filters.minYear !== undefined && filters.minYear < 1900) {
      throw new ValidationError('minYear must be >= 1900');
    }
    if (filters.maxYear !== undefined && filters.maxYear > new Date().getFullYear() + 1) {
      throw new ValidationError('maxYear cannot be in the future');
    }
  }

  private formatResponse(
    result: { hits: CarDocument[]; total: number },
    limit: number,
    offset: number
  ): PaginatedResponse<CarDocument> {
    const page = Math.floor(offset / limit) + 1;
    const hasMore = offset + limit < result.total;
    return { data: result.hits, total: result.total, page, limit, hasMore };
  }
}
