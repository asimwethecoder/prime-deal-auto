# Implementation Plan: Search & Filtering

## Overview

This implementation plan breaks down the search and filtering feature into discrete coding tasks. The system uses Amazon OpenSearch Serverless for fast full-text search with a PostgreSQL fallback mechanism for reliability. The implementation follows a layered architecture: CDK infrastructure → backend services → API handlers → testing.

## Tasks

- [x] 1. Set up OpenSearch infrastructure with CDK
  - Create SearchStack with OpenSearch Serverless collection
  - Configure encryption, network, and data access policies
  - Export collection endpoint for Lambda configuration
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

- [x] 2. Create OpenSearch client library and schema
  - [x] 2.1 Implement OpenSearch client with AWS Signature V4 auth
    - Create `backend/src/lib/opensearch.ts` with client initialization
    - Configure connection pooling, retry logic, and timeout handling
    - Implement OpenSearchError class for structured error handling
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.6, 8.7_

  - [x] 2.2 Define OpenSearch index schema
    - Create `backend/src/lib/opensearch-schema.ts` with INDEX_SCHEMA constant
    - Define multi-field mappings for make, model, variant (text + keyword)
    - Configure standard analyzer for text fields
    - Define keyword fields for enums and numeric fields for price/year/mileage
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10_

- [x] 3. Implement SearchRepository for OpenSearch queries
  - [x] 3.1 Create SearchRepository class with core methods
    - Implement `search()` method with query DSL builder
    - Implement `getFacets()` method with aggregation queries
    - Implement `getSuggestions()` method with prefix queries
    - Implement `createIndex()` and `deleteIndex()` methods
    - Implement `bulkIndex()` method for batch document indexing
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

  - [x] 3.2 Implement query DSL builder for full-text search
    - Build bool query with must clause for text matching (multi_match)
    - Build filter clauses for all filter criteria (make, model, price range, year range, etc.)
    - Add status='active' filter to all queries
    - Configure field boosting (make^3, model^3, variant^2)
    - _Requirements: 3.1, 3.2, 3.4, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10_

  - [x] 3.3 Implement facet aggregation query builder
    - Build aggregation queries for make, model, variant, body_type, fuel_type, transmission, condition
    - Apply filter context to facet queries
    - Limit facet results to 50 values per category
    - Parse aggregation response into FacetResult format
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9_

  - [x] 3.4 Implement autocomplete suggestion query builder
    - Build prefix query for make, model, or variant fields
    - Use field collapse to deduplicate suggestions
    - Limit results to 10 suggestions
    - Sort by relevance score
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ]* 3.5 Write unit tests for SearchRepository
    - Test query DSL building for various filter combinations
    - Test facet query building and response parsing
    - Test suggestion query building
    - Test error mapping (OpenSearch errors → OpenSearchError)
    - Test bulk index batching logic

- [x] 4. Extend CarRepository with PostgreSQL fallback search
  - [x] 4.1 Implement fullTextSearch method
    - Build parameterized query with tsvector search
    - Apply all filter criteria using WHERE clauses
    - Implement pagination with LIMIT and OFFSET
    - Implement sorting by price, year, mileage, or relevance (ts_rank)
    - Return results in same format as SearchRepository
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7_

  - [x] 4.2 Implement findAllActive method for reindex
    - Query all cars with status='active'
    - Return all required fields for search document transformation
    - _Requirements: 7.2_

  - [ ]* 4.3 Write unit tests for CarRepository fallback
    - Test PostgreSQL full-text search query building
    - Test filter application in WHERE clauses
    - Test pagination with LIMIT/OFFSET
    - Test sort order validation
    - Test findAllActive query

- [x] 5. Implement SearchService business logic layer
  - [x] 5.1 Create SearchService class with search orchestration
    - Implement `search()` method with parameter validation
    - Implement fallback logic (try OpenSearch, catch error, fallback to PostgreSQL)
    - Implement response transformation to API format
    - Calculate hasMore flag and page number
    - Enforce maximum limit of 100
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.6, 9.7_

  - [x] 5.2 Implement getFacets method
    - Validate filter parameters
    - Call SearchRepository.getFacets()
    - Handle OpenSearch errors gracefully (return empty facets on failure)
    - _Requirements: 5.8, 9.2_

  - [x] 5.3 Implement getSuggestions method
    - Validate field parameter (must be make, model, or variant)
    - Validate prefix length (minimum 2 characters)
    - Call SearchRepository.getSuggestions()
    - Handle OpenSearch errors gracefully (return empty array on failure)
    - _Requirements: 6.6, 6.8, 9.2_

  - [x] 5.4 Implement reindex method
    - Fetch all active cars from CarRepository
    - Delete existing OpenSearch index
    - Create new index with current schema
    - Transform car records to search documents
    - Batch documents (100 per batch) and call bulkIndex
    - Log progress and errors
    - Return total indexed count
    - _Requirements: 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9_

  - [x] 5.5 Implement input validation and sanitization
    - Validate enum filter values (fuelType, transmission, condition)
    - Validate numeric ranges (minPrice, maxPrice, minYear, maxYear)
    - Validate sortBy parameter (whitelist: price, year, mileage, relevance)
    - Sanitize query input to prevent injection attacks
    - _Requirements: 4.11, 9.2, 9.5_

  - [ ]* 5.6 Write unit tests for SearchService
    - Test parameter validation (negative limit, invalid sortBy, invalid enum values)
    - Test limit capping at 100
    - Test hasMore calculation
    - Test fallback orchestration (mock OpenSearch failure)
    - Test response transformation

- [x] 6. Checkpoint - Verify core search logic
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement API handlers for search endpoints
  - [x] 7.1 Create handleSearch handler
    - Parse query string parameters into SearchFilters
    - Call SearchService.search()
    - Format success response with CORS headers
    - Handle errors and return appropriate status codes
    - _Requirements: 3.1, 3.2, 3.3, 3.5, 3.6, 3.8_

  - [x] 7.2 Create handleFacets handler
    - Parse query string parameters into SearchFilters
    - Call SearchService.getFacets()
    - Format success response with CORS headers
    - Handle errors and return appropriate status codes
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_

  - [x] 7.3 Create handleSuggestions handler
    - Parse field and q query parameters
    - Validate required parameters (field and q)
    - Call SearchService.getSuggestions()
    - Format success response with CORS headers
    - Handle errors and return appropriate status codes
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.6_

  - [x] 7.4 Create handleReindex handler
    - Extract JWT claims from event.requestContext.authorizer
    - Verify user is authenticated (401 if not)
    - Verify user is in admin group (403 if not)
    - Call SearchService.reindex()
    - Format success response with indexed count
    - Handle errors and return appropriate status codes
    - _Requirements: 7.1, 12.1, 12.2, 12.3, 12.4_

  - [ ]* 7.5 Write unit tests for search handlers
    - Test request parsing (query params → filters)
    - Test authentication checks (admin endpoint)
    - Test authorization checks (admin group membership)
    - Test error response formatting
    - Test CORS headers

- [x] 8. Integrate search handlers into Lambda router
  - [x] 8.1 Add search routes to main Lambda handler
    - Add route: GET /search → handleSearch
    - Add route: GET /search/facets → handleFacets
    - Add route: GET /search/suggestions → handleSuggestions
    - Add route: POST /admin/reindex → handleReindex
    - _Requirements: 3.1, 5.1, 6.1, 7.1_

  - [x] 8.2 Update Lambda handler error handling
    - Implement handleError function for search-specific errors
    - Map ValidationError to 400 with VALIDATION_ERROR code
    - Map OpenSearchError to 503 with SERVICE_UNAVAILABLE code
    - Map authentication errors to 401 with UNAUTHORIZED code
    - Map authorization errors to 403 with FORBIDDEN code
    - Never expose internal errors or stack traces
    - _Requirements: 13.1, 13.2, 13.3, 13.4_

- [x] 9. Create database migration for PostgreSQL fallback
  - [x] 9.1 Write migration script for search_vector column
    - Create migration file `backend/db/migrations/006_search_vector.sql`
    - Add tsvector column to cars table
    - Create GIN index on search_vector column
    - Create trigger function to auto-update search_vector on INSERT/UPDATE
    - Set weights: A for make/model, B for variant, C for description/features
    - Populate search_vector for existing rows
    - _Requirements: 11.2, 11.3_

  - [x] 9.2 Test migration script locally
    - Run migration against local PostgreSQL instance
    - Verify GIN index is created
    - Verify trigger updates search_vector on INSERT
    - Verify trigger updates search_vector on UPDATE
    - Test full-text search query performance

- [x] 10. Deploy SearchStack CDK infrastructure
  - [x] 10.1 Create SearchStack class
    - Create `infrastructure/lib/stacks/search-stack.ts`
    - Define SearchStackProps interface with lambdaExecutionRoleArn
    - Create OpenSearch Serverless collection with type SEARCH
    - Create encryption policy with AWS-managed keys
    - Create network policy (public access for dev)
    - Create data access policy granting Lambda role aoss:* permissions
    - Export collection endpoint as CloudFormation output
    - Tag all resources with Project and Environment tags
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

  - [x] 10.2 Update ApiStack to pass Lambda role ARN to SearchStack
    - Export Lambda execution role ARN from ApiStack
    - Pass role ARN to SearchStack via props
    - Add SearchStack dependency on ApiStack

  - [x] 10.3 Update ApiStack Lambda with OpenSearch configuration
    - Add OPENSEARCH_ENDPOINT environment variable from SearchStack output
    - Add IAM permissions for aoss:* on the collection
    - Add IAM permissions for aoss:* on index pattern
    - Install @opensearch-project/opensearch package in backend

  - [ ]* 10.4 Write CDK tests for SearchStack
    - Test OpenSearch Serverless collection creation
    - Test encryption policy configuration
    - Test network policy configuration
    - Test data access policy with Lambda role
    - Test CloudFormation output for endpoint

- [x] 11. Configure API Gateway caching for search endpoints
  - [x] 11.1 Update ApiStack with cache configuration
    - Enable API Gateway caching with 0.5 GB cache cluster
    - Configure GET /search with 60 second TTL, cache key: all query params
    - Configure GET /search/facets with 300 second TTL, cache key: all query params
    - Configure GET /search/suggestions with 300 second TTL, cache key: q and field params
    - Disable caching for POST /admin/reindex
    - Enable cache encryption
    - _Requirements: 3.10, 5.10, 6.7_

- [x] 12. Checkpoint - Verify infrastructure deployment
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 13. Write property-based tests with fast-check
  - [ ]* 13.1 Property 1: Search Query Field Coverage
    - Generate random search queries and car documents
    - Verify documents containing query text in searchable fields appear in results
    - **Property 1: Search Query Field Coverage**
    - **Validates: Requirements 3.1**

  - [ ]* 13.2 Property 2: Filter Application with AND Logic
    - Generate random filter combinations
    - Verify all results satisfy all provided filter conditions
    - **Property 2: Filter Application with AND Logic**
    - **Validates: Requirements 3.2, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10**

  - [ ]* 13.3 Property 3: Active Status Filter
    - Generate random search queries and filters
    - Verify all results have status='active'
    - **Property 3: Active Status Filter**
    - **Validates: Requirements 3.4**

  - [ ]* 13.4 Property 4: Pagination Bounds
    - Generate random limit and offset values
    - Verify returned results count does not exceed limit
    - Verify offset determines starting position
    - **Property 4: Pagination Bounds**
    - **Validates: Requirements 3.5**

  - [ ]* 13.5 Property 5: Sort Order Correctness
    - Generate random sort parameters (price, year, mileage)
    - Verify results are ordered according to sort direction
    - **Property 5: Sort Order Correctness**
    - **Validates: Requirements 3.6**

  - [ ]* 13.6 Property 6: Response Structure Completeness
    - Generate random search requests
    - Verify response contains data, total, page, limit, hasMore fields with correct types
    - **Property 6: Response Structure Completeness**
    - **Validates: Requirements 3.8**

  - [ ]* 13.7 Property 7: Enum Filter Validation
    - Generate random enum values (valid and invalid)
    - Verify invalid enum values are rejected with VALIDATION_ERROR
    - **Property 7: Enum Filter Validation**
    - **Validates: Requirements 4.11**

  - [ ]* 13.8 Property 8: Facet Structure Completeness
    - Generate random facet requests
    - Verify response contains all required facet fields with value and count
    - **Property 8: Facet Structure Completeness**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7**

  - [ ]* 13.9 Property 9: Facet Count Accuracy
    - Generate random facet requests with filters
    - Verify facet counts reflect filtered result set
    - **Property 9: Facet Count Accuracy**
    - **Validates: Requirements 5.8**

  - [ ]* 13.10 Property 10: Facet Size Limit
    - Generate facet requests
    - Verify each facet category returns at most 50 values
    - **Property 10: Facet Size Limit**
    - **Validates: Requirements 5.9**

  - [ ]* 13.11 Property 11: Suggestion Result Limit
    - Generate random suggestion requests with valid parameters
    - Verify at most 10 suggestions are returned
    - **Property 11: Suggestion Result Limit**
    - **Validates: Requirements 6.1, 6.2, 6.3**

  - [ ]* 13.12 Property 12: Suggestion Ordering
    - Generate random suggestion requests
    - Verify suggestions are ordered by relevance
    - **Property 12: Suggestion Ordering**
    - **Validates: Requirements 6.4**

  - [ ]* 13.13 Property 13: Suggestion Minimum Length
    - Generate random prefix strings (< 2 characters)
    - Verify requests are rejected with VALIDATION_ERROR
    - **Property 13: Suggestion Minimum Length**
    - **Validates: Requirements 6.6**

  - [ ]* 13.14 Property 14: Reindex Active Cars Only
    - Trigger reindex operation
    - Verify only cars with status='active' are indexed
    - **Property 14: Reindex Active Cars Only**
    - **Validates: Requirements 7.2**

  - [ ]* 13.15 Property 15: Reindex Document Transformation
    - Generate random car records
    - Verify transformation preserves all required fields
    - **Property 15: Reindex Document Transformation**
    - **Validates: Requirements 7.3**

  - [ ]* 13.16 Property 16: Reindex Batch Size
    - Trigger reindex with various dataset sizes
    - Verify documents are sent in batches of 100 (or fewer for final batch)
    - **Property 16: Reindex Batch Size**
    - **Validates: Requirements 7.4**

  - [ ]* 13.17 Property 17: Reindex Count Accuracy
    - Trigger reindex operation
    - Verify returned count equals number of active cars indexed
    - **Property 17: Reindex Count Accuracy**
    - **Validates: Requirements 7.6**

  - [ ]* 13.18 Property 18: OpenSearch Error Mapping
    - Simulate OpenSearch errors
    - Verify structured errors with code and message, no internal details exposed
    - **Property 18: OpenSearch Error Mapping**
    - **Validates: Requirements 8.7, 13.4**

  - [ ]* 13.19 Property 19: Search Parameter Validation
    - Generate random invalid parameters (negative limit/offset, invalid sortBy)
    - Verify rejection with VALIDATION_ERROR before querying
    - **Property 19: Search Parameter Validation**
    - **Validates: Requirements 9.2**

  - [ ]* 13.20 Property 20: Repository Result Transformation
    - Generate random repository results
    - Verify transformation to API response format with all required fields
    - **Property 20: Repository Result Transformation**
    - **Validates: Requirements 9.3**

  - [ ]* 13.21 Property 21: Input Sanitization
    - Generate random user input with injection patterns
    - Verify dangerous characters are sanitized before querying
    - **Property 21: Input Sanitization**
    - **Validates: Requirements 9.5**

  - [ ]* 13.22 Property 22: Maximum Limit Enforcement
    - Generate random limit values > 100
    - Verify limit is capped at 100
    - **Property 22: Maximum Limit Enforcement**
    - **Validates: Requirements 9.6**

  - [ ]* 13.23 Property 23: HasMore Calculation
    - Generate random search responses with various totals
    - Verify hasMore is true iff (offset + limit) < total
    - **Property 23: HasMore Calculation**
    - **Validates: Requirements 9.7**

  - [ ]* 13.24 Property 24: Query DSL Filter Inclusion
    - Generate random filter criteria
    - Verify built query DSL includes filter clause for each provided filter
    - **Property 24: Query DSL Filter Inclusion**
    - **Validates: Requirements 10.2**

  - [ ]* 13.25 Property 25: Fallback Search Field Coverage
    - Generate random PostgreSQL fallback searches
    - Verify search matches across make, model, variant, description using tsvector
    - **Property 25: Fallback Search Field Coverage**
    - **Validates: Requirements 11.3**

  - [ ]* 13.26 Property 26: Fallback Filter Application
    - Generate random PostgreSQL fallback searches with filters
    - Verify all filters applied using WHERE clauses
    - **Property 26: Fallback Filter Application**
    - **Validates: Requirements 11.4**

  - [ ]* 13.27 Property 27: Fallback Pagination Support
    - Generate random PostgreSQL fallback searches with pagination
    - Verify pagination works correctly using LIMIT and OFFSET
    - **Property 27: Fallback Pagination Support**
    - **Validates: Requirements 11.5**

  - [ ]* 13.28 Property 28: Fallback Sort Support
    - Generate random PostgreSQL fallback searches with sorting
    - Verify sorting by price, year, mileage produces correctly ordered results
    - **Property 28: Fallback Sort Support**
    - **Validates: Requirements 11.6**

  - [ ]* 13.29 Property 29: Fallback Response Format Consistency
    - Generate random search requests
    - Verify response format is identical for OpenSearch and PostgreSQL results
    - **Property 29: Fallback Response Format Consistency**
    - **Validates: Requirements 11.7**

  - [ ]* 13.30 Property 30: Validation Error Response
    - Generate random requests with invalid filter values
    - Verify 400 status code with VALIDATION_ERROR code
    - **Property 30: Validation Error Response**
    - **Validates: Requirements 13.1**

  - [ ]* 13.31 Property 31: Error Response Sanitization
    - Generate random error conditions
    - Verify responses never contain OpenSearch internal errors or stack traces
    - **Property 31: Error Response Sanitization**
    - **Validates: Requirements 13.4**

  - [ ]* 13.32 Property 32: Error Request ID Inclusion
    - Generate random error responses
    - Verify response includes request ID for traceability
    - **Property 32: Error Request ID Inclusion**
    - **Validates: Requirements 13.5**

- [x] 14. Deploy and verify search system
  - [x] 14.1 Deploy SearchStack to AWS
    - Run `npx cdk deploy PrimeDeals-Search --profile prime-deal-auto`
    - Verify OpenSearch Serverless collection is created
    - Verify collection endpoint is exported
    - Note collection endpoint for ApiStack configuration

  - [x] 14.2 Update and deploy ApiStack with search configuration
    - Update ApiStack with OPENSEARCH_ENDPOINT environment variable
    - Update Lambda IAM role with OpenSearch permissions
    - Run `npx cdk deploy PrimeDeals-Api --profile prime-deal-auto`
    - Verify Lambda has access to OpenSearch collection

  - [x] 14.3 Run database migration
    - Connect to RDS Proxy endpoint via psql
    - Run migration script: `psql -h <rds-proxy-endpoint> -U admin -d primedealauto -f backend/db/migrations/006_search_vector.sql`
    - Verify search_vector column exists
    - Verify GIN index is created
    - Verify trigger is active

  - [x] 14.4 Trigger initial reindex
    - Obtain admin JWT token from Cognito
    - Call POST /admin/reindex with Authorization header
    - Verify response shows indexed count
    - Check CloudWatch logs for reindex progress
    - Verify OpenSearch index is created and populated

  - [x] 14.5 Test search endpoints
    - Test GET /search with various queries and filters
    - Test GET /search/facets with filters
    - Test GET /search/suggestions with different fields
    - Verify response times are under 500ms for search
    - Verify response times are under 200ms for suggestions
    - Verify API Gateway caching is working (check X-Cache headers)

  - [x] 14.6 Test PostgreSQL fallback
    - Temporarily disable OpenSearch access (modify IAM policy)
    - Test GET /search endpoint
    - Verify fallback to PostgreSQL works
    - Verify response format is consistent
    - Check CloudWatch logs for fallback warning
    - Restore OpenSearch access

- [x] 15. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties (32 total)
- Unit tests validate specific examples and edge cases
- OpenSearch Serverless requires minimum 2 OCU (1 for indexing, 1 for search)
- API Gateway caching reduces OpenSearch query load and costs
- PostgreSQL fallback ensures search availability during OpenSearch maintenance
- Batch size of 100 for bulk indexing balances throughput and memory usage
- All search endpoints are public (no auth) except POST /admin/reindex (admin only)
