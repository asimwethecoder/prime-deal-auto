# Prime Deal Auto — Project Structure & File Organization

## Monorepo Layout

```
prime-deal-auto/
├── frontend/                    # Next.js 15 App Router
│   ├── app/
│   │   ├── layout.tsx           # Root layout (HTML shell, providers)
│   │   ├── page.tsx             # Home page (/)
│   │   ├── globals.css          # Tailwind imports + base styles
│   │   ├── providers.tsx        # Client providers (QueryClient, Auth, etc.)
│   │   │
│   │   ├── (public)/            # Route group: public pages (no auth)
│   │   │   ├── cars/
│   │   │   │   ├── page.tsx             # Car listing (/cars)
│   │   │   │   └── [carId]/
│   │   │   │       └── page.tsx         # Car detail (/cars/:carId)
│   │   │   ├── about/page.tsx           # About page
│   │   │   ├── contact/page.tsx         # Contact / enquiry page
│   │   │   └── search/page.tsx          # Search results page
│   │   │
│   │   ├── (auth)/              # Route group: auth pages
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   └── forgot-password/page.tsx
│   │   │
│   │   ├── dashboard/           # Protected: user dashboard
│   │   │   ├── layout.tsx       # Auth guard layout
│   │   │   ├── page.tsx         # Dashboard home
│   │   │   └── favorites/page.tsx
│   │   │
│   │   ├── admin/               # Protected: admin panel
│   │   │   ├── layout.tsx       # Admin auth guard
│   │   │   ├── page.tsx         # Admin dashboard (stats)
│   │   │   ├── cars/
│   │   │   │   ├── page.tsx     # Car listings management
│   │   │   │   ├── new/page.tsx # Add new car
│   │   │   │   └── [carId]/edit/page.tsx
│   │   │   ├── leads/page.tsx   # Lead management
│   │   │   └── analytics/page.tsx
│   │   │
│   │   ├── api/                 # Next.js API routes (minimal, proxy if needed)
│   │   │   └── revalidate/route.ts  # ISR revalidation webhook
│   │   │
│   │   ├── sitemap.ts           # Dynamic sitemap generation
│   │   ├── robots.ts            # Dynamic robots.txt
│   │   └── not-found.tsx        # 404 page
│   │
│   ├── components/
│   │   ├── cars/                # Car-specific components
│   │   │   ├── CarCard.tsx
│   │   │   ├── CarGrid.tsx
│   │   │   ├── CarCardSkeleton.tsx
│   │   │   ├── ImageGallery.tsx
│   │   │   ├── SpecificationsTable.tsx
│   │   │   ├── EnquiryForm.tsx
│   │   │   ├── FavoriteButton.tsx
│   │   │   ├── RelatedCars.tsx
│   │   │   └── Breadcrumb.tsx
│   │   │
│   │   ├── home/                # Homepage sections
│   │   │   ├── HeroSection.tsx
│   │   │   ├── FeaturedCars.tsx
│   │   │   ├── BrandsSection.tsx
│   │   │   ├── BodyTypeSection.tsx
│   │   │   ├── BudgetSection.tsx
│   │   │   └── WhyChooseSection.tsx
│   │   │
│   │   ├── search/              # Search components
│   │   │   ├── SearchBar.tsx
│   │   │   ├── FilterPanel.tsx
│   │   │   ├── FilterChips.tsx
│   │   │   └── SortDropdown.tsx
│   │   │
│   │   ├── chat/                # AI chat widget
│   │   │   ├── ChatWidget.tsx
│   │   │   ├── ChatWindow.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   └── ChatCarCard.tsx
│   │   │
│   │   ├── admin/               # Admin components
│   │   │   ├── CarForm.tsx
│   │   │   ├── ImageUploader.tsx
│   │   │   ├── ListingsTable.tsx
│   │   │   ├── StatsCards.tsx
│   │   │   └── MakeModelSelector.tsx
│   │   │
│   │   ├── layout/              # Layout components
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── BottomNavigation.tsx
│   │   │   └── Sidebar.tsx
│   │   │
│   │   └── ui/                  # Reusable UI primitives
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       ├── Modal.tsx
│   │       ├── Skeleton.tsx
│   │       ├── Badge.tsx
│   │       ├── Accordion.tsx
│   │       └── PhoneInput.tsx
│   │
│   ├── lib/
│   │   ├── api/
│   │   │   ├── client.ts        # API client (fetch wrapper with auth)
│   │   │   ├── cars.ts          # Car API functions
│   │   │   ├── search.ts        # Search API functions
│   │   │   ├── leads.ts         # Lead API functions
│   │   │   ├── chat.ts          # Chat API functions
│   │   │   ├── admin.ts         # Admin API functions
│   │   │   └── favorites.ts     # Favorites API functions
│   │   ├── auth.ts              # Amplify auth helpers
│   │   ├── amplify-config.ts    # Amplify configuration
│   │   ├── utils.ts             # General utilities
│   │   ├── constants.ts         # App constants
│   │   └── types.ts             # Shared TypeScript types
│   │
│   ├── hooks/
│   │   ├── useCars.ts           # Car data hooks (TanStack Query)
│   │   ├── useSearch.ts         # Search hooks
│   │   ├── useFavorites.ts      # Favorites hooks
│   │   ├── useAuth.ts           # Auth state hook
│   │   └── useAnalytics.ts      # Analytics tracking
│   │
│   ├── stores/
│   │   └── authStore.ts         # Zustand auth store
│   │
│   ├── public/
│   │   ├── images/              # Static images (logo, hero, icons)
│   │   ├── icons/               # PWA icons
│   │   └── manifest.json        # PWA manifest
│   │
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── package.json
│
├── infrastructure/              # AWS CDK v2
│   ├── bin/
│   │   └── app.ts              # CDK app entry point
│   ├── lib/
│   │   ├── stacks/
│   │   │   ├── auth-stack.ts        # Cognito User Pool + Groups
│   │   │   ├── database-stack.ts    # Aurora PostgreSQL Serverless v2
│   │   │   ├── storage-stack.ts     # S3 + CloudFront
│   │   │   ├── api-stack.ts         # API Gateway + Lambda handler
│   │   │   ├── search-stack.ts      # OpenSearch Serverless
│   │   │   ├── monitoring-stack.ts  # CloudWatch dashboards + alarms
│   │   │   └── hosting-stack.ts     # Amplify hosting config
│   │   │
│   │   ├── constructs/             # Reusable CDK constructs
│   │   │   ├── aurora-cluster.ts
│   │   │   ├── api-gateway.ts
│   │   │   ├── lambda-function.ts
│   │   │   └── s3-cloudfront.ts
│   │   │
│   │   └── config/
│   │       ├── environments.ts     # Environment-specific config
│   │       └── constants.ts        # Stack constants
│   │
│   ├── cdk.json
│   ├── tsconfig.json
│   └── package.json
│
├── backend/                     # Lambda handler functions
│   ├── src/
│   │   ├── lambda.ts            # Main handler with path-based routing
│   │   │
│   │   ├── handlers/            # Route handler functions
│   │   │   ├── cars.ts          # Car CRUD handlers
│   │   │   ├── search.ts        # Search handlers
│   │   │   ├── leads.ts         # Lead handlers
│   │   │   ├── chat.ts          # AI chat handlers
│   │   │   ├── favorites.ts     # Favorites handlers
│   │   │   ├── admin.ts         # Admin handlers
│   │   │   ├── analytics.ts     # Analytics handlers
│   │   │   └── images.ts        # Image upload handlers
│   │   │
│   │   ├── services/            # Business logic
│   │   │   ├── carService.ts
│   │   │   ├── searchService.ts
│   │   │   ├── imageService.ts
│   │   │   ├── leadService.ts
│   │   │   ├── chatService.ts
│   │   │   ├── emailService.ts
│   │   │   ├── analyticsService.ts
│   │   │   └── recommendationService.ts
│   │   │
│   │   ├── repositories/        # Database access layer
│   │   │   ├── carRepository.ts
│   │   │   ├── leadRepository.ts
│   │   │   ├── chatRepository.ts
│   │   │   ├── imageRepository.ts
│   │   │   ├── analyticsRepository.ts
│   │   │   └── variantRepository.ts
│   │   │
│   │   ├── lib/                 # Shared utilities
│   │   │   ├── database.ts      # Aurora connection pool
│   │   │   ├── opensearch.ts    # OpenSearch client
│   │   │   ├── bedrock.ts       # Bedrock AI client
│   │   │   ├── s3.ts            # S3 client + presigned URLs
│   │   │   └── models.ts        # Bedrock model constants
│   │   │
│   │   └── types/
│   │       └── index.ts         # Backend TypeScript types
│   │
│   ├── db/
│   │   ├── schema.sql           # Full database schema
│   │   └── migrations/          # SQL migration files
│   │       ├── 001_initial.sql
│   │       └── ...
│   │
│   ├── tests/
│   │   ├── unit/                # Unit tests (Vitest)
│   │   ├── integration/         # Integration tests
│   │   └── load/                # Artillery load tests
│   │
│   ├── vitest.config.ts
│   ├── tsconfig.json
│   └── package.json
│
├── docs/                        # Documentation
│   ├── PRIME_DEAL_AUTO_BLUEPRINT.md
│   └── prime-deal-auto/         # Companion docs (this folder)
│
├── .github/
│   └── workflows/               # GitHub Actions (future CI/CD)
│
├── .gitignore
├── package.json                 # Root workspace config
└── README.md
```

## Key Conventions

- Frontend uses Next.js App Router conventions (app/ directory, layout.tsx, page.tsx)
- Route groups `(public)`, `(auth)` organize without affecting URL paths
- Backend uses a single Lambda handler with path-based routing (same pattern as Adapt Cars)
- Infrastructure stacks are independent and deploy in dependency order
- All shared types live in `backend/src/types/index.ts` and are referenced by frontend via copy or shared package
