# Requirements Document

## Introduction

This spec covers the initial scaffolding of the Prime Deal Auto monorepo — a car dealership web application built on Next.js 15, AWS CDK v2, and a single Lambda backend. The goal is to establish the project structure, configure all three workspaces (frontend, backend, infrastructure), define shared TypeScript types, create the full database schema, and ensure all workspaces build and test cleanly. This is the foundation upon which all subsequent specs build.

## Glossary

- **Monorepo**: A single Git repository containing multiple workspaces (frontend, backend, infrastructure) managed via npm workspaces
- **Workspace**: An npm workspace — a sub-project within the monorepo with its own `package.json` and dependencies
- **Frontend**: The Next.js 15 App Router application in the `frontend/` directory
- **Backend**: The Lambda handler project in the `backend/` directory, containing handlers, services, repositories, and types
- **Infrastructure**: The AWS CDK v2 project in the `infrastructure/` directory, containing stack definitions
- **Root_Package**: The top-level `package.json` that defines npm workspaces and shared scripts
- **Scaffolding_System**: The collection of configuration files, skeleton source files, and build tooling that constitutes the initial project setup
- **Schema_File**: The `backend/db/schema.sql` file containing the full Aurora PostgreSQL database definition
- **Shared_Types**: TypeScript type definitions in `backend/src/types/index.ts` used across backend modules
- **App_Router**: Next.js 15 file-system-based routing using the `app/` directory convention
- **CDK_App**: The AWS CDK v2 application entry point (`infrastructure/bin/app.ts`) that instantiates stacks
- **Vitest**: The unit testing framework used for backend tests

## Requirements

### Requirement 1: Monorepo Initialization

**User Story:** As a developer, I want a monorepo with npm workspaces configured, so that I can manage frontend, backend, and infrastructure as a single project with shared dependency management.

#### Acceptance Criteria

1. THE Root_Package SHALL define npm workspaces for `frontend`, `backend`, and `infrastructure` directories
2. WHEN `npm install` is run from the project root, THE Scaffolding_System SHALL install dependencies for all three workspaces
3. THE Root_Package SHALL specify Node.js 20 as the minimum engine version
4. THE Scaffolding_System SHALL include a `.gitignore` file that excludes `node_modules/`, `.next/`, `cdk.out/`, `dist/`, and environment files (`.env*`)

### Requirement 2: Next.js 15 Frontend Scaffolding

**User Story:** As a frontend developer, I want a Next.js 15 App Router project with Tailwind CSS v4 and TypeScript configured, so that I can begin building pages and components on a working foundation.

#### Acceptance Criteria

1. THE Frontend SHALL use Next.js 15 with the App_Router directory structure
2. THE Frontend SHALL include a root layout file (`app/layout.tsx`) that renders an HTML shell with metadata defaults for the site title "Prime Deal Auto" and locale `en_ZA`
3. THE Frontend SHALL include a home page file (`app/page.tsx`) that renders a placeholder heading
4. THE Frontend SHALL include a `globals.css` file that imports Tailwind CSS v4 directives
5. THE Frontend SHALL include a `tailwind.config.ts` file configured to scan `app/` and `components/` directories for class usage
6. THE Frontend SHALL include a `next.config.ts` file with TypeScript configuration
7. THE Frontend SHALL include a `tsconfig.json` with strict mode enabled and path aliases configured
8. WHEN `npm run dev` is executed in the Frontend workspace, THE Frontend SHALL start a development server and render the home page without errors
9. WHEN `npm run build` is executed in the Frontend workspace, THE Frontend SHALL produce a production build without errors

### Requirement 3: AWS CDK v2 Infrastructure Scaffolding

**User Story:** As an infrastructure developer, I want an AWS CDK v2 project initialized with TypeScript, so that I can define and deploy AWS resources as code.

#### Acceptance Criteria

1. THE Infrastructure SHALL include a CDK_App entry point (`bin/app.ts`) that targets AWS account `141814481613` and region `us-east-1`
2. THE Infrastructure SHALL include a `cdk.json` file with the app command pointing to the TypeScript entry point
3. THE Infrastructure SHALL include a `tsconfig.json` with strict mode enabled
4. THE Infrastructure SHALL include `cdk-nag` as a dependency with `AwsSolutionsChecks` enabled in the CDK_App entry point
5. WHEN `npx cdk synth` is executed in the Infrastructure workspace, THE CDK_App SHALL produce a valid CloudFormation template without errors

### Requirement 4: Backend Lambda Project Scaffolding

**User Story:** As a backend developer, I want a Lambda handler project with TypeScript and a path-based routing stub, so that I can begin implementing API endpoints.

#### Acceptance Criteria

1. THE Backend SHALL include a main handler file (`src/lambda.ts`) that exports an async handler function accepting an `APIGatewayProxyEvent` and returning an `APIGatewayProxyResult`
2. THE Backend SHALL include a stub path-based router in the handler that returns a CORS preflight response for OPTIONS requests
3. THE Backend SHALL include a stub health check route that returns a success response with status code 200
4. THE Backend SHALL include a `tsconfig.json` with strict mode enabled and target set to ES2022
5. THE Backend SHALL include a `package.json` with `node-postgres`, `zod`, and `@aws-sdk/client-bedrock-runtime` as dependencies
6. THE Backend SHALL include placeholder directories for `handlers/`, `services/`, `repositories/`, and `lib/`

### Requirement 5: Backend Testing Setup

**User Story:** As a backend developer, I want Vitest configured with a passing sample test, so that I can write and run unit tests from the start.

#### Acceptance Criteria

1. THE Backend SHALL include a `vitest.config.ts` file configured for the backend workspace
2. THE Backend SHALL include a sample test file in `tests/unit/` that verifies the health check handler returns status code 200
3. WHEN `npx vitest --run` is executed in the Backend workspace, THE Vitest runner SHALL execute all tests and report a passing result

### Requirement 6: Shared TypeScript Types

**User Story:** As a developer, I want shared TypeScript type definitions for all core domain entities, so that backend modules use consistent data shapes.

#### Acceptance Criteria

1. THE Shared_Types SHALL define a `Car` interface with fields: `id` (string), `make` (string), `model` (string), `variant` (optional string), `year` (number), `price` (number), `mileage` (number), `condition` (union of `excellent`, `good`, `fair`, `poor`), `body_type` (optional string), `transmission` (union of `automatic`, `manual`, `cvt`), `fuel_type` (union of `petrol`, `diesel`, `electric`, `hybrid`), `color` (optional string), `description` (optional string), `features` (string array), `status` (union of `active`, `sold`, `pending`, `deleted`), `views_count` (number), `created_at` (string), and `updated_at` (string)
2. THE Shared_Types SHALL define a `User` interface with fields: `id` (string), `cognito_sub` (string), `email` (string), `full_name` (optional string), `phone` (optional string), `role` (union of `user`, `dealer`, `admin`), `created_at` (string), and `updated_at` (string)
3. THE Shared_Types SHALL define a `Lead` interface with fields: `id` (string), `first_name` (optional string), `last_name` (optional string), `email` (string), `phone` (optional string), `country` (optional string), `enquiry` (optional string), `car_id` (optional string), `source` (string), `status` (union of `new`, `contacted`, `qualified`, `converted`, `closed`), `assigned_to` (optional string), `created_at` (string), and `updated_at` (string)
4. THE Shared_Types SHALL define a `ChatMessage` interface with fields: `id` (string), `session_id` (string), `role` (union of `user`, `assistant`, `system`), `content` (string), `metadata` (Record type), `created_at` (string)
5. THE Shared_Types SHALL define a generic `ApiResponse<T>` type with fields: `success` (boolean), `data` (optional T), `error` (optional string), and `code` (optional string)
6. THE Shared_Types SHALL define a `PaginatedResponse<T>` type with fields: `data` (T array), `total` (number), `page` (number), `limit` (number), and `hasMore` (boolean)

### Requirement 7: Database Schema Definition

**User Story:** As a developer, I want the full PostgreSQL database schema defined in a SQL file, so that it can be applied to Aurora when the database stack is deployed.

#### Acceptance Criteria

1. THE Schema_File SHALL enable the `uuid-ossp` extension for UUID generation
2. THE Schema_File SHALL define tables for `users`, `car_makes`, `car_models`, `car_variants`, `cars`, `car_images`, `favorites`, `leads`, `chat_sessions`, `chat_messages`, and `analytics_events` matching the column definitions in the project blueprint
3. THE Schema_File SHALL include CHECK constraints for all enum columns (`users.role`, `cars.condition`, `cars.transmission`, `cars.fuel_type`, `cars.status`, `leads.status`, `chat_messages.role`, `analytics_events.event_type`)
4. THE Schema_File SHALL include foreign key constraints with appropriate ON DELETE actions (`CASCADE` for child records, `SET NULL` for optional references)
5. THE Schema_File SHALL include indexes for columns used in WHERE clauses, JOINs, and ORDER BY operations, including a GIN index for full-text search on the `cars` table
6. THE Schema_File SHALL include an `update_updated_at()` trigger function and apply it to all tables that have an `updated_at` column
7. THE Schema_File SHALL define `TIMESTAMPTZ` columns with `DEFAULT NOW()` for all `created_at` and `updated_at` fields
8. THE Schema_File SHALL use `DECIMAL(12, 2)` for the `cars.price` column to store ZAR currency values

### Requirement 8: Build Integrity Across Workspaces

**User Story:** As a developer, I want all three workspaces to install dependencies and compile without errors, so that the project is in a clean, buildable state from the start.

#### Acceptance Criteria

1. WHEN `npm install` is run from the project root, THE Scaffolding_System SHALL complete without dependency resolution errors
2. WHEN TypeScript compilation is run in the Frontend workspace, THE Frontend SHALL compile without type errors
3. WHEN TypeScript compilation is run in the Backend workspace, THE Backend SHALL compile without type errors
4. WHEN TypeScript compilation is run in the Infrastructure workspace, THE Infrastructure SHALL compile without type errors
5. WHEN `npx cdk synth` is run in the Infrastructure workspace, THE CDK_App SHALL produce valid output without synthesis errors
