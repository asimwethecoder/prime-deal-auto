---
inclusion: always
---

# PostgreSQL with node-postgres (pg) — Critical Patterns

## Parameterized Query Syntax (CRITICAL)

PostgreSQL uses `$1`, `$2`, `$3` positional placeholders. In JavaScript template literals, you MUST use `$${paramIndex}` to output the `$` sign followed by the number.

### Common Bug Pattern (WRONG)
```typescript
// BUG: This outputs "WHERE make = 1" instead of "WHERE make = $1"
conditions.push(`make = ${paramIndex}`);  // ❌ WRONG
```

### Correct Pattern
```typescript
// CORRECT: This outputs "WHERE make = $1"
conditions.push(`make = $${paramIndex}`);  // ✅ CORRECT
```

## Dynamic Query Building Pattern

When building queries with dynamic filters, always use this pattern:

```typescript
async function findWithFilters(filters: Filters): Promise<Result[]> {
  const pool = await getPool();
  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  // Always start with a base condition
  conditions.push(`status = 'active'`);

  // Add dynamic filters with proper $N placeholders
  if (filters.make) {
    conditions.push(`make = $${paramIndex}`);
    params.push(filters.make);
    paramIndex++;
  }

  if (filters.minPrice !== undefined) {
    conditions.push(`price >= $${paramIndex}`);
    params.push(filters.minPrice);
    paramIndex++;
  }

  if (filters.maxPrice !== undefined) {
    conditions.push(`price <= $${paramIndex}`);
    params.push(filters.maxPrice);
    paramIndex++;
  }

  // ILIKE for case-insensitive partial matching
  if (filters.model) {
    conditions.push(`model ILIKE $${paramIndex}`);
    params.push(`%${filters.model}%`);
    paramIndex++;
  }

  const whereClause = conditions.join(' AND ');

  // Pagination: add LIMIT and OFFSET as final parameters
  const limitParamIndex = paramIndex;
  const offsetParamIndex = paramIndex + 1;

  const query = `
    SELECT * FROM cars
    WHERE ${whereClause}
    ORDER BY created_at DESC
    LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}
  `;

  params.push(filters.limit, filters.offset);

  const result = await pool.query(query, params);
  return result.rows;
}
```

## Parameter Placeholder Rules

| Pattern | Output | Use Case |
|---------|--------|----------|
| `$${paramIndex}` | `$1`, `$2`, etc. | Parameterized values |
| `${paramIndex}` | `1`, `2`, etc. | ❌ BUG - missing $ |
| `$${paramIndex++}` | `$1` (then increments) | Inline increment |

## Pre/Post Increment with Placeholders

```typescript
// Post-increment: use current value, then increment
updates.push(`make = $${paramIndex++}`);  // Uses $1, paramIndex becomes 2

// Pre-increment: increment first, then use
updates.push(`make = $${++paramIndex}`);  // Increments to 2, uses $2

// Recommended: explicit increment for clarity
conditions.push(`make = $${paramIndex}`);
params.push(filters.make);
paramIndex++;
```

## UPDATE Query Pattern

```typescript
async function update(id: string, data: Partial<CarData>): Promise<Car | null> {
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
  if (data.price !== undefined) {
    updates.push(`price = $${paramIndex++}`);
    params.push(data.price);
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

  return result.rows[0] || null;
}
```

## Common Pitfalls

### 1. Missing $ in Template Literals
```typescript
// ❌ WRONG - generates invalid SQL: "WHERE make = 1"
`WHERE make = ${paramIndex}`

// ✅ CORRECT - generates valid SQL: "WHERE make = $1"
`WHERE make = $${paramIndex}`
```

### 2. Parameter Count Mismatch
```typescript
// ❌ WRONG - 2 placeholders but 3 params
await pool.query('SELECT * FROM cars WHERE make = $1', [make, model, year]);

// ✅ CORRECT - matching placeholders and params
await pool.query('SELECT * FROM cars WHERE make = $1 AND model = $2 AND year = $3', [make, model, year]);
```

### 3. Forgetting to Increment paramIndex
```typescript
// ❌ WRONG - both use $1
conditions.push(`make = $${paramIndex}`);
params.push(filters.make);
conditions.push(`model = $${paramIndex}`);  // Still $1!
params.push(filters.model);

// ✅ CORRECT - increment after each use
conditions.push(`make = $${paramIndex}`);
params.push(filters.make);
paramIndex++;
conditions.push(`model = $${paramIndex}`);
params.push(filters.model);
paramIndex++;
```

### 4. SQL Injection via Identifiers
```typescript
// ❌ WRONG - column name from user input
const sortBy = req.query.sortBy;
`ORDER BY ${sortBy}`;  // SQL injection risk!

// ✅ CORRECT - whitelist allowed columns
const ALLOWED_SORT = ['price', 'year', 'mileage', 'created_at'];
const sortColumn = ALLOWED_SORT.includes(sortBy) ? sortBy : 'created_at';
`ORDER BY ${sortColumn}`;
```

## RDS Proxy + Lambda Connection Pattern

```typescript
import { Pool } from 'pg';

// Initialize OUTSIDE handler for connection reuse
let pool: Pool | null = null;

async function getPool(): Promise<Pool> {
  if (!pool) {
    pool = new Pool({
      host: process.env.DB_HOST,      // RDS Proxy endpoint
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      port: 5432,
      max: 1,                          // Single connection per Lambda
      ssl: { rejectUnauthorized: true },
      keepAlive: true,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
    });
  }
  return pool;
}
```
