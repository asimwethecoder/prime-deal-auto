# Implementation Plan: Project Scaffolding

## Overview

Scaffold the Prime Deal Auto monorepo with three npm workspaces (frontend, backend, infrastructure), shared TypeScript types, full PostgreSQL schema, Lambda handler stub with tests, and CDK entry point with cdk-nag. Each task builds incrementally — root config first, then workspaces, then cross-workspace validation.

## Tasks

- [x] 1. Initialize root monorepo configuration
  - [x] 1.1 Create root `package.json` with npm workspaces
    - Define workspaces array: `["frontend", "backend", "infrastructure"]`
    - Set `"private": true`, `"engines": { "node": ">=20.0.0" }`
    - Add convenience scripts: `build:frontend`, `build:backend`, `build:infra`, `test:backend`, `lint`
    - _Requirements: 1.1, 1.2, 1.3_
  - [x] 1.2 Create `.gitignore` file
    - Exclude `node_modules/`, `.next/`, `cdk.out/`, `dist/`, `.env*`
    - _Requirements: 1.4_

- [x] 2. Scaffold frontend workspace (Next.js 15 + Tailwind CSS v4)
  - [x] 2.1 Create frontend `package.json` and config files
    - Add dependencies: `next` (v15), `react` (v19), `react-dom` (v19), `tailwindcss` (v4), `@tailwindcss/postcss`
    - Add devDependencies: `typescript`, `@types/react`, `@types/react-dom`, `@types/node`
    - Create `next.config.ts` with minimal `NextConfig` export
    - Create `tsconfig.json` with strict mode and path aliases (`@/*` → `./`)
    - Create `tailwind.config.ts` with content paths for `app/` and `components/`
    - Create `postcss.config.mjs` with `@tailwindcss/postcss` plugin
    - _Requirements: 2.1, 2.5, 2.6, 2.7_
  - [x] 2.2 Create App Router skeleton files
    - Create `app/globals.css` with Tailwind CSS v4 `@import "tailwindcss"` directive
    - Create `app/layout.tsx` with metadata defaults (`title.default: "Prime Deal Auto"`, `title.template`, `description`, locale `en_ZA`), `<html lang="en">` shell, globals.css import
    - Create `app/page.tsx` as a Server Component with a placeholder `<h1>` heading
    - Create empty `components/` directory with `.gitkeep`
    - _Requirements: 2.2, 2.3, 2.4, 2.8, 2.9_

- [x] 3. Scaffold backend workspace (Lambda + Vitest)
  - [x] 3.1 Create backend `package.json` and config files
    - Add dependencies: `pg`, `zod`, `@aws-sdk/client-bedrock-runtime`
    - Add devDependencies: `typescript`, `vitest`, `fast-check`, `@types/node`, `@types/aws-lambda`, `@types/pg`
    - Create `tsconfig.json` with strict mode, target ES2022, `noEmit: true`
    - Create `vitest.config.ts` configured for `tests/` directory
    - _Requirements: 4.4, 4.5, 5.1_
  - [x] 3.2 Create Lambda handler stub with path-based routing
    - Create `src/lambda.ts` exporting async `handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult>`
    - Implement CORS preflight response for all OPTIONS requests (200 with CORS headers)
    - Implement GET `/health` route returning `{ success: true, data: { status: "ok" } }` with status 200
    - Implement 404 fallback for unmatched routes: `{ success: false, error: "Not found", code: "NOT_FOUND" }`
    - Wrap handler in top-level try/catch returning 500 with `INTERNAL_ERROR` code
    - Include CORS headers on all responses (`Access-Control-Allow-Origin: *`, etc.)
    - _Requirements: 4.1, 4.2, 4.3_
  - [x] 3.3 Create placeholder directories for backend layering
    - Create `src/handlers/.gitkeep`, `src/services/.gitkeep`, `src/repositories/.gitkeep`, `src/lib/.gitkeep`
    - Create `db/migrations/.gitkeep`
    - _Requirements: 4.6_

- [x] 4. Define shared TypeScript types
  - [x] 4.1 Create `backend/src/types/index.ts` with all domain entity types
    - Define `Car` interface with all required and optional fields (id, make, model, variant?, year, price, mileage, condition, body_type?, transmission, fuel_type, color?, description?, features, status, views_count, created_at, updated_at)
    - Define `User` interface (id, cognito_sub, email, full_name?, phone?, role, created_at, updated_at)
    - Define `Lead` interface (id, first_name?, last_name?, email, phone?, country?, enquiry?, car_id?, source, status, assigned_to?, created_at, updated_at)
    - Define `ChatMessage` interface (id, session_id, role, content, metadata as Record<string, unknown>, created_at)
    - Define `CarImage` interface (id, car_id, s3_key, cloudfront_url?, thumbnail_url?, is_primary, order_index, created_at)
    - Define `ApiResponse<T>` type with success, data?, error?, code?
    - Define `PaginatedResponse<T>` type with data T[], total, page, limit, hasMore
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [x] 5. Write backend unit tests and property tests for Lambda handler
  - [x] 5.1 Create `backend/tests/unit/lambda.test.ts` with handler tests
    - Unit test: health check GET `/health` returns status 200 with `{ success: true, data: { status: "ok" } }`
    - Unit test: unmatched route returns status 404 with `NOT_FOUND` code
    - _Requirements: 5.2, 5.3_
  - [ ]* 5.2 Write property test for CORS preflight (Property 1)
    - **Property 1: CORS preflight for any request path**
    - Use fast-check to generate arbitrary URL paths; verify OPTIONS requests always return 200 with all three CORS headers
    - **Validates: Requirements 4.2**
  - [ ]* 5.3 Write type tests for domain entities (Property 2, Property 3)
    - **Property 2: Domain entity type completeness**
    - **Property 3: Generic response type wrapping**
    - Create `backend/tests/unit/types.test.ts`
    - Use `expectTypeOf` from vitest to verify Car, User, Lead, ChatMessage interfaces have all required fields with correct types
    - Verify `ApiResponse<T>` and `PaginatedResponse<T>` produce correct shapes for arbitrary T
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6**

- [x] 6. Checkpoint - Ensure backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Create full PostgreSQL database schema
  - [x] 7.1 Create `backend/db/schema.sql` with all 11 tables
    - Enable `uuid-ossp` extension
    - Define tables: `users`, `car_makes`, `car_models`, `car_variants`, `cars`, `car_images`, `favorites`, `leads`, `chat_sessions`, `chat_messages`, `analytics_events`
    - Use UUID primary keys via `uuid_generate_v4()`
    - Use `DECIMAL(12, 2)` for `cars.price`
    - Use `TIMESTAMPTZ DEFAULT NOW()` for all `created_at` and `updated_at` columns
    - Add CHECK constraints for all enum columns (users.role, cars.condition, cars.transmission, cars.fuel_type, cars.status, leads.status, chat_messages.role, analytics_events.event_type)
    - Add foreign key constraints with CASCADE for child records, SET NULL for optional references
    - Add indexes for WHERE/JOIN/ORDER BY columns, including GIN index for full-text search on cars
    - Create `update_updated_at()` trigger function and apply BEFORE UPDATE triggers to all tables with `updated_at`
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8_
  - [ ]* 7.2 Write schema validation tests (Property 4, Property 5)
    - **Property 4: Schema enum constraint coverage**
    - **Property 5: Schema timestamp trigger coverage**
    - Create `backend/tests/unit/schema.test.ts`
    - Parse schema SQL and verify every enum column has a CHECK constraint with correct values
    - Parse schema SQL and verify every table with `updated_at` has a BEFORE UPDATE trigger
    - Verify all `created_at`/`updated_at` columns use `TIMESTAMPTZ` with `DEFAULT NOW()`
    - **Validates: Requirements 7.3, 7.6, 7.7**

- [x] 8. Scaffold infrastructure workspace (CDK v2 + cdk-nag)
  - [x] 8.1 Create infrastructure `package.json` and config files
    - Add dependencies: `aws-cdk-lib`, `constructs`, `cdk-nag`
    - Add devDependencies: `typescript`, `ts-node`, `@types/node`
    - Create `tsconfig.json` with strict mode
    - Create `cdk.json` with app command `npx ts-node --prefer-ts-exts bin/app.ts`
    - _Requirements: 3.2, 3.3, 3.4_
  - [x] 8.2 Create CDK app entry point (`bin/app.ts`)
    - Hardcode env: `{ account: '141814481613', region: 'us-east-1' }`
    - Enable cdk-nag `AwsSolutionsChecks` with `verbose: true`
    - Add placeholder comments for future stacks (Auth, Database, Storage, Api)
    - _Requirements: 3.1, 3.4, 3.5_

- [x] 9. Install dependencies and validate build integrity
  - [x] 9.1 Run `npm install` from project root
    - Verify all three workspaces resolve dependencies without errors
    - _Requirements: 1.2, 8.1_
  - [x] 9.2 Verify TypeScript compilation across all workspaces
    - Run type checking in frontend, backend, and infrastructure workspaces
    - Fix any type errors that surface
    - _Requirements: 8.2, 8.3, 8.4_
  - [x] 9.3 Verify CDK synthesis
    - Run `npx cdk synth` in infrastructure workspace
    - Confirm valid CloudFormation output with no cdk-nag errors
    - _Requirements: 3.5, 8.5_

- [x] 10. Final checkpoint - Ensure all tests pass and workspaces build cleanly
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests use `fast-check` integrated with Vitest
- The backend uses `noEmit: true` — actual Lambda bundling happens via CDK `NodejsFunction` in later specs
- Placeholder directories use `.gitkeep` files for Git tracking
- No stacks are instantiated in the CDK app — individual stacks come in subsequent specs (Auth, Database, Storage, Api)
