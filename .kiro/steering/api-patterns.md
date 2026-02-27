---
inclusion: always
---

# API Endpoint Patterns

## Auth Levels
| Level | Check | Endpoints |
|-------|-------|-----------|
| None | No auth header required | GET /cars, GET /search, POST /leads, POST /chat, POST /analytics/events |
| Cognito | Valid JWT in Authorization header | GET/POST/DELETE /favorites, GET/DELETE /chat/sessions |
| Admin | JWT + cognito:groups contains "admin" | POST/PUT/DELETE /cars, all /admin/*, all /leads (read), image management |

## API Gateway Caching TTLs
| Endpoint | TTL | Cache Key |
|----------|-----|-----------|
| GET /cars | 60s | All query string params |
| GET /cars/:id | 300s | Path param (carId) |
| GET /cars/:id/recommendations | 120s | Path param (carId) |
| GET /search | 60s | All query string params |
| GET /search/facets | 300s | None (global) |
| GET /search/suggestions | 300s | q, field params |
| GET /admin/makes | 600s | None (global) |
| All POST/PUT/DELETE | 0 | No caching |

## Pagination Pattern
- Query params: `limit` (default 20, max 100), `offset` (default 0)
- Response: `{ data: [...], total: number, page: number, limit: number, hasMore: boolean }`
- Page calculated from offset: `Math.floor(offset / limit) + 1`
- Validate limit/offset are non-negative integers

## Sorting Pattern
- Query params: `sortBy` (price, year, mileage, createdAt), `sortOrder` (asc, desc)
- Default: `createdAt desc`
- Whitelist allowed sortBy values — never pass raw user input to ORDER BY

## Filter Pattern (GET /cars)
- `make`, `model` — string match
- `minYear`, `maxYear` — range
- `minPrice`, `maxPrice` — range
- `condition` — enum (excellent, good, fair, poor)
- `transmission` — enum (automatic, manual, cvt)
- `fuelType` — enum (petrol, diesel, electric, hybrid)
- `bodyType` — string match
- Only active cars returned on public endpoints (`WHERE status = 'active'`)
- Validate all enum values against allowed lists before querying

## Handler Template
```typescript
export async function handleGetCars(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const filters = parseCarFilters(event.queryStringParameters);
    const result = await carService.listCars(filters);
    return success(result);
  } catch (error) {
    return handleError(error);
  }
}
```

## Idempotency
- POST /leads: use email + car_id as natural dedup key (return existing lead if duplicate within 24h)
- POST /favorites: upsert pattern (INSERT ON CONFLICT DO NOTHING)
- DELETE operations: return 200 even if resource already deleted (idempotent)
- POST /analytics/events: batch insert, skip duplicates silently

## CORS Headers
Include on all responses:
```typescript
{
  'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS'
}
```

## Rate Limiting
- API Gateway throttling: 100 requests/second per IP (default stage throttle)
- POST /chat: additional per-user rate limit (10 messages/minute) enforced in handler
- POST /analytics/events: batch up to 50 events per request to reduce call volume

## File References
- Full API reference: #[[file:02-API-REFERENCE.md]]
