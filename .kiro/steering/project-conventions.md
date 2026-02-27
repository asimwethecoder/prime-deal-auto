---
inclusion: always
---

# Prime Deal Auto — Project Conventions

## Tech Stack
- Frontend: Next.js 15 (App Router), React 19, Tailwind CSS v4, TanStack Query v5, Zustand, TypeScript
- Backend: Single Lambda handler (Node.js 20, ARM64), node-postgres, raw SQL
- Infrastructure: AWS CDK v2 (TypeScript)
- Auth: Amazon Cognito (Amplify JS v6 on frontend)
- Storage: S3 + CloudFront (OAC)
- Database: Aurora PostgreSQL Serverless v2 (via RDS Proxy)
- Search: OpenSearch Serverless (Phase 2, PG full-text initially)
- AI: Amazon Bedrock (Claude Sonnet 4, Converse API)
- Hosting: AWS Amplify
- Testing: Vitest (unit/API), Testing Library (components), Playwright (E2E)
- Security: cdk-nag for infrastructure compliance checks

## Locale & Currency
- Country: South Africa
- Currency: ZAR (South African Rand), symbol: R (prefix, no space: R250,000)
- Locale: en_ZA (English, South Africa)
- Mileage unit: km (kilometers)
- Price format: `R${price.toLocaleString('en-ZA')}` → R250,000
- All API price fields are DECIMAL(12,2) in ZAR

## Architecture
- API: REST (API Gateway) with stage-level caching — NOT GraphQL
- Caching: API Gateway caching — NOT Redis/ElastiCache
- Single Lambda with path-based routing (not one Lambda per route)
- Handler → Service → Repository layering in backend
- Deploy first, CI/CD later
- All Lambda handlers must be idempotent (safe to retry on duplicate events)

## Monorepo Structure
```
prime-deal-auto/
├── frontend/          # Next.js 15 App Router
├── backend/           # Lambda handler functions
├── infrastructure/    # AWS CDK v2 stacks
└── docs/              # Blueprint + companion docs
```

## Naming Conventions
- Files: kebab-case (`car-service.ts`, `image-gallery.tsx`)
- React components: PascalCase (`CarCard.tsx`, `FilterPanel.tsx`)
- Database columns: snake_case (`created_at`, `car_id`)
- CDK stacks: `PrimeDeals-{StackName}` (e.g., `PrimeDeals-Auth`, `PrimeDeals-Api`)
- CDK construct IDs: stable, descriptive names — never change IDs of stateful resources (databases, buckets)
- API routes: lowercase with hyphens (`/cars/:id/images/upload-url`)
- Environment variables: UPPER_SNAKE_CASE
- Never hardcode AWS resource names — let CDK auto-generate or use environment-based prefixes

## Git Strategy
- Branch naming: `day-N-description` pattern (e.g., `day-4-auth-stack`)
- Commit format: `type: description`
  - `feat:` new feature
  - `fix:` bug fix
  - `infra:` CDK/infrastructure changes
  - `ui:` frontend/component changes
  - `api:` backend endpoint changes
  - `test:` test additions/changes
  - `docs:` documentation
  - `chore:` tooling, deps, config

## Response Format
All API responses follow this structure:
```json
{ "success": true, "data": { ... } }
{ "success": true, "data": { "data": [...], "total": 150, "page": 1, "limit": 20, "hasMore": true } }
{ "success": false, "error": "Human-readable message", "code": "VALIDATION_ERROR" }
```

Error codes: `VALIDATION_ERROR`, `NOT_FOUND`, `UNAUTHORIZED`, `FORBIDDEN`, `RATE_LIMITED`, `INTERNAL_ERROR`

## AWS Account (Critical)
- Account ID: `141814481613`
- CLI Profile: `prime-deal-auto` (always use `--profile prime-deal-auto`)
- Region: `us-east-1`
- Never deploy to any other account or region

## Build Phases (14 Specs)
1. Foundation & First Deployment (Specs 1–4): Scaffolding, CDK stacks, basic frontend, first deploy
2. Core Features (Specs 5–9): Images, auth, admin, leads, search
3. Intelligence & Polish (Specs 10–12): AI chat, recommendations/SEO, analytics
4. CI/CD & Production Hardening (Specs 13–14): Pipelines, WAF, performance

## File References
- Full blueprint: #[[file:PRIME_DEAL_AUTO_BLUEPRINT.md]]
- Project structure: #[[file:01-PROJECT-STRUCTURE.md]]
- API reference: #[[file:02-API-REFERENCE.md]]
- CDK stacks: #[[file:03-CDK-INFRASTRUCTURE.md]]
- Frontend pages: #[[file:04-FRONTEND-PAGES.md]]
- Build phases: #[[file:05-IMPLEMENTATION-PHASES.md]]
- Deployment: #[[file:06-ENVIRONMENT-DEPLOYMENT.md]]
