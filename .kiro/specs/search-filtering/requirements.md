# Requirements Document: Search & Filtering

## Introduction

This document defines the requirements for implementing full-text search and filtering capabilities for the Prime Deal Auto car dealership platform. The system will use Amazon OpenSearch Serverless to provide fast, relevant search results with faceted filtering, autocomplete suggestions, and fallback mechanisms to ensure reliability.

## Glossary

- **Search_System**: The complete search infrastructure including OpenSearch Serverless, Lambda handlers, and API endpoints
- **OpenSearch_Collection**: Amazon OpenSearch Serverless collection storing indexed car documents
- **Search_Index**: The OpenSearch index containing searchable car data (make, model, description, features, specifications)
- **Facet**: A filter category with counts showing available options (e.g., "Toyota (45), BMW (23)")
- **Reindex_Operation**: The process of bulk loading all active cars from Aurora PostgreSQL into OpenSearch
- **Search_Query**: User-provided text input for finding cars
- **Filter_Criteria**: Structured constraints applied to search results (price range, year, make, etc.)
- **Autocomplete_Suggestion**: Partial match results returned as the user types
- **Fallback_Search**: PostgreSQL full-text search used when OpenSearch is unavailable
- **Active_Car**: A car with status='active' in the database, eligible for search indexing
- **Search_Document**: JSON representation of a car stored in OpenSearch
- **OCU**: OpenSearch Compute Units, the billing metric for OpenSearch Serverless

## Requirements

### Requirement 1: OpenSearch Infrastructure Provisioning

**User Story:** As a platform operator, I want OpenSearch Serverless infrastructure provisioned via CDK, so that the search system is deployed consistently and securely.

#### Acceptance Criteria

1. THE SearchStack SHALL create an OpenSearch Serverless collection with type SEARCH
2. THE SearchStack SHALL configure the collection with minimum 2 OCU for cost optimization
3. THE SearchStack SHALL create encryption policies using AWS-managed keys
4. THE SearchStack SHALL create network policies allowing public access for development
5. THE SearchStack SHALL create data access policies granting the Lambda execution role read and write permissions
6. THE SearchStack SHALL export the collection endpoint as a CloudFormation output
7. THE SearchStack SHALL tag all resources with Project: PrimeDealAuto and Environment tags

### Requirement 2: Search Index Schema Definition

**User Story:** As a developer, I want a well-defined OpenSearch index schema, so that car data is indexed optimally for search and filtering.

#### Acceptance Criteria

1. THE Search_Index SHALL include a text field for make with keyword subfield for exact matching
2. THE Search_Index SHALL include a text field for model with keyword subfield for exact matching
3. THE Search_Index SHALL include a text field for variant with keyword subfield for exact matching
4. THE Search_Index SHALL include a text field for description with full-text analysis
5. THE Search_Index SHALL include a text array field for features with full-text analysis
6. THE Search_Index SHALL include keyword fields for body_type, fuel_type, transmission, condition, and status
7. THE Search_Index SHALL include numeric fields for price, year, and mileage
8. THE Search_Index SHALL include a date field for created_at
9. THE Search_Index SHALL include keyword fields for id, color, and primary_image_url
10. THE Search_Index SHALL use standard analyzer for text fields to handle typos and partial matches

### Requirement 3: Full-Text Search Endpoint

**User Story:** As a user, I want to search for cars using natural language queries, so that I can find vehicles matching my needs.

#### Acceptance Criteria

1. WHEN a search query is provided, THE Search_System SHALL search across make, model, variant, description, and features fields
2. WHEN filter criteria are provided, THE Search_System SHALL apply all filters to the search results
3. WHEN no query is provided, THE Search_System SHALL return filtered results without text matching
4. THE Search_System SHALL return only cars with status='active'
5. THE Search_System SHALL support pagination with limit (default 20, max 100) and offset parameters
6. THE Search_System SHALL support sorting by price, year, mileage, and relevance (default: relevance)
7. THE Search_System SHALL return results in under 500ms for typical queries
8. THE Search_System SHALL return paginated response format with data, total, page, limit, and hasMore fields
9. IF OpenSearch is unavailable, THEN THE Search_System SHALL fall back to PostgreSQL full-text search
10. THE Search_System SHALL cache search results at API Gateway level for 60 seconds

### Requirement 4: Filter Support

**User Story:** As a user, I want to filter search results by multiple criteria, so that I can narrow down cars to my specific requirements.

#### Acceptance Criteria

1. THE Search_System SHALL support filtering by make (exact match)
2. THE Search_System SHALL support filtering by model (exact match)
3. THE Search_System SHALL support filtering by variant (exact match)
4. THE Search_System SHALL support filtering by price range (minPrice and maxPrice)
5. THE Search_System SHALL support filtering by year range (minYear and maxYear)
6. THE Search_System SHALL support filtering by body_type (exact match)
7. THE Search_System SHALL support filtering by fuel_type (exact match, enum: petrol, diesel, electric, hybrid)
8. THE Search_System SHALL support filtering by transmission (exact match, enum: automatic, manual, cvt)
9. THE Search_System SHALL support filtering by condition (exact match, enum: excellent, good, fair, poor)
10. WHEN multiple filters are applied, THE Search_System SHALL combine them with AND logic
11. THE Search_System SHALL validate all enum filter values against allowed lists before querying

### Requirement 5: Faceted Search

**User Story:** As a user, I want to see available filter options with counts, so that I can understand what cars are available in each category.

#### Acceptance Criteria

1. THE Search_System SHALL return facets for make with document counts
2. THE Search_System SHALL return facets for model with document counts
3. THE Search_System SHALL return facets for variant with document counts
4. THE Search_System SHALL return facets for body_type with document counts
5. THE Search_System SHALL return facets for fuel_type with document counts
6. THE Search_System SHALL return facets for transmission with document counts
7. THE Search_System SHALL return facets for condition with document counts
8. WHEN filters are applied, THE Search_System SHALL return facet counts reflecting the filtered result set
9. THE Search_System SHALL limit facet results to top 50 values per category
10. THE Search_System SHALL cache facet results at API Gateway level for 300 seconds

### Requirement 6: Autocomplete Suggestions

**User Story:** As a user, I want autocomplete suggestions as I type, so that I can quickly find cars without typing complete words.

#### Acceptance Criteria

1. WHEN a partial query is provided with field=make, THE Search_System SHALL return up to 10 matching make suggestions
2. WHEN a partial query is provided with field=model, THE Search_System SHALL return up to 10 matching model suggestions
3. WHEN a partial query is provided with field=variant, THE Search_System SHALL return up to 10 matching variant suggestions
4. THE Search_System SHALL return suggestions ordered by relevance and frequency
5. THE Search_System SHALL return suggestions in under 200ms
6. THE Search_System SHALL handle queries with minimum 2 characters
7. THE Search_System SHALL cache suggestions at API Gateway level for 300 seconds
8. IF the field parameter is missing or invalid, THEN THE Search_System SHALL return a validation error

### Requirement 7: Bulk Reindex Operation

**User Story:** As an administrator, I want to reindex all cars from the database into OpenSearch, so that the search index stays synchronized with the source data.

#### Acceptance Criteria

1. THE Reindex_Operation SHALL be accessible only to users in the admin Cognito group
2. THE Reindex_Operation SHALL fetch all active cars from Aurora PostgreSQL
3. THE Reindex_Operation SHALL transform each car record into a Search_Document
4. THE Reindex_Operation SHALL bulk index documents to OpenSearch in batches of 100
5. THE Reindex_Operation SHALL handle datasets of 1000+ cars efficiently
6. THE Reindex_Operation SHALL return the total number of cars indexed
7. IF a document fails to index, THEN THE Reindex_Operation SHALL log the error and continue with remaining documents
8. THE Reindex_Operation SHALL complete within 60 seconds for up to 5000 cars
9. WHEN reindexing starts, THE Reindex_Operation SHALL delete the existing index and recreate it with the current schema

### Requirement 8: Search Client Library

**User Story:** As a developer, I want a reusable OpenSearch client library, so that all search operations use consistent connection handling and error management.

#### Acceptance Criteria

1. THE Search_System SHALL initialize the OpenSearch client outside the Lambda handler for connection reuse
2. THE Search_System SHALL configure the client with AWS Signature V4 authentication
3. THE Search_System SHALL read the OpenSearch endpoint from environment variables
4. THE Search_System SHALL implement connection retry logic with exponential backoff
5. THE Search_System SHALL log all OpenSearch requests and responses for debugging
6. THE Search_System SHALL handle connection timeouts gracefully
7. IF OpenSearch returns an error, THEN THE Search_System SHALL throw a structured error with error code and message

### Requirement 9: Search Service Layer

**User Story:** As a developer, I want business logic separated from data access, so that search operations are testable and maintainable.

#### Acceptance Criteria

1. THE Search_System SHALL implement a SearchService class handling search business logic
2. THE SearchService SHALL validate all search parameters before calling the repository
3. THE SearchService SHALL transform repository results into API response format
4. THE SearchService SHALL implement fallback logic to PostgreSQL when OpenSearch fails
5. THE SearchService SHALL sanitize user input to prevent injection attacks
6. THE SearchService SHALL enforce maximum limit of 100 results per page
7. THE SearchService SHALL calculate hasMore flag based on total results and current offset

### Requirement 10: Search Repository Layer

**User Story:** As a developer, I want OpenSearch queries isolated in a repository layer, so that query logic is reusable and testable.

#### Acceptance Criteria

1. THE Search_System SHALL implement a SearchRepository class handling OpenSearch queries
2. THE SearchRepository SHALL build OpenSearch query DSL from filter criteria
3. THE SearchRepository SHALL execute search queries with proper error handling
4. THE SearchRepository SHALL execute aggregation queries for facets
5. THE SearchRepository SHALL execute prefix queries for autocomplete suggestions
6. THE SearchRepository SHALL return typed result objects
7. THE SearchRepository SHALL handle OpenSearch-specific errors and map them to application errors

### Requirement 11: PostgreSQL Fallback Search

**User Story:** As a user, I want search to remain functional even when OpenSearch is unavailable, so that I can always find cars on the platform.

#### Acceptance Criteria

1. WHEN OpenSearch is unavailable, THE Search_System SHALL execute full-text search using PostgreSQL
2. THE Fallback_Search SHALL use PostgreSQL GIN index on tsvector column for performance
3. THE Fallback_Search SHALL search across make, model, variant, and description fields
4. THE Fallback_Search SHALL apply all filter criteria using WHERE clauses
5. THE Fallback_Search SHALL support pagination with LIMIT and OFFSET
6. THE Fallback_Search SHALL support sorting by price, year, and mileage (relevance not available)
7. THE Fallback_Search SHALL return results in the same format as OpenSearch results
8. THE Fallback_Search SHALL log a warning when fallback is triggered

### Requirement 12: Search API Authentication and Authorization

**User Story:** As a platform operator, I want search endpoints to have appropriate access controls, so that sensitive operations are protected.

#### Acceptance Criteria

1. THE Search_System SHALL allow unauthenticated access to GET /search
2. THE Search_System SHALL allow unauthenticated access to GET /search/suggestions
3. THE Search_System SHALL allow unauthenticated access to GET /search/facets
4. THE Search_System SHALL require authentication and admin group membership for POST /admin/reindex
5. IF an unauthenticated user attempts to access POST /admin/reindex, THEN THE Search_System SHALL return 401 Unauthorized
6. IF an authenticated non-admin user attempts to access POST /admin/reindex, THEN THE Search_System SHALL return 403 Forbidden

### Requirement 13: Search Error Handling

**User Story:** As a user, I want clear error messages when search fails, so that I understand what went wrong and can take corrective action.

#### Acceptance Criteria

1. WHEN invalid filter values are provided, THE Search_System SHALL return 400 with VALIDATION_ERROR code
2. WHEN OpenSearch is unavailable and fallback fails, THE Search_System SHALL return 503 with SERVICE_UNAVAILABLE code
3. WHEN an internal error occurs, THE Search_System SHALL return 500 with INTERNAL_ERROR code and log the full error
4. THE Search_System SHALL never expose OpenSearch internal errors or stack traces to clients
5. THE Search_System SHALL include request ID in error responses for traceability
6. THE Search_System SHALL log all errors to CloudWatch with structured JSON format

### Requirement 14: Search Performance Monitoring

**User Story:** As a platform operator, I want search performance metrics, so that I can identify and resolve performance issues.

#### Acceptance Criteria

1. THE Search_System SHALL log search query execution time for each request
2. THE Search_System SHALL log OpenSearch response time separately from total request time
3. THE Search_System SHALL log cache hit/miss status for cached endpoints
4. THE Search_System SHALL log fallback usage when PostgreSQL search is triggered
5. THE Search_System SHALL emit CloudWatch custom metrics for search latency
6. THE Search_System SHALL emit CloudWatch custom metrics for search error rate
7. THE Search_System SHALL emit CloudWatch custom metrics for fallback usage rate

### Requirement 15: Search Index Maintenance

**User Story:** As a developer, I want the search index to stay synchronized with the database, so that search results are always accurate and up-to-date.

#### Acceptance Criteria

1. WHEN a car is created in Aurora, THE Search_System SHALL add the car to the Search_Index
2. WHEN a car is updated in Aurora, THE Search_System SHALL update the corresponding document in the Search_Index
3. WHEN a car status changes to deleted or sold, THE Search_System SHALL remove the car from the Search_Index
4. WHEN a car status changes back to active, THE Search_System SHALL add the car to the Search_Index
5. IF index synchronization fails, THEN THE Search_System SHALL log the error and continue processing
6. THE Search_System SHALL implement idempotent index operations to handle duplicate events safely

## Notes

- Real-time synchronization (Requirement 15, criteria 1-6) can be implemented in a future spec using Lambda triggers or event-driven patterns. For this spec, manual reindex via admin endpoint is sufficient.
- OpenSearch Serverless has a minimum cost of 2 OCU (~$700/month). For development, consider using a single collection shared across environments or deferring OpenSearch until production.
- The PostgreSQL fallback ensures search remains functional during OpenSearch maintenance or outages.
- API Gateway caching significantly reduces OpenSearch query load and improves response times for repeated queries.
