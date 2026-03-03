# Design Document: Search & Filtering

## Overview

This design document describes the technical implementation of full-text search and filtering capabilities for the Prime Deal Auto platform using Amazon OpenSearch Serverless. The system provides fast, relevant search results with faceted filtering, autocomplete suggestions, and a PostgreSQL fallback mechanism for reliability.

### Goals

- Provide sub-500ms search response times for typical queries
- Support full-text search across make, model, variant, description, and features
- Enable faceted filtering with real-time counts
- Deliver autocomplete suggestions in under 200ms
- Ensure search availability through PostgreSQL fallback
- Support efficient bulk reindexing of 5000+ cars
- Maintain search index synchronization with the source database

### Non-Goals

- Real-time automatic index synchronization (deferred to future spec)
- Advanced search features (fuzzy matching, synonyms, spell correction)
- Search analytics and click tracking (covered in analytics spec)
- Multi-language search support
- Personalized search ranking

### Key Design Decisions

1. **OpenSearch Serverless over self-managed**: Eliminates operational overhead, automatic scaling, pay-per-use pricing
2. **Manual reindex over automatic sync**: Simplifies initial implementation, admin-triggered reindex sufficient for Phase 2
3. **PostgreSQL fallback**: Ensures search availability during OpenSearch maintenance or failures
4. **API Gateway caching**: Reduces OpenSearch query load and costs, improves response times
5. **Batch size of 100 for bulk indexing**: Balances throughput and memory usage
6. **Standard analyzer**: Handles common search patterns without custom configuration complexity


## Architecture

### High-Level Architecture

```
┌─────────────┐
│   Client    │
│  (Browser)  │
└──────┬──────┘
       │
       │ HTTPS
       ▼
┌─────────────────────────────────────────────────────────┐
│                    API Gateway                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Cache Layer (60s for search, 300s for facets)  │  │
│  └──────────────────────────────────────────────────┘  │
└──────┬──────────────────────────────────────────────────┘
       │
       │ Lambda Proxy
       ▼
┌─────────────────────────────────────────────────────────┐
│              Lambda Handler (Node.js 20)                │
│  ┌────────────────────────────────────────────────┐    │
│  │  Path Router                                   │    │
│  │  ├─ GET /search → handleSearch                 │    │
│  │  ├─ GET /search/facets → handleFacets          │    │
│  │  ├─ GET /search/suggestions → handleSuggestions│   │
│  │  └─ POST /admin/reindex → handleReindex        │    │
│  └────────────────────────────────────────────────┘    │
│  ┌────────────────────────────────────────────────┐    │
│  │  SearchService (business logic)                │    │
│  │  ├─ Parameter validation                       │    │
│  │  ├─ Fallback orchestration                     │    │
│  │  └─ Response transformation                    │    │
│  └────────────────────────────────────────────────┘    │
│  ┌────────────────────────────────────────────────┐    │
│  │  SearchRepository (OpenSearch queries)         │    │
│  │  ├─ Query DSL builder                          │    │
│  │  ├─ Aggregation queries                        │    │
│  │  └─ Prefix queries                             │    │
│  └────────────────────────────────────────────────┘    │
│  ┌────────────────────────────────────────────────┐    │
│  │  CarRepository (PostgreSQL fallback)           │    │
│  │  └─ Full-text search with GIN index            │    │
│  └────────────────────────────────────────────────┘    │
└──────┬────────────────────────────────────┬─────────────┘
       │                                    │
       │ AWS SDK                            │ node-postgres
       ▼                                    ▼
┌──────────────────────┐          ┌─────────────────────┐
│  OpenSearch          │          │  Aurora PostgreSQL  │
│  Serverless          │          │  (via RDS Proxy)    │
│  ┌────────────────┐  │          │  ┌───────────────┐  │
│  │  cars index    │  │          │  │  cars table   │  │
│  │  (documents)   │  │          │  │  (GIN index)  │  │
│  └────────────────┘  │          │  └───────────────┘  │
└──────────────────────┘          └─────────────────────┘
```

### Component Responsibilities

**API Gateway**
- Route requests to Lambda
- Cache GET responses (search: 60s, facets: 300s, suggestions: 300s)
- Throttle requests (100 req/s per IP)
- CORS handling

**Lambda Handler**
- Path-based routing to handler functions
- JWT validation for admin endpoints
- Request parsing and response formatting
- Error handling and logging

**SearchService**
- Validate search parameters (limit, offset, sort, filters)
- Orchestrate search flow (OpenSearch → fallback if needed)
- Transform repository results to API format
- Calculate pagination metadata (hasMore, page)

**SearchRepository**
- Build OpenSearch query DSL from filters
- Execute search, aggregation, and prefix queries
- Handle OpenSearch client errors
- Return typed result objects

**CarRepository**
- Execute PostgreSQL full-text search (fallback)
- Apply filters using WHERE clauses
- Return results in same format as SearchRepository

**OpenSearch Client Library**
- Initialize client with AWS Signature V4 auth
- Connection pooling and retry logic
- Request/response logging
- Error mapping


### Data Flow

#### Search Request Flow

```
1. Client → API Gateway: GET /search?q=toyota&minPrice=100000&maxPrice=300000&limit=20
2. API Gateway: Check cache (key: query string hash)
3. If cache hit → return cached response
4. If cache miss:
   a. API Gateway → Lambda: Proxy event
   b. Lambda Handler → SearchService.search(params)
   c. SearchService: Validate params, sanitize input
   d. SearchService → SearchRepository.search(query, filters, pagination)
   e. SearchRepository: Build OpenSearch query DSL
   f. SearchRepository → OpenSearch: Execute search
   g. OpenSearch → SearchRepository: Results + total hits
   h. SearchRepository → SearchService: Typed results
   i. SearchService: Transform to API format, calculate hasMore
   j. SearchService → Lambda Handler: Response object
   k. Lambda Handler → API Gateway: 200 + JSON body
   l. API Gateway: Cache response for 60s
5. API Gateway → Client: JSON response
```

#### Fallback Flow (OpenSearch Unavailable)

```
1. SearchRepository → OpenSearch: Execute search
2. OpenSearch: Connection timeout / error
3. SearchRepository: Throw OpenSearchError
4. SearchService: Catch error, log warning
5. SearchService → CarRepository.fullTextSearch(query, filters, pagination)
6. CarRepository → Aurora: Execute PostgreSQL full-text query
7. Aurora → CarRepository: Results
8. CarRepository → SearchService: Typed results (same format)
9. SearchService → Lambda Handler: Response object (no cache)
10. Lambda Handler → Client: JSON response
```

#### Reindex Flow

```
1. Admin → API Gateway: POST /admin/reindex (with JWT)
2. Lambda Handler: Validate JWT, check admin group
3. Lambda Handler → SearchService.reindex()
4. SearchService → CarRepository.findAllActive()
5. CarRepository → Aurora: SELECT * FROM cars WHERE status='active'
6. Aurora → CarRepository: All active cars
7. SearchService: Transform cars to search documents
8. SearchService → SearchRepository.deleteIndex()
9. SearchRepository → OpenSearch: DELETE /cars
10. SearchService → SearchRepository.createIndex(schema)
11. SearchRepository → OpenSearch: PUT /cars with mappings
12. SearchService: Batch documents (100 per batch)
13. For each batch:
    a. SearchService → SearchRepository.bulkIndex(batch)
    b. SearchRepository → OpenSearch: POST /_bulk
    c. OpenSearch → SearchRepository: Bulk response
    d. SearchRepository: Check for errors, log failures
14. SearchService: Count total indexed
15. SearchService → Lambda Handler: { indexed: count }
16. Lambda Handler → Client: 200 + JSON response
```


## Components and Interfaces

### CDK Stack: SearchStack

**Location:** `infrastructure/lib/stacks/search-stack.ts`

**Purpose:** Provision OpenSearch Serverless collection with proper access policies

**Dependencies:**
- ApiStack (Lambda execution role ARN)

**Resources:**
- OpenSearch Serverless Collection (type: SEARCH)
- Encryption Policy (AWS-managed keys)
- Network Policy (public access for dev)
- Data Access Policy (Lambda role permissions)

**Exports:**
- Collection endpoint URL (for Lambda environment variable)

**Configuration:**
```typescript
interface SearchStackProps extends StackProps {
  lambdaExecutionRoleArn: string;
  environment: 'dev' | 'staging' | 'prod';
}

class SearchStack extends Stack {
  public readonly collectionEndpoint: string;
  
  constructor(scope: Construct, id: string, props: SearchStackProps) {
    // Create encryption policy
    const encryptionPolicy = new CfnSecurityPolicy(this, 'EncryptionPolicy', {
      name: 'primedeals-search-encryption',
      type: 'encryption',
      policy: JSON.stringify({
        Rules: [{ ResourceType: 'collection', Resource: ['collection/primedeals-cars'] }],
        AWSOwnedKey: true
      })
    });
    
    // Create network policy (public access for dev)
    const networkPolicy = new CfnSecurityPolicy(this, 'NetworkPolicy', {
      name: 'primedeals-search-network',
      type: 'network',
      policy: JSON.stringify([{
        Rules: [{ ResourceType: 'collection', Resource: ['collection/primedeals-cars'] }],
        AllowFromPublic: true
      }])
    });
    
    // Create collection
    const collection = new CfnCollection(this, 'SearchCollection', {
      name: 'primedeals-cars',
      type: 'SEARCH',
      description: 'Search collection for Prime Deal Auto car inventory'
    });
    collection.addDependency(encryptionPolicy);
    collection.addDependency(networkPolicy);
    
    // Create data access policy
    new CfnAccessPolicy(this, 'DataAccessPolicy', {
      name: 'primedeals-search-access',
      type: 'data',
      policy: JSON.stringify([{
        Rules: [{
          ResourceType: 'collection',
          Resource: [`collection/${collection.name}`],
          Permission: ['aoss:*']
        }, {
          ResourceType: 'index',
          Resource: [`index/${collection.name}/*`],
          Permission: ['aoss:*']
        }],
        Principal: [props.lambdaExecutionRoleArn]
      }])
    });
    
    this.collectionEndpoint = collection.attrCollectionEndpoint;
    
    new CfnOutput(this, 'CollectionEndpoint', {
      value: this.collectionEndpoint,
      exportName: 'SearchCollectionEndpoint'
    });
  }
}
```


### OpenSearch Client Library

**Location:** `backend/src/lib/opensearch.ts`

**Purpose:** Provide reusable OpenSearch client with AWS authentication and error handling

**Interface:**
```typescript
import { Client } from '@opensearch-project/opensearch';
import { AwsSigv4Signer } from '@opensearch-project/opensearch/aws';

let client: Client | null = null;

export function getOpenSearchClient(): Client {
  if (!client) {
    const endpoint = process.env.OPENSEARCH_ENDPOINT;
    if (!endpoint) {
      throw new Error('OPENSEARCH_ENDPOINT environment variable not set');
    }
    
    client = new Client({
      ...AwsSigv4Signer({
        region: process.env.AWS_REGION || 'us-east-1',
        service: 'aoss', // OpenSearch Serverless
        getCredentials: () => {
          // Lambda execution role credentials from environment
          return Promise.resolve({
            accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
            sessionToken: process.env.AWS_SESSION_TOKEN
          });
        }
      }),
      node: endpoint,
      requestTimeout: 5000,
      maxRetries: 3,
      retryOnTimeout: true
    });
  }
  
  return client;
}

export class OpenSearchError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'OpenSearchError';
  }
}
```

**Error Handling:**
- Connection timeouts → throw OpenSearchError
- 4xx responses → throw OpenSearchError with status code
- 5xx responses → throw OpenSearchError (triggers fallback)
- Network errors → throw OpenSearchError (triggers fallback)


### SearchRepository

**Location:** `backend/src/repositories/search.repository.ts`

**Purpose:** Execute OpenSearch queries and return typed results

**Interface:**
```typescript
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

export interface SearchOptions {
  limit: number;
  offset: number;
  sortBy?: 'price' | 'year' | 'mileage' | 'relevance';
  sortOrder?: 'asc' | 'desc';
}

export interface SearchResult {
  hits: CarDocument[];
  total: number;
}

export interface FacetResult {
  [key: string]: Array<{ value: string; count: number }>;
}

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
  primary_image_url: string;
  status: string;
  created_at: string;
}

export class SearchRepository {
  private readonly indexName = 'cars';
  
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
        body
      });
      
      return {
        hits: response.body.hits.hits.map((hit: any) => hit._source),
        total: response.body.hits.total.value
      };
    } catch (error) {
      throw new OpenSearchError('Search query failed', undefined, error);
    }
  }
  
  async getFacets(filters: SearchFilters): Promise<FacetResult> {
    const client = getOpenSearchClient();
    
    const body = this.buildFacetQuery(filters);
    
    try {
      const response = await client.search({
        index: this.indexName,
        body
      });
      
      return this.parseFacetResponse(response.body.aggregations);
    } catch (error) {
      throw new OpenSearchError('Facet query failed', undefined, error);
    }
  }
  
  async getSuggestions(
    field: 'make' | 'model' | 'variant',
    prefix: string
  ): Promise<string[]> {
    const client = getOpenSearchClient();
    
    const body = {
      size: 10,
      _source: [field],
      query: {
        bool: {
          must: [
            { prefix: { [`${field}.keyword`]: prefix.toLowerCase() } },
            { term: { status: 'active' } }
          ]
        }
      },
      collapse: { field: `${field}.keyword` },
      sort: [{ _score: 'desc' }]
    };
    
    try {
      const response = await client.search({
        index: this.indexName,
        body
      });
      
      return response.body.hits.hits.map((hit: any) => hit._source[field]);
    } catch (error) {
      throw new OpenSearchError('Suggestion query failed', undefined, error);
    }
  }
  
  async createIndex(): Promise<void> {
    const client = getOpenSearchClient();
    
    try {
      await client.indices.create({
        index: this.indexName,
        body: INDEX_SCHEMA
      });
    } catch (error) {
      throw new OpenSearchError('Index creation failed', undefined, error);
    }
  }
  
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
  
  private buildSearchQuery(
    query: string | null,
    filters: SearchFilters,
    options: SearchOptions
  ): any {
    const must: any[] = [{ term: { status: 'active' } }];
    
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
    
    if (filters.make) filter.push({ term: { 'make.keyword': filters.make } });
    if (filters.model) filter.push({ term: { 'model.keyword': filters.model } });
    if (filters.variant) filter.push({ term: { 'variant.keyword': filters.variant } });
    if (filters.bodyType) filter.push({ term: { 'body_type.keyword': filters.bodyType } });
    if (filters.fuelType) filter.push({ term: { fuel_type: filters.fuelType } });
    if (filters.transmission) filter.push({ term: { transmission: filters.transmission } });
    if (filters.condition) filter.push({ term: { condition: filters.condition } });
    
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
  
  private buildFacetQuery(filters: SearchFilters): any {
    const filter: any[] = [{ term: { status: 'active' } }];
    
    // Apply filters (same as search)
    if (filters.make) filter.push({ term: { 'make.keyword': filters.make } });
    if (filters.model) filter.push({ term: { 'model.keyword': filters.model } });
    // ... (other filters)
    
    return {
      size: 0,
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
```


### SearchService

**Location:** `backend/src/services/search.service.ts`

**Purpose:** Orchestrate search operations, validate inputs, handle fallback logic

**Interface:**
```typescript
export class SearchService {
  constructor(
    private searchRepository: SearchRepository,
    private carRepository: CarRepository
  ) {}
  
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
    
    // Sanitize query input
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
        console.warn('OpenSearch unavailable, falling back to PostgreSQL', error);
        
        // Fallback to PostgreSQL
        const result = await this.carRepository.fullTextSearch(
          query,
          params.filters,
          { limit, offset, sortBy, sortOrder }
        );
        
        return this.formatResponse(result, limit, offset);
      }
      
      throw error;
    }
  }
  
  async getFacets(filters: SearchFilters): Promise<FacetResult> {
    this.validateFilters(filters);
    
    try {
      return await this.searchRepository.getFacets(filters);
    } catch (error) {
      if (error instanceof OpenSearchError) {
        console.warn('OpenSearch unavailable for facets');
        // Return empty facets rather than failing
        return {};
      }
      throw error;
    }
  }
  
  async getSuggestions(field: string, prefix: string): Promise<string[]> {
    if (!['make', 'model', 'variant'].includes(field)) {
      throw new ValidationError('Invalid field parameter');
    }
    
    if (!prefix || prefix.length < 2) {
      throw new ValidationError('Prefix must be at least 2 characters');
    }
    
    try {
      return await this.searchRepository.getSuggestions(
        field as 'make' | 'model' | 'variant',
        prefix
      );
    } catch (error) {
      if (error instanceof OpenSearchError) {
        console.warn('OpenSearch unavailable for suggestions');
        return [];
      }
      throw error;
    }
  }
  
  async reindex(): Promise<{ indexed: number }> {
    // Fetch all active cars from database
    const cars = await this.carRepository.findAllActive();
    
    console.log(`Starting reindex of ${cars.length} cars`);
    
    // Delete existing index
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
      primary_image_url: car.primary_image_url || '',
      status: car.status,
      created_at: car.created_at
    };
  }
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
```


### CarRepository (PostgreSQL Fallback)

**Location:** `backend/src/repositories/car.repository.ts` (extend existing)

**Purpose:** Provide PostgreSQL full-text search as fallback when OpenSearch is unavailable

**New Methods:**
```typescript
export class CarRepository {
  // ... existing methods ...
  
  async fullTextSearch(
    query: string | null,
    filters: SearchFilters,
    options: SearchOptions
  ): Promise<SearchResult> {
    const params: any[] = [];
    let paramIndex = 1;
    
    const whereClauses: string[] = ["status = 'active'"];
    
    // Full-text search using GIN index
    if (query) {
      whereClauses.push(`search_vector @@ plainto_tsquery('english', $${paramIndex})`);
      params.push(query);
      paramIndex++;
    }
    
    // Apply filters
    if (filters.make) {
      whereClauses.push(`make = $${paramIndex}`);
      params.push(filters.make);
      paramIndex++;
    }
    
    if (filters.model) {
      whereClauses.push(`model = $${paramIndex}`);
      params.push(filters.model);
      paramIndex++;
    }
    
    if (filters.variant) {
      whereClauses.push(`variant = $${paramIndex}`);
      params.push(filters.variant);
      paramIndex++;
    }
    
    if (filters.bodyType) {
      whereClauses.push(`body_type = $${paramIndex}`);
      params.push(filters.bodyType);
      paramIndex++;
    }
    
    if (filters.fuelType) {
      whereClauses.push(`fuel_type = $${paramIndex}`);
      params.push(filters.fuelType);
      paramIndex++;
    }
    
    if (filters.transmission) {
      whereClauses.push(`transmission = $${paramIndex}`);
      params.push(filters.transmission);
      paramIndex++;
    }
    
    if (filters.condition) {
      whereClauses.push(`condition = $${paramIndex}`);
      params.push(filters.condition);
      paramIndex++;
    }
    
    if (filters.minPrice !== undefined) {
      whereClauses.push(`price >= $${paramIndex}`);
      params.push(filters.minPrice);
      paramIndex++;
    }
    
    if (filters.maxPrice !== undefined) {
      whereClauses.push(`price <= $${paramIndex}`);
      params.push(filters.maxPrice);
      paramIndex++;
    }
    
    if (filters.minYear !== undefined) {
      whereClauses.push(`year >= $${paramIndex}`);
      params.push(filters.minYear);
      paramIndex++;
    }
    
    if (filters.maxYear !== undefined) {
      whereClauses.push(`year <= $${paramIndex}`);
      params.push(filters.maxYear);
      paramIndex++;
    }
    
    const whereClause = whereClauses.join(' AND ');
    
    // Build ORDER BY (whitelist to prevent injection)
    let orderBy = 'created_at DESC';
    if (options.sortBy && options.sortBy !== 'relevance') {
      const sortColumn = options.sortBy; // already validated by service
      const sortDirection = options.sortOrder === 'desc' ? 'DESC' : 'ASC';
      orderBy = `${sortColumn} ${sortDirection}`;
    } else if (query) {
      // Sort by relevance when query is present
      orderBy = `ts_rank(search_vector, plainto_tsquery('english', $1)) DESC`;
    }
    
    // Count query
    const countQuery = `SELECT COUNT(*) FROM cars WHERE ${whereClause}`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count, 10);
    
    // Data query
    const dataQuery = `
      SELECT 
        id, make, model, variant, year, price, mileage,
        body_type, fuel_type, transmission, condition, color,
        description, features, primary_image_url, status, created_at
      FROM cars
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
  
  async findAllActive(): Promise<any[]> {
    const query = `
      SELECT 
        id, make, model, variant, year, price, mileage,
        body_type, fuel_type, transmission, condition, color,
        description, features, primary_image_url, status, created_at
      FROM cars
      WHERE status = 'active'
      ORDER BY created_at DESC
    `;
    
    const result = await pool.query(query);
    return result.rows;
  }
}
```

**Database Schema Addition:**
```sql
-- Add tsvector column for full-text search
ALTER TABLE cars ADD COLUMN search_vector tsvector;

-- Create GIN index for fast full-text search
CREATE INDEX idx_cars_search_vector ON cars USING GIN(search_vector);

-- Create trigger to auto-update search_vector
CREATE OR REPLACE FUNCTION cars_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.make, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.model, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.variant, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.features, ' '), '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cars_search_vector_trigger
BEFORE INSERT OR UPDATE ON cars
FOR EACH ROW EXECUTE FUNCTION cars_search_vector_update();

-- Populate existing rows
UPDATE cars SET search_vector = 
  setweight(to_tsvector('english', COALESCE(make, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(model, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(variant, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(description, '')), 'C') ||
  setweight(to_tsvector('english', COALESCE(array_to_string(features, ' '), '')), 'C');
```


### API Handlers

**Location:** `backend/src/handlers/search.handler.ts`

**Purpose:** Handle HTTP requests for search endpoints

**Endpoints:**
```typescript
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export async function handleSearch(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const params = event.queryStringParameters || {};
    
    const filters: SearchFilters = {
      make: params.make,
      model: params.model,
      variant: params.variant,
      minPrice: params.minPrice ? parseFloat(params.minPrice) : undefined,
      maxPrice: params.maxPrice ? parseFloat(params.maxPrice) : undefined,
      minYear: params.minYear ? parseInt(params.minYear, 10) : undefined,
      maxYear: params.maxYear ? parseInt(params.maxYear, 10) : undefined,
      bodyType: params.bodyType,
      fuelType: params.fuelType as any,
      transmission: params.transmission as any,
      condition: params.condition as any
    };
    
    const result = await searchService.search({
      query: params.q,
      filters,
      limit: params.limit ? parseInt(params.limit, 10) : undefined,
      offset: params.offset ? parseInt(params.offset, 10) : undefined,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder
    });
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*'
      },
      body: JSON.stringify({ success: true, data: result })
    };
  } catch (error) {
    return handleError(error);
  }
}

export async function handleFacets(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const params = event.queryStringParameters || {};
    
    const filters: SearchFilters = {
      make: params.make,
      model: params.model,
      variant: params.variant,
      minPrice: params.minPrice ? parseFloat(params.minPrice) : undefined,
      maxPrice: params.maxPrice ? parseFloat(params.maxPrice) : undefined,
      minYear: params.minYear ? parseInt(params.minYear, 10) : undefined,
      maxYear: params.maxYear ? parseInt(params.maxYear, 10) : undefined,
      bodyType: params.bodyType,
      fuelType: params.fuelType as any,
      transmission: params.transmission as any,
      condition: params.condition as any
    };
    
    const result = await searchService.getFacets(filters);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*'
      },
      body: JSON.stringify({ success: true, data: result })
    };
  } catch (error) {
    return handleError(error);
  }
}

export async function handleSuggestions(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const params = event.queryStringParameters || {};
    
    if (!params.field || !params.q) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'Missing required parameters: field and q',
          code: 'VALIDATION_ERROR'
        })
      };
    }
    
    const result = await searchService.getSuggestions(params.field, params.q);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*'
      },
      body: JSON.stringify({ success: true, data: result })
    };
  } catch (error) {
    return handleError(error);
  }
}

export async function handleReindex(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    // Check authentication
    const claims = event.requestContext.authorizer?.claims;
    if (!claims) {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'Unauthorized',
          code: 'UNAUTHORIZED'
        })
      };
    }
    
    // Check admin group membership
    const groups = claims['cognito:groups'] || '';
    if (!groups.includes('admin')) {
      return {
        statusCode: 403,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'Forbidden: Admin access required',
          code: 'FORBIDDEN'
        })
      };
    }
    
    const result = await searchService.reindex();
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*'
      },
      body: JSON.stringify({ success: true, data: result })
    };
  } catch (error) {
    return handleError(error);
  }
}

function handleError(error: unknown): APIGatewayProxyResult {
  console.error('Handler error:', error);
  
  if (error instanceof ValidationError) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*'
      },
      body: JSON.stringify({
        success: false,
        error: error.message,
        code: 'VALIDATION_ERROR'
      })
    };
  }
  
  if (error instanceof OpenSearchError) {
    return {
      statusCode: 503,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*'
      },
      body: JSON.stringify({
        success: false,
        error: 'Search service temporarily unavailable',
        code: 'SERVICE_UNAVAILABLE'
      })
    };
  }
  
  return {
    statusCode: 500,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*'
    },
    body: JSON.stringify({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    })
  };
}
```

**Lambda Router Integration:**
```typescript
// backend/src/lambda.ts
import { handleSearch, handleFacets, handleSuggestions, handleReindex } from './handlers/search.handler';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const path = event.path;
  const method = event.httpMethod;
  
  // ... existing routes ...
  
  // Search routes
  if (path === '/search' && method === 'GET') {
    return handleSearch(event);
  }
  
  if (path === '/search/facets' && method === 'GET') {
    return handleFacets(event);
  }
  
  if (path === '/search/suggestions' && method === 'GET') {
    return handleSuggestions(event);
  }
  
  if (path === '/admin/reindex' && method === 'POST') {
    return handleReindex(event);
  }
  
  // ... other routes ...
}
```


## Data Models

### OpenSearch Index Schema

**Index Name:** `cars`

**Mapping Definition:**
```typescript
// backend/src/lib/opensearch-schema.ts
export const INDEX_SCHEMA = {
  settings: {
    number_of_shards: 2,
    number_of_replicas: 1,
    analysis: {
      analyzer: {
        standard_lowercase: {
          type: 'standard',
          stopwords: '_english_'
        }
      }
    }
  },
  mappings: {
    properties: {
      id: {
        type: 'keyword'
      },
      make: {
        type: 'text',
        analyzer: 'standard_lowercase',
        fields: {
          keyword: {
            type: 'keyword',
            normalizer: 'lowercase'
          }
        }
      },
      model: {
        type: 'text',
        analyzer: 'standard_lowercase',
        fields: {
          keyword: {
            type: 'keyword',
            normalizer: 'lowercase'
          }
        }
      },
      variant: {
        type: 'text',
        analyzer: 'standard_lowercase',
        fields: {
          keyword: {
            type: 'keyword',
            normalizer: 'lowercase'
          }
        }
      },
      year: {
        type: 'integer'
      },
      price: {
        type: 'float'
      },
      mileage: {
        type: 'integer'
      },
      body_type: {
        type: 'keyword',
        fields: {
          keyword: {
            type: 'keyword'
          }
        }
      },
      fuel_type: {
        type: 'keyword'
      },
      transmission: {
        type: 'keyword'
      },
      condition: {
        type: 'keyword'
      },
      color: {
        type: 'keyword'
      },
      description: {
        type: 'text',
        analyzer: 'standard_lowercase'
      },
      features: {
        type: 'text',
        analyzer: 'standard_lowercase'
      },
      primary_image_url: {
        type: 'keyword',
        index: false
      },
      status: {
        type: 'keyword'
      },
      created_at: {
        type: 'date'
      }
    }
  }
};
```

**Field Descriptions:**

| Field | Type | Purpose | Searchable | Filterable | Aggregatable |
|-------|------|---------|------------|------------|--------------|
| id | keyword | Unique identifier | No | Yes | No |
| make | text + keyword | Car manufacturer | Yes | Yes | Yes |
| model | text + keyword | Car model | Yes | Yes | Yes |
| variant | text + keyword | Model variant/trim | Yes | Yes | Yes |
| year | integer | Manufacturing year | No | Yes (range) | Yes |
| price | float | Price in ZAR | No | Yes (range) | No |
| mileage | integer | Odometer reading (km) | No | Yes (range) | No |
| body_type | keyword | Body style | No | Yes | Yes |
| fuel_type | keyword | Fuel type enum | No | Yes | Yes |
| transmission | keyword | Transmission enum | No | Yes | Yes |
| condition | keyword | Condition enum | No | Yes | Yes |
| color | keyword | Exterior color | No | Yes | Yes |
| description | text | Full description | Yes | No | No |
| features | text | Array of features | Yes | No | No |
| primary_image_url | keyword | CloudFront URL | No | No | No |
| status | keyword | Car status | No | Yes | No |
| created_at | date | Creation timestamp | No | Yes | No |

**Multi-Field Strategy:**
- `make`, `model`, `variant`: Text field for full-text search + keyword subfield for exact matching and aggregations
- Text fields use `standard_lowercase` analyzer for case-insensitive search
- Keyword fields use `lowercase` normalizer for case-insensitive exact matching

**Analyzer Configuration:**
- `standard_lowercase`: Standard tokenizer + lowercase filter + English stop words
- Handles common search patterns without custom complexity
- Supports partial word matching through prefix queries on keyword subfields


### Query DSL Examples

**Full-Text Search with Filters:**
```json
{
  "query": {
    "bool": {
      "must": [
        {
          "term": { "status": "active" }
        },
        {
          "multi_match": {
            "query": "toyota camry",
            "fields": ["make^3", "model^3", "variant^2", "description", "features"],
            "type": "best_fields",
            "fuzziness": "AUTO"
          }
        }
      ],
      "filter": [
        { "term": { "make.keyword": "toyota" } },
        { "range": { "price": { "gte": 100000, "lte": 300000 } } },
        { "range": { "year": { "gte": 2018 } } },
        { "term": { "fuel_type": "petrol" } }
      ]
    }
  },
  "sort": [{ "_score": "desc" }],
  "from": 0,
  "size": 20
}
```

**Faceted Search (Aggregations):**
```json
{
  "size": 0,
  "query": {
    "bool": {
      "filter": [
        { "term": { "status": "active" } },
        { "range": { "price": { "gte": 100000, "lte": 300000 } } }
      ]
    }
  },
  "aggs": {
    "make": {
      "terms": { "field": "make.keyword", "size": 50 }
    },
    "model": {
      "terms": { "field": "model.keyword", "size": 50 }
    },
    "variant": {
      "terms": { "field": "variant.keyword", "size": 50 }
    },
    "body_type": {
      "terms": { "field": "body_type.keyword", "size": 50 }
    },
    "fuel_type": {
      "terms": { "field": "fuel_type", "size": 10 }
    },
    "transmission": {
      "terms": { "field": "transmission", "size": 10 }
    },
    "condition": {
      "terms": { "field": "condition", "size": 10 }
    }
  }
}
```

**Autocomplete Suggestions:**
```json
{
  "size": 10,
  "_source": ["make"],
  "query": {
    "bool": {
      "must": [
        { "prefix": { "make.keyword": "toy" } },
        { "term": { "status": "active" } }
      ]
    }
  },
  "collapse": { "field": "make.keyword" },
  "sort": [{ "_score": "desc" }]
}
```

**Bulk Index Request:**
```json
{ "index": { "_index": "cars", "_id": "uuid-1" } }
{ "id": "uuid-1", "make": "Toyota", "model": "Camry", "year": 2020, "price": 250000, ... }
{ "index": { "_index": "cars", "_id": "uuid-2" } }
{ "id": "uuid-2", "make": "BMW", "model": "X5", "year": 2019, "price": 450000, ... }
```

### PostgreSQL Fallback Schema

**Table:** `cars` (existing table with additions)

**New Column:**
```sql
search_vector tsvector
```

**Index:**
```sql
CREATE INDEX idx_cars_search_vector ON cars USING GIN(search_vector);
```

**Trigger Function:**
```sql
CREATE OR REPLACE FUNCTION cars_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.make, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.model, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.variant, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.features, ' '), '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Weight Explanation:**
- Weight A (highest): `make`, `model` - most important for relevance
- Weight B: `variant` - secondary importance
- Weight C: `description`, `features` - supporting content

**Query Example:**
```sql
SELECT 
  id, make, model, variant, year, price, mileage,
  body_type, fuel_type, transmission, condition, color,
  description, features, primary_image_url, status, created_at,
  ts_rank(search_vector, plainto_tsquery('english', 'toyota camry')) AS rank
FROM cars
WHERE 
  status = 'active'
  AND search_vector @@ plainto_tsquery('english', 'toyota camry')
  AND price BETWEEN 100000 AND 300000
  AND year >= 2018
ORDER BY rank DESC
LIMIT 20 OFFSET 0;
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I identified the following redundancies and consolidations:

**Redundant Properties:**
- Criteria 4.1-4.9 (individual filter types) are subsumed by 4.10 (multiple filters with AND logic) and 3.2 (all filters applied)
- Criteria 5.1-5.7 (individual facet fields) can be combined into a single property about facet structure
- Criteria 6.1-6.3 (suggestions per field) can be combined into a single property about suggestion behavior
- Criteria 11.1 duplicates 3.9 (fallback behavior)
- Criteria 12.4 duplicates 7.1 (admin authorization)
- Criteria 9.4 duplicates 3.9 (fallback logic)

**Consolidated Properties:**
- Filter properties (4.1-4.10) → Single property: "All provided filters are applied with AND logic"
- Facet properties (5.1-5.7) → Single property: "Facets contain all required fields with counts"
- Suggestion properties (6.1-6.3) → Single property: "Suggestions return up to 10 results for any valid field"
- Search field coverage (3.1, 11.3) → Single property: "Search queries match across all specified fields"

### Property 1: Search Query Field Coverage

*For any* search query and car document, if the document contains the query text in make, model, variant, description, or features fields, then the document should appear in the search results.

**Validates: Requirements 3.1**

### Property 2: Filter Application with AND Logic

*For any* combination of filter criteria, all provided filters should be applied to the results using AND logic, such that every result satisfies all filter conditions.

**Validates: Requirements 3.2, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10**

### Property 3: Active Status Filter

*For any* search query and filter combination, all returned results should have status='active' and no other status values should appear.

**Validates: Requirements 3.4**

### Property 4: Pagination Bounds

*For any* search request with limit and offset parameters, the number of returned results should not exceed the limit, and the offset should determine the starting position in the result set.

**Validates: Requirements 3.5**

### Property 5: Sort Order Correctness

*For any* search results sorted by price, year, or mileage, the results should be ordered according to the specified sort direction (ascending or descending).

**Validates: Requirements 3.6**

### Property 6: Response Structure Completeness

*For any* search response, the response should contain data, total, page, limit, and hasMore fields with correct types and values.

**Validates: Requirements 3.8**

### Property 7: Enum Filter Validation

*For any* filter request with enum values (fuelType, transmission, condition), invalid enum values should be rejected with a VALIDATION_ERROR before querying.

**Validates: Requirements 4.11**

### Property 8: Facet Structure Completeness

*For any* facet request, the response should contain facets for make, model, variant, body_type, fuel_type, transmission, and condition, each with value and count fields.

**Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7**

### Property 9: Facet Count Accuracy

*For any* facet request with filters applied, the facet counts should reflect the filtered result set, not the entire index.

**Validates: Requirements 5.8**

### Property 10: Facet Size Limit

*For any* facet category, the number of returned facet values should not exceed 50.

**Validates: Requirements 5.9**

### Property 11: Suggestion Result Limit

*For any* valid suggestion request (field in [make, model, variant] and prefix >= 2 characters), the number of returned suggestions should not exceed 10.

**Validates: Requirements 6.1, 6.2, 6.3**

### Property 12: Suggestion Ordering

*For any* suggestion request, the returned suggestions should be ordered by relevance and frequency (most relevant first).

**Validates: Requirements 6.4**

### Property 13: Suggestion Minimum Length

*For any* suggestion request with a prefix shorter than 2 characters, the system should reject the request with a VALIDATION_ERROR.

**Validates: Requirements 6.6**

### Property 14: Reindex Active Cars Only

*For any* reindex operation, only cars with status='active' should be fetched from the database and indexed into OpenSearch.

**Validates: Requirements 7.2**

### Property 15: Reindex Document Transformation

*For any* car record from the database, the transformation to a search document should preserve all required fields (id, make, model, variant, year, price, mileage, body_type, fuel_type, transmission, condition, color, description, features, primary_image_url, status, created_at).

**Validates: Requirements 7.3**

### Property 16: Reindex Batch Size

*For any* reindex operation, documents should be sent to OpenSearch in batches of exactly 100 (or fewer for the final batch).

**Validates: Requirements 7.4**

### Property 17: Reindex Count Accuracy

*For any* reindex operation, the returned indexed count should equal the number of active cars successfully indexed.

**Validates: Requirements 7.6**

### Property 18: OpenSearch Error Mapping

*For any* OpenSearch error, the system should throw a structured error with an error code and message, never exposing internal OpenSearch details.

**Validates: Requirements 8.7, 13.4**

### Property 19: Search Parameter Validation

*For any* search request, invalid parameters (negative limit/offset, invalid sortBy, invalid enum values) should be rejected with a VALIDATION_ERROR before querying.

**Validates: Requirements 9.2**

### Property 20: Repository Result Transformation

*For any* repository result (from OpenSearch or PostgreSQL), the service should transform it into the API response format with data, total, page, limit, and hasMore fields.

**Validates: Requirements 9.3**

### Property 21: Input Sanitization

*For any* user-provided search query or filter value, dangerous characters or SQL/NoSQL injection patterns should be sanitized before querying.

**Validates: Requirements 9.5**

### Property 22: Maximum Limit Enforcement

*For any* search request with a limit parameter greater than 100, the system should cap the limit at 100.

**Validates: Requirements 9.6**

### Property 23: HasMore Calculation

*For any* search response, the hasMore flag should be true if and only if (offset + limit) < total.

**Validates: Requirements 9.7**

### Property 24: Query DSL Filter Inclusion

*For any* search request with filter criteria, the built OpenSearch query DSL should include a filter clause for each provided filter.

**Validates: Requirements 10.2**

### Property 25: Fallback Search Field Coverage

*For any* PostgreSQL fallback search with a query, the search should match across make, model, variant, and description fields using the tsvector column.

**Validates: Requirements 11.3**

### Property 26: Fallback Filter Application

*For any* PostgreSQL fallback search with filters, all filter criteria should be applied using WHERE clauses.

**Validates: Requirements 11.4**

### Property 27: Fallback Pagination Support

*For any* PostgreSQL fallback search, pagination should work correctly using LIMIT and OFFSET clauses.

**Validates: Requirements 11.5**

### Property 28: Fallback Sort Support

*For any* PostgreSQL fallback search, sorting by price, year, or mileage should produce correctly ordered results.

**Validates: Requirements 11.6**

### Property 29: Fallback Response Format Consistency

*For any* search request, the response format should be identical whether results come from OpenSearch or PostgreSQL fallback.

**Validates: Requirements 11.7**

### Property 30: Validation Error Response

*For any* request with invalid filter values, the system should return a 400 status code with error code VALIDATION_ERROR.

**Validates: Requirements 13.1**

### Property 31: Error Response Sanitization

*For any* error response, the response should never contain OpenSearch internal errors, stack traces, or sensitive implementation details.

**Validates: Requirements 13.4**

### Property 32: Error Request ID Inclusion

*For any* error response, the response should include a request ID for traceability.

**Validates: Requirements 13.5**


## Error Handling

### Error Types

**ValidationError**
- Thrown when: Invalid input parameters (negative limit, invalid enum, short prefix, etc.)
- HTTP Status: 400
- Error Code: `VALIDATION_ERROR`
- Response: `{ success: false, error: "descriptive message", code: "VALIDATION_ERROR" }`

**OpenSearchError**
- Thrown when: OpenSearch connection fails, query times out, or returns 5xx
- Triggers: Fallback to PostgreSQL
- If fallback succeeds: Return results normally (no error to client)
- If fallback fails: HTTP 503, code `SERVICE_UNAVAILABLE`

**AuthenticationError**
- Thrown when: Missing or invalid JWT token on protected endpoint
- HTTP Status: 401
- Error Code: `UNAUTHORIZED`
- Response: `{ success: false, error: "Unauthorized", code: "UNAUTHORIZED" }`

**AuthorizationError**
- Thrown when: Valid JWT but user not in required group (admin)
- HTTP Status: 403
- Error Code: `FORBIDDEN`
- Response: `{ success: false, error: "Forbidden: Admin access required", code: "FORBIDDEN" }`

**InternalError**
- Thrown when: Unexpected errors (database connection, parsing, etc.)
- HTTP Status: 500
- Error Code: `INTERNAL_ERROR`
- Response: `{ success: false, error: "Internal server error", code: "INTERNAL_ERROR" }`
- Logging: Full error details logged to CloudWatch, never exposed to client

### Error Handling Flow

```
Request → Handler
  ↓
Try: Service Layer
  ↓
Try: Repository Layer
  ↓
OpenSearch Query
  ↓
Success? → Return results
  ↓
Failure (OpenSearchError)
  ↓
Catch in Service Layer
  ↓
Log warning: "OpenSearch unavailable, falling back to PostgreSQL"
  ↓
Try: PostgreSQL Fallback
  ↓
Success? → Return results (no error to client)
  ↓
Failure → Throw error
  ↓
Catch in Handler
  ↓
Return 503 SERVICE_UNAVAILABLE
```

### Error Logging

All errors are logged to CloudWatch with structured JSON:
```typescript
{
  timestamp: new Date().toISOString(),
  level: 'error',
  requestId: context.requestId,
  path: event.path,
  method: event.httpMethod,
  errorType: error.name,
  errorMessage: error.message,
  errorStack: error.stack,
  userId: claims?.sub,
  queryParams: event.queryStringParameters
}
```

### Retry Strategy

**OpenSearch Client:**
- Max retries: 3
- Retry on: Connection timeout, 5xx responses
- Backoff: Exponential (100ms, 200ms, 400ms)
- No retry on: 4xx responses (client errors)

**Lambda Invocation:**
- API Gateway handles retries for 5xx responses
- No application-level retry logic needed

### Fallback Trigger Conditions

Fallback to PostgreSQL is triggered when:
1. OpenSearch connection timeout (> 5 seconds)
2. OpenSearch returns 5xx error
3. OpenSearch client throws network error
4. OpenSearch collection is unavailable

Fallback is NOT triggered for:
- 4xx errors (client errors, invalid queries)
- Validation errors (caught before OpenSearch call)
- Authentication/authorization errors


## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests for comprehensive coverage:

**Unit Tests:**
- Specific examples and edge cases
- Integration points between components
- Error conditions and fallback behavior
- Authentication and authorization checks

**Property-Based Tests:**
- Universal properties across all inputs
- Comprehensive input coverage through randomization
- Validation of correctness properties defined in this document

### Property-Based Testing Configuration

**Library:** `fast-check` (JavaScript/TypeScript property-based testing library)

**Configuration:**
- Minimum 100 iterations per property test
- Each test tagged with: `Feature: search-filtering, Property {number}: {property_text}`
- Generators for: search queries, filter combinations, pagination params, car documents

**Example Property Test:**
```typescript
import fc from 'fast-check';

// Feature: search-filtering, Property 2: Filter Application with AND Logic
test('all provided filters are applied with AND logic', () => {
  fc.assert(
    fc.property(
      fc.record({
        make: fc.option(fc.string()),
        model: fc.option(fc.string()),
        minPrice: fc.option(fc.nat()),
        maxPrice: fc.option(fc.nat()),
        minYear: fc.option(fc.integer({ min: 1900, max: 2025 })),
        maxYear: fc.option(fc.integer({ min: 1900, max: 2025 })),
        fuelType: fc.option(fc.constantFrom('petrol', 'diesel', 'electric', 'hybrid')),
        transmission: fc.option(fc.constantFrom('automatic', 'manual', 'cvt')),
        condition: fc.option(fc.constantFrom('excellent', 'good', 'fair', 'poor'))
      }),
      async (filters) => {
        const results = await searchService.search({ filters, limit: 100, offset: 0 });
        
        // Verify all results satisfy all provided filters
        for (const car of results.data) {
          if (filters.make) expect(car.make).toBe(filters.make);
          if (filters.model) expect(car.model).toBe(filters.model);
          if (filters.minPrice) expect(car.price).toBeGreaterThanOrEqual(filters.minPrice);
          if (filters.maxPrice) expect(car.price).toBeLessThanOrEqual(filters.maxPrice);
          if (filters.minYear) expect(car.year).toBeGreaterThanOrEqual(filters.minYear);
          if (filters.maxYear) expect(car.year).toBeLessThanOrEqual(filters.maxYear);
          if (filters.fuelType) expect(car.fuel_type).toBe(filters.fuelType);
          if (filters.transmission) expect(car.transmission).toBe(filters.transmission);
          if (filters.condition) expect(car.condition).toBe(filters.condition);
        }
      }
    ),
    { numRuns: 100 }
  );
});
```

### Unit Test Coverage

**SearchService Tests** (`backend/tests/unit/services/search.service.test.ts`):
- Parameter validation (negative limit, invalid sortBy, invalid enum values)
- Limit capping at 100
- hasMore calculation
- Fallback orchestration (mock OpenSearch failure)
- Response transformation

**SearchRepository Tests** (`backend/tests/unit/repositories/search.repository.test.ts`):
- Query DSL building for various filter combinations
- Facet query building
- Suggestion query building
- Bulk index batching
- Error mapping (OpenSearch errors → OpenSearchError)

**CarRepository Tests** (`backend/tests/unit/repositories/car.repository.test.ts`):
- PostgreSQL full-text search query building
- Filter application in WHERE clauses
- Pagination with LIMIT/OFFSET
- Sort order validation

**Handler Tests** (`backend/tests/unit/handlers/search.handler.test.ts`):
- Request parsing (query params → filters)
- Authentication checks (admin endpoint)
- Authorization checks (admin group membership)
- Error response formatting
- CORS headers

**CDK Stack Tests** (`infrastructure/tests/unit/stacks/search-stack.test.ts`):
- OpenSearch Serverless collection creation
- Encryption policy configuration
- Network policy configuration
- Data access policy with Lambda role
- CloudFormation output for endpoint

### Integration Tests

**OpenSearch Integration** (`backend/tests/integration/search.integration.test.ts`):
- Index creation with schema
- Document indexing
- Search queries with filters
- Facet aggregations
- Autocomplete suggestions
- Bulk indexing

**PostgreSQL Fallback Integration** (`backend/tests/integration/fallback.integration.test.ts`):
- Full-text search with tsvector
- Filter application
- Pagination
- Sort order
- Response format consistency with OpenSearch

### Test Data Generators

**Car Document Generator:**
```typescript
const carDocumentArb = fc.record({
  id: fc.uuid(),
  make: fc.constantFrom('Toyota', 'BMW', 'Mercedes', 'Audi', 'Ford', 'Honda'),
  model: fc.string({ minLength: 2, maxLength: 20 }),
  variant: fc.string({ minLength: 2, maxLength: 20 }),
  year: fc.integer({ min: 2000, max: 2025 }),
  price: fc.float({ min: 50000, max: 2000000 }),
  mileage: fc.integer({ min: 0, max: 500000 }),
  body_type: fc.constantFrom('sedan', 'suv', 'hatchback', 'truck', 'coupe'),
  fuel_type: fc.constantFrom('petrol', 'diesel', 'electric', 'hybrid'),
  transmission: fc.constantFrom('automatic', 'manual', 'cvt'),
  condition: fc.constantFrom('excellent', 'good', 'fair', 'poor'),
  color: fc.constantFrom('white', 'black', 'silver', 'red', 'blue'),
  description: fc.lorem({ maxCount: 50 }),
  features: fc.array(fc.string(), { minLength: 0, maxLength: 10 }),
  primary_image_url: fc.webUrl(),
  status: fc.constant('active'),
  created_at: fc.date().map(d => d.toISOString())
});
```

**Search Filter Generator:**
```typescript
const searchFiltersArb = fc.record({
  make: fc.option(fc.string()),
  model: fc.option(fc.string()),
  variant: fc.option(fc.string()),
  minPrice: fc.option(fc.nat()),
  maxPrice: fc.option(fc.nat()),
  minYear: fc.option(fc.integer({ min: 1900, max: 2025 })),
  maxYear: fc.option(fc.integer({ min: 1900, max: 2025 })),
  bodyType: fc.option(fc.string()),
  fuelType: fc.option(fc.constantFrom('petrol', 'diesel', 'electric', 'hybrid')),
  transmission: fc.option(fc.constantFrom('automatic', 'manual', 'cvt')),
  condition: fc.option(fc.constantFrom('excellent', 'good', 'fair', 'poor'))
});
```

### Test Execution

**Unit Tests:**
```bash
cd backend
npm run test:unit
```

**Integration Tests:**
```bash
cd backend
npm run test:integration
```

**Property-Based Tests:**
```bash
cd backend
npm run test:properties
```

**CDK Tests:**
```bash
cd infrastructure
npm run test
```

### Mocking Strategy

**OpenSearch Client:**
- Mock for unit tests (return predefined results)
- Real client for integration tests (use local OpenSearch or test collection)

**PostgreSQL:**
- Mock pool for unit tests
- Real database for integration tests (use test database)

**AWS SDK:**
- Mock for CDK tests (use CDK assertions)

### Coverage Goals

- Unit test coverage: > 80% for service and repository layers
- Property test coverage: All 32 correctness properties implemented
- Integration test coverage: All API endpoints and database queries
- CDK test coverage: All stack resources and policies


## Deployment and Configuration

### Environment Variables

**Lambda Function:**
```typescript
{
  OPENSEARCH_ENDPOINT: string;           // From SearchStack output
  DB_HOST: string;                       // RDS Proxy endpoint
  DB_NAME: string;                       // Database name
  DB_SECRET_ARN: string;                 // Secrets Manager ARN
  AWS_REGION: string;                    // us-east-1
  FRONTEND_URL: string;                  // For CORS
  NODE_ENV: string;                      // dev | staging | prod
}
```

### CDK Stack Dependencies

**SearchStack depends on:**
- ApiStack (for Lambda execution role ARN)

**ApiStack must be updated with:**
- OpenSearch endpoint from SearchStack
- IAM permissions for OpenSearch access

### Deployment Steps

1. **Deploy SearchStack:**
   ```bash
   cd infrastructure
   npx cdk deploy PrimeDeals-Search --profile prime-deal-auto
   ```

2. **Update ApiStack Lambda with OpenSearch permissions:**
   - Add `aoss:*` permissions for the collection
   - Add OPENSEARCH_ENDPOINT environment variable

3. **Deploy updated ApiStack:**
   ```bash
   npx cdk deploy PrimeDeals-Api --profile prime-deal-auto
   ```

4. **Run database migration:**
   ```bash
   psql -h <rds-proxy-endpoint> -U admin -d primedealauto -f backend/db/migrations/006_search_vector.sql
   ```

5. **Trigger initial reindex:**
   ```bash
   curl -X POST https://api.primedealauto.com/admin/reindex \
     -H "Authorization: Bearer <admin-jwt-token>"
   ```

### Database Migration

**File:** `backend/db/migrations/006_search_vector.sql`

```sql
-- Add tsvector column for full-text search fallback
ALTER TABLE cars ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS idx_cars_search_vector ON cars USING GIN(search_vector);

-- Create trigger function to auto-update search_vector
CREATE OR REPLACE FUNCTION cars_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.make, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.model, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.variant, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.features, ' '), '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS cars_search_vector_trigger ON cars;
CREATE TRIGGER cars_search_vector_trigger
BEFORE INSERT OR UPDATE ON cars
FOR EACH ROW EXECUTE FUNCTION cars_search_vector_update();

-- Populate existing rows
UPDATE cars SET search_vector = 
  setweight(to_tsvector('english', COALESCE(make, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(model, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(variant, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(description, '')), 'C') ||
  setweight(to_tsvector('english', COALESCE(array_to_string(features, ' '), '')), 'C')
WHERE search_vector IS NULL;
```

### API Gateway Cache Configuration

**Cache Settings:**
- Cache cluster size: 0.5 GB (sufficient for search queries)
- Cache TTL per endpoint (configured in ApiStack):
  - GET /search: 60 seconds
  - GET /search/facets: 300 seconds
  - GET /search/suggestions: 300 seconds
- Cache key: All query string parameters
- Encryption: Enabled

**Cache Invalidation:**
- Automatic: TTL expiration
- Manual: Admin can invalidate via AWS Console if needed
- On reindex: Cache naturally expires, no manual invalidation needed

### Monitoring and Alarms

**CloudWatch Metrics:**
- `SearchLatency`: P50, P95, P99 response times
- `SearchErrorRate`: Percentage of failed searches
- `FallbackRate`: Percentage of searches using PostgreSQL fallback
- `OpenSearchAvailability`: Uptime percentage
- `ReindexDuration`: Time taken for full reindex

**CloudWatch Alarms:**
- SearchErrorRate > 5% for 5 minutes → Alert
- FallbackRate > 50% for 10 minutes → Alert (OpenSearch issues)
- SearchLatency P95 > 1000ms for 5 minutes → Alert
- ReindexDuration > 120 seconds → Warning

**CloudWatch Logs:**
- Log group: `/aws/lambda/primedeals-api`
- Retention: 30 days
- Structured JSON logging for all search operations

### Cost Estimation

**OpenSearch Serverless:**
- Minimum: 2 OCU (1 for indexing, 1 for search)
- Cost: ~$0.24/OCU/hour = ~$350/month minimum
- Scales automatically based on load

**API Gateway:**
- Requests: ~100K searches/month = $0.35
- Cache: 0.5 GB = ~$10/month
- Data transfer: Minimal (< $5/month)

**Lambda:**
- Invocations: ~100K/month = $0.20
- Duration: Minimal (most requests cached)

**Total estimated cost:** ~$365/month for search infrastructure

### Performance Optimization

**OpenSearch:**
- Use multi-match query with field boosting (make^3, model^3)
- Limit facet aggregations to top 50 values
- Use collapse for autocomplete deduplication
- Enable request caching at OpenSearch level

**API Gateway:**
- Cache all GET endpoints
- Use query string parameters as cache keys
- Enable compression for responses

**Lambda:**
- Initialize OpenSearch client outside handler
- Reuse connections across warm invocations
- Lazy-load OpenSearch SDK (only import when needed)
- Use ARM64 for better price/performance

**PostgreSQL:**
- GIN index on tsvector column
- Partial index on status='active'
- Analyze table regularly for query planner optimization

### Security Considerations

**OpenSearch Access:**
- Data access policy restricts access to Lambda execution role only
- Network policy allows public access (required for Serverless)
- Encryption at rest with AWS-managed keys
- Encryption in transit (HTTPS only)

**API Endpoints:**
- Public endpoints: No authentication required (GET /search, /facets, /suggestions)
- Admin endpoints: JWT + admin group membership required (POST /admin/reindex)
- Rate limiting: 100 req/s per IP at API Gateway level

**Input Validation:**
- Sanitize all user input before querying
- Validate enum values against whitelists
- Parameterized queries for PostgreSQL (prevent SQL injection)
- OpenSearch query DSL built programmatically (prevent NoSQL injection)

**Error Handling:**
- Never expose internal errors to clients
- Sanitize error messages
- Log full errors to CloudWatch for debugging
- Include request IDs for traceability

