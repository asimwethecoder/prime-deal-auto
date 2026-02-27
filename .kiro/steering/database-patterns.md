---
inclusion: always
---

# Database Patterns (Aurora PostgreSQL)

## Column Conventions
- All columns: snake_case (`created_at`, `car_id`, `full_name`)
- Primary keys: UUID (`uuid_generate_v4()`)
- Timestamps: `TIMESTAMPTZ` with `DEFAULT NOW()`
- All tables with mutable data have `updated_at` with auto-update trigger

## Query Safety
- Parameterized queries ALWAYS — never string concatenation
- Use `$1, $2, $3` placeholders with pg
```typescript
// GOOD
await pool.query('SELECT * FROM cars WHERE make = $1 AND year >= $2', [make, minYear]);

// BAD — never do this
await pool.query(`SELECT * FROM cars WHERE make = '${make}'`);
```
- Whitelist ORDER BY columns — never interpolate user input into ORDER BY clauses
- Validate enum values against allowed lists before using in queries

## Soft Deletes
- Cars use soft delete: `status = 'deleted'` (not physical DELETE)
- Public queries always filter: `WHERE status = 'active'`
- Admin queries can see all statuses

## Index Strategy
- Index columns used in WHERE clauses, JOINs, and ORDER BY
- Partial indexes for common filters: `WHERE status = 'active'`
- GIN index for full-text search on cars (make + model + description)
- Composite indexes for common query patterns (make + model, price range)
- Review query plans with `EXPLAIN ANALYZE` for slow queries

## JSONB Usage
- `cars.features` — array of feature strings (`'["Sunroof", "Leather Seats"]'`)
- `chat_messages.metadata` — flexible metadata object
- Query with `@>`, `?`, `->` operators when needed

## Connection Management (Lambda-specific)
- Initialize pool OUTSIDE the handler for reuse across warm invocations
- Set `max: 1` on the pool (RDS Proxy handles server-side pooling)
- Enable `keepAlive: true` to prevent idle connection drops
- Fetch credentials from Secrets Manager on cold start, cache in module scope
- SSL required: `ssl: { rejectUnauthorized: true }`
```typescript
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  max: 1,
  ssl: { rejectUnauthorized: true },
  keepAlive: true,
});
```

## Repository Pattern
```typescript
// Each repository handles one table/domain
export class CarRepository {
  async findById(id: string): Promise<Car | null> { ... }
  async findAll(filters: CarFilters): Promise<PaginatedResult<Car>> { ... }
  async create(data: CreateCarInput): Promise<Car> { ... }
  async update(id: string, data: UpdateCarInput): Promise<Car> { ... }
  async softDelete(id: string): Promise<void> { ... }
}
```

## Transaction Pattern
- Use `pool.connect()` + `client.query('BEGIN')` for multi-statement transactions
- Always release client in a `finally` block
- Use transactions for: car creation with images, lead creation with email trigger

## Enum Values (enforced by CHECK constraints)
- `users.role`: user, dealer, admin
- `cars.condition`: excellent, good, fair, poor
- `cars.transmission`: automatic, manual, cvt
- `cars.fuel_type`: petrol, diesel, electric, hybrid
- `cars.status`: active, sold, pending, deleted
- `leads.status`: new, contacted, qualified, converted, closed
- `chat_messages.role`: user, assistant, system
- `analytics_events.event_type`: page_view, car_view, pwa_install

## Migration Files
- Located in `backend/db/migrations/`
- Named: `001_initial.sql`, `002_add_feature.sql`, etc.
- Full schema in `backend/db/schema.sql` (source of truth)
- Run via psql against RDS Proxy endpoint
- Always test migrations against a local PostgreSQL instance first
