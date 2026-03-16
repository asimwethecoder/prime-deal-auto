import { SearchRepository, SearchFilters, SearchOptions, SearchResult, FacetResult, CarDocument } from '../repositories/search.repository';
import { CarRepository } from '../repositories/cars.repository';
import { OpenSearchError } from '../lib/opensearch';

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
 * SearchService orchestrates all search operations
 * 
 * Responsibilities:
 * - Validate and sanitize user input
 * - Orchestrate fallback logic (OpenSearch → PostgreSQL)
 * - Transform repository results to API format
 * - Calculate pagination metadata
 * 
 * Business rules:
 * - Maximum limit: 100
 * - Minimum prefix length for suggestions: 2 characters
 * - Fallback only on OpenSearchError, not ValidationError
 * - Log warnings when fallback is triggered
 */
export class SearchService {
  constructor(
    private searchRepository: SearchRepository,
    private carRepository: CarRepository
  ) {}

  /**
   * Execute search with filters, pagination, and sorting
   * 
   * Flow:
   * 1. Validate and sanitize inputs
   * 2. Try OpenSearch first
   * 3. On OpenSearchError, fallback to PostgreSQL
   * 4. Transform results to API format
   * 
   * @param params - Search parameters with query, filters, pagination, and sorting
   * @returns Paginated response with car documents
   * @throws ValidationError if input parameters are invalid
   */
  async search(params: {
    query?: string;
    filters: SearchFilters;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<PaginatedResponse<CarDocument>> {
    // Validate and sanitize inputs
    const limit = Math.min(params.limit || 20, 100);
    const offset = Math.max(params.offset || 0, 0);
    
    if (offset < 0 || limit < 1) {
      throw new ValidationError('Invalid pagination parameters');
    }
    
    const sortBy = this.validateSortBy(params.sortBy);
    const sortOrder = params.sortOrder === 'desc' ? 'desc' : 'asc';
    
    // Validate enum filters
    this.validateFilters(params.filters);
    
    // Sanitize query input (trim whitespace, null if empty)
    const query = params.query?.trim() || null;
    
    try {
      // Try OpenSearch first
      const result = await this.searchRepository.search(
        query,
        params.filters,
        { limit, offset, sortBy, sortOrder }
      );
      
      return this.formatResponse(result, limit, offset);
    } catch (error) {
      if (error instanceof OpenSearchError) {
        console.warn('OpenSearch unavailable, falling back to PostgreSQL', {
          error: error.message,
          query,
          filters: params.filters
        });
        
        // Fallback to PostgreSQL
        const result = await this.carRepository.fullTextSearch(
          query,
          params.filters,
          { limit, offset, sortBy, sortOrder }
        );
        
        return this.formatResponse(result, limit, offset);
      }
      
      // Re-throw non-OpenSearch errors (e.g., ValidationError, database errors)
      throw error;
    }
  }

  /**
   * Get facet counts for all filter categories
   * 
   * @param filters - Filter criteria to apply before aggregation
   * @returns Facet results with value-count pairs per category
   */
  async getFacets(filters: SearchFilters): Promise<FacetResult> {
    this.validateFilters(filters);
    
    try {
      return await this.searchRepository.getFacets(filters);
    } catch (error) {
      if (error instanceof OpenSearchError) {
        console.warn('OpenSearch unavailable for facets, falling back to PostgreSQL', {
          error: error.message,
          filters
        });
        // Fallback to PostgreSQL
        return await this.carRepository.getFacets({
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
          maxYear: filters.maxYear
        });
      }
      throw error;
    }
  }

  /**
   * Get autocomplete suggestions for a field
   * 
   * @param field - Field to search (make, model, or variant)
   * @param prefix - Prefix string to match (empty string for all values)
   * @param filters - Optional filters for cascading dropdowns
   * @returns Array of unique suggestions (max 10)
   * @throws ValidationError if field or prefix is invalid
   */
  async getSuggestions(
    field: string, 
    prefix: string, 
    filters?: { make?: string; model?: string }
  ): Promise<string[]> {
    if (!['make', 'model', 'variant'].includes(field)) {
      throw new ValidationError('Invalid field parameter. Must be make, model, or variant');
    }
    
    // Allow empty prefix for getting all values (cascading dropdowns)
    if (prefix.length > 0 && prefix.length < 2) {
      throw new ValidationError('Prefix must be at least 2 characters or empty');
    }
    
    try {
      return await this.searchRepository.getSuggestions(
        field as 'make' | 'model' | 'variant',
        prefix,
        filters
      );
    } catch (error) {
      if (error instanceof OpenSearchError) {
        console.warn('OpenSearch unavailable for suggestions, returning empty array', {
          error: error.message,
          field,
          prefix,
          filters
        });
        return [];
      }
      throw error;
    }
  }

  /**
   * Remove a car from the search index (e.g. when soft-deleted).
   * Best-effort: logs and returns without throwing if OpenSearch is unavailable,
   * so the primary delete (DB) still succeeds.
   *
   * @param carId - The car UUID to remove from the index
   */
  async removeCarFromIndex(carId: string): Promise<void> {
    try {
      await this.searchRepository.deleteDocument(carId);
    } catch (error) {
      if (error instanceof OpenSearchError) {
        console.warn('Could not remove car from search index (search may be unavailable)', {
          carId,
          error: error.message
        });
        return;
      }
      throw error;
    }
  }

  /**
   * Index a single car in OpenSearch (upsert by id).
   * Best-effort: logs and returns without throwing on OpenSearchError,
   * so the primary write (DB) still succeeds.
   *
   * @param car - Car record from DB (same shape as reindex uses)
   */
  async indexCar(car: Record<string, unknown>): Promise<void> {
    try {
      const doc = this.transformToDocument(car);
      await this.searchRepository.indexDocument(doc);
    } catch (error) {
      if (error instanceof OpenSearchError) {
        console.warn('Could not index car (search may be unavailable)', {
          carId: (car as { id?: string }).id,
          error: error.message
        });
        return;
      }
      throw error;
    }
  }

  /**
   * Reindex all active cars from database to OpenSearch
   * 
   * Flow:
   * 1. Fetch all active cars from database
   * 2. Delete existing OpenSearch index
   * 3. Create new index with current schema
   * 4. Transform car records to search documents
   * 5. Batch documents (100 per batch) and bulk index
   * 6. Log progress and errors
   * 7. Return total indexed count
   * 
   * @returns Object with total indexed count
   */
  async reindex(): Promise<{ indexed: number }> {
    // Fetch all active cars from database
    const cars = await this.carRepository.findAllActive();
    
    console.log(`Starting reindex of ${cars.length} cars`);
    
    // Delete existing index (ignore 404 if doesn't exist)
    await this.searchRepository.deleteIndex();
    
    // Create new index with schema
    await this.searchRepository.createIndex();
    
    // Batch documents (100 per batch)
    const batchSize = 100;
    let totalIndexed = 0;
    let totalErrors = 0;
    
    for (let i = 0; i < cars.length; i += batchSize) {
      const batch = cars.slice(i, i + batchSize);
      const documents = batch.map(car => this.transformToDocument(car));
      
      const result = await this.searchRepository.bulkIndex(documents);
      totalIndexed += result.indexed;
      totalErrors += result.errors;
      
      console.log(`Indexed batch ${Math.floor(i / batchSize) + 1}: ${result.indexed} succeeded, ${result.errors} failed`);
    }
    
    console.log(`Reindex complete: ${totalIndexed} indexed, ${totalErrors} errors`);
    
    return { indexed: totalIndexed };
  }

  /**
   * Validate sortBy parameter against whitelist
   * 
   * @private
   * @param sortBy - Sort field from user input
   * @returns Validated sort field (defaults to 'relevance')
   */
  private validateSortBy(sortBy?: string): 'price' | 'year' | 'mileage' | 'relevance' {
    const allowed = ['price', 'year', 'mileage', 'relevance'];
    if (!sortBy || !allowed.includes(sortBy)) {
      return 'relevance';
    }
    return sortBy as 'price' | 'year' | 'mileage' | 'relevance';
  }

  /**
   * Validate filter parameters
   * 
   * Checks:
   * - Enum values (fuelType, transmission, condition)
   * - Numeric ranges (minPrice, maxPrice, minYear, maxYear)
   * 
   * @private
   * @param filters - Filter criteria from user input
   * @throws ValidationError if any filter value is invalid
   */
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

  /**
   * Transform repository result to API response format
   * 
   * Calculates:
   * - page: Current page number (1-indexed)
   * - hasMore: Whether more results exist beyond current page
   * 
   * @private
   * @param result - Search result from repository
   * @param limit - Results per page
   * @param offset - Starting position
   * @returns Paginated response with metadata
   */
  private formatResponse(
    result: SearchResult,
    limit: number,
    offset: number
  ): PaginatedResponse<CarDocument> {
    const page = Math.floor(offset / limit) + 1;
    const hasMore = offset + limit < result.total;
    
    return {
      data: result.hits,
      total: result.total,
      page,
      limit,
      hasMore
    };
  }

  /**
   * Transform car database record to search document
   * 
   * Handles:
   * - Null/undefined values (convert to empty strings or arrays)
   * - Field mapping (database columns → search document fields)
   * 
   * @private
   * @param car - Car record from database
   * @returns Search document for OpenSearch indexing
   */
  private transformToDocument(car: any): CarDocument {
    return {
      id: car.id,
      make: car.make,
      model: car.model,
      variant: car.variant || '',
      year: car.year,
      price: car.price,
      mileage: car.mileage,
      body_type: car.body_type,
      fuel_type: car.fuel_type,
      transmission: car.transmission,
      condition: car.condition,
      color: car.color,
      description: car.description || '',
      features: car.features || [],
      primary_image_url: (car as any).primary_image_url || '', // Will be populated when image feature is implemented
      status: car.status,
      created_at: car.created_at
    };
  }
}
