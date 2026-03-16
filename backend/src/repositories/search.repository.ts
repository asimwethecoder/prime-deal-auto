import { getOpenSearchClient, OpenSearchError } from '../lib/opensearch';
import { INDEX_SCHEMA } from '../lib/opensearch-schema';

/**
 * Search filters for car inventory queries
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
 * Search options for pagination and sorting
 */
export interface SearchOptions {
  limit: number;
  offset: number;
  sortBy?: 'price' | 'year' | 'mileage' | 'relevance';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Search result with hits and total count
 */
export interface SearchResult {
  hits: CarDocument[];
  total: number;
}

/**
 * Facet result with value-count pairs per category
 */
export interface FacetResult {
  [key: string]: Array<{ value: string; count: number }>;
}

/**
 * Car document structure in OpenSearch index
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
  primary_image_url?: string; // Optional - will be populated when image feature is implemented
  status: string;
  created_at: string;
}

/**
 * SearchRepository handles all OpenSearch queries for car inventory search
 * 
 * Responsibilities:
 * - Execute full-text search with filters and pagination
 * - Execute aggregation queries for facets
 * - Execute prefix queries for autocomplete suggestions
 * - Manage index lifecycle (create, delete)
 * - Batch index documents for bulk operations
 * 
 * All methods catch OpenSearch errors and throw OpenSearchError for consistent error handling
 */
export class SearchRepository {
  private readonly indexName = 'cars';

  /**
   * Execute full-text search with filters, pagination, and sorting
   * 
   * @param query - Search query string (null for browse/filter-only)
   * @param filters - Filter criteria (make, model, price range, etc.)
   * @param options - Pagination and sorting options
   * @returns Search results with hits and total count
   * @throws OpenSearchError if query execution fails
   */
  async search(
    query: string | null,
    filters: SearchFilters,
    options: SearchOptions
  ): Promise<SearchResult> {
    const client = getOpenSearchClient();
    const body = this.buildSearchQuery(query, filters, options);

    try {
      const response = await client.search({
        index: this.indexName,
        body: body as any
      });

      const total = typeof response.body.hits.total === 'number' 
        ? response.body.hits.total 
        : response.body.hits.total?.value || 0;

      return {
        hits: response.body.hits.hits.map((hit: any) => hit._source),
        total
      };
    } catch (error) {
      throw new OpenSearchError('Search query failed', undefined, error);
    }
  }

  /**
   * Execute aggregation queries to get facet counts
   * 
   * @param filters - Filter criteria to apply before aggregation
   * @returns Facet results with value-count pairs per category
   * @throws OpenSearchError if aggregation query fails
   */
  async getFacets(filters: SearchFilters): Promise<FacetResult> {
    const client = getOpenSearchClient();
    const body = this.buildFacetQuery(filters);

    try {
      const response = await client.search({
        index: this.indexName,
        body: body as any
      });

      return this.parseFacetResponse(response.body.aggregations);
    } catch (error) {
      throw new OpenSearchError('Facet query failed', undefined, error);
    }
  }

  /**
   * Execute prefix query for autocomplete suggestions
   * 
   * @param field - Field to search (make, model, or variant)
   * @param prefix - Prefix string to match (empty string for all values)
   * @param filters - Optional filters for cascading dropdowns
   * @returns Array of unique suggestions (max 10)
   * @throws OpenSearchError if suggestion query fails
   */
  async getSuggestions(
    field: 'make' | 'model' | 'variant',
    prefix: string,
    filters?: { make?: string; model?: string }
  ): Promise<string[]> {
    const client = getOpenSearchClient();

    const must: any[] = [{ term: { status: 'active' } }];
    
    // Add prefix match if provided
    if (prefix) {
      must.push({ prefix: { [`${field}.keyword`]: prefix.toLowerCase() } });
    }
    
    // Add cascading filters
    if (filters?.make && field !== 'make') {
      must.push({ term: { 'make.keyword': filters.make } });
    }
    
    if (filters?.model && field === 'variant') {
      must.push({ term: { 'model.keyword': filters.model } });
    }

    const body = {
      size: 10,
      _source: [field],
      query: {
        bool: { must }
      },
      collapse: { field: `${field}.keyword` },
      sort: [{ _score: { order: 'desc' as const } }]
    };

    try {
      const response = await client.search({
        index: this.indexName,
        body: body as any
      });

      return response.body.hits.hits
        .map((hit: any) => hit._source[field])
        .filter((value: string) => value && value.trim()); // Filter out empty values
    } catch (error) {
      throw new OpenSearchError('Suggestion query failed', undefined, error);
    }
  }

  /**
   * Create the cars index with the defined schema
   * 
   * @throws OpenSearchError if index creation fails
   */
  async createIndex(): Promise<void> {
    const client = getOpenSearchClient();

    try {
      await client.indices.create({
        index: this.indexName,
        body: INDEX_SCHEMA as any
      });
    } catch (error) {
      throw new OpenSearchError('Index creation failed', undefined, error);
    }
  }

  /**
   * Delete the cars index
   * Ignores 404 errors if index doesn't exist
   * 
   * @throws OpenSearchError if index deletion fails (except 404)
   */
  async deleteIndex(): Promise<void> {
    const client = getOpenSearchClient();

    try {
      await client.indices.delete({ index: this.indexName });
    } catch (error) {
      // Ignore 404 if index doesn't exist
      if ((error as any).statusCode !== 404) {
        throw new OpenSearchError('Index deletion failed', undefined, error);
      }
    }
  }

  /**
   * Delete a single car document from the index by id.
   * Used when a car is soft-deleted so the public search stays in sync.
   * Ignores 404 if the document is not in the index.
   *
   * @param carId - The car UUID to remove from the index
   * @throws OpenSearchError if delete fails (except 404)
   */
  async deleteDocument(carId: string): Promise<void> {
    const client = getOpenSearchClient();
    try {
      await client.delete({ index: this.indexName, id: carId });
    } catch (error: unknown) {
      const statusCode = (error as { statusCode?: number }).statusCode;
      if (statusCode === 404) {
        return; // Document not in index (e.g. never indexed or already removed)
      }
      throw new OpenSearchError('Delete document failed', statusCode, error);
    }
  }

  /**
   * Index a single car document (upsert by id).
   *
   * @param doc - Car document to index
   * @throws OpenSearchError if index fails
   */
  async indexDocument(doc: CarDocument): Promise<void> {
    const client = getOpenSearchClient();
    try {
      await client.index({
        index: this.indexName,
        id: doc.id,
        body: doc
      });
    } catch (error) {
      throw new OpenSearchError('Index document failed', undefined, error);
    }
  }

  /**
   * Bulk index documents in batches
   * 
   * @param documents - Array of car documents to index
   * @returns Object with indexed count and error count
   * @throws OpenSearchError if bulk operation fails
   */
  async bulkIndex(documents: CarDocument[]): Promise<{ indexed: number; errors: number }> {
    const client = getOpenSearchClient();

    const body = documents.flatMap(doc => [
      { index: { _index: this.indexName, _id: doc.id } },
      doc
    ]);

    try {
      const response = await client.bulk({ body });

      const errors = response.body.items.filter((item: any) => item.index.error).length;

      if (errors > 0) {
        console.error(`Bulk index had ${errors} errors`);
      }

      return {
        indexed: documents.length - errors,
        errors
      };
    } catch (error) {
      throw new OpenSearchError('Bulk index failed', undefined, error);
    }
  }

  /**
   * Build OpenSearch query DSL for full-text search with filters
   * 
   * Query structure:
   * - must clause: status='active' + optional multi_match for text search
   * - filter clause: all provided filter criteria
   * - sort: by relevance or specified field
   * 
   * @private
   */
  private buildSearchQuery(
    query: string | null,
    filters: SearchFilters,
    options: SearchOptions
  ): any {
    const must: any[] = [{ term: { status: 'active' } }];

    // Add full-text search if query provided
    if (query) {
      must.push({
        multi_match: {
          query,
          fields: ['make^3', 'model^3', 'variant^2', 'description', 'features'],
          type: 'best_fields',
          fuzziness: 'AUTO'
        }
      });
    }

    const filter: any[] = [];

    // Apply exact match filters using keyword fields
    if (filters.make) filter.push({ term: { 'make.keyword': filters.make } });
    if (filters.model) filter.push({ term: { 'model.keyword': filters.model } });
    if (filters.variant) filter.push({ term: { 'variant.keyword': filters.variant } });
    if (filters.bodyType) filter.push({ term: { 'body_type.keyword': filters.bodyType } });
    if (filters.fuelType) filter.push({ term: { fuel_type: filters.fuelType } });
    if (filters.transmission) filter.push({ term: { transmission: filters.transmission } });
    if (filters.condition) filter.push({ term: { condition: filters.condition } });

    // Apply range filters
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      filter.push({
        range: {
          price: {
            ...(filters.minPrice !== undefined && { gte: filters.minPrice }),
            ...(filters.maxPrice !== undefined && { lte: filters.maxPrice })
          }
        }
      });
    }

    if (filters.minYear !== undefined || filters.maxYear !== undefined) {
      filter.push({
        range: {
          year: {
            ...(filters.minYear !== undefined && { gte: filters.minYear }),
            ...(filters.maxYear !== undefined && { lte: filters.maxYear })
          }
        }
      });
    }

    // Build sort clause
    const sort: any[] = [];
    if (options.sortBy === 'relevance' || !options.sortBy) {
      sort.push({ _score: 'desc' });
    } else {
      sort.push({ [options.sortBy]: options.sortOrder || 'asc' });
    }

    return {
      query: { bool: { must, filter } },
      sort,
      from: options.offset,
      size: options.limit
    };
  }

  /**
   * Build OpenSearch aggregation query for facets
   * 
   * Aggregations:
   * - make, model, variant, body_type: top 50 values
   * - fuel_type, transmission, condition: top 10 values
   * 
   * @private
   */
  private buildFacetQuery(filters: SearchFilters): any {
    const filter: any[] = [{ term: { status: 'active' } }];

    // Apply filters (same as search, but exclude the facet being aggregated)
    if (filters.make) filter.push({ term: { 'make.keyword': filters.make } });
    if (filters.model) filter.push({ term: { 'model.keyword': filters.model } });
    if (filters.variant) filter.push({ term: { 'variant.keyword': filters.variant } });
    if (filters.bodyType) filter.push({ term: { 'body_type.keyword': filters.bodyType } });
    if (filters.fuelType) filter.push({ term: { fuel_type: filters.fuelType } });
    if (filters.transmission) filter.push({ term: { transmission: filters.transmission } });
    if (filters.condition) filter.push({ term: { condition: filters.condition } });

    // Apply range filters
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      filter.push({
        range: {
          price: {
            ...(filters.minPrice !== undefined && { gte: filters.minPrice }),
            ...(filters.maxPrice !== undefined && { lte: filters.maxPrice })
          }
        }
      });
    }

    if (filters.minYear !== undefined || filters.maxYear !== undefined) {
      filter.push({
        range: {
          year: {
            ...(filters.minYear !== undefined && { gte: filters.minYear }),
            ...(filters.maxYear !== undefined && { lte: filters.maxYear })
          }
        }
      });
    }

    return {
      size: 0, // Don't return documents, only aggregations
      query: { bool: { filter } },
      aggs: {
        make: { terms: { field: 'make.keyword', size: 50 } },
        model: { terms: { field: 'model.keyword', size: 50 } },
        variant: { terms: { field: 'variant.keyword', size: 50 } },
        body_type: { terms: { field: 'body_type.keyword', size: 50 } },
        fuel_type: { terms: { field: 'fuel_type', size: 10 } },
        transmission: { terms: { field: 'transmission', size: 10 } },
        condition: { terms: { field: 'condition', size: 10 } }
      }
    };
  }

  /**
   * Parse OpenSearch aggregation response into FacetResult format
   * 
   * @private
   */
  private parseFacetResponse(aggregations: any): FacetResult {
    const result: FacetResult = {};

    for (const [key, agg] of Object.entries(aggregations)) {
      result[key] = (agg as any).buckets.map((bucket: any) => ({
        value: bucket.key,
        count: bucket.doc_count
      }));
    }

    return result;
  }
}
