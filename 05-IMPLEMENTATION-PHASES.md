# Prime Deal Auto — Implementation Phases (Build Order)

## Philosophy
Deploy early, iterate fast. Get a working skeleton live first, then layer features.
CI/CD comes after the first manual deployment so we're not blocked.

---

## Phase 1: Foundation & First Deployment (Specs 1-4)

Goal: Get the infrastructure up, database seeded, and a basic frontend deployed.

### Spec 1: Project Scaffolding
- Initialize monorepo (root package.json with workspaces)
- Scaffold Next.js 15 frontend (App Router, Tailwind, TypeScript)
- Scaffold CDK infrastructure project
- Scaffold backend Lambda project
- Create shared types
- Set up Vitest for backend
- Git repo + initial commit

### Spec 2: CDK Auth + Database Stacks
- AuthStack: Cognito User Pool, client, groups (admin/dealer/user)
- DatabaseStack: VPC, Aurora Serverless v2, Secrets Manager, RDS Proxy
- Run database schema migration (schema.sql)
- Post-confirmation Lambda (sync Cognito user to Aurora)
- Deploy both stacks

### Spec 3: CDK Storage + API Stacks
- StorageStack: S3 bucket, CloudFront distribution, OAC
- ApiStack: API Gateway (REST) + Lambda handler with path-based routing
  - Start with: GET /cars, GET /cars/:id, POST /cars (basic CRUD)
- Wire Lambda to Aurora via RDS Proxy
- API Gateway caching enabled (stage-level)
- Deploy and test with curl / Postman

### Spec 4: Frontend Foundation + First Deploy
- Root layout (Header, Footer, providers)
- Home page (static hero, placeholder sections)
- Car listing page (fetches from REST API, displays CarGrid)
- Car detail page (fetches single car, ImageGallery, specs)
- Amplify hosting setup (connect GitHub, deploy)
- Verify: live site showing cars from Aurora via API Gateway

---

## Phase 2: Core Features (Specs 5-9)

Goal: Full car browsing experience, admin panel, lead management.

### Spec 5: Image Upload System
- POST /cars/:id/images/upload-url handler (presigned S3 URLs)
- POST /cars/:id/images + DELETE handlers
- ImageUploader component (drag-and-drop, progress, reorder)
- CloudFront serving images
- Image display in CarCard and ImageGallery

### Spec 6: Authentication & User Features
- Amplify Auth integration (login, signup, forgot password pages)
- Auth guard layouts (dashboard, admin)
- Favorites system (addFavorite, removeFavorite, getFavorites)
- FavoriteButton component (heart icon, optimistic update)
- User dashboard with favorites page

### Spec 7: Admin Panel — Car Management
- Admin layout with sidebar navigation
- Admin dashboard (StatsCards with GET /admin/stats)
- Car listings table (all statuses, search, pagination)
- CarForm (create + edit, with MakeModelSelector)
- Make/Model/Variant CRUD (REST endpoints)
- Image management in car form

### Spec 8: Lead Management System
- EnquiryForm component (on car detail + contact page)
- POST /leads endpoint + handler
- Email notifications via SES (admin + customer confirmation)
- Admin leads page (table, status updates, filters)
- PUT /leads/:id/status endpoint

### Spec 9: Search & Filtering
- OpenSearch Serverless collection (SearchStack CDK)
- GET /search endpoint (full-text search with facets)
- GET /search/facets + GET /search/suggestions endpoints
- FilterPanel component (sidebar with all filter options)
- SearchBar with autocomplete suggestions
- POST /admin/reindex endpoint
- Car listing page wired to search

---

## Phase 3: Intelligence & Polish (Specs 10-12)

Goal: AI assistant, recommendations, analytics, SEO.

### Spec 10: AI Chat Assistant
- Bedrock integration (Converse API with tool use)
- POST /chat endpoint with search_cars + get_car_details tools
- ChatWidget (floating button, expandable window)
- ChatWindow (message history, streaming-like UX)
- MessageBubble + ChatCarCard components
- Session persistence (GET /chat/sessions, GET /chat/sessions/:id)
- Rate limiting per user

### Spec 11: Recommendations & SEO
- GET /cars/:id/recommendations endpoint (OpenSearch function_score + PG fallback)
- RelatedCars component on car detail page
- SEO: dynamic metadata on all pages (title, description, OG tags)
- Structured data (Car schema, AutoDealer schema, FAQ schema)
- Dynamic sitemap.xml, robots.txt, llms.txt
- Open Graph images for car pages

### Spec 12: Analytics & Monitoring
- POST /analytics/events endpoint (batch ingest)
- Client-side analytics hook (page views, car views)
- Admin analytics page (overview, popular pages/cars, geography)
- MonitoringStack CDK (CloudWatch dashboards, alarms)
- Error tracking and alerting

---

## Phase 4: CI/CD & Production Hardening (Specs 13-14)

Goal: Automated deployments, production readiness.

### Spec 13: CI/CD Pipeline
- Amplify CI/CD configuration for Next.js SSR
- Branch-based deployments (main → prod, dev → staging)
- CDK pipeline for backend infrastructure changes
- Automated testing in pipeline (Vitest unit tests)
- Environment variable management

### Spec 14: Production Hardening
- WAF rules on API Gateway + CloudFront (rate limiting, geo-blocking)
- API Gateway caching tuning (per-method TTLs)
- Aurora auto-scaling verification
- Backup verification (35-day retention, PITR)
- Security audit (IAM least privilege, no public S3)
- Performance testing (Artillery load tests)
- PWA manifest + service worker (optional)

---

## Spec Creation Order for Kiro

When creating specs in Kiro, follow this exact order. Each spec should reference the blueprint and relevant companion docs.

```
1. project-scaffolding
2. auth-database-infrastructure
3. storage-api-infrastructure
4. frontend-foundation-deploy
5. image-upload-system
6. authentication-user-features
7. admin-car-management
8. lead-management
9. search-filtering
10. ai-chat-assistant
11. recommendations-seo
12. analytics-monitoring
13. cicd-pipeline
14. production-hardening
```

Each spec should include:
- Requirements (user stories, acceptance criteria)
- Design (technical approach, component design, data flow)
- Tasks (implementation checklist with sub-tasks)
