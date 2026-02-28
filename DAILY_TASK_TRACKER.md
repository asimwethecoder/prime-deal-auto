# Prime Deal Auto — Daily Task Tracker

> 14 specs across 4 phases, ~45 working days.
> Each day targets clear deliverables. Days are grouped by phase.
> Reference: `PRIME_DEAL_AUTO_BLUEPRINT.md`, `05-IMPLEMENTATION-PHASES.md`

---

## Phase 1: Foundation & First Deployment (Days 1–12)

### Spec 1: Project Scaffolding (Days 1–3)

| Day | Deliverables | Notes |
|-----|-------------|-------|
| 1 | Initialize monorepo root (`package.json` with workspaces). Scaffold Next.js 15 frontend (App Router, Tailwind v4, TypeScript). Create `frontend/` skeleton: `app/layout.tsx`, `app/page.tsx`, `globals.css`, `tailwind.config.ts`, `next.config.ts`. | Verify `npm run dev` works with a hello-world page. |
| 2 | Scaffold CDK infrastructure project (`infrastructure/`): `bin/app.ts`, `cdk.json`, `tsconfig.json`. Scaffold backend Lambda project (`backend/`): `src/lambda.ts` stub, `package.json`, `tsconfig.json`. Set up Vitest for backend (`vitest.config.ts`, sample test). | Verify `npx cdk synth` produces empty template. Verify `npx vitest --run` passes. |
| 3 | Create shared types (`backend/src/types/index.ts`): Car, User, Lead, ChatMessage, ApiResponse, PaginatedResponse. Create `backend/db/schema.sql` with full schema from blueprint. Git init, `.gitignore`, initial commit. | All three workspaces should install and build cleanly. |

### Spec 2: CDK Auth + Database Stacks (Days 4–6)

| Day | Deliverables | Notes |
|-----|-------------|-------|
| 4 | Build `AuthStack`: Cognito User Pool (email sign-up, auto-verify), User Pool Client (SRP flow), user groups (admin, dealer, user). Write post-confirmation Lambda trigger stub (sync Cognito user → Aurora `users` table). | Unit test the stack with CDK assertions. |
| 5 | Build `DatabaseStack`: VPC (1 AZ, private isolated subnets, no NAT), Aurora Serverless v2 cluster (PostgreSQL 15, 0.5–4 ACU, single writer), Secrets Manager secret, Security Group, RDS Proxy, VPC endpoints. Wire exports (`ClusterEndpoint`, `SecretArn`, `VpcId`, etc.). | Unit test the stack. Verify `cdk synth` for both stacks. |
| 6 | Deploy AuthStack + DatabaseStack to AWS. Run `schema.sql` migration against Aurora (via bastion or RDS Proxy). Verify Cognito sign-up flow works (AWS Console or CLI). Verify tables exist in Aurora. | First real AWS deployment. Capture stack outputs. |

### Spec 3: CDK Storage + API Stacks (Days 7–9)

| Day | Deliverables | Notes |
|-----|-------------|-------|
| 7 | Build `StorageStack`: S3 bucket (block public access, versioning, SSE-S3), CloudFront distribution (OAC, HTTPS, Brotli+Gzip), bucket policy. Export `BucketName`, `DistributionDomainName`. | Unit test the stack. |
| 8 | Build `ApiStack`: API Gateway REST API (regional), Cognito authorizer, Lambda function (Node.js 20, ARM64, VPC-attached, 1024 MB, 30s timeout). Implement path-based router in `backend/src/lambda.ts`. Implement `GET /cars` and `GET /cars/:id` handlers with Aurora queries via `backend/src/lib/database.ts` connection pool. | Wire Lambda env vars from other stacks. Unit test handlers with mocked DB. |
| 9 | Deploy StorageStack + ApiStack. Enable API Gateway stage-level caching. Test `GET /cars` and `GET /cars/:id` with curl/Postman against live API. Seed a few test cars into Aurora manually. | Verify end-to-end: API Gateway → Lambda → RDS Proxy → Aurora. |

### Spec 4: Frontend Foundation + First Deploy (Days 10–12)

| Day | Deliverables | Notes |
|-----|-------------|-------|
| 10 | Build root layout: `providers.tsx` (QueryClientProvider), `Header.tsx` (logo, nav links, mobile menu), `Footer.tsx`. Build Home page: `HeroSection.tsx` (static hero with CTA), placeholder sections. Create `lib/api/client.ts` (fetch wrapper with base URL from env). | All components render correctly in dev. |
| 11 | Build Car Listing page (`/cars`): `CarCard.tsx`, `CarGrid.tsx`, `CarCardSkeleton.tsx`. Fetch from `GET /cars` via server component. Build Car Detail page (`/cars/[carId]`): `ImageGallery.tsx` (placeholder for now), `SpecificationsTable.tsx`. Fetch from `GET /cars/:id`. | Pages render real data from the live API. |
| 12 | Set up Amplify Hosting: connect GitHub repo, configure build settings for Next.js SSR, add environment variables. Deploy frontend. Verify: live site loads, home page renders, car listing shows cars from Aurora, car detail page works. | First full-stack deployment live. Milestone checkpoint. |

---

## Phase 2: Core Features (Days 13–28)

### Spec 5: Image Upload System (Days 13–15)

| Day | Deliverables | Notes |
|-----|-------------|-------|
| 13 | Backend: `POST /cars/:id/images/upload-url` (presigned S3 URL, 15min expiry), `POST /cars/:id/images` (create image record), `GET /cars/:id/images`, `DELETE /cars/:id/images/:imageId` (delete record + S3 object). `imageService.ts` + `imageRepository.ts`. | Unit test all handlers. |
| 14 | Backend: `PATCH /cars/:id/images` (update order/primary flags). Frontend: `ImageUploader.tsx` (drag-and-drop, progress bar, reorder via drag). Wire to presigned URL flow. | Test upload flow end-to-end locally with S3. |
| 15 | Update `CarCard.tsx` and `ImageGallery.tsx` to display CloudFront image URLs. Deploy backend + frontend. Verify: upload image → S3 → CloudFront URL → displays on car detail page. | Images flowing through the full pipeline. |

### Spec 6: Authentication & User Features (Days 16–18)

| Day | Deliverables | Notes |
|-----|-------------|-------|
| 16 | Frontend: Amplify Auth configuration (`amplify-config.ts`). Login, Signup, Forgot Password pages under `(auth)/` route group. `useAuth.ts` hook + `authStore.ts` (Zustand). Auth state in Header (show user menu when logged in). | Test auth flows against live Cognito. |
| 17 | Backend: `GET /favorites`, `POST /favorites/:carId`, `DELETE /favorites/:carId` handlers. Frontend: `FavoriteButton.tsx` (heart icon, optimistic update via TanStack Query mutation). `useFavorites.ts` hook. | Requires Cognito JWT — test with authenticated requests. |
| 18 | Frontend: Auth guard layout for `/dashboard`. Dashboard home page. Favorites page (`/dashboard/favorites`) showing user's saved cars in `CarGrid`. Deploy. Verify full auth + favorites flow. | Users can sign up, log in, favorite cars, view dashboard. |

### Spec 7: Admin Panel — Car Management (Days 19–22)

| Day | Deliverables | Notes |
|-----|-------------|-------|
| 19 | Backend: `GET /admin/stats`, `GET /admin/cars` (all statuses, filters, pagination), `POST /cars`, `PUT /cars/:id`, `DELETE /cars/:id` (soft-delete). Admin authorization check (verify `cognito:groups` contains "admin"). | Unit test admin handlers + auth guard. |
| 20 | Backend: Make/Model/Variant CRUD endpoints (`GET/POST /admin/makes`, `GET/POST /admin/makes/:makeId/models`, `GET/POST /admin/models/:modelId/variants`). `variantRepository.ts`. Frontend: Admin layout with sidebar (`Sidebar.tsx`). Admin dashboard page with `StatsCards.tsx`. | Admin layout renders, stats load from API. |
| 21 | Frontend: `ListingsTable.tsx` (sortable, searchable, status badges, pagination). Admin car listings page (`/admin/cars`). `MakeModelSelector.tsx` (cascading dropdowns: make → model → variant). | Table displays all cars with status filtering. |
| 22 | Frontend: `CarForm.tsx` (create + edit, React Hook Form + Zod validation). New car page (`/admin/cars/new`), Edit car page (`/admin/cars/[carId]/edit`). Integrate `ImageUploader` into car form. Deploy. Verify: admin can create, edit, delete cars with images. | Full admin car management flow working. |

### Spec 8: Lead Management System (Days 23–25)

| Day | Deliverables | Notes |
|-----|-------------|-------|
| 23 | Backend: `POST /leads` handler (validation, save to Aurora). `emailService.ts` with SES integration (admin notification + customer confirmation). `leadService.ts` + `leadRepository.ts`. | Unit test lead creation + email sending. |
| 24 | Frontend: `EnquiryForm.tsx` (React Hook Form + Zod: name, email, phone with `PhoneInput.tsx`, message). Place on car detail page and standalone contact page (`/contact`). | Form submits to API, emails trigger. |
| 25 | Backend: `GET /leads` (filters, pagination), `PUT /leads/:id/status`. Frontend: Admin leads page (`/admin/leads`) with table, status dropdown, filters. Deploy. Verify: enquiry → lead created → emails sent → admin manages leads. | End-to-end lead pipeline working. |

### Spec 9: Search & Filtering (Days 26–28)

| Day | Deliverables | Notes |
|-----|-------------|-------|
| 26 | CDK: `SearchStack` (OpenSearch Serverless collection, access/network/encryption policies). Backend: `opensearch.ts` client, `searchService.ts`, `POST /admin/reindex` (bulk index all cars). Deploy SearchStack, run initial reindex. | OpenSearch collection live with car data indexed. |
| 27 | Backend: `GET /search?q=` (full-text search with facets, PG fallback), `GET /search/facets` (filter options with counts), `GET /search/suggestions?q=&field=` (autocomplete, 10 results). | Unit test search handlers. Test against live OpenSearch. |
| 28 | Frontend: `SearchBar.tsx` (with autocomplete dropdown), `FilterPanel.tsx` (sidebar: make/model, price range, year, body type, fuel, transmission), `FilterChips.tsx`, `SortDropdown.tsx`. Wire car listing page to search API. Search results page (`/search?q=`). Deploy. | Full search + filter experience working. |

---

## Phase 3: Intelligence & Polish (Days 29–38)

### Spec 10: AI Chat Assistant (Days 29–32)

| Day | Deliverables | Notes |
|-----|-------------|-------|
| 29 | Backend: `bedrock.ts` client (Converse API). Define tool schemas: `search_cars`, `get_car_details`. `chatService.ts` with Bedrock tool-use loop. `chatRepository.ts` for session/message persistence. | Unit test chat service with mocked Bedrock responses. |
| 30 | Backend: `POST /chat` endpoint (create/continue session, call Bedrock, return response with tool results). `GET /chat/sessions`, `GET /chat/sessions/:id`, `DELETE /chat/sessions/:id`. Rate limiting logic (per user/session). | Test chat flow end-to-end with real Bedrock. |
| 31 | Frontend: `ChatWidget.tsx` (floating button, expandable window, lazy loaded). `ChatWindow.tsx` (message list, input, send). `MessageBubble.tsx` (user vs assistant styling). `ChatCarCard.tsx` (inline car card in chat responses). | Chat UI renders and sends messages. |
| 32 | Wire chat frontend to backend. Session persistence for logged-in users. Polish: loading states, error handling, scroll-to-bottom, mobile responsive. Deploy. Verify: user asks about cars → AI responds with relevant car cards. | AI chat assistant fully functional. |

### Spec 11: Recommendations & SEO (Days 33–35)

| Day | Deliverables | Notes |
|-----|-------------|-------|
| 33 | Backend: `GET /cars/:id/recommendations` (OpenSearch `function_score` query: same make/body type/price range, exclude current car, limit 6; PG fallback). `recommendationService.ts`. Frontend: `RelatedCars.tsx` (horizontal scroll of `CarCard`s). Add to car detail page. | Recommendations display on car detail. |
| 34 | SEO: Dynamic metadata on all pages (title, description, OG tags via `generateMetadata`). Structured data: `Car` schema on detail page, `AutoDealer` schema on home, `FAQ` schema on about. Dynamic `sitemap.ts` (all active cars), `robots.ts`. | Validate with Google Rich Results Test. |
| 35 | Open Graph images for car pages (dynamic or template-based). `llms.txt` for LLM optimization. `Breadcrumb.tsx` component with structured data. Deploy. Verify: social sharing previews, sitemap accessible, structured data valid. | SEO fully implemented. |

### Spec 12: Analytics & Monitoring (Days 36–38)

| Day | Deliverables | Notes |
|-----|-------------|-------|
| 36 | Backend: `POST /analytics/events` (batch ingest: page_view, car_view, pwa_install). `analyticsService.ts` + `analyticsRepository.ts`. Frontend: `useAnalytics.ts` hook (track page views on route change, car views on detail page). | Events flowing into Aurora analytics_events table. |
| 37 | Backend: `GET /admin/analytics/overview`, `GET /admin/analytics/active-users`, `GET /admin/analytics/popular-pages`, `GET /admin/analytics/popular-cars`, `GET /admin/analytics/geography`. Frontend: Admin analytics page with charts and data tables. | Admin can view analytics dashboard. |
| 38 | CDK: `MonitoringStack` (CloudWatch dashboard: API latency, error rates, DB connections, Lambda metrics). Alarms: Lambda errors > 5/min, Aurora CPU > 80%, 5xx rate > 1%. SNS topic for notifications. Log group retention (30 days). Deploy. | Monitoring and alerting live. |

---

## Phase 4: CI/CD & Production Hardening (Days 39–45)

### Spec 13: CI/CD Pipeline (Days 39–41)

| Day | Deliverables | Notes |
|-----|-------------|-------|
| 39 | Amplify CI/CD configuration: `amplify.yml` for Next.js SSR builds. Branch-based deployments: `main` → production, `dev` → staging. Environment variable management per branch in Amplify Console. | Verify push to `main` triggers auto-deploy. |
| 40 | CDK pipeline for backend infrastructure changes (CodePipeline or GitHub Actions). Automated Vitest unit tests in pipeline (fail build on test failure). | Push CDK change → pipeline deploys infrastructure. |
| 41 | End-to-end pipeline validation: push frontend change → Amplify builds + deploys. Push backend change → CDK pipeline deploys. Verify staging environment works independently. Document deployment runbook. | CI/CD fully operational for both frontend and backend. |

### Spec 14: Production Hardening (Days 42–45)

| Day | Deliverables | Notes |
|-----|-------------|-------|
| 42 | WAF rules on API Gateway (rate limiting: 100 req/s per IP, geo-blocking if needed). WAF on CloudFront (bot protection). API Gateway caching tuning: per-method TTLs from blueprint (60s cars, 300s detail, 300s facets, 600s makes). | Test rate limiting with Artillery. |
| 43 | Aurora auto-scaling verification (load test to trigger scale-up). Backup verification: confirm 35-day retention, test point-in-time recovery. Security audit: IAM least privilege review, verify no public S3 access, Secrets Manager rotation enabled. | Document security checklist results. |
| 44 | Performance testing with Artillery: load test key endpoints (`GET /cars`, `GET /cars/:id`, `GET /search`, `POST /chat`). Identify and fix bottlenecks. Optimize Lambda cold starts (bundle size, lazy imports). | Target: p95 < 500ms for read endpoints. |
| 45 | Final polish: error pages (404, 500), loading states audit, mobile responsiveness check. Optional: PWA manifest + service worker. Final deploy of all stacks. Smoke test entire application end-to-end. | Production-ready. Ship it. |

---

## Summary

| Phase | Specs | Days | Duration |
|-------|-------|------|----------|
| 1 — Foundation & First Deployment | 1–4 | 1–12 | 12 days |
| 2 — Core Features | 5–9 | 13–28 | 16 days |
| 3 — Intelligence & Polish | 10–12 | 29–38 | 10 days |
| 4 — CI/CD & Production Hardening | 13–14 | 39–45 | 7 days |
| **Total** | **14 specs** | **45 days** | **~9 weeks** |
