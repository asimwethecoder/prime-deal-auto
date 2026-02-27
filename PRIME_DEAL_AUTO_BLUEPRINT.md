# Prime Deal Auto — Full-Stack Web Application Blueprint

## Overview

This document is a comprehensive technical blueprint for building the **Prime Deal Auto** car dealership web application. It is derived from a production-grade reference application (Adapt Cars) and adapted to use a modernized AWS-native tech stack with Next.js, REST API (API Gateway + Lambda), Aurora PostgreSQL, and AWS CDK infrastructure.

The goal is to provide Kiro with enough context to create a spec-driven architecture and build the application step by step.

---

## 1. Tech Stack Summary

### Frontend
| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | **Next.js 15 (App Router)** | SSR, SSG, ISR, API routes, React Server Components |
| React | React 19 | Latest with Server Components support |
| Styling | Tailwind CSS v4 + Framer Motion | Utility-first CSS, animations |
| State (Server) | TanStack Query v5 | Server state caching, optimistic updates |
| State (Client) | Zustand | Lightweight client state (auth, UI) |
| Forms | React Hook Form + Zod | Validation, type-safe forms |
| Icons | Lucide React | Tree-shakeable icon library |
| Auth | AWS Amplify JS v6 + Cognito | Client-side auth flows |
| API Client | Fetch / Axios + TanStack Query | REST API calls with caching |
| Hosting | AWS Amplify Hosting | GitHub-connected CI/CD, SSR support |

### Backend (Serverless)
| Layer | Technology | Notes |
|-------|-----------|-------|
| API | **API Gateway (REST)** | Regional REST API with Lambda proxy integration |
| Compute | AWS Lambda (Node.js 20) | Route handlers, business logic |
| Database | **Amazon Aurora PostgreSQL Serverless v2** | Auto-scaling, read/write splitting |
| Caching | **API Gateway caching** | Response caching at the API layer (cheaper than ElastiCache) |
| Search | **Amazon OpenSearch Serverless** | Full-text search, facets, suggestions |
| Storage | Amazon S3 | Car images, assets |
| CDN | Amazon CloudFront | Image delivery, static assets |
| Auth | Amazon Cognito | User pools, groups (user/dealer/admin) |
| AI | Amazon Bedrock (Claude) | AI chat assistant with tool use |
| Email | Amazon SES or SMTP | Lead notifications, customer confirmations |
| Monitoring | Amazon CloudWatch | Logs, metrics, alarms, dashboards |
| IaC | **AWS CDK v2 (TypeScript)** | All infrastructure as code |

### Testing
| Type | Technology | Notes |
|------|-----------|-------|
| Unit | **Vitest** | Fast, Vite-native, excellent DX |
| Component | Testing Library (React) | DOM testing for components |
| E2E | Playwright | Cross-browser, parallel execution |
| API | Vitest + mocks | Lambda handler unit tests |
| Load | Artillery | API load testing |

### CI/CD
| Stage | Technology | Notes |
|-------|-----------|-------|
| Hosting | AWS Amplify | Auto-deploy on git push |
| Pipeline | Amplify CI/CD | Build, test, deploy |
| Backend Deploy | CDK deploy (manual first, then pipeline) | `cdk deploy` for infrastructure |

---

## 2. Architecture Diagram (Conceptual)

```
┌─────────────────────────────────────────────────────────────────┐
│                        USERS / BROWSERS                         │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │   CloudFront CDN    │
                    │  (Images + Assets)  │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
    ┌─────────▼────────┐  ┌───▼────────┐  ┌───▼──────────┐
    │  AWS Amplify      │  │API Gateway │  │  S3 Bucket   │
    │  (Next.js SSR)    │  │  (REST)    │  │  (Images)    │
    └──────────────────┘  └─────┬──────┘  └──────────────┘
                                │
                         ┌──────▼──────┐
                         │   Lambda    │
                         │  (Handler)  │
                         └──────┬──────┘
                                │
         ┌──────────┬───────────┼───────────┬──────────┐
         │          │           │           │          │
    ┌────▼───┐ ┌───▼────┐ ┌──▼─────┐ ┌──▼────┐ ┌──▼──────┐
    │ Aurora │ │Cognito │ │Bedrock │ │OpenSrch│ │CloudWatch│
    │ PgSQL  │ │ Auth   │ │  AI    │ │ Search │ │ Monitor  │
    └────────┘ └────────┘ └────────┘ └───────┘ └──────────┘
```

---

## 3. Database Schema

The database schema is adapted from the reference project. Aurora PostgreSQL Serverless v2 provides auto-scaling and cost efficiency.

### Core Tables

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users (synced from Cognito)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cognito_sub VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  phone VARCHAR(50),
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'dealer', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Car Makes (manufacturers)
CREATE TABLE car_makes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  logo_url VARCHAR(500),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Car Models (per make)
CREATE TABLE car_models (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  make_id UUID NOT NULL REFERENCES car_makes(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(make_id, name)
);

-- Car Variants (per model)
CREATE TABLE car_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  model_id UUID NOT NULL REFERENCES car_models(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(model_id, name)
);

-- Cars (main inventory table)
CREATE TABLE cars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  make VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  variant VARCHAR(100),
  year INTEGER NOT NULL CHECK (year >= 1900 AND year <= 2100),
  price DECIMAL(12, 2) NOT NULL CHECK (price >= 0),
  mileage INTEGER NOT NULL CHECK (mileage >= 0),
  condition VARCHAR(20) CHECK (condition IN ('excellent', 'good', 'fair', 'poor')),
  body_type VARCHAR(50),
  transmission VARCHAR(20) CHECK (transmission IN ('automatic', 'manual', 'cvt')),
  fuel_type VARCHAR(20) CHECK (fuel_type IN ('petrol', 'diesel', 'electric', 'hybrid')),
  color VARCHAR(50),
  description TEXT,
  features JSONB DEFAULT '[]'::jsonb,
  seller_id UUID REFERENCES users(id) ON DELETE SET NULL,
  make_id UUID REFERENCES car_makes(id) ON DELETE SET NULL,
  model_id UUID REFERENCES car_models(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES car_variants(id) ON DELETE SET NULL,
  video_url VARCHAR(500),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'sold', 'pending', 'deleted')),
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Car Images
CREATE TABLE car_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  car_id UUID NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  s3_key VARCHAR(500) NOT NULL,
  cloudfront_url VARCHAR(500),
  thumbnail_url VARCHAR(500),
  is_primary BOOLEAN DEFAULT FALSE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Favorites
CREATE TABLE favorites (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  car_id UUID NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, car_id)
);

-- Leads (enquiries)
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  country VARCHAR(100),
  enquiry TEXT,
  car_id UUID REFERENCES cars(id) ON DELETE SET NULL,
  source VARCHAR(50) DEFAULT 'website',
  status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'closed')),
  assigned_to UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat Sessions (AI assistant)
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat Messages
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics Events
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('page_view', 'car_view', 'pwa_install')),
  session_id VARCHAR(36) NOT NULL,
  page_path VARCHAR(500) NOT NULL,
  car_id UUID,
  country_code VARCHAR(10),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Indexes (Performance Critical)

```sql
-- Users
CREATE INDEX idx_users_cognito_sub ON users(cognito_sub);
CREATE INDEX idx_users_email ON users(email);

-- Cars
CREATE INDEX idx_cars_make ON cars(make);
CREATE INDEX idx_cars_model ON cars(model);
CREATE INDEX idx_cars_year ON cars(year);
CREATE INDEX idx_cars_price ON cars(price);
CREATE INDEX idx_cars_status ON cars(status);
CREATE INDEX idx_cars_created_at ON cars(created_at DESC);
CREATE INDEX idx_cars_make_model ON cars(make, model);
CREATE INDEX idx_cars_price_range ON cars(price) WHERE status = 'active';
CREATE INDEX idx_cars_search ON cars USING gin(
  to_tsvector('english', coalesce(make, '') || ' ' || coalesce(model, '') || ' ' || coalesce(description, ''))
);

-- Car Images
CREATE INDEX idx_car_images_car_id ON car_images(car_id);

-- Leads
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);

-- Analytics
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at);
```

### Auto-Update Triggers

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER cars_updated_at BEFORE UPDATE ON cars FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER leads_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER chat_sessions_updated_at BEFORE UPDATE ON chat_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

## 4. REST API Endpoints

API Gateway (REST) with a single Lambda handler using path-based routing. This mirrors the proven pattern from the Adapt Cars reference project.

### Public Endpoints (No Auth)

| Method | Path | Description | Caching |
|--------|------|-------------|---------|
| GET | `/cars` | List cars with filters (query params) | 60s |
| GET | `/cars/:id` | Get car by ID (with images) | 300s |
| GET | `/cars/:id/recommendations` | Get similar cars | 120s |
| GET | `/search?q=` | Full-text search with facets | 60s |
| GET | `/search/suggestions?q=&field=` | Autocomplete suggestions | 300s |
| GET | `/search/facets` | Filter options with counts | 300s |
| POST | `/leads` | Create enquiry (public form) | — |
| POST | `/chat` | Send AI chat message | — |
| POST | `/analytics/events` | Batch analytics events | — |

### Authenticated Endpoints (Cognito JWT)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/favorites` | Get user's favorites |
| POST | `/favorites/:carId` | Add to favorites |
| DELETE | `/favorites/:carId` | Remove from favorites |
| GET | `/chat/sessions` | List user's chat sessions |
| GET | `/chat/sessions/:id` | Get session history |
| DELETE | `/chat/sessions/:id` | Delete chat session |

### Admin Endpoints (Admin Group Required)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/stats` | Dashboard statistics |
| GET | `/admin/cars` | All cars (any status) |
| POST | `/cars` | Create car |
| PUT | `/cars/:id` | Update car |
| DELETE | `/cars/:id` | Soft-delete car |
| POST | `/cars/:id/images/upload-url` | Get presigned S3 upload URL |
| POST | `/cars/:id/images` | Create image record |
| GET | `/cars/:id/images` | List car images |
| PATCH | `/cars/:id/images` | Update image order/primary |
| DELETE | `/cars/:id/images/:imageId` | Delete image |
| GET | `/leads` | List leads (with filters) |
| PUT | `/leads/:id/status` | Update lead status |
| GET | `/admin/makes` | List all makes |
| POST | `/admin/makes` | Create make |
| GET | `/admin/makes/:makeId/models` | List models for make |
| POST | `/admin/makes/:makeId/models` | Create model |
| GET | `/admin/models/:modelId/variants` | List variants for model |
| POST | `/admin/models/:modelId/variants` | Create variant |
| POST | `/admin/reindex` | Reindex OpenSearch |
| GET | `/admin/analytics/overview` | Analytics overview |
| GET | `/admin/analytics/active-users` | Active users data |
| GET | `/admin/analytics/popular-pages` | Popular pages |
| GET | `/admin/analytics/popular-cars` | Popular cars |
| GET | `/admin/analytics/geography` | Geography data |

### API Gateway Caching

API Gateway caching is enabled at the stage level with per-method TTL overrides:

| Endpoint Pattern | Cache TTL | Cache Key |
|-----------------|-----------|-----------|
| `GET /cars` | 60s | Query string params |
| `GET /cars/:id` | 300s | Path param (carId) |
| `GET /search/facets` | 300s | None (global) |
| `GET /search/suggestions` | 300s | Query string (q, field) |
| `GET /admin/makes` | 600s | None (global) |
| `GET /search` | 60s | Query string params |
| Write operations | 0 (no cache) | — |

Cache invalidation happens automatically when the TTL expires. For immediate invalidation after writes, the Lambda handler can flush specific cache entries via the API Gateway cache invalidation API.

### Request/Response Format

All endpoints follow this response structure:

```json
// Success
{
  "success": true,
  "data": { ... }
}

// Success with pagination
{
  "success": true,
  "data": {
    "data": [...],
    "total": 150,
    "page": 1,
    "limit": 20,
    "hasMore": true
  }
}

// Error
{
  "success": false,
  "error": "Human-readable error message",
  "code": "VALIDATION_ERROR"
}
```

Error codes: `VALIDATION_ERROR`, `NOT_FOUND`, `UNAUTHORIZED`, `FORBIDDEN`, `RATE_LIMITED`, `INTERNAL_ERROR`

### Lambda Handler Pattern

Single Lambda function with path-based routing (same pattern as Adapt Cars):

```typescript
// backend/src/lambda.ts
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const { httpMethod, path } = event;

  // CORS preflight
  if (httpMethod === 'OPTIONS') return corsResponse();

  // Route matching
  if (path === '/cars' && httpMethod === 'GET') return handleGetCars(event);
  if (path.match(/^\/cars\/[^/]+$/) && httpMethod === 'GET') return handleGetCarById(id);
  if (path === '/cars' && httpMethod === 'POST') return handleCreateCar(event);
  // ... etc
}
```

---

## 5. Key Differences from Reference Project

| Aspect | Adapt Cars (Reference) | Prime Deal Auto (New) |
|--------|----------------------|----------------------|
| Frontend | TanStack Start | **Next.js 15 (App Router)** |
| API | REST (API Gateway + Lambda) | **REST (API Gateway + Lambda)** |
| Database | RDS PostgreSQL | **Aurora PostgreSQL Serverless v2** |
| Caching | ElastiCache Redis | **API Gateway caching** |
| Auth | Cognito (manual JWT) | **Cognito + Amplify JS v6** |
| IaC | Manual AWS CLI/Console | **AWS CDK v2** |
| Hosting | Amplify (manual deploy) | **Amplify (GitHub CI/CD)** |
| Search | OpenSearch | **OpenSearch Serverless** |
| AI | Bedrock (REST endpoint) | **Bedrock (REST endpoint)** |

---

## 6. Environment Variables

```bash
# .env.local (Next.js frontend)
NEXT_PUBLIC_API_URL=https://xxxxx.execute-api.us-east-1.amazonaws.com/prod
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_xxxxx
NEXT_PUBLIC_COGNITO_CLIENT_ID=xxxxx
NEXT_PUBLIC_CLOUDFRONT_URL=https://dxxxxx.cloudfront.net
NEXT_PUBLIC_S3_BUCKET=prime-deal-auto-images
NEXT_PUBLIC_SITE_URL=https://primedealauto.com

# Backend Lambda environment (set via CDK)
DB_HOST=prime-deal-auto-db.cluster-xxxxx.us-east-1.rds.amazonaws.com
DB_READ_HOST=prime-deal-auto-db.cluster-ro-xxxxx.us-east-1.rds.amazonaws.com
DB_NAME=primedealauto
DB_SECRET_ARN=arn:aws:secretsmanager:us-east-1:xxxxx:secret:prime-deal-auto-db-xxxxx
S3_BUCKET=prime-deal-auto-images
CLOUDFRONT_URL=https://dxxxxx.cloudfront.net
OPENSEARCH_ENDPOINT=https://xxxxx.us-east-1.aoss.amazonaws.com
BEDROCK_MODEL_ID=anthropic.claude-sonnet-4-20250514-v1:0
SES_FROM_EMAIL=noreply@primedealauto.com
```

---

## 7. Deployment Strategy

### Phase 1: Foundation (Deploy First)
1. Bootstrap CDK: `cdk bootstrap`
2. Deploy Auth Stack (Cognito)
3. Deploy Database Stack (Aurora)
4. Deploy Storage Stack (S3 + CloudFront)
5. Deploy API Stack (API Gateway + Lambda)
6. Deploy frontend to Amplify (manual first push)

### Phase 2: CI/CD (After First Deployment)
1. Connect GitHub repo to Amplify
2. Configure build settings for Next.js SSR
3. Add environment variables in Amplify console
4. Set up branch-based deployments (main → prod, dev → staging)

### Phase 3: Post-Deployment Features
1. OpenSearch Serverless collection + indexing
2. AI Chat integration (Bedrock)
3. Analytics pipeline
4. Email notifications (SES)

---

*This blueprint provides Kiro with the complete context needed to create spec-driven features for Prime Deal Auto. Each feature should be built as a separate spec with requirements, design, and implementation tasks.*