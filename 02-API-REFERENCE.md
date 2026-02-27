# Prime Deal Auto — API Reference (REST Endpoints)

## API Gateway Configuration

- Type: Regional REST API
- Auth: Cognito User Pool Authorizer (protected routes), None (public routes)
- Caching: API Gateway stage-level caching with per-method TTL overrides
- CORS: Enabled for frontend domain
- Lambda Integration: Proxy integration with single Lambda handler

## Lambda Handler Architecture

Single Lambda function with path-based routing (proven pattern from Adapt Cars reference).
All routes are handled by one Lambda to minimize cold starts and simplify deployment.

```
API Gateway → Lambda Proxy → Path Router → Handler Function → Service → Repository → Aurora
```

## Endpoint Reference

### Cars (Public Read, Admin Write)

| Method | Path | Auth | Cache | Description |
|--------|------|------|-------|-------------|
| `GET` | `/cars` | None | 60s | List active cars with filters |
| `GET` | `/cars/:id` | None | 300s | Get car by ID with images |
| `POST` | `/cars` | Admin | — | Create new car |
| `PUT` | `/cars/:id` | Admin | — | Update car |
| `DELETE` | `/cars/:id` | Admin | — | Soft-delete car (status → deleted) |
| `GET` | `/cars/:id/recommendations` | None | 120s | Get 6 similar cars |

#### GET /cars — Query Parameters

| Param | Type | Description |
|-------|------|-------------|
| `make` | string | Filter by manufacturer |
| `model` | string | Filter by model |
| `minYear` / `maxYear` | number | Year range |
| `minPrice` / `maxPrice` | number | Price range |
| `condition` | enum | excellent, good, fair, poor |
| `transmission` | enum | automatic, manual, cvt |
| `fuelType` | enum | petrol, diesel, electric, hybrid |
| `bodyType` | string | sedan, suv, truck, etc. |
| `sortBy` | enum | price, year, mileage, createdAt |
| `sortOrder` | enum | asc, desc |
| `limit` | number | Results per page (default 20) |
| `offset` | number | Pagination offset |

### Images (Admin Only)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/cars/:id/images/upload-url` | Admin | Get presigned S3 upload URL (15min expiry) |
| `POST` | `/cars/:id/images` | Admin | Create image record after upload |
| `GET` | `/cars/:id/images` | Admin | List images for a car |
| `PATCH` | `/cars/:id/images` | Admin | Update image order/primary flags |
| `DELETE` | `/cars/:id/images/:imageId` | Admin | Delete image record + S3 object |

### Search (Public)

| Method | Path | Auth | Cache | Description |
|--------|------|------|-------|-------------|
| `GET` | `/search?q=` | None | 60s | Full-text search via OpenSearch (PG fallback) |
| `GET` | `/search/suggestions?q=&field=` | None | 300s | Autocomplete (up to 10 results) |
| `GET` | `/search/facets` | None | 300s | Filter options with counts |

### Leads (Public Create, Admin Manage)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/leads` | None | Create enquiry (triggers email notifications) |
| `GET` | `/leads` | Admin | List leads with status/pagination filters |
| `PUT` | `/leads/:id/status` | Admin | Update lead status |

### Chat (Public Send, Auth Sessions)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/chat` | None | Send message to AI assistant |
| `GET` | `/chat/sessions` | Cognito | List user's chat sessions |
| `GET` | `/chat/sessions/:id` | Cognito | Get session message history |
| `DELETE` | `/chat/sessions/:id` | Cognito | Delete chat session |

### Favorites (Auth Required)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/favorites` | Cognito | Get user's favorited cars |
| `POST` | `/favorites/:carId` | Cognito | Add car to favorites |
| `DELETE` | `/favorites/:carId` | Cognito | Remove car from favorites |

### Admin

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/admin/stats` | Admin | Dashboard statistics |
| `GET` | `/admin/cars` | Admin | All cars (any status, with filters) |
| `GET` | `/admin/makes` | None | List all makes with models/variants |
| `POST` | `/admin/makes` | Admin | Create make |
| `GET` | `/admin/makes/:makeId/models` | Admin | List models for make |
| `POST` | `/admin/makes/:makeId/models` | Admin | Create model |
| `GET` | `/admin/models/:modelId/variants` | Admin | List variants for model |
| `POST` | `/admin/models/:modelId/variants` | Admin | Create variant |
| `POST` | `/admin/reindex` | Admin | Bulk reindex all cars to OpenSearch |

### Analytics

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/analytics/events` | None | Batch ingest analytics events |
| `GET` | `/admin/analytics/overview` | Admin | Analytics overview |
| `GET` | `/admin/analytics/active-users` | Admin | Active users (hourly/daily) |
| `GET` | `/admin/analytics/popular-pages` | Admin | Popular pages |
| `GET` | `/admin/analytics/popular-cars` | Admin | Popular cars |
| `GET` | `/admin/analytics/geography` | Admin | Geography breakdown |

## API Gateway Caching Strategy

Caching is configured at the API Gateway stage level. Per-method TTL overrides:

| Endpoint Pattern | Cache TTL | Cache Key Parameters |
|-----------------|-----------|---------------------|
| `GET /cars` | 60s | All query string params |
| `GET /cars/:id` | 300s | Path param (carId) |
| `GET /cars/:id/recommendations` | 120s | Path param (carId) |
| `GET /search` | 60s | All query string params |
| `GET /search/facets` | 300s | None |
| `GET /search/suggestions` | 300s | q, field params |
| `GET /admin/makes` | 600s | None |
| All POST/PUT/DELETE | 0 | No caching |

## Response Format

All endpoints return consistent JSON:

```json
// Success
{ "success": true, "data": { ... } }

// Paginated
{ "success": true, "data": { "data": [...], "total": 150, "page": 1, "limit": 20, "hasMore": true } }

// Error
{ "success": false, "error": "Human-readable message", "code": "VALIDATION_ERROR" }
```

Error codes: `VALIDATION_ERROR`, `NOT_FOUND`, `UNAUTHORIZED`, `FORBIDDEN`, `RATE_LIMITED`, `INTERNAL_ERROR`

## Authentication Flow

1. Frontend authenticates via Amplify JS v6 → Cognito
2. Cognito returns JWT tokens (ID token + access token)
3. Frontend sends `Authorization: Bearer <idToken>` header
4. API Gateway Cognito Authorizer validates the token
5. Lambda receives user claims in `event.requestContext.authorizer.claims`
6. Admin check: verify `cognito:groups` contains "admin"
