---
inclusion: always
---

# Lambda Backend Conventions

## Architecture
Single Lambda handler with path-based routing (Lambda-lith pattern):
```
API Gateway → Lambda Proxy → Path Router → Handler → Service → Repository → Aurora
```

## Handler Pattern
```typescript
// backend/src/lambda.ts — main entry point
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  // CORS preflight first
  // Then path + method matching
  // Delegate to handler functions in backend/src/handlers/
}
```

## Layering
- `handlers/` — Parse request, call service, format response. No business logic.
- `services/` — Business logic, orchestration, validation. No direct DB access.
- `repositories/` — Database queries only. Return typed objects.
- `lib/` — Shared clients (database, opensearch, bedrock, s3)

## Lambda Best Practices (from AWS docs)
- Initialize SDK clients and DB connections OUTSIDE the handler function for reuse across warm invocations
- Use keep-alive directives for persistent connections (`keepAlive: true` in Node.js http agent)
- Write idempotent handlers — duplicate events must produce the same result
- Use environment variables for all configuration (bucket names, endpoints, ARNs) — never hardcode
- Do not use recursive invocations
- Do not rely on execution environment for storing user data or security-sensitive state
- Cache static assets in `/tmp` directory when needed (512 MB available)

```typescript
// CORRECT: Initialize outside handler for connection reuse
import { Pool } from 'pg';
const pool = new Pool({ /* config from env */ });

export async function handler(event: APIGatewayProxyEvent) {
  // pool is reused across warm invocations
  const result = await pool.query('SELECT ...');
}
```

## Database Access
- Use `node-postgres` (pg) with raw SQL — no ORM
- Connection pool: initialize outside handler for reuse across warm invocations
- Max 1 connection per Lambda instance (RDS Proxy handles pooling server-side)
- Credentials from Secrets Manager (cached in Lambda memory after first fetch)
- SSL required for all connections
- Parameterized queries always — never string concatenation
- Enable keep-alive on the pg Pool to prevent idle connection drops

## Input Validation
- Zod schemas for all request body/query param validation
- Validate early in handler, return 400 with VALIDATION_ERROR code on failure

## Response Format
Always return consistent JSON:
```typescript
// Success
return { statusCode: 200, body: JSON.stringify({ success: true, data: result }) };

// Paginated
return { statusCode: 200, body: JSON.stringify({ success: true, data: { data: items, total, page, limit, hasMore } }) };

// Error
return { statusCode: 400, body: JSON.stringify({ success: false, error: "message", code: "VALIDATION_ERROR" }) };
```

## Error Handling
- Wrap all handlers in try/catch
- Use structured JSON logging (not console.log with strings) for CloudWatch
- Never expose internal errors to clients — return generic INTERNAL_ERROR
- Error codes: VALIDATION_ERROR, NOT_FOUND, UNAUTHORIZED, FORBIDDEN, RATE_LIMITED, INTERNAL_ERROR
- Log request ID from context for traceability

## Auth Checking
- Public routes: no auth check
- Authenticated routes: extract user from `event.requestContext.authorizer.claims`
- Admin routes: verify `cognito:groups` includes "admin"

## Cold Start Optimization
- Use ARM64 (Graviton2) for better price/performance
- Bundle with esbuild (tree-shaking, minification) via CDK NodejsFunction
- Lazy-import heavy SDKs (Bedrock, OpenSearch) only in handlers that need them
- Keep deployment package small — exclude dev dependencies

## Testing
- Vitest for unit tests
- Mock database pool for handler/service tests
- Test files in `backend/tests/unit/`

## File References
- API reference: #[[file:02-API-REFERENCE.md]]
- Project structure: #[[file:01-PROJECT-STRUCTURE.md]]
